import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const initial = read("content-sources/v12-11/initial-queue.json"),
  catalog = read("src/content/classes/catalog.json");
const acquisition = read("src/content/classes/acquisition.json").classes;
const reviews = read("src/content/classes/verification-recovery-v12-11.json");
const conflicts = read("src/content/classes/source-conflicts-v12-11.json");
const body = new Map(catalog.map((c) => [c.id, read("public" + c.bodyUrl)]));
const guide =
  "https://docs.google.com/document/d/1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78/edit";
const escape = (v) =>
  String(v ?? "—")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
const unresolvedAcquisition = {
  "deathknight-lord-dkl": {
    fields: [
      "merge.materials.DeathKnight Lord Armor.quantity",
      "merge.shop/item relationship",
    ],
    reason:
      "Class page omits Armor quantity; Bonecastle Merge Class row lists only Shadow Skull ×30, while Tower Merge lists Armor rather than Class. Current sources disagree; do not infer ×1 or borrow the Armor recipe.",
  },
  "dragon-of-time-dt-edot": {
    fields: [
      "quest.materials.Mysterious Egg (Pet).quantity",
      "quest.materials.Conquered Past.quantity",
    ],
    reason:
      "Exact Hero’s Heartbeat disclosure names these two items without quantities. Retain the explicit Slugbutter Trophy ×100 / Icewing Laurel ×30 text in source; do not default the other quantities to one.",
  },
  "necromancer-necro-pinkomancer": {
    fields: ["legacy PTR shop identity and item row"],
    reason:
      "Historical Necromancer (PTR) points to PTR Enhancements at 100 Gold. Current linked page contains enhancement tables, not a matching Class row. Cannot reconstruct a current Shop from that page; legacy method remains partial.",
  },
  sentinel: {
    fields: [
      "3rd Upholder shop detail/access proof",
      "12th Upholder shop detail/access proof",
    ],
    reason:
      "1st and 11th shop rows recovered. Direct 3rd/12th shop page access still returns connection failure / redirect loop. Search extracts and badge pages alone are not sufficient to verify every Shop field.",
  },
  "yami-no-ronin-ynr": {
    fields: [
      "quest.materials.Yokai Sword Scroll.quantity",
      "quest.materials.Blademaster Sword Scroll.quantity",
    ],
    reason:
      "Exact Yami no Ronin quest names both scrolls without quantities. No explicit quantity proof found; neither inferred ×1 nor AND/OR rewrite is applied.",
  },
};
const rows = initial.skills.map((entry) => {
  const skill = body
    .get(entry.classId)
    .skills.find((s) => s.id === entry.skillId);
  const review = reviews.find(
    (r) => r.classId === entry.classId && r.skillId === entry.skillId,
  );
  const conflict = conflicts.find(
    (c) => c.classId === entry.classId && c.skillId === entry.skillId,
  );
  const remaining = entry.missingFields.filter((f) =>
    f === "sourceConflict"
      ? skill.effectsVerificationStatus === "source_conflict"
      : f === "effects"
        ? skill.effectsVerificationStatus === "unverified"
        : skill[f] == null,
  );
  const checkedSources = [
    ...new Set([
      ...entry.sources,
      guide,
      ...(review ? [review.evidence.source] : []),
      ...(entry.classId === "skycharged-grenadier-scg"
        ? ["https://www.aq.com/gamedesignnotes/loyaltyclassskills-6006"]
        : []),
      ...(/chrono(?:-|)c(?:h)?a?orruptor|chronocorruptor/.test(entry.classId)
        ? [
            "https://www.aq.com/gamedesignnotes/chronocorruptorclassskills-1334",
            "https://www.aq.com/lore/classes/chronocorruptor",
          ]
        : []),
    ]),
  ];
  return {
    ...entry,
    status: remaining.length
      ? conflict
        ? "UNRESOLVED"
        : "PENDING"
      : "VERIFIED",
    remaining,
    sourceReferences: checkedSources,
    conflictId: conflict?.id,
    verifiedAt: "2026-11-11",
    reason: remaining.length
      ? conflict?.reason ||
        "Reviewed exact Wiki skill block and existing Class Guide: no explicit Range category supplied. Target count and other values do not prove Range. No range inferred from role, animation, name, or artwork variant."
      : review?.evidence.rationale || "Source-bound verification integrated",
    currentValue: Object.fromEntries(
      entry.missingFields.map((f) => [
        f,
        f === "sourceConflict"
          ? {
              status: skill.effectsVerificationStatus,
              effects: skill.effects,
              conflictId: conflict?.id,
            }
          : f === "effects"
            ? {
                status: skill.effectsVerificationStatus,
                effects: skill.effects,
                damage: skill.damageDisplay,
              }
            : skill[f],
      ]),
    ),
  };
});
const acquisitionRows = initial.acquisitions.map((entry) => {
  const current = acquisition[entry.classId],
    pending = current.methods.filter((m) => m.detailsStatus === "partial");
  const isDone = current.reviewStatus === "reviewed";
  return {
    ...entry,
    status: isDone ? "VERIFIED" : "PENDING",
    missingFields: isDone
      ? []
      : unresolvedAcquisition[entry.classId]?.fields || ["acquisition detail"],
    reason: isDone
      ? "All original partial fields addressed; previously complete methods preserved. Source page reviews in content-sources/v12-11/acquisition-page-reviews.json."
      : unresolvedAcquisition[entry.classId]?.reason,
    sourceReferences: [
      ...new Set([
        ...entry.sources,
        ...current.methods
          .flatMap((m) => [
            m.evidence?.recovery?.source,
            m.quest?.source,
            m.merge?.source,
            m.shop?.source,
          ])
          .filter(Boolean),
      ]),
    ],
    currentValue: {
      reviewStatus: current.reviewStatus,
      issues: current.issues,
      methods: pending.map((m) => ({
        id: m.id,
        source: m.source,
        issues: m.evidence.issues,
        price: m.shop?.price,
        rawMaterials:
          m.merge?.rawMaterials ||
          m.quest?.verifiedQuestSteps?.at(-1)?.rawMaterials,
      })),
      verifiedMethods: current.methods
        .filter((m) => m.detailsStatus === "complete")
        .map((m) => ({
          id: m.id,
          type: m.acquisitionKind,
          variant: m.variantName,
          shop: m.shop?.shopName,
          quest: m.quest?.questName,
        })),
    },
  };
});
const counts = {
  uniqueSkills: rows.length,
  range: rows.filter((r) => r.remaining.includes("rangeCategory")).length,
  target: rows.filter((r) => r.remaining.includes("targetCount")).length,
  effects: rows.filter((r) => r.remaining.includes("effects")).length,
  conflicts: rows.filter((r) => r.remaining.includes("sourceConflict")).length,
  acquisition: acquisitionRows.filter((r) => r.status !== "VERIFIED").length,
};
const lines = [
  "# V12.11 Verification Queue",
  "",
  "Ngày rà: 2026-11-11. Mỗi Skill có một entry với nhiều field nếu cần. Giá trị trước khi sửa được lưu bất biến tại content-sources/v12-11/initial-queue.json; bảng dưới là trạng thái sau khi sửa. Không đếm một Skill hai lần vì thiếu nhiều field.",
  "",
  `Còn: ${counts.range} Range, ${counts.target} Target, ${counts.effects} Effect, ${counts.conflicts} conflict; ${counts.acquisition}/${initial.acquisitions.length} hồ sơ acquisition gốc.`,
  "",
  "| Class ID / Name | Skill ID / Name | Initial Missing Fields → Remaining | Current Value | Source References | Status / Reason |",
  "| --- | --- | --- | --- | --- | --- |",
];
for (const e of rows)
  lines.push(
    "| " +
      [
        e.classId + " / " + e.className,
        e.skillId + " / " + e.skillName,
        e.missingFields.join(", ") + " → " + (e.remaining.join(", ") || "None"),
        JSON.stringify(e.currentValue),
        e.sourceReferences.join(" · "),
        e.status +
          " · " +
          e.reason +
          (e.conflictId ? " · V12_11_SOURCE_CONFLICTS.md#" + e.conflictId : ""),
      ]
        .map(escape)
        .join(" | ") +
      " |",
  );
