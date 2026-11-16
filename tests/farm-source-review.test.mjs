import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { parseFarmReviewPage } from "../scripts/lib/farm-review-parser.mjs";
import { verifiedFarmAsset } from "../scripts/lib/farm-image-evidence.mjs";
import { materialLeaves } from "../src/lib/material-requirements.mjs";
const read = p => JSON.parse(fs.readFileSync(p, "utf8"));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const catalog = read("src/content/farm/catalog-v2.generated.json");
const review = read("content-sources/farm/review/enrichment-audit.json");
const get = id => catalog.items.find(i => i.id === id);

test("inline Quest prerequisites survive a following Notes list", () => {
  const html = '<div id="page-content"><div class="yui-navset"><ul class="yui-nav"><li>Mine Crafting</li></ul><div class="yui-content"><div><p><strong>Requirements:</strong> Must have completed the \'A Loyal Follower\' quest.</p><p><strong>Notes:</strong></p><ul><li>This quest can only be completed once per day.</li></ul><p><strong>Items Required:</strong></p><ul><li>Raw Ore x30</li></ul></div></div></div></div>';
  const quest = parseFarmReviewPage(html, "https://aqwwiki.wikidot.com/fixture").quests[0];
  assert.deepEqual(quest.requirements, ["Must have completed the 'A Loyal Follower' quest."]);
  assert.equal(quest.repeatability, "daily");
  const list = html.replace("<strong>Requirements:</strong> Must have completed the 'A Loyal Follower' quest.", "<strong>Requirements:</strong>").replace("<p><strong>Notes:</strong></p>", "");
  assert.deepEqual(parseFarmReviewPage(list, "https://aqwwiki.wikidot.com/fixture").quests[0].requirements, ["This quest can only be completed once per day."]);
});

test("Wiki DOM recipes retain an implicit single item and currency; nested operator scope is never flattened", () => {
  const html = '<div id="page-content"><ul><li>Merge the following:<ul><li>Base Weapon</li><li>Token x1,000</li><li>200,000 Gold</li></ul></li></ul></div>';
  const parsed = parseFarmReviewPage(html, "https://aqwwiki.wikidot.com/fixture");
  assert.deepEqual(materialLeaves(parsed.mergeRecipes[0].tree).map(n => [n.name,n.quantity]), [["Base Weapon",1],["Token",1000],["Gold",200000]]);
  assert.equal(parseFarmReviewPage(html.replace("<li>Token x1,000</li>", "<li>OR<ul><li>Token x1,000</li><li>Other x2</li></ul></li>"), "https://aqwwiki.wikidot.com/fixture").mergeRecipes[0].status, "PENDING_STRUCTURE");
});

test("a named image never crosses canonical pages and a changed byte hash fails closed", () => {
  const bytes = Buffer.from("actual image bytes"), item = { id:"item", originalName:"Same Name", wikiUrl:"https://aqwwiki.wikidot.com/item-1" };
  const asset = { entityType:"item", entityName:item.originalName, sourcePage:item.wikiUrl, verificationStatus:"verified", usageStatus:"approved", imagePath:"/images/aqw/item.png", fileHash:hash(bytes) };
  assert.equal(verifiedFarmAsset(item, [{...asset,sourcePage:"https://aqwwiki.wikidot.com/item-2"}], () => bytes), null);
  assert.equal(verifiedFarmAsset(item, [{...asset,usageStatus:"needs_review"}], () => bytes), null);
  assert.throws(() => verifiedFarmAsset(item, [asset], () => Buffer.from("changed")), /hash mismatch/);
  assert.equal(verifiedFarmAsset(item, [asset], () => bytes), asset);
});

