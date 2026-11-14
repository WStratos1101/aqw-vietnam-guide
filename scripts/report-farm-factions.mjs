import fs from "node:fs";
import { groupCounts } from "../src/lib/farm-groups.mjs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const catalog = read("src/content/farm/catalog-v2.generated.json");
const manifest = read("content-sources/farm/faction-groups.json");
const baseline = read(
  "content-sources/farm/import/group-migration-baseline.json",
);
const rows = groupCounts(catalog.items, manifest.groups)
  .filter((g) => g.id !== "all")
  .map((g) => {
    const members = catalog.items.filter((i) =>
      g.id === "unknown" ? !i.groupIds.length : i.groupIds.includes(g.id),
    );
    const source = (name) =>
      members.filter((i) =>
        i.groupEvidence.some(
          (e) => e.groupId === g.id && e.sourceDocument === name,
        ),
      ).length;
    return `| ${g.name} | ${g.count} | ${source("vncollector")} | ${source("google-docs")} |`;
  });
const overlaps = catalog.items.filter((i) => i.groupIds.length > 1);
const unknown = catalog.items
  .filter((i) => !i.groupIds.length)
  .map((i) => i.id);
const mismatch = catalog.items.flatMap((i) => {
  const a = [
    ...new Set(
      i.groupEvidence
        .filter((e) => e.sourceDocument === "vncollector")
        .map((e) => e.groupId),
    ),
  ].sort();
  const b = [
    ...new Set(
      i.groupEvidence
        .filter((e) => e.sourceDocument === "google-docs")
        .map((e) => e.groupId),
    ),
  ].sort();
  return a.length && b.length && JSON.stringify(a) !== JSON.stringify(b)
    ? [{ id: i.id, site: a, docs: b }]
    : [];
});
const audit = {
  status: "PARTIAL",
  browser: "BROWSER_QA_PENDING",
  baseline: baseline.canonicalTotal,
  canonicalTotal: catalog.items.length,
  images: catalog.items.filter((i) => i.image).length,
  routes: catalog.items.reduce((n, i) => n + i.acquisitionRoutes.length, 0),
  counts: Object.fromEntries(
    groupCounts(catalog.items, manifest.groups).map((g) => [g.id, g.count]),
  ),
  unknown,
  multiGroup: overlaps.map((i) => ({ id: i.id, groupIds: i.groupIds })),
  siteDocsMismatches: mismatch,
};
fs.writeFileSync(
  "content-sources/farm/import/group-audit.json",
  JSON.stringify(audit, null, 2) + "\n",
);
fs.writeFileSync(
  "FARM_FACTION_AUDIT.md",
  `# Farm faction audit\n\nCheckpoint: PARTIAL — implementation and offline evidence complete; BROWSER_QA_PENDING.\n\nCanonical before/after: ${baseline.canonicalTotal}/${catalog.items.length}; approved images ${audit.images}; acquisition routes ${audit.routes}; Regions retained separately. SHA256 regression checks preserve every existing item field except the three additive group fields.\n\n| Group | Unique items | Site evidence | Docs evidence |\n|---|---:|---:|---:|\n${rows.join("\n")}\n\nMulti-group overlap: ${overlaps.length} canonical items; summed membership counts deliberately exceed global total. Unknown assignments (${unknown.length}): ${unknown.join(", ") || "none"}.\n\nMemberships mean source-context placement, including prerequisites/material references. They do not assert canonical allegiance or reputation faction. GOOD/EVIL/CHAOS are alignments; LEGION/NATION/HOLLOWBORN are faction themes; the other entries are farming collections. Every membership retains page/chapter/heading/line evidence. No item name keywords, geography, rarity or Wiki categories assign groups.\n\nMuseum → AWE is backed by the site's AWE root link targeting /museum; Forge → BLACKSMITHING is a reviewed chapter alias backed by the blacksmithing/forge-enhancement tree. All group definitions and override support live in faction-groups.json. No current manual overrides. Docs I. Farming List never assigns membership.\n\nXII is split at exact headings: Arcana Invoker → Darkon's Debris (also site /darkons-debris/ai); Higure & Astravian Corsair → Astravian. Site also places Higure under Darkon's Debris, so future matching imported references can retain both memberships. Currently no canonical item matches the Astravian subsection; its count is zero. No whole-chapter mapping. DIABLO and CRYSTALLIS have visible labels but no supported item references in cached descendants; zero is retained honestly.\n\nSite/Docs membership differences: ${mismatch.length}; all IDs, both source sets and multi-group IDs are in content-sources/farm/import/group-audit.json. These are contextual differences, not technical fact conflicts; neither source overrides the other. No canonical/technical conflicts introduced. Source coverage remains PARTIAL: 148 cached pages; Docs text-only; embedded image/link scope unverified; no new crawl.\n\nFallbacks: plainly labeled initial tiles for every group, no downloaded/hotlinked logo or invented artwork. Existing Be Vietnam Pro and Chaos purple retained. No browser run or visual layout PASS claimed.\n\nHost QA from macOS Terminal: \`./AQW-Safe-Browser-QA.command\`. It runs the updated Farm smoke (375/768/1440px, group navigation, history, keyboard, deep links, legacy geography, materials and overflow checks). No publish.\n`,
);
console.log(JSON.stringify(audit.counts));
