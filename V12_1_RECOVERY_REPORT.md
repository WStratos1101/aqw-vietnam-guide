# V12.1 Browser Recovery and Class Codex

Version **0.1.0** retained. All deliberate file changes are inside aqw-vietnam-guide; no push or deploy.

## Browser diagnosis

Playwright 1.65.0; darwin/arm64, OS kernel 24.6.0. Install/run path is consistently .playwright-browsers inside the project. Binaries exist and executable permission checks passed. The dev server passed connectivity checks.

| Attempt | Binary exists | Executable permission | Result | Observed cause |
| --- | --- | --- | --- | --- |
| chromium-headless | true | true | browser_launch_blocked | os_or_sandbox_permission_denied |
| chromium-headed | true | true | browser_launch_blocked | os_or_sandbox_permission_denied |
| webkit-headless | true | true | browser_launch_blocked | browser_process_crash |

Chromium fails at macOS Mach bootstrap registration: bootstrap_check_in ... MachPortRendezvousServer ... Permission denied (1100), followed by SIGTRAP. This establishes an OS/process-policy denial inside this Codex session, not a missing browser or unavailable localhost. The external Terminal comparison is still needed to isolate sandbox policy from broader host policy.

WebKit exits before any page with Abort trap: 6 (exit 134). The available log proves a process crash; it does not establish an incompatible executable or prove the same cause as Chromium. No unsupported root-cause claim is made.

Tried: reuse/move existing WebKit into project path; install Chromium/headless shell once into that same path; inspect paths/permissions; launch Chromium headed and headless and WebKit headless; confirm temporary local Vite server connectivity. No browser sandbox disable flag or Codex bypass mode was used; Chromium launches with chromiumSandbox:true. No Full Disk Access request.

## External QA

Run from ordinary macOS Terminal:

```sh
cd /Users/wstratos/Desktop/Project/aqw-vietnam-guide
npm run qa:install
npm run qa:diagnose
npm run qa:darkon
npm run qa:classes
```

Runner automatically starts its own dev server on a free port, or uses AQW_QA_URL. Routes come from current catalogs. Results distinguish not_run, failed, passed and browser_launch_blocked; no passed result or screenshot is fabricated. See docs/V12_1_EXTERNAL_QA.md.

- Darkon: **browser_launch_blocked**, 0 executed contexts, 0 screenshots. scripts/qa-darkon.mjs covers four phases, Stats/Active/Passive, residual Aria, team strategy, console, images, overflow, themes and four widths.
- Class browser: **browser_launch_blocked**, 0 executed cases, 0 screenshots. scripts/qa-classes.mjs covers Directory, six representatives at four widths/two themes and all Class routes/skill selection.
- Phase A: model/DOM/semantic/build checks pass; real-browser acceptance pending. Phase B was explicitly allowed to proceed under V12.1. Darkon was not rewritten.

## Class delivery and honest icon metrics

| Metric | Result |
| --- | ---: |
| UI-updated Class profiles | 113/113 |
| Profiles without UI rollout | 0 |
| Local source-verified portraits | 113/113 |
| Original skills examined | 604 |
| Original icon mappings verified/integrated | 566 |
| Original records without approved mapping | 38 |
| Original records quarantined | 38 |
| Added current active records | 10 |
| Added Passive/Rank Passive records | 312 |
| Stored records including quarantine | 926 |
| Runtime current skills | 888 |
| Verified/integrated runtime icons | 888 |
| Missing runtime icon paths | 0 |
| Invalid published mappings | 0 |

Quarantined originals are not silently relabelled as completed. Full details, per-Class counts and source conflicts are in CLASS_COMPLETION_AUDIT.md and CLASS_SKILL_IMAGE_AUDIT.md.

## Performance

Directory and Detail now have separate route imports. Per-Class bodies/icons remain lazy public JSON and image URLs. The full skill evidence registry is not imported into the browser. Class portraits use a lean shared manifest. ClassAsset no longer imports the entire equipment/Boss asset registry. No Class image bytes are embedded into the homepage bundle.

Before, JavaScript KiB (gzip):

| File | KiB | Gzip KiB |
| --- | ---: | ---: |
| index-DZRQdI0_.js | 688.9 | 92.1 |
| react-vendor-DtRoQ-p-.js | 189.3 | 59.1 |
| route-Bm6J6Ork.js | 335.3 | 56.1 |
| route-VOnof3Uw.js | 207.3 | 19.9 |
| ultra-progress-CTQ1jHfa.js | 1075.3 | 75.3 |

After:

| File | KiB | Gzip KiB |
| --- | ---: | ---: |
| detail-route-B7-TCk_J.js | 18.6 | 6.2 |
| directory-route-BFu2MIvJ.js | 229.0 | 26.0 |
| index-C8I3WqQ1.js | 689.2 | 92.1 |
| react-vendor-DtRoQ-p-.js | 189.3 | 59.1 |
| route-KfMh-ec0.js | 487.5 | 66.8 |
| shield-fzz2Ojwn.js | 1.8 | 0.7 |
| ultra-progress-Cz-Wa41X.js | 918.4 | 65.2 |

These are file-size measurements, not browser timing or Lighthouse scores. Source/body growth from the new skill evidence is loaded only on the selected Class route. Baseline/after machine data: artifacts/qa/bundle-before.json and bundle-after.json. Vite manifest is available in dist/.vite/manifest.json. Existing large shared Ultra/content chunks remain a separate optimization opportunity.

## Checks

| Check | Result | Tests | Log |
| --- | --- | ---: | --- |
| lint | passed | — | artifacts/qa/lint.log |
| typecheck | passed | — | artifacts/qa/typecheck.log |
| test | passed | 86 | artifacts/qa/test.log |
| test:semantic | passed | 29 | artifacts/qa/test-semantic.log |
| build | passed | — | artifacts/qa/build.log |
| test:build | passed | 9 | artifacts/qa/test-build.log |
| test:server | passed | 4 | artifacts/qa/test-server.log |
| assets:validate-class-skills | passed | — | artifacts/qa/assets-validate-class-skills.log |

## Open work

- Run external browser QA and inspect real screenshots; until then visual acceptance remains pending.
- Reclassify/version-review the 38 preserved original records.
- Finish Vietnamese localization of added complex passive text, verify new ability keyboard slots where absent, and expand Wiki shop summaries into complete acquisition routes where source detail is sufficient.
- Review editorial role inferences and grouped variant equivalence against encounter-specific use; no official role/ranking claim.

No push, deployment, project creation, Rebiomed edits or sandbox bypass.
