# V12.4 — Tactical UI & Class Acquisition

Version **0.1.0**. Review date: 2026-11-09. Only this project was changed; no push/deploy.

## Darkon

- Kept the source-backed phase engine, canonical attacks, damage formats and timings. Four manual phases still default to Overture. Rush keeps remaining Aria effects.
- Replaced Class accordions with desktop Tactical Overview / Team Formation. Each source team has exactly four player positions; StoneCrusher/Infinity Titan and other alternatives share a position. Team and Class selection do not reset phase; phase changes retain the team.
- Selected Class displays phase-specific assignment, sourced rotation, existing verified skill icons when exact slot identity resolves, enhancement and source link. Unresolved PCM/ambiguous slot icons stay explicit; no new game art or rotation is invented.
- Focus/Taunt is a compact panel with icons and a sequence. Docs two-main-taunter strategy and Site three-support strategy remain distinct. Vainglory source conflict remains visible.
- Global Encounter Timeline: The Cycle's End **every 30s**, End of the World **270s** (3s cast), Curtain Call **273s**. Tooltip descriptions retain meaning. It is static reference, independent of phase selection.
- Removed duplicate standalone teams/taunt blocks for Darkon, old accordion wrappers and unnecessary phase minimum height. Other Boss UI remains shared.

## Class tabs and acquisition

All **113/113** Class routes use the same Character Inspection tabs: Skills (default), Combo, Acquisition. ARIA relationships, roving tab focus, Arrow/Home/End and native Enter/Space are supported. Inactive panels are hidden and inert, preserving selected skill and progress. Combo uses sourced sequences and existing icons.

Acquisition is a separate typed registry attached to lazy-loaded per-Class bodies. Shop prices come only from exact **Price** fields, never Sellback/defaults; AC/Gold remain distinct and 0 AC is preserved with source prerequisites. Shop names require an observed Shop link or linked-page shop evidence. Canonical Class/variant equality prevents generic Warrior or DoomKnight prices leaking into unrelated Classes; Character Creation is separate from purchase. Base item level is separate from purchase level.

Quest panels bind the exact named source disclosure, its prerequisites, required materials, reward and explicit preceding-quest chain. LoO has 10 source quest steps; Legion Revenant has four Fealty steps. Existing progress IDs are reused when every source quest has a matching curated title. A curated unlock route is attached only when this exact method names its quest prerequisite (for example ArchPaladin 0 AC); the AC alternative does not inherit it.

Merge panels keep final direct materials separate from intermediate acquisition dependencies. AND/OR are structural groups, ambiguous scope is pending without a fabricated checklist. Long materials are collapsed. Method-specific progress survives Shop/Quest/Merge and main-tab switching. Generic currency/package icons are illustrative, not claimed official game art.

## Coverage and limits

**113/113** profiles have at least one source-identified acquisition method. This is **not** a declaration that all methods/prerequisites are fully verified. **75** profiles have no outstanding fields among discovered methods; **38** retain pending details/variant pages. There are **443** separate methods (403 with complete parsed linked details, 40 partial); **82** profiles have alternatives. **22** candidate pages remain unresolved.

| Type  | Profiles | Methods, including variants/locations |
| ----- | -------: | ------------------------------------: |
| shop  |       92 |                                   326 |
| quest |       15 |                                    18 |
| merge |       41 |                                    90 |
| drop  |        1 |                                     1 |
| other |        4 |                                     8 |

Legacy methods: 92; seasonal/conditional: 71. Legacy is explicitly unavailable; seasonal status does not assert the event is open today. Wiki availability is source-declared, not live account/shop verification. No exhaustive per-account eligibility claim. Missing fields stay missing.

Intermediate items: content-sources/class-acquisition/merge-dependencies.json records both verified and pending source outcomes. Only directly observed item links are followed; intermediate recipes are never flattened into the final recipe.

Preserved: **113 profiles, 113 portraits, 888 runtime skills/icons**, 926 stored records including 38 quarantined originals. Invalid published mappings: 0. No portrait/icon bytes or identity mapping deliberately replaced.

## Checks

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

## Browser evidence

