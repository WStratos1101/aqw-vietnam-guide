import{discoverObservedShop}from'./lib/acquisition-shop-discovery.mjs';
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  parseClassAcquisitionPage,
  parseLinkedAcquisitionPage,
} from "./lib/class-acquisition-source.mjs";
const exec = promisify(execFile),
  read = async (p) => JSON.parse(await fs.readFile(p, "utf8"));
const catalog = await read("src/content/classes/catalog.json"),
  registry = await read("src/content/classes/skill-registry.json"),
  index = await read("content-sources/class-wiki/index-links.json");
const dir = "content-sources/class-acquisition";
await fs.mkdir(dir, { recursive: true });
await fs.mkdir("artifacts/qa/v12-4", { recursive: true });
const result = { version: 1, reviewedAt: "2026-11-09", classes: {} };
const clean = (s) =>
  s
    .replace(/\([^)]*\)/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const cache = new Map();
async function fetchPage(url) {
  const canonical = new URL(url);
  canonical.hash = "";
  const key = canonical.href.replace(/^http:/, "https:");
  if (cache.has(key)) return cache.get(key);
  const promise = (async () => {
    const slug = canonical.pathname.slice(1);
    for (const p of [
      dir + "/" + slug + ".html",
      "content-sources/class-wiki/" + slug + ".html",
    ]) {
      try {
        const h = await fs.readFile(p, "utf8");
        if (h.includes('id="page-content"')) return h;
      } catch {}
    }
    if (process.argv.includes("--cached-only")) throw Error("No cached source");
    const path = dir + "/" + slug + ".html";
    await exec(
      "curl",
      [
        "-fsSL",
        "--retry",
        "1",
        "--retry-all-errors",
        "--retry-delay",
        "1",
        "--connect-timeout",
        "8",
        "--max-time",
        "25",
        "-o",
        path + ".download",
        key,
      ],
      { maxBuffer: 2048 },
    );
    const h = await fs.readFile(path + ".download", "utf8");
    if (!h.includes('id="page-content"'))
      throw Error("Not a readable Wiki page");
    await fs.rename(path + ".download", path);
    return h;
  })();
  cache.set(key, promise);
  return promise;
}
function linkForLocation(location, type) {
  return (
    location?.links.find((a) =>
      type === "merge"
        ? /merge/i.test(a.name + " " + a.url)
        : /shop/i.test(a.name + " " + a.url),
    ) || null
  );
}
async function processClass(c) {
  const meta = registry.classes[c.id];
  const approved = new Set([
    ...(meta?.candidateUrls || []),
    ...(meta?.sourceUrl ? [meta.sourceUrl] : []),
  ]);
  const canonicalNames = new Set(
    [
      ...c.name.split(/\s+-\s+|\//).map(clean),
      ...index.filter((a) => approved.has(a.url)).map((a) => clean(a.name)),
      ...(c.id.startsWith("calendar-") ? [] : meta?.sameSkillVariants || []).map((a) => clean(a.name)),
    ].filter(Boolean),
  );
  const candidates = [
    ...new Set([
      ...approved,
      ...index
        .filter((a) => canonicalNames.has(clean(a.name)))
        .map((a) => a.url),
    ]),
  ];
  const methods = [],
    issues = [],
    reviewedPages = [],excludedSources=[];
  for (const url of candidates) {
    try {
      const page = await parseClassAcquisitionPage(await fetchPage(url), url);
      reviewedPages.push(url);
      if(page.excludedGame){excludedSources.push({source:url,game:page.excludedGame,reason:"Source explicitly restricts this gameplay variant to Infinity; not an AQW acquisition method"});continue;}
      if (page.methodType === "other"&&!page.otherAcquisition) {
        issues.push({
          source: url,
          reason:
            "Acquisition type/price is not explicit: " +
            (page.priceText || "missing Price"),
        });
        continue;
      }
      const locations = page.locations.length
        ? page.locations
        : [{ text: "", links: [] }];
      for (const [i, location] of locations.entries()) {
        let linked =
          page.methodType === "quest"
            ? page.questSource
            : (
                linkForLocation(location, page.methodType) ||
                (page.methodType !== "drop" ? location.links[0] : null)
              )?.url;
        let details = null,
          detailError = null;
        if (linked)
          try {
            details = await parseLinkedAcquisitionPage(
              await fetchPage(linked),
              linked,
              page.methodType === "quest" ? page.questName : undefined,
            );
          } catch (e) {
            detailError = e.stderr?.trim().slice(0, 300) || e.message;
          }
        if (details && page.methodType !== "quest" && !details.isShop) {
          detailError =
            "Observed Location link is not proven to be a Shop; linked NPC/map fields are not reused";
          details = null;
        }
        let discovered=null;
        if(!details&&["shop","merge"].includes(page.methodType)){
          discovered=await discoverObservedShop({location,classUrl:url,methodType:page.methodType,expectedPrice:page.price,fetchPage});
          if(discovered){details=discovered.details;linked=discovered.shopLink.url;detailError=null;}
        }
        const id =
          new URL(url).pathname.slice(1) + "-" + page.methodType + "-" + i;
        const method = {
          id,
          classId: c.id,
          type: page.otherAcquisition?"other":/^character creation$/i.test(location.text)
            ? "other"
            : page.methodType,
          variantName: page.title,
          isAvailable:
            page.availability === "legacy"
              ? false
              : page.availability === "seasonal"
                ? null
                : true,
          availability: page.availability,
          verificationStatus: "verified",
          detailsStatus:
            (page.methodType==="drop"&&!!page.dropName)||!!page.otherAcquisition||(!page.materialIssue &&
            details &&
            (page.methodType !== "quest" || details.questMatched) &&
            !details.issues.length)
              ? "complete"
              : "partial",
          source: url,
          sourceHash: page.sourceHash,
          prerequisites: [
            ...new Set([
              ...page.prerequisites,
              ...(page.methodType !== "quest"
                ? details?.prerequisites || []
                : []),
            ]),
          ],
          notes:
            page.availability === "seasonal"
              ? ["Phương án theo mùa; cần kiểm tra event đang mở."]
              : [],
          membershipRequirement: page.membershipRequirement,
          levelRequirement: page.levelRequirement,
          baseLevel: page.baseLevel,
          evidence: {
            classPage: url,
            shopDiscovery:discovered?.proof,
            linkedSource: linked || null,
            priceText: page.priceText,
            locationText: [location.text],
            linkedSourceHash: details?.sourceHash,
            availabilityTags: page.availabilityEvidence,
            issues: [
              ...(detailError ? [detailError] : []),
              ...(page.materialIssue ? [page.materialIssue] : []),
              ...(details?.issues || []),
            ],
          },
        };
        const shopLink = discovered?.shopLink ||
          linkForLocation(location, page.methodType) ||
          (details?.isShop
            ? location.links.find((a) => a.url === linked)
            : null);
        if (["shop", "merge"].includes(page.methodType) && !shopLink) {
          method.detailsStatus = "partial";
          method.evidence.issues.push("Shop identity is not yet verified");
        }
        if (method.type === "other") {
          method.other = page.otherAcquisition||{
            label: "Character Creation",
            description:
              "Chọn Class khi tạo nhân vật theo Location của Wiki. Giá Shop không áp dụng cho phương án tạo nhân vật.",
          };
          method.detailsStatus = "complete";
          method.evidence.issues = [];
        }
        if (method.type === "shop")
          method.shop = {
            shopName: shopLink?.name || "Tên shop chưa xác minh",
            source: shopLink?.url || null,
            npc: details?.npc || null,
            map:
              details?.map ||
              location.links
                .filter((a) => a !== shopLink)
                .map((a) => a.name)
                .join(" / ") ||
              null,
            price: page.price,
          };
        if (page.methodType === "merge")
          method.merge = {
            mergeShop: shopLink?.name || "Tên Merge Shop chưa xác minh",
            source: shopLink?.url || null,
            npc: details?.npc || null,
            map:
              details?.map ||
              location.links
                .filter((a) => a !== shopLink)
                .map((a) => a.name)
                .join(" / ") ||
              null,
            materials: page.materials,
            rawMaterials: page.rawMaterials,
            prerequisiteItems: [],
            requiredQuests: page.prerequisites,
          };
        if (details?.questNotes) method.notes.push(...details.questNotes);
        if (details?.availability === "legacy") {
          method.availability = "legacy";
          method.isAvailable = false;
        }
        if (
          details?.availability === "seasonal" &&
          method.availability !== "legacy"
        ) {
          method.availability = "seasonal";
          method.isAvailable = null;
        }
        if (page.methodType === "quest")
          method.quest = {
            questId: page.questSource || page.questName,
            questName: page.questName,
            npc: details?.npc || null,
            map: details?.map || location.text || null,
            source: page.questSource,
            prerequisites: details?.prerequisites || [],
            materials: details?.materials || null,
            reward: page.title,
            verifiedQuestSteps: details?.questSteps || [],
          };
        if (page.methodType === "drop")
          method.drop = {
            from: page.dropName,
            sources:page.dropSources,
            source: page.questSource || null,
          };
        methods.push(method);
      }
      for(const [index,extra]of(page.additionalAcquisitions||[]).entries()){
        methods.push({id:new URL(url).pathname.slice(1)+"-other-reward-"+index,classId:c.id,type:"other",variantName:page.title,isAvailable:extra.availability!=="legacy",availability:extra.availability,verificationStatus:"verified",detailsStatus:"complete",source:url,sourceHash:page.sourceHash,prerequisites:[],notes:[],membershipRequirement:page.membershipRequirement,levelRequirement:page.levelRequirement,baseLevel:page.baseLevel,evidence:{classPage:url,linkedSource:extra.url,priceText:null,locationText:[extra.name],availabilityTags:extra.availability==="legacy"?["explicit source reward row Rare tag"]:[],issues:[]},other:{label:extra.name,description:"Phần thưởng từ "+extra.name+".",source:extra.url}});
      }
    } catch (e) {
      issues.push({
        source: url,
        reason: e.stderr?.trim().slice(0, 300) || e.message,
      });
    }
  }
  if(!methods.length&&!issues.length)issues.push({source:meta?.sourceUrl||"https://aqwwiki.wikidot.com/classes",reason:"No applicable AQW acquisition method verified"});
  result.classes[c.id] = {
    classId: c.id,
    methods,
    reviewStatus:
      issues.length ||
      methods.some(
        (m) =>
          m.verificationStatus !== "verified" || m.detailsStatus === "partial",
      )
        ? "partial"
        : "reviewed",
    reviewedPages,excludedSources,
    issues,
  };
  console.log(
    c.id +
      ": " +
      methods
        .map(
          (m) =>
            m.type +
            (m.shop
              ? " " + m.shop.price.amount + " " + m.shop.price.currency
              : ""),
        )
        .join(" | ") +
      (issues.length ? " [" + issues.length + " pending]" : ""),
  );
}
if (process.env.AQW_ACQUISITION_CLASSES) {
  try {
    Object.assign(
      result.classes,
      (await read("src/content/classes/acquisition.json")).classes,
    );
  } catch {}
}
const selected = process.env.AQW_ACQUISITION_CLASSES
  ? catalog.filter((c) =>
      process.env.AQW_ACQUISITION_CLASSES.split(",").includes(c.id),
    )
  : catalog;
for (let i = 0; i < selected.length; i += 3) {
  await Promise.allSettled(selected.slice(i, i + 3).map(processClass)).then(
    (rs) =>
      rs.forEach((r) => {
        if (r.status === "rejected") console.error(r.reason);
      }),
  );
  await fs.writeFile(
    "src/content/classes/acquisition.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  await fs.writeFile(
    "artifacts/qa/v12-4/acquisition-progress.json",
    JSON.stringify(
      {
        profiles: Object.keys(result.classes).length,
        methods: Object.values(result.classes).reduce(
          (n, c) => n + c.methods.length,
          0,
        ),
      },
      null,
      2,
    ) + "\n",
  );
}
