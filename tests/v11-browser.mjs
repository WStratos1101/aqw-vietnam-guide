import {chromium,expect} from '@playwright/test';import fs from 'node:fs/promises';
const read=async p=>JSON.parse(await fs.readFile(p));const base=await read('src/content/ultra/bosses.json'),recovery=await read('src/content/ultra/recovery.json');const bosses=[...base,...recovery.bosses];
await fs.mkdir('qa/v11',{recursive:true});const results=[];const browser=await chromium.launch();
const url='http://127.0.0.1:4181';
try{for(const width of [375,768,1440,1920])for(const theme of ['dark','light']){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});await page.addInitScript(t=>localStorage.setItem('aqw-theme',t),theme);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(url+'/ultra-boss');
 await expect(page.locator('.codex-display')).toHaveCount(4);
 const typography=await page.locator('.codex-display').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n);return [s.fontFamily,s.fontWeight,s.fontStyle,parseFloat(s.letterSpacing)/parseFloat(s.fontSize)];}));
 expect(typography.length).toBe(4);for(const t of typography.slice(1)){expect(t.slice(0,3)).toEqual(typography[0].slice(0,3));expect(t[3]).toBeCloseTo(typography[0][3],2);}
 await page.screenshot({path:`qa/v11/directory-${width}-${theme}.png`,fullPage:false});
 for(const boss of bosses){
  await page.goto(url+'/ultra-boss/'+boss.slug);await expect(page.locator('#equipment-title')).toHaveText('TRANG BỊ ENDGAME');
  await expect(page.locator('.equipment-type-filters button')).toHaveText(['TẤT CẢ','VŨ KHÍ','GIÁP','MŨ','ÁO CHOÀNG']);
  await expect(page.locator('.rpg-equipment-preview')).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Nguồn tham khảo',exact:true})).toHaveCount(0);
  await expect(page.locator('.ultra-hero-meta dt')).not.toContainText(['Điều kiện nhận quest']);
  const recommendations=page.locator('.boss-recommendations .ultra-boss-card');await expect(recommendations).toHaveCount(3);
  const recs=await recommendations.evaluateAll(a=>a.map(x=>x.getAttribute('href')));expect(new Set(recs).size).toBe(3);expect(recs).not.toContain('/ultra-boss/'+boss.slug);
  const material=page.locator('.equipment-selected-content .material-requirements');await expect(material).not.toHaveAttribute('open');
  await expect(page.locator('.ultra-quest-detail').first()).toBeHidden();
  const first=page.locator('.equipment-thumbnail').first();await first.click();
  const original=await page.locator('.equipment-selected-content>h3').textContent();
  if(await page.locator('.equipment-thumbnail').count()>1){
   const check=page.locator('.ultra-quest-check input').first();await check.check();
   await material.locator('summary').click();await page.locator('.ultra-quest-toggle').first().click();
   await page.locator('.equipment-thumbnail').nth(1).click();await expect(page.locator('.rpg-equipment-preview')).toHaveCount(1);
   await expect(page.locator('.equipment-selected-content>h3')).not.toHaveText(original);
   await expect(material).not.toHaveAttribute('open');await expect(page.locator('.ultra-quest-detail').first()).toBeHidden();
   await first.click();await expect(page.locator('.ultra-quest-check input').first()).toBeChecked();await page.locator('.ultra-quest-check input').first().uncheck();
  }
  for(const label of ['VŨ KHÍ','GIÁP','MŨ','ÁO CHOÀNG']){
   await page.getByRole('button',{name:label,exact:true}).click();
   const n=await page.locator('.equipment-thumbnail').count();
   await expect(page.locator('.rpg-equipment-preview')).toHaveCount(n?1:0);
   if(n&&label!=='VŨ KHÍ')await expect(page.locator('.equipment-selected-content .weapon-stat-strip')).not.toContainText('Weapon range');
   await page.getByRole('button',{name:'TẤT CẢ',exact:true}).click();
  }
  expect(await recommendations.evaluateAll(a=>a.map(x=>x.getAttribute('href')))).toEqual(recs);
  const preview=page.locator('.rpg-equipment-preview');await preview.scrollIntoViewIfNeeded();
  const art=preview.locator('.equipment-large-art img');await expect.poll(()=>art.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
  if(['ultra-nulgath','ultra-dage','ultra-drago','ultra-ezrajal'].includes(boss.slug))await page.locator('.rpg-equipment-selector').screenshot({path:`qa/v11/selector-${width}-${theme}-${boss.slug}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(errors).toEqual([]);results.push({width,theme,slug:boss.slug,passed:true});
 }
 await page.close();
}}finally{await browser.close();await fs.writeFile('qa/v11/browser-report.json',JSON.stringify(results,null,2));}
console.log({v11Contexts:results.length,passed:results.filter(r=>r.passed).length});
