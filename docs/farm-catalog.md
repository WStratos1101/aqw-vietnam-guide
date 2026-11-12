# Farm V1

`/farm` là kho trang bị theo Region → category → canonical item. `/farm/item/<id>` là liên kết item; `/farm/<guide-slug>` cũ vẫn là bài hướng dẫn. Query `region`, `category`, `item`, `view`, `q`, `sort` giữ lựa chọn và hỗ trợ reload; ví dụ `/farm?region=arcangrove&category=class&view=now&item=shaman`.

Source of truth: `content-sources/farm/verified-items.json`; lịch kiểm tra và lỗi nguồn ở `verification-log.json`. Generator offline `scripts/build-farm.mjs` giữ một item identity với nhiều acquisition routes, route có geography/map/steps riêng. Các trường `regionId` cũ được giữ để tương thích. Không có request mạng lúc build. `npm run content:farm` validate, sinh catalog/index/manifest rồi cập nhật `FARM_SOURCE_AUDIT.md`.

Farmable Now chỉ nhận verified + available + có Region + không phải giá AC-only dương. Hiện có 4 item qua 2 Regions, 4 categories. Seasonal có view riêng; nguồn còn thiếu hoặc mâu thuẫn thuộc Tham khảo. Helm of Awe cần review vì số Helm Fragment giữa shop và quest prose mâu thuẫn. Không suy diễn Region từ faction. Các vật liệu nằm trong công thức, không tính là gear. Shaman dẫn tới `/class/shaman`; không sao chép skill/combo.

UI tái sử dụng theme Chaos và shell, dòng inventory gọn, ảnh local approved hoặc icon loại trung tính. Mobile chuyển list/detail và có nút trở lại. Native buttons/selects hỗ trợ bàn phím, focus-visible. Be Vietnam Pro qua Google Fonts, fallback Source Sans 3 hiện có; shell DNS chặn download local nên font chưa được xác minh bằng browser.

Checks: `npm run test:farm`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. `npm run browser:smoke:webkit` dùng WebKit, `AQW_BROWSER=chromium npm run browser:smoke` dùng Chromium với sandbox bật. Test gồm desktop/tablet/mobile, Region/category/count, query/reload, checklist, nguồn, lỗi ảnh/fallback, console errors và overflow; các route Class/Boss/Endgame cũ cũng được mở.

Browser QA trong phiên này **BLOCKED**: Safari 26.2 không hỗ trợ MCP; localhost `listen EPERM`; WebKit Abort trap 6/134; Chromium SIGTRAP hoặc bootstrap_check_in Permission denied (1100). Xem artifact diagnostics. Không có ảnh trước/sau hay điểm visual QA; static design lint Farm pass. Để QA thực, chạy lệnh smoke trên Terminal host ngoài sandbox. Không thay quyền hệ thống.

Launcher dưới `Update/_codex-focus` đang bị Git ignore. Bản local đã dùng positional arguments tương thích Bash 3.2 (không còn config_network array); regression test xác nhận. Đã thêm chặn child exit khác 0, validation lỗi và browser smoke lỗi trước publish. AutoSync hiện có vẫn build thành công trước push/deploy. Chưa publish trong phiên này; muốn phân phối launcher phải chủ động đóng gói file ignored sau khi review.

## Smoke diagnostics follow-up

- Chọn engine: `FARM_BROWSER=webkit npm run browser:smoke` hoặc `FARM_BROWSER=chromium npm run browser:smoke`. `FARM_BROWSER` ưu tiên hơn `AQW_BROWSER`; mặc định WebKit. Các shortcut `browser:smoke:webkit` và `browser:smoke:chromium` dùng cùng script.
- Lỗi UI cũ được lưu tại `artifacts/qa/farm/previous-ui-failure.json`: assertion `.locator("main").count() > 0` chạy ngay sau `goto`, không chờ React mount. Log cũ không ghi route đang fail nên không suy diễn route gây lỗi. Hai URL `/boss`, `/endgame` cũng không thuộc router; smoke nay dùng `/ultra-boss`, `/challenge-dungeon`, `/other-challenges`, `/class` và bài Farm cũ.
- Mỗi route nay chờ `main#main` và selector riêng của trang, có thông báo assertion kèm URL. Mỗi width lưu từng bước; chỉ PASS sau tất cả route, console/hydration checks và assertions. Lỗi UI có ảnh `failure-<width>.png` khi browser còn hoạt động; ảnh cũ không tính là bằng chứng của run mới.
- Runtime in đầy đủ stack/cause ra stderr, ghi phase/browser/currentStep/errors vào JSON; lỗi cleanup không che lỗi gốc. Unit tests của diagnostic runner dùng tài nguyên giả, không phải browser QA.
- Trong lần chạy lại tại sandbox, cả WebKit và Chromium dừng ở `server_start_blocked`: `listen EPERM: operation not permitted 127.0.0.1`, exit 1. Chưa chạy tới UI assertions. Xem `results-webkit.json`, `results-chromium.json` và các file `smoke-*.log`. Auto Publish gate giữ nguyên; không push/deploy.
- Chạy lại từ Terminal host ngoài sandbox: `FARM_BROWSER=webkit npm run browser:smoke`. Nếu đã mở Vite riêng, có thể thêm `AQW_QA_URL=http://127.0.0.1:4173`. Không dùng `--no-sandbox` hoặc thay quyền macOS.
