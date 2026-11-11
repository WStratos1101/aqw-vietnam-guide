import fs from "node:fs";
const reviewed = JSON.parse(
  fs.readFileSync("content-sources/recovery/darkon-combat-reviewed.json"),
);
const wiki = reviewed.source,
  doc = reviewed.communitySources[0],
  site = reviewed.communitySources[1];
const ids = {
  "Auto Attack": "auto-attack",
  "Special 1": "special-1",
  "Special 2": "special-2",
  Overture: "overture",
  Recitative: "recitative",
  Aria: "aria",
  "The Cycle's End": "cycle-end",
  "End of the World": "end-world",
  "Curtain Call": "curtain-call",
};
const phaseIds = {
  Overture: ["overture"],
  Recitative: ["recitative"],
  Aria: ["madness", "rush"],
};
const attacks = [];
for (const s of reviewed.skills) {
  let a = attacks.find((a) => a.officialName === s.name);
  if (!a) {
    a = {
      id: ids[s.name],
      officialName: s.name,
      damageType: s.damageType || null,
      baseDamage: s.damage || null,
      cooldown: s.cooldown || null,
      targetCount: s.targets || null,
      sharedEffects: [],
      sharedBossEffects: [],
      phaseEffects: [],
      source: wiki,
    };
    attacks.push(a);
  }
  if (s.name === "Auto Attack") {
    a.sharedEffects = s.playerEffects;
    for (const e of s.phaseEffects)
      for (const phaseId of phaseIds[e.phase])
        a.phaseEffects.push({
          phaseId,
          attackId: a.id,
          playerEffects: e.playerEffects,
          bossEffects: [],
          condition: e.phase + " đang hoạt động",
          duration: null,
          source: wiki,
        });
  } else if (s.name.startsWith("Special")) {
    a.sharedEffects = s.playerEffects.filter((t) => /Luôn/.test(t));
    for (const phaseId of phaseIds[s.phase])
      a.phaseEffects.push({
        phaseId,
        attackId: a.id,
        playerEffects: s.playerEffects.filter((t) => !/Luôn/.test(t)),
        bossEffects: s.bossEffects,
        condition: s.activation,
        duration: null,
        source: wiki,
      });
  } else {
    a.sharedEffects = s.playerEffects;
    a.sharedBossEffects = s.bossEffects;
    a.trigger = s.activation;
    a.phaseIds = s.phase ? phaseIds[s.phase] : null;
  }
}
const taunt =
  "Docs: hai người Taunt chính (LR + SC/IT hoặc PCM/AP; đội Speedrun là LR + LoO). Dùng Scroll of Enrage so le khi Focus còn khoảng 1/8. LoO có thể dự bị ở đội hình phù hợp. Thống nhất người mở đầu; không giao DPS chính Taunt thường quy.";
