import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { applyDirectUltraGroups } from "../scripts/lib/farm-public-workflows.mjs";
import { workflowTasks, voidHighlordMix, sumMaterials } from "../src/lib/farm-workflows.mjs";
import { groupCounts, matchesGroup, resolveGroup } from "../src/lib/farm-groups.mjs";

const read=path=>JSON.parse(fs.readFileSync(path,"utf8"));
const catalog=read("src/content/farm/catalog-v2.generated.json"), registry=read("src/content/farm/quest-workflows.generated.json");
const collectionRecords=read("content-sources/farm/equipment-sets/canonical-records.json");
const audit=read("content-sources/farm/review/public-workflow-audit.json");
const get=id=>catalog.items.find(item=>item.id===id);
const route=id=>get(id).acquisitionRoutes[0];
const quantities=rows=>Object.fromEntries(rows.map(row=>[row.name,row.quantity]));
const policy={"champion-drakath":"chaos","darkon-the-conductor":"debris-astravian","ultra-drago":"debris-astravian","gramiel-the-graceful":"hollowborn","ultra-speaker":"alternative-hero","ultra-nulgath":"nation","ultra-dage":"legion"};

test("all public Nostalgia routes are removed while the ordinary NSOD recipe and every identity survive",()=>{
  assert.equal(catalog.items.length,279+collectionRecords.length);
  assert.equal(new Set(catalog.items.map(item=>item.id)).size,279+collectionRecords.length);
  assert.equal(audit.removedRoutes.length,5);assert.equal(audit.cleanedRoutes.length,1);
  for(const item of catalog.items)assert.doesNotMatch(JSON.stringify({brief:item.acquisitionBrief,details:item.wikiDetails}),/nostalgia/i);
  for(const item of catalog.items) for(const r of item.acquisitionRoutes){
    assert.doesNotMatch(r.location||"",/nostalgia|dual wield drop off/i);
    assert.ok((r.guidePaths||[]).every(path=>path.steps.every(step=>!/nostalgia/i.test(step.text))));
  }
  assert.ok(get("dual-blinding-light-of-destiny"));assert.equal(get("dual-blinding-light-of-destiny").acquisitionRoutes.length,0);
  assert.equal(route("necrotic-sword-of-doom").materialTree.requirements.length,5);
  assert.ok(get("hollowborn-oblivion-blade").acquisitionRoutes.every(r=>r.method==="Quest"));
});

test("Hollowborn Paladin dependency graph preserves contract, ownership gates, order and target boundaries",()=>{
  const ids=route("classic-hollowborn-paladin-armor").questWorkflowIds,names=ids.map(id=>registry.quests[id].quest);
  const expected=["Now We're Talking!","Let's Get You a Suit","I Got your Back (and your Top)","The Dark Sacrifice","The Post Summoning"];
  for(let i=1;i<expected.length;i++)assert.ok(names.indexOf(expected[i])>names.indexOf(expected[i-1]));
  assert.equal(names.at(-1),"The Post Summoning");
  for(const [name,level]of expected.map((name,index)=>[name,[65,75,85,95,100][index]]))
    assert.ok(registry.quests[ids[names.indexOf(name)]].preconditions.some(requirement=>requirement.includes(String(level))));
  const suit=registry.quests[ids[names.indexOf("Let's Get You a Suit")]];
  assert.ok(suit.ownedItems.some(item=>item.name==="Lae's Hardcore Contract"));
  assert.ok(!suit.rows.some(item=>item.name==="Lae's Hardcore Contract"));
  const producer=registry.materials["hollowborn-paladin"];
  assert.ok(producer.questIds.every(id=>registry.quests[id].quest!=="The Post Summoning"));
  assert.deepEqual(route("dual-hollowborn-shadows-of-fate").questWorkflowIds,ids);
});

test("Hollowborn ownership traverses Drakath shop unlock and BLoD without consuming owned equipment",()=>{
  const r=route("classic-hollowborn-paladin-armor"),names=r.questWorkflowIds.map(id=>registry.quests[id].quest);
  assert.ok(names.indexOf("The Blinding Light of Destiny")<names.indexOf("Build Drakath's Armor"));
  assert.ok(names.indexOf("Build Drakath's Armor")<names.indexOf("Ascended Drakath Gear"));
  const fairy=registry.quests[r.questWorkflowIds[names.indexOf("Ascended Drakath Gear")]];
  assert.ok(fairy.ownedItems.some(item=>item.name==="Original Drakath Armor"));
  assert.ok(!fairy.ownedItems.some(item=>item.name==="Chaorrupted Time-Travel Fairy"));
  assert.ok(!fairy.rows.some(item=>item.name==="Original Drakath Armor"));
  for(const id of r.questWorkflowIds)for(const dependency of registry.quests[id].dependencies || [])
    assert.ok(r.questWorkflowIds.indexOf(dependency)<r.questWorkflowIds.indexOf(id),id+" -> "+dependency);
});

