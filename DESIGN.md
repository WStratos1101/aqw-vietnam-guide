# Hệ thống thiết kế

## Ý tưởng

Các chặng tìm hiểu Lore trở thành các chương màu rõ ràng: bắt đầu trên nền giấy, chọn Class trong bóng tối, theo dõi farm, rồi mở rộng hành trang. Thanh kiếm là biểu tượng hành trình, không sao chép một item hoặc artwork thật. Tương tác chủ đạo trên trang chủ: chọn Warrior/Mage/Healer và xem thông tin thực tương ứng.

Inventory riêng cho brief: Battleon, Book of Lore, Class khởi đầu, Enhancement Fighter/Wizard/Healer, Valencia, Museum, năm mảnh Legendary, lệnh /join, các chương Chaos, checklist farm, tên riêng giữ tiếng Anh.

## Nguồn thiết kế: xác minh và giới hạn

### Repository được liên kết

Đã liệt kê repository bằng GitHub connector (page size 100) và tìm `impeccable OR tatse OR taste`. Kết quả chỉ có một repository khác, không có ba tên cần tìm. Workspace trống; tìm các tên này trong Projects, .codex/skills và .agents cũng không thấy checkout. Không thể khẳng định đã truy cập hay áp dụng đúng hai repository người dùng nói đã liên kết. Đây là yêu cầu còn chưa đáp ứng.

### design-taste-frontend cục bộ

Đã đọc README.md, SKILL.md và references/critique.md tại `/Users/wstratos/.codex/skills/design-taste-frontend`. Skill tự mô tả là tasteskill v2. Không có bằng chứng để kết luận skill này chính là repository `tatse` hay `taste` của người dùng.

Đã chạy draw: sector education, tone bold, illustration, giữ palette/type theo brief. Chọn **Colour chapters**, seed **1417267924**. Hai phương án khác được deal: Loud and flat và Type and nothing else. Không redraw. Lý do chọn: các lớp dữ liệu của cẩm nang phù hợp cách chia chương bằng trường màu.

Ứng dụng: các nền phẳng nối tiếp; một tiêu điểm lớn mỗi chương; section Class có lựa chọn hoạt động; list editorial cho thư viện; footer wordmark lớn; không lấy ảnh nông trại được deal vì không liên quan thế giới game. Giữ palette từ brief và Source Sans 3 hỗ trợ tiếng Việt. Ưu tiên brief cho artwork SVG, số bước có nghĩa, technical separators trong form và kích thước section phù hợp nội dung thay vì ép mọi section cao 90svh. Không thêm bốn ảnh không liên quan chỉ để đạt chỉ tiêu của skill.

Đã chạy source lint: 0 FAIL; cảnh báo em dash xuất phát chủ yếu từ tên nguồn và title metadata. Không có detector rendered thành công; không tuyên bố gate hoàn tất.

### Impeccable công khai

Đã đọc repository tác giả https://github.com/pbakaus/impeccable (README), `.agents/skills/impeccable/SKILL.md`, `reference/new-work.md`, `reference/craft-floor.md`, `reference/audit.md` qua web ngày 2026-11-05. Đây là nguồn công khai bổ sung, chưa xác minh đồng nhất với repo được liên kết. Skill công khai phiên bản metadata 4.8.0; Codex dùng `$impeccable`, CLI `npx impeccable detect ...` theo README hiện tại.

Launcher không có cục bộ; context/engine/detector không chạy, không cài hook. Dùng fallback đọc ngữ cảnh và tài liệu trực tiếp. Áp dụng phân biệt Experience ở hero, Read ở article, Operate ở bộ lọc; PRODUCT/DESIGN làm nguồn quyết định. Áp dụng craft floor cho hierarchy, sự nhất quán, focus, reduced motion, nội dung và trạng thái. Quy trình hỏi xác nhận concept được bỏ qua theo chỉ thị người dùng tự quyết định thiết kế. SVG nguyên bản được giữ theo lựa chọn artwork đã cho trong brief, dù craft floor có quy tắc chặt hơn về minh họa giả tranh.

## Tham khảo Endfield

Đã mở https://endfield.gryphline.com/vi-vn và đọc cấu trúc trang trực tiếp qua web: điều hướng nhóm nội dung, trình bày cán viên lớn, trường thông tin, media và các nhóm section. Không tải logo, video, artwork hoặc code.

Chuyển ngôn ngữ bố cục theo brief: hero lớn; hình ở một nửa khung; chữ đậm, các lớp hình học; thông tin ngắn cạnh đối tượng; đổi nền giữa chương. Bài hướng dẫn dùng độ dài dòng và mục lục rõ ràng. Header bỏ menu tài khoản và tải game vì không phục vụ cẩm nang.

Không thể kiểm tra trực quan desktop/mobile hoặc xác minh animation, hover, tỷ lệ pixel thực của Endfield: Chromium bị sandbox chặn. Các nhận định về motion và bố cục tham chiếu ở đây là diễn giải brief, không phải kết quả xem screenshot.

## Tokens

| Vai trò           | Giá trị                                                       |
| ----------------- | ------------------------------------------------------------- |
| Nền giấy          | #F4F4F0                                                       |
| Mực               | #101113                                                       |
| Graphite          | #26282B                                                       |
| Tương tác chính   | #E9FF3D                                                       |
| Nền phụ           | #E5E8E2                                                       |
| Chương hành trang | #BDCFC3                                                       |
| Chữ phụ           | #555B58                                                       |
| Khoảng cách       | 8 / 16 / 24 / 40 / 64 / 120px                                 |
| Gutter            | clamp(20px, 4.2vw, 80px)                                      |
| Chữ               | Source Sans 3, 400/600/700/900                                |
| Motion            | 250ms feedback, 800–1000ms entrance, cubic-bezier(.16,1,.3,1) |

