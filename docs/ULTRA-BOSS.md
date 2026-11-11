# Ultra Boss RPG Codex

## Phạm vi

Chuyên mục nằm trong project hiện tại, không tạo site mới, không chạm Rebiomed. Thêm 9 route vào bộ routing/prerender hiện có: `/ultra-boss` và 8 hồ sơ. Tổng website hiện có 349 route và trang 404.

| Hồ sơ           | Phạm vi đã có                                                               |
| --------------- | --------------------------------------------------------------------------- |
| Ultra Dage      | Cơ chế, stats, 2 đội hình cộng đồng, 2 tuyến Calamitus                      |
| Ultra Warden    | Cơ chế, stats, 1 đội hình cộng đồng, các mốc Daily/merge Exalted Apotheosis |
| Ultra Ezrajal   | Map, nguồn, HP/level; đang cập nhật cơ chế/team/progression                 |
| Ultra Engineer  | Map, nguồn, HP/level; đang cập nhật cơ chế/team/progression                 |
| Ultra Tyndarius | Map và điều kiện; đang cập nhật chi tiết                                    |
| Ultra Nulgath   | Map và điều kiện; đang cập nhật chi tiết                                    |
| Ultra Drago     | Map và điều kiện; đang cập nhật chi tiết                                    |
| Ultra Speaker   | Map và điều kiện; đang cập nhật chi tiết                                    |

“Đã biên soạn” của hai hồ sơ đầu chỉ nói về bộ dữ liệu đang hiển thị, không phải xác nhận đủ asset hay nghiệm thu thị giác. Tuyến Apotheosis ghi rõ cần Penultima từ các bước merge trước; không giả vờ bảng này chứa toàn bộ chuỗi chế tạo Penultima.

## Thành phần

- `src/types/ultra.ts`: UltraBoss, BossMechanic, BossStat, RecommendedTeam, TeamClass, EquipmentRoute, QuestStep, GameAsset.
- `src/content/ultra/bosses.json`: dữ liệu 8 boss, không JSX riêng từng boss.
- `src/content/ultra/assets.json`: manifest 19 asset, trạng thái và đường dẫn ứng viên được tra theo đúng đối tượng.
- `src/features/ultra/`: directory/detail, Asset, BossPanel, Teams, Equipment.
- `src/lib/ultra-progress.ts`: key tiến độ và xác thực đường dẫn Back.
- `src/styles/ultra/codex.css`: palette, responsive và motion tokens.
- `scripts/ultra-assets.mjs`: kiểm tra asset; tải có chọn lọc các mục đã xác nhận usage khi có mạng.
- `tests/ultra.test.mjs`: dữ liệu, dependency, tiến độ/chu kỳ, điều hướng và asset integrity.

Thêm boss bằng một phần tử trong JSON, với source IDs khớp các trường. Router và prerender tự lấy danh sách. Không đổi guide cũ thành hồ sơ Ultra hoặc trộn dữ liệu game khác.

## Tương tác

Directory tìm tên boss, tên phụ và map, lọc hồ sơ đã biên soạn. Link vào Ultra được xử lý bằng History API và popstate, không reload; những guide cũ vẫn dùng hành vi điều hướng hiện có. Back chỉ dùng lịch sử/referrer cùng origin có route hợp lệ, còn lại về directory.

Panel có đúng hai tab; mặc định Cơ chế, hỗ trợ Left/Right/Home/End, roving tabindex và aria-controls. Hai panel cùng chiếm một grid area, chiều cao bằng panel cao hơn để tránh nhảy phần bên dưới. Panel ẩn có inert/aria-hidden. Đây là lựa chọn giữ chiều cao ổn định thay cho đo/animate chiều cao bằng JS.

Team accordion mở nhiều ô cùng lúc, CSS grid 0fr/1fr, aria-expanded, inert phần đóng. Không nhập rotation mới chưa có nguồn. Enhancement và ghi chú đội hình Dage lấy từ guide cộng đồng, không gọi là cấu hình bắt buộc.

