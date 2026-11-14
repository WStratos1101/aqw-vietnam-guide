import type {
  FarmV2Item,
  FarmV2RouteData,
  FarmGuidePath,
} from "../types/farm-v2";
export const UNKNOWN_CLASS_ROLE: string;
export function matchesFarmSubtype(
  item: FarmV2Item,
  category: string,
  subtype: string,
): boolean;
export function farmSubtypeOptions(
  items: FarmV2Item[],
  category: string,
  roles: string[],
): string[];
export function guidePaths(route?: FarmV2RouteData): FarmGuidePath[];
export function farmBoost(item: FarmV2Item): string[];
export function conciseFarmText(text: string): string;
