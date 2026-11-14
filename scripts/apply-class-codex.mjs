const comboSlots = JSON.parse(fs.readFileSync("content-sources/class-combo-slot-evidence.json", "utf8"));
import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const translations = read(
  "src/content/classes/current-skill-translations.json",
);
const reconciliation = read(
  "src/content/classes/current-skill-reconciliation.json",
);
const registry = read("src/content/classes/skill-registry.json"),
  catalog = read("src/content/classes/catalog.json");
const approved = read("src/data/aqw-assets.json").filter(
  (a) =>
    a.entityType === "class" &&
    a.verificationStatus === "verified" &&
    a.usageStatus === "approved" &&
    a.imagePath &&
    fs.existsSync("public" + a.imagePath),
);
const portraits = approved.map((a) => ({
  id: a.assetId,
  name: a.entityName,
  imagePath: a.imagePath,
  width: a.width,
  height: a.height,
  sourceUrl: a.sourcePage,
  verificationStatus: "verified",
}));
if (fs.existsSync("src/content/classes/portrait-registry.json"))
  for (const a of read("src/content/classes/portrait-registry.json"))
    if (
      !portraits.some((p) => p.id === a.id) &&
      fs.existsSync("public" + a.imagePath)
    )
      portraits.push({
        id: a.id,
        name: a.name,
        imagePath: a.imagePath,
        width: a.width,
        height: a.height,
        sourceUrl: a.sourceUrl,
        verificationStatus: a.verificationStatus,
      });
