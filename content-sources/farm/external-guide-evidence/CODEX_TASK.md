# AQWVN — SOURCE-GROUNDED FARM CONTENT BUILD (11/2026)

**Repo:** `/Users/wstratos/Desktop/Project/aqw-vietnam-guide`

**Mục tiêu thực thi:** Dựa vào file Farming Guide đính kèm + Google Docs gốc + AQW Wiki, xuất và cập nhật **hồ sơ canonical cho từng trang bị** gồm đúng: tên; loại/category/subtype; phe/collection (nếu có chứng cứ); tất cả route nhận item; **công thức Merge**; **từng Quest trong chuỗi để nhận item**; **từng Quest phải hoàn thành để mở khóa Shop**; vật liệu **của từng Quest và tổng toàn route**; NPC & map nhận/trả Quest; monster drop từng vật liệu; map `/join` để farm; điều kiện phải sở hữu trang bị trước; nguồn Ultra/Insignia nếu liên quan. Sau đó mới render trong Farming Codex. **Không dừng ở viết báo cáo.**

## 0. ĐẦU VÀO BẮT BUỘC — ĐỪNG CÀO LẠI TOÀN BỘ

Thư mục: `content-sources/farm/external-guide-evidence/`.

- `FARMING_ITEM_GUIDE_SOURCE.txt`: tài liệu người dùng đưa **9.212 dòng**, nguyên văn. Source-of-truth cho lộ trình/gợi ý farm.
- `SOURCE_MANIFEST.json`: SHA, nguồn, ranh giới giới hạn.
- `FARM_GUIDES_INDEX.csv`: **74 mục hướng dẫn** có vị trí dòng.
- `FARM_SUBTARGET_INDEX.csv`: **237 subsection/collection/item headings**, không tự coi mọi heading là canonical item.
- `FARM_CATALOG_SOURCE_EVIDENCE.jsonl`: Quest, prerequisites, nguyên liệu, `/join`, nguyên liệu-nguồn-raw-lines theo từng guide.
- `FARM_SUBTARGET_EVIDENCE.jsonl`: cùng cấu trúc theo mục con/collection.
- `QUEST_WORKFLOW_CANDIDATES.csv`: Quest được nhận diện (có thể thiếu tên Quest viết bằng văn xuôi).
- `MATERIAL_SOURCE_CANDIDATES.csv`: **đề cập nguyên liệu/số lượng và monster+map ứng viên**, KHÔNG tự coi tất cả là Merge input hoặc requirement.
- `MAP_MENTIONS.csv`: map ứng viên, KHÔNG tự coi là Quest acceptance map.
- `QUEST_PER_TURN_TOTAL_TABLES.json`: ba bảng Legion Fealty 1/2/3, giữ riêng mỗi lượt/tổng/stack.
- `WIKI_VERIFIED_CORE.json`: **16 thực thể và các field cụ thể** đã kiểm tra Wiki; KHÔNG coi toàn bộ route của chúng đã hoàn chỉnh.
- `CANONICAL_ITEM_EVIDENCE_CROSSWALK.csv`: tạo khi có catalog JSON trong repo. Nếu thiếu, tạo qua lệnh README.

Google Docs đã đọc qua Google Drive connector trong phiên lập bộ: `https://docs.google.com/document/d/1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA/edit?tab=t.0`. Tài liệu này và local TXT có nội dung chính tương ứng nhưng **không được coi là file byte-equivalent** (export có định dạng khác); khi có bảng/hyperlink bị rơi khỏi TXT, đọc lại bản gốc Google Docs có quyền hoặc export hợp lệ, không đoán URL.

Trang Wiki gốc: `https://aqwwiki.wikidot.com/`.

## 1. ĐIỂM KIỂM SOÁT TRƯỚC KHI SỬA

1. `git status --short`; đọc source-of-truth Farm, generator, import cache, Ultra Boss Codex và checkpoint `FARM_SOURCE_DRIVEN_RECONCILIATION.md`, `FARM_SOURCE_PENDING.csv`, `FARM_SOURCE_NEXT_TASK.md` nếu có.
2. Chỉ chạm các item còn sai/thiếu hoặc source conflict. Dùng các nguồn `FARM_*.jsonl`, `*_INDEX.csv` để định vị **số dòng**, sau đó kiểm tra đoạn raw và Wiki, không dump 9.212 dòng.
3. Không sửa `.generated.json` trực tiếp. Không xóa dữ liệu hiện có chưa commit.

## 2. CHUẨN HÓA MỖI CANONICAL ITEM

Tạo/ghi lại trường tương ứng trong schema hiện có (không thay định dạng bừa bãi):

