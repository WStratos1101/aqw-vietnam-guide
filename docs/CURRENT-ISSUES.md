# Báo cáo lỗi và phần chưa hoàn tất

> Báo cáo lịch sử ngày 2026-11-06, giữ để truy vết. Không dùng các dòng “19 asset tạm hoãn”, lỗi mạng hoặc localhost phía dưới làm trạng thái hiện tại. Trạng thái V10 ngày 2026-11-08: [Data Recovery](../V10_DATA_RECOVERY_REPORT.md), [Boss Completion](../BOSS_COMPLETION_AUDIT.md), [Equipment Images](../EQUIPMENT_IMAGE_AUDIT.md). Chromium và localhost đã hoạt động; Safari thực tế chưa kiểm thử.

Ngày kiểm tra: 2026-11-06. Workspace: `/Users/wstratos/Desktop/Project/aqw-vietnam-guide`. Không push, deploy hoặc thay đổi dự án khác.

## Trạng thái sau lượt sửa theo yêu cầu

19 asset Ultra được **giữ nguyên và tạm hoãn** theo yêu cầu người dùng. Không nhập/tải ảnh hoặc sửa trạng thái manifest trong lượt này. Bảng chẩn đoán ban đầu phía dưới được giữ để truy vết; trạng thái hiện tại là bảng sau:

| ID              | Trạng thái hiện tại                    | Kết quả thực tế                                                                                                                                                                                                                                             |
| --------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IMG-01          | Tạm hoãn theo yêu cầu                  | Giữ nguyên 19 asset; có hướng dẫn docs/ASSET-WORKFLOW.md cho lần bổ sung sau.                                                                                                                                                                               |
| IMG-02          | Đã sửa phần code                       | Renderer legacy và Ultra dùng chung Asset/manifest local. Đã bỏ URL và ID Imgur khỏi entities.ts; không hotlink ảnh bên ngoài. Ảnh chưa có vẫn hiển thị placeholder đúng tên.                                                                               |
| DATA-01         | Đã bổ sung dữ liệu                     | Cả 8 boss có cơ chế, stats, đội hình và ít nhất một tuyến Quest. Sáu hồ sơ mới có toàn bộ phần chữ cơ chế/team/progression từ bản guide đã nhập, có nhãn Hướng dẫn cộng đồng. Chưa tự nhận kiểm chứng thực chiến hay khôi phục thông tin chỉ nằm trong ảnh. |
| DATA-02         | Đã sửa                                 | Tuyến Apotheosis có hai nhánh Alpha → Omega → Ultima, rồi Unity → Penultima → Apotheosis. Test tổng Insignia khớp 24 Ezrajal / 24 Warden / 16 Engineer.                                                                                                     |
| DATA-03         | Còn bị chặn bởi đầu vào                | 646 ảnh native và định dạng/link đã mất trong text export không thể phục hồi từ phần chữ hiện có. Cần archive/media/bản xuất đọc được; không tự đánh dấu đủ nội dung ảnh. Đây là phần thiếu riêng ngoài 19 asset được tạm hoãn.                             |
| QA-01 / QA-02   | Vẫn bị chặn                            | SafariDriver chạy lại vẫn thoát mã 1 trước session. Không có screenshot hoặc browser acceptance mới.                                                                                                                                                        |
| ENV-01 / ENV-02 | Vẫn bị chặn                            | npm registry không phân giải DNS, probe HTTP localhost vẫn EPERM. Không sửa cấu hình mạng hoặc quyền hệ điều hành ngoài workspace.                                                                                                                          |
| DESIGN-01       | Vẫn thiếu kết nối                      | Tìm lại impeccable, tatse, taste qua connector vẫn trả danh sách rỗng; không nhận là đã audit đúng hai repo.                                                                                                                                                |
| BUILD-01        | Đạt phần offline, online chưa xác nhận | Đã chạy lại clean cache reconstruction với source mới, typecheck/tests/build đạt; registry install vẫn chưa chạy được do DNS.                                                                                                                               |
| LIMIT-01        | Giữ giới hạn có giải thích             | Nhật ký UTC không được coi là trạng thái tài khoản hay giờ reset chính thức. Không thay lịch chưa xác minh.                                                                                                                                                 |
| NAV-01          | Đã phòng lỗi                           | Nội dung SSR/cache của boss khác bị từ chối theo bossId khi client navigation. Có test regression chống dùng nhầm nội dung khi chuyển boss.                                                                                                                 |

