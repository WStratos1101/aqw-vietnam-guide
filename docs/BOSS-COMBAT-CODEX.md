# Boss Skill Journal / Combat Stats

Áp dụng cho cả tám profile: Ezrajal, Warden, Engineer, Tyndarius, Dage, Nulgath, Drago, Speaker. Component BossPanel giữ nguyên hai tabs và keyboard navigation. SkillJournal/CombatStats trong CombatCodex.tsx thay việc render trực tiếp SourceSections trong tab Cơ chế.

Dữ liệu sinh bằng scripts/import-boss-combat.mjs vào src/content/ultra/combat.json; build tự chạy bước này sau importer Ultra. Types BossSkillEntry, CombatStat, BossCombatCodex giữ boundary tương thích với BossMechanic/BossStat cũ. Không sửa nguồn tài liệu import, ảnh, team hoặc tiến độ equipment.

Cơ chế dùng accordion có type, trigger, effect, response, notes và nhãn chú ý. Stats chia nhóm Cốt lõi, Phòng thủ & quy tắc, Tấn công & hiệu ứng; có subject để phân biệt boss/mục tiêu phụ, value/unit và chi tiết mở rộng. Không thêm skill icon giả. Nguy cơ dùng nhãn chú ý từ thông tin hiện có, không dựng điểm difficulty mới.

Tyndarius được biên soạn kỹ: 9 mục (Melting, Absorbing, Charge, Orb Pressure, Boss Shield, Drawing Power, Elusion, Imminent Doom, áp lực kéo dài); 32 stats. Các giá trị HP 700000/6000000, shield threshold 150000/200000, coefficient 0.5/0.85 tách theo Orb/boss. Damage ranges, chu kỳ Auto Attack/Melting/Absorbing/Charge/chuỗi buff, thời gian niệm, modifier, stack behavior, thời hạn, hồi sinh và Stun immunity hiển thị trong Stats.

Boss còn lại dùng adapter từ model cũ và nội dung community local: dữ kiện có số, immunity/hit/crit/taunt rules được chuyển sang Stats; hướng dẫn không định lượng thành journal entries. Với đoạn phức hợp, giữ các giá trị trích xuất ở value và nguyên văn có ngữ cảnh trong “Chi tiết”; chưa tuyên bố toàn bộ thông số của các boss này đã chuẩn hóa thành số độc lập như Tyndarius. Các named move quan trọng của Speaker/Drago được biên soạn riêng, Warden giữ mô tả định tính thay vì mất tên skill.

Không bỏ nội dung nguồn quan trọng: bản mechanics đầy đủ cùng các bảng chiến thuật nằm trong disclosure đối chiếu ở cuối Stats. Đây là tài liệu dự phòng đóng mặc định, không còn là nội dung chính của Cơ chế. Nguồn và ngày xác minh không được nâng mới chỉ vì refactor UI.

Kiểm tra: production build 354 route đạt, typecheck/lint đạt; 26 tests nội dung + 8 HTML đạt. Chromium test riêng Tyndarius tại 375/768/1440/1920px đạt: 9 entries/32 stats, tabs dùng phím, accordion, không tràn trang/panel, không pageerror. Đã xem screenshot mobile Cơ chế và desktop Stats tại qa/combat. Chạy npm run test:combat khi localhost 4173 đang chạy. CSS progressive native-details animation có reduced motion và fallback; chưa benchmark FPS.