Chọn trang bị đổi bảng Quest và animation nội dung. Mỗi checkbox có key riêng theo boss/tuyến/quest/chu kỳ. Mốc item và các ghi chú lặp ngày/tuần được tách: nhiệm vụ tuần không tự trở thành hoàn thành vĩnh viễn. Số mốc tính từ các dòng mốc hiện có, không hứa tiến độ tài khoản thật. Ghi chú ngày dùng UTC; tuần ghi chú bắt đầu thứ Sáu UTC, được ghi rõ không thay lịch reset game. Có báo lỗi localStorage và đồng bộ sự kiện storage giữa tab.

Các nút Quay lại mục chính đã được bỏ khỏi toàn bộ reader. Back-to-top là nút icon duy nhất, xuất hiện sau 500px, có aria-label Cuộn lên đầu trang, bàn phím và reduced motion. Chừa khoảng cuối trang; cần kiểm tra vị trí trên thiết bị thật.

## Dữ liệu và asset

Đọc các trang AQWorlds Wiki: Dage the Dark Lord, Ultra Warden (Monster), Ultra Ezrajal (Monster), Ultra Engineer (Monster), các location tương ứng, Calamitus’ Quests, Sir Cole’s Quests, Exalted Apotheosis, Necrotic Blade of the Underworld, Empowered Undead Champion. Các nguồn được liệt kê cụ thể trong `bosses.json`. Team dựa trên snapshot Challenge Boss Guide mà người dùng cung cấp; không nhận là đã kiểm chứng thực chiến.

Đã đọc chính sách https://www.artix.com/community/brand-and-assets-usage/ cho fan website phi thương mại. Footer giữ copyright, disclaimer và link AQ.com, thêm link Artix.com. Chính sách không được dùng để giả định quyền với mọi bản capture do cộng đồng đăng.

Hiện 19 asset đều pending: 8 portrait, 6 Class, 3 item và 2 map. Chưa có binary local dùng được. UI hiển thị tên đúng đối tượng và trạng thái Asset cần bổ sung; không dùng AI, ảnh sai phiên bản hay tự hotlink. Đây là giới hạn thực của bản giao hiện tại.

```bash
npm run assets:ultra
# Chỉ tải các mục đã xác nhận usageStatus=approved và có candidateImageUrl:
npm run assets:ultra -- --download
```

Script kiểm host HTTPS cho phép, MIME, chữ ký PNG/JPEG/WebP và giới hạn 8 MB; lưu trong public/art/ultra rồi cập nhật manifest. Có thể đặt localPath cho capture đã được người quản trị cung cấp hợp lệ. Asset component chỉ dùng localPath của mục approved và có fallback nếu ảnh lỗi. Không sửa trạng thái chỉ để bỏ placeholder.

Terminal vẫn không phân giải được i.imgur.com/AQ.com. User đã cho phép Terminal nhưng permission profile của phiên vẫn tự từ chối sandbox escalation; không thể hiện lại prompt qua công cụ. Không yêu cầu mật khẩu macOS hoặc tự đổi cấu hình hệ thống.

## Kiểm định

Lint, typecheck, 18 unit/content tests, 7 HTML tests, 4 server tests đã đạt: tổng 29. Clean reconstruction từ cache độc lập cũng đạt; đây không phải npm registry installation qua mạng. Production build có 349 route. Safari suite đã thêm directory/detail ở 375/768/1440/1920, tabs, chiều cao panel, accordion, equipment/progress, client navigation và back-to-top. SafariDriver vẫn thoát mã 1 trước session: chưa có kiểm thử tương tác browser hoặc screenshot mới thành công.

## Thiết kế và audit

Tìm lại impeccable/tatse/taste qua GitHub connector: cả ba trả rỗng. Tìm local không có đúng checkout. Đã dùng Taste skill cục bộ: direction editorial-report, seed 185118130, giữ palette/type theo brief. Brief ưu tiên hero RPG hai cột và màu theo boss nên không áp máy móc scene/ảnh kiến trúc được deal.

