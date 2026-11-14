export const UNKNOWN_GROUP: "unknown";
export type Group = {
  id: string;
  name: string;
  fallback: string;
  aliases?: string[];
};
export function resolveGroup(
  value: string,
  manifest: { groups: Group[] },
): string;
export function matchesGroup(
  item: { groupIds?: string[] },
  group?: string,
): boolean;
export function groupCounts(
  items: { id: string; groupIds?: string[] }[],
  groups: Group[],
): (Group & { count: number })[];
