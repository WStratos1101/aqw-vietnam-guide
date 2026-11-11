# Báo cáo kiểm tra thực tế

Ngày 2026-11-05, macOS ARM64, Node 24.22. Không push/deploy; workspace độc lập với Rebiomed.

- Typecheck: đạt.
- Lint dự án: đạt; đây là focused linter, không phải ESLint.
- Unit/content/migration: 13/13 đạt.
- Production HTML: 4/4 đạt, 340 route và 404; kiểm tra nội dung native, metadata, anchor và JSON seed.
- Production server handler: 4/4 đạt, gồm HTTP 404 và traversal.
- Tổng: 21 test đạt.
- Clean reconstruction: đạt; dependencies riêng được phục hồi theo lockfile và kiểm hash từ cache, rồi chạy lại import, typecheck, lint, 21 test và build. Chi tiết qa/clean-install.json. Chưa kiểm tra cài từ npm registry qua mạng.

Migration có 313 trang native từ 5 nguồn, 24.224 đơn vị nội dung, 30 bảng, 538 liên kết nội bộ. Test đối chiếu mỗi đoạn nguồn được đưa vào bài hoặc có lý do loại; kiểm tra giá trị ô bảng gộp, nội dung Boosted Items và loại bot khỏi cả bài lẫn search. Đây là kiểm tra độ bao phủ văn bản, không chứng minh đủ thông tin nằm trong ảnh.

## Safari và thị giác

Chỉ dùng Safari theo yêu cầu. Bộ tests/safari.mjs có viewport 375/768/1440/1920 và tương tác chính, bao gồm bài native. SafariDriver chưa tạo được session; driver thoát mã 1, enable yêu cầu xác thực macOS. Không có screenshot mới và không đánh dấu visual acceptance đạt. Chạy npm run test:safari ngoài sandbox sau khi bật Allow Remote Automation; xem README.

## Các giới hạn còn mở

- Media của tài liệu chưa được materialize tại máy; 646 ảnh được biết ở hai nguồn, số ảnh của ba nguồn text chưa xác định. Nội dung chỉ trong ảnh còn thiếu.
- Một số bảng/link của nguồn text chưa khôi phục định dạng gốc.
- Chưa đọc được đúng hai repository thiết kế impeccable và tatse/taste; đã dùng skill Taste cục bộ và tài liệu Impeccable công khai, không nhận là đã dùng các repo được liên kết.
- Google Sites tham khảo không đọc được từ công cụ; không tuyên bố đã xem layout của nó.
- Chưa có Safari visual acceptance và registry install trực tuyến. Stack React/TypeScript/Vite, không tự nhận Next.js.

## Lượt hồ sơ boss và bỏ trích dẫn

Đã chạy lại build/typecheck, lint và 23 test (13 nội dung, 6 HTML, 4 server): đạt. Hai test mới xác nhận không có panel nguồn trong reader, các mục có liên kết quay lại và portrait Dage/Blade of Awe gắn đúng trang. Đây là kiểm tra mapping/HTML, không phải xác nhận host ảnh trả dữ liệu hoặc kiểm tra hình bằng mắt. SafariDriver chạy lại vẫn thoát mã 1 trước session. Ảnh hiện tải ngoài từ Imgur theo mapping cụ thể; cần chuyển local và kiểm tra tải/render trên Safari.

## Ultra Boss Codex — 2026-11-06

18 unit/content/migration, 7 HTML và 4 server tests đạt (29 tổng); lint/typecheck/build đạt. Build 349 route. Clean cache reconstruction đạt với source mới. Safari suite mở rộng nhưng driver vẫn thoát mã 1 trước session. Asset audit: 0 ready / 19 pending. Chưa nghiệm thu ảnh, tương tác trình duyệt, responsive screenshot hoặc WCAG. Xem ULTRA-BOSS.md và qa/clean-install.json.

## Lượt sửa ngoài asset

Hiện 34 test đạt (22 unit/content, 8 HTML, 4 server); lint 29 file TS, typecheck, build 349 route và clean cache reconstruction đạt. Có regression test dữ liệu bossId khi chuyển trang, dependency và tổng nguyên liệu Apotheosis. Legacy renderer không còn hotlink ảnh, sáu guide cộng đồng có body local/SSR và tuyến Quest. 19 asset được giữ nguyên theo yêu cầu; ảnh native khác còn thiếu đầu vào. SafariDriver, HTTP probe, registry DNS và hai repo thiết kế vẫn chưa mở được; không đổi các gate đó sang đạt.