Darkon: **browser_launch_blocked**, 0 executed cases, 0 screenshots. Classes: **browser_launch_blocked**, 0 executed cases, 0 screenshots. DOM tests pass; responsive layout, contrast and visual acceptance are **pending**, not passed.

- chromium-headless: browser_launch_blocked; os_or_sandbox_permission_denied; executable exists=true, executable permission=true.
- chromium-headed: browser_launch_blocked; os_or_sandbox_permission_denied; executable exists=true, executable permission=true.
- webkit-headless: browser_launch_blocked; os_or_sandbox_permission_denied; executable exists=true, executable permission=true.

Chromium logs contain MachPortRendezvous bootstrap Permission denied (1100). WebKit exits Abort trap 6. Localhost responds; binaries exist. No sandbox bypass or browser reinstall was used. Raw evidence: artifacts/qa/diagnostics/results.json and artifacts/qa/{darkon,classes}/results.json.

Run outside Codex in normal macOS Terminal:

```sh
cd /Users/wstratos/Desktop/Project/aqw-vietnam-guide
npm run qa:diagnose
npm run qa:darkon
npm run qa:classes
npm run qa:report
```

Runners cover 375/768/1440/1920 and both themes; Class runner inspects all 113 skill routes and screenshots six representative Classes across all main tabs. Review actual screenshots after a successful run. Scripts resolve routes from the catalog and write results inside artifacts/qa. Browser binaries already exist under .playwright-browsers.

## Per-Class acquisition review

Counts include source variants/locations, not extra mandatory steps.

