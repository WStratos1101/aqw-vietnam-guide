# FARM DATA AUDIT — Farm V2

2026-11-13 · package 0.2.0 · HEAD 4962382a7b9dc41d02a348e41e5aa123e70156d7. **PARTIAL**.

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

## Sources

- **A — PARTIAL**: 147 VNCollector snapshots (root + 146 children), text/links retained; 760 embedded image references await visual reconciliation. Cached access is not a fresh live verification.
- **B — PARTIAL / embedded scope BLOCKED**: Google Docs text-only-live snapshot, 545316 characters. Previous native connector/HTML export attempts timed out. A bounded alternate web-tool HTML export probe was also inaccessible; details: artifacts/qa/farm/resume/source-probe.json. Older project export is also paragraph-only and supplies no missing rich links/tables/images. Live text export read in full by pipeline; connector and HTML export timed out. Embedded links/tables/images unverified.
- **Wiki — PARTIAL**: bounded batch of 24 newly queued URLs all failed with No route to host (log: artifacts/qa/farm/resume/source-batch-next.log); no repeat attempt. Exact existing shared caches recovered 66 URL bodies without network or fresh dates. 50 have literal A/B title matches and normalized records; the others remain access evidence, not invented items. 1104 URLs remain unresolved.
- 139 retained Wiki fetch errors are attempt history; 3 now have valid cached bodies. Do not equate every historical fetch error with a currently missing page. Sources and per-record dates remain in source-access.json/wiki-records.json.

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

| Category | Canonical items |
|---|---|
| Weapons | 94 |
| Armors | 54 |
| Helms | 36 |
| Capes / Back Items | 10 |
| Pets | 15 |
| Classes | 23 |

| Region | Canonical items |
|---|---|
| Greenguard Forest | 4 |
| Dwarfhold | 2 |
| Arcangrove | 1 |
| Doomwood Part 2 | 18 |

Canonical IDs/URLs are unique under validator; Regions may overlap and are not additive. Curated recipes, nested AND/OR, routes and prerequisites remain authoritative. New cached evidence never supplies an invented verification date.

## Outstanding work

- **PARTIAL**: 209 items need field-level review; 207 entirely lack Region and 208 have a missing/unknown route Region. No guessed map commands, prices, quantities or Region assignments.
- **PARTIAL**: 199 images missing; 33 approved local images include 16 newly reused exact Class portraits. Shared Class source URL, Class ID, portrait ID, usage policy and SHA256 must match.
- **UNVERIFIED**: 8612 context lines and 760 embedded graphics. These are not counts of missing equipment.
- 23 verified items are inherited curated snapshots, not fresh full item verification. Availability in game remains separate.
- **Class/Combo**: 133 profiles / 210 combos / 675 Class+slot references audited; 2 unresolved references. Yami no Ronin sourced-0 and sourced-2 reference quarantined legacy Kyuketsu at slot 4; current Kettou has a verified icon but is not silently substituted into old combos. Existing registry validation: 1042 verified, 38 review, 0 invalid mappings (artifacts/qa/class-icon-validation.json). No random icon replacements.
- **Browser QA — UNVERIFIED / NOT RUN this session**: no Chromium, WebKit, Playwright.app or Smoke executed in Codex; no new screenshots. Prior sandbox failures are historical only. External Chromium run and visual review remain required.
- Production build retains existing >500 kB chunk warnings. No push/deploy/AutoSync/Auto Publish or D1 changes.

## Item ledger

