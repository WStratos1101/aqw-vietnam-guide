import './qa-browser-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import { chromium, webkit } from '@playwright/test';
import { classifyLaunchError } from './qa-runtime.mjs';
const require=createRequire(import.meta.url);
const directory='Update/_qa-browsers/reports';fs.mkdirSync(directory,{recursive:true});
const report={at:new Date().toISOString(),platform:process.platform,arch:process.arch,os:os.release(),playwright:require('@playwright/test/package.json').version,browserPath:process.env.PLAYWRIGHT_BROWSERS_PATH,safariQA:'UNVERIFIED',engines:[]};
// Always try Chromium even after a WebKit launch failure.
for(const [name,engine] of [['webkit',webkit],['chromium',chromium]]){
 const result={engine:name,executable:engine.executablePath(),status:'NOT_RUN'};let browser;
 try{
  browser=await engine.launch({headless:true,timeout:20000,...(name==='chromium'?{chromiumSandbox:true}:{})});
  const page=await browser.newPage();await page.setContent('<!doctype html><h1>AQW QA launch smoke</h1>');
  if(await page.locator('h1').textContent()!=='AQW QA launch smoke')throw Error('Smoke document did not render');
  result.status='PASS';result.browserVersion=browser.version();
 }catch(error){result.status='BLOCKED';result.cause=classifyLaunchError(error.message);result.error=error.stack||String(error);process.exitCode=1;}
 finally{try{await browser?.close();}catch(error){result.status='BLOCKED';result.cleanupError=String(error);process.exitCode=1;}}
 report.engines.push(result);fs.writeFileSync(`${directory}/${name}.json`,JSON.stringify(result,null,2)+'\n');console.log({engine:name,status:result.status,cause:result.cause});
}
fs.writeFileSync(`${directory}/launch-smoke.json`,JSON.stringify(report,null,2)+'\n');
