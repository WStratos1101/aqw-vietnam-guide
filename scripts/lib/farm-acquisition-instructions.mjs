import { createHash } from "node:crypto";
import { farmWikiFacts } from "./farm-wiki-facts.mjs";
export function acquisitionEvidence(item, record) {
  if (!record)
    return {
      status: "PENDING_SOURCE",
      kind: "unknown",
      text: null,
      reason: "Missing item Wiki snapshot",
    };
  const facts = farmWikiFacts(record),
    d = item.wikiDetails;
  const source = record.wikiUrl,
    sourceTextHash = createHash("sha256").update(record.text).digest("hex");
  const location =
    d?.location && !/^(?:N\/A|none)$/i.test(d.location.trim())
      ? d.location.trim()
      : null;
  const base = {
    source,
    sourceTextHash,
    location,
    snapshotStatus: record.snapshotStatus || "cached",
    availability: item.availability || d?.availability || "unknown",
  };
  if (facts.questReward)
    return {
      ...base,
      status: "verified",
      kind: "Quest",
      text: `Hoàn thành Quest: ${facts.questReward} để nhận ${item.name}.`,
    };
  const rewardBlock = record.text.match(
    /Reward from the following quests:\s*\n([\s\S]*?)(?=\n(?:Sellback|Rarity|Description|Notes):)/i,
  )?.[1];
  const rewards = rewardBlock
    ? [
        ...new Set(
          [...rewardBlock.matchAll(/^['‘](.+?)['’](?: \([^\n]+\))?\.?$/gm)].map(
            (m) => m[1],
          ),
        ),
      ]
    : [];
  if (rewards.length)
    return {
      ...base,
      status: "verified",
      kind: "Quest",
      alternatives: rewards,
      text: `Nhận ${item.name} từ một trong các Quest: ${rewards.join(" HOẶC ")}. Chọn đúng phiên bản Quest và điều kiện tương ứng.`,
    };
  const drop = d?.priceRaw?.match(/^N\/A \(Dropped by (.+)\)$/i);
  if (drop)
    return {
      ...base,
      status: "verified",
      kind: "Drop",
      text: `${item.name} rơi từ ${drop[1]}.`,
    };
  const merge =
    item.acquisitionRoutes.find((r) => r.materialTree)?.materialTree ||
    facts.materialTree;
  if (merge && location)
    return {
      ...base,
      status: "verified",
      kind: "Merge",
      text: `Merge ${item.name} tại ${location.replace(/\n/g, " · ")} theo công thức nguyên liệu của tuyến đã chọn.`,
      materialTree: merge,
    };
  if (facts.purchase && location)
    return {
      ...base,
      status: "verified",
      kind: "Shop",
      text: `Giá ${facts.purchase.amount.toLocaleString("en-US")} ${facts.purchase.currency} tại ${location.replace(/\n/g, " · ")}. Giữ đúng điều kiện mở Shop của phương án đã chọn.`,
      purchase: facts.purchase,
    };
  if (location)
    return {
      ...base,
      status: "PENDING_SOURCE",
      kind: "location_only",
      text: `Nơi nhận: ${location.replace(/\n/g, " · ")}.`,
      reason:
        "Location known; method/conditions/alternative recipe scope not fully established",
    };
  return {
    ...base,
    status: "PENDING_SOURCE",
    kind: "unknown",
    text: null,
    reason: "No unambiguous acquisition method or location in item snapshot",
  };
}
export function addAcquisitionGuides(item, record, override) {
  let brief = acquisitionEvidence(item, record);
  if (override) {
    if (
      !record ||
      override.source !== record.wikiUrl ||
      override.sourceTextHash !==
        createHash("sha256").update(record.text).digest("hex") ||
      override.sourceQuotes.some((q) => !record.text.includes(q))
    )
      throw Error("Invalid acquisition review: " + item.id);
    brief = { ...brief, ...override };
  }
  item.acquisitionBrief = brief;
  for (const route of item.acquisitionRoutes) {
    if (route.guidePaths?.length) continue;
    // Never apply a single snapshot price/reward to another existing route.
    let text = null;
    if (route.method === "Merge" && route.materialTree)
      text = `Merge ${item.name}${route.location ? " tại " + route.location : ""} theo nguyên liệu và phương án AND/OR của tuyến này.`;
    else if (route.questReward)
      text = `Hoàn thành Quest: ${route.questReward} để nhận ${item.name}.`;
    else if (route.purchase)
      text = `Nhận ${item.name} với giá ${route.purchase.amount.toLocaleString("en-US")} ${route.purchase.currency}${route.location ? " tại " + route.location : ""}.`;
    else if (
      route.method === "Quest" &&
      brief.kind === "Quest" &&
      brief.status === "verified"
    )
      text = brief.text;
    else if (
      route.method === "Shop" &&
      brief.kind === "Shop" &&
      brief.status === "verified"
    )
      text = brief.text;
    else if (
      route.id === "wiki-location" &&
      brief.kind === "Drop" &&
      brief.status === "verified"
    )
      text = brief.text;
    if (!text) continue;
    const sources = [
      ...new Set(
        [...(route.sources || []).map((s) => s.url), record?.wikiUrl].filter(
          Boolean,
        ),
      ),
    ];
    if (!sources.length) continue;
    route.guidePaths = [
      {
        id: "verified-acquisition",
        label: "Cách nhận ngắn",
        coverage: "acquisition_only",
        verificationStatus: "verified",
        availability: brief.availability,
        steps: [
          {
            id: "acquisition-fact",
            title: "Cách nhận " + item.name,
            text,
            sources,
          },
        ],
        missingFields: ["Detailed source walkthrough not yet fully reviewed"],
      },
    ];
  }
  return brief;
}
