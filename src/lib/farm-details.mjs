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
