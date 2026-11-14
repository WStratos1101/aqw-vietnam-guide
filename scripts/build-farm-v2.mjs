// Offline deterministic adapter: curated recipes remain authoritative; imports never infer routes.
import fs from "node:fs";
import { assignFarmGroups } from "./lib/farm-groups.mjs";
import { createHash } from "node:crypto";
import { validateFarmV2 } from "../src/lib/farm-v2.mjs";
import { farmWikiFacts } from "./lib/farm-wiki-facts.mjs";
import { farmClassMedia, farmClassRoles } from "./lib/farm-class-media.mjs";
import { enrichFarmGeography } from "./lib/farm-geography.mjs";
import { addAcquisitionGuides } from "./lib/farm-acquisition-instructions.mjs";
import { farmWikiDetails } from "./lib/farm-wiki-details.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const write = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
const legacy = read("src/content/farm/catalog.json");
const assets = read("src/data/aqw-assets.json");
const classProfiles = read("src/content/classes/catalog.json");
const classSources = read("src/content/classes/skill-registry.json").classes;
const effectOverrides = read(
  "content-sources/farm/import/effect-overrides.json",
);
const roleOverrides = read(
  "content-sources/farm/import/class-role-overrides.json",
);
const detailReview = read(
  "content-sources/farm/import/detail-review-batch.json",
);
const detailTranslations = read(
  "content-sources/farm/import/detail-translations.json",
);
const acquisitionOverrides = read(
  "content-sources/farm/import/acquisition-brief-overrides.json",
);
const guideOverrides = read("content-sources/farm/import/guide-overrides.json");
const classPortraits = read("src/content/classes/portrait-registry.json");
const input = "content-sources/farm/import/wiki-records.json";
if (!fs.existsSync(input))
  throw Error(
    "Run python3 scripts/import-farm-sources.py before building Farm V2. Source snapshot is required.",
  );
