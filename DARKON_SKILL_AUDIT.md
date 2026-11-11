# Darkon — đối chiếu bộ kỹ năng

Kiểm tra 2026-11-09, Version 0.1.0. Đã đọc đúng Monster **Darkon the Conductor** tại `/ultradarkon`, không dùng Darkon thường hoặc Encore Darkon.

## Nguồn đã đọc

- Wiki: https://aqwwiki.wikidot.com/darkon-the-conductor — toàn bộ Attacks, Abilities và Base Stats.
- Google Sites: https://sites.google.com/view/vncollector/adventure-quest-worlds/ultra-boss-guide/weekly-ultra-challenge-boss/darkon-the-conductor — đọc được bằng public HTTP Terminal; web tool không đọc được trang này. Snapshot: `content-sources/recovery/sites-darkon-the-conductor.json`.
- Google Docs: https://docs.google.com/document/d/18Z2Yu0O40dVyh0enB_2k_v4U-De3mg1y-HtThUmvxfU/edit — fetch qua Google Drive thành công; đối chiếu chương Darkon, gồm cơ chế, mô tả phase và Focus/Taunt.

## Lỗi trong dữ liệu/render trước sửa

1. Buff A Major/B Minor/C Minor/B Major/C Major của **Darkon** bị gán vào `playerEffects`; một số hiệu ứng của Auto Attack lại nằm sai ở Boss effects.
2. The Cycle's End tăng damage Boss nhận vào nhưng xuất hiện cả trong player effects.
3. Special 1/2 có nhiều bản theo phase nhưng chỉ ghi phase trong nội dung mở rộng, khiến các entry và bảng sát thương khó phân biệt.
4. Generic translation để sót câu trộn Anh/Việt và nội dung lặp, ví dụ “his”, “While active”.
5. Confidence trước đây không phân biệt được kỹ năng có cơ chế xác minh với damage/type chưa công bố.

## Đối chiếu khác biệt nguồn

| Trường | Wiki | Docs | Site | Kết quả trong web |
|---|---|---|---|---|
| Special 1 | 90% **HP hiện tại** | 90% HP tối đa | 90% HP tối đa | Giữ current HP trong cả ba phase |
| A Major | +5000% Dodge / 10 giây | +1000% | +1000% | +5000%; tác động lên Darkon |
| Crit Damage nền | 800% | 800% | 500% | 800% |
| End of the World | Sau 270 giây, charge 3 giây | 270 + 3 | Có cả 303 và 273 ở các đoạn khác nhau | 4:30 bắt đầu niệm, sau 3 giây tung Curtain Call; không suy từ số stack |
| Grown Crit Chance | 1000, không ghi dấu % | 1000% | 1000% | Giữ 1000, không tự thêm đơn vị |
| Taunt trong Recitative | Encounter Darkon | Một câu nhầm “Nulgath” | Cùng lỗi tên “Nulgath” | Ghi nhận typo; không đưa nhầm target vào bộ skill |
| Exeunt/Decay | Exeunt: hồi 750.000 HP mỗi kill, không nêu Decay; Aria: không bị Decay | Có gán miễn Decay cho hồi máu theo kill | Chỉ mô tả hồi máu theo kill | Chỉ khẳng định miễn Decay cho lần hồi của Aria |
| Aria damage | Physical, không có con số công bố | Không có số đủ căn cứ | Không có số đủ căn cứ | Không tự thêm Damage; giữ `needs_verification` cho giá trị |

Tên bốn giai đoạn chiến thuật cộng đồng khác nhau giữa Docs/Site không được dùng để đặt tên kỹ năng mới. Wiki có Overture, Recitative, Aria; “Madness/Weakening/Rush” là cách chia thời gian chiến thuật, không phải bộ skill riêng.

## Bộ skill sau sửa

Giữ nguyên **13 Active records**, không đổi tên Special 1/2 và không làm mất các bản theo phase:

