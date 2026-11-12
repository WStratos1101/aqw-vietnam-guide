// Shared by the offline generator and audit: never emit partially valid imports.
import { farmTypes } from "./farm-catalog.mjs";
export function validateFarmCatalog({ items, regions }) {
  const errors = [],
    ids = new Set(),
    regionIds = new Set(regions.map((r) => r.id));
  if (regionIds.size !== regions.length) errors.push("Duplicate Region ID");
  const url = (value) => {
    try {
      const u = new URL(value);
      return (
        u.protocol === "https:" &&
        [
          "aqwwiki.wikidot.com",
          "www.aq.com",
          "aq.com",
          "docs.google.com",
        ].includes(u.hostname)
      );
    } catch {
      return false;
    }
  };
  const walk = (value, label) => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (
        ["source", "url"].includes(key) &&
        typeof child === "string" &&
        !url(child)
      )
        errors.push(`${label}: invalid source ${child}`);
      if (
        ["sources", "evidence", "regionEvidence"].includes(key) &&
        Array.isArray(child)
      )
        for (const entry of child)
          if (typeof entry === "string" && !url(entry))
            errors.push(`${label}: invalid URL ${entry}`);
      walk(child, label);
    }
  };
  for (const region of regions) {
    if (!region.name || !region.evidence?.length)
      errors.push(`${region.id}: missing Region evidence`);
    walk(region, region.id);
  }
  for (const item of items) {
    if (ids.has(item.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id))
      errors.push(`${item.id}: duplicate/invalid ID`);
    ids.add(item.id);
    if (!farmTypes.some((t) => t.id === item.type))
      errors.push(`${item.id}: unknown category`);
    if (
      !item.officialName ||
      !item.sources?.length ||
      !item.acquisition?.length ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.retrievedAt)
    )
      errors.push(`${item.id}: missing identity/provenance`);
    for (const record of [item, ...item.acquisition]) {
      if (record.regionId && !regionIds.has(record.regionId))
        errors.push(`${item.id}: nonexistent Region ${record.regionId}`);
      if (
        record.joinCommand &&
        !/^\/join [a-z0-9]+$/.test(record.joinCommand.value)
      )
        errors.push(`${item.id}: invalid map command`);
    }
    if (
      new Set(item.acquisition.map((r) => r.id)).size !==
      item.acquisition.length
    )
      errors.push(`${item.id}: duplicate route ID`);
    for (const route of item.acquisition) {
      if (
        ![
          "Merge",
          "Shop",
          "Quest",
          "Reputation",
          "Drop",
          "Craft",
          "Other",
        ].includes(route.method)
      )
        errors.push(`${item.id}: unknown acquisition method`);
      if (!route.source || !route.description)
        errors.push(`${item.id}: route missing evidence`);
    }
    walk(item, item.id);
  }
  return errors;
}
