import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mainWorkflowTasks, finalReceiptTasks, sumMaterials, farmTimeLabel } from '../src/lib/farm-workflows.mjs';
import { farmBoost } from '../src/lib/farm-details.mjs';
import { questRules } from '../Update/AQW_Farm_Inventory_V3/aqw-farm-inventory.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read('src/content/farm/catalog-v2.generated.json'),registry=read('src/content/farm/quest-workflows.generated.json'),sets=read('src/content/farm/equipment-sets.generated.json').sets;
const route=id=>catalog.items.find(i=>i.id===id).acquisitionRoutes[0];
test('Radiant has only Vohu target quest, six ownership gates and no badge in main stepper',()=>{
 const r=route('radiant-goddess-of-war'),tasks=mainWorkflowTasks(r,registry,'insignia');
 assert.deepEqual(tasks.map(q=>q.quest),['The Goddess of War']);assert.equal(tasks[0].npc,'Vohu');assert.equal(tasks[0].map,'/join ultraspeaker');assert.equal(tasks[0].ownedItems.length,6);
 assert.deepEqual(tasks[0].rows.map(r=>[r.name,r.quantity]),[['Goddess Of War',1],['Malgor Insignia',5]]);
 assert.ok(r.questGraph.some(n=>n.display==='condition'));
 assert.deepEqual(r.farmModes[0].materials.map(r=>[r.name,r.quantity]),[['Goddess Of War',1],['Malgor Insignia',5]]);
});
test('LR main steps are exactly LF1 LF2 LF3, LF4 is final receipt with 20/6/10',()=>{
 const r=route('legion-revenant-class');
 for(const mode of r.farmModes){assert.deepEqual(mainWorkflowTasks(r,registry,mode.id).map(q=>q.quest),questRules.legionRevenant.mainFarmQuests);const final=finalReceiptTasks(r,registry,mode);assert.deepEqual(final.map(q=>q.quest),['Legion Fealty 4']);assert.deepEqual(Object.fromEntries(final[0].rows.map(r=>[r.name,r.quantity])),{"Revenant's Spellscroll":20,'Conquest Wreath':6,'Exalted Crown':10});}
});
test('all four Awe sets have four unique members and every item stops at its own verified tier',()=>{
 for(const [id,stop] of Object.entries(questRules.awe.stopBySet)){
  const set=sets.find(s=>s.id===id);assert.equal(new Set(set.memberIds).size,4,id);
  for(const itemId of set.memberIds){const tasks=mainWorkflowTasks(route(itemId),registry);assert.equal(tasks.length,stop,itemId);assert.equal(tasks.at(-1).quest,questRules.awe.chain[stop-1]);}
 }
});
test('temp and owned resources are excluded, repeated persistent resources retain multiplicity',()=>{
 assert.deepEqual(sumMaterials([{numberOfRuns:3,rows:[{name:'Temp',quantity:10,temporary:true},{name:'Gate',quantity:1,usage:'owned'},{name:'Resource',quantity:2}]}]).map(r=>[r.name,r.quantity]),[['Resource',6]]);
});
test('farm time means currency turns and resets, never full-chain duration',()=>{
 const r=route('legion-revenant-class'),time=r.farmModes.find(m=>m.id==='insignia').farmTime;
 assert.equal(time.requiredRuns,7);assert.equal(time.minimumResets,6);assert.equal(time.yieldPerRun,5);assert.match(farmTimeLabel(time),/7 lượt Weekly/);assert.ok(time.assumptions.some(s=>s.includes('prerequisite')));assert.equal(farmTimeLabel({kind:'unknown'}),null);
});

test('recovered General has nine members, Warlord twelve and Shogun seven without Crypt Samurai',()=>{
 for(const [id,count] of [['void-beetle-general',9],['void-beetle-warlord',12],['ancient-shogun',7]]){const set=sets.find(s=>s.id===id);assert.equal(set.memberIds.length,count);assert.equal(new Set(set.memberIds).size,count);assert.ok(set.memberIds.every(id=>catalog.items.some(item=>item.id===id)));assert.ok(set.memberIds.every(id=>!id.includes('crypt-samurai')));}
});
test('Adept all damage and tagged damage stay distinct, Radiant does not gain XP',()=>{
 const item=id=>catalog.items.find(i=>i.id===id);
 assert.deepEqual(farmBoost(item('adept-of-awe-battle-armblades')),['Tăng 15% sát thương lên All Monsters khi trang bị.']);
 assert.match(farmBoost(item('adept-of-awe')).join(' '),/10%.*Chaos, Dragon, Elemental, Human, Undead/);
 const radiant=farmBoost(item('radiant-goddess-of-war')).join(' ');assert.match(radiant,/50% Class Point/);assert.match(radiant,/50% Reputation/);assert.match(radiant,/30% Gold/);assert.doesNotMatch(radiant,/EXP|Description:/);
});
