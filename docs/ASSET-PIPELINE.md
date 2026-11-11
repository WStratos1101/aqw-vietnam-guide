# Đồng bộ ảnh AQW

`npm run assets:sync` dựng inventory và audit mà không truy cập mạng. `npm run assets:sync -- --discover --limit 4` đọc tối đa bốn trang đã đối chiếu URL, cách nhau ít nhất 1,2 giây. Không tự tạo URL Wiki từ slug. Nguồn Wiki cho hồ sơ còn thiếu phải được đối chiếu thủ công trước khi thêm sourcePage. 403/429 dừng vòng discovery; DNS lỗi được ghi nhận; không vượt bảo vệ.

Manifest: `src/data/aqw-assets.json`; inventory: `src/data/aqw-entities.json`; audit: IMAGE_AUDIT.md. Inventory lấy Class/skill/obtain steps và Ultra Boss/location/progression đã mô hình hóa; các tên vật phẩm chỉ nằm trong văn bản hướng dẫn chưa được tách thành entity chuẩn hóa. Candidate là toàn bộ img của trang, có thể chứa UI Wiki: tất cả đều needs_review, tuyệt đối không duyệt theo tên file hoặc vị trí.

Sau khi đọc trang đúng entity/type/phiên bản, xem ảnh và kiểm tra quyền, thêm review: approved=true, imageUrl, entityEvidence, pageRegionEvidence, visualEvidence, usageEvidence, reviewer, reviewedAt. usageStatus phải approved. Chạy `npm run assets:sync -- --download` để kiểm tra HTTPS/host, MIME, signature PNG/GIF, kích thước, giới hạn 12MB và SHA256. JPEG/WebP chưa được tự duyệt: để needs_review. Không ghi đè file khác hash. Lần sau bỏ qua verified còn nguyên hash. Runtime chỉ đọc ảnh verified + approved có local path; fallback cũ giữ nguyên.

Review là cổng kiểm tra có bằng chứng, không phải khả năng tự xác nhận bằng vision. Pipeline không tự nâng candidate lên verified. Kiểm tra nội dung ảnh trực quan và quyền screenshot do cộng đồng tạo vẫn cần người duyệt. Quy định Artix cho fan site không tự chứng minh quyền của mọi screenshot cộng đồng.

Hiện tại discovery bị lỗi DNS; chưa có ảnh được tải hoặc duyệt. Safari kiểm thử bị safaridriver exit 1. Dev server bị EPERM khi bind localhost trong phiên hiện tại. Chạy từ Terminal macOS bình thường: `cd ~/Desktop/Project/aqw-vietnam-guide`, `npm run dev`, mở Safari http://127.0.0.1:4173/class. Không cần cài dependency mới cho pipeline Python 3 tiêu chuẩn.


Cập nhật khôi phục: các giới hạn DNS/localhost ở trên là lịch sử. Đã chạy Chromium và tích hợp ảnh thật; xem IMAGE-RECOVERY.md và qa/network.json cho trạng thái mới.
