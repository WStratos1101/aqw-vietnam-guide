import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { farmWikiFacts } from "../scripts/lib/farm-wiki-facts.mjs";
import {
  routesFor,
  matchesRegion,
  validateFarmV2,
  UNKNOWN_REGION,
} from "../src/lib/farm-v2.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const catalog = read("src/content/farm/catalog-v2.generated.json");
test("Wiki facts preserve explicit merge quantities, avoid enhancement level and reject ambiguous alternatives", () => {
  const record = {
    wikiUrl: "https://aqwwiki.wikidot.com/fixture",
    text: "Location: Verified Merge - Place\nPrice: N/A\nMerge the following:\nToken x15,000\nRelic x1\nSellback: 0 AC\nRarity: Epic Rarity\nLevel: 100\nNotes:\nAn unrelated item x999",
  };
  const facts = farmWikiFacts(record);
  assert.equal(facts.level, null);
  assert.equal(facts.rarity, "Epic Rarity");
  assert.equal(facts.location, "Verified Merge - Place");
  assert.deepEqual(facts.materialTree.requirements.map((m) => [m.name, m.quantity, m.source]), [
    ["Token", 15000, record.wikiUrl], ["Relic", 1, record.wikiUrl],
  ]);
  assert.equal(farmWikiFacts({ ...record, text: "Required Level: 80\nLevel: 1" }).level, 80);
  for (const text of [
    "Merge the following:\nToken x10\nOR\nRelic x1\nSellback: 0 AC",
    "Merge the following:\nToken x10 OR Relic x1\nSellback: 0 AC",
    "Merge the following:\nToken x0\nSellback: 0 AC",
    "Merge the following:\nToken x10\nMerge the following:\nRelic x1",
    "Merge the following:\nToken x10\nSome unread row\nSellback: 0 AC",
  ]) {
    const result = farmWikiFacts({ ...record, text });
    assert.equal(result.materialTree, null);
    assert.ok(result.recipeReviewReason);
  }
  assert.equal(farmWikiFacts({ ...record, text: "Locations:\nPrice: 0 AC" }).location, null);
});
test("active V2 catalog has unique canonical equipment, valid routes/sources/materials and approved local assets", () => {
  assert.deepEqual(validateFarmV2(catalog), []);
  for (const i of catalog.items)
    if (i.image) {
      assert.ok(fs.existsSync("public" + i.image), i.id);
      assert.ok(!i.unknownFields?.includes("image"), i.id + ": resolved image must not stay unknown");
    }
  for (const id of [
    "bone-dust",
    "legion-token",
    "legion-castle",
    "gem-of-nulgath",
    "aeacus-empowered",
  ])
    assert.ok(
      !catalog.items.some((i) => i.id === id),
      "Non-equipment leaked: " + id,
    );
  assert.equal(
    catalog.items.find((i) => i.id === "blade-of-awe").category,
    "Weapons",
  );
});
test("Hollowborn Oblivion Blade keeps the Wiki recipe and separates Quest reward routes", () => {
  const item = catalog.items.find((entry) => entry.id === "hollowborn-oblivion-blade");
  assert.ok(item);
  assert.equal(item.category, "Weapons");
  assert.equal(item.subtype, "Sword");
  assert.equal(item.primaryGroupId, "hollowborn");
  const merge = item.acquisitionRoutes.find((route) => route.materialTree);
  assert.ok(merge);
  assert.equal(merge.materialTree.requirements[0].itemId, "dual-hollowborn-oblivion-blade");
  assert.equal(merge.materialTree.requirements[0].quantity, 1);
  assert.equal(merge.location, "Yulgar's Dual Wield Drop Off - Nostalgia Quest");
  assert.equal(merge.mapCommand, null);
  const quests = item.acquisitionRoutes.find((route) => route.id === "guide-verified-quest-rewards");
  assert.ok(quests);
  assert.equal(quests.method, "Quest");
  assert.deepEqual(quests.questAlternatives.map((entry) => entry.quest), [
    "Summoning and Stuff",
    "Trading and Stuff (Dual)",
    "Trading and Stuff (Single)",
  ]);
  assert.equal(quests.npc, "Lae");
  assert.equal(quests.mapCommand, "/join tercessuinotlim");
  assert.deepEqual(quests.sourceEvidence, {
    source: "content-sources/farm/manual-guide/FARMING_ITEM_GUIDE_SOURCE.txt",
    startLine: 7685,
    endLine: 7735,
    wikiSource: "https://aqwwiki.wikidot.com/hollowborn-oblivion-blade",
    wikiPageHash: "1df2c66e58c4a889807e83638ef9e6c5524231d528b6ea705f24635b9c771d7d",
  });
});
test("a single mapped shop does not lend its map to a different receiving location", () => {
  const item = catalog.items.find((entry) => entry.id === "crag-bamboozle");
  const shop = item.acquisitionRoutes.find((route) => route.method === "Shop");
  assert.ok(shop);
  assert.equal(shop.purchase.amount, 5000);
  assert.match(shop.location, /Enchanted Nulgath Nation House/);
  assert.match(shop.location, /Tercessuinotlim/);
  assert.equal(shop.mapCommand, null);
});
test("curated identities, recipes, unknown routes, classes and approved art survive V2 adapter", () => {
  const legacy = read("src/content/farm/catalog.json");
  for (const old of legacy.items) {
    const item = catalog.items.find((i) => i.id === old.id);
    assert.ok(item, old.id);
    assert.equal(item.name, old.officialName);
    if (old.image) assert.equal(item.image, old.image.path);
    else if (item.image) {
      if (item.imageEvidence.review) {
        const approval = read("content-sources/farm/review/image-approvals.json").find(a => a.itemId === item.id);
        assert.ok(approval, item.id);
        assert.equal(approval.sourcePage, item.wikiUrl);
        assert.equal(approval.fileHash, createHash("sha256").update(fs.readFileSync("public" + item.image)).digest("hex"));
        assert.equal(item.imageEvidence.originalImageUrl, approval.originalImageUrl);
      } else {
      assert.equal(item.category, "Classes");
      const portraits = read("src/content/classes/portrait-registry.json");
      const asset = portraits.find(a => a.id === item.imageEvidence.assetId);
      assert.ok(asset, item.id + ": new image requires a registered Class portrait");
      assert.equal(asset.imagePath, item.image);
      assert.equal(asset.sourceUrl, item.wikiUrl);
      assert.equal(asset.verificationStatus, "verified");
      assert.equal(asset.usageStatus, "approved_noncommercial");
      assert.ok(asset.policyUrl);
      }
    } else assert.equal(item.image, null);
    assert.equal(item.acquisitionRoutes.length, old.acquisition.length);
    for (const r of old.acquisition)
      assert.deepEqual(
        item.acquisitionRoutes.find((v) => v.id === r.id).materialTree,
        r.materialTree || null,
      );
  }
  const blade = catalog.items.find((i) => i.id === "blade-of-awe");
  assert.equal(routesFor(blade, "greenguard-forest").length, 1);
  assert.equal(routesFor(blade, UNKNOWN_REGION).length, 1);
  assert.equal(matchesRegion(blade, UNKNOWN_REGION), true);
});
test("multi-Region fixtures count once globally and once per matching Region, without leaking materials", () => {
  const item = {
    id: "fixture",
    acquisitionRoutes: [
      { id: "a", regionId: "a", materialTree: { name: "A" } },
      { id: "b", regionId: "b", materialTree: { name: "B" } },
      { id: "u", regionId: null },
    ],
  };
  for (const region of ["all", "a", "b", UNKNOWN_REGION])
    assert.equal([item].filter((i) => matchesRegion(i, region)).length, 1);
  assert.deepEqual(
    routesFor(item, "b").map((r) => r.materialTree),
    [{ name: "B" }],
  );
  assert.equal(matchesRegion({ acquisitionRoutes: [] }, UNKNOWN_REGION), true);
});
test("validator rejects duplicate canonical identities, unknown regions, bad URLs, images and material quantities", () => {
  for (const mutate of [
    (c) => c.items.push(c.items[0]),
    (c) => (c.items[0].acquisitionRoutes[0].regionId = "invented"),
    (c) => (c.items[0].sources[0].url = "javascript:x"),
    (c) => (c.items[0].image = "https://unverified.invalid/img.png"),
    (c) => {
      const i = c.items.find(i => i.imageEvidence?.usageStatus === "approved_noncommercial");
      delete i.imageEvidence.policyUrl;
    },
    (c) =>
      (c.items[0].acquisitionRoutes[0].materialTree.requirements[0].quantity =
        -1),
  ]) {
    const c = structuredClone(catalog);
    mutate(c);
    assert.ok(validateFarmV2(c).length);
  }
});
test("offline generation is idempotent and source coverage counts refer to distinct canonical identities", () => {
  const path = "src/content/farm/catalog-v2.generated.json";
  const before = fs.readFileSync(path, "utf8");
  execFileSync(process.execPath, ["scripts/build-farm-v2.mjs"]);
  assert.equal(fs.readFileSync(path, "utf8"), before);
  const coverage = read("content-sources/farm/import/coverage.json");
  const ids = (k) =>
    catalog.items
      .filter((i) => i.provenance.some((p) => p.sourceDocument === k))
      .map((i) => i.id);
  assert.equal(coverage.sourceA, ids("vncollector").length);
  assert.equal(coverage.sourceB, ids("google-docs").length);
  assert.equal(
    coverage.overlap,
    ids("vncollector").filter((id) => ids("google-docs").includes(id)).length,
  );
});


