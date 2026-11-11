import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { parseLinkedAcquisitionPage } from "../scripts/lib/class-acquisition-source.mjs";
import {
  materialLeaves,
  validateMaterials,
} from "../src/lib/material-requirements.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p));
const initial = read("content-sources/v12-11/initial-queue.json"),
  catalog = read("src/content/classes/catalog.json");
const reviews = read("src/content/classes/verification-recovery-v12-11.json");
const registry = read("src/content/classes/skill-registry.json");
const acquisition = read("src/content/classes/acquisition.json").classes;
const bodies = new Map(catalog.map((c) => [c.id, read("public" + c.bodyUrl)]));
const get = (classId, skillId) =>
  bodies.get(classId).skills.find((s) => s.id === skillId);
const sha = (x) => createHash("sha256").update(x).digest("hex");
test("Recovery reviews bind canonical class/skill identity and exact source snapshots, without replacing icons or combat stats", () => {
  for (const review of reviews) {
    const r = registry.skills.find(
        (r) => r.classId === review.classId && r.skillId === review.skillId,
      ),
      s = get(review.classId, review.skillId);
    assert.equal(review.sourceHash, r.sourceHash);
    assert.equal(review.officialName, r.officialName);
    assert.equal(
      sha(fs.readFileSync(review.evidence.snapshotPath)),
      review.evidence.snapshotHash,
    );
    assert.match(
      review.evidence.source,
      /^https:\/\/www.aq.com\/gamedesignnotes\//,
    );
    assert(review.evidence.rationale.length > 60);
    assert(review.evidence.verifiedAt);
    assert.equal(s.iconAssetId, r.iconAssetId);
    for (const field of [
      "rangeCategory",
      "targetCount",
      "effectsVerificationStatus",
    ])
      if (field in review.patch)
        assert.deepEqual(s[field], review.patch[field]);
  }
  assert.equal(
    get("not-a-mod-nam", "skill-5").cooldownSeconds,
    20,
    "Older official 14s must not overwrite the current cooldown",
  );
  assert.equal(
    get("not-a-mod-nam", "wiki-active-reasonablestrike").targetCount,
    1,
  );
  assert.equal(
    get("not-a-mod-nam", "wiki-active-reasonablestrike").rangeCategory,
    "Close",
  );
  assert.equal(get("paladinslayer-ps", "skill-3").rangeCategory, "Long");
  assert.equal(
    get("skycharged-grenadier-scg", "skill-1").rangeCategory,
    "Long",
  );
  for (const e of initial.skills.filter((e) =>
    e.missingFields.includes("rangeCategory"),
  )) {
    if (
      !reviews.some(
        (r) =>
          r.classId === e.classId &&
          r.skillId === e.skillId &&
          r.patch.rangeCategory,
      )
    )
      assert.equal(
        get(e.classId, e.skillId).rangeCategory,
        null,
        "Do not manufacture unspecified ranges",
      );
  }
});
test("Conflict decisions retain every original conflict and apply corroborated mechanics consistently", () => {
  const conflicts = read("src/content/classes/source-conflicts-v12-11.json");
  assert.equal(
    conflicts.length,
    initial.skills.filter((e) => e.missingFields.includes("sourceConflict"))
      .length,
  );
  for (const c of conflicts) {
    assert(
      c.checkedAt &&
        c.reason &&
        c.official.source &&
        c.community.source &&
        c.confidence,
    );
    const s = get(c.classId, c.skillId);
    assert.equal(
      s.effectsVerificationStatus,
      c.status === "RESOLVED" ? "verified" : "source_conflict",
    );
    if (c.status === "RESOLVED") {
      assert(s.effectEvidence.recoveryReview);
      assert.equal(s.effectEvidence.conflictId, c.id);
    }
  }
  const flight = get("abyssal-angel-aa-abyssal-angel-s-shadow-aas", "skill-2");
  assert.match(flight.effects[0].text, /75%/);
  assert.doesNotMatch(flight.effects.map((e) => e.text).join(" "), /50%.*DoT/);
  const veil = get("abyssal-angel-aa-abyssal-angel-s-shadow-aas", "skill-5");
  assert.equal(veil.effectsVerificationStatus, "source_conflict");
  assert.doesNotMatch(
    veil.effects.map((e) => e.text).join(" "),
    /[6789] giây|chưa thống nhất/,
  );
  for (const id of [
    "calendar-quantum-chronomancer",
    "calendar-continuum-chronomancer",
  ]) {
    const skills = bodies
      .get(id)
      .skills.filter(
        (s) =>
          s.name === "Quantum Shift" ||
          (s.passive && /Quantum (Spiral|Mending)/.test(s.name)),
      );
    assert.equal(skills.length, 2);
    for (const s of skills) {
      assert.match(s.effects.map((e) => e.text).join(" "), /23 giây/);
      assert.doesNotMatch(s.effects.map((e) => e.text).join(" "), /20 giây/);
      assert.match(
        s.effectEvidence.description + " " + s.effectEvidence.notes.join(" "),
        /20 seconds|23 seconds/,
      );
    }
  }
});
test("Normal attacks with newly reviewed damage do not invent additional effects", () => {
  for (const [id, damage] of [
    ["dark-lord-dl-darkside", /66% Spell Power/],
    ["not-a-mod-nam", /100%.*vật lý/],
  ]) {
    const s = get(id, "skill-1");
    assert.equal(s.noAdditionalEffects, true);
    assert.equal(s.effectsVerificationStatus, "verified_none");
    assert.deepEqual(s.effects, []);
    assert.match(s.damageDisplay, damage);
    assert.equal(s.effectEvidence.normalAttackVerified, true);
  }
});
test("Acquisition changes are scoped to the original queue; previously complete unrelated profiles remain byte-equivalent", () => {
  const hashes = read(
    "content-sources/v12-11/acquisition-untouched-hashes.json",
  );
  for (const [id, hash] of Object.entries(hashes))
    assert.equal(sha(JSON.stringify(acquisition[id])), hash, id);
  for (const e of initial.acquisitions) {
    const c = acquisition[e.classId];
    for (const old of e.currentValue.methods.filter(
      (m) => m.detailsStatus === "complete",
    )) {
      const current = c.methods.find((m) => m.id === old.id);
      if (!current) {
        const superseded = c.supersededMethods?.find(
          (r) => r.method.id === old.id,
        );
        assert(superseded?.reason);
        assert.deepEqual(superseded.method, old);
        assert(
          c.methods.some((m) => m.id === superseded.replacedBy && m.quest),
        );
      } else
        assert.deepEqual(
          current,
          old,
          "A previously complete method must not be overwritten: " +
            e.classId +
            "/" +
            old.id,
        );
    }
  }
});
test("Recovered prices, Quest Reward and conditional ownership remain separate methods", () => {
  const oracle = acquisition.oracle.methods.find(
    (m) => m.id === "oracle-shop-1",
  );
  assert.equal(oracle.acquisitionKind, "free");
  assert.equal(oracle.shop.price.amount, 0);
  assert.equal(oracle.shop.map, "Class Hall A");
  assert.equal(oracle.shop.npc, "Ranad");
  const blaze = acquisition[
    "blaze-binder-bb-firelord-summoner-fls"
  ].methods.filter((m) =>
    ["blaze-binder-ac-shop-0", "blaze-binder-ac-shop-1"].includes(m.id),
  );
  for (const m of blaze) {
    assert.equal(m.shop.price.amount, 2000);
    assert.equal(m.shop.price.currency, "AC");
    assert(m.evidence.purchasePrice.source === m.shop.source);
  }
  assert.equal(
    blaze.find((m) => m.shop.map === "Battleon").availability,
    "legacy",
  );
  assert.equal(
    blaze.find((m) => m.shop.map === "Firestorm Forge").availability,
    "available",
  );
  const pirate = acquisition["alpha-pirate-pirate"].methods;
  assert(pirate.some((m) => m.quest?.questName === "Map Recovery"));
  const shop = pirate.find((m) => m.id === "pirate-merge-2");
  assert(shop.shop && !shop.merge);
  assert.equal(shop.acquisitionKind, "ac_purchase");
  assert.match(shop.prerequisites.join(" "), /Classic Alpha Pirate.*or Pirate/);
  const frost = acquisition["frostval-barbarian-fb"].methods;
  assert(
    frost.some((m) => m.quest?.questName === "Unleash the Frostvale Barbarian"),
  );
  const chest = frost.find((m) => m.shop?.shopName === "IceStorm Collection");
  assert.equal(chest.availability, "limited");
  assert.equal(chest.isAvailable, null);
  assert.notEqual(chest.acquisitionKind, "free");
  assert.match(chest.prerequisites[0], /Chest Pet 2018/);
  for (const c of Object.values(acquisition))
    for (const m of c.methods) {
      if (m.evidence?.recovery) {
        assert(m.evidence.recovery.source && m.evidence.recovery.reason);
        assert.equal(m.detailsStatus, "complete");
      }
      if (m.detailsStatus === "complete" && m.merge)
        assert.deepEqual(validateMaterials(m.merge.materials), []);
    }
});
test("Informational Dropped by sublists preserve quantities and quest chains, while ambiguous material branches stay pending", async () => {
  const source = "https://aqwwiki.wikidot.com/taravya-s-quests";
  const parsed = await parseLinkedAcquisitionPage(
    fs.readFileSync(
      "content-sources/class-acquisition/taravya-s-quests.html",
      "utf8",
    ),
    source,
    "ProtoSartorium Parts",
  );
  assert.deepEqual(parsed.issues, []);
  assert.equal(parsed.questSteps.length, 5);
  assert.equal(materialLeaves(parsed.materials)[0].quantity, 1);
  assert.equal(
    materialLeaves(parsed.materials)[0].acquisitionSources[0].name,
    "ProtoSartorium (Monster)",
  );
  const wrapper = (text) =>
    `<div id="page-content"><div class="collapsible-block"><div class="collapsible-block-folded"><a class="collapsible-block-link">+ Quest X</a></div><div class="collapsible-block-content"><p>Items Required:</p>${text}</div></div></div>`;
  for (const text of [
    "<ul><li>Scroll<ul><li>Dropped by Monster</li></ul></li></ul>",
    "<ul><li>Scroll x1<ul><li>OR</li><li>Gem x2</li></ul></li></ul>",
  ]) {
    const r = await parseLinkedAcquisitionPage(
      wrapper(text),
      "https://aqwwiki.wikidot.com/test-quests",
      "Quest X",
    );
    assert.equal(r.materials, null);
    assert(r.issues.length);
  }
});
test("External QA reuses valid routes and covers four sizes, both engines, and preserved interactions", async () => {
  const { routes, sizes } = await import("../scripts/qa-v12-9-10.mjs");
  assert.deepEqual(
    sizes.map((v) => v.width),
    [375, 768, 1440, 1920],
  );
  for (const path of routes.filter((r) => r.startsWith("/class/")))
    assert(catalog.some((c) => path === "/class/" + c.slug));
  for (const route of [
    "/",
    "/class",
    "/ultra-boss/ultra-nulgath",
    "/ultra-boss/ultra-speaker",
    "/ultra-boss/ultra-darkon",
    "/huong-dan",
  ])
    assert(routes.includes(route));
  const pkg = read("package.json");
  for (const command of [
    "qa:browser",
    "qa:browser:chromium",
    "qa:browser:webkit",
  ])
    assert(pkg.scripts[command]);
  assert(fs.statSync("QA-AQW-Browser.command").mode & 0o111);
  assert.equal(pkg.version, "0.1.0");
});
