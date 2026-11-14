import { createHash } from "node:crypto";
const labels =
  "Locations?|Price|Sellback|Weapon Damage|Base Damage|Damage|Speed|Description|Recommended Enhancements?|Stat Model|Special Effects|Level Required|Required Level|Base Level|Level|Membership|Rarity|Availability|Starting Weapon|Notes?|Merge the following";
export function wikiHeaderFields(record) {
  const header = (record.text || "").split(/^Skills?:\s*$/im)[0];
  const entries = [
    ...header.matchAll(new RegExp(`^(${labels}):[ \\t]*`, "gim")),
  ];
  const fields = {};
  for (let i = 0; i < entries.length; i++) {
    const key = entries[i][1].toLowerCase();
    const value = header
      .slice(
        entries[i].index + entries[i][0].length,
        entries[i + 1]?.index ?? header.length,
      )
      .trim();
    (fields[key] ||= []).push(value);
  }
  return fields;
}
export function farmWikiDetails(record, translation) {
  const fields = wikiHeaderFields(record);
  const one = (...keys) => {
    const values = [
      ...new Set(keys.flatMap((k) => fields[k] || []).filter(Boolean)),
    ];
    return values.length === 1 ? values[0] : null;
  };
  const hash = createHash("sha256")
    .update(record.text || "")
    .digest("hex");
  const translated = translation?.sourceTextHash === hash ? translation : null;
  const description = one("description");
  const enhancement =
    one("recommended enhancement", "recommended enhancements") ||
    description?.match(/recommended enhancements?:\s*([^.;\n]+)/i)?.[1] ||
    null;
  const weapon = one("weapon damage");
  const weaponMatch = weapon?.match(/^([\d.]+%)\s*,\s*([\d.]+)\s+speed$/i);
  const special = one("special effects");
  let specialVi = translated?.specialEffectsVi || [];
  if (
    !specialVi.length &&
    special &&
    special.split(/\.\s+/).length <= 2 &&
    /all hits landed in combat/.test(special) &&
    /crit/i.test(special) &&
    /amount.*(?:depends|based).*damage.*relative.*HP total/is.test(special)
  )
    specialVi = [
      "Hồi mana khi đòn đánh trúng mục tiêu; chí mạng hồi nhiều hơn.",
      "Lượng mana hồi phụ thuộc sát thương gây ra so với tổng HP của chính nhân vật.",
    ];
  if (
    !specialVi.length &&
    special &&
    special.split(/\n/).length <= 4 &&
    /gain mana when they:/i.test(special) &&
    /Strike an? enemy in combat/i.test(special)
  ) {
    if (/Are struck by an enemy in combat/i.test(special))
      specialVi = [
        "Hồi mana khi đánh trúng kẻ địch; chí mạng hồi nhiều hơn.",
        "Hồi mana khi bị kẻ địch đánh trúng.",
      ];
    else if (/Dodge any attack.*restores HP/i.test(special))
      specialVi = [
        "Hồi mana khi đánh trúng kẻ địch; chí mạng hồi nhiều hơn.",
        "Né đòn giúp hồi mana và HP.",
      ];
  }
  const sellbackRaw = one("sellback");
  const sellbackVi =
    sellbackRaw
      ?.replace(/First 24 Hours:/gi, "Trong 24 giờ đầu:")
      .replace(/After 24 Hours:/gi, "Sau 24 giờ:") || null;
  const required = one("level required", "required level");
  const tags = new Set(record.tags || []);
  const membership = tags.has("freeplayer") && !tags.has("legend") ? "non-member" : tags.has("legend") && !tags.has("freeplayer") ? "member" : null;
  const explicitAvailability = one("availability");
  const availability = explicitAvailability && /^(?:permanent|seasonal|rare)$/i.test(explicitAvailability) ? explicitAvailability.toLowerCase()
    : tags.has("rare") && !tags.has("seasonal") ? "rare" : tags.has("seasonal") && !tags.has("rare") ? "seasonal" : null;
  return {
    membership, rarity: one("rarity"), availability,
    location: one("location", "locations"),
    priceRaw: one("price"),
    sellback: sellbackVi,
    weaponDamage: weaponMatch?.[1] || one("base damage", "damage") || null,
    speed: weaponMatch?.[2] || one("speed"),
    descriptionVi: translated?.descriptionVi || null,
    specialEffectsVi: specialVi,
    enhancement,
    statModel: one("stat model"),
    levelRequired: required && /^\d+$/.test(required) ? Number(required) : null,
    raw: {
      description,
      specialEffects: special,
      weaponDamage: weapon,
      sellback: sellbackRaw,
    },
    evidence: {
      sourceUrl: record.wikiUrl,
      sourceTextHash: hash,
      snapshotCheckedAt: record.lastChecked || null,
      status: "snapshot_extracted",
      translationStatus: translated
        ? "reviewed_translation"
        : specialVi.length
          ? "matched_exact_mechanic_pattern"
          : "pending_translation",
    },
    conflicts: Object.entries(fields)
      .filter(([, v]) => new Set(v).size > 1)
      .map(([k]) => k),
  };
}
