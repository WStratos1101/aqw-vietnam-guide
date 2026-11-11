# V12.11 Source Conflicts

Ngày đối chiếu: 2026-11-11. Bốn record ban đầu tương ứng ba cơ chế; hai Quantum variants cùng vấn đề thời lượng. Không gộp mất provenance riêng của từng profile.

<a id="flight-dot"></a>
## Abyssal Angel (AA) - Abyssal Angel's Shadow (AAS) — Flight

- Identity: abyssal-angel-aa-abyssal-angel-s-shadow-aas/skill-2
- Field: DoT damage increase
- Initial website evidence: {"source":"https://aqwwiki.wikidot.com/abyssal-angel-legend","sourceHash":"bf9a30c9b8c66385fbb287a884f4a927d6c30d4b29ce443cfc928737e20f9843","description":"Spreads it's wings and takes flight. Applies Vantage Point, increasing Hit Chance and Dodge by 15% for 6 seconds. Also allows you to focus all your fire on one target, empowering your arrows increasing your overall DoT Damage by 75%. Your focused targeting reduces the amount of void energy you need to expend, applying Mana Refraction which reduces mana costs by 50% for 8 seconds.","notes":["Applies Vantage Point to caster for 6 seconds, increasing Hit Chance and Dodge by 15%, increasing DoT damage by 50%, and making all attacks single target.","Applies Mana Refraction to caster for 8 seconds, reducing mana costs by 50%."],"translationMethod":"No complete Vietnamese effect translation verified"}
- Wiki description: 75%; Wiki Notes/passive: 50%.
- Wiki: https://aqwwiki.wikidot.com/abyssal-angel-legend
- Wiki: https://aqwwiki.wikidot.com/abyssal-angel-legend
- Official: https://www.aq.com/gamedesignnotes/ClassBalanceUpdatesMay15-7494 — Flight/Shadowed Flight DoT damage increase: 50% > 75% (publication: 2020-05-15).
- Docs/community: https://docs.google.com/document/d/1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78/edit — Existing guide text: +50% DoT, stale versus official 2020 patch.
- Decision: **RESOLVED**, confidence high. Use +75% DoT, confirmed by explicit official 50 → 75 patch and current Wiki description.
- Reason: May 15, 2020 official change 50% → 75% agrees with the current Wiki description; the Notes retain the pre-patch value. The archived/current balance lists reviewed contain no subsequent reversal.
- Reviewed balance histories: https://www.aq.com/gamedesignnotes/AQW-Balance-PatchNotes-9515 · https://www.aq.com/gamedesignnotes/aqw-classbalance-patchnotes-8927

<a id="crystallis-duration"></a>
## Abyssal Angel (AA) - Abyssal Angel's Shadow (AAS) — Crystallis Veil

- Identity: abyssal-angel-aa-abyssal-angel-s-shadow-aas/skill-5
- Field: Buff durations
- Initial website evidence: {"source":"https://aqwwiki.wikidot.com/abyssal-angel-legend","sourceHash":"bf9a30c9b8c66385fbb287a884f4a927d6c30d4b29ce443cfc928737e20f9843","description":"Spawns Crystals from thin air to increase 25% Damage Resistance for 8 seconds. Also applies Clean Cut, increasing your Crit Chance by 15% for 6 seconds.","notes":["Applies Clean Cut to caster, increasing caster's crit chance by 15% for 7 seconds.","Applies Crystallis Veil to caster, increasing caster's damage resistance by 25% for 9 seconds."],"translationMethod":"No complete Vietnamese effect translation verified"}
- Wiki description: Damage Resistance +25% for 8s; Crit Chance +15% for 6s; Wiki Notes/passive: Damage Resistance 9s; Crit Chance 7s.
- Wiki: https://aqwwiki.wikidot.com/abyssal-angel-legend
- Wiki: https://aqwwiki.wikidot.com/abyssal-angel-legend
- Official: https://www.aq.com/gamedesignnotes/date/2016/04 — Launch description: DR 25% for 8s, Crit 25% for 6s; May 2020 patch reduces Crit to 15%, without settling current duration discrepancy. (publication: April 2016 launch archive / May 2020 balance change).
- Docs/community: https://docs.google.com/document/d/1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78/edit — Existing guide text: Crit 7s, resistance 9s.
- Decision: **UNRESOLVED**, confidence low. Retain verified buff amounts; omit disputed duration from player effect rows. Preserve both durations in metadata.
- Reason: A launch-era 2016 description cannot establish current server aura expiry. Wiki Notes and guide differ by one second from description; no authoritative current timing clarification found.
- Reviewed balance histories: https://www.aq.com/gamedesignnotes/AQW-Balance-PatchNotes-9515 · https://www.aq.com/gamedesignnotes/aqw-classbalance-patchnotes-8927

<a id="calendar-quantum-chronomancer-spiral"></a>
## Quantum Chronomancer — Quantum Shift

