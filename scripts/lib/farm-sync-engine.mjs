import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { Window } from 'happy-dom';
export const defaults = Object.freeze({ concurrency:1, batchSize:25, minDelay:2000, maxDelay:4000, timeout:45000, retries:3, backoff:2000, cooldown:90000, threshold:3 });
export const sha = text => createHash('sha256').update(text).digest('hex');
export function atomic(file,data) { fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data,null,2)+'\n');fs.renameSync(file+'.tmp',file); }
export function canonical(url,base) {
  try {
    let u=new URL(url,base);
    if(u.hostname==='www.google.com'&&u.pathname==='/url')u=new URL(u.searchParams.get('q')||u.searchParams.get('url'));
    if(['aqwwiki.wikidot.com','www.aqwwiki.wikidot.com'].includes(u.hostname)){
      u.protocol='https:';u.hostname='aqwwiki.wikidot.com';u.search='';u.hash='';u.pathname=u.pathname.replace(/\/+$/,'')||'/';
    } else {if(u.protocol!=='https:')return null;u.hash='';}
    return u.href;
  } catch {return null;}
}
export function retryAfter(value,now=Date.now()) {
  if(!value)return 0;
  const seconds=Number(value);if(Number.isFinite(seconds))return Math.max(0,seconds*1000);
  const date=Date.parse(value);return Number.isFinite(date)?Math.max(0,date-now):0;
}
export function failure(error) {
  const code=error.cause?.code||error.code;
  let category='UNKNOWN',status='RETRY_LATER',temporary=false,system=false;
  if(error.httpStatus){
    category=`HTTP_${error.httpStatus}`;
    if(error.httpStatus===403)status='ACCESS_BLOCKED';
    else if(error.httpStatus===404||error.httpStatus===410)status='PERMANENT_FAILURE';
    else if(error.httpStatus===429||error.httpStatus>=500){temporary=true;system=true;}
    else status='PERMANENT_FAILURE';
  } else if(/ENOTFOUND|EAI_AGAIN/.test(code||'')){category='DNS';temporary=true;system=true;}
  else if(/EHOSTUNREACH|ENETUNREACH|ECONNREFUSED|ECONNRESET/.test(code||'')){category='CONNECTION';temporary=true;system=true;}
  else if(/TLS|SSL|CERT|SELF_SIGNED/.test(code||'')){category='TLS_SSL';system=true;}
  else if(error.name==='TimeoutError'||/ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|UND_ERR_HEADERS_TIMEOUT/.test(code||'')){category='TIMEOUT';temporary=true;system=true;}
  else if(error.category){category=error.category;status=error.category==='CAPTCHA'?'ACCESS_BLOCKED':error.category==='REDIRECT_LOOP'?'PERMANENT_FAILURE':'RETRY_LATER';}
  return {category,status,temporary,system,code:code||null,message:error.message,httpStatus:error.httpStatus||null,retryAfterMs:error.retryAfterMs||0};
}
export function parseBody(body,kind,url) {
  if(/(?:<title>[^<]*(?:captcha|access denied)|id=["']captcha|g-recaptcha|cf-chl-)/i.test(body))throw Object.assign(Error('Access challenge; no bypass attempted'),{category:'CAPTCHA'});
  if(kind==='docs'){
    if(/<html|<!doctype html/i.test(body)||body.trim().length<1000)throw Object.assign(Error('Invalid Google Docs text export'),{category:'INVALID_HTML'});
    return {text:body,links:[],images:[]};
  }
  const win=new Window({settings:{disableJavaScriptEvaluation:true,disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
  try {
    const doc=new win.DOMParser().parseFromString(body,'text/html');
    const roots=kind==='wiki'?[doc.querySelector('#page-content')]:[...doc.querySelectorAll('.tyJCtd')];
    if(!roots.length||!roots[0])throw Object.assign(Error('Expected source main content missing'),{category:'INVALID_HTML'});
    if(kind==='wiki'&&/This page doesn.t exist yet|The page you want to access does not exist/i.test(roots[0].textContent))throw Object.assign(Error('Wiki missing-page HTML'),{httpStatus:404});
    const images=roots.flatMap(r=>[...r.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),alt:i.getAttribute('alt')})));
    for(const r of roots){r.querySelectorAll('script,style').forEach(n=>n.remove());r.querySelectorAll('p,div,br,li,tr,h1,h2,h3').forEach(n=>n.append('\n'));}
    const text=roots.map(r=>r.textContent).join('\n').split('\n').map(l=>l.replace(/\s+/g,' ').trim()).filter(Boolean).join('\n');
    if(!text&&!images.length)throw Object.assign(Error('Empty source main content'),{category:'INVALID_HTML'});
    const links=[...doc.querySelectorAll('a[href]')].map(a=>canonical(a.getAttribute('href'),url)).filter(Boolean);
    const tags=[...doc.querySelectorAll('.page-tags a')].map(a=>a.textContent.trim());
    return {text,links:[...new Set(links)],images,tags,title:doc.querySelector('#page-title')?.textContent.trim()||doc.title};
  } finally {win.close();}
}
export async function request(url,config) {
  let current=url;
  for(let hop=0;hop<6;hop++){
    const response=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(config.timeout),headers:{'User-Agent':`AQW-Vietnam-Guide/${config.version||'research'} source-sync`}});
    if(response.status>=300&&response.status<400){
      const next=new URL(response.headers.get('location'),current);
      await response.body?.cancel();
      if(next.hostname!==new URL(url).hostname||next.protocol!=='https:')throw Object.assign(Error('Unexpected cross-domain redirect'),{category:'INVALID_HTML'});
      current=next.href;continue;
    }
    if(!response.ok){await response.body?.cancel();throw Object.assign(Error(`HTTP ${response.status}`),{httpStatus:response.status,retryAfterMs:retryAfter(response.headers.get('retry-after'))});}
    let size=0;const chunks=[];
    for await(const chunk of response.body){size+=chunk.length;if(size>8_000_000)throw Object.assign(Error('Response exceeds 8 MB'),{category:'INVALID_HTML'});chunks.push(chunk);}
    return Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/,'');
  }
  throw Object.assign(Error('Redirect limit exceeded'),{category:'REDIRECT_LOOP'});
}
export function validCache(cache) {return cache?.status==='fetched'&&typeof cache.body==='string'&&cache.sha256===sha(cache.body);}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export class SyncEngine {
  constructor({directory,config={},fetcher=request,wait=sleep,now=Date.now,random=Math.random,onBatch=()=>{},onPage=()=>{},discover=()=>[]}={}){
    this.directory=directory;this.config={...defaults,...config};this.fetcher=fetcher;this.wait=wait;this.now=now;this.random=random;this.onBatch=onBatch;this.onPage=onPage;this.discover=discover;
    if(this.config.concurrency!==1)throw Error('Only concurrency 1 is supported');
    this.manifest=this.read('manifest.json',{});this.circuits=this.read('circuits.json',{});this.stopped=new Set();this.lastRequest=null;
    this.stats={startedAt:new Date(now()).toISOString(),networkPages:0,requests:0,success:0,cacheHits:0,failed:0,pending:0};
  }
  read(file,fallback){const p=path.join(this.directory,file);return fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):fallback;}
  checkpoint(){atomic(path.join(this.directory,'manifest.json'),this.manifest);atomic(path.join(this.directory,'circuits.json'),this.circuits);atomic(path.join(this.directory,'last-run.json'),this.stats);}
  cachePath(url){return path.join(this.directory,'pages',sha(url)+'.json');}
  cache(url){try{return JSON.parse(fs.readFileSync(this.cachePath(url),'utf8'));}catch{return null;}}
  async pause(ms){let remaining=ms;while(remaining>0){const part=Math.min(remaining,30000);await this.wait(part);remaining-=part;}}
  async transition(host,state,extra={}){this.circuits[host]={...this.circuits[host],...extra,state,changedAt:new Date(this.now()).toISOString()};this.checkpoint();}
  async gate(host){
    if(this.stopped.has(host))return false;
    const c=this.circuits[host]||{state:'CLOSED',consecutive:0};this.circuits[host]=c;
    if(['OPEN','COOLDOWN','HALF-OPEN'].includes(c.state)){
      if(c.state!=='COOLDOWN')await this.transition(host,'COOLDOWN',{probeAt:c.probeAt||this.now()+this.config.cooldown});
      await this.pause(Math.max(0,this.circuits[host].probeAt-this.now()));
      await this.transition(host,'HALF-OPEN');
    }
    return true;
  }
  async spacedRequest(url){
    if(this.lastRequest!==null)await this.pause(Math.max(0,this.lastRequest+this.config.minDelay+this.random()*(this.config.maxDelay-this.config.minDelay)-this.now()));
    this.lastRequest=this.now();this.stats.requests++;
    return this.fetcher(url,this.config);
  }
  async acquire(row,{refresh=false}={}){
    const url=row.url,host=new URL(url).hostname,cached=this.cache(url);
    if(validCache(cached)&&!refresh){this.stats.cacheHits++;this.manifest[url]={...this.manifest[url],...row,status:'fetched',syncStatus:'CACHE_HIT',sha256:cached.sha256,lastCacheHit:new Date(this.now()).toISOString()};this.checkpoint();return cached;}
    // Refresh never replaces an approved snapshot: save a separate candidate revision.
    if(!await this.gate(host))return null;
    this.stats.networkPages++;
    const previous=this.manifest[url]||row,attempts=[...(previous.attempts||[])];let err;
    const halfOpen=this.circuits[host].state==='HALF-OPEN';
    for(let i=0;i<=(halfOpen?0:this.config.retries);i++){
      try {
        const body=await this.spacedRequest(url),parsed=parseBody(body,row.kind,url);
        const result={...row,status:'fetched',syncStatus:'SUCCESS',body,...parsed,sha256:sha(body),reviewStatus:'pending-human-review',attempts:[...attempts,{at:new Date(this.now()).toISOString(),ok:true}]};
        if(validCache(cached)&&cached.sha256!==result.sha256){
          atomic(path.join(this.directory,'revisions',sha(url),result.sha256+'.json'),result);
          this.manifest[url]={...previous,status:'fetched',syncStatus:'SUCCESS',attempts:result.attempts,candidateRevision:result.sha256};
        }else {atomic(this.cachePath(url),result);this.manifest[url]={...previous,...row,...Object.fromEntries(Object.entries(result).filter(([k])=>!['body','text','links'].includes(k)))};}
        this.stats.success++;
        await this.transition(host,'CLOSED',{consecutive:0,probeAt:null});
        this.onPage(result);this.checkpoint();return result;
      }catch(error){
        err=failure(error);attempts.push({at:new Date(this.now()).toISOString(),...err});
        this.manifest[url]={...previous,...row,status:validCache(cached)?'fetched':'blocked',syncStatus:err.status,attempts,lastError:err};this.checkpoint();
        if(!err.temporary||i>=this.config.retries||halfOpen)break;
        await this.pause(Math.max(err.retryAfterMs,this.config.backoff*2**i));
      }
    }
    this.stats.failed++;
    const c=this.circuits[host];c.consecutive=err.system?(c.consecutive||0)+1:0;
    if(halfOpen||err.category==='CAPTCHA'){
      await this.transition(host,'OPEN',{probeAt:this.now()+Math.max(this.config.cooldown,err.retryAfterMs),lastError:err});this.stopped.add(host);
    }else if(c.consecutive>=this.config.threshold){await this.transition(host,'OPEN',{probeAt:this.now()+Math.max(this.config.cooldown,err.retryAfterMs),lastError:err});}
    this.checkpoint();return null;
  }
  async run(rows,{mode='resume',limit=0,offline=false,refresh=false,ttl=86400000}={}){
    const unique=new Map();
    for(const row of [...rows,...Object.values(this.manifest)]){const url=canonical(row.url);if(url)unique.set(url,{...row,...unique.get(url),url});}
    const queue=[...unique.values()].sort((a,b)=>(a.priority??100)-(b.priority??100));
    for(const row of queue){const old=this.manifest[row.url];this.manifest[row.url]={status:'pending',syncStatus:'PENDING',...row,...old,url:row.url};if(this.manifest[row.url].status==='blocked-unattempted')Object.assign(this.manifest[row.url],{status:'pending',syncStatus:'PENDING',legacyReason:this.manifest[row.url].reason});}
    this.checkpoint();let inBatch=0;
    for(let index=0;index<queue.length;index++){
      const row=queue[index],previous=this.manifest[row.url];
      if(previous.syncStatus==='NOT_RELEVANT'||previous.status==='NOT_RELEVANT')continue;
      const cache=this.cache(row.url),valid=validCache(cache);
      const failed=['RETRY_LATER','PERMANENT_FAILURE','ACCESS_BLOCKED'].includes(previous.syncStatus)||previous.status==='blocked';
      if(mode==='retry-failed'&&!failed)continue;
      if((previous.syncStatus==='PERMANENT_FAILURE'||previous.syncStatus==='ACCESS_BLOCKED')&&mode!=='retry-failed')continue;
      if(offline){if(valid){await this.acquire(row);for(const added of this.discover(cache))if(!unique.has(added.url)){unique.set(added.url,added);queue.push(added);this.manifest[added.url]={...added,status:'pending',syncStatus:'PENDING'};}}continue;}
      const expires=mode==='incremental'&&valid&&this.now()-Date.parse(cache.attempts?.findLast(a=>a.ok)?.at||0)>ttl;
      if(limit&&this.stats.networkPages>=limit&&(!valid||refresh||expires))continue;
      if(this.stopped.has(new URL(row.url).hostname)&&!valid)continue;
      const result=await this.acquire(row,{refresh:refresh||expires});
      if(result){for(const added of this.discover(result))if(!unique.has(added.url)){unique.set(added.url,added);queue.push(added);this.manifest[added.url]={...added,status:'pending',syncStatus:'PENDING'};}}
      inBatch++;
      if(inBatch>=this.config.batchSize){this.checkpoint();await this.onBatch(this.stats);inBatch=0;}
    }
    this.stats.pending=Object.values(this.manifest).filter(r=>r.status==='pending'||r.status==='blocked-unattempted').length;
    this.stats.finishedAt=new Date(this.now()).toISOString();this.checkpoint();await this.onBatch(this.stats);return this.stats;
  }
}
