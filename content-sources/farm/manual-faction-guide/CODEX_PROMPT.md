# CODEX — AQW FARMING CODEX: SOURCE-LOCKED FACTION RECONCILIATION

**Repository:** `/Users/wstratos/Desktop/Project/aqw-vietnam-guide`

**Mục tiêu ưu tiên:** Chỉnh lại toàn bộ phân nhóm Farming Codex theo đúng *các chương của FARMING ITEM GUIDE do người dùng cung cấp*, không suy đoán phe từ tên item, nguyên liệu, map, boss hoặc cách nhận. Chỉ xử lý phần còn sai; không tái nhập các dữ liệu đã đúng.

## 1. Nguồn dữ liệu cục bộ — ưu tiên tuyệt đối

Thư mục đã giải nén: `content-sources/farm/manual-faction-guide/`

- `FARMING_ITEM_GUIDE_SOURCE.txt`: guide nguyên bản 9.212 dòng.
- `guide_sections.csv`: 74 phần hướng dẫn kèm dòng bắt đầu/kết thúc và nhóm nguồn.
- `faction_goals.csv` / `.json`: **203 mục tiêu farm/đầu mục trang bị có vị trí nguồn**. Đây là danh sách **các mục tiêu được nêu tên**, KHÔNG bảo đảm đã tách mọi item con của set.
- `FACTION_LIST.md`: danh sách đầy đủ các mục tiêu đã lọc theo chương.
- `reward_blocks_to_review.csv`: các khối `Rewards:` cần mở rộng thành item thật sau khi đọc source.
- `goals_list_not_factions.csv`: 74 mục ở *Goals List* chỉ xếp theo độ khó, **không chứng minh phe**.

**Không lấy `I. Farming List / Goals List / Daily-Weekly` làm bằng chứng phe.** Những danh sách này là cross-reference. Đừng dựa vào các item name chứa `Nulgath`, `Legion`, `Void`, `Hollowborn`, các boss, materials hoặc map để suy ra nhóm.

## 2. Mapping chapter → nhóm UI

| Chương nguồn | groupId đề xuất | Nhãn UI |
|---|---|---|
| II. Good | `good` | GOOD |
| III. Evil | `evil` | EVIL |
| IV. Chaos | `chaos` | CHAOS |
| V. Museum | `awe` | AWE |
| VI. Forge | `blacksmithing` | BLACKSMITHING |
| VII. Nation | `nation` | NATION |
| VIII. Legion | `legion` | LEGION |
| IX. Dragonkin | `dragonkin` | DRAGONKIN |
| X. Elemental | `elemental` | ELEMENTAL |
| XI. Hollowborn | `hollowborn` | HOLLOWBORN |
| XII. Debris & Astravian | `debris-astravian` | DEBRIS & ASTRAVIAN |
| XIII. Other Items | `other-items` | OTHER ITEMS / CHƯA PHÂN PHE |

`Other Items` **không phải phe**. Nếu UI chỉ chấp nhận faction thật, lưu trường `sourceChapter=other-items` và `factionId=null`/unknown, đừng ép vào một phe.

Các ví dụ bắt buộc để phát hiện sai mapping:

- `DragonBlade of Nulgath` thuộc chương **Nation**; `Legion DragonBlade of Nulgath` thuộc **Legion**. Không gộp hai canonical item.
- `Blade of Awe`, `Armor of Awe`, `Helm of Awe`, `Cape of Awe`, `Awescended` thuộc **Museum/AWE**, ngay cả khi được nhắc trong Quest của nhiều chương khác.
- `Void Light of Destiny` có hướng dẫn trực tiếp trong **Nation**; được dẫn lại từ Good/BLoD không làm nó thành item của Good.
- `Hollowborn Shadow of Fate` được hướng dẫn trong **Hollowborn**; dù có tham chiếu từ BLoD không tự gán Good.
- `Forge` chứa Cysero's upgraded gear và unlock Blacksmithing; **enhancement unlock là hệ thống mở khóa**, không được nhập thành một item đeo được nếu Wiki không có canonical equipment.

## 3. Quy tắc tái gán từng canonical item

