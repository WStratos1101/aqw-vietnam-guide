<!-- V12.4 START -->

# V12.4 current Class UI and acquisition status

All 113 profiles now use real Skills/Combo/Acquisition tabs; inactive panels are hidden/inert. Shared Shop/Quest/Merge UI, exact Price/currency fields, quest chains, structural AND/OR and scoped progress are integrated. 113 profiles have a source-identified method; 38 still have incomplete method/variant details. This is not full acquisition completion.

| Type  | Profiles | Methods, including variants/locations |
| ----- | -------: | ------------------------------------: |
| shop  |       92 |                                   326 |
| quest |       15 |                                    18 |
| merge |       41 |                                    90 |
| drop  |        1 |                                     1 |
| other |        4 |                                     8 |

Methods: 443; alternative-method profiles: 82; unresolved candidate pages: 22. Current browser status **browser_launch_blocked**, screenshots 0. Current per-Class coverage, incomplete sources and checks: [V12.4 report](V12_4_UI_ACQUISITION_REPORT.md). Old generic acquisition/anchor-action descriptions below are historical and superseded.

<!-- V12.4 END -->

# Class Completion Audit — V12.1

Version 0.1.0. Audit: 2026-11-09.

**UI rollout: 113/113 profiles. Data review is not equivalent to complete visual/content acceptance.** Browser failure no longer gates Phase B, following the user's explicit V12.1 instruction.

## Delivered

- Compact RPG Class Selection grid, real portraits, role icons, accent-insensitive search, role filters, pagination, hover/focus and reduced-motion rules.
- Shared Character Inspection hero/actions and icon-based Active/Passive/Rank Passive selection for all 113 routes. One selected panel updates identity, icon, cost, cooldown, rank, target, effects and source. State-dependent official combined names stay combined.
- 113/113 Class portraits have source-identified, validated local files. Source selection uses exact Class artwork tabs or the sole non-skill artwork on that Class page. No unrelated armor replacement was invented.
- Roles are curated where existing source metadata was present; other role labels are explicitly editorial inferences from verified target/attack/healing/ally/taunt effects. They are not official rankings. Evidence: artifacts/qa/class-role-evidence.json.
- Existing verified community combos are retained. Explicit source Combo paragraphs supply sequences for other profiles; each step can inspect a real skill. Rotations whose old numeric slots cannot be reconciled with current skills are marked needs_review and do not show an invented current icon sequence.
- Acquisition uses compact quest timeline/details and persisted per-Class progress. Existing detailed questlines remain. Other profiles show source-backed shop/price/material summaries; multiple listed locations are labelled alternatives, never a mandatory chain.
- 38 imported old/unmatched records are quarantined and visible only in an audit disclosure. This includes the extra 25-record ECM set and extra 5-record Dragonslayer set. Current abilities absent from imports and missing passives are added independently.
- Costs/cooldowns with conditional source values remain strings rather than becoming the first integer. VHL Shackle/Unshackle keep their actual distinct source slots; their auras replace each other, not the skill keys.

## Counts

- Profiles with updated UI: 113; without UI rollout: 0.
- Original imported records reviewed: 604; verified original icon mappings: 566; quarantined originals: 38.
- Added passives: 312; added current actives: 10. Stored total: 926; playable/inspectable current skill records: 888.
- Verified/integrated current icons: 888; missing current runtime icons: 0; original 604 records without approved mapping: 38.
- Detailed acquisition questlines: 4; other profiles use Wiki shop/merge/location summaries, not full farming walkthroughs.

## Limits still open

- Browser screenshots, real overflow checks and dark/light visual review remain pending because browser launch is blocked in this Codex environment.
- Quarantined original records require manual version/Class-boundary reconciliation; they are not counted as completed icon work.
- Some added passive descriptions retain a short Vietnamese summary with the full current English Wiki text in the source disclosure; complete Vietnamese localization remains editorial work.
- Keyboard slots for new current abilities are shown only if the named original source explicitly declares the slot. A dash means not yet verified.
- Alternative group members are not universally certified equivalent; exact matched variant source is retained per skill.
- Generic acquisition summaries are not complete quest walkthroughs. No new rotations were invented to fill missing contexts.

