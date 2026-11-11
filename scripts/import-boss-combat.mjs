import fs from "node:fs";
const bosses = JSON.parse(
  fs.readFileSync("src/content/ultra/bosses.json", "utf8"),
);
const result = {};
const quantitative = (t) =>
  /\d|miễn nhiễm|không thể né|không thể bạo kích|luôn bạo kích|bỏ qua.*(?:Focus|Taunt)|không có Shield/i.test(
    t,
  );
const group = (t) =>
  /HP|Level|lvl|Room limit/i.test(t)
    ? "Cốt lõi"
    : /Shield|miễn nhiễm|Dodge|DoT In|All In/i.test(t)
      ? "Phòng thủ & quy tắc"
      : "Tấn công & hiệu ứng";
function label(t) {
  const rules = [
    [/Total HP/, "HP"],
    [/Auto.Attack/, "Auto Attack"],
    [/Shield/, "Boss Shield"],
    [/miễn nhiễm/i, "Miễn nhiễm"],
    [/Melting/, "Melting"],
    [/Absorbing/, "Absorbing"],
    [/Drawing Power/, "Drawing Power"],
    [/Elusion/, "Elusion"],
    [/Imminent Doom/, "Imminent Doom"],
    [/hồi sinh/i, "Hồi sinh"],
    [/Charge|charge/, "Niệm & chu kỳ"],
    [/Focus|Taunt/, "Quy tắc mục tiêu"],
  ];
  return rules.find(([r]) => r.test(t))?.[1] || "Thông số / hiệu ứng";
}
for (const b of bosses) {
  const stats = b.stats.map((s) => ({
    ...s,
    group: "Cốt lõi",
    subject: b.name,
  }));
  const entries = [];
  let raw = [];
  if (b.sourceContentUrl) {
    const body = JSON.parse(fs.readFileSync("public" + b.sourceContentUrl));
    raw = body.mechanics || [];
  }
  for (const m of b.mechanics) {
    const numeric = quantitative(m.description);
    if (numeric)
      stats.push({
        key: "legacy-" + m.id,
        label: m.name,
        value: m.description,
        group: group(m.description),
        subject: b.name,
        explanation: "Thông tin từ hồ sơ hiện có.",
        source: m.source,
      });
    entries.push({
      id: m.id,
      name: m.name,
      type: "Cơ chế chiến đấu",
      trigger: m.phase || "Theo diễn biến trận đấu",
      effect: numeric
        ? "Theo dõi hiệu ứng và điều kiện trong bảng Stats liên quan."
        : m.description,
      response: m.counterStrategy,
      severity: m.severity,
      notes: [],
      relatedStats: numeric ? ["legacy-" + m.id] : [],
      source: m.source,
    });
  }
  let scope = b.name,
    index = 0;
  function blocks(items) {
    for (const block of items || []) {
      if (block.type === "table") {
        continue;
      }
      for (let t of block.runs
        .map((r) => r.text)
        .join("")
        .split("\n")
        .map((s) => s.replace(/^[◆◇→•]\s*/, "").trim())
        .filter(Boolean)) {
        if (
          /^(Ultra Fire Orb|Ultra Avatar Tyndarius|King Drago|Bowmaster Algie và Executioner Dene)$/.test(
            t,
          )
        ) {
          scope = t;
          continue;
        }
        if (/^(Cơ chế:?)$/.test(t)) continue;
        const id = "source-" + index++;
        if (quantitative(t)) {
          const tokens = t.match(
            /(?:[−-]?\d+(?:[.,]\d+)*\s*(?:%|k|s|giây|phút|HP|DMG)?|vô hạn)/g,
          );
          stats.push({
            key: id,
            label: label(t),
            subject: scope,
            value: tokens?.join(" · ") || t,
            group: group(t),
            explanation: t,
            source: "community-guide",
          });
        } else {
          // Preserve every non-numeric source instruction, in compact labelled entries.
          entries.push({
            id,
            name: /counter/i.test(t)
              ? "Counter Attack"
              : /Focus|Taunt/.test(t)
                ? "Phân công Taunt"
                : /Zone/.test(t)
                  ? "Di chuyển Zone"
                  : /Heal|hồi máu/.test(t)
                    ? "Nhịp hồi phục"
                    : /Orb|Drone/.test(t)
                      ? "Xử lý mục tiêu phụ"
                      : "Ghi chú giao chiến",
            type: "Chiến thuật cộng đồng",
            trigger: scope,
            effect: t,
            response: "Đối chiếu phân công của đội hình đang sử dụng.",
            severity: /chết|diệt|Death|wipe/i.test(t) ? "danger" : "normal",
            notes: [],
            relatedStats: [],
            source: "community-guide",
          });
        }
      }
    }
  }
  for (const s of raw) blocks(s.blocks);
  result[b.slug] = { mechanics: entries, stats, reference: raw };
}
// Named moves remain visible even when all their numerical attributes move to Stats.
const moves = {
  "ultra-speaker": [
    [
      "Power Split",
      "Buff",
      "Khi bắt đầu niệm Power Split",
      "Boss tăng sức mạnh, khả năng né, giảm sát thương nhận và hồi HP.",
      "Dùng Class có Decay để ngăn hồi phục theo phân công.",
    ],
    [
      "Equalize",
      "Phase Mechanic",
      "Ngay sau khi Power Split kết thúc",
      "Gây sát thương chuẩn và cấp Sanctity để xóa Corruption cùng Somber; nhiều người vào Zone làm tăng nguy hiểm.",
      "Chỉ người đến lượt vào Zone; những người khác rời khỏi Zone.",
    ],
    [
      "Death DoT",
      "Team Wipe Risk",
      "Khi mang tổ hợp Magia Burn, Stasis Field và Sanctity",
      "Tổ hợp hiệu ứng trong Glowing Zone có thể gây DoT chết chóc.",
      "Dash ra khỏi vùng nguy hiểm và giữ đúng lịch Taunt/Zone.",
    ],
  ],
  "ultra-drago": [
    [
      "Triple Shot / Execution",
      "Active Skill",
      "Trong lúc hai hộ vệ còn sống",
      "Hai hộ vệ dùng đòn đặc biệt bỏ qua Focus; Triple Shot còn gây DoT.",
      "Giữ phân công hạ hộ vệ; không dựa vào Taunt để chặn đòn bỏ qua Focus.",
    ],
    [
      "Hộ vệ gục ngã",
      "Phase Mechanic",
      "Khi một hộ vệ chết",
      "Hộ vệ còn lại hồi đầy HP và được tăng sức mạnh.",
      "Lập tức Focus/Taunt hộ vệ còn lại; guide ưu tiên Algie trước Dene.",
    ],
  ],
};
for (const [slug, rows] of Object.entries(moves))
  for (const [name, type, trigger, effect, response] of rows) {
    result[slug].mechanics.push({
      id: "move-" + result[slug].mechanics.length,
      name,
      type,
      trigger,
      effect,
      response,
      severity: "danger",
      notes: [],
      relatedStats: [],
      source: "community-guide",
    });
  }
