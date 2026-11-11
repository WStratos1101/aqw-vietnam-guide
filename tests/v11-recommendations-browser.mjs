import {chromium,expect} from '@playwright/test';import fs from 'node:fs/promises';
const browser=await chromium.launch();const report=[];
try{for(const width of [375,1440])for(const theme of ['dark','light']){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(t=>localStorage.setItem('aqw-theme',t),theme);await page.goto('http://127.0.0.1:4181/ultra-boss/ultra-nulgath');
 const cards=page.locator('.boss-recommendations .ultra-boss-card');await expect(cards).toHaveCount(3);
 await page.getByRole('tab',{name:'KỸ NĂNG',exact:true}).click();const before=await cards.evaluateAll(a=>a.map(x=>x.getAttribute('href')));
 await page.locator('.theme-toggle').click();expect(await cards.evaluateAll(a=>a.map(x=>x.getAttribute('href')))).toEqual(before);
 await page.locator('.theme-toggle').click();await page.getByRole('tab',{name:'PASSIVE SKILL',exact:true}).click();
 expect(await cards.evaluateAll(a=>a.map(x=>x.getAttribute('href')))).toEqual(before);
 await page.getByRole('button',{name:'VŨ KHÍ',exact:true}).click();
 const reavers=page.getByRole('button',{name:'Empowered Ungodly Reavers',exact:true});await reavers.click();
 await expect(page.locator('.equipment-selected-content>h3')).toHaveText('Empowered Ungodly Reavers');
 await expect(page.locator('.equipment-selected-content .weapon-stat-strip')).toContainText('0–60 · UNSTABLE');
 await page.locator('.rpg-equipment-selector').screenshot({path:`qa/v11/reavers-${width}-${theme}.png`});
 await page.getByRole('button',{name:'TẤT CẢ',exact:true}).click();
 const strip=page.locator('.equipment-selection-strip'),next=page.getByRole('button',{name:'Trang bị tiếp theo',exact:true});
 if(await strip.evaluate(el=>el.scrollWidth>el.clientWidth+2)){await next.click();await expect.poll(()=>strip.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);}else await expect(next).toBeDisabled();
 const section=page.locator('.boss-recommendations');await section.scrollIntoViewIfNeeded();
 for(const art of await section.locator('img').all())await expect.poll(()=>art.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
 await section.screenshot({path:`qa/v11/recommendations-${width}-${theme}.png`});
 const origin=await page.evaluate(()=>performance.timeOrigin);await cards.first().click();await expect(page).toHaveURL('http://127.0.0.1:4181'+before[0]);await expect(page.locator('.ultra-detail')).toBeVisible();
 expect(await page.evaluate(()=>performance.timeOrigin)).toBe(origin);await expect(page.locator('.boss-recommendations .ultra-boss-card')).toHaveCount(3);
 const after=await page.locator('.boss-recommendations .ultra-boss-card').evaluateAll(a=>a.map(x=>x.getAttribute('href')));expect(after).not.toContain(before[0]);expect(errors).toEqual([]);
 report.push({width,theme,passed:true});await page.close();
}}finally{await browser.close();await fs.writeFile('qa/v11/recommendations-report.json',JSON.stringify(report,null,2));}
console.log({recommendationContexts:report.length});
