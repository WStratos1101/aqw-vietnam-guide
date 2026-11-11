# V12.5 — Boss UI & Speaker Rotation

Version **0.1.0**. Audit date 2026-11-10. Only aqw-vietnam-guide was modified. No push/deploy.

## Typography and compact combat inspection

All Boss Hero names use boss-display-title with the **exact existing Codex tokens**: Georgia / Times New Roman / serif, weight 400, italic, tracking −0.04em. These values came from src/styles/ultra/v11.css and the Codex element in UltraDirectory. Responsive clamp sizing/wrapping affects Hero names only; combat table/body typography and each Boss accent are retained. New rules: src/styles/ultra/v12-5.css. Real overflow remains a browser QA item.

Darkon status panel is compact and manually selected: Overture 100→70% with 70 marker; Recitative 70→20% with 20 marker; Madness explicitly shows **20% → ARIA → 90% HP**; Rush shows **Aria Buffs Expire → RUSH** with no invented HP threshold. Full source-backed trigger/exit explanations remain in a collapsed detail. No HP reader, live timer or phase inference was added. Remaining Aria effects in Rush are unchanged.

Passive effects, including Do Dawn, can use the full panel width in compact rows/chips. Short values are not manually line-broken. Duplicate current-state labels such as Overture · Overture are suppressed only when both fields are equal; Madness · Aria remains meaningful.

Removed visible Combat UI source bylines/links from active skill entries and tactical panels. Taunt strategy choices now say “2 người chính” / “3 Support”. Warning starts “Khuyến cáo”, not “Docs khuyến cáo”. Provenance remains in JSON, source snapshots and audits. The Vainglory conflict is still communicated cautiously: some loadouts list it, but survivability/healing in Aria takes priority. No verified combat values were rewritten.

## Team notes, alternatives and navigation

“Ghi chú đầy đủ của đội hình” is replaced by **Lưu ý**, with compact icon rows and collapsed details for long lists. Per-Class Rotation, Enhancement and Consumables live in the selected Class loadout, not a repeated raw team article. Source-explicit Team references retain the existing inherited loadout resolution. Coordination lines move to shared team notes. All original source paragraphs remain in content-sources/v12-5/team-notes-provenance.json and the imported guide bodies. Runtime team-ui.json stores only note/assignment deltas; it does not duplicate the entire loadout registry.

Slots now show alternative **abbreviations**, selected state, full names in accessible labels/tooltips, and the actual selected Class name/loadout. A primary reset option is marked “chính”. Slash alternatives remain a single player position. Primary roles reuse existing Class metadata when available, falling back to assignment text. Speaker formation, table and choices share state; no second independent Speaker team list remains below.

Boss Quay lại always performs client navigation to the verified **/ultra-boss** directory using the existing pushState/popstate router, scrolls to the top and never calls history.back. Daily/Weekly/Seasonal selection is retained in session storage. Progress storage is untouched. A DOM test checks direct directory navigation, retained progress and Weekly filter restoration.

## Six independently sourced Speaker rotations

