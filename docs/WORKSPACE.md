# Workspace hiện tại

Gốc thực thi duy nhất: `/Users/wstratos/Desktop/Project/aqw-vietnam-guide`. Thư mục cha Desktop/Project chứa các dự án khác, không phải gốc package. Không sử dụng bản AQW ở vị trí trước khi chuyển.

Git riêng: `.aqw-git`; core.worktree đã cập nhật sang gốc mới. Không có remote. Dùng `git --git-dir=.aqw-git status` để kiểm tra.

Đã xác nhận package.json, source, nội dung local, public assets và dependencies hiện diện. Build sinh 354 route; TypeScript, lint và 37 tests đều đạt. Có Class Codex, Ultra Boss, thư viện hướng dẫn, tìm kiếm và tiến độ local. Pipeline ảnh tồn tại; dữ liệu ảnh chưa verified vẫn là phần đang dang dở. Bundle chính khoảng 770 kB trước gzip còn cảnh báo tối ưu.

Đã sửa đường dẫn vận hành trong README, PRODUCT, CURRENT-ISSUES, ASSET-PIPELINE và Git config. Đường dẫn trong qa/clean-install.json và qa/browser-run.log là dữ liệu lịch sử, không được dùng làm cấu hình chạy. Các ghi chú sandbox/DNS cũ là kết quả tại thời điểm kiểm tra, không khẳng định trạng thái mạng hiện tại.

Chạy `npm run dev`, mở http://127.0.0.1:4173/. Đã khởi động thành công tại gốc mới. Không push hoặc deploy.
