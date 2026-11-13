# FARM V2 COMPLETION REPORT

2026-11-13 · package 0.2.0 unchanged · HEAD 4962382a7b9dc41d02a348e41e5aa123e70156d7. **PARTIAL / NOT READY FOR RELEASE**.

## Latest bounded batch — locations-2026-11-13-01

**PARTIAL.** 6 previously pending source URLs reviewed using web-reader (not browser automation), plus 1 supporting region page. Raw reader evidence and extracted facts are retained in wiki-reviewed-pages.json and artifacts/qa/farm/resume/wiki-*.txt. Location pages are supporting evidence, never new equipment identities.

| Metric | Before | After |
|---|---|---|
| Items | 232 | 232 |
| Pending Wiki URLs | 1110 | 1104 |
| Entirely unknown Region | 225 | 207 |
| Missing images | 199 | 199 |

- 18 routes mapped exactly to Doomwood Part 2 via Necropolis; 26 sourced join commands added. New Region counts include the active extension, not only the old curated taxonomy. Existing recipe/route geography is preserved. Map-only evidence does not imply Region.
- All 199 missing-image identities triaged: 195 source-page candidates, 4 without candidates. None newly integrated; candidates remain unverified. One exact image download failed DNS; no retry. Missing-image-audit.json records each item.
- Yokai support page hit a redirect loop; Heiwa Valley Region remains unknown. Docs embedded scope remains blocked; previous connector/export failures were not retried this batch.
- Only affected tests run: 19/19 (V2 data, interactions, source importer), typecheck exit0 and offline Farm content validation exit0. Full Farm35/unit155/production9/build results below are previous-session evidence, not rerun certification of this data batch.
- No browser, push, deploy or Auto Publish; version and dependencies unchanged.

| Current batch check | Exit | Evidence |
|---|---|---|
| npm run content:farm | 0 | artifacts/qa/farm/resume/location-content.log |
| node --test tests/farm-v2.test.mjs tests/farm-v2-interactions.test.mjs tests/farm-source-import.test.mjs | 0 | artifacts/qa/farm/resume/location-tests.log |
| npm run typecheck | 0 | artifacts/qa/farm/resume/location-typecheck.log |

## Earlier resume changes

- Importer reuses exact observed Wiki URL caches from existing Class/acquisition/challenge sources, rejects mismatched canonical pages and preserves unknown dates. Console pending count now agrees with source-access.json. New parser/cache regression test added.
- Offline catalog: 217 → 232 items (+15); Wiki access 562 → 634, pending 1176 → 1104. No category/recipe guesses to reduce backlog.
- Farm adapter reuses approved Class portraits/links through a shared strict matcher, validates file hashes, preserves usage policy. Images: 17 → 33; missing 200 → 199 despite newly imported identities. Existing curated images and recipes are preserved.
- Inventory, conditional tabs, route/material navigation, source links and canonical IDs exercised by Farm DOM/data tests; no layout redesign.
- Safe macOS external Chromium command added; Farm default engine Chromium; no browser executed here. No version/package/dependency/binding changes in this resume.

## Acquisition field recovery

91 imported routes now identify the exact Quest Reward from the explicit Price field, and 20 retain verified price/currency fields (Gold vs ACs). Merge recipes retain precedence. Multiple Price fields, Sellback and AC tags do not infer purchase costs. Sources are recorded per field. Resolved image fields no longer remain marked unknown. These are cached field verifications, not full fresh item verification.

## Previous integration evidence (not rerun for latest source batch)

| Command | Exit | Result | Log |
|---|---|---|---|
| npm run content:farm | 0 | passed | artifacts/qa/farm/resume/acquisition-content-farm-final.log |
| npm run test:farm | 0 | passed | artifacts/qa/farm/resume/acquisition-test-farm-final.log |
| npm run typecheck | 0 | passed | artifacts/qa/farm/resume/acquisition-typecheck-final.log |
| npm run lint | 0 | passed | artifacts/qa/farm/resume/acquisition-lint-final.log |
| npm test | 0 | passed | artifacts/qa/farm/resume/acquisition-test-final.log |
| npm run build | 0 | passed | artifacts/qa/farm/resume/acquisition-build-final.log |
| npm run test:build | 0 | passed | artifacts/qa/farm/resume/acquisition-test-build-final.log |

Targeted Farm checks: 35/35. Main unit suite: 155/155. Production checks: 9/9; 641 routes prerendered. Initial targeted image-preservation test caught the new portrait enrichment; assertion now preserves existing images and independently requires exact registered Class provenance for newly filled images. No tests deleted. Full checks ran after correction. Historical logs remain separately in artifacts/qa/farm/resume-checks.json.

## Current counts

