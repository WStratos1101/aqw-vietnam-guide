import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build } from 'esbuild';
import { Window } from 'happy-dom';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { materialQuestConditions, materialConditionText, materialTableMaps } from '../src/lib/farm-material-table.mjs';
import { expectedMaterialHeaders, inspectMaterialTable } from '../scripts/lib/farm-material-table-qa.mjs';
const output = await build({stdin:{contents:"export { FarmMaterialTable } from './src/features/farm/FarmMaterialTable';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',packages:'external'});
fs.mkdirSync('artifacts/qa/farm/material-table',{recursive:true});
fs.writeFileSync('artifacts/qa/farm/material-table/component.mjs',output.outputFiles[0].text);
const { FarmMaterialTable } = await import('../artifacts/qa/farm/material-table/component.mjs');
const css = fs.readFileSync('src/features/farm/farm-v2.css','utf8');
const row = {name:'Aeacus Empowered',itemId:'aeacus-empowered',quantity:1234567,requiredQuest:'Legion Fealty 1'};
for(const width of [390,768,1024,1440]) for(const columns of [3,4]) test(`${width}px CSS/DOM contract: ${columns} material columns`,()=>{
  const window = new Window({innerWidth:width});
  const entry = {row,maps:['/join judgement'],conditions:columns===4?[[row.requiredQuest]]:[]};
  window.document.write(`<style>${css}</style><div class="fv2-root"><div class="fv32-workflow">${renderToStaticMarkup(createElement(FarmMaterialTable,{entries:[entry],label:'Nguyên liệu Quest',onMaterial:()=>{}}))}</div></div>`);
  const table=window.document.querySelector('table');
  assert.deepEqual([...table.querySelectorAll('th')].map(th=>th.textContent),['Tên nguyên liệu','Số lượng','Map farm',...(columns===4?['Điều kiện farm']:[])]);
  assert.equal(table.querySelectorAll('tbody td').length,columns);
  assert.equal(table.querySelector('details'),null);
  const quantity=table.querySelector('td:nth-child(2)'), style=window.getComputedStyle(quantity);
  assert.equal(quantity.textContent,'1.234.567');
  assert.equal(style.textAlign,'right');assert.equal(style.whiteSpace,'nowrap');
  assert.equal(style.wordBreak,'normal');assert.equal(style.overflowWrap,'normal');
  assert.equal(window.getComputedStyle(table.querySelector('td:first-child button')).overflowWrap,'normal');
  assert.equal(window.getComputedStyle(table).minWidth,columns===4?'760px':'560px');
  assert.equal(window.getComputedStyle(table.parentElement).overflowX,'auto');
  if(columns===4) assert.equal(table.querySelector('td:last-child').textContent,'Legion Fealty 1');
});
test('Quest source alternatives remain OR; conjunctions remain AND and non-Quest details stay out of the column',()=>{
  const paths=materialQuestConditions({name:'Token'},[{quest:'First Quest'},{quest:'Second Quest'},{quest:null,purchase:{amount:1},rows:[]}]);
  assert.deepEqual(paths,[['First Quest'],['Second Quest'],[]]);
  assert.equal(materialConditionText(paths),'First Quest hoặc Second Quest hoặc —');
  assert.equal(materialConditionText([['Quest A','Quest B'],['Quest C']]),'Quest A và Quest B hoặc Quest C');
  assert.deepEqual(materialQuestConditions(row,[{quest:'Unrelated producer'}]),[['Legion Fealty 1']]);
  assert.deepEqual(materialQuestConditions({...row,sourceDetails:[{requiredQuest:'Unlock A'},{requiredQuest:'Unlock B'}]}),[['Legion Fealty 1','Unlock A'],['Legion Fealty 1','Unlock B']]);
  assert.equal(materialConditionText([]),'—');
});
test('maps prefer exact material farm evidence to a receiving Quest map',()=>{
  assert.deepEqual(materialTableMaps({...row,map:'/join revenant'},[{quest:null,rows:[{name:row.name,monster:'Ultra Aeacus',map:'/join judgement'}]}],'standard'),['/join judgement']);
});
test('expected headers come from source rows, including a verified no-condition fixture',()=>{
  assert.equal(expectedMaterialHeaders([row],'standard').length,4);
  assert.equal(expectedMaterialHeaders([{name:'Unlinked fixture',quantity:1}],'standard').length,3);
});
test('scroll diagnostics distinguish a scrollable quantity from clipped or wrapped text',()=>{
  const window=new Window({url:'http://localhost/farm?item=fixture&farm-route=verified&farm-mode=insignia',innerWidth:768});
  window.document.write('<div data-item-id="fixture"></div><div id="wrapper" style="overflow-x:auto"><table><thead><tr><th>Name</th><th style="text-align:right;white-space:nowrap">Quantity</th><th>Map</th></tr></thead><tbody><tr><td>Item</td><td style="text-align:right;white-space:nowrap">1.000</td><td>/join map</td></tr></tbody></table></div>');
  const wrapper=window.document.querySelector('#wrapper');
  for(const cell of wrapper.querySelectorAll('th,td')){
    cell.style.wordBreak='normal';cell.style.overflowWrap='normal';
    cell.getBoundingClientRect=()=>({left:550,right:656,width:106});
    Object.defineProperty(cell,'clientWidth',{value:106});Object.defineProperty(cell,'scrollWidth',{value:106,configurable:true});
  }
  wrapper.getBoundingClientRect=()=>({left:100,right:500,width:400});
  wrapper.querySelector('table').getBoundingClientRect=()=>({width:760});
  Object.defineProperty(wrapper,'clientWidth',{value:400});Object.defineProperty(wrapper,'scrollWidth',{value:760});
  const old = Object.fromEntries(['location','document','getComputedStyle','innerWidth','innerHeight'].map(key=>[key,globalThis[key]]));
  Object.assign(globalThis,{location:window.location,document:window.document,getComputedStyle:window.getComputedStyle.bind(window),innerWidth:768,innerHeight:1000});
  try{
    const report=inspectMaterialTable(wrapper);
    assert.equal(report.oldQuantityInsideViewport,false);
    assert.ok(Object.values(report.checks).every(Boolean),JSON.stringify(report));
    assert.equal(report.viewport.width,768);assert.equal(report.routeId,'verified');assert.equal(report.cells[1].width,106);
    const cell=wrapper.querySelector('td:nth-child(2)');cell.style.whiteSpace='normal';cell.style.textAlign='left';
    Object.defineProperty(cell,'scrollWidth',{value:120});
    const broken=inspectMaterialTable(wrapper);
    assert.equal(broken.checks.quantityNoWrap,false);assert.equal(broken.checks.quantityAlignment,false);assert.equal(broken.checks.quantityNotClipped,false);
  }finally{Object.assign(globalThis,old);}
});
