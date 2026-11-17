import fs from 'node:fs';
import {SyncEngine} from './lib/farm-sync-engine.mjs';
const file=process.argv[2]||'Update/_offline-staging/20261117-081737/batch-001-plan.json';
const plan=JSON.parse(fs.readFileSync(file)),dir='Update/_farm-sources',lock=dir+'/sync.lock';
const previous=fs.existsSync(lock)?fs.readFileSync(lock):null;
if(previous){const {pid}=JSON.parse(previous);try{process.kill(pid,0);throw Error('Another sync is running: '+pid);}catch(e){if(e.code!=='ESRCH')throw e;}}
fs.writeFileSync(lock,JSON.stringify({pid:process.pid,task:plan.id,startedAt:new Date().toISOString()})+'\n');
try{
 const engine=new SyncEngine({directory:dir,onPage:p=>console.log('CACHED',p.url),onBatch:stats=>console.log('BATCH',stats.success,stats.failed)});
 await engine.run(plan.rows.map(r=>({url:r.url,kind:'wiki',priority:0})),{mode:plan.mode||'resume',scope:'selected',limit:25});
 fs.writeFileSync(file.replace('-plan.json','-fetch.json'),JSON.stringify({id:plan.id,stats:engine.stats,rows:plan.rows.map(row=>({url:row.url,status:engine.manifest[row.url]?.syncStatus,error:engine.manifest[row.url]?.lastError||null}))},null,2)+'\n');
}finally{if(previous)fs.writeFileSync(lock,previous);else fs.writeFileSync(lock,JSON.stringify({pid:process.pid,completed:true})+'\n');}
