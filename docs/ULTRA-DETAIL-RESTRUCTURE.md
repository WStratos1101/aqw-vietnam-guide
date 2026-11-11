# Ultra Boss detail — cấu trúc và đối chiếu

## File và kiến trúc

`BossPanel.tsx`: ba tab Cơ chế / Stats / Lưu ý, keyboard arrows/Home/End và indicator ba vị trí. `CombatCodex.tsx`: tên skill tiếng Anh đã đối chiếu Wiki; bỏ journal entries tự đặt (Orb Pressure, Failure Condition, Ghi chú giao chiến...) khỏi danh sách skill. `BossTactics.tsx`: QuickNotes, TauntPanel và ProgressionJournal. `UltraBoss.tsx`: storyDescription thay tóm tắt gameplay, Reset nằm dưới Mở khóa; Taunt ngay sau thông tin chiến đấu. `Equipment.tsx`: bảng quest dài mặc định bốn dòng, Xem đầy đủ/Thu gọn không đổi key localStorage.

Dữ liệu: `editorial.json` chứa lore/notes/taunt/reset biên soạn; `details.json` là read model sinh tự động cho item/timeline; `combat.json` chứa skill/stats với nguồn. `build-boss-detail.mjs` đối chiếu allowlist tên Wiki, loại title tự đặt và nối dữ liệu biên soạn sau importer combat. Build luôn chạy cả hai bước. Types trong `src/types/ultra.ts` tách BossNote, TauntEntry, ProgressionTimelineStep, BossDetailData khỏi legacy model để không phá các phần khác.

## Nguồn đã đọc

Google Sites trang gốc và đủ tám trang boss con đã đọc trực tiếp bằng curl. Công cụ web không đọc được Sites, nhưng Terminal đọc được; đây không phải báo nguồn không truy cập hoàn toàn. Index và bản đọc nằm ở `content-sources/boss-codex`. Trang Warden Wiki không tải được trong Terminal sau thử lại; đã đọc được qua tìm kiếm web, ghi webVerified trong index. Các Monster Wiki còn lại đã đọc trực tiếp. Ultra Fire Orb đọc qua web, dùng đúng tên Charge Attack, Melting, Absorbing. Không đổi Absorbing thành tên buff Absorbing Power / Rising Defence.

AQ.com và trang game Artix đã đọc. Lore được đối chiếu thêm với:

- https://www.aq.com/gamedesignnotes/aqw-july2-innoftime-8410 (Ezrajal, Warden, Engineer, và quest ngày).
- https://www.aq.com/gamedesignnotes/aqw-june18-shadowsfireplane1-8381 (bối cảnh Tyndarius/Malgor).
- https://www.aq.com/gamedesignnotes/aqw-nov11-darkonsagav-8572 (nhánh thử thách Drago).

Không dùng bài viết cũ để thay thông số item hiện tại. Dage/Nulgath/Speaker giữ bối cảnh ngắn từ cộng đồng và hồ sơ hiện có; không thêm tình tiết chưa chắc.

## Cách phân loại

HP, damage/cooldown/AoE/type, immunity/hit/crit, modifier/stack/duration và shield ở Stats. Trường placeholder trên Wiki không được biến thành số. Các trường Damage/Cooldown/AoE/Type đọc được từ bảng Wiki được thêm theo từng skill, phân biệt với dữ liệu cộng đồng cũ. Wiki được ưu tiên hiển thị. Giá trị cộng đồng chưa chuẩn hóa độc lập vẫn giữ ngữ cảnh trong Chi tiết, không giả là dữ kiện vừa kiểm chứng.

Lưu ý: counter/dừng đánh, phối hợp Heal, nhịp DPS ở Warden, ưu tiên Drone/Orb, phân công Taunt, Death DoT/Zone. Các câu này biên soạn từ cơ chế và hướng dẫn đội hình cũ rồi đối chiếu Sites. Chúng không còn là tên skill.

