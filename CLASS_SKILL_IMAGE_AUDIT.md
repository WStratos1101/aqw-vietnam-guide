<!-- V12.4 START -->

# V12.4 asset preservation check

113 profiles, 113 portraits, 888 runtime skills and 888 verified/integrated icons retained. 38 old records remain quarantined, stored total 926. Invalid mappings 0; asset validation passed. V12.4 reuses the registry in Class tabs, combo and Darkon rotation; no replacement icon set. Browser loading/visual verification remains **browser_launch_blocked**, 0 screenshots. [Current report](V12_4_UI_ACQUISITION_REPORT.md).

<!-- V12.4 END -->

# Class Skill Image Audit — V12.1

Version 0.1.0. Source review: 2026-11-09.

All **604 original imported records** were reviewed. **566** retain verified and integrated icons; **38** old/mis-grouped records are quarantined rather than given an incorrect image. This is not a claim that all 604 original records have valid current icons.

## Metrics

| Metric                                                        | Count |
| ------------------------------------------------------------- | ----: |
| Class profiles/groups                                         |   113 |
| Original imported skills reviewed                             |   604 |
| Original skills with verified/integrated icons                |   566 |
| Original records still needing manual identity/version review |    38 |
| Original records missing an approved current mapping          |    38 |
| Added, verified Passive/Rank Passive records                  |   312 |
| Added, verified current Active records                        |    10 |
| Total stored records including quarantine                     |   926 |
| Current runtime skill records                                 |   888 |
| Current runtime skills with verified icons                    |   888 |
| Current runtime skills with integrated icons                  |   888 |
| Current runtime skills missing icons                          |     0 |
| Unique icon image files used                                  |   444 |
| Invalid published icon mappings detected                      |     0 |

The 312+10 supplemental records are reported separately; they do not inflate the original 604 denominator. Shared Auto Attack and Passive icons are valid only when the exact named source disclosure includes that image. One previously name-matched duplicate Auto Attack in the extra Dragonslayer set was removed from verified runtime use because a common name alone did not establish Class identity.

## Verification and usage