Kiểm tra hiện tại: lint 29 file TS, typecheck và production build đạt; 22 unit/content tests + 8 HTML tests + 4 server tests = **34 test đạt**. Clean cache reconstruction đạt. 349 route và 404. Những kết quả này không thay thế kiểm định Safari.

## Trạng thái localhost

Đã khởi chạy lại Vite bằng:

```bash
pnpm exec vite --host 127.0.0.1 --port 4173 --strictPort
```

Server báo ready tại **http://127.0.0.1:4173/**. Các địa chỉ cần xem:

- Trang chủ: http://127.0.0.1:4173/
- Danh sách Ultra Boss: http://127.0.0.1:4173/ultra-boss
- Ultra Dage: http://127.0.0.1:4173/ultra-boss/ultra-dage
- Ultra Warden: http://127.0.0.1:4173/ultra-boss/ultra-warden

Đây là dev server localhost, chỉ bind 127.0.0.1. Không phải bản deploy công khai. Terminal của công cụ thử đọc HTTP ba route đầu nhưng đều nhận EPERM; vì vậy trạng thái ready dựa trên log của tiến trình, chưa phải xác nhận trang đã mở thành công trong Safari.

Khi cần mở lại server sau khi phiên kết thúc:

```bash
cd /Users/wstratos/Desktop/Project/aqw-vietnam-guide
npm run dev
```

Muốn xem production local: dừng dev server bằng Ctrl+C ở terminal đang chạy nó, rồi `npm run build` và `npm start`. Không chạy cả hai trên cùng cổng, không kill tiến trình lạ.

## Các kiểm tra đã chạy lại

| Kiểm tra                 | Kết quả                 | Phạm vi bằng chứng                                                                               |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| Lint dự án               | Đạt, 28 file TypeScript | Syntax và một số kiểm tra link/a11y trong source; không phải ESLint toàn diện                    |
| Typecheck                | Đạt                     | `tsc --noEmit`                                                                                   |
| Unit/content/migration   | 18/18 đạt               | Dữ liệu, search, storage helpers, dependency, key chu kỳ và điều hướng an toàn                   |
| Production build         | Đạt                     | 349 route HTML và 404                                                                            |
| HTML tests               | 7/7 đạt                 | Metadata, link/anchor, panel/tab markup, placeholder đúng trạng thái                             |
| Server handler tests     | 4/4 đạt                 | Response, HTTP 404, static/HEAD và traversal; chạy trực tiếp handler, không qua socket localhost |
| Asset audit              | 0 ready / 19 pending    | `qa/ultra-assets.json`                                                                           |
| Safari acceptance        | Không chạy được session | `safaridriver` thoát mã 1; không có screenshot/viewport/check nào đạt                            |
| Đọc localhost từ công cụ | Bị chặn                 | Fetch `/`, `/ultra-boss`, `/ultra-boss/ultra-dage` trả EPERM                                     |
| Tải nguồn Google Sites   | Bị chặn                 | Curl không phân giải được sites.google.com                                                       |

Tổng 29 test code/HTML/handler đạt. Không dùng con số này thay cho nghiệm thu tương tác thực trong trình duyệt.

## Bảng chẩn đoán ban đầu và cách khắc phục

P1: ảnh hưởng lớn tới sản phẩm/nghiệm thu; P2: giới hạn cần xử lý tiếp; P3: cải thiện quy trình. Cột “Loại” phân biệt thiếu chức năng/nội dung với điều chưa kiểm định hoặc trở ngại môi trường.

