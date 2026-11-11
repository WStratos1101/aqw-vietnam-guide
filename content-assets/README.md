# Tệp nguồn chứa hình

Nguồn ảnh duy nhất cho Ultra Boss theo yêu cầu hiện tại:
https://sites.google.com/view/vncollector/adventure-quest-worlds/ultra-boss-guide

Công cụ duyệt web không đọc được trang; Terminal không phân giải được sites.google.com. Chưa có ảnh nào được lấy từ nguồn này. Manifest không giữ candidate Imgur/Wiki làm phương án tải thay thế.

Có thể dùng Safari lưu trang và các trang boss con thành **WebArchive** (File → Save As), sau khi đã cuộn để tải đủ ảnh, rồi đặt tệp trong `content-assets/vncollector/`. Không cần gửi cookie, tài khoản hoặc mật khẩu.

Trích xuất ảnh gốc, không chỉnh sửa:

```bash
python3 scripts/extract-vncollector-webarchive.py content-assets/vncollector/page.webarchive
```

Script chỉ nhận đúng URL nguồn hoặc trang con. Output nằm trong `content-assets/vncollector/extracted/`, có inventory URL và SHA256. Đây chưa phải ánh xạ boss: phải xem ảnh, nhận diện đúng đối tượng rồi mới đưa tệp cần dùng vào `public/art/ultra/` và cập nhật manifest. Không đoán tên ảnh theo thứ tự tải. WebArchive có thể chứa bản capture chưa tải đủ ảnh hoặc thiếu ảnh trong nội dung nhúng; inventory phản ánh những gì thực sự có trong tệp.

Các tệp nhị phân được gitignore. Bản xuất Google Docs trước đây chưa tải được về filesystem; không lưu URL tải có chữ ký vào repository.
