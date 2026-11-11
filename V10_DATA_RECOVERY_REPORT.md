# V10 Data Recovery — Version 0.1.0

> Báo cáo lịch sử V10. Thay đổi selector và phân loại Stability mới nhất nằm trong [V11_COMPLETION_REPORT.md](V11_COMPLETION_REPORT.md); V11 còn 5 Stability chưa xác minh thay vì 10 trong bảng V10.

Ngày thực hiện: 2026-11-08. Project: `/Users/wstratos/Desktop/Project/aqw-vietnam-guide`. Không tạo project, push, deploy hoặc chỉnh sửa Rebiomed. Checkpoint trước thay đổi: `/private/tmp/aqw-v10-before-data-recovery-20261108.tgz`.

## Kết quả và giới hạn

- 17 encounter: 7 Daily, 7 Weekly, 3 Seasonal; cùng hệ thống Boss Detail.
- Audit ban đầu: 4/17 đạt, 13 chưa đạt. Sau recovery: **11/17 đạt checklist tự động, 6 chưa đạt**. Xem từng trường trong `BOSS_COMPLETION_AUDIT.md`. Checklist không thay thế kiểm chứng thực chiến hoặc biên tập thủ công mọi câu chữ.
- 112 bản ghi route/recipe được chuyển thành tracker có cấu trúc; không phải 112 item duy nhất. Có 113 equipment entities canonical, gồm cả prerequisite items.
- 17 Hero/Directory Boss có ảnh local; 26 Monster assets gồm Boss và quái phụ. Equipment: **113/113 canonical entities có ảnh được duyệt**. Nhãn equipment set/group và alias không được tính thành item riêng.
- 82 đội hình có structured assignments: 36 ở tám Boss trước, 46 ở chín Boss bổ sung. Cấu hình dùng chỉ dẫn riêng hoặc tham chiếu cùng Class/cùng encounter được nguồn nêu rõ.
- Không tăng version, không xóa dữ liệu nguồn để làm audit đạt.

## Materials: sửa lỗi tận gốc

`src/lib/material-requirements.mjs` dùng cây `item`, `allOf`, `anyOf`, có `requiredChoices`. `OR`/`AND` không thể trở thành item. Parser không tự gán AND/OR nếu nguồn đã mất phạm vi nhóm; trả `needs_verification`.

Star Light of Destiny được kiểm tra từ trang merge chính xác: 10 nguyên liệu bắt buộc, cộng nhóm chọn **DragonBlade of Nulgath ×1 HOẶC Dark Dragon Slayer's Halberd ×1**. Tổng phương án đang chọn là 11 loại, không cộng cả hai vũ khí thành bắt buộc. Star Piece ×100 và Star of the Empyrean ×14 được giữ nguyên. Evidence: `content-sources/recovery/reviewed-materials.json`.

MaterialTree dùng chung cho Materials và Quest; lưu lựa chọn/checkbox theo canonical equipment ID. Đổi phương án tính lại tiến độ; không xóa tiến độ phương án trước. Đã sửa storage reader: kiểu object trước đây không được helper đọc string-array khôi phục sau reload.

Regression tests kiểm tra toán tử, ngữ cảnh tên item, nhiều nhóm lựa chọn, nhóm lồng nhau, quantity, duplicates, thiếu phạm vi nguồn, tiến độ theo nhánh và công thức Star Light of Destiny. Chromium kiểm tra chọn phương án và reload: **8/8 cấu hình**.

## Class configurations và alias

