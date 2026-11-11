import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateEquipment,validateQuestRoute,validateEncounter,canMarkComplete} from '../src/lib/content-validation.mjs';
import {classSourceParser} from '../src/lib/team-source.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));const recovery=read('src/content/ultra/recovery.json');
test('confirmed DT/EDoT alias deduplicates choices, never player slots',()=>{
 const aliases=read('src/data/team-class-aliases.json');
 assert.equal(aliases.CDK,'Chrono DragonKnight');
 assert.equal(aliases.DT,'Dragon of Time');assert.equal(aliases.EDoT,aliases.DT);
 const evidence=read('content-sources/recovery/class-alias-confirmations.json');
 assert.ok(JSON.stringify(evidence).includes('EDoT'));
 const base=read('src/content/ultra/team-loadouts.json').encounters;
 for(const teams of Object.values({...base,...recovery.teamLoadouts}))for(const slots of Object.values(teams))for(const slot of slots){
  const choices=[slot.primaryClass,...slot.alternativeClasses];
  assert.equal(new Set(choices.map(c=>c.classId)).size,choices.length);
  for(const c of choices){assert.notEqual(c.name,'EDoT');assert.ok(!/^\d+\s/.test(c.name));if(c.name==='Dragon of Time'){assert.equal(c.classId,'dragon-of-time');assert.equal(c.abbreviation,'DT');assert.ok(c.aliases.includes('EDoT'));}}
 }
 const team=base['ultra-nulgath']['source-team-3'];
 assert.equal(team.length,4);assert.equal(team.filter(s=>s.primaryClass.name==='Dragon of Time').length,2);
});
test('source Class lists and multiple explicit references retain their own team',()=>{
 const parser=classSourceParser(read('src/data/team-class-aliases.json'));
 assert.deepEqual(parser.header('→ CMP, TK và CMD mở đầu với 3 - 2'),['CMP','TK','CMD']);
 assert.deepEqual(parser.references('→ VHL, LR và LoO sử dụng tương tự Team 1. DT/EDoT sử dụng tương tự Team 3.').map(r=>[r.aliases,r.team]),[[['VHL','LR','LoO'],'source-team-1'],[['DT','EDoT'],'source-team-3']]);
 assert.deepEqual(parser.references('→ PCM, AP và LoO sử dụng như Team 1.')[0].aliases,['PCM','AP','LoO']);
 assert.deepEqual(parser.header('→ Cả Team tập trung gây sát thương'),[]);
});
test('a Status-labelled attack with published damage still needs its damage type verified',()=>{
 const lullaby=recovery.inspection['ultra-iara'].activeSkills.find(s=>s.name==='Lullaby');
 assert.ok(lullaby.damage);assert.equal(lullaby.damageType,undefined);
 assert.equal(lullaby.confidenceStatus,'needs_verification');
});
test('published equipment and routes reject incorrect recipes/ranges, unknown stays unknown',()=>{for(const e of Object.values(recovery.equipment))assert.deepEqual(validateEquipment(e),[],e.name);for(const rs of [...recovery.bosses.map(b=>b.equipmentRoutes),...Object.values(recovery.routeOverrides)])for(const r of rs)assert.deepEqual(validateQuestRoute(r),[],r.itemName);const bad={id:'x',name:'X',equipmentType:'armor',weaponStability:'stable',weaponDamageRange:{minimum:33,maximum:27}};assert.ok(validateEquipment(bad).length>=2);assert.ok(validateEquipment({id:'x',name:'X',equipmentType:'weapon',weaponStability:'normal',weaponDamageRange:{minimum:27,maximum:33,source:'wiki'}}).includes('Unsupported stability label'));});
test('dependency inversion and operator-as-item are actual failures',()=>{const q={id:'a',dependencies:['b'],repeatability:'weekly',items:['OR ×1']};assert.ok(validateQuestRoute({quests:[q]}).length>=2);});
test('Monster skills cannot borrow another Monster source or have invented damage types',()=>{const e={monsters:[{id:'boss',canonicalName:'Boss',source:'boss',level:1,maxHp:1}],activeSkills:[{monsterId:'boss',source:'add',damageType:'Charge'}],passiveSkills:[]};assert.ok(validateEncounter(e).length>=2);for(const e of Object.values(recovery.inspection))assert.deepEqual(validateEncounter(e),[]);});
test('conflicting and unresolved data can never become complete',()=>{assert.equal(canMarkComplete({source:'conflicting'}),false);assert.equal(canMarkComplete({source:'needs_verification'}),false);const inspection=read('src/content/ultra/inspection.json');const judged=inspection['ultra-drago'].activeSkills.find(s=>s.id==='judgement');assert.equal(judged.confidenceStatus,'conflicting');assert.equal(judged.damageType,undefined);});
test('Warden and Speaker loadouts resolve same-Class source references',()=>{const teams=read('src/content/ultra/team-loadouts.json').encounters;for(const slug of ['ultra-warden','ultra-speaker'])for(const slots of Object.values(teams[slug]))for(const c of slots.flatMap(s=>[s.primaryClass,...s.alternativeClasses])){assert.ok(c.enhancement.length,c.name);assert.ok(c.instructions.length,c.name);assert.ok(c.source);}const slots=Object.values(recovery.teamLoadouts['kolr-usurper-of-flames']).flat();assert.ok(slots.some(s=>[s.primaryClass,...s.alternativeClasses].some(c=>c.name==='Chrono DragonKnight')));});
test('quest access has separate provenance; Speaker weekly quest does not inherit Goddess prerequisites',()=>{const bosses=read('src/content/ultra/bosses.json');for(const slug of ['ultra-tyndarius','ultra-nulgath','ultra-drago','ultra-speaker']){const b=bosses.find(b=>b.slug===slug);assert.equal(b.questAcceptanceEvidence.confidenceStatus,'verified');assert.ok(b.questRequirements.length);assert.ok(b.accessRequirements.length);}const s=bosses.find(b=>b.slug==='ultra-speaker');assert.ok(s.questRequirements.some(r=>r.includes('90')));assert.ok(!s.questRequirements.some(r=>r.includes('Awescended')));});
