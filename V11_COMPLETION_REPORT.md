# V11 — Equipment Selector, UI Cleanup & Boss Data Recovery

Ngày bàn giao: 2026-11-09. Project: `/Users/wstratos/Desktop/Project/aqw-vietnam-guide`. **Version 0.1.0**. Không tạo project, push, deploy hoặc thay đổi Rebiomed.

## Kết quả

Đã thay gallery nhiều card cao bằng một `RPGEquipmentSelector` dùng chung cho cả 17 Boss. Endgame và Empowered giữ các route/material/quest riêng trong dữ liệu, cùng xuất hiện trong một selector; item Empowered có nhãn riêng trong preview. Không tạo hai preview lớn song song.

- Đúng năm filter: **TẤT CẢ · VŨ KHÍ · GIÁP · MŨ · ÁO CHOÀNG**.
- Category nội bộ: `weapon`, `armor`, `helm`, `cape`; các alias tiếng Việt/Anh được chuẩn hóa. Pet/loại khác vẫn giữ identity, xuất hiện trong Tất cả, không bị ép thành Weapon.
- Một hàng thumbnail, active frame, tên qua tooltip/accessible label; không chứa cả bảng stats.
- Desktop có nút cuộn trước/sau; tự vô hiệu hóa khi không còn nội dung cần cuộn. Mobile vuốt ngang trong strip, không làm trang tràn ngang.
- Một preview lớn: ảnh đúng item, tên, loại, Level/Boost, Damage Range/Stability nếu là Weapon, Materials và Quest Tracker.
- Giữ selection khi nó thuộc filter mới; chọn item đầu tiên khi không còn phù hợp. Filter rỗng có empty state ngắn.
- Đổi item đóng Materials/Quest Details; progress vẫn lưu theo route/item và repeatability cũ. Material AND/OR và lựa chọn phương án vẫn hoạt động.
- Ảnh chỉ lấy từ manifest `verified` + `approved`; lỗi/thiếu ảnh dùng SVG loại trang bị, không để broken image.
- Hỗ trợ reduced motion; ảnh giữ tỷ lệ với `object-fit: contain`.

## Weapon Stability

Nguồn đã đọc: trang item Empowered Ungodly Reavers, archive Weapon Damage Chart và quy ước range hiện có. “Normal” trong tab ảnh Reavers không được dùng làm Stability.

Mapping có tài liệu, không dùng ngưỡng tự đặt:

| Dữ kiện | Nhãn trong guide |
|---|---|
| Min = Max, range đã có nguồn | STABLE |
| Wiki DefaultDmg và đúng 27–33 | NORMAL |
| Wiki HighDmg và đúng 0–60 | UNSTABLE theo quy ước V11 được yêu cầu |
| Các range khác chưa có căn cứ mapping | Chưa xác minh |

Quy tắc 0–60 là quy ước hiển thị V11; Wiki xác nhận range/HighDmg, không giả nhận archive gọi mọi range High/Medium là Unstable. Evidence: `content-sources/recovery/v11-range-mapping.json`.

Empowered Ungodly Reavers: **0–60, +51% All Damage, UNSTABLE**. Cùng mapping exact HighDmg 0–60 áp dụng cho Empowered Overfiend Blade, Empowered Shadow Spear, Empowered Bloodletter và Empowered Sole Bloodletter.

Tổng 65 canonical weapons: **23 Stable / 32 Normal / 5 Unstable / 5 chưa xác minh**. Xem `WEAPON_STABILITY_AUDIT.md`.

Năm vũ khí còn chưa xác minh:

1. Blaze of Awe — 22–38, OtherDmg.
2. Empowered Prismatic Manslayer — 6–54, HighDmg.
3. Empowered Charged Oblivion Blade — 3–57, HighDmg.
4. Empowered Caladbolg — 15–45, MediumDmg.
5. Empowered Dual Caladbolgs — 15–45, MediumDmg.

Non-weapons không hiển thị Damage Range/Stability. Boost đã xác nhận không có hiển thị “Không”; chưa xác minh vẫn hiển thị “Chưa xác minh”. Level không được tự gán nếu item page không công bố.

## Combat recovery và giới hạn nguồn