- **DT = EDoT = Dragon of Time**, xác nhận trực tiếp bởi người dùng. DT là viết tắt chính; EDoT là alias. Không còn entity `unresolved:edot` trong assignments.
- **CDK = Chrono DragonKnight**, giữ xác nhận trước của người dùng.
- Nguồn xác nhận quản trị được lưu riêng trong `content-sources/recovery/class-alias-confirmations.json`, không giả làm xác nhận Wiki.
- Canonical map: `src/data/team-class-aliases.json`. Lookup Class hỗ trợ tên đầy đủ, ID, viết tắt chính và alias.
- Parser đọc được các header nhiều Class bằng dấu phẩy/“và”, và nhiều tham chiếu Team khác nhau trong cùng đoạn. Không lấy cấu hình của Class chính áp cho Class thay thế.
- Ultra Warden và Ultra Speaker đã có Enhancement/rotation trong structured loadouts; các Boss cũ khác cũng được khôi phục phần parser bỏ sót.
- “2 DT/EDoT” trở thành **hai player slots Dragon of Time**, không phải Class tên “2 DT”. Alias trùng chỉ bị loại trong cùng một slot.
- Browser regression mới: **4/4 cấu hình** cho bốn slots Nulgath, hai DT riêng, không có alternative DT giả; xem `qa/recovery/team-alias-browser.json`.

## Combat và Quest

Attack Damage lấy từ Active Skill entity chung, không tạo hai bản damage độc lập cho Thông số/Kỹ năng. Source snapshots giữ dưới `content-sources/recovery/`. `Magic Damage` là cách ghi hợp lệ trong nguồn và được validator nhận cùng các dạng Magical/Physical/True; không suy loại damage từ tên skill.

Các điều kiện nhận Quest đã tách khỏi map access:

| Encounter | Điều kiện nhận Quest đã đối chiếu |
|---|---|
| Ultra Tyndarius | Avatar of Fire; Quest từ Galanoth |
| Ultra Nulgath | Level 80 cho Quest Nulgath, the Archfiend |
| Ultra Drago | Mahapadma; Quest Drago, Tyrant of Astravia từ Re |
| Ultra Speaker | Level 90; Quest Malgor, The First Speaker từ Vohu; không lấy điều kiện Goddess of War gán sang |

Các nguồn, confidence và xung đột được lưu trong `content-sources/recovery/content-verification.json`, áp dụng bởi `scripts/apply-content-verification.mjs`.

Lullaby có damage công bố nhưng bảng loại ghi Status: **damage type vẫn needs_verification**, không coi là not_applicable chỉ vì tên loại Status. Skill Charge/Status không gây damage mới có thể not_applicable ở trường damage type.

## Sáu Boss còn thiếu nguồn

| Boss | Trường chưa đạt | Lý do / hành động tiếp theo |
|---|---|---|
| Ultra Engineer | Attack Damage | Drone Bubbles/Rings có range nhưng chưa xác nhận loại damage; Devastator Beam chưa có giá trị xác minh. Cần mô tả Monster/Artix đủ rõ, không đoán Physical/Magical. |
| King Drago | Attack Damage | Judged: bảng Type ghi Physical, Notes nói True Damage; không có số damage công bố. Giữ `conflicting`, cần nguồn encounter xác quyết. |
| God of the Depths | Attack Damage, Taunt | Peer/Endless Nightmare thiếu thông số rõ; Peer bỏ qua Focus không chứng minh cả encounter miễn Taunt. Cần hướng dẫn theo từng đòn. |
| Kasuko | Quest acceptance, Taunt | The Molten Heart không nêu prerequisite rõ; Wiki ghi các đòn bỏ qua Focus nhưng cộng đồng đề xuất Taunt loop. Cần nguồn phân biệt Boss/Whirlpool và điều kiện cụ thể. |
| Batara Kala | Taunt | Devour/Vulnerable bỏ qua Focus; AoE bốn mục tiêu của Mace Slam không tự chứng minh quy tắc Focus. Chưa xác nhận không áp dụng cho toàn encounter. |
| Ultra Iara | Taunt; Lullaby type cần xem lại | Lullaby bỏ qua Focus nhưng vai trò Taunt của Auto Attack chưa rõ; loại damage Lullaby chưa được chứng minh. |

