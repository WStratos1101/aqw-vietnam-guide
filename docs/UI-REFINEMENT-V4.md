# UI refinement V4

Combat uses THÔNG SỐ and KỸ NĂNG. Active/passive subtabs preserve the verified V3 data; status details reuse the same passive records, with no independently copied numbers. Notes remain separate.

Team loadouts are generated from the locally imported community guide, scoped by encounter, team and exact Class. Primary and alternative choices have separate records. No setup is inherited from another Class. Enhancement lines with four explicit slots are displayed as Weapon/Class/Helm/Cape; ambiguous source lines remain intact. Missing setup is marked Đang cập nhật. Roles are based on explicit source roles or instruction keywords; unclassified choices say Theo phân công. These community recommendations are not a required strategy.

224 team choices are currently represented; 89 have both an enhancement line and encounter instructions. This does not mean all 89 have a fully verified four-slot preset and numbered combo. Unresolved source aliases include IK, EDoT, CMP, CCR, TK, CMD, LH, DLH, CDK, GT and Arach; they are not expanded by guessing. Some otherwise documented Classes lack setup in particular teams.

Speaker's source table is expanded with its original rowspan/colspan semantics before being normalized to 20 ordered steps. Opening contains two steps; subsequent pagination groups at most four steps. These page boundaries are editorial and do not assert additional game phases. Blank assignments remain blank, displayed as a dash.

Theme is applied on the document before paint, saved in aqw-theme and reused across routes. Initial selection follows system appearance. The tactical board intentionally keeps its requested black surface in either theme. No storage access is required for toggling within the current page.

Sources: the existing community extraction in public/content/ultra and content-sources/boss-codex; https://sites.google.com/view/vncollector/adventure-quest-worlds/ultra-boss-guide?authuser=0 (live browser fetch failed in this session); https://aqwwiki.wikidot.com/the-first-speaker; https://www.aq.com/; visual reference https://endfield.gryphline.com/vi-vn. No combat numbers were changed in V4.

Design review used the installed design-taste-frontend skill and existing flat inspection direction. Impeccable and tatse repositories remain inaccessible, so their use is not claimed.

Validation artifacts: qa/v4. Run npm run test:boss-detail after starting npm run dev. Browser coverage includes themes, reload persistence, Class switching, phases, four viewport widths and main route families. Build retains the existing large-chunk warning.
