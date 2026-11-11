# Equipment and combat refinement V6–V8

Website version: 0.1.0. Equipment entities: 38; exact item pages read successfully: 9. Unknown fields are not inferred from quest acceptance levels or visual appearance.

## Equipment metadata

| Item | Level lock | Damage boost | Stability | Materials |
|---|---|---|---|---|
| Exalted Apotheosis | 95 | +51% All Damage | Unknown; original Base Damage retained internally | 4 |
| Dual Exalted Apotheosis | 95 | +51% All Damage | Unknown; original Base Damage retained internally | 4 |
| Exalted Duality | 95 | +40% All Damage | Unknown; original Base Damage retained internally | 5 |
| Infernal Flame Khopesh | Unknown | +75% Elementals | Unknown; original Base Damage retained internally | 2 |
| Infernal Flame Pyromancer | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Infernal Flame Horns | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Infernal Claws + Runes | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Necrotic Blade of the Underworld | Unknown | +51% All Damage | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Undead Champion | Unknown | +50% Undead | Not a weapon | Not yet verified |
| Sin of the Abyss | 95 | +51% All Damage | Unknown; original Base Damage retained internally | 8 |
| Empowered Overfiend Blade | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Ungodly Reavers | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Prismatic Manslayer và Empowered Prismatic Manslayers | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Evolved Fiend (EEF) và Empowered Evolved Void | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Evolved Blood (EEB), Empowered Evolved Hex (EEH) và Empowered Evolved Shadow | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Shadow Spear | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Bloodletter | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Sole Bloodletter | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Oblivion Blade | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Charged Oblivion Blade | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Legacy of Nulgath (ELoN) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Empowered Worshipper of Nulgath (EWoN) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Drago's Royal Guard | 80 | Unknown | Not a weapon | 1 |
| Algie's Bow | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Dene's Axe | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Prince Darkon's Poleaxe | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Các items còn lại của Drago's Royal Guard Set | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Malgor's ShadowFlame Blade | 95 | +51% All Damage | Unknown; original Base Damage retained internally | 3 |
| War Blade of Courage (WBoC) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| War Blade of Power (WBoP) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| War Blade of Speed (WBoSp) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| War Blade of Strength (WBoSt) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| War Blade of Wisdom (WBoW) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Goddess Of War Blades (GoWB) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Goddess of War Cloak (GoWC) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Goddess Of War Prestige Cloak (GoWPC) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Goddess Of War (GoW) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |
| Radiant Goddess Of War (RGoW) | Unknown | Unknown | Unknown; original Base Damage retained internally | Not yet verified |

Wiki pages confirm Base Damage ranges, including Static/Fixed ranges and default ranges. The requested Stable/Normal/Unstable vocabulary is not assigned automatically. Quest acceptance level is not treated as equipment level. Drago’s Royal Guard is an Armor; its CP/EXP bonus is not presented as a Damage Boost.

Exalted Apotheosis: Level 95, +51% all-monster damage; recipe Penultima ×1, Ezrajal Insignia ×4, Warden Insignia ×4, Engineer Insignia ×8. Dual Exalted Apotheosis: Level 95, +51%; recipe Apotheosis ×1 and each of the three Insignias ×14. The older community “12 more days” sentence is not rendered and is not treated as a promise or recipe. Exalted Duality: Level 95, +40%; Ultima branches ×1 each and each Insignia ×4. These recipes are taken from the exact item pages in content-sources/v678.

WeaponStatStrip, MaterialRequirements and EquipmentProgressionPath share equipment.json. Gallery cards contain no route paragraph. Additional item descriptions/source blocks remain stored but are not rendered twice. Canonical IDs are shared by equipment, route references and Additional Equipment deduplication. Quest prerequisites remain in their existing Quest rows; generic progression disclaimers are not moved into false Quest prerequisites. Checklist persistence logic is preserved.

## Combat

THÔNG SỐ contains only Monster identity/Level/HP/portrait and quantitative attack rows. Unknown or non-damaging attacks are omitted from the numeric table. King Drago therefore has a concise unknown-damage state rather than invented damage. Drone Bubbles and Rings are displayed as separate attack names with the same canonical source values; their Damage Type remains unverified because the Monster pages do not specify it. Active Skill details and attack rows use the same inspection.json record. Passives remain exclusively in KỸ NĂNG. Notes retain provenance metadata but render concise action text.

## Footer and assets

BATTLE ON. and four links share a desktop grid, stacked on mobile. The old slogan and per-boss verification sentence are removed from UI only. Version is centralized in src/config/version.ts and synchronized with the package/lockfile root version. Footer contains the requested Guild and W.Stratos ownership lines; game/trademark credit remains in About and image credits.

## Validation

Commands: npm run typecheck; npm run lint; npm test; npm run test:build; npm run build; npm run test:boss-detail. Browser screenshots/report are in qa/v678; image-specific details are in ULTRA_BOSS_IMAGE_AUDIT.md. The existing production chunk-size warning remains. Additional equipment imagery and metadata not verified in the table above remain pending; no substitute image or invented stat is used.
