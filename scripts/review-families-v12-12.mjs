import fs from 'node:fs';
import {parseClassPage} from './lib/calendar-class-parser.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const baseline='content-sources/v12-12/before.json';
if(!fs.existsSync(baseline))fs.writeFileSync(baseline,JSON.stringify({catalog:read('src/content/classes/catalog.json'),families:read('src/content/classes/calendar-families.json'),bossThemes:read('src/content/presentation/bosses.json')},null,2)+'\n');
const registry=read('src/content/classes/skill-registry.json');
const groups=[
 {id:'chrono-quantum',year:2022,ids:['calendar-quantum-chronomancer','calendar-continuum-chronomancer'],names:['Quantum Chronomancer','Continuum Chronomancer'],line:9769,aliases:{'Quantum Mending':'Quantum Spiral'},reason:'Same eight skills and identical numeric mechanics; Rank 10 passive label differs, while both descriptions apply Quantum Spiral. Preserve the variant’s official passive name.'},
 {id:'chrono-corrupted',year:2019,ids:['calendar-corrupted-chronomancer','calendar-timeless-chronomancer'],names:['Corrupted Chronomancer','Timeless Chronomancer'],line:9719,aliases:{},reason:'Same skill names, descriptions, ranks, costs, cooldowns, ranges, targets and icons. Corrupted page additionally documents Hourglass of Transience branches; these remain conditional on the explicitly named consumables, not unconditional buffs.'},
 {id:'chrono-underworld',year:2020,ids:['calendar-underworld-chronomancer','calendar-overworld-chronomancer'],names:['Underworld Chronomancer','Overworld Chronomancer'],line:9736,aliases:{},reason:'Same active/passive names, ranks, costs, cooldowns, ranges, targets, notes and icons. Auto/nuke descriptions are wording variants: weapon damage plus equipped hourglasses, and Temporal Rift damage from the past 10 seconds consuming the stacks.'},
];
const fields=['officialName','rank','skillType','manaCost','cooldown','target','officialDescription','notes'];
const reviews=[];
for(const g of groups){
 const pages=[];
 for(const id of g.ids)pages.push(await parseClassPage(registry.classes[id].sourceUrl));
 if(pages.some(p=>p.entries.length!==8))throw Error('Expected exact eight-skill evidence');
 if(!pages[1].sameSkillVariants.some(v=>v.url.replace(/^http:/,'https:')===pages[0].url))throw Error('No explicit same-skill Wiki declaration');
 const diff=[];
 const A=pages[0].entries,B=pages[1].entries;
 for(const a of A){const b=B.find(b=>(g.aliases[b.officialName]||b.officialName)===a.officialName);if(!b)throw Error('No exact named skill match');for(const field of fields)if(JSON.stringify(a[field])!==JSON.stringify(b[field]))diff.push({skill:a.officialName,field,primary:a[field],alternative:b[field]});}
 const numeric=['rank','skillType','manaCost','cooldown','target'];
 if(diff.some(d=>numeric.includes(d.field)))throw Error('Do not merge mechanically different skills');
 const rA=registry.skills.filter(s=>s.classId===g.ids[0]),rB=registry.skills.filter(s=>s.classId===g.ids[1]);
 for(const a of rA){const b=rB.find(b=>(g.aliases[b.officialName]||b.officialName)===a.officialName);if(!b||a.iconAssetId!==b.iconAssetId)throw Error('Icon identity differs without a reviewed skin mapping');}
 reviews.push({...g,primaryClassId:g.ids[0],sources:pages.map(p=>({url:p.url,sourceHash:p.sourceHash,sameSkillVariants:p.sameSkillVariants})),differences:diff,verificationStatus:'verified',verifiedAt:'2026-11-11'});
}
fs.writeFileSync('src/content/classes/family-equivalence-reviews.json',JSON.stringify(reviews,null,2)+'\n');
const families=read('src/content/classes/calendar-families.json');
for(const g of groups)if(!families.some(f=>f.id===g.id))families.push({id:g.id,year:g.year,primaryClassId:g.ids[0],sharedSkillSetId:g.id,sharedComboSetId:g.id,equivalenceReviewId:g.id,variants:g.ids.map((id,i)=>({id:id.replace(/^calendar-/,''),classId:id,name:g.names[i],source:registry.classes[id].sourceUrl}))});
families.sort((a,b)=>a.year-b.year||a.id.localeCompare(b.id));
fs.writeFileSync('src/content/classes/calendar-families.json',JSON.stringify(families,null,2)+'\n');
console.log('Reviewed and added',groups.length,'families. Distinct 2019 and 2020 mechanics remain separate.');
