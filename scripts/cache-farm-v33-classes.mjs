// Reuse reviewed Class snapshots through the existing cache engine; no network.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {SyncEngine,sha,atomic} from './lib/farm-sync-engine.mjs';
const root='Update/_offline-staging/20261117-081737',rows=JSON.parse(fs.readFileSync(root+'/batch-002-class-staged.json')).rows,lock='Update/_farm-sources/sync.lock';
const previous=fs.existsSync(lock)?fs.readFileSync(lock):null;
if(previous){const {pid}=JSON.parse(previous);try{process.kill(pid,0);throw Error('Another sync is running: '+pid);}catch(e){if(e.code!=='ESRCH')throw e;}}
fs.writeFileSync(lock,JSON.stringify({pid:process.pid,task:'offline-class-cache-reuse'})+'\n');
try{
 const engine=new SyncEngine({directory:'Update/_farm-sources',fetcher:()=>{throw Error('Network forbidden for offline cache reuse');}}),results=[];
 for(const row of rows){
  if(['PERMANENT_FAILURE','ACCESS_BLOCKED'].includes(engine.manifest[row.url]?.syncStatus)){results.push({url:row.url,status:'PRESERVED_FAILURE'});continue;}
  if(!engine.cache(row.url)){
   const body=fs.readFileSync(row.sourceFile,'utf8');if(sha(body)!==(row.sourceHash||row.expectedSourceHash))throw Error('Changed Class snapshot '+row.url);
   const parsed=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`import fs from 'node:fs';import {parseBody} from './scripts/lib/farm-sync-engine.mjs';const r=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(parseBody(r.body,'wiki',r.url)));`],{input:JSON.stringify({body,url:row.url}),encoding:'utf8',maxBuffer:8*1024*1024}));
   atomic(engine.cachePath(row.url),{url:row.url,kind:'wiki',body,...parsed,sha256:sha(body),status:'fetched',syncStatus:'CACHE_HIT',reviewStatus:'identity-verified-fields-partial',offlineSource:row.sourceFile,attempts:[]});
  }
  await engine.acquire({url:row.url,kind:'wiki',priority:0});results.push({url:row.url,status:'CACHE_HIT',identityStatus:'verified',fieldStatus:'partial'});
 }
 atomic(root+'/batch-006-cache-reuse.json',{id:'offline-v33-006',networkRequests:engine.stats.requests,rows:results});
 console.log({cacheHits:results.filter(r=>r.status==='CACHE_HIT').length,networkRequests:engine.stats.requests});
}finally{if(previous)fs.writeFileSync(lock,previous);else fs.writeFileSync(lock,JSON.stringify({pid:process.pid,completed:true})+'\n');}
