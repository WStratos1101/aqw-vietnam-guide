// Terminal entry point. Never installs browsers, changes sandbox policy or syncs data.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import './qa-browser-env.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export function fingerprint(){
  const files=['package-lock.json','scripts/qa-farm.mjs','scripts/qa-farm-steps.mjs','scripts/qa-runtime.mjs','scripts/qa-browser-env.mjs','scripts/lib/farm-step-qa.mjs','scripts/lib/farm-material-table-qa.mjs','scripts/qa-farm-local.mjs','tests/fixtures/farm-step-cases.mjs'];
  const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else files.push(file);}};
  for(const dir of ['src','public'])walk(dir);
  return Object.fromEntries(files.sort().map(file=>[file,sha(file)]));
}
export function validateImport(bundle, result, current=fingerprint()){
  if(JSON.stringify(bundle.fingerprint)!==JSON.stringify(current))throw Error('Source changed since QA; rerun local QA.');
  if(bundle.playwrightVersion!=='1.65.0')throw Error('Expected installed Playwright 1.65.0.');
  if(bundle.exitCode!==0||result.kind!=='farm'||result.status!=='passed'||result.phase!=='ui'||result.browser!=='chromium'||result.profile!=='full')throw Error('Only a completed full Chromium UI run can satisfy Browser QA.');
  if(result.errors?.length||result.cases?.length!==4||!result.finishedAt)throw Error('Incomplete QA report.');
  for(const width of [390,768,1024,1440]){
    const c=result.cases.find(c=>c.width===width);
    if(!c||c.status!=='passed'||c.consoleErrors?.length||!c.steps?.length||c.steps.some(s=>s.status!=='passed')||!c.steps.some(s=>s.name==='source-scoped quest steps and farm mode reset')||!c.steps.some(s=>s.name==='no console, hydration or page errors'))throw Error(`Missing/pending/failed UI cases at ${width}px.`);
  }
  if(!result.screenshots?.length)throw Error('Screenshots are required.');
  return true;
}
async function main(){
  process.chdir(root);
  const args=process.argv.slice(2);
  if(args[0]==='--import'){
    if(!args[1])throw Error('Usage: npm run qa:farm:local -- --import artifacts/qa/farm/local/<run>/bundle.json');
    const bundlePath=path.resolve(args[1]);
    const qaRoot=path.resolve('artifacts/qa/farm/local')+path.sep;
    if(!bundlePath.startsWith(qaRoot))throw Error('Import must come from the project local QA directory.');
    const bundle=JSON.parse(fs.readFileSync(bundlePath,'utf8'));
    const resultFile=path.join(path.dirname(bundlePath),'results.json');
    if(sha(resultFile)!==bundle.resultHash)throw Error('QA result hash mismatch.');
    const result=JSON.parse(fs.readFileSync(resultFile,'utf8'));
    validateImport(bundle,result);
    for(const file of result.screenshots){
      if(!path.resolve(file).startsWith(path.dirname(bundlePath)+path.sep)||sha(file)!==bundle.screenshotHashes[file])throw Error('Missing, altered or unrelated screenshot: '+file);
    }
    fs.writeFileSync('Update/FARM_V3_BROWSER_QA.json',JSON.stringify({status:'passed',engine:'chromium',bundle:args[1],finishedAt:result.finishedAt,fingerprint:bundle.fingerprint},null,2)+'\n');
    fs.appendFileSync('Update/FARM_V3_PROGRESS.md',`\n### Imported Browser QA — ${result.finishedAt}\n\nChromium full UI PASS at 390/768/1024/1440px. Source hashes and screenshot hashes match. Evidence: ${args[1]}. Full inventory/content acceptance remains independent; no publish.\n`);
    console.log('Imported full Chromium PASS into Update/FARM_V3_BROWSER_QA.json and checkpoint.');return;
  }
  const profile=args.includes('--case=steps')?'steps':'full';
  if(args.some(a=>!['--case=steps','--case=full'].includes(a)))throw Error('Supported options: --case=steps, --case=full, --import <bundle.json>');
  const version=JSON.parse(fs.readFileSync('node_modules/@playwright/test/package.json','utf8')).version;
  if(version!=='1.65.0')throw Error(`Playwright 1.65.0 required; installed ${version}. No automatic installation.`);
  const dir=`artifacts/qa/farm/local/${new Date().toISOString().replaceAll(':','-')}-${profile}`;
  fs.mkdirSync(dir,{recursive:true});
  const before=fingerprint();
  const log=fs.createWriteStream(`${dir}/terminal.log`);
  console.log(`Chromium ${profile}; logs/screenshots: ${dir}`);
  const child=spawn(process.execPath,[profile==='steps'?'scripts/qa-farm-steps.mjs':'scripts/qa-farm.mjs'],{env:{...process.env,AQW_QA_URL:'',FARM_BROWSER:'chromium',AQW_FARM_QA_OUTPUT:dir},stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',data=>{process.stdout.write(data);log.write(data);});
  child.stderr.on('data',data=>{process.stderr.write(data);log.write(data);});
  const exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',(code)=>resolve(code??1));});
  await new Promise(resolve=>log.end(resolve));
  const resultFile=`${dir}/results.json`;
  const result=JSON.parse(fs.readFileSync(resultFile,'utf8'));
  const bundle={schemaVersion:1,profile,playwrightVersion:version,exitCode,fingerprint:before,resultHash:sha(resultFile),screenshotHashes:Object.fromEntries(result.screenshots.map(file=>[file,sha(file)]))};
  fs.writeFileSync(`${dir}/bundle.json`,JSON.stringify(bundle,null,2)+'\n');
  console.log(`Result: ${result.status}; bundle: ${dir}/bundle.json`);
  process.exitCode=exitCode;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.stack);process.exitCode=1;});
