// Offline only. Curated Wiki facts are authoritative; upstream guide generators do not own this model.
import fs from "node:fs";
import { validateFarmCatalog } from "../src/lib/farm-validation.mjs";
import { createHash } from "node:crypto";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const snapshot = read("content-sources/farm/verified-items.json");
const errors = validateFarmCatalog(snapshot);
if (errors.length) throw new Error(errors.join("\n"));
const source = read("content-sources/farming-guide.json");
const catalog = read("src/content/imported/catalog.json").filter((p) =>
  p.id.startsWith("farming-guide-"),
);
const assets = read("src/data/aqw-assets.json");
const challenge = read("src/content/challenges/equipment.json");
const text = (n) =>
  (n.runs || [])
    .map((r) => r.text)
    .join("")
    .trim();
const norm = (s) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const aliases = {
  "chaorrupter-unlocked-free-player": "Chaorrupter Unlocked",
  "greatblade-of-the-solstice-moon": "Greatblade of the Solstice Moon",
};
const docUrl = `https://docs.google.com/document/d/${source.source.id}/edit`;
const guideRecords = catalog.map((p) => ({
  id: p.id,
  title: p.title,
  href: "/farm/" + p.slug,
  sourceIndex: Number(p.sourceHeadingId.replace("line-", "")),
  itemIds: [],
}));
const goalNodes = source.nodes.filter(
  (n) =>
    n.sourceIndex >= 45 &&
    n.sourceIndex <= 203 &&
    /^\s*\t/.test((n.runs || []).map((r) => r.text).join("")) &&
    text(n) &&
    ![
      "Extraordinary",
      "Very Difficult",
      "Difficult",
      "Hard",
      "Medium",
      "Fair",
      "Easy",
    ].includes(text(n)),
);
const goalRecords = goalNodes.map((n) => ({
  id: n.id,
  title: text(n)
    .replace(/^[★☆]\s*/, "")
    .replace(/\s*\+ Badge$/, ""),
  sourceIndex: n.sourceIndex,
  itemIds: [],
}));
const items = snapshot.items.map((item) => {
  const needle = norm(aliases[item.id] || item.officialName);
  const mentions = source.nodes
    .filter((n) => norm(text(n)).includes(needle))
    .map((n) => n.sourceIndex);
  const linked = guideRecords.filter((p, i) =>
    mentions.some(
      (index) =>
        index >= p.sourceIndex &&
        index < (guideRecords[i + 1]?.sourceIndex ?? Infinity),
    ),
  );
  for (const p of linked) p.itemIds.push(item.id);
  for (const p of goalRecords)
    if (norm(p.title).includes(needle)) p.itemIds.push(item.id);
  const asset =
    assets.find(
      (a) =>
        a.entityName === item.officialName &&
        a.verificationStatus === "verified" &&
        a.usageStatus === "approved" &&
        a.imagePath,
    ) ||
    challenge.assets.find(
      (a) =>
        a.name === item.officialName &&
        a.verificationStatus === "verified" &&
        a.usageStatus === "approved" &&
        a.imagePath,
    );
  const image = asset
    ? {
        path: asset.imagePath,
        source:
          asset.sourcePage ||
          asset.sourceUrl ||
          asset.source ||
          item.sources[0],
        assetId: asset.assetId || asset.id,
        credit:
          asset.authorOrCredit ||
          asset.credit ||
          "AQWorlds artwork © Artix Entertainment LLC; AQWorlds Wiki",
        verificationStatus: "verified",
        usageStatus: "approved",
      }
    : null;
  return {
    ...item,
    image,
    communityEvidence: {
      url: docUrl,
      readAt: source.source.readAt,
      sourceIndices: mentions,
      guideHrefs: linked.map((p) => p.href),
    },
  };
});
const manifest = {
  schemaVersion: 1,
  source: {
    path: "content-sources/farming-guide.json",
    sha256: createHash("sha256")
      .update(fs.readFileSync("content-sources/farming-guide.json"))
      .digest("hex"),
    documentUrl: docUrl,
    readAt: source.source.readAt,
    modifiedAt: source.source.modifiedAt,
    retrievalAttemptAt: snapshot.retrievedAt,
    retrievalStatus: "offline_fallback",
    reason:
      "Original Google Docs URL was not accessible via web tool; using the checked-in text export.",
  },
  wiki: {
    retrievedAt: snapshot.retrievedAt,
    availabilityConfirmedInGameAt: null,
    indexSources: [
      "https://aqwwiki.wikidot.com/locations",
      "https://aqwwiki.wikidot.com/maps",
    ],
  },
  coverage: {
    sourceNodes: source.nodes.length,
    sourceGuideRecords: guideRecords.length,
    goalRecords: goalRecords.length,
    verifiedItemRecords: items.filter(
      (i) => i.verificationStatus === "verified",
    ).length,
    mappedItems: items.filter((i) => i.regionId).length,
    unknownRegionItems: items.filter((i) => !i.regionId).length,
    unmappedGuideRecords: guideRecords.filter((p) => !p.itemIds.length).length,
    unmappedGoalRecords: goalRecords.filter((p) => !p.itemIds.length).length,
    unresolvedSources: snapshot.unresolvedSources.length,
    imageItems: items.filter((i) => i.image).length,
  },
  scope:
    "Initial verified equipment import. Goal records and guide chapters include Classes, houses, materials, sets and mechanics; unmapped records require triage and are not a count of missing equipment. Not a complete inventory of every item mentioned in the document.",
  guideRecords,
  goalRecords,
  unresolvedSources: snapshot.unresolvedSources,
};
fs.mkdirSync("src/content/farm", { recursive: true });
fs.writeFileSync(
  "src/content/farm/catalog.json",
  JSON.stringify(
    { schemaVersion: 1, regions: snapshot.regions, items },
    null,
    2,
  ) + "\n",
);
fs.writeFileSync(
  "src/content/farm/manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log("Farm coverage:", manifest.coverage);

fs.writeFileSync(
  "src/content/farm/index.json",
  JSON.stringify(items.map((i) => ({ id: i.id, name: i.officialName }))) + "\n",
);

// V2 consumes the same curated recipes/assets and the reviewed public-source snapshot.
await import("./build-farm-v2.mjs");
