import data from "./catalog.json";
import assets from "./assets.json";
import type { AqwClass } from "../../types/classes";
import type { GameAsset } from "../../types/ultra";
export const classProfiles = data as unknown as AqwClass[];
export const classAssets = assets as GameAsset[];
export const findClass = (slug: string) =>
  classProfiles.find((c) => c.slug === slug || c.aliases.includes(slug));
