# Farming Codex — refinement checkpoint

Status: PARTIAL, 2026-11-15. No commit/push/deploy.

Implemented: shared Monster/title/source deduplication; dedicated material tab preserving farm mode and nested navigation; standard-source Insignia filtering; structured Insignia allocation/required quests/totals; source-row Shop prices, seller alternatives, Reputation, purchase quantity/cost; exact Wiki Rarity propagation.

Data: 279 existing canonical identities preserved. 13 canonical rarity values restored (11 detailed-header values + 2 reviewed pages); 23 Classes have no explicit retained Wiki header Rarity. 5 material purchase guides enriched (Hooded Legion Cowl, Dark Arts Scholar, Destiny Cloak, Nulgath Shaped Chocolate, Original Drakath Armor). Canonical direct-purchase pages still need exact shop snapshots; see audit.json.

BLOCKED: Update/aqw-equipment-sets.mjs is 22 bytes, literal `Unsupported Media Type`. Asked user for valid module contents; equipmentSets/pendingSets/resolveEquipmentSets unavailable. No set membership or new canonical identities invented. Set/member/status totals cannot be computed from this invalid module.

Live Google Docs and VNCollector edit/page URLs inaccessible via web tool; retained supplied guide evidence reused. Do not claim strategy is globally optimal or all collections complete.

Targeted tests: tests/farm-refinement.test.mjs, tests/farm-public-workflows.test.mjs, tests/farm-v2-interactions.test.mjs passed 41/41 before full QA. Remaining: mandatory full checks, browser refinement QA, idempotence, final report.

Resume: inspect audit.json and current test logs; restore module before set implementation. Source snapshots pinned in sources.json. Generated files must be rebuilt with scripts/build-farm.mjs.
