import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { assignFarmGroups } from "../scripts/lib/farm-groups.mjs";
import { validateFarmV2 } from "../src/lib/farm-v2.mjs";
import {
  groupCounts,
  matchesGroup,
  resolveGroup,
} from "../src/lib/farm-groups.mjs";

const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const manifest = read("content-sources/farm/faction-groups.json");
const catalog = read("src/content/farm/catalog-v2.generated.json");
const goals = read(
  "content-sources/farm/manual-faction-guide/faction_goals.json",
).goals;
const aliases = read("content-sources/farm/import/faction-goal-aliases.json");
const itemMappings = read("content-sources/farm/import/faction-item-mappings.json");
const legacyGroups = read("content-sources/farm/import/group-reconciliation-before.json").items;

test("manual guide chapters and aliases define the only selectable groups", () => {
  assert.deepEqual(
    manifest.groups.map((group) => group.id),
    [
      "good",
      "evil",
      "chaos",
      "awe",
      "blacksmithing",
      "nation",
      "legion",
      "dragonkin",
      "elemental",
      "hollowborn",
      "debris-astravian",
    ],
  );
  assert.equal(resolveGroup("museum", manifest), "awe");
  assert.equal(resolveGroup("forge", manifest), "blacksmithing");
  assert.equal(resolveGroup("Debris & Astravian", manifest), "debris-astravian");
  assert.ok(!manifest.groups.some((group) => group.id === "other"));
});

test("catalog primary groups match exact canonical names and retain guide line evidence", () => {
  const checked = structuredClone(catalog.items);
  assignFarmGroups(checked, goals, manifest, aliases, itemMappings, legacyGroups);
  assert.deepEqual(checked, catalog.items);
  for (const item of checked) {
    assert.equal(item.groupIds.length, item.primaryGroupId ? 1 : 0, item.id);
    assert.equal(item.groupIds[0] ?? null, item.primaryGroupId, item.id);
    if (item.primaryGroupId) {
      const evidence = item.groupEvidence.find(
        (entry) => entry.groupId === item.primaryGroupId,
      );
      assert.ok(evidence, item.id);
      assert.equal(evidence.sourceDocument, "manual-faction-guide");
      assert.ok(Number.isInteger(evidence.sourceLine));
      const goalEvidence = goals.some(
          (goal) =>
            goal.name === evidence.goalName &&
            goal.source_line === evidence.sourceLine &&
            goal.group_id === item.primaryGroupId,
        );
      if (evidence.matchKind === "reviewed-canonical-item") {
        assert.ok(itemMappings.some((mapping) =>
          mapping.itemId === item.id && mapping.sourceLine === evidence.sourceLine && mapping.primaryGroupId === item.primaryGroupId,
        ));
      } else assert.equal(goalEvidence, true, item.id);
    }
  }
});

test("known chapter items stay separate, while ungrouped and referenced items stay unknown", () => {
  const group = (id) => catalog.items.find((item) => item.id === id);
  assert.equal(group("dragonblade-of-nulgath").primaryGroupId, "nation");
  assert.equal(group("legion-dragonblade-of-nulgath").primaryGroupId, "legion");
  for (const id of ["blade-of-awe", "armor-of-awe", "helm-of-awe", "cape-of-awe"])
    assert.equal(group(id).primaryGroupId, "awe", id);
  assert.equal(group("void-light-of-destiny").primaryGroupId, "nation");
  assert.equal(
    group("dual-hollowborn-shadows-of-fate").primaryGroupId,
    "hollowborn",
  );
  assert.equal(group("dragon-of-time-class").primaryGroupId, "dragonkin");
  assert.equal(group("frost-spiritreaver-class").primaryGroupId, "elemental");
  assert.equal(group("naval-commander-class").primaryGroupId, null);
  for (const item of catalog.items.filter((entry) =>
    entry.groupEvidence.some((evidence) => evidence.status === "ungrouped-source-chapter"),
  )) {
    assert.equal(item.primaryGroupId, null, item.id);
    assert.deepEqual(item.groupIds, [], item.id);
  }
});

test("reviewed catalog suffix aliases map only to their named guide goal", () => {
  const itemById = new Map(catalog.items.map((item) => [item.id, item]));
  for (const alias of aliases) {
    const item = itemById.get(alias.itemId);
    assert.ok(item, alias.itemId);
    const explicit = itemMappings.find((mapping) => mapping.itemId === item.id);
    if (explicit) {
      assert.equal(item.primaryGroupId, explicit.primaryGroupId, alias.itemId);
      assert.equal(item.groupEvidence[0].matchKind, "reviewed-canonical-item", alias.itemId);
      continue;
    }
    const evidence = item.groupEvidence[0];
    assert.equal(evidence.goalName, alias.goalName, alias.itemId);
    assert.equal(evidence.matchKind, "reviewed-canonical-alias", alias.itemId);
    assert.equal(evidence.aliasReason, alias.reason, alias.itemId);
  }
});

