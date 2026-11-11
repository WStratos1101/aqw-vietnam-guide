# V12.10 · Class Skill Inspection

Version 0.1.0. Quét 133 hồ sơ với 1080 bản ghi skill. 38 bản ghi đang cách ly, 1042 skill hiển thị.

| Mục | Kết quả |
| --- | ---: |
| Active trong registry, gồm bản ghi cách ly | 703 |
| Active hiển thị | 665 |
| Active có Range xác minh | 633 |
| Active có Target xác minh | 664 |
| Active có Range đặc biệt cần xem thủ công | 1 |
| Passive / Rank Passive hiển thị | 377 |
| Passive có hiệu ứng tiếng Việt đã đối chiếu | 377 |
| Passive còn thiếu hiệu ứng | 0 |
| Skill có placeholder Wiki được loại khỏi UI | 524 |
| Auto Attack đã xác minh chỉ có sát thương cơ bản | 37 |
| Active còn thiếu bản mô tả hiệu ứng | 2 |
| Active giữ một phần hiệu ứng từ guide | 32 |
| Skill có trường hiệu ứng mâu thuẫn nguồn | 4 |

Range chỉ nhận Close, Medium, Long và Infinite. Trường thiếu dùng “—”. Target dùng số nguyên lấy từ trường Range của Wiki hoặc dòng số mục tiêu ghi rõ trong Class Guide. Target Badges thuộc từng hiệu ứng. Passive chỉ có icon, tên, loại, Rank và hiệu ứng. Chaos Bulwark giữ Mana 50, hồi chiêu 6 giây, Rank 3, Infinite và 1 mục tiêu. Wonderful Night của Blood Ancient giữ Rank 10 và tăng 50% Crit Damage. [Chaos Avenger](https://aqwwiki.wikidot.com/chaos-avenger) · [Blood Ancient](https://aqwwiki.wikidot.com/blood-ancient-ac).

## Sai khác nguồn

- TimeKeeper giữ Compress Time ở phím 3 và Relive the Past ở phím 4 theo trang Class Wiki. Class Guide đảo hai tên này, chuỗi phím trong Guide vẫn trỏ đúng hồi phục và nuke sau khi đối chiếu.
- Flight ghi 75% DoT trong mô tả và 50% trong Notes. Crystallis Veil ghi các mốc 8/6 giây trong mô tả và 9/7 giây trong Notes. Quantum Shift và Passive Quantum Spiral ghi 23 và 20 giây. Các trường tranh chấp dùng trạng thái source_conflict và ghi chú ngắn trên effect. Abyssal Angel (AA) - Abyssal Angel's Shadow (AAS) · Flight, Abyssal Angel (AA) - Abyssal Angel's Shadow (AAS) · Crystallis Veil, Quantum Chronomancer · Quantum Shift, Continuum Chronomancer · Quantum Shift.

- Wiki CSS/CSH hiện ghi Fire! hồi chiêu 0,2 giây và Rank 0. Design Notes ra mắt ghi 0,15 giây và Default Attack. Panel dùng dữ liệu Wiki hiện tại. [Design Notes](https://www.aq.com/gamedesignnotes/aqw-30nov23-chronoshadowslayerclass-9386) · [Wiki](https://aqwwiki.wikidot.com/chrono-shadowslayer-class).
- Bỏ số liệu gạch bỏ trong 4 bản ghi có bằng chứng, gồm Time of the Dragon 25 giây và Don’t Blink Twice 75% trong 8 giây. Giữ giá trị cũ và hash trong artifacts/qa/v12-10/retired-values.json.
- SHADOW GRASP (PaladinSlayer (PS)) có bằng chứng nguồn trong artifacts/qa/v12-10/skill-audit.json. Hai skill thiếu mô tả hiệu ứng là Forbidden Form (Dark Lord) và Auto Attack (Not a Mod), nguồn chỉ có câu mô tả chung. Audit liệt kê theo Class và Skill các trường hoặc hiệu ứng còn thiếu. Sai khác giữa số liệu Wiki và dữ liệu import có trong artifacts/qa/class-data-conflicts.json (27 mục của lượt chạy).

## Tệp và kiểm thử

- ClassSkills.tsx, TargetEffects.tsx, src/types/classes.ts và src/styles/classes/v12.css điều khiển Skill Inspection.
- scripts/build-skill-inspection-v12-10.mjs, scripts/normalize-current-skill-values.mjs và các registry hiệu ứng trong src/content/classes tạo dữ liệu có provenance.
- tests/v12-10-data.test.mjs và tests/class-tabs-interactions.test.mjs kiểm tra dữ liệu và hai layout trên DOM.

- `lint` · passed
- `typecheck` · passed
- `test` · passed · 148 tests
- `test:semantic` · passed · 75 tests
- `assets:validate-class-skills` · passed
- `build` · passed
- `test:build` · passed · 9 tests
- `test:server` · passed · 4 tests

- chromium · browser_launch_blocked · 0 ca · 0 ảnh · os_or_sandbox_permission_denied
- webkit · browser_launch_blocked · 0 ca · 0 ảnh · browser_process_crash