const objectives = [
  "Đẩy xuống 70% HP trước Do Dusk (khoảng 84 giây).",
  "Giữ Focus liên tục, hạn chế Grown/Harvested; đẩy xuống 20% HP.",
  "Sống sót khoảng 50 giây từ lúc Aria kích hoạt.",
  "Dồn sát thương sau B Major/C Major; kết thúc trước Curtain Call.",
];
const notes = [
  [
    "Melancholic Melodies giảm Hit Chance 50%.",
    "Elegy of Madness 8 giây; bị áp lại gây Captive Audience, Stun 4 giây.",
    "Re → Mi → Fa → So → La → Ti, mỗi aura +100% Crit Damage; lần tiếp theo là Do Dusk +50.000%.",
  ],
  [
    "Realm of the Arcana: −6% Haste/stack, tối đa 22.",
    "Seed Planted 8 giây xóa Realm of the Arcana; áp lại khi Seed còn sẽ thành Grown, rồi Harvested gây tử vong.",
    "Grown: Crit Chance +1000 (Wiki không ghi đơn vị), Crit Damage −1000%.",
  ],
  [
    "Aria hồi Darkon lên 90% Max HP; không quay lại Overture/Recitative, không bị Decay chặn.",
    "Requiem for the Wicked: −80% hồi máu nhận vào. The Last Symphony: DoT 8 giây.",
    "Dirge of Astravia: +25% Mana Cost/stack trong 12 giây, tối đa 22 stack.",
  ],
  [
    "Aria và các debuff từ Auto Attack/Special 1/Special 2 vẫn hoạt động.",
    "B Major/C Major đã hết sau 50 giây; Aria đưa Crit Damage/sát thương gây ra về 0 và tăng sát thương nhận vào 200%.",
    "The Last Symphony vẫn gây DoT; giữ Taunt để DPS tránh tích Mana Cost.",
  ],
];
const vhl = [
  ["4", "5", "3", "2", "4", "3", "2", "4", "3", "2"],
  ["5", "3", "2"],
  ["5", "3", "2"],
  ["4", "5", "3", "2", "4", "3", "2", "4", "3", "2"],
];
const vhlNotes = [
  "Dùng 3 trước 2, 4 trước 5. HP dưới 1.500: ngừng 2/4, dùng 3 hồi máu.",
  "Chỉ dùng 4 khi HP trên 3.000.",
  "HP dưới 2.000: dừng 2.",
  "Docs cho dùng lại combo phase 1; Site cho 5 → 3 → 2, chỉ dùng 4 khi HP trên 3.000. Hai phương án khác nguồn, không trộn.",
];
const phaseStrategies = {};
const phases = ["overture", "recitative", "madness", "rush"].map((id, i) => {
  const rotations = [
    {
      className: "Void Highlord",
      team: "Speedrun: VHL/AI · LC · LR · LoO",
      sequence: vhl[i],
      notes: vhlNotes[i],
      source: doc,
    },
  ];
  if (i === 1) {
    rotations.push(
      {
        className: "Lord of Order",
        sequence: [],
        notes:
          "Dừng 5 khi Boss còn 10m HP; dùng lại ở khoảng 4,6–4,5m để chặn đòn chuyển Aria (hiệu lực 4 giây). Nếu Grown khiến đòn đánh hồi máu Boss, dừng 3 đến khi hết.",
        source: doc,
      },
      {
        className: "Chaos Avenger",
        sequence: ["4", "2", "5"],
        notes:
          "Dùng 3 khi skill CD chậm; quan sát Focus gần còn 1/2 trước khi dùng.",
        source: doc,
      },
      {
        className: "LightCaster / ArchPaladin / PCM",
        sequence: [],
        notes:
          "Khi Taunt lỗi và đòn đánh hồi máu Darkon: LC/AP dừng 3; PCM Team 2 dừng 3/4, PCM Team 3 dừng 3 theo hướng dẫn riêng của đội.",
        source: doc,
      },
    );
  }
  if (i === 2)
    rotations.push({
      className: "LightCaster / Lord of Order",
      sequence: [],
      notes:
        "LC canh 4 khi cả đội dưới 50% HP hoặc một người dưới 30%; phối hợp Heal 3 của LoO. Không dùng Vainglory theo cảnh báo chung của Docs.",
      source: doc,
    });
  const add = (className, sequence, notes, teams = [1, 2, 3, 4]) =>
    rotations.push({
      className,
      sequence,
      notes,
      teamIds: teams.map((n) => "recovery-team-" + n),
      source: doc,
    });
  rotations[0].teamIds = ["recovery-team-4"];
  add(
    "Legion Revenant",
    ["4", "2", "3", "5"],
    i === 0
      ? "Pre-buff 4; mở 4 → 2 → 3 → 5, sau đó spam và dùng 4 ngay khi hồi xong."
      : i === 1
        ? "Duy trì 4; phối hợp SoE để ngăn Grown/Harvested."
        : i === 2
          ? "Duy trì 4, ưu tiên sống và giữ nhịp SoE cùng đồng đội."
          : "Duy trì 4, tiếp tục SoE để bảo vệ DPS khỏi Dirge of Astravia.",
  );
  add(
    "StoneCrusher / Infinity Titan",
    ["3", "4", "2", "5"],
    i === 0
      ? "Pre-buff 3 và 4; dùng 3 → 4 → 2 → 5; Taunt cùng LR."
      : i === 1
        ? "Duy trì combo và SoE cùng LR; không để Focus trống giữa các lần Special 2."
        : i === 2
          ? "Duy trì hỗ trợ/hồi máu và SoE; sinh tồn qua B Major/C Major."
          : "Tiếp tục hỗ trợ và SoE khi đội dồn sát thương.",
    [1, 2],
  );
  add(
    "LightCaster",
    ["2", "3", "5"],
    i === 1
      ? "Pre-buff 4. Canh 4 khi team dưới 50% HP hoặc một người dưới 30%. Nếu Grown làm đòn đánh hồi máu Boss, dừng 3 đến khi hết."
      : i === 2
        ? "Canh Heal 4 khi team dưới 50% HP hoặc một người dưới 30%; phối hợp LoO, tránh Vainglory theo cảnh báo chung Docs."
        : "Pre-buff 4; dùng chính 2/3/5, dùng lại 4 khi cần Heal. Phối hợp Heal với LoO.",
    [1, 4],
  );
  add(
    "Lord of Order",
    [],
    i === 1
      ? "Pre-buff 2/3/4, duy trì buff. Dừng 5 khi Boss còn 10m; dùng lại khoảng 4,6–4,5m (hiệu lực 4s) để chặn đòn Aria. Dừng 3 nếu Grown khiến đòn đánh hồi máu Boss."
      : i === 2
        ? "Duy trì buff và canh Heal 3 cùng LC/PCM/AP. Dự bị SoE theo phân công; Team 4 Taunt chính cùng LR."
        : "Pre-buff 2/3/4, duy trì các skill và canh Heal 3 theo HP đội. Dự bị SoE theo phân công; Team 4 Taunt chính cùng LR.",
  );
  add(
    "Chaos Avenger",
    ["4", "2", "5"],
    i === 1
      ? "Dùng 3 khi thấy cooldown chậm; quan sát Focus gần còn 1/2 trước khi dùng."
      : "Dùng 4 → 2 → 5; chỉ dùng 3 khi hiệu ứng hết, quan sát Class Actives/Auras UI.",
    [3],
  );
  add(
    "Paladin Chronomancer",
    ["2", "4", "2", "3"],
    i === 1
      ? "Spam 2 đến khi HP bình thường rồi 5; trước khi 4 hồi xong dùng 5 và lặp. Nếu Grown hồi máu Boss: Team 2 dừng 3/4, Team 3 dừng 3."
      : "Pre-buff 3; 2 → 4 → 2 → 3, spam 2 đến khi HP bình thường rồi 5. Trước khi 4 hồi xong dùng 5 rồi lặp; 3 chỉ khi cần buff máu.",
    [2, 3],
  );
  add(
    "ArchPaladin",
    ["4", "2", "2", "5"],
    i === 1
      ? "Thay PCM ở Team 3. Canh 3 để Heal; nếu Grown hồi máu Boss, dừng 3 đến khi hết."
      : "Thay PCM ở Team 3: pre-buff 3; 4 → 2 → 2 → 5 hoặc 4 → 2 → 5. Canh 3 để Heal; nếu chết, vào lại và dùng 4 trước SoE.",
    [3],
  );
  add(
    "Arcana Invoker",
    ["2", "4"],
    i === 0
      ? "Thay VHL ở Team 4: mở 2 → 4; spam 3/4/5 đến Judgement thì 4 → 2. Tiếp tục 3/4/5 đến The World gần hết thì 2 nuke và lặp (bỏ 2 mở đầu)."
      : "Thay VHL ở Team 4: giữ vòng Judgement / The World như Docs; chưa có combo riêng từng phase cho AI. Theo mục tiêu và Taunt của phase hiện tại.",
    [4],
  );
  // Remove the broad cross-Class summaries above in favour of individually scoped team instructions.
  const scoped = rotations.filter((r, index) => index === 0 || r.teamIds);
  phaseStrategies[id] = {
    objective: objectives[i],
    tauntStrategy:
      taunt +
      (i === 0
        ? " Mục tiêu: tránh Stun cả đội."
        : i === 1
          ? " Mục tiêu: không để Seed → Grown → Harvested."
          : i === 2
            ? " Giữ người Taunt sống; thay dự bị ngay khi người chính chết."
            : " Tiếp tục Taunt để bảo vệ Mana Cost của DPS."),
    recommendedRotations: scoped,
    source: doc,
  };
  return {
    id,
    name: ["Overture", "Recitative", "Madness", "Rush"][i],
    phaseOrder: i + 1,
    officialState: i < 2 ? ["Overture", "Recitative"][i] : "Aria",
    trigger: [
      "Bắt đầu trận; HP trên 70%, trước chuyển phase.",
      "HP đạt 70%; Recitative kích hoạt.",
      "HP đạt 20%; Aria kích hoạt và hồi lên 90% HP tối đa.",
      "Khoảng 50 giây sau Aria, khi B Major và C Major hết hiệu lực.",
    ][i],
    exitCondition: [
      "Overture → Recitative: HP đạt 70%.",
      "Recitative → Madness: HP đạt 20%, Aria kích hoạt.",
      "Madness → Rush: B Major và C Major hết sau 50 giây từ Aria.",
      "Rush → End: hạ Boss trước khi Curtain Call kích hoạt.",
    ][i],
    activeSkillIds: [
      "auto-attack",
      "special-1",
      "special-2",
      ...(i < 2 ? [id] : i === 2 ? ["aria"] : []),
      "cycle-end",
      "end-world",
      "curtain-call",
    ],
    phaseModifiers: [],
    combatNotes: notes[i],
    ...phaseStrategies[id],
    source: [wiki, doc, site],
  };
});
function modifier(phase, name, effect, condition, duration = null) {
  phase.phaseModifiers.push({
    id: name.toLowerCase().replaceAll(" ", "-"),
    name,
    label: name,
    effect,
    condition,
    duration,
    source: wiki,
    monsterId: "boss",
  });
}
modifier(
  phases[0],
  "Do Dawn",
  "Bộ tăng Crit Damage theo Re → Mi → Fa → So → La → Ti; Do Dusk ở lần Special 1 kế tiếp.",
  "Từ Overture đến Recitative.",
);
modifier(
  phases[1],
  "Recitative",
  "Crit Damage +500%; xóa aura Overture.",
  "Tại 70% HP.",
);
modifier(
  phases[1],
  "Realm of the Arcana",
  "Người chơi: Haste −6%/stack, tối đa 22; được Seed Planted xóa.",
  "Mỗi Auto Attack trong Recitative.",
);
modifier(
  phases[1],
  "Child of the Empress",
  "Boss: Crit Damage +50%/stack, tối đa 22.",
  "Mỗi Special 1 trong Recitative.",
);
for (const [name, effect, duration] of [
  ["A Major", "Boss: Dodge +5000%.", 10],
  ["B Minor", "Boss: sát thương nhận vào −200%.", 20],
  ["C Minor", "Boss: Crit Damage +300%.", 30],
  [
    "B Major",
    "Boss: sát thương vật lý, phép và toàn bộ sát thương nhận vào −200%.",
    50,
  ],
  ["C Major", "Boss: Crit Damage và sát thương gây ra +1000%.", 50],
])
  modifier(
    phases[2],
    name,
    effect,
    `Tồn tại ${duration} giây tính từ Aria; có thể đã hết trong Madness.`,
    duration,
  );
