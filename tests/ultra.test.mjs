import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const bosses = JSON.parse(
  fs.readFileSync("src/content/ultra/bosses.json", "utf8"),
);
const assets = JSON.parse(
  fs.readFileSync("src/content/ultra/assets.json", "utf8"),
);
const js = ts.transpileModule(
  fs.readFileSync("src/lib/ultra-progress.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const lib = {};
new Function("exports", js)(lib);
test("Ultra data resolves source, asset and quest dependencies without invented empty stats", () => {
  assert.equal(bosses.length, 8);
  assert.equal(new Set(bosses.map((b) => b.slug)).size, 8);
  for (const b of bosses) {
    const sourceIds = new Set(b.sources.map((s) => s.id));
    assert(/^\/join [a-z]+$/.test(b.joinCommand));
    assert(assets.some((a) => a.id === b.images.portrait));
    for (const s of [...b.stats, ...b.mechanics, ...b.recommendedTeams])
      assert(sourceIds.has(s.source), `${b.id}: ${s.source}`);
    for (const r of b.equipmentRoutes) {
      if (r.image) assert(assets.some((a) => a.id === r.image) || JSON.parse(fs.readFileSync('src/data/aqw-assets.json')).some(a=>a.assetId===r.image && a.verificationStatus==='verified'));
      const seen = new Set();
      for (const q of r.quests) {
        assert(sourceIds.has(q.source));
        for (const id of q.dependencies) assert(seen.has(id), q.id);
        seen.add(q.id);
      }
    }
    if (b.status === "Đã biên soạn")
      assert(
        b.mechanics.length &&
          b.stats.length &&
          b.recommendedTeams.length &&
          b.equipmentRoutes.length,
      );
  }
  assert.equal(
    bosses.filter((b) => b.status === "Hướng dẫn cộng đồng").length,
    6,
  );
});
test("quest persistence keys isolate boss, equipment and reporting period", () => {
  const q = { id: "weekly", repeatability: "weekly" };
  const now = new Date("2026-11-06T10:00:00Z");
  assert.notEqual(
    lib.progressKey("dage", "blade", q, now),
    lib.progressKey("dage", "armor", q, now),
  );
  assert.notEqual(
    lib.progressKey("dage", "blade", q, now),
    lib.progressKey("warden", "blade", q, now),
  );
  assert.equal(
    lib.periodFor(q, new Date("2026-11-12T23:59:59Z")),
    "2026-11-06",
  );
  assert.equal(
    lib.periodFor(q, new Date("2026-11-13T00:00:00Z")),
    "2026-11-13",
  );
  assert.equal(
    lib.periodFor(
      { repeatability: "daily" },
      new Date("2026-11-06T23:00:00-05:00"),
    ),
    "2026-11-07",
  );
  assert.equal(lib.periodFor({ repeatability: "once" }, now), "permanent");
});
test("repeatable observations never count as permanent item milestones", () => {
  const route = bosses.find((b) => b.id === "ultra-dage").equipmentRoutes[0];
  assert.deepEqual(lib.completedMilestones(route, new Set(["weekly"])), {
    done: 0,
    total: 1,
  });
  assert.deepEqual(
    lib.completedMilestones(route, new Set(["weekly", "empower"])),
    { done: 1, total: 1 },
  );
});
test("back navigation accepts only valid same-site history", () => {
  const origin = "http://127.0.0.1:4173";
  const known = ["/ultra-boss", "/class/warrior"];
  assert.equal(
    lib.safeBackPath("https://evil.invalid/ultra-boss", origin, known),
    null,
  );
  assert.equal(lib.safeBackPath("javascript:alert(1)", origin, known), null);
  assert.equal(lib.safeBackPath("/missing", origin, known), null);
  assert.equal(
    lib.safeBackPath("/class/warrior?q=a#skill", origin, known),
    "/class/warrior?q=a#skill",
  );
});
test("unapproved or unmaterialized assets cannot be mistaken for ready local game art", () => {
  for (const asset of assets) {
    assert(
      asset.name &&
        asset.entity &&
        asset.sourceUrl &&
        asset.credit &&
        asset.usageNote,
    );
    if (asset.usageStatus === "approved") {
      assert(asset.localPath?.startsWith("/"));
      assert(fs.existsSync("public" + asset.localPath));
    }
  }
});

test("six community profiles ship complete local mechanics, team instructions and progression text", () => {
  for (const boss of bosses.filter((b) => b.sourceContentUrl)) {
    const body = JSON.parse(
      fs.readFileSync("public" + boss.sourceContentUrl, "utf8"),
    );
    assert.equal(body.ultraContent, true);
    assert(boss.equipmentRoutes.length > 0);
    assert(body.mechanics.length);
    assert(body.progression.length);
    assert.equal(body.teams.length, boss.recommendedTeams.length);
    for (const team of boss.recommendedTeams) {
      assert(body.teams.find((t) => t.id === team.guideKey)?.blocks.length);
      assert(team.classes.length >= 1);
    }
  }
});
test("Time Inn item progression includes both branches before Unity and Penultima", () => {
  for (const boss of bosses.filter((b) =>
    ["ultra-warden", "ultra-ezrajal", "ultra-engineer"].includes(b.id),
  )) {
    const quests = boss.equipmentRoutes[0].quests;
    const byId = Object.fromEntries(quests.map((q) => [q.id, q]));
    assert.deepEqual(byId.unity.dependencies, [
      "apostate-ultima",
      "thaum-ultima",
    ]);
    assert.deepEqual(byId.penultima.dependencies, ["unity"]);
    assert.deepEqual(byId.merge.dependencies, ["penultima"]);
    assert(byId["apostate-alpha"].items.includes("Exalted Node ×150"));
  }
});

test("client navigation refuses seed content belonging to a different boss", () => {
  const value = JSON.parse(
    fs.readFileSync("public/content/ultra/ultra-ezrajal.json", "utf8"),
  );
  assert(lib.isUltraGuideContent(value, "ultra-ezrajal"));
  assert(!lib.isUltraGuideContent(value, "ultra-speaker"));
  assert(!lib.isUltraGuideContent(null, "ultra-ezrajal"));
});
test("Time Inn merge quantities reconcile with the full Apotheosis route", () => {
  const steps = bosses
    .find((b) => b.id === "ultra-warden")
    .equipmentRoutes[0].quests.filter((q) =>
      q.name.startsWith("Exaltia Merge"),
    );
  const totals = {};
  for (const q of steps)
    for (const item of q.items) {
      const m = item.match(/^(Ezrajal|Warden|Engineer) Insignia ×(\d+)$/);
      if (m) totals[m[1]] = (totals[m[1]] || 0) + Number(m[2]);
    }
  assert.deepEqual(totals, { Ezrajal: 24, Warden: 24, Engineer: 16 });
});

test("combat journal separates quantitative facts and preserves original reference", () => {
  const combat = JSON.parse(
    fs.readFileSync("src/content/ultra/combat.json", "utf8"),
  );
  for (const b of bosses) {
    const c = combat[b.slug];
    assert(c.mechanics.length);
    assert(c.stats.length);
    assert.equal(new Set(c.stats.map((s) => s.key)).size, c.stats.length);
    for (const m of c.mechanics) {
      assert(m.type && m.trigger && m.effect && m.response);
      assert(
        !/\d|Total HP|Phys DMG|Miễn nhiễm với Stun/.test(m.effect),
        b.slug + ": " + m.name,
      );
    }
    if (b.sourceContentUrl)
      assert.deepEqual(
        c.reference,
        JSON.parse(fs.readFileSync("public" + b.sourceContentUrl)).mechanics,
      );
  }
  const ty = combat["ultra-tyndarius"];
  assert(ty.mechanics.some((m) => m.name === "Melting"));
  assert(ty.mechanics.some((m) => m.name === "Absorbing"));
  assert.equal(ty.stats.find((s) => s.key === "orb-hp").value, 700000);
  assert.equal(ty.stats.find((s) => s.key === "tynd-hp").value, 6000000);
  assert.equal(ty.stats.find((s) => s.key === "orb-coefficient").value, 0.5);
  assert.equal(ty.stats.find((s) => s.key === "tynd-coefficient").value, 0.85);
});

test("boss detail keeps Wiki names, tactical notes, taunt and typed progression separate", () => {
  const combat = JSON.parse(fs.readFileSync("src/content/ultra/combat.json"));
  const details = JSON.parse(fs.readFileSync("src/content/ultra/details.json"));
  for (const boss of bosses) {
    const c = combat[boss.slug],
      d = details[boss.slug];
    for (const m of c.mechanics) {
      assert(c.nameVerification.skillNames.includes(m.name));
      assert(!/[À-ỹ]/u.test(m.name));
    }
    assert(
      d.notes.length > 0 &&
        d.notes.every(
          (n) => n.text.length < 160 && n.source.includes("sites.google.com"),
        ),
    );
    assert(
      d.tauntGuide.length > 0 &&
        d.tauntGuide.every((t) => t.source.includes("sites.google.com")),
    );
    assert(d.storyDescription !== boss.description);
    assert(d.resetInfo.text);
    assert(
      d.additionalEquipment.every(
        (i) => !/Enhancement|Các Cosmetics/i.test(i.name),
      ),
    );
  }
});
