#!/usr/bin/env node
/** Offline, read-only V12.12 audit for AQW Vietnam Guide. No network / D1 calls. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const profiles = readJson('src/content/classes/catalog.json');
const identities = readJson('src/content/classes/abbreviations-runtime.json');
const families = readJson('src/content/classes/calendar-families.json');
const membership = readJson('src/content/classes/calendar-membership.json');
const variantRuntime = readJson('src/content/classes/calendar-variant-runtime.json');
const bossColors = readJson('src/content/presentation/bosses.json');
const byId = new Map(profiles.map(p => [p.id,p]));
const issues = [];
const warnings = [];
const fail = message => issues.push(message);
const warn = message => warnings.push(message);

function pathFound(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('/')) return false;
  const resolved = path.resolve(root, 'public', '.' + url);
  if (!resolved.startsWith(path.resolve(root,'public') + path.sep)) return false;
  return fs.existsSync(resolved);
}
function cleanName(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
const memberSet = new Set(membership.map(m=>m.classId));
const familyOwners = new Map();
const primarySet = new Set();
let verifiedFamilyVariants = 0;
let missingArt = 0;
let missingVariantIdentity = 0;
for(const family of families) {
  if(!family.id || !Number.isInteger(family.year)) fail(`Invalid family metadata: ${family.id}`);
  if(!byId.has(family.primaryClassId)) fail(`Missing primary profile: ${family.id} / ${family.primaryClassId}`);
  if(primarySet.has(family.primaryClassId)) fail(`Duplicate primary: ${family.primaryClassId}`);
  primarySet.add(family.primaryClassId);
  for(const variant of family.variants ?? []) {
    verifiedFamilyVariants++;
    if(!byId.has(variant.classId)) fail(`Missing Class profile: ${family.id}/${variant.classId}`);
    if(!variant.source?.startsWith('https://')) warn(`Missing source: ${family.id}/${variant.name}`);
    if(familyOwners.has(variant.classId) && familyOwners.get(variant.classId)!==family.id)
      fail(`Class in two families: ${variant.classId}`);
    familyOwners.set(variant.classId,family.id);
    const row = identities.find(i=>i.classId === variant.classId && cleanName(i.officialName) === cleanName(variant.name));
    if(!row?.primaryAbbreviation) { missingVariantIdentity++; warn(`Unverified variant abbreviation: ${variant.name}`); }
    const data = variantRuntime[variant.id];
    if(!data?.portrait?.imagePath || !pathFound(data.portrait.imagePath)) {
      missingArt++;
      warn(`Missing verified local variant portrait: ${variant.name} (${data?.portrait?.imagePath||'none'})`);
    }
  }
}
const groupedIds = new Set(families.flatMap(f=>f.variants.map(v=>v.classId)));
const directoryCards = profiles.filter(p=>!groupedIds.has(p.id) || primarySet.has(p.id));
for(const f of families) {
  const count = directoryCards.filter(p=>p.id===f.primaryClassId).length;
  if(count !== 1) fail(`Family card count must be one: ${f.id} → ${count}`);
}
const expected = [
  ['chrono-corrupted',['calendar-corrupted-chronomancer','calendar-timeless-chronomancer']],
  ['chrono-underworld',['calendar-underworld-chronomancer','calendar-overworld-chronomancer']],
  ['chrono-quantum',['calendar-quantum-chronomancer','calendar-continuum-chronomancer']],
  ['timekeeper-timekiller',['calendar-timekeeper','calendar-timekiller']],
  ['chrono-shadow-gunslinger',['calendar-chrono-shadowslayer','calendar-chrono-shadowhunter']]
];
for(const [id,required] of expected) {
  const family = families.find(f=>f.id===id);
  if(!family) {fail(`Missing expected family: ${id}`);continue;}
  for(const requiredId of required)
    if(!family.variants.some(v=>v.classId===requiredId))fail(`${id}: missing ${requiredId}`);
}
const missingAbbreviations = identities.filter(i=>!i.primaryAbbreviation)
  .map(i=>({classId:i.classId,name:i.officialName}));
const palette = [
  ['ultra-dage','blue'],
  ['gramiel-the-graceful','gold'],
  ['ultra-nulgath','red'],
  ['champion-drakath','purple'],
  ['ultra-speaker','red']
];
function colorChannel(hex){if(!/^#[a-f\d]{6}$/i.test(hex || ''))return null;return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function identityHue(rgb,hue){
  if(!rgb)return false;
  const [r,g,b]=rgb;
  if(hue==='blue')return b>r && g>r;
  if(hue==='gold')return r>g && g>b;
  if(hue==='red')return r>g && r>b;
  if(hue==='purple')return b>g && r>g;
  return true;
}
for(const [id,hue] of palette){
  const record=bossColors[id];
  if(!record){fail(`Missing Boss presentation: ${id}`);continue;}
  for(const mode of ['dark','light']){
    if(!identityHue(colorChannel(record[mode]),hue))fail(`${id}/${mode} is not ${hue}: ${record[mode]}`);
  }
}
const css = fs.readFileSync(path.join(root,'src/styles/v12-12-overrides.css'),'utf8');
const main = fs.readFileSync(path.join(root,'src/main.tsx'),'utf8');
if(!main.includes('"./styles/v12-12-overrides.css"'))fail('v12-12 CSS is not imported from main.tsx');
if(!css.includes('--boss-accent-dark')||!css.includes('--boss-accent-light'))fail('Missing per-mode Boss palette override');
if(!css.includes('object-fit: contain'))fail('Missing full-art containment rules');
const report = {
  project: 'AQW Vietnam Guide',
  version: 'V12.12',
  checkedAt: new Date().toISOString(),
  totalProfiles: profiles.length,
  calendarFamilyCount: families.length,
  calendarVariantRecords: verifiedFamilyVariants,
  deduplicatedDirectoryCardCount: directoryCards.length,
  calendarMembershipClassCount: memberSet.size,
  missingAbbreviations,
  missingVariantIdentity,
  missingLocalVariantPortraits: missingArt,
  verifiedBossPaletteEntries: palette.length,
  issues,
  warnings
};
if(process.argv.includes('--json')) console.log(JSON.stringify(report,null,2));
else {
  console.log('AQW V12.12 — Read-only audit');
  console.log(`Profiles: ${report.totalProfiles} · Calendar families: ${report.calendarFamilyCount} · Variant entries: ${verifiedFamilyVariants} · Directory cards after family grouping: ${directoryCards.length}`);
  console.log(`Abbreviation entries without source-backed acronym: ${missingAbbreviations.length} (not invented)`);
  console.log(`Missing variant art: ${missingArt} · Family variant abbreviations pending: ${missingVariantIdentity}`);
  if(issues.length) console.log('\nERRORS\n'+issues.map(x=>' - '+x).join('\n'));
  if(warnings.length) console.log('\nPENDING VERIFICATION\n'+warnings.slice(0,60).map(x=>' - '+x).join('\n')+(warnings.length>60?`\n ... ${warnings.length-60} more`:''));
  console.log(`\nResult: ${issues.length?'FAILED':'PASS'} with ${warnings.length} pending warnings.`);
}
process.exitCode=issues.length?1:0;
