import fs from "node:fs";
import { createHash } from "node:crypto";
import { classSourceParser } from "../src/lib/team-source.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p)),
  write = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
const names = read("src/data/team-class-aliases.json"),
  parser = classSourceParser(names),
  base = read("src/content/ultra/team-loadouts.json"),
  recovery = read("src/content/ultra/recovery.json");
const bosses = [...read("src/content/ultra/bosses.json"), ...recovery.bosses];
const text = (b) =>
  b.type === "table"
    ? ""
    : (b.runs || [])
        .map((r) => r.text)
        .join("")
        .trim();
const ui = {};
for (const boss of bosses) {
  const guide =
    boss.sourceContentUrl && fs.existsSync("public" + boss.sourceContentUrl)
      ? read("public" + boss.sourceContentUrl)
      : null;
  ui[boss.slug] = {};
  for (const team of boss.recommendedTeams) {
    const slots = structuredClone(
      recovery.teamLoadouts[boss.slug]?.[team.id] ||
        base.encounters[boss.slug]?.[team.id] ||
        [],
    );
    const notes = [];
    const archive = [];
    let current = [];
    for (const block of guide?.teams.find((t) => t.id === team.guideKey)
      ?.blocks || []) {
      const line = text(block);
      if (!line) continue;
      archive.push({ id: block.id, text: line });
      if (line.startsWith("→")) current = parser.header(line);
      const refs = parser.references(line);
      if (refs.length) continue;
      if (
        /sẽ thực hiện Focus|sẽ phối hợp|^→ Cả [Tt]eam|^Với [Tt]eam này|^Đây là [Tt]eam/i.test(
          line,
        )
      ) {
        notes.push(line.replace(/^→\s*/, ""));
        for (const slot of slots)
          for (const c of [slot.primaryClass, ...slot.alternativeClasses])
            c.instructions = c.instructions.filter((t) => t !== line);
        current = [];
        continue;
      }
      const target = slots
        .flatMap((s) => [s.primaryClass, ...s.alternativeClasses])
        .filter((c) => current.some((alias) => names[alias] === c.name));
      if (target.length) {
        for (const choice of target) {
          if (/^Enh:/i.test(line)) {
            const e = line.replace(/^Enh:\s*/i, "");
            if (!choice.enhancement.includes(e)) choice.enhancement.push(e);
          } else if (!choice.instructions.includes(line))
            choice.instructions.push(line);
        }
      } else if (
        !/^Enh:|^Potion(?:\/Scroll)?:|^Note:.*ghi gọn thành/i.test(line)
      )
        notes.push(line.replace(/^→\s*/, ""));
    }
    for (const note of team.strategy || [])
      if (!/guide|nguồn|đối chiếu/i.test(note) && !notes.includes(note))
        notes.push(note);
    // All source paragraphs are retained as provenance; class-specific content has a single UI home.
    const classLines = new Set(
      slots
        .flatMap((s) => [s.primaryClass, ...s.alternativeClasses])
        .flatMap((c) => [
          ...c.instructions,
          ...c.enhancement.map((e) => "Enh: " + e),
        ]),
    );
    ui[boss.slug][team.id] = {
      slots,
      notes: [
        ...new Set(
          notes.filter((n) => !classLines.has(n) && !classLines.has("→ " + n)),
        ),
      ],
      sourceParagraphs: archive,
    };
  }
}
write(
  "content-sources/v12-5/team-notes-provenance.json",
  Object.fromEntries(
    Object.entries(ui).map(([boss, teams]) => [
      boss,
      Object.fromEntries(
        Object.entries(teams).map(([id, t]) => [id, t.sourceParagraphs]),
      ),
    ]),
  ),
);
for (const teams of Object.values(ui))
  for (const t of Object.values(teams)) delete t.sourceParagraphs;