test("aggregate guide targets do not create synthetic canonical identities", () => {
  assert.equal(catalog.items.some((item) => item.id === "celestial-of-mysteries"), false);
  assert.equal(catalog.items.some((item) => item.id === "archangel-of-mysteries"), false);
  assert.equal(catalog.items.some((item) => item.id === "headless-pumpkin-set"), false);
});

test("aggregate labels alone do not assign same-named canonical items", () => {
  const candidates = ["void-beetle-general", "void-beetle-warlord", "drakath-the-eternal"];
  const checked = structuredClone(catalog.items).filter((item) => candidates.includes(item.id));
  assignFarmGroups(checked, goals, manifest, aliases);
  for (const item of checked) {
    assert.equal(item.primaryGroupId, null, item.id);
    assert.deepEqual(item.groupEvidence, [], item.id);
  }
});

test("all-inventory and faction counts count unique canonical identities exactly once", () => {
  const counts = groupCounts([...catalog.items, ...catalog.items], manifest.groups);
  assert.equal(counts.find((entry) => entry.id === "all").count, catalog.items.length);
  assert.equal(
    counts.filter((entry) => manifest.groups.some((group) => group.id === entry.id))
      .reduce((total, entry) => total + entry.count, 0) +
      counts.find((entry) => entry.id === "unknown").count,
    catalog.items.length,
  );
  for (const item of catalog.items) {
    assert.equal(
      manifest.groups.filter((group) => matchesGroup(item, group.id)).length,
      item.primaryGroupId ? 1 : 0,
      item.id,
    );
  }
  const expected = {
    good: 17,
    evil: 18,
    chaos: 2,
    awe: 6,
    blacksmithing: 1,
    nation: 80,
    legion: 25,
    dragonkin: 4,
    elemental: 12,
    hollowborn: 7,
    "debris-astravian": 0,
    unknown: 108,
  };
  for (const [id, count] of Object.entries(expected))
    assert.equal(counts.find((entry) => entry.id === id)?.count, count, id);
});

test("all filtered aggregate goals have an explicit expansion or a blocker", () => {
  const expansions = read("content-sources/farm/import/aggregate-item-expansions.json");
  const aggregateKinds = new Set(["set", "collection", "weapon-group", "class-family"]);
  const aggregateGoals = goals.filter((goal) => aggregateKinds.has(goal.record_kind));
  assert.equal(expansions.goals.length, aggregateGoals.length);
  assert.equal(expansions.goals.length, 54);
  const ids = new Set(aggregateGoals.map((goal) =>
    `${goal.group_id}:${goal.source_line}:${goal.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
  ));
  const catalogIds = new Set(catalog.items.map((item) => item.id));
  const seenChildren = new Set();
  for (const expansion of expansions.goals) {
    assert.ok(ids.has(expansion.goalId), expansion.goalId);
    assert.ok(["VERIFIED_COMPLETE", "PARTIAL", "AGGREGATE_PENDING"].includes(expansion.status));
    if (expansion.status !== "VERIFIED_COMPLETE") assert.ok(expansion.blocker, expansion.goalId);
    for (const child of expansion.canonicalChildren) {
      assert.ok(catalogIds.has(child.canonicalId), child.canonicalId);
      assert.equal(child.primaryGroup, expansion.groupId, child.canonicalId);
      assert.ok(!seenChildren.has(child.canonicalId), `duplicate aggregate child: ${child.canonicalId}`);
      seenChildren.add(child.canonicalId);
    }
    for (const output of expansion.unmatchedOutputs || []) {
      assert.ok(Number.isInteger(output.sourceLine), expansion.goalId);
      assert.ok(output.reason, `${expansion.goalId}: ${output.itemName}`);
    }
  }
  const warlock = expansions.goals.find((goal) => goal.goalId === "nation:3880:void-warlock");
  assert.deepEqual(
    warlock.canonicalChildren.map((child) => child.canonicalId).sort(),
    [
      "void-warlock",
      "void-warlock-cape",
      "void-warlock-helm",
      "void-warlock-hood",
      "void-warlock-horns",
      "void-warlock-tendrils-cape",
    ],
  );
  assert.equal(warlock.unmatchedOutputs.length, 6);
});

test("every catalog group assignment validates against manual guide provenance", () => {
  assert.deepEqual(validateFarmV2(catalog), []);
});

test("canonical reward mappings survive goal fallback and generation is idempotent", () => {
  const checked = structuredClone(catalog.items);
  assignFarmGroups(checked, goals, manifest, aliases, itemMappings, legacyGroups);
  assert.deepEqual(checked, catalog.items);
  for (const mapping of itemMappings) {
    const item = checked.find((entry) => entry.id === mapping.itemId);
    assert.equal(item.primaryGroupId, mapping.primaryGroupId, mapping.itemId);
    assert.equal(item.groupEvidence[0].sourceLine, mapping.sourceLine, mapping.itemId);
    if (mapping.parentGoalId)
      assert.ok(goals.some((goal) =>
        `${goal.group_id}:${goal.source_line}:${goal.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` === mapping.parentGoalId,
      ), mapping.itemId);
  }
  assert.equal(checked.filter((item) => Object.hasOwn(item, "legacyGroupId")).length, 280);
});
