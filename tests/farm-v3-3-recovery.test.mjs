import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sourceOrigin,validateOfflinePage,sha256,equipmentCategory,sameItemName} from '../scripts/lib/farm-offline-sources.mjs';
import {applyFarmClassScope} from '../scripts/lib/farm-class-scope.mjs';
import {farmBoostState} from '../src/lib/farm-details.mjs';
import {materialLeaves} from '../src/lib/material-requirements.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),catalog=read('src/content/farm/catalog-v2.generated.json'),sets=read('src/content/farm/equipment-sets.generated.json').sets,quests=read('src/content/farm/quest-workflows.generated.json').quests;
const get=id=>catalog.items.find(i=>i.id===id);
test('offline evidence origin follows exact URL, never archive labels; bad hashes fail closed',()=>{
 assert.equal(sourceOrigin('https://sites.google.com/view/vncollector/farm'),'google-sites');
 for(const url of ['https://sites.google.com/view/someone-else/farm','https://sites.google.com.evil.test/view/vncollector/','https://sites.google.com/view/vncollector-spoof/'])assert.equal(sourceOrigin(url),'other');
 assert.equal(validateOfflinePage({url:'https://aqwwiki.wikidot.com/higure',kind:'site',body:'wiki',sha256:sha256('wiki')}),'aqw-wiki');
 assert.throws(()=>validateOfflinePage({url:'https://sites.google.com/view/vncollector/',body:'changed',sha256:sha256('original')}),/hash mismatch/);
 assert.equal(sameItemName('Chaos Avenger','Chaos Avenger Armor'),false);
 assert.equal(sameItemName("Goddess Of War","Goddess of War"),true);
});
test('Grounds is distinct from house items and preserves actual equipment membership',()=>{
 assert.equal(equipmentCategory(['/main','/items','/misc-items','/grounds']),'Grounds');
 assert.equal(equipmentCategory(['/main','/items','/house-items','/floor-items']),null);
 for(const [id,setId] of [['hollowborn-archfiend-runes','hollowborn-metamorphosis-of-nulgath'],['goddess-of-war-battlefield','goddess-of-war']]){
  assert.equal(get(id).category,'Grounds');assert.ok(sets.find(s=>s.id===setId).memberIds.includes(id));
 }
});
test('two DoomKnight tiers and Goddess/CAV families keep exact declared inventories',()=>{
 for(const [id,count] of [['classic-hollowborn-doomknight',8],['hollowborn-doomknight',4],['goddess-of-war',10],['chaos-avenger',10]])assert.equal(sets.find(s=>s.id===id).memberIds.length,count,id);
 assert.equal(new Set(sets.filter(s=>['classic-hollowborn-doomknight','hollowborn-doomknight'].includes(s.id)).flatMap(s=>s.memberIds)).size,12);
 const cav=sets.find(s=>s.id==='chaos-avenger');assert.ok(cav.memberIds.includes('chaos-avenger'));
 assert.equal(get('chaos-avenger').category,'Classes');assert.equal(get('chaos-avenger-armor').category,'Armors');
 assert.equal(get('chaos-avenger').wikiUrl,'https://aqwwiki.wikidot.com/chaos-avenger');
 assert.ok(sets.find(s=>s.id==='goddess-of-war').memberIds.every(id=>get(id).primaryGroupId==='alternative-hero'));
});
test('fragment-linked CAV shop unlock resolves exactly once with six inputs and level 80',()=>{
 const route=get('chaos-avenger').acquisitionRoutes[0],rows=route.questWorkflowIds.map(id=>quests[id]);
 assert.equal(rows.filter(q=>q.quest==='Chaos Avenger Class').length,1);const quest=rows.find(q=>q.quest==='Chaos Avenger Class');
 assert.equal(quest.source,'https://aqwwiki.wikidot.com/hero-s-quests');assert.equal(quest.rows.length,6);
 assert.ok(JSON.stringify(quest).includes('80'));
 const empowered=get('empowered-chaos-avenger-armor');assert.deepEqual(materialLeaves(empowered.acquisitionRoutes[0].materialTree).map(r=>[r.name,r.quantity]),[['Chaos Avenger Armor',1],['Champion Drakath Insignia',5]]);
 assert.deepEqual(empowered.boosts.map(b=>[b.percent,b.targets]),[[50,['Chaos']]]);
});
test('farm class variants link to Codex while combat percentages never become equipped boosts',()=>{
 for(const id of ['frostval-barbarian-0-ac','stonecrusher-merge','archpaladin-0-ac']){assert.ok(get(id).classHref,id);assert.equal(farmBoostState(get(id)),'none');assert.ok(get(id).recoveredMetadataEvidence.absenceEvidence.combatPercentagesExcluded);}
 const frost=get('frostval-barbarian-0-ac');assert.ok(frost.acquisitionRoutes.some(r=>r.questWorkflowIds?.some(id=>quests[id].quest==='Unleash the Frostvale Barbarian')));
});
test('reviewed Farm exclusions fail closed and preserve non-Class records',()=>{
 const review=read('content-sources/farm/refinement/v3-3-class-scope.json');assert.equal(review.decisions.length,10);
 for(const d of review.decisions)assert.equal(get(d.id),undefined,d.id);
 const example=review.decisions.find(d=>d.id==='rogue');assert.throws(()=>applyFarmClassScope([{id:'rogue',category:'Weapons',wikiUrl:example.wikiUrl}],review),/identity mismatch/);
 const broken=structuredClone(review);broken.decisions[0].evidence.sourceHash='wrong';assert.throws(()=>applyFarmClassScope([],broken),/Changed Class scope source/);
 assert.deepEqual(applyFarmClassScope([{id:'unrelated',category:'Weapons'}],review),[{id:'unrelated',category:'Weapons'}]);
});