test("Housing is excluded with exact evidence and cosmetic swords on the hip remain a Back Item", () => {
  assert.equal(get("altar-of-vordred"), undefined);
  const excluded = review.excluded.find(e => e.itemId === "altar-of-vordred");
  assert.ok(excluded.breadcrumbs.some(b => b.path === "/floor-items"));
  const page = read("content-sources/farm/review/pages.json").find(p => p.url === excluded.sourcePage);
  assert.equal(hash(fs.readFileSync(page.sourceFile)), excluded.sourceHash);
  assert.equal(get("void-shogun-katanas-on-your-hip").category, "Capes / Back Items");
  assert.equal(get("void-shogun-katanas-on-your-hip").subtype, null);
  for (const [id,subtype] of [["dual-caladbolgs","Dagger"],["avatar-of-death-s-scythe","Polearm"],["combat-soulreaper-of-nulgath","Axe"]]) assert.equal(get(id).subtype, subtype);
});

test("recovered merge recipes separate Gold, implicit quantity and prerequisites", () => {
  const halberd = get("dark-dragon-slayer-s-halberd").acquisitionRoutes[0];
  assert.equal(halberd.method,"Merge");
  assert.deepEqual(materialLeaves(halberd.materialTree).map(n=>[n.name,n.quantity]), [["Green Dragon Slayer's Halberd",1],["Prismatic Seams",1000],["Willpower",70],["Garish Remnant",70],["Gold Voucher 500k",20]]);
  for(const [id,quantity] of [["legion-soul-devourer",200000],["undead-spawn-minion",300000]]) {
    const route=get(id).acquisitionRoutes[0];
    assert.equal(route.method,"Merge");
    assert.equal(materialLeaves(route.materialTree).find(n=>n.name==="Gold").quantity,quantity);
  }
  assert.equal(get("blood-sorceress").acquisitionRoutes[0].method,"Drop");
  assert.match(get("blood-sorceress").acquisitionRoutes[0].dropSource,/Scarletta/);
  assert.deepEqual(get("crag-bamboozle").acquisitionRoutes.map(r=>r.method),["Shop","Quest"]);
});

test("Insignias preserve direct recipe quantities and resolve exact source quests, NPCs, maps and Boss Codex identities", () => {
  const sources=read("src/content/farm/material-sources.generated.json");
  assert.equal(Object.values(sources).filter(s=>s.bossId).length,9);
  const expected = { "nulgath-insignia":["Nulgath, the Archfiend","Nulgath (NPC)",5],"dage-the-evil-insignia":["Dage, Lord of the Undead Legion","Calamitus",5],"avatar-tyndarius-insignia":["Ultra Avatar Tyndarius","Galanoth (NPC)",2],"malgor-insignia":["Malgor, The First Speaker","Vohu",5] };
  for(const [id,[quest,npc,quantity]] of Object.entries(expected)) {
    assert.equal(sources[id].tasks[0].quest,quest);
    assert.equal(sources[id].tasks[0].npc,npc);
    assert.equal(sources[id].tasks[0].rewardQuantity,quantity);
  }
  let linked=0;
  for(const item of catalog.items) for(const route of item.acquisitionRoutes) for(const leaf of materialLeaves(route.materialTree).filter(n=>/Insignia/.test(n.name))) {
    const source=route.insigniaSources.find(s=>s.materialId===leaf.itemId&&s.scope==="direct");
    assert.ok(source,item.id+": "+leaf.name);
    assert.equal(source.quantity,leaf.quantity,item.id);
    assert.equal(source.status,"verified-snapshot");
    assert.ok(source.quest&&source.npc&&source.map&&source.bossId,item.id);
    const page=read("content-sources/farm/review/pages.json").find(p=>p.url===source.sourcePage);
    assert.equal(hash(fs.readFileSync(page.sourceFile)),source.sourceHash);
    linked++;
  }
  assert.ok(linked>40);
  const sole=get("empowered-sole-bloodletter").acquisitionRoutes[0];
  assert.equal(sole.location,"Tercessuinotlim");
  assert.equal(sole.mapCommand,"/join tercessuinotlim");
  assert.equal(sole.insigniaSources[0].map,"/join ultranulgath");
});

