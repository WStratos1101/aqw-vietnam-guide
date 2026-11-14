// Persisted evidence only. Never launches a browser or fetches sources.
import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const c = read("src/content/farm/catalog-v2.generated.json"),
  rows = read("content-sources/farm/import/detail-audit.json");
const checksPath = "artifacts/qa/farm/completion/checks.json";
const checks = fs.existsSync(checksPath) ? read(checksPath) : [];
const items = c.items,
  paths = (i) => i.acquisitionRoutes.flatMap((r) => r.guidePaths || []);
const snapshots = rows.filter((r) => r.completeWikiSnapshot).length;
const translated = items.filter((i) => i.wikiDetails?.descriptionVi).length;
const effects = items.filter(
  (i) => i.wikiDetails?.specialEffectsVi?.length,
).length;
const steppers = items.filter((i) => paths(i).length).length;
const detailed = items.filter((i) =>
  paths(i).some((p) => p.coverage !== "acquisition_only"),
).length;
const sourceGuides = items.filter((i) =>
  paths(i).some((p) => p.coverage === "source_walkthrough"),
).length;
const noDetailed = items.filter(
  (i) =>
    !paths(i).some(
      (p) => p.coverage === "source_walkthrough" || p.coverage == null,
    ),
);
const classes = items.filter((i) => i.category === "Classes"),
  roles = classes.filter((i) => i.classRoles.length);
const acquisitions = items.filter((i) => i.acquisitionBrief?.text).length;
const conflicts = read(
  "content-sources/farm/import/completion-source-conflicts.json",
);
const text = (v) =>
  String(v ?? "—")
    .replaceAll("|", "/")
    .replaceAll("\n", " ");
const table = (h, r) =>
  "| " +
  h.join(" | ") +
  " |\n|" +
  h.map(() => "---").join("|") +
  "|\n" +
  r.map((r) => "| " + r.map(text).join(" | ") + " |").join("\n");
const known = (k) =>
  items.filter((i) => {
    const v =
      i[k] != null && i[k] !== "" && i[k] !== "unknown"
        ? i[k]
        : i.wikiDetails?.[k === "level" ? "levelRequired" : k];
    return v != null && v !== "" && v !== "unknown";
  }).length;
