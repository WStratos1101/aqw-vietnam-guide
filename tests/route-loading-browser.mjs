import {chromium,expect} from '@playwright/test';import fs from 'node:fs/promises';
const browser=await chromium.launch();const page=await browser.newPage();const scripts=[];page.on('response',r=>{if(r.url().endsWith('.js'))scripts.push(r.url());});
try{await page.goto('http://127.0.0.1:4181/');await expect(page.locator('h1')).toContainText('AQW VIETNAM');await page.waitForTimeout(200);const initialScripts=[...scripts];expect(initialScripts.some(s=>/\/route-/.test(s))).toBe(false);const origin=await page.evaluate(()=>performance.timeOrigin);
 await page.locator('header a[href="/ultra-boss"]').first().click();await expect(page.locator('.ultra-boss-card')).toHaveCount(17);expect(await page.evaluate(()=>performance.timeOrigin)).toBe(origin);
 await page.locator('a.ultra-boss-card').first().click();await expect(page.locator('.ultra-detail')).toBeVisible();expect(await page.evaluate(()=>performance.timeOrigin)).toBe(origin);
 await page.locator('header a[href="/class"]').first().click();await expect(page.locator('h1')).toContainText(/CLASS|Class|Thư viện/);expect(await page.evaluate(()=>performance.timeOrigin)).toBe(origin);await page.goBack();await expect(page.locator('.ultra-detail')).toBeVisible();
 await fs.writeFile('qa/recovery/route-loading.json',JSON.stringify({passed:true,initialScripts,laterScripts:scripts.filter(s=>!initialScripts.includes(s)),clientNavigation:true},null,2));console.log('Route loading and history passed.');
}finally{await browser.close();}
