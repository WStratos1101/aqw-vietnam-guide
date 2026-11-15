import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {createHash} from "node:crypto";
import {equipmentSets,pendingSets,resolveEquipmentSets} from "../content-sources/farm/aqw-equipment-sets.mjs";
import {equipmentSetMembers,farmSetItemHref,validateEquipmentSets} from "../src/lib/farm-equipment-sets.mjs";
const read=path=>JSON.parse(fs.readFileSync(path,"utf8")),catalog=read("src/content/farm/catalog-v2.generated.json"),sets=read("src/content/farm/equipment-sets.generated.json").sets;
const records=read("content-sources/farm/equipment-sets/canonical-records.json"),assets=read("content-sources/farm/equipment-sets/assets.json"),audit=read("content-sources/farm/equipment-sets/audit.json");
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