- Registry: src/content/classes/skill-registry.json. Each mapping has Class ID, stable Skill ID, official name, source page/hash, exact named-block image URL, asset ID, usage status and evidence.
- Source snapshots and parsed skill blocks: content-sources/class-wiki/. This pipeline matches normalized names in named Wiki skill disclosures, never global image position. Canonical spelling corrections are limited to the two explicit, source-reviewed entries in name-corrections.json.
- All public icon paths are under public/images/aqw/class-skills/. Raster headers/dimensions and SHA-256 are checked. PNG, GIF and lossless/extended WebP are recognized by bytes; five Goat icons whose .png URLs returned WebP are saved with their actual .webp format.
- Sources: [Class index](https://aqwwiki.wikidot.com/classes), [Classes Skills](https://aqwwiki.wikidot.com/classes-skills), and each exact Class/variant source URL in the manifest. Alternate variant pages are matched independently; identical skills are not assumed from a shared group label. Wiki-declared same-skill variant relations are retained in the registry.
- Usage basis: [Artix Brand and IP Use](https://www.artix.com/community/brand-and-assets-usage/), for a noncommercial discussion/fan guide with copyright credits, Artix/AQ.com links and no endorsement claim. Wiki text CC BY-SA is not treated as the image licence. Class Detail and the site footer provide the credit/links.
- Batches save after each pair and validate after each batch. Verified local files are reused. Unavailable pages/assets are recorded without stopping subsequent Classes.
- Automated checks prove source-block association and local integrity. They do not prove combat execution or a visual review of every raster. Representative VHL/LR/LoO/CAv portraits and VHL/LR icons were opened directly; real page screenshots remain pending.

## Per profile

| Class / group                                                        | Original records | Original verified | Supplemental records integrated | Runtime icons | Quarantined/pending |
| -------------------------------------------------------------------- | ---------------: | ----------------: | ------------------------------: | ------------: | ------------------: |
| Abyssal Angel (AA) - Abyssal Angel's Shadow (AAS)                    |                5 |                 5 |                               3 |             8 |                   0 |
| Alpha Omega/DOOMmega (AO)                                            |                5 |                 5 |                               3 |             8 |                   0 |
| Alpha Pirate - Pirate                                                |                5 |                 5 |                               3 |             8 |                   0 |
| Arachnomancer (Arach)                                                |                5 |                 5 |                               3 |             8 |                   0 |
| Arcana Invoker (AI)                                                  |                5 |                 5 |                               3 |             8 |                   0 |
| ArchFiend (AF)                                                       |                5 |                 5 |                               3 |             8 |                   0 |
| ArchMage (AM)                                                        |                5 |                 0 |                               8 |             8 |                   5 |
| ArchPaladin                                                          |                8 |                 8 |                               0 |             8 |                   0 |
| Artifact/Antique Hunter (AH)                                         |                5 |                 5 |                               3 |             8 |                   0 |
| Bard - Troubador of Love                                             |                5 |                 5 |                               2 |             7 |                   0 |
| Barber                                                               |                5 |                 5 |                               3 |             8 |                   0 |
| BattleMage - Dark/Royal BattleMage (DBM/RBM)                         |                5 |                 5 |                               3 |             8 |                   0 |
| BeastMaster                                                          |                5 |                 5 |                               3 |             8 |                   0 |
| Berserker/Beta Berserker/Brutal Berserker                            |                5 |                 5 |                               3 |             8 |                   0 |
| Blaze Binder                                                         |                7 |                 7 |                               1 |             8 |                   0 |
| Blood Ancient (BA)                                                   |                5 |                 5 |                               3 |             8 |                   0 |
| Blood Titan (BT) - FrostBlood Titan (FBT)                            |                5 |                 5 |                               3 |             8 |                   0 |
| Chaos Avenger (CAv)                                                  |                5 |                 5 |                               3 |             8 |                   0 |
| Chaos Shaper (CSP)                                                   |                5 |                 5 |                               3 |             8 |                   0 |
| Chaos Slayer (CS) - Chaos Champion Prime (CCP)                       |                5 |                 5 |                               3 |             8 |                   0 |
| Chrono Assassin (CA)                                                 |                5 |                 5 |                               2 |             7 |                   0 |
| Chunin - Imperial Chunin (ImC)                                       |                5 |                 5 |                               3 |             8 |                   0 |
| Classic Legion DoomKnight (CLDK)                                     |                5 |                 5 |                               3 |             8 |                   0 |
| Classic Ninja                                                        |                5 |                 5 |                               2 |             7 |                   0 |
| Cryomancer (Cryo) - Dark/Sakura Cryomancer                           |                5 |                 5 |                               3 |             8 |                   0 |
| Daimon                                                               |                5 |                 5 |                               3 |             8 |                   0 |
| Dark Lord (DL) - Darkside                                            |                5 |                 5 |                               3 |             8 |                   0 |
| Darkblood StormKing (DBSK)                                           |                5 |                 5 |                               3 |             8 |                   0 |
| DeathKnight (DK)                                                     |                5 |                 5 |                               3 |             8 |                   0 |
| Deathknight Lord (DKL)                                               |                5 |                 5 |                               3 |             8 |                   0 |
| DoomKnight (DmK)                                                     |                5 |                 5 |                               3 |             8 |                   0 |
| Dragon/Drakkar/Draco Knight (DrK)                                    |                5 |                 5 |                               3 |             8 |                   0 |
| Dragon of Time                                                       |                8 |                 8 |                               0 |             8 |                   0 |
| Dragon/DragonSoul/Shadow Dragon Shinobi (DSS/SDS)                    |                5 |                 5 |                               3 |             8 |                   0 |
| Dragonlord (DrL)                                                     |                5 |                 5 |                               3 |             8 |                   0 |
| Dragonslayer (DS)                                                    |               10 |                 5 |                               3 |             8 |                   5 |
| Drakel Warlord (DW)                                                  |                5 |                 5 |                               3 |             8 |                   0 |
| Elemental Dracomancer (ED) - Love Caster                             |                5 |                 5 |                               3 |             8 |                   0 |
| Enforcer - ProtoSartorium                                            |                5 |                 5 |                               2 |             7 |                   0 |
| Eternal Inversionist (EI)                                            |                5 |                 5 |                               3 |             8 |                   0 |
| Evolved Leprechaun (EL)                                              |                5 |                 5 |                               3 |             8 |                   0 |
| Evolved Pumpkin Lord (EPL)                                           |                5 |                 5 |                               3 |             8 |                   0 |
| Evolved Shaman (ES)                                                  |                5 |                 5 |                               3 |             8 |                   0 |
| Exalted Soul Cleaver (ESC) - Exalted/Dark Harbinger (EH/DH)          |                5 |                 5 |                               3 |             8 |                   0 |
| Flame Dragon Warrior (FDW)                                           |                5 |                 5 |                               3 |             8 |                   0 |
| Frost SpiritReaver (FSR)                                             |                5 |                 5 |                               3 |             8 |                   0 |
| Frostval Barbarian (FB)                                              |                5 |                 5 |                               3 |             8 |                   0 |
| Glacial Berserker (GB)                                               |                5 |                 5 |                               3 |             8 |                   0 |
| Glacial/Glaceran Warlord - Dark/Savage Glaceran Warlord (GW/DGW/SGW) |                5 |                 5 |                               3 |             8 |                   0 |
| Grim Necromancer (GN)                                                |                5 |                 5 |                               3 |             8 |                   0 |
| Guardian                                                             |                5 |                 5 |                               3 |             8 |                   0 |
| Healer - Acolyte - Witch                                             |                5 |                 5 |                               2 |             7 |                   0 |
| HighSeas Commander (HSC)                                             |                5 |                 5 |                               3 |             8 |                   0 |
| Hollowborn Vindicator (HBV)                                          |                5 |                 5 |                               3 |             8 |                   0 |
| Horc Evader (HE)                                                     |                5 |                 5 |                               3 |             8 |                   0 |
| Kathool Adept (KA)                                                   |                5 |                 5 |                               3 |             8 |                   0 |
| King's Echo (KE)                                                     |                5 |                 5 |                               3 |             8 |                   0 |
| Legendary Hero (LH) - Dark Legendary Hero (DLH)                      |                5 |                 5 |                               3 |             8 |                   0 |
| Legendary/Ultra/Mythic Elemental Warrior (LEW/UEW/MEW)               |                5 |                 5 |                               3 |             8 |                   0 |
| Legion DoomKnight (LDK)                                              |                5 |                 5 |                               3 |             8 |                   0 |
| Legion Revenant (LR)                                                 |                5 |                 5 |                               3 |             8 |                   0 |
| Lich                                                                 |                5 |                 5 |                               3 |             8 |                   0 |
| LightCaster (LC)                                                     |                5 |                 5 |                               3 |             8 |                   0 |
| Lord of Order                                                        |                8 |                 8 |                               0 |             8 |                   0 |
| Lycan                                                                |                5 |                 5 |                               2 |             7 |                   0 |
| Mage - Sorcerer                                                      |                5 |                 5 |                               2 |             7 |                   0 |
| Martial Artist (MA) - Master Martial Artist (MMA)                    |                5 |                 5 |                               3 |             8 |                   0 |
| Master Ranger (MR) - Ranger                                          |                5 |                 5 |                               2 |             7 |                   0 |
| MechaJouster (MJ)                                                    |                5 |                 5 |                               3 |             8 |                   0 |
| MindBreaker (MB)                                                     |                5 |                 5 |                               3 |             8 |                   0 |
| Naval Commander (NC) - Heroic/Legendary Naval Commander (HNC/LNC)    |                5 |                 5 |                               3 |             8 |                   0 |
| Necromancer (Necro) - Pinkomancer                                    |                5 |                 5 |                               3 |             8 |                   0 |
| Ninja - Assassin - Ninja Warrior                                     |                5 |                 5 |                               2 |             7 |                   0 |
| Northlands Monk (NLM)                                                |                5 |                 5 |                               3 |             8 |                   0 |
| Oracle                                                               |                5 |                 5 |                               3 |             8 |                   0 |
| Paladin - Silver Paladin                                             |                5 |                 5 |                               3 |             8 |                   0 |
| Prismatic/Evolved ClawSuit (PCS/ECS)                                 |                5 |                 5 |                               2 |             7 |                   0 |
| Psionic MindBreaker (PMB)                                            |                5 |                 5 |                               3 |             8 |                   0 |
| Pyromancer (Pyro) - Pink Romancer (PR)                               |                5 |                 5 |                               3 |             8 |                   0 |
| Rogue - Renegade                                                     |                5 |                 5 |                               2 |             7 |                   0 |
| Scarlet Sorceress (SS)                                               |                5 |                 5 |                               3 |             8 |                   0 |
| Scion of Flames (SoF)                                                |                5 |                 5 |                               3 |             8 |                   0 |
| Sentinel                                                             |                5 |                 5 |                               3 |             8 |                   0 |
| ShadowScythe General (SSG)                                           |                5 |                 5 |                               3 |             8 |                   0 |
| Shaman                                                               |                5 |                 5 |                               2 |             7 |                   0 |
| SkyCharged Grenadier (SCG)                                           |                5 |                 5 |                               3 |             8 |                   0 |
| SkyGuard Grenadier (SGG)                                             |                5 |                 5 |                               3 |             8 |                   0 |
| Sovereign of Storms (SoS)                                            |                5 |                 5 |                               3 |             8 |                   0 |
| Star Captain (StC)                                                   |                5 |                 5 |                               3 |             8 |                   0 |
| Stone Crusher (SC) - Infinity Titan (IT)                             |                5 |                 5 |                               2 |             7 |                   0 |
| Thief of Hours (ToH)                                                 |                5 |                 5 |                               2 |             7 |                   0 |
| Troll Spellsmith (TSS)                                               |                5 |                 5 |                               3 |             8 |                   0 |
| Ultra OmniKnight (UOK) - Dark Ultra OmniNight (DUON)                 |                5 |                 5 |                               3 |             8 |                   0 |
| Undead Goat - Unundead Goat (UG)                                     |                5 |                 5 |                               3 |             8 |                   0 |
| UndeadSlayer (US)                                                    |                5 |                 4 |                               4 |             8 |                   1 |
| Vampire Lord (VL) - Enchanted/Royal Vampire Lord (EVL/RVL)           |                5 |                 5 |                               3 |             8 |                   0 |
| Verus DoomKnight (VDK)                                               |                5 |                 5 |                               3 |             8 |                   0 |
| Vindicator Of They (VoT) - The Collector (TC)                        |                5 |                 5 |                               3 |             8 |                   0 |
| Void Highlord (VHL) - Debris Highlord (DHL)                          |                5 |                 5 |                               3 |             8 |                   0 |
| Warrior - Beast Warrior - Pumpkin Lord - Warlord                     |                5 |                 5 |                               2 |             7 |                   0 |
| Yami no Ronin (YnR)                                                  |                5 |                 4 |                               4 |             8 |                   1 |
| Chronomancer (CM) - Chronomancer Prime (CMP)                         |                5 |                 5 |                               2 |             7 |                   0 |
| Infinity/Interstellar Knight (IK)                                    |                5 |                 5 |                               3 |             8 |                   0 |
| ShadowWalker/Stalker/Weaver of Time (SWoT/SSoT)                      |                3 |                 3 |                               5 |             8 |                   0 |
| Eternal/Immortal/Empyrean Chronomancer (ECM/ICM)                     |               30 |                 5 |                               3 |             8 |                  25 |
| Phantom/Phantasm Chronomancer (PhCM)                                 |                5 |                 5 |                               3 |             8 |                   0 |
| Archivist of Time/Temporis (AoT)                                     |                5 |                 5 |                               3 |             8 |                   0 |
| CardClasher (CC)                                                     |                5 |                 5 |                               3 |             8 |                   0 |
| Great Thief (GT)                                                     |                5 |                 5 |                               3 |             8 |                   0 |
| Legion Paladin (LP)                                                  |                5 |                 5 |                               3 |             8 |                   0 |
| Master of Moglins (MoM) - Dark Master of Moglins (DMoM)              |                5 |                 5 |                               3 |             8 |                   0 |
| NOT A MOD (NAM)                                                      |                5 |                 4 |                               4 |             8 |                   1 |
| PaladinSlayer (PS)                                                   |                5 |                 5 |                               3 |             8 |                   0 |

## Remaining original records

These are retained as audit data, excluded from the RPG ability bar, and have no runtime icon. Current independently sourced replacement abilities are separate records; keyboard slots are not inferred from HTML position.

| Class ID                                       | Legacy Skill ID    | Imported name                                             | Reason                                                                                                                                                                                                                                                                    |
| ---------------------------------------------- | ------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| archmage-am                                    | skill-1            | Incant                                                    | Imported active names differ from all five current named abilities on the exact ArchMage Wiki page. Preserve legacy records; add current abilities independently without assuming old-to-new skill equivalence or keyboard slots.                                         |
| archmage-am                                    | skill-2            | Immolate                                                  | Imported active names differ from all five current named abilities on the exact ArchMage Wiki page. Preserve legacy records; add current abilities independently without assuming old-to-new skill equivalence or keyboard slots.                                         |
| archmage-am                                    | skill-3            | Glaciate                                                  | Imported active names differ from all five current named abilities on the exact ArchMage Wiki page. Preserve legacy records; add current abilities independently without assuming old-to-new skill equivalence or keyboard slots.                                         |
| archmage-am                                    | skill-4            | Arcane Nova                                               | Imported active names differ from all five current named abilities on the exact ArchMage Wiki page. Preserve legacy records; add current abilities independently without assuming old-to-new skill equivalence or keyboard slots.                                         |
| archmage-am                                    | skill-5            | Ascension                                                 | Imported active names differ from all five current named abilities on the exact ArchMage Wiki page. Preserve legacy records; add current abilities independently without assuming old-to-new skill equivalence or keyboard slots.                                         |
| dragonslayer-ds                                | skill-1-variant-5  | Auto Attack                                               | Second imported five-slot set has four names absent from the current Dragonslayer Wiki page. Its duplicate Auto Attack name alone does not prove Class/variant identity. Keep the first source-matched five-slot set; quarantine the second set pending reclassification. |
| dragonslayer-ds                                | skill-2-variant-6  | Searing Steel                                             | Second imported five-slot set has four names absent from the current Dragonslayer Wiki page. Its duplicate Auto Attack name alone does not prove Class/variant identity. Keep the first source-matched five-slot set; quarantine the second set pending reclassification. |
| dragonslayer-ds                                | skill-3-variant-7  | Inspired                                                  | Second imported five-slot set has four names absent from the current Dragonslayer Wiki page. Its duplicate Auto Attack name alone does not prove Class/variant identity. Keep the first source-matched five-slot set; quarantine the second set pending reclassification. |
| dragonslayer-ds                                | skill-4-variant-8  | Piercing Wyvern's Eye                                     | Second imported five-slot set has four names absent from the current Dragonslayer Wiki page. Its duplicate Auto Attack name alone does not prove Class/variant identity. Keep the first source-matched five-slot set; quarantine the second set pending reclassification. |
| dragonslayer-ds                                | skill-5-variant-9  | Dragon's Demise                                           | Second imported five-slot set has four names absent from the current Dragonslayer Wiki page. Its duplicate Auto Attack name alone does not prove Class/variant identity. Keep the first source-matched five-slot set; quarantine the second set pending reclassification. |
| undeadslayer-us                                | skill-1            | Soul Slash                                                | Imported Soul Slash is not the current Wiki Auto Attack name. Add the current named ability separately; do not infer that old mechanics are equivalent.                                                                                                                   |
| yami-no-ronin-ynr                              | skill-4            | Kyuketsu                                                  | Imported Kyuketsu at legacy slot 4 is absent from the current named Wiki ability set. Preserve it as legacy; add Kettou independently.                                                                                                                                    |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-1-variant-5  | Corrupted Sand Strike/Timeless Strike (CSS/TS)            | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-2-variant-6  | Sand Rift/Timeless Rift (SR/TR)                           | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-3-variant-7  | Hourglass Inversion/Hourglass Reversal (HI/HR)            | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-4-variant-8  | Corruption Through Time/Distortion Through Time (CTT/DTT) | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-5-variant-9  | Temporal Collapse (TPC)                                   | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-1-variant-10 | Mortification                                             | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-2-variant-11 | Bleeding Time                                             | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-3-variant-12 | Temporal Reanimation                                      | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-4-variant-13 | ShadowScythe’s Past                                       | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-5-variant-14 | ShadowScythe’s Future                                     | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-1-variant-15 | Quantum Rift                                              | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-2-variant-16 | Quantum Fracture                                          | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-3-variant-17 | Quantum Shift                                             | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-4-variant-18 | Quantum Restructure                                       | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-5-variant-19 | Quantum Convergence                                       | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-1-variant-20 | Hammer of Virtue                                          | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-2-variant-21 | Radiant Rift                                              | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-3-variant-22 | Holy Vow                                                  | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-4-variant-23 | Divine Intervention                                       | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-5-variant-24 | Divine Retribution                                        | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-1-variant-25 | Fire!                                                     | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-2-variant-26 | Reload                                                    | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-3-variant-27 | Tracer Rounds                                             | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-4-variant-28 | FMJ Rounds                                                | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| eternal-immortal-empyrean-chronomancer-ecm-icm | skill-5-variant-29 | Silver Bullet                                             | 25 extra imported active records do not match the current Eternal/Immortal/Empyrean skill names. Preserve them for source-boundary/identity review and remove from this Class's playable slots.                                                                           |
| not-a-mod-nam                                  | skill-3            | Reasonable Attack                                         | Imported Reasonable Attack is not the current official name. Effect equivalence is not sufficiently established for an automatic name correction; retain legacy record and add current Reasonable Strike independently.                                                   |

Validation: artifacts/qa/class-icon-validation.json. Browser interaction/image-loading acceptance: **browser_launch_blocked**, 0 screenshots. DOM interaction tests passed, but do not replace browser layout checks.

## V12.6 continuation

133 Class profiles; 1080 runtime skills. Registry: 1080 records, 1042 verified, 38 quarantined/manual review, 0 invalid mappings. 154 new verified Calendar skill mappings; all integrated via shared registry. Do not equate represented Calendar pages with a complete tag inventory.

## V12.7 recovery

133 Class profiles; 1080 registry records, 1042 verified/integrated, 38 quarantined and 0 invalid mappings. Three additional source-complete Calendar icon sets integrated through the existing registry, without duplicates or replacement icons.

## V12.9 / V12.10

133 hồ sơ, 1080 bản ghi, 1042 icon xác minh và 38 bản ghi cách ly. Năm hồ sơ Calendar khôi phục đủ 39 icon. Passive đã đối chiếu 377/377. Xem V12_10_CLASS_SKILL_INSPECTION_REPORT.md và skill-audit.json để rà phần hiệu ứng/Range/Target thiếu.
