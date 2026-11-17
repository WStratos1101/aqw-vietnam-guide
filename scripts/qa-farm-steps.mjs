import { runQa, selectFarmBrowser } from './qa-runtime.mjs';
import { checkFarmSteps } from './lib/farm-step-qa.mjs';
await runQa('farm',async({browser,base,expect,result,dir})=>{
  result.profile='steps';
  for(const width of [390,768,1024,1440]){
    const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
    const entry={width,status:'running',steps:[],consoleErrors:[]};result.cases.push(entry);
    page.on('pageerror',error=>entry.consoleErrors.push(String(error)));
    page.on('console',message=>{if(message.type()==='error')entry.consoleErrors.push(message.text());});
    try{
      await checkFarmSteps({page,base,expect,recordTable:diagnostic=>(result.materialTables ||= []).push(diagnostic),screenshot:async name=>{
        const file=`${dir}/${name}-${width}.png`;await page.screenshot({path:file,fullPage:true});result.screenshots.push(file);
      }});
      expect(entry.consoleErrors).toEqual([]);
      entry.steps.push({name:'source-backed step counts 1/2/3/4/6 and farm mode reset',status:'passed'});
      await page.screenshot({path:`${dir}/steps-${width}.png`,fullPage:true});result.screenshots.push(`${dir}/steps-${width}.png`);
      entry.status='passed';
    }catch(error){
      entry.status='failed';
      await page.screenshot({path:`${dir}/failure-${width}.png`,fullPage:true});result.screenshots.push(`${dir}/failure-${width}.png`);
      throw error;
    }finally{await page.close();}
  }
},{browserName:selectFarmBrowser(),outputDir:process.env.AQW_FARM_QA_OUTPUT || 'artifacts/qa/farm/steps'});