Không ghi “Không cần Taunt” chỉ vì tài liệu không đề cập. Bốn trường Taunt đang chờ được quản lý bằng `needs_verification`; không tạo hướng dẫn chung để lấp chỗ trống.

## Equipment, ảnh và Stability

- Prince Darkon's Poleaxe: route riêng, LV80, 27–33, +75% Human; giữ cả prerequisite Algie's Bow và Dene's Axe và recipe riêng, không thay bằng Royal Guard Set.
- Nulgath: Empowered recipes riêng từng item, có Sole Bloodletter phân biệt Bloodletter. Dage: phân biệt Quest trực tiếp/merge/prerequisite; Bonfire Altar được nhận đúng loại cape theo Wiki.
- Mở rộng các route Time Inn, Tyndarius, Speaker, Champion, Darkon và Gramiel từ đúng liên kết/item recipes trong tài liệu; không sao chép một công thức cho nhiều item.
- 15 entity thiếu ảnh của audit trước đã được xử lý/chuẩn hóa identity; sau mở rộng, tổng canonical equipment có ảnh là **113/113**. Đây không phải số file tải mới trong riêng lượt xác nhận alias cuối cùng.
- Hash approvals, source page, image URL, kích thước, usage và visual evidence nằm trong manifest/evidence. Contact sheets đã được mở xem; browser kiểm tra ảnh Gallery tải được. Ghi công Artix giữ tại `public/images/aqw/CREDITS.md`.
- Material icons thống kê riêng trên các recovered recipes: 24/148 loại tìm được asset duyệt đúng tên; **124 loại còn dùng icon nguyên liệu chung**, không phải ảnh của item khác. Không gọi các icon chung này là ảnh verified.
- 65 weapon entities canonical: **23 Stable, 32 Normal, 10 chưa xác minh**. Stable yêu cầu min=max. Normal chỉ áp dụng khi Wiki có `defaultdmg` và range 27–33, với căn cứ phân loại ghi trong metadata. Không tự ánh xạ Medium/High/Other sang Unstable.
- Mười Stability chưa xác minh: Empowered Overfiend Blade; Empowered Ungodly Reavers; Empowered Shadow Spear; Empowered Bloodletter; Empowered Sole Bloodletter; Empowered Charged Oblivion Blade; Blaze of Awe; Empowered Prismatic Manslayer; Empowered Caladbolg; Empowered Dual Caladbolgs.
- So với 21/37 trước recovery, nhiều item Default đã có căn cứ; denominator hiện lớn hơn vì thêm vũ khí. Không trình bày 10/65 như cùng một tập 37 ban đầu.
- Armor/helmet/cape không hiển thị Stability. No Boost “Không” phân biệt Unknown “Chưa xác minh”.

## Route coverage và biên tập

`ROUTE_COVERAGE_AUDIT.md` đối chiếu 17 chương và các item links ở đề mục progression ◆/◇, cùng merge entries Seasonal. Các equipment heading candidates đều có route/prerequisite tracker tương ứng. Celestial Paladin dùng đúng variant (2) của Nova Shrine Gifts.

**Giới hạn coverage:** kiểm tra tự động này không chứng nhận mọi tên item trong mọi paragraph, hoặc tracker chuyên biệt cho Scion of Flames/Hollowborn Vindicator và housing Astravia Castle in Flux/Dawn Vindicator Fortress. Các tham chiếu Class/house được liệt kê riêng, không đánh dấu là equipment route đã hoàn thiện.

Đã biên tập nhiều hiệu ứng phức tạp sang tiếng Việt, giữ tên skill và số: Safeguard, Purging Flames, chuỗi aura Darkon, Recitative, Aria, Vendetta/Death's Door, Grace Shattered. Loại tiền tố “Wiki ghi...” ở compact notes và cảnh báo Taunt; giữ source metadata. Còn cần lượt biên tập thủ công những mệnh đề tiếng Anh hoặc câu hướng dẫn nguồn dài trong chi tiết mở rộng; chưa tuyên bố toàn bộ văn bản đã đạt biên tập cuối.

