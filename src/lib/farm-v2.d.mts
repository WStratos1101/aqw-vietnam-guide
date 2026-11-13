import type { FarmV2Item, FarmV2RouteData } from "../types/farm-v2";
export const UNKNOWN_REGION: string;
export const categories: string[];
export function routesFor(item: FarmV2Item, region?: string): FarmV2RouteData[];
export function matchesRegion(item: FarmV2Item, region?: string): boolean;
export function validateFarmV2(catalog: unknown): string[];
