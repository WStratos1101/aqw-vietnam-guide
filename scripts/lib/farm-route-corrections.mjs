const wikiSource = (url) => ({ url, label: "AQW Wiki", sourceType: "wiki" });

export function applyFarmRouteCorrections(items, corrections, wikiPages, guideText) {
  const changes = [];
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const [itemId, correction] of Object.entries(corrections)) {
    const item = byId.get(itemId);
    const page = wikiPages.find((entry) => entry.url === correction.source);
    if (!item || item.wikiUrl !== correction.source || !page)
      throw Error("Missing source-backed Farm route correction target: " + itemId);
    if (page.sourceHash !== correction.wikiPageHash)
      throw Error("Wiki snapshot changed for Farm route correction: " + itemId);
    if (JSON.stringify(page.questAlternatives.map((entry) => entry.quest)) !== JSON.stringify(correction.questNames))
      throw Error("Wiki Quest alternatives changed for Farm route correction: " + itemId);
    const guideLines = guideText.split(/\r?\n/);
    const [start, end] = correction.guideLines;
    if (!Number.isInteger(start) || !Number.isInteger(end) || end < start ||
        !guideLines.slice(start - 1, end).some((line) => line.includes(item.name)))
      throw Error("Guide line evidence changed for Farm route correction: " + itemId);
    const route = item.acquisitionRoutes.find((entry) => entry.materialTree);
    if (!route) throw Error("Missing verified recipe route: " + itemId);
    route.location = correction.mergeLocation;
    route.mapCommand = correction.mergeMapCommand;
    route.guidePaths = [];
    route.sources = [...new Map([
      ...(route.sources || []),
      wikiSource(correction.source),
    ].map((source) => [source.url, source])).values()];
    const questSources = [
      wikiSource(correction.source),
      wikiSource(correction.wikiQuestSource),
    ];
    const questRoute = {
      id: "guide-verified-quest-rewards",
      regionId: null,
      method: "Quest",
      questReward: null,
      questAlternatives: correction.questNames.map((quest) => ({
        quest,
        npc: correction.questNpc,
        sources: [correction.wikiQuestSource, correction.source],
      })),
      npc: correction.questNpc,
      location: correction.questLocation,
      mapCommand: correction.questMapCommand,
      description: "Chọn một trong các Quest reward được Wiki liệt kê; điều kiện và nguyên liệu khác nhau theo Quest.",
      steps: [],
      materialTree: null,
      sources: questSources,
      guidePaths: item.acquisitionRoutes.flatMap((entry) => entry.guidePaths || []),
      sourceEvidence: {
        source: correction.guideSource,
        startLine: start,
        endLine: end,
        wikiSource: correction.source,
        wikiPageHash: page.sourceHash,
      },
    };
    const existingQuestRoute = item.acquisitionRoutes.find((entry) => entry.id === questRoute.id);
    if (existingQuestRoute)
      throw Error("Farm route correction already applied: " + itemId);
    item.acquisitionRoutes = [...item.acquisitionRoutes, questRoute];
    changes.push({
      itemId,
      mergeLocation: route.location,
      mergeMapCommand: route.mapCommand,
      addedQuestNames: correction.questNames,
      guideSource: correction.guideSource,
      startLine: start,
      endLine: end,
      wikiSource: correction.source,
      wikiPageHash: page.sourceHash,
    });
  }
  return changes;
}
