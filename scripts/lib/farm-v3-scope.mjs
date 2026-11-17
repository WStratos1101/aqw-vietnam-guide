// Exact target scope over hash-checked Wiki panels already loaded by the build.
// Quest registry and prerequisite facts remain available outside the main stepper.
import fs from 'node:fs';
import { sumMaterials } from '../../src/lib/farm-workflows.mjs';
export function applyFarmV3Scope(items,registry,pages,sets){
 const changes=[];
 const quest=(name,url)=>{const matches=Object.values(registry.quests).filter(q=>q.quest===name&&q.source===url);if(matches.length!==1)throw Error('Ambiguous V3 quest evidence: '+name);const q=matches[0];if(!pages.get(url)||pages.get(url).sourceHash!==q.sourceHash)throw Error('Unverified V3 quest panel: '+url);return q;};
 const lr=[1,2,3,4].map(n=>quest('Legion Fealty '+n,'https://aqwwiki.wikidot.com/legion-revenant-s-quests'));
 const radiant=quest('The Goddess of War','https://aqwwiki.wikidot.com/vohu-s-quests');
 if(radiant.ownedItems.length!==6||!radiant.rows.some(r=>r.name==='Malgor Insignia'&&r.quantity===5)||!radiant.rows.some(r=>r.name.toLowerCase()==='goddess of war'&&r.quantity===1))throw Error('Changed Radiant recipe/ownership evidence');
 const aweNames=['The Dawn of Lore','Mystical Magics','Science Rules','War: What is it Good For?','Which Came First, the Dragon or the Dragonoid?','Artifact Hunting','What Does Lore Have in Store?','Awe-scention'];
 const awe=aweNames.map(name=>quest(name,'https://aqwwiki.wikidot.com/trissa-s-quests'));
 const stop={'apprentice-of-awe':1,'adept-of-awe':6,'archmaster-of-awe':7,awescended:8};
 for(const item of items)for(const route of item.acquisitionRoutes){
   const all=[...new Set([...(route.questWorkflowIds||[]),...(route.farmModes||[]).flatMap(m=>m.questIds)])];
   let main=null,final=null;
   if(item.id==='radiant-goddess-of-war'){main=[radiant.id];}
   if(item.id==='legion-revenant-class'){main=lr.slice(0,3).map(q=>q.id);final=lr[3].id;}
   const aweSet=sets.find(s=>s.memberIds.includes(item.id)&&Object.hasOwn(stop,s.id));
   if(aweSet){main=awe.slice(0,stop[aweSet.id]).map(q=>q.id);}
   if(main){
     route.questGraph=all.map(id=>({questId:id,role:main.includes(id)?'mainFarm':id===final?'directAcquisition':(route.farmModes||[]).some(m=>[m.insignia,...(m.insignias||[])].some(s=>s?.quest===registry.quests[id]?.quest))?'insigniaSource':awe.some(q=>q.id===id)?'downstream':'unlockCondition',display:main.includes(id)?'stepper':id===final?'finalReceipt':'condition',source:registry.quests[id]?.source}));
     if(item.id==='radiant-goddess-of-war'){
       for(const mode of route.farmModes||[])mode.materials=sumMaterials([{...radiant,numberOfRuns:1}]);
       route.materialTotalsComplete=true;
     }
     changes.push({itemId:item.id,routeId:route.id,mainQuestIds:main,finalReceipt:final,excludedFromStepper:all.filter(id=>!main.includes(id)&&id!==final)});
   }
   for(const mode of route.farmModes||[]){
     const sources=mode.insignia?[mode.insignia]:mode.insignias||[];
     const values=sources.map(s=>{
       const q=Object.values(registry.quests).find(q=>q.quest===s.quest&&q.map===s.map&&q.sourceHash===pages.get(q.source)?.sourceHash);
       const reward=q?.fixedRewards?.find(r=>r.name===s.name);
       if(!q||!reward||reward.quantity!==s.perQuest||!['daily','weekly'].includes(q.repeatability))return null;
       const runs=Math.ceil(s.quantity/reward.quantity);
       return {kind:'gated',period:q.repeatability,requiredRuns:runs,yieldPerRun:reward.quantity,minimumResets:Math.max(0,runs-1),rangeHours:null,assumptions:['Từ 0 '+s.name,'Chỉ thời gian lấy currency cho route này; chưa tính farm prerequisite hoặc giờ chơi.','Có thể làm lượt đầu ngay nếu đủ điều kiện.'],source:q.source,sourceHash:q.sourceHash,scope:s.name};
     }).filter(Boolean);
     if(values.length===1)mode.farmTime=values[0];
   }
 }
 return changes;
}

export function applyVerifiedFarmFields(items,pages,specs,details){
 const changed=[];
 for(const spec of specs){
  const item=items.find(i=>i.id===spec.id&&i.wikiUrl===spec.url),page=pages.get(spec.url);
  if(!item||!page||page.sourceHash!==spec.sourceHash||spec.quotes.some(q=>!page.text.includes(q)))throw Error('Changed V3 field proof '+spec.id);
  if(!item.wikiDetails)item.wikiDetails=details({text:page.text,wikiUrl:spec.url,lastChecked:null},null);
  if(spec.membership){
    const html=fs.readFileSync(spec.sourceFile,"utf8");
    if(spec.membership!=="non-member"||spec.membershipTag!=="freeplayer"||!html.includes('tag/freeplayer'))throw Error('Unproved membership '+spec.id);
    item.membership=spec.membership;item.wikiDetails.membership=spec.membership;
    item.fieldEvidence={...item.fieldEvidence,membership:spec.url};
  }
  item.wikiDetails.descriptionVi=spec.descriptionVi;
  item.descriptionVi=spec.descriptionVi;
  item.rarity=spec.rarity;item.fieldEvidence={...item.fieldEvidence,rarity:spec.url};
  item.boosts=spec.boosts.map(boost=>({...boost,source:spec.url,sourceHash:spec.sourceHash,scope:'equipped'}));
  item.v3FieldEvidence={url:spec.url,sourceFile:spec.sourceFile,sourceHash:spec.sourceHash,quotes:spec.quotes,translationStatus:'reviewed_translation'};
  changed.push(item.id);
 }
 for(const item of items)if(!item.descriptionVi&&item.wikiDetails?.descriptionVi)item.descriptionVi=item.wikiDetails.descriptionVi;
 return changed;
}