const rewrites = {
  "ultra-warden": {
    "Celestial Shockwaves": [
      "Theo mốc HP đã mất của boss",
      "Làm HP mục tiêu rơi xuống mức nguy hiểm; mốc kích hoạt và HP còn lại nằm trong Stats.",
    ],
    Berserk: [
      "Khi HP boss xuống ngưỡng",
      "Boss tăng Hit, Crit, Dodge và tốc độ đánh.",
    ],
    "Petrifying Scream": [
      "Có thể thay Auto Attack",
      "Gây Stun lên người chơi; thời hạn nằm trong Stats.",
    ],
    "Focus và Boss Shield": [
      "Khi xử lý Shockwaves",
      "Shockwaves có thể chịu Focus; quy tắc miễn nhiễm nằm trong Stats.",
    ],
  },
  "ultra-drago": {
    "Judgement Day": [
      "Sau giai đoạn đếm ngược từ lúc tham chiến",
      "Boss niệm phán quyết rồi dùng Judged lên cả đội; timeline nằm trong Stats.",
    ],
  },
};
for (const [slug, byName] of Object.entries(rewrites))
  for (const m of result[slug].mechanics)
    if (byName[m.name]) [m.trigger, m.effect] = byName[m.name];
// Tyndarius: editorial structure grounded exclusively in the local community guide.
const t = result["ultra-tyndarius"];
const mechanic = (
  id,
  name,
  type,
  trigger,
  effect,
  response,
  severity = "danger",
  notes = [],
) => ({
  id,
  name,
  type,
  trigger,
  effect,
  response,
  severity,
  notes,
  source: "community-guide",
  relatedStats: [],
});
t.mechanics = [
  mechanic(
    "melting",
    "Melting",
    "Debuff",
    "Khi Ultra Fire Orb còn sống; theo chu kỳ",
    "Orb gây sát thương phép; người chơi nhận thêm sát thương và giảm khả năng né.",
    "Ưu tiên hạ Orb sớm để không kéo dài chuỗi Melting.",
    "danger",
    ["Debuff cộng dồn; trị số và thời hạn nằm trong Stats."],
  ),
  mechanic(
    "absorbing",
    "Absorbing",
    "Buff",
    "Orb tự dùng theo chu kỳ",
    "Orb tăng sát thương gây ra và giảm sát thương nhận vào. Số tầng thêm phụ thuộc người tham chiến.",
    "Giữ ưu tiên hạ Orb; phối hợp sát thương thay vì để buff tích lũy.",
  ),
  mechanic(
    "orb-charge",
    "Charge",
    "Active Skill",
    "Sau giai đoạn niệm của Orb",
    "Gây sát thương chuẩn, khiến người chơi và chính Orb nhận thêm sát thương.",
    "Theo dõi niệm và giữ khả năng sống sót trong nhịp Charge.",
  ),
  mechanic(
    "orb-pressure",
    "Orb Pressure",
    "Summon",
    "Khi Orb còn sống hoặc hồi sinh",
    "Orb quay lại sau khi bị hạ; vẫn có thể đánh Tyndarius khi Orb đang sống.",
    "Giữ phân công mục tiêu và Taunt cho Tyndarius cùng các Orb.",
    "danger",
  ),
  mechanic(
    "shield",
    "Boss Shield",
    "Defensive",
    "Khi một đòn vượt ngưỡng sát thương",
    "Giảm phần sát thương vượt ngưỡng. Orb và Tyndarius dùng ngưỡng cùng hệ số khác nhau.",
    "Đối chiếu đúng mục tiêu trong bảng Stats.",
    "normal",
  ),
  mechanic(
    "drawing-power",
    "Drawing Power",
    "Buff",
    "Trong chuỗi buff của Tyndarius",
    "Boss tăng sát thương gây ra và tung sát thương phép khi kích hoạt.",
    "Giữ buff phòng thủ và phối hợp Heal để sống qua nhịp đánh.",
  ),
  mechanic(
    "elusion",
    "Elusion",
    "Buff",
    "Tiếp theo trong chuỗi buff",
    "Boss tăng khả năng né và độ chính xác; kèm sát thương phép.",
    "Theo dõi buff và giữ phân công Focus/Taunt đã thống nhất.",
  ),
  mechanic(
    "imminent-doom",
    "Imminent Doom",
    "Buff",
    "Tiếp theo trong chuỗi buff",
    "Boss tăng khả năng bạo kích; kèm sát thương phép.",
    "Kết hợp Heal và Class có Focus/Taunt theo đội hình.",
  ),
  mechanic(
    "failure",
    "Áp lực kéo dài",
    "Team Wipe Risk",
    "Khi Orb tồn tại quá lâu",
    "Melting và các tầng hiệu ứng khiến đội khó duy trì khả năng sống sót.",
    "Không bỏ mặc Orb; thống nhất mục tiêu trước khi vào trận.",
  ),
];
t.stats = t.stats.filter((s) => s.key === "level");
function stat(key, label, value, unit, subject, category, explanation) {
  t.stats.push({
    key,
    label,
    value,
    unit,
    subject,
    group: category,
    explanation,
    source: "community-guide",
  });
}
for (const [key, subject, hp, threshold, coefficient] of [
  ["orb", "Ultra Fire Orb", 700000, 150000, 0.5],
  ["tynd", "Ultra Avatar Tyndarius", 6000000, 200000, 0.85],
]) {
  stat(
    key + "-hp",
    "HP",
    hp,
    "HP",
    subject,
    "Cốt lõi",
    "HP riêng của mục tiêu, không cộng mục tiêu khác.",
  );
  stat(
    key + "-shield",
    "Ngưỡng Boss Shield",
    threshold,
    "damage",
    subject,
    "Phòng thủ & quy tắc",
    "Giảm phần sát thương của đòn vượt ngưỡng.",
  );
  stat(
    key + "-coefficient",
    "Hệ số shield",
    coefficient,
    "",
    subject,
    "Phòng thủ & quy tắc",
    "Hệ số theo guide cộng đồng.",
  );
  stat(
    key + "-stun",
    "Miễn nhiễm",
    "Stun",
    "",
    subject,
    "Phòng thủ & quy tắc",
    "Không thể gây Stun lên mục tiêu.",
  );
  stat(
    key + "-auto-cycle",
    "Chu kỳ Auto Attack",
    2.25,
    "giây",
    subject,
    "Tấn công & hiệu ứng",
    "Khoảng cách đòn Auto Attack theo guide.",
  );
}
const subject = "Ultra Fire Orb";
for (const row of [
  ["orb-auto", "Auto Attack", "605–741", "Phys DMG", "Sát thương vật lý."],
  [
    "orb-hit",
    "Hit / Crit",
    "Không thể né · Không bạo kích",
    "",
    "Áp dụng các đòn đánh Orb theo guide.",
  ],
  ["melting-cycle", "Melting — chu kỳ", 5, "giây", "Khi Orb tồn tại."],
  [
    "melting-dmg",
    "Melting — sát thương",
    "605–741",
    "Magi DMG",
    "Sát thương phép.",
  ],
  [
    "melting-mod",
    "Melting — debuff",
    "+25% All In · −25% Dodge",
    "",
    "Áp dụng lên người chơi.",
  ],
  ["melting-duration", "Melting — thời hạn", 25, "giây", "Stack vô hạn."],
  [
    "absorbing-cycle",
    "Absorbing — chu kỳ",
    10,
    "giây",
    "Orb dùng lên bản thân.",
  ],
  [
    "absorbing-mod",
    "Absorbing — modifier",
    "+50% All Out · −25% All In",
    "",
    "Áp dụng lên Orb; số tầng thêm ứng với số người trong trận.",
  ],
  ["absorbing-duration", "Absorbing — thời hạn", 30, "giây", "Stack vô hạn."],
  ["charge-cycle", "Charge — chu kỳ", 20, "giây", "Orb sử dụng Charge."],
  ["charge-cast", "Charge — niệm", 3, "giây", "Trước sát thương chuẩn."],
  ["charge-dmg", "Charge — sát thương", "363–444", "True DMG", "Không thể né."],
  [
    "charge-mod",
    "Charge — modifier",
    "Player +50% All In · Orb +200% All In",
    "",
    "Guide nêu thời hạn hiệu ứng trên bản thân Orb.",
  ],
  [
    "charge-duration",
    "Charge — thời hạn",
    10,
    "giây",
    "Thời hạn +200% All In trên Orb.",
  ],
  ["orb-respawn", "Hồi sinh", 30, "giây", "Kể từ khi Orb chết."],
])
  stat(...row.slice(0, 4), subject, "Tấn công & hiệu ứng", row[4]);