| Class / group                                                        | Shop | Quest | Merge | Drop | Other | Pending fields/pages       |
| -------------------------------------------------------------------- | ---: | ----: | ----: | ---: | ----: | -------------------------- |
| Abyssal Angel (AA) - Abyssal Angel's Shadow (AAS)                    |    5 |     0 |     0 |    0 |     0 | Yes                        |
| Alpha Omega/DOOMmega (AO)                                            |    1 |     0 |     1 |    0 |     0 | Yes                        |
| Alpha Pirate - Pirate                                                |    0 |     0 |     6 |    0 |     0 | Yes                        |
| Arachnomancer (Arach)                                                |    5 |     0 |     0 |    0 |     0 | None in discovered methods |
| Arcana Invoker (AI)                                                  |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| ArchFiend (AF)                                                       |    1 |     0 |     1 |    0 |     0 | None in discovered methods |
| ArchMage (AM)                                                        |    0 |     1 |     0 |    0 |     0 | None in discovered methods |
| ArchPaladin                                                          |    2 |     0 |     0 |    0 |     0 | None in discovered methods |
| Artifact/Antique Hunter (AH)                                         |   11 |     0 |     1 |    0 |     0 | None in discovered methods |
| Bard - Troubador of Love                                             |    3 |     0 |     0 |    0 |     0 | None in discovered methods |
| Barber                                                               |    5 |     0 |     0 |    0 |     0 | None in discovered methods |
| BattleMage - Dark/Royal BattleMage (DBM/RBM)                         |    7 |     0 |     0 |    0 |     0 | Yes                        |
| BeastMaster                                                          |    4 |     0 |     0 |    0 |     0 | Yes                        |
| Berserker/Beta Berserker/Brutal Berserker                            |    7 |     0 |     0 |    0 |     0 | Yes                        |
| Blaze Binder                                                         |    4 |     0 |     2 |    0 |     0 | Yes                        |
| Blood Ancient (BA)                                                   |    3 |     0 |     2 |    0 |     0 | None in discovered methods |
| Blood Titan (BT) - FrostBlood Titan (FBT)                            |    3 |     0 |     2 |    0 |     0 | None in discovered methods |
| Chaos Avenger (CAv)                                                  |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| Chaos Shaper (CSP)                                                   |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| Chaos Slayer (CS) - Chaos Champion Prime (CCP)                       |    6 |     0 |     0 |    0 |     0 | Yes                        |
| Chrono Assassin (CA)                                                 |    1 |     0 |     1 |    0 |     0 | None in discovered methods |
| Chunin - Imperial Chunin (ImC)                                       |    2 |     0 |     1 |    0 |     0 | None in discovered methods |
| Classic Legion DoomKnight (CLDK)                                     |    1 |     0 |     2 |    0 |     0 | None in discovered methods |
| Classic Ninja                                                        |    0 |     0 |     0 |    1 |     0 | Yes                        |
| Cryomancer (Cryo) - Dark/Sakura Cryomancer                           |    3 |     0 |     1 |    0 |     0 | Yes                        |
| Daimon                                                               |    3 |     0 |     0 |    0 |     0 | None in discovered methods |
| Dark Lord (DL) - Darkside                                            |    0 |     0 |     2 |    0 |     0 | Yes                        |
| Darkblood StormKing (DBSK)                                           |    3 |     0 |     0 |    0 |     0 | None in discovered methods |
| DeathKnight (DK)                                                     |   10 |     0 |     0 |    0 |     0 | None in discovered methods |
| Deathknight Lord (DKL)                                               |    3 |     0 |     2 |    0 |     0 | Yes                        |
| DoomKnight (DmK)                                                     |    6 |     0 |     0 |    0 |     0 | Yes                        |
| Dragon/Drakkar/Draco Knight (DrK)                                    |    7 |     0 |     8 |    0 |     0 | Yes                        |
| Dragon of Time                                                       |    0 |     1 |     0 |    0 |     0 | Yes                        |
| Dragon/DragonSoul/Shadow Dragon Shinobi (DSS/SDS)                    |    2 |     0 |     3 |    0 |     0 | Yes                        |
| Dragonlord (DrL)                                                     |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| Dragonslayer (DS)                                                    |    2 |     0 |     0 |    0 |     0 | Yes                        |
| Drakel Warlord (DW)                                                  |    3 |     0 |     2 |    0 |     0 | None in discovered methods |
| Elemental Dracomancer (ED) - Love Caster                             |    9 |     0 |     0 |    0 |     0 | None in discovered methods |
| Enforcer - ProtoSartorium                                            |    0 |     1 |     0 |    0 |     0 | Yes                        |
| Eternal Inversionist (EI)                                            |    4 |     0 |     0 |    0 |     0 | None in discovered methods |
| Evolved Leprechaun (EL)                                              |    1 |     0 |     1 |    0 |     0 | None in discovered methods |
| Evolved Pumpkin Lord (EPL)                                           |    3 |     0 |     2 |    0 |     0 | Yes                        |
| Evolved Shaman (ES)                                                  |    3 |     0 |     0 |    0 |     0 | None in discovered methods |
| Exalted Soul Cleaver (ESC) - Exalted/Dark Harbinger (EH/DH)          |    4 |     0 |     2 |    0 |     0 | None in discovered methods |
| Flame Dragon Warrior (FDW)                                           |    2 |     0 |     0 |    0 |     0 | None in discovered methods |
| Frost SpiritReaver (FSR)                                             |    0 |     1 |     0 |    0 |     0 | None in discovered methods |
| Frostval Barbarian (FB)                                              |    1 |     0 |     0 |    0 |     0 | Yes                        |
| Glacial Berserker (GB)                                               |    2 |     0 |     0 |    0 |     0 | None in discovered methods |
| Glacial/Glaceran Warlord - Dark/Savage Glaceran Warlord (GW/DGW/SGW) |   15 |     0 |     0 |    0 |     0 | Yes                        |
| Grim Necromancer (GN)                                                |    0 |     1 |     0 |    0 |     0 | None in discovered methods |
| Guardian                                                             |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| Healer - Acolyte - Witch                                             |   10 |     0 |     0 |    0 |     2 | Yes                        |
| HighSeas Commander (HSC)                                             |    0 |     1 |     0 |    0 |     0 | None in discovered methods |
| Hollowborn Vindicator (HBV)                                          |    0 |     0 |     2 |    0 |     0 | None in discovered methods |
| Horc Evader (HE)                                                     |    2 |     0 |     0 |    0 |     0 | None in discovered methods |
| Kathool Adept (KA)                                                   |    0 |     1 |     0 |    0 |     0 | Yes                        |
| King's Echo (KE)                                                     |    1 |     0 |     0 |    0 |     0 | Yes                        |
| Legendary Hero (LH) - Dark Legendary Hero (DLH)                      |    4 |     0 |     0 |    0 |     0 | None in discovered methods |
| Legendary/Ultra/Mythic Elemental Warrior (LEW/UEW/MEW)               |    1 |     0 |     2 |    0 |     0 | Yes                        |
| Legion DoomKnight (LDK)                                              |    2 |     0 |     2 |    0 |     0 | None in discovered methods |
| Legion Revenant (LR)                                                 |    0 |     1 |     0 |    0 |     0 | None in discovered methods |
| Lich                                                                 |    0 |     1 |     0 |    0 |     0 | None in discovered methods |
| LightCaster (LC)                                                     |    0 |     4 |     0 |    0 |     0 | None in discovered methods |
| Lord of Order                                                        |    3 |     1 |     0 |    0 |     0 | None in discovered methods |
| Lycan                                                                |    9 |     0 |     0 |    0 |     0 | None in discovered methods |
| Mage - Sorcerer                                                      |    6 |     0 |     0 |    0 |     2 | Yes                        |
| Martial Artist (MA) - Master Martial Artist (MMA)                    |    4 |     0 |     0 |    0 |     0 | None in discovered methods |
| Master Ranger (MR) - Ranger                                          |    4 |     0 |     0 |    0 |     0 | None in discovered methods |
| MechaJouster (MJ)                                                    |    0 |     0 |     4 |    0 |     0 | Yes                        |
| MindBreaker (MB)                                                     |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| Naval Commander (NC) - Heroic/Legendary Naval Commander (HNC/LNC)    |   13 |     0 |     0 |    0 |     0 | None in discovered methods |
| Necromancer (Necro) - Pinkomancer                                    |    5 |     0 |     1 |    0 |     0 | Yes                        |
| Ninja - Assassin - Ninja Warrior                                     |    4 |     0 |     0 |    0 |     0 | None in discovered methods |
| Northlands Monk (NLM)                                                |    2 |     0 |     0 |    0 |     0 | Yes                        |
| Oracle                                                               |    2 |     0 |     0 |    0 |     0 | Yes                        |
| Paladin - Silver Paladin                                             |    6 |     0 |     0 |    0 |     0 | None in discovered methods |
| Prismatic/Evolved ClawSuit (PCS/ECS)                                 |    2 |     0 |     0 |    0 |     0 | None in discovered methods |
| Psionic MindBreaker (PMB)                                            |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| Pyromancer (Pyro) - Pink Romancer (PR)                               |    3 |     0 |     1 |    0 |     0 | None in discovered methods |
| Rogue - Renegade                                                     |    7 |     0 |     0 |    0 |     2 | Yes                        |
| Scarlet Sorceress (SS)                                               |    1 |     1 |     0 |    0 |     0 | None in discovered methods |
| Scion of Flames (SoF)                                                |    0 |     1 |     0 |    0 |     0 | None in discovered methods |
| Sentinel                                                             |    1 |     0 |     0 |    0 |     0 | Yes                        |
| ShadowScythe General (SSG)                                           |    2 |     0 |     1 |    0 |     0 | None in discovered methods |
| Shaman                                                               |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| SkyCharged Grenadier (SCG)                                           |    0 |     1 |     0 |    0 |     0 | None in discovered methods |
| SkyGuard Grenadier (SGG)                                             |    4 |     0 |     0 |    0 |     0 | None in discovered methods |
| Sovereign of Storms (SoS)                                            |    0 |     0 |     1 |    0 |     0 | None in discovered methods |
| Star Captain (StC)                                                   |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| Stone Crusher (SC) - Infinity Titan (IT)                             |    4 |     0 |     1 |    0 |     0 | None in discovered methods |
| Thief of Hours (ToH)                                                 |    5 |     0 |     0 |    0 |     0 | None in discovered methods |
| Troll Spellsmith (TSS)                                               |    2 |     0 |     0 |    0 |     0 | None in discovered methods |
| Ultra OmniKnight (UOK) - Dark Ultra OmniNight (DUON)                 |    6 |     0 |     1 |    0 |     0 | None in discovered methods |
| Undead Goat - Unundead Goat (UG)                                     |    1 |     0 |     1 |    0 |     0 | None in discovered methods |
| UndeadSlayer (US)                                                    |    7 |     0 |     0 |    0 |     0 | None in discovered methods |
| Vampire Lord (VL) - Enchanted/Royal Vampire Lord (EVL/RVL)           |    4 |     0 |     2 |    0 |     0 | None in discovered methods |
| Verus DoomKnight (VDK)                                               |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| Vindicator Of They (VoT) - The Collector (TC)                        |    4 |     0 |     2 |    0 |     0 | Yes                        |
| Void Highlord (VHL) - Debris Highlord (DHL)                          |    1 |     0 |     1 |    0 |     0 | Yes                        |
| Warrior - Beast Warrior - Pumpkin Lord - Warlord                     |    8 |     0 |     0 |    0 |     2 | Yes                        |
| Yami no Ronin (YnR)                                                  |    0 |     1 |     0 |    0 |     0 | Yes                        |
| Chronomancer (CM) - Chronomancer Prime (CMP)                         |    1 |     0 |     3 |    0 |     0 | None in discovered methods |
| Infinity/Interstellar Knight (IK)                                    |    1 |     0 |     3 |    0 |     0 | None in discovered methods |
| ShadowWalker/Stalker/Weaver of Time (SWoT/SSoT)                      |    3 |     0 |     4 |    0 |     0 | None in discovered methods |
| Eternal/Immortal/Empyrean Chronomancer (ECM/ICM)                     |    3 |     0 |     4 |    0 |     0 | None in discovered methods |
| Phantom/Phantasm Chronomancer (PhCM)                                 |    2 |     0 |     4 |    0 |     0 | Yes                        |
| Archivist of Time/Temporis (AoT)                                     |    2 |     0 |     4 |    0 |     0 | Yes                        |
| CardClasher (CC)                                                     |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| Great Thief (GT)                                                     |    0 |     0 |     1 |    0 |     0 | None in discovered methods |
| Legion Paladin (LP)                                                  |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| Master of Moglins (MoM) - Dark Master of Moglins (DMoM)              |    4 |     0 |     0 |    0 |     0 | None in discovered methods |
| NOT A MOD (NAM)                                                      |    1 |     0 |     0 |    0 |     0 | None in discovered methods |
| PaladinSlayer (PS)                                                   |    0 |     0 |     3 |    0 |     0 | None in discovered methods |

