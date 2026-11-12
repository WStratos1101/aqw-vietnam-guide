import farmIndex from './content/farm/index.json';
import {farmItemId,farmItemHref} from './lib/farm-catalog.mjs';
import {Directory as FarmDirectory} from './features/farm/route';
import {classIdentityLabel} from "./lib/class-identity";
import { primaryCalendarClass } from "./lib/calendar-families";
import {isComingSoon} from './lib/site-feature-access.mjs';
import challengeCatalog from './content/challenges/catalog.json';
import {Dungeons,Others,Detail as ChallengeDetail} from './features/challenges/route';
import { classProfiles, findClass } from "./content/classes";
import { ultraBosses, findBoss } from "./content/ultra";
import {challengeGuides,findChallenge} from './content/ultra/challenge-catalog';
import { resolveRoute } from "./lib/routes";
import React from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import {installRouteViews} from './features/route-views';
import {Directory as ClassDirectory,Detail as ClassDetail} from './features/classes/route';
import {Directory as UltraDirectory,Detail as UltraDetail} from './features/ultra/route';
installRouteViews({'farm-catalog':FarmDirectory,'challenge-dungeons':Dungeons,'other-challenges':Others,'challenge-detail':ChallengeDetail,'class-directory':ClassDirectory,'class-detail':ClassDetail,'ultra-directory':UltraDirectory,'ultra-detail':UltraDetail});
import { guides, href, categories } from "./content/data";
export const routes = [
  ...new Set([
    "/",
    "/gioi-thieu",
    "/class/thu-vien",
    ...farmIndex.map(i=>farmItemHref(i.id)),
    ...classProfiles.flatMap((c) =>
      [c.slug, ...c.aliases].map((s) => "/class/" + s),
    ),
    "/challenge-dungeon", "/other-challenges", ...challengeCatalog.map(c=>c.href),
    "/ultra-boss",
    ...ultraBosses.map((b) => "/ultra-boss/" + b.slug),
    ...challengeGuides.map(g=>g.href),
    ...Object.keys(categories).map((c) => "/" + c),
    ...guides.map(href),
  ]),
];
export function render(path: string) {
  const farmItem = farmIndex.find(i=>i.id===farmItemId(path));
  const challenge = challengeCatalog.find(c=>c.href===path);
  const profile = path.startsWith("/class/")
    ? findClass(path.split("/")[2])
    : undefined;
  const boss = findBoss(path.split("/")[2]);
  const entry = guides.find((e) => href(e) === path);
  const { category, is404, comingSoon } = resolveRoute(path, guides, categories);
  return {
    bodyUrl: comingSoon ? undefined : challenge?.bodyUrl || entry?.imported?.bodyUrl,
    html: renderToString(<App />),
    title:
      (comingSoon ? "Thông tin đang được cập nhật" : is404
        ? "Không tìm thấy trang"
        : (path === "/farm" ? "Farm Codex" : farmItem?.name) || challenge?.name || (path === "/challenge-dungeon" ? "Challenge Dungeon" : path === "/other-challenges" ? "Other Challenges" : undefined) || (path === "/class" ? "Class Codex" : (profile ? classIdentityLabel(profile.id) : undefined)) ||
          (path === "/ultra-boss"
            ? "Ultra Boss Codex"
            : path.startsWith("/ultra-boss/")
              ? boss?.name||findChallenge(path.split('/')[2])?.name
              : undefined) ||
          entry?.title ||
          categories[category] ||
          (path === "/gioi-thieu" ? "Giới thiệu" : "Cẩm nang phiêu lưu")) +
      " | AQW Vietnam Guide",
    description:
      (comingSoon ? "Thông tin đang được cập nhật tại AQW Vietnam Guide." : undefined) ||
      (path === "/farm" || farmItem ? `Farm Codex: ${farmItem?.name || "trang bị theo Region"}. Cách nhận, nguyên liệu và nguồn Wiki, hướng dẫn cộng đồng.` : undefined) ||
      profile?.shortDescription ||
      (path.startsWith("/ultra-boss/") ? boss?.description : undefined) ||
      entry?.summary ||
      "Cẩm nang AdventureQuest Worlds tiếng Việt. Hướng dẫn, Class, farm và thế giới Lore dành cho cộng đồng người chơi.",
  };
}

export function bodyUrlForPath(path: string) {
  if (isComingSoon(path)) return undefined;
  const routeClass = path.startsWith("/class/") ? findClass(path.split("/")[2]) : undefined;
  const bodyClass = routeClass && classProfiles.find(c => c.id === primaryCalendarClass(routeClass.id));
  return (
    bodyClass?.bodyUrl ||
    (path.startsWith("/ultra-boss/")
      ? findBoss(path.split("/")[2])?.sourceContentUrl||findChallenge(path.split('/')[2])?.bodyUrl
      : undefined) ||
    guides.find((entry) => href(entry) === path)?.imported?.bodyUrl
  );
}
