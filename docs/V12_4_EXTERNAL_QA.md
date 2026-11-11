# V12.4 — Browser QA ngoài sandbox

Chạy từ Terminal macOS bình thường, không cần Full Disk Access hoặc tắt sandbox:

```sh
cd /Users/wstratos/Desktop/Project/aqw-vietnam-guide
npm run qa:verify
npm run qa:diagnose
npm run qa:darkon
npm run qa:classes
npm run qa:report
```

Binaries đã có trong `.playwright-browsers`; không cần cài lại. Runner tự mở server riêng trên cổng trống. Nếu dùng server đang chạy:

```sh
AQW_QA_URL=http://localhost:4181 npm run qa:darkon
AQW_QA_URL=http://localhost:4181 npm run qa:classes
AQW_BROWSER=webkit npm run qa:darkon
```

Darkon runner kiểm tra bốn phase, Stats/Active/Passive, hiệu ứng Aria còn lại trong Rush, bốn vị trí và việc đổi Team/Class không reset phase. Timeline giữ nguyên xuyên phase.

Class runner kiểm tra search/filter, toàn bộ 113 routes và Skill selection; sáu Class đại diện có kiểm tra bàn phím, ba tab, một panel hiển thị, phương án sở hữu độc lập và tiến độ. Full-route sweep đối chiếu ID phương án cùng giá/currency với body đã xác minh. Screenshots của ba panel đại diện, bốn viewport 375/768/1440/1920, hai theme.

Đầu ra:

- `artifacts/qa/darkon/results.json` và PNG.
- `artifacts/qa/classes/results.json` và PNG.
- `artifacts/qa/diagnostics/results.json` và logs headed/headless/WebKit.
- `artifacts/qa/v12-4/checks.json` cùng logs kiểm thử logic/build.

`browser_launch_blocked`: browser chưa mở được, chưa có assertion layout. `not_run`: chưa thực thi. `failed`: thao tác/assertion lỗi sau khi browser mở. `passed` chỉ được ghi sau các thao tác thực tế. Kiểm tra `screenshots`, thời gian và console errors trong JSON; không dùng screenshot cũ để chứng nhận source mới. Sau khi runner thành công, mở ảnh và rà contrast, overflow, spacing rồi mới kết luận Visual QA.

Trong sandbox hiện tại: Chromium báo `MachPortRendezvousServer Permission denied (1100)`; WebKit `Abort trap 6`. Đây là bằng chứng launch, không phải bằng chứng lỗi phase/tab. Không có ảnh giả hoặc tùy chọn bypass.
