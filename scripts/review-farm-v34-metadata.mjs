import fs from 'node:fs';
import {farmBoostState} from '../src/lib/farm-details.mjs';
import {extractEquippedBoosts} from './lib/farm-metadata-recovery.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const parsed=read('Update/_offline-staging/20261117-081737/v3-4/metadata-parsed.json');
const items=read('src/content/farm/catalog-v2.generated.json').items;
const translations=new Map(read('content-sources/farm/refinement/v3-4-description-translations.json').map(r=>[r.sourceText,r.descriptionVi]));
const reviewFile='content-sources/farm/refinement/v3-4-metadata-review.json';
const previous=new Map((fs.existsSync(reviewFile)?read(reviewFile).records:[]).map(r=>[r.id,r]));
const records=[],pending=[];
for(const row of parsed.rows){
 const item=items.find(i=>i.id===row.id);if(!item)continue;
 const prior=previous.get(row.id);
 if(prior && prior.sourceHash!==row.sourceHash)throw Error('Metadata source revision needs review '+row.id);
 const spec=structuredClone(prior||{id:row.id,url:row.url,sourceFile:row.sourceFile,sourceHash:row.sourceHash,quotes:[]});
 if(!item.descriptionVi&&!item.wikiDetails?.descriptionVi&&translations.has(row.description)){spec.descriptionVi=translations.get(row.description);spec.quotes.push(row.description);}
 if(!item.rarity&&row.rarity){spec.rarity=row.rarity;spec.quotes.push('Rarity: '+row.rarity);}
 if(!['member','non-member'].includes(item.membership)&&row.membership){spec.membership=row.membership;spec.membershipTag=row.membershipTag;}
 if(farmBoostState(item)==='unverified'){
  const boosts=extractEquippedBoosts(row);
  if(boosts){spec.boosts=boosts;spec.boostReviewStatus='verified';spec.quotes.push(...row.equipmentLines);}
  else if(row.noBoost){spec.boosts=[];spec.boostReviewStatus='none';spec.absenceEvidence={scope:'Complete exact-item main body and page tags, including Description and Notes; no explicit equipped boost clause or equipped boost tag. Class skill, passive and base weapon percentages are combat data.',sourceHash:row.sourceHash,category:row.category,combatPercentagesExcluded:row.category==='Classes'};}
 }
 if(spec.descriptionVi||spec.rarity||spec.membership||spec.boostReviewStatus)records.push(spec);
 const missing=[];
 if(!item.descriptionVi&&!item.wikiDetails?.descriptionVi&&!spec.descriptionVi)missing.push('descriptionVi');
 if(farmBoostState(item)==='unverified'&&!spec.boostReviewStatus)missing.push('boost');
 if(!['member','non-member'].includes(item.membership)&&!spec.membership)missing.push('membership');
 if(!item.rarity&&!spec.rarity)missing.push('rarity');
 if(missing.length)pending.push({id:row.id,url:row.url,missing,reason:'No verified field/complete source wording; retained as unverified.'});
}
fs.writeFileSync('content-sources/farm/refinement/v3-4-metadata-review.json',JSON.stringify({schemaVersion:1,records},null,2)+'\n');
fs.writeFileSync('Update/_offline-staging/20261117-081737/v3-4/metadata-checkpoint.json',JSON.stringify({records:records.length,resolved:{descriptions:records.filter(r=>r.descriptionVi).length,membership:records.filter(r=>r.membership).length,rarity:records.filter(r=>r.rarity).length,boostVerified:records.filter(r=>r.boostReviewStatus==='verified').length,boostNone:records.filter(r=>r.boostReviewStatus==='none').length},pending,blocked:parsed.blocked},null,2)+'\n');
console.log({records:records.length,descriptions:records.filter(r=>r.descriptionVi).length,boostNone:records.filter(r=>r.boostReviewStatus==='none').length,boostVerified:records.filter(r=>r.boostReviewStatus==='verified').length,pending:pending.length});
