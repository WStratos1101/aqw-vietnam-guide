# AQW Farming Codex — Evidence Dataset for Codex

Gói này được tạo từ:

1. File `FARMING ITEM GUIDE` người dùng đưa (9.212 dòng, đính kèm nguyên văn).
2. Google Docs `AQW FARMING ITEM GUIDE` tại `https://docs.google.com/document/d/1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA/edit?tab=t.0` — đã được mở qua Google Drive connector, text đọc được; **nội dung tương ứng nhưng format khác** với file TXT, nên không khẳng định byte-identical hoặc đã lấy mọi hyperlink/table hình ảnh.
3. AQW Wiki — chọn lọc những trang phục vụ kiểm chứng kỹ thuật. `WIKI_VERIFIED_CORE.json` chỉ chứa các trường đã được kiểm chứng trên 16 thực thể tiêu biểu; phần còn lại trong guide **đang chờ xác minh**.

**Đây là hồ sơ nguồn đầy đủ theo phần văn bản truy xuất được, KHÔNG phải database 100% item đã xác minh Wiki.** `×N` trong văn bản có thể là yêu cầu mỗi lần, tổng, phần thưởng, lựa chọn OR hoặc món cần sở hữu, nên các CSV đều đặt tên `CANDIDATES`.

## Cài trên macOS

Giải nén `AQW_Farm_Data_Research.zip` vào `~/Downloads`. Chạy:

```bash
cd "$HOME/Downloads"
unzip -o AQW_Farm_Data_Research.zip
bash AQW_Farm_Data_Research/Install-AQW-Farm-Data.command
```

Thư mục được tạo trong repo:

```text
~/Desktop/Project/aqw-vietnam-guide/content-sources/farm/external-guide-evidence/
```

Installer chỉ sao chép dữ liệu và script, tạo crosswalk **nếu** có `src/content/farm/catalog-v2.generated.json`. Nếu thư mục dữ liệu cũ tồn tại, sẽ sao lưu; không sửa `package.json`, source website, `.git`, `Update/`, không push/deploy.

## File chính

- `FARM_CATALOG_SOURCE_EVIDENCE.jsonl` — **74 hồ sơ cấp guide**, mỗi record có title, source span, Quest candidate, material mention với số lượng, map, monster khi nói rõ, điều kiện và đường Shop.
- `FARM_SUBTARGET_EVIDENCE.jsonl` — **237 hồ sơ mục con**, dựa trên heading trong guide, không tự coi là canonical item.
- `FARM_GUIDES_INDEX.csv` — tìm tên mục tiêu từ guide.
- `FARM_SUBTARGET_INDEX.csv` — tìm item/collection được đề cập trong guide.
- `QUEST_WORKFLOW_CANDIDATES.csv` — tên Quest và source lines.
- `MATERIAL_SOURCE_CANDIDATES.csv` — đề cập số lượng/monster/map; **không tự coi là Merge input**.
- `MAP_MENTIONS.csv` — đầy đủ các dòng `/join` được trích xuất.
- `QUEST_PER_TURN_TOTAL_TABLES.json` — các bảng Legion Fealty 1/2/3 tách số lượng mỗi lượt/tổng/max stack; cần Wiki đối chiếu.
- `WIKI_VERIFIED_CORE.json` — **16 nguồn Wiki được kiểm chứng có URL**, gồm BLoD, ArchPaladin, Hollowborn Oblivion Blade, Legion Revenant, Insignia…
- `FARM_CATALOG_SOURCE_EVIDENCE.jsonl` + file `FARMING_ITEM_GUIDE_SOURCE.txt` để đọc raw đúng line nguồn.
- `CANONICAL_ITEM_EVIDENCE_CROSSWALK.csv` — tạo khi cài và tìm thấy catalog JSON của repo; dùng để dò từng item trong catalog.
- `CODEX_TASK.md` — prompt triển khai dữ liệu trên source-of-truth của website.

## Tìm nhanh nguồn

```bash
REPO="$HOME/Desktop/Project/aqw-vietnam-guide"
DATA="$REPO/content-sources/farm/external-guide-evidence"

grep -in "Hollowborn Oblivion Blade" "$DATA/FARM_SUBTARGET_INDEX.csv"

# Đọc đúng đoạn guide đã trích xuất
sed -n '5303,5460p' "$DATA/FARMING_ITEM_GUIDE_SOURCE.txt"

# Regenerate candidate data (không sửa catalog)
python3 "$DATA/scripts/build_farm_evidence.py" --source "$DATA/FARMING_ITEM_GUIDE_SOURCE.txt" --out "$DATA"
python3 "$DATA/scripts/expand_subtargets.py" --guide-records "$DATA/FARM_CATALOG_SOURCE_EVIDENCE.jsonl" --out "$DATA"
python3 "$DATA/scripts/extract_tables.py" --source "$DATA/FARMING_ITEM_GUIDE_SOURCE.txt" --out "$DATA"
```

## Đối chiếu theo toàn bộ canonical catalog hiện có

Nếu catalog nằm ở đường dẫn khác, đổi `--catalog` theo đúng file trong repo:

```bash
python3 "$DATA/scripts/reconcile_catalog_candidates.py" \
  --catalog "$REPO/src/content/farm/catalog-v2.generated.json" \
  --guide "$DATA/FARM_CATALOG_SOURCE_EVIDENCE.jsonl" \
  --subtargets "$DATA/FARM_SUBTARGET_EVIDENCE.jsonl" \
  --wiki "$DATA/WIKI_VERIFIED_CORE.json" --out "$DATA"
```

Mỗi row trong `CANONICAL_ITEM_EVIDENCE_CROSSWALK.csv` có ID/name hiện tại, candidate guide IDs, số dòng, Wiki page đã xác minh nếu có và trạng thái. **Không tự gán faction/công thức**. Codex phải mở raw guide và Wiki chính xác trước khi sửa.

## Prompt để chạy

Trong Codex tại repo, yêu cầu:

> Đọc `content-sources/farm/external-guide-evidence/CODEX_TASK.md`; triển khai lên source-of-truth hiện tại, sử dụng dữ liệu JSONL/CSV/source lines và Wiki. Đừng làm lại DONE, không tự commit/push/deploy.

## Điều chưa kiểm chứng trong phiên lập gói

- Không có repository thực trên macOS trong môi trường hiện tại, nên chưa đối chiếu từng canonical ID, field type, inventory count thực tế.
- Không thể kiểm chứng thủ công mọi Quest/Merge/Drop của hàng trăm item qua Wiki trong một lần; phần dữ liệu chưa Wiki-verified phải xử lý qua Codex.
- Google Docs text export không bảo đảm lấy hết link nhúng; khi TXT ghi `Click here`, cần tra Google Doc đúng bản hoặc Wiki, không tự bịa URL.
- 74 guide + 237 headings không phải 311 trang bị độc lập (nhiều guide là collection/tài nguyên/dịch vụ và có heading trùng).