## Per-profile coverage

| Class / group                                                        | Current active | Passive / rank | Icons | Portrait               | Roles               | Acquisition           | Legacy records pending |
| -------------------------------------------------------------------- | -------------: | -------------: | ----: | ---------------------- | ------------------- | --------------------- | ---------------------: |
| Abyssal Angel (AA) - Abyssal Angel's Shadow (AAS)                    |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Alpha Omega/DOOMmega (AO)                                            |              5 |              3 |     8 | Local, source verified | Healer/Support      | Wiki summary timeline |                      0 |
| Alpha Pirate - Pirate                                                |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Arachnomancer (Arach)                                                |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Arcana Invoker (AI)                                                  |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| ArchFiend (AF)                                                       |              5 |              3 |     8 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| ArchMage (AM)                                                        |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      5 |
| ArchPaladin                                                          |              5 |              3 |     8 | Local, source verified | Support/Healer/Solo | Quest timeline        |                      0 |
| Artifact/Antique Hunter (AH)                                         |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Bard - Troubador of Love                                             |              5 |              2 |     7 | Local, source verified | Healer/Support      | Wiki summary timeline |                      0 |
| Barber                                                               |              5 |              3 |     8 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| BattleMage - Dark/Royal BattleMage (DBM/RBM)                         |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| BeastMaster                                                          |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Berserker/Beta Berserker/Brutal Berserker                            |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Blaze Binder                                                         |              5 |              3 |     8 | Local, source verified | Farming             | Quest timeline        |                      0 |
| Blood Ancient (BA)                                                   |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Blood Titan (BT) - FrostBlood Titan (FBT)                            |              5 |              3 |     8 | Local, source verified | Healer              | Wiki summary timeline |                      0 |
| Chaos Avenger (CAv)                                                  |              5 |              3 |     8 | Local, source verified | Tank                | Wiki summary timeline |                      0 |
| Chaos Shaper (CSP)                                                   |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Chaos Slayer (CS) - Chaos Champion Prime (CCP)                       |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Chrono Assassin (CA)                                                 |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Chunin - Imperial Chunin (ImC)                                       |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Classic Legion DoomKnight (CLDK)                                     |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Classic Ninja                                                        |              5 |              2 |     7 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| Cryomancer (Cryo) - Dark/Sakura Cryomancer                           |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Daimon                                                               |              5 |              3 |     8 | Local, source verified | Healer              | Wiki summary timeline |                      0 |
| Dark Lord (DL) - Darkside                                            |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Darkblood StormKing (DBSK)                                           |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| DeathKnight (DK)                                                     |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Deathknight Lord (DKL)                                               |              5 |              3 |     8 | Local, source verified | Tank                | Wiki summary timeline |                      0 |
| DoomKnight (DmK)                                                     |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Dragon/Drakkar/Draco Knight (DrK)                                    |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Dragon of Time                                                       |              5 |              3 |     8 | Local, source verified | DPS/Solo/Farming    | Quest timeline        |                      0 |
| Dragon/DragonSoul/Shadow Dragon Shinobi (DSS/SDS)                    |              5 |              3 |     8 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| Dragonlord (DrL)                                                     |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Dragonslayer (DS)                                                    |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      5 |
| Drakel Warlord (DW)                                                  |              5 |              3 |     8 | Local, source verified | Tank                | Wiki summary timeline |                      0 |
| Elemental Dracomancer (ED) - Love Caster                             |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Enforcer - ProtoSartorium                                            |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Eternal Inversionist (EI)                                            |              5 |              3 |     8 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| Evolved Leprechaun (EL)                                              |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Evolved Pumpkin Lord (EPL)                                           |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Evolved Shaman (ES)                                                  |              5 |              3 |     8 | Local, source verified | Healer              | Wiki summary timeline |                      0 |
| Exalted Soul Cleaver (ESC) - Exalted/Dark Harbinger (EH/DH)          |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Flame Dragon Warrior (FDW)                                           |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Frost SpiritReaver (FSR)                                             |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Frostval Barbarian (FB)                                              |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Glacial Berserker (GB)                                               |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Glacial/Glaceran Warlord - Dark/Savage Glaceran Warlord (GW/DGW/SGW) |              5 |              3 |     8 | Local, source verified | Healer/Support      | Wiki summary timeline |                      0 |
| Grim Necromancer (GN)                                                |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Guardian                                                             |              5 |              3 |     8 | Local, source verified | Healer              | Wiki summary timeline |                      0 |
| Healer - Acolyte - Witch                                             |              5 |              2 |     7 | Local, source verified | Healer              | Wiki summary timeline |                      0 |
| HighSeas Commander (HSC)                                             |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Hollowborn Vindicator (HBV)                                          |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Horc Evader (HE)                                                     |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Kathool Adept (KA)                                                   |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| King's Echo (KE)                                                     |              5 |              3 |     8 | Local, source verified | Tank                | Wiki summary timeline |                      0 |
| Legendary Hero (LH) - Dark Legendary Hero (DLH)                      |              5 |              3 |     8 | Local, source verified | Healer/Support      | Wiki summary timeline |                      0 |
| Legendary/Ultra/Mythic Elemental Warrior (LEW/UEW/MEW)               |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Legion DoomKnight (LDK)                                              |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Legion Revenant (LR)                                                 |              5 |              3 |     8 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| Lich                                                                 |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| LightCaster (LC)                                                     |              5 |              3 |     8 | Local, source verified | Healer/Support      | Wiki summary timeline |                      0 |
| Lord of Order                                                        |              5 |              3 |     8 | Local, source verified | Support/Healer      | Quest timeline        |                      0 |
| Lycan                                                                |              5 |              2 |     7 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| Mage - Sorcerer                                                      |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Martial Artist (MA) - Master Martial Artist (MMA)                    |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Master Ranger (MR) - Ranger                                          |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| MechaJouster (MJ)                                                    |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| MindBreaker (MB)                                                     |              5 |              3 |     8 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| Naval Commander (NC) - Heroic/Legendary Naval Commander (HNC/LNC)    |              5 |              3 |     8 | Local, source verified | Support/Tank        | Wiki summary timeline |                      0 |
| Necromancer (Necro) - Pinkomancer                                    |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Ninja - Assassin - Ninja Warrior                                     |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Northlands Monk (NLM)                                                |              5 |              3 |     8 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| Oracle                                                               |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Paladin - Silver Paladin                                             |              5 |              3 |     8 | Local, source verified | Healer              | Wiki summary timeline |                      0 |
| Prismatic/Evolved ClawSuit (PCS/ECS)                                 |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Psionic MindBreaker (PMB)                                            |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Pyromancer (Pyro) - Pink Romancer (PR)                               |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Rogue - Renegade                                                     |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Scarlet Sorceress (SS)                                               |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Scion of Flames (SoF)                                                |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Sentinel                                                             |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| ShadowScythe General (SSG)                                           |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Shaman                                                               |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| SkyCharged Grenadier (SCG)                                           |              5 |              3 |     8 | Local, source verified | Healer              | Wiki summary timeline |                      0 |
| SkyGuard Grenadier (SGG)                                             |              5 |              3 |     8 | Local, source verified | Healer              | Wiki summary timeline |                      0 |
| Sovereign of Storms (SoS)                                            |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Star Captain (StC)                                                   |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Stone Crusher (SC) - Infinity Titan (IT)                             |              5 |              2 |     7 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| Thief of Hours (ToH)                                                 |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Troll Spellsmith (TSS)                                               |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Ultra OmniKnight (UOK) - Dark Ultra OmniNight (DUON)                 |              5 |              3 |     8 | Local, source verified | Support             | Wiki summary timeline |                      0 |
| Undead Goat - Unundead Goat (UG)                                     |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| UndeadSlayer (US)                                                    |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      1 |
| Vampire Lord (VL) - Enchanted/Royal Vampire Lord (EVL/RVL)           |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Verus DoomKnight (VDK)                                               |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Vindicator Of They (VoT) - The Collector (TC)                        |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Void Highlord (VHL) - Debris Highlord (DHL)                          |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Warrior - Beast Warrior - Pumpkin Lord - Warlord                     |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Yami no Ronin (YnR)                                                  |              5 |              3 |     8 | Local, source verified | Support             | Wiki summary timeline |                      1 |
| Chronomancer (CM) - Chronomancer Prime (CMP)                         |              5 |              2 |     7 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Infinity/Interstellar Knight (IK)                                    |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| ShadowWalker/Stalker/Weaver of Time (SWoT/SSoT)                      |              5 |              3 |     8 | Local, source verified | Tank                | Wiki summary timeline |                      0 |
| Eternal/Immortal/Empyrean Chronomancer (ECM/ICM)                     |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                     25 |
| Phantom/Phantasm Chronomancer (PhCM)                                 |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Archivist of Time/Temporis (AoT)                                     |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| CardClasher (CC)                                                     |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Great Thief (GT)                                                     |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      0 |
| Legion Paladin (LP)                                                  |              5 |              3 |     8 | Local, source verified | Healer/Support      | Wiki summary timeline |                      0 |
| Master of Moglins (MoM) - Dark Master of Moglins (DMoM)              |              5 |              3 |     8 | Local, source verified | Healer              | Wiki summary timeline |                      0 |
| NOT A MOD (NAM)                                                      |              5 |              3 |     8 | Local, source verified | DPS                 | Wiki summary timeline |                      1 |
| PaladinSlayer (PS)                                                   |              5 |              3 |     8 | Local, source verified | Support             | Wiki summary timeline |                      0 |

