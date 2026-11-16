import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {createHash} from "node:crypto";
import {equipmentSets,pendingSets,resolveEquipmentSets} from "../content-sources/farm/aqw-equipment-sets.mjs";
import {equipmentSetMembers,farmSetItemHref,validateEquipmentSets} from "../src/lib/farm-equipment-sets.mjs";
import {parseFarmReviewPage} from "../scripts/lib/farm-review-parser.mjs";
const read=path=>JSON.parse(fs.readFileSync(path,"utf8")),catalog=read("src/content/farm/catalog-v2.generated.json"),sets=read("src/content/farm/equipment-sets.generated.json").sets;
const records=read("content-sources/farm/equipment-sets/canonical-records.json"),assets=read("content-sources/farm/equipment-sets/assets.json"),audit=read("content-sources/farm/equipment-sets/audit.json");
test("reviewed Evolved Fiend inventory parses lowercase required labels without losing inputs or rewards",()=>{
 const proof=read("content-sources/farm/equipment-sets/reviewed-inventories.json").sets.find(set=>set.id==="evolved-fiend").inventoryEvidence.proofs[0];
 const html=fs.readFileSync(proof.sourceFile,"utf8");
 assert.match(html, /<strong>Items required:<\/strong>/);
 assert.equal(createHash("sha256").update(html).digest("hex"),proof.sourceHash);
 const parsed=parseFarmReviewPage(html,proof.url);
 assert.deepEqual(parsed.quests.map(quest=>quest.name),["Evolved Fiend Orb Quest","Evolved Fiend Gear"]);
 assert.deepEqual(parsed.quests.map(quest=>quest.required.map(row=>row.quantity)),[[1,10,1,1],[1,30,30,10,1,1]]);
 assert.deepEqual(parsed.quests.flatMap(quest=>quest.fixedRewards.map(row=>row.wikiUrl)),[
  "https://aqwwiki.wikidot.com/evolved-fiend-of-nulgath",
  "https://aqwwiki.wikidot.com/evolved-fiend-talons",
  "https://aqwwiki.wikidot.com/evolved-fiend-helm",
  "https://aqwwiki.wikidot.com/evolved-fiend-cape",
 ]);
});
test("reviewed Evolved Void members retain both exact reward Quest proofs",()=>{
 const set=read("content-sources/farm/equipment-sets/reviewed-inventories.json").sets.find(set=>set.id==="evolved-void");
 const proof=set.inventoryEvidence.proofs[0],html=fs.readFileSync(proof.sourceFile,"utf8");
 assert.equal(createHash("sha256").update(html).digest("hex"),proof.sourceHash);
 const quests=parseFarmReviewPage(html,proof.url).quests.filter(quest=>proof.quests.includes(quest.name));
 assert.deepEqual(quests.map(quest=>quest.name),proof.quests);
 assert.deepEqual(new Set(quests.flatMap(quest=>quest.fixedRewards.map(row=>row.wikiUrl))),new Set(set.members.map(member=>member.wikiUrl)));
});
test("the supplied 24/41 seed is preserved and a resolver match is never VERIFIED",()=>{
 assert.equal(equipmentSets.length,24);assert.equal(pendingSets.length,41);assert.equal(equipmentSets.reduce((n,set)=>n+set.members.length,0),209);
 const resolved=resolveEquipmentSets([{id:"known",name:"Void Paladin",category:"Armor"}]);
 assert.equal(resolved.sets.find(set=>set.id==="void-paladin").members.find(member=>member.itemId).status,"MATCHED_NEEDS_REVIEW");
 assert.ok(equipmentSets.every(set=>set.members.every(member=>member.itemId===null&&member.status==="GUIDE_EVIDENCE")));
});
test("ambiguous variants and duplicate seed entries remain unresolved",()=>{
 const seed=[{id:"fixture",members:[{name:"Same"},{name:"Unique"},{name:"Unique"}]}];
 const resolved=resolveEquipmentSets([{id:"a",name:"Same"},{id:"b",name:"Same"},{id:"c",name:"Unique"}],seed);
 assert.deepEqual(resolved.unresolved.map(row=>row.reason),["AMBIGUOUS","DUPLICATE_IN_SET"]);
});
test("production membership has no duplicates or dangling IDs and reverse links are exact",()=>{
 assert.ok(sets.length>=7);assert.deepEqual(validateEquipmentSets(sets,catalog.items),[]);
 assert.ok(validateEquipmentSets([{id:"bad",memberIds:["missing","missing"]}],catalog.items).length>=2);
 for(const set of sets){assert.equal(audit.sets.find(row=>row.id===set.id).status,"DONE");assert.equal(set.memberIds.length,audit.sets.find(row=>row.id===set.id).members.length);}
});
test("every membership pins real guide and exact-item Wiki evidence",()=>{
 for(const set of sets)for(const evidence of set.evidence){
  const item=catalog.items.find(item=>item.id===evidence.itemId);assert.equal(item.wikiUrl,evidence.wiki.url);
  for(const source of [evidence.guide,evidence.wiki])assert.equal(createHash("sha256").update(fs.readFileSync(source.sourceFile)).digest("hex"),source.sourceHash);
  assert.ok(fs.readFileSync(evidence.guide.sourceFile,"utf8").split(/\r?\n/)[evidence.guide.line-1]);
 }
});
test("new equipment is distinct, source backed and has a working acquisition workflow",()=>{
 assert.equal(catalog.items.length,279+records.length);assert.equal(new Set(catalog.items.map(item=>item.id)).size,catalog.items.length);
 assert.equal(new Set(catalog.items.map(item=>item.wikiUrl)).size,catalog.items.length);
 for(const record of records){const item=catalog.items.find(item=>item.id===record.id);assert.ok(item,record.id);assert.equal(item.wikiUrl,record.wikiUrl);
  assert.ok(item.acquisitionRoutes.some(route=>route.questWorkflowIds?.length||route.materialTree?.requirements?.length||route.purchase||route.dropSource),record.id);
  assert.ok(item.image,record.id);
  if(record.collectionEvidence.sourceChapter==="Hollowborn")assert.equal(item.primaryGroupId,"hollowborn",record.id);
 }
});
test("Reaper's Oath section links resolve to three evidenced alternative Quest workflows",()=>{
 const item=catalog.items.find(item=>item.id==="reaper-s-oath");
 const route=item.acquisitionRoutes.find(route=>route.questAlternatives?.length);
 const registry=read("src/content/farm/quest-workflows.generated.json");
 assert.deepEqual(route.questOptions.map(option=>option.name),["Obsidian Mining","Soul Forgery","Undead Legion Member Special"]);
 assert.ok(route.questAlternatives.every(option=>option.sources.some(url=>url.endsWith("#2"))));
 for(const option of route.questOptions){
  const task=registry.quests[option.questId];
  assert.equal(task.quest,option.name);
  assert.ok(option.workflowIds.includes(option.questId));
  assert.ok(route.questWorkflowIds.includes(option.questId));
  assert.ok([...task.fixedRewards,...task.rewardChoices,...task.randomRewards,...task.randomChoiceRewards].some(reward=>reward.wikiUrl===item.wikiUrl));
  assert.ok(task.rows.length);
 }
});
test("alternative Quest links never duplicate public choice controls",()=>{
 for(const item of catalog.items)for(const route of item.acquisitionRoutes){
  const ids=(route.questOptions||[]).map(option=>option.questId);
  assert.equal(new Set(ids).size,ids.length,item.id+":"+route.id);
 }
});
test("set artwork uses the matching canonical image and verified bytes",()=>{
 for(const asset of assets){assert.equal(createHash("sha256").update(fs.readFileSync("public"+asset.imagePath)).digest("hex"),asset.fileHash);const item=catalog.items.find(item=>item.wikiUrl===asset.sourcePage);if(item)assert.equal(item.image,asset.imagePath,item.id);}
 for(const set of sets)for(const id of set.memberIds){const item=catalog.items.find(item=>item.id===id);assert.ok(item.image);assert.ok(fs.existsSync("public"+item.image));}
});
test("inventory ordering and links use canonical IDs, category, subtype and faction",()=>{
 const fixture={memberIds:["helm","weapon-z","armor","weapon-a"]};const items=[{id:"helm",name:"A",category:"Helms"},{id:"weapon-z",name:"Z",category:"Weapons"},{id:"armor",name:"A",category:"Armors"},{id:"weapon-a",name:"A",category:"Weapons"}];
 assert.deepEqual(equipmentSetMembers(fixture,items).map(item=>item.id),["weapon-a","weapon-z","armor","helm"]);
 const member=catalog.items.find(item=>item.id==="void-paladin-katana"),url=new URL(farmSetItemHref(member),"https://example.test");
 assert.equal(url.pathname,"/farm/item/void-paladin-katana");assert.equal(url.searchParams.get("farm-tab"),"guide");assert.equal(url.searchParams.get("category"),member.category);assert.equal(url.searchParams.get("group"),member.primaryGroupId);
});
test("variants, prerequisites and quest-only groupings do not become false memberships",()=>{
 const original=sets.find(set=>set.id==="void-paladin"),cyber=sets.find(set=>set.id==="cyber-void-paladin");assert.ok(original&&cyber);
 assert.ok(original.memberIds.every(id=>!cyber.memberIds.includes(id)));assert.equal(cyber.variantOf,"void-paladin");
 assert.ok(!sets.some(set=>["juggernaut-items-of-nulgath","fortitude-hubris"].includes(set.id)));
 assert.ok(audit.sets.find(set=>set.id==="ancient-shogun").members.every(member=>!/Crypt Samurai/i.test(member.name)));
 const beetle=audit.sets.find(set=>set.id==="void-beetle-warlord");assert.ok(beetle.members.every(member=>!/Beetle Warlord Pet/.test(member.name)));
});
