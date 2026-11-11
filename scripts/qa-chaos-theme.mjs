import {runQa,inspectPage} from './qa-runtime.mjs';
const coverage={};
const dark={'--theme-ground':'#08050D','--theme-panel':'#130D1D','--theme-raised':'#20132F','--theme-line':'#4B3265','--theme-accent':'#A65BFA','--theme-hover':'#D2A5FF','--theme-focus':'#C58BFF','--theme-text':'#F5F0FF','--theme-secondary':'#B9AACD'};
await runQa('chaos-theme',async({browser,base,result,dir,expect})=>{
 for(const width of [375,768,1440,1920]){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('aqw-theme','dark'));
 for(const path of ['/','/ultra-boss/darkon-the-conductor','/class','/class/archpaladin-ap','/challenge-dungeon/temple-of-the-solstice-moon']){
 const item={path,width,status:'not_run',styles:{}};result.cases.push(item);
 try{
 await page.goto(base+path);await page.locator('.theme-toggle').waitFor();
 for(const theme of ['dark','light','dark']){
 if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('.theme-toggle').click();
 expect(await page.evaluate(()=>localStorage.getItem('aqw-theme'))).toBe(theme);
 if(theme==='dark')for(const [token,value]of Object.entries(dark))expect(await page.evaluate(t=>getComputedStyle(document.documentElement).getPropertyValue(t).trim(),token)).toBe(value);
 item.styles[theme]=await page.evaluate(()=>Object.fromEntries(['body','.header','.class-card','[role=tab][aria-selected=true]','.button','.ultra-equipment-choice[aria-pressed=true]'].map(s=>{const e=document.querySelector(s);if(!e)return[s,null];const c=getComputedStyle(e);return[s,{background:c.backgroundColor,color:c.color,border:c.borderColor}];})));
 for(const [selector,computed] of Object.entries(item.styles[theme]))if(computed){coverage[selector]=(coverage[selector]||0)+1;if(theme==='dark'&&selector==='body'){expect(computed.background).toBe('rgb(8, 5, 13)');expect(computed.color).toBe('rgb(245, 240, 255)');}if(theme==='dark'&&selector==='.ultra-equipment-choice[aria-pressed=true]')expect(computed.border).toContain('rgb(232, 153, 189)');}
 const check=await inspectPage(page);expect(check.overflow).toBe(false);expect(check.brokenImages).toEqual([]);
 const file=`${width}-${theme}-${path.replaceAll('/','_')||'home'}.png`;await page.screenshot({path:`${dir}/${file}`,fullPage:true});result.screenshots.push(file);
 }
 await page.reload();expect(await page.locator('html').getAttribute('data-theme')).toBe('dark');expect(errors).toEqual([]);item.status='passed';
 }catch(e){item.status='failed';item.error=e.message;}
 }
 await page.close();
 }
 result.computedCoverage=coverage;
 for(const selector of ['body','.header','.class-card','[role=tab][aria-selected=true]','.button','.ultra-equipment-choice[aria-pressed=true]'])expect(coverage[selector]||0).toBeGreaterThan(0);
});
