import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import {
  farmItemHref,
  farmItemId,
  filterFarm,
  farmRegionCounts,
  searchFarm,
  farmableNow,
  farmRoutes,
} from "../src/lib/farm-catalog.mjs";
import { isComingSoon } from "../src/lib/site-feature-access.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p));
const { items, regions } = read("src/content/farm/catalog.json");
const manifest = read("src/content/farm/manifest.json");
test("offline Farm audit verifies source/export integrity and local art provenance", () => {
  execFileSync(process.execPath, ["scripts/audit-farm.mjs"]);
});
test("geography follows maps, factions remain unknown, and overlapping map membership is documented", () => {
  assert.deepEqual(
    regions.map((r) => r.id),
    ["greenguard-forest", "dwarfhold", "arcangrove"],
  );
  assert.equal(
    items.find((i) => i.id === "cape-of-awe").regionId,
    "greenguard-forest",
  );
  assert.equal(items.find((i) => i.id === "polly-roger").regionId, "dwarfhold");
  assert.match(regions.find((r) => r.id === "dwarfhold").mappingNote, /Yokai/);
  for (const id of [
    "archfiend-doomlord",
    "head-of-the-legion-beast",
    "original-drakath-armor",
  ])
    assert.equal(items.find((i) => i.id === id).regionId, null);
  assert.equal(
    items.find((i) => i.id === "sepulchure-s-doomknight-armor")
      .verificationStatus,
    "needs_review",
  );
});
test("search counts all regions while category filtering stays inside selected geography", () => {
  assert.equal(searchFarm(items, "awe").length, 4);
  assert.equal(
    filterFarm(items, "greenguard-forest", "cape", "awe")[0].id,
    "cape-of-awe",
  );
  assert.equal(filterFarm(items, "dwarfhold", "weapon").length, 0);
  const counts = farmRegionCounts(items, regions, "polly");
  assert.equal(counts.find((r) => r.id === "dwarfhold").count, 1);
  assert.equal(counts.find((r) => r.id === "greenguard-forest").count, 0);
  assert.equal(
    filterFarm(items, "unverified", "armor").some(
      (i) => i.id === "empowered-undead-champion",
    ),
    true,
  );
  assert.equal(
    filterFarm(items, "greenguard-forest", "weapon", "no such equipment")
      .length,
    0,
  );
});
test("alternative recipes retain identity and AND groups; price never comes from sellback", () => {
  const blade = items.find((i) => i.id === "blade-of-awe");
  assert.equal(blade.acquisition.length, 2);
  assert.deepEqual(
    blade.acquisition.map((r) => r.materialTree.requirements.length),
    [5, 1],
  );
  const nsod = items.find((i) => i.id === "necrotic-sword-of-doom");
  assert.equal(nsod.acquisition.length, 2);
  assert.equal(nsod.price, null);
  assert.equal(items.filter((i) => i.id === "blade-of-awe").length, 1);
});
test("source links and original imported Farm URLs remain distinct from item routes", async () => {
  const result = await build({
    stdin: {
      contents:
        "export {resolveRoute} from './src/lib/routes';export {guides,categories} from './src/content/data';",
      resolveDir: process.cwd(),
      loader: "ts",
    },
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    packages: "external",
  });
  const { resolveRoute, guides, categories } = await import(
    "data:text/javascript;base64," +
      Buffer.from(result.outputFiles[0].text).toString("base64")
  );
  for (const item of items) {
    const href = farmItemHref(item.id);
    assert.equal(farmItemId(href), item.id);
    assert.equal(resolveRoute(href, guides, categories).is404, false);
    assert.equal(isComingSoon(href), false);
  }
  for (const page of manifest.guideRecords) {
    const route = resolveRoute(page.href, guides, categories);
    assert.equal(route.is404, false, page.href);
    assert.equal(route.entry?.imported?.id, page.id);
    assert.ok(fs.existsSync("public" + route.entry.imported.bodyUrl));
  }
  for (const path of [
    "/farm/item",
    "/farm/item/missing",
    "/farm/item/blade-of-awe/extra",
    "/farm/missing",
    "/farm/%E0%A4%A",
  ])
    assert.equal(resolveRoute(path, guides, categories).is404, true, path);
  assert.equal(isComingSoon("/farm"), false);
  assert.equal(isComingSoon("/trang-bi"), true);
});

test("Farmable Now excludes seasonal, uncertain, paid-only and conflicting records", () => {
  const now = items.filter(farmableNow);
  assert.deepEqual(
    now.map((i) => i.id),
    ["blade-of-awe", "armor-of-awe", "cape-of-awe", "shaman"],
  );
  assert.equal(farmableNow({ ...now[0], price: { value: "2,000 AC" } }), false);
  assert.equal(filterFarm(now, "all").length, 4);
  const blade = items.find((i) => i.id === "blade-of-awe");
  assert.equal(farmRoutes(blade, "greenguard-forest").length, 1);
  assert.equal(farmRoutes(blade, "all").length, 2);
  assert.equal(
    filterFarm(items, "all").filter((i) => i.id === blade.id).length,
    1,
  );
});
test("import validation rejects duplicate IDs, unknown category, bad URL and Region", async () => {
  const { validateFarmCatalog } = await import(
    "../src/lib/farm-validation.mjs"
  );
  for (const change of [
    (i) => (i.type = "material"),
    (i) => (i.regionId = "nation"),
    (i) => (i.sources = ["javascript:alert(1)"]),
  ]) {
    const item = structuredClone(items[0]);
    change(item);
    assert.ok(validateFarmCatalog({ items: [item], regions }).length);
  }
  assert.ok(
    validateFarmCatalog({ items: [items[0], items[0]], regions }).length,
  );
});

test("multi-Region routes count a canonical identity once per matching Region", () => {
  const item = structuredClone(items.find((i) => i.id === "blade-of-awe"));
  item.acquisition[1].regionId = "arcangrove"; // Test fixture only; not a published geographical claim.
  const counts = farmRegionCounts([item], regions);
  assert.equal(counts.find((r) => r.id === "all").count, 1);
  assert.equal(counts.find((r) => r.id === "greenguard-forest").count, 1);
  assert.equal(counts.find((r) => r.id === "arcangrove").count, 1);
  assert.equal(filterFarm([item], "arcangrove").length, 1);
  assert.equal(farmRoutes(item, "arcangrove")[0].id, item.acquisition[1].id);
});