test("each new Wiki image has exact canonical provenance, inspected contact sheet, correct case/path and immutable bytes", () => {
  const approvals=read("content-sources/farm/review/image-approvals.json");
  for(const approval of approvals) {
    const item=get(approval.itemId);
    assert.ok(item,approval.itemId);
    assert.equal(item.imageEvidence.source,item.wikiUrl);
    assert.equal(item.imageEvidence.originalImageUrl,approval.originalImageUrl);
    assert.equal(hash(fs.readFileSync("public"+item.image)),approval.fileHash);
    assert.ok(fs.existsSync(approval.visualEvidence));
    assert.match(item.image,/\.(png|gif|jpg)$/);
  }
  assert.equal(new Set(catalog.items.map(i=>i.wikiUrl)).size,catalog.items.length);
  for(const item of catalog.items) assert.ok(item.groupIds.length<=1,item.id);
});

test("VHL daily turn-in costs exclude ownership gates and remain separate from the fifteen-reward target", () => {
  const task = read("content-sources/farm/material-guides.json")["roentgenium-of-nulgath"].tasks[0];
  const quantities = Object.fromEntries(task.rows.map(row => [row.name, row.quantity]));
  assert.equal(task.quantityScope, "perTurn");
  assert.equal(task.numberOfRuns * task.rewardQuantity, task.totalRequired);
  assert.equal(quantities["Emblem of Nulgath"], 20);
  assert.equal(quantities["Essence of Nulgath"], 50);
  assert.equal(quantities["Nulgath's Approval"], 300);
  assert.equal(quantities["Hadean Onyx of Nulgath"], undefined);
  assert.equal(quantities["Voucher of Nulgath (non-mem)"], undefined);
  assert.ok(task.preconditions.some(text => text.includes("Voucher")));
  assert.ok(task.rows.every(row => row.source === task.source && !row.map));
  const guide = fs.readFileSync("Update/_farm-source-recovery/input/FARMING_ITEM_GUIDE_SOURCE.txt", "utf8");
  assert.equal(quantities["Gem of Nulgath"] * task.numberOfRuns, 300);
  assert.match(guide, /Gem of Nulgath ×20/);
});

test("Legion Fealty ingredient tables preserve per-turn costs and traditional route targets", () => {
  const guides = read("content-sources/farm/material-guides.json");
  const expected = [["revenant-s-spellscroll",20,4,"Dracolich Contract",1000],["conquest-wreath",6,10,"Grim Cohort Conquered",400],["exalted-crown",10,6,"Legion Token",4000]];
  for (const [id,runs,count,name,cost] of expected) {
    const guide = guides[id], task = guide.tasks[0];
    assert.equal(hash(fs.readFileSync(guide.evidence.sourceFile)), guide.evidence.sourceHash);
    assert.equal(task.rows.length, count);
    assert.equal(task.numberOfRuns, runs);
    assert.equal(task.rows.find(row => row.name === name).quantity, cost);
    assert.equal(task.quantityScope, "perTurn");
    assert.equal(task.totalRequired, runs * task.rewardQuantity);
    assert.ok(task.rows.every(row => !row.map));
    assert.match(task.requirements.join(" "), /Insignia/);
  }
});