## Validation

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

Browser: browser_launch_blocked, 0 cases executed, 0 screenshots. External runner: scripts/qa-classes.mjs; instructions: docs/V12_1_EXTERNAL_QA.md. No visual pass is claimed.

Design: local Taste skill, True-black flat, seed 194819239; existing bronze/dark and light tokens retained. RPG portraits/ability slots/timeline follow the user's requested structure. No redesign of Darkon logic and no claims of a final screenshot score.

## V12.6 continuation

133 profiles, including 20 new Calendar profiles; shared tabs retained. Calendar source/availability review is partial. 18 Classes expose verified art switching. Four random recommendations implemented. See CALENDAR_CLASS_AUDIT.md and CLASS_ART_VARIANT_AUDIT.md; not all Calendar classes completed.

## Boss / Class UI refinement

133 source-derived acquisition summaries and editorial tier labels; 133 sourced combo profiles use visual flows. 18 art selectors, including VHL/DHL. 22 acquisition records remain partial; tier labels are not official difficulty assertions. See BOSS_CLASS_UI_CONTENT_REPORT.md.

## V12.7 / V12.8 verified update

133 current profiles. Original acquisition backlog 41: 22 completed, 19 remain; current partial records 22. 26 Calendar profiles in their exclusive display category, 26 verified years. 18 genuine alternative selectors (gender selectors hidden). 1042 verified skill mappings; 38 quarantined. Reports: V12_7_DATA_COMPLETION_REPORT.md and V12_8_CLASS_BOSS_UI_REFINEMENT_REPORT.md. Browser browser_launch_blocked.

## V12.9 / V12.10

133 hồ sơ, 111 acquisition reviewed và 22 partial. Backlog V12.7 giữ 22/41 hoàn tất. Quest Reward rút gọn cho 15 hồ sơ. 19 thẻ Calendar và 8 Calendar Family có chuyển biến thể.
