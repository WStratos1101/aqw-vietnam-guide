import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { validateSkillMapping } from "../src/lib/class-skill-validation.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8")),
  catalog = read("src/content/classes/catalog.json"),
  r = read("src/content/classes/skill-registry.json");
test("all 113 Class routes use Codex 12.1 and every original skill has an explicit registry outcome", () => {
  assert.equal(catalog.length, 113 + read("src/content/classes/calendar-extension.json").profiles.length);
  const original = r.skills.filter((s) => !s.supplemental);
  assert.equal(original.length, 604);
  assert.equal(
    new Set(r.skills.map((s) => s.classId + "/" + s.skillId)).size,
    r.skills.length,
  );
  for (const c of catalog) {
    assert.equal(c.codexVersion, "12.1");
    const body = read("public" + c.bodyUrl);
    assert.equal(body.classId, c.id);
    for (const s of body.skills) {
      const record = r.skills.find(
        (r) => r.classId === c.id && r.skillId === s.id,
      );
      assert.ok(record, `${c.id}/${s.id}`);
      assert.ok(
        ["verified", "manual_review"].includes(record.verificationStatus),
      );
      if (record.verificationStatus !== "verified")
        assert.ok(
          !s.iconAsset,
          "Unverified skill must not have a runtime icon",
        );
    }
  }
});
test("verified icons retain exact Class/skill ownership, provenance, approved local bytes and dimensions", () => {
  for (const record of r.skills.filter(
    (s) => s.verificationStatus === "verified",
  )) {
    const c = catalog.find((c) => c.id === record.classId),
      s = read("public" + c.bodyUrl).skills.find(
        (s) => s.id === record.skillId,
      ),
      a = r.assets.find((a) => a.id === record.iconAssetId);
    assert.deepEqual(validateSkillMapping(record, a, c, s), []);
    assert.equal(s.iconAsset.skillId, s.id);
    assert.equal(s.iconAsset.classId, c.id);
    assert.equal(s.iconAsset.id, a.id);
    assert.equal(s.iconAsset.imagePath, a.imagePath);
    assert.equal(s.passive, record.passive);
    assert.equal(s.rankRequirement, record.rankRequirement);
    assert.ok(a.width > 0 && a.height > 0);
    assert.equal(
      createHash("sha256")
        .update(fs.readFileSync("public" + a.imagePath))
        .digest("hex"),
      a.sha256,
    );
  }
});
test("semantic icon checks reject wrong Class/skill, decorative tags and unverifiable approved claims", () => {
  const record = r.skills.find((s) => s.verificationStatus === "verified"),
    c = catalog.find((c) => c.id === record.classId),
    s = read("public" + c.bodyUrl).skills.find((s) => s.id === record.skillId),
    a = r.assets.find((a) => a.id === record.iconAssetId);
  assert.ok(
    validateSkillMapping({ ...record, classId: "other" }, a, c, s).some((e) =>
      e.includes("identity"),
    ),
  );
  assert.ok(
    validateSkillMapping({ ...record, skillId: "other" }, a, c, s).some((e) =>
      e.includes("identity"),
    ),
  );
  assert.ok(
    validateSkillMapping(
      {
        ...record,
        evidence: {
          ...record.evidence,
          iconUrl:
            "https://aqwwiki.wdfiles.com/local--files/image-tags/acsmall.png",
        },
      },
      a,
      c,
      s,
    ).some((e) => e.includes("Decorative")),
  );
  assert.ok(
    validateSkillMapping({ ...record, evidence: null }, a, c, s).some((e) =>
      e.includes("evidence"),
    ),
  );
});
test("VHL buff replacement does not invent skill-key replacement or remove the source slots", () => {
  const c = catalog.find((c) => c.slug.startsWith("void-highlord")),
    b = read("public" + c.bodyUrl);
  const shackle = b.skills.find((s) => s.name === "Shackle"),
    unshackle = b.skills.find((s) => s.name === "Unshackle");
  assert.equal(shackle.skillNumber, 2);
  assert.equal(unshackle.skillNumber, 4);
  assert.equal(shackle.replacesSkillId, undefined);
  assert.equal(unshackle.replacesSkillId, undefined);
});
test("combo steps resolve real slots and acquisition progress uses ordered source-backed steps", () => {
  for (const c of catalog) {
    const b = read("public" + c.bodyUrl);
    for (const combo of b.combos)
      for (const n of combo.sequence)
        assert.ok(
          b.skills.some((s) => !s.passive && s.skillNumber === n),
          `${c.id}/${combo.id}: unknown slot`,
        );
    const prior = new Set();
    for (const s of b.obtainSteps) {
      assert.ok(s.source);
      for (const d of s.dependencies) assert.ok(prior.has(d));
      prior.add(s.id);
    }
  }
});

test("legacy mixed-Class and outdated ability records are retained for audit but excluded from playable skill sets", () => {
  assert.equal(r.skills.filter((s) => s.quarantined).length, 38);
  for (const c of catalog) {
    const b = read("public" + c.bodyUrl);
    const active = b.skills.filter((s) => !s.passive && !s.quarantined);
    assert.equal(active.length, 5, c.id);
    for (const s of b.skills.filter((s) => s.quarantined))
      assert.equal(s.iconAsset, undefined, c.id + "/" + s.id);
  }
});
test("conditional mana/cooldown source strings survive without being flattened to the first number", () => {
  let conditional = 0;
  for (const record of r.skills.filter(
    (s) => s.verificationStatus === "verified",
  )) {
    const c = catalog.find((c) => c.id === record.classId),
      s = read("public" + c.bodyUrl).skills.find(
        (s) => s.id === record.skillId,
      );
    for (const k of ["manaCost", "cooldown"])
      if (record[k + "Display"] && record[k] == null) {
        conditional++;
        assert.equal(s[k], undefined);
        assert.equal(s[k + "Display"], record[k + "Display"]);
      }
  }
  assert.ok(conditional > 0);
});