test("reviewed Quest workflows preserve BLoD kit scope, exact names and the Book of Lore claim", () => {
  const route = get("blinding-light-of-destiny").acquisitionRoutes.find(r => r.id === "book-of-lore");
  assert.equal(route.method, "Shop");
  const tasks = route.farmTasks;
  assert.equal(new Set(tasks.map(t => t.id)).size, tasks.length);
  assert.equal(tasks.find(t => t.quest === "Essential Essences").rows[0].quantity, 25);
  assert.deepEqual(tasks.find(t => t.quest === "Essential Essences").randomChoiceRewards.map(r => r.quantity), [5,10,15,20]);
  for (const [kit, runs] of [["Basic",3],["Advanced",3],["Ultimate",4]]) {
    const task = tasks.find(t => t.quest === kit + " Weapon Kit Construction");
    assert.equal(task.numberOfRuns, runs);
    assert.equal(task.rewardQuantity, 1);
    assert.ok(task.rows.every(row => row.quantityTotal === row.quantity * runs));
  }
  const basic = tasks.find(t => t.quest === "Basic Weapon Kit Construction");
  assert.ok(basic.rows.some(r => r.name === "Bronze Brush"));
  assert.ok(!basic.rows.some(r => r.name === "Bronze Bush"));
  const final = tasks.at(-1);
  assert.equal(final.quest, "The Blinding Light of Destiny");
  assert.equal(final.reward, "Get Your Blinding Light of Destiny ×1");
  assert.equal(final.rows.find(r => r.name === "Spirit Orb (Misc)").quantity, 500);
  assert.equal(final.destination.shop, "Blinding Light of Destiny (Shop)");
  assert.match(final.destination.map, /Book of Lore/);
  const workflow = read("content-sources/farm/external-guide-evidence/FARM_CANONICAL_QUEST_WORKFLOWS.json").records.find(r => r.canonicalId === "blinding-light-of-destiny");
  assert.equal(workflow.routes[0].shopUnlock.npc, null);
  assert.equal(workflow.routes[0].shopUnlock.mapJoin, null);
  assert.ok(route.guidePaths.find(path => path.id === "wiki-quest-workflow").steps.every(step => tasks.some(t => t.id === step.id)));
});

test("CPC and Polly require one selected reward, eight verified farm sources and Level 80", () => {
  const expectedMaps = ["frozenlair","lostruinswar","iceplane","ivoliss","voidnightbane","extinction","starsinc","underlair"];
  for (const [id, reward] of [["celestial-pirate-commander","Celestial Pirate Commander"],["polly-roger","Polly Roger"]]) {
    const route = get(id).acquisitionRoutes[0], task = route.farmTasks[0];
    assert.equal(task.numberOfRuns, 1);
    assert.equal(task.reward, reward + " ×1");
    assert.equal(task.rewardChoices.length, 12);
    assert.equal(task.rows.length, 8);
    assert.equal(task.map, "/join pirates");
    assert.equal(task.npc, "Barnaby");
    assert.ok(task.preconditions.includes("Must be Level 80."));
    assert.deepEqual(task.rows.map(row => row.map), expectedMaps.map(map => "/join " + map));
    assert.deepEqual(task.rows.map(row => row.quantity), [5,5,10,10,10,10,1,1]);
    for (const row of task.rows) {
      assert.ok(row.monster);
      assert.ok(row.sourceDetails.every(s => s.evidence.length >= 2));
    }
    assert.equal(task.rows[1].requiredQuest, task.quest);
    assert.equal(materialLeaves(route.materialTree).length, 8);
  }
});

test("LR keeps 400 Cohorts, current Wiki stacks and the double-Wreath Ultra alternative", () => {
  const tasks = get("legion-revenant-class").acquisitionRoutes[0].farmTasks;
  assert.deepEqual(tasks.map(t => t.quest), [1,2,3,4].map(n => "Legion Fealty " + n));
  assert.ok(tasks.every(t => t.map === "/join revenant"));
  assert.equal(tasks[0].rows.find(r => r.name === "Tethered Soul").maxStack, 10000);
  assert.equal(tasks[0].rows.find(r => r.name === "Darkened Essence").maxStack, 12000);
  assert.ok(tasks[1].rows.every(r => r.quantity === 400 && r.maxStack === 2400));
  const materials = read("src/content/farm/material-sources.generated.json");
  const wreath = materials["conquest-wreath"].tasks;
  assert.equal(wreath[0].numberOfRuns, 6);
  assert.equal(wreath[1].quest, null);
  assert.equal(wreath[1].rewardQuantity, 2);
  assert.deepEqual(wreath[1].rows.map(r => [r.name,r.quantity]), [["Dage the Evil Insignia",1],["Legion Token",50]]);
  assert.equal(wreath[2].bossId, "ultra-dage");
  assert.equal(wreath[2].rewardQuantity, 5);
  assert.equal(wreath[2].repeatability, "weekly");
  const guide = read("content-sources/farm/import/guide-overrides.json")["https://aqwwiki.wikidot.com/legion-revenant-class"].routes["wiki-location"][0];
  assert.match(guide.steps.find(s => s.id === "lr-5").text, /400 Cohort/);
});

