# FARM_SOURCE_AUDIT

## Cập nhật Farm V2 — 2026-11-13

UI hiện tại dùng catalog-v2.generated.json: 279 canonical items; Source A 196, Source B 224, giao 193. 23 verified kế thừa; 256 cần đối chiếu; 268 ảnh local, 11 thiếu ảnh.
Nguồn A: phần text/link của trang gốc + 146 trang con đã được trích xuất; hình nhúng còn cần đối chiếu. Nguồn B: giữ snapshot text export đã đọc trước đó, connector/HTML export timeout; chưa xác minh link/bảng/ảnh nhúng. Xem FARM_DATA_AUDIT.md và content-sources/farm/import/source-access.json.
Wiki còn 1104 URL nguồn chưa đọc thành công; không coi đây là số trang bị còn thiếu. Browser QA UNVERIFIED: không chạy trong Codex; chờ AQW-Safe-Browser-QA.command trên Terminal macOS (Chromium).
Phần dưới giữ nguyên bằng chứng snapshot 2026-11-11 cho catalog curated 25 items; không đại diện toàn bộ UI V2 hoặc xác minh live hôm nay.

Đối chiếu: 2026-11-11. Manual bounded web-tool reads; no crawler, no build-time network. Curated summaries, not copied Wiki prose.

Farmable Now: **4 vật phẩm / 2 Regions / 4 loại**. Tổng kho tham khảo: 25 identities; 2 needs_review. Seasonal được tách riêng, không tính đang mở.

## Phạm vi công bố

| Region | Loại và số lượng Farmable Now |
| --- | --- |
| Greenguard Forest | weapon: 1; armor: 1; cape: 1 |
| Arcangrove | class: 1 |

## Tài liệu và adapter đã kiểm tra trong repo

- `docs/farm-catalog.md`, `content-sources/farm/verified-items.json`, `content-sources/farming-guide.json` (export metadata and matched paragraphs via generator).
- `src/data/aqw-assets.json`, `src/content/challenges/equipment.json`: chỉ nhận asset đã verified + approved, exact entity name, file local tồn tại.
- `scripts/build-farm.mjs`, `scripts/audit-farm.mjs`, `src/lib/material-requirements.mjs`, Farm routing + tests. Không đọc lịch sử Codex/STATE hoặc audit V12 cũ.
- Không có raw HTML snapshot Farm đã lưu kèm bộ facts ban đầu; không coi các trang cũ chưa đọc lại là xác minh mới.

## Sai khác và giới hạn

- Helm Relic: shop lists Helm Fragment x10; Valencia quest prose says x50. Helm of Awe is needs_review, excluded from Farmable Now. Direct recipe remains Helm Relic x1; unresolved lower dependency is not asserted.
- Blade of Awe originally inherited Museum geography for both recipes. Reverse dual exchange is at Nostalgia Quest, whose Region/map command remains unverified. Route geography is now independent; Museum filter shows only Museum recipe.
- Original curated snapshot had 24 identities: 23 marked verified, 6 geographically mapped, 18 unmapped, 10 approved local images, 8 unresolved URLs. All 24 lacked permanent availability confirmation; Polly Roger alone carried seasonal evidence. These are prior local assertions, not fresh checks of all 24 pages.
- Four Awe pages and Shaman shop are listed without rare/seasonal markers in the checked sources. Permanent availability is an inference from the current Wiki listings, not an in-game login or official availability guarantee.
- No paid AC-only item was added. Shaman costs 0 AC and requires Arcangrove Rank 10. AC-tagged and AC-only purchase are distinct.
- Dwarfhold/Lolosia overlapping geography remains retained local evidence, not revalidated in this session. Polly Roger stays seasonal; event currently open is not asserted.
- Unknown drop rates remain unknown. Material quest locations do not become item Regions. No game artwork was downloaded, generated or hotlinked. Missing images use labelled equipment category icons.
- Original community Google Docs was not re-fetched in this session; checked-in export read 2026-11-05 is retained. Existing manifest offline_fallback is historical, not a new Docs access attempt.
- Legacy Farm articles had source heading fragments pointing to gated guide pages, which do not render those anchors. The importer now preserves the destination route without its nonexistent fragment; original document links remain in the source export.

## Mọi bản ghi hiện có

