// Reproduce reviewed records from the immutable, pre-edit queue and fetched primary sources.
import fs from "node:fs";
import { createHash } from "node:crypto";
const read = (p) => JSON.parse(fs.readFileSync(p));
const baseline = read("content-sources/v12-11/initial-queue.json");
const registry = read("src/content/classes/skill-registry.json");
const rows = [];
const sources = {
  nam: [
    "https://www.aq.com/gamedesignnotes/aqw-30jan2024-notamodupdates-9449",
    "nam.html",
  ],
  ps: [
    "https://www.aq.com/gamedesignnotes/aqw-heromartclassupdates-30jul26-10415",
    "paladinslayer.html",
  ],
  scg: [
    "https://www.aq.com/gamedesignnotes/loyaltyclassskills-6006",
    "loyalty.html",
  ],
  flight: [
    "https://www.aq.com/gamedesignnotes/ClassBalanceUpdatesMay15-7494",
    "abyssal2020.html",
  ],
  quantum: [
    "https://www.aq.com/gamedesignnotes/aqw-dec20-2022calendarclassbreakdown-8615",
    "quantum.html",
  ],
  dark: [
    "https://www.aq.com/gamedesignnotes/AQW-Balance-PatchNotes-9515",
    "balance.html",
  ],
};
function add(classId, skillId, sourceKey, patch, rationale, excerpt) {
  const original = registry.skills.find(
    (r) => r.classId === classId && r.skillId === skillId,
  );
  if (!original) throw Error("Unknown identity " + classId + "/" + skillId);
  const [url, file] = sources[sourceKey];
  const snapshotPath = "content-sources/v12-11/" + file;
  rows.push({
    classId,
    skillId,
    officialName: original.officialName,
    sourceHash: original.sourceHash,
    patch,
    evidence: {
      source: url,
      snapshotPath,
      snapshotHash: createHash("sha256")
        .update(fs.readFileSync(snapshotPath))
        .digest("hex"),
      verifiedAt: "2026-11-11",
      rationale,
      excerpt,
    },
  });
}
for (const e of baseline.skills.filter((e) => e.classId === "not-a-mod-nam")) {
  const patch = {
    rangeCategory: e.skillName === "Keyboard Smash" ? "Infinite" : "Close",
  };
  if (e.skillName === "Reasonable Strike") patch.targetCount = 1;
  if (e.skillName === "Auto Attack")
    Object.assign(patch, {
      effects: [],
      effectsVerificationStatus: "verified_none",
      noAdditionalEffects: true,
      damageDisplay: "Gây 100% sát thương vật lý.",
      normalAttackVerified: true,
    });
  add(
    e.classId,
    e.skillId,
    "nam",
    patch,
    "Official rework explicitly lists Range and Max Targets for each named skill. Reasonable Attack in the announcement corresponds to current Reasonable Strike (rank 2, mana 0, cooldown 4, full mana recovery). Melee maps to Close. Retain current Wiki cooldowns, including Keyboard Smash 20s rather than the announcement’s older 14s.",
    e.skillName === "Keyboard Smash"
      ? "Keyboard Smash: Range Infinite"
      : e.skillName === "Reasonable Strike"
        ? "Reasonable Attack: Max Target 1; Range Melee"
        : e.skillName + ": Range Melee",
  );
}
add(
  "paladinslayer-ps",
  "skill-3",
  "ps",
  { rangeCategory: "Long" },
  "August 2026 rework matches current SHADOW GRASP rank, cost, cooldown and mechanics. Only fill the missing Range.",
  "SHADOW GRASP: Max Targets 1; Range Long",
);
add(
  "skycharged-grenadier-scg",
  "skill-1",
  "scg",
  { rangeCategory: "Long" },
  "Official skill breakdown explicitly calls Bombard long ranged. No range supplied for the other four skills; do not infer those.",
  "Bombard: Fire a powerful, long ranged explosive round.",
);
add(
  "dark-lord-dl-darkside",
  "skill-1",
  "dark",
  {
    effects: [],
    effectsVerificationStatus: "verified_none",
    noAdditionalEffects: true,
    damageDisplay: "Gây sát thương bằng 66% Spell Power.",
    normalAttackVerified: true,
  },
  "May 1, 2026 balance notes explicitly update the normal attack Forbidden Form to 66%, based on Spell Power. The current Wiki confirms Long range and four hostile targets. No extra aura is stated for this attack.",
  "Forbidden Form: Range Melee > Long; Damage 100% > 66%; Spell Power instead of Attack Power.",
);
add(
  "abyssal-angel-aa-abyssal-angel-s-shadow-aas",
  "skill-2",
  "flight",
  {
    effects: [
      {
        targets: ["SELF"],
        name: "Vantage Point",
        text: "Tăng 15% Hit Chance và Dodge, tăng 75% sát thương DoT và tập trung mọi đòn đánh vào một mục tiêu trong 6 giây.",
      },
      {
        targets: ["SELF"],
        name: "Mana Refraction",
        text: "Giảm 50% Mana Cost trong 8 giây.",
      },
    ],
    effectsVerificationStatus: "verified",
    conflictId: "flight-dot",
  },
  "May 15, 2020 official change 50% → 75% agrees with the current Wiki description; the Notes retain the pre-patch value. The archived/current balance lists reviewed contain no subsequent reversal.",
  "Flight/Shadowed Flight DoT damage increase: 50% > 75%",
);
add(
  "abyssal-angel-aa-abyssal-angel-s-shadow-aas",
  "skill-5",
  "flight",
  {
    effects: [
      {
        targets: ["SELF"],
        name: "Crystallis Veil",
        text: "Tăng 25% Damage Resistance.",
      },
      { targets: ["SELF"], name: "Clean Cut", text: "Tăng 15% Crit Chance." },
    ],
    effectsVerificationStatus: "source_conflict",
    conflictId: "crystallis-duration",
  },
  "UNRESOLVED duration: current Wiki description 8s/6s conflicts with Notes 9s/7s. Retain mutually supported amounts; do not render an invented duration or internal audit explanation.",
  "May 2020 Crystallis Veil Crit Chance update: 25% > 15%; current Wiki agrees on 25% Damage Resistance.",
);
for (const id of [
  "calendar-quantum-chronomancer",
  "calendar-continuum-chronomancer",
]) {
  const text =
    "Mỗi mục tiêu đồng minh chịu tác động của Quantum Shift cho một stack Quantum Spiral: tăng 10% hệ số Crit và sát thương DoT mỗi stack trong 23 giây, tối đa 40 stack; không làm mới thời hạn.";
  add(
    id,
    "wiki-active-quantumshift",
    "quantum",
    {
      effects: [
        {
          targets: ["SELF", "ALLY"],
          name: "Quantum Shift",
          text: "Tăng 30% Crit Chance và Defense, tăng 10% sát thương vật lý và phép gây ra trong 10 giây.",
        },
        { targets: ["SELF"], text: "Ở Rank 10: " + text },
      ],
      effectsVerificationStatus: "verified",
      conflictId: id + "-spiral",
    },
    "The current active Wiki note and official detailed mechanic both state 23 seconds and non-refreshing expiry. The passive description says 20 seconds. No duration change found in the archived/current balance lists; use corroborated 23 seconds for both effect views, retaining the contradictory raw source. Confidence: medium.",
    "Quantum Spiral: 10% for 23 seconds, stacks to 40 but cannot be refreshed; lose all stacks after 23 seconds.",
  );
  const passive = registry.skills.find(
    (r) =>
      r.classId === id &&
      r.passive &&
      /Quantum (Spiral|Mending)/.test(r.officialName),
  );
  add(
    id,
    passive.skillId,
    "quantum",
    {
      effects: [{ targets: ["SELF"], text }],
      effectsVerificationStatus: "verified",
      conflictId: id + "-spiral",
    },
    "Same Quantum Spiral effect as the active Rank 10 note; keep passive display consistent with the corroborated duration. Preserve its original official name and raw Wiki text. Confidence: medium.",
    "Quantum Spiral: 23 seconds, cannot be refreshed.",
  );
}
fs.writeFileSync(
  "src/content/classes/verification-recovery-v12-11.json",
  JSON.stringify(rows, null, 2) + "\n",
);
console.log("Wrote", rows.length, "source-bound reviews");