Đã đọc lại đúng Monster pages của Engineer/Drone, Drago, God of the Depths, Kasuko, Batara Kala; Quest page Anina; Google Docs qua Drive connector và bốn trang Google Sites public bằng Terminal. AQ.com truy cập được. Iara web tool bị redirect loop, Terminal Wiki failed connection; giữ snapshot Monster chính xác đã có, kết hợp Docs/Sites, không giả nhận đọc được bản Wiki mới.

Không có số Damage mới đủ căn cứ để điền vào các trường đang thiếu. Đã tách `damageConfidenceStatus` khỏi tên/type skill: ví dụ Devastator Beam được xác nhận True Damage nhưng **giá trị damage vẫn needs_verification**. Judged giữ `conflicting`; không tự chọn Physical hoặc True Damage.

| Boss | Trường chưa giải quyết | Kết luận giữ lại |
|---|---|---|
| Ultra Engineer | Drone damage type; Devastator Beam damage | Drone chỉ có ranges; Wiki Beam ghi “A lot”. Không dùng range ước lượng cộng đồng làm số chính thức. |
| King Drago | Judged damage/type | Type Physical mâu thuẫn Notes True Damage trên cùng Monster page; damage placeholder. |
| God of the Depths | Peer/Endless Nightmare; Taunt | Một số trường source vẫn placeholder; không lấy damage Tendril gán cho Boss hoặc suy toàn encounter miễn Taunt. |
| Kasuko | Quest acceptance; Taunt | Không lấy yêu cầu Forge quest gán cho The Molten Heart. Taunt loop cộng đồng vẫn mâu thuẫn các đòn bỏ qua Focus. |
| Batara Kala | Taunt theo từng skill | Devour/Vulnerable bỏ qua Focus; AoE bốn người không tự chứng minh quy tắc Focus của Mace Slam. |
| Ultra Iara | Taunt assignment; Lullaby damage type | 697–852 được giữ; không suy Physical/Magical/True từ type Status hoặc tên skill. |

Chi tiết nguồn và lý do: `content-sources/recovery/v11-combat-review.json`. Audit vẫn **11/17 đạt checklist tự động, 6 chưa đạt**; không nâng trạng thái chỉ vì đổi UI hoặc build thành công.

Đã đối chiếu thêm nội tại chính thức **A soul unripe for harvest** của Nulgath, dùng đúng tên và câu giải thích Việt ngắn; giữ nguyên nguồn/ghi chú cũ nội bộ. Bỏ câu dẫn “Wiki ghi…” và câu mô tả nguồn thừa ở phần combat hiển thị.

## UI cleanup và typography

- “Điều kiện nhận quest” trong Hero đổi thành **“Điều kiện”**. Data map access và quest acceptance vẫn tách riêng.
- Tiêu đề section chính là **TRANG BỊ ENDGAME**.
- Bỏ toàn bộ section “Nguồn tham khảo” khỏi Boss Detail; source arrays, provenance, audit và ghi công Artix không bị xóa. Link phục vụ Quest/guide và trang ghi công vẫn giữ.
- DAILY/WEEKLY/SEASONAL dùng đúng `codex-display` tokens chung với chữ Codex: Georgia/Times New Roman/serif, weight 400, italic, tracking −0.04em; responsive size riêng cho heading nhóm. Browser đo font-family/weight/style/tracking trùng khớp.
- Thu gọn Quest rows trên mobile/tablet; sửa màu nhãn phụ/tiêu đề bảng trong Light Mode. Không sửa font body hoặc bảng combat thành display font.

## Random Boss recommendations

“Tiếp tục tra cứu” dùng **ba BossDirectoryCard** từ 17 route đã triển khai; không chứa Boss hiện tại, không trùng và không đưa URL không hợp lệ vào pool. Card dùng tên Monster, ảnh, nhãn chu kỳ và link Xem hướng dẫn như Directory.

SSR có initial selection xác định được; chỉ random trong effect khi vào một trang Boss. Accordion, filter, tab và theme không chọn lại bộ ba. Điều hướng sang Boss mới tạo bộ ba mới. Pool ít hơn ba thì trả đúng số còn lại, không nhân bản.

## Hình ảnh

