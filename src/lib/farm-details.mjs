export const UNKNOWN_CLASS_ROLE = "unknown";
export function matchesFarmSubtype(item, category, subtype) {
  if (!subtype) return true;
  // The visible subtype rail is weapon-only. Treat stale URLs from the old
  // cross-category filters as unfiltered instead of silently narrowing data.
  return category === "Weapons" && item.category === "Weapons"
    ? item.subtype === subtype
    : true;
}
export function farmSubtypeOptions(items, category, roles) {
  if (category !== "Weapons") return [];
  return [
    ...new Set(
      items
        .filter((i) => i.category === "Weapons")
        .map((i) => i.subtype)
        .filter(Boolean),
    ),
  ];
}
export function guidePaths(route) {
  if (!route) return [];
  if (route.guidePaths?.length)
    return route.guidePaths.filter(
      (p) =>
        p.verificationStatus === "verified" &&
        p.steps.length &&
        p.steps.every((s) => s.sources?.length),
    );
  return [];
}

// One display formatter for reviewed structured boosts and legacy Wiki effects.
// It translates wording only; every percentage and named target is retained.
export function formatFarmBoost(text) {
  // Wiki sometimes embeds a boost in the item's lore description. Select the
  // boost sentence before translating so description prose never reaches Boost.
  const marker = text.search(/When equipped,\s*this item|\bThis item (?=(?:does|gives|provides|increases)\s)|\bItem (?=does\s+\d)/i);
  if (marker >= 0) {
    text = text.slice(marker);
    const end = text.search(/when equipped(?=[.)]|$)/i);
    if (end >= 0) text = text.slice(0, end + 'when equipped'.length);
  }
  return text.replace(/Description:\s*/gi, "")
    .replace(/^When equipped,\s*this item /i, "Khi trang bị, vật phẩm ")
    .replace(/^(?:This item|Item) /i, "")
    .replace(/provides (?:a |an )?/gi, "tăng ")
    .replace(/\b(?:does|gives) (?=\d)/gi, "tăng ")
    .replace(/more damage to|Damage to All/gi, match=>/All/i.test(match)?"sát thương lên All Monsters":"sát thương lên")
    .replace(/Damage to /gi, "sát thương lên ")
    .replace(/bonus to /gi, "")
    .replace(/% more /gi, "% ")
    .replace(/^(\d+(?:[.,]\d+)?%) bonus /i, "Tăng $1 ")
    .replace(/class points|\bCP\b/gi, "Class Point")
    .replace(/experience|\bXP\b/gi, "EXP")
    .replace(/\brep\b|reputation/gi, "Reputation")
    .replace(/\bgold\b/gi, "Gold")
    .replace(/all monsters|any monster/gi, "All Monsters")
    .replace(/all tagged monsters/gi, "mọi quái có tag")
    .replace(/(Chaos|Undead|Human|Dragon|Elemental)(?: tagged)? Monsters/gi, (_,race)=>race[0].toUpperCase()+race.slice(1).toLowerCase())
    .replace(/gained when battling monsters or turning in quests|when battling monsters or turning in quests/gi, "khi đánh quái hoặc trả Quest")
    .replace(/gained from quests/gi, "nhận được từ Quest")
    .replace(/when equipped/gi, "khi trang bị")
    .replace(/^Khi trang bị, vật phẩm /i, "Khi trang bị, ")
    .replace(/\band\b/gi, "và")
    .replace(/,\s*(?=và\s)/gi, " ")
    .trim();
}

function collapseTaggedBoostDuplicates(boosts) {
  const explicitTargets = ["Chaos", "Dragon", "Elemental", "Human", "Undead"];
  const genericTagged = (text) => {
    const match = text.match(/(\d+(?:[.,]\d+)?)%.*(?:all tagged monsters|mọi quái có tag)/i);
    return match?.[1]?.replace(",", ".") || null;
  };
  const hasAllTargets = (text) =>
    explicitTargets.every((target) => new RegExp(`\\b${target}\\b`, "i").test(text));
  const isEquipped = (text) => /when equipped|khi trang bị/i.test(text);
  return boosts.filter((text) => {
    const amount = genericTagged(text);
    if (!amount || !isEquipped(text)) return true;
    return !boosts.some((other) => {
      if (other === text || genericTagged(other)) return false;
      const otherAmount = other.match(/(\d+(?:[.,]\d+)?)%/)?.[1]?.replace(",", ".");
      return otherAmount === amount && hasAllTargets(other) && isEquipped(other);
    });
  });
}

export function farmBoostState(item) {
  const values=farmBoost(item);
  return values[0]==="Chưa xác minh"?"unverified":values[0]==="Không"?"none":"verified";
}

// Absence of an effect is not evidence that the item has no boost.
export function farmBoost(item) {
  if(item.boostReviewStatus === "none")return ["Không"];
  if(item.boostReviewStatus === "unverified")return ["Chưa xác minh"];
  if(item.boosts?.length){
    const labels={classPoints:"Class Point",experience:"EXP",reputation:"Reputation",gold:"Gold"};
    const unique = new Map();
    for (const boost of item.boosts) {
      const key = JSON.stringify({
        kind: boost.kind,
        percent: boost.percent,
        targets: boost.targets ? [...boost.targets].sort() : [],
      });
      if (!unique.has(key)) unique.set(key, boost);
    }
    return [...unique.values()].map(boost=>boost.kind==='damageToAll'?`Tăng ${boost.percent}% sát thương lên All Monsters khi trang bị.`:boost.kind==='damageToTagged'?`Tăng ${boost.percent}% sát thương lên ${boost.targets.join(', ')}.`:`Tăng ${boost.percent}% ${labels[boost.kind]||boost.kind}.`);
  }
  const details = item.wikiDetails;
  const effects = details?.specialEffectsVi?.length
    ? details.specialEffectsVi
    : item.effects || [];
  const boosts = effects.filter(
    (text) =>
      /\d+(?:[.,]\d+)?%/.test(text) &&
      /damage|sát thương|\bXP\b|\bCP\b|class points|\bgold\b|\brep\b|reputation/i.test(
        text,
      ),
  );
  if (boosts.length)
    return collapseTaggedBoostDuplicates([...new Set(boosts.map(formatFarmBoost))]);
  // Only an explicit reviewed statement can establish "none".
  if (
    effects.some((text) =>
      /^(?:Không có boost|No boosts?)[.!]?$/i.test(text.trim()),
    )
  )
    return ["Không"];
  return ["Chưa xác minh"];
}

// Presentation-only edits: preserve named entities, prerequisites and every quantity.
export function conciseFarmText(text) {
  return text
    .replace(" và thu thập đủ nguyên liệu trong công thức bên dưới.", ".")
    .replace(
      "theo nguyên liệu và phương án AND/OR của tuyến này.",
      "theo công thức AND/OR của tuyến này.",
    )
    .replace(/\s+/g, " ")
    .trim();
}
