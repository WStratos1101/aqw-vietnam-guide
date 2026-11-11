# AQW Vietnam Guide

Cẩm nang AdventureQuest Worlds tiếng Việt, fan project độc lập. React 19 + TypeScript + Vite, nội dung tĩnh có nguồn, không backend. HTML của các route được prerender khi build.

## Chạy ngay trên macOS

Yêu cầu Node.js 22.12+ (khuyến nghị Node 24) và npm.

```bash
cd /Users/wstratos/Desktop/Project/aqw-vietnam-guide
npm run dev
```

Mở **http://127.0.0.1:4173/**. Dependencies riêng đã có trong node_modules ở workspace hiện tại. Nếu server báo cổng đang được dùng, mở địa chỉ trên hoặc dừng server cũ bằng Ctrl+C trước khi chạy lại. Không tự chiếm cổng bằng cách kill tiến trình lạ.

Trên một máy mới có mạng:

```bash
npm install
npm run dev
```

Terminal phiên tạo dự án chặn mạng. `pnpm install --offline` thiếu registry metadata nên dependencies được khôi phục thành bản sao độc lập từ pnpm content-addressed cache. Không chép node_modules hay code từ dự án Rebiomed. File scripts/restore-cache.mjs là công cụ phục hồi riêng cho cache của môi trường này, không thay thế package manager trên máy khác. Nếu cần dùng lại, chạy `node scripts/restore-cache.mjs`; có thể đặt AQW_PNPM_STORE đến cache tương ứng. Không dùng công cụ này để nâng cấp dependency.

Đã tạo package-lock.json bằng npm từ cây dependency đã cài, với phiên bản được khóa. Lockfile sinh offline trên macOS ARM64 chưa có đầy đủ registry integrity và các binary cho nền tảng khác; chạy `npm install` có mạng để bổ sung và kiểm tra cài mới trước khi release.