```json
{
  "canonicalId": "exact-existing-id",
  "officialName": "official Wiki name",
  "category": "Weapon|Armor|Helm|Cape|Pet|Class|Other",
  "subtype": null,
  "primaryGroupId": null,
  "verifiedWikiUrl": null,
  "routes": [
    {
      "routeId": "stable-id",
      "kind": "MERGE|QUEST_REWARD|QUEST_UNLOCK_SHOP|MONSTER_DROP|SHOP|ULTRA_EXCHANGE|OTHER",
      "requirements": {"level": null, "rep": [], "completedQuests": [], "ownedItems": [], "membership": null},
      "questChain": [
        {"questName": "exact name", "npcName": null, "acceptMap": null,
         "unlockRequirements": [], "repeatCount": null,
         "requiredMaterials": [
           {"name": "exact item name", "quantityPerTurn": 1, "quantityTotal": null,
            "sources": [{"kind": "MONSTER_DROP|QUEST|SHOP|MERGE", "monster": null, "mapJoin": null, "room": null}]
           }
         ], "rewardItemNames": []}
      ],
      "mergeShop": {"name": null, "npc": null, "mapJoin": null, "ingredients": []},
      "shopUnlock": {"finalNpc": null, "shop": null, "mapJoin": null, "finalPurchase": null},
      "insignia": {"name": null, "quantity": null, "bossCanonicalId": null, "rewardQuest": null, "bossMap": null},
      "evidence": [{"source": "guide|docs|wiki", "sourceLine": null, "url": null}],
      "status": "DONE|PARTIAL|PENDING_SOURCE|CONFLICT"
    }
  ]
}
```

Mẫu JSON trên chỉ là **schema ý tưởng**, không phải dữ liệu item đã xác minh. Với trường thiếu bằng chứng để `null`, không dùng tên/map đoán từ chapter.

### 2.1. Quy tắc quan trọng

- Phân biệt **đầu ra Quest**, **nguyên liệu nộp Quest**, **nguyên liệu Merge**, **item cần sở hữu trước** (không nhất thiết tiêu hao), **reward option** (OR), route thay thế. Không cộng tất cả route thay thế như điều kiện AND.
- Nếu Item mở Shop bằng Quest: xuất toàn bộ Quest khóa trước, bảng nguyên liệu theo từng Quest, cuối cùng NPC + `Shop` + `/join` + yêu cầu giá; **không nói item trực tiếp rơi từ Quest**.
- Nếu item Quest Reward: liệt kê hết chuỗi Quest và vật liệu **của từng Quest**, phân biệt per-turn với tổng lượt. `QUEST_PER_TURN_TOTAL_TABLES` có 3 bảng cần kiểm Wiki.
- Nếu item Merge: xác minh công thức **đúng chiều** qua trang chính item và Shop; số lượng; điều kiện Shop; Quest để mở Shop nếu có. Không đảo chiều `Hollowborn Oblivion Blade` ↔ `Dual Hollowborn Oblivion Blade`.
- Với nguyên liệu từ monster: tên monster chính thức, `/join map` và room/screen chỉ khi nguồn cung cấp; nếu cần nhận Quest trước mới drop, phải lưu. Nếu từ Quest khác, lập nested route.
- Một item có một canonical ID và nhiều route, nhiều source; **tối đa một primary faction đã xác minh** hoặc null. Không gán theo việc ingredient xuất hiện trong chapter. `Other Items` và `Farming List` không là phe.
- Với Class hiện đã có ở Class Codex, dùng **ID hiện tại**; không tạo Class thứ hai trong Farm.
- Quét cả `AGGREGATE_ITEM_CANDIDATES.csv`, không biến set thành 1 item giả hoặc nhập toàn bộ tài nguyên phụ thành thành viên set.

## 3. ULTRA BOSS & INSIGNIA

Với route yêu cầu `Nulgath Insignia`/`Dage the Evil Insignia`/Insignia khác: xác định **boss, quest thưởng Insignia, NPC, map, số Insignia mỗi tuần, vật liệu đổi item**. Link sang hồ sơ Ultra Boss Codex bằng boss ID thật, không trùng dữ liệu và không lẫn map boss với map nhận item hoặc shop.

- Wiki `Nulgath's Quests`: `Nulgath, the Archfiend` tại Ultra Nulgath, Quest hằng tuần thưởng Nulgath Insignia ×5.
- Wiki `Calamitus' Quests`: `Dage, Lord of the Undead Legion` tại Ultra Dage; Quest hằng tuần thưởng Dage the Evil Insignia; phải kiểm số lượng từng Quest trước khi tính tổng.
- Wiki `Roentgenium of Nulgath`: đổi Nulgath Insignia ×5 → Roentgenium ×2; đây là route **thay thế**, không cộng với Farm daily vào 1 requirement.
- Chỉ gán Empowered Ultra Nulgath → Nation, Ultra Dage → Legion **khi chính item đầu ra** đúng Quest/Shop đó; không gán chỉ vì tên item.

## 4. TRƯỜNG HỢP BẮT BUỘC XÁC MINH ĐẦY ĐỦ

