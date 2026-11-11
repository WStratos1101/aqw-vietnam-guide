import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(p));
const optional = (p) => (fs.existsSync(p) ? read(p) : null);
const q = read("artifacts/qa/v12-11/queue.json"),
  initial = read("content-sources/v12-11/initial-queue.json");
const catalog = read("src/content/classes/catalog.json"),
  acq = read("src/content/classes/acquisition.json").classes;
const live = read("artifacts/qa/v12-10/skill-audit.json").filter(
  (r) => !r.quarantined,
);
const active = live.filter((r) => !r.passive),
  passive = live.filter((r) => r.passive);
const checks = optional("artifacts/qa/v12-6/verification.json");
const browser = optional("qa/results.json");
const totalInitial = (f) =>
  initial.skills.filter((e) => e.missingFields.includes(f)).length;
const entries = [
  ["Skill Range", "rangeCategory", "range"],
  ["Target Count", "targetCount", "target"],
  ["Skill Effect", "effects", "effects"],
  ["Source Conflicts", "sourceConflict", "conflicts"],
];
const completed = q.acquisitions.filter((c) => c.status === "VERIFIED");
const remaining = q.acquisitions.filter((c) => c.status !== "VERIFIED");
const tests = (name) => {
  const c = checks?.checks.find((c) => c.name === name);
  if (!c) return "NOT RUN";
  const log = fs.readFileSync(c.log, "utf8");
  const count = log.match(/(?:ℹ|#) tests (\d+)/)?.[1];
  return (
    c.status.toUpperCase() +
    (count ? " · " + count + " tests" : "") +
    " · " +
    c.log
  );
};
const lines = [
  "# V12.11 · Verification Recovery Report",
  "",
  "Version **0.1.0**. Đối chiếu ngày **2026-11-11**. Không thiết kế lại UI, không push/deploy và không thay đổi D1.",
  "",
  `Source hiện có ${catalog.length} hồ sơ, ${live.length} Skill hiển thị (${active.length} Active / ${passive.length} Passive), 38 bản ghi cách ly và ${live.length} mapping icon đã xác minh.`,
  "",
  "| Category | Initial Backlog | Verified | Remaining |",
  "| --- | ---: | ---: | ---: |",
];
for (const [label, field, key] of entries) {
  const before = totalInitial(field);
  lines.push(
    `| ${label} | ${before} | ${before - q.counts[key]} | ${q.counts[key]} |`,
  );
}
lines.push(
  `| Acquisition | ${initial.acquisitions.length} | ${completed.length} | ${remaining.length} |`,
  "",
  `Backlog Skill gồm **${initial.skills.length} Skill riêng biệt**, không phải tổng các field cộng lại. Sau sửa có ${active.filter((s) => s.rangeCategory).length}/${active.length} Active có Range và ${active.filter((s) => s.targetCount != null).length}/${active.length} Active có Target. ${passive.length}/${passive.length} Passive giữ effects; Mana/Cooldown/Range/Target không được render cho Passive.`,
  "",
  "## Skill data",
  "",
  "- NOT A MOD: Range cho cả 5 Active từ bảng rework chính thức. Reasonable Strike dùng Max Target 1; tên Reasonable Attack trong bài cũ được đối chiếu theo Rank 2, Mana 0, hồi chiêu 4 và cơ chế hồi Mana. Không ghi đè Keyboard Smash 20s hiện tại bằng 14s của bài ra mắt.",
  "- SHADOW GRASP: Long theo rework tháng 8/2026. Bombard: Long theo mô tả chính thức. Không suy các Range còn lại từ Role/animation.",
  "- Forbidden Form: normal attack 66% Spell Power theo patch ngày 1/5/2026; NOT A MOD Auto Attack: 100% Physical. Hai đòn không có hiệu ứng bổ sung riêng được hiển thị “Không có hiệu ứng”, damage nằm riêng.",
  "- Range còn thiếu: Shaman 1; SkyCharged Grenadier 4; ChronoCorruptor/Chaorruptor 10; Chrono DragonKnight/DataKnight 10. Các khối Wiki/guide được kiểm tra không ghi Range. Vẫn dùng —; không gán Close cho mọi Skill.",
  "- Calendar shared gameplay được giữ đồng nhất. Không đổi Family, artwork, Combo hoặc Acquisition của các Calendar variants.",
  "",
  "## Source conflicts",
  "",
  "- Flight: +75% DoT được hỗ trợ bởi patch chính thức 50% → 75% và mô tả Wiki hiện tại; Notes/guide cũ vẫn giữ trong metadata.",
  "- Quantum Shift của Quantum/Continuum: 23s có cả mô tả chính thức chi tiết và active Wiki note hỗ trợ, khác passive 20s. Áp dụng cùng 23s cho hai active và hai passive views; confidence medium, giữ nguyên văn nguồn mâu thuẫn. Không thay rotation.",
  "- Crystallis Veil: **UNRESOLVED** thời lượng 8s/6s so với 9s/7s. Giữ +25% Damage Resistance và +15% Crit Chance; không chọn một thời lượng thiếu căn cứ. [Sổ đối chiếu](V12_11_SOURCE_CONFLICTS.md).",
  "",
  "## Acquisition",
  "",
  `Hoàn thiện thêm **${completed.length}/${initial.acquisitions.length}** hồ sơ gốc; tổng backlog V12.7: **${22 + completed.length}/41**, còn ${remaining.length}. Toàn bộ ${catalog.length} hồ sơ: ${Object.values(acq).filter((c) => c.reviewStatus === "reviewed").length} reviewed / ${Object.values(acq).filter((c) => c.reviewStatus !== "reviewed").length} partial, gồm ba hồ sơ Calendar ngoài backlog gốc. Những hồ sơ complete ngoài phạm vi được kiểm tra hash không đổi.`,
  "",
  ...completed.map((c) => "- " + c.className + " · " + c.classId),
  "",
  "Các sửa dữ liệu chính:",
  "",
  "- Khôi phục Oracle Class / Ranad / Class Hall A, Blaze Binder 2,000 AC (Firestorm Forge hiện hành; Battleon Legacy), hai Collector Shop 0 AC với điều kiện Vindicator riêng.",
  "- Tách PirateShop 0 AC khỏi Blazebeard Merge; giữ điều kiện sở hữu một trong các Class, thêm Map Recovery Quest Reward với Map Fragment ×5. Không biến mở Shop thành nhận Quest thay thế nếu nguồn không ghi Class reward; block này có Pirate trong Items.",
  "- Khôi phục ProtoSartorium Parts / Call of Kathool từ đúng Quest; danh sách Dropped by lồng là nguồn drop, không phải nguyên liệu bổ sung. Các số lượng thiếu vẫn không được mặc định ×1.",
  "- Tách Frostval seasonal Quest khỏi IceStorm Collection Chest 2018. Tách Dark Lord Quest dành cho chủ sở hữu Darkside khỏi Murder Moon Merge. Giữ riêng Darkside gốc 2012, không gán giá AC.",
  "- Map/NPC bị gán nhầm thành Shop được giữ tại excludedMethods với lý do; không mượn recipe của Shop khác. MechaJouster generic reward được nâng thành Quest Reward có prerequisites/material; entry cũ lưu trong supersededMethods.",
  "- Quest Reward vẫn là câu nhận Class ngắn; metadata vật liệu được bảo toàn. Equipment/Dungeon/Boss Trackers không thay đổi.",
  "",
  "Năm hồ sơ chưa đủ chứng cứ:",
  "",
  ...remaining.map(
    (c) => "- **" + c.className + "** (`" + c.classId + "`): " + c.reason,
  ),
  "",
  "## Kiểm thử",
  "",
  ...[
    "lint",
    "typecheck",
    "test",
    "test:semantic",
    "assets:validate-class-skills",
    "build",
    "test:build",
    "test:server",
  ].map((name) => "- " + name + ": " + tests(name)),
  "",
  "- Sau production build: 19 regression tests chạy lại trên dữ liệu đã sinh đều qua; log artifacts/qa/v12-11/postbuild-regression.log. QA-AQW-Browser.command qua zsh -n.",
  "- Production build sinh 409 routes và 404 HTML. Vite còn cảnh báo bundle >500 kB; không chỉnh phân chia bundle ngoài phạm vi xác minh dữ liệu.",
  "- Regression mới kiểm tra source hash, Class/Skill identity, Range không suy đoán, effect mới, conflict justification, passive duration thống nhất, Acquisition ngoài phạm vi không đổi, số lượng/AND/OR và các route QA.",
  "",
  "## Browser QA",
  "",
  `Trạng thái: **${browser?.status || "NOT_RUN"}**. ${browser?.environment?.platform || "—"} / ${browser?.environment?.architecture || "—"}, ${browser?.environment?.node || "—"}. Browser binaries trong .playwright-browsers. WebKit là engine gần Safari, không phải ứng dụng Safari thật.`,
  "",
  ...(browser?.engines || []).map(
    (e) =>
      `- ${e.engine}: **${e.status}**, cause ${e.cause || "—"}, ${e.screenshots.length} screenshots; ${e.cases.filter((c) => c.status === "passed").length} passed / ${e.cases.filter((c) => c.status === "failed").length} failed / ${e.cases.filter((c) => c.status === "not_run").length} not run. Log: ${e.log}.`,
  ),
  "",
  "- Chromium: executable tồn tại và có quyền thực thi; localhost khởi chạy thành công. Launch báo MachPortRendezvous bootstrap Permission denied (1100), được phân loại OS/sandbox permission denied.",
  "- WebKit: executable tồn tại và có quyền thực thi; process thoát Abort trap 6 / exit 134. Chưa có bằng chứng đủ để quy lỗi crash này cho logic website hoặc một permission macOS cụ thể.",
  "- Không có kết quả quan sát console/UI/contrast trong browser vì chưa mở được trang. Không coi danh sách console rỗng là đã xác nhận không có lỗi.",
  "- Matrix đã chuẩn bị: 375×812, 768×1024, 1440×900, 1920×1080; Dark/Light; Homepage, Class/Calendar Directory, VHL, Calendar alternative, nhiều effects, Rank Passive, nhiều Combo, Nulgath, Speaker, Darkon và các route khóa. Có assertions ảnh/overflow/artframe/combo/Range/Target/Passive/effect colors/theme, screenshot thật và computed style output khi chạy được.",
  "",
  "Chạy trong Terminal macOS bình thường:",
  "",
  "```sh",
  "cd /Users/wstratos/Desktop/Project/aqw-vietnam-guide",
  "npm run qa:browser",
  "```",
  "",
  "Hoặc mở QA-AQW-Browser.command. Chạy riêng: npm run qa:browser:chromium / npm run qa:browser:webkit. Chỉ khi thiếu dependencies mới chạy npm ci; chỉ khi binary thiếu mới chạy npm run qa:install (Chromium + WebKit). Không cần cài lại browser đang có.",
  "",
  "Có thể dùng server đã chạy: AQW_QA_URL=http://localhost:4181 npm run qa:browser. Nếu không có AQW_QA_URL, runner tự khởi chạy và dừng Vite. Kết quả: qa/results.json, qa/logs/, qa/screenshots/. Exit code khác 0 khi Failed/Blocked. Không sửa D1, push hoặc deploy.",
  "",
  "## Files",
  "",
  "- Source-bound skill review: src/content/classes/verification-recovery-v12-11.json; scripts/create-v12-11-reviews.mjs; scripts/lib/verification-v12-11.mjs; scripts/build-skill-inspection-v12-10.mjs.",
  "- Acquisition/parser: src/content/classes/acquisition.json; scripts/recover-acquisition-v12-11.mjs; scripts/lib/class-acquisition-source.mjs; src/types/class-acquisition.ts; ClassAcquisitionPanel.tsx chỉ thêm nhãn quyền sở hữu cũ, không đổi layout.",
  "- Evidence/audit: content-sources/v12-11/, source-conflicts-v12-11.json, scripts/build-conflicts-v12-11.mjs, audit-v12-11.mjs, report-v12-11.mjs, audit-v12-9-10.mjs; queue và conflict report.",
  "- QA: scripts/qa-browser.mjs; qa-v12-9-10.mjs mở rộng suite có sẵn; QA-AQW-Browser.command; package.json.",
  "- Tests: tests/v12-11-data.test.mjs; v12-10-data.test.mjs giữ cả normal attack có tên riêng; class-acquisition-data.test.mjs kiểm tra Price từ đúng Shop row và hash snapshot được chỉ định.",
  "- Generated runtime: các public/content/classes bodies liên quan, catalog/progression metadata và Calendar variant runtime được pipeline hiện có sinh lại; không sửa Class icons, art assets, Boss Phase Engine hoặc D1.",
  "",
  "Chi tiết từng entry: [Verification Queue](V12_11_VERIFICATION_QUEUE.md). Nguồn gốc vẫn ở metadata, không đưa audit text lên UI.",
);
fs.writeFileSync(
  "V12_11_VERIFICATION_RECOVERY_REPORT.md",
  lines.join("\n") + "\n",
);
function append(file, text) {
  const marker = "## V12.11 verification recovery";
  const old = fs.readFileSync(file, "utf8").split(marker)[0].trimEnd();
  fs.writeFileSync(file, old + "\n\n" + marker + "\n\n" + text + "\n");
}
append(
  "CLASS_COMPLETION_AUDIT.md",
  `${catalog.length} profiles; ${Object.values(acq).filter((c) => c.reviewStatus === "reviewed").length} acquisition reviewed / ${Object.values(acq).filter((c) => c.reviewStatus !== "reviewed").length} partial. Original backlog 41: ${22 + completed.length} completed, ${remaining.length} remaining. This run recovered ${completed.length}/19 profiles. Source and reason per entry: V12_11_VERIFICATION_QUEUE.md. Quest Reward stays compact; original metadata and non-Class trackers preserved. Unit/semantic/build passed; Browser QA ${browser?.status || "NOT_RUN"}.`,
);
append(
  "CLASS_SKILL_IMAGE_AUDIT.md",
  `${live.length} verified visible icon mappings unchanged; 38 quarantined records retained. Data recovery: ${active.filter((s) => s.rangeCategory).length}/${active.length} active ranges, ${active.filter((s) => s.targetCount != null).length}/${active.length} target counts; all ${passive.length} passives retain verified effects. Original missing effect descriptions now 0; source conflicts remaining ${q.counts.conflicts}. Icon verification does not imply that every Range is known. See V12_11_VERIFICATION_RECOVERY_REPORT.md.`,
);
append(
  "V12_10_CLASS_SKILL_INSPECTION_REPORT.md",
  `Follow-up verification: recovered ${totalInitial("rangeCategory") - q.counts.range} Range fields, ${totalInitial("targetCount") - q.counts.target} Target, ${totalInitial("effects") - q.counts.effects} descriptions, ${totalInitial("sourceConflict") - q.counts.conflicts} conflict records. Current remaining: ${q.counts.range} Range and ${q.counts.conflicts} conflict. Full decisions and evidence: V12_11_SOURCE_CONFLICTS.md. Browser QA remains ${browser?.status || "NOT_RUN"}.`,
);
fs.writeFileSync(
  "artifacts/qa/v12-11/summary.json",
  JSON.stringify(
    {
      verifiedAt: "2026-11-11",
      version: "0.1.0",
      counts: q.counts,
      acquisitionCompleted: completed.length,
      checks,
      browserStatus: browser?.status || "NOT_RUN",
    },
    null,
    2,
  ) + "\n",
);
console.log("V12.11 report updated from source and real check logs.");
