import {isComingSoon} from './site-feature-access.mjs';
import challengeCatalog from '../content/challenges/catalog.json';
import {findClass,findBoss} from './route-summaries';
import {findChallenge} from '../content/ultra/challenge-catalog';
import type { Entry, SectionKey } from "../types/content";
export function resolveRoute(
  pathname: string,
  entries: Entry[],
  categories: Record<SectionKey, string>,
) {
  let path: string;
  try {
    path = decodeURI(pathname).replace(/\/$/, "") || "/";
  } catch {
    path = "/404";
  }
  const [, category, slug, ...rest] = path.split("/");
  const valid = Object.hasOwn(categories, category);
  const entry =
    valid && slug
      ? entries.find((g) => g.category === category && g.slug === slug)
      : undefined;
  const comingSoon = isComingSoon(path);
  const is404 = !comingSoon &&
    path !== "/" &&
    path !== "/gioi-thieu" &&
    (["challenge-dungeon","other-challenges"].includes(category)
      ? rest.length > 0 || (!!slug && !challengeCatalog.some(c => c.id === slug && c.href === path))
      : category === "ultra-boss"
      ? rest.length > 0 || (!!slug && !findBoss(slug)&&!findChallenge(slug))
      : category === "class"
        ? rest.length > 0 ||
          (!!slug && slug !== "thu-vien" && !entry && !findClass(slug))
        : !valid || (!!slug && !entry) || rest.length > 0);
  return { path, category: category as SectionKey, valid, entry, is404, comingSoon };
}
