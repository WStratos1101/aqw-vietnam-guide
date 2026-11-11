import { format } from "prettier";
import fs from "node:fs";
const catalog = JSON.parse(
  fs.readFileSync("src/content/imported/catalog.json", "utf8"),
);
const mapping = {
  "ultra-ezrajal": ["time-inn-ultra-challenge-bosses", "ULTRA EZRAJAL"],
  "ultra-engineer": ["time-inn-ultra-challenge-bosses", "ULTRA ENGINEER"],
  "ultra-tyndarius": ["ultra-avatar-tyndarius"],
  "ultra-nulgath": ["nulgath-the-archfiend"],
  "ultra-drago": ["king-drago"],
  "ultra-speaker": ["malgor-the-first-speaker"],
};
const names=JSON.parse(fs.readFileSync('src/data/team-class-aliases.json'));
const icons = {
  "Chaos Avenger": "class-chaos-avenger",
  "Legion DoomKnight": "class-legion-doomknight",
  ArchPaladin: "class-archpaladin",
  "Lord of Order": "class-lord-of-order",
  "Void Highlord": "class-void-highlord",
  "Frostval Barbarian": "class-frostval-barbarian",
};
const text = (b) =>
  b.type === "table"
    ? ""
    : b.runs
        .map((r) => r.text)
        .join("")
        .trim();
const community = {
  id: "community-guide",
  title: "AQW Challenge Boss Guide — Vietnam Collector",
  url: "https://docs.google.com/document/d/18Z2Yu0O40dVyh0enB_2k_v4U-De3mg1y-HtThUmvxfU/edit",
  kind: "community",
  verified: "2026-11-05",
};
const bosses = JSON.parse(
  fs.readFileSync("src/content/ultra/bosses.json", "utf8"),
);
const generated = [];
for (const [slug, [original, sectionName]] of Object.entries(mapping)) {
  const entry = catalog.find((p) => p.slug === original);
  if (!entry) throw Error(`Missing source ${original}`);
  const body = JSON.parse(fs.readFileSync("public" + entry.bodyUrl, "utf8"));
  const sections = structuredClone(body.sections);
  function rewrite(blocks) {
    for (const b of blocks || []) {
      if (b.type === "table")
        for (const row of b.rows)
          for (const cell of row.cells) rewrite(cell.blocks);
      else
        for (const run of b.runs)
          if (run.href?.startsWith("#"))
            run.href = `/${entry.category}/${entry.slug}` + run.href;
    }
  }
  for (const s of sections) rewrite(s.blocks);
  let mechanics, teamBlocks, progression;
  if (sectionName) {
    const section = sections.find((s) => s.title === sectionName);
    if (!section) throw Error(`Missing section ${sectionName}`);
    const index = section.blocks.findIndex((b) =>
      /^Team kiến nghị/.test(text(b)),
    );
    if (index < 0) throw Error(`Team boundary not found ${slug}`);
    mechanics = [{ ...section, blocks: section.blocks.slice(0, index) }];
    teamBlocks = section.blocks.slice(index + 1);
    progression = sections.filter((s) => /Lộ trình|Storyline/i.test(s.title));
  } else {
    mechanics = sections.filter((s) => /^Cơ chế/.test(s.title));
    const section = sections.find((s) => /team kiến nghị/i.test(s.title));
    if (!section) throw Error(`Missing teams ${slug}`);
    teamBlocks = section.blocks;
    progression = sections.filter((s) => /^Lộ trình/.test(s.title));
  }
  const groups = [];
  const setup = [];
  let current = null;
  for (const b of teamBlocks) {
    const title = text(b).match(/^[◆◇]?\s*Team\s*(\d+)\s*:\s*(.+)/i);
    if (title) {
      current = {
        id: `source-team-${groups.length + 1}`,
        title: title[2].split("\t")[0].trim(),
        blocks: [],
      };
      groups.push(current);
    } else if (current) current.blocks.push(b);
    else setup.push(b);
  }
  if (!groups.length || !mechanics.length || !progression.length)
    throw Error(`Incomplete source import ${slug}`);
  const boss = bosses.find((b) => b.slug === slug);
  const teams = groups.map((g) => {
    const choices = g.title
      .replace(/\([^)]*\)/g, "")
      .split(",")
      .flatMap((s) => {const m=s.trim().match(/^(\d+)\s+(.+)/);return Array.from({length:m?Number(m[1]):1},()=>m?m[2]:s.trim());});
    return {
      id: g.id,
      title: g.title,
      description:
        "Đề xuất cộng đồng; các tên ngăn bằng / là lựa chọn thay thế trong cùng vị trí.",
      classes: choices.map((slot) => {
        const options = slot.split("/").map((s) => s.trim());
        const first = options[0];
        const className = names[first] || first;
        return {
          className,
          icon: icons[className] || "",
          role: "Phân công trong hướng dẫn",
          notes: "",
          alternatives: options.slice(1).map((o) => names[o] || o),
        };
      }),
      strategy: [],
      source: "community-guide",
      guideKey: g.id,
    };
  });
  if (!boss.sources.some((s) => s.id === community.id))
    boss.sources.push(community);
  boss.recommendedTeams = teams;
  boss.sourceContentUrl = `/content/ultra/${slug}.json`;
  boss.status = "Hướng dẫn cộng đồng";
  const payload = {
    ultraContent: true,
    bossId: slug,
    sourceGuide: `/${entry.category}/${entry.slug}`,
    mechanics,
    teamSetup: setup,
    teams: groups,
    progression,
  };
  fs.mkdirSync("public/content/ultra", { recursive: true });
  fs.writeFileSync(
    "public" + boss.sourceContentUrl,
    JSON.stringify(payload) + "\n",
  );
  generated.push({
    slug,
    mechanics: mechanics.reduce((n, s) => n + s.blocks.length, 0),
    teams: groups.length,
    progression: progression.reduce((n, s) => n + s.blocks.length, 0),
  });
}
fs.writeFileSync(
  "src/content/ultra/bosses.json",
  await format(JSON.stringify(bosses), { parser: "json" }),
);
fs.mkdirSync("qa", { recursive: true });
fs.writeFileSync(
  "qa/ultra-content-import.json",
  JSON.stringify({ generated }, null, 2) + "\n",
);
console.log(
  `Imported full community guide text for ${generated.length} Ultra profiles.`,
);
