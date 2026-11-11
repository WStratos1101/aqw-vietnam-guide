import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {equipmentCategory,equipmentFilters,selectEquipment} from '../src/lib/equipment-category.mjs';
import {weaponStability} from '../src/lib/weapon-stability.mjs';
import {eligibleBossRecommendations,chooseBossRecommendations} from '../src/lib/boss-recommendations.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
test('canonical equipment categories do not confuse labels or erase other types',()=>{
 assert.deepEqual(equipmentFilters.map(f=>f.label),['TẤT CẢ','VŨ KHÍ','GIÁP','MŨ','ÁO CHOÀNG']);
 for(const alias of ['Weapons','Weapon','Vũ khí'])assert.equal(equipmentCategory(alias),'weapon');
 for(const alias of ['Armors','Armor','Giáp'])assert.equal(equipmentCategory(alias),'armor');
 assert.equal(equipmentCategory('Helmet'),'helm');assert.equal(equipmentCategory('pet'),'pet');
 const routes=[{id:'a',category:'Weapons'},{id:'b',category:'Vũ khí'},{id:'c',category:'Giáp'},{id:'d',category:'pet'}];
 assert.equal(selectEquipment(routes,'all','d').choices.length,4);
 assert.equal(selectEquipment(routes,'weapon','b').selected.id,'b');
 assert.equal(selectEquipment(routes,'armor','b').selected.id,'c');
 assert.equal(selectEquipment(routes,'cape','b').selected,undefined);
});
test('stability is an exact range mapping, never an image-tab Normal label',()=>{
 const range={minimum:0,maximum:60,source:'item',officialRangeCategory:'highdmg'};
 assert.equal(weaponStability(range).classification,'unstable');
 assert.equal(weaponStability({...range,minimum:30,maximum:30}).classification,'stable');
 assert.equal(weaponStability({...range,minimum:27,maximum:33,officialRangeCategory:'defaultdmg'}).classification,'normal');
 assert.equal(weaponStability({...range,minimum:15,maximum:45,officialRangeCategory:'mediumdmg'}).classification,'unknown');
 assert.equal(weaponStability({...range,minimum:60,maximum:0}).classification,'unknown');
 assert.equal(weaponStability({...range,source:null}).classification,'unknown');
 const reavers=read('src/content/ultra/recovery.json').equipment['empowered-ungodly-reavers'];
 assert.equal(reavers.weaponStability,'unstable');assert.deepEqual([reavers.weaponDamageRange.minimum,reavers.weaponDamageRange.maximum],[0,60]);
 assert.equal(reavers.damageBoost.value,51);assert.equal(reavers.damageBoost.targetType,'All Damage');
 assert.ok(reavers.weaponDamageRange.classificationEvidence.sourceUrl);
});
test('recommendations exclude current, duplicates and invalid routes, including short pools',()=>{
 const entries=[{id:'a',href:'/ultra-boss/a'},{id:'b',href:'/ultra-boss/b'},{id:'b',href:'/ultra-boss/b'},{id:'c',href:'/ultra-boss/c'},{id:'d',href:'/ultra-boss/d'},{id:'bad',href:'/bad'}];
 for(const random of [()=>0,()=>.5,()=>.999]){const result=chooseBossRecommendations(entries,'a',random);assert.equal(result.length,3);assert.equal(new Set(result.map(e=>e.id)).size,3);assert.ok(result.every(e=>e.id!=='a'&&e.id!=='bad'));}
 assert.equal(chooseBossRecommendations(entries.slice(0,3),'a').length,1);
 assert.deepEqual(eligibleBossRecommendations(entries,'a').map(e=>e.id),['b','c','d']);
});
test('canonical route categories and source confidence remain explicit',()=>{
 const r=read('src/content/ultra/recovery.json');for(const routes of [...r.bosses.map(b=>b.equipmentRoutes),...Object.values(r.routeOverrides)])for(const route of routes)assert.equal(route.category,equipmentCategory(route.category));
 const i=read('src/content/ultra/inspection.json');const judged=i['ultra-drago'].activeSkills.find(s=>s.id==='judgement');assert.equal(judged.confidenceStatus,'conflicting');assert.equal(judged.damageType,undefined);
 assert.equal(r.inspection['ultra-iara'].activeSkills.find(s=>s.name==='Lullaby').confidenceStatus,'needs_verification');
 assert.equal(i['ultra-engineer'].activeSkills.find(s=>s.id==='beam').damageConfidenceStatus,'needs_verification');
 assert.equal(i['ultra-engineer'].activeSkills.find(s=>s.id==='beam').damageType,'True Damage');
 assert.equal(judged.damageConfidenceStatus,'conflicting');
});
