# Class Codex — triển khai và kiểm tra

Route `/class` có 113 hồ sơ/nhóm biến thể lấy từ tài liệu cộng đồng, không phải tuyên bố đã có toàn bộ Class phát hành. `/class/thu-vien` giữ thư viện và so sánh cũ. Alias ngắn hỗ trợ `/class/archpaladin`, `/class/lord-of-order`, `/class/dragon-of-time`, `/class/blaze-binder`.

Bốn hồ sơ biên soạn: ArchPaladin, Lord of Order, Dragon of Time, Blaze Binder. Có skill chủ động, passive có nguồn, hướng dẫn lấy theo bước, combo cộng đồng và nguồn Wiki đối chiếu. Độ khó là đánh giá biên tập dựa trên quản lý trạng thái/HP/thời điểm hỗ trợ, không phải chỉ số chính thức. Hồ sơ còn thiếu metadata hiển thị Đang cập nhật.

Component tại `src/features/classes`; types tại `src/types/classes.ts`; metadata tại `src/content/classes`; nội dung chi tiết tải riêng tại `public/content/classes`. Script `npm run content:classes` dựng lại dữ liệu từ bản tài liệu local và overrides. Tiến độ checklist lưu riêng theo ID Class, dùng chung giữa alias và URL chính. Tabs combo dùng bàn phím; skill dùng details; hash mở mục nguồn đang thu gọn; reduced motion được hỗ trợ.

Thiết kế: nền midnight/slate, serif display cùng Source Sans 3 hỗ trợ tiếng Việt, accent theo archetype. Taste local đã được đọc và dùng direction editorial-report, seed 1324613303 (`.taste-skill/class`); điều chỉnh theo yêu cầu RPG. Không truy cập được hai repo liên kết impeccable/tatse qua connector; không tuyên bố đã chạy công cụ của hai repo. Hướng dẫn Impeccable công khai đã tham khảo cho phân cấp, khoảng cách và accessibility. Chưa có screenshot Safari do safaridriver exit 1.

Asset Class hiện vẫn là placeholder có nhãn rõ ràng. Không có hình game giả. Xem IMAGE_AUDIT.md và pipeline ở docs/ASSET-PIPELINE.md.

Kết quả lượt kiểm tra cuối: lint 39 file TypeScript, typecheck, 25 unit/content tests, 8 kiểm tra HTML và 4 kiểm tra server đều đạt. Production build 354 routes đạt. Vite cảnh báo bundle chính khoảng 770 kB trước gzip; nên tách metadata/lazy route trong lượt tối ưu tiếp. Safari và kiểm tra hình tại 375/768/1440/1920px chưa hoàn tất do không mở được phiên GUI. Trong lượt này `npm run dev` gặp EPERM bind 127.0.0.1:4173, vì vậy không xác nhận localhost đang phục vụ. File nguồn đã sẵn sàng chạy từ Terminal macOS ngoài sandbox.
