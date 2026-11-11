// Frontend availability only. Keep source content and game progress intact.
export const siteFeatureAccess = Object.freeze({
  guides: { prefix: "/huong-dan", status: "comingSoon" },
  farming: { prefix: "/farm", status: "comingSoon" },
  equipmentLanding: { prefix: "/trang-bi", status: "comingSoon" },
  systems: { prefix: "/he-thong", status: "comingSoon" },
  lore: { prefix: "/cot-truyen", status: "comingSoon" },
  about: { prefix: "/gioi-thieu", status: "comingSoon" },
  classOverviewGuide: { prefix: "/class/general-class", status: "comingSoon" },
  classMechanicGuide: { prefix: "/class/class-mechanic", status: "comingSoon" },
  classEnhancementGuide: {
    prefix: "/class/class-enhancements",
    status: "comingSoon",
  },
  legacyClassLibrary: { prefix: "/class/thu-vien", status: "comingSoon" },
  classCodex: { prefix: "/class", status: "enabled" },
  ultraBoss: { prefix: "/ultra-boss", status: "enabled" },
});
export function comingSoonRoute(path) {
  return Object.values(siteFeatureAccess).find(
    (f) =>
      f.status === "comingSoon" &&
      (path === f.prefix || path.startsWith(f.prefix + "/")),
  )?.prefix;
}

export function isComingSoon(path) {
  return !!comingSoonRoute(path);
}
