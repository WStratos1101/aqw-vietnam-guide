import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p));const recovery=read('src/content/ultra/recovery.json');
const aliasIds=new Set(Object.keys(recovery.equipmentAliases||{}).map(n=>n.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'')));
const equipment=Object.values({...read('src/content/ultra/equipment.json').entities,...recovery.equipment}).filter(e=>!aliasIds.has(e.id)&&!recovery.legacyEquipmentGroups.includes(e.id));
const weapons=equipment.filter(e=>e.equipmentType==='weapon');const counts=weapons.reduce((o,e)=>(o[e.weaponStability]=(o[e.weaponStability]||0)+1,o),{});
let md='# Weapon Stability — V11\n\nVersion 0.1.0. Exact source-backed display rules: min=max → Stable; Wiki DefaultDmg 27–33 → Normal; Wiki HighDmg 0–60 → Unstable under the explicit V11 editorial convention. Other ranges remain unknown; no arbitrary numeric threshold. Image tab labels are never classification evidence.\n\n';
md+=weapons.length+' canonical weapons: '+JSON.stringify(counts)+'. Non-weapons have no displayed Stability.\n\n| Weapon | Base damage | Wiki category | Display | Source |\n|---|---|---|---|---|\n';
for(const e of weapons){const r=e.weaponDamageRange;md+=`| ${e.name} | ${r?`${r.minimum}–${r.maximum}`:'needs_verification'} | ${r?.officialRangeCategory||'unknown'} | ${e.weaponStability} | ${r?.source||e.source||'unknown'} |\n`;}
md+='\n## Still needs verification\n\n'+weapons.filter(e=>e.weaponStability==='unknown').map(e=>'- '+e.name).join('\n')+'\n\nRule evidence: content-sources/recovery/v11-range-mapping.json. This report does not describe image variants or rarity.\n';
fs.writeFileSync('WEAPON_STABILITY_AUDIT.md',md);
const imageFile='EQUIPMENT_IMAGE_AUDIT.md',images=fs.readFileSync(imageFile,'utf8').split('\n## V11 selector verification')[0];
fs.writeFileSync(imageFile,images+'\n## V11 selector verification\n\nAll canonical equipment retains the approved manifest reference. V11 uses one selected large preview, category-icon fallback and a horizontal thumbnail strip; no remote hotlinks were introduced. Browser execution results: qa/v11/browser-report.json and qa/recovery/browser-report.json. Stability is audited separately in WEAPON_STABILITY_AUDIT.md.\n');
const bossFile='BOSS_COMPLETION_AUDIT.md',bossAudit=fs.readFileSync(bossFile,'utf8').split('\n## V11 source review')[0];
fs.writeFileSync(bossFile,bossAudit+'\n## V11 source review\n\nSix encounters retain unresolved combat/quest/Taunt fields. Rechecking sources did not supply missing numeric damage or resolve the Judged conflict; none were promoted to complete. Field-level reasons and access limits: content-sources/recovery/v11-combat-review.json. Public source-list sections are removed; internal source metadata and Artix credits remain.\n');
console.log({canonicalEquipment:equipment.length,weapons:weapons.length,stability:counts,unknown:weapons.filter(e=>e.weaponStability==='unknown').map(e=>e.name)});
