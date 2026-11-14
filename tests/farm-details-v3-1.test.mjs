import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { farmWikiDetails } from "../scripts/lib/farm-wiki-details.mjs";
import { farmClassRoles } from "../scripts/lib/farm-class-media.mjs";
import { matchesFarmSubtype, guidePaths } from "../src/lib/farm-details.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const c = read("src/content/farm/catalog-v2.generated.json");
const records = [
  ...read("content-sources/farm/import/wiki-records.json"),
  ...read("content-sources/farm/import/detail-wiki-records.json"),
];

test("Wiki header fields stay outside skills; Level requirement, damage, price and sellback are distinct", () => {
  const record = {
    wikiUrl: "https://aqwwiki.wikidot.com/fixture",
    text: "Location: Correct Map\nPrice: N/A\nSellback: 0 AC\nBase Level: 100\nWeapon Damage: 57%, 1.5 speed\nDescription: Recommended enhancement: Wizard. Original lore.\nStat Model: Offensive Caster\nSpecial Effects: First effect.\nSkills:\nDescription: Wrong skill description.\nRequired Level: 99",
  };
  const d = farmWikiDetails(record);
  assert.equal(d.levelRequired, null);
  assert.equal(d.priceRaw, "N/A");
  assert.equal(d.sellback, "0 AC");
  assert.equal(d.weaponDamage, "57%");
  assert.equal(d.speed, "1.5");
  assert.equal(d.enhancement, "Wizard");
  assert.equal(
    d.raw.description,
    "Recommended enhancement: Wizard. Original lore.",
  );
  assert.equal(d.raw.specialEffects, "First effect.");
  assert.equal(d.descriptionVi, null);
  assert.equal(
    farmWikiDetails({ ...record, text: "Required Level: 80\nBase Level: 1" })
      .levelRequired,
    80,
  );
  assert.equal(
    farmWikiDetails({ ...record, text: "Price: 100 Gold\nPrice: 200 AC" })
      .priceRaw,
    null,
  );
  assert.deepEqual(
    farmWikiDetails({ ...record, text: "Price: 100 Gold\nPrice: 200 AC" })
      .conflicts,
    ["price"],
  );
});
test("translations require exact retained source hash; independent effects and proper names survive", () => {
  const r = records.find((r) => r.id === "legion-revenant-class"),
    translation = read("content-sources/farm/import/detail-translations.json")[
      r.wikiUrl
    ];
  const d = farmWikiDetails(r, translation);
  assert.equal(d.enhancement, "Wizard");
  assert.equal(d.statModel, "Offensive Caster");
  assert.ok(d.descriptionVi.includes("Legion Revenant"));
  assert.equal(d.specialEffectsVi.length, 2);
  assert.ok(d.specialEffectsVi[1].includes("HP"));
  assert.equal(
    farmWikiDetails({ ...r, text: r.text + " changed" }, translation)
      .descriptionVi,
    null,
  );
  const item = c.items.find((i) => i.wikiUrl === r.wikiUrl);
  assert.equal(item.name, "Legion Revenant (Class)");
  assert.equal(item.wikiDetails.raw.description, d.raw.description);
});
test("all enriched fields retain exact item source and hash; unverified availability and membership are not invented", () => {
  for (const i of c.items) {
    if (!i.wikiDetails) continue;
    const r = records.find((r) => r.wikiUrl === i.wikiUrl);
    assert.ok(r);
    assert.equal(
      i.wikiDetails.evidence.sourceTextHash,
      createHash("sha256").update(r.text).digest("hex"),
    );
    assert.equal(i.wikiDetails.evidence.sourceUrl, i.wikiUrl);
    assert.equal(
      i.wikiDetails.evidence.snapshotCheckedAt,
      r.lastChecked || null,
    );
  }
  assert.equal(new Set(c.items.map((i) => i.id)).size, c.items.length);
});
test("Class Role is reused from exact Codex source or verified same-skill variant; multi-role matching never duplicates identities", () => {
  const profiles = read("src/content/classes/catalog.json"),
    sources = read("src/content/classes/skill-registry.json").classes;
  for (const i of c.items.filter((i) => i.category === "Classes")) {
    const match = farmClassRoles(
      i,
      profiles,
      sources,
      read("content-sources/farm/import/class-role-overrides.json"),
    );
    assert.deepEqual(i.classRoles, match?.roles || []);
    if (match)
      assert.deepEqual(
        i.classRoles,
        profiles.find((p) => p.id === match.classId).role,
      );
  }
  const fixture = { id: "one", classRoles: ["DPS", "Support"] };
  assert.equal(matchesFarmSubtype(fixture, "Classes", "DPS"), true);
  assert.equal(matchesFarmSubtype(fixture, "Classes", "Support"), true);
  assert.equal(matchesFarmSubtype(fixture, "Classes", "Endgame"), false);
  assert.equal(
    [fixture].filter((i) => matchesFarmSubtype(i, "Classes", "DPS")).length,
    1,
  );
  assert.equal(
    matchesFarmSubtype({ classRoles: [] }, "Classes", "unknown"),
    true,
  );
  assert.equal(
    farmClassRoles(
      { category: "Classes", wikiUrl: "https://aqwwiki.wikidot.com/unmapped" },
      profiles,
      sources,
    ),
    null,
  );
});
test("guide alternatives stay separate, have source line/hash evidence and never create a fake stepper", () => {
  const pages = read("content-sources/farm/import/source-extracts.json").pages;
  const lr = c.items.find((i) => i.id === "legion-revenant-class");
  const paths = guidePaths(lr.acquisitionRoutes[0]);
  assert.equal(paths.length, 2);
  assert.equal(paths[0].id, "legion-fealty");
  assert.equal(paths[1].id, "ultra-dage-supplement");
  for (const path of paths)
    for (const step of path.steps) {
      assert.ok(step.sources.length);
      assert.ok(step.evidence.length);
      for (const e of step.evidence) {
        const page = pages.find((p) => p.url === e.sourceUrl);
        assert.ok(page);
        assert.equal(
          e.sourceTextHash,
          createHash("sha256").update(page.text).digest("hex"),
        );
        for (const line of e.lines)
          assert.ok(page.text.split(/\r?\n/)[line - 1]);
      }
    }
  assert.equal(
    paths[0].steps.some((s) => s.text.includes("Dage Challenge Merge Shop")),
    false,
  );
  assert.deepEqual(
    guidePaths({
      steps: [],
      guidePaths: [
        { verificationStatus: "pending", steps: [{ text: "invented" }] },
      ],
    }),
    [],
  );
});