Font tự host latin và vietnamese. Không có request Google Fonts. Các nút vuông, hình phẳng, tối đa một accent; không glass, gradient hoặc glow. Form/table được phân định trực quan; bài đọc dùng nền giấy và độ rộng khoảng 68ch. Các quy tắc cụ thể nằm trong src/styles/global.css.

## Responsive và truy cập

Desktop hero hai cột; mobile hero đọc chữ trước, artwork phía dưới. Header chuyển menu ở 900px; bài đọc bỏ sticky TOC thành khối trước bài ở tablet. Form wrap, bảng so sánh có vùng cuộn riêng. Có skip link, focus ring, aria-current, labels, tablist hỗ trợ mũi tên/Home/End, Escape đóng menu, reduced motion, img dimensions, semantic landmarks.

CSS breakpoints được viết cho 375/768/1440/1920; **chưa có bằng chứng browser**. Không tuyên bố đạt WCAG chỉ từ kiểm tra source.

## Artwork và quyền sử dụng

- public/art/lore.svg: hình học kiếm, núi và thành trì; nguyên bản tạo trong phiên này; không mô tả chính xác khu vực game.
- public/art/awe.svg: biểu tượng kiếm nguyên bản; không phải hình Blade of Awe trong game.
- Ba emblem Class là SVG hình học nguyên bản, không phải ngoại hình Class.
- Không ảnh/clip tìm bên ngoài; không ảnh deal được sử dụng; không artwork Artix/Endfield được đóng gói.
- Font Source Sans 3: SIL Open Font License, phân phối thông báo kèm assets.

## Critique

Không chấm điểm hình ảnh khi chưa xem được render. Xem docs/QA.md cho kết quả kiểm tra thực và gate còn mở. Cần chạy inspect + xem screenshot desktop/mobile bằng Safari theo yêu cầu người dùng, rồi ghi critique đúng format của skill và sửa những lỗi nhìn thấy.

## Cập nhật kiểm định Safari

Theo yêu cầu người dùng, browser suite mặc định chuyển sang Safari thật qua Apple SafariDriver. Không dùng Chrome cho lượt tiếp tục này. Đã viết tests/safari.mjs và thử chạy: driver thoát mã 1; enable cần xác thực macOS, mở app từ môi trường công cụ gặp lỗi LaunchServices. Chưa có screenshot để chấm điểm. Không lấy WebKit của Playwright làm bằng chứng Safari.

Article sources được điều chỉnh: chỉ hiển thị ghi công CC BY-SA khi có nguồn Wiki; bài chỉ dựa trên Artix không gắn giấy phép Wiki cho nội dung đó. Route invalid/prototype/malformed được trả về trạng thái 404 đúng thay vì nhận nhầm là danh mục.

## Bài đọc native từ tài liệu cộng đồng

313 trang nhập dùng cùng reader nền giấy, độ rộng đọc giới hạn, TOC riêng và điều hướng chương. Bảng cuộn trong vùng riêng; các bước farm có checkbox lưu cục bộ. Search toàn văn được tải khi cần; catalog phân trang tránh danh sách hàng trăm thẻ. Không biến người dùng sang Google Docs để đọc nội dung. Google Sites tham khảo không truy cập được nên không tuyên bố sao chép hay kiểm tra layout của nguồn đó. Media chưa được lấy về không được thay bằng hình giả hoặc hotlink.

## Hồ sơ chiến đấu RPG

Theo yêu cầu tiếp theo, bỏ citation/source panel khỏi giao diện. Hồ sơ boss dùng nền graphite, portrait nguyên tỷ lệ và typography lớn; ô thông tin chỉ xuất hiện khi có dữ kiện đã đối chiếu, không tạo thanh chỉ số giả. Các chương chiến thuật tách từ heading gốc và nhóm mục có dấu ◆ thành vùng riêng, có liên kết trở lại mục chính hoặc mục cha. Ảnh đối tượng được map theo slug chính xác; không fuzzy-match giữa NPC/monster hoặc các phiên bản item. Hiện URL ảnh bên ngoài được dùng có chủ đích cho các đối tượng đã tìm đúng trang, chưa có binary local và chưa xem render Safari.

## Ultra Boss Codex — 2026-11-06

Chuyên mục mới giữ shell hiện có, palette obsidian/bone/gold và accent riêng của Dage/Warden/Nulgath/Speaker. Source Sans 3 cho chữ Việt, Georgia cho tên RPG. Direction Taste editorial-report seed 185118130 giúp giữ logic bách khoa, brief người dùng quyết định hero hai cột và inspection. Các tương tác chính là segmented tabs, team accordion và selection/quest progression. Motion tokens tập trung ở codex.css; reduced motion giữ trạng thái và nội dung, chỉ bỏ animation. Đọc docs/ULTRA-BOSS.md cho audit và các giới hạn ảnh/repository/browser. Các nút quay lại mục chính của lượt trước nay đã bỏ theo yêu cầu mới.

Class Codex được mô tả tại [docs/CLASS-CODEX.md](docs/CLASS-CODEX.md), gồm quyết định typography, màu theo Class và phạm vi sử dụng Taste/Impeccable thực tế. Quy trình ảnh kiểm chứng độc lập giữ nguyên bố cục và animation; xem [IMAGE_AUDIT.md](IMAGE_AUDIT.md).
