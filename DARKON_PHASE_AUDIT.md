<!-- V12.5 START -->

# V12.5 current Darkon UI

Boss Hero now consumes exact Codex tokens. Compact manual HP transition indicator shows 70%, 20%, Aria 20→90% event and buff-timed Rush. Passive effects use full-width rows. Duplicate identical state labels and visible provenance bylines were removed; metadata and the Vainglory caution/conflict are retained. Darkon alternative abbreviations and slot roles now share the same role conventions as other Team cards. Four-phase engine, damage values and remaining Rush effects are unchanged.

Current checks: [V12.5 report](V12_5_BOSS_UI_SPEAKER_REPORT.md). Browser **browser_launch_blocked**, screenshots 0; responsive/visual acceptance remains pending. Older sections below are historical; their paragraph transition/source-byline UI descriptions are superseded.

<!-- V12.5 END -->

<!-- V12.4 START -->

# V12.4 current UI status

Source engine/data unchanged. Tactical Overview, four-slot Team Formation with alternatives, selected Class phase rotation, compact Focus/Taunt and static 30/270/273s timeline replace old strategy accordions. DOM tests prove team/class selection retains phase and phase changes retain team. Browser status **browser_launch_blocked**, screenshots 0; layout/visual QA pending. See [current report](V12_4_UI_ACQUISITION_REPORT.md). The V12/V12.1 sections below are retained historical evidence; their Team Card wording is superseded.

| Check                        | Status | Tests | Evidence                                            |
| ---------------------------- | ------ | ----: | --------------------------------------------------- |
| lint                         | passed |     — | artifacts/qa/v12-4/lint.log                         |
| typecheck                    | passed |     — | artifacts/qa/v12-4/typecheck.log                    |
| test                         | passed |    97 | artifacts/qa/v12-4/test.log                         |
| test:semantic                | passed |    37 | artifacts/qa/v12-4/test-semantic.log                |
| build                        | passed |     — | artifacts/qa/v12-4/build.log                        |
| test:build                   | passed |     9 | artifacts/qa/v12-4/test-build.log                   |
| test:server                  | passed |     4 | artifacts/qa/v12-4/test-server.log                  |
| assets:validate-class-skills | passed |     — | artifacts/qa/v12-4/assets-validate-class-skills.log |

<!-- V12.4 END -->

# Darkon Phase Audit — V12.1

Version: 0.1.0. Audit: 2026-11-09.

**Darkon logic/data checks pass; real-browser visual acceptance remains pending. Under the explicit V12.1 instruction, Phase B has proceeded despite this environment limitation.**

## Sources read