test("direct Ultra group mapping uses exact Boss IDs and never follows indirect materials",()=>{
  for(const item of catalog.items){
    const sources=item.acquisitionRoutes.flatMap(r=>r.insigniaSources||[]).filter(source=>source.scope==="direct"&&policy[source.bossId]);
    const groups=[...new Set(sources.map(source=>policy[source.bossId]))];
    if(groups.length===1)assert.equal(item.primaryGroupId,groups[0],item.id);
    assert.ok(item.groupIds.length<=1);
  }
  for(const [bossId,group]of Object.entries(policy)){
    const item={id:"fixture",name:"Fixture",wikiUrl:"https://aqwwiki.wikidot.com/fixture",primaryGroupId:null,groupIds:[],acquisitionRoutes:[{insigniaSources:[{scope:"direct",bossId,name:"Insignia",quantity:5,status:"verified-snapshot"}]}]};
    applyDirectUltraGroups([item],new Map([[item.wikiUrl,{sourceHash:"a".repeat(64)}]]));
    assert.equal(item.primaryGroupId,group,bossId);assert.deepEqual(item.groupIds,[group]);
  }
  const indirect=[{id:"fixture",primaryGroupId:null,groupIds:[],acquisitionRoutes:[{insigniaSources:[{scope:"prerequisite",bossId:"ultra-speaker",status:"verified-snapshot"}]}]}];
  applyDirectUltraGroups(indirect,new Map());assert.equal(indirect[0].primaryGroupId,null);
  const conflict=[{id:"fixture",primaryGroupId:null,groupIds:[],acquisitionRoutes:[{insigniaSources:["ultra-speaker","ultra-nulgath"].map(bossId=>({bossId,scope:"direct",status:"verified-snapshot"}))}]}];
  const report={factionChanges:[],conflicts:[]};applyDirectUltraGroups(conflict,new Map(),report);
  assert.equal(conflict[0].primaryGroupId,null);assert.equal(report.conflicts.length,1);
});

test("Alternative Hero and Khác filters count unique identities without asserting unknown factions",()=>{
  const manifest=read("content-sources/farm/faction-groups.json");
  assert.equal(resolveGroup("Alternative Hero",manifest),"alternative-hero");
  assert.equal(groupCounts([...catalog.items,...catalog.items],catalog.groups).find(group=>group.id==="alternative-hero").count,8);
  assert.equal(groupCounts(catalog.items,catalog.groups).find(group=>group.id==="unknown").name,"Khác");
  assert.ok(catalog.items.filter(item=>matchesGroup(item,"unknown")).every(item=>item.primaryGroupId===null&&item.groupStatus==="unknown"));
});

test("VHL traditional and Insignia totals include both Crystals without double counting branches",()=>{
  const r=route("void-highlord-class"),standard=r.farmModes.find(mode=>mode.id==="standard"),ultra=r.farmModes.find(mode=>mode.id==="insignia");
  const normal=quantities(standard.materials),insignia=quantities(ultra.materials);
  assert.equal(normal["Elders' Blood"],17);assert.equal(normal["Gem of Nulgath"],450);assert.equal(normal["Tainted Gem"],1700);
  assert.equal(normal["Nulgath Insignia"],undefined);assert.equal(insignia["Nulgath Insignia"],40);assert.equal(insignia["Elders' Blood"],2);
  assert.equal(insignia["Black Knight Orb"],undefined);assert.equal(ultra.insignia.questCompletions,8);
  assert.equal(workflowTasks(r,registry,"standard")[0].numberOfRuns,15);
  assert.equal(workflowTasks(r,registry,"insignia")[0].quest,"Nulgath, the Archfiend");
  assert.deepEqual(voidHighlordMix(3),{dailyRuns:3,exchanges:6,insignia:30,weeklyCompletions:6,roentgenium:15,excess:0});
  assert.throws(()=>voidHighlordMix(16));assert.throws(()=>voidHighlordMix(-1));
});

