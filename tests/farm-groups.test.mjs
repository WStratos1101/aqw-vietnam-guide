import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { validateFarmV2 } from "../src/lib/farm-v2.mjs";
import { assignFarmGroups } from "../scripts/lib/farm-groups.mjs";
import {
  matchesGroup,
  groupCounts,
  resolveGroup,
} from "../src/lib/farm-groups.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const manifest = read("content-sources/farm/faction-groups.json");
const catalog = read("src/content/farm/catalog-v2.generated.json");
const extracts = read("content-sources/farm/import/source-extracts.json");
const baseline = read(
  "content-sources/farm/import/group-migration-baseline.json",
);
export const stable = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
test("all baseline canonical facts, approved images, geography, sources and recipes survive", () => {
  assert.equal(catalog.items.length, baseline.canonicalTotal);
  assert.ok(catalog.items.length >= 232);
  assert.deepEqual(catalog.regions, baseline.regions);
  for (const item of catalog.items) {
    // V3.1 adds independently tested details/roles/guides. Preserve the exact
    // complete V3 baseline projection; no existing gameplay field is excluded.
    const {
      groupIds,
      groupEvidence,
      groupStatus,
      wikiDetails,
      classRoles,
      classRoleEvidence,
      acquisitionBrief,
      ...facts
    } = item;
    facts.acquisitionRoutes = facts.acquisitionRoutes.map(
      ({ guidePaths, ...route }) => route,
    );
    assert.equal(
      createHash("sha256").update(stable(facts)).digest("hex"),
      baseline.itemHashes[item.id],
      item.id,
    );
  }
});
test("aliases and source order are manifest driven; mixed chapter is never an alias", () => {
  assert.equal(resolveGroup("museum", manifest), "awe");
  assert.equal(resolveGroup("forge", manifest), "blacksmithing");
  assert.equal(resolveGroup("Debris & Astravian", manifest), "all");
  assert.deepEqual(
    manifest.groups.slice(0, 4).map((g) => g.id),
    ["awe", "good", "chaos", "evil"],
  );
  const root = extracts.pages.find(
    (p) => p.url === manifest.siteUrl.split("?")[0],
  );
  for (const group of manifest.groups.filter((g) => g.siteSection))
    assert.ok(
      root.links.includes(root.url + "/" + group.siteSection),
      group.id,
    );
});
test("memberships have reproducible source section evidence, line bounds, and idempotent replay", () => {
  const copy = structuredClone(catalog.items);
  assignFarmGroups(copy, extracts, manifest);
  assert.deepEqual(copy, catalog.items);
  assignFarmGroups(copy, extracts, manifest);
  assert.deepEqual(copy, catalog.items);
  for (const item of copy) {
    assert.equal(new Set(item.groupIds).size, item.groupIds.length);
    for (const id of item.groupIds)
      assert.ok(item.groupEvidence.some((e) => e.groupId === id));
    for (const evidence of item.groupEvidence) {
      const page = extracts.pages.find((p) => p.url === evidence.sourceUrl);
      assert.ok(page);
      assert.ok(evidence.heading);
      assert.ok(
        evidence.lines.every(
          (n) => n > 0 && n <= page.text.split(/\r?\n/).length,
        ),
      );
      assert.notEqual(evidence.chapter, "I. Farming List");
    }
  }
});
test("mixed Docs chapter splits by heading; unknown geography and name cannot assign groups", () => {
  const url = "https://docs.google.com/document/fixture";
  const pages = [
    {
      url,
      sourceDocument: "google-docs",
      text: "I. Farming List\nGoal\nXII. Debris & Astravian\nAmbiguous\n1. Arcana Invoker (AI) Class Obtain Guide\nItem A\n2. Higure & Astravian Corsair Guide\nItem B",
    },
  ];
  const item = (n) => ({
    id: String(n),
    name: "Legion Nulgath",
    regions: [],
    provenance: [{ sourceUrl: url, lines: [n] }],
  });
  const items = [2, 4, 6, 8].map(item);
  assignFarmGroups(items, { pages }, manifest);
  assert.deepEqual(
    items.map((i) => i.groupIds),
    [[], [], ["darkons-debris"], ["astravian"]],
  );
  assert.ok(matchesGroup(items[0], "unknown"));
  assert.ok(!matchesGroup(items[0], "nation"));
  const override = {
    ...manifest,
    overrides: {
      2: {
        groupIds: ["awe"],
        reason: "Reviewed fixture",
        evidence: [{ groupId: "awe", sourceUrl: url }],
      },
    },
  };
  assignFarmGroups(items, { pages }, override);
  assert.deepEqual(items[0].groupIds, ["awe"]);
});
test("multi-group membership and category counts do not duplicate canonical totals", () => {
  const item = {
    id: "fixture",
    category: "Weapons",
    groupIds: ["good", "awe", "good"],
  };
  const counts = groupCounts([item, item], manifest.groups);
  for (const id of ["all", "good", "awe"])
    assert.equal(counts.find((g) => g.id === id).count, 1);
  assert.equal(counts.find((g) => g.id === "unknown").count, 0);
  for (const group of manifest.groups) {
    const scoped = catalog.items.filter((i) => matchesGroup(i, group.id));
    assert.equal(new Set(scoped.map((i) => i.id)).size, scoped.length);
    assert.equal(
      [
        "Weapons",
        "Armors",
        "Helms",
        "Capes / Back Items",
        "Pets",
        "Classes",
      ].reduce((n, c) => n + scoped.filter((i) => i.category === c).length, 0),
      scoped.length,
    );
  }
});

test("catalog validation rejects invented groups and unsupported provenance", () => {
  for (const mutate of [
    (c) => c.items[0].groupIds.push("invented"),
    (c) => {
      c.items[0].groupEvidence = [];
    },
    (c) => {
      c.items[0].groupEvidence.forEach(
        (e) => (e.sourceUrl = "javascript:invalid"),
      );
    },
  ]) {
    const copy = structuredClone(catalog);
    mutate(copy);
    assert.ok(validateFarmV2(copy).some((e) => e.includes("group")));
  }
});