- Identity: calendar-quantum-chronomancer/wiki-active-quantumshift
- Field: Rank 10 Quantum Spiral duration
- Initial website evidence: {"source":"https://aqwwiki.wikidot.com/quantum-chronomancer-class","sourceHash":"6a1957e2430431c197895e39da8afc8585b08585baeee6e2b085e40a805a5bd3","description":"Distort the timeline to alter combat capabilities. Applies Quantum Shift to you and your allies, increasing Crit Chance and Defense by 30% as well as Outgoing Physical and Outgoing Magical Damage by 10% for 10 seconds.","notes":["At Rank 10, Quantum Shift applies stacks of Quantum Spiral to you for each friendly target affected, increasing your Crit Modifier and DoT damage by 10% for 23 seconds, stacks to 40 but cannot be refreshed."],"translationMethod":"No complete Vietnamese effect translation verified"}
- Wiki description: Active Rank 10 note: 23s; Wiki Notes/passive: Passive Quantum Spiral / Quantum Mending: 20s.
- Wiki: https://aqwwiki.wikidot.com/quantum-chronomancer-class
- Wiki: https://aqwwiki.wikidot.com/quantum-chronomancer-class
- Official: https://www.aq.com/gamedesignnotes/aqw-dec20-2022calendarclassbreakdown-8615 — Quantum Spiral: 10% for 23 seconds, stacks to 40 but cannot be refreshed; lose all stacks after 23 seconds. (publication: 2021-12-20).
- Docs/community: https://docs.google.com/document/d/1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78/edit — Guide sequences time the Quantum Spiral fades event; no independent numeric duration in the reviewed Quantum Shift entry. Sequences preserved.
- Decision: **RESOLVED**, confidence medium. Use corroborated 23s for both active and passive views; preserve original 20s description and review rationale.
- Reason: The current active Wiki note and official detailed mechanic both state 23 seconds and non-refreshing expiry. The passive description says 20 seconds. No duration change found in the archived/current balance lists; use corroborated 23 seconds for both effect views, retaining the contradictory raw source. Confidence: medium.
- Reviewed balance histories: https://www.aq.com/gamedesignnotes/AQW-Balance-PatchNotes-9515 · https://www.aq.com/gamedesignnotes/aqw-classbalance-patchnotes-8927

<a id="calendar-continuum-chronomancer-spiral"></a>
## Continuum Chronomancer — Quantum Shift

- Identity: calendar-continuum-chronomancer/wiki-active-quantumshift
- Field: Rank 10 Quantum Spiral duration
- Initial website evidence: {"source":"https://aqwwiki.wikidot.com/continuum-chronomancer-class","sourceHash":"b806c7ed129950279676f6fbdbdf454ff93a692c4c3c26e8b4b17af1c40af4a1","description":"Distort the timeline to alter combat capabilities. Applies Quantum Shift to you and your allies, increasing Crit Chance and Defense by 30% as well as Outgoing Physical and Outgoing Magical Damage by 10% for 10 seconds.","notes":["At Rank 10, Quantum Shift applies stacks of Quantum Spiral to you for each friendly target affected, increasing your Crit Modifier and DoT damage by 10% for 23 seconds, stacks to 40 but cannot be refreshed."],"translationMethod":"No complete Vietnamese effect translation verified"}
- Wiki description: Active Rank 10 note: 23s; Wiki Notes/passive: Passive Quantum Spiral / Quantum Mending: 20s.
- Wiki: https://aqwwiki.wikidot.com/continuum-chronomancer-class
- Wiki: https://aqwwiki.wikidot.com/continuum-chronomancer-class
- Official: https://www.aq.com/gamedesignnotes/aqw-dec20-2022calendarclassbreakdown-8615 — Quantum Spiral: 10% for 23 seconds, stacks to 40 but cannot be refreshed; lose all stacks after 23 seconds. (publication: 2021-12-20).
- Docs/community: https://docs.google.com/document/d/1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78/edit — Guide sequences time the Quantum Spiral fades event; no independent numeric duration in the reviewed Quantum Shift entry. Sequences preserved.
- Decision: **RESOLVED**, confidence medium. Use corroborated 23s for both active and passive views; preserve original 20s description and review rationale.
- Reason: The current active Wiki note and official detailed mechanic both state 23 seconds and non-refreshing expiry. The passive description says 20 seconds. No duration change found in the archived/current balance lists; use corroborated 23 seconds for both effect views, retaining the contradictory raw source. Confidence: medium.
- Reviewed balance histories: https://www.aq.com/gamedesignnotes/AQW-Balance-PatchNotes-9515 · https://www.aq.com/gamedesignnotes/aqw-classbalance-patchnotes-8927

## Additional acquisition discrepancies discovered

These are not counted as new entries in the original four skill conflicts. They remain linked to their Acquisition queue entries.

- DeathKnight Lord: Class page lists DeathKnight Lord Armor without quantity plus Shadow Skull ×30. Bonecastle Merge row lists only Shadow Skull ×30; Bonecastle Tower Merge lists the Armor rather than the Class. Do not invent an Armor quantity or pretend the Tower shop sells the Class.
- Necromancer (PTR): historical Class page points to PTR Enhancements, but the current PTR Enhancements page lists enhancement tables rather than the Class. Preserve its legacy purchase record as partial; do not present it as a current Shop.