| ID / Wiki | Category | Verification | Region | Image |
|---|---|---|---|---|
| [blade-of-awe](https://aqwwiki.wikidot.com/blade-of-awe) | Weapons | verified | greenguard-forest | missing |
| [armor-of-awe](https://aqwwiki.wikidot.com/armor-of-awe-armor) | Armors | verified | greenguard-forest | missing |
| [helm-of-awe](https://aqwwiki.wikidot.com/helm-of-awe) | Helms | needs-review | greenguard-forest | missing |
| [cape-of-awe](https://aqwwiki.wikidot.com/cape-of-awe) | Capes / Back Items | verified | greenguard-forest | missing |
| [aureate-shield-aegis](https://aqwwiki.wikidot.com/aureate-shield-aegis) | Armors | verified | dwarfhold | missing |
| [polly-roger](https://aqwwiki.wikidot.com/polly-roger) | Pets | verified | dwarfhold | missing |
| [sepulchure-s-doomknight-armor](https://aqwwiki.wikidot.com/sepulchure-s-doomknight-armor) | Armors | needs-review | doomwood-part-2 | missing |
| [blinding-light-of-destiny](https://aqwwiki.wikidot.com/blinding-light-of-destiny-axe) | Weapons | verified | unknown | missing |
| [necrotic-sword-of-doom](https://aqwwiki.wikidot.com/necrotic-sword-of-doom-sword) | Weapons | verified | unknown | missing |
| [sepulchure-s-original-helm](https://aqwwiki.wikidot.com/sepulchure-s-original-helm) | Helms | verified | unknown | missing |
| [original-drakath-armor](https://aqwwiki.wikidot.com/original-drakath-armor) | Armors | verified | unknown | missing |
| [chaorrupter-unlocked-free-player](https://aqwwiki.wikidot.com/chaorrupter-unlocked-free-player) | Weapons | verified | unknown | missing |
| [archfiend-doomlord](https://aqwwiki.wikidot.com/archfiend-doomlord) | Armors | verified | unknown | missing |
| [head-of-the-legion-beast](https://aqwwiki.wikidot.com/head-of-the-legion-beast) | Helms | verified | unknown | missing |
| [exalted-apotheosis](https://aqwwiki.wikidot.com/exalted-apotheosis) | Weapons | verified | unknown | approved local |
| [dual-exalted-apotheosis](https://aqwwiki.wikidot.com/dual-exalted-apotheosis) | Weapons | verified | unknown | approved local |
| [sin-of-the-abyss](https://aqwwiki.wikidot.com/sin-of-the-abyss) | Weapons | verified | unknown | approved local |
| [empowered-undead-champion](https://aqwwiki.wikidot.com/empowered-undead-champion) | Armors | verified | unknown | approved local |
| [infernal-flame-khopesh](https://aqwwiki.wikidot.com/infernal-flame-khopesh) | Weapons | verified | unknown | approved local |
| [greatblade-of-the-entwined-eclipse](https://aqwwiki.wikidot.com/greatblade-of-the-entwined-eclipse) | Weapons | verified | unknown | approved local |
| [greatblade-of-the-solstice-moon](https://aqwwiki.wikidot.com/greatblade-of-the-solstice-moon) | Weapons | verified | unknown | approved local |
| [greatblade-of-the-midnight-sun](https://aqwwiki.wikidot.com/greatblade-of-the-midnight-sun) | Weapons | verified | unknown | approved local |
| [drago-s-royal-guard](https://aqwwiki.wikidot.com/drago-s-royal-guard) | Armors | verified | unknown | approved local |
| [malgor-s-shadowflame-blade](https://aqwwiki.wikidot.com/malgor-s-shadowflame-blade) | Weapons | verified | unknown | approved local |
| [shaman](https://aqwwiki.wikidot.com/shaman) | Classes | verified | arcangrove | approved local |
| [adeptus-kathooli](https://aqwwiki.wikidot.com/adeptus-kathooli) | Armors | needs-review | unknown | approved local |
| [altar-of-vordred](https://aqwwiki.wikidot.com/altar-of-vordred) | Weapons | needs-review | unknown | missing |
| [ancient-shogun-helm](https://aqwwiki.wikidot.com/ancient-shogun-helm) | Helms | needs-review | unknown | missing |
| [ancient-shogun-katanas](https://aqwwiki.wikidot.com/ancient-shogun-katanas) | Weapons | needs-review | unknown | missing |
| [arcane-blade-of-glory](https://aqwwiki.wikidot.com/arcane-blade-of-glory) | Weapons | needs-review | unknown | missing |
| [arch-doomknight](https://aqwwiki.wikidot.com/arch-doomknight) | Armors | needs-review | unknown | missing |
| [archfiend-enchanted-orbs](https://aqwwiki.wikidot.com/archfiend-enchanted-orbs) | Weapons | needs-review | unknown | missing |
| [archfiend-warlord](https://aqwwiki.wikidot.com/archfiend-warlord) | Armors | needs-review | unknown | missing |
| [armor-of-zular](https://aqwwiki.wikidot.com/armor-of-zular) | Armors | needs-review | unknown | missing |
| [aspect-of-luxuria](https://aqwwiki.wikidot.com/aspect-of-luxuria) | Helms | needs-review | unknown | missing |
| [astral-mantle](https://aqwwiki.wikidot.com/astral-mantle) | Armors | needs-review | unknown | missing |
| [avatar-of-death-s-scythe](https://aqwwiki.wikidot.com/avatar-of-death-s-scythe) | Weapons | needs-review | unknown | missing |
| [awethur-s-accoutrements](https://aqwwiki.wikidot.com/awethur-s-accoutrements) | Weapons | needs-review | unknown | missing |
| [beast-warrior](https://aqwwiki.wikidot.com/beast-warrior) | Classes | needs-review | unknown | missing |
| [beetle-warlord-pet](https://aqwwiki.wikidot.com/beetle-warlord-pet) | Pets | needs-review | unknown | missing |
| [behemoth-blade-of-shadow](https://aqwwiki.wikidot.com/behemoth-blade-of-shadow) | Weapons | needs-review | unknown | missing |
| [binky-s-uni-horn](https://aqwwiki.wikidot.com/binky-s-uni-horn) | Weapons | needs-review | unknown | missing |
| [black-oversoul-cape](https://aqwwiki.wikidot.com/black-oversoul-cape) | Capes / Back Items | needs-review | unknown | missing |
| [black-star-blade](https://aqwwiki.wikidot.com/black-star-blade) | Weapons | needs-review | unknown | missing |
| [blaze-of-awe](https://aqwwiki.wikidot.com/blaze-of-awe) | Weapons | needs-review | unknown | approved local |
| [blinding-blade-of-destiny](https://aqwwiki.wikidot.com/blinding-blade-of-destiny) | Weapons | needs-review | unknown | missing |
| [blinding-bow-of-destiny](https://aqwwiki.wikidot.com/blinding-bow-of-destiny) | Weapons | needs-review | unknown | missing |
| [blinding-mace-of-destiny](https://aqwwiki.wikidot.com/blinding-mace-of-destiny) | Weapons | needs-review | unknown | missing |
| [blinding-scythe-of-destiny](https://aqwwiki.wikidot.com/blinding-scythe-of-destiny) | Weapons | needs-review | unknown | missing |
| [blood-ranger-bow](https://aqwwiki.wikidot.com/blood-ranger-bow) | Weapons | needs-review | unknown | missing |
| [blood-ranger-cape](https://aqwwiki.wikidot.com/blood-ranger-cape) | Capes / Back Items | needs-review | unknown | missing |
| [blood-ranger-morph](https://aqwwiki.wikidot.com/blood-ranger-morph) | Helms | needs-review | unknown | missing |
| [blood-ranger-sword-and-sheath](https://aqwwiki.wikidot.com/blood-ranger-sword-and-sheath) | Weapons | needs-review | unknown | missing |
| [blood-sorceress](https://aqwwiki.wikidot.com/blood-sorceress) | Classes | needs-review | unknown | missing |
| [bounty-hunter-s-drone-pet](https://aqwwiki.wikidot.com/bounty-hunter-s-drone-pet) | Pets | needs-review | unknown | missing |
| [bow-of-destiny](https://aqwwiki.wikidot.com/bow-of-destiny) | Weapons | needs-review | doomwood-part-2 | missing |
| [bright-blade-of-destiny](https://aqwwiki.wikidot.com/bright-blade-of-destiny) | Weapons | needs-review | doomwood-part-2 | missing |
| [bright-bow-of-destiny](https://aqwwiki.wikidot.com/bright-bow-of-destiny) | Weapons | needs-review | doomwood-part-2 | missing |
| [bright-knight-armor](https://aqwwiki.wikidot.com/bright-knight-armor) | Armors | needs-review | unknown | missing |
| [bright-mace-of-destiny](https://aqwwiki.wikidot.com/bright-mace-of-destiny) | Weapons | needs-review | doomwood-part-2 | missing |
| [bright-paragon-pet](https://aqwwiki.wikidot.com/bright-paragon-pet) | Pets | needs-review | unknown | missing |
| [bright-scythe-of-destiny](https://aqwwiki.wikidot.com/bright-scythe-of-destiny) | Weapons | needs-review | doomwood-part-2 | missing |
| [broadsword-of-bane](https://aqwwiki.wikidot.com/broadsword-of-bane) | Weapons | needs-review | doomwood-part-2 | missing |
| [burning-sword-of-doom](https://aqwwiki.wikidot.com/burning-sword-of-doom) | Weapons | needs-review | unknown | approved local |
| [caladbolg](https://aqwwiki.wikidot.com/caladbolg) | Weapons | needs-review | unknown | missing |
| [candy-corn-crusher](https://aqwwiki.wikidot.com/candy-corn-crusher) | Armors | needs-review | unknown | missing |
| [celestial-archfiend](https://aqwwiki.wikidot.com/celestial-archfiend) | Armors | needs-review | unknown | missing |
| [celestial-pirate-commander](https://aqwwiki.wikidot.com/celestial-pirate-commander) | Armors | needs-review | unknown | missing |
| [chibi-vordred](https://aqwwiki.wikidot.com/chibi-vordred) | Pets | needs-review | unknown | missing |
| [classic-hollowborn-doomknight-armor](https://aqwwiki.wikidot.com/classic-hollowborn-doomknight-armor) | Armors | needs-review | unknown | missing |
| [classic-hollowborn-paladin-armor](https://aqwwiki.wikidot.com/classic-hollowborn-paladin-armor) | Armors | needs-review | unknown | missing |
| [combat-soulreaper-of-nulgath](https://aqwwiki.wikidot.com/combat-soulreaper-of-nulgath) | Weapons | needs-review | unknown | missing |
| [corrupted-dragon-slayer](https://aqwwiki.wikidot.com/corrupted-dragon-slayer) | Weapons | needs-review | unknown | missing |
| [crag-bamboozle](https://aqwwiki.wikidot.com/crag-bamboozle) | Pets | needs-review | unknown | missing |
| [crested-void-war-helm](https://aqwwiki.wikidot.com/crested-void-war-helm) | Helms | needs-review | unknown | missing |
| [crimson-face-plate-of-nulgath](https://aqwwiki.wikidot.com/crimson-face-plate-of-nulgath) | Helms | needs-review | unknown | missing |
| [crimson-orb-pet](https://aqwwiki.wikidot.com/crimson-orb-pet) | Pets | needs-review | unknown | missing |
| [crimson-plate-of-nulgath](https://aqwwiki.wikidot.com/crimson-plate-of-nulgath) | Armors | needs-review | unknown | missing |
| [crown-of-wrath](https://aqwwiki.wikidot.com/crown-of-wrath) | Helms | needs-review | unknown | missing |
| [crystal-phoenix-blade-of-nulgath](https://aqwwiki.wikidot.com/crystal-phoenix-blade-of-nulgath) | Weapons | needs-review | unknown | missing |
| [cursed-doomblade](https://aqwwiki.wikidot.com/cursed-doomblade) | Weapons | needs-review | unknown | missing |
| [cyber-crystal-phoenix-blade](https://aqwwiki.wikidot.com/cyber-crystal-phoenix-blade) | Weapons | needs-review | unknown | missing |
| [cyber-void-cape](https://aqwwiki.wikidot.com/cyber-void-cape) | Capes / Back Items | needs-review | unknown | missing |
| [cyber-void-light-of-destiny](https://aqwwiki.wikidot.com/cyber-void-light-of-destiny) | Weapons | needs-review | unknown | missing |
| [cyber-void-paladin](https://aqwwiki.wikidot.com/cyber-void-paladin) | Armors | needs-review | unknown | missing |
| [cyber-void-paladin-helm](https://aqwwiki.wikidot.com/cyber-void-paladin-helm) | Helms | needs-review | unknown | missing |
| [daggers-of-destruction](https://aqwwiki.wikidot.com/daggers-of-destruction) | Weapons | needs-review | doomwood-part-2 | missing |
| [dark-dragon-slayer](https://aqwwiki.wikidot.com/dark-dragon-slayer) | Armors | needs-review | unknown | missing |
| [dark-dragon-slayer-s-halberd](https://aqwwiki.wikidot.com/dark-dragon-slayer-s-halberd) | Weapons | needs-review | unknown | missing |
| [dark-lord](https://aqwwiki.wikidot.com/dark-lord) | Classes | needs-review | unknown | approved local |
| [darkon-s-debris-2-reconstructed](https://aqwwiki.wikidot.com/darkon-s-debris-2-reconstructed) | Weapons | needs-review | unknown | approved local |
| [divine-mantle](https://aqwwiki.wikidot.com/divine-mantle) | Armors | needs-review | unknown | missing |
| [divine-veil](https://aqwwiki.wikidot.com/divine-veil) | Helms | needs-review | unknown | missing |
| [divine-veil-and-locks](https://aqwwiki.wikidot.com/divine-veil-and-locks) | Helms | needs-review | unknown | missing |
| [doomtech-doomknight](https://aqwwiki.wikidot.com/doomtech-doomknight) | Armors | needs-review | unknown | missing |
| [dragon-of-time-class](https://aqwwiki.wikidot.com/dragon-of-time-class) | Classes | needs-review | unknown | approved local |
| [dragonblade-of-nulgath](https://aqwwiki.wikidot.com/dragonblade-of-nulgath) | Weapons | needs-review | unknown | missing |
| [dragonfire-of-nulgath](https://aqwwiki.wikidot.com/dragonfire-of-nulgath) | Weapons | needs-review | unknown | missing |
| [dragonlord-grandmaster](https://aqwwiki.wikidot.com/dragonlord-grandmaster) | Armors | needs-review | unknown | missing |
| [dragonlord-of-evil](https://aqwwiki.wikidot.com/dragonlord-of-evil) | Armors | needs-review | unknown | missing |
| [dragonoid-of-hours](https://aqwwiki.wikidot.com/dragonoid-of-hours) | Weapons | needs-review | unknown | missing |
| [dragonsoul-shinobi-class](https://aqwwiki.wikidot.com/dragonsoul-shinobi-class) | Classes | needs-review | unknown | missing |
| [drakath-the-eternal](https://aqwwiki.wikidot.com/drakath-the-eternal) | Armors | needs-review | unknown | missing |
| [drudgen-the-assistant](https://aqwwiki.wikidot.com/drudgen-the-assistant) | Pets | needs-review | unknown | missing |
| [dual-blinding-light-of-destiny](https://aqwwiki.wikidot.com/dual-blinding-light-of-destiny) | Weapons | needs-review | unknown | missing |
| [dual-caladbolgs](https://aqwwiki.wikidot.com/dual-caladbolgs) | Weapons | needs-review | unknown | missing |
| [dual-champion-blade-of-nulgath](https://aqwwiki.wikidot.com/dual-champion-blade-of-nulgath) | Weapons | needs-review | unknown | missing |
| [dual-hollowborn-shadows-of-fate](https://aqwwiki.wikidot.com/dual-hollowborn-shadows-of-fate) | Weapons | needs-review | unknown | missing |
| [dual-legion-soul-devourers](https://aqwwiki.wikidot.com/dual-legion-soul-devourers) | Weapons | needs-review | unknown | missing |
| [dual-tainted-claymore-of-nulgath](https://aqwwiki.wikidot.com/dual-tainted-claymore-of-nulgath) | Weapons | needs-review | unknown | missing |
| [dual-toxic-void-katanas](https://aqwwiki.wikidot.com/dual-toxic-void-katanas) | Weapons | needs-review | unknown | missing |
| [ebony-dragonblade-of-nulgath](https://aqwwiki.wikidot.com/ebony-dragonblade-of-nulgath) | Weapons | needs-review | unknown | missing |
| [eclipse-emperor](https://aqwwiki.wikidot.com/eclipse-emperor) | Armors | needs-review | unknown | missing |
| [eclipse-emperor-crown](https://aqwwiki.wikidot.com/eclipse-emperor-crown) | Helms | needs-review | unknown | missing |
| [elite-void](https://aqwwiki.wikidot.com/elite-void) | Armors | needs-review | unknown | missing |
| [empowered-vordred-s-armor](https://aqwwiki.wikidot.com/empowered-vordred-s-armor) | Armors | needs-review | unknown | missing |
| [eternity-blade](https://aqwwiki.wikidot.com/eternity-blade) | Weapons | needs-review | unknown | missing |
| [evolved-blood-guard](https://aqwwiki.wikidot.com/evolved-blood-guard) | Helms | needs-review | unknown | missing |
| [evolved-blood-of-nulgath](https://aqwwiki.wikidot.com/evolved-blood-of-nulgath) | Armors | needs-review | unknown | missing |
| [evolved-blood-orb](https://aqwwiki.wikidot.com/evolved-blood-orb) | Pets | needs-review | unknown | missing |
| [evolved-fiend-cape](https://aqwwiki.wikidot.com/evolved-fiend-cape) | Capes / Back Items | needs-review | unknown | missing |
| [evolved-fiend-helm](https://aqwwiki.wikidot.com/evolved-fiend-helm) | Helms | needs-review | unknown | missing |
| [evolved-fiend-of-nulgath](https://aqwwiki.wikidot.com/evolved-fiend-of-nulgath) | Armors | needs-review | unknown | missing |
| [evolved-hex-staff](https://aqwwiki.wikidot.com/evolved-hex-staff) | Weapons | needs-review | unknown | missing |
| [evolved-primal-orb](https://aqwwiki.wikidot.com/evolved-primal-orb) | Pets | needs-review | unknown | missing |
| [evolved-shadow-helm](https://aqwwiki.wikidot.com/evolved-shadow-helm) | Helms | needs-review | unknown | missing |
| [evolved-shadow-of-nulgath](https://aqwwiki.wikidot.com/evolved-shadow-of-nulgath) | Armors | needs-review | unknown | missing |
| [evolved-shadow-orb](https://aqwwiki.wikidot.com/evolved-shadow-orb) | Pets | needs-review | unknown | missing |
| [face-of-treachery](https://aqwwiki.wikidot.com/face-of-treachery) | Helms | needs-review | unknown | missing |
| [faces-of-violence](https://aqwwiki.wikidot.com/faces-of-violence) | Helms | needs-review | unknown | missing |
| [fiend-of-light](https://aqwwiki.wikidot.com/fiend-of-light) | Armors | needs-review | unknown | missing |
| [fire-champion-s-armor](https://aqwwiki.wikidot.com/fire-champion-s-armor) | Armors | needs-review | unknown | missing |
| [fortitude-hubris](https://aqwwiki.wikidot.com/fortitude-hubris) | Weapons | needs-review | unknown | missing |
| [frost-spiritreaver-class](https://aqwwiki.wikidot.com/frost-spiritreaver-class) | Classes | needs-review | unknown | approved local |
| [frost-spiritreaver-s-cloak](https://aqwwiki.wikidot.com/frost-spiritreaver-s-cloak) | Capes / Back Items | needs-review | unknown | missing |
| [frost-spiritreaver-s-hair](https://aqwwiki.wikidot.com/frost-spiritreaver-s-hair) | Helms | needs-review | unknown | missing |
| [frost-spiritreaver-s-locks](https://aqwwiki.wikidot.com/frost-spiritreaver-s-locks) | Helms | needs-review | unknown | missing |
| [gemstone-of-nulgath](https://aqwwiki.wikidot.com/gemstone-of-nulgath) | Pets | needs-review | unknown | missing |
| [gluttony-s-maw](https://aqwwiki.wikidot.com/gluttony-s-maw) | Helms | needs-review | unknown | missing |
| [gold-exalted-paladin](https://aqwwiki.wikidot.com/gold-exalted-paladin) | Armors | needs-review | unknown | missing |
| [golden-blade-of-fate-sword](https://aqwwiki.wikidot.com/golden-blade-of-fate-sword) | Weapons | needs-review | unknown | missing |
| [golden-hanzo-void](https://aqwwiki.wikidot.com/golden-hanzo-void) | Armors | needs-review | unknown | missing |
| [golden-inquisitor-of-shadowfall](https://aqwwiki.wikidot.com/golden-inquisitor-of-shadowfall) | Armors | needs-review | unknown | missing |
| [headless-pumpkin](https://aqwwiki.wikidot.com/headless-pumpkin) | Armors | needs-review | unknown | missing |
| [healer](https://aqwwiki.wikidot.com/healer) | Classes | needs-review | unknown | approved local |
| [hollowborn-dragonslayer-s-blade](https://aqwwiki.wikidot.com/hollowborn-dragonslayer-s-blade) | Weapons | needs-review | unknown | missing |
| [hollowborn-oblivion-blade](https://aqwwiki.wikidot.com/hollowborn-oblivion-blade) | Weapons | needs-review | unknown | missing |
| [horned-void-war-helm](https://aqwwiki.wikidot.com/horned-void-war-helm) | Helms | needs-review | unknown | missing |
| [infernal-flame-pyromancer](https://aqwwiki.wikidot.com/infernal-flame-pyromancer) | Armors | needs-review | unknown | approved local |
| [infinity-titan-class](https://aqwwiki.wikidot.com/infinity-titan-class) | Classes | needs-review | unknown | missing |
| [legendary-elemental-warrior](https://aqwwiki.wikidot.com/legendary-elemental-warrior) | Classes | needs-review | unknown | approved local |
| [legendary-naval-commander](https://aqwwiki.wikidot.com/legendary-naval-commander) | Classes | needs-review | unknown | missing |
| [legion-dragonblade-of-nulgath](https://aqwwiki.wikidot.com/legion-dragonblade-of-nulgath) | Weapons | needs-review | unknown | missing |
| [legion-forge-spawn](https://aqwwiki.wikidot.com/legion-forge-spawn) | Armors | needs-review | unknown | missing |
| [legion-forge-visor](https://aqwwiki.wikidot.com/legion-forge-visor) | Helms | needs-review | unknown | missing |
| [legion-revenant-class](https://aqwwiki.wikidot.com/legion-revenant-class) | Classes | needs-review | unknown | approved local |
| [legion-soul-devourer](https://aqwwiki.wikidot.com/legion-soul-devourer) | Weapons | needs-review | unknown | missing |
| [lightcaster-class](https://aqwwiki.wikidot.com/lightcaster-class) | Classes | needs-review | unknown | approved local |
| [mace-of-destiny](https://aqwwiki.wikidot.com/mace-of-destiny) | Weapons | needs-review | doomwood-part-2 | missing |
| [mage](https://aqwwiki.wikidot.com/mage) | Classes | needs-review | unknown | approved local |
| [malgor-the-shadowlord](https://aqwwiki.wikidot.com/malgor-the-shadowlord) | Armors | needs-review | unknown | missing |
| [mini-void-shogun](https://aqwwiki.wikidot.com/mini-void-shogun) | Pets | needs-review | unknown | missing |
| [mini-void-shogun-battlepet](https://aqwwiki.wikidot.com/mini-void-shogun-battlepet) | Pets | needs-review | unknown | missing |
| [mystical-devotee-of-mana](https://aqwwiki.wikidot.com/mystical-devotee-of-mana) | Armors | needs-review | unknown | missing |
| [naval-commander-class](https://aqwwiki.wikidot.com/naval-commander-class) | Classes | needs-review | unknown | approved local |
| [necrotic-blade-of-doom](https://aqwwiki.wikidot.com/necrotic-blade-of-doom) | Weapons | needs-review | unknown | missing |
| [necrotic-blade-of-the-underworld](https://aqwwiki.wikidot.com/necrotic-blade-of-the-underworld) | Weapons | needs-review | unknown | approved local |
| [necrotic-bow-of-the-shadow](https://aqwwiki.wikidot.com/necrotic-bow-of-the-shadow) | Weapons | needs-review | doomwood-part-2 | missing |
| [necrotic-broadsword-of-bane](https://aqwwiki.wikidot.com/necrotic-broadsword-of-bane) | Weapons | needs-review | doomwood-part-2 | missing |
| [necrotic-daggers-of-destruction](https://aqwwiki.wikidot.com/necrotic-daggers-of-destruction) | Weapons | needs-review | doomwood-part-2 | missing |
| [necrotic-scythe-of-scourge](https://aqwwiki.wikidot.com/necrotic-scythe-of-scourge) | Weapons | needs-review | doomwood-part-2 | missing |
| [necrotic-sword-of-the-abyss](https://aqwwiki.wikidot.com/necrotic-sword-of-the-abyss) | Weapons | needs-review | unknown | missing |
| [oracle](https://aqwwiki.wikidot.com/oracle) | Classes | needs-review | unknown | approved local |
| [paladin-class](https://aqwwiki.wikidot.com/paladin-class) | Classes | needs-review | unknown | approved local |
| [platinum-coin-of-nulgath-300](https://aqwwiki.wikidot.com/platinum-coin-of-nulgath-300) | Pets | needs-review | unknown | missing |
| [prince-darkon-s-poleaxe](https://aqwwiki.wikidot.com/prince-darkon-s-poleaxe) | Weapons | needs-review | unknown | approved local |
| [rogue](https://aqwwiki.wikidot.com/rogue) | Classes | needs-review | unknown | approved local |
| [scythe-of-destiny](https://aqwwiki.wikidot.com/scythe-of-destiny) | Weapons | needs-review | doomwood-part-2 | missing |
| [scythe-of-scourge](https://aqwwiki.wikidot.com/scythe-of-scourge) | Weapons | needs-review | doomwood-part-2 | missing |
| [sentinel](https://aqwwiki.wikidot.com/sentinel) | Classes | needs-review | unknown | approved local |
| [shadow-blade-of-despair](https://aqwwiki.wikidot.com/shadow-blade-of-despair) | Weapons | needs-review | unknown | missing |
| [shadow-broadsword-of-bane](https://aqwwiki.wikidot.com/shadow-broadsword-of-bane) | Weapons | needs-review | doomwood-part-2 | missing |
| [shadow-daggers-of-destruction](https://aqwwiki.wikidot.com/shadow-daggers-of-destruction) | Weapons | needs-review | doomwood-part-2 | missing |
| [shadowlord-s-helm](https://aqwwiki.wikidot.com/shadowlord-s-helm) | Helms | needs-review | unknown | missing |
| [shadowscythe-of-scourge](https://aqwwiki.wikidot.com/shadowscythe-of-scourge) | Weapons | needs-review | doomwood-part-2 | missing |
| [silver-exalted-paladin](https://aqwwiki.wikidot.com/silver-exalted-paladin) | Armors | needs-review | unknown | missing |
| [silver-paladin](https://aqwwiki.wikidot.com/silver-paladin) | Classes | needs-review | unknown | missing |
| [stare-of-greed](https://aqwwiki.wikidot.com/stare-of-greed) | Helms | needs-review | unknown | missing |
| [storm-knight](https://aqwwiki.wikidot.com/storm-knight) | Armors | needs-review | unknown | missing |
| [storm-knight-helm](https://aqwwiki.wikidot.com/storm-knight-helm) | Helms | needs-review | unknown | missing |
| [tainted-destruction-blade](https://aqwwiki.wikidot.com/tainted-destruction-blade) | Weapons | needs-review | unknown | missing |
| [the-point](https://aqwwiki.wikidot.com/the-point) | Armors | needs-review | unknown | missing |
| [toxic-void-katana](https://aqwwiki.wikidot.com/toxic-void-katana) | Weapons | needs-review | unknown | missing |
| [undead-spawn-minion](https://aqwwiki.wikidot.com/undead-spawn-minion) | Armors | needs-review | unknown | missing |
| [unstable-betrayal-blade](https://aqwwiki.wikidot.com/unstable-betrayal-blade) | Weapons | needs-review | unknown | missing |
| [void-battlemage](https://aqwwiki.wikidot.com/void-battlemage) | Armors | needs-review | unknown | missing |
| [void-beetle-general](https://aqwwiki.wikidot.com/void-beetle-general) | Armors | needs-review | unknown | missing |
| [void-beetle-warlord](https://aqwwiki.wikidot.com/void-beetle-warlord) | Armors | needs-review | unknown | missing |
| [void-destroyer](https://aqwwiki.wikidot.com/void-destroyer) | Armors | needs-review | unknown | missing |
| [void-destruction-blade](https://aqwwiki.wikidot.com/void-destruction-blade) | Weapons | needs-review | unknown | missing |
| [void-highlord-class](https://aqwwiki.wikidot.com/void-highlord-class) | Classes | needs-review | unknown | approved local |
| [void-light-of-destiny](https://aqwwiki.wikidot.com/void-light-of-destiny) | Weapons | needs-review | unknown | missing |
| [void-paladin](https://aqwwiki.wikidot.com/void-paladin) | Armors | needs-review | unknown | missing |
| [void-paladin-cape](https://aqwwiki.wikidot.com/void-paladin-cape) | Capes / Back Items | needs-review | unknown | missing |
| [void-paladin-helm](https://aqwwiki.wikidot.com/void-paladin-helm) | Helms | needs-review | unknown | missing |
| [void-paladin-horns](https://aqwwiki.wikidot.com/void-paladin-horns) | Helms | needs-review | unknown | missing |
| [void-paladin-katana](https://aqwwiki.wikidot.com/void-paladin-katana) | Weapons | needs-review | unknown | missing |
| [void-paladin-katanas](https://aqwwiki.wikidot.com/void-paladin-katanas) | Weapons | needs-review | unknown | missing |
| [void-shogun-armor](https://aqwwiki.wikidot.com/void-shogun-armor) | Armors | needs-review | unknown | missing |
| [void-shogun-helm](https://aqwwiki.wikidot.com/void-shogun-helm) | Helms | needs-review | unknown | missing |
| [void-shogun-katana](https://aqwwiki.wikidot.com/void-shogun-katana) | Weapons | needs-review | unknown | missing |
| [void-shogun-katanas-on-your-hip](https://aqwwiki.wikidot.com/void-shogun-katanas-on-your-hip) | Weapons | needs-review | unknown | missing |
| [void-shogun-mask](https://aqwwiki.wikidot.com/void-shogun-mask) | Helms | needs-review | unknown | missing |
| [void-shogun-masked-helm](https://aqwwiki.wikidot.com/void-shogun-masked-helm) | Helms | needs-review | unknown | missing |
| [void-shogun-naginata](https://aqwwiki.wikidot.com/void-shogun-naginata) | Weapons | needs-review | unknown | missing |
| [void-spartan](https://aqwwiki.wikidot.com/void-spartan) | Armors | needs-review | unknown | missing |
| [void-spartan-blade](https://aqwwiki.wikidot.com/void-spartan-blade) | Weapons | needs-review | unknown | missing |
| [void-spartan-blade-and-shield](https://aqwwiki.wikidot.com/void-spartan-blade-and-shield) | Weapons | needs-review | unknown | missing |
| [void-spartan-helm](https://aqwwiki.wikidot.com/void-spartan-helm) | Helms | needs-review | unknown | missing |
| [void-spartan-helm-and-scarf](https://aqwwiki.wikidot.com/void-spartan-helm-and-scarf) | Helms | needs-review | unknown | missing |
| [void-spartan-shielded-cape](https://aqwwiki.wikidot.com/void-spartan-shielded-cape) | Capes / Back Items | needs-review | unknown | missing |
| [void-spartan-spear](https://aqwwiki.wikidot.com/void-spartan-spear) | Weapons | needs-review | unknown | missing |
| [void-spartan-spear-and-shield](https://aqwwiki.wikidot.com/void-spartan-spear-and-shield) | Weapons | needs-review | unknown | missing |
| [void-spear-of-war](https://aqwwiki.wikidot.com/void-spear-of-war) | Weapons | needs-review | unknown | missing |
| [void-warlock](https://aqwwiki.wikidot.com/void-warlock) | Armors | needs-review | unknown | missing |
| [void-warlock-cape](https://aqwwiki.wikidot.com/void-warlock-cape) | Capes / Back Items | needs-review | unknown | missing |
| [void-warlock-helm](https://aqwwiki.wikidot.com/void-warlock-helm) | Helms | needs-review | unknown | missing |
| [void-warlock-hood](https://aqwwiki.wikidot.com/void-warlock-hood) | Helms | needs-review | unknown | missing |
| [void-warlock-horns](https://aqwwiki.wikidot.com/void-warlock-horns) | Helms | needs-review | unknown | missing |
| [void-warlock-tendrils-cape](https://aqwwiki.wikidot.com/void-warlock-tendrils-cape) | Capes / Back Items | needs-review | unknown | missing |
| [warrior-class](https://aqwwiki.wikidot.com/warrior-class) | Classes | needs-review | unknown | missing |
| [yami-no-ronin-class](https://aqwwiki.wikidot.com/yami-no-ronin-class) | Classes | needs-review | unknown | approved local |

## Commands

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
