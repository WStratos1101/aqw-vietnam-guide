import fs from 'node:fs';
import {createHash} from 'node:crypto';
export function applyRecoveredFarmMetadata(items,pages,specs){
 const changed=[];
 for(const spec of specs){
  const item=items.find(i=>i.id===spec.id&&i.wikiUrl===spec.url),page=pages.get(spec.url);
  if(!item||!page||page.sourceHash!==spec.sourceHash||createHash('sha256').update(fs.readFileSync(spec.sourceFile)).digest('hex')!==spec.sourceHash)throw Error('Unverified metadata identity/hash '+spec.id);
  if(spec.quotes.some(q=>!page.text.includes(q)))throw Error('Changed metadata quotation '+spec.id);
  const html=fs.readFileSync(spec.sourceFile,'utf8');
  if(spec.membership){
   const tags=spec.membership==='member'?['legend','legendpet']:['freeplayer','freeplayerpet','legendarea-free'];
   if(!tags.includes(spec.membershipTag)||!html.includes('/tag/'+spec.membershipTag+'#'))throw Error('Unverified metadata membership '+spec.id);
   item.membership=spec.membership;if(item.wikiDetails)item.wikiDetails.membership=spec.membership;
  }
  if(spec.rarity){item.rarity=spec.rarity;if(item.wikiDetails)item.wikiDetails.rarity=spec.rarity;}
  if(spec.descriptionVi){item.descriptionVi=spec.descriptionVi;if(item.wikiDetails){item.wikiDetails.descriptionVi=spec.descriptionVi;item.wikiDetails.evidence.translationStatus='reviewed_translation';}}
  if(spec.boostReviewStatus){
   if(spec.boostReviewStatus==='none'&&(!spec.absenceEvidence||item.category==='Classes'&&!spec.absenceEvidence.combatPercentagesExcluded))throw Error('Unproved no-boost review '+spec.id);
   item.boostReviewStatus=spec.boostReviewStatus;
   item.boosts=(spec.boosts||[]).map(b=>({...b,source:spec.url,sourceHash:spec.sourceHash,scope:'equipped'}));
  }
  item.recoveredMetadataEvidence={sourceUrl:spec.url,sourceFile:spec.sourceFile,sourceHash:spec.sourceHash,quotes:spec.quotes,absenceEvidence:spec.absenceEvidence||null};
  changed.push(spec.id);
 }
 return changed;
}

// Percentages are read only in explicit equipment-effect clauses. Combat skill
// descriptions never enter this extractor. Unknown wording/tags stay pending.
export function extractEquippedBoosts(row){
 if(row.category==='Classes')return null;
 const clauses=row.equipmentLines.filter(l=>/\d+(?:\.\d+)?%/.test(l));
 const boosts=[];
 const add=(kind,percent,targets)=>{if(!boosts.some(b=>b.kind===kind&&b.percent===percent&&JSON.stringify(b.targets)===JSON.stringify(targets)))boosts.push({kind,percent,...(targets?{targets}: {})});};
 for(const line of clauses){
  for(const m of line.matchAll(/(\d+(?:\.\d+)?)% (?:more )?damage to ([^.;)]+?)(?=\s+(?:when equipped|and gives)|[.;)]|$)/gi)){
   const targets=[...m[2].matchAll(/\b(Chaos|Undead|Human|Dragon|Elemental)\b/gi)].map(m=>m[1][0].toUpperCase()+m[1].slice(1).toLowerCase());
   if(/all monsters|any monster/i.test(m[2]))add('damageToAll',Number(m[1]));
   else if(targets.length&&!/Drakath|all tagged/i.test(m[2]))add('damageToTagged',Number(m[1]),targets);
  }
  for(const m of line.matchAll(/(\d+(?:\.\d+)?)% (?:more |bonus to |boost to )?((?:Class Points?|CP|EXP|XP|Gold|rep(?:utation)?)(?:[, /]*(?:and )?(?:Class Points?|CP|EXP|XP|Gold|rep(?:utation)?))*)/gi)){
   for(const [re,kind] of [[/class points?|\bcp\b/i,'classPoints'],[/\bexp\b|\bxp\b/i,'experience'],[/\bgold\b/i,'gold'],[/\brep(?:utation)?\b/i,'reputation']])if(re.test(m[2]))add(kind,Number(m[1]));
  }
 }
 const requiredTags=row.tags.filter(t=>/^(?:xdmg2|cpboost$|goldboost$|repboost$|xpboost$)/.test(t));
 const covered=requiredTags.every(tag=>tag==='cpboost'?boosts.some(b=>b.kind==='classPoints'):tag==='goldboost'?boosts.some(b=>b.kind==='gold'):tag==='repboost'?boosts.some(b=>b.kind==='reputation'):tag==='xpboost'?boosts.some(b=>b.kind==='experience'):tag==='xdmg2monsters'?boosts.some(b=>b.kind==='damageToAll'):boosts.some(b=>b.targets?.some(t=>tag==='xdmg2'+t.toLowerCase())));
 return boosts.length&&covered?boosts:null;
}
