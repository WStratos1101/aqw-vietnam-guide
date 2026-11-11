import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {normalizeCalendarMethods} from '../src/lib/calendar-acquisition.mjs';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const data = read('src/content/classes/acquisition.json');
const runtime = read('src/content/classes/calendar-variant-runtime.json');
const built = await build({stdin:{contents:`export {CalendarSetup,CalendarConsumables} from './src/features/classes/CalendarConsumables';export {ClassCombos} from './src/features/classes/ClassCombos';export {acquisitionTabLabel} from './src/lib/calendar-acquisition-v020';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'}});
fs.mkdirSync('node_modules/.cache/calendar-v020',{recursive:true});
fs.writeFileSync('node_modules/.cache/calendar-v020/components.mjs',built.outputFiles[0].text);
const {CalendarSetup,CalendarConsumables,ClassCombos,acquisitionTabLabel} = await import('../node_modules/.cache/calendar-v020/components.mjs');
const render = (component, props) => renderToStaticMarkup(createElement(component, props));
test('calendar deduplication preserves editions, gates, prices, variants and evidence',()=>{
 const methods = data.classes['calendar-timeless-chronomancer'].methods;
 const unique = normalizeCalendarMethods(methods);
 assert.equal(unique.length,4);
 assert.equal(unique[0].importEvidence.length,2);
 const changed = structuredClone(methods[0]);
 for(const mutate of [m=>m.prerequisites.push('Other Key'),m=>m.variantName='Other Variant',m=>m.shop.price.amount=5,m=>m.shop.price.currency='Gold']) {
   const copy=structuredClone(changed);mutate(copy);assert.equal(normalizeCalendarMethods([changed,copy]).length,2);
 }
 assert.deepEqual(normalizeCalendarMethods(unique), unique);
});
test('family generation retains only source-backed variant methods, including merge',()=>{
 for(const slug of ['corrupted','timeless','underworld','overworld']) {
  const methods=runtime[slug+'-chronomancer'].acquisition.methods;
  assert.equal(methods.filter(m=>m.type==='merge').length,/timeless|overworld/.test(slug)?1:0);
  assert.equal(methods.length,normalizeCalendarMethods(methods).length);
  for(const method of methods.filter(m=>m.shop)) {
   assert.equal(method.shop.price.amount,0);assert.ok(method.prerequisites.length);
   assert.match(acquisitionTabLabel(method),/^0 ACs · .* · Yêu cầu:/);
  }
  for(const method of methods.filter(m=>m.merge)) assert.match(acquisitionTabLabel(method),/MERGE · 5 HeroPoints · HeroPoints Merge/);
 }
});
test('setup uses the explicit step, including reuse, rather than the full source rotation',()=>{
 const html=render(CalendarSetup,{classId:'calendar-timeless-chronomancer',comboTitle:'Transience + Foresee · High Nuke',text:'Dùng lại Foresee Corruption'});
 assert.match(html,/Foresee Corruption/);assert.match(html,/Dùng lại/);assert.doesNotMatch(html,/Hourglass of Transience/);
 for(const classId of ['calendar-corrupted-chronomancer','calendar-underworld-chronomancer']) {
  const panel=render(CalendarConsumables,{classId});assert.equal((panel.match(/aria-pressed="false"/g)||[]).length,6);
  assert.doesNotMatch(panel,/misc\.png|maul-test/);assert.match(panel,/ảnh chưa xác minh/);
 }
});
test('Abyssal renders only the selected rotation and preserves verified auto attack',()=>{
 const body=read('public/content/classes/abyssal-angel-aa-abyssal-angel-s-shadow-aas.json');
 assert.deepEqual(body.combos[0].flow[0].sequences,[[5,3,1]]);
 assert.deepEqual(body.combos[1].flow[0].sequences,[[5,3,2]]);
 const html=render(ClassCombos,{classId:body.classId,combos:body.combos,skills:body.skills});
 const panel=html.slice(html.indexOf('class-combo-panel'));
 assert.doesNotMatch(panel,/Soloing|Vantage Point/);
 assert.match(panel,/Acheron/);
});