test("Farm Class links and portraits reuse only exact source entities and approved Class artwork", async () => {
  const { farmClassMedia } = await import("../scripts/lib/farm-class-media.mjs");
  const item = { category: "Classes", wikiUrl: "https://aqwwiki.wikidot.com/fixture-ac" };
  const profiles = [{ id: "class-a", slug: "class-a", image: "portrait-a" }];
  const sources = { "class-a": { sourceUrl: item.wikiUrl } };
  const portrait = { id: "portrait-a", classId: "class-a", sourceUrl: item.wikiUrl,
    imagePath: "/images/aqw/classes/fixture.png", sha256: "hash", policyUrl: "https://policy.invalid",
    verificationStatus: "verified", usageStatus: "approved_noncommercial" };
  assert.equal(farmClassMedia(item, profiles, sources, [portrait]).portrait, portrait);
  for (const patch of [{ classId: "another-class" }, { sourceUrl: "https://aqwwiki.wikidot.com/fixture-legend" },
    { usageStatus: "unverified" }, { imagePath: "/images/aqw/class-skills/slot.png" }])
    assert.equal(farmClassMedia(item, profiles, sources, [{ ...portrait, ...patch }]).portrait, null);
  assert.equal(farmClassMedia({ ...item, category: "Armors" }, profiles, sources, [portrait]), null);
  assert.equal(farmClassMedia({ ...item, wikiUrl: "https://aqwwiki.wikidot.com/fixture-legend" }, profiles, sources, [portrait]), null);
});