1. `git status --short` và đọc checkpoint/báo cáo mới nhất. Giữ nguyên toàn bộ thay đổi chưa commit.
2. Xác định chính xác Farm V3 route, data adapter, source catalog/generator đang hoạt động; **không dùng template Update/Farm Direct cũ**.
3. Lập bảng existing `canonicalItemId → currentGroupId → sourceGuideChapter → targetGroupId → evidenceLine → verdict`.
4. Đọc `faction_goals.csv` và `guide_sections.csv`, chỉ sử dụng những dòng có `evidence_match=exact_in_line`. `scope=related_reference_needs_confirmation` phải kiểm tra chương hướng dẫn *chủ sở hữu*, không tự gán Good chỉ vì được liệt kê trong "Other related items".
5. Dùng **source chapter chứa mục tiêu nhận thưởng trực tiếp**, không dùng vị trí nguyên liệu/điều kiện tiên quyết. Nếu một item chỉ xuất hiện như nguyên liệu ở chương A, KHÔNG tự gán item đó vào A.
6. Với `record_kind=set|collection|weapon-group|class-family`, **không tạo một canonical item giả mang tên set**. Mở phần quests/rewards trong nguồn theo `start_line/end_line`, tách từng item thật và xác minh identity với AQW Wiki nếu cần. Dùng `reward_blocks_to_review.csv` làm chỉ mục, không tin đó là dữ liệu đã xác minh.
7. Một canonical item có tối đa **một nhóm chính**; nhiều acquisition routes/quest không tạo thêm group membership và không nhân bản identity. Tất cả nhóm phải đếm mỗi item đúng một lần.
8. Phân biệt `Class`, `Weapon`, `Armor`, `Helm`, `Cape`, `Pet`, `House item`, `Enhancement unlock`, `material`, `quest-only`. Không đưa reagent/NPC/monster/map vào inventory.
9. Nếu chapter không xác định, ghi `UNVERIFIED_GROUP` và lý do. **Không lấp nhóm thiếu bằng phỏng đoán**. `goals_list_not_factions.csv` không phải bảng phân phe.
10. Wiki dùng để đối chiếu tên, loại, canonical item/URL, quest, số lượng nguyên liệu. Guide người dùng là nguồn xác định cấu trúc chương/nhóm. Nếu có khác biệt, ghi conflict, không tự override source nhóm.

## 4. Rà soát toàn bộ trước khi sửa

Tạo audit định lượng:

- Existing items, source-matched exact, assigned đúng, sai nhóm, source-only chưa nhập, catalog-only không có chương, ambiguous, duplicated.
- Danh sách *tên item thật* đã chuyển nhóm kèm `old → new`, source line và Wiki URL khi đã tra.
- Danh sách các set chưa tách đủ thành phần / các reward block chưa xác minh.
- Danh sách item từ Ultra Boss nằm ngoài Guide: tra cứu source Ultra Boss riêng; nếu không có chapter được xác minh, để `UNVERIFIED_GROUP`, không gán phe dựa tên boss.

**Chỉ ghi sửa những item có bằng chứng chắc chắn.** Đừng xóa route, ingredients, boost, ảnh, class hoặc dữ liệu đúng chỉ vì đổi group.

## 5. Sửa pipeline thay vì chỉ sửa JSON phát sinh

- Tìm bước build/import đang làm sai affiliation, alias hoặc fallback chữ cái. Sửa mapping ngay tại source-of-truth.
- Nếu `catalog-v2.generated.json`/catalog V3 là generated, chỉnh nguồn/generator rồi sinh lại **một lần**, xác minh idempotence.
- Không sửa output thủ công để rồi bị generator ghi đè.
- Ràng buộc schema: `factionId` là 1 string hợp lệ hoặc unknown/null; không mảng nhiều phe đối với canonical item.
- Giữ `sourceChapter`, `evidenceLine`, `verificationStatus`, `curatedSource`. Duy trì deep links và legacy query aliases.
- Phe/nút `Tất cả` chỉ lọc và chọn, không làm thay đổi canonical mapping.

## 6. QA/acceptance

Tạo targeted tests:

- `DragonBlade of Nulgath` khác `Legion DragonBlade of Nulgath`.
- `Blade/Armor/Helm/Cape of Awe`, `Awescended` đều thuộc AWE, không bị kéo sang Good/Evil do requirement crosslinks.
- Item chỉ dùng làm nguyên liệu trong chương khác không bị đổi faction.
- `Other Items` không bị chuyển sang phe bất kỳ do substring.
- Một item chỉ có một nhóm chính, không trùng canonical ID, tổng `Tất cả` không double-count.
- Chạy data generator hai lần phải idempotent; UI faction filter đúng URL, counts và history (mobile + desktop).

Chạy targeted tests trước, rồi `npm run test:farm`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:build`. Browser QA Chromium/WebKit trên host nếu khả dụng; nếu chặn sandbox ghi `BLOCKED` thay vì PASS. Không tắt assertions, không force QA.

## 7. Báo cáo cuối và bảo toàn tiến độ

Ghi trong repo:

- `FARM_FACTION_RECONCILIATION_REPORT.md`: bảng từng item đổi phe (old/new/source line), matched/unmatched/ambiguous, số lượng theo phe, mâu thuẫn, coverage của bộ set.
- `FARM_FACTION_PENDING.md`: **chỉ các item chưa hoàn thành** với bằng chứng còn thiếu và bước tiếp theo.
- Cập nhật checkpoint hiện hữu, không xóa hay tạo lại những việc đã DONE.

Khi kết thúc, chỉ in: `DONE/PARTIAL`, số item đổi nhóm, số đã xác minh, số pending, files thay đổi và kết quả QA. Không dump toàn catalog, toàn nguồn 9.212 dòng hoặc log dài; không scrape lại site/docs liên tục; không tự commit/push/deploy. Nếu chạy qua launcher tự xuất bản, yêu cầu người dùng kiểm tra cấu hình publish riêng trước.

**BẮT ĐẦU THỰC HIỆN:** xác minh source hiện tại và lập diff phân phe từ manifest, sau đó sửa chính xác những group assignments sai. Không lập kế hoạch dài rồi dừng. Không kết luận đã nhập đủ mọi item con chỉ vì có 203 dòng mục tiêu trong manifest.
