import type { FarmItem, FarmRegion, FarmType } from "../types/farm";
export const farmTypes: ReadonlyArray<{ id: FarmType; label: string }>;
export const unknownFarmRegion: string;
export function farmItemHref(id: string): string;
export function farmItemId(path: string): string | undefined;
export function farmableNow(item: FarmItem): boolean;
export function farmRoutes(
  item: FarmItem,
  regionId?: string,
): FarmItem["acquisition"];
export function searchFarm(items: FarmItem[], query?: string): FarmItem[];
export function filterFarm(
  items: FarmItem[],
  regionId: string,
  type?: string,
  query?: string,
): FarmItem[];
export function farmRegionCounts(
  items: FarmItem[],
  regions: FarmRegion[],
  query?: string,
): { id: string; name: string; count: number }[];
