import fs from 'node:fs';
import crypto from 'node:crypto';
export function applyReviewedCombat(recovery){
 for(const file of ['darkon-combat-reviewed']){
  const review=JSON.parse(fs.readFileSync(`content-sources/recovery/${file}.json`));
  const snapshot=JSON.parse(fs.readFileSync(`content-sources/recovery/${review.encounter}.json`));
  const hash=crypto.createHash('sha256').update(snapshot.text).digest('hex');
  if(hash!==review.snapshotSha256)throw Error('Monster source changed; review combat facts again before importing: '+review.encounter);
  const encounter=recovery.inspection[review.encounter];
  if(!encounter||encounter.activeSkills.length!==review.skills.length)throw Error('Reviewed skill inventory changed: '+review.encounter);
  const used=new Set();
  for(const entry of review.skills){
   const skill=encounter.activeSkills.filter(s=>s.name===entry.name)[entry.occurrence];
   if(!skill||used.has(skill.id)||skill.source!==review.source)throw Error('Reviewed skill selector/source mismatch: '+entry.name);
   used.add(skill.id);
   for(const key of ['type','activation','cooldown','damage','damageType','targets','playerEffects','bossEffects','phase','phaseEffects']){delete skill[key];if(entry[key]!==undefined)skill[key]=entry[key];}
   skill.confidenceStatus='verified';skill.damageConfidenceStatus=entry.damageConfidenceStatus;
   skill.typeConfidenceStatus=entry.type?'verified':'needs_verification';
   skill.explanationStatus='reviewed';skill.review={sourceUrl:review.source,verifiedAt:review.reviewedAt,confidenceStatus:'verified',evidenceFile:file+'.json'};
   if(entry.nextSkill)skill.nextSkillId=encounter.activeSkills.find(s=>s.name===entry.nextSkill)?.id;
  }
  if(encounter.passiveSkills.length!==review.passives.length)throw Error('Reviewed passive inventory changed');
  for(const patch of review.passives){const passive=encounter.passiveSkills.find(p=>p.id===patch.id);if(!passive)throw Error('Missing reviewed passive: '+patch.id);Object.assign(passive,patch,{source:review.source});}
  encounter.sourceReview={sourceUrl:review.source,verifiedAt:review.reviewedAt,communitySources:review.communitySources,conflicts:review.conflicts};
  const notes=recovery.details[review.encounter]?.notes;
  if(notes?.length){notes[0].text='Thống nhất lượt Taunt; tránh nhận liên tiếp hiệu ứng của Special 2.';notes[0].source=review.communitySources[0];}
 }
}