const metrics = {
  items: items.length,
  routes: items.reduce((n, i) => n + i.acquisitionRoutes.length, 0),
  images: items.filter((i) => i.image).length,
  snapshots,
  partialSnapshots: rows.filter(
    (r) => r.hasWikiSnapshot && !r.completeWikiSnapshot,
  ).length,
  translations: translated,
  effects,
  acquisitionInfo: acquisitions,
  stepperItems: steppers,
  existingOrSourceGuideItems: detailed,
  vncollectorOrDocsGuideItems: sourceGuides,
  roleMapped: roles.length,
  classes: classes.length,
  browser: "UNVERIFIED / NOT RUN (sandbox launch prohibited)",
};
fs.writeFileSync(
  "artifacts/qa/farm/completion/metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
const status = (n, total) => (n === total ? "DONE" : "PARTIAL");
const pending = rows.filter((r) => !r.completeWikiSnapshot);
const report = `# FARM V3.1 DETAIL AUDIT — Completion recovery

2026-11-14 · package version **${read("package.json").version}**, unchanged. **PARTIAL — not FARM V3.1 COMPLETE.** No browser, push, deploy, Auto Publish, D1 or external-project mutation.

## Required baseline / current / remaining

${table(
  ["Hạng mục", "Baseline", "Hiện tại", "Còn thiếu", "Trạng thái"],
  [
    [
      "Canonical items",
      232,
      metrics.items,
      232 - metrics.items,
      status(metrics.items, 232),
    ],
    [
      "Acquisition routes",
      228,
      metrics.routes,
      228 - metrics.routes,
      status(metrics.routes, 228),
    ],
    [
      "Verified local images",
      33,
      metrics.images,
      items.length - metrics.images,
      "PARTIAL — 33 retained; 199 missing",
    ],
    [
      "Complete Wiki snapshots",
      224,
      snapshots,
      items.length - snapshots,
      "PARTIAL",
    ],
    [
      "Vietnamese descriptions",
      32,
      translated,
      items.length - translated,
      "DONE for available description text; Aureate evidence partial",
    ],
    [
      "Localized item effects",
      27,
      effects,
      "Not all items have effects",
      "PARTIAL — explicit Notes and descriptions reviewed, no set-wide inference",
    ],
    [
      "Useful acquisition information",
      6,
      acquisitions,
      items.length - acquisitions,
      "DONE for known method facts; availability/prerequisites may remain unknown",
    ],
    [
      "Items with stepper paths",
      6,
      steppers,
      items.length - steppers,
      "PARTIAL — includes single-step acquisition, not full walkthrough certification",
    ],
    [
      "Existing/source multi-step guide items",
      6,
      detailed,
      items.length - detailed,
      "PARTIAL — not every item needs a multi-step farm",
    ],
    [
      "Class Role",
      "20/23",
      roles.length + "/" + classes.length,
      classes.length - roles.length,
      "PARTIAL — all 23 checked; one lacks Codex evidence",
    ],
    [
      "Browser QA",
      "UNVERIFIED",
      "NOT RUN",
      "Host smoke required",
      "UNVERIFIED / sandbox execution prohibited",
    ],
  ],
)}

Counts refer to unique canonical items, never duplicate group memberships. 232 names, IDs, categories, source/group memberships, 228 original routes, original AND/OR recipes and 33 images remain protected by the pre-existing-field baseline hash test. New acquisitionBrief, detail/effect/role evidence and guidePaths are additive and separately tested. No existing route was fabricated to cover an item without routes.

## Snapshots and translation recovery

- All eight missing identities were investigated at their exact saved canonical URLs. Seven full item bodies were recovered through the web reader: Polly Roger, Original Drakath Armor, Chaorrupter Unlocked (Free Player), Exalted Apotheosis, Dual Exalted Apotheosis, Sin of the Abyss and Drago's Royal Guard. Footer/sidebar/menu boundaries are excluded by the offline normalizer. Evidence: snapshot-web-01.txt / snapshot-web-02.txt and detail-wiki-records.json.
- **Aureate Shield Aegis:** direct page and indexed-page open fail with redirect loop (400). The canonical search excerpt supplies identity, known Quest, description, rarity and Gold note; it is stored as **partial/search_index_excerpt**, never counted as a complete body. No retry or substitution with similar artwork/item. URL: https://aqwwiki.wikidot.com/aureate-shield-aegis . Search evidence: aureate-search-evidence.json.
- Original 32 translations preserved. Batches 01–03 add 64 each (192 cached descriptions); batch 04 adds eight recovered description texts, including the explicitly partial Aureate excerpt. All 232 entries bind canonical URL + SHA256 of the exact source text. New batches and merge-farm-translation-batch.mjs are rerunnable; mismatched source hashes fail closed. No source date was invented for an undated cache.
- ${effects} items now have localized explicit effects. Notes review added exact per-item XP/CP/Rep/Gold and monster-type bonuses, preserving combat/Quest-turn-in scope. “All tagged monsters” was corrected to Chaos / Dragon / Elemental / Human / Undead for Celestial Pirate Commander; it does **not** mean Damage to All. Corrections are retained in completion-corrections.json. Effect overrides contain exact source quotes and hashes; no bonus copied from a weapon to its armor/set.

## Farm guides / acquisition recovery

- ${sourceGuides} items have reviewed VNCollector/Google Docs source-line walkthroughs; five inherited Wiki-backed curated guide items remain. Original Legion Revenant paths are preserved. Total existing or source-guide coverage: ${detailed}; ${steppers - detailed} additional items have acquisition-only steppers. ${items.length - steppers} use a truthful short acquisition summary rather than a fabricated stepper.
- Reviewed guide batches: Chaorrupter Free; Burning Sword of Doom; Dark Lord; Necrotic Sword of the Abyss; Legion DragonBlade; Void Shogun / Spartan / Warlock rewards; Necrotic Blade of Doom and Underworld; LightCaster; Celestial Pirate Commander; Crimson Plate / Face Plate / DragonFire; Evolved Blood / Shadow; Arch Doomknight; Frost SpiritReaver Class and Cold Hearted cosmetics; Hollowborn Oblivion Blade; Void Light of Destiny; Dark Dragon Slayer's Halberd; Cyber Void Paladin rewards; Sepulchure's Original Helm; Dragon of Time; ArchFiend DoomLord.
- Google Docs **plain-text** evidence is used for Twisted Items of Nulgath and Flow like Blood / Reborn in the Dark Side. The pre-existing 545316-character Docs snapshot remains intact. This does not claim rich hyperlinks/tables/images or an embedded component was read. Previous connector/export failures were not retried.
- Different paths remain separate: SOH with/without SDKA, Void Essentia Drop vs Merge, Sacrifice BLoD vs ALoD, Hollowborn rare-weapon alternative. Intermediate recipes are distinguished from final requirements. Full-set turn counts are never applied to one chosen reward.
- Every item has a source-bound acquisition brief, including seven identities without an existing route. The UI renders these facts without inventing a route. A method being explicit does **not** certify its current availability, every prerequisite, every route or the whole item. Unknown dates/membership/requirements remain unknown.
- Quest reward alternatives are OR choices; malformed/multiline Wiki headers receive eight individually reviewed quote/hash overrides, not a broad guessed regex. Gold remains distinct from ACs; N/A Sellback never implies Free.
- Hollowborn rare alternative is **source_notes**, not a fully verified walkthrough: exact Quest name absent from retained source. Detailed YnR source work remains PENDING because the source's 4400 total conflicts with 444 per turn ×10.

## Role recovery

Beast Warrior → existing Warrior / Beast Warrior / Pumpkin Lord / Warlord Codex family through Wiki's explicit same-skills note; Infinity Titan → existing StoneCrusher / Infinity Titan family through the explicit skill-set relationship. Codex Role values are reused, not reclassified from a name, tier or calendar year. Each relationship stores exact quote/member/hash. Blood Sorceress has no matching Codex Role profile: **PENDING_SOURCE**, not copied from its different-gameplay upgrade Scarlet Sorceress. ${roles.length}/${classes.length} mapped, ${classes.length}/${classes.length} investigated.

## Core metadata now available

${table(
  ["Field", "Known now", "Still unknown"],
  ["level", "membership", "rarity", "availability"].map((k) => [
    k,
    known(k),
    items.length - known(k),
  ]),
)}

Level Required remains separate from Base Level; AC tags remain separate from AC purchase; item rarity remains separate from event availability. The cache often does not supply these fields. No defaults were used to make remaining counts zero.

## Conflicts / remaining evidence

${table(
  ["ID", "Status", "Decision / remaining"],
  conflicts.map((x) => [x.id, x.status, x.decision + " " + x.remaining]),
)}

- Conflict provenance and competing values: completion-source-conflicts.json. Golden Hanzo Wiki recipe retained per technical-source priority; guide recipe omitted rather than silently copied. Historical recipe/version date still unproven.
- Full snapshot PENDING: ${pending.map((r) => r.id).join(", ")}.
- Role PENDING: ${classes
  .filter((i) => !i.classRoles.length)
  .map((i) => i.id)
  .join(", ")}.
- Rich Docs scope BLOCKED from retained native/export failure evidence; no new access success claimed. Existing VNCollector embedded diagrams remain unverified where not present in plain text. All 199 missing image assets remain unverified; no image replaced or guessed. Region remains secondary location information, not primary navigation.
- ${noDetailed.length} items still lack an existing/source-backed full walkthrough. Their short acquisition information is available; whether further details apply is **PENDING_SOURCE** review, not DONE. IDs below.

Repeated Wiki header labels remain recorded: ${rows.filter(r=>r.conflicts.length).map(r=>r.id+' ('+r.conflicts.join(', ')+')').join('; ')}. Ambiguous flattened recipe fields stay unset in details; original reviewed recipes remain intact.

## UI / regression

Sources tab and redundant Wiki cards remain removed; provenance stays internal. Numbered stepper shows one selected step, has Prev/Next, keyboard tab control, per-path completion and resets item/route/path. Short acquisition paths and source-notes paths are visibly distinguished. Multi-group counts, Class roles, existing material expansion/return navigation, URL state/history and image fallbacks remain covered by DOM/semantic tests.

Faction selector is outside the inventory element hidden on mobile detail, so AWE → GOOD remains reachable in source layout. Host-only smoke explicitly asserts its visibility, focus, Enter selection and history; no hidden-button skip was added. Updated smoke viewports: 375/768/1024/1440px. This is not a visual PASS.

## Checks

${table(
  ["Command", "Exit", "Evidence"],
  checks.map((r) => [r.command, r.exit, r.log]),
)}

Browser QA: **UNVERIFIED / NOT RUN; BROWSER_QA_BLOCKED in Codex by the explicit no-browser rule.** No Chromium/WebKit process or screenshot was produced. Run independently on macOS: \`./AQW-Safe-Browser-QA.command\` (Chromium). Package lint is the project's focused lint script, not a claimed standalone ESLint run. Build warnings and generated diff must be inspected separately from unit PASS. No publication is authorized in this session.

## Files / reproducibility

- Source pipeline: scripts/build-farm-v2.mjs; scripts/lib/farm-acquisition-instructions.mjs; farm-class-media.mjs; recover-farm-web-details.py; merge-farm-translation-batch.mjs; expand-farm-source-guides*.py; review-farm-acquisition-briefs.py; report-farm-v3-1.mjs.
- Retained evidence: detail-wiki-records / detail-review-batch / detail-translations / translation-batches / effect-overrides / class-role-overrides / acquisition-brief-overrides / guide-overrides / completion-corrections / completion-source-conflicts / detail-audit; generated catalog.
- UI/types: FarmGuide.tsx, FarmV2Route.tsx, farm-v2.ts. Earlier V3.1 FarmWikiInfo/CSS/shared-role changes remain preserved.
- Tests: farm-details-v3-1 / farm-groups / farm-v2-interactions; host-only qa-farm viewport coverage. Logs and metrics are in artifacts/qa/farm/completion/.
- Current audit, FARM_DATA_AUDIT, FARM_V2_COMPLETION_REPORT and focus checkpoint/matrix. Existing unrelated dirty files and QA Guard backups retained.

## Full item inventory / remaining walkthrough review

${table(
  [
    "Canonical ID",
    "Snapshot",
    "Description VI",
    "Effects VI",
    "Guide coverage",
    "Acquisition",
    "Roles",
  ],
  items.map((i) => [
    i.id,
    i.wikiDetails?.evidence.snapshotStatus || "cached",
    !!i.wikiDetails?.descriptionVi,
    i.wikiDetails?.specialEffectsVi?.length || 0,
    [
      ...new Set(paths(i).map((p) => p.coverage || "existing_source_guide")),
    ].join(", ") || "brief_only",
    i.acquisitionBrief?.kind,
    i.category === "Classes"
      ? i.classRoles.join(", ") || "PENDING_SOURCE"
      : "—",
  ]),
)}

Remaining source-walkthrough review: ${noDetailed.map((i) => i.id).join(", ")}.
`;
fs.writeFileSync("FARM_V3_1_DETAIL_AUDIT.md", report);
console.log(metrics);
