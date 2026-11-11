# V12.11 · Verification Recovery Report

Version **0.1.0**. Đối chiếu ngày **2026-11-11**. Không thiết kế lại UI, không push/deploy và không thay đổi D1.

Source hiện có 133 hồ sơ, 1042 Skill hiển thị (665 Active / 377 Passive), 38 bản ghi cách ly và 1042 mapping icon đã xác minh.

| Category | Initial Backlog | Verified | Remaining |
| --- | ---: | ---: | ---: |
| Skill Range | 32 | 7 | 25 |
| Target Count | 1 | 1 | 0 |
| Skill Effect | 2 | 2 | 0 |
| Source Conflicts | 4 | 3 | 1 |
| Acquisition | 19 | 14 | 5 |

Backlog Skill gồm **37 Skill riêng biệt**, không phải tổng các field cộng lại. Sau sửa có 640/665 Active có Range và 665/665 Active có Target. 377/377 Passive giữ effects; Mana/Cooldown/Range/Target không được render cho Passive.

## Skill data

- NOT A MOD: Range cho cả 5 Active từ bảng rework chính thức. Reasonable Strike dùng Max Target 1; tên Reasonable Attack trong bài cũ được đối chiếu theo Rank 2, Mana 0, hồi chiêu 4 và cơ chế hồi Mana. Không ghi đè Keyboard Smash 20s hiện tại bằng 14s của bài ra mắt.
- SHADOW GRASP: Long theo rework tháng 8/2026. Bombard: Long theo mô tả chính thức. Không suy các Range còn lại từ Role/animation.
- Forbidden Form: normal attack 66% Spell Power theo patch ngày 1/5/2026; NOT A MOD Auto Attack: 100% Physical. Hai đòn không có hiệu ứng bổ sung riêng được hiển thị “Không có hiệu ứng”, damage nằm riêng.
- Range còn thiếu: Shaman 1; SkyCharged Grenadier 4; ChronoCorruptor/Chaorruptor 10; Chrono DragonKnight/DataKnight 10. Các khối Wiki/guide được kiểm tra không ghi Range. Vẫn dùng —; không gán Close cho mọi Skill.
- Calendar shared gameplay được giữ đồng nhất. Không đổi Family, artwork, Combo hoặc Acquisition của các Calendar variants.

## Source conflicts

- Flight: +75% DoT được hỗ trợ bởi patch chính thức 50% → 75% và mô tả Wiki hiện tại; Notes/guide cũ vẫn giữ trong metadata.
- Quantum Shift của Quantum/Continuum: 23s có cả mô tả chính thức chi tiết và active Wiki note hỗ trợ, khác passive 20s. Áp dụng cùng 23s cho hai active và hai passive views; confidence medium, giữ nguyên văn nguồn mâu thuẫn. Không thay rotation.
- Crystallis Veil: **UNRESOLVED** thời lượng 8s/6s so với 9s/7s. Giữ +25% Damage Resistance và +15% Crit Chance; không chọn một thời lượng thiếu căn cứ. [Sổ đối chiếu](V12_11_SOURCE_CONFLICTS.md).

## Acquisition

Hoàn thiện thêm **14/19** hồ sơ gốc; tổng backlog V12.7: **36/41**, còn 5. Toàn bộ 133 hồ sơ: 125 reviewed / 8 partial, gồm ba hồ sơ Calendar ngoài backlog gốc. Những hồ sơ complete ngoài phạm vi được kiểm tra hash không đổi.

- Alpha Omega/DOOMmega (AO) · alpha-omega-doommega-ao
- Alpha Pirate - Pirate · alpha-pirate-pirate
- Blaze Binder · blaze-binder-bb-firelord-summoner-fls
- Chaos Slayer (CS) - Chaos Champion Prime (CCP) · chaos-slayer-cs-chaos-champion-prime-ccp
- Dark Lord (DL) - Darkside · dark-lord-dl-darkside
- Enforcer - ProtoSartorium · enforcer-protosartorium
- Evolved Pumpkin Lord (EPL) · evolved-pumpkin-lord-epl
- Frostval Barbarian (FB) · frostval-barbarian-fb
- Kathool Adept (KA) · kathool-adept-ka
- MechaJouster (MJ) · mechajouster-mj
- Oracle · oracle
- Rogue - Renegade · rogue-renegade
- Vindicator Of They (VoT) - The Collector (TC) · vindicator-of-they-vot-the-collector-tc
- Warrior - Beast Warrior - Pumpkin Lord - Warlord · warrior-beast-warrior-pumpkin-lord-warlord