test("Void Crystal branches retain the exact Merge direction and source quantities", () => {
  const sources = read("src/content/farm/material-sources.generated.json");
  const a = sources["void-crystal-a"].tasks[0], b = sources["void-crystal-b"].tasks[0];
  assert.deepEqual(a.rows.map(r => r.quantity), [200,150,200,200]);
  assert.deepEqual(b.rows.map(r => r.quantity), [200,30,15,2]);
  assert.equal(b.rows.at(-1).name, "Elders' Blood");
  assert.equal(a.map, "/join tercessuinotlim");
  assert.equal(a.rewardQuantity, 1);
});

test("class workflows reuse Class Codex identities and separate the weekly Gramiel alternatives", () => {
  const profiles = read("src/content/classes/catalog.json");
  const workflows = read("src/content/farm/class-workflows.generated.json");
  for (const record of workflows) {
    assert.ok(profiles.some(p => p.id === record.canonicalId));
    assert.ok(!get(record.canonicalId));
    assert.ok(record.routes.every(r => r.tasks.every(t => t.map && t.npc)));
  }
  const ap = workflows.find(w => w.canonicalId === "archpaladin-ap");
  assert.equal(ap.routes.length, 3);
  assert.equal(ap.routes[0].tasks.length, 8);
  assert.equal(ap.routes[0].tasks.at(-1).quest, "Sacred Magic: Eden");
  assert.equal(ap.routes[0].shopUnlock.purchase.amount, 0);
  const hbv = workflows.find(w => w.canonicalId === "hollowborn-vindicator-hbv");
  assert.deepEqual(hbv.routes.map(r => r.tasks[0].rows.find(row => row.name === "Hollow Soul (Misc)").quantity), [1500,75]);
  assert.equal(hbv.routes[1].tasks[0].rows.find(r => /Insignia/.test(r.name)).quantity, 5);
  assert.equal(hbv.routes[1].tasks[1].bossId, "gramiel-the-graceful");
  assert.equal(hbv.routes[1].tasks[1].rewardQuantity, 5);
});

test("Wrong Turn rewards stay outside required inputs and preserve one fixed plus one choice", () => {
  const source = read("src/content/farm/material-sources.generated.json")["nation-wrong-turn-at-voidbuquerque"];
  const task = source.tasks[0];
  assert.equal(task.rows.length, 3);
  assert.deepEqual(task.fixedRewards.map(r => [r.name,r.quantity]), [["Unidentified 13",1]]);
  assert.equal(task.rewardChoices.length, 6);
  assert.ok(task.rows.every(row => ![...task.fixedRewards,...task.rewardChoices].some(reward => reward.name === row.name)));
  const gem = read("src/content/farm/material-sources.generated.json")["gem-of-nulgath"].tasks.find(task => task.quest === "Wrong Turn at Voidbuquerque");
  assert.equal(gem.reward, "Unidentified 13 ×1; Gem of Nulgath ×35");
});

test("Arcana resource exchanges preserve OR recipes and direct drop materials keep their evidence", () => {
  const materials = read("src/content/farm/material-sources.generated.json");
  const arcana = materials["1-the-magician-s-desire"].tasks;
  assert.equal(arcana.length, 2);
  assert.equal(arcana[0].rows.length, 4);
  assert.deepEqual(arcana[1].rows.map(r => [r.name,r.quantity]), [["Arcana's Debris",4]]);
  assert.equal(arcana[0].alternativeGroup, arcana[1].alternativeGroup);
  const debris = materials["arcana-s-debris"].tasks;
  assert.deepEqual(debris.map(t => t.rows.map(r => [r.name,r.quantity])), [[["King Drago Insignia",1]],[["Darkon Insignia",1]]]);
  const sapphire = materials["sapphire-orb"].tasks[0].rows[0];
  assert.equal(sapphire.map, "/join frozenlair");
  assert.equal(sapphire.monster, "Legion Lich Lord (Monster)");
  assert.equal(sapphire.sourceDetails[0].evidence.length, 2);
});
