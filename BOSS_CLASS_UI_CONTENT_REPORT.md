# Boss / Class UI content refinement

Version 0.1.0. No push, deploy, external-project or Cloudflare/D1 changes.

## Changed source

- src/content/presentation/bosses.json; src/lib/boss-names.ts; src/lib/entity-colors.mjs: shared official name / encounter name / accessible per-entity dark and light accents.
- src/features/ultra/UltraBoss.tsx, BossDirectoryCard.tsx: all-caps Codex Hero, encounter subtitle, distinct map unlock and quest requirements; directory identity tones.
- src/styles/themes.css and src/styles/ultra/*.css: preserve Chaos dark neutral base and Endfield light neutral base; scope accents/borders/tabs/copy/join controls to each Boss; foreground on filled controls uses mode-specific contrast. Semantic status hues retained.
- src/lib/class-presentation.mjs; scripts/apply-class-ui.mjs; ClassDetail.tsx, ClassDirectory.tsx, AcquisitionInfo.tsx: source-backed purchase/quest/merge summaries, unlock details, four requested tier labels and per-Class accents.
- ClassCombos.tsx; SkillSequenceFlow.tsx; ClassSkills.tsx; src/styles/classes/*.css: compact source-preserving icon flows, alternative sequences, expandable timing/conditions and subordinate rank/passive notes within their owning skill. Independent passives are not falsely merged.
- scripts/collect-linked-class-art.mjs; art-variants.json / art-runtime.json; ClassArtSelector.tsx: canonical same-skills/group identity verification plus exact matching named skills for portrait-only linked skins.
- tests/boss-class-presentation.test.mjs; existing interaction tests; scripts/qa-boss-class-ui.mjs; build pipeline and audits.

## Boss names / themes

- ultra-ezrajal: ULTRA EZRAJAL / Ultra Ezrajal; dark #D6BF73, light #6B4F12
- ultra-warden: ULTRA WARDEN / Ultra Warden; dark #9CCBD1, light #24616B
- ultra-engineer: ULTRA ENGINEER / Ultra Engineer; dark #E8AC64, light #8B460D
- ultra-tyndarius: ULTRA AVATAR TYNDARIUS / Ultra Tyndarius; dark #F19A65, light #A23C1A
- ultra-dage: DAGE THE DARK LORD / Ultra Dage; dark #6FC8EC, light #146386
- ultra-nulgath: NULGATH THE ARCHFIEND / Ultra Nulgath; dark #BE8BEE, light #6B329A
- ultra-drago: KING DRACO / Ultra Drago; dark #F18B98, light #9F2840
- ultra-speaker: THE FIRST SPEAKER / Ultra Speaker; dark #F08D94, light #A32436
- god-of-the-depths: GOD OF THE DEPTHS / God of the Depths; dark #61CBC3, light #176B65
- kolr-usurper-of-flames: KOLR, USURPER OF FLAMES / Kolr, Usurper of Flames; dark #F4AC68, light #98440A
- astral-empyrean: ASTRAL EMPYREAN / Astral Empyrean; dark #AEC0FF, light #4C4FA2
- champion-drakath: CHAMPION DRAKATH / Champion Drakath; dark #BB90FF, light #7336AA
- darkon-the-conductor: DARKON THE CONDUCTOR / Ultra Darkon; dark #E899BD, light #9B315D
- gramiel-the-graceful: GRAMIEL THE GRACEFUL / Ultra Gramiel; dark #A5D9AA, light #2E6C41
- kasuko: KASUKO / Kasuko; dark #85D2EC, light #216C88
- batara-kala: BATARA KALA / Batara Kala; dark #E2B37A, light #8E531E
- ultra-iara: ULTRA IARA / Ultra Iara; dark #93DABB, light #226B50

For encounters without a separately sourced Ultra alias, subtitle retains the source encounter name; no invented Ultra prefix. King Draco is the requested display spelling; canonical King Drago and /join ultradrago remain unchanged. All accent text colors meet calculated 4.5:1 contrast against their intended surface (not a substitute for browser visual inspection).

## Class coverage

- 133 acquisition summaries derive from structured methods, never a generic Wiki instruction. Calendar code / badge restrictions retained when the item price is 0 AC. 0 AC is labeled Free only when the source method is fully reviewed, unconditional and non-member.
- 133 tier labels use Newbie / Midgame / Lategame / Endgame. These are editorial classifications; provisional fallbacks are explicitly documented in difficultyBasis and the UI tooltip/disclosure, not claimed as official Wiki difficulty.
- 133 routes share the new Combo UI; 133 have sourced combo data. The remaining 0 do not receive invented rotations. Numeric chains and every source instruction remain recoverable in flow conditions / detailed notes.
- 304 artwork mappings; 18 Classes have a functional selector for multiple distinct images; 50 grouped Classes include source-confirmed linked skin previews. VHL ↔ Debris Highlord is integrated, with identity labels; gender labels are hidden in the current UI. Skill/icon sets and progression are preserved during portrait changes.
- Four stable random Class recommendations retained. Calendar filter and three actual content tabs retained.

## Verification

- lint: passed (artifacts/qa/v12-6/lint.log)
- typecheck: passed (artifacts/qa/v12-6/typecheck.log)
- test: passed (artifacts/qa/v12-6/test.log)
- test:semantic: passed (artifacts/qa/v12-6/test-semantic.log)
- assets:validate-class-skills: passed (artifacts/qa/v12-6/assets-validate-class-skills.log)
- build: passed (artifacts/qa/v12-6/build.log)
- test:build: passed (artifacts/qa/v12-6/test-build.log)
- test:server: passed (artifacts/qa/v12-6/test-server.log)

Browser: browser_launch_blocked; 0 screenshots generated by this run. Chromium is blocked by macOS sandbox MachPortRendezvous Permission denied (1100); WebKit also failed launch in the existing diagnostics. No manual/visual pass claimed. External command: node scripts/qa-boss-class-ui.mjs (375/768/1440/1920, both modes; five requested Boss pages, VHL, LR, Dragon of Time, ArchPaladin). Existing verified Speaker six-team tables and Glowing Zone illustration retained.

## Needs further verification

- 8 Class acquisition records still have partial linked shop/quest evidence; 11 individual methods have incomplete secondary details. Prices are not invented.
- Editorial tiers need more individual gameplay/source review, especially the provisional Midgame fallback.
- Skills without an explicit source relationship remain independent passives; no invented parent/rank associations.
- 115 Classes lack two distinct verified art images. Skin preview does not claim to emulate different in-game animation or icon sets.
- V12.6 Calendar source/asset and two Infernal encounter gaps remain as documented in their audits.
- Actual computed layout/hover/dialog verification remains blocked; Vite still warns about large chunks.

Linked cosmetic previews:
- Abyssal Angel (AA) - Abyssal Angel's Shadow (AAS)
- Alpha Omega/DOOMmega (AO)
- Alpha Pirate - Pirate
- ArchFiend (AF)
- ArchPaladin
- Artifact/Antique Hunter (AH)
- BeastMaster
- Berserker/Beta Berserker/Brutal Berserker
- Blood Ancient (BA)
- Blood Titan (BT) - FrostBlood Titan (FBT)
- Chrono Assassin (CA)
- Chunin - Imperial Chunin (ImC)
- Classic Legion DoomKnight (CLDK)
- Cryomancer (Cryo) - Dark/Sakura Cryomancer
- DeathKnight (DK)
- DoomKnight (DmK)
- Dragonslayer (DS)
- Drakel Warlord (DW)
- Eternal Inversionist (EI)
- Evolved Leprechaun (EL)
- Evolved Pumpkin Lord (EPL)
- Evolved Shaman (ES)
- Frostval Barbarian (FB)
- Glacial Berserker (GB)
- Glacial/Glaceran Warlord - Dark/Savage Glaceran Warlord (GW/DGW/SGW)
- Horc Evader (HE)
- Legendary Hero (LH) - Dark Legendary Hero (DLH)
- Legion DoomKnight (LDK)
- Lord of Order
- Lycan
- Mage - Sorcerer
- Martial Artist (MA) - Master Martial Artist (MMA)
- Master Ranger (MR) - Ranger
- Northlands Monk (NLM)
- Paladin - Silver Paladin
- Pyromancer (Pyro) - Pink Romancer (PR)
- Rogue - Renegade
- ShadowScythe General (SSG)
- SkyGuard Grenadier (SGG)
- Stone Crusher (SC) - Infinity Titan (IT)
- Troll Spellsmith (TSS)
- Ultra OmniKnight (UOK) - Dark Ultra OmniNight (DUON)
- UndeadSlayer (US)
- Vampire Lord (VL) - Enchanted/Royal Vampire Lord (EVL/RVL)
- Vindicator Of They (VoT) - The Collector (TC)
- Void Highlord (VHL) - Debris Highlord (DHL)
- Warrior - Beast Warrior - Pumpkin Lord - Warlord
- Chronomancer (CM) - Chronomancer Prime (CMP)
- Phantom/Phantasm Chronomancer (PhCM)
- Timeless Chronomancer (AC)