test("LR Insignia branch keeps LF1–3 unlock runs and the ×2 Wreath exchange",()=>{
  const r=route("legion-revenant-class"),mode=r.farmModes.find(mode=>mode.id==="insignia"),q=workflowTasks(r,registry,"insignia");
  for(const name of [1,2,3].map(n=>"Legion Fealty "+n))assert.equal(q.find(task=>task.quest===name).numberOfRuns,1);
  assert.equal(quantities(mode.materials)["Dage the Evil Insignia"],31);assert.equal(quantities(mode.materials)["Legion Token"],5550);
  assert.equal(mode.insignia.questCompletions,7);
  assert.equal(quantities(mode.materials)["Dage's Favor"],500);
  assert.equal(quantities(mode.materials)["Obsidian Rock"],10);
  assert.equal(quantities(mode.materials)["Dage the Dark Lord Defeated"],7);
  assert.ok(q.findIndex(task=>task.quest==="Training With Dage")<q.findIndex(task=>task.quest==="Dage, Lord of the Undead Legion"));
  assert.deepEqual(mode.finishingTasks.map(task=>task.numberOfRuns),[19,9,3]);
  assert.equal(mode.finishingTasks.at(-1).rewardQuantity,2);
  assert.equal(registry.quests[mode.finishingBeforeQuestId].quest,"Legion Fealty 4");
  assert.ok(q.find(task=>task.quest==="Legion Fealty 1").preconditions.some(text=>/except Love Caster/.test(text)));
});

test("single Insignia-only items have no invented standard farm mode",()=>{
  assert.deepEqual(route("sin-of-the-abyss").farmModes.map(mode=>mode.id),["insignia"]);
  assert.equal(route("celestial-pirate-commander").farmModes,undefined);
});

test("every shared Quest has real Wiki panel evidence and recipe source hashes remain valid",()=>{
  const pages=[...read("content-sources/farm/review/pages.json"),...read("content-sources/farm/quest-workflow-review.json").sources,...read("content-sources/farm/equipment-sets/sources.json").sources];
  const valid=new Set(pages.map(page=>page.url));
  assert.ok(Object.values(registry.quests).every(task=>task.quest&&valid.has(task.source)));
  for(const change of audit.factionChanges){
    const evidence=get(change.itemId).groupEvidence[0];
    assert.equal(createHash("sha256").update(fs.readFileSync(evidence.sourceFile)).digest("hex"),evidence.sourceHash);
  }
});

for(const batch of audit.batches)test(`public workflow batch ${batch.batch} validates 20–30 distinct pending/partial identities`,()=>{
  assert.ok(batch.items.length>=20&&batch.items.length<=30);
  assert.equal(new Set(batch.items.map(item=>item.id)).size,batch.items.length);
  assert.ok(batch.items.every(item=>!["celestial-pirate-commander","polly-roger"].includes(item.id)));
  for(const row of batch.items)assert.ok(get(row.id));
});

test("material totals exclude owned gear and zero runs, preserve unknown quantities and include repeated consumables",()=>{
  const rows=sumMaterials([{numberOfRuns:3,rows:[{name:"Token",quantity:2},{name:"Owned gear",quantity:1,usage:"owned"},{name:"Unknown",quantity:null}]},{numberOfRuns:0,rows:[{name:"Skipped",quantity:100}]},{rows:[{name:"Token",quantity:5},{name:"Unknown",quantity:2}]}]);
  assert.deepEqual(quantities(rows),{Token:11,Unknown:null});
  assert.equal(route("blinding-light-of-destiny").materialTotalsComplete,false);
  assert.equal(route("void-highlord-class").materialTotalsComplete,true);
});

test("every verified direct Insignia exchange includes its actual weekly Quest in the selected workflow",()=>{
  for(const item of catalog.items)for(const r of item.acquisitionRoutes){
    const mode=r.farmModes?.find(mode=>mode.id==="insignia");
    for(const source of (r.insigniaSources || []).filter(source=>source.scope==="direct"&&source.status!=="PENDING_SOURCE")){
      const quest=workflowTasks(r,registry,"insignia").find(task=>task.quest===source.quest&&task.source===source.sourcePage);
      assert.ok(quest,item.id+": "+source.quest);
      assert.equal(quest.numberOfRuns,Math.ceil(source.quantity/source.rewardQuantity),item.id);
    }
  }
});