| Item / Wiki | Region gốc | Loại | Availability | Verification | Ảnh | View |
| --- | --- | --- | --- | --- | --- | --- |
| [Blade of Awe](https://aqwwiki.wikidot.com/blade-of-awe) | greenguard-forest | weapon | available | verified | category icon; không giả ảnh item | Farmable Now |
| [Armor of Awe](https://aqwwiki.wikidot.com/armor-of-awe-armor) | greenguard-forest | armor | available | verified | category icon; không giả ảnh item | Farmable Now |
| [Helm of Awe](https://aqwwiki.wikidot.com/helm-of-awe) | greenguard-forest | helm | available | needs_review | category icon; không giả ảnh item | Tham khảo |
| [Cape of Awe](https://aqwwiki.wikidot.com/cape-of-awe) | greenguard-forest | cape | available | verified | category icon; không giả ảnh item | Farmable Now |
| [Aureate Shield Aegis](https://aqwwiki.wikidot.com/aureate-shield-aegis) | dwarfhold | armor | unknown | verified | category icon; không giả ảnh item | Tham khảo |
| [Polly Roger](https://aqwwiki.wikidot.com/polly-roger) | dwarfhold | pet | seasonal | verified | category icon; không giả ảnh item | Seasonal |
| [Sepulchure's DoomKnight Armor](https://aqwwiki.wikidot.com/sepulchure-s-doomknight-armor) | unknown | armor | unknown | needs_review | category icon; không giả ảnh item | Tham khảo |
| [Blinding Light of Destiny](https://aqwwiki.wikidot.com/blinding-light-of-destiny-axe) | unknown | weapon | unknown | verified | category icon; không giả ảnh item | Tham khảo |
| [Necrotic Sword of Doom](https://aqwwiki.wikidot.com/necrotic-sword-of-doom-sword) | unknown | weapon | unknown | verified | category icon; không giả ảnh item | Tham khảo |
| [Sepulchure's Original Helm](https://aqwwiki.wikidot.com/sepulchure-s-original-helm) | unknown | helm | unknown | verified | category icon; không giả ảnh item | Tham khảo |
| [Original Drakath Armor](https://aqwwiki.wikidot.com/original-drakath-armor) | unknown | armor | unknown | verified | category icon; không giả ảnh item | Tham khảo |
| [Chaorrupter Unlocked (Free Player)](https://aqwwiki.wikidot.com/chaorrupter-unlocked-free-player) | unknown | weapon | unknown | verified | category icon; không giả ảnh item | Tham khảo |
| [ArchFiend DoomLord](https://aqwwiki.wikidot.com/archfiend-doomlord) | unknown | armor | unknown | verified | category icon; không giả ảnh item | Tham khảo |
| [Head of the Legion Beast](https://aqwwiki.wikidot.com/head-of-the-legion-beast) | unknown | helm | unknown | verified | category icon; không giả ảnh item | Tham khảo |
| [Exalted Apotheosis](https://aqwwiki.wikidot.com/exalted-apotheosis) | unknown | weapon | unknown | verified | [local](https://aqwwiki.wikidot.com/exalted-apotheosis) | Tham khảo |
| [Dual Exalted Apotheosis](https://aqwwiki.wikidot.com/dual-exalted-apotheosis) | unknown | weapon | unknown | verified | [local](https://aqwwiki.wikidot.com/dual-exalted-apotheosis) | Tham khảo |
| [Sin of the Abyss](https://aqwwiki.wikidot.com/sin-of-the-abyss) | unknown | weapon | unknown | verified | [local](https://aqwwiki.wikidot.com/sin-of-the-abyss) | Tham khảo |
| [Empowered Undead Champion](https://aqwwiki.wikidot.com/empowered-undead-champion) | unknown | armor | unknown | verified | [local](https://aqwwiki.wikidot.com/empowered-undead-champion) | Tham khảo |
| [Infernal Flame Khopesh](https://aqwwiki.wikidot.com/infernal-flame-khopesh) | unknown | weapon | unknown | verified | [local](https://aqwwiki.wikidot.com/infernal-flame-khopesh) | Tham khảo |
| [Greatblade of the Entwined Eclipse](https://aqwwiki.wikidot.com/greatblade-of-the-entwined-eclipse) | unknown | weapon | unknown | verified | [local](https://aqwwiki.wikidot.com/greatblade-of-the-entwined-eclipse) | Tham khảo |
| [Greatblade of the Solstice Moon](https://aqwwiki.wikidot.com/greatblade-of-the-solstice-moon) | unknown | weapon | unknown | verified | [local](https://aqwwiki.wikidot.com/greatblade-of-the-solstice-moon) | Tham khảo |
| [Greatblade of the Midnight Sun](https://aqwwiki.wikidot.com/greatblade-of-the-midnight-sun) | unknown | weapon | unknown | verified | [local](https://aqwwiki.wikidot.com/greatblade-of-the-midnight-sun) | Tham khảo |
| [Drago's Royal Guard](https://aqwwiki.wikidot.com/drago-s-royal-guard) | unknown | armor | unknown | verified | [local](https://aqwwiki.wikidot.com/drago-s-royal-guard) | Tham khảo |
| [Malgor's ShadowFlame Blade](https://aqwwiki.wikidot.com/malgor-s-shadowflame-blade) | unknown | weapon | unknown | verified | [local](https://aqwwiki.wikidot.com/malgor-s-shadowflame-blade) | Tham khảo |
| [Shaman](https://aqwwiki.wikidot.com/shaman) | arcangrove | class | available | verified | category icon; không giả ảnh item | Farmable Now |

Mỗi record giữ retrievedAt, fact-level sources, các route riêng, nguyên liệu AND/OR và nguồn ảnh. Xem `content-sources/farm/verified-items.json` và catalog sinh ra để kiểm tra từng công thức. Các record ngoài nhóm đã đọc lại giữ dữ liệu local cũ; chưa xác minh live URL hoặc availability.

## Trang đã đọc trong phiên này

- https://aqwwiki.wikidot.com/locations
- https://aqwwiki.wikidot.com/greenguard-forest
- https://aqwwiki.wikidot.com/museum
- https://aqwwiki.wikidot.com/blade-of-awe
- https://aqwwiki.wikidot.com/blade-of-awe-shop
- https://aqwwiki.wikidot.com/armor-of-awe-armor
- https://aqwwiki.wikidot.com/armor-of-awe-shop
- https://aqwwiki.wikidot.com/armor-of-awe-pass
- https://aqwwiki.wikidot.com/cape-of-awe
- https://aqwwiki.wikidot.com/cape-relic
- https://aqwwiki.wikidot.com/helm-of-awe
- https://aqwwiki.wikidot.com/valencia-s-quests
- https://aqwwiki.wikidot.com/doom-vault
- https://aqwwiki.wikidot.com/binky
- https://aqwwiki.wikidot.com/polly-roger
- https://aqwwiki.wikidot.com/shaman
- https://aqwwiki.wikidot.com/arcangrove
- https://aqwwiki.wikidot.com/arcangrove-rep-shop
- https://www.aq.com/gamedesignnotes/
- https://www.aq.com/cms/images/DN-CosmeticEquip-1.jpg

## Lỗi truy cập mới

- https://aqwwiki.wikidot.com/dwarfhold: web tool: 400 Redirect loop detected
- https://aqwwiki.wikidot.com/aureate-shield-aegis: web tool: 400 Redirect loop detected
- https://aqwwiki.wikidot.com/ancient-skull-blade: web tool: 400 Redirect loop detected; not imported

## Nguồn còn treo từ snapshot ban đầu (không coi là đã kiểm tra lại)

- Sin of the Undying: https://aqwwiki.wikidot.com/sin-of-the-undying
- Dark Dragon Slayer's Halberd: https://aqwwiki.wikidot.com/dark-dragon-slayer-s-halberd
- Enchanted Yokai Dragonslayer: https://aqwwiki.wikidot.com/enchanted-yokai-dragonslayer
- Location / Region: shadowfall: https://aqwwiki.wikidot.com/shadowfall
- Location / Region: inn-at-the-edge-of-time: https://aqwwiki.wikidot.com/inn-at-the-edge-of-time
- Location / Region: seven-circles-war: https://aqwwiki.wikidot.com/seven-circles-war
- Location / Region: ultra-speaker: https://aqwwiki.wikidot.com/ultra-speaker
- Location / Region: fire-avatar: https://aqwwiki.wikidot.com/fire-avatar

## Ảnh và bản quyền

10 ảnh local kế thừa registry, không thêm game image. Các credit/source được hiển thị trong chi tiết. Artwork © Artix Entertainment LLC; Wiki nội dung theo CC BY-SA 3.0 trừ ghi chú riêng. Không sao chép đoạn văn dài. Các icon Lucide là biểu tượng loại, không phải artwork item.

## Browser / mạng

Shell curl to fonts.googleapis.com failed with curl (6): Could not resolve host. Web tool can read selected public pages. Be Vietnam Pro stylesheet uses Google Fonts with Source Sans 3 fallback; its runtime loading is not browser-verified.

Safari 26.2 (20623.1.14.18.4), no --mcp in safaridriver help, no Technology Preview installed. Playwright 1.65.0 / Node 24.22.0: localhost listen EPERM; minimal WebKit launch Abort trap 6/134, Chromium SIGTRAP and headed Chromium bootstrap_check_in Permission denied (1100). Browser smoke BLOCKED; no screenshots, no Safari remote-automation settings changed.

Log thực tế: `artifacts/qa/diagnostics/results.json`, `artifacts/qa/farm/results.json`. Không có visual PASS. Chạy ngoài sandbox từ Terminal của host: `npm run browser:smoke:webkit` (tự khởi chạy Vite), hoặc `AQW_BROWSER=chromium npm run browser:smoke` nếu cần coverage Chrome. Không dùng --no-sandbox hoặc sửa bảo mật macOS.

## Validation và publish

`npm run content:farm` tái sinh catalog/index/manifest và audit, hoàn toàn offline. Generator từ chối canonical IDs trùng, category lạ, URL sai, Region không tồn tại. Không chạy crawler đại trà. Các lỗi QA/build/child exit chặn Auto Publish; phiên này không push/deploy.
