import fs from "node:fs";

const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const optional = (path) => (fs.existsSync(path) ? read(path) : undefined);
const write = (path, content) => fs.writeFileSync(path, content.trim() + "\n");
const catalog = read("src/content/classes/catalog.json");
const registry = read("src/content/classes/skill-registry.json");
const membership = read("src/content/classes/calendar-membership.json");
const families = read("src/content/classes/calendar-families.json");
const extension = read("src/content/classes/calendar-extension.json");
const poster = read("src/content/home-poster.json");
const starters = read("src/content/home-starters.json");
const bosses = read("src/content/presentation/bosses.json");
const acquisition = read("src/content/classes/acquisition.json").classes;
const rows = read("artifacts/qa/v12-10/skill-audit.json");
const live = rows.filter((row) => !row.quarantined);
const active = live.filter((row) => !row.passive);
const passive = live.filter((row) => row.passive);
const hasRange = active.filter((row) => row.rangeCategory);
const hasTarget = active.filter((row) => row.targetCount != null);
const special = active.filter((row) => row.specialRange);
const verifiedPassive = passive.filter(
  (row) => row.effectStatus === "verified",
);
const basic = active.filter((row) => row.effectStatus === "verified_none");
const visiblePending = active.filter(
  (row) => row.effectStatus === "unverified",
);
const retainedPartial = active.filter(
  (row) => row.effectStatus === "community_partial",
);
const placeholders = live.filter((row) => row.removedPlaceholder);
const disputed = live.filter((row) => row.effectStatus === "source_conflict");
const retired = read("artifacts/qa/v12-10/retired-values.json");
const skillChanges = optional("artifacts/qa/class-data-conflicts.json");
const calendar = catalog.filter(
  (profile) =>
    membership.some((row) => row.classId === profile.id) &&
    !families.some(
      (family) =>
        family.primaryClassId !== profile.id &&
        family.variants.some((variant) => variant.classId === profile.id),
    ),
);
const combos = calendar.map((c) => ({
  name: c.name,
  combos: read("public" + c.bodyUrl).combos.filter(
    (combo) => combo.flow?.length && combo.verificationStatus === "verified",
  ),
}));
const questClasses = catalog.filter((c) =>
  acquisition[c.id].methods.some((m) => m.acquisitionKind === "quest_reward"),
);
const oldBacklog = read("content-sources/v12-7/acquisition-before.json");
const backlogComplete = oldBacklog.filter(
  (c) => acquisition[c.classId]?.reviewStatus === "reviewed",
).length;
const verifiedAcquisition = catalog.filter(
  (c) => acquisition[c.id]?.reviewStatus === "reviewed",
).length;
const verifiedIcons = registry.skills.filter(
  (s) => s.verificationStatus === "verified",
).length;
const qa = optional("artifacts/qa/v12-6/verification.json");
const browsers = ["chromium", "webkit"].map((engine) => [
  engine,
  optional("artifacts/qa/v12-9-10-" + engine + "/results.json"),
]);
const resultSummary =
  qa?.checks
    .map((check) => {
      const log = fs.readFileSync(check.log, "utf8");
      const total = log.match(/(?:ℹ|#) tests (\d+)/)?.[1];
      return (
        "- `" +
        check.name +
        "` · " +
        check.status +
        (total ? " · " + total + " tests" : "")
      );
    })
    .join("\n") || "- Chưa có kết quả xác minh.";
const browserSummary = browsers
  .map(
    ([engine, result]) =>
      "- " +
      engine +
      " · " +
      (result?.status || "not_run") +
      (result
        ? " · " +
          result.cases.length +
          " ca · " +
          result.screenshots.length +
          " ảnh" +
          (result.cause ? " · " + result.cause : "")
        : ""),
  )
  .join("\n");

write(
  "V12_9_CALENDAR_SITE_REFINEMENT_REPORT.md",
  `
# V12.9 · Calendar và trang chủ

Version 0.1.0. Kết quả dựa trên catalog và kiểm thử tại workspace.

- **Quest Reward** · ${questClasses.length} hồ sơ dùng câu nhận Class từ Quest. Nội dung nguyên liệu và điều kiện vẫn lưu ở metadata. Merge, Shop Unlock và các tracker Boss/Dungeon dùng thành phần riêng.
- **Boss** · Đối chiếu registry gồm ${Object.keys(bosses).length} palette Light/Dark. Gỡ quy tắc Light cố định accent xanh ô liu trên Hero để Hero, tab và các điều khiển dùng palette của Boss.
- **Combo** · Gộp hướng dẫn mở đầu vào rotation của Arcana Invoker, Frost SpiritReaver, Scarlet Sorceress và Not a Mod. Eternal Chronomancer đưa hai cách mở đầu vào nhóm lựa chọn của High Crit/Full Nuke. Archivist giữ thứ tự cặp phép; vật phẩm Chrono ở phím 6 có bước riêng.
- **Calendar** · ${calendar.length} thẻ sau gộp, với ${families.length} nhóm có selector riêng và ${families.flatMap((f) => f.variants).length} biến thể trong các nhóm này. Giữ đường dẫn từng hồ sơ. Skill và combo lấy từ Class chính của nhóm, artwork và acquisition lấy theo bản đang chọn.
- **CSS/CSH** · Tám kỹ năng và icon mỗi hồ sơ. Fire! là phát bắn thủ công. Bốn rotation từ Class Guide. CSS dùng Calendar Code, CSH dùng các phương thức đổi đã lưu. Đối chiếu [AQW Design Notes](https://www.aq.com/gamedesignnotes/aqw-30nov23-chronoshadowslayerclass-9386), [Wiki CSS](https://aqwwiki.wikidot.com/chrono-shadowslayer-class) và [Wiki CSH](https://aqwwiki.wikidot.com/chrono-shadowhunter).
- **TimeKeeper/TimeKiller và nhóm 2017** · Hai bản TimeKeeper/TimeKiller và ba bản ShadowWalker/ShadowStalker/ShadowWeaver đều có artwork riêng và nguồn acquisition gắn đúng bản.
- **Nguồn combo** · ${combos.filter((row) => row.combos.length).length}/${calendar.length} thẻ có flow đã gắn dòng nguồn trong [AQW Class Guide](https://docs.google.com/document/d/1KgDAxEoTEHvzaNqiPRMZPqnekKVXG6JGwKPyk83Pk78/edit). Các mục nâng cao dùng Boss Hit hoặc chuỗi chuẩn bị Infinite Healing của CCM/TCM và UCM/OCM còn cần chuyển sang giao diện.
- **Khóa nội dung** · /huong-dan, /farm, /trang-bi, /he-thong, /cot-truyen, /gioi-thieu và các trang guide Class cũ (general-class, class-mechanic, class-enhancements, thu-vien), cùng các route con đã xuất HTML dùng “Thông tin đang được cập nhật”. Trang chủ, Class, Ultra Boss và Challenge vẫn hoạt động.
- **Trang chủ** · Asset ${poster.imagePath} là ảnh giới thiệu poster chính thức lấy từ gallery HeroMart. Hiển thị theo tỷ lệ gốc, kèm ghi công Artix. [HeroMart](${poster.sourcePage}) · [Artix](${poster.supportingSource}) · [Chính sách sử dụng nội dung](${poster.policyUrl}).
- **Starter Class** · ${starters.map((c) => c.name + " (" + c.enhancement + ")").join(", ")} dùng ảnh đúng bản Class và liên kết tới hồ sơ có sẵn. Warrior dùng trang Class thường.
- **Footer** · Hai dòng bản quyền theo yêu cầu, giữ ghi công Artix, liên kết chính thức và điều kiện sử dụng assets. “Về dự án” dùng trang đang cập nhật.
- **Còn thiếu** · ${extension.issues.map((i) => i.name).join(", ") || "Không có mục asset được báo thiếu trong Calendar extension"}. Bảng phân loại và nguồn từng Class nằm trong CALENDAR_CLASS_AUDIT.md. Acquisition còn ${catalog.length - verifiedAcquisition} hồ sơ partial, gồm ${oldBacklog.length - backlogComplete} hồ sơ trong nhóm tồn đọng ${oldBacklog.length} ban đầu.
- **Tệp chính** · src/lib/site-feature-access.mjs, src/lib/routes.ts, src/App.tsx, src/server.tsx, src/features/ComingSoonPage.tsx, src/features/Home.tsx, src/components/Shell.tsx, src/features/classes/ClassAcquisitionPanel.tsx, ClassDirectory.tsx, ClassDetail.tsx, ClassCombos.tsx, src/styles/themes.css và các manifest Calendar/Home trong src/content.

## Kiểm thử

${resultSummary}

${browserSummary}

Chạy lại trên Terminal macOS tại project bằng npm run qa:v12-9-10. Nếu cần dùng WebKit, chạy AQW_BROWSER=webkit npm run qa:v12-9-10. Script kiểm tra Light/Dark ở 375, 768, 1440 và 1920 px.
`,
);

write(
  "V12_10_CLASS_SKILL_INSPECTION_REPORT.md",
  `
# V12.10 · Class Skill Inspection

Version 0.1.0. Quét ${catalog.length} hồ sơ với ${rows.length} bản ghi skill. ${rows.length - live.length} bản ghi đang cách ly, ${live.length} skill hiển thị.

| Mục | Kết quả |
| --- | ---: |
| Active trong registry, gồm bản ghi cách ly | ${rows.filter(row => !row.passive).length} |
| Active hiển thị | ${active.length} |
| Active có Range xác minh | ${hasRange.length} |
| Active có Target xác minh | ${hasTarget.length} |
| Active có Range đặc biệt cần xem thủ công | ${special.length} |
| Passive / Rank Passive hiển thị | ${passive.length} |
| Passive có hiệu ứng tiếng Việt đã đối chiếu | ${verifiedPassive.length} |
| Passive còn thiếu hiệu ứng | ${passive.length - verifiedPassive.length} |
| Skill có placeholder Wiki được loại khỏi UI | ${placeholders.length} |
| Auto Attack đã xác minh chỉ có sát thương cơ bản | ${basic.length} |
| Active còn thiếu bản mô tả hiệu ứng | ${visiblePending.length} |
| Active giữ một phần hiệu ứng từ guide | ${retainedPartial.length} |
| Skill có trường hiệu ứng mâu thuẫn nguồn | ${disputed.length} |

Range chỉ nhận Close, Medium, Long và Infinite. Trường thiếu dùng “—”. Target dùng số nguyên lấy từ trường Range của Wiki hoặc dòng số mục tiêu ghi rõ trong Class Guide. Target Badges thuộc từng hiệu ứng. Passive chỉ có icon, tên, loại, Rank và hiệu ứng. Chaos Bulwark giữ Mana 50, hồi chiêu 6 giây, Rank 3, Infinite và 1 mục tiêu. Wonderful Night của Blood Ancient giữ Rank 10 và tăng 50% Crit Damage. [Chaos Avenger](https://aqwwiki.wikidot.com/chaos-avenger) · [Blood Ancient](https://aqwwiki.wikidot.com/blood-ancient-ac).

## Sai khác nguồn

- TimeKeeper giữ Compress Time ở phím 3 và Relive the Past ở phím 4 theo trang Class Wiki. Class Guide đảo hai tên này, chuỗi phím trong Guide vẫn trỏ đúng hồi phục và nuke sau khi đối chiếu.
- Flight ghi 75% DoT trong mô tả và 50% trong Notes. Crystallis Veil ghi các mốc 8/6 giây trong mô tả và 9/7 giây trong Notes. Quantum Shift và Passive Quantum Spiral ghi 23 và 20 giây. Các trường tranh chấp dùng trạng thái source_conflict và ghi chú ngắn trên effect. ${disputed.map((row) => row.className + " · " + row.name).join(", ")}.

- Wiki CSS/CSH hiện ghi Fire! hồi chiêu 0,2 giây và Rank 0. Design Notes ra mắt ghi 0,15 giây và Default Attack. Panel dùng dữ liệu Wiki hiện tại. [Design Notes](https://www.aq.com/gamedesignnotes/aqw-30nov23-chronoshadowslayerclass-9386) · [Wiki](https://aqwwiki.wikidot.com/chrono-shadowslayer-class).
- Bỏ số liệu gạch bỏ trong ${retired.length} bản ghi có bằng chứng, gồm Time of the Dragon 25 giây và Don’t Blink Twice 75% trong 8 giây. Giữ giá trị cũ và hash trong artifacts/qa/v12-10/retired-values.json.
- ${special.map((s) => s.name + " (" + s.className + ")").join(", ") || "Không có trường Range đặc biệt"} có bằng chứng nguồn trong artifacts/qa/v12-10/skill-audit.json. Hai skill thiếu mô tả hiệu ứng là Forbidden Form (Dark Lord) và Auto Attack (Not a Mod), nguồn chỉ có câu mô tả chung. Audit liệt kê theo Class và Skill các trường hoặc hiệu ứng còn thiếu. Sai khác giữa số liệu Wiki và dữ liệu import có trong artifacts/qa/class-data-conflicts.json (${Array.isArray(skillChanges) ? skillChanges.length : "xem tệp"} mục của lượt chạy).

## Tệp và kiểm thử

- ClassSkills.tsx, TargetEffects.tsx, src/types/classes.ts và src/styles/classes/v12.css điều khiển Skill Inspection.
- scripts/build-skill-inspection-v12-10.mjs, scripts/normalize-current-skill-values.mjs và các registry hiệu ứng trong src/content/classes tạo dữ liệu có provenance.
- tests/v12-10-data.test.mjs và tests/class-tabs-interactions.test.mjs kiểm tra dữ liệu và hai layout trên DOM.

${resultSummary}

${browserSummary}
`,
);

function updateAudit(path, body) {
  const marker = "## V12.9 / V12.10";
  const previous = fs
    .readFileSync(path, "utf8")
    .split("\n" + marker)[0]
    .trimEnd();
  write(path, previous + "\n\n" + marker + "\n\n" + body);
}
updateAudit(
  "CLASS_SKILL_IMAGE_AUDIT.md",
  `${catalog.length} hồ sơ, ${registry.skills.length} bản ghi, ${verifiedIcons} icon xác minh và ${registry.skills.length - verifiedIcons} bản ghi cách ly. Năm hồ sơ Calendar khôi phục đủ 39 icon. Passive đã đối chiếu ${verifiedPassive.length}/${passive.length}. Xem V12_10_CLASS_SKILL_INSPECTION_REPORT.md và skill-audit.json để rà phần hiệu ứng/Range/Target thiếu.`,
);
updateAudit(
  "CLASS_COMPLETION_AUDIT.md",
  `${catalog.length} hồ sơ, ${verifiedAcquisition} acquisition reviewed và ${catalog.length - verifiedAcquisition} partial. Backlog V12.7 giữ ${backlogComplete}/${oldBacklog.length} hoàn tất. Quest Reward rút gọn cho ${questClasses.length} hồ sơ. ${calendar.length} thẻ Calendar và ${families.length} Calendar Family có chuyển biến thể.`,
);
updateAudit(
  "CALENDAR_CLASS_AUDIT.md",
  `Khôi phục 5 trang thiếu từ V12.8 với hồ sơ và artwork. ${membership.length} liên kết nguồn được biểu diễn trong registry, ${calendar.length} thẻ sau gộp. Nguồn Overworld Merge còn vấn đề asset riêng. Giữ Quantum/Continuum tách vì tên Passive khác nhau. Giữ CCM/TCM và UCM/OCM tách vì dữ liệu Wiki hiện có khác ở mô tả kỹ năng.\n\n${families.map((f) => "- " + f.year + " · " + f.variants.map((v) => v.name).join(" / ")).join("\n")}\n\nCác flow mới đọc từ Class Guide. Các nhánh nâng cao về consumable và timing chưa chuyển hết được liệt kê trong báo cáo V12.9.`,
);
updateAudit(
  "CLASS_ART_VARIANT_AUDIT.md",
  `${families.length} Calendar Family có selector artwork, tổng ${families.flatMap((f) => f.variants).length} bản artwork đối chiếu. ShadowWalker, ShadowStalker và ShadowWeaver dùng ba asset riêng. Nguồn, hash và chính sách sử dụng ghi trong calendar-variant-runtime.json, portrait-registry.json và content-sources/v12-6/shadow-family-art.json.`,
);