## Build và chạy production local

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:build
npm run test:server
npm start
```

`npm start` phục vụ dist tại http://127.0.0.1:4173/, trả HTTP 404 cho đường dẫn không tồn tại. Có thể đổi cổng bằng `PORT=4176 npm start`. Không chạy dev và production trên cùng cổng. `npm run preview` là Vite preview bổ sung, không thay thế server production với HTTP 404 thực.

Build hiện tạo HTML cho 363 route trong dist cùng dist/404.html. Tất cả font và artwork dùng trong website đều nằm trong output; không hotlink ảnh game.

## Ultra Boss — V10 recovery

17 hồ sơ dùng chung Boss Detail: 7 Daily, 7 Weekly, 3 Seasonal. Dữ liệu bổ sung được tạo trong `src/content/ultra/recovery.json`, kết hợp với dữ liệu cũ qua các selector hiện có. Không render trực tiếp đoạn văn Google Docs trong trang Boss mới.

```bash
npm run content:recovery
npm run typecheck
npm test
npm run build
npm run test:build
node scripts/recovery-audit.mjs
```

Chạy build xong mới chạy tests; bước import có cập nhật các file nội dung nên không chạy build và tests cùng lúc. Audit chi tiết ở `BOSS_COMPLETION_AUDIT.md`, `EQUIPMENT_IMAGE_AUDIT.md` và `V10_COMPLETION_REPORT.md`. Trường thiếu bằng chứng không được tính là hoàn thành.

Nguồn đã cache nằm trong `content-sources/recovery`. `recovery-sources.py` chỉ tải các trang có trong danh sách giới hạn, có khoảng nghỉ và dừng khi bị 403/429. `recovery-assets.py` tạo candidate; chỉ `--publish` sau khi hash của ảnh đã được duyệt trong `asset-approvals.json`. Không tự nâng candidate thành verified dựa trên tên file.

Kiểm tra Chromium trên bản build tĩnh, dùng hai Terminal riêng:

```bash
./node_modules/.bin/vite preview --host 127.0.0.1 --port 4181 --strictPort
```

```bash
node tests/recovery-browser.mjs
```

Kịch bản kiểm tra 17 Boss × 375/768/1440/1920px × Dark/Light; lưu ảnh và kết quả trong `qa/recovery/`. Đây là kiểm tra bằng Chromium, không phải Safari. CDK trong đội hình speedrun Kolr được người quản trị xác nhận là Chrono DragonKnight.

## Các trang

| Route                                               | Nội dung                                                |
| --------------------------------------------------- | ------------------------------------------------------- |
| /                                                   | Trang chủ nhiều chương, Class preview, tìm kiếm         |
| /huong-dan                                          | Thư viện xuyên danh mục                                 |
| /huong-dan/bat-dau                                  | Hướng dẫn bắt đầu                                       |
| /class                                              | Lọc, tìm kiếm, so sánh cơ bản                           |
| /class/warrior, /class/mage, /class/healer          | Hồ sơ Class khởi đầu                                    |
| /farm                                               | Thư viện farm                                           |
| /farm/blade-of-awe                                  | Nguyên liệu, lệnh, checklist lưu tiến độ                |
| /trang-bi                                           | Danh mục sáu loại trang bị; guide và thông tin trang bị |
| /trang-bi/blade-of-awe                              | Thông tin nguồn sở hữu                                  |
| /he-thong                                           | Hệ thống game                                           |
| /he-thong/enhancement                               | Enhancement nền tảng                                    |
| /he-thong/hanh-trang                                | Inventory và Bank                                       |
| /he-thong/stats, /he-thong/combat                   | Chỉ số và chiến đấu cơ bản                              |
| /he-thong/reputation, /he-thong/quest-mechanics     | Reputation và điều kiện quest                           |
| /he-thong/gold-adventurecoins, /he-thong/membership | Tiền tệ và nâng cấp tài khoản                           |
| /cot-truyen, /cot-truyen/hanh-trinh-chaos           | Mục lục tuyến Chaos                                     |
| /gioi-thieu                                         | Nguồn dữ liệu, nguyên tắc, disclaimer                   |
| Đường dẫn khác                                      | Trang 404                                               |

## Tính năng đã triển khai

Navigation tiếng Việt; mobile menu; tìm kiếm nhiều từ và không dấu; bộ lọc danh mục/độ khó/vai trò/điều kiện miễn phí; so sánh Class; bookmark; farm checklist; sao chép lệnh; TOC anchors; breadcrumbs; back-to-top; empty/error states; reduced motion. localStorage được kiểm tra lỗi và không liên kết tài khoản game. Không có nút đăng nhập hoặc đóng góp giả.

Build và unit tests đã chạy. Chromium đã kiểm tra 17 trang Ultra Boss ở bốn kích thước và hai theme; báo cáo ở `qa/recovery/`. SafariDriver chưa được xác nhận hoạt động; kết quả Chromium không thay thế kiểm thử Safari. Những route khác không tự động được coi là đã kiểm tra chỉ vì cùng build.

## Kiểm định bằng Safari

Bộ kiểm thử mặc định dùng **Safari thật qua Apple SafariDriver**, không dùng Playwright WebKit thay cho Safari và không mở Chrome. Không cần cài thêm package.

Trên Terminal macOS ngoài sandbox, bật WebDriver một lần:

```bash
safaridriver --enable
```

Nếu macOS yêu cầu xác thực, thực hiện trực tiếp trên máy. Trong Safari, bật **Allow Remote Automation** ở phần Developer/Develop; vị trí tùy phiên bản. Hướng dẫn chính thức: https://developer.apple.com/documentation/safari-developer-tools/macos-enabling-webdriver.

Sau đó, mở server production trong một terminal:

```bash
npm run build
npm start
```

Trong terminal thứ hai:

```bash
npm run test:safari
```

`npm run test:browser` hiện cũng chạy bộ Safari này. Script tự mở SafariDriver cổng 4444; đặt `AQW_SAFARI_DRIVER_URL` nếu đã có driver riêng. `AQW_QA_URL` đổi địa chỉ website. Báo cáo nằm tại `qa/safari/report.json`, screenshot ở cùng thư mục.

Script kiểm tra viewport 375/768/1440/1920, search, empty state, bộ lọc, so sánh, bookmark/checklist sau reload, TOC, menu/Escape và các trang chính. Safari desktop có thể giới hạn kích thước cửa sổ: khi đó script dùng iframe cùng origin và ghi rõ `same-origin-frame`. Đây là kiểm tra CSS layout trong Safari desktop, không phải bằng chứng chạy trên iPhone. Screenshot được chụp theo từng đoạn cuộn. Cần xem ảnh trực tiếp sau khi script chạy thành công.

Safari không cho tự động giả lập reduced motion như Chrome DevTools. Bật Reduce Motion trong Accessibility của macOS rồi kiểm tra lại. Clipboard được kiểm tra phản hồi thành công hoặc lỗi có hướng dẫn; nội dung clipboard cần xác nhận bằng thao tác paste thủ công.

Lần chạy trong phiên này chưa tạo được Safari session: driver thoát mã 1; `safaridriver --enable` yêu cầu xác thực macOS, còn mở ứng dụng từ công cụ trả lỗi LaunchServices. Vì vậy browser/visual acceptance vẫn chưa được đánh dấu đạt.

## Kiểm tra cài đặt sạch offline

```bash
npm run test:clean
```

Script tạo thư mục tạm riêng, chỉ chép source/config/test, phục hồi **node_modules mới** theo version trong lockfile và kiểm tra SHA từng file theo integrity của pnpm cache. Sau đó chạy typecheck, lint, unit tests, build và tests output/server. Báo cáo: `qa/clean-install.json`.

Đã chạy thành công kiểm tra này. Nó chứng minh có thể khôi phục và build từ cache sạch; không thay thế kiểm tra tải dependency từ npm registry trên máy có mạng.

## Cấu trúc

```text
src/
  App.tsx                Route resolution và các trang thông tin
  main.tsx               Client entry và font
  server.tsx             Static rendering entry
  components/Shell.tsx   Header, footer, breadcrumbs
  content/data.ts        Dữ liệu biên tập và nguồn
  features/              Home, Library, Article, Interactions
  lib/                   Search và localStorage
  styles/global.css      Tokens, layout, motion, responsive
  types/content.ts       Guide, GameClass, FarmingGuide, Item, Source
