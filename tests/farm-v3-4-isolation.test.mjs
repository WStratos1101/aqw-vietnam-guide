import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseFarmReviewPage} from '../scripts/lib/farm-review-parser.mjs';
import {isolateFarmQuests} from '../scripts/lib/farm-quest-isolation.mjs';
import {planAcquisitions} from '../src/lib/farm-acquisition-plan.mjs';
import {sumMaterials,mainWorkflowTasks,reachableMaterialRows} from '../src/lib/farm-workflows.mjs';
const url='https://aqwwiki.wikidot.com/fixture-quests';
const wiki=id=>'https://aqwwiki.wikidot.com/'+id;
const panel=(name,input,reward)=>`<div><p><strong>Requirements:</strong> Complete story</p><p><strong>Items Required:</strong></p><ul><li><a href="/${input}">${input}</a> x2</li></ul><p><strong>Items:</strong></p><ul><li><a href="/${reward}">${reward}</a> x1</li></ul></div>`;
const tabs=(names,panels)=>`<div class="yui-navset"><ul class="yui-nav">${names.map(n=>`<li>${n}</li>`).join('')}</ul><div class="yui-content">${panels.join('')}</div></div>`;
test('NPC quest panels isolate requirements/rewards and nested location tabs',()=>{
 const html=`<div id="page-content"><p><strong>Quest Location:</strong> Same map<br><strong>Quests Begun From:</strong> NPC</p>${tabs(['Map'],[tabs(['Quest','Quest'],[panel('Quest','a','b'),panel('Quest','c','d')])])}</div>`;
 const p=parseFarmReviewPage(html,url);assert.equal(p.quests.length,2);
 assert.deepEqual(p.quests.map(q=>q.required.map(r=>r.name)),[['a'],['c']]);
 assert.deepEqual(p.quests.map(q=>q.fixedRewards.map(r=>r.name)),[['b'],['d']]);
 assert.notEqual(p.quests[0].sectionIdentity,p.quests[1].sectionIdentity);
});
test('story/owned dependencies become conditions, exact quest temporary/drop inputs survive',()=>{
 const row={name:'Direct',itemId:'direct',quantity:7,wikiUrl:wiki('direct'),temporary:true,requiredQuest:'Acquire'};
 const q={id:'acquire',quest:'Acquire',npc:'NPC',location:'Map',source:url,sourceHash:'sha',sectionIdentity:'a',rows:[row],fixedRewards:[{name:'Target',wikiUrl:wiki('target'),quantity:1}],dependencies:['story'],ownedItems:[]};
 const story={id:'story',quest:'Story',npc:'NPC',location:'Map',source:url,sourceHash:'sha',sectionIdentity:'b',rows:[{name:'Story drop',quantity:50}],fixedRewards:[]};
 const page={url,sourceHash:'sha',quests:[q,story].map(t=>({name:t.quest,sectionIdentity:t.sectionIdentity,location:t.location,required:t.rows}))};
 const item={id:'target',name:'Target',wikiUrl:wiki('target'),acquisitionRoutes:[{id:'route',method:'Quest',questWorkflowIds:['story','acquire'],questFinishIds:['acquire']}]};
 const registry={quests:{acquire:q,story},materials:{}};
 const audit=isolateFarmQuests([item],registry,new Map([[url,page]]));
 const r=item.acquisitionRoutes[0];assert.deepEqual(r.directMaterials.map(m=>m.name),['Direct']);assert.equal(r.directMaterials[0].temporary,true);
 assert.deepEqual(mainWorkflowTasks(r,registry).map(q=>q.id),['acquire']);assert.equal(r.storyPrerequisites[0].name,'Story');
 assert.equal(audit.contaminatedRoutes,1);assert.equal(audit.records[0].storyMaterialsExcluded[0].quantity,50);
});
const leaf=(id,qty=1,extra={})=>({kind:'item',name:id,itemId:id,quantity:qty,...extra});
const def=(id,rewards,requirements)=>({id,status:'verified',rewards:rewards.map(itemId=>({itemId,quantity:1,kind:'fixed'})),materialTree:{kind:'allOf',requirements}});
test('fixed multi-rewards share costs, repeat counts and choice rewards remain distinct',()=>{
 const d=def('shared',['armor','helm'],[leaf('voucher',30)]);
 assert.deepEqual(planAcquisitions([{itemId:'armor',quantity:1},{itemId:'helm',quantity:1}],{shared:d}).totals,[{itemId:'voucher',quantity:30}]);
 d.rewards.forEach(r=>r.kind='choice');assert.equal(planAcquisitions([{itemId:'armor',quantity:1},{itemId:'helm',quantity:1}],{shared:d}).totals[0].quantity,60);
 d.repeatability='weekly';assert.equal(planAcquisitions([{itemId:'armor',quantity:3}],{shared:d}).acquisitions[0].minimumResets,2);
});
test('nested AND/OR, owned and temporary requirements, cycles and pending evidence fail closed',()=>{
 const outer=def('outer',['target'],[leaf('nested',2),leaf('owned',1,{usage:'owned'}),leaf('temp',1,{temporary:true}),leaf('story',99,{role:'storyPrerequisite'})]);
 const inner=def('inner',['nested'],[{kind:'anyOf',requiredChoices:1,requirements:[leaf('gold',5),leaf('insignia',1)]}]);
 let plan=planAcquisitions([{itemId:'target',quantity:1}],{outer,inner});assert.equal(plan.complete,false);assert.equal(plan.gaps[0].reason,'UNSELECTED_OR');
 plan=planAcquisitions([{itemId:'target',quantity:1}],{outer,inner},{choices:{'inner.0':[1]}});
 assert.deepEqual(plan.totals,[{itemId:'insignia',quantity:2}]);assert.deepEqual(plan.ownedRequirements,[{itemId:'owned',quantity:1}]);assert.deepEqual(plan.temporaryRequirements,[{itemId:'temp',quantity:1}]);
 inner.materialTree=leaf('target');plan=planAcquisitions([{itemId:'target',quantity:1}],{outer,inner});assert.ok(plan.gaps.some(g=>g.reason==='DEPENDENCY_CYCLE'));
 outer.status='pending';assert.equal(planAcquisitions([{itemId:'target',quantity:1}],{outer}).complete,false);
});
test('identical canonical quest completions are counted once',()=>{
 const t={id:'q',sectionIdentity:'panel',source:url,sourceHash:'sha',rows:[{name:'Voucher',quantity:30}]};
 assert.equal(sumMaterials([t,{...t}])[0].quantity,30);
});
test('entire production catalog has an isolation record, Malgor has seven direct materials and shared acquisition',()=>{
 const c=JSON.parse(fs.readFileSync('src/content/farm/catalog-v2.generated.json')).items;
 const a=JSON.parse(fs.readFileSync('Update/FARM_V3_4_QUEST_ISOLATION_AUDIT.json'));
 assert.equal(a.itemsAudited,c.length);assert.equal(a.routesAudited,c.reduce((n,i)=>n+i.acquisitionRoutes.length,0));
 const r=id=>c.find(i=>i.id===id).acquisitionRoutes[0];
 assert.equal(r('malgor-the-shadowlord').directMaterials.length,7);
 assert.deepEqual(r('malgor-the-shadowlord').acquisitionDefinitionIds,r('shadowlord-s-helm').acquisitionDefinitionIds);
 assert.ok(r('malgor-the-shadowlord').storyPrerequisites.some(q=>q.name==='Your Hero'));
 assert.ok(!r('malgor-the-shadowlord').directMaterials.some(m=>m.name==='Find Malgor'));
});
const catalog=JSON.parse(fs.readFileSync('src/content/farm/catalog-v2.generated.json')).items;
const sets=JSON.parse(fs.readFileSync('src/content/farm/equipment-sets.generated.json')).sets;
const get=id=>catalog.find(i=>i.id===id);
const route=id=>get(id).acquisitionRoutes[0];
test('same quest names on adjacent locations preserve their own context and panels',()=>{
 const context=map=>`<p><strong>Quest Location:</strong> ${map}<br><strong>Quests Begun From:</strong> NPC</p>`;
 const p=parseFarmReviewPage(`<div id="page-content">${context('Map A')}${tabs(['Quest'],[panel('Quest','a','x')])}${context('Map B')}${tabs(['Quest'],[panel('Quest','b','y')])}</div>`,url);
 assert.deepEqual(p.quests.map(q=>q.location),['Map A','Map B']);assert.deepEqual(p.quests.map(q=>q.required[0].name),['a','b']);
});
test('multiple rewards stay inside their selected quest block',()=>{
 const content=panel('Quest','a','armor').replace('</ul></div>','<li><a href="/helm">helm</a> x1</li></ul></div>');
 const p=parseFarmReviewPage(`<div id="page-content">${tabs(['Acquire','Other'],[content,panel('Other','junk','unrelated')])}</div>`,url);
 assert.deepEqual(p.quests[0].fixedRewards.map(r=>r.name),['armor','helm']);assert.equal(p.quests[1].fixedRewards[0].name,'unrelated');
});
test('merge shop inventory never becomes a shared recipe for every output',()=>{
 const p=parseFarmReviewPage('<div id="page-content"><table><tr><th>Name</th><th>Price</th></tr><tr><td><a href="/a">A</a></td><td>Token x2</td></tr><tr><td><a href="/b">B</a></td><td>Other x99</td></tr></table></div>',url);
 assert.equal(p.shopInventory.length,2);assert.deepEqual(p.mergeRecipes,[]);
});
test('ambiguous quest panels and missing source bytes cannot be verified',()=>{
 const item={id:'x',name:'X',wikiUrl:wiki('x'),acquisitionRoutes:[{id:'r',method:'Quest',questWorkflowIds:['q']}]};
 const registry={quests:{q:{id:'q',quest:'Same',source:url,sourceHash:'bad',rows:[{name:'Wrong',quantity:9}],fixedRewards:[{wikiUrl:wiki('x')}]}}};
 const audit=isolateFarmQuests([item],registry,new Map());assert.equal(audit.records[0].verificationStatus,'UNVERIFIED');assert.deepEqual(item.acquisitionRoutes[0].directMaterials,[]);
});
test('Malgor armor fixture retains all exact quantities and no story rows',()=>{
 assert.deepEqual(route('malgor-the-shadowlord').directMaterials.map(r=>[r.name,r.quantity]),[['Gold Voucher 500k',30],['Timestream Ravager',1],['ShadowFlame Defender',1],['Mana Guardian',1],['Dark Dragon Slayer',1],['Mystical Devotee of Mana',1],["Dragon's Tear",1]]);
 const registry=JSON.parse(fs.readFileSync('src/content/farm/quest-workflows.generated.json'));
 assert.deepEqual(mainWorkflowTasks(route('malgor-the-shadowlord'),registry).map(t=>t.quest),["Build Malgor's Armor Set"]);
});
test('Malgor weapon and capes use exact merge recipes, not Tara story or armor quest',()=>{
 const recipe=id=>Object.fromEntries(route(id).directMaterials.map(r=>[r.name,r.quantity]));
 assert.deepEqual(recipe('malgor-s-shadowflame-blade'),{'Malgor Insignia':20,'ShadowFlame Dragon Blade':1,'Elemental Core':20});
 for(const id of ['dragon-malgor-visage','malgor-s-half-wing','malgor-s-half-wing-and-tail'])assert.deepEqual(recipe(id),{'Malgor Insignia':1,'Elemental Core':3});
 assert.equal(get('malgor-s-shadowflame-blade').level,95);
});
test('one Malgor family contains all six evidenced identities and excludes Goddess rewards',()=>{
 const s=sets.find(s=>s.id==='malgor-the-shadowlord');assert.equal(s.memberIds.length,6);assert.ok(s.memberIds.every(id=>get(id).primaryGroupId==='alternative-hero'));assert.ok(!s.memberIds.some(id=>id.includes('goddess')));
});
test('Debris primary families preserve Darkon, Drago and both Higure variants without duplicates',()=>{
 for(const [id,n]of [['darkon',5],['drago',6],['higure',2]]){const s=sets.find(s=>s.id===id);assert.equal(s.memberIds.length,n);assert.equal(new Set(s.memberIds).size,n);}
 assert.deepEqual(get('higure').setIds,['higure']);assert.deepEqual(get('empowered-higure').setIds,['higure']);
 assert.ok(sets.find(s=>s.id==='drago').memberIds.includes('prince-darkon-s-poleaxe'));
});
test('Chaos Avenger Class is an actual member beside a separate Armor identity',()=>{
 const s=sets.find(s=>s.id==='chaos-avenger');assert.equal(s.memberIds.length,10);assert.ok(s.memberIds.includes('chaos-avenger'));assert.ok(s.memberIds.includes('chaos-avenger-armor'));
 assert.equal(get('chaos-avenger').category,'Classes');assert.equal(get('chaos-avenger-armor').category,'Armors');assert.notEqual(get('chaos-avenger').wikiUrl,get('chaos-avenger-armor').wikiUrl);
 assert.deepEqual(Object.fromEntries(route('empowered-chaos-avenger-s-greatsword').directMaterials.map(r=>[r.name,r.quantity])),{"Chaos Avenger's Greatsword":1,'Champion Drakath Insignia':5});
});
test('OR acquisition routes require selection and never add alternative costs',()=>{
 const a=def('a',['target'],[leaf('gold',5)]),b=def('b',['target'],[leaf('gold',999)]);
 assert.equal(planAcquisitions([{itemId:'target',quantity:1}],{a,b}).complete,false);
 assert.deepEqual(planAcquisitions([{itemId:'target',quantity:1}],{a,b},{routes:{target:'a'}}).totals,[{itemId:'gold',quantity:5}]);
});
test('same reward at multiple NPC panels becomes selectable alternatives, not combined quest steps',()=>{
 const registry=JSON.parse(fs.readFileSync('src/content/farm/quest-workflows.generated.json'));
 for(const id of ['wrought-ironblood-armblade','wrought-ironblood-armblades']){
  const r=route(id);assert.equal(r.questOptions.length,6);
  for(const option of r.questOptions){
   const tasks=mainWorkflowTasks(r,registry,undefined,option.questId);
   assert.equal(tasks.length,1);assert.equal(tasks[0].id,option.questId);
  }
  assert.equal(r.materialTotalsComplete,false);
 }
});
test('material drilldown cannot reach unrelated profiles and terminates on cycles',()=>{
 const direct=[{itemId:'direct',name:'Direct',quantity:1}];
 const profiles={direct:{tasks:[{rows:[{itemId:'nested',name:'Nested',quantity:2}]}]},nested:{tasks:[{rows:direct}]},unrelated:{tasks:[{rows:[{itemId:'bad',name:'Bad',quantity:100}]}]}};
 assert.deepEqual(reachableMaterialRows(direct,profiles).map(r=>r.itemId),['direct','nested']);
});
test('temporary quest requirements are retained separately from consumed totals',()=>{
 const d=def('q',['target'],[leaf('temp',5,{temporary:true}),leaf('gold',7)]);
 const result=planAcquisitions([{itemId:'target',quantity:2}],{q:d});assert.deepEqual(result.temporaryRequirements,[{itemId:'temp',quantity:10}]);assert.deepEqual(result.totals,[{itemId:'gold',quantity:14}]);
});
test('shared owned prerequisites are not consumed or multiplied by repeat count',()=>{
 const d=def('q',['target'],[leaf('owned',1,{usage:'owned'}),leaf('consumed',3)]);
 const result=planAcquisitions([{itemId:'target',quantity:7}],{q:d});assert.deepEqual(result.ownedRequirements,[{itemId:'owned',quantity:1}]);assert.equal(result.totals[0].quantity,21);
});
test('every catalog item and production set retains canonical uniqueness',()=>{
 assert.equal(new Set(catalog.map(i=>i.id)).size,catalog.length);assert.equal(new Set(catalog.map(i=>i.wikiUrl)).size,catalog.length);assert.equal(new Set(sets.map(s=>s.id)).size,sets.length);
 for(const s of sets)assert.equal(new Set(s.memberIds).size,s.memberIds.length,s.id);
});
test('quest Items label without a colon still binds only its exact reward',()=>{
 const p=parseFarmReviewPage(`<div id="page-content">${tabs(['Acquire'],[panel('Acquire','blood-sorceress','scarlet-sorceress-0-ac').replace('<strong>Items:</strong>','<strong>Items</strong>')])}</div>`,url);
 assert.equal(p.quests[0].fixedRewards[0].wikiUrl,wiki('scarlet-sorceress-0-ac'));
});
test('choice rewards cannot share completion cost as if they were fixed co-rewards',()=>{
 const t={id:'q',sectionIdentity:'panel',source:url,sourceHash:'sha',rewardChoices:[{name:'Armor',quantity:1},{name:'Helm',quantity:1}],rows:[{name:'Voucher',quantity:30}]};
 assert.equal(sumMaterials([t,{...t}])[0].quantity,60);
});