test("Wiki acquisition separates exact quest rewards and purchase currency from tags, sellback and ambiguous variants", () => {
  const facts = text => farmWikiFacts({ text, wikiUrl: "https://aqwwiki.wikidot.com/fixture" });
  assert.equal(facts("Price: N/A (Reward from the 'Empower Vordred's Armor' quest)").questReward, "Empower Vordred's Armor");
  assert.deepEqual(facts("Price: 200,000 Gold").purchase, { amount: 200000, currency: "Gold" });
  assert.deepEqual(facts("Price: 2,000 AC").purchase, { amount: 2000, currency: "ACs" });
  assert.deepEqual(facts("Price: 0 AC").purchase, { amount: 0, currency: "ACs" });
  for (const text of ["AC tagged\nSellback: 2,000 AC", "Price: N/A", "Price: 2,000 AC\nPrice: 100 Gold", "Price: N/A (Dropped by Monster)"])
    assert.equal(facts(text).purchase, null);
  assert.equal(facts("Price: N/A (Unlock Shop via 'Quest')").questReward, null);
});

test("geography uses exact evidenced location labels, preserves known routes, and keeps unknown Region for map-only evidence", async () => {
  const {enrichFarmGeography} = await import('../scripts/lib/farm-geography.mjs');
  const route = location => ({id:location,location,regionId:null,mapCommand:null,sources:[]});
  const items = [{id:'fixture',regions:[],unknownFields:['region'],acquisitionRoutes:[route('Shop - Necropolis'),route('ArchMage (Location)'),route('Necropolis Dungeon')]}];
  const evidence = {locations:[{locationLabels:['Shop - Necropolis'],regionId:'doomwood-part-2',mapCommand:'/join necropolis',sources:['https://aqwwiki.wikidot.com/necropolis'],checkedAt:'known-date'},{locationLabels:['ArchMage (Location)'],regionId:null,mapCommand:'/join archmage',sources:['https://aqwwiki.wikidot.com/archmage-location'],checkedAt:'known-date'}]};
  assert.equal(enrichFarmGeography(items,evidence).length,2);
  assert.deepEqual(items[0].regions,['doomwood-part-2']);
  assert.equal(items[0].acquisitionRoutes[2].mapCommand,null);
  assert.equal(items[0].acquisitionRoutes[1].regionId,null);
  assert.ok(items[0].unknownFields.includes('region'));
  items[0].acquisitionRoutes[0].regionId='already-verified';
  enrichFarmGeography(items,evidence);
  assert.equal(items[0].acquisitionRoutes[0].regionId,'already-verified');
});


test("coverage includes every active Region, including sourced extensions", () => {
  const coverage = read("content-sources/farm/import/coverage.json");
  assert.deepEqual(coverage.byRegion, Object.fromEntries(catalog.regions.map(r => [r.name,
    catalog.items.filter(i => i.acquisitionRoutes.some(route => route.regionId === r.id)).length])));
  const necropolis = catalog.items.flatMap(i => i.acquisitionRoutes).filter(r => r.regionId === 'doomwood-part-2');
  assert.ok(necropolis.length > 0);
  for (const r of necropolis) {
    assert.equal(r.mapCommand, '/join necropolis');
    assert.ok(r.geographyEvidence.sources.includes('https://aqwwiki.wikidot.com/necropolis'));
  }
});
