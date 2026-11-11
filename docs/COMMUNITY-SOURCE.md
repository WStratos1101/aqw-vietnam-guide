# Chuyển guide thành nội dung native

## Yêu cầu hiện tại

Website phải cho phép đọc trực tiếp toàn bộ guide được cung cấp, thay cho mục lục mở Google Docs. Mục lục 56 link và ba bài tóm tắt ở phiên trước đã được thay bằng hệ thống bài native. Link Google Docs chỉ còn ở phần ghi nguồn; chúng không phải đường đọc chính.

## Nguồn đã đọc

| Tài liệu                  | ID                                           | Cách lấy nội dung    | Số trang native |
| ------------------------- | -------------------------------------------- | -------------------- | --------------- |
| AQW GAME GUIDE            | 1hvAYNvsiq2VOU3PsvkfIJqnXahZlC6ZPSs6MWR3pLbk | Docs API có cấu trúc | 66              |
| AQW CLASS GUIDE           | 1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78 | Text export          | 130             |
| AQW FARMING ITEM GUIDE    | 1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA | Text export          | 87              |
| AQW CHALLENGE BOSS GUIDE  | 18Z2Yu0O40dVyh0enB_2k_v4U-De3mg1y-HtThUmvxfU | Docs API có cấu trúc | 27              |
| AQW UPGRADE BONUS PACKAGE | 1AC647dNGJ3RfuR8oBTpu4RKm5j8bFgnHYTRK8DB9QbE | Text export          | 3               |

Bốn tài liệu con được xác định từ hyperlink thật trong nguồn chính rồi đọc metadata trước khi lấy nội dung. Không mở Bot Guide. Không sửa tài liệu gốc.

Class, Farming và Bonus giữ toàn bộ phần chữ lấy được qua export. API cấu trúc cho Class và Farming nhiều lần timeout, kể cả khi giới hạn fields; không giả vờ đã có style, ảnh hoặc hyperlink đầy đủ của chúng. Ngày đọc và ngày sửa nguồn được giữ trong catalog.

## Kết quả chuyển đổi

- 313 trang native, cộng các trang nền tảng của dự án thành 340 route HTML và 404 riêng.
- 24.224 đoạn văn/cell được chuyển thành body, ngoài các heading trang.
- 30 bảng từ hai tài liệu có cấu trúc được giữ, gồm rowspan/colspan.
- 538 hyperlink được chuyển sang route/anchor nội bộ. Không còn Google Docs navigation trong body của các trang native.
- Mỗi đoạn chữ trong snapshot đầu vào phải có mặt trong body, heading trang hoặc danh sách loại trừ rõ ràng. Test coverage đã kiểm tra điều này.
- Class và Farming từ text export có các ô bảng ở dạng đoạn chữ; không gọi đó là bảo toàn toàn bộ định dạng bảng của nguồn.
- Những câu trỏ Enhancement trong Class đã liên kết tới trang Enhancement native. Một số tham chiếu khác trong text export bị mất URL; chúng hiện trạng thái đang bổ sung, không tạo link giả.

Số trang native là số trang/chương, không phải số Class hay số Item. Ví dụ, 130 trang nguồn Class gồm cả các chương cơ chế và bảng hướng dẫn chung.

## Kiến trúc

- `content-sources/*.json`: snapshot đã chuẩn hóa, giữ văn bản, span, heading, table và source positions; không chứa bearer URL hoặc ảnh hotlink.
- `scripts/import-guides.mjs`: tách chương/bài, giữ spans và bảng, đổi liên kết, loại nội dung ngoài phạm vi, sinh chỉ mục và báo cáo coverage.
- `src/content/imported/catalog.json`: metadata/TOC nhỏ, không đóng toàn bộ body vào JavaScript khởi đầu.
- `public/content/guides/*.json`: body từng bài, chỉ tải bài cần đọc.
- `public/content/search-index.json`: chỉ mục toàn văn tải khi tìm kiếm, có cache chuỗi chuẩn hóa trong phiên.
- `NativeGuide`/`RichContent`: template đọc native, dữ liệu ban đầu nhúng vào HTML production; dev có loading/retry state thực.

`npm run build` luôn chạy import trước typecheck/build/prerender. `npm run content:import` cho phép chạy riêng bước nhập. ID page/body/progress dựa theo source key và slug; không phụ thuộc chỉ số dòng khi không có xung đột tên.

## Dữ kiện và attribution

Các bài nhập mang trạng thái Theo tài liệu cộng đồng, không tự đổi thành đã kiểm chứng trong client. Build, đánh giá, tỷ lệ và nhận xét được giữ như nội dung tác giả của bản nguồn. Tài liệu nguyên bản tự ghi AQW Vietnam và Vietnam Collector; website giữ ghi công và disclaimer fan project. Không tự áp giấy phép Wiki cho toàn bộ Google Docs.

30 source positions được loại khỏi bản công khai theo yêu cầu ban đầu, gồm các chỉ dẫn bot/load quest trái mùa và setup khai thác Infinite Healing. Một số vị trí là dòng trắng thuộc cùng đoạn setup. Chỉ mục tìm kiếm cũng không chứa các recipe bị loại. Các tên NPC/Monster có chữ Bot vẫn được giữ vì chúng là nội dung game.

## Những phần chưa thể coi hoàn tất

1. **Hình ảnh:** có 411 image IDs trong phần nội dung Game Guide và 235 trong Challenge; chưa có media local tương ứng. Số hình của các bản text export chưa xác định. Nguồn DOCX Game Guide đã xuất được thành file reference 97.413.230 byte, nhưng terminal bị chặn DNS của host tải file; connector không materialize file vào workspace. Không dùng URL ảnh tạm hoặc tự vẽ dữ kiện trong ảnh.
2. **Định dạng/link của text export:** chưa có bảng/style/hyperlink gốc đầy đủ của Class, Farming và Bonus. Phần chữ đã có; ảnh/rating dạng icon và URL tham khảo bị mất vẫn cần DOCX/ZIP hoặc API cấu trúc đọc được để hoàn tất.
3. **Visual inspection:** chưa có phiên Safari WebDriver thành công để xem bố cục thực tế.

Do đó không tuyên bố toàn bộ hình và mọi chi tiết trình bày trong file Docs đã hoàn tất. Bản DOCX/ZIP cục bộ trong `content-assets/` sẽ cho phép tiếp tục bước media và khôi phục định dạng/link mà không phụ thuộc tải qua terminal.
