// Exact source location labels only; faction/quest names never imply a Region.
export function enrichFarmGeography(items, evidence) {
  const changes = [];
  for (const item of items) {
    for (const route of item.acquisitionRoutes) {
      const matches = evidence.locations.filter(e => e.locationLabels.includes(route.location));
      if (matches.length !== 1) continue;
      const e = matches[0];
      if (route.regionId && route.regionId !== e.regionId) continue;
      if (route.mapCommand && route.mapCommand !== e.mapCommand) continue;
      const before = { regionId: route.regionId, mapCommand: route.mapCommand };
      route.regionId ||= e.regionId;
      route.mapCommand ||= e.mapCommand;
      route.geographyEvidence = { sources: e.sources, checkedAt: e.checkedAt };
      for (const url of e.sources)
        if (!route.sources.some(s => s.url === url)) route.sources.push({url, label: 'AQW Wiki', sourceType: 'wiki'});
      item.regions = [...new Set(item.acquisitionRoutes.map(r => r.regionId).filter(Boolean))];
      if (item.acquisitionRoutes.every(r => r.regionId) && item.unknownFields)
        item.unknownFields = item.unknownFields.filter(f => f !== 'region');
      if (before.regionId !== route.regionId || before.mapCommand !== route.mapCommand)
        changes.push({itemId:item.id, routeId:route.id, before, after:{regionId:route.regionId, mapCommand:route.mapCommand}, sources:e.sources});
    }
  }
  return changes;
}
