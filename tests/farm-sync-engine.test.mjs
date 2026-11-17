import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SyncEngine, atomic, sha, canonical, failure, retryAfter } from '../scripts/lib/farm-sync-engine.mjs';
import { preserveVerified, classify } from '../scripts/lib/farm-sync-inventory.mjs';
const html='<html><title>Item</title><div id="page-content"><p>Rarity: Awesome Rarity</p></div></html>';
const row=name=>({url:'https://aqwwiki.wikidot.com/'+name,kind:'wiki'});
function fixture(t,fetcher,config={}){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'farm-sync-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
 let clock=1000000;const waits=[];
 const engine=new SyncEngine({directory,fetcher,config:{minDelay:0,maxDelay:0,retries:0,...config},now:()=>clock,wait:async ms=>{waits.push(ms);clock+=ms;},random:()=>0});
 return {engine,directory,waits};
}
test('429 honors Retry-After before retry; date header is parsed',async t=>{
 let calls=0;const {engine,waits}=fixture(t,async()=>{if(calls++===0)throw Object.assign(Error('rate limit'),{httpStatus:429,retryAfterMs:12000});return html;},{retries:3});
 await engine.run([row('one')]);assert.equal(calls,2);assert.ok(waits.includes(12000));assert.equal(engine.manifest[row('one').url].attempts[0].category,'HTTP_429');
 assert.equal(retryAfter('5'),5000);assert.equal(retryAfter('Thu, 01 Jan 1970 00:00:10 GMT',1000),9000);
});
for(const status of [403,404])test(`${status} is not retried and a different URL continues`,async t=>{
 let calls=0;const {engine}=fixture(t,async url=>{calls++;if(url.endsWith('bad'))throw Object.assign(Error('HTTP '+status),{httpStatus:status});return html;},{retries:3});
 await engine.run([row('bad'),row('good')]);assert.equal(calls,2);assert.equal(engine.manifest[row('good').url].syncStatus,'SUCCESS');assert.equal(engine.manifest[row('bad').url].syncStatus,status===403?'ACCESS_BLOCKED':'PERMANENT_FAILURE');assert.equal(engine.circuits['aqwwiki.wikidot.com'].state,'CLOSED');
});
test('CLOSED OPEN COOLDOWN HALF-OPEN CLOSED recovers and persists checkpoint',async t=>{
 let calls=0;const {engine,directory,waits}=fixture(t,async()=>{if(++calls<=2)throw Object.assign(Error('unreachable'),{code:'EHOSTUNREACH'});return html;},{threshold:2,cooldown:60000});
 const states=[];const original=engine.transition.bind(engine);engine.transition=async(...args)=>{states.push(args[1]);return original(...args);};
 await engine.run([row('a'),row('b'),row('c'),row('d')]);
 assert.deepEqual(states.slice(0,4),['OPEN','COOLDOWN','HALF-OPEN','CLOSED']);assert.equal(waits.reduce((a,b)=>a+b,0),60000);assert.equal(JSON.parse(fs.readFileSync(path.join(directory,'manifest.json')))[row('d').url].syncStatus,'SUCCESS');
});
test('failed half-open probe stops safely, preserving unattempted rows and domain state',async t=>{
 let calls=0;const {engine}=fixture(t,async()=>{calls++;throw Object.assign(Error('dns'),{code:'ENOTFOUND'});},{threshold:1,cooldown:60000});
 await engine.run([row('a'),row('b'),row('c')]);assert.equal(calls,2);assert.equal(engine.circuits['aqwwiki.wikidot.com'].state,'OPEN');assert.ok(!engine.manifest[row('c').url].attempts);
});
test('resume validates hash, cache hit avoids network, duplicate URL is canonicalized',async t=>{
 let calls=0;const {engine,directory}=fixture(t,async()=>{calls++;return html;});
 await engine.run([row('a'),{...row('a'),url:'http://aqwwiki.wikidot.com/a/?x=1#tab'}]);assert.equal(calls,1);
 const next=new SyncEngine({directory,fetcher:async()=>{throw Error('must not fetch');},config:{minDelay:0,maxDelay:0}});
 await next.run([row('a')]);assert.equal(next.stats.cacheHits,1);assert.equal(next.stats.requests,0);assert.equal(canonical('http://aqwwiki.wikidot.com/a/?x=1#tab'),row('a').url);
});
test('failed refresh never overwrites a valid approved raw cache; changed body is a revision',async t=>{
 const {engine,directory}=fixture(t,async()=>html);await engine.run([row('a')]);const file=engine.cachePath(row('a').url),before=fs.readFileSync(file,'utf8');
 engine.fetcher=async()=>{throw Object.assign(Error('gone'),{httpStatus:404});};await engine.run([row('a')],{refresh:true});assert.equal(fs.readFileSync(file,'utf8'),before);
 const next=new SyncEngine({directory,fetcher:async()=>html.replace('Awesome','Artifact'),config:{minDelay:0,maxDelay:0}});
 await next.run([row('a')],{refresh:true,mode:'retry-failed'});assert.equal(fs.readFileSync(file,'utf8'),before);assert.ok(next.manifest[row('a').url].candidateRevision);
});
test('verified staging rows survive reports, including removed records',()=>{
 const verified={canonicalId:'a',syncVerification:'verified',value:42};
 assert.deepEqual(preserveVerified([verified],[{canonicalId:'a',syncVerification:'pending',value:0}]),[verified]);assert.deepEqual(preserveVerified([verified],[]),[verified]);
});
test('invalid HTML and CAPTCHA are not equipment success; no access bypass',async t=>{
 const {engine}=fixture(t,async()=>'<html><title>CAPTCHA</title></html>');await engine.run([row('a'),row('b')]);assert.equal(engine.stats.requests,1);assert.equal(engine.manifest[row('a').url].syncStatus,'ACCESS_BLOCKED');
 assert.equal(failure(Object.assign(Error('tls'),{code:'CERT_HAS_EXPIRED'})).category,'TLS_SSL');
});
test('classification hints cannot promote NPC/location/quest to equipment',()=>{
 assert.equal(classify({...row('npc'),typeHints:['npc']}).classification.category,'NPC');assert.equal(classify({...row('quest'),typeHints:['quest']}).classification.verified,false);
});
test('incremental limit applies to expired valid cache as well as uncached URL',async t=>{
 const {engine}=fixture(t,async()=>html);await engine.run([row('a'),row('b')]);const calls=engine.stats.requests;
 engine.stats.networkPages=0;await engine.run([row('a'),row('b')],{mode:'incremental',ttl:0,limit:1});assert.ok(engine.stats.requests-calls<=1);
});

test('selected batch never requests unrelated pending URLs or rewrites their status',async t=>{
 const calls=[];const {engine,directory}=fixture(t,async url=>{calls.push(url);return html;});
 const untouched={...row('unrelated'),status:'pending',syncStatus:'PENDING',priority:0};
 engine.manifest[untouched.url]=untouched;engine.checkpoint();
 await engine.run([row('selected')],{scope:'selected',limit:25});
 assert.deepEqual(calls,[row('selected').url]);assert.deepEqual(engine.manifest[untouched.url],untouched);
 assert.equal(JSON.parse(fs.readFileSync(path.join(directory,'manifest.json')))[untouched.url].syncStatus,'PENDING');
});
