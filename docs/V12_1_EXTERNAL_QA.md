# V12.1 — QA từ Terminal macOS

Chạy trong Terminal macOS bình thường, tại đúng thư mục dự án. Không cần tắt sandbox của browser hoặc cấp Full Disk Access.

```sh
cd /Users/wstratos/Desktop/Project/aqw-vietnam-guide
npm run qa:install
npm run qa:diagnose
npm run qa:darkon
npm run qa:classes
```

`qa:install` dùng Playwright đã có và `.playwright-browsers` trong project; installer tự bỏ qua bản đã có. Không cần chạy lại khi binaries còn đầy đủ. Các runner tự tạo dev server trên cổng trống và chỉ dừng process do chính runner tạo. Để kết nối một server có sẵn:

```sh
AQW_QA_URL=http://127.0.0.1:4173 npm run qa:darkon
AQW_BROWSER=webkit npm run qa:darkon
AQW_HEADED=1 npm run qa:classes
```

`PLAYWRIGHT_BROWSERS_PATH` luôn được đặt thành `<project>/.playwright-browsers` bên trong scripts, trước khi import Playwright. Không có tùy chọn bypass; Chromium chạy với `chromiumSandbox: true`.

Đầu ra:

- `artifacts/qa/diagnostics/results.json` và log riêng headed/headless/WebKit.
- `artifacts/qa/darkon/results.json` cùng screenshot bốn phase, Stats/Passive, bốn viewport và hai theme.
- `artifacts/qa/classes/results.json` cùng screenshot Directory và sáu Class đại diện; kiểm tra tiếp tất cả Class routes và skill selection.

`passed` chỉ xuất hiện sau thao tác browser thực tế. `failed` là lỗi assertion/navigation/runtime sau khi browser đã chạy. `not_run` là chưa thực thi (ví dụ dev server không mở). `browser_launch_blocked` kèm `cause` là không mở được browser; không chứng minh Darkon/Class logic lỗi. Không có screenshot giả. Kết quả cũ không được dùng để chứng nhận source mới.

Sau khi runner chạy thành công, cần mở screenshot, rà bố cục/contrast và đọc `results.json` trước khi kết luận visual QA hoàn tất. Trong Codex hiện tại Chromium bị từ chối Mach bootstrap; WebKit abort. Các check data/DOM/build vẫn chạy độc lập, và Phase B được tiếp tục theo yêu cầu V12.1.