| ID        | Mức | Loại                                  | Hiện trạng và bằng chứng                                                                                                                                                                                        | Cách khắc phục cụ thể                                                                                                                                                                                                                                                                                                           | Điều kiện đóng mục                                                                                                              |
| --------- | --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| IMG-01    | P1  | Thiếu asset đã xác nhận               | Ultra Codex có 19 asset pending: 8 boss, 6 Class, 3 item, 2 map. Các khung đang hiển thị Asset cần bổ sung.                                                                                                     | Lấy ảnh từ đúng Google Sites Vietnam Collector do người dùng chỉ định. Nếu chưa có mạng, nhập Safari WebArchive bằng `scripts/extract-vncollector-webarchive.py`; xem từng ảnh, map đúng đối tượng, lưu `public/art/ultra/`, cập nhật manifest và credit/usage. Không đổi trạng thái thành approved khi chưa có file/đối chiếu. | Ảnh đúng đối tượng tải từ local, không lỗi/méo; asset audit và kiểm tra Safari đạt.                                             |
| IMG-02    | P1  | Không nhất quán nguồn ảnh đã xác nhận | Guide cũ còn dùng URL Imgur trong `src/content/media/entities.ts` và renderer EntityShowcase. Nguồn mới chỉ đã được ràng buộc cho Ultra Codex.                                                                  | Sau khi có ảnh Vietnam Collector, chuyển renderer cũ sang dùng chung manifest/local asset; bỏ các URL Imgur còn lại trong phần ảnh boss/trang bị.                                                                                                                                                                               | Các trang boss/trang bị cũ và mới đều dùng ảnh local đã map đúng từ nguồn được yêu cầu.                                         |
| DATA-01   | P1  | Thiếu nội dung đã xác nhận            | 6 hồ sơ đang cập nhật: Ezrajal, Engineer, Tyndarius, Nulgath, Drago, Speaker. Mỗi hồ sơ hiện chưa có team/progression; cơ chế còn thiếu.                                                                        | Biên soạn lần lượt từ nguồn đã đọc được, bổ sung mechanic/stat/team/quest có đối chiếu; giữ trống những chỉ số chưa biết.                                                                                                                                                                                                       | Mỗi hồ sơ có dữ kiện đủ dùng và trạng thái phản ánh đúng phạm vi, được kiểm tra thực chiến hoặc ghi rõ đề xuất cộng đồng.       |
| DATA-02   | P2  | Phạm vi hướng dẫn còn thiếu           | Tuyến Apotheosis ở Warden bắt đầu với điều kiện có Exalted Penultima, chưa mô tả đầy đủ các bước merge tạo Penultima. UI đã ghi rõ giới hạn này.                                                                | Bổ sung chuỗi vật phẩm/merge trước Penultima và dependency thật; phân biệt phần thưởng từ cả ba Ultra Time Inn, không quy hết cho Warden.                                                                                                                                                                                       | Người mới theo được toàn bộ tuyến mà không gặp prerequisite không được giải thích.                                              |
| DATA-03   | P1  | Thiếu nội dung hình trong thư viện    | Catalog 313 trang native ghi nhận tổng 646 ảnh chưa nhập từ hai nguồn có cấu trúc. Ba nguồn text-export còn mất một số link/định dạng bảng và chưa biết đầy đủ số ảnh. Đây là vấn đề riêng ngoài 19 slot Ultra. | Nhập media/bản xuất đầy đủ, nối ảnh với vị trí bài, khôi phục các bảng/link bị mất và đối chiếu ảnh chứa thông tin mà văn bản không có.                                                                                                                                                                                         | Độ bao phủ bao gồm cả chữ, bảng và nội dung chỉ có trong ảnh; kiểm tra từng trang đại diện và các mục quan trọng.               |
| QA-01     | P1  | Chưa kiểm định browser                | SafariDriver thoát mã 1 trước khi tạo session; chưa kiểm tra thực tabs, accordion, equipment, reload progress, Back, keyboard hoặc reduced motion trên Safari.                                                  | Chạy Safari trong phiên GUI macOS có quyền automation; bật Allow Remote Automation, chạy `safaridriver --enable` trực tiếp nếu hệ thống yêu cầu, rồi `npm run test:safari`. Không gửi mật khẩu cho công cụ.                                                                                                                     | Suite chạy được và các thao tác đạt; lưu report thực, sửa lỗi được phát hiện.                                                   |
| QA-02     | P1  | Chưa kiểm định thị giác               | Chưa có ảnh chụp xác nhận layout 375/768/1440/1920, overflow, clipping, zoom, focus hay vị trí back-to-top trên thiết bị thật. Không kết luận các lỗi bố cục cụ thể khi chưa nhìn render.                       | Sau khi Safari hoạt động, chạy suite chụp ảnh, mở ảnh ở đủ breakpoint; kiểm tra chữ Việt, bảng Quest, ảnh, menu, focus và zoom 200%; sửa rồi chụp lại.                                                                                                                                                                          | Có ảnh và biên bản kiểm tra, không overflow/cắt nội dung ngoài ý muốn. Viewport giả lập không được gọi là kiểm thử iPhone thật. |
| ENV-01    | P2  | Trở ngại môi trường đã xác nhận       | `curl` trả Could not resolve host: sites.google.com. Web tool trước đó cũng không mở được trang. Không phải bằng chứng website nguồn bị hỏng hay không công khai.                                               | Mở quyền mạng/DNS thực cho phiên Terminal; hoặc dùng Safari WebArchive/asset người quản trị cung cấp. Không lặp yêu cầu quyền trong chat nếu profile vẫn tự từ chối escalation.                                                                                                                                                 | Đọc được HTML và lấy được file ảnh thật, hoặc nhận được bản archive có đủ media.                                                |
| ENV-02    | P2  | Chưa xác nhận HTTP trực tiếp          | Vite báo ready nhưng fetch từ công cụ tới localhost trả EPERM. Chưa xác nhận browser truy cập socket bằng công cụ.                                                                                              | Mở localhost bằng Safari trên máy; khi quyền mạng nội bộ của phiên được mở, kiểm tra HTTP `/`, directory, detail và production 404 qua socket.                                                                                                                                                                                  | Có response hoặc phiên Safari thực; handler tests không được dùng làm bằng chứng thay thế.                                      |
| DESIGN-01 | P2  | Thiếu đầu vào của brief               | Những lần discovery đã ghi nhận không truy cập được đúng repository impeccable và tatse/taste. Đã dùng Taste skill cục bộ và Impeccable public reference, chưa đáp ứng yêu cầu đọc đúng hai repo kết nối.       | Cung cấp đúng URL/quyền connector hoặc checkout hai repo vào vùng có thể đọc; xác minh README/SKILL rồi làm audit/refinement theo phiên bản thực tế.                                                                                                                                                                            | Có ghi nhận file/version đã đọc và những thay đổi cụ thể áp dụng từ cả hai repo.                                                |
| BUILD-01  | P2  | Chưa kiểm định cài qua registry       | Dependencies hiện được phục hồi độc lập từ cache; clean cache test trước đó đạt. Lockfile sinh offline chưa được xác nhận bằng một lần cài từ npm registry có mạng.                                             | Trên môi trường có mạng, cài sạch trong bản sao độc lập của AQW, bổ sung metadata lockfile nếu cần rồi chạy lại typecheck/test/build.                                                                                                                                                                                           | Cài mới qua registry và toàn bộ checks đạt, không dùng dependency của dự án khác.                                               |
| LIMIT-01  | P3  | Giới hạn có chủ đích                  | Checkbox ngày/tuần là nhật ký cục bộ theo UTC, tuần bắt đầu thứ Sáu; không đồng bộ tiến độ tài khoản hoặc đảm bảo khớp giờ reset máy chủ. UI có giải thích.                                                     | Giữ nhãn hiện tại; nếu muốn đồng bộ reset, xác minh quy tắc giờ/múi giờ của game rồi bổ sung cấu hình và test ranh giới chu kỳ. Không tick thay người chơi hay suy ra đã đủ Insignia.                                                                                                                                           | Người dùng hiểu rõ đây là ghi chú; mọi chế độ reset mới có nguồn và test theo quy tắc được xác minh.                            |

## Thứ tự xử lý đề xuất

1. Mở được nguồn ảnh hoặc nhận WebArchive; nhập đúng 19 asset Ultra và thay nguồn ảnh legacy.
2. Chạy được Safari, kiểm tra luồng tương tác và screenshot đủ breakpoint; sửa lỗi thực nếu phát hiện.
3. Hoàn thiện tuyến Penultima/Apotheosis và các hồ sơ boss còn thiếu.
4. Khôi phục media/bảng/link còn thiếu của thư viện native.
5. Hoàn tất discovery hai repo thiết kế và kiểm tra cài mới từ registry.

Không có TypeScript/build/test code nào đang báo fail trong lượt này. Sản phẩm vẫn chưa đạt nghiệm thu đầy đủ do các mục P1 về nội dung/ảnh và kiểm định trình duyệt còn mở.
