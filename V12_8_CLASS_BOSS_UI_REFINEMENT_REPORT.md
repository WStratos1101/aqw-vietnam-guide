# V12.8 Class / Boss UI refinement

Version 0.1.0. No push/deploy or external-project changes.

1. Shared components changed: ClassDirectory, ClassArtSelector, ClassAsset, ClassDetail, ClassCombos, SkillSequenceFlow, ClassSkills, TargetEffects, ClassAcquisitionPanel, ClassInspectionTabs, BossOfficialTitle, UltraBoss / fallback ChallengeDetail, ChallengeCodex and Shell Footer.
2. Directory categories: Tất cả | Newbie | Midgame | Lategame | Endgame | Calendar. Calendar membership overrides display category only; role/progression data is preserved. Calendar never enters ordinary progression filters.
3. 26 Calendar grouped profiles, 26 with verified original Calendar year, sorted oldest first then official profile name; 0 unknown-year profiles would sort last. Sources distinguish original Calendar year from reissue date (e.g. 2012 origin / 2021 ChronoChaorruptor variant).
4. Art uses a bounded normal-flow frame, height clamp(280px,40vw,540px), max 65vh; mobile 360px / max 55vh. Parent fixed height removed. Images contain rather than crop, stay within natural dimensions, and cannot escape over tabs. Actual browser geometry still pending.
5. 18 Class identities expose real alternative selectors after deduplicating gender and duplicate image variants. Selector is before artwork. VHL ↔ Debris Highlord works without changing Class ID, skills, combo or progress. Male/Female assets retained in registries but gender buttons removed.
6. Combo viewer reconstructs scoped source sections and renders only selected rotation. Defensive VHL does not include Offensive/Max-DPS blocks; its DEF/HoT caution is retained. Unit and DOM interaction tests cover this.
7. Explicit spam skill numbers use a framed Repeat group; stop conditions are extracted only from source wording such as đến khi / until. No fabricated aura, stack threshold or timer. Negative “không nên spam” becomes a warning, never a spam instruction.
8. TargetEffects renders independent Self / Ally / Enemy effects in equal rows with yellow / blue / red target labels; content text remains neutral. VHL Contract retains Soul Fend/Soul Breach, 5s, five stacks and Shackled/Unshackled conditions. Passive / Rank Passive share navigation while retaining distinct sourced effect identities.
9. Removed Directory metadata accordion, generic intro/status prose, original source notes, raw Wiki comparison, Class sources/timestamps and generic acquisition verification panels. Sources/English data remain internal. Specific missing fields use short Chưa xác minh labels.
10. Shared Codex font variables are reused exactly. --codex-title-gold is #E0BC70 dark / #795612 light; Boss identity accents remain separate.
11. Quick navigation contains Enhancement and Ultra Boss; four stable random Class cards remain separate. Artix / AQW / asset policy / Wiki / CC BY-SA attribution is in Footer below Bản quyền Website thuộc về W.Stratos, explicitly distinguishing website authorship from third-party IP.
12. BossOfficialTitle spans Hero width, starts with a conservative container-relative size, then measures/refits on font readiness and ResizeObserver changes. It uses ALL CAPS, nowrap plus actual sizing, no ellipsis, crop or fixed narrow column. Applies to main and fallback/shared Challenge Heroes. Visual one-line fit is not yet browser-certified.
13. Gramiel: GRAMIEL THE GRACEFUL / Ultra Gramiel. Darkon: DARKON THE CONDUCTOR / Ultra Darkon. Nulgath / King Draco and per-Boss themes retained.

## Verification

- lint: passed (artifacts/qa/v12-6/lint.log)
- typecheck: passed (artifacts/qa/v12-6/typecheck.log)
- test: passed (artifacts/qa/v12-6/test.log)
- test:semantic: passed (artifacts/qa/v12-6/test-semantic.log)
- assets:validate-class-skills: passed (artifacts/qa/v12-6/assets-validate-class-skills.log)
- build: passed (artifacts/qa/v12-6/build.log)
- test:build: passed (artifacts/qa/v12-6/test-build.log)
- test:server: passed (artifacts/qa/v12-6/test-server.log)

Browser: browser_launch_blocked; 0 browser cases executed, 0 screenshots. No Visual Passed claim. External: npm run qa:v12-8; viewport matrix 1440×900, 1920×1080, 768×1024, 375×812, both themes. Checks title fit, image/frame/tab geometry, gender-free selector, scoped combo, target labels, Calendar exclusion and console/images/overflow.

## Alternatives currently available

- Alpha Pirate - Pirate
- Artifact/Antique Hunter (AH)
- Berserker/Beta Berserker/Brutal Berserker
- Blood Titan (BT) - FrostBlood Titan (FBT)
- Chunin - Imperial Chunin (ImC)
- Cryomancer (Cryo) - Dark/Sakura Cryomancer
- Glacial/Glaceran Warlord - Dark/Savage Glaceran Warlord (GW/DGW/SGW)
- Legendary Hero (LH) - Dark Legendary Hero (DLH)
- Legion DoomKnight (LDK)
- Lord of Order
- Martial Artist (MA) - Master Martial Artist (MMA)
- Master Ranger (MR) - Ranger
- Paladin - Silver Paladin
- Stone Crusher (SC) - Infinity Titan (IT)
- Ultra OmniKnight (UOK) - Dark Ultra OmniNight (DUON)
- Void Highlord (VHL) - Debris Highlord (DHL)
- Chronomancer (CM) - Chronomancer Prime (CMP)
- Phantom/Phantasm Chronomancer (PhCM)

## Data remaining

See V12_7_DATA_COMPLETION_REPORT.md. There are 8 partial acquisition profiles, 3 original Calendar pages still incomplete, two incomplete Arena profiles (one with recovered stats), and 79 low-confidence progression metadata records. No data gap is silently marked complete by a UI refactor.
