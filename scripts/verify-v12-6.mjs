import fs from 'node:fs';import {spawnSync}from'node:child_process';
fs.mkdirSync('artifacts/qa/v12-6',{recursive:true});const checks=[];
for(const name of ['lint','typecheck','test','test:semantic','assets:validate-class-skills','build','test:build','test:server']){
 const result=spawnSync('npm',['run',name],{encoding:'utf8',maxBuffer:20*1024*1024});const log='artifacts/qa/v12-6/'+name.replaceAll(':','-')+'.log';fs.writeFileSync(log,(result.stdout||'')+(result.stderr||''));checks.push({name,status:result.status===0?'passed':'failed',exitCode:result.status,log});console.log(checks.at(-1));if(result.status!==0){process.exitCode=1;break;}
}
fs.writeFileSync('artifacts/qa/v12-6/verification.json',JSON.stringify({at:new Date().toISOString(),version:JSON.parse(fs.readFileSync('package.json')).version,checks},null,2)+'\n');