Giữ 17 Hero/Directory Boss images, 26 Monster assets và **113/113 canonical equipment images** đã được duyệt. Không tải ảnh thay thế kém hơn hoặc hotlink mới trong V11. Browser đã chọn các item trong gallery và kiểm tra ảnh đọc được; screenshot Reavers xác nhận đúng preview/range, không chỉ URL.

Material còn thiếu ảnh riêng vẫn dùng icon chung có chủ đích; không đổi trạng thái chúng thành verified. Ghi công Artix và chính sách asset giữ tại khu vực Nguồn ảnh AQW/giới thiệu và `public/images/aqw/CREDITS.md`.

## Files chính

| Phạm vi | Files |
|---|---|
| Selector | `src/features/ultra/RPGEquipmentSelector.tsx`; sửa `Equipment.tsx`, `EquipmentMetadata.tsx`, `UltraBoss.tsx` |
| Recommendations | `BossRecommendations.tsx`; `src/lib/boss-recommendations.mjs` và `.d.mts` |
| Chuẩn hóa dữ liệu | `src/lib/equipment-category.mjs` và `.d.mts`; `src/lib/weapon-stability.mjs`; `scripts/apply-content-verification.mjs` |
| Design | `src/styles/ultra/v11.css`; `src/App.tsx`; câu chữ `SpeakerTutorial.tsx` |
| Data sinh lại | `src/content/ultra/{bosses,equipment,inspection,recovery}.json`; `src/content/route-summaries.json` |
| Evidence | `content-sources/recovery/v11-range-mapping.json`, `v11-combat-review.json`; snapshots Google Sites đã đọc lại |
| Tests | `tests/v11-data.test.mjs`, `v11-browser.mjs`, `v11-recommendations-browser.mjs`, `build.test.mjs`; cập nhật selectors của recovery/material/visual browser tests; `package.json` |
| Audit/docs | `scripts/audit-v11.mjs`; `BOSS_COMPLETION_AUDIT.md`, `EQUIPMENT_IMAGE_AUDIT.md`, `WEAPON_STABILITY_AUDIT.md`, `README.md`; báo cáo này |

## Kiểm thử đã thực hiện

| Kiểm tra | Kết quả |
|---|---|
| Unit/data/semantic | **64/64** |
| Focused project lint | **65 TypeScript files; 0 findings** — không phải ESLint |
| Typecheck | Passed |
| Production build | Passed; **363 routes + 404** |
| Build/SSR tests | **9/9**; gồm one preview, ba recommendations hợp lệ, không có source section |
| V11 Chromium matrix | **136/136** — 17 Boss × 4 độ rộng × 2 theme |
| Boss/secondary Monster/image regression | **136/136** |
| Materials alternative + persistence | **8/8** |
| DT/EDoT slots regression | **4/4** |
| Recommendations/theme/live navigation/thumbnail arrows | **4/4** |
| Route loading/history | Passed |

Các độ rộng: **375, 768, 1440, 1920px**; Dark và Light Mode. Kiểm tra filter, selection, progress sau đổi item, mặc định đóng, ảnh, typography, source section bị bỏ và horizontal overflow. Không có page/console errors trong V11 matrix, không có hydration mismatch được ghi nhận. Recommendation navigation vẫn là client navigation.

Screenshots đã chụp và mở xem: selector mobile/tablet/desktop, Reavers, recommendations desktop/mobile; `qa/v11/`. Kết quả JSON: `qa/v11/browser-report.json`, `recommendations-report.json`; regression tại `qa/recovery/`.

Không kiểm thử Safari thực tế hoặc WebKit trong V11. Production build còn cảnh báo chunk >500kB; không che cảnh báo hoặc tuyên bố đã tối ưu xong bundle.

## Chạy tiếp

Local đã kiểm tra: **http://127.0.0.1:4181/ultra-boss**. Dev trên macOS: `cd ~/Desktop/Project/aqw-vietnam-guide`, `npm install`, `npm run dev` → port 4173.

Sau khi cập nhật data/build: chạy `node scripts/recovery-audit.mjs` rồi `node scripts/audit-v11.mjs`. Audit không tự giải quyết dữ liệu nguồn thiếu. Các công việc thực sự còn lại là sáu Boss trong bảng combat, năm Stability, material icons và kiểm tra Safari/WebKit; không gọi toàn bộ content recovery là hoàn tất.
