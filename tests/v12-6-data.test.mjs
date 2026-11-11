import {pickOtherClasses}from'../src/lib/other-classes.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash}from'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p));const catalog=read('src/content/challenges/catalog.json');
test('Challenge catalog has four distinct dungeons, twelve Gaol screens and scoped combat data',()=>{
 assert.equal(catalog.filter(c=>c.type==='dungeon').length,4);assert.equal(new Set(catalog.map(c=>c.id)).size,catalog.length);
 for(const c of catalog){const body=read('public'+c.bodyUrl);assert.equal(body.id,c.id);assert.equal(body.stages.length,c.stageCount);for(const s of body.stages){assert.ok(s.source&&s.sourceBlocks.length);for(const a of s.encounter?.activeSkills||[])assert.ok(s.encounter.monsters.some(m=>m.id===a.monsterId));}}
 const gaol=read('public/content/challenges/the-gaol-of-eternal-torment-and-misery.json');assert.equal(gaol.stages.length,12);assert.equal(gaol.stages[3].stageType,'treasure');assert.equal(gaol.stages[7].stageType,'treasure');assert.ok(!gaol.stages.some(s=>s.name.includes('2.0')));
 const shrine=read('public/content/challenges/shrine-of-the-midnight-sun.json');assert.deepEqual(shrine.stages[0].encounter.monsters.map(m=>m.canonicalName),['Dying Light','Shining Star']);assert.ok(shrine.stages[0].encounter.monsters.find(m=>m.canonicalName==='Shining Star').maxHp>2000);
 const e=read('public/content/challenges/ascension-of-the-eclipse.json');assert.equal(e.progressionRelation.parallel,true);assert.ok(e.unlockRequirements.some(s=>s.includes('Victor of the Festival')));
});
test('King Draco display mapping retains official monster, map and equipment identity',()=>{
 const summaries=read('src/content/route-summaries.json');const text=JSON.stringify(summaries);assert.ok(text.includes('King Draco'));
 const mapping=fs.readFileSync('src/lib/boss-names.ts','utf8');assert.ok(mapping.includes('King Drago'));assert.ok(mapping.includes('/join ultradrago'));
 const r=read('src/content/ultra/recovery.json');assert.ok(JSON.stringify(r.routeOverrides['ultra-drago']).includes("Prince Darkon's Poleaxe"));
});
test('Calendar extension has exact named skill evidence and valid local portraits',()=>{
 const x=read('src/content/classes/calendar-extension.json'),r=read('src/content/classes/skill-registry.json');assert.ok(x.profiles.length>=12);
 for(const c of x.profiles){assert.ok(x.calendar.some(e=>e.classId===c.id||e.newClassId===c.id));const records=x.records.filter(s=>s.classId===c.id);assert.ok(records.filter(s=>!s.passive).length>=5);for(const s of records){assert.equal(s.evidence.name,s.officialName);assert.ok(r.skills.some(t=>t.classId===c.id&&t.skillId===s.skillId));}assert.ok(fs.existsSync('public'+x.portraits.find(a=>a.id===c.image).imagePath));}
});
test('Class art is sourced per Class, with byte identity and no gameplay substitution',()=>{
 const a=read('src/content/classes/art-variants.json');assert.equal(new Set(a.map(x=>x.id)).size,a.length);
 for(const x of a){assert.ok(['art','class_skin'].includes(x.variantType));assert.equal(x.skillSetId,x.classId);assert.equal(x.iconSetId,x.classId);assert.match(x.source,/aqwwiki.wikidot.com/);assert.ok(x.sourceHash);assert.equal(createHash('sha256').update(fs.readFileSync('public'+x.imagePath)).digest('hex'),x.sha256);}
});

test('Other Classes chooses four unique valid routes and excludes current identity',()=>{const c=read('src/content/classes/catalog.json');for(const p of c){const other=pickOtherClasses(c,p.id,()=>0.42);assert.equal(other.length,4);assert.equal(new Set(other.map(x=>x.id)).size,4);assert.ok(!other.some(x=>x.id===p.id));assert.ok(other.every(x=>c.some(y=>y.id===x.id&&y.slug===x.slug)));}assert.deepEqual(pickOtherClasses([c[0]],c[0].id),[]);});

test('Arena keeps exact observed order and marks unreadable encounters instead of borrowing stats',()=>{const b=read('public/content/challenges/infernal-battle-arena.json');assert.equal(b.stages.length,22);assert.deepEqual(b.stages.slice(0,3).map(s=>s.name),['Infernal Mage','Infernal Revenger','Infernal Harbinger']);assert.deepEqual(b.stages.slice(-5).map(s=>s.name),['DEADLY DUO','CERVUS MALUS','KEY OF SHOLEMOH',"AZALITH'S SCYTHE","NA'AL"]);const d=b.stages.find(s=>s.name==='Destructive Defiler');assert.equal(d.encounter.monsters[0].maxHp,125000);assert.equal(d.encounter.activeSkills[0].damage,'406–493');assert.equal(d.encounter.activeSkills[0].damageType,undefined);for(const s of b.stages)for(const a of s.encounter?.activeSkills||[])assert.ok(!JSON.stringify(a).includes('{$'));});

test('Calendar acquisition stays within Class identity rather than all same-skills variants',()=>{const r=read('src/content/classes/skill-registry.json'),d=read('src/content/classes/acquisition.json'),norm=s=>s.replace(/\([^)]*\)/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');for(const c of read('src/content/classes/calendar-extension.json').profiles)for(const m of d.classes[c.id].methods)assert.ok(r.classes[c.id].candidateUrls.includes(m.source)||norm(m.variantName)===norm(c.name),c.name+' / '+m.variantName);const m=d.classes['calendar-chronocommander'].methods[0];assert.equal(m.shop.price.amount,0);assert.ok(m.prerequisites.some(p=>/purchased.*2014 Calendar/.test(p)));});
