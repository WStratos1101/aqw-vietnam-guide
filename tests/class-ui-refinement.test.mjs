import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {Window} from 'happy-dom';
import {act, createElement} from 'react';
import {comboFlow} from '../src/lib/class-presentation.mjs';
import {selectedComboContent} from '../src/lib/class-ui-v12-8.mjs';
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const body = read('public/content/classes/chaos-avenger-cav.json');
const window = new Window({url:'http://localhost/class/chaos-avenger-cav'});
for (const key of ['window','document','HTMLElement','Node','Event','MouseEvent','localStorage','MutationObserver','location','history','PopStateEvent']) globalThis[key] = key === 'window' ? window : window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.fetch = async () => ({ok:true,json:async()=>body});
const {createRoot} = await import('react-dom/client');
const compiled = await build({stdin:{contents:`export {CalendarConsumables,CalendarSetup,IconArt} from './src/features/classes/CalendarConsumables';export {ClassCombos} from './src/features/classes/ClassCombos';export {ClassDetail} from './src/features/classes/ClassDetail';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'}});
const cache='node_modules/.cache/class-ui-refinement';fs.mkdirSync(cache,{recursive:true});fs.writeFileSync(cache+'/components.mjs',compiled.outputFiles[0].text);
const {CalendarConsumables,CalendarSetup,IconArt,ClassCombos,ClassDetail} = await import('../'+cache+'/components.mjs');
const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
const render=async(component,props)=>act(async()=>root.render(createElement(component,props)));
const click=async(el)=>{assert.ok(el);await act(async()=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));};

test('both years have six truthful category pictograms, also in setup chips',async()=>{
 for(const [classId,name] of [['calendar-timeless-chronomancer','Foresee Corruption'],['calendar-overworld-chronomancer','Timepiece of Madness']]) {
  await render(CalendarConsumables,{classId});
  assert.equal(host.querySelectorAll('.calendar-item-icon svg').length,6);
  assert.equal(host.querySelectorAll('[aria-pressed]').length,6);
  assert.doesNotMatch(host.textContent,/\?/);
  for(const icon of host.querySelectorAll('.calendar-item-icon [role=img]')) assert.match(icon.getAttribute('aria-label'),/biểu tượng loại item, ảnh chưa xác minh/);
  await render(CalendarSetup,{classId,comboTitle:name,text:'Dùng '+name});
  assert.equal(host.querySelectorAll('.calendar-item-chip svg').length,1);
 }
});
test('local item images have dimensions, alt and lazy loading, then fall back on error',async()=>{
 const item={name:'Hourglass of Power',image:'/images/aqw/test.png',group:'hourglass',wiki:'',summary:''};
 await render(IconArt,{item});const img=host.querySelector('img');assert.ok(img);
 assert.equal(img.getAttribute('src'),item.image);assert.equal(img.alt,item.name);
 assert.equal(img.loading,'lazy');assert.equal(img.width,42);assert.equal(img.height,42);
 await act(async()=>img.dispatchEvent(new Event('error')));
 assert.equal(host.querySelector('img'),null);assert.ok(host.querySelector('svg'));
 await render(IconArt,{item:{...item,image:'/images/aqw/another.png'}});assert.ok(host.querySelector('img'));
});
test('cooldown rule retains each opening, has only source-confirmed priority and opens skill 5',async()=>{
 for(const combo of body.combos){
  const flows=comboFlow(selectedComboContent(body.combos,combo));
  assert.deepEqual(flows[0].sequences,[combo.sequence]);
  const rules=flows.filter(f=>f.kind==='cooldown');assert.equal(rules.length,1);
  assert.equal(rules[0].prioritySkill,5);assert.deepEqual(rules[0].sequences,[]);
 }
 let selected;
 await render(ClassCombos,{classId:body.classId,combos:body.combos,skills:body.skills,onSelectSkill:id=>selected=id});
 for(const tab of host.querySelectorAll('[role=tab]')){
  await click(tab);const rule=host.querySelector('.combo-flow-group.cooldown');assert.ok(rule);
  assert.match(rule.textContent,/Sau combo mở đầu →.*Khi hồi chiêu/);assert.match(rule.textContent,/Ưu tiên \/ Haste/);
  assert.equal(rule.querySelectorAll('.skill-sequence-flow button').length,1);
  assert.equal(rule.querySelector('.sequence-arrow'),null);
  assert.equal(rule.querySelector('details').open,false);
  assert.equal(host.textContent.split('ưu tiên loop skill 5').length-1,1);
  await click(rule.querySelector('.skill-sequence-flow button'));
  assert.equal(selected,body.skills.find(s=>s.skillNumber===5).id);
 }
});
test('ambiguous prose, negations, and numbered opening counts never become cooldown skills',()=>{
 const base={id:'fixture',title:'Rule',sequence:[],notes:[]};
 for(const explanation of ['Mở đầu bằng 1 trong 2 combo Start.','Dùng skill mỗi khi CD.','Không sử dụng skill mỗi khi CD, ưu tiên loop skill 5 để có Haste buff.']){
  const f=comboFlow({...base,explanation});assert.deepEqual(f[0].sequences,[]);assert.notEqual(f[0].kind,'cooldown');
 }
 const sourceText='Sau khi mở đầu, sử dụng skill mỗi khi CD, ưu tiên loop skill 5 để có Haste buff.';
 assert.equal(comboFlow({...base,flow:[{id:'f',label:'Mở đầu',kind:'loop',sequences:[],sourceText}]})[0].kind,'cooldown');
 const flow={id:'f',label:'Loop',kind:'loop',sequences:[[2,5]],sourceText};
 assert.deepEqual(comboFlow({...base,flow:[flow]}),[flow]);
});
test('an unstructured loop keeps one label and its source in a closed disclosure',async()=>{
 const sourceText='Mở đầu theo hướng dẫn, sau đó loop tùy tình huống.';
 await render(ClassCombos,{combos:[{id:'unstructured',title:'Guide',sequence:[],explanation:sourceText,notes:[]}],skills:body.skills});
 const flow=host.querySelector('.combo-flow-group.loop');assert.ok(flow);
 assert.equal(flow.querySelectorAll('.combo-flow-label').length,1);
 assert.equal(flow.querySelectorAll(':scope > p').length,0);
 assert.equal(flow.querySelectorAll('.skill-sequence-flow').length,0);
 assert.equal(flow.querySelector('details').open,false);
 assert.equal(flow.querySelector('details p').textContent,sourceText);
});
test('Class back button always pushes /class, dispatches SPA event and scrolls to top',async()=>{
 const profile=read('src/content/classes/catalog.json').find(c=>c.id===body.classId);
 let events=0,scrolled;window.addEventListener('popstate',()=>events++);globalThis.scrollTo=(...args)=>scrolled=args;
 for(const previous of [null,'/','/ultra-boss']) {
  if(previous)history.pushState(null,'',previous);
  history.pushState({aqwPrevious:previous},'','/class/'+body.classId);
  await render(ClassDetail,{profile});const before=history.length;
  await click(host.querySelector('.class-back-row button'));
  assert.equal(location.pathname,'/class');assert.equal(history.length,before+1);assert.deepEqual(scrolled,[0,0]);
 }
 assert.equal(events,3);
});
test('small wordmark shares Ultra Boss Codex font/style/gold tokens',()=>{
 const css=fs.readFileSync('src/styles/classes/codex.css','utf8').match(/\.class-back-row > span \{([^}]+)\}/)[1];
 for(const token of ['--codex-display-font','--codex-display-style','--codex-display-weight','--codex-display-tracking','--codex-title-gold']) assert.ok(css.includes(token));
 assert.match(css,/font-size: 14px/);
 const ultra=fs.readFileSync('src/styles/ultra/v11.css','utf8');assert.match(ultra,/--codex-display-style:italic/);assert.match(ultra,/color:var\(--codex-title-gold\)/);
 const themes=fs.readFileSync('src/styles/themes.css','utf8');for(const theme of ['dark','light'])assert.match(themes,new RegExp(`data-theme=${theme}.*--codex-title-gold:`));
});