test("membership and availability require explicit page evidence; AC tag and absent rarity do not imply a state", () => {
  const r = {
    wikiUrl: "https://aqwwiki.wikidot.com/fixture",
    text: "Price: N/A\nSellback: 0 AC",
    tags: ["ac"],
  };
  assert.equal(farmWikiDetails(r).membership, null);
  assert.equal(farmWikiDetails(r).availability, null);
  assert.equal(
    farmWikiDetails({ ...r, tags: ["freeplayer", "seasonal"] }).membership,
    "non-member",
  );
  assert.equal(
    farmWikiDetails({ ...r, tags: ["freeplayer", "seasonal"] }).availability,
    "seasonal",
  );
  assert.equal(
    farmWikiDetails({ ...r, tags: ["legend", "rare"] }).membership,
    "member",
  );
  assert.equal(
    farmWikiDetails({ ...r, tags: ["seasonal", "rare"] }).availability,
    null,
  );
  assert.equal(
    farmWikiDetails({ ...r, text: "Availability: Permanent" }).availability,
    "permanent",
  );
});

test("completion snapshots are exact canonical bodies; incomplete indexed evidence is never counted complete", () => {
  assert.equal(c.items.length, 232);
  assert.equal(
    c.items.reduce((n, i) => n + i.acquisitionRoutes.length, 0),
    228,
  );
  const audit = read("content-sources/farm/import/detail-audit.json");
  assert.equal(audit.filter((i) => i.completeWikiSnapshot).length, 231);
  const partial = c.items.find((i) => i.id === "aureate-shield-aegis");
  assert.equal(partial.wikiDetails.evidence.snapshotStatus, "partial");
  const translations = read(
    "content-sources/farm/import/detail-translations.json",
  );
  for (const item of c.items) {
    assert.ok(item.wikiDetails.descriptionVi, item.id);
    const record = records.find((r) => r.wikiUrl === item.wikiUrl);
    assert.equal(
      translations[item.wikiUrl].sourceTextHash,
      createHash("sha256").update(record.text).digest("hex"),
      item.id,
    );
    assert.doesNotMatch(
      record.text,
      /Terms of Service|Privacy Policy|Redirect loop detected/,
    );
  }
});
test("tagged-monster bonuses keep their exact races; equipment bonuses never leak between set pieces", () => {
  const pirate = c.items.find((i) => i.id === "celestial-pirate-commander");
  assert.match(
    pirate.wikiDetails.specialEffectsVi.join(" "),
    /30%.*Chaos, Dragon, Elemental, Human.*Undead/,
  );
  assert.doesNotMatch(
    pirate.wikiDetails.specialEffectsVi.join(" "),
    /Damage to All/,
  );
  assert.match(
    c.items
      .find((i) => i.id === "void-warlock")
      .wikiDetails.specialEffectsVi.join(" "),
    /25%/,
  );
  assert.doesNotMatch(
    c.items
      .find((i) => i.id === "void-warlock")
      .wikiDetails.specialEffectsVi.join(" "),
    /40%/,
  );
  for (const [id, o] of Object.entries(
    read("content-sources/farm/import/effect-overrides.json"),
  )) {
    const record = records.find((r) => r.wikiUrl === o.wikiUrl);
    assert.equal(
      o.sourceTextHash,
      createHash("sha256").update(record.text).digest("hex"),
      id,
    );
    for (const quote of o.sourceQuotes)
      assert.ok(record.text.includes(quote), id);
  }
});
test("reviewed multi-step walkthroughs retain hashes, AND/OR and per-item rewards; acquisition-only paths are explicit", () => {
  const pages = read("content-sources/farm/import/source-extracts.json").pages;
  for (const item of c.items) {
    for (const route of item.acquisitionRoutes) {
      for (const path of route.guidePaths || []) {
        if (path.coverage === "acquisition_only") {
          assert.equal(path.steps.length, 1);
          continue;
        }
        for (const step of path.steps) {
          for (const e of step.evidence || []) {
            const page = pages.find((p) => p.url === e.sourceUrl);
            assert.ok(page, item.id);
            assert.equal(
              e.sourceTextHash,
              createHash("sha256").update(page.text).digest("hex"),
              item.id,
            );
            assert.ok(e.lines.every((n) => page.text.split(/\r?\n/)[n - 1]));
          }
        }
      }
    }
  }
  const free = c.items.find((i) => i.id === "chaorrupter-unlocked-free-player")
    .acquisitionRoutes[0].guidePaths[0];
  assert.match(free.steps.map((s) => s.text).join(" "), /Chaos Eye ×250/);
  assert.doesNotMatch(free.steps.map((s) => s.text).join(" "), /300 AC|×100/);
  const burning = c.items.find((i) => i.id === "burning-sword-of-doom")
    .acquisitionRoutes[0].guidePaths[0];
  assert.match(burning.steps.map((s) => s.text).join(" "), /HOẶC Sepulchuroth/);
  const tools = c.items.find((i) => i.id === "void-warlock")
    .acquisitionRoutes[0].guidePaths[0];
  const corrupted = c.items.find((i) => i.id === "void-warlock-hood")
    .acquisitionRoutes[0].guidePaths[0];
  assert.match(tools.steps.map((s) => s.text).join(" "), /Tools For the Job/);
  assert.doesNotMatch(
    tools.steps.map((s) => s.text).join(" "),
    /Corrupted Touch/,
  );
  assert.match(corrupted.steps.map((s) => s.text).join(" "), /Corrupted Touch/);
});
test("recovered role relationships cite exact class evidence; Blood Sorceress is never guessed from its upgrade", () => {
  const overrides = read(
    "content-sources/farm/import/class-role-overrides.json",
  );
  for (const [id, o] of Object.entries(overrides)) {
    const item = c.items.find((i) => i.id === id),
      record = records.find((r) => r.wikiUrl === item.wikiUrl);
    assert.equal(
      o.sourceTextHash,
      createHash("sha256").update(record.text).digest("hex"),
    );
    assert.ok(record.text.includes(o.quote) && record.text.includes(o.member));
    assert.equal(
      item.classRoleEvidence.relationshipEvidence.sourceUrl,
      item.wikiUrl,
    );
  }
  assert.deepEqual(
    c.items.find((i) => i.id === "blood-sorceress").classRoles,
    [],
  );
  assert.equal(
    c.items.filter((i) => i.category === "Classes" && i.classRoles.length)
      .length,
    22,
  );
});

