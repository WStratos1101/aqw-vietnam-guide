# V12.9 · Calendar và trang chủ

Version 0.1.0. Kết quả dựa trên catalog và kiểm thử tại workspace.

- **Quest Reward** · 19 hồ sơ dùng câu nhận Class từ Quest. Nội dung nguyên liệu và điều kiện vẫn lưu ở metadata. Merge, Shop Unlock và các tracker Boss/Dungeon dùng thành phần riêng.
- **Boss** · Đối chiếu registry gồm 17 palette Light/Dark. Gỡ quy tắc Light cố định accent xanh ô liu trên Hero để Hero, tab và các điều khiển dùng palette của Boss.
- **Combo** · Gộp hướng dẫn mở đầu vào rotation của Arcana Invoker, Frost SpiritReaver, Scarlet Sorceress và Not a Mod. Eternal Chronomancer đưa hai cách mở đầu vào nhóm lựa chọn của High Crit/Full Nuke. Archivist giữ thứ tự cặp phép; vật phẩm Chrono ở phím 6 có bước riêng.
- **Calendar** · 19 thẻ sau gộp, với 8 nhóm có selector riêng và 17 biến thể trong các nhóm này. Giữ đường dẫn từng hồ sơ. Skill và combo lấy từ Class chính của nhóm, artwork và acquisition lấy theo bản đang chọn.
- **CSS/CSH** · Tám kỹ năng và icon mỗi hồ sơ. Fire! là phát bắn thủ công. Bốn rotation từ Class Guide. CSS dùng Calendar Code, CSH dùng các phương thức đổi đã lưu. Đối chiếu [AQW Design Notes](https://www.aq.com/gamedesignnotes/aqw-30nov23-chronoshadowslayerclass-9386), [Wiki CSS](https://aqwwiki.wikidot.com/chrono-shadowslayer-class) và [Wiki CSH](https://aqwwiki.wikidot.com/chrono-shadowhunter).
- **TimeKeeper/TimeKiller và nhóm 2017** · Hai bản TimeKeeper/TimeKiller và ba bản ShadowWalker/ShadowStalker/ShadowWeaver đều có artwork riêng và nguồn acquisition gắn đúng bản.
- **Nguồn combo** · 19/19 thẻ có flow đã gắn dòng nguồn trong [AQW Class Guide](https://docs.google.com/document/d/1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78/edit). Các mục nâng cao dùng Boss Hit hoặc chuỗi chuẩn bị Infinite Healing của CCM/TCM và UCM/OCM còn cần chuyển sang giao diện.
- **Khóa nội dung** · /huong-dan, /farm, /trang-bi, /he-thong, /cot-truyen, /gioi-thieu và các trang guide Class cũ (general-class, class-mechanic, class-enhancements, thu-vien), cùng các route con đã xuất HTML dùng “Thông tin đang được cập nhật”. Trang chủ, Class, Ultra Boss và Challenge vẫn hoạt động.
- **Trang chủ** · Asset /images/aqw/home/c2c55d308fd9ed39e996ae45.png là ảnh giới thiệu poster chính thức lấy từ gallery HeroMart. Hiển thị theo tỷ lệ gốc, kèm ghi công Artix. [HeroMart](https://heromart.com/products/2026-artix-calendar-paradox-of-lore-24x36-poster) · [Artix](https://www.artix.com/posts/paradox-of-lore-2026-calendar-sets/) · [Chính sách sử dụng nội dung](https://www.artix.com/community/brand-and-assets-usage/).
- **Starter Class** · Warrior (Fighter), Mage (Wizard), Healer (Healer), Rogue (Thief) dùng ảnh đúng bản Class và liên kết tới hồ sơ có sẵn. Warrior dùng trang Class thường.
- **Footer** · Hai dòng bản quyền theo yêu cầu, giữ ghi công Artix, liên kết chính thức và điều kiện sử dụng assets. “Về dự án” dùng trang đang cập nhật.
- **Còn thiếu** · Overworld Chronomancer (Merge). Bảng phân loại và nguồn từng Class nằm trong CALENDAR_CLASS_AUDIT.md. Acquisition còn 8 hồ sơ partial, gồm 5 hồ sơ trong nhóm tồn đọng 41 ban đầu.
- **Tệp chính** · src/lib/site-feature-access.mjs, src/lib/routes.ts, src/App.tsx, src/server.tsx, src/features/ComingSoonPage.tsx, src/features/Home.tsx, src/components/Shell.tsx, src/features/classes/ClassAcquisitionPanel.tsx, ClassDirectory.tsx, ClassDetail.tsx, ClassCombos.tsx, src/styles/themes.css và các manifest Calendar/Home trong src/content.

## Kiểm thử

- `lint` · passed
- `typecheck` · passed
- `test` · passed · 155 tests
- `test:semantic` · passed · 82 tests
- `assets:validate-class-skills` · passed
- `build` · passed
- `test:build` · passed · 9 tests
- `test:server` · passed · 4 tests

- chromium · browser_launch_blocked · 0 ca · 0 ảnh · os_or_sandbox_permission_denied
- webkit · browser_launch_blocked · 0 ca · 0 ảnh · browser_process_crash

Chạy lại trên Terminal macOS tại project bằng npm run qa:v12-9-10. Nếu cần dùng WebKit, chạy AQW_BROWSER=webkit npm run qa:v12-9-10. Script kiểm tra Light/Dark ở 375, 768, 1440 và 1920 px.
