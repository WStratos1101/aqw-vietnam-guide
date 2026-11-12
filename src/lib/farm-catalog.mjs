export const farmTypes = Object.freeze([
  { id: "weapon", label: "Weapons" },
  { id: "armor", label: "Armors" },
  { id: "helm", label: "Helms" },
  { id: "cape", label: "Capes / Back Items" },
  { id: "pet", label: "Pets" },
  { id: "class", label: "Classes" },
]);
export const unknownFarmRegion = "unverified";
export function farmItemHref(id) {
  return "/farm/item/" + id;
}
export function farmItemId(path) {
  return /^\/farm\/item\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(path)?.[1];
}
const normalize = (s) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
export function searchFarm(items, query = "") {
  const term = normalize(query.trim());
  return items.filter(
    (i) =>
      !term ||
      normalize(
        [
          i.officialName,
          i.location.value,
          ...i.acquisition.map((r) => r.description),
        ].join(" "),
      ).includes(term),
  );
}
export function filterFarm(items, regionId, type = "all", query = "") {
  return searchFarm(items, query).filter(
    (i) =>
      (regionId === "all" || farmRoutes(i, regionId).length > 0) &&
      (type === "all" || i.type === type),
  );
}
export function farmRoutes(item, regionId = "all") {
  return item.acquisition.filter(
    (r) =>
      regionId === "all" ||
      ((r.regionId === undefined ? item.regionId : r.regionId) ||
        unknownFarmRegion) === regionId,
  );
}
export function farmableNow(item) {
  return (
    item.verificationStatus === "verified" &&
    item.availability.value === "available" &&
    !/^[1-9][\d,]* AC$/.test(item.price?.value || "") &&
    item.acquisition.some((r) =>
      r.regionId === undefined ? item.regionId : r.regionId,
    )
  );
}
export function farmRegionCounts(items, regions, query = "") {
  const matches = searchFarm(items, query);
  return [
    { id: "all", name: "Tất cả Region" },
    ...regions,
    { id: unknownFarmRegion, name: "Chưa xác minh Region" },
  ].map((r) => ({
    ...r,
    count: matches.filter(
      (i) => r.id === "all" || farmRoutes(i, r.id).length > 0,
    ).length,
  }));
}
