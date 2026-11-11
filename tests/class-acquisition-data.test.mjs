import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  parsePrice,
  sourceHash,
} from "../scripts/lib/class-acquisition-source.mjs";
import {
  validateMaterials,
  materialLeaves,
} from "../src/lib/material-requirements.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p));
const catalog = read("src/content/classes/catalog.json"),
  data = read("src/content/classes/acquisition.json");
function html(url) {
  const slug = new URL(url).pathname.slice(1);
  const path = [
    "content-sources/class-acquisition/",
    "content-sources/class-wiki/",
  ]
    .map((dir) => dir + slug + ".html")
    .find(fs.existsSync);
  assert.ok(path, "Snapshot for " + url);
  return fs.readFileSync(path, "utf8");
}
test("All 113 Class acquisition records retain source evidence, scoped identities and explicit availability", () => {
  assert.equal(catalog.length, 113 + read("src/content/classes/calendar-extension.json").profiles.length);
  assert.equal(Object.keys(data.classes).length, catalog.length);
  for (const c of catalog) {
    const record = data.classes[c.id],
      body = read("public" + c.bodyUrl);
    assert.equal(record.classId, c.id);
    assert.deepEqual(
      body.acquisition.methods.map((m) => m.id),
      record.methods.map((m) => m.id),
    );
    assert.equal(
      new Set(record.methods.map((m) => m.id)).size,
      record.methods.length,
    );
    for (const m of record.methods) {
      assert.equal(m.classId, c.id);
      assert.equal(m.sourceHash, sourceHash(html(m.source)));
      assert.equal(m.verificationStatus, "verified");
      if (m.availability === "legacy") assert.equal(m.isAvailable, false);
      if (m.availability === "seasonal") assert.equal(m.isAvailable, null);
      if (m.type === "shop") {
        assert.deepEqual(m.shop.price, parsePrice(m.evidence.priceText));
        assert.ok(["AC", "Gold"].includes(m.shop.price.currency));
        assert.ok(!m.quest && !m.merge);
      }
      for (const tree of [
        m.quest?.materials,
        m.merge?.materials,
        ...(m.quest?.verifiedQuestSteps || []).map((s) => s.materials),
      ].filter(Boolean)) {
        assert.deepEqual(validateMaterials(tree), []);
        assert.ok(
          materialLeaves(tree).every((n) => !/^OR$|^AND$/i.test(n.name)),
        );
      }
      if (m.merge) {
        if (!m.merge.materials) assert.equal(m.detailsStatus, "partial");
        for (const d of m.merge.dependencies || []) {
          assert.ok(
            materialLeaves(m.merge.materials).some(
              (n) => n.itemId === d.itemId,
            ),
          );
          if (d.verificationStatus === "verified")
            assert.equal(d.sourceHash, sourceHash(html(d.source)));
          if (d.materials) assert.deepEqual(validateMaterials(d.materials), []);
        }
      }
    }
  }
});
test("Source regressions: AP free prerequisite purchase, VHL direct recipe and separate quest chains", () => {
  const ap = data.classes["archpaladin-ap"].methods;
  assert.ok(
    ap.some(
      (m) =>
        m.shop?.price.amount === 0 &&
        m.shop.price.currency === "AC" &&
        m.prerequisites.some((p) => /Eden/i.test(p)),
    ),
  );
  const vhl = Object.values(data.classes).find((c) =>
    c.classId.startsWith("void-highlord"),
  );
  assert.ok(
    vhl.methods.some(
      (m) =>
        m.merge &&
        materialLeaves(m.merge.materials).some(
          (n) => /Roentgenium/i.test(n.name) && n.quantity === 15,
        ),
    ),
  );
  for (const [prefix, count] of [
    ["legion-revenant", 4],
    ["lord-of-order", 10],
  ]) {
    const c = catalog.find((c) => c.id.startsWith(prefix));
    const body = read("public" + c.bodyUrl);
    assert.ok(
      body.acquisition.methods.some((m) => m.quest?.steps?.length === count),
      prefix + " chain",
    );
  }
});

test("Canonical acquisition boundaries exclude generic DoomKnight/Warrior from distinct named Classes", () => {
  for (const c of catalog) {
    const methods = data.classes[c.id].methods;
    if (c.id !== "doomknight-dmk")
      assert.ok(
        methods.every(
          (m) =>
            !/^https:\/\/aqwwiki.wikidot.com\/doomknight-(ac|0-ac)$/.test(
              m.source,
            ),
        ),
        c.id,
      );
    if (!c.id.startsWith("warrior-beast-warrior-"))
      assert.ok(
        methods.every(
          (m) =>
            !/^https:\/\/aqwwiki.wikidot.com\/warrior-(class|rare)$/.test(
              m.source,
            ),
        ),
        c.id,
      );
    for (const m of methods)
      if (
        m.evidence.locationText.some((t) => /^character creation$/i.test(t))
      ) {
        assert.equal(m.type, "other");
        assert.equal(m.shop, undefined);
      }
  }
});