fs.writeFileSync(
  "src/content/classes/portraits.json",
  JSON.stringify(portraits, null, 2) + "\n",
);
function flatten(v) {
  if (!v || typeof v !== "object") return [];
  if (Array.isArray(v)) return v.flatMap(flatten);
  return [
    ...(typeof v.text === "string"
      ? v.text
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean)
      : []),
    ...Object.values(v)
      .filter((x) => typeof x === "object")
      .flatMap(flatten),
  ];
}
const conflicts = [];
const roleEvidence = [];
for (const c of catalog) {
  c.codexVersion = "12.1";
  const b = read("public" + c.bodyUrl);
  c.skillCount = b.skills.length;
  const source = registry.classes[c.id];
  if (source?.sourceUrl && !c.sources.some((s) => s.url === source.sourceUrl))
    c.sources.push({
      id: "wiki-codex",
      title: "Class skills — AQWorlds Wiki",
      url: source.sourceUrl,
      type: "wiki",
      verification: "checked",
      verifiedAt: "2026-11-09",
    });
  for (const r of registry.skills.filter(
    (r) =>
      r.classId === c.id &&
      r.supplemental &&
      (r.verificationStatus === "verified" || r.dataVerificationStatus === "verified"),
  ))
    if (!b.skills.some((s) => s.id === r.skillId))
      b.skills.push({
        id: r.skillId,
        name: r.officialName,
        rank: r.rankRequirement,
        passive: r.passive,
        effectType: r.skillType,
        description: r.passive
          ? `Nội tại ở Rank ${r.rankRequirement}. Xem phần đối chiếu Wiki để đọc tác dụng hiện tại.`
          : `Kỹ năng hiện tại trên Wiki ở Rank ${r.rankRequirement}; bản dịch tác dụng đang cập nhật. Xem phần đối chiếu để đọc cơ chế gốc.`,
        usageNotes: [],
        source: r.sourceUrl,
        supplemental: true,
      });
  c.skillCount = b.skills.length;
  for (const s of b.skills) {
    s.classId = c.id;
    s.quarantined =
      c.id === "eternal-immortal-empyrean-chronomancer-ecm-icm" &&
      s.id.includes("-variant-");
    const r = registry.skills.find(
      (r) => r.classId === c.id && r.skillId === s.id,
    );
    s.verificationStatus = r?.verificationStatus || "manual_review";
    s.quarantined = !!r?.quarantined;
    if (s.verificationStatus !== "verified") {
      delete s.iconAsset;
      delete s.iconAssetId;
    }
    if(r?.dataVerificationStatus === "verified") {
      s.rankRequirement=r.rankRequirement;s.name=r.officialName;s.officialName=r.officialName;
      for(const key of ["manaCost","cooldown","passive","target","officialDescription","wikiNotes","manaCostDisplay","cooldownDisplay"])s[key]=r[key];
      s.effectType=r.skillType;s.sourceUrl=r.sourceUrl;
    }
    if (r?.verificationStatus !== "verified") continue;
    const a = registry.assets.find((a) => a.id === r.iconAssetId);
    if (!a || !fs.existsSync("public" + a.imagePath))
      throw Error(`Missing verified image ${c.id}/${s.id}`);
    s.officialName = r.officialName;
    s.name = r.officialName;
    s.iconAssetId = a.id;
    s.iconAsset = {
      id: a.id,
      classId: c.id,
      skillId: s.id,
      imagePath: a.imagePath,
      width: a.width,
      height: a.height,
      sourceUrl: r.sourceUrl,
      verificationStatus: "verified",
      usageStatus: a.usageStatus,
    };
    s.rankRequirement = r.rankRequirement;
    if (
      r.supplemental &&
      !r.passive &&
      translations[r.officialName] &&
      reconciliation[c.id]?.currentActiveNames.includes(r.officialName)
    )
      s.description = translations[r.officialName];
    for (const key of ["manaCost", "cooldown"]) {
      if (r[key + "Display"]) {
        s[key + "Display"] = r[key + "Display"];
        if (r[key] == null) delete s[key];
      }
    }
    if (r.supplemental && !r.passive) {
      const lines = flatten(b.notes);
      const normalize = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, "");
      const at = lines.findIndex(
        (t) => normalize(t) === normalize(r.officialName),
      );
      if (at > 0 && /^[1-5]$/.test(lines[at - 1])) {
        s.skillNumber = Number(lines[at - 1]);
        s.slotEvidence = {
          source: "class-doc",
          officialName: r.officialName,
          declaredSlot: s.skillNumber,
        };
      }
    }
    const declaredSlot = comboSlots[c.id]?.slots.find(row => row.skillId === s.id && row.name === r.officialName && row.iconAssetId === r.iconAssetId);
    if (declaredSlot && !s.quarantined && !r.passive) {
      s.skillNumber = declaredSlot.slot;
      s.slotEvidence = { source: comboSlots[c.id].source, sourceHash: comboSlots[c.id].sourceHash, officialName: r.officialName, declaredSlot: declaredSlot.slot };
    }
    s.sourceUrl = r.sourceUrl;
    s.officialDescription = r.officialDescription;
    s.wikiNotes = r.wikiNotes;
    s.target = r.target;
    for (const key of ["manaCost", "cooldown", "passive"]) {
      if (r[key] != null) {
        if (s[key] != null && s[key] !== r[key])
          conflicts.push({
            classId: c.id,
            skillId: s.id,
            field: key,
            community: s[key],
            wiki: r[key],
            source: r.sourceUrl,
          });
        s[key] = r[key];
      }
    }
    if (r.skillType) s.effectType = r.skillType;
    const damage = r.wikiNotes?.filter((t) =>
      /Deals.*damage|weapon damage|spell damage/i.test(t),
    );
    if (damage?.length) s.damage = damage.join(" ");
    if (
      c.id === "void-highlord-vhl-debris-highlord-dhl" &&
      ["Shackle", "Unshackle"].includes(s.name)
    )
      s.usageNotes = [
        ...new Set([
          ...s.usageNotes,
          "Shackled và Unshackled thay thế hiệu ứng của nhau; Shackle và Unshackle vẫn là hai kỹ năng ở slot nguồn ghi nhận. Soul Fend/Soul Breach tồn tại đến hết thời hạn.",
        ]),
      ];
  }
  // Keep curated rotations. Parse only explicit source Combo paragraphs for other profiles.
  if (c.status !== "Hồ sơ biên soạn") {
    const lines = flatten(b.notes),
      start = lines.findIndex((t) => /^Combo\s*:/i.test(t));
    let end = lines.findIndex(
      (t, i) => i > start && /^Mana Regen|^1$|^How to get/i.test(t),
    );
    if (end < 0) end = lines.length;
    const comboLines = start < 0 ? [] : lines.slice(start, end);
    const combos = [];
    for (const line of comboLines) {
      const m = line.match(/[2-5](?:\s*[-–→]\s*[2-5]){1,}/);
      if (!m) continue;
      const seq = m[0].match(/[2-5]/g).map(Number);
      if (seq.some((n) => !b.skills.some((s) => s.skillNumber === n))) continue;
      const label =
        line
          .slice(0, m.index)
          .replace(/^[→*\s]+|[-:\s]+$/g, "")
          .trim() || "Combo theo guide";
      combos.push({
        id: "sourced-" + combos.length,
        title: label.slice(0, 85),
        situation: label,
        sequence: seq,
        explanation: line,
        notes: comboLines.filter((t) => t !== line && !/^Combo\s*:$/i.test(t)),
        source: "class-doc",
      });
    }
    if (combos.length) b.combos = combos;
  }
  for (const combo of b.combos) {
    const unresolved = combo.sequence.some(
      (n) =>
        !b.skills.some(
          (s) => !s.quarantined && !s.passive && s.skillNumber === n,
        ),
    );
    if (unresolved) {
      combo.verificationStatus = "needs_review";
      combo.verificationNote =
        "Chuỗi theo guide cũ có slot chưa đối chiếu được với bộ skill hiện tại; giữ nguyên lời giải thích nguồn, chưa công bố chuỗi icon như rotation hiện hành.";
    }
  }
  // Class-role labels are editorial, tied to explicit current Wiki range/effect evidence.
  if (c.status !== "Hồ sơ biên soạn") c.role = [];
  if (!c.role.length && source?.sourceUrl) {
    const skills = b.skills.filter((s) => s.verificationStatus === "verified"),
      evidence = [];
    const role = [];
    const farming = skills.filter((s) =>
      /\b[3-9]\s+(?:enemy\s+)?targets?\b/i.test(s.target || ""),
    );
    if (farming.length >= 2) {
      role.push("Farming");
      evidence.push(...farming.map((s) => s.name + ": " + s.target));
    }
    const healer = skills.find((s) =>
      /heal(?:s|ing)?[^.]{0,140}(?:ally|allies|friendly targets?|friends?)|(?:ally|allies|friendly targets?|friends?)[^.]{0,140}heal/i.test(
        s.officialDescription || "",
      ),
    );
    if (healer) {
      role.push("Healer");
      evidence.push(healer.name + ": " + healer.officialDescription);
    }
    const support = skills.find((s) =>
      /(?:ally|allies|friendly targets?|friends?)[^.]{0,200}(?:damage|haste|crit|hit chance|resistance)|(?:increas|reduc)[^.]{0,120}(?:ally|allies|friendly targets?|friends?)/i.test(
        s.officialDescription || "",
      ),
    );
    if (support) {
      role.push("Support");
      evidence.push(support.name + ": " + support.officialDescription);
    }
    const tank = skills.find((s) =>
      /taunt|draw(?:s|ing)?[^.]{0,60}(?:focus|attention)|(?:forces?|forcing)[^.]{0,60}(?:attack|target)[^.]{0,30}you/i.test(
        s.officialDescription || "",
      ),
    );
    if (tank) {
      role.push("Tank");
      evidence.push(tank.name + ": " + tank.officialDescription);
    }
    const damaging = skills.filter(
      (s) =>
        !s.passive &&
        !s.quarantined &&
        (/deals?[^.]{0,160}damage|damage[^.]{0,100}(?:foes|enemies|opponent|target)|(?:attack|strike)[^.]{0,80}(?:damage|foe|opponent)/i.test(
          s.officialDescription || "",
        ) ||
          /deals damage/i.test(s.target || "")),
    );
    if (!role.length && damaging.length >= 2) {
      role.push("DPS");
      evidence.push(
        ...damaging
          .slice(0, 2)
          .map((s) => s.name + ": " + (s.target || s.officialDescription)),
      );
    }
    if (role.length) {
      c.role = [...new Set(role)];
      c.roleBasis = (
        "Phân loại biên tập từ range/tác dụng Wiki đã đối chiếu; không phải nhãn vai trò chính thức. " +
        evidence.join(" ")
      ).slice(0, 420);
      c.playstyle = role.includes("Farming")
        ? "Tấn công nhiều mục tiêu"
        : role.includes("Healer")
          ? "Duy trì hồi phục cho đồng đội"
          : role.includes("Support")
            ? "Duy trì buff và hỗ trợ đội"
            : role.includes("DPS")
              ? "Sát thương theo nhịp kỹ năng"
              : "Kiểm soát Focus theo đội hình";
      roleEvidence.push({
        classId: c.id,
        roles: c.role,
        classification:
          "editorial inference from current source effects, not an official ranking",
        sourceUrl: source.sourceUrl,
        evidence,
      });
    }
  }
  if (
    (!b.obtainSteps.length ||
      (b.obtainSteps.length === 1 &&
        b.obtainSteps[0].id === "wiki-acquisition")) &&
    source?.sourceUrl &&
    source.location
  ) {
    const lines = source.location
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    const locationIndex = lines.findIndex((t) => /^Locations?:/i.test(t)),
      priceIndex = lines.findIndex((t) => /^Price:/i.test(t));
    const place =
      locationIndex < 0
        ? undefined
        : lines
            .slice(
              locationIndex,
              priceIndex > locationIndex ? priceIndex : locationIndex + 1,
            )
            .map((t) => t.replace(/^Locations?:\s*/i, ""))
            .filter(Boolean)
            .join(" · ");
    const price = lines.find((t) => /^Price:/i.test(t));
    const mergeIndex = lines.findIndex((t) => /Merge the following/i.test(t));
    const materials =
      mergeIndex >= 0
        ? lines
            .slice(mergeIndex + 1)
            .filter((t) => !/^(Location|Price):/.test(t))
        : [];
    b.obtainSteps = [
      {
        id: "wiki-acquisition",
        stepNumber: 1,
        title: "Chọn shop hoặc phương án nhận Class",
        description:
          "Kiểm tra điều kiện tại nơi nhận. Những địa điểm được liệt kê là phương án thay thế, không phải chuỗi bắt buộc.",
        location: place,
        requirement: price ? [price] : [],
        materials,
        reward: c.name,
        repeatable: false,
        source: source.sourceUrl,
        dependencies: [],
      },
    ];
    c.acquisitionSummary =
      "Shop / quest theo trang Class Wiki; xem điều kiện trong timeline.";
  }

  fs.writeFileSync("public" + c.bodyUrl, JSON.stringify(b) + "\n");
}
fs.writeFileSync(
  "src/content/classes/catalog.json",
  JSON.stringify(catalog, null, 2) + "\n",
);
fs.writeFileSync(
  "artifacts/qa/class-data-conflicts.json",
  JSON.stringify(conflicts, null, 2) + "\n",
);
fs.writeFileSync(
  "artifacts/qa/class-role-evidence.json",
  JSON.stringify(roleEvidence, null, 2) + "\n",
);
console.log(
  `Class Codex 12.1: ${catalog.length} shared UI routes; ${registry.skills.filter((s) => s.verificationStatus === "verified").length} verified icon mappings materialized.`,
);