lines.push(
  "",
  "## Acquisition",
  "",
  "Chỉ cập nhật hồ sơ nằm trong backlog gốc; các hồ sơ complete khác được kiểm tra bằng hash. Các Map bị gán nhầm là Shop được giữ trong excludedMethods cùng lý do, không xóa provenance.",
  "",
  "| Class ID / Name | Remaining Fields | Current Value | Source References | Status / Reason |",
  "| --- | --- | --- | --- | --- |",
);
for (const e of acquisitionRows)
  lines.push(
    "| " +
      [
        e.classId + " / " + e.className,
        e.missingFields.join(", ") || "None",
        JSON.stringify(e.currentValue),
        e.sourceReferences.join(" · "),
        e.status + " · " + e.reason,
      ]
        .map(escape)
        .join(" | ") +
      " |",
  );
lines.push(
  "",
  "Partial ngoài 19 hồ sơ gốc (không sửa trong đợt này): " +
    initial.additionalPartial.join(", ") +
    ".",
  "",
);
fs.writeFileSync("V12_11_VERIFICATION_QUEUE.md", lines.join("\n"));
fs.writeFileSync(
  "artifacts/qa/v12-11/queue.json",
  JSON.stringify(
    {
      verifiedAt: "2026-11-11",
      counts,
      skills: rows,
      acquisitions: acquisitionRows,
    },
    null,
    2,
  ) + "\n",
);
console.log(counts);
