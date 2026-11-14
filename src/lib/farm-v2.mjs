export const UNKNOWN_REGION = "unknown-region";
export const categories = [
  "Weapons",
  "Armors",
  "Helms",
  "Capes / Back Items",
  "Pets",
  "Classes",
];
export function routesFor(item, region = "all") {
  const routes = item.acquisitionRoutes || [];
  return region === "all"
    ? routes
    : routes.filter((r) =>
        region === UNKNOWN_REGION ? !r.regionId : r.regionId === region,
      );
}
export function matchesRegion(item, region = "all") {
  return (
    region === "all" ||
    routesFor(item, region).length > 0 ||
    (region === UNKNOWN_REGION && !(item.acquisitionRoutes || []).length)
  );
}
export function validateFarmV2(catalog) {
  const errors = [],
    ids = new Set(),
    wiki = new Set(),
    regions = new Set(catalog.regions.map((r) => r.id));
  const url = (s) => {
    try {
      return ["https:", "http:"].includes(new URL(s).protocol);
    } catch {
      return false;
    }
  };
  const material = (n, id) => {
    if (!n) return;
    if (n.kind === "item") {
      if (!Number.isFinite(n.quantity) || n.quantity <= 0)
        errors.push(id + ": invalid material quantity");
      if (!url(n.source)) errors.push(id + ": material source");
    } else if (
      ["allOf", "anyOf"].includes(n.kind) &&
      Array.isArray(n.requirements)
    )
      n.requirements.forEach((x) => material(x, id));
    else errors.push(id + ": invalid material tree");
  };
  for (const i of catalog.items) {
    if (ids.has(i.id)) errors.push("Duplicate ID " + i.id);
    ids.add(i.id);
    if (catalog.groups) {
      const groupIds = new Set(catalog.groups.map((g) => g.id));
      if (
        !Array.isArray(i.groupIds) ||
        i.groupIds.length > 1 ||
        new Set(i.groupIds).size !== i.groupIds.length ||
        (i.primaryGroupId ?? null) !== (i.groupIds[0] ?? null)
      )
        errors.push("Invalid group memberships " + i.id);
      for (const group of i.groupIds || [])
        if (
          !groupIds.has(group) ||
          !i.groupEvidence?.some(
            (e) => e.groupId === group && e.status === "verified",
          )
        )
          errors.push("Missing group provenance " + i.id + ":" + group);
      if (
        i.primaryGroupId &&
        !i.groupEvidence?.some(
          (e) =>
            e.groupId === i.primaryGroupId &&
            ((e.sourceDocument === "manual-faction-guide" &&
              e.sourceFile &&
              Number.isInteger(e.sourceLine) &&
              e.sourceLine > 0) ||
              (e.sourceDocument === "aqwwiki-ultra-quest" &&
                url(e.sourceUrl) &&
                e.matchKind === "verified-direct-ultra-quest" &&
                e.questName &&
                e.questNpc &&
                e.sourceBoss &&
                e.insigniaName &&
                Number.isInteger(e.insigniaQuantity))),
        )
      )
        errors.push("Missing verified faction evidence " + i.id);
      if (
        i.acquisitionFactionEvidence &&
        (!url(i.acquisitionFactionEvidence.sourceUrl) ||
          !i.acquisitionFactionEvidence.questName ||
          !i.acquisitionFactionEvidence.questNpc ||
          !i.acquisitionFactionEvidence.sourceBoss ||
          !Number.isInteger(i.acquisitionFactionEvidence.sourceLine) ||
          !i.acquisitionFactionEvidence.insigniaName ||
          !Number.isInteger(i.acquisitionFactionEvidence.insigniaQuantity) ||
          i.acquisitionFactionEvidence.status !== "verified")
      )
        errors.push("Invalid acquisition faction evidence " + i.id);
    }
    if (wiki.has(i.wikiUrl))
      errors.push("Duplicate canonical URL " + i.wikiUrl);
    wiki.add(i.wikiUrl);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(i.id))
      errors.push("Invalid ID " + i.id);
    if (!categories.includes(i.category))
      errors.push("Unknown category " + i.id);
    if (!url(i.wikiUrl) || !i.originalName)
      errors.push("Missing identity " + i.id);
    if (
      i.image &&
      (!i.image.startsWith("/") ||
        i.image.startsWith("//") ||
        !i.imageEvidence ||
        i.imageEvidence.verificationStatus !== "verified" ||
        !(
          i.imageEvidence.usageStatus === "approved" ||
          (i.category === "Classes" &&
            i.imageEvidence.usageStatus === "approved_noncommercial" &&
            url(i.imageEvidence.policyUrl))
        ))
    )
      errors.push("Unapproved image " + i.id);
    for (const s of i.sources)
      if (!url(s.url)) errors.push("Bad source " + i.id);
    const routes = new Set();
    for (const r of i.acquisitionRoutes) {
      if (routes.has(r.id)) errors.push("Duplicate route " + i.id);
      routes.add(r.id);
      if (r.regionId && !regions.has(r.regionId))
        errors.push("Unknown Region " + i.id);
      if (r.mapCommand && !/^\/join [a-z0-9-]+$/i.test(r.mapCommand))
        errors.push("Invalid join " + i.id);
      material(r.materialTree, i.id);
      for (const s of r.sources || [])
        if (!url(s.url)) errors.push("Bad route source " + i.id);
    }
  }
  return errors;
}
