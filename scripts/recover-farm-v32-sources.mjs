// Bounded P0 source recovery. Uses the existing cache, retries and checkpoints.
import fs from 'node:fs';
import path from 'node:path';
import { SyncEngine } from './lib/farm-sync-engine.mjs';
const directory='Update/_farm-sources', lock=path.join(directory,'sync.lock');
const previous=fs.existsSync(lock)?fs.readFileSync(lock):null;
if(previous){const {pid}=JSON.parse(previous);try{process.kill(pid,0);throw Error(`Sync PID ${pid} is active; do not start another writer.`);}catch(error){if(error.code!=='ESRCH')throw error;}}
const urls=['higure','empowered-higure','darkon-ultra-merge'].map(slug=>'https://aqwwiki.wikidot.com/'+slug);
fs.writeFileSync(lock,JSON.stringify({pid:process.pid,task:'v3-2-bounded-source-review',startedAt:new Date().toISOString()})+'\n');
try{
 const engine=new SyncEngine({directory,onPage:page=>console.log('source checkpoint',page.url,page.sha256)});
 const result=await engine.run(urls.map(url=>({url,kind:'wiki',priority:0})),{mode:'resume',limit:3});
 fs.writeFileSync('Update/_farm-sources/v3-2-source-batch.json',JSON.stringify({urls,result,at:new Date().toISOString()},null,2)+'\n');
 console.log(result);
}finally{
 // Preserve the prior stale lock as evidence; never remove another process's lock.
 if(previous)fs.writeFileSync(lock,previous);
 else fs.writeFileSync(lock,JSON.stringify({pid:process.pid,task:'v3-2-source-review-completed',completed:true})+'\n');
}
