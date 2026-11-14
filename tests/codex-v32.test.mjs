import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { comboFlow } from "../src/lib/class-presentation.mjs";
import { comboContext } from "../src/lib/combo-context.mjs";
import { validateFarmV2 } from "../src/lib/farm-v2.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
test("every combo branch and priority slot resolves to its own canonical skill and approved local asset", () => {
  for (const profile of read("src/content/classes/catalog.json")) {
    const body = read("public" + profile.bodyUrl);
    for (const combo of body.combos)
      for (const flow of comboFlow(combo))
        for (const slot of [
          ...flow.sequences.flat(),
          ...(flow.prioritySkill ? [flow.prioritySkill] : []),
        ]) {
          const skill = body.skills.find(
            (s) => s.skillNumber === slot && !s.quarantined,
          );
          assert.ok(skill, profile.id + " slot " + slot);
          assert.equal(skill.iconAsset?.classId, skill.classId);
          assert.equal(skill.iconAsset?.skillId, skill.id);
          assert.equal(skill.iconAsset?.verificationStatus, "verified");
          assert.equal(skill.iconAsset?.usageStatus, "approved_noncommercial");
          assert.ok(fs.existsSync("public" + skill.iconAsset.imagePath));
        }
  }
});
test("recovered slot mapping retains exact source bytes and named skills of the same class", () => {
  const registry = read("src/content/classes/skill-registry.json");
  for (const [classId, record] of Object.entries(
    read("content-sources/class-recovery/combo-slot-evidence.json"),
  )) {
    assert.equal(
      createHash("sha256")
        .update(fs.readFileSync(record.sourceFile))
        .digest("hex"),
      record.sourceHash,
    );
    assert.deepEqual(
      record.slots.map((r) => r.slot),
      [1, 2, 3, 4, 5],
    );
    for (const slot of record.slots)
      assert.ok(
        registry.skills.some(
          (s) =>
            s.classId === classId &&
            s.skillId === slot.skillId &&
            s.officialName === slot.name &&
            s.iconAssetId === slot.iconAssetId,
        ),
      );
  }
});
test("Timing and condition classification preserves complete conditional sentences", () => {
  const text =
    "Support: 2 → 3. Chỉ dùng 4 khi đủ 3 stack. Skill 5 chỉ dùng khi Mana thấp.";
  const result = comboContext(text);
  assert.deepEqual(result.timing, ["Support: 2 → 3."]);
  assert.deepEqual(result.conditions, [
    "Chỉ dùng 4 khi đủ 3 stack.",
    "Skill 5 chỉ dùng khi Mana thấp.",
  ]);
  assert.equal([...result.timing, ...result.conditions].join(" "), text);
  assert.deepEqual(comboContext(""), { timing: [], conditions: [] });
});
test("Calendar item sets preserve year-specific mechanisms, groups and exact image hashes", () => {
  const sets = read("src/content/classes/calendar-items.json");
  for (const [year, set] of Object.entries(sets)) {
    assert.equal(set.items.length, 6);
    assert.equal(new Set(set.items.map((i) => i.wiki)).size, 6);
    assert.equal(set.items.filter((i) => i.group === "hourglass").length, 3);
    for (const item of set.items) {
      assert.ok(item.details.length);
      assert.equal(item.evidence.source, item.wiki);
      if (item.image)
        assert.equal(
          createHash("sha256")
            .update(fs.readFileSync("public" + item.image))
            .digest("hex"),
          item.evidence.imageHash,
        );
      else assert.equal(item.imageStatus, "PENDING_SOURCE");
    }
  }
  assert.match(
    sets["2019"].items[1].details.join(" "),
    /Corruption Through Time/,
  );
  assert.match(
    sets["2020"].items[1].details.join(" "),
    /Distortion Through Time/,
  );
  assert.notEqual(sets["2019"].items[0].image, sets["2020"].items[0].image);
});
test("Ultra import is canonical, recipe verified, preserves operators and records missing fields honestly", () => {
  const catalog = read("src/content/farm/catalog-v2.generated.json"),
    audit = read("content-sources/farm/import/ultra-import-audit.json"),
    recovery = read("src/content/ultra/recovery.json");
  assert.deepEqual(validateFarmV2(catalog), []);
  assert.ok(audit.added.length > 0);
  assert.equal(
    new Set(catalog.items.map((i) => i.wikiUrl)).size,
    catalog.items.length,
  );
  for (const id of audit.added) {
    const item = catalog.items.find((i) => i.id === id),
      source = recovery.equipment[id];
    assert.ok(item);
    assert.equal(source.materialConfidenceStatus, "verified");
    assert.deepEqual(
      item.acquisitionRoutes[0].materialTree,
      source.materialTree,
    );
    assert.ok(item.groupIds.length <= 1);
    assert.ok(audit.records.some((r) => r.id === id && r.sourceTextHash));
  }
});

test("Calendar skill effects never borrow consumables from a different year; raw excluded rows stay in audit", () => {
  const profiles = read("src/content/classes/catalog.json");
  for (const id of [
    "calendar-corrupted-chronomancer",
    "calendar-timeless-chronomancer",
    "calendar-underworld-chronomancer",
    "calendar-overworld-chronomancer",
  ]) {
    const body = read("public" + profiles.find((p) => p.id === id).bodyUrl);
    const text = body.skills
      .flatMap((s) => (s.effects || []).map((e) => e.text))
      .join(" ");
    if (/corrupted|timeless/.test(id)) {
      assert.doesNotMatch(text, /Timepiece of/);
      assert.doesNotMatch(text, /giảm 500%/);
      assert.match(text, /giảm 80%/);
    } else
      assert.doesNotMatch(text, /(?:Entropic|Foresee|Infinite) Corruption/);
    assert.ok(body.skills.some((s) => s.calendarItemScope?.excluded.length));
  }
});
