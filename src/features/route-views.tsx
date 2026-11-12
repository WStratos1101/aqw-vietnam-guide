import type { ComponentType } from "react";
type Kind =
  | "farm-catalog"
  | "class-directory"
  | "class-detail"
  | "ultra-directory"
  | "ultra-detail"
  | "challenge-dungeons" | "other-challenges" | "challenge-detail";
export interface RouteViewProps {
  slug?: string;
}
const views: Partial<Record<Kind, ComponentType<RouteViewProps>>> = {};
export function installRouteViews(
  next: Partial<Record<Kind, ComponentType<RouteViewProps>>>,
) {
  Object.assign(views, next);
}
export async function loadRouteViews(path: string) {
  if ((path.replace(/\/$/, "") === "/farm" || path.startsWith("/farm/item/")) && !views["farm-catalog"]) {
    const module = await import("./farm/route");
    installRouteViews({"farm-catalog":module.Directory});
  }
  if (/^\/(challenge-dungeon|other-challenges)(\/|$)/.test(path)) {
    const module = await import("./challenges/route");
    installRouteViews({"challenge-dungeons":module.Dungeons,"other-challenges":module.Others,"challenge-detail":module.Detail});
  }
  if (path === "/class" && !views["class-directory"]) {
    const module = await import("./classes/directory-route");
    installRouteViews({ "class-directory": module.Directory });
  }
  if (path.startsWith("/class/") && !views["class-detail"]) {
    const module = await import("./classes/detail-route");
    installRouteViews({ "class-detail": module.Detail });
  }
  if (path.startsWith("/ultra-boss") && !views["ultra-detail"]) {
    const module = await import("./ultra/route");
    installRouteViews({
      "ultra-directory": module.Directory,
      "ultra-detail": module.Detail,
    });
  }
}
export function RouteView({ kind, slug }: { kind: Kind; slug?: string }) {
  const View = views[kind];
  return View ? <View slug={slug} /> : <p role="status">Đang tải hướng dẫn…</p>;
}
