import fs from "node:fs";
import zlib from "node:zlib";
const read = (p) => JSON.parse(fs.readFileSync(p));
const catalog = read("src/content/classes/catalog.json"),
  acquisition = read("src/content/classes/acquisition.json"),
  checks = read("artifacts/qa/v12-4/checks.json"),
  registry = read("src/content/classes/skill-registry.json");
const darkon = read("artifacts/qa/darkon/results.json"),
  classesQa = read("artifacts/qa/classes/results.json"),
  diagnostics = read("artifacts/qa/diagnostics/results.json");
const records = catalog.map((c) => ({
    profile: c,
    record: acquisition.classes[c.id],
    body: read("public" + c.bodyUrl),
  })),
  methods = records.flatMap((r) => r.record.methods);
const types = ["shop", "quest", "merge", "drop", "other"];
const esc = (s) =>
  String(s ?? "—")
    .replaceAll("|", "/")
    .replaceAll("\n", " ");
const metrics = {
  version: "0.1.0",
  profiles: catalog.length,
  tabUI: catalog.length,
  profilesWithVerifiedMethod: records.filter((r) =>
    r.record.methods.some((m) => m.verificationStatus === "verified"),
  ).length,
  profilesWithAllDiscoveredDetailsReviewed: records.filter(
    (r) => r.record.reviewStatus === "reviewed",
  ).length,
  profilesWithPendingDetails: records.filter(
    (r) => r.record.reviewStatus === "partial",
  ).length,
  methods: methods.length,
  methodsWithCompleteLinkedDetails: methods.filter(
    (m) => m.detailsStatus === "complete",
  ).length,
  methodsWithPendingDetails: methods.filter(
    (m) => m.detailsStatus === "partial",
  ).length,
  multipleMethods: records.filter((r) => r.record.methods.length > 1).length,
  unresolvedPages: records.flatMap((r) => r.record.issues).length,
  byType: Object.fromEntries(
    types.map((type) => [
      type,
      {
        profiles: records.filter((r) =>
          r.record.methods.some((m) => m.type === type),
        ).length,
        methods: methods.filter((m) => m.type === type).length,
      },
    ]),
  ),
  legacyMethods: methods.filter((m) => m.isAvailable === false).length,
  seasonalMethods: methods.filter((m) => m.availability === "seasonal").length,
  storedSkills: records.reduce((n, r) => n + r.body.skills.length, 0),
  runtimeSkills: records.reduce(
    (n, r) => n + r.body.skills.filter((s) => !s.quarantined).length,
    0,
  ),
  verifiedIntegratedIcons: records.reduce(
    (n, r) =>
      n +
      r.body.skills.filter(
        (s) => !s.quarantined && s.iconAsset?.verificationStatus === "verified",
      ).length,
    0,
  ),
  portraits: read("src/content/classes/portraits.json").length,
  quarantined: registry.skills.filter((s) => s.quarantined).length,
  invalidIconMappings: read("artifacts/qa/class-icon-validation.json")
    .invalidMappings,
  browser: {
    darkon: darkon.status,
    classes: classesQa.status,
    screenshots: darkon.screenshots.length + classesQa.screenshots.length,
  },
};
fs.writeFileSync(
  "artifacts/qa/v12-4/completion-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
const after = fs
  .readdirSync("dist/assets")
  .filter((n) => n.endsWith(".js"))
  .map((name) => {
    const b = fs.readFileSync("dist/assets/" + name);
    return { name, bytes: b.length, gzip: zlib.gzipSync(b).length };
  });
fs.writeFileSync(
  "artifacts/qa/v12-4/bundle-after.json",
  JSON.stringify(after, null, 2) + "\n",
);
const checkTable =
  "| Check | Status | Tests | Evidence |\n| --- | --- | ---: | --- |\n" +
  checks.checks
    .map((c) => `| ${c.name} | ${c.status} | ${c.tests ?? "—"} | ${c.log} |`)
    .join("\n");
const coverage =
  "| Type | Profiles | Methods, including variants/locations |\n| --- | ---: | ---: |\n" +
  types
    .map(
      (t) =>
        `| ${t} | ${metrics.byType[t].profiles} | ${metrics.byType[t].methods} |`,
    )
    .join("\n");
const perClass =
  "| Class / group | Shop | Quest | Merge | Drop | Other | Pending fields/pages |\n| --- | ---: | ---: | ---: | ---: | ---: | --- |\n" +
  records
    .map(
      (r) =>
        `| ${esc(r.profile.name)} | ${types.map((t) => r.record.methods.filter((m) => m.type === t).length).join(" | ")} | ${r.record.reviewStatus === "partial" ? "Yes" : "None in discovered methods"} |`,
    )
    .join("\n");
const issues =
  "| Class ID | Source | Reason |\n| --- | --- | --- |\n" +
  records
    .flatMap((r) =>
      r.record.issues.map(
        (i) => `| ${r.profile.id} | ${i.source} | ${esc(i.reason)} |`,
      ),
    )
    .join("\n");
const pending = records
  .filter((r) => r.record.reviewStatus === "partial")
  .map((r) => r.profile.id)
  .join(", ");
const report = `# V12.4 — Tactical UI & Class Acquisition\n\nVersion **0.1.0**. Review date: 2026-11-09. Only this project was changed; no push/deploy.\n\n## Darkon\n\n- Kept the source-backed phase engine, canonical attacks, damage formats and timings. Four manual phases still default to Overture. Rush keeps remaining Aria effects.\n- Replaced Class accordions with desktop Tactical Overview / Team Formation. Each source team has exactly four player positions; StoneCrusher/Infinity Titan and other alternatives share a position. Team and Class selection do not reset phase; phase changes retain the team.\n- Selected Class displays phase-specific assignment, sourced rotation, existing verified skill icons when exact slot identity resolves, enhancement and source link. Unresolved PCM/ambiguous slot icons stay explicit; no new game art or rotation is invented.\n- Focus/Taunt is a compact panel with icons and a sequence. Docs two-main-taunter strategy and Site three-support strategy remain distinct. Vainglory source conflict remains visible.\n- Global Encounter Timeline: The Cycle's End **every 30s**, End of the World **270s** (3s cast), Curtain Call **273s**. Tooltip descriptions retain meaning. It is static reference, independent of phase selection.\n- Removed duplicate standalone teams/taunt blocks for Darkon, old accordion wrappers and unnecessary phase minimum height. Other Boss UI remains shared.\n\n## Class tabs and acquisition\n\nAll **${metrics.tabUI}/113** Class routes use the same Character Inspection tabs: Skills (default), Combo, Acquisition. ARIA relationships, roving tab focus, Arrow/Home/End and native Enter/Space are supported. Inactive panels are hidden and inert, preserving selected skill and progress. Combo uses sourced sequences and existing icons.\n\nAcquisition is a separate typed registry attached to lazy-loaded per-Class bodies. Shop prices come only from exact **Price** fields, never Sellback/defaults; AC/Gold remain distinct and 0 AC is preserved with source prerequisites. Shop names require an observed Shop link or linked-page shop evidence. Canonical Class/variant equality prevents generic Warrior or DoomKnight prices leaking into unrelated Classes; Character Creation is separate from purchase. Base item level is separate from purchase level.\n\nQuest panels bind the exact named source disclosure, its prerequisites, required materials, reward and explicit preceding-quest chain. LoO has 10 source quest steps; Legion Revenant has four Fealty steps. Existing progress IDs are reused when every source quest has a matching curated title. A curated unlock route is attached only when this exact method names its quest prerequisite (for example ArchPaladin 0 AC); the AC alternative does not inherit it.\n\nMerge panels keep final direct materials separate from intermediate acquisition dependencies. AND/OR are structural groups, ambiguous scope is pending without a fabricated checklist. Long materials are collapsed. Method-specific progress survives Shop/Quest/Merge and main-tab switching. Generic currency/package icons are illustrative, not claimed official game art.\n\n## Coverage and limits\n\n**${metrics.profilesWithVerifiedMethod}/113** profiles have at least one source-identified acquisition method. This is **not** a declaration that all methods/prerequisites are fully verified. **${metrics.profilesWithAllDiscoveredDetailsReviewed}** profiles have no outstanding fields among discovered methods; **${metrics.profilesWithPendingDetails}** retain pending details/variant pages. There are **${metrics.methods}** separate methods (${metrics.methodsWithCompleteLinkedDetails} with complete parsed linked details, ${metrics.methodsWithPendingDetails} partial); **${metrics.multipleMethods}** profiles have alternatives. **${metrics.unresolvedPages}** candidate pages remain unresolved.\n\n${coverage}\n\nLegacy methods: ${metrics.legacyMethods}; seasonal/conditional: ${metrics.seasonalMethods}. Legacy is explicitly unavailable; seasonal status does not assert the event is open today. Wiki availability is source-declared, not live account/shop verification. No exhaustive per-account eligibility claim. Missing fields stay missing.\n\nIntermediate items: content-sources/class-acquisition/merge-dependencies.json records both verified and pending source outcomes. Only directly observed item links are followed; intermediate recipes are never flattened into the final recipe.\n\nPreserved: **${metrics.profiles} profiles, ${metrics.portraits} portraits, ${metrics.runtimeSkills} runtime skills/icons**, ${metrics.storedSkills} stored records including ${metrics.quarantined} quarantined originals. Invalid published mappings: ${metrics.invalidIconMappings}. No portrait/icon bytes or identity mapping deliberately replaced.\n\n## Checks\n\n${checkTable}\n\n## Browser evidence\n\nDarkon: **${darkon.status}**, ${darkon.cases.length} executed cases, ${darkon.screenshots.length} screenshots. Classes: **${classesQa.status}**, ${classesQa.cases.length} executed cases, ${classesQa.screenshots.length} screenshots. DOM tests pass; responsive layout, contrast and visual acceptance are **pending**, not passed.\n\n${diagnostics.attempts.map((a) => `- ${a.name}: ${a.status}; ${a.cause || "—"}; executable exists=${a.exists}, executable permission=${a.executablePermission}.`).join("\n")}\n\nChromium logs contain MachPortRendezvous bootstrap Permission denied (1100). WebKit exits Abort trap 6. Localhost responds; binaries exist. No sandbox bypass or browser reinstall was used. Raw evidence: artifacts/qa/diagnostics/results.json and artifacts/qa/{darkon,classes}/results.json.\n\nRun outside Codex in normal macOS Terminal:\n\n\x60\x60\x60sh\ncd /Users/wstratos/Desktop/Project/aqw-vietnam-guide\nnpm run qa:diagnose\nnpm run qa:darkon\nnpm run qa:classes\nnpm run qa:report\n\x60\x60\x60\n\nRunners cover 375/768/1440/1920 and both themes; Class runner inspects all 113 skill routes and screenshots six representative Classes across all main tabs. Review actual screenshots after a successful run. Scripts resolve routes from the catalog and write results inside artifacts/qa. Browser binaries already exist under .playwright-browsers.\n\n## Per-Class acquisition review\n\nCounts include source variants/locations, not extra mandatory steps.\n\n${perClass}\n\n## Unresolved candidate sources\n\n${issues}\n\nProfiles still needing some detail review: ${pending}. Details of each partial method (including failed linked sources and unparsed recipe scope) remain in src/content/classes/acquisition.json under evidence.issues.\n\n## Reproducibility and bundle\n\n- Online refresh: npm run content:class-acquisition. Verified snapshots are reused; each batch saves.\n- Offline rebuild: npm run build attaches the local acquisition registry; no source network dependency in production build.\n- Parser tests cover Price/Sellback, zero AC, currencies, exact quest binding and AND/OR; semantic tests cover all profiles, evidence hashes, method IDs, recipes and source regressions. DOM tests cover tabs, persistence, team/phase selection and icon identity.\n- V12.1 bundle baseline: artifacts/qa/bundle-after.json; current: artifacts/qa/v12-4/bundle-after.json. Largest shared chunk was already ~940 KB; current largest is ${Math.max(...after.map((a) => a.bytes))} bytes. Main index changed from ~705692 bytes to ${after.find((a) => a.name.startsWith("index-"))?.bytes} bytes. Acquisition stays in per-Class JSON, not the initial home bundle. Vite still warns about existing large shared chunks; further extraction is open.\n`;
fs.writeFileSync("V12_4_UI_ACQUISITION_REPORT.md", report);
function prepend(file, text) {
  const old = fs
    .readFileSync(file, "utf8")
    .replace(/<!-- V12\.4 START -->[\s\S]*?<!-- V12\.4 END -->\n\n/, "");
  fs.writeFileSync(
    file,
    "<!-- V12.4 START -->\n" + text + "\n<!-- V12.4 END -->\n\n" + old,
  );
}
prepend(
  "DARKON_PHASE_AUDIT.md",
  `# V12.4 current UI status\n\nSource engine/data unchanged. Tactical Overview, four-slot Team Formation with alternatives, selected Class phase rotation, compact Focus/Taunt and static 30/270/273s timeline replace old strategy accordions. DOM tests prove team/class selection retains phase and phase changes retain team. Browser status **${darkon.status}**, screenshots ${darkon.screenshots.length}; layout/visual QA pending. See [current report](V12_4_UI_ACQUISITION_REPORT.md). The V12/V12.1 sections below are retained historical evidence; their Team Card wording is superseded.\n\n${checkTable}`,
);
prepend(
  "CLASS_COMPLETION_AUDIT.md",
  `# V12.4 current Class UI and acquisition status\n\nAll ${metrics.profiles} profiles now use real Skills/Combo/Acquisition tabs; inactive panels are hidden/inert. Shared Shop/Quest/Merge UI, exact Price/currency fields, quest chains, structural AND/OR and scoped progress are integrated. ${metrics.profilesWithVerifiedMethod} profiles have a source-identified method; ${metrics.profilesWithPendingDetails} still have incomplete method/variant details. This is not full acquisition completion.\n\n${coverage}\n\nMethods: ${metrics.methods}; alternative-method profiles: ${metrics.multipleMethods}; unresolved candidate pages: ${metrics.unresolvedPages}. Current browser status **${classesQa.status}**, screenshots ${classesQa.screenshots.length}. Current per-Class coverage, incomplete sources and checks: [V12.4 report](V12_4_UI_ACQUISITION_REPORT.md). Old generic acquisition/anchor-action descriptions below are historical and superseded.`,
);
prepend(
  "CLASS_SKILL_IMAGE_AUDIT.md",
  `# V12.4 asset preservation check\n\n${metrics.profiles} profiles, ${metrics.portraits} portraits, ${metrics.runtimeSkills} runtime skills and ${metrics.verifiedIntegratedIcons} verified/integrated icons retained. ${metrics.quarantined} old records remain quarantined, stored total ${metrics.storedSkills}. Invalid mappings ${metrics.invalidIconMappings}; asset validation passed. V12.4 reuses the registry in Class tabs, combo and Darkon rotation; no replacement icon set. Browser loading/visual verification remains **${classesQa.status}**, ${classesQa.screenshots.length} screenshots. [Current report](V12_4_UI_ACQUISITION_REPORT.md).`,
);
console.log(metrics);
