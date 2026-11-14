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