Các sửa dữ liệu chính:

- Khôi phục Oracle Class / Ranad / Class Hall A, Blaze Binder 2,000 AC (Firestorm Forge hiện hành; Battleon Legacy), hai Collector Shop 0 AC với điều kiện Vindicator riêng.
- Tách PirateShop 0 AC khỏi Blazebeard Merge; giữ điều kiện sở hữu một trong các Class, thêm Map Recovery Quest Reward với Map Fragment ×5. Không biến mở Shop thành nhận Quest thay thế nếu nguồn không ghi Class reward; block này có Pirate trong Items.
- Khôi phục ProtoSartorium Parts / Call of Kathool từ đúng Quest; danh sách Dropped by lồng là nguồn drop, không phải nguyên liệu bổ sung. Các số lượng thiếu vẫn không được mặc định ×1.
- Tách Frostval seasonal Quest khỏi IceStorm Collection Chest 2018. Tách Dark Lord Quest dành cho chủ sở hữu Darkside khỏi Murder Moon Merge. Giữ riêng Darkside gốc 2012, không gán giá AC.
- Map/NPC bị gán nhầm thành Shop được giữ tại excludedMethods với lý do; không mượn recipe của Shop khác. MechaJouster generic reward được nâng thành Quest Reward có prerequisites/material; entry cũ lưu trong supersededMethods.
- Quest Reward vẫn là câu nhận Class ngắn; metadata vật liệu được bảo toàn. Equipment/Dungeon/Boss Trackers không thay đổi.

Năm hồ sơ chưa đủ chứng cứ:

- **Deathknight Lord (DKL)** (`deathknight-lord-dkl`): Class page omits Armor quantity; Bonecastle Merge Class row lists only Shadow Skull ×30, while Tower Merge lists Armor rather than Class. Current sources disagree; do not infer ×1 or borrow the Armor recipe.
- **Dragon of Time** (`dragon-of-time-dt-edot`): Exact Hero’s Heartbeat disclosure names these two items without quantities. Retain the explicit Slugbutter Trophy ×100 / Icewing Laurel ×30 text in source; do not default the other quantities to one.
- **Necromancer (Necro) - Pinkomancer** (`necromancer-necro-pinkomancer`): Historical Necromancer (PTR) points to PTR Enhancements at 100 Gold. Current linked page contains enhancement tables, not a matching Class row. Cannot reconstruct a current Shop from that page; legacy method remains partial.
- **Sentinel** (`sentinel`): 1st and 11th shop rows recovered. Direct 3rd/12th shop page access still returns connection failure / redirect loop. Search extracts and badge pages alone are not sufficient to verify every Shop field.
- **Yami no Ronin (YnR)** (`yami-no-ronin-ynr`): Exact Yami no Ronin quest names both scrolls without quantities. No explicit quantity proof found; neither inferred ×1 nor AND/OR rewrite is applied.

## Kiểm thử

- lint: PASSED · artifacts/qa/v12-6/lint.log
- typecheck: PASSED · artifacts/qa/v12-6/typecheck.log
- test: PASSED · 155 tests · artifacts/qa/v12-6/test.log
- test:semantic: PASSED · 82 tests · artifacts/qa/v12-6/test-semantic.log
- assets:validate-class-skills: PASSED · artifacts/qa/v12-6/assets-validate-class-skills.log
- build: PASSED · artifacts/qa/v12-6/build.log
- test:build: PASSED · 9 tests · artifacts/qa/v12-6/test-build.log
- test:server: PASSED · 4 tests · artifacts/qa/v12-6/test-server.log

- Sau production build: 19 regression tests chạy lại trên dữ liệu đã sinh đều qua; log artifacts/qa/v12-11/postbuild-regression.log. QA-AQW-Browser.command qua zsh -n.
- Production build sinh 409 routes và 404 HTML. Vite còn cảnh báo bundle >500 kB; không chỉnh phân chia bundle ngoài phạm vi xác minh dữ liệu.
- Regression mới kiểm tra source hash, Class/Skill identity, Range không suy đoán, effect mới, conflict justification, passive duration thống nhất, Acquisition ngoài phạm vi không đổi, số lượng/AND/OR và các route QA.

