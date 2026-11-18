import source from "../../content/enhancements/source.json";

export type EnhancementSlot = "weapon" | "helm" | "cape";
export interface SourceEnhancementRecord {
  sheetRow: number;
  name: string;
  base: string | null;
  class: string | null;
  weapon: string | null;
  helm: string | null;
  cape: string | null;
  aweWeapon: string | null;
  obtainableRaw?: string | null;
}

export const enhancementSourceUrl: string = source.source.url;
export const enhancementRecords: SourceEnhancementRecord[] = source.records;

/** Exact normalized identity, not fuzzy approximate string matching. */
export function enhancementIdentity(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function enhancementOptions(value: string | null | undefined): string[] {
  if (!value) return [];
  return [...new Set(value.split("/").map((s) => s.trim()).filter(Boolean))];
}

const index = new Map<string, SourceEnhancementRecord[]>();
for (const row of enhancementRecords) {
  const id = enhancementIdentity(row.name);
  index.set(id, [...(index.get(id) ?? []), row]);
}

function exact(name: string | undefined | null): SourceEnhancementRecord | null {
  if (!name) return null;
  const rows = index.get(enhancementIdentity(name)) ?? [];
  return rows.length === 1 ? rows[0] : null;
}

/** These are verified AQWVN canonical *families*, not broad text guesses. */
const canonicalFamily: Record<string, string> = {
  "stone-crusher-sc-infinity-titan-it": "StoneCrusher",
  "archpaladin-ap": "ArchPaladin",
  "lord-of-order-loo": "Lord Of Order",
  "void-highlord-vhl-debris-highlord-dhl": "Void Highlord",
  "legion-revenant-lr": "Legion Revenant",
  "healer-acolyte-witch": "Healer",
  "mage-sorcerer": "Mage",
  "rogue-renegade": "Rogue",
  "warrior-beast-warrior-pumpkin-lord-warlord": "Warrior",
  "blaze-binder-bb-firelord-summoner-fls": "Blaze Binder",
};

export interface EnhancementMatch {
  row: SourceEnhancementRecord | null;
  matchedBy: "variant" | "profile" | "family" | "unverified";
  variantRequested: boolean;
}

/**
 * Variant first. When a different variant is selected but lacks a source row,
 * never silently assign the primary Class' build to it.
 */
export function findClassEnhancements(
  profile: { id: string; name: string },
  variantName?: string,
): EnhancementMatch {
  const variant = exact(variantName);
  if (variant) return { row: variant, matchedBy: "variant", variantRequested: true };
  const original = exact(profile.name);
  const canonical = exact(canonicalFamily[profile.id]);
  const differentVariant = !!variantName &&
    enhancementIdentity(variantName) !== enhancementIdentity(profile.name) &&
    enhancementIdentity(variantName) !== enhancementIdentity(canonicalFamily[profile.id] ?? "");
  if (differentVariant) return { row: null, matchedBy: "unverified", variantRequested: true };
  if (original) return { row: original, matchedBy: "profile", variantRequested: false };
  if (canonical) return { row: canonical, matchedBy: "family", variantRequested: false };
  return { row: null, matchedBy: "unverified", variantRequested: false };
}

export function forgeAvailable(row: SourceEnhancementRecord): boolean {
  return enhancementOptions(row.class).length > 0;
}
