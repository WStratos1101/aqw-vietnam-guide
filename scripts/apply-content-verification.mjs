import fs from 'node:fs';
import {translateCombatText} from '../src/lib/combat-copy.mjs';
import {equipmentCategory} from '../src/lib/equipment-category.mjs';
import {weaponStability} from '../src/lib/weapon-stability.mjs';
import {applyReviewedCombat} from './apply-reviewed-combat.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const evidence=read('content-sources/recovery/content-verification.json'),bosses=read('src/content/ultra/bosses.json'),recovery=read('src/content/ultra/recovery.json'),inspection=read('src/content/ultra/inspection.json');
const baseLoadouts=read('src/content/ultra/team-loadouts.json'),aliasEvidence=read('content-sources/recovery/class-alias-confirmations.json');
const equipment=read('src/content/ultra/equipment.json'),rangeEvidence=read('content-sources/recovery/v11-range-mapping.json');
for(const e of [...Object.values(equipment.entities),...Object.values(recovery.equipment)]){
 e.equipmentType=equipmentCategory(e.equipmentType||e.category);e.category=e.equipmentType;
 if(e.equipmentType==='weapon'&&e.weaponDamageRange){const mapped=weaponStability(e.weaponDamageRange);e.weaponStability=mapped.classification;e.weaponDamageRange.classification=mapped.classification;
  if(mapped.rule)e.weaponDamageRange.classificationEvidence={...rangeEvidence.rules[mapped.rule],sourceUrl:rangeEvidence.sourceUrl,verifiedAt:rangeEvidence.verifiedAt,rule:mapped.rule};
 }
}
for(const b of [...bosses,...recovery.bosses])for(const r of b.equipmentRoutes)r.category=equipmentCategory(recovery.equipment[r.canonicalId]?.equipmentType||equipment.entities[r.canonicalId]?.equipmentType||r.category);
for(const routes of Object.values(recovery.routeOverrides))for(const r of routes)r.category=equipmentCategory(recovery.equipment[r.canonicalId]?.equipmentType||equipment.entities[r.canonicalId]?.equipmentType||r.category);
write('src/content/ultra/equipment.json',equipment);
for(const b of [...bosses,...recovery.bosses]){const q=evidence.questAcceptance[b.slug];if(q){b.questAcceptanceEvidence={...q,verifiedAt:q.confidenceStatus==='verified'?evidence.reviewedAt:null};if(q.confidenceStatus==='verified'){b.questRequirements=q.requirements;if(!b.sources.some(s=>s.url===q.sourceUrl))b.sources.push({id:'reviewed-quest-access',title:'Điều kiện nhận Quest',url:q.sourceUrl,kind:'community',verified:evidence.reviewedAt});}}const t=evidence.tauntVerification[b.slug];if(t){const detail=recovery.details[b.slug];if(detail)detail.tauntVerification={...t,verifiedAt:t.status==='needs_verification'?null:evidence.reviewedAt};}}
for(const conflict of evidence.attackConflicts){const s=inspection[conflict.boss].activeSkills.find(s=>s.id===conflict.skillId);s.confidenceStatus='conflicting';s.sourceMetadata=conflict;s.type='Physical / True Damage — nguồn mâu thuẫn';delete s.damageType;}
for(const enc of [...Object.values(inspection),...Object.values(recovery.inspection)])for(const s of enc.activeSkills){s.confidenceStatus??=s.damageType?'verified':'needs_verification';for(const k of ['activation','damage'])if(s[k])s[k]=translateCombatText(s[k]);for(const k of ['playerEffects','bossEffects'])s[k]=(s[k]||[]).map(translateCombatText);}
for(const [slug,enc]of Object.entries(recovery.inspection))for(const s of enc.activeSkills){s.confidenceStatus=s.damageType?'verified':!s.damage&&(s.type?.includes('Status')||s.type==='Charge')?'not_applicable':'needs_verification';}
for(const enc of [...Object.values(inspection),...Object.values(recovery.inspection)])for(const s of enc.activeSkills){s.damageConfidenceStatus=s.damage&&!/Chưa xác minh/.test(s.damage)?'verified':!s.damage&&s.confidenceStatus==='not_applicable'?'not_applicable':'needs_verification';if(s.confidenceStatus==='conflicting')s.damageConfidenceStatus='conflicting';}
const soul=inspection['ultra-nulgath'].passiveSkills.find(s=>s.id==='soul');
if(soul){soul.sourceNotes??=soul.effect;soul.name='A soul unripe for harvest';soul.effect='Không tạo hiệu ứng bổ sung khi người chơi chết tức thì.';}
for(const encounters of [baseLoadouts.encounters,recovery.teamLoadouts])for(const teams of Object.values(encounters))for(const slots of Object.values(teams))for(const slot of slots){for(const c of [slot.primaryClass,...slot.alternativeClasses]){if(c.name==='EDoT'||c.name==='Dragon of Time'){c.name='Dragon of Time';c.classId='dragon-of-time';c.abbreviation='DT';c.aliases=['EDoT'];c.aliasEvidence=aliasEvidence;c.confidenceStatus='verified';}}const seen=new Set([slot.primaryClass.classId]);slot.alternativeClasses=slot.alternativeClasses.filter(c=>{if(seen.has(c.classId))return false;seen.add(c.classId);return true;});}
for(const b of [...bosses,...recovery.bosses])for(const t of b.recommendedTeams){const slots=({...baseLoadouts.encounters,...recovery.teamLoadouts})[b.slug]?.[t.id];if(slots)t.classes=t.classes.map((c,i)=>({...c,className:slots[i].primaryClass.name,alternatives:slots[i].alternativeClasses.map(c=>c.name)}));}
applyReviewedCombat(recovery);
write('src/content/ultra/team-loadouts.json',baseLoadouts);
write('src/content/ultra/bosses.json',bosses);write('src/content/ultra/recovery.json',recovery);write('src/content/ultra/inspection.json',inspection);
console.log('Reviewed quest acceptance and explicit source conflicts applied; unresolved fields remain flagged.');
