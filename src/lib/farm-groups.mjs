export const UNKNOWN_GROUP = "unknown";
export function resolveGroup(value, manifest) {
  if (value === UNKNOWN_GROUP || value === "all") return value;
  return (
    manifest.groups.find((g) => g.id === value || g.aliases?.includes(value))
      ?.id || "all"
  );
}
export function matchesGroup(item, group = "all") {
  return (
    group === "all" ||
    (group === UNKNOWN_GROUP
      ? !item.groupIds?.length
      : item.groupIds?.includes(group) === true)
  );
}
export function groupCounts(items, groups) {
  // Count canonical identities even if an upstream caller supplies repeated records.
  const unique = [...new Map(items.map((i) => [i.id, i])).values()];
  return [
    { id: "all", name: "Tất cả nhóm", fallback: "*" },
    ...groups,
    { id: UNKNOWN_GROUP, name: "Chưa xác minh nhóm", fallback: "?" },
  ].map((g) => ({
    ...g,
    count: unique.filter((i) => matchesGroup(i, g.id)).length,
  }));
}