const guide = read("public/content/ultra/ultra-speaker.json");
const identity = (c) => ({
  classId: c.classId,
  name: c.name,
  abbreviation: c.abbreviation,
});
const strategies = guide.teams.map((team, i) => {
  const table = team.blocks.find((b) => b.type === "table");
  if (!table) throw Error("Missing own table for " + team.id);
  const grid = [];
  table.rows.forEach((row, r) => {
    grid[r] ??= [];
    let col = 0;
    for (const cell of row.cells) {
      while (grid[r][col] !== undefined) col++;
      const value = cell.blocks.map(text).join(" ").trim();
      for (let y = 0; y < (cell.rowSpan || 1); y++) {
        grid[r + y] ??= [];
        for (let x = 0; x < (cell.colSpan || 1); x++)
          grid[r + y][col + x] = value;
      }
      col += cell.colSpan || 1;
    }
  });
  const steps = grid
    .map((r, row) => ({ r, row }))
    .filter(({ r }) => /^(Truth NUKE|Listen STUN|Equal ZONE)$/.test(r[2] || ""))
    .map(({ r, row }, n) => ({
      stepId: team.id + "-step-" + (n + 1),
      order: n + 1,
      phase: r[0] || r[1] || "",
      skill: r[2],
      taunt: r[3] || "—",
      zone: r[4] || "—",
      tauntVariant: (r[3] || "").match(/\(([^)]+)\)/)?.[1] || null,
      zoneVariant: (r[4] || "").match(/\(([^)]+)\)/)?.[1] || null,
      notes: r[5] || "",
      sourceRow: row,
    }));
  const slots = ui["ultra-speaker"][team.id].slots;
  if (slots.length !== 4) throw Error("Speaker four slots required");
  return {
    id: team.id,
    name: "Team " + (i + 1),
    label: [
      "4 Taunt · Starter",
      "3 Taunt · Starter",
      "3 Taunt · BEST",
      "2 Taunt",
      "2 Taunt",
      "3 Taunt · SPEEDRUN",
    ][i],
    tauntCount: [4, 3, 3, 2, 2, 3][i],
    classSlots: slots.map((s) => ({
      ...s,
      primaryClass: identity(s.primaryClass),
      alternativeClasses: s.alternativeClasses.map(identity),
    })),
    rotationSteps: steps,
    specialNotes: ui["ultra-speaker"][team.id].notes,
    source: guide.sourceGuide,
    sourceTableId: table.id,
    sourceTableHash: createHash("sha256")
      .update(JSON.stringify(table))
      .digest("hex"),
    verificationStatus: "verified",
    verifiedAt: "2026-11-10",
    sourceModifiedAt: "2026-10-27T16:23:04.246Z",
  };
});
write("src/content/ultra/speaker-strategies.json", strategies);
const compact = {};
for (const [slug, teams] of Object.entries(ui)) {
  compact[slug] = {};
  for (const [id, t] of Object.entries(teams)) {
    const originals =
      recovery.teamLoadouts[slug]?.[id] || base.encounters[slug]?.[id] || [];
    const before = new Map(
      originals
        .flatMap((s) => [s.primaryClass, ...s.alternativeClasses])
        .map((c) => [c.classId, c]),
    );
    const edits = {};
    for (const slot of t.slots)
      for (const c of [slot.primaryClass, ...slot.alternativeClasses]) {
        const old = before.get(c.classId);
        const added = c.instructions.filter(
            (l) => !old?.instructions.includes(l),
          ),
          removed = (old?.instructions || []).filter(
            (l) => !c.instructions.includes(l),
          ),
          enh = c.enhancement.filter((l) => !old?.enhancement.includes(l));
        if (added.length || removed.length || enh.length)
          edits[c.classId] = { added, removed, enh };
      }
    compact[slug][id] = { notes: t.notes, edits };
  }
}
write("src/content/ultra/team-ui.json", compact);

console.log(
  strategies.map((s) => ({
    id: s.id,
    steps: s.rotationSteps.length,
    first: s.rotationSteps.slice(0, 4).map((s) => [s.skill, s.taunt, s.zone]),
  })),
);