1. **BLoD** — guide L343–643 và Wiki story/BLoD: Quest chain, Basic/Advanced/Ultimate Weapon Kit, số lượt 3/3/4, nguồn từng nguyên liệu, Quest cuối, unlock Book of Lore shop. **Kiểm số lượng trực tiếp từ Wiki trước khi ghi**.
2. **ArchPaladin** — L644–731: chuỗi 8 Quest từ `A Strong Base` đến `Sacred Magic: Eden`, cuối cùng mở ArchPaladin Shop tại Throne of Darkness Hub; tách Class, Armor và Cape.
3. **Hollowborn Oblivion Blade** — trong `Hollowborn-theme Items Farming Guides`, Wiki xác nhận Quest rewards `Summoning and Stuff`, `Trading and Stuff (Dual)`, `Trading and Stuff (Single)` và một route Merge bằng `Dual Hollowborn Oblivion Blade ×1`; **không đảo input/output**.
4. **Void Highlord** — L3453: daily `Void HighLord's Challenge` và Ultra Nulgath Insignia, Void Crystals, max stack/tổng/OR.
5. **Legion Revenant** — L5303: bảng `Legion Fealty 1/2/3` (mỗi lượt/tổng/stack) và `Legion Fealty 4`; nguồn Ultra Dage, Quest mở vùng, 10 Exalted Crown/20 Scroll/6 Wreath.
6. **Hollowborn Vindicator** — L6779: phân biệt hai weekly routes, Ultra Gramiel, điều kiện khác nhau.
7. **Arcana Invoker** — L7834: Quest, Monster, các phương án Ultra/regular, canonical Class identity.
8. **Celestial Pirate Commander** — L8226: Quest `Sailor of the Celestial Skies` có 12 lượt, mỗi lượt có nguyên liệu/map khác nhau; đừng biến 12 lượt thành một số liệu đầu vào đơn lẻ.
9. **Nation** — `Wrong Turn at Voidbuquerque`: một phần thưởng cố định và lựa chọn một trong nhiều nguyên liệu, không dùng tất cả reward làm required inputs.
10. **Quest mở Shop** — Paladin và một số Class seasonal: ghi tất cả quest, vị trí NPC/shop sau khi unlock.

## 5. UI HIỂN THỊ

Giữ `Thông tin`, `Cách nhận`, `Nguyên liệu`, `Hướng dẫn Farm`. Phần Quest: tên Quest trên cùng, ngay dưới hiển thị **Điều kiện nhận Quest** chữ nhỏ hơn, rồi `Nơi nhận` và `/join` được xác minh. Không hiển thị Region trên acquisition card; chỉ gắn map khi chứng minh được nơi nhận.

`Nguyên liệu`: bảng theo map, tên trái, số lượng phải, nhấn item mở nguồn (monster/quest/shop, `/join`). `Hướng dẫn Farm`: cho chọn từng item/Quest, bản đồ yêu cầu, bước cuối NPC/shop; chỉ một cách/step thì không hiển thị `1/1` hay nút Tiếp vô nghĩa. Dùng đúng faction accent và responsive, không khôi phục các badge Availability thừa.

## 6. QUY TRÌNH THỰC THI & QA

A. Audit baseline từng canonical từ catalog thực đang chạy; xây dựng `FARM_CANONICAL_QUEST_WORKFLOWS.json` với từng item đã đối chiếu. Sinh `FARM_PENDING_WIKI_REVIEW.csv` cho chưa đủ.

B. Ưu tiên verified Wiki field trong `WIKI_VERIFIED_CORE.json`, đồng thời kiểm tra live Wiki nếu có thay đổi, rồi mở nguồn raw theo source lines cho các mục tiếp theo. Không download lại toàn bộ Wiki 299 trang hoặc ảnh nếu snapshot hiện có đã dùng được.

C. Ghi data source-of-truth, regenerate idempotently; không sửa `.generated.json` bằng tay. Chia batch và checkpoint `DONE/PARTIAL/BLOCKED`, giữ sourceLine, URL, thời điểm kiểm tra.

D. Targeted QA: Quest chain ordering, merge direction, ND/name, table per-turn/totals, OR/AND/rewardChoice, shop unlock, ultra insignia, image/canonical, duplicate IDs, route and map provenance. Sau đó chạy `test:farm`, `npm test`, `typecheck`, `lint`, `build`, `test:build` khi script tồn tại và browser QA Chromium/WebKit host cho phép. Không bỏ assertion để PASS; không tuyên bố complete chỉ vì file tồn tại.

E. Kết quả bắt buộc: tổng canonical đã xét, số có đủ method/ingredients/monster/map/Quest-giver/shop unlock, số đã Wiki verified, số pending và chính xác item nào; liệt kê URL, source lines và blocker. Tiếp tục mà **không làm lại item DONE**. Không dump giant JSON/log; ghi file rồi in summary ngắn.

**Không reset Git, không commit, push, deploy, không đụng Rebiomed.**

**BẮT ĐẦU:** kiểm tra repo thật + crosswalk, xử lý case 1–10 và các item còn thiếu theo CSV, cập nhật source-of-truth rồi kiểm thử. Không dừng ở đọc tài liệu.
