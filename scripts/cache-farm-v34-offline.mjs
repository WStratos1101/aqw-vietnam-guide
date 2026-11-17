import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {SyncEngine,sha,atomic} from './lib/farm-sync-engine.mjs';
const root='Update/_offline-staging/20261117-081737',file=process.argv[2],plan=JSON.parse(fs.readFileSync(file));
const engine=new SyncEngine({directory:'Update/_farm-sources'});
const archive=JSON.parse(fs.readFileSync(root+'/source-index.json')).pages;
const pins=['content-sources/farm/review/pages.json','content-sources/farm/equipment-sets/sources.json','content-sources/farm/refinement/sources.json'].flatMap(p=>{const d=JSON.parse(fs.readFileSync(p));return Array.isArray(d)?d:d.sources;});
const result=[];
for(const row of plan.rows){
 if(engine.cache(row.url)){result.push({url:row.url,status:'EXISTING_SHA_CACHE'});continue;}
 const id=new URL(row.url).pathname.slice(1),pin=pins.find(p=>p.url===row.url&&fs.existsSync(p.sourceFile));
 const local=pin?.sourceFile || ['content-sources/class-wiki/','content-sources/class-acquisition/','content-sources/farm/review/wiki/','content-sources/farm/equipment-sets/wiki/'].map(d=>d+id+'.html').find(p=>fs.existsSync(p));
 const entry=archive.find(p=>p.url===row.url);let body,sourceFile,expectedHash;
 if(local){sourceFile=local;body=fs.readFileSync(local,'utf8');expectedHash=pin?.sourceHash;}
 else if(entry){const record=JSON.parse(fs.readFileSync(entry.file));sourceFile=entry.file;body=record.body;expectedHash=record.sha256;}
 else{result.push({url:row.url,status:'NO_OFFLINE_SNAPSHOT'});continue;}
 if(expectedHash&&sha(body)!==expectedHash)throw Error('Offline source SHA mismatch '+row.url);
 const parsed=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`import fs from 'node:fs';import {parseBody} from './scripts/lib/farm-sync-engine.mjs';const r=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(parseBody(r.body,'wiki',r.url)));`],{input:JSON.stringify({body,url:row.url}),encoding:'utf8',maxBuffer:16*1024*1024}));
 atomic(engine.cachePath(row.url),{url:row.url,kind:'wiki',body,...parsed,sha256:sha(body),status:'fetched',syncStatus:'CACHE_HIT',reviewStatus:'PENDING_IDENTITY_REVIEW',offlineSource:sourceFile,attempts:[]});
 result.push({url:row.url,status:'REUSED_OFFLINE_SNAPSHOT',sourceFile,sourceHash:sha(body)});
}
atomic(file.replace('-plan.json','-offline-cache.json'),{id:plan.id,networkRequests:0,rows:result});console.log(result.map(r=>[r.url.split('/').at(-1),r.status]));
