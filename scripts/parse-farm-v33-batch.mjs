import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {parseFarmReviewPage} from './lib/farm-review-parser.mjs';
import {sha256,validateOfflinePage} from './lib/farm-offline-sources.mjs';
const file=process.argv[2],plan=JSON.parse(fs.readFileSync(file)),root='Update/_offline-staging/20261117-081737',sources=[],blocked=[];
for(const row of plan.rows){try{const cache=JSON.parse(fs.readFileSync('Update/_farm-sources/pages/'+sha256(row.url)+'.json'));validateOfflinePage(cache);const sourceFile=root+'/wiki/'+cache.sha256+'.html';fs.mkdirSync(root+'/wiki',{recursive:true});if(!fs.existsSync(sourceFile))fs.writeFileSync(sourceFile,cache.body);sources.push({...row,sourceFile,sourceHash:cache.sha256});}catch(error){blocked.push({...row,status:'UNVERIFIED',reason:error.message});}}
const metadata=[];for(let offset=0;offset<sources.length;offset+=6)metadata.push(...JSON.parse(execFileSync(process.execPath,['scripts/lib/farm-set-page-metadata.mjs'],{input:JSON.stringify(sources.slice(offset,offset+6)),encoding:'utf8',maxBuffer:16000000})));
const rows=sources.map(source=>({...source,meta:metadata.find(r=>r.url===source.url),page:parseFarmReviewPage(fs.readFileSync(source.sourceFile,'utf8'),source.url)}));
fs.writeFileSync(file.replace('-plan.json','-parsed.json'),JSON.stringify({id:plan.id,rows,blocked},null,2)+'\n');console.log({parsed:rows.length,blocked:blocked.length});
