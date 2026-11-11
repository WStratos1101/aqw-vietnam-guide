import fs from "node:fs";
import { format } from "prettier";
const catalog = JSON.parse(
  fs.readFileSync("src/content/imported/catalog.json", "utf8"),
);
const overrides = JSON.parse(
  fs.readFileSync("src/content/classes/overrides.json", "utf8"),
);
const doc = {
  id: "class-doc",
  title: "AQW Class Guide — Vietnam Collector",
  url: "https://docs.google.com/document/d/1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78/edit",
  type: "community-guide",
  verifiedAt: "2026-11-05",
  verification: "community",
};
const farmDoc = {
  id: "farm-doc",
  title: "AQW Farming Item Guide — Vietnam Collector",
  url: "https://docs.google.com/document/d/1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA/edit",
  type: "community-guide",
  verifiedAt: "2026-11-05",
  verification: "community",
};
const candidates = catalog.filter(
  (p) =>
    p.category === "class" &&
    p.level === 3 &&
    p.title.length < 115 &&
    !/[ăâđêôơưàáạảãằắặẳẵầấậẩẫềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i.test(
      p.title,
    ),
);
const rows = [],
  assets = [],
  audit = {
    excluded: catalog
      .filter((p) => p.category === "class" && !candidates.includes(p))
      .map((p) => ({ slug: p.slug, title: p.title })),
    profiles: [],
  };
fs.mkdirSync("public/content/classes", { recursive: true });
function flatten(blocks) {
  return blocks.flatMap((b) =>
    b.type === "table"
      ? b.rows.flatMap((r) => r.cells.flatMap((c) => flatten(c.blocks)))
      : b.runs
          .map((r) => r.text)
          .join("")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
  );
}
function links(blocks, source) {
  for (const b of blocks || []) {
    if (b.type === "table")
      for (const r of b.rows) for (const c of r.cells) links(c.blocks, source);
    else
      for (const r of b.runs)
        if (r.href?.startsWith("#")) r.href = source + r.href;
  }
}
for (const p of candidates) {
  const body = JSON.parse(fs.readFileSync("public" + p.bodyUrl, "utf8"));
  const lines = body.sections.flatMap((s) => flatten(s.blocks || []));
  const skills = [];
  const starts = [];
  for (let i = 0; i < lines.length - 2; i++)
    if (
      /^[1-5]$/.test(lines[i]) &&
      /^\d+(?:\.\d+)?\s*MP\s*-\s*CD\b/.test(lines[i + 2])
    )
      starts.push(i);
  for (let k = 0; k < starts.length; k++) {
    const start = starts[k];
    let end = starts[k + 1] ?? lines.length;
    const stop = lines.findIndex(
      (s, i) => i > start + 2 && i < end && (s === "P" || s === "Passive"),
    );
    if (stop >= 0) end = stop;
    const cost = lines[start + 2].match(
      /^(\d+(?:\.\d+)?)\s*MP\s*-\s*CD\s*(\d+(?:\.\d+)?)s/,
    );
    const desc = lines.slice(start + 4, end);
    skills.push({
      id: skills.some((s) => s.id === `skill-${lines[start]}`)
        ? `skill-${lines[start]}-variant-${k}`
        : `skill-${lines[start]}`,
      skillNumber: Number(lines[start]),
      name: lines[start + 1],
      ...(cost ? { manaCost: Number(cost[1]), cooldown: Number(cost[2]) } : {}),
      effectType: lines[start + 3] || "Đang cập nhật",
      description: desc[0] || "Mô tả chi tiết đang được bổ sung.",
      usageNotes: desc.slice(1),
      source: "class-doc",
    });
  }
  const first = starts[0] ?? lines.length;
  const comboLines = lines
    .slice(0, first)
    .filter(
      (s) =>
        !/^(How to get|Enhancement|Mana Regen|Video)/i.test(s) &&
        !s.includes("liên kết tham khảo đang bổ sung") &&
        /combo|rotation|→|^\*/i.test(s),
    );
  const fallbackCombos = comboLines.length
    ? [
        {
          id: "community",
          title: "Ghi chú combo",
          situation: "Theo tài liệu cộng đồng",
          sequence: [],
          explanation: comboLines[0],
          notes: comboLines.slice(1),
          source: "class-doc",
        },
      ]
    : [];
  const o = overrides[p.slug];
  if (o?.passives) skills.push(...o.passives);
  const obtainSteps = [],
    overview = [];
  if (o) {
    const farm = catalog.find(
      (f) => f.category === "farm" && f.slug === o.farmSlug,
    );
    if (!farm) throw Error(`Missing obtain guide ${o.farmSlug}`);
    const fbody = JSON.parse(fs.readFileSync("public" + farm.bodyUrl, "utf8"));
    const blocks = structuredClone(
      fbody.sections.flatMap((s) => s.blocks || []),
    );
    links(blocks, `/farm/${farm.slug}`);
    let step = null;
    for (const b of blocks) {
      const t =
        b.type === "table"
          ? ""
          : b.runs
              .map((r) => r.text)
              .join("")
              .trim();
      const heading = t.match(/^◆\s*(.+?\bQuest)\s*:/i);
      if (heading) {
        step = {
          id: b.id,
          stepNumber: obtainSteps.length + 1,
          title: heading[1].replace(/\s+Quest$/i, ""),
          description: "Nhận quest và thực hiện các yêu cầu chi tiết bên dưới.",
          map: o.map,
          npc: o.npc,
          requirement: obtainSteps.length
            ? ["Hoàn thành bước trước; kiểm tra điều kiện quest tại NPC."]
            : ["Kiểm tra các điều kiện mở khóa trong phần chuẩn bị."],
          reward: "Mở bước tiếp theo trong chuỗi.",
          repeatable: false,
          source: "farm-doc",
          dependencies: obtainSteps.length ? [obtainSteps.at(-1).id] : [],
          details: [],
        };
        obtainSteps.push(step);
      } else if (step) step.details.push(b);
      else overview.push(b);
    }
    const bonus = obtainSteps.findIndex(
      (s) => s.title === "I'm Loving It My Way",
    );
    if (bonus >= 0) obtainSteps.splice(bonus);
    if (obtainSteps.length)
      obtainSteps.at(-1).reward =
        o.name === "ArchPaladin" ? "Mở ArchPaladin Shop" : o.name;
    if (!obtainSteps.length) {
      // Blaze Binder's source is organised by acquisition methods, not quest headings.
      const free = blocks
        .filter(
          (b) =>
            b.type !== "table" &&
            b.runs
              .map((r) => r.text)
              .join("")
              .trim()
              .startsWith("→"),
        )
        .slice(0, 4);
      const titles = [
        "Chuẩn bị nhân vật",
        "Lấy Pyromancer",
        "Chuẩn bị reputation",
        "Lấy Sigils và merge Class",
      ];
      for (let i = 0; i < free.length; i++)
        obtainSteps.push({
          id: `obtain-${i + 1}`,
          stepNumber: i + 1,
          title: titles[i],
          description: free[i].runs
            .map((r) => r.text)
            .join("")
            .trim()
            .replace(/^→\s*/, ""),
          map: o.map,
          npc: o.npc,
          requirement: i ? ["Hoàn thành bước trước."] : [],
          reward:
            i === free.length - 1 ? o.name : "Đủ điều kiện cho bước kế tiếp.",
          repeatable: i === 1,
          source: "farm-doc",
          dependencies: i ? [`obtain-${i}`] : [],
        });
    }
    obtainSteps.unshift({
      id: "prepare",
      stepNumber: 0,
      title: "Kiểm tra điều kiện và gặp NPC",
      description: o.acquisitionSummary,
      map: o.map,
      npc: o.npc,
      joinCommand: `/join ${o.map}`,
      requirement: [],
      reward: "Sẵn sàng bắt đầu tuyến lấy Class.",
      repeatable: false,
      source: "farm-doc",
      dependencies: [],
    });
    obtainSteps.forEach((s, i) => {
      s.stepNumber = i + 1;
      if (i === 1 && !s.dependencies.length) s.dependencies = ["prepare"];
    });
    if (p.slug === "archpaladin-ap")
      obtainSteps.push({
        id: "purchase-class",
        stepNumber: obtainSteps.length + 1,
        title: "Nhận ArchPaladin tại shop",
        description:
          "Sau Sacred Magic: Eden, mở ArchPaladin Shop và lấy Class.",
        map: o.map,
        npc: o.npc,
        requirement: ["Hoàn thành Sacred Magic: Eden"],
        reward: "ArchPaladin",
        repeatable: false,
        source: "farm-doc",
        dependencies: [obtainSteps.at(-1).id],
      });
  }
  const name = o?.name || p.title;
  const sources = [
    doc,
    ...(o
      ? [
          farmDoc,
          {
            id: "wiki",
            title: name + " — AQWorlds Wiki",
            url: `https://aqwwiki.wikidot.com/${o.wiki}`,
            type: "wiki",
            verifiedAt: "2026-11-06",
            verification: "checked",
          },
        ]
      : []),
  ];
  const notes = structuredClone(body.sections);
  for (const s of notes) links(s.blocks, `/class/${p.slug}`);
  if (o)
    for (const skill of skills) {
      skill.icon = `${p.slug}-${skill.id}-icon`;
      assets.push({
        id: skill.icon,
        name: skill.name,
        entity: p.slug,
        sourceUrl: `https://aqwwiki.wikidot.com/${o.wiki}`,
        credit: "AdventureQuest Worlds artwork © Artix Entertainment LLC",
        usageStatus: "pending",
        usageNote: "Icon skill chưa được nhập thành file local và xác nhận.",
      });
    }
  const payload = {
    classContent: true,
    classId: p.slug,
    skills,
    obtainSteps,
    combos: o?.combos || fallbackCombos,
    obtainOverview: overview,
    notes,
  };
  const item = {
    id: p.slug,
    slug: p.slug,
    aliases: o?.aliases || [],
    name,
    shortDescription:
      o?.shortDescription ||
      "Bộ kỹ năng và ghi chú sử dụng từ cẩm nang cộng đồng AQW.",
    longDescription:
      o?.longDescription ||
      "Thông tin đã có được trình bày theo guide cộng đồng. Vai trò, điều kiện sở hữu hoặc chi tiết chưa đủ dữ liệu vẫn được ghi đang cập nhật.",
    image: `class-${p.slug}`,
    role: o?.role || [],
    roleBasis: o?.roleBasis,
    playstyle: o?.playstyle || "Đang bổ sung phân loại",
    difficulty: o?.difficulty,
    difficultyBasis: o?.difficultyBasis,
    acquisitionType: o?.acquisitionType || [],
    acquisitionSummary:
      o?.acquisitionSummary || "Điều kiện lấy Class đang được đối chiếu.",
    strengths: o?.strengths || [],
    weaknesses: o?.weaknesses || [],
    skills: [],
    obtainSteps: [],
    combos: [],
    relatedClasses: o ? Object.keys(overrides).filter((s) => s !== p.slug) : [],
    sources,
    lastVerified: o ? "2026-11-06" : "2026-11-05",
    status: o ? "Hồ sơ biên soạn" : "Đang cập nhật",
    accent: o?.accent || "#b7c8c3",
    featured: !!o,
    bodyUrl: `/content/classes/${p.slug}.json`,
    sourceGuide: `/class/${p.slug}`,
    skillCount: skills.length,
  };
  rows.push(item);
  fs.writeFileSync("public" + item.bodyUrl, JSON.stringify(payload) + "\n");
  assets.push({
    id: item.image,
    name,
    entity: p.slug,
    sourceUrl: sources.find((s) => s.id === "wiki")?.url || doc.url,
    credit: "AdventureQuest Worlds artwork © Artix Entertainment LLC",
    usageStatus: "pending",
    usageNote: "Chưa có tệp ảnh local đã nhận diện và xác nhận quyền sử dụng.",
  });
  audit.profiles.push({
    slug: p.slug,
    skills: skills.length,
    obtainSteps: obtainSteps.length,
    combos: payload.combos.length,
  });
}
for (const o of Object.values(overrides))
  if (!rows.some((r) => r.name === o.name))
    throw Error(`Curated profile missing: ${o.name}`);
fs.mkdirSync("src/content/classes", { recursive: true });
fs.writeFileSync(
  "src/content/classes/catalog.json",
  await format(JSON.stringify(rows), { parser: "json" }),
);
// Preserve approved local artwork if administrators add it later.
const old = fs.existsSync("src/content/classes/assets.json")
  ? JSON.parse(fs.readFileSync("src/content/classes/assets.json", "utf8"))
  : [];
fs.writeFileSync(
  "src/content/classes/assets.json",
  await format(
    JSON.stringify(
      assets.map((a) => ({ ...a, ...old.find((x) => x.id === a.id) })),
    ),
    { parser: "json" },
  ),
);
fs.mkdirSync("qa", { recursive: true });
fs.writeFileSync("qa/class-import.json", JSON.stringify(audit, null, 2) + "\n");
console.log(
  `Class Codex: ${rows.length} profiles/groups; ${rows.filter((r) => r.featured).length} curated; non-Class chapters excluded from directory.`,
);
