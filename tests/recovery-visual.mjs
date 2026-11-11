import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch();const results=[];
const slugs=['god-of-the-depths','champion-drakath','kasuko','ultra-drago','ultra-nulgath','ultra-dage'];
try{for(const width of [375,1440])for(const theme of ['dark','light']){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
 await page.addInitScript(t=>localStorage.setItem('aqw-theme',t),theme);
 for(const slug of slugs){await page.goto('http://127.0.0.1:4181/ultra-boss/'+slug);
  await page.getByRole('tab',{name:'KỸ NĂNG',exact:true}).click();await page.getByRole('tab',{name:'PASSIVE SKILL',exact:true}).click();
  await page.locator('.ultra-inspect').screenshot({path:`qa/recovery/final-${width}-${theme}-${slug}-passive.png`});
  const gallery=page.locator('.rpg-equipment-preview').first();await gallery.scrollIntoViewIfNeeded();
  await gallery.screenshot({path:`qa/recovery/final-${width}-${theme}-${slug}-equipment.png`});
  if(slug==='ultra-nulgath'){const body=page.locator('main');await expect(body).not.toContainText('Empowered Prismatic Manslayer và');await expect(body).not.toContainText('Empowered Legacy of Nulgath (ELoN)');}
  await expect(page.locator('details.material-requirements[open]')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src));expect(broken).toEqual([]);
  results.push({width,theme,slug,passed:true});
 }
 await page.close();
}}finally{await browser.close();await fs.writeFile('qa/recovery/final-visual-report.json',JSON.stringify(results,null,2));}
console.log({finalVisualContexts:results.length});
