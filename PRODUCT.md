# AQW Vietnam Guide

Cẩm nang tiếng Việt phi thương mại dành riêng cho AdventureQuest Worlds. Người chơi đọc hướng dẫn, tra Class/Item/quest, tìm kiếm toàn văn và lưu tiến độ trên thiết bị. Không gộp dữ liệu AdventureQuest, AQ3D hay Infinity.

## Nội dung chính

Theo yêu cầu đã làm rõ, website trình bày guide ngay trên trang, không làm directory trỏ người đọc sang Google Docs. Đã nhập phần chữ từ Game, Class, Farming Item, Challenge Boss và Upgrade Bonus Package: 313 trang native, tổng cộng 340 route HTML cùng 404 riêng.

Bài có title, breadcrumbs, TOC, nội dung từng bước, bảng khi nguồn có cấu trúc, liên kết nội bộ, ghi nguồn và chuyển chương. Trang thư viện phân trang 24 kết quả, tìm toàn văn, lọc và empty/error states. Bookmark, checklist gốc và hoàn thành từng Step của bài farm lưu localStorage.

Số trang không được trình bày như số Class/Item. Các bài cộng đồng chưa phân loại vai trò không có thông số so sánh giả; UI cho lọc Chủ đề / chưa phân loại. Độ khó của các bài tự động nhập là Chưa đánh giá. Các nhận xét/rotation trong bản nguồn giữ trạng thái Theo tài liệu cộng đồng.

## Kỹ thuật

React 19, TypeScript strict, Vite, CSS variables, Source Sans 3 tự host, Lucide. Không backend hoặc tài khoản. Nội dung tĩnh xuất HTML để có thể đọc trước JavaScript; body mỗi bài được phân tách khỏi bundle khởi đầu. Chỉ mục toàn văn tải riêng khi tìm kiếm. Kiến trúc nội dung độc lập template, cho phép CMS sau này.

Next.js là stack ưu tiên ban đầu nhưng không có trong cache và terminal chặn npm registry. Không tự nhận stack hiện tại là Next.js App Router.

## Nguồn và phạm vi

Lấy trực tiếp nguồn được người dùng cung cấp và các tài liệu guide mà nó dẫn tới. Không scrape hàng loạt Wiki. Bài nhập không tự nhận được kiểm chứng độc lập. Nguồn tham khảo nằm cuối bài, khác đường đọc chính. Các recipe bot/cheat bị loại theo phạm vi ban đầu; không tạo bot hoặc công cụ game.

Hình nhúng, một số liên kết/định dạng bị mất khi lấy text export và kiểm tra Safari vẫn còn thiếu. Chi tiết ở docs/COMMUNITY-SOURCE.md và docs/QA.md. Không coi số trang build thành công là bằng chứng mọi hình hoặc dữ kiện game đã hoàn tất.

## Cô lập dự án

Workspace /Users/wstratos/Desktop/Project/aqw-vietnam-guide. Git riêng trong .aqw-git do .git bị sandbox bảo vệ, không remote và không history của dự án khác. Không sửa Rebiomed, không dùng secrets/database/Cloudflare của nó, không push hoặc deploy.