## Unresolved candidate sources

| Class ID                                   | Source                                                           | Reason                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| alpha-omega-doommega-ao                    | https://aqwwiki.wikidot.com/alpha-doommega                       | No cached source                                                                                      |
| battlemage-dark-royal-battlemage-dbm-rbm   | https://aqwwiki.wikidot.com/battlemage-of-love                   | No cached source                                                                                      |
| berserker-beta-berserker-brutal-berserker  | https://aqwwiki.wikidot.com/chaos-avenger-member-preview         | No cached source                                                                                      |
| chaos-slayer-cs-chaos-champion-prime-ccp   | https://aqwwiki.wikidot.com/chaos-slayer-mystic-0-ac             | No cached source                                                                                      |
| chaos-slayer-cs-chaos-champion-prime-ccp   | https://aqwwiki.wikidot.com/chaos-slayer-mystic-ac               | No cached source                                                                                      |
| chaos-slayer-cs-chaos-champion-prime-ccp   | https://aqwwiki.wikidot.com/chaos-slayer-thief-0-ac              | No cached source                                                                                      |
| chaos-slayer-cs-chaos-champion-prime-ccp   | https://aqwwiki.wikidot.com/chaos-slayer-thief-ac                | No cached source                                                                                      |
| chaos-slayer-cs-chaos-champion-prime-ccp   | https://aqwwiki.wikidot.com/dark-chaos-berserker                 | No cached source                                                                                      |
| cryomancer-cryo-dark-sakura-cryomancer     | https://aqwwiki.wikidot.com/dark-cryomancer                      | No cached source                                                                                      |
| dark-lord-dl-darkside                      | https://aqwwiki.wikidot.com/darkside                             | Acquisition type/price is not explicit: N/A                                                           |
| dragonslayer-ds                            | https://aqwwiki.wikidot.com/dragonslayer-infinity                | Acquisition type/price is not explicit: N/A (Merge x1,000 Vial of Dragonbane during AQ2D Tech Demo 6) |
| enforcer-protosartorium                    | https://aqwwiki.wikidot.com/protosartorium-class                 | No cached source                                                                                      |
| frostval-barbarian-fb                      | https://aqwwiki.wikidot.com/frostval-barbarian-0-ac              | Acquisition type/price is not explicit: missing Price                                                 |
| healer-acolyte-witch                       | https://aqwwiki.wikidot.com/hollowborn-vindicator-member-preview | No cached source                                                                                      |
| northlands-monk-nlm                        | https://aqwwiki.wikidot.com/northlands-monk-class-free-player    | Acquisition type/price is not explicit: N/A                                                           |
| rogue-renegade                             | https://aqwwiki.wikidot.com/classic-alpha-pirate                 | No cached source                                                                                      |
| rogue-renegade                             | https://aqwwiki.wikidot.com/classic-barber                       | No cached source                                                                                      |
| rogue-renegade                             | https://aqwwiki.wikidot.com/classic-pirate-class                 | No cached source                                                                                      |
| vindicator-of-they-vot-the-collector-tc    | https://aqwwiki.wikidot.com/the-collector-class-0-ac             | No cached source                                                                                      |
| void-highlord-vhl-debris-highlord-dhl      | https://aqwwiki.wikidot.com/void-highlord-ioda-class             | Acquisition type/price is not explicit: N/A                                                           |
| warrior-beast-warrior-pumpkin-lord-warlord | https://aqwwiki.wikidot.com/pumpkin-lord                         | Acquisition type/price is not explicit: N/A                                                           |
| warrior-beast-warrior-pumpkin-lord-warlord | https://aqwwiki.wikidot.com/warlord                              | No cached source                                                                                      |