const records = read(input);
const detailRecords = [
  ...records,
  ...read("content-sources/farm/import/detail-wiki-records.json"),
];
const extracts = read("content-sources/farm/import/source-extracts.json");
const access = read("content-sources/farm/import/source-access.json");
const category = {
  weapon: "Weapons",
  armor: "Armors",
  helm: "Helms",
  cape: "Capes / Back Items",
  pet: "Pets",
  class: "Classes",
};
const source = (url) => ({
  url,
  label: url.includes("wikidot.com")
    ? "AQW Wiki"
    : url.includes("docs.google.com")
      ? "Google Docs"
      : "VNCollector",
  sourceType: url.includes("wikidot.com")
    ? "wiki"
    : url.includes("docs.google.com")
      ? "google-docs"
      : "vncollector",
});
const dedupe = (xs) => [...new Map(xs.map((s) => [s.url, s])).values()];
const canonical = (url) =>
  url
    .replace(/^http:/, "https:")
    .split(/[?#]/)[0]
    .replace(/\/$/, "");
const fact = (x) => x?.value ?? null;
const byWiki = new Map();
for (const item of legacy.items) {
  const wikiUrl =
    item.fieldEvidence?.officialName ||
    item.sources.find((s) => s.startsWith("https://aqwwiki.wikidot.com/"));
  const routes = item.acquisition.map((r) => ({
    id: r.id,
    method: r.method,
    description: r.description,
    regionId: r.regionId === undefined ? item.regionId : r.regionId,
    location: fact(r.location),
    mapCommand: fact(r.joinCommand),
    steps: (r.steps || []).map(fact),
    guidePaths: r.steps?.length
      ? [
          {
            id: "curated",
            label: "Hướng dẫn",
            verificationStatus: "verified",
            steps: r.steps.map((step, index) => ({
              id: "step-" + (index + 1),
              title: "Bước " + (index + 1),
              text: fact(step),
              sources: [step.source],
            })),
          },
        ]
      : [],
    materialTree: r.materialTree || null,
    prerequisites: r.prerequisites || [],
    sources: dedupe(
      [
        r.source,
        ...(r.steps || []).map((s) => s.source),
        r.location?.source,
        r.joinCommand?.source,
      ]
        .filter(Boolean)
        .map(source),
    ),
  }));
  byWiki.set(canonical(wikiUrl), {
    id: item.id,
    name: item.officialName,
    originalName: item.officialName,
    category: category[item.type],
    subtype: null,
    wikiUrl,
    level: fact(item.requiredLevel),
    membership: fact(item.membership),
    rarity: null,
    availability: fact(item.availability),
    effects: item.boosts.map(fact),
    image: item.image?.path || null,
    previewImage: item.image?.path || null,
    imageEvidence: item.image,
    lastChecked: item.retrievedAt,
    verificationStatus:
      item.verificationStatus === "verified" ? "verified" : "needs-review",
    reviewReason: item.reviewReason,
    fieldEvidence: item.fieldEvidence,
    acquisitionRoutes: routes,
    regions: [...new Set(routes.map((r) => r.regionId).filter(Boolean))],
    sources: dedupe(item.sources.map(source)),
    provenance: [],
    unknownFields: ["rarity"],
    prerequisites: item.prerequisites,
    classHref: item.classHref || null,
  });
}
const disagreements = [];
for (const r of records) {
  if (r.disposition !== "equipment") continue;
  const facts = farmWikiFacts(r);
  let item = byWiki.get(canonical(r.wikiUrl));
  if (!item) {
    // Required level only. "Level:" on weapons is item level, not unlock level.
    const { level, rarity, location } = facts;
    item = {
      id: r.id,
      name: r.originalName,
      originalName: r.originalName,
      category: r.category,
      wikiUrl: r.wikiUrl,
      level,
      membership: r.tags.includes("freeplayer")
        ? "non-member"
        : r.tags.includes("legend")
          ? "member"
          : "unknown",
      rarity,
      availability: r.tags.includes("rare")
        ? "rare"
        : r.tags.includes("seasonal")
          ? "seasonal"
          : "unknown",
      image: null,
      previewImage: null,
      imageEvidence: null,
      lastChecked: null,
      verificationStatus: "needs-review",
      reviewReason:
        "Tên và loại khớp Wiki; tuyến nhận, Region, điều kiện và availability cần đối chiếu.",
      fieldEvidence: {
        name: r.wikiUrl,
        category: r.wikiUrl,
        ...(level !== null ? { level: r.wikiUrl } : {}),
        ...(rarity ? { rarity: r.wikiUrl } : {}),
        ...(facts.materialTree ? { materials: r.wikiUrl } : {}),
        ...(facts.questReward ? { questReward: r.wikiUrl } : {}),
        ...(facts.purchase ? { purchase: r.wikiUrl } : {}),
      },
      effects: [],
      acquisitionRoutes:
        location || facts.materialTree || facts.questReward || facts.purchase
          ? [
              {
                id: "wiki-location",
                regionId: null,
                method: facts.materialTree
                  ? "Merge"
                  : facts.questReward
                    ? "Quest"
                    : facts.purchase
                      ? "Shop"
                      : "Other",
                questReward: facts.questReward,
                purchase: facts.purchase,
                location,
                description: facts.materialTree
                  ? "Công thức Merge theo snapshot Wiki; Region và điều kiện mở khóa còn cần đối chiếu."
                  : facts.questReward
                    ? `Hoàn thành Quest: ${facts.questReward}`
                    : facts.purchase
                      ? `${facts.purchase.amount.toLocaleString("en-US")} ${facts.purchase.currency} · ${location || "—"}`
                      : "Nơi nhận theo Wiki; chưa tách và xác minh từng tuyến.",
                mapCommand: null,
                steps: [],
                materialTree: facts.materialTree,
                sources: [source(r.wikiUrl)],
              },
            ]
          : [],
      regions: [],
      sources: [source(r.wikiUrl)],
      provenance: [],
      unknownFields: [
        "region",
        "routes",
        ...(!facts.materialTree ? ["materials"] : []),
        "image",
        "availability",
      ],
      recipeReviewReason: facts.recipeReviewReason,
    };
    byWiki.set(canonical(r.wikiUrl), item);
  } else if (item.category !== r.category) {
    disagreements.push({
      id: item.id,
      field: "category",
      curated: item.category,
      imported: r.category,
      decision: "retain curated; review cached tags",
    });
  }
  // Fill a missing rarity from an explicit Wiki label; never replace curated
  // routes, recipes, availability, verification dates or membership assertions.
  if (!item.rarity && facts.rarity) {
    item.rarity = facts.rarity;
    item.fieldEvidence.rarity = r.wikiUrl;
  }
  item.provenance = r.provenance;
  item.sources = dedupe([
    ...item.sources,
    ...r.provenance.map((p) => source(p.sourceUrl)),
  ]);
  item.identityEvidence = {
    wikiUrl: r.wikiUrl,
    tags: r.tags,
    cachePath: r.cachePath,
    lastChecked: r.lastChecked || null,
  };
}
// Add literal community mentions for preserved curated entries, without adding invented links.
for (const item of byWiki.values())
  for (const page of extracts.pages) {
    if (item.provenance.some((p) => p.sourceUrl === page.url)) continue;
    const needle = item.originalName.toLowerCase();
    const lines = page.text
      .split(/\r?\n/)
      .flatMap((line, i) =>
        line.toLowerCase().includes(needle) ? [i + 1] : [],
      );
    if (lines.length) {
      item.provenance.push({
        sourceDocument: page.sourceDocument,
        sourceUrl: page.url,
        lines,
        lastChecked: page.lastChecked,
      });
      item.sources = dedupe([...item.sources, source(page.url)]);
    }
  }
const items = [...byWiki.values()];
const subtypes = {
  sword: "Sword",
  dagger: "Dagger",
  axe: "Axe",
  staff: "Staff",
  gun: "Gun",
  mace: "Mace",
  polearm: "Polearm",
  bow: "Bow",
  wand: "Wand",
  scythe: "Scythe",
  rifle: "Rifle",
  whip: "Whip",
  gauntlet: "Gauntlet",
  handgun: "HandGun",
};
for (const item of items) {
  const media = farmClassMedia(
    item,
    classProfiles,
    classSources,
    classPortraits,
  );
  if (media) {
    const profile = classProfiles.find(
      (p) => "/class/" + p.slug === media.classHref,
    );
    item.classRoles = profile?.role || [];
    item.classRoleEvidence = {
      classId: profile.id,
      sourceUrl: classSources[profile.id].sourceUrl,
      basis: profile.roleBasis || null,
    };
    item.classHref ||= media.classHref;
    const a = media.portrait;
    if (!item.image && a && fs.existsSync("public" + a.imagePath)) {
      const hash = createHash("sha256")
        .update(fs.readFileSync("public" + a.imagePath))
        .digest("hex");
      if (hash !== a.sha256)
        throw Error("Farm Class portrait hash mismatch: " + item.id);
      item.image = item.previewImage = a.imagePath;
      item.imageEvidence = {
        path: a.imagePath,
        source: a.sourceUrl,
        assetId: a.id,
        credit: "AdventureQuest Worlds artwork © Artix Entertainment LLC",
        verificationStatus: "verified",
        usageStatus: a.usageStatus,
        policyUrl: a.policyUrl,
      };
    }
  }
  const matched = (item.identityEvidence?.tags || []).filter(
    (t) => subtypes[t],
  );
  item.subtype = matched.length === 1 ? subtypes[matched[0]] : null;
  if (!item.image) {
    const asset = assets.find(
      (a) =>
        a.entityType === "item" &&
        a.entityName === item.originalName &&
        a.verificationStatus === "verified" &&
        a.usageStatus === "approved" &&
        a.sourcePage &&
        canonical(a.sourcePage) === canonical(item.wikiUrl) &&
        a.imagePath?.startsWith("/images/") &&
        !a.imagePath.includes("..") &&
        a.fileHash &&
        fs.existsSync("public" + a.imagePath),
    );
    if (asset) {
      const hash = createHash("sha256")
        .update(fs.readFileSync("public" + asset.imagePath))
        .digest("hex");
      if (hash !== asset.fileHash)
        throw Error("Farm image hash mismatch: " + item.id);
      item.image = item.previewImage = asset.imagePath;
      item.imageEvidence = {
        path: asset.imagePath,
        source: asset.sourcePage,
        assetId: asset.assetId,
        credit: asset.authorOrCredit,
        verificationStatus: "verified",
        usageStatus: "approved",
      };
    }
  }
  if (item.image && item.unknownFields)
    item.unknownFields = item.unknownFields.filter(
      (field) => field !== "image",
    );
}

const detailAudit = [];
for (const item of items) {
  const record = detailRecords.find(
    (r) => canonical(r.wikiUrl) === canonical(item.wikiUrl),
  );
  const roleOverride = roleOverrides[item.id];
  if (roleOverride) {
    if (
      !record ||
      roleOverride.sourceTextHash !==
        createHash("sha256").update(record.text).digest("hex") ||
      !record.text.includes(roleOverride.quote) ||
      !record.text.includes(roleOverride.member)
    )
      throw Error("Unverified Class role override: " + item.id);
  }
  const roleMatch = farmClassRoles(
    item,
    classProfiles,
    classSources,
    roleOverrides,
  );
  item.classRoles = roleMatch?.roles || [];
  if (roleMatch) {
    item.classRoleEvidence = roleMatch;
  }
  if (record) {
    item.wikiDetails = farmWikiDetails(
      record,
      detailTranslations[item.wikiUrl],
    );
    const effect = effectOverrides[item.id];
    if (effect) {
      if (
        effect.wikiUrl !== item.wikiUrl ||
        effect.sourceTextHash !== item.wikiDetails.evidence.sourceTextHash ||
        effect.sourceQuotes.some((q) => !record.text.includes(q))
      )
        throw Error("Unverified item effects: " + item.id);
      if (!item.wikiDetails.specialEffectsVi.length)
        item.wikiDetails.specialEffectsVi = effect.effectsVi;
      item.wikiDetails.effectsEvidence = effect;
    }
    item.wikiDetails.evidence.snapshotStatus =
      record.snapshotStatus || "cached";
    if (
      detailReview.records[item.wikiUrl] ===
      item.wikiDetails.evidence.sourceTextHash
    )
      item.wikiDetails.evidence.inspectedAt = detailReview.inspectedAt;
    item.wikiDetails.evidence.fields = Object.fromEntries(
      Object.entries(item.wikiDetails)
        .filter(
          ([name, value]) =>
            !["raw", "evidence", "conflicts"].includes(name) &&
            value != null &&
            value !== "" &&
            (!Array.isArray(value) || value.length),
        )
        .map(([name]) => [
          name,
          name.endsWith("Vi")
            ? item.wikiDetails.evidence.translationStatus
            : "explicit_header_field",
        ]),
    );
    if (item.level == null && item.wikiDetails.levelRequired != null)
      item.level = item.wikiDetails.levelRequired;
  }
  const overrides = guideOverrides[item.wikiUrl];
  if (overrides) {
    // Exact route IDs are reviewed in the manifest; alternatives stay separate paths.
    for (const route of item.acquisitionRoutes) {
      const paths = overrides.routes[route.id];
      if (!paths) continue;
      for (const path of paths)
        for (const step of path.steps) {
          for (const e of step.evidence || []) {
            const page = extracts.pages.find((p) => p.url === e.sourceUrl);
            if (!page || e.lines.some((n) => !page.text.split(/\r?\n/)[n - 1]))
              throw Error("Missing guide source evidence: " + item.id);
            if (
              e.sourceTextHash &&
              createHash("sha256").update(page.text).digest("hex") !==
                e.sourceTextHash
            )
              throw Error("Changed guide source: " + item.id);
          }
        }
      route.guidePaths = paths;
    }
  }
  addAcquisitionGuides(item, record, acquisitionOverrides[item.id]);
  detailAudit.push({
    id: item.id,
    wikiUrl: item.wikiUrl,
    hasWikiSnapshot: Boolean(record),
    completeWikiSnapshot:
      Boolean(record) && record.snapshotStatus !== "partial",
    acquisitionStatus: item.acquisitionBrief.status,
    acquisitionKind: item.acquisitionBrief.kind,
    acquisitionInfo: Boolean(item.acquisitionBrief.text),
    hasDescriptionVi: Boolean(item.wikiDetails?.descriptionVi),
    hasSpecialEffects: Boolean(item.wikiDetails?.specialEffectsVi?.length),
    rawDescriptionPending: Boolean(
      item.wikiDetails?.raw.description && !item.wikiDetails.descriptionVi,
    ),
    rawSpecialEffectsPending: Boolean(
      item.wikiDetails?.raw.specialEffects &&
        !item.wikiDetails.specialEffectsVi.length,
    ),
    classRoles: item.classRoles,
    guidePaths: item.acquisitionRoutes.reduce(
      (n, r) => n + (r.guidePaths?.length || 0),
      0,
    ),
    conflicts: item.wikiDetails?.conflicts || [],
  });
}
write("content-sources/farm/import/detail-audit.json", detailAudit);
const geography = read("content-sources/farm/import/geography-evidence.json");
const geographyChanges = enrichFarmGeography(items, geography);
write("content-sources/farm/import/geography-changes.json", geographyChanges);
const groupManifest = read("content-sources/farm/faction-groups.json");
assignFarmGroups(items, extracts, groupManifest);
const usedRegions = new Set(items.flatMap((i) => i.regions));
const catalog = {
  schemaVersion: 2,
  groups: groupManifest.groups,
  verificationDisclaimer:
    "Danh mục còn thiếu đối chiếu; không bảo đảm mọi item đều đang farm được. Verified kế thừa snapshot có ngày; không phải kiểm tra trong game hôm nay.",
  regions: [
    ...legacy.regions,
    ...geography.regions.filter(
      (r) =>
        usedRegions.has(r.id) && !legacy.regions.some((old) => old.id === r.id),
    ),
  ],
  items,
};
const errors = validateFarmV2(catalog);
if (errors.length) throw Error(errors.join("\n"));
write("src/content/farm/catalog-v2.generated.json", catalog);
write(
  "src/content/farm/index.json",
  items.map((i) => ({ id: i.id, name: i.name })),
);
const bySource = (key) =>
  items.filter((i) => i.provenance.some((p) => p.sourceDocument === key));
const a = bySource("vncollector"),
  b = bySource("google-docs");
const ledger = extracts.pages.map((p) => ({
  url: p.url,
  sourceDocument: p.sourceDocument,
  entries: p.text.split(/\r?\n/).flatMap((text, index) => {
    if (!text.trim()) return [];
    const matched = items
      .filter((i) =>
        i.provenance.some(
          (ref) => ref.sourceUrl === p.url && ref.lines.includes(index + 1),
        ),
      )
      .map((i) => i.id);
    const excluded = records
      .filter(
        (r) =>
          r.disposition === "excluded" &&
          r.provenance.some(
            (ref) => ref.sourceUrl === p.url && ref.lines.includes(index + 1),
          ),
      )
      .map((r) => ({
        name: r.originalName,
        wikiUrl: r.wikiUrl,
        reason: r.reason,
      }));
    return [
      {
        line: index + 1,
        text,
        matchedItemIds: matched,
        excluded,
        disposition: matched.length
          ? "imported-reference"
          : excluded.length
            ? "excluded-reference"
            : "pending-context-review",
        reason: matched.length
          ? "Literal item reference; technical facts require per-field verification"
          : excluded.length
            ? "Non-equipment Wiki tags"
            : "Not yet classified: may be equipment, material, quest, instruction or context; not silently excluded",
      },
    ];
  }),
}));
write("content-sources/farm/import/source-accounting.json", ledger);
write(
  "content-sources/farm/import/image-review.json",
  extracts.pages.flatMap((p) =>
    (p.images || []).map((image, index) => ({
      sourceDocument: p.sourceDocument,
      sourceUrl: p.url,
      index,
      ...image,
      status: "pending-review",
      reason:
        "Reference retained; embedded graphic not visually reconciled. Not approved item artwork.",
    })),
  ),
);
const summary = {
  unique: items.length,
  sourceA: a.length,
  sourceB: b.length,
  overlap: a.filter((i) => b.some((x) => x.id === i.id)).length,
  withoutABProvenance: items.filter((i) => !i.provenance.length).length,
  sourcePages: extracts.pages.length,
  sourceFailures: access.failures.length,
  verifiedSnapshot: items.filter((i) => i.verificationStatus === "verified")
    .length,
  pendingReview: items.filter((i) => i.verificationStatus !== "verified")
    .length,
  withImage: items.filter((i) => i.image).length,
  missingImage: items.filter((i) => !i.image).length,
  unknownRegion: items.filter((i) => !i.regions.length).length,
  unknownRouteRegion: items.filter(
    (i) =>
      !i.acquisitionRoutes.length ||
      i.acquisitionRoutes.some((r) => !r.regionId),
  ).length,
  byCategory: Object.fromEntries(
    Object.values(category).map((c) => [
      c,
      items.filter((i) => i.category === c).length,
    ]),
  ),
  byRegion: Object.fromEntries(
    catalog.regions.map((r) => [
      r.name,
      items.filter((i) => i.acquisitionRoutes.some((x) => x.regionId === r.id))
        .length,
    ]),
  ),
  excludedWikiRecords: records.filter((r) => r.disposition === "excluded")
    .length,
  pendingSourceLines: ledger.reduce(
    (n, p) =>
      n +
      p.entries.filter((e) => e.disposition === "pending-context-review")
        .length,
    0,
  ),
  wikiPending: access.wikiPending.length,
  disagreements,
};
write("content-sources/farm/import/coverage.json", summary);
console.log("Farm V2:", summary);
