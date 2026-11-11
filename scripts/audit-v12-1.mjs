import fs from "node:fs";
import zlib from "node:zlib";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8")),
  write = (p, v) => fs.writeFileSync(p, v),
  esc = (s) =>
    String(s ?? "—")
      .replaceAll("|", "/")
      .replaceAll("\n", " ");
const catalog = read("src/content/classes/catalog.json"),
  registry = read("src/content/classes/skill-registry.json"),
  portraits = read("src/content/classes/portraits.json"),
  validation = read("artifacts/qa/class-icon-validation.json"),
  checks = read("artifacts/qa/checks.json"),
  diagnostics = read("artifacts/qa/diagnostics/results.json"),
  darkon = read("artifacts/qa/darkon/results.json"),
  classQa = read("artifacts/qa/classes/results.json");
const original = registry.skills.filter((s) => !s.supplemental),
  verified = registry.skills.filter((s) => s.verificationStatus === "verified"),
  baselineVerified = original.filter(
    (s) => s.verificationStatus === "verified",
  ),
  quarantined = original.filter((s) => s.quarantined),
  added = verified.filter((s) => s.supplemental),
  addedPassives = added.filter((s) => s.passive),
  addedActives = added.filter((s) => !s.passive);
const rows = catalog.map((c) => {
  const b = read("public" + c.bodyUrl),
    records = registry.skills.filter((s) => s.classId === c.id);
  return {
    c,
    b,
    records,
    runtime: b.skills.filter((s) => !s.quarantined),
    icons: b.skills.filter(
      (s) => s.iconAsset?.verificationStatus === "verified",
    ),
    old: records.filter((s) => !s.supplemental),
    pending: records.filter((s) => s.verificationStatus !== "verified"),
    portrait: portraits.some((p) => p.id === c.image),
    detailedObtain: b.obtainSteps.length > 1,
    combosPending: b.combos.filter(
      (x) => x.verificationStatus === "needs_review",
    ).length,
  };
});
const total = rows.reduce((n, r) => n + r.b.skills.length, 0),
  runtime = rows.reduce((n, r) => n + r.runtime.length, 0),
  integrated = rows.reduce((n, r) => n + r.icons.length, 0),
  missingRuntime = rows.reduce(
    (n, r) => n + r.runtime.filter((s) => !s.iconAsset).length,
    0,
  ),
  dataPending = rows.filter(
    (r) => r.pending.length || r.combosPending || !r.detailedObtain,
  );
const after = fs
  .readdirSync("dist/assets")
  .filter((n) => n.endsWith(".js"))
  .map((name) => {
    const b = fs.readFileSync("dist/assets/" + name);
    return { name, bytes: b.length, gzip: zlib.gzipSync(b).length };
  });
write("artifacts/qa/bundle-after.json", JSON.stringify(after, null, 2) + "\n");
const before = read("artifacts/qa/bundle-before.json");
const sizeTable = (a) =>
  a
    .map(
      (x) =>
        `| ${x.name} | ${(x.bytes / 1024).toFixed(1)} | ${(x.gzip / 1024).toFixed(1)} |`,
    )
    .join("\n");
const checkTable = checks.checks
  .map((c) => `| ${c.name} | ${c.status} | ${c.tests ?? "—"} | ${c.log} |`)
  .join("\n");
