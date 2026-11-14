import fs from "node:fs";
import { createHash } from "node:crypto";
import { verifiedFarmAsset, farmAssetEvidence } from "./farm-image-evidence.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const categories = {
  weapon: "Weapons",
  armor: "Armors",
  helm: "Helms",
  cape: "Capes / Back Items",
  pet: "Pets",
  class: "Classes",
};
const source = (url) => ({ url, label: "AQW Wiki", sourceType: "wiki" });
// Only item-specific, verified recipes from existing Ultra routes enter Farm.
export function importUltraFarm(items) {
  const recovery = read("src/content/ultra/recovery.json"),
    assets = read("src/data/aqw-assets.json");
  const bosses = [...read("src/content/ultra/bosses.json"), ...recovery.bosses];
  const added = [],
    pending = [],
    records = [];
  const routes = Object.entries(recovery.routeOverrides).flatMap(
    ([bossId, rows]) => rows.map((route) => ({ bossId, route })),
  );
  for (const { bossId, route } of routes) {
    const entity = recovery.equipment[route.canonicalId];
    if (!entity?.source || items.some((i) => i.wikiUrl === entity.source))
      continue;
    const file =
      "content-sources/recovery/" +
      new URL(entity.source).pathname.slice(1) +
      ".json";
    const snapshot = fs.existsSync(file) ? read(file) : null;
    const fallback =
      "content-sources/v678/" +
      new URL(entity.source).pathname.slice(1) +
      ".txt";
    const text =
      snapshot?.text ||
      (fs.existsSync(fallback) ? fs.readFileSync(fallback, "utf8") : null);
    if (
      !text ||
      !categories[entity.category] ||
      entity.materialConfidenceStatus !== "verified" ||
      entity.materialEvidence?.confidenceStatus !== "verified"
    ) {
      pending.push({
        id: entity.id,
        reason: "Missing exact cached body, category or verified recipe",
      });
      continue;
    }
    const boss = bosses.find((b) => b.slug === bossId),
      finish =
        route.quests?.find((q) => q.id === "acquire" || q.id === "merge") ||
        route.quests?.at(-1);
    if (!finish?.stepType || !["quest", "merge"].includes(finish.stepType)) {
      pending.push({
        id: entity.id,
        reason: "No explicit acquisition step type",
      });
      continue;
    }
    const method = finish.stepType === "quest" ? "Quest" : "Merge";
    const subtype =
      entity.category === "weapon"
        ? text.match(
            /^(sword|axe|dagger|bow|gun|mace|polearm|staff|wand)\s*$/im,
          )?.[1]
        : null;
    const asset = verifiedFarmAsset({ id: entity.id, originalName: entity.name, wikiUrl: entity.source }, assets);
    const sourceHash = createHash("sha256").update(text).digest("hex");
    const sources = [source(entity.source)];
    const tasks = (route.quests || []).flatMap((q) => {
      const url = q.source?.startsWith("https://")
        ? q.source
        : boss?.sources?.find((s) => s.id === q.source)?.url;
      if (!url) return [];
      return [
        {
          id: q.id,
          quest: q.name,
          requirements: q.requirements || [],
          preconditions: q.requirements || [],
          reward: q.reward,
          repeatability: q.repeatability,
          source: url,
          map: null,
          npc: null,
          rows: (q.items || []).map((value) => {
            const m = value.match(/^(.+?)\s*[×x](\d[\d,]*)$/);
            return {
              name: m ? m[1] : value,
              quantity: m ? Number(m[2].replaceAll(",", "")) : null,
              monster: null,
              map: null,
              source: url,
            };
          }),
        },
      ];
    });
    const acquisition = {
      id: "ultra-" + route.id,
      regionId: null,
      method,
      questReward: method === "Quest" ? finish.name : null,
      // A boss route describes ingredient farming, not necessarily the final
      // item's quest/shop. Exact item/quest geography is applied separately.
      location: null,
      mapCommand: null,
      description:
        method === "Quest"
          ? `Hoàn thành Quest: ${finish.name}`
          : `Merge ${entity.name}`,
      steps: [],
      materialTree: entity.materialTree,
      prerequisites: (route.prerequisites || []).map((value) => ({
        value,
        source: entity.source,
      })),
      sources,
      farmTasks: tasks,
      guidePaths: [
        {
          id: "ultra-verified",
          label: route.itemName,
          coverage: "source_notes",
          verificationStatus: "verified",
          steps: tasks.map((t) => ({
            id: t.id,
            title: t.quest,
            text: [...t.requirements, t.reward ? "Nhận " + t.reward : ""]
              .filter(Boolean)
              .join("; "),
            sources: [t.source],
          })),
        },
      ],
    };
    if (!acquisition.guidePaths[0].steps.length) acquisition.guidePaths = [];
    const labelValue = (label) =>
      text
        .match(new RegExp("^" + label + ":\\s*([^\\n]+)", "im"))?.[1]
        ?.trim() || null;
    const damage = [
      ...text.matchAll(
        /(?:does|deals)\s+(\d+(?:\.\d+)?)%\s+more\s+damage\s+to\s+(all monsters|humans?|undead|dragons?|elementals?|chaos monsters)/gi,
      ),
    ].map((match) => `${match[1]}% Damage to ${match[2]}`);
    const rewards = [
      ...text.matchAll(
        /\d+% (?:bonus|boost to) (?:Gold|Reputation|Experience|Class Points)[^.\n]*/gi,
      ),
    ].map((match) => match[0]);
    const item = {
      id: entity.id,
      name: entity.name,
      originalName: entity.name,
      category: categories[entity.category],
      subtype: subtype
        ? subtype[0].toUpperCase() + subtype.slice(1).toLowerCase()
        : null,
      wikiUrl: entity.source,
      level: entity.levelRequirement ?? null,
      membership:
        /^freeplayer$/im.test(text) && !/^legend$/im.test(text)
          ? "non-member"
          : /^legend$/im.test(text) && !/^freeplayer$/im.test(text)
            ? "member"
            : null,
      rarity: labelValue("Rarity"),
      sellback: labelValue("Sellback"),
      availability: null,
      effects: [...new Set([...damage, ...rewards])],
      image: asset?.imagePath || null,
      previewImage: asset?.imagePath || null,
      imageEvidence: asset ? farmAssetEvidence(asset) : null,
      verificationStatus: "needs-review",
      lastChecked: entity.lastVerified,
      reviewReason:
        "Ultra recipe verified in cache; primary faction and remaining item fields require review.",
      classRoles: [],
      acquisitionBrief: {
        status: "verified",
        kind: method,
        text: acquisition.description,
        source: entity.source,
        sourceTextHash: sourceHash,
      },
      acquisitionRoutes: [acquisition],
      regions: [],
      sources,
      provenance: [],
      groupIds: [],
      groupEvidence: [],
      groupStatus: "unknown",
    };
    items.push(item);
    added.push(item.id);
    records.push({
      id: item.id,
      wikiUrl: entity.source,
      text,
      sourceTextHash: sourceHash,
      sourceFile: file,
      lastChecked: entity.lastVerified,
    });
  }
  return { added, pending, records };
}
