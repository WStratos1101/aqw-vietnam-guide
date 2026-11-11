# V10 recovery — Version 0.1.0

- 17 Boss, grouped 7 Daily / 7 Weekly / 3 Seasonal. All 17 use UltraDetail; raw Docs detail branch removed.
- 11 Boss meet every strict completion field; 6 retain missing/needs_verification fields. This is deliberately stricter than a successful route/build.
- Nine recovered profiles: God of the Depths, Kolr, Usurper of Flames, Astral Empyrean, Champion Drakath, Darkon the Conductor, Gramiel the Graceful, Kasuko, Batara Kala, Ultra Iara.
- 76 sourced Active records (phase variants retained), 44 Passive/base-stat records; distinct Monster records and images for Tendril, Whirlpool, Grace Crystal.
- 46 structured community teams. CDK = Chrono DragonKnight confirmed by user. DT and EDoT both resolve to Dragon of Time, confirmed by the user; choices are deduplicated within each slot, while separate player slots are retained.
- 112 item routes converted from exact Wiki recipes. Poleaxe includes Algie's Bow and Dene's Axe recipes, LV80, 27–33, +75% Human.
- Nulgath: Empowered Overfiend Blade; Empowered Ungodly Reavers; Empowered Shadow Spear; Empowered Bloodletter; Empowered Prismatic Manslayer; Empowered Prismatic Manslayers; Empowered Oblivion Blade; Empowered Charged Oblivion Blade; Empowered Legacy of Nulgath; Empowered Worshipper of Nulgath; Empowered Evolved Void; Empowered Evolved Fiend; Empowered Evolved Blood; Empowered Evolved Hex; Empowered Evolved Shadow; Empowered Sole Bloodletter.
- Dage: Empowered BladeMaster; Empowered BladeMaster's Katana; Empowered Dual Katanas; Empowered Caladbolg; Empowered Dual Caladbolgs; Empowered Dark Caster; Empowered Forge Spawn; Empowered Lich King; Empowered Paragon Plate; Empowered Undead Champion; Empowered Hollowborn Caladbolg; Empowered Dual Hollowborn Caladbolgs; Empowered Prismatic Paragon; Empowered Bonfire Altar.
- Boss portraits: all 17 primary images approved/local. 12 recovered Monster portraits, including adds.
- Canonical equipment images: 113/113; missing 0. Individual missing entities and material icons are listed in EQUIPMENT_IMAGE_AUDIT.md. Missing legacy labels can be grouped descriptions, not necessarily valid single items.
- Materials and quest details default closed; dependency milestones and persisted trackers preserved. Weekly observations remain separate from permanent acquisition steps; existing route/quest IDs reused when replacing a legacy item route.
- Browser: 136/136 passed contexts recorded (17 × 4 widths × 2 themes); original equipment contact sheets and page screenshots in qa/recovery. These results do not automatically validate unknown game facts.

## Source conflicts resolved

- God of the Depths: Wiki names Endless Nightmare, not the community label Explosion.
- Kolr: Wiki names individual attacks and the Invulnerable → Flames of the Forges → Extinguished sequence.
- Astral Empyrean: Astral Beam is the official attack name.
- Gramiel: Wiki Grace Burst/Grace Drain and phase-specific names take priority over community Scorching Light/Grace Explosion; Death's Door uses the Wiki HP formula.
- Kasuko: Ignited replaces community Lava Breath; Wiki shield exponent 0.8 takes priority over community 0.4. Explosion uses current HP per Wiki.
- Batara Kala: Wiki attack timing and Vulnerable sequence take priority over community shorthand Club Smash.
- Monster level is distinct from recommended/access level (Darkon 22; Ultra Iara 70). Celestial Paladin uses variant (2) from Nova Shrine Gifts.

## Limits

- Google Sites failed through the web tool but public pages were read successfully with Terminal HTTP requests. Google Drive connector read the full Challenge Guide, revision 2026-10-27. Wiki snapshots are cached under content-sources/recovery; intermittent Terminal connection failures used web fallback for Dual Darkon's Debris 2.
- Some source effect wording and canonical aliases still need editorial verification; no unverified numerical damage was invented. No Normal/Unstable threshold was invented.
- Unknown quest prerequisites and Taunt applicability remain needs_verification, never not_applicable merely because a list is empty.
- Route-level splitting keeps Boss and Class modules deferred on Homepage; a large deferred content chunk still triggers a build warning. No new dependencies; no push/deploy; Rebiomed untouched.

Current execution results and unresolved source fields: see V10_DATA_RECOVERY_REPORT.md. This generated inventory does not certify browser or build results by itself.