modifier(
  phases[2],
  "Aria",
  "Bộ hiệu ứng Aria; các buff có thời hạn riêng. B Major/C Major hết mới mở Rush.",
  "Sau Aria, tiếp tục qua Rush.",
);
modifier(
  phases[3],
  "Aria",
  "Sau C Major: Crit Damage và sát thương gây ra về 0. Sau B Major: sát thương nhận vào +200%. Requiem for the Wicked, The Last Symphony và Dirge of Astravia vẫn áp dụng.",
  "Sau khi B Major/C Major hết; các buff 10/20/30 giây đã hết.",
);
const timeline = [
  {
    id: "cycle-end",
    triggerType: "interval",
    triggerValue: 30,
    description:
      "The Cycle's End: mỗi 30 giây, +10% sát thương vật lý/phép nhận vào mỗi stack; tối đa 10. Không suy thời điểm enrage từ số stack.",
    source: wiki,
  },
  {
    id: "end-world",
    triggerType: "elapsed",
    triggerValue: 270,
    description:
      "End of the World: sau 270 giây tính từ đầu trận, niệm 3 giây.",
    source: wiki,
  },
  {
    id: "curtain-call",
    triggerType: "elapsed",
    triggerValue: 273,
    description:
      "Curtain Call: sau khi niệm xong, 100.000.337 True Damage lên 4 người, bỏ qua Focus và áp DoT gây tử vong.",
    source: wiki,
  },
];
fs.writeFileSync(
  "src/content/ultra/darkon-phases.json",
  JSON.stringify(
    {
      bossId: "darkon-the-conductor",
      attacks,
      phases,
      phaseStrategies,
      timeline,
      globalPassives: reviewed.passives.map((p) => ({
        ...p,
        monsterId: "boss",
        source: wiki,
      })),
      conflicts: [
        ...reviewed.conflicts,
        {
          field: "Phase labels",
          docs: "Overture / Recitative / Madness / Rush",
          site: "Rush / Seeding / Madness / Weakening",
          resolution:
            "Use requested Docs tactical labels; preserve official states Overture/Recitative/Aria.",
        },
        {
          field: "Focus assignment",
          docs: "Two principal taunters; optional LoO reserve; Speedrun LR + LoO",
          site: "Three Supports; LoO first and repeated on cooldown",
          resolution:
            "Show Docs default and separate Site alternative; never silently mix.",
        },
        {
          field: "VHL Rush rotation",
          docs: "Same as phase 1",
          site: "5-3-2; use 4 above 3000 HP",
          resolution: "Docs sequence with explicit Site alternative.",
        },
        {
          field: "Vainglory",
          docs: "General ban yet AI enhancement line lists Vainglory",
          site: "VHL line lists Vainglory despite Aria healing penalty",
          resolution:
            "Display general Docs caution and flag class loadout conflict; do not silently endorse contradictory loadout.",
        },
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Darkon: 4 tactical phases, 9 canonical attacks; shared damage and independent Aria durations.",
);
