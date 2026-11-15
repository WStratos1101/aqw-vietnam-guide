// Merge isolated, pinned reviews without treating their candidates as members.
import fs from "node:fs";
import {createHash} from "node:crypto";
import {parseFarmReviewPage} from "./lib/farm-review-parser.mjs";
import {equipmentSets,pendingSets} from "../content-sources/farm/aqw-equipment-sets.mjs";
const root="content-sources/farm/equipment-sets/",read=name=>JSON.parse(fs.readFileSync(root+name+".json","utf8"));
const reviewed=read("reviewed-inventories"),byId=new Map(reviewed.sets.map(set=>[set.id,set])),manifest=read("sources"),byUrl=new Map(manifest.sources.map(source=>[source.url,source]));
const files=["quest-inventory-research","shop-inventory-research","seed-collection-research"],blockers=[],aliases=[],scopeFindings=[];
const findSeed=entry=>equipmentSets.find(set=>set.id===entry.id)||pendingSets.find(set=>set.name===entry.name);
for(const file of files){
 const research=read(file);aliases.push(...(research.aliases||[]));scopeFindings.push(...(research.scopeFindings||[]));
 for(const source of research.sources||[]){if(!fs.existsSync(source.sourceFile))throw Error("Missing review snapshot "+source.sourceFile);if(createHash("sha256").update(fs.readFileSync(source.sourceFile)).digest("hex")!==source.sourceHash)throw Error("Changed review snapshot "+source.url);if(!byUrl.has(source.url))byUrl.set(source.url,source);}
 for(const entry of research.sets||research.collections){
   const seed=findSeed(entry);if(!seed)throw Error("Unknown reviewed collection "+entry.id);
   const complete=entry.complete===true||/^COMPLETE_/.test(entry.completeness||"")||entry.status==="COLLECTION_INVENTORY_REVIEWED";
   const members=entry.members||[];
   const sources=entry.source?[entry.source]:entry.sources||[];
   const proofs=sources.map(source=>{
     const page=parseFarmReviewPage(fs.readFileSync(source.sourceFile,"utf8"),source.url),urls=new Set(members.map(member=>member.wikiUrl));
     const quests=page.quests.filter(quest=>[...quest.fixedRewards,...quest.choiceRewards,...quest.randomRewards,...quest.randomChoiceRewards].some(row=>urls.has(row.wikiUrl))).map(quest=>quest.name);
     return {...source,quests};
   });
   const evidence={kind:"reviewed-inventory",complete,proofs,guideScope:entry.guideEvidence?.scope||entry.guide?.collectionLines||entry.scopeNote||entry.status,reviewFile:root+file+".json"};
   const converted={...seed,id:entry.id,name:entry.name,evidence:seed.evidence,sourceChapter:seed.sourceChapter,
     members:members.map(member=>({name:member.name,category:member.category||null,itemId:null,status:"WIKI_INVENTORY_REVIEW",wikiUrl:member.wikiUrl})),
     expectedCount:members.length,inventoryEvidence:evidence,notes:entry.scopeNote||entry.notes||seed.notes||"",
     blockers:entry.blockers||[],candidateMembers:entry.candidateMembers||entry.candidates||[],researchStatus:entry.completeness||entry.status};
   if(members.length)byId.set(entry.id,converted);
   else blockers.push({...converted,members:[],blockers:entry.blockers||["Membership scope unresolved"]});
 }
}
const seedResearch=read("seed-collection-research");
for(const finding of seedResearch.scopeFindings || []){
 if(/lich.king/i.test(finding.id||finding.setId||"")){
  const members=finding.reviewedFullEquipmentInventory;
  if(members?.length){const seed=equipmentSets.find(set=>set.id==="hollowborn-lich-king");const source=finding.source||finding.sources?.[0];
    if(source && !byUrl.has(source.url))byUrl.set(source.url,source);
    byId.set(seed.id,{...seed,members:members.map(member=>({...member,itemId:null,category:null,status:"WIKI_INVENTORY_REVIEW"})),expectedCount:members.length,inventoryEvidence:{kind:"reviewed-inventory",complete:true,proofs:finding.sources||[source].filter(Boolean),reviewFile:root+"seed-collection-research.json",guideScope:"Explicit Guide set; all 24 scoped equipment rewards, house altar excluded."}});
  }
 }
}
reviewed.sets=[...byId.values()];manifest.sources=[...byUrl.values()];
fs.writeFileSync(root+"reviewed-inventories.json",JSON.stringify(reviewed,null,2)+"\n");
fs.writeFileSync(root+"sources.json",JSON.stringify(manifest,null,2)+"\n");
fs.writeFileSync(root+"research-blockers.json",JSON.stringify({sets:blockers,aliases,scopeFindings},null,2)+"\n");
console.log({reviewed:reviewed.sets.length,scopedMembers:reviewed.sets.reduce((sum,set)=>sum+set.members.length,0),scopeBlocked:blockers.length,aliases:aliases.length});
