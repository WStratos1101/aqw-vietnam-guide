import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const recovery=JSON.parse(fs.readFileSync('src/content/ultra/recovery.json')),enc=recovery.inspection['darkon-the-conductor'];
const skill=(name,phase)=>enc.activeSkills.find(s=>s.name===name&&(!phase||s.phase===phase));
test('Darkon keeps all official skills and all three distinct phase variants',()=>{
 assert.equal(enc.activeSkills.length,13);assert.equal(new Set(enc.activeSkills.map(s=>s.id)).size,13);
 for(const phase of ['Overture','Recitative','Aria'])for(const name of ['Special 1','Special 2']){const s=skill(name,phase);assert.ok(s);assert.equal(s.name,name);assert.ok(s.activation.includes(phase)||phase==='Overture');assert.equal(s.review.sourceUrl,enc.monsters[0].source);}
 assert.deepEqual(skill('Auto Attack').phaseEffects.map(p=>p.phase),['Overture','Recitative','Aria']);
});
test('Special 1 uses CURRENT HP in every phase and preserves shared source numbers',()=>{
 for(const phase of ['Overture','Recitative','Aria']){const s=skill('Special 1',phase);assert.equal(s.damage,'90% HP hiện tại');assert.equal(s.cooldown,'12 giây');assert.equal(s.damageType,'True Damage');assert.equal(s.targets,'1');assert.ok(s.playerEffects.includes('Luôn trúng; không chí mạng.'));}
 for(const s of enc.activeSkills.filter(s=>s.name==='Special 2')){assert.equal(s.damage,'150 (trước hệ số sát thương chí mạng)');assert.equal(s.cooldown,'5 giây');assert.equal(s.targets,'4');}
});
test('Boss buffs never appear in player effects; Aria keeps all independent timers',()=>{
 const aria=skill('Aria');assert.equal(aria.damageType,'Physical');assert.equal(aria.damage,undefined);assert.equal(aria.damageConfidenceStatus,'needs_verification');assert.ok(aria.activation.includes('20%'));
 assert.ok(aria.bossEffects.some(e=>e.includes('90% HP tối đa')&&e.includes('Decay')));
 for(const [name,value,duration]of [['A Major','5000%','10 giây'],['B Minor','200%','20 giây'],['C Minor','300%','30 giây'],['B Major','200%','50 giây'],['C Major','1000%','50 giây']]){assert.ok(aria.bossEffects.some(e=>e.startsWith(name+':')&&e.includes(value)&&e.includes(duration)),name);assert.ok(!aria.playerEffects.some(e=>e.includes(name)),name);}
 assert.equal(skill("The Cycle's End").playerEffects.length,0);assert.ok(skill("The Cycle's End").bossEffects[0].includes('10%'));
 assert.ok(skill('Special 1','Recitative').bossEffects[0].includes('Child of the Empress'));assert.ok(!skill('Special 1','Recitative').playerEffects.some(e=>e.includes('Child of the Empress')));
});
test('Recitative chain, Aria debuffs and global enrage remain separate',()=>{
 const seed=skill('Special 2','Recitative').playerEffects.join(' ');for(const name of ['Seed Planted','Realm of the Arcana','Grown','Harvested'])assert.ok(seed.includes(name));assert.ok(seed.includes('Crit Chance 1000 và'));assert.ok(!seed.includes('Crit Chance 1000%'));
 assert.ok(skill('Special 1','Aria').playerEffects.some(e=>e.includes('The Last Symphony')&&e.includes('8 giây')));
 assert.ok(skill('Special 2','Aria').playerEffects.some(e=>e.includes('25%')&&e.includes('12 giây')&&e.includes('22')));
 const charge=skill('End of the World');assert.ok(charge.activation.includes('4 phút 30 giây')&&charge.activation.includes('3 giây'));assert.equal(charge.nextSkillId,skill('Curtain Call').id);assert.equal(skill('Curtain Call').damage,'100.000.337');
});
test('Darkon passives and unknown values do not acquire fabricated numbers or Decay rules',()=>{
 assert.equal(enc.passiveSkills.length,4);const ex=enc.passiveSkills.find(p=>p.name==='Exeunt');assert.ok(ex.effect.includes('750.000'));assert.ok(!ex.effect.includes('Decay'));
 const base=enc.passiveSkills.find(p=>p.id==='boss-base-stats');assert.ok(base.values.includes('800% Crit Damage'));assert.ok(base.values.includes('200% kháng DoT'));assert.ok(base.values.some(v=>v.startsWith('Hit Chance:')&&v.includes('chưa có số')));
 assert.ok(recovery.details['darkon-the-conductor'].notes.every(n=>!n.text.includes('Không dùng Vainglory')));
});
