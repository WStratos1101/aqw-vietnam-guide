import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const encounters = JSON.parse(readFileSync("src/content/ultra/inspection.json", "utf8"));
const bosses = JSON.parse(readFileSync("src/content/ultra/bosses.json", "utf8"));
const wikiIndex = JSON.parse(readFileSync("content-sources/boss-codex/index.json", "utf8"));
const wiki = (slug) => wikiIndex.find((entry) => entry.boss === slug && entry.kind === "wiki")?.url;

test("all current Ultra encounters have distinct canonical Monster status records", () => {
  assert.equal(Object.keys(encounters).length, bosses.length);
  for (const boss of bosses) {
    const encounter = encounters[boss.slug];
    assert.ok(encounter, boss.slug);
    assert.equal(encounter.encounterTitle, boss.name);
    assert.ok(encounter.monsters.length > 0);
    assert.ok(encounter.monsters.every((m) => m.level === null || Number.isInteger(m.level)));
    assert.ok(encounter.monsters.every((m) => m.maxHp === null || Number.isInteger(m.maxHp)));
    assert.ok(encounter.monsters.every((m) => m.count > 0 && m.source.startsWith("https://aqwwiki.wikidot.com/")));
  }
  assert.equal(encounters["ultra-speaker"].monsters[0].canonicalName, "The First Speaker");
  assert.equal(encounters["ultra-drago"].monsters.find((m) => m.id === "boss").canonicalName, "King Drago");
  assert.equal(encounters["ultra-tyndarius"].monsters.find((m) => m.id === "orb").count, 2);
  assert.equal(encounters["ultra-drago"].monsters.length, 3);
  assert.equal(encounters["ultra-engineer"].monsters.length, 3);
  assert.deepEqual(encounters["ultra-nulgath"].monsters.map((monster) => monster.canonicalName), ["Nulgath the Archfiend", "Overfiend Blade"]);
  assert.equal(encounters["ultra-nulgath"].monsters[1].maxHp, 1_000_000);
});

test("active skill names, grouped sequences and effects are grounded in Monster pages", () => {
  for (const [slug, encounter] of Object.entries(encounters)) {
    const source = wiki(slug);
    assert.ok(source, `missing Monster source index: ${slug}`);
    for (const skill of encounter.activeSkills) {
      assert.ok(skill.name && !/[à-ỹ]/i.test(skill.name), `${slug}: non-English skill title ${skill.name}`);
      assert.ok(skill.source.startsWith("https://aqwwiki.wikidot.com/"), `${slug}: ${skill.name} has no Wiki page`);
      assert.ok(encounter.monsters.some((monster) => monster.id === skill.monsterId), `${slug}: orphan skill ${skill.name}`);
    }
  }
  assert.ok(encounters["ultra-ezrajal"].activeSkills.some((s) => s.name === "Counter Cast → Counter Attack"));
  assert.ok(encounters["ultra-engineer"].activeSkills.some((s) => s.name === "Charging Devastator Beam → Devastator Beam"));
  assert.ok(encounters["ultra-drago"].activeSkills.some((s) => s.name === "Judgement Day → Judged"));
  assert.ok(encounters["ultra-speaker"].activeSkills.some((s) => s.name === "Power Split → Equalize"));
  assert.ok(encounters["ultra-nulgath"].activeSkills.some((s) => s.monsterId === "overfiend-blade" && s.name === "Sword Charge → Struck Down"));
});

test("passive records separate always-on rules and conditional boss behavior", () => {
  for (const [slug, encounter] of Object.entries(encounters)) {
    assert.ok(encounter.passiveSkills.length > 0, slug);
    for (const passive of encounter.passiveSkills) {
      assert.ok(passive.condition && passive.effect && passive.source, `${slug}: incomplete passive ${passive.id}`);
      assert.ok(encounter.monsters.some((monster) => monster.id === passive.monsterId), `${slug}: orphan passive ${passive.id}`);
      if (!passive.name) assert.ok(["Quy tắc nội tại", "Chỉ số nền"].includes(passive.label), `${slug}: unnamed rule must use a neutral descriptor`);
    }
  }
  const drago = encounters["ultra-drago"].monsters;
  assert.equal(drago.find((m) => m.canonicalName === "King Drago").level, 1);
  assert.equal(drago.find((m) => m.canonicalName === "King Drago").maxHp, 1000);
  assert.ok(encounters["ultra-engineer"].passiveSkills.some((s) => s.id === "drone-shield"));
});
