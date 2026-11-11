# V9 — trạng thái triển khai

- Project thực tế: `/Users/wstratos/Desktop/Project/aqw-vietnam-guide`.
- Google Drive connector đọc thành công tài liệu Challenge Boss Guide; revision 27/10/2026 khớp bản structured đã nhập. Bản đọc: `content-sources/v9/challenge-guide-current.txt`.
- 8 hồ sơ RPG hiện có giữ nguyên dữ liệu. Thêm 9 route chương hướng dẫn: God of the Depths, Kolr, Astral Empyrean, Champion Drakath, Darkon, Gramiel, Kasuko, Batara Kala, Ultra Iara. Các route mới hiển thị nội dung thật từ tài liệu, chưa chuyển toàn bộ sang Active/Passive và tracker.
- Directory: 7 Daily, 7 Weekly, 3 Seasonal; Dungeon/Other riêng. Bộ lọc giữ search.
- Materials đóng toàn bộ mặc định. Chi tiết quest đóng độc lập; checkbox và khóa localStorage giữ nguyên.
- Weapon range có nguồn ở 7 item: Apotheosis, Dual Apotheosis, Duality, Khopesh, Necrotic Blade, Sin of the Abyss, Malgor Blade. 6 range 30–30 là Stable theo định nghĩa V9; Duality 27–33 chưa gán Normal/Unstable. Không áp dụng range cho Armor.
- Drago's Royal Guard: chỉ CP/XP boost, Damage Boost hiển thị Không. Item chưa đối chiếu giữ Chưa xác minh.
- Đã xem và tích hợp 8 ảnh equipment mới qua hash approvals: `equipment-candidates.json`, `equipment-approvals.json`, `scripts/sync-equipment-v9.py`. Giữ ảnh Apotheosis đã duyệt.
- Chưa hoàn tất: các ảnh equipment ngoài 9 trang đã đọc, ảnh cho 9 profile mới, Monster phụ của profile mới, cấu trúc skill/team/progression hoàn chỉnh cho các profile mới.
- Terminal truy cập Wiki không ổn định; web đọc được nhiều trang. Ultra Iara Monster qua web gặp redirect loop. Không dùng ảnh Location Ultra Kala hoặc disambiguation Ultra Iara làm ảnh Monster.
- Impeccable/tatse chưa tìm được repo truy cập hợp lệ; không tuyên bố áp dụng. Skill design-taste-frontend đã đọc để tiếp tục bố cục hiện có.
- Browser script V9: `node tests/v9-browser.mjs`; screenshot `qa/v9`. Báo cáo kết quả thực tế trong phiên làm việc; không coi URL ảnh đã tìm là đã kiểm tra hiển thị.
