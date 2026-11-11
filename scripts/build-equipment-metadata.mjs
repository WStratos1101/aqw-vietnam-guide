import fs from 'node:fs';
import {parseMaterialLines,requiredMaterials} from '../src/lib/material-requirements.mjs';
import {format} from 'prettier';
const read=p=>JSON.parse(fs.readFileSync(p));const review=read('content-sources/v678/review.json');const bosses=read('src/content/ultra/bosses.json');const details=read('src/content/ultra/details.json');
const canonicalId=name=>name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');
const aliases={'Sin of the Abyss (SoA)':'Sin of the Abyss'};const entities={};
for(const boss of bosses)for(const item of [...boss.equipmentRoutes.map(r=>({name:r.itemName,image:r.image})),...details[boss.slug].additionalEquipment]){const name=aliases[item.name]||item.name,id=canonicalId(name);if(entities[id])continue;const source=review.find(r=>r.kind==='equipment'&&r.name===name&&!r.error);const text=(source?.text||'').replace(/\s+/g,' ');const level=text.match(/Base Level:\s*(\d+)/);const boost=text.match(/(?:does\s+|do\s+)?(\d+)%\s+(?:more\s+)?damage\s+(?:to|boost against)\s+(all monsters|Undead monsters|Elementals)/i)||text.match(/(\d+)%\s+damage boost against\s+(Elementals)/i);const extraBoost=text.match(/(\d+)%\s+more to\s+(all monsters)/i);const verifiedBoost=boost||extraBoost;const recipeText=source?.text.split('Merge the following:')[1]?.split('Sellback:')[0];const parsed=recipeText?parseMaterialLines(recipeText,source.url):null;const materials=requiredMaterials(parsed?.tree);entities[id]={id,name,image:item.image||null,levelRequirement:level?Number(level[1]):null,damageBoost:verifiedBoost?{value:Number(verifiedBoost[1]),targetType:/all monsters/i.test(verifiedBoost[2])?'All Damage':/Undead/i.test(verifiedBoost[2])?'Undead':'Elementals',source:source.url}:null,weaponStability:'unknown',baseDamage:text.match(/Base Damage:\s*([\d,-]+)/)?.[1]||null,materialTree:parsed?.tree||undefined,materialConfidenceStatus:parsed?.confidenceStatus||'needs_verification',materialRequirements:materials,source:source?.url||null,lastVerified:source?'2026-11-08':null,category:/\barmor\b/.test(source?.text||'')?'Armor':'Equipment',sourceStatus:source?'verified':'needs_review'};}
for(const entity of Object.values(entities)){
  const verifiedAsset=read('src/data/aqw-assets.json').find(a=>a.entityName===entity.name&&a.entityType==='item'&&a.verificationStatus==='verified'&&a.usageStatus==='approved');
  if(verifiedAsset)entity.image=verifiedAsset.assetId;
  const range=entity.baseDamage?.match(/^(\d+)-(\d+)$/);
  entity.equipmentType=range?'weapon':entity.category==='Armor'?'armor':'unknown';
  entity.boostStatus=entity.damageBoost?'verified':'unknown';
  // This exact reviewed item page lists CP/XP boosts only, no damage boost.
  if(entity.name==="Drago's Royal Guard"&&entity.source)entity.boostStatus='none';
  if(range&&Number(range[1])<=Number(range[2])){
    const minimum=Number(range[1]),maximum=Number(range[2]);
    entity.weaponStability=minimum===maximum?'stable':'unknown';
    entity.weaponDamageRange={minimum,maximum,classification:entity.weaponStability,officialRangeCategory:null,source:entity.source,verifiedAt:entity.lastVerified};
  }
}
for(const boss of bosses){for(const route of boss.equipmentRoutes){route.canonicalId=canonicalId(aliases[route.itemName]||route.itemName);const entity=entities[route.canonicalId];if(entity){(entity.questProgression??=[]).push({bossId:boss.id,routeId:route.id});if(entity.image)route.image=entity.image;}}for(const item of details[boss.slug].additionalEquipment){item.canonicalId=canonicalId(aliases[item.name]||item.name);if(entities[item.canonicalId]?.image)item.image=entities[item.canonicalId].image;}}
const progressionPaths=[{id:'time-inn',bosses:['ultra-ezrajal','ultra-warden','ultra-engineer'],steps:['Apostate + Thaumaturgus','Exalted Unity','Exalted Penultima','Exalted Apotheosis'],source:'https://aqwwiki.wikidot.com/exaltia-merge'}];
fs.writeFileSync('src/content/ultra/equipment.json',JSON.stringify({aliases,entities,progressionPaths},null,2)+'\n');
fs.writeFileSync('src/content/ultra/bosses.json',await format(JSON.stringify(bosses),{parser:'json'}));fs.writeFileSync('src/content/ultra/details.json',await format(JSON.stringify(details),{parser:'json'}));console.log('Canonical equipment metadata:',Object.keys(entities).length);
