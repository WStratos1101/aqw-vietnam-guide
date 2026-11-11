# Cách bổ sung asset đúng đối tượng

Lượt sửa hiện tại giữ nguyên 19 asset pending theo yêu cầu người dùng. Tài liệu này hướng dẫn thao tác khi bổ sung sau; không thay ảnh bằng hình AI hay bật approved khi chưa có file.

1. Lấy ảnh gốc từ nguồn Vietnam Collector đã chỉ định. Có thể lưu trang bằng Safari WebArchive rồi đặt trong content-assets/vncollector. Chạy `python3 scripts/extract-vncollector-webarchive.py content-assets/vncollector/page.webarchive` để lấy nguyên tệp ảnh; inventory chưa xác định boss, không tự gán theo thứ tự.
2. Mở ảnh và nhận diện đúng boss/Class/item, đúng phiên bản AQW. Ảnh phải được phép dùng; giữ credit trong manifest. Không dùng ảnh AQ3D/Infinity hay phiên bản thường thay Ultra khi ngoại hình không khớp.
3. Chép ảnh được chọn vào public/art/ultra, đặt tên rõ ràng. Ví dụ public/art/ultra/ultra-dage.png. Không cần sửa component.
4. Sửa **đúng entry hiện có** trong src/content/ultra/assets.json, giữ id/sourceUrl/credit và usageNote, thêm localPath và đổi usageStatus sau khi đã kiểm tra:

```json
{
  "id": "ultra-dage-portrait",
  "localPath": "/art/ultra/ultra-dage.png",
  "usageStatus": "approved"
}
```

Đoạn trên chỉ là các trường cần cập nhật, không phải object thay thế toàn bộ metadata. localPath là URL từ public, không ghi /Users/... hoặc public/... vào trường này.

5. Chạy `npm run assets:ultra`, `npm test`, `npm run build`; kiểm tra ảnh trong Safari ở desktop/mobile và thử ảnh lỗi. Sau build production, chạy npm start; dev hiện tại dùng npm run dev. Không chạy hai server trên cùng cổng.

Renderer legacy và Ultra Codex cùng dùng manifest/local asset. Các Class chưa có ảnh vẫn có tên/alt rõ ràng; ảnh missing không được thay bằng hình của Class khác. Tài nguyên ngoài 19 slot không bị tự thêm vào manifest trong lượt sửa này. Khi cần thêm ảnh cho một đối tượng mới, khai báo metadata và mapping riêng sau khi đã có ảnh hợp lệ.
