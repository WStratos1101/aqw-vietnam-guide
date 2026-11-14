export const UNKNOWN_CLASS_ROLE = "unknown";
export function matchesFarmSubtype(item, category, subtype) {
  if (!subtype) return true;
  return category === "Classes"
    ? subtype === UNKNOWN_CLASS_ROLE
      ? !(item.classRoles || []).length
      : (item.classRoles || []).includes(subtype)
    : item.subtype === subtype;
}
export function farmSubtypeOptions(items, category, roles) {
  return category === "Classes"
    ? [...roles, UNKNOWN_CLASS_ROLE]
    : [
        ...new Set(
          items
            .filter((i) => category === "all" || i.category === category)
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

// Absence of an effect is not evidence that the item has no boost.
export function farmBoost(item) {
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
  if (boosts.length) return [...new Set(boosts)];
  // Only an explicit reviewed statement can establish "none".
  if (
    effects.some((text) =>
      /^(?:Không có boost|No boosts?)[.!]?$/i.test(text.trim()),
    )
  )
    return ["Không có boost"];
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
