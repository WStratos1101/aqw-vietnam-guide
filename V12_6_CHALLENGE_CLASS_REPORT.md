# V12.6 execution report

Version 0.1.0. No push/deploy. Work confined to AQW project.

- King Draco is the display name; canonical King Drago, Ultra Drago and /join ultradrago remain distinct metadata. Item names, Prince Darkon's Poleaxe and Royal Guard routes remain intact.
- 4 Dungeons / 24 Dungeon stages; 20 Other Challenges / 45 encounters. Shared RPG directory, stage inspection, progress persistence and source-scoped monster data.
- 20 new Calendar profiles; 133 total profiles; 1080 runtime skills and 1042 verified/integrated icon mappings. Original 604 imported skills still accounted for; 38 original uncertain mappings remain quarantined.
- 302 verified art mappings; 18 functional multi-art selectors; 115 Classes without two distinct verified images.
- Các Class Khác shows four unique valid Class cards excluding current, randomly chosen after mount and stable across skill/tab/art interactions; server/client initial render both empty.

## Validation

- lint: passed (artifacts/qa/v12-6/lint.log)
- typecheck: passed (artifacts/qa/v12-6/typecheck.log)
- test: passed (artifacts/qa/v12-6/test.log)
- test:semantic: passed (artifacts/qa/v12-6/test-semantic.log)
- assets:validate-class-skills: passed (artifacts/qa/v12-6/assets-validate-class-skills.log)
- build: passed (artifacts/qa/v12-6/build.log)
- test:build: passed (artifacts/qa/v12-6/test-build.log)
- test:server: passed (artifacts/qa/v12-6/test-server.log)

Browser: browser_launch_blocked; 0 new screenshots. External commands: npm run qa:chaos-theme and node scripts/qa-v12-6.mjs. No visual pass claimed.

## Source conflicts and remaining work

- {"stage":"Screen 2","monster":"Lunar Haze","issue":"Wiki stat variant unavailable; source Docs retained, level and image not invented"}
- {"stage":"Screen 3","monster":"Lunar Haze","issue":"Wiki stat variant unavailable; source Docs retained, level and image not invented"}
- {"stage":"Screen 1","field":"Shield exponent","docs":"0.5","wiki":"0.85 for source-confirmed monsters","resolution":"Combat Inspection uses current scoped Wiki passive; old generic Docs Shield line omitted from stage copy, original snapshot retained"}
- {"stage":"Screen 2","field":"Shield exponent","docs":"0.5","wiki":"0.85 for source-confirmed monsters","resolution":"Combat Inspection uses current scoped Wiki passive; old generic Docs Shield line omitted from stage copy, original snapshot retained"}
- {"stage":"Screen 4: Treasure Chest","monster":"Treasure Chest (Version 1)","issue":"Source stats incomplete; mechanics retained in stage notes"}
- {"stage":"Screen 5: Reinforced Shelleton","docs":"→ Shelleton có 10% khả năng bị Crash khi có Light Speed, tự Stun bản thân, loại bỏ toàn bộ hiệu ứng khác và cả Shield, tăng lượng lớn All In trong 6s","resolution":"→ Shelleton có 15% khả năng bị Crash khi có Light Speed, tự Stun bản thân, loại bỏ toàn bộ hiệu ứng khác và cả Shield, tăng lượng lớn All In trong 6s","source":"https://www.aq.com/gamedesignnotes/AQW-Balance-PatchNotes-9515"}
- {"stage":"Screen 6: Fell Statue","docs":"→ Fell Statue tăng 200% Crit DMG trong 6s, stack vô hạn.","resolution":"→ Fell Statue tăng 200% Crit DMG trong 5s, stack vô hạn.","source":"https://www.aq.com/gamedesignnotes/AQW-Balance-PatchNotes-9515"}
- {"stage":"Screen 6: Fell Statue","docs":"→ Phải giết được Fell Statue trước khi stack đủ nhiều để giết chết bạn hoặc đổi target qua Fell Statue khác để hiệu ứng trên con cũ mất sau 6s.","resolution":"→ Phải giết được Fell Statue trước khi stack đủ nhiều để giết chết bạn hoặc đổi target qua Fell Statue khác để hiệu ứng trên con cũ mất sau 5s.","source":"https://www.aq.com/gamedesignnotes/AQW-Balance-PatchNotes-9515"}
- {"stage":"Screen 8: Treasure Chest","monster":"Treasure Chest (Version 2)","issue":"Source stats incomplete; mechanics retained in stage notes"}
- {"stage":"Screen 11: Mechabinky & Raxborg","field":"Batara Kala Devour","docs":"Wiki attack table still lists Devour","resolution":"Removed for base Mechabinky & Raxborg per official 2026-08-14 patch; 2.0 not assumed equivalent","source":"https://www.aq.com/gamedesignnotes/AQW-Balance-PatchNotes-9515"}
- {"stage":"Queen Iona","monster":"Queen Iona","issue":"Wiki stat variant unavailable; source Docs retained, level and image not invented"}
- {"stage":"Infernal Mage","monster":"Infernal Mage (Monster)","issue":"Source stats incomplete; mechanics retained in stage notes"}
- {"stage":"Masakado","monster":"Masakado","issue":"Wiki stat variant unavailable; source Docs retained, level and image not invented"}
- {"stage":"Mechabinky & Raxborg 2.0","monster":"Mechabinky & Raxborg 2.0","issue":"Wiki stat variant unavailable; source Docs retained, level and image not invented"}

Missing combat sources:
- Infernal Battle Arena / Infernal Mage

Missing Challenge hero art:
- Queen Iona
- Infernal Battle Arena
- Four Harbingers of Destruction & Salvation
- Firebird Anqa
- Masakado
- Mechabinky & Raxborg 2.0

Calendar source pages not integrated: 0. New Calendar combos and linked acquisition dependencies still require additional source review; no generic rotations or prices filled in. Cashfear typed rewards, richer stage-specific loadout handling and source localization remain incomplete. Bundle still emits >500 kB chunk warnings; route splitting is retained, but further bundle reduction is required. V12.6 is not marked fully complete.