| Phạm vi | Kỹ năng | Nội dung chính |
|---|---|---|
| Toàn trận | Auto Attack | 100 True Damage trước hệ số chí mạng; 2.25 giây; luôn crit, bỏ qua Focus, giảm Dodge người chơi 500% |
| Toàn trận | The Cycle's End | Mỗi 30 giây tăng Physical/Magical Incoming Damage của Darkon 10%, tối đa 10 stack |
| Toàn trận | End of the World → Curtain Call | 270 giây bắt đầu charge 3 giây; Curtain Call 100.000.337 True Damage, bỏ qua Focus, fatal DoT |
| Overture | Overture | Bắt đầu trận, áp Do Dawn/Overture |
| Overture | Special 1 | 90% current HP; 12 giây; Re → Mi → Fa → So → La → Ti, sau đó Do Dusk; tăng Crit Damage trên Boss |
| Overture | Special 2 | 150 True Damage trước hệ số chí mạng; 5 giây; Elegy of Madness 8 giây, nhận lại khi còn aura gây Captive Audience/Stun 4 giây |
| Recitative | Recitative | Một lần tại 70% HP; xóa aura Overture hai phía, Darkon tăng Crit Damage 500% |
| Recitative | Special 1 | 90% current HP; Child of the Empress tăng Crit Damage Boss 50%, tối đa 22 stack |
| Recitative | Special 2 | Seed Planted 8 giây, xóa Realm of the Arcana → Grown nếu đã có Seed → Harvested nếu đã có Grown |
| Aria | Aria | Một lần tại 20% HP; đòn Physical bỏ qua Focus, không crit; hồi Boss lên 90% max HP không bị Decay; các buff A/B/C đặt đúng lên Boss |
| Aria | Special 1 | 90% current HP + The Last Symphony DoT 8 giây |
| Aria | Special 2 | Dirge of Astravia tăng Mana Cost 25% / 12 giây, tối đa 22 stack |

Auto Attack dùng một record chuẩn với ba nhóm `phaseEffects`: Melancholic Melodies (Overture), Realm of the Arcana (Recitative), Requiem for the Wicked (Aria). Không lặp lại ba lần Auto Attack hoặc gắn debuff người chơi vào Boss.

Giữ **4 Passive/base-stat records**: Boss Shield (122.222 / exponent 0.8), Stun immunity, Exeunt (750.000 HP/kill), chỉ số nền (800% Crit Damage; 200% kháng DoT). Crit Chance/Hit Chance chỉ được ghi “tăng, chưa có số”, không bịa giá trị.

## Thay đổi code và chống tái phát

- `content-sources/recovery/darkon-combat-reviewed.json`: dữ liệu đã biên tập, selector theo tên/occurrence/phase, source và xung đột.
- `scripts/apply-reviewed-combat.mjs`: áp layer xác minh sau parser; giữ IDs và source notes. Kiểm tra số skill, source URL và hash snapshot; nếu nguồn đổi, dừng yêu cầu review lại, không áp đè mù dữ liệu cũ.
- `scripts/apply-content-verification.mjs`: gọi reviewed layer cuối pipeline, vì vậy build không hoàn nguyên lỗi parser cũ.
- `src/types/ultra.ts`, `EnemyInspection.tsx`: phase label và hiệu ứng Auto Attack theo phase.
- `src/lib/combat-inspection.ts`, `AttackDamageTable.tsx`: bảng Damage dùng cùng Skill entity, giữ phase ở các hàng Special.
- `src/styles/ultra/v11.css`: nhãn phase, không thay hệ thống theme/layout.
- `src/content/ultra/recovery.json`: dữ liệu sinh lại; Notes không còn cấm Vainglory chung cho mọi Class, vì source community có loadout VHL dùng Vainglory. Thay bằng nhắc phối hợp Taunt cho Special 2; không tự đổi loadout.
- `tests/darkon-combat.test.mjs`, `tests/darkon-browser.mjs`, `package.json`: regression và kiểm tra UI.

## Kiểm thử

- Unit/data/semantic: **69/69**.
- Build/SSR: **9/9**.
- Lint: **65 TypeScript files, 0 findings** (focused project linter).
- Typecheck và production build: passed, 363 routes + 404; vẫn còn cảnh báo chunk lớn.
- Chromium: **8/8** — 375/768/1440/1920 × Dark/Light; mở Auto Attack, các Special theo phase, Aria và Passive; không page errors hoặc horizontal overflow.
- Screenshot Aria desktop/light và mobile/dark đã mở xem: buff/debuff đúng bên, tên/phase rõ, không tràn ngang. Files: `qa/darkon/`; kết quả `qa/darkon/browser-report.json`.

Không tuyên bố đã thử chiến đấu trực tiếp trong AQW hoặc chạy Safari. Số damage chuyển Aria và các type/cooldown không công bố vẫn được giữ chưa xác minh, không lấy số từ Boss khác.

Local: http://127.0.0.1:4181/ultra-boss/darkon-the-conductor