## Browser QA

Trạng thái: **BLOCKED**. darwin / arm64, v24.22.0. Browser binaries trong .playwright-browsers. WebKit là engine gần Safari, không phải ứng dụng Safari thật.

- chromium: **BLOCKED**, cause os_or_sandbox_permission_denied, 0 screenshots; 0 passed / 0 failed / 168 not run. Log: qa/logs/chromium.log.
- webkit: **BLOCKED**, cause browser_process_crash, 0 screenshots; 0 passed / 0 failed / 168 not run. Log: qa/logs/webkit.log.

- Chromium: executable tồn tại và có quyền thực thi; localhost khởi chạy thành công. Launch báo MachPortRendezvous bootstrap Permission denied (1100), được phân loại OS/sandbox permission denied.
- WebKit: executable tồn tại và có quyền thực thi; process thoát Abort trap 6 / exit 134. Chưa có bằng chứng đủ để quy lỗi crash này cho logic website hoặc một permission macOS cụ thể.
- Không có kết quả quan sát console/UI/contrast trong browser vì chưa mở được trang. Không coi danh sách console rỗng là đã xác nhận không có lỗi.
- Matrix đã chuẩn bị: 375×812, 768×1024, 1440×900, 1920×1080; Dark/Light; Homepage, Class/Calendar Directory, VHL, Calendar alternative, nhiều effects, Rank Passive, nhiều Combo, Nulgath, Speaker, Darkon và các route khóa. Có assertions ảnh/overflow/artframe/combo/Range/Target/Passive/effect colors/theme, screenshot thật và computed style output khi chạy được.

Chạy trong Terminal macOS bình thường:

```sh
cd /Users/wstratos/Desktop/Project/aqw-vietnam-guide
npm run qa:browser
```

Hoặc mở QA-AQW-Browser.command. Chạy riêng: npm run qa:browser:chromium / npm run qa:browser:webkit. Chỉ khi thiếu dependencies mới chạy npm ci; chỉ khi binary thiếu mới chạy npm run qa:install (Chromium + WebKit). Không cần cài lại browser đang có.

Có thể dùng server đã chạy: AQW_QA_URL=http://localhost:4181 npm run qa:browser. Nếu không có AQW_QA_URL, runner tự khởi chạy và dừng Vite. Kết quả: qa/results.json, qa/logs/, qa/screenshots/. Exit code khác 0 khi Failed/Blocked. Không sửa D1, push hoặc deploy.

## Files

- Source-bound skill review: src/content/classes/verification-recovery-v12-11.json; scripts/create-v12-11-reviews.mjs; scripts/lib/verification-v12-11.mjs; scripts/build-skill-inspection-v12-10.mjs.
- Acquisition/parser: src/content/classes/acquisition.json; scripts/recover-acquisition-v12-11.mjs; scripts/lib/class-acquisition-source.mjs; src/types/class-acquisition.ts; ClassAcquisitionPanel.tsx chỉ thêm nhãn quyền sở hữu cũ, không đổi layout.
- Evidence/audit: content-sources/v12-11/, source-conflicts-v12-11.json, scripts/build-conflicts-v12-11.mjs, audit-v12-11.mjs, report-v12-11.mjs, audit-v12-9-10.mjs; queue và conflict report.
- QA: scripts/qa-browser.mjs; qa-v12-9-10.mjs mở rộng suite có sẵn; QA-AQW-Browser.command; package.json.
- Tests: tests/v12-11-data.test.mjs; v12-10-data.test.mjs giữ cả normal attack có tên riêng; class-acquisition-data.test.mjs kiểm tra Price từ đúng Shop row và hash snapshot được chỉ định.
- Generated runtime: các public/content/classes bodies liên quan, catalog/progression metadata và Calendar variant runtime được pipeline hiện có sinh lại; không sửa Class icons, art assets, Boss Phase Engine hoặc D1.

Chi tiết từng entry: [Verification Queue](V12_11_VERIFICATION_QUEUE.md). Nguồn gốc vẫn ở metadata, không đưa audit text lên UI.
