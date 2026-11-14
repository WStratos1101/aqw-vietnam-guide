// Only exact canonical names in the user-supplied, chapter-filtered guide
// assign a primary group. Parentheticals are retained; no prefix/name guessing.
export function normalizeFactionGoalName(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function assignFarmGroups(items, goals, manifest, aliases = [], mappings = [], legacy = {}, ultraEvidence = []) {
  const groups = new Set(manifest.groups.map((group) => group.id));
  const aggregateKinds = new Set([
    "set",
    "collection",
    "weapon-group",
    "class-family",
  ]);
  const byName = new Map();
  for (const goal of goals) {
    // Aggregate labels are parent records; only an item-level reward mapping
    // may attach a canonical item with the same name to that chapter.
    if (aggregateKinds.has(goal.record_kind)) continue;
    const key = normalizeFactionGoalName(goal.name);
    const matches = byName.get(key) || [];
    matches.push(goal);
    byName.set(key, matches);
  }
  const aliasById = new Map(aliases.map((entry) => [entry.itemId, entry]));
  const mappingById = new Map(mappings.map((entry) => [entry.itemId, entry]));
  const ultraById = new Map(ultraEvidence.map((entry) => [entry.itemId, entry]));
  for (const item of items) {
    const old = legacy[item.id];
    item.legacyGroupId = old?.groupIds?.length === 1 ? old.groupIds[0] : null;
    const explicit = mappingById.get(item.id);
    const ultra = ultraById.get(item.id);
    if (ultra) {
      const expectedGroup =
        ultra.sourceBoss === "Ultra Nulgath"
          ? "nation"
          : ultra.sourceBoss === "Ultra Dage"
            ? "legion"
            : null;
      const expectedSource =
        ultra.sourceBoss === "Ultra Nulgath"
          ? {
              url: "https://aqwwiki.wikidot.com/nulgath-s-quests",
              npc: "Nulgath (NPC)",
              insignia: "Nulgath Insignia",
            }
          : {
              url: "https://aqwwiki.wikidot.com/calamitus-quests",
              npc: "Calamitus",
              insignia: "Dage the Evil Insignia",
            };
      if (
        !expectedGroup ||
        ultra.primaryGroupId !== expectedGroup ||
        ultra.itemName !== item.name ||
        ultra.sourceUrl !== expectedSource.url ||
        !ultra.questName ||
        ultra.questNpc !== expectedSource.npc ||
        ultra.insigniaName !== expectedSource.insignia ||
        !Number.isInteger(ultra.sourceLine) ||
        ultra.sourceLine < 1 ||
        !Number.isInteger(ultra.insigniaQuantity) ||
        !ultra.sourceEvidence
      )
        throw Error("Invalid direct Ultra faction evidence: " + item.id);
    }
    const names = new Set(
      [item.name, item.originalName].map(normalizeFactionGoalName),
    );
    let matches = explicit ? [] : [...names]
      .flatMap((name) => byName.get(name) || [])
      .filter(
        (goal, index, all) =>
          all.findIndex(
            (candidate) =>
              candidate.name === goal.name &&
              candidate.source_line === goal.source_line,
          ) === index,
      );
    let alias = null;
    if (!explicit && !matches.length && aliasById.has(item.id)) {
      alias = aliasById.get(item.id);
      matches = byName.get(normalizeFactionGoalName(alias.goalName)) || [];
      if (matches.length !== 1 || !alias.reason)
        throw Error("Invalid manual faction goal alias: " + item.id);
    }
    const goal = matches.length === 1 ? matches[0] : null;
    // Chapter XIII is an ungrouped guide section, never a faction.
    const goalGroupId =
      goal && goal.group_id !== "other-items" && groups.has(goal.group_id)
        ? goal.group_id
        : null;
    const guideGroupId = explicit
      ? explicit.status === "verified"
        ? explicit.primaryGroupId
        : null
      : goalGroupId;
    if (ultra && guideGroupId && guideGroupId !== ultra.primaryGroupId)
      throw Error("Conflicting guide and direct Ultra faction evidence: " + item.id);
    const primaryGroupId = ultra?.primaryGroupId || guideGroupId;
    if (explicit?.status === "verified") {
      if (!groups.has(primaryGroupId) || !Number.isInteger(explicit.sourceLine) || !explicit.evidenceText)
        throw Error("Invalid canonical faction mapping: " + item.id);
    }
    item.primaryGroupId = primaryGroupId;
    item.groupIds = primaryGroupId ? [primaryGroupId] : [];
    item.groupStatus = primaryGroupId
      ? ultra && !explicit && !goal
        ? "verified-ultra-quest"
        : explicit
          ? "verified-guide-item"
          : "verified-guide"
      : "unknown";
    if (ultra) {
      item.acquisitionFactionEvidence = {
          sourceUrl: ultra.sourceUrl,
          questName: ultra.questName,
          questNpc: ultra.questNpc,
          sourceBoss: ultra.sourceBoss,
          sourceLine: ultra.sourceLine,
          insigniaName: ultra.insigniaName,
          insigniaQuantity: ultra.insigniaQuantity,
          evidenceText: ultra.sourceEvidence,
          status: "verified",
      };
    } else delete item.acquisitionFactionEvidence;
    item.groupEvidence = explicit
      ? [{
          groupId: primaryGroupId,
          sourceDocument: "manual-faction-guide",
          sourceFile: "content-sources/farm/manual-faction-guide/FARMING_ITEM_GUIDE_SOURCE.txt",
          goalName: explicit.itemName,
          sourceLine: explicit.sourceLine,
          sourceChapter: explicit.sourceChapter,
          recordKind: "canonical-item-reward",
          parentGoalId: explicit.parentGoalId || null,
          relatedGoalId: explicit.relatedGoalId || null,
          relationship: explicit.relationship || null,
          evidenceText: explicit.evidenceText,
          matchKind: "reviewed-canonical-item",
          aliasReason: explicit.evidenceType,
          status: "verified",
        }]
      : goal
      ? [
          {
            groupId: primaryGroupId,
            sourceDocument: "manual-faction-guide",
            sourceFile: "content-sources/farm/manual-faction-guide/FARMING_ITEM_GUIDE_SOURCE.txt",
            goalName: goal.name,
            sourceLine: goal.source_line,
            sourceChapter: goal.source_chapter,
            recordKind: goal.record_kind,
            evidenceText: goal.evidence_text,
            matchKind: alias ? "reviewed-canonical-alias" : "exact-canonical-name",
            aliasReason: alias?.reason || null,
            status: primaryGroupId ? "verified" : "ungrouped-source-chapter",
          },
        ]
      : ultra
        ? [{
            groupId: primaryGroupId,
            sourceDocument: "aqwwiki-ultra-quest",
            sourceFile: null,
            sourceUrl: ultra.sourceUrl,
            goalName: ultra.itemName,
            sourceLine: ultra.sourceLine,
            sourceChapter: ultra.sourceBoss,
            recordKind: "canonical-item-quest-reward",
            parentGoalId: null,
            relatedGoalId: null,
            relationship: "direct-quest-reward",
            questName: ultra.questName,
            questNpc: ultra.questNpc,
            sourceBoss: ultra.sourceBoss,
            insigniaName: ultra.insigniaName,
            insigniaQuantity: ultra.insigniaQuantity,
            evidenceText: ultra.sourceEvidence,
            matchKind: "verified-direct-ultra-quest",
            aliasReason: null,
            status: "verified",
          }]
        : [];
  }
  return items;
}