Inventory: vùng bảo hộ Dage, Noxious Decay, Focus/Taunt, Shockwaves, Berserk, ba Insignia Time Inn, Calamitus, Health Vamp và nhiệm vụ tuần. Những dữ kiện này quyết định bố cục inspection và progression; không tạo KPI/DPS giả. Các interactive panels theo hướng dẫn UI của Taste, đánh dấu data-ui để phân biệt với phần editorial.

Đã đọc lại audit reference của Impeccable công khai. Rà soát code: tab ARIA, focus, reduced motion, dữ liệu trống, dependency, layout mobile và contrast. Đã sửa chiều cao panel, tương phản nút copy, breakpoint header sau khi tăng navigation, tên dependency từ mã sang tên quest và kích thước icon ảnh tương lai. Không cho điểm WCAG hoặc điểm thị giác khi chưa chạy browser detector.

Taste source scan cho interface mode: 0 FAIL, 2 WARN cho classification label ở hero/directory, giữ theo art direction người dùng. Các border của stats/quest là cấu trúc thông tin, không KPI dashboard. Shadow thừa ở selected equipment đã bỏ. Không tuyên bố đã chạy Impeccable CLI hay đã áp dụng đúng hai repo được liên kết.

## Thay nguồn ảnh theo yêu cầu mới

Nguồn ảnh duy nhất cho chuyên mục Ultra Boss là Google Sites Vietnam Collector do người dùng gửi. `assets.json` đã đổi sourceUrl sang trang này, giữ referencePageUrl cũ chỉ để tra danh tính đối tượng, bỏ toàn bộ candidateImageUrl từ Imgur/Wiki. Không nhận là đã đọc hay lấy được ảnh: cả web tool và Terminal hiện đều không truy cập được trang. Asset vẫn pending.

Có script trích xuất ảnh nguyên gốc từ Safari WebArchive: `scripts/extract-vncollector-webarchive.py`. Đây là đường nhập offline khi có tệp nguồn; chưa có archive thực để chạy nhập ảnh. Xem content-assets/README.md. Bản trích xuất cần nhận diện bằng mắt trước khi gắn cho boss/Class/item, không tự map bằng thứ tự hoặc tên hash.

## Lượt sửa ngoài 19 asset

Đã đưa cơ chế, toàn bộ các đội hình và phần chữ progression của sáu hồ sơ còn lại vào public/content/ultra, tải theo trang và seed vào HTML khi prerender. Mỗi hồ sơ có thêm ít nhất một tuyến Quest có checkbox; các item mới chưa có ảnh được trình bày bằng tên, không thêm slot asset hay dùng hình giả. Chi tiết các tuyến khác vẫn đọc được trong disclosure.

Tuyến Apotheosis được chuẩn hóa đủ hai nhánh Apostate/Thaumaturgus và mốc Unity/Penultima. Tổng vật liệu được test. Đã sửa LP thành Legion Paladin theo catalog gốc; giữ EDoT nguyên viết tắt khi chưa có tên mở rộng chắc chắn. Không tạo đội hình hoặc rotation mới.

Shared Asset thay renderer ảnh Imgur cũ. Panel inspection có vùng cuộn native giới hạn theo viewport, tabs giữ nguyên vị trí, tránh panel Stats giữ một khoảng trống bằng toàn bài cơ chế dài. Nội dung boss được kiểm tra bossId cả từ seed và fetch để không dùng nhầm dữ liệu sau client navigation.

22 unit/content + 8 HTML + 4 server = 34 test đạt; lint/typecheck/build và clean cache check đạt. Đã thử lại Safari và probe HTTP: vẫn bị chặn. Asset manifest 19 mục không đổi. Chi tiết phạm vi và các mục ngoài khả năng phiên hiện tại nằm trong CURRENT-ISSUES.md.
