# Khôi phục ảnh và kiểm tra trình duyệt — 2026-11-07

## Kết quả

Ban đầu 163 asset ID logic, không phải 163 tệp riêng. Đã xác minh/tích hợp 10 ID bằng 8 tệp PNG duy nhất. Ba passive ArchPaladin dùng chung một ảnh theo đúng ba block skill trên Wiki. Còn 153 ID chưa verified: 7 needs_review và 146 missing; chưa có candidate nào bị kết luận rejected. Không có tuyên bố rằng toàn bộ 153 ảnh không tồn tại.

Đã tích hợp: ArchPaladin portrait; Auto Attack, Commandment, Hymn of Light, Righteous Seal; Restitution, Blessed by Light, Righteous Judgement; Ultra Ezrajal đúng encounter; Exalted Apotheosis đúng bản kiếm đơn. Sacred Magic: Eden chưa tải được; các Class/Boss/item còn lại tiếp tục placeholder. Ảnh generic passive được ghi rõ là icon chung, không phải artwork riêng của passive.

`src/data/aqw-assets.json` giữ entity/type/source/candidates/review/hash/kích thước/usedBy/failureReason cho cả 163 ID. usedBy mô tả trang, component và vai trò; ảnh portrait được dùng lại làm thumbnail/hero. Không thay đổi ảnh khác chỉ vì đổi item. File thật ở public/images/aqw; credit hiển thị qua liên kết footer đến CREDITS.md, cùng liên kết Artix và AQW.

## Network verified

HEAD hai trang gốc đầu lượt đều HTTP 200; localhost /class HTTP 200. Có thể tải HTML ArchPaladin (0 AC), Ultra Ezrajal Monster và Exalted Apotheosis. Image URLs lấy trực tiếp từ img trong đúng nội dung trang, không dựng từ slug.

Các host thật: aqwwiki.wdfiles.com và i.imgur.com. Các URL ảnh đã tích hợp đều tải được PNG. Lượt chẩn đoán cuối: AQ.com và các URL ảnh trả 200; Wiki root có một lần curl code 7 (TCP connection failure) dù đầu lượt trả 200. WDFiles cũng có lỗi code 7 gián đoạn giữa các lần tải thành công. Đây không phải bằng chứng DNS hỏng: không có curl code 6 trong lượt này. Không thấy 403/429, lỗi TLS hay redirect đối với ảnh đã tích hợp. Không sửa DNS hệ thống. Xem qa/network.json (thời điểm và phân loại từng request); chạy lại `node scripts/aqw-network.mjs` khi cần trạng thái mới.

## Image verified

Đọc đúng Class page với tag class, đúng skill blocks và tab male; không chọn Armor cùng tên. Monster page Ultra Ezrajal có location/HP phù hợp; ảnh có nhãn ULTRA EZRAJAL. Sword page Exalted Apotheosis có Exaltia Merge và Penultima, không nhầm Dual. Đã mở các raster bằng view_image. PNG signature/kích thước/SHA256 kiểm tra bằng `node scripts/validate-aqw-assets.mjs`: 10 ID, 8 hash duy nhất, 0 lỗi. Hai bản ghi duplicate hash là chia sẻ passive có chủ đích. Playwright decode ảnh thật để phát hiện tệp không đọc được.

Quyền sử dụng đối chiếu AE Brand and Assets Usage cho fan guide phi thương mại; credit Artix và tác giả đóng góp Wiki giữ trong public/images/aqw/CREDITS.md. Không suy diễn rằng mọi ảnh bất kỳ trên Wiki đều được duyệt. Candidate khác giữ needs_review/missing.

## UI/browser verified

Playwright Chromium mở được ngoài sandbox qua approval. Trong sandbox Chromium bị lỗi MachPort permission denied; SafariDriver không còn là điều kiện phụ thuộc. Script `npm run test:chromium` kiểm tra 6 route x 4 viewport = 24 trường hợp: homepage, Class directory, ArchPaladin, Ultra directory, Ultra Ezrajal và Ultra Dage (Equipment Gallery). Tất cả HTTP 200, không pageerror, không ảnh hỏng sau khi decode, không tràn ngang. Tabs, team accordion, chọn equipment và checklist qua reload đều đạt. Đã sửa tràn ngang ở tên Class thay thế dài trên Ultra Ezrajal tại 375px. Bài kiểm tra ban đầu đọc checkbox trước khi restore đã được đổi sang chờ trạng thái checked sau reload.

Có screenshot full page và viewport tại qa/chromium (PNG không commit); qa/chromium/report.json giữ kết quả. Đã mở xem thực tế ảnh homepage desktop, Class directory mobile, ArchPaladin mobile và Ultra Ezrajal desktop/mobile. Không tuyên bố đã xem thủ công từng pixel của toàn bộ 48 screenshot; chưa benchmark animation FPS hoặc layout shift bằng trace. Chạy reducedMotion trong smoke test, giữ nguyên motion CSS trong sản phẩm.

## Build/test

Production build 354 route đạt, bao gồm typecheck. 25 test nội dung, 8 HTML và 4 server đạt. Focused lint đạt (39 TS files), không phải ESLint đầy đủ. Vite vẫn cảnh báo bundle chính khoảng 770 kB trước gzip. Không push/deploy, chỉ làm trong thư mục AQW mới.

## Chạy lại trên macOS

Tại `/Users/wstratos/Desktop/Project/aqw-vietnam-guide` chạy `npm run dev`, rồi Terminal khác chạy `npm run test:chromium`. Chạy discovery có giới hạn: `npm run assets:sync -- --discover --limit 4`; chỉ tải candidate sau khi có review đủ bằng chứng và usage approved: `npm run assets:sync -- --download`. Nếu GUI/network bị sandbox chặn, dùng approval hợp lệ. Không chạy lại toàn bộ discovery một cách không giới hạn.