## Bundle trước/sau

| Số đo | Trước | Sau |
|---|---:|---:|
| Entry JavaScript | 2,143,956 B | 705,431 B |
| Entry gzip | 227,514 B | 94,260 B |
| Toàn bộ JS chunks | 2,337,770 B | 2,489,430 B |
| Toàn bộ JS gzip | 288,051 B | 299,744 B |

Entry giảm 67.1% raw / 58.6% gzip. Tổng JS **không giảm**: nội dung/routes được mở rộng giữa hai mốc, nên đây không phải benchmark cùng nội dung. Route-level dynamic imports giữ Boss/Class khỏi tải trên Homepage; HTML prerender vẫn hiện trước hydration. Browser xác nhận navigation không reload và Homepage không tải route modules. Vẫn có cảnh báo chunk >500kB, đặc biệt deferred Ultra data; còn dư địa tách dữ liệu theo encounter.

## Kiểm thử đã chạy

- `npm test`: **60/60** unit/data/semantic tests.
- `npm run lint`: **63 TypeScript files, 0 findings**; đây là focused project linter, không phải ESLint.
- `npm run typecheck`: passed.
- `npm run build`: passed, **363 routes + 404**; còn cảnh báo kích thước chunk.
- `npm run test:build`: **8/8** kiểm tra HTML/metadata/links/assets.
- Chromium Boss matrix: **136/136**, 17 Boss × 375/768/1440/1920 × Dark/Light; kiểm tra cả Monster phụ.
- Chromium Material alternatives/persistence: **8/8**.
- Chromium DT/EDoT player slots: **4/4**.
- Chromium Equipment/Passive screenshots: **24/24**; ảnh mẫu desktop/mobile đã mở xem, không có overflow/ảnh lỗi trong các kiểm tra.
- Route-loading/history test: passed. Screenshots và JSON results: `qa/recovery/`.
- Playwright WebKit chưa cài trong môi trường này; Safari thực tế chưa chạy. Không gọi Chromium là Safari verification. Mac có thể chạy script Safari hiện có sau khi chủ máy cho phép Remote Automation; không tự đổi cấu hình bảo mật.

## Truy cập nguồn và design

Google Drive connector đọc tài liệu Challenge Guide revision 2026-10-27. Google Sites thất bại với web tool nhưng các trang public liên quan đọc được qua HTTP Terminal; snapshots lưu riêng, navigation/bot links không được đưa lên nội dung guide. Wiki có request connection failures gián đoạn; dùng snapshots/truy cập web hợp lệ, không vượt 403/429. Không sửa DNS macOS.

Impeccable/tatse/taste không xuất hiện trong repository có thể truy cập; không nhận đã dùng chúng. Đã đọc skill `design-taste-frontend` có sẵn và áp dụng review screenshot, hierarchy, spacing và responsive theo hệ thống hiện hữu.

## Trạng thái bàn giao

**Code hoàn thành:** Materials AST/parser/UI/progress; alias và source-reference parser; shared tracker; semantic validation; route splitting; audit tooling.

**UI hoạt động:** 17 Boss dùng chung inspection, skills, teams, ảnh và tracker trong Dark/Light Mode. Không tạo raw Docs detail renderer mới; accordion chỉ được giữ nếu có item/timeline thật.

**Content verified theo phạm vi:** recipes/ảnh đã duyệt, các điều kiện Quest đã ghi nguồn, alias quản trị và các combat records có evidence. **Content incomplete/blocked by source:** sáu Boss trong bảng trên, mười Stability, Lullaby damage type. **Needs manual review:** biên tập còn lại, material icons, coverage item nhắc trong văn bản, Class/housing guides, Safari/WebKit và tối ưu deferred chunk.

Không tuyên bố 17/17 hoàn tất khi những mục trên vẫn chưa được giải quyết.
