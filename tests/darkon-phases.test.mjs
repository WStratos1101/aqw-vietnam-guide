import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
const model = JSON.parse(
  fs.readFileSync("src/content/ultra/darkon-phases.json"),
);
const reviewed = JSON.parse(
  fs.readFileSync("content-sources/recovery/darkon-combat-reviewed.json"),
);
// Execute the same projection used by the UI rather than repeating it in tests.
const compiled = await build({
  entryPoints: ["src/lib/boss-phases.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { encounterForPhase } = await import(
  "data:text/javascript;base64," +
    Buffer.from(compiled.outputFiles[0].text).toString("base64")
);
const base = JSON.parse(fs.readFileSync("src/content/ultra/recovery.json"))
  .inspection[model.bossId];
const project = (p) => encounterForPhase(base, p, model.attacks);
test("Darkon has exactly four manual tactical phases and one canonical ID per official attack", () => {
  assert.deepEqual(
    model.phases.map((p) => p.name),
    ["Overture", "Recitative", "Madness", "Rush"],
  );
  assert.deepEqual(
    model.phases.map((p) => p.phaseOrder),
    [1, 2, 3, 4],
  );
  assert.equal(
    new Set(model.attacks.map((a) => a.id)).size,
    model.attacks.length,
  );
  for (const name of ["Auto Attack", "Special 1", "Special 2"])
    assert.equal(
      model.attacks.filter((a) => a.officialName === name).length,
      1,
    );
  assert.ok(
    !model.attacks.some((a) => ["Madness", "Rush"].includes(a.officialName)),
  );
});
test("phase projection shows one Special 1/2 with the right source effects, preserving shared base stats", () => {
  for (const p of model.phases) {
    const e = project(p);
    assert.deepEqual(e.monsters, base.monsters);
    for (const name of ["Special 1", "Special 2"])
      assert.equal(e.activeSkills.filter((s) => s.name === name).length, 1);
    assert.equal(
      e.activeSkills.find((s) => s.name === "Special 1").damage,
      "90% HP hiện tại",
    );
    assert.equal(
      e.activeSkills.find((s) => s.name === "Special 2").damage,
      "150 (trước hệ số sát thương chí mạng)",
    );
    for (const s of e.activeSkills) assert.equal(s.source, reviewed.source);
  }
  const text = (p) => JSON.stringify(project(p).activeSkills);
  assert.match(text(model.phases[0]), /Melancholic Melodies/);
  assert.doesNotMatch(text(model.phases[0]), /Seed Planted|The Last Symphony/);
  assert.match(text(model.phases[1]), /Seed Planted/);
  assert.doesNotMatch(
    text(model.phases[1]),
    /Elegy of Madness|The Last Symphony/,
  );
  for (const p of model.phases.slice(2)) {
    assert.match(text(p), /The Last Symphony/);
    assert.match(text(p), /Dirge of Astravia/);
    assert.doesNotMatch(text(p), /Seed Planted|Elegy of Madness/);
  }
});
test("global passives and global timeline survive every phase with no Phase 5 or fake timer", () => {
  for (const p of model.phases) {
    assert.deepEqual(project(p).passiveSkills, base.passiveSkills);
    for (const n of ["The Cycle's End", "End of the World", "Curtain Call"])
      assert.ok(project(p).activeSkills.some((s) => s.name === n));
  }
  assert.deepEqual(
    model.timeline.map((e) => e.triggerValue),
    [30, 270, 273],
  );
  assert.ok(!model.phases.some((p) => /World|Curtain/.test(p.name)));
  assert.ok(base.passiveSkills.some((p) => p.name === "Boss Shield"));
  assert.ok(base.passiveSkills.some((p) => p.effect.includes("Stun")));
});
test("Aria activation and independent durations stay distinct from Rush residual effects", () => {
  const madness = model.phases[2],
    rush = model.phases[3];
  assert.match(madness.trigger, /20%.*90%/);
  assert.equal(madness.officialState, rush.officialState);
  const aria = project(madness).activeSkills.find((s) => s.name === "Aria");
  assert.ok(aria.bossEffects.some((t) => t.includes("90% HP tối đa")));
  assert.deepEqual(
    madness.phaseModifiers.filter((m) => m.duration).map((m) => m.duration),
    [10, 20, 30, 50, 50],
  );
  assert.equal(rush.phaseModifiers.filter((m) => m.duration).length, 0);
  assert.match(rush.phaseModifiers[0].effect, /200%/);
  assert.match(rush.phaseModifiers[0].effect, /Requiem for the Wicked/);
  assert.ok(
    !project(rush).activeSkills.some(
      (s) =>
        s.name === "Overture" || s.name === "Recitative" || s.name === "Aria",
    ),
  );
  assert.equal(
    project(madness).activeSkills.find((s) => s.name === "Aria").damage,
    undefined,
  );
});
test("phase strategy keeps exact sourced VHL sequences, explicit Taunt variants and warning conditions", () => {
  assert.deepEqual(model.phases[0].recommendedRotations[0].sequence, [
    "4",
    "5",
    "3",
    "2",
    "4",
    "3",
    "2",
    "4",
    "3",
    "2",
  ]);
  assert.deepEqual(model.phases[1].recommendedRotations[0].sequence, [
    "5",
    "3",
    "2",
  ]);
  assert.deepEqual(model.phases[2].recommendedRotations[0].sequence, [
    "5",
    "3",
    "2",
  ]);
  assert.deepEqual(
    model.phases[3].recommendedRotations[0].sequence,
    model.phases[0].recommendedRotations[0].sequence,
  );
  assert.match(model.phases[3].recommendedRotations[0].notes, /Site/);
  for (const p of model.phases) {
    assert.ok(p.tauntStrategy.includes("Docs:"));
    for (const r of p.recommendedRotations)
      assert.ok(r.source.startsWith("https://docs.google.com/"));
  }
});

const combatCompiled = await build({
  entryPoints: ["src/lib/combat-inspection.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
});
const { attackDamageFor } = await import(
  "data:text/javascript;base64," +
    Buffer.from(combatCompiled.outputFiles[0].text).toString("base64")
);
test("damage views preserve fixed, range, current/max HP, pre-Crit and explicitly conditional source formulas", () => {
  const examples = [
    ["fixed", "1200"],
    ["range", "1000 – 1500"],
    ["current-hp", "90% HP hiện tại"],
    ["max-hp", "75% HP tối đa"],
    ["before-crit", "100 (trước hệ số sát thương chí mạng)"],
    ["conditional", "2.000 nếu mục tiêu có debuff; 500 nếu không"],
  ];
  const skills = examples.map(([damageFormat, damage], i) => ({
    id: String(i),
    monsterId: "boss",
    name: "Source attack " + i,
    damageFormat,
    damage,
    damageType: "True Damage",
    source: "https://aqwwiki.wikidot.com/darkon-the-conductor",
  }));
  const rows = attackDamageFor(skills, "boss");
  assert.equal(rows.length, 6);
  assert.equal(rows[0].minDamage, 1200);
  assert.equal(rows[1].minDamage, 1000);
  assert.equal(rows[1].maxDamage, 1500);
  for (let i = 2; i < rows.length; i++) {
    assert.equal(rows[i].minDamage, null);
    assert.equal(rows[i].maxDamage, null);
    assert.equal(rows[i].displayDamage, examples[i][1]);
  }
});
