import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseRangeTarget } from "../scripts/lib/skill-inspection-v12-10.mjs";
import { isComingSoon } from "../src/lib/site-feature-access.mjs";

const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const catalog = read("src/content/classes/catalog.json");
const bodies = new Map(catalog.map((c) => [c.id, read("public" + c.bodyUrl)]));
const verifiedRanges = new Set(["Close", "Medium", "Long", "Infinite", null]);
test("Active skill range and target are separate typed fields with evidence", () => {
  for (const [id, body] of bodies)
    for (const skill of body.skills) {
      const key = id + "/" + skill.name;
      assert(verifiedRanges.has(skill.rangeCategory), key);
      assert(
        skill.targetCount === null ||
          (Number.isInteger(skill.targetCount) && skill.targetCount > 0),
        key,
      );
      if (skill.passive) {
        assert.equal(skill.rangeCategory, null, key);
        assert.equal(skill.targetCount, null, key);
      } else if (skill.targetCount !== null) {
        assert.match(skill.statsEvidence.targetSource, /^https:\/\//, key);
      }
      if (skill.noAdditionalEffects) {
        if (skill.effectEvidence.normalAttackVerified) {
          assert.match(skill.effectEvidence.supportingSource, /^https:\/\/www.aq.com\/gamedesignnotes\//);
          assert(skill.damageDisplay);
        } else {
          assert.equal(skill.name, "Auto Attack");
          assert.match(skill.effectEvidence.description, /weapon damage\.$/i);
        }
        assert.equal(skill.effectEvidence.notes.length, 0);
      }
      if (skill.effectsVerificationStatus === "verified")
        assert(skill.effects.length, key);
      for (const effect of skill.effects)
        assert.doesNotMatch(
          effect.text,
          /Đối chiếu Wiki|bản dịch tác dụng đang cập nhật/i,
          key,
        );
    }
  assert.equal(
    parseRangeTarget("A medium range attack that deals damage to 3 targets.")
      .targetCount,
    3,
  );
  assert.equal(
    parseRangeTarget(
      "An infinite range attack that deals 120% damage for 8 seconds.",
    ).targetCount,
    null,
  );
  assert.equal(
    parseRangeTarget(
      "A long range attack that targets 1 enemy or 3 enemies when empowered.",
    ).targetCount,
    null,
  );
  assert.equal(
    parseRangeTarget("A medium status skill that applies to 1 target.")
      .rangeCategory,
    "Medium",
  );
});
test("Chaos Bulwark and Wonderful Night retain their exact source values", () => {
  const bulwark = bodies
    .get("chaos-avenger-cav")
    .skills.find((s) => s.name === "Chaos Bulwark");
  assert.deepEqual(
    [
      bulwark.manaCost,
      bulwark.cooldownSeconds,
      bulwark.rankRequired,
      bulwark.rangeCategory,
      bulwark.targetCount,
    ],
    [50, 6, 3, "Infinite", 1],
  );
  assert.deepEqual(
    bulwark.effects.map((e) => e.targets),
    [["ENEMY"], ["SELF"]],
  );
  assert.match(bulwark.effects[1].text, /60%.*15 giây/);
  const night = bodies
    .get("blood-ancient-ba")
    .skills.find((s) => s.name === "Wonderful Night");
  assert.equal(night.passive, true);
  assert.equal(night.rankRequired, 10);
  assert.equal(night.effects[0].text, "Tăng 50% Crit Damage.");
  assert.match(night.effectEvidence.source, /blood-ancient-ac$/);
});
test("Calendar family art, original year, shared skill evidence and variant acquisition are distinct", () => {
  const families = read("src/content/classes/calendar-families.json");
  const runtime = read("src/content/classes/calendar-variant-runtime.json");
  const primaryYears = read("src/content/classes/calendar-membership.json");
  for (const family of families) {
    assert(
      primaryYears.some(
        (row) =>
          row.classId === family.primaryClassId && row.year === family.year,
      ),
    );
    const art = family.variants.map((v) => runtime[v.id].portrait.imagePath);
    assert.equal(new Set(art).size, family.variants.length);
    assert(art.every((p) => fs.existsSync("public" + p)));
    for (const variant of family.variants) {
      assert(runtime[variant.id].acquisition.methods.length);
      assert(
        runtime[variant.id].acquisition.methods.every(
          (m) => m.source === variant.source,
        ),
      );
    }
    const combos = bodies.get(family.primaryClassId).combos;
    assert(
      combos.every((c) =>
        c.source.includes("1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78"),
      ),
    );
    assert(combos.every((c) => c.flow.every((f) => f.sourceLine)));
  }
  const keeper = bodies.get("calendar-timekeeper");
  assert.equal(
    keeper.skills.find((skill) => skill.name === "Compress Time").skillNumber,
    3,
  );
  assert.equal(
    keeper.skills.find((skill) => skill.name === "Relive the Past").skillNumber,
    4,
  );
  const gunslinger = bodies.get("calendar-chrono-shadowslayer");
  assert.equal(gunslinger.skills.length, 8);
  assert(!gunslinger.skills.some((s) => s.name === "Auto Attack"));
  assert.equal(
    gunslinger.skills.find((s) => s.name === "Fire!").skillNumber,
    1,
  );
  assert.deepEqual(
    gunslinger.combos.map((c) => c.title),
    ["Quick Nuke", "Standard", "Advanced", "Dodge Combo"],
  );
  for (const body of bodies.values())
    assert(!body.combos.some((c) => /^(Mở đầu|Bắt đầu)/i.test(c.title)));
});
test("Draft feature locks cover direct routes and leave working codices open", () => {
  for (const route of [
    "/huong-dan",
    "/farm/blade-of-awe",
    "/trang-bi",
    "/he-thong/old-bookmark",
    "/cot-truyen/abc",
    "/gioi-thieu",
    "/class/general-class",
    "/class/class-mechanic",
  ])
    assert(isComingSoon(route), route);
  for (const route of [
    "/",
    "/class",
    "/class/calendar-timekiller",
    "/ultra-boss/ultra-nulgath",
    "/challenge-dungeon",
    "/other-challenges",
    "/farmers",
  ])
    assert(!isComingSoon(route), route);
  const starters = read("src/content/home-starters.json");
  assert.deepEqual(
    starters.map((c) => c.name),
    ["Warrior", "Mage", "Healer", "Rogue"],
  );
  for (const starter of starters) {
    assert(
      catalog.some((c) => c.id === starter.classId && c.slug === starter.slug),
    );
    assert(fs.existsSync("public" + starter.portrait.imagePath));
  }
  const poster = read("src/content/home-poster.json");
  assert(fs.existsSync("public" + poster.imagePath));
  assert.match(poster.sourcePage, /^https:\/\/heromart\.com\/products\/2026-/);
});