- [AQW Challenge Boss Guide](https://docs.google.com/document/d/18Z2Yu0O40dVyh0enB_2k_v4U-De3mg1y-HtThUmvxfU/edit): full Darkon section, mechanics, four tactical phases, Focus/Taunt, all four recommended teams and class-specific rotations. Connector read succeeded. Snapshot: content-sources/recovery/darkon-guide-v12.txt.
- [Monster Wiki](https://aqwwiki.wikidot.com/darkon-the-conductor): all Attacks including expanded Overture/Recitative/Aria and their Special 1/2 variants, Abilities, Base Stats and Notes. Existing reviewed snapshot and fresh web retrieval agree.
- [Community Site](https://sites.google.com/view/vncollector/adventure-quest-worlds/ultra-boss-guide/weekly-ultra-challenge-boss/darkon-the-conductor): full page fetched over HTTPS after web reader failed; mechanics, tactical labels, Taunt and team instructions read. Snapshots: content-sources/recovery/darkon-site-v12.html and .txt.

## Implementation

- Manual selector defaults to Overture; four compact buttons, animated active indicator, keyboard arrows/Home/End. No HP input or HP-derived phase inference. Reload defaults to Overture.
- Data: src/content/ultra/darkon-phases.json; reproducible generator: scripts/build-darkon-phases.mjs, included in production build after recovery import.
- Shared damage is stored once per official attack. A phase projection drives both stats and skill panels; raw legacy import variants remain only as reviewed source evidence.
- Official active names and canonical IDs are preserved. Madness/Rush are tactical labels, never skill names.
- Max HP 22,222,222 and Level 22 stay unchanged. Damage retains fixed/current-HP/before-Crit text; unpublished Aria damage stays unknown. No fabricated effective damage is computed from Crit modifiers.
- Global passives remain Boss Shield, Stun immunity, Exeunt and base stats. Separate Phase Effects carry timed buffs and conditional player debuffs.
- Madness shows independent A Major 10s, B Minor 20s, C Minor 30s, B Major 50s and C Major 50s windows, measured from Aria. It explicitly says shorter buffs can expire within Madness.
- Rush keeps Aria, Requiem for the Wicked, The Last Symphony and Dirge of Astravia. B/C Major expiration changes boss modifiers; it does not remove the Aria state or return HP state to Overture. The once-only Aria transition attack is not offered as a new Rush attack.
- Global 30s / 270s / 273s timeline is outside keyed phase content. No fake countdown or phase-change timer reset.
- Phase strategy and rotations are source-backed, with teamIds filtering Team Cards and one shared phase selection context. Team Cards are not cloned. AI has no invented per-phase rotation.
- Existing design tokens retained: dark bronze and existing light palette. Component follows surrounding RPG inspection layout. Taste inspector could not launch a browser; no visual score is claimed. Local Taste skill was read. Linked impeccable/tatse checkouts remain unverified; no use of those repositories is claimed.

## Skills visible by phase

| Phase         | Official state | Active skill names                                                                             | Phase effects                                                                   |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1. Overture   | Overture       | Auto Attack, Special 1, Special 2, Overture, The Cycle's End, End of the World, Curtain Call   | Do Dawn                                                                         |
| 2. Recitative | Recitative     | Auto Attack, Special 1, Special 2, Recitative, The Cycle's End, End of the World, Curtain Call | Recitative, Realm of the Arcana, Child of the Empress                           |
| 3. Madness    | Aria           | Auto Attack, Special 1, Special 2, Aria, The Cycle's End, End of the World, Curtain Call       | A Major (10s), B Minor (20s), C Minor (30s), B Major (50s), C Major (50s), Aria |
| 4. Rush       | Aria           | Auto Attack, Special 1, Special 2, The Cycle's End, End of the World, Curtain Call             | Aria                                                                            |

## Source conflicts and treatment

| Field                       | Wiki                                                                                   | Docs                                                            | Site                                                  | Treatment                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Special 1 damage basis      | 90% current HP                                                                         | 90% max HP                                                      | 90% max HP                                            | current HP                                                                                                   |
| A Major dodge               | 5000%                                                                                  | 1000%                                                           | 1000%                                                 | 5000%                                                                                                        |
| Base Crit Damage            | 800%                                                                                   | 800%                                                            | 500%                                                  | 800%                                                                                                         |
| End of the World activation | 270 seconds then charge 3 seconds                                                      | 270 seconds then charge 3 seconds                               | 303 seconds in one paragraph; 273 elsewhere           | 270 seconds + 3-second charge; not inferred from Cycle stack count                                           |
| Grown Crit Chance           | 1000 (no percent sign)                                                                 | 1000%                                                           | 1000%                                                 | Keep Wiki value 1000 without inventing a unit                                                                |
| Recitative Taunt target     | —                                                                                      | Nulgath in one sentence                                         | Nulgath in one sentence                               | Source typo; encounter is Darkon. Do not import wrong target into skill data                                 |
| Exeunt versus Aria healing  | Aria explicitly cannot be Decayed; Exeunt states 750000 HP per kill without Decay rule | Exeunt also labelled immune to Decay                            | —                                                     | Do not extend Aria's verified Decay rule to Exeunt                                                           |
| Phase labels                | —                                                                                      | Overture / Recitative / Madness / Rush                          | Rush / Seeding / Madness / Weakening                  | Use requested Docs tactical labels; preserve official states Overture/Recitative/Aria.                       |
| Focus assignment            | —                                                                                      | Two principal taunters; optional LoO reserve; Speedrun LR + LoO | Three Supports; LoO first and repeated on cooldown    | Show Docs default and separate Site alternative; never silently mix.                                         |
| VHL Rush rotation           | —                                                                                      | Same as phase 1                                                 | 5-3-2; use 4 above 3000 HP                            | Docs sequence with explicit Site alternative.                                                                |
| Vainglory                   | —                                                                                      | General ban yet AI enhancement line lists Vainglory             | VHL line lists Vainglory despite Aria healing penalty | Display general Docs caution and flag class loadout conflict; do not silently endorse contradictory loadout. |

Wiki is used explicitly for Monster numbers; Docs is the labelled strategy baseline. The Site Taunt method is shown separately, and its VHL Rush alternative is attributed in the rotation. General Vainglory caution and contradictory AI enhancement line are both surfaced; no silent normalization of that source conflict.

## Acceptance evidence

| Requirement                                | Evidence / state                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| Exactly four phases                        | Data and rendered DOM integration pass                                           |
| Skills/effects change on selection         | Rendered DOM clicks through all four phases pass                                 |
| Damage formats and current HP              | Projection tests and rendered stats pass; no fabricated Aria damage              |
| No concurrent Special 1/2 phase duplicates | One each per rendered phase; pass                                                |
| Active/Passive groups                      | Rendered clicks pass; global and phase group counts verified                     |
| Global Passive retained                    | Boss Shield and Stun immunity present in all four phases; pass                   |
| Phase Effects scoped                       | A Major absent in Rush, Aria residual effects retained; pass                     |
| Aria healing does not reset phase          | Manual state retained; Madness trigger 20% → 90%, no HP state inference          |
| Madness versus Rush                        | Independent durations and post-expiration modifiers verified                     |
| Enrage not Phase 5                         | Fixed four phases and persistent global timeline; pass                           |
| Official English names                     | Canonical ID/name checks pass                                                    |
| Source-backed tactics                      | Per-phase provenance, VHL thresholds and exact sequences tested                  |
| Team interaction                           | Team Card selection updates inspection; unrelated VHL hidden in Team 1; DOM pass |
| Mobile tabs / no overflow                  | Browser scripts prepared for 375/768/1440/1920; NOT VERIFIED                     |
| Dark/Light visual correctness              | Existing tokens used; real screenshots NOT VERIFIED                              |

## Checks

Current V12.1 check results and external QA instructions are listed below. V12 browser limitation remains pending; the Phase B gate was explicitly superseded.

No push or deploy. Only project files were deliberately created or edited.

## V12.1 recovery evidence

- The old V12 Phase B gate is superseded by the user. Class work has proceeded.
- Browser setup path: .playwright-browsers. Chromium headed/headless: Mach bootstrap Permission denied (1100); WebKit: Abort trap 6. Executables exist and localhost works.
- Current Darkon runner: scripts/qa-darkon.mjs. Results: artifacts/qa/darkon/results.json, status browser_launch_blocked, screenshots 0. Do not treat missing browser evidence as a proven combat logic failure.
- Terminal recovery instructions: docs/V12_1_EXTERNAL_QA.md.
- Current verification:

| Check                        | Result | Tests | Log                                           |
| ---------------------------- | ------ | ----: | --------------------------------------------- |
| lint                         | passed |     — | artifacts/qa/lint.log                         |
| typecheck                    | passed |     — | artifacts/qa/typecheck.log                    |
| test                         | passed |    86 | artifacts/qa/test.log                         |
| test:semantic                | passed |    29 | artifacts/qa/test-semantic.log                |
| build                        | passed |     — | artifacts/qa/build.log                        |
| test:build                   | passed |     9 | artifacts/qa/test-build.log                   |
| test:server                  | passed |     4 | artifacts/qa/test-server.log                  |
| assets:validate-class-skills | passed |     — | artifacts/qa/assets-validate-class-skills.log |

Earlier V12 source-conflict and implementation evidence above is retained as history. The old .cache browser rerun command is superseded by npm run qa:darkon. No new Darkon combat logic rewrite.

## Boss / Class UI follow-up

Darkon retains four manual tactical phases, Aria duration handling and phase-specific teams. Hero now uses uppercase Codex typography and a rose accent mapping for Dark/Light modes. No phase combat values were changed for this UI request. Browser QA remains blocked; see BOSS_CLASS_UI_CONTENT_REPORT.md.