Taunt: từ từng trang boss Sites, có nhãn riêng theo team (ví dụ CMD giữ hai Drone; Team 1 Tyndarius chia boss/Orb trái/Orb phải; LR và PCM/LC phối hợp ở Warden). Wiki bổ sung trường hợp Prism Explosion/Devastator Beam/Judged bỏ qua Focus. Không khẳng định mọi đòn của boss đều Taunt được. Những bảng phân công gốc của Speaker được chuyển sang disclosure trong Taunt; Stats không chứa bài mô tả dài nữa.

Reset: ba boss Time Inn dùng mốc cẩm nang ngày 12:01 AM giờ server; official xác nhận tần suất ngày, không dùng để suy diễn giờ địa phương. Weekly dùng nguyên mốc Sites ghi thứ Sáu 12:01 AM EST server time. Không quy đổi UTC/DST tự động. Tyndarius hiện ghi giờ reset đang đối chiếu. Lịch lưu checkbox cá nhân độc lập với reset trong game.

## Trang bị và timeline

Gallery và quest chuẩn hóa đang hoạt động được giữ nguyên. Phần bổ sung chia thẻ từng món/nhóm món, có ảnh thật nếu đã verified hoặc placeholder, mô tả ngắn và yêu cầu mở rộng. Enhancement và dòng nhóm Cosmetics không giả làm một item cụ thể. Các recipe bổ sung chưa có đủ đối chiếu hiển thị Đang đối chiếu recipe; không tự coi là phần thưởng chắc chắn của boss.

Time Inn: Exalted Apotheosis, Dual Exalted Apotheosis, Exalted Duality và timeline Sir Cole/Inn at the Edge of Time. Tyndarius: Infernal Flame gear; Drago: Astravia gear; Nulgath: nhóm Empowered; Speaker: ShadowFlame/War/Goddess gear. Các đoạn preparation/storyline và enhancement chuyển thành timeline có từng bước mở chi tiết. Không tự suy diễn dependency từ thứ tự văn bản; dependency chắc chắn vẫn ở quests của equipmentRoutes. Raw block đầy đủ giữ trong read model và nội dung nguồn local, không rút gọn mất điều kiện.

## Kiểm tra

Production build 354 route và typecheck đạt. Lint tập trung đạt; 27 tests nội dung, 8 HTML, 4 server đạt. Browser test `npm run test:boss-detail`: Notes, Taunt đứng ngay sau combat, Reset, expand/collapse quest và checkbox qua reload. Chạy trên localhost 4173. Test combat riêng kiểm tra tabs/accordion ở 375/768/1440/1920px; screenshot trong qa/combat. Screenshot Notes/viewport của boss trong qa/boss-detail. Kết quả từng ca lưu JSON; không coi chụp ảnh tự động là đã xem thủ công mọi pixel.

Đã xem screenshot mobile Engineer Notes và các screenshot combat trước đó. Giới hạn: recipe bổ sung và giờ reset Tyndarius còn đối chiếu; một số thông số cộng đồng khác Wiki nên giữ nguồn riêng; chưa benchmark FPS/CLS. Không push/deploy.

Lượt browser cuối: 16/16 trường hợp (8 boss x 375/1440px) đạt, bao gồm Notes/Taunt/Reset; ba boss Time Inn mở từ 4 lên 13 quest rows và giữ checkbox sau thu gọn/reload. Bảng Taunt Speaker giữ một table gốc trong disclosure.

Các khác biệt đã ghi nhận: Sites mô tả Engineer charge 2 giây, Wiki hiện ghi 4 giây; Speaker shield hệ số 0.5 trong Sites so với 0.1 trong Wiki; hướng debuff All In của Melting cũng khác giữa bản Sites và Wiki. Bảng Wiki được ưu tiên; dữ liệu cẩm nang cũ không được đổi nhãn thành vừa xác minh. Warden có thêm thông số đọc qua web: Auto Attack, Petrifying Scream, Berserk và hệ số Shield.

Đã mở xem screenshot Taunt Speaker mobile và trang bị/timeline Ezrajal desktop. Lỗi placeholder cao làm nội dung thẻ tràn đã sửa: preview giới hạn 200px; kiểm tra clientHeight/scrollHeight từng card bằng nhau ở 375/1440px. Lời nhắc boost/Buy Back tách khỏi bước đánh số thành Lưu ý lộ trình. Không có overflow khi mở rộng phần bổ sung.
