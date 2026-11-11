export function parseRangeTarget(raw) {
  const text = (raw || "").replace(/\s+/g, " ").trim();
  const prefix = text.match(
    /^(?:An?|An) (short|medium|long|infinite) (?:range )?(?=attack\b|status skill\b|skill\b)/i,
  );
  const rangeCategory = prefix
    ? { short: "Close", medium: "Medium", long: "Long", infinite: "Infinite" }[
        prefix[1].toLowerCase()
      ]
    : null;
  const direct = text.match(
    /^(?:An?|An) (?:short|medium|long|infinite) (?:range )?(?:(?:attack|status skill|skill) that deals damage to|status skill(?: that applies)? to|skill that heals|skill that applies to) (\d+)\s*(?:(hostile|friendly) )?targets?\.?$/i,
  );
  const self =
    /^(?:An?|An) (?:short|medium|long|infinite) range (?:status skill that applies to|skill that heals|attack that deals damage to) yourself\.?$/i.test(
      text,
    );
  return {
    rangeCategory,
    targetCount:
      direct && Number(direct[1]) > 0 ? Number(direct[1]) : self ? 1 : null,
    targetKind: self
      ? "self"
      : direct?.[2] === "friendly"
        ? "ally"
        : direct?.[2] === "hostile"
          ? "enemy"
          : direct && /attack/.test(text)
            ? "enemy"
            : null,
    rangeVerification: prefix ? "verified" : "unverified",
    targetVerification: direct || self ? "verified" : "unverified",
    special: !!text && (!prefix || (!direct && !self)),
    sourceText: text,
  };
}
const knownStats =
  /^(?:(?:your |base )?(?:Outgoing |Incoming |Physical |Magical |Magic |Critical Strike |Critical |Crit |Hit |Max |Maximum |Damage over Time |DoT |All )*(?:Damage|Damage Resistance|Resistance|Chance|Haste|Dodge|Endurance|Strength|Intellect|Wisdom|Dexterity|Luck|STR|INT|END|WIS|DEX|LUK|HP|Health|DoTs|Mana Regen|Heal(?:ing)? Power|Defense|Attack Power|Spell Power)|damage taken|incoming damage|outgoing damage|physical damage received|physical damage taken|magical damage taken|magical damage|damage resistance)$/i;
function statsList(text) {
  text = text.replace(
    /^Physical and Magical Resistance$/i,
    "Physical Resistance and Magical Resistance",
  );
  const stats = text
    .trim()
    .replace(/\byour /gi, "")
    .split(/,\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return stats.every((s) => knownStats.test(s)) ? stats : null;
}
export function translateStatEffect(input) {
  if (!input) return null;
  const text = input
    .trim()
    .replace(/[.!]$/, "")
    .replace(/, and /gi, ", ")
    .replace(/ all increased /i, " increased ");
  const pair = text.match(/^(.+?) (?:and|,) (.+)$/i);
  if (pair) {
    const a = translateStatEffect(pair[1]),
      b = translateStatEffect(pair[2]);
    if (a && b) return [...a, ...b];
  }
  let m = text.match(/^(?:Increases?|Increase) (.+?) (?:by )?([\d.]+)%$/i),
    mode = "Tăng";
  if (!m) {
    m = text.match(
      /^(?:Reduces?|Reduce|Decreases?|Decrease) (.+?) by ([\d.]+)%$/i,
    );
    mode = "Giảm";
  }
  if (m) {
    const stats = statsList(m[1]);
    return stats ? stats.map((s) => `${mode} ${m[2]}% ${s}.`) : null;
  }
  m = text.match(
    /^(.+?) (?:is |are )?(increased|reduced|decreased) by ([\d.]+)%$/i,
  );
  if (m) {
    const stats = statsList(m[1]);
    return stats
      ? stats.map(
          (s) =>
            `${m[2].toLowerCase() === "increased" ? "Tăng" : "Giảm"} ${m[3]}% ${s}.`,
        )
      : null;
  }
  m = text.match(/^(?:\+)?([\d.]+)% (.+)$/);
  if (m) {
    const stats = statsList(m[2]);
    if (stats) return stats.map((s) => `Tăng ${m[1]}% ${s}.`);
  }
  m = text.match(/^(.+?) (?:and|,) (.+)$/i);
  if (m) {
    const a = translateStatEffect(m[1]),
      b = translateStatEffect(m[2]);
    if (a && b) return [...a, ...b];
  }
  if (/^Cannot miss or crit$/i.test(text)) return ["Không thể Miss hoặc Crit."];
  if (/^Stacks to (\d+)$/i.test(text))
    return ["Stack tối đa " + text.match(/\d+/)[0] + "."];
  return null;
}
export function isTechnicalPlaceholder(text) {
  return /đối chiếu|bản dịch.*cập nhật|trên Wiki.*Rank|mô tả chi tiết đang|xem Wiki|nội tại ở Rank.*xem/i.test(
    text || "",
  );
}