for (const row of [
  ["tynd-auto", "Auto Attack", "5.1k–6.2k", "Phys DMG", "Sát thương vật lý."],
  [
    "tynd-cycle",
    "Chu kỳ chuỗi buff",
    45,
    "giây",
    "Drawing Power → Elusion → Imminent Doom, kích hoạt lần lượt.",
  ],
  [
    "tynd-magic",
    "Sát thương mỗi buff",
    "5.1k–9.4k",
    "Magi DMG",
    "Mỗi lần kích hoạt hiệu ứng trong chuỗi.",
  ],
  [
    "drawing-mod",
    "Drawing Power",
    "+100% All Out",
    "15 giây",
    "Buff bản thân.",
  ],
  [
    "elusion-mod",
    "Elusion",
    "+50% Dodge · +200% Hit Chance",
    "20 giây",
    "Buff bản thân.",
  ],
  [
    "doom-mod",
    "Imminent Doom",
    "+120% Crit Chance",
    "15 giây",
    "Buff bản thân.",
  ],
])
  stat(
    ...row.slice(0, 4),
    "Ultra Avatar Tyndarius",
    "Tấn công & hiệu ứng",
    row[4],
  );
fs.writeFileSync(
  "src/content/ultra/combat.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  "Structured combat codex: " + Object.keys(result).length + " bosses",
);