test("every canonical item has acquisition facts; multi-Quest rewards are alternatives and price never comes from Sellback", () => {
  for (const item of c.items) {
    const b = item.acquisitionBrief,
      record = records.find((r) => r.wikiUrl === item.wikiUrl);
    assert.equal(b.source, item.wikiUrl, item.id);
    assert.equal(
      b.sourceTextHash,
      createHash("sha256").update(record.text).digest("hex"),
      item.id,
    );
    assert.ok(b.text?.length, item.id);
  }
  const crimson = c.items.find(
    (i) => i.id === "crimson-face-plate-of-nulgath",
  ).acquisitionBrief;
  assert.deepEqual(crimson.alternatives, ["Twisted Items of Nulgath"]);
  const shadow = c.items.find(
    (i) => i.id === "evolved-shadow-of-nulgath",
  ).acquisitionBrief;
  assert.equal(shadow.alternatives.length, 3);
  assert.match(shadow.text, / HOẶC /);
  const crag = c.items.find((i) => i.id === "crag-bamboozle");
  assert.equal(crag.acquisitionRoutes.length, 0);
  assert.match(crag.acquisitionBrief.text, /5,000 ACs/);
  assert.doesNotMatch(crag.acquisitionBrief.text, /Free/);
  const golden = c.items.find((i) => i.id === "golden-hanzo-void");
  assert.match(golden.acquisitionBrief.text, /100,000 Gold/);
  assert.match(
    c.items.find((i) => i.id === "dual-champion-blade-of-nulgath")
      .acquisitionBrief.text,
    /Rare Rarity/,
  );
});