const metrics = {
  version: "0.1.0",
  classProfiles: catalog.length,
  uiUpgraded: catalog.filter((c) => c.codexVersion === "12.1").length,
  originalSkills: original.length,
  originalSkillsReviewed: original.length,
  originalVerified: baselineVerified.length,
  originalIntegrated: baselineVerified.length,
  originalUnresolved: original.length - baselineVerified.length,
  quarantinedLegacy: quarantined.length,
  addedPassives: addedPassives.length,
  addedCurrentActives: addedActives.length,
  totalStoredSkillRecords: total,
  runtimeSkills: runtime,
  verifiedRuntimeIcons: verified.length,
  integratedRuntimeIcons: integrated,
  missingRuntimeIcons: missingRuntime,
  uniqueIconAssets: new Set(verified.map((s) => s.iconAssetId)).size,
  invalidMappings: validation.invalidMappings,
  portraits: rows.filter((r) => r.portrait).length,
  unclassifiedRoles: catalog.filter((c) => !c.role.length).length,
  detailedAcquisitionProfiles: rows.filter((r) => r.detailedObtain).length,
  browserDarkon: darkon.status,
  browserClasses: classQa.status,
};
write(
  "artifacts/qa/completion-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
const checklist = `| Check | Result | Tests | Log |\n| --- | --- | ---: | --- |\n${checkTable}`;
write(
  "CLASS_SKILL_IMAGE_AUDIT.md",
  `# Class Skill Image Audit — V12.1\n\nVersion 0.1.0. Source review: 2026-11-09.\n\nAll **${original.length} original imported records** were reviewed. **${baselineVerified.length}** retain verified and integrated icons; **${quarantined.length}** old/mis-grouped records are quarantined rather than given an incorrect image. This is not a claim that all 604 original records have valid current icons.\n\n## Metrics\n\n| Metric | Count |\n| --- | ---: |\n| Class profiles/groups | ${catalog.length} |\n| Original imported skills reviewed | ${original.length} |\n| Original skills with verified/integrated icons | ${baselineVerified.length} |\n| Original records still needing manual identity/version review | ${quarantined.length} |\n| Original records missing an approved current mapping | ${original.length - baselineVerified.length} |\n| Added, verified Passive/Rank Passive records | ${addedPassives.length} |\n| Added, verified current Active records | ${addedActives.length} |\n| Total stored records including quarantine | ${total} |\n| Current runtime skill records | ${runtime} |\n| Current runtime skills with verified icons | ${verified.length} |\n| Current runtime skills with integrated icons | ${integrated} |\n| Current runtime skills missing icons | ${missingRuntime} |\n| Unique icon image files used | ${metrics.uniqueIconAssets} |\n| Invalid published icon mappings detected | ${validation.invalidMappings} |\n\nThe ${addedPassives.length}+${addedActives.length} supplemental records are reported separately; they do not inflate the original 604 denominator. Shared Auto Attack and Passive icons are valid only when the exact named source disclosure includes that image. One previously name-matched duplicate Auto Attack in the extra Dragonslayer set was removed from verified runtime use because a common name alone did not establish Class identity.\n\n## Verification and usage\n\n- Registry: src/content/classes/skill-registry.json. Each mapping has Class ID, stable Skill ID, official name, source page/hash, exact named-block image URL, asset ID, usage status and evidence.\n- Source snapshots and parsed skill blocks: content-sources/class-wiki/. This pipeline matches normalized names in named Wiki skill disclosures, never global image position. Canonical spelling corrections are limited to the two explicit, source-reviewed entries in name-corrections.json.\n- All public icon paths are under public/images/aqw/class-skills/. Raster headers/dimensions and SHA-256 are checked. PNG, GIF and lossless/extended WebP are recognized by bytes; five Goat icons whose .png URLs returned WebP are saved with their actual .webp format.\n- Sources: [Class index](https://aqwwiki.wikidot.com/classes), [Classes Skills](https://aqwwiki.wikidot.com/classes-skills), and each exact Class/variant source URL in the manifest. Alternate variant pages are matched independently; identical skills are not assumed from a shared group label. Wiki-declared same-skill variant relations are retained in the registry.\n- Usage basis: [Artix Brand and IP Use](https://www.artix.com/community/brand-and-assets-usage/), for a noncommercial discussion/fan guide with copyright credits, Artix/AQ.com links and no endorsement claim. Wiki text CC BY-SA is not treated as the image licence. Class Detail and the site footer provide the credit/links.\n- Batches save after each pair and validate after each batch. Verified local files are reused. Unavailable pages/assets are recorded without stopping subsequent Classes.\n- Automated checks prove source-block association and local integrity. They do not prove combat execution or a visual review of every raster. Representative VHL/LR/LoO/CAv portraits and VHL/LR icons were opened directly; real page screenshots remain pending.\n\n## Per profile\n\n| Class / group | Original records | Original verified | Supplemental records integrated | Runtime icons | Quarantined/pending |\n| --- | ---: | ---: | ---: | ---: | ---: |\n${rows.map((r) => `| ${esc(r.c.name)} | ${r.old.length} | ${r.old.filter((s) => s.verificationStatus === "verified").length} | ${r.records.filter((s) => s.supplemental && s.verificationStatus === "verified").length} | ${r.icons.length} | ${r.pending.length} |`).join("\n")}\n\n## Remaining original records\n\nThese are retained as audit data, excluded from the RPG ability bar, and have no runtime icon. Current independently sourced replacement abilities are separate records; keyboard slots are not inferred from HTML position.\n\n| Class ID | Legacy Skill ID | Imported name | Reason |\n| --- | --- | --- | --- |\n${quarantined.map((s) => `| ${s.classId} | ${s.skillId} | ${esc(s.importedName)} | ${esc(s.issue)} |`).join("\n")}\n\nValidation: artifacts/qa/class-icon-validation.json. Browser interaction/image-loading acceptance: **${classQa.status}**, ${classQa.screenshots.length} screenshots. DOM interaction tests passed, but do not replace browser layout checks.\n`,
);
write(
  "CLASS_COMPLETION_AUDIT.md",
  `# Class Completion Audit — V12.1\n\nVersion 0.1.0. Audit: 2026-11-09.\n\n**UI rollout: ${metrics.uiUpgraded}/${catalog.length} profiles. Data review is not equivalent to complete visual/content acceptance.** Browser failure no longer gates Phase B, following the user's explicit V12.1 instruction.\n\n## Delivered\n\n- Compact RPG Class Selection grid, real portraits, role icons, accent-insensitive search, role filters, pagination, hover/focus and reduced-motion rules.\n- Shared Character Inspection hero/actions and icon-based Active/Passive/Rank Passive selection for all 113 routes. One selected panel updates identity, icon, cost, cooldown, rank, target, effects and source. State-dependent official combined names stay combined.\n- 113/113 Class portraits have source-identified, validated local files. Source selection uses exact Class artwork tabs or the sole non-skill artwork on that Class page. No unrelated armor replacement was invented.\n- Roles are curated where existing source metadata was present; other role labels are explicitly editorial inferences from verified target/attack/healing/ally/taunt effects. They are not official rankings. Evidence: artifacts/qa/class-role-evidence.json.\n- Existing verified community combos are retained. Explicit source Combo paragraphs supply sequences for other profiles; each step can inspect a real skill. Rotations whose old numeric slots cannot be reconciled with current skills are marked needs_review and do not show an invented current icon sequence.\n- Acquisition uses compact quest timeline/details and persisted per-Class progress. Existing detailed questlines remain. Other profiles show source-backed shop/price/material summaries; multiple listed locations are labelled alternatives, never a mandatory chain.\n- ${quarantined.length} imported old/unmatched records are quarantined and visible only in an audit disclosure. This includes the extra 25-record ECM set and extra 5-record Dragonslayer set. Current abilities absent from imports and missing passives are added independently.\n- Costs/cooldowns with conditional source values remain strings rather than becoming the first integer. VHL Shackle/Unshackle keep their actual distinct source slots; their auras replace each other, not the skill keys.\n\n## Counts\n\n- Profiles with updated UI: ${metrics.uiUpgraded}; without UI rollout: ${catalog.length - metrics.uiUpgraded}.\n- Original imported records reviewed: ${original.length}; verified original icon mappings: ${baselineVerified.length}; quarantined originals: ${quarantined.length}.\n- Added passives: ${addedPassives.length}; added current actives: ${addedActives.length}. Stored total: ${total}; playable/inspectable current skill records: ${runtime}.\n- Verified/integrated current icons: ${integrated}; missing current runtime icons: ${missingRuntime}; original 604 records without approved mapping: ${original.length - baselineVerified.length}.\n- Detailed acquisition questlines: ${metrics.detailedAcquisitionProfiles}; other profiles use Wiki shop/merge/location summaries, not full farming walkthroughs.\n\n## Limits still open\n\n- Browser screenshots, real overflow checks and dark/light visual review remain pending because browser launch is blocked in this Codex environment.\n- Quarantined original records require manual version/Class-boundary reconciliation; they are not counted as completed icon work.\n- Some added passive descriptions retain a short Vietnamese summary with the full current English Wiki text in the source disclosure; complete Vietnamese localization remains editorial work.\n- Keyboard slots for new current abilities are shown only if the named original source explicitly declares the slot. A dash means not yet verified.\n- Alternative group members are not universally certified equivalent; exact matched variant source is retained per skill.\n- Generic acquisition summaries are not complete quest walkthroughs. No new rotations were invented to fill missing contexts.\n\n## Per-profile coverage\n\n| Class / group | Current active | Passive / rank | Icons | Portrait | Roles | Acquisition | Legacy records pending |\n| --- | ---: | ---: | ---: | --- | --- | --- | ---: |\n${rows.map((r) => `| ${esc(r.c.name)} | ${r.runtime.filter((s) => !s.passive).length} | ${r.runtime.filter((s) => s.passive).length} | ${r.icons.length} | ${r.portrait ? "Local, source verified" : "Pending"} | ${r.c.role.join("/")} | ${r.detailedObtain ? "Quest timeline" : "Wiki summary timeline"} | ${r.pending.length} |`).join("\n")}\n\n## Validation\n\n${checklist}\n\nBrowser: ${classQa.status}, ${classQa.cases.length} cases executed, ${classQa.screenshots.length} screenshots. External runner: scripts/qa-classes.mjs; instructions: docs/V12_1_EXTERNAL_QA.md. No visual pass is claimed.\n\nDesign: local Taste skill, True-black flat, seed 194819239; existing bronze/dark and light tokens retained. RPG portraits/ability slots/timeline follow the user's requested structure. No redesign of Darkon logic and no claims of a final screenshot score.\n`,
);
const summary = `# V12.1 Browser Recovery and Class Codex\n\nVersion **0.1.0** retained. All deliberate file changes are inside aqw-vietnam-guide; no push or deploy.\n\n## Browser diagnosis\n\nPlaywright ${diagnostics.playwright}; ${diagnostics.platform}/${diagnostics.arch}, OS kernel ${diagnostics.os}. Install/run path is consistently .playwright-browsers inside the project. Binaries exist and executable permission checks passed. The dev server passed connectivity checks.\n\n| Attempt | Binary exists | Executable permission | Result | Observed cause |\n| --- | --- | --- | --- | --- |\n${diagnostics.attempts.map((a) => `| ${a.name} | ${a.exists} | ${a.executablePermission} | ${a.status} | ${a.cause || "—"} |`).join("\n")}\n\nChromium fails at macOS Mach bootstrap registration: bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100), followed by SIGTRAP. This establishes an OS/process-policy denial inside this Codex session, not a missing browser or unavailable localhost. The external Terminal comparison is still needed to isolate sandbox policy from broader host policy.\n\nWebKit exits before any page with Abort trap: 6 (exit 134). The available log proves a process crash; it does not establish an incompatible executable or prove the same cause as Chromium. No unsupported root-cause claim is made.\n\nTried: reuse/move existing WebKit into project path; install Chromium/headless shell once into that same path; inspect paths/permissions; launch Chromium headed and headless and WebKit headless; confirm temporary local Vite server connectivity. No browser sandbox disable flag or Codex bypass mode was used; Chromium launches with chromiumSandbox:true. No Full Disk Access request.\n\n## External QA\n\nRun from ordinary macOS Terminal:\n\n\`\`\`sh\ncd /Users/wstratos/Desktop/Project/aqw-vietnam-guide\nnpm run qa:install\nnpm run qa:diagnose\nnpm run qa:darkon\nnpm run qa:classes\n\`\`\`\n\nRunner automatically starts its own dev server on a free port, or uses AQW_QA_URL. Routes come from current catalogs. Results distinguish not_run, failed, passed and browser_launch_blocked; no passed result or screenshot is fabricated. See docs/V12_1_EXTERNAL_QA.md.\n\n- Darkon: **${darkon.status}**, ${darkon.cases.length} executed contexts, ${darkon.screenshots.length} screenshots. scripts/qa-darkon.mjs covers four phases, Stats/Active/Passive, residual Aria, team strategy, console, images, overflow, themes and four widths.\n- Class browser: **${classQa.status}**, ${classQa.cases.length} executed cases, ${classQa.screenshots.length} screenshots. scripts/qa-classes.mjs covers Directory, six representatives at four widths/two themes and all Class routes/skill selection.\n- Phase A: model/DOM/semantic/build checks pass; real-browser acceptance pending. Phase B was explicitly allowed to proceed under V12.1. Darkon was not rewritten.\n\n## Class delivery and honest icon metrics\n\n| Metric | Result |\n| --- | ---: |\n| UI-updated Class profiles | ${metrics.uiUpgraded}/${catalog.length} |\n| Profiles without UI rollout | ${catalog.length - metrics.uiUpgraded} |\n| Local source-verified portraits | ${metrics.portraits}/${catalog.length} |\n| Original skills examined | ${original.length} |\n| Original icon mappings verified/integrated | ${baselineVerified.length} |\n| Original records without approved mapping | ${original.length - baselineVerified.length} |\n| Original records quarantined | ${quarantined.length} |\n| Added current active records | ${addedActives.length} |\n| Added Passive/Rank Passive records | ${addedPassives.length} |\n| Stored records including quarantine | ${total} |\n| Runtime current skills | ${runtime} |\n| Verified/integrated runtime icons | ${integrated} |\n| Missing runtime icon paths | ${missingRuntime} |\n| Invalid published mappings | ${validation.invalidMappings} |\n\nQuarantined originals are not silently relabelled as completed. Full details, per-Class counts and source conflicts are in CLASS_COMPLETION_AUDIT.md and CLASS_SKILL_IMAGE_AUDIT.md.\n\n## Performance\n\nDirectory and Detail now have separate route imports. Per-Class bodies/icons remain lazy public JSON and image URLs. The full skill evidence registry is not imported into the browser. Class portraits use a lean shared manifest. ClassAsset no longer imports the entire equipment/Boss asset registry. No Class image bytes are embedded into the homepage bundle.\n\nBefore, JavaScript KiB (gzip):\n\n| File | KiB | Gzip KiB |\n| --- | ---: | ---: |\n${sizeTable(before)}\n\nAfter:\n\n| File | KiB | Gzip KiB |\n| --- | ---: | ---: |\n${sizeTable(after)}\n\nThese are file-size measurements, not browser timing or Lighthouse scores. Source/body growth from the new skill evidence is loaded only on the selected Class route. Baseline/after machine data: artifacts/qa/bundle-before.json and bundle-after.json. Vite manifest is available in dist/.vite/manifest.json. Existing large shared Ultra/content chunks remain a separate optimization opportunity.\n\n## Checks\n\n${checklist}\n\n## Open work\n\n- Run external browser QA and inspect real screenshots; until then visual acceptance remains pending.\n- Reclassify/version-review the ${quarantined.length} preserved original records.\n- Finish Vietnamese localization of added complex passive text, verify new ability keyboard slots where absent, and expand Wiki shop summaries into complete acquisition routes where source detail is sufficient.\n- Review editorial role inferences and grouped variant equivalence against encounter-specific use; no official role/ranking claim.\n\nNo push, deployment, project creation, Rebiomed edits or sandbox bypass.\n`;
write("V12_1_RECOVERY_REPORT.md", summary);
let audit = fs.readFileSync("DARKON_PHASE_AUDIT.md", "utf8");
audit = audit
  .replace(
    /^# Darkon Phase Audit — V12(?:\.1)*$/m,
    "# Darkon Phase Audit — V12.1",
  )
  .replace(
    "**Implementation present; Phase A acceptance remains OPEN because real-browser verification is blocked. Phase B has not started, as required by the user's gate.**",
    "**Darkon logic/data checks pass; real-browser visual acceptance remains pending. Under the explicit V12.1 instruction, Phase B has proceeded despite this environment limitation.**",
  );
const oldChecks = audit.indexOf("\n## Checks"),
  oldEnd = audit.indexOf("\nNo push or deploy.", oldChecks);
if (oldChecks >= 0 && oldEnd > oldChecks)
  audit =
    audit.slice(0, oldChecks) +
    "\n## Checks\n\nCurrent V12.1 check results and external QA instructions are listed below. V12 browser limitation remains pending; the Phase B gate was explicitly superseded.\n" +
    audit.slice(oldEnd);
const marker = "\n## V12.1 recovery evidence";
if (audit.includes(marker)) audit = audit.slice(0, audit.indexOf(marker));
audit += `${marker}\n\n- The old V12 Phase B gate is superseded by the user. Class work has proceeded.\n- Browser setup path: .playwright-browsers. Chromium headed/headless: Mach bootstrap Permission denied (1100); WebKit: Abort trap 6. Executables exist and localhost works.\n- Current Darkon runner: scripts/qa-darkon.mjs. Results: artifacts/qa/darkon/results.json, status ${darkon.status}, screenshots ${darkon.screenshots.length}. Do not treat missing browser evidence as a proven combat logic failure.\n- Terminal recovery instructions: docs/V12_1_EXTERNAL_QA.md.\n- Current verification:\n\n${checklist}\n\nEarlier V12 source-conflict and implementation evidence above is retained as history. The old .cache browser rerun command is superseded by npm run qa:darkon. No new Darkon combat logic rewrite.\n`;
write("DARKON_PHASE_AUDIT.md", audit);
console.log(metrics);
