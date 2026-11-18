# AQW Farming Guide — curated grouping source package

Generated from the complete **user-supplied** guide text, 9,212 lines. This is a *source index and conservative extraction*, not a complete list of every purchasable item in each set.

## Contents

- `FARMING_ITEM_GUIDE_SOURCE.txt` — exact source user provided
- `FACTION_LIST.md` — 203 named farming targets sorted by source chapter with line numbers; may contain classes, sets, house items, etc.
- `faction_goals.csv/json` — machine-readable item/goal targets with source line + evidence kind
- `guide_sections.csv` — all 74 numbered guide subsections with exact line spans
- `reward_blocks_to_review.csv` — 42 review snippets beginning at explicit `Rewards:` labels
- `goals_list_not_factions.csv` — 74 goals from cross-cutting difficulty overview, with NO faction assigned
- `CODEX_PROMPT.md` — implementation instructions and QA gates
- `build_mapping.py` — reproducible source-chapter extraction in the bundle (does not fetch Wiki or mutate AQW source)

## Source grouping

Good, Evil, Chaos, Museum→AWE, Forge→BLACKSMITHING, Nation, Legion, Dragonkin, Elemental, Hollowborn, Debris & Astravian, and Other Items (NOT a faction). These are 12 document chapters II–XIII. Some groups are themes/collections, not in-game political alignments.

**Core cautions:**

1. Goals List / Daily-Weekly are not group affiliations. Do not assign a faction merely by string matching to these cross-cutting lists.
2. A cited item as a required ingredient does not belong to the chapter of its dependent item.
3. For sets and collections, enumerate each actual reward and verify canonical AQW identity. A set heading is not necessarily a single item.
4. Four BLoD variants in the Good chapter are under "Other related items" and marked `related_reference_needs_confirmation`; verify owning guide before assignment.
5. Treat `Other Items` as unsorted, and any item lacking chapter evidence as `UNVERIFIED_GROUP` rather than guessing.
6. Source names are preserved; no wiki verification or live game validity is asserted by this extraction.

## Install on macOS

Unzip contents into this repository directory:

`/Users/wstratos/Desktop/Project/aqw-vietnam-guide/content-sources/farm/manual-faction-guide/`

Do not put the files in `Update/` because the AQW AutoSync inbox may try to interpret them as deployment payloads. Open `CODEX_PROMPT.md` and run Codex in the repository root.