Profiles still needing some detail review: abyssal-angel-aa-abyssal-angel-s-shadow-aas, alpha-omega-doommega-ao, alpha-pirate-pirate, battlemage-dark-royal-battlemage-dbm-rbm, beastmaster, berserker-beta-berserker-brutal-berserker, blaze-binder-bb-firelord-summoner-fls, chaos-slayer-cs-chaos-champion-prime-ccp, classic-ninja, cryomancer-cryo-dark-sakura-cryomancer, dark-lord-dl-darkside, deathknight-lord-dkl, doomknight-dmk, dragon-drakkar-draco-knight-drk, dragon-of-time-dt-edot, dragon-dragonsoul-shadow-dragon-shinobi-dss-sds, dragonslayer-ds, enforcer-protosartorium, evolved-pumpkin-lord-epl, frostval-barbarian-fb, glacial-glaceran-warlord-dark-savage-glaceran-warlord-gw-dgw-sgw, healer-acolyte-witch, kathool-adept-ka, king-s-echo-ke, legendary-ultra-mythic-elemental-warrior-lew-uew-mew, mage-sorcerer, mechajouster-mj, necromancer-necro-pinkomancer, northlands-monk-nlm, oracle, rogue-renegade, sentinel, vindicator-of-they-vot-the-collector-tc, void-highlord-vhl-debris-highlord-dhl, warrior-beast-warrior-pumpkin-lord-warlord, yami-no-ronin-ynr, phantom-phantasm-chronomancer-phcm, archivist-of-time-temporis-aot. Details of each partial method (including failed linked sources and unparsed recipe scope) remain in src/content/classes/acquisition.json under evidence.issues.

## Reproducibility and bundle

- Online refresh: npm run content:class-acquisition. Verified snapshots are reused; each batch saves.
- Offline rebuild: npm run build attaches the local acquisition registry; no source network dependency in production build.
- Parser tests cover Price/Sellback, zero AC, currencies, exact quest binding and AND/OR; semantic tests cover all profiles, evidence hashes, method IDs, recipes and source regressions. DOM tests cover tabs, persistence, team/phase selection and icon identity.
- V12.1 bundle baseline: artifacts/qa/bundle-after.json; current: artifacts/qa/v12-4/bundle-after.json. Largest shared chunk was already ~940 KB; current largest is 944023 bytes. Main index changed from ~705692 bytes to 705735 bytes. Acquisition stays in per-Class JSON, not the initial home bundle. Vite still warns about existing large shared chunks; further extraction is open.
