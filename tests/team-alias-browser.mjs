import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch();const results=[];
try {
 for(const width of [375,1440])for(const theme of ['dark','light']){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  await page.addInitScript(t=>localStorage.setItem('aqw-theme',t),theme);
  await page.goto('http://127.0.0.1:4181/ultra-boss/ultra-nulgath');
  const team=page.locator('.ultra-team').nth(2);
  await team.locator('.ultra-team-toggle').click();
  const cards=team.locator('.team-role-card');await expect(cards).toHaveCount(4);
  await expect(cards.locator('summary strong')).toHaveText(['Dragon of Time','Dragon of Time','Legion Revenant','Lord of Order']);
  for(const card of await cards.all()){
   await card.locator('details>summary').click();
   await expect(card.locator('.team-loadout')).not.toContainText('Đang cập nhật');
  }
  await expect(cards.nth(0).locator('.class-alternatives')).toHaveCount(0);
  await expect(cards.nth(1).locator('.class-alternatives')).toHaveCount(0);
  for(const reference of await page.locator('.ultra-progression-reference').all()){
   expect(await reference.locator('.boss-route-timeline,.boss-additional-items>article').count()).toBeGreaterThan(0);
  }
  await team.screenshot({path:`qa/recovery/team-alias-${width}-${theme}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  results.push({width,theme,passed:true});await page.close();
 }
}finally{await browser.close();await fs.writeFile('qa/recovery/team-alias-browser.json',JSON.stringify(results,null,2));}
console.log({teamAliasContexts:results.length});
