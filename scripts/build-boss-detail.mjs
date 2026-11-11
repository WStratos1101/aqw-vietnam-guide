import { format } from "prettier";
import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const canonicalEquipmentId = (name) =>
  name.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/g, " ").trim();
const combat = read("src/content/ultra/combat.json"),
  editorial = read("src/content/ultra/editorial.json"),
  bosses = read("src/content/ultra/bosses.json"),
  index = read("content-sources/boss-codex/index.json");
const details = {};
for (const b of bosses) {
  const c = combat[b.slug],
    e = editorial[b.slug],
    wiki = index.find((x) => x.boss === b.slug && x.kind === "wiki");
  const allowed = new Set(
    (wiki?.skillNames || []).flatMap((n) => [n, ...n.split(/\s*➞\s*/)]),
  );
  if (b.slug === "ultra-tyndarius")
    for (const n of ["Melting", "Absorbing", "Charge Attack"]) allowed.add(n);
  if (b.slug === "ultra-warden") allowed.add("Berserk");
  c.mechanics = c.mechanics.flatMap((m) => {
    const name =
      m.name === "Charge"
        ? "Charge Attack"
        : m.name === "Noxious Decay"
          ? "Decaying Strike"
          : m.name;
    if (!allowed.has(name)) return [];
    return [{ ...m, name, source: wiki.url }];
  });
  c.mechanics = c.mechanics.filter(
    (m, i, all) => all.findIndex((x) => x.name === m.name) === i,
  );
  if (b.slug === "ultra-engineer")
    c.mechanics.push({
      id: "laser-shot",
      name: "Laser Shot",
      type: "Active Skill",
      trigger: "Trong nhịp tấn công thường",
      effect: "Bắn laser lên người tham chiến và hồi HP cho boss.",
      response: "Giữ nhịp hồi phục và xử lý Drone theo đội hình.",
      severity: "normal",
      notes: [],
      relatedStats: [],
      source: wiki.url,
    });
  for (const m of c.mechanics)
    if (
      b.slug === "ultra-tyndarius" &&
      ["Melting", "Absorbing", "Charge Attack"].includes(m.name)
    )
      m.source = "https://aqwwiki.wikidot.com/ultra-fire-orb-monster";
  c.notes = e.notes;
  c.nameVerification = {
    source: wiki.url,
    skillNames: [...allowed],
    checkedAt: "2026-11-07",
  };
  // Current Wiki attack fields are separate from older community tactical values.
  const file = "content-sources/boss-codex/" + b.slug + "-wiki.txt";
  if (fs.existsSync(file)) {
    const lines = fs
      .readFileSync(file, "utf8")
      .split("\n")
      .map((s) => s.replaceAll("\u00a0", " ").trim());
    let skill = "";
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("+ ")) {
        skill = lines[i].slice(2);
        continue;
      }
      if (skill && ["Damage", "Cooldown", "AoE", "Type"].includes(lines[i])) {
        const val = lines[i + 1];
        if (!val || val.includes("{$")) continue;
        c.stats.push({
          key: "wiki-" + i,
          label: {
            Damage: "Sát thương",
            Cooldown: "Chu kỳ",
            AoE: "Số mục tiêu",
            Type: "Loại sát thương",
          }[lines[i]],
          value:
            val === "A lot"
              ? "Rất lớn — chưa có số cụ thể"
              : val.replace(/ seconds?/g, " giây"),
          subject: skill,
          group: "Wiki — thông số đối chiếu",
          explanation:
            "Thông số từ trang Monster Wiki hiện đọc được; không suy diễn trường placeholder chưa có dữ liệu.",
          source: wiki.url,
        });
      }
    }
  }
  if (b.slug === "ultra-warden") {
    const values = [
      ["auto-dmg", "Auto Attack", "4.844–5.882", "sát thương vật lý"],
      ["auto-cd", "Auto Attack", 2.25, "giây"],
      ["scream-dmg", "Petrifying Scream", "1.356–1.656", "sát thương phép"],
      ["scream-chance", "Petrifying Scream", 7, "% thay Auto Attack"],
      ["scream-stun", "Petrified", 6, "giây Stun"],
      ["berserk-threshold", "Berserk", 30, "% HP còn lại"],
      ["berserk-speed", "Berserk — Auto Attack", 1, "giây"],
      ["shield-exponent", "Boss Shield", 0.8, "hệ số"],
    ];
    for (const [key, label, value, unit] of values)
      c.stats.push({
        key: "wiki-warden-" + key,
        label,
        value,
        unit,
        subject: b.name,
        group: "Wiki — thông số đối chiếu",
        explanation:
          "Đọc từ Monster Wiki qua công cụ web khi Terminal chưa truy cập được trang này.",
        source: wiki.url,
      });
  }
  const body = b.sourceContentUrl ? read("public" + b.sourceContentUrl) : null;
  const additionalEquipment = [],
    progressionTimelines = [];
  for (const section of body?.progression || []) {
    let item = null;
    const steps = [];
    const routeNotes = [];
    for (const block of section.blocks || []) {
      const text =
        block.type === "table"
          ? "Bảng yêu cầu"
          : block.runs
              .map((r) => r.text)
              .join("")
              .trim();
      if (!text || /^Reset vào|^Chi tiết Merge Shop/i.test(text)) continue;
      if (!item && /^(Note:|[-–] )/i.test(text)) {
        routeNotes.push(block);
        continue;
      }
      const match = text.match(/^◆\s*([^:\n]+):/);
      if (
        match &&
        !/quest|Sau khi|Sau Khi/i.test(match[1]) &&
        !/Storyline/.test(section.title)
      ) {
        const name = match[1].replace(/\s*\([A-Z]+\)\s*$/, "").trim();
        if (/Enhancement|Các Cosmetics/i.test(name)) {
          item = null;
          steps.push({
            id: section.id + "-route-" + steps.length,
            title: name,
            description: text.slice(0, 160),
            requirement:
              "Đang đối chiếu tuyến riêng; không xem là phần thưởng mặc định của boss.",
            reward: "Xem yêu cầu và mốc trong chi tiết.",
            source: "community-guide",
            blocks: [block],
            dependencies: [],
          });
          continue;
        }
        const existing = b.equipmentRoutes.find(
          (r) => r.itemName === name || r.itemName.startsWith(name),
        );
        item = {
          id: section.id + "-item-" + additionalEquipment.length,
          canonicalId: existing?.canonicalId || canonicalEquipmentId(name),
          name,
          description: text.replace(/^◆\s*/, "").slice(0, 180),
          image: existing?.image,
          routeId: existing?.id,
          status: existing ? "Có tuyến chi tiết" : "Đang đối chiếu recipe",
          source: "community-guide",
          blocks: [block],
        };
        additionalEquipment.push(item);
      } else if (item) item.blocks.push(block);
      else
        steps.push({
          id: section.id + "-" + steps.length,
          title: (
            text.match(/[“"]([^”"]+)[”"]\s*quest/)?.[1] ||
            text.replace(/^[◆→]\s*/, "").split(/[.\n]/)[0]
          ).slice(0, 100),
          description: text.slice(0, 160),
          requirement: "Xem điều kiện chi tiết của bước.",
          reward: "Theo quest/map trong hướng dẫn.",
          source: "community-guide",
          blocks: [block],
          dependencies: [],
        });
    }
    if (steps.length)
      progressionTimelines.push({
        id: section.id,
        title: section.title,
        steps,
        notes: routeNotes,
        source: "community-guide",
        dependencyNote:
          "Thứ tự trình bày của nguồn; không tự suy diễn phụ thuộc giữa các bước.",
      });
  }
  for (const route of b.equipmentRoutes)
    route.canonicalId ||= canonicalEquipmentId(route.itemName);
  const routeIds = new Set(b.equipmentRoutes.map((route) => route.canonicalId));
  const distinctAdditionalEquipment = additionalEquipment.filter((item) => {
    item.canonicalId ||= canonicalEquipmentId(item.name);
    return !routeIds.has(item.canonicalId);
  });
  details[b.slug] = {
    ...e,
    tauntTables: c.reference
      .flatMap((s) => s.blocks || [])
      .filter((b) => b.type === "table"),
    additionalEquipment: distinctAdditionalEquipment,
    progressionTimelines,
    sources: [
      wiki.url,
      index.find((x) => x.boss === b.slug && x.kind === "sites").url,
    ],
  };
}
fs.writeFileSync(
  "src/content/ultra/combat.json",
  await format(JSON.stringify(combat), { parser: "json" }),
);
fs.writeFileSync(
  "src/content/ultra/details.json",
  await format(JSON.stringify(details), { parser: "json" }),
);
console.log(
  "Boss detail data: Wiki names, notes, taunt, reset and progression for 8 bosses",
);