public/
  art/                   SVG nguyên bản
scripts/                 Build, server, lint và cache recovery
tests/                   Unit và browser acceptance
docs/                    QA và nguồn
```

Thêm nội dung trong src/content/data.ts theo schema; không đặt bài dài trong component. Thêm route danh mục cần cập nhật SectionKey, categories, navigation và renderer. Khi có CMS có thể thay nguồn dữ liệu mà giữ renderer, schema và UI. Chưa triển khai tài khoản, CMS hoặc database.

## Git riêng

Sandbox cho phép ghi source nhưng bảo vệ đường dẫn .git, nên `git init` thông thường trả Operation not permitted. Repository mới đã được tạo trong **.aqw-git**, không remote và không lịch sử của dự án khác:

```bash
git --git-dir=.aqw-git --work-tree=. status
git --git-dir=.aqw-git --work-tree=. log --oneline
```

Khi ra khỏi sandbox, nếu muốn Git tự nhận mặc định và .git chưa tồn tại:

```bash
printf 'gitdir: .aqw-git\n' > .git
git status
```

Không có thao tác push hoặc deploy trong dự án này.

## Thiết kế và nguồn

Đọc PRODUCT.md, DESIGN.md và docs/QA.md. Đã dùng skill design-taste-frontend cục bộ (Colour chapters, seed 1417267924) và đọc tài liệu Impeccable công khai. **Chưa truy cập được hai repository gắn với tài khoản có tên impeccable và tatse/taste**, nên chưa đáp ứng phần xác minh đúng hai repository của brief. Không nhận skill cục bộ là repo tatse khi chưa có bằng chứng.

Next.js không có cache và terminal không có mạng, nên dùng Vite theo phương án chạy được. Tailwind/Motion không cần thiết cho bản này: CSS tokens và animation gốc giảm dependency. Source Sans 3 có đầy đủ subset tiếng Việt, tự host; Lucide cho icon.

## Nội dung đọc trực tiếp trên website

Đã chuyển 5 tài liệu cộng đồng thành **313 trang nội dung native**, trong tổng số 340 route. Không dùng danh sách link Docs thay cho bài đọc. Bắt đầu tại:

- http://127.0.0.1:4173/huong-dan/cam-nang-aqw-vietnam
- http://127.0.0.1:4173/trang-bi/general-boosted

Có nội dung Game Guide, Class, Farming Item, Challenge Boss và Upgrade Bonus Package. Trang đọc có mục lục, bảng, điều hướng chương trước/sau, bookmark và tiến độ bước farm. Thư viện có phân trang và tìm kiếm toàn văn tải theo nhu cầu. Các Class nhập từ tài liệu không được gán giả vai trò/chỉ số để tham gia so sánh.

```text
content-sources/           5 bản chụp văn bản nguồn, không public
scripts/import-guides.mjs  Chuyển đổi có thể chạy lại
src/content/imported/      Catalog metadata
public/content/guides/     313 nội dung trang JSON
public/content/search-index.json
content-assets/            Vị trí bổ sung media nguồn
docs/import-coverage.json  Đối chiếu phạm vi nhập
```

Chạy `npm run content:import` sau khi cập nhật snapshots; build cũng tự chạy bước này. Kiểm thử đối chiếu 24.224 đơn vị đoạn/ô nguồn, 30 bảng có cấu trúc và 538 liên kết đã đổi sang nội bộ. Các hướng dẫn bot/automation/exploit được loại có ghi nhận. Ngày đọc nguồn khác ngày kiểm chứng game: nội dung nhập có nhãn “Theo tài liệu cộng đồng”.

**Chưa có đầy đủ ảnh và định dạng gốc.** Hai nguồn có cấu trúc ghi nhận 646 ảnh trong phần guide; ba nguồn chỉ xuất được văn bản nên chưa đếm được ảnh. Nội dung chỉ thể hiện bằng ảnh chưa được chuyển. Một số link/định dạng bảng trong bản xuất văn bản đang bổ sung. Cần DOCX/ZIP cùng media có thể đọc tại máy để hoàn thiện; xem content-assets/README.md và docs/COMMUNITY-SOURCE.md. Theo yêu cầu mới, trang đọc không hiển thị phần trích dẫn/nguồn tham khảo. Metadata nguồn chỉ được giữ trong dữ liệu dự án.

## Nội dung và bản quyền

Dữ kiện đối chiếu ngày 2026-11-05; sources ở từng bài. Tên Class/Item/Quest giữ theo game. Các đoạn dựa trên AQWorlds Wiki ghi công cộng đồng và chia sẻ theo CC BY-SA 3.0. Rotation tối ưu, thời gian farm, tỷ lệ rơi và build Forge/Awe chưa được xác minh; các bài hệ thống nhập môn đã có nguồn Artix, còn chi tiết endgame cần biên soạn tiếp; không có số liệu giả để lấp chỗ trống. Xem docs/SOURCES.md.

Minh họa SVG nguyên bản là hình ý niệm, không phải ảnh khu vực hoặc item thật. Font Source Sans 3 có giấy phép trong public/FONT-LICENSE.txt.

AQW Vietnam Guide là dự án hướng dẫn do cộng đồng thực hiện, không liên kết hoặc được bảo trợ bởi Artix Entertainment. AdventureQuest Worlds và các tài sản liên quan thuộc về Artix Entertainment LLC.

## Trước khi release

Hoàn tất browser visual acceptance và audit accessibility; xác nhận đúng hai repo thiết kế; bổ sung registry integrity vào lockfile và kiểm tra cài mới khi có mạng; mở rộng nội dung đã kiểm chứng; thêm domain/canonical/sitemap khi có địa chỉ thật. Không tự động triển khai các hệ thống này.

## Hồ sơ boss và hình ảnh

Renderer legacy và Ultra Codex dùng chung asset local/manifest; không còn hotlink Imgur ở renderer boss/trang bị. Audit hiện tại: [Boss](ULTRA_BOSS_IMAGE_AUDIT.md), [Equipment](EQUIPMENT_IMAGE_AUDIT.md). Material thiếu ảnh riêng dùng icon nguyên liệu chung, không thay bằng ảnh item khác. Các nút quay về mục chính đã thay bằng back-to-top icon.

## Ultra Boss Codex

Kiểm tra Darkon theo ba nguồn, sửa effect/phase và regression: [DARKON_SKILL_AUDIT.md](DARKON_SKILL_AUDIT.md). `node tests/darkon-browser.mjs` kiểm tra trang trên Chromium tại port 4181.

V11 giữ Version **0.1.0**: [báo cáo V11](V11_COMPLETION_REPORT.md), [Stability](WEAPON_STABILITY_AUDIT.md). Boss Detail dùng một RPG Equipment Selector với năm filter tiếng Việt, một preview, tracker theo item và ba Boss gợi ý. Báo cáo V10 bên dưới giữ để truy vết, không thay thế trạng thái V11.

Mở http://127.0.0.1:4173/ultra-boss. Có 17 hồ sơ dùng chung Combat Inspection, đội hình và Equipment Tracker: 7 Daily, 7 Weekly, 3 Seasonal. Trạng thái xác minh từng trường nằm trong [BOSS_COMPLETION_AUDIT.md](BOSS_COMPLETION_AUDIT.md); có route không đồng nghĩa nội dung đã hoàn thiện. Build tự nhập lại dữ liệu, áp dụng xác minh và prerender HTML.

Tuyến Apotheosis có đủ hai nhánh merge trước Unity/Penultima. Checkbox ngày/tuần vẫn là nhật ký riêng, không đồng bộ tài khoản game. Các món đồ khác của từng boss có trong phần chi tiết lộ trình mở rộng.

Build hiện tạo 363 route và 404. Kết quả mới nhất, giới hạn nguồn và kiểm tra Chromium/Safari được ghi trong [V10_DATA_RECOVERY_REPORT.md](V10_DATA_RECOVERY_REPORT.md). Không dùng các báo cáo V9 cũ để suy ra trạng thái hiện tại.

Class Codex: `/class`, hồ sơ ví dụ `/class/archpaladin`. Thư viện so sánh cũ tại `/class/thu-vien`. Xem [báo cáo Class](docs/CLASS-CODEX.md), [pipeline ảnh](docs/ASSET-PIPELINE.md) và [audit ảnh](IMAGE_AUDIT.md). Trên macOS: `cd ~/Desktop/Project/aqw-vietnam-guide`, `npm install`, `npm run dev`; mở Safari tại http://127.0.0.1:4173/class.

Kiểm tra ảnh và browser sau khôi phục: [docs/IMAGE-RECOVERY.md](docs/IMAGE-RECOVERY.md). Chạy `npm run test:chromium` khi localhost đang phục vụ; xác thực file ảnh bằng `node scripts/validate-aqw-assets.mjs`.

Ultra Boss detail mới: [đối chiếu và cấu trúc](docs/ULTRA-DETAIL-RESTRUCTURE.md). Kiểm tra 8 boss bằng `npm run test:boss-detail` khi localhost 4173 đang chạy.

## Data recovery và kiểm tra

`npm test` chạy semantic tests cho AND/OR, quantity, dependencies, alias, range và source conflicts. Materials dùng cây `allOf`/`anyOf`, không phải danh sách phẳng; Star Light of Destiny có một nhóm chọn DragonBlade hoặc Halberd. DT và EDoT cùng là Dragon of Time; CDK là Chrono DragonKnight theo xác nhận quản trị.

`npm run build` tái tạo toàn bộ source đã chuẩn hóa. Sau đó `node scripts/recovery-audit.mjs` cập nhật audit và kiểm tra hash asset; `node scripts/audit-route-coverage.mjs` đối chiếu item links trong các đề mục progression. Coverage này không chứng nhận riêng các route Class/housing hay mọi item được nhắc trong đoạn văn.

Sau recovery audit, chạy `node scripts/audit-v11.mjs` để cập nhật Stability và chú thích audit V11. Các quy tắc category, selection và Stability nằm trong `src/lib/equipment-category.mjs`, `src/lib/weapon-stability.mjs`; không lấy nhãn hiển thị hoặc tab ảnh “Normal” làm dữ liệu phân loại.

Kiểm tra V11 tại port 4181: `node tests/v11-browser.mjs` và `node tests/v11-recommendations-browser.mjs`. Screenshots và kết quả nằm trong `qa/v11/`. Việc chọn Boss gợi ý dùng markup đầu tiên xác định được cho SSR, sau đó random một lần khi vào trang; đổi tab/theme không chọn lại.

Các browser scripts recovery dùng `http://127.0.0.1:4181`: chạy `npx vite preview --host 127.0.0.1 --port 4181 --strictPort`, sau đó `node tests/recovery-browser.mjs`, `node tests/material-browser.mjs`, `node tests/team-alias-browser.mjs`, `node tests/recovery-visual.mjs`, `node tests/route-loading-browser.mjs`. Đây là Chromium, không phải Safari. Script Safari hiện có: `npm run test:safari`; chỉ chạy được khi Mac đã cho phép Safari Remote Automation. Không cần thay đổi cấu hình bảo mật để build website.
