// macOS external entry point; reuses the existing browser assertions and server lifecycle.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const requested=process.argv.find(a=>a.startsWith('--engine='))?.split('=')[1];
if(requested&&!['chromium','webkit'].includes(requested))throw Error('Engine must be chromium or webkit');
const engines=requested?[requested]:['chromium','webkit'];
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.playwright-browsers');
await fs.mkdir('qa/screenshots',{recursive:true});await fs.mkdir('qa/logs',{recursive:true});
const report={startedAt:new Date().toISOString(),environment:{platform:process.platform,architecture:process.arch,node:process.version,browsersPath:process.env.PLAYWRIGHT_BROWSERS_PATH,webkitIsSafari:false},engines:[],status:'NOT_RUN'};
try {
 const pw=await import('@playwright/test');
 const {routes,sizes}=await import('./qa-v12-9-10.mjs');
 for(const engine of engines){
  const planned= sizes.flatMap(viewport=>['dark','light'].flatMap(theme=>routes.map(route=>({route,viewport,theme,status:'not_run'}))));
  const entry={engine,executablePath:pw[engine].executablePath(),status:'NOT_RUN',cases:planned,screenshots:[],consoleErrors:[],log:`qa/logs/${engine}.log`};report.engines.push(entry);
  try{await fs.access(entry.executablePath,fs.constants.X_OK);}catch(error){entry.status='BLOCKED';entry.cause='browser_binary_missing_or_not_executable';entry.error=error.message;entry.recovery='npm run qa:install';continue;}
  const log=await fs.open(entry.log,'w');
  const exit=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['scripts/qa-v12-9-10.mjs'],{cwd:root,env:{...process.env,AQW_BROWSER:engine},stdio:['ignore',log.fd,log.fd]});p.once('error',reject);p.once('exit',resolve);}).finally(()=>log.close());
  entry.exitCode=exit;
  const result=JSON.parse(await fs.readFile(`artifacts/qa/v12-9-10-${engine}/results.json`,'utf8'));
  entry.status=result.status==='passed'?'PASSED':result.status==='failed'?'FAILED':'BLOCKED';
  entry.cause=result.cause;entry.launchErrors=result.errors;entry.baseUrl=result.baseUrl;
  entry.cases=result.cases.length?result.cases:planned;
  entry.consoleErrors=result.cases.flatMap(c=>c.consoleErrors||[]);
  for(const name of result.screenshots){const target=engine+'-'+name;await fs.copyFile(`artifacts/qa/v12-9-10-${engine}/${name}`,'qa/screenshots/'+target);entry.screenshots.push('qa/screenshots/'+target);}
  await fs.writeFile(`qa/logs/${engine}-results.json`,JSON.stringify(entry,null,2)+'\n');
  console.log(`${engine}: ${entry.status}; ${entry.screenshots.length} screenshots; ${entry.cases.filter(c=>c.status==='passed').length} passed cases`);
 }
 report.status=report.engines.every(e=>e.status==='PASSED')?'PASSED':report.engines.some(e=>e.status==='FAILED')?'FAILED':'BLOCKED';
}catch(error){report.status='BLOCKED';report.error=error.stack;report.recovery='Run npm ci in this project, then npm run qa:install if binaries are missing.';}
finally{report.finishedAt=new Date().toISOString();await fs.writeFile('qa/results.json',JSON.stringify(report,null,2)+'\n');console.log('Browser QA:',report.status,'— qa/results.json');if(report.status!=='PASSED')process.exitCode=1;}
