import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
const read = (p) => JSON.parse(fs.readFileSync(p)),
  ss = read("src/content/ultra/speaker-strategies.json"),
  guide = read("public/content/ultra/ultra-speaker.json");
test("Six Speaker teams are bound to six distinct source tables, never one reused rotation", () => {
  assert.equal(ss.length, 6);
  assert.equal(new Set(ss.map((t) => t.sourceTableId)).size, 6);
  assert.equal(
    new Set(
      ss.map((t) =>
        JSON.stringify(t.rotationSteps.map((s) => [s.skill, s.taunt, s.zone])),
      ),
    ).size,
    6,
  );
  for (const t of ss) {
    const table = guide.teams
      .find((g) => g.id === t.id)
      .blocks.find((b) => b.type === "table");
    assert.equal(t.sourceTableId, table.id);
    assert.equal(
      t.sourceTableHash,
      createHash("sha256").update(JSON.stringify(table)).digest("hex"),
    );
    assert.equal(t.classSlots.length, 4);
    assert.ok(
      t.rotationSteps.every(
        (s, i) => s.order === i + 1 && s.stepId.startsWith(t.id),
      ),
    );
  }
  assert.deepEqual(
    ss.map((t) => t.rotationSteps.length),
    [20, 20, 20, 20, 20, 11],
  );
});
test("Independent source milestones preserve actual per-team Taunt/Zone and special assignments", () => {
  const checkpoints = [
    [
      [3, "zone", "PCM/LP/AP"],
      [4, "taunt", "mDPS"],
      [12, "zone", "mDPS"],
    ],
    [
      [4, "taunt", "CAv (3)"],
      [12, "zone", "CAv"],
    ],
    [
      [1, "taunt", "QCM/VDK"],
      [3, "zone", "LR"],
      [7, "zone", "QCM/VDK"],
    ],
    [
      [15, "taunt", "LR (Prax)"],
      [18, "taunt", "CAv (3)"],
      [19, "taunt", "CAv (Prax)"],
    ],
    [
      [3, "zone", "mDPS"],
      [6, "taunt", "LR (Prax)"],
      [10, "taunt", "LP (4)"],
    ],
    [
      [1, "taunt", "LoO"],
      [3, "zone", "QCM/Arach"],
      [5, "taunt", "VDK"],
      [11, "taunt", "QCM/Arach"],
    ],
  ];
  checkpoints.forEach((points, i) =>
    points.forEach(([order, key, value]) =>
      assert.equal(
        ss[i].rotationSteps[order - 1][key],
        value,
        ss[i].id + " step " + order,
      ),
    ),
  );
  assert.deepEqual(
    ss.map((t) => t.tauntCount),
    [4, 3, 3, 2, 2, 3],
  );
});
test("Boss typography consumes the exact existing Codex tokens and combat UI has no source bylines", () => {
  const css = fs.readFileSync("src/styles/ultra/v12-5.css", "utf8");
  for (const token of ["font", "weight", "style", "tracking"])
    assert.ok(css.includes("var(--codex-display-" + token + ")"));
  assert.ok(
    css.includes("clamp(") && css.includes("overflow-wrap: break-word"),
  );
  for (const file of ["EnemyInspection", "DarkonTacticalInspection"]) {
    const code = fs.readFileSync("src/features/ultra/" + file + ".tsx", "utf8");
    assert.ok(
      !/Nguồn:|Nguồn nhiệm vụ|Nguồn kỹ năng|Docs khuyến cáo/.test(code),
    );
  }
});
test("Source paragraphs remain archived and Zone image is withheld rather than labelled verified without permission", () => {
  const source = read("content-sources/v12-5/source-review.json");
  assert.equal(source.docs.modifiedAt, "2026-10-27T16:23:04.246Z");
  assert.equal(
    source.zoneImage.usageStatus,
    "not_integrated_rights_unconfirmed",
  );
  assert.ok(!source.zoneImage.imagePath);
  const ui = read("src/content/ultra/team-ui.json"),
    archive = read("content-sources/v12-5/team-notes-provenance.json");
  assert.ok(Object.keys(archive).length > 5);
  for (const teams of Object.values(ui))
    for (const t of Object.values(teams)) {
      assert.ok(
        t.notes.every((n) => !/^Enh:|^Potion(?:\/Scroll)?:|^→.*combo/i.test(n)),
      );
    }
});

test("Every original Team paragraph remains in its Class loadout or shared notes after deduplication", () => {
  const archive = read("content-sources/v12-5/team-notes-provenance.json"),
    base = read("src/content/ultra/team-loadouts.json").encounters,
    recovery = read("src/content/ultra/recovery.json").teamLoadouts,
    ui = read("src/content/ultra/team-ui.json");
  const norm = (s) => s.replace(/^→\s*/, "").replace(/\s+/g, " ").trim();
  for (const [slug, teams] of Object.entries(archive))
    for (const [id, paragraphs] of Object.entries(teams)) {
      const model = ui[slug][id],
        slots = recovery[slug]?.[id] || base[slug]?.[id] || [];
      const displayed = new Set(
        [
          ...model.notes,
          ...slots
            .flatMap((s) => [s.primaryClass, ...s.alternativeClasses])
            .flatMap((c) => {
              const edit = model.edits[c.classId];
              return [
                ...c.instructions.filter((t) => !edit?.removed.includes(t)),
                ...(edit?.added || []),
                ...c.enhancement
                  .concat(edit?.enh || [])
                  .map((t) => "Enh: " + t),
              ];
            }),
        ].map(norm),
      );
      for (const p of paragraphs)
        assert.ok(
          displayed.has(norm(p.text)),
          slug + "/" + id + " lost " + p.id,
        );
    }
});

test("Both full and fallback Boss hero renderers use the shared display title class", () => {
  for (const file of ["UltraBoss", "ChallengeDetail"]) {
    const source = fs.readFileSync(
      "src/features/ultra/" + file + ".tsx",
      "utf8",
    );
    assert.match(source, /<BossOfficialTitle name=/);assert.match(fs.readFileSync("src/features/ultra/BossOfficialTitle.tsx","utf8"),/className="boss-display-title boss-title-fit"/);
  }
});
