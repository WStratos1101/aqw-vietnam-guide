import {createRequire} from 'node:module';
const require=createRequire(process.cwd()+'/package.json');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= process.cwd()+'/.playwright-browsers';
const {chromium}=require('@playwright/test');
const fs=require('node:fs');const assert=require('node:assert/strict');
const browser=await chromium.launch({headless:true});
const out=process.cwd()+'/artifacts/qa/calendar-v020';fs.mkdirSync(out,{recursive:true});
const results=[];
try {
for(const width of [1440,375]) for(const theme of ['light','dark']){
 const page=await browser.newPage({viewport:{width,height:1000}});
 await page.goto('http://127.0.0.1:4173/class/calendar-timeless-chronomancer');
 await page.waitForSelector('.calendar-item-guide');
 await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
 const mainTabs=page.locator('.class-inspection-tabs [role=tab]');
 const choices=page.locator('.calendar-item-choice');assert.equal(await choices.count(),6);
 await choices.nth(0).click();assert.equal(await choices.nth(0).getAttribute('aria-pressed'),'true');
 await page.locator('.calendar-item-guide').screenshot({path:`${out}/${width}-${theme}-items.png`});
 await mainTabs.nth(2).click();
 let acquisition=page.locator('.acquisition-method-tabs [role=tab]');
 const initial=await acquisition.allTextContents();assert.equal(new Set(initial).size,initial.length);
 const merge=acquisition.filter({hasText:'MERGE'});assert.equal(await merge.count(),1);await merge.click();assert.match(await page.locator('.class-acquisition-method').innerText(),/HeroPoint/);
 await acquisition.first().click();
 await page.locator('.class-acquisition').screenshot({path:`${out}/${width}-${theme}-acquisition.png`});
 const variantButtons=page.locator('.class-art-switch button');
 await variantButtons.first().click();assert.equal(await page.locator('.acquisition-method-tabs [role=tab]').filter({hasText:'MERGE'}).count(),0);
 await variantButtons.last().click();assert.equal(await page.locator('.acquisition-method-tabs [role=tab]').filter({hasText:'MERGE'}).count(),1);
 await mainTabs.nth(1).click();
 const comboTabs=page.locator('.class-combo-tabs [role=tab]');await comboTabs.last().click();
 assert.equal(await page.locator('.class-combo-panel').count(),1);
 assert.equal(await page.locator('.class-combo-panel .calendar-item-chip').count(),4);
 await page.locator('.class-combo-book').screenshot({path:`${out}/${width}-${theme}-combo.png`});
 const broken=await page.locator('.class-combo-panel img').evaluateAll(imgs=>imgs.filter(img=>img.complete&&img.naturalWidth===0).map(img=>img.src));assert.deepEqual(broken,[]);assert.equal(await page.locator('.class-combo-panel .ability-icon-pending').count(),0);
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
 await page.goto('http://127.0.0.1:4173/class/calendar-overworld-chronomancer');await page.waitForSelector('.calendar-item-guide');
 await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);assert.match(await page.locator('.calendar-item-guide').innerText(),/Timepieces/);
 await page.locator('.class-inspection-tabs [role=tab]').nth(1).click();assert.match(await page.locator('.class-combo-panel').innerText(),/Madness/);assert.doesNotMatch(await page.locator('.class-combo-panel').innerText(),/Pestilence/);
 await page.goto('http://127.0.0.1:4173/class/abyssal-angel-aa-abyssal-angel-s-shadow-aas');await page.waitForSelector('.class-inspection-tabs');
 await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.locator('.class-inspection-tabs [role=tab]').nth(1).click();
 await page.getByRole('tab',{name:'Soloing',exact:true}).click();assert.match(await page.locator('.class-combo-panel').innerText(),/Vantage Point/);assert.doesNotMatch(await page.locator('.class-combo-panel').innerText(),/Farming/);
 await page.locator('.class-combo-book').screenshot({path:`${out}/${width}-${theme}-abyssal.png`});
 results.push({width,theme,overflow,brokenIcons:broken,variantSwitch:true,comboSwitch:true,itemSelection:true});await page.close();
}
} finally {fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));await browser.close();}
console.log(results);
