import fs from "node:fs";
const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const document = read("content-sources/class-guide.json");
const source =
  "https://docs.google.com/document/d/" + document.source.id + "/edit";
const lines = new Map(
  document.nodes.map((node) => [
    node.sourceIndex,
    node.runs
      ?.map((run) => run.text)
      .join("")
      .trim(),
  ]),
);
const group = (kind, label, sequence, sourceLine, extra = {}) => ({
  kind,
  label,
  sequences: [sequence],
  sourceLine,
  ...extra,
});
const opening = (sequence, line) => group("sequence", "Mở đầu", sequence, line);
const loop = (sequence, line, label = "Lặp lại") =>
  group("loop", label, sequence, line);
const finish = (sequence, line) => group("sequence", "Nuke", sequence, line);
const spam = (sequence, line, stopCondition) =>
  group("spam", "Spam", sequence, line, { stopCondition });
const rotations = [
  {
    ids: ["calendar-chrono-shadowslayer", "calendar-chrono-shadowhunter"],
    heading: [11391, "Chrono ShadowSlayer/Hunter (CSS/CSH)"],
    slots: [
      [1, 11422],
      [2, 11434],
      [3, 11443],
      [4, 11456],
      [5, 11466],
    ],
    combos: [
      [
        "Quick Nuke",
        [opening([3, 4, 4, 3, 4, 4], 11402), finish([5, 2], 11402)],
        [11403, 11409, 11414],
      ],
      [
        "Standard",
        [
          opening([3, 4, 4, 4, 4, 2], 11406),
          spam(
            [1],
            11406,
            "Trong 2 giây sau Reload, đến khi không thể bắn tiếp.",
          ),
          finish([5, 2], 11406),
        ],
        [11409, 11410, 11414],
      ],
      [
        "Advanced",
        [
          opening([3, 4, 4, 4, 4, 2], 11407),
          spam(
            [1],
            11407,
            "Trong 2 giây sau Reload, đến khi không thể bắn tiếp.",
          ),
          group("sequence", "Reload và bắn FMJ", [2, 4, 4, 4, 4], 11407),
          finish([5, 2], 11407),
        ],
        [11409, 11410, 11414],
      ],
      [
        "Dodge Combo",
        [
          opening([3], 11413),
          loop([4, 3], 11413, "Sau đòn đánh của Boss"),
          finish([5, 2], 11413),
        ],
        [11414],
      ],
    ],
  },
  {
    ids: ["calendar-timekeeper", "calendar-timekiller"],
    heading: [9989, "TimeKiller/Keeper (TK)"],
    slots: [
      [1, 10017],
      [2, 10025],
      [3, 10033],
      [4, 10041],
      [5, 10050],
    ],
    nameAliases: {"Relive The Past": "Compress Time", "Compress Time": "Relive the Past"},
    combos: [
      [
        "Full Nuke",
        [
          opening([3, 5, 2, 2, 2, 5, 2, 3, 4], 10000),
          loop([2, 2, 5, 2, 2, 3, 4], 10001),
        ],
        [10002],
      ],
      [
        "Quick Nuke",
        [
          opening([3, 5, 2, 2, 2, 4], 10005),
          spam([2, 5], 10005),
          group("sequence", "Hồi Mana và Nuke", [3, 4], 10005),
        ],
        [10007, 10008],
      ],
    ],
  },
  {
    ids: ["shadowwalker-stalker-weaver-of-time-swot-ssot"],
    heading: [10293, "ShadowWalker/Stalker/Weaver of Time (SWoT/SSoT)"],
    slots: [
      [3, [10350, 10351]],
      [4, [10360, 10361]],
    ],
    combos: [
      [
        "Standard Combo",
        [
          opening([2, 3, 5, 2, 4, 2, 3], 10301),
          loop([2, 3, 5, 3, 4, 2, 3], 10302, "Double Nuke"),
          group("sequence", "Không dùng Mana Vamp", [3, 5, 3, 4, 2, 3], 10311),
        ],
        [10306, 10307, 10310, 10311],
      ],
      [
        "Defensive Combo",
        [opening([4, 3, 2], 10320), finish([5, 3, 2, 3], 10322)],
        [10315, 10319, 10321, 10323],
      ],
    ],
  },
];
rotations.push(
  {
    ids: ["calendar-chronocorruptor", "calendar-chrono-chaorruptor"],
    heading: [9915, "ChronoCorruptor - Chrono Chaorruptor (CCR)"],
    slots: [
      [1, 9941],
      [2, 9949],
      [3, 9956],
      [4, 9965],
      [5, 9973],
    ],
    combos: [
      [
        "Quick Nuke",
        [opening([2, 5, 3, 2, 2, 2], 9926), finish([4], 9926)],
        [9927, 9928],
      ],
      [
        "Full Nuke",
        [opening([2, 2, 5, 3, 2, 2, 2, 2], 9930), finish([4], 9930)],
        [9931, 9932, 9933],
      ],
    ],
  },
  {
    ids: ["calendar-chronocommander", "calendar-chrono-commandant"],
    heading: [10071, "ChronoCommander - Chrono Commandant (CMD)"],
    slots: [
      [1, 10098],
      [2, 10106],
      [3, 10113],
      [4, 10122],
      [5, 10130],
    ],
    combos: [
      [
        "Quick Nuke",
        [opening([3, 2, 5, 2, 2, 2], 10082), finish([4], 10082)],
        [10083],
      ],
      [
        "Full Nuke",
        [
          opening([3, 2, 5], 10086),
          spam([2], 10086, "Dùng 5–6 lần."),
          finish([4], 10086),
        ],
        [10089],
      ],
    ],
  },
  {
    ids: ["calendar-chrono-dragonknight", "calendar-chrono-dataknight"],
    heading: [10146, "Chrono Dragon/DataKnight (CDK)"],
    slots: [
      [1, 10168],
      [2, 10177],
      [3, 10184],
      [4, 10192],
      [5, 10200],
    ],
    combos: [
      [
        "Nuke Rotation",
        [
          opening([4, 2, 2, 3, 2, 2, 3], 10157),
          finish([5], 10157),
          loop(
            [4, 2, 3, 2, 2, 3, 2, 2, 3, 5],
            10159,
            "Nhịp khi Nuke hồi chiêu",
          ),
        ],
        [10158, 10159],
      ],
    ],
  },
  {
    ids: ["eternal-immortal-empyrean-chronomancer-ecm-icm"],
    heading: [10392, "Eternal/Immortal/Empyrean Chronomancer (ECM/ICM)"],
    slots: [
      [1, 10414],
      [2, 10422],
      [3, 10432],
      [4, 10442],
      [5, 10450],
    ],
    combos: [
      [
        "High Crit",
        [
          {
            ...opening([5, 2], 10400),
            sequences: [
              [5, 2],
              [5, 3, 5],
            ],
            additionalSourceLines: [10401],
          },
          loop([3, 2], 10405, "Lặp 4 lần"),
          finish([5, 4], 10405),
        ],
        [10400, 10401],
      ],
      [
        "Full Nuke",
        [
          {
            ...opening([5, 2], 10400),
            sequences: [
              [5, 2],
              [5, 3, 5],
            ],
            additionalSourceLines: [10401],
          },
          loop([2, 3], 10406, "Lặp 3 lần"),
          group("sequence", "Chuyển nhịp", [5], 10406),
          loop([2, 3], 10406, "Lặp 2 lần"),
          finish([4], 10406),
        ],
        [10400, 10401],
      ],
    ],
  },
  {
    ids: ["calendar-nechronomancer", "calendar-necrotic-chronomancer"],
    heading: [11151, "Nechronomancer - Necrotic Chronomancer (NCM)"],
    slots: [
      [1, 11175],
      [2, 11182],
      [3, 11191],
      [4, 11200],
      [5, 11210],
    ],
    combos: [
      [
        "Farm Rotation",
        [
          opening([3, 2, 4, 5], 11162),
          {
            ...loop([3, 2, 5], 11162),
            sequences: [
              [3, 2, 5],
              [3, 2, 2, 5],
            ],
          },
        ],
        [11162],
      ],
      [
        "High HP Mobs (>30k)",
        [
          {
            ...loop([3, 2, 5], 11164, "Lặp 3 lần"),
            sequences: [
              [3, 2, 5],
              [3, 2, 2, 5],
            ],
          },
          {
            ...finish([3, 2, 4, 5], 11164),
            sequences: [
              [3, 2, 4, 5],
              [3, 2, 2, 4, 5],
            ],
          },
        ],
        [11163],
      ],
      [
        "Solo Rotation",
        [
          opening([3, 2, 5], 11167),
          group(
            "sequence",
            "Tích Rift và Nuke",
            [2, 3, 2, 2, 3, 2, 2, 3, 4, 5],
            11167,
          ),
        ],
        [11167],
      ],
    ],
  },
  {
    ids: ["calendar-continuum-chronomancer", "calendar-quantum-chronomancer"],
    heading: [11234, "Continuum/Quantum Chronomancer (QCM)"],
    slots: [
      [1, 11258],
      [2, 11265],
      [3, 11273],
      [4, 11280],
      [5, 11288],
    ],
    combos: [
      [
        "Quick Nuke",
        [
          opening([2, 3, 2, 2, 4, 5], 11245),
          spam([2, 3], 11245, "Đến khi skill 5 hồi xong."),
          finish([4, 5], 11245),
        ],
        [],
      ],
      [
        "Standard",
        [
          opening([3], 11246),
          spam([2], 11246, "Đến khi skill 3 hồi xong."),
          finish([3, 2, 4, 5], 11246),
        ],
        [],
      ],
      [
        "Advanced",
        [
          opening([3, 4], 11247),
          spam([2], 11247, "Đến khi skill 3 hồi xong."),
          finish([3, 2, 4, 5], 11247),
          group("sequence", "Nhịp tiếp theo", [2, 3, 2, 4, 2, 3], 11247),
          spam([2], 11247, "Đến khi skill 3 hồi xong."),
          finish([3, 4, 5], 11247),
        ],
        [11247],
      ],
    ],
  },
  {
    ids: [
      "calendar-paladin-chronomancer",
      "calendar-obsidian-paladin-chronomancer",
    ],
    heading: [
      11312,
      "Paladin Chronomancer - Obsidian Paladin Chronomancer (PCM)",
    ],
    slots: [
      [1, 11333],
      [2, 11340],
      [3, 11350],
      [4, 11360],
      [5, 11369],
    ],
    combos: [
      [
        "Support / Nuke",
        [
          opening([3, 2, 4, 2, 3, 2, 2, 2, 5], 11322),
          group("sequence", "Vòng Nuke kế tiếp", [2, 3, 2, 2, 2, 2, 5], 11322),
        ],
        [11323],
      ],
    ],
  },
  {
    ids: ["phantom-phantasm-chronomancer-phcm"],
    heading: [11488, "Phantom/Phantasm Chronomancer (PhCM)"],
    slots: [
      [1, 11511],
      [2, 11519],
      [3, 11527],
      [4, 11536],
    ],
    combos: [
      [
        "Standard",
        [
          opening([4], 11498),
          loop([2, 3], 11498, "Lặp 4 lần"),
          finish([4, 2, 4, 3, 4, 5], 11498),
        ],
        [],
      ],
      [
        "Advanced · Elysium",
        [
          opening([4], 11500),
          loop([2, 3], 11500, "Lặp 4 lần"),
          finish([4, 2, 4, 3, 4, 3, 4, 3, 2, 3, 4, 5], 11500),
        ],
        [],
      ],
      [
        "Advanced · Ravenous",
        [
          opening([4], 11501),
          loop([2, 3], 11501, "Lặp 4 lần"),
          group("sequence", "Chuẩn bị", [4, 2, 4, 3], 11501),
          loop([2, 3], 11501, "Lặp 3 lần"),
          finish([4, 5], 11501),
        ],
        [],
      ],
    ],
  },
);
// Slot 6 in the source is a consumable command. Keep it outside the ability bar.
const setup = (label, sourceLine) => ({
  kind: "setup",
  label,
  sequences: [],
  sourceLine,
});
rotations.push(
  {
    ids: ["chronomancer-cm-chronomancer-prime-cmp"],
    heading: [9843, "Chronomancer (CM) - Chronomancer Prime (CMP)"],
    slots: [],
    combos: [
      [
        "Quick Nuke",
        [opening([3, 2, 5, 2, 2, 2, 2], 9851), finish([4], 9851)],
        [9852],
      ],
      [
        "Full Nuke",
        [
          opening([3, 2, 5], 9855),
          spam([2], 9855, "Đến tick cuối của Riftburn."),
          finish([4], 9855),
        ],
        [9856, 9857],
      ],
    ],
  },
  {
    ids: ["infinity-interstellar-knight-ik"],
    heading: [10215, "Infinity/Interstellar Knight (IK)"],
    slots: [],
    combos: [
      ["Acheron · Standard", [loop([5, 2, 3, 2, 5, 2, 2, 4], 10224)], [10227]],
      [
        "Acheron · Advanced",
        [loop([5, 2, 3, 2, 5, 2, 3, 2, 2, 2, 4], 10225)],
        [10227],
      ],
      ["Elysium", [loop([5, 2, 3, 2, 5, 2, 3, 2, 2, 3, 2, 4], 10226)], [10227]],
    ],
  },
  {
    ids: ["archivist-of-time-temporis-aot"],
    heading: [11570, "Archivist of Time/Temporis (AoT)"],
    slots: [],
    combos: [
      [
        "Offensive Rotation",
        [
          opening(
            [
              1, 2, 4, 1, 4, 4, 1, 3, 2, 1, 4, 3, 1, 3, 3, 1, 3, 4, 1, 4, 4, 1,
              5,
            ],
            11591,
          ),
          loop(
            [2, 3, 1, 2, 2, 1, 2, 2, 1, 2, 2],
            11591,
            "Nhịp sau Rewrite Time",
          ),
        ],
        [11579, 11582, 11583, 11584, 11585, 11587, 11588, 11592],
      ],
      [
        "Defensive Rotation",
        [
          opening([1, 2, 4, 1, 4, 4, 1, 4, 2, 1, 4, 3, 1, 3, 4, 1, 5], 11596),
          loop(
            [2, 3, 1, 2, 2, 1, 4, 2, 1, 4, 3, 1, 4, 4, 1, 3, 4, 1, 2, 4],
            11597,
            "Duy trì buff thủ",
          ),
          finish([1, 4, 2, 1, 4, 3, 1, 4, 4, 1, 3, 4, 1, 5], 11597),
        ],
        [11579, 11582, 11585, 11586, 11587, 11588, 11595],
      ],
    ],
  },
  {
    ids: ["calendar-corrupted-chronomancer", "calendar-timeless-chronomancer"],
    heading: [
      10471,
      "Corrupted/Timeless/Underworld/Overworld Chronomancer (CCM/TCM/UCM/OCM)",
    ],
    slots: [
      [1, 10483],
      [2, 10491],
      [3, 10499],
      [4, 10507],
      [5, 10516],
    ],
    nameAliases: {
      "Corrupted Sand Strike/Timeless Strike (CSS/TS)": "Corrupted Sand Strike",
      "Sand Rift/Timeless Rift (SR/TR)": "Sand Rift",
      "Hourglass Inversion/Hourglass Reversal (HI/HR)": "Hourglass Inversion",
      "Corruption Through Time/Distortion Through Time (CTT/DTT)":
        "Corruption Through Time",
      "Temporal Collapse (TPC)": "Temporal Collapse",
    },
    combos: [
      [
        "Power + Entropic · Short",
        [
          setup("Hourglass và Entropic Corruption", 10708),
          setup("Dùng Entropic Corruption", 10709),
          opening([3, 4, 2, 2, 2], 10709),
          finish([5], 10709),
        ],
        [10694, 10715],
      ],
      [
        "Power + Entropic · Standard",
        [
          setup("Hourglass và Entropic Corruption", 10708),
          setup("Dùng Entropic Corruption", 10710),
          opening([3, 4, 2, 2, 2, 4, 2], 10710),
          finish([5], 10710),
        ],
        [10694, 10715],
      ],
      [
        "Power + Entropic · Extreme",
        [
          setup("Hourglass và Entropic Corruption", 10708),
          setup("Dùng Entropic Corruption", 10711),
          opening([3, 4, 2, 2, 2, 4, 2, 2, 2, 4], 10711),
          finish([5], 10711),
        ],
        [10694, 10715],
      ],
      [
        "Transience + Foresee · High Nuke",
        [
          setup("Hourglass và Foresee Corruption", 10738),
          setup("Dùng Foresee Corruption", 10739),
          opening([4, 3, 2, 2, 2, 2, 5], 10739),
          loop([4, 3, 2, 2, 2, 2, 5], 10739, "Lặp thêm 2 lần"),
          group("sequence", "Chuẩn bị nạp Foresee", [4, 3, 2, 4, 2], 10739),
          setup("Dùng lại Foresee Corruption", 10739),
          finish([4, 2, 2, 2, 5, 3], 10739),
        ],
        [10738],
      ],
    ],
  },
  {
    ids: [
      "calendar-underworld-chronomancer",
      "calendar-overworld-chronomancer",
    ],
    heading: [
      10471,
      "Corrupted/Timeless/Underworld/Overworld Chronomancer (CCM/TCM/UCM/OCM)",
    ],
    slots: [
      [1, 10483],
      [2, 10491],
      [3, 10499],
      [4, 10507],
      [5, 10516],
    ],
    nameAliases: {
      "Corrupted Sand Strike/Timeless Strike (CSS/TS)": "Timeless Strike",
      "Sand Rift/Timeless Rift (SR/TR)": "Timeless Rift",
      "Hourglass Inversion/Hourglass Reversal (HI/HR)": "Hourglass Reversal",
      "Corruption Through Time/Distortion Through Time (CTT/DTT)":
        "Distortion through Time",
      "Temporal Collapse (TPC)": "Temporal Collapse",
    },
    combos: [
      [
        "Power + Madness · Quick Nuke",
        [
          setup("Hourglass và Timepiece of Madness", 10910),
          setup("Dùng Timepiece of Madness", 10911),
          opening([4, 3, 2, 2, 2, 2], 10911),
          {
            ...finish([5], 10911),
            sequences: [[2, 5], [5]],
            additionalSourceLines: [10917, 10918],
          },
        ],
        [10915, 10916, 10917, 10918],
      ],
      [
        "Power + Pestilence · Standard",
        [
          setup("Hourglass và Timepiece of Pestilence", 10940),
          setup("Dùng Timepiece of Pestilence", 10941),
          opening([4, 3, 2, 4, 2, 2, 2, 4], 10941),
          finish([5], 10941),
        ],
        [10926],
      ],
      [
        "Power + Pestilence · Extended",
        [
          setup("Hourglass và Timepiece of Pestilence", 10940),
          setup("Dùng Timepiece of Pestilence", 10942),
          opening([4, 3, 2, 4, 2, 2, 2, 4, 2, 2, 2], 10942),
          finish([5], 10942),
        ],
        [10926],
      ],
    ],
  },
);
const catalog = read("src/content/classes/catalog.json");
const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
const openings = new Map([
  ["arcana-invoker-ai", "The Fool → The World"],
  ["frost-spiritreaver-fsr", "Nuke Rotation"],
  ["scarlet-sorceress-ss", "Farming Rotation"],
  ["not-a-mod-nam", "Gamer Rage Rotation"],
]);
const changes = [];
for (const profile of catalog) {
  const path = "public" + profile.bodyUrl;
  const body = read(path);
  const rotation = rotations.find((entry) => entry.ids.includes(profile.id));
  if (rotation) {
    const [start, heading] = rotation.heading;
    if (lines.get(start) !== heading)
      throw Error("Calendar combo heading changed: " + heading);
    for (const [slot, index] of rotation.slots) {
      const name = Array.isArray(index)
        ? index.map((line) => lines.get(line)).join("/")
        : lines.get(index);
      const currentName =
        profile.id === "phantom-phantasm-chronomancer-phcm" &&
        name === "The Clock Strikes at Midnight"
          ? "The Clock Strikes Midnight"
          : name;
      const skill = body.skills.find(
        (skill) =>
          !skill.passive &&
          normalize(skill.name) ===
            normalize(rotation.nameAliases?.[name] || currentName),
      );
      if (!skill)
        throw Error(
          "Class Guide slot has no matching skill: " + profile.id + "/" + name,
        );
      skill.skillNumber = slot;
      skill.slotEvidence = {
        source,
        sourceLine: index,
        guideName: name,
        officialName: skill.name,
        declaredSlot: slot,
      };
    }
    body.combos = rotation.combos.map(([name, groups, notes], index) => {
      const flow = groups.map((step, i) => {
        const sourceText = [
          step.sourceLine,
          ...(step.additionalSourceLines || []),
        ]
          .map((line) => lines.get(line))
          .filter(Boolean)
          .join("\n");
        if (!sourceText || step.sourceLine <= start)
          throw Error("Missing source line for " + name);
        for (const slot of step.sequences.flat()) {
          if (
            !body.skills.some(
              (skill) =>
                !skill.quarantined &&
                !skill.passive &&
                skill.skillNumber === slot,
            )
          )
            throw Error(
              "Unresolved Calendar skill slot: " + profile.id + "/" + slot,
            );
        }
        return { ...step, sourceText, id: profile.id + "-" + index + "-" + i };
      });
      return {
        id: "calendar-doc-" + index,
        title: name,
        situation: name,
        sequence:
          groups.find((step) => step.sequences.length)?.sequences[0] || [],
        explanation: flow[0].sourceText,
        notes: notes.map((n) => lines.get(n)).filter(Boolean),
        flow,
        source,
        verificationStatus: "verified",
        sourceHeading: heading,
      };
    });
  }
  const openingCombo = body.combos.find((combo) =>
    /^(?:Mở đầu|Bắt đầu)/i.test(combo.title),
  );
  if (openingCombo && openings.has(profile.id)) {
    body.combos = [
      {
        ...openingCombo,
        id: "rotation",
        title: openings.get(profile.id),
        situation: openings.get(profile.id),
        notes: [
          ...new Set([
            ...(openingCombo.notes || []),
            ...body.combos
              .filter((c) => c !== openingCombo)
              .map((c) => c.explanation),
          ]),
        ],
      },
    ];
  }
  if (rotation || (openingCombo && openings.has(profile.id))) {
    fs.writeFileSync(path, JSON.stringify(body) + "\n");
    changes.push({
      classId: profile.id,
      combos: body.combos.map((c) => c.title),
    });
  }
}
fs.mkdirSync("artifacts/qa/v12-9", { recursive: true });
fs.writeFileSync(
  "artifacts/qa/v12-9/combo-changes.json",
  JSON.stringify(changes, null, 2) + "\n",
);
