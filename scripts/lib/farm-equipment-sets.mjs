import fs from "node:fs";
import { createHash } from "node:crypto";
import { equipmentSets, pendingSets, supplementalEvidence, resolveEquipmentSets, sources } from "../../content-sources/farm/aqw-equipment-sets.mjs";
import { farmWikiFacts } from "./farm-wiki-facts.mjs";
import { validateEquipmentSets } from "../../src/lib/farm-equipment-sets.mjs";
const read=path=>JSON.parse(fs.readFileSync(path,"utf8"));
const norm=value=>value.normalize("NFKC").replace(/[’‘]/g,"'").replace(/\s+/g," ").trim().toLowerCase();
const category={Weapons:"Weapon",Armors:"Armor",Helms:"Helm","Capes / Back Items":"Cape",Pets:"Pet",Classes:"Class"};
const stableId=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
export function buildEquipmentSets(items,pages){
 const root="content-sources/farm/equipment-sets",index=read(root+"/research-index.json").identities;
 const guidePath="content-sources/farm/manual-guide/FARMING_ITEM_GUIDE_SOURCE.txt",guide=fs.readFileSync(guidePath,"utf8"),lines=guide.split(/\r?\n/),sourceHash=createHash("sha256").update(guide).digest("hex");
 const aliases=item=>Object.entries(index).filter(([,urls])=>urls.length===1&&urls[0]===item.wikiUrl).map(([name])=>name);
 const adapter=items.map(item=>({id:item.id,name:item.name,category:category[item.category],aliases:aliases(item)}));
 const reviewed=read(root+"/reviewed-inventories.json").sets;
 const resolved=resolveEquipmentSets(adapter,[...equipmentSets,...reviewed]),byId=new Map(items.map(item=>[item.id,item])),production=[],audit=[];
 const producers=new Map();for(const page of pages.values())for(const quest of page.quests)for(const reward of [...quest.fixedRewards,...quest.choiceRewards,...quest.randomRewards,...quest.randomChoiceRewards]){
  const names=producers.get(reward.wikiUrl)||[];names.push(quest.name);producers.set(reward.wikiUrl,names);
 }
 const variants={"cyber-void-paladin":"void-paladin"};
 for(const set of resolved.sets){
  const range=lines.slice(set.evidence.lines[0]-1,set.evidence.lines[1]);
  const inventory=set.inventoryEvidence,inventoryPage=inventory?.url&&pages.get(inventory.url);
  if(inventory?.url && inventoryPage?.sourceHash!==inventory.sourceHash)throw Error("Changed collection inventory evidence: "+set.id);
  const inventoryReviewed=Boolean(inventory && (inventory.kind==="explicit-guide-subsection" || inventoryPage));
  const members=set.members.map(member=>{
   const item=byId.get(member.itemId),page=item&&pages.get(item.wikiUrl),offset=range.findIndex(line=>norm(line).includes(norm(member.name)));
   const facts=page&&farmWikiFacts({text:page.text}),guideText=norm(range.join("\n"));
   const acquisitionVerified=page && ((producers.get(item?.wikiUrl)||[]).some(name=>guideText.includes(norm(name))) || (range[offset]?.trim().startsWith("→ "+member.name+":") && (page.droppedBy?.length>0 || /^Price:\s*N\/A\s*\(Dropped by/im.test(page.text))) || (facts.questReward?guideText.includes(norm(facts.questReward)):
      facts.materialTree?offset>=0:page.droppedBy?.some(monster=>guideText.includes(norm(monster.name)))));
   const evidence=(offset>=0||inventoryReviewed)&&page&&item&&(acquisitionVerified||inventoryReviewed)?{guide:{sourceFile:guidePath,sourceHash,line:offset>=0?set.evidence.lines[0]+offset:set.evidence.lines[0],text:offset>=0?range[offset]:range[0]},wiki:{url:item.wikiUrl,sourceFile:page.sourceFile,sourceHash:page.sourceHash},...(inventory?{inventory}: {})}:null;
   return {...member,status:evidence?"VERIFIED":"PENDING",evidence,blockers:[...(!item?["Canonical identity unresolved"]:[]),...(offset<0&&!inventoryReviewed?["Exact membership mention not found in declared guide range"]:[]),...(!page?["Exact-item Wiki snapshot missing"]:[]),...(!acquisitionVerified&&!inventoryReviewed?["Collection acquisition / Quest membership not confirmed against guide"]:[]),...(item&&!item.image?["Exact artwork unavailable"]:[])]};
  });
  const enumerationIncomplete=/Enumerate|Additional Quest rewards|remaining rewards|sub-sets/i.test(set.notes || "") && !inventoryReviewed;
  const complete=!enumerationIncomplete && members.every(member=>member.status==="VERIFIED"&&member.blockers.length===0);
  const status=complete?"DONE":members.some(member=>member.status==="VERIFIED")?"PARTIAL":"BLOCKED";
  audit.push({...set,status,members,...(enumerationIncomplete?{blockers:["Remaining equipment / sub-collection enumeration required by seed notes"]}:{}),completionScope:"All declared seed members resolved, guide/Wiki identities and exact artwork; further reward enumeration remains a separate audit."});
  // Never expose an incomplete seed as a complete player inventory.
  if(complete)production.push({id:set.id,name:set.name,sourceChapter:set.sourceChapter,memberIds:members.map(member=>member.itemId),sourceUrls:[sources.docs,...new Set(members.map(member=>member.evidence.wiki.url)),...(supplementalEvidence[set.id]||[])],...(variants[set.id]?{variantOf:variants[set.id]}:{}),evidence:members.map(member=>({itemId:member.itemId,...member.evidence}))});
 }
 for(const set of pendingSets){
  if(reviewed.some(review=>review.name===set.name))continue;
  const id=stableId(set.name),range=lines.slice(set.evidence.lines[0]-1,set.evidence.lines[1]),text=range.join("\n");
  const explicitlyNotCollection=set.name==="Juggernaut Items of Nulgath"||set.name==="Fortitude + Hubris";
  const matchingQuests=[...pages.values()].flatMap(page=>page.quests.filter(quest=>text.includes(quest.name)).map(quest=>({name:quest.name,url:page.url,rewards:[...quest.fixedRewards,...quest.choiceRewards,...quest.randomRewards,...quest.randomChoiceRewards]})));
  audit.push({...set,id,status:explicitlyNotCollection?"BLOCKED":"PENDING",members:(read(root+"/research-index.json").pendingCandidates?.[set.name] || []).map(member=>({...member,itemId:items.find(item=>item.wikiUrl===member.url)?.id || null})),candidateQuests:matchingQuests,
   blockers:[explicitlyNotCollection?"Quest/reward grouping or a single weapon; no collection membership proof. Keep individual equipment standalone.":"Reward inventory requires explicit collection/variant review; candidate Quest rewards are not verified membership."]});
 }
 for(const item of items)item.setIds=production.filter(set=>set.memberIds.includes(item.id)).map(set=>set.id);
 const errors=validateEquipmentSets(production,items);if(errors.length)throw Error(errors.join("\n"));
 const report={seedSets:equipmentSets.length,pendingSets:pendingSets.length,totalCandidates:audit.length,seedMembers:equipmentSets.reduce((sum,set)=>sum+set.members.length,0),productionSets:production.length,productionMemberships:production.reduce((sum,set)=>sum+set.memberIds.length,0),statuses:Object.fromEntries(["DONE","PARTIAL","PENDING","BLOCKED"].map(status=>[status,audit.filter(set=>set.status===status).length])),unresolved:resolved.unresolved,sets:audit,standaloneItemIds:items.filter(item=>!item.setIds.length).map(item=>item.id)};
 fs.writeFileSync(root+"/audit.json",JSON.stringify(report,null,2)+"\n");
 fs.writeFileSync("src/content/farm/equipment-sets.generated.json",JSON.stringify({sets:production},null,2)+"\n");
 return report;
}