| Metric | Count |
|---|---|
| canonical_items | 232 |
| explicit_quest_reward_routes | 91 |
| explicit_purchase_routes | 20 |
| source_A | 197 |
| source_B | 225 |
| AB_overlap | 194 |
| retained_curated | 25 |
| new_vs_curated | 207 |
| inherited_verified | 23 |
| needs_technical_review | 209 |
| approved_local_images | 33 |
| missing_images | 199 |
| entirely_unknown_Region | 207 |
| with_unknown_route_Region | 208 |
| source_pages | 148 |
| Wiki_URLs_read_or_cached | 634 |
| pending_Wiki_URLs | 1104 |
| retained_Wiki_fetch_errors | 139 |
| failed_URLs_with_recovered_cache | 3 |
| equipment_Wiki_records | 220 |
| excluded_Wiki_records | 257 |
| pending_context_lines | 8612 |
| pending_embedded_image_references | 760 |

## Source coverage

- **A — PARTIAL**: 147 VNCollector snapshots (root + 146 children), text/links retained; 760 embedded image references await visual reconciliation. Cached access is not a fresh live verification.
- **B — PARTIAL / embedded scope BLOCKED**: Google Docs text-only-live snapshot, 545316 characters. Previous native connector/HTML export attempts timed out. A bounded alternate web-tool HTML export probe was also inaccessible; details: artifacts/qa/farm/resume/source-probe.json. Older project export is also paragraph-only and supplies no missing rich links/tables/images. Live text export read in full by pipeline; connector and HTML export timed out. Embedded links/tables/images unverified.
- **Wiki — PARTIAL**: bounded batch of 24 newly queued URLs all failed with No route to host (log: artifacts/qa/farm/resume/source-batch-next.log); no repeat attempt. Exact existing shared caches recovered 66 URL bodies without network or fresh dates. 50 have literal A/B title matches and normalized records; the others remain access evidence, not invented items. 1104 URLs remain unresolved.
- 139 retained Wiki fetch errors are attempt history; 3 now have valid cached bodies. Do not equate every historical fetch error with a currently missing page. Sources and per-record dates remain in source-access.json/wiki-records.json.

## Remaining / browser status

- **PARTIAL**: 209 items need field-level review; 207 entirely lack Region and 208 have a missing/unknown route Region. No guessed map commands, prices, quantities or Region assignments.
- **PARTIAL**: 199 images missing; 33 approved local images include 16 newly reused exact Class portraits. Shared Class source URL, Class ID, portrait ID, usage policy and SHA256 must match.
- **UNVERIFIED**: 8612 context lines and 760 embedded graphics. These are not counts of missing equipment.
- 23 verified items are inherited curated snapshots, not fresh full item verification. Availability in game remains separate.
- **Class/Combo**: 133 profiles / 210 combos / 675 Class+slot references audited; 2 unresolved references. Yami no Ronin sourced-0 and sourced-2 reference quarantined legacy Kyuketsu at slot 4; current Kettou has a verified icon but is not silently substituted into old combos. Existing registry validation: 1042 verified, 38 review, 0 invalid mappings (artifacts/qa/class-icon-validation.json). No random icon replacements.
- **Browser QA — UNVERIFIED / NOT RUN this session**: no Chromium, WebKit, Playwright.app or Smoke executed in Codex; no new screenshots. Prior sandbox failures are historical only. External Chromium run and visual review remain required.
- Production build retains existing >500 kB chunk warnings. No push/deploy/AutoSync/Auto Publish or D1 changes.

## Files for this resume

- scripts/import-farm-sources.py; scripts/build-farm-v2.mjs; scripts/lib/farm-class-media.mjs; scripts/lib/farm-wiki-facts.mjs; scripts/lib/farm-geography.mjs; scripts/report-farm-v2.mjs.
- src/lib/farm-v2.mjs; src/types/farm-v2.ts; tests/farm-source-import.test.mjs; tests/farm-v2.test.mjs.
- scripts/qa-runtime.mjs; tests/qa-runtime.test.mjs; AQW-Safe-Browser-QA.command; docs/farm-v2-import.md.
- Farm source snapshots/coverage/ledgers, catalog-v2.generated.json and index.json; audit/checkpoint files; actual test logs. Pre-existing dirty Farm and other QA artifacts were preserved; no reset/stash/clean. Full build regenerated expected outputs; no additional tracked product changes outside Farm/QA.

## Continue outside Codex

```sh
# Offline data replay; no source network or browser
npm run content:farm
# Static / unit / production checks
npm run test:farm
npm run typecheck
npm run lint
npm test
npm run build
npm run test:build
# Normal macOS Terminal ONLY; one Chromium attempt, no publish
./AQW-Safe-Browser-QA.command
```

Browser results: artifacts/qa/farm/results.json and screenshots there; Terminal log: artifacts/qa/farm/external/terminal.log. The command checks dependencies and binary, installs nothing automatically, and preserves nonzero exit through tee. Do not run legacy updater installers. Resume bounded Wiki fetching only after network connectivity is restored; do not retry failed URLs automatically. Publishing remains a separate manual action after real QA passes.

Checkpoint: Update/_codex-focus/FARM_V2_RESUME_PROGRESS.md and FARM_V2_IMPLEMENTATION_MATRIX.md. Browser PASS and source completeness are not implied by successful build.