Google Drive readable fetch succeeded on 2026-11-10; source modified time **2026-10-27T16:23:04.246Z**, matching the imported structured tables. [Challenge Boss Guide](https://docs.google.com/document/d/18Z2Yu0O40dVyh0enB_2k_v4U-De3mg1y-HtThUmvxfU/edit). Each Team binds its own table ID and SHA-256. Merged rows/columns are expanded before extracting rows. Blank assignments remain blank.

| Team                        | Taunters | Steps | Own source table | Signature checkpoints                   |
| --------------------------- | -------: | ----: | ---------------- | --------------------------------------- |
| Team 1 · 4 Taunt · Starter  |        4 |    20 | table-195917     | 3 Zone PCM/LP/AP; 4 Taunt mDPS          |
| Team 2 · 3 Taunt · Starter  |        3 |    20 | table-197787     | 4 Taunt CAv (3); 12 Zone CAv            |
| Team 3 · 3 Taunt · BEST     |        3 |    20 | table-199585     | 1 Taunt QCM/VDK; 7 Zone QCM/VDK         |
| Team 4 · 2 Taunt            |        2 |    20 | table-203233     | 15 LR (Prax); 18 CAv (3); 19 CAv (Prax) |
| Team 5 · 2 Taunt            |        2 |    20 | table-205330     | 6 LR (Prax); 10 LP (4)                  |
| Team 6 · 3 Taunt · SPEEDRUN |        3 |    11 | table-208052     | 1 LoO; 3 Zone QCM/Arach; 5 Taunt VDK    |

All six have independently verified tables. No Team rotation remains unresolved. **111 source steps total** are retained. Pagination is derived from the selected Team: opening two steps, then groups of up to four; Team 6 is not padded to 20. Selecting a Team resets its page to opening.

CAv (3), LR (Prax), CAv (Prax) and LP (4) retain their source suffixes with short explanations. Class aliases use the existing team Class registry. mDPS is the source-declared slot role; explicit QCM/VDK, QCM/Arach and PCM/LP/AP groups allow only those named alternatives. A single-Class assignment is **not** blindly renamed for an unverified alternative. Its raw assignment remains and the tooltip states the missing variant.

Semantic regression tests require six different datasets, six different source table bindings/hashes and independent checkpoints from every Team. DOM tests iterate every page of every Team, assert all steps and four slots, change alternatives, verify table/formation consistency and page reset.

## Source differences and Glowing Zone illustration

The [Collector Speaker page](https://sites.google.com/view/vncollector/adventure-quest-worlds/ultra-boss-guide/weekly-ultra-challenge-boss/malgor-the-first-speaker) was read and saved locally. It presents four older team descriptions plus a mechanics example, whereas the current Docs has six specific teams. Sites numbering/example was **not** mapped onto the six Docs tables. The docs Team 1 prose lists PCM/AP in one collective Taunt line, while its title, Class instructions and table include LP; the explicit table alternatives are retained.

An image candidate occurs directly in the **Equal ZONE / Power Split → Equalize** section (site-images.json index 6). Its context is identified, but its pixels/Red Zone/safe-zone annotations have **not** been visually certified. The page carries a Guild copyright notice restricting copying/commercial use, and permission for community-added annotations is not established. Therefore **no image was downloaded into public, registered as verified, or embedded**. No unrelated screenshot or AI substitute was used. This requirement remains **pending rights + visual verification**. Details: content-sources/v12-5/source-review.json and site-images.json.

The right column now contains its compact board and selected four-slot formation without a fixed-height gap. The eventual permitted illustration belongs directly after the board. Existing mechanics remain: Equalize hits the Glowing Zone, later targets take increased damage, Sanctity clears Corruption/Somber, and unsafe debuffs/returning too soon can cause lethal DoTs. No permanently safe location or whole-team Zone entry is inferred.

## Automated verification

| Check                        | Result | Tests | Evidence                                            |
| ---------------------------- | ------ | ----: | --------------------------------------------------- |
| lint                         | passed |     — | artifacts/qa/v12-5/lint.log                         |
| typecheck                    | passed |     — | artifacts/qa/v12-5/typecheck.log                    |
| test                         | passed |   107 | artifacts/qa/v12-5/test.log                         |
| test:semantic                | passed |    43 | artifacts/qa/v12-5/test-semantic.log                |
| build                        | passed |     — | artifacts/qa/v12-5/build.log                        |
| test:build                   | passed |     9 | artifacts/qa/v12-5/test-build.log                   |
| test:server                  | passed |     4 | artifacts/qa/v12-5/test-server.log                  |
| assets:validate-class-skills | passed |     — | artifacts/qa/v12-5/assets-validate-class-skills.log |

Class registry/assets are preserved: 113 portraits and 888 verified runtime Skill Icons; icon validator passes. Equipment/Quest trackers and Phase Engine regression tests pass. Production build remains offline and re-generates team UI/strategies from local structured sources.

## Visual QA and external runner

Browser status: **browser_launch_blocked** (os_or_sandbox_permission_denied), executed cases 0, screenshots 0. Chromium still fails Mach bootstrap with Permission denied (1100) in this sandbox. This is launch evidence, not proof of a UI or combat logic failure. **No visual pass is claimed** for responsive widths, contrast or spacing.

New external runner checks 375/768/1440/1920, both themes, exact Codex computed typography, phase indicators, combat source-text removal, six tables and every page, formation/alternatives, images/overflow and direct Back navigation. Run in ordinary macOS Terminal:

```sh
cd /Users/wstratos/Desktop/Project/aqw-vietnam-guide
npm run qa:verify
npm run qa:boss-ui
npm run qa:report
```

Use AQW_QA_URL=http://localhost:4181 to attach to an existing dev server. PLAYWRIGHT_BROWSERS_PATH remains project-local; no reinstall or sandbox bypass. Results and real screenshots go to artifacts/qa/boss-v12-5/. Review actual screenshots before granting visual acceptance.

Open items: Glowing Zone image permission/pixel verification; real responsive/dark-light visual QA. Existing Vite large shared-chunk warnings remain; loadout deltas avoid adding another full team registry.

## Follow-up checklist verification

- Darkon alternatives now display compact Class abbreviations with full accessible names; slot roles use the shared role resolver. Phase selection remains unchanged when choosing alternatives.
- Recommended Team header previews and inner Class cards share the same selection state. Controlled cards derive their primary/alternative label from the actual selected Class, including restored selections. A regression test selects CAv and checks header, four slots, Ravenous loadout and absence of the VHL Dauntless loadout.
- Both full and fallback Boss Hero renderer paths consume boss-display-title.
- External QA uses exact accessible Team labels and switches between visible pagination buttons and the mobile dropdown. These runner fixes are not a claim that visual tests executed.
- The six verified source tables and 20/20/20/20/20/11 steps are unchanged. The illustration still has no established reuse permission or verified pixels, so it remains unintegrated.
