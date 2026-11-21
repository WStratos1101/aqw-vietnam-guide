import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = JSON.parse(fs.readFileSync("content-sources/farm/source-recovery/items-20261120.json", "utf8"));
const ids = [
  "nightmare-carnax-s-guardians", "hollowborn-reaper-s-scythe", "void-avenger-scythe",
  "taro-s-prismatic-manslayer", "ultimate-lich-king", "burning-blade-of-abezeth",
  "archfiend-baby-dragon", "burning-blade", "prismatic-floating-sigil",
  "sheathed-providence", "prismatic-sigil", "providence",
];

test("Source Recovery covers the exact 12 canonical Farm identities and keeps them review-gated", () => {
  assert.deepEqual(source.records.map(record => record.id).sort(), [...ids].sort());
  for (const record of source.records) {
    assert.equal(record.data.verificationStatus, "needs-review", record.id);
    assert.equal(record.data.recoveryImage.status, "blocked-download", record.id);
    assert.equal(record.data.recoveryImage.localPath, null, record.id);
    assert.ok(Object.keys(record.data.fieldEvidence).length >= 5, record.id);
    assert.ok(record.route.source.startsWith("https://aqwwiki.wikidot.com/"), record.id);
  }
});

test("Burning Blade of Abezeth preserves both Wiki recipe alternatives", () => {
  const record = source.records.find(item => item.id === "burning-blade-of-abezeth");
  assert.equal(record.route.materialTree.kind, "anyOf");
  assert.equal(record.route.materialTree.requirements.length, 2);
  assert.deepEqual(record.route.materialTree.requirements[0].requirements, [["Champion Sash", 20], ["Gold Voucher 500k", 3]]);
  assert.deepEqual(record.route.materialTree.requirements[1].requirements, [["Dual Burning Blades Of Abezeth", 1]]);
});

test("Canonical corrections distinguish Permanent Lich King, pet, Ground, and Staff", () => {
  const record = id => source.records.find(item => item.id === id);
  assert.equal(record("ultimate-lich-king").data.name, "Ultimate Lich King (Permanent)");
  assert.equal(record("archfiend-baby-dragon").data.subtype, "Pet");
  assert.equal(record("archfiend-baby-dragon").data.category, "Pets");
  assert.equal(record("prismatic-sigil").data.category, "Grounds");
  assert.equal(record("prismatic-sigil").data.subtype, "Ground");
  assert.equal(record("providence").data.subtype, "Staff");
  assert.deepEqual(record("providence").data.effects, ["51% damage to all monsters"]);
});
