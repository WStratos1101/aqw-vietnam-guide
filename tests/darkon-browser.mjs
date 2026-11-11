import { chromium, webkit, expect } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.AQW_QA_URL || "http://127.0.0.1:4181";
const report = { status: "running", contexts: [], errors: [], base };
await fs.mkdir("qa/v12-darkon", { recursive: true });
let browser;
try {
  browser = await (
    process.env.AQW_BROWSER === "webkit" ? webkit : chromium
  ).launch();
  for (const width of [375, 768, 1440, 1920])
    for (const theme of ["dark", "light"]) {
      const page = await browser.newPage({
        viewport: { width, height: 1100 },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.addInitScript(
        (t) => localStorage.setItem("aqw-theme", t),
        theme,
      );
      await page.goto(base + "/ultra-boss/darkon-the-conductor");
      const inspection = page.locator(".enemy-inspection");
      const phases = inspection.getByRole("group", { name: "Chọn phase" });
      await expect(phases.getByRole("button")).toHaveCount(4);
      await expect(
        phases.getByRole("button", { name: "1 OVERTURE" }),
      ).toHaveAttribute("aria-pressed", "true");
      const globals = await inspection
        .locator(".boss-global-timeline")
        .innerText();
      for (const [i, name] of [
        "OVERTURE",
        "RECITATIVE",
        "MADNESS",
        "RUSH",
      ].entries()) {
        await phases.getByRole("button", { name: `${i + 1} ${name}` }).click();
        await inspection
          .getByRole("tab", { name: "THÔNG SỐ", exact: true })
          .click();
        await expect(inspection.locator(".attack-damage-row")).toHaveCount(5); // header + Auto/Special 1/Special 2/Curtain Call
        await expect(inspection.locator(".attack-damage-table")).toContainText(
          "90% HP hiện tại",
        );
        await expect(inspection.locator(".enemy-status-card")).toContainText(
          "22.222.222",
        );
        await expect(inspection.locator(".phase-combat-notes")).toContainText(
          [
            "Melancholic Melodies",
            "Realm of the Arcana",
            "The Last Symphony",
            "The Last Symphony",
          ][i],
        );
        await inspection
          .getByRole("tab", { name: "KỸ NĂNG", exact: true })
          .click();
        const entries = inspection.locator(".enemy-skill-entry");
        await expect(entries).toHaveCount(i === 3 ? 6 : 7);
        for (const n of ["Special 1", "Special 2"])
          await expect(
            entries.filter({
              has: page.locator("summary strong", {
                hasText: new RegExp("^" + n + "$"),
              }),
            }),
          ).toHaveCount(1);
        const auto = entries.filter({
          has: page.locator("summary strong", { hasText: /^Auto Attack$/ }),
        });
        await auto.locator("summary").click();
        await expect(auto).toContainText(
          [
            "Melancholic Melodies",
            "Realm of the Arcana",
            "Requiem for the Wicked",
            "Requiem for the Wicked",
          ][i],
        );
        await inspection
          .getByRole("tab", { name: "PASSIVE SKILL", exact: true })
          .click();
        await expect(
          inspection
            .locator(".passive-compact")
            .filter({ has: page.locator("h4", { hasText: "Boss Shield" }) }),
        ).toHaveCount(1);
        await expect(inspection.locator(".passive-compact")).toHaveCount(
          [5, 7, 10, 5][i],
        );
        if (i === 3) {
          await expect(
            inspection.locator(".passive-compact h4", { hasText: /^A Major$/ }),
          ).toHaveCount(0);
          await expect(
            inspection.locator(".passive-compact").last(),
          ).toContainText("Requiem for the Wicked");
        }
        expect(
          await inspection.locator(".boss-global-timeline").innerText(),
        ).toEqual(globals);
        await inspection.screenshot({
          path: `qa/v12-darkon/${width}-${theme}-${name.toLowerCase()}.png`,
        });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBe(true);
      }
      await page.locator(".ultra-team-toggle").first().click();
      await expect(
        page
          .locator(".ultra-team")
          .first()
          .getByRole("button", { name: "4 RUSH" }),
      ).toHaveAttribute("aria-pressed", "true");
      await page
        .locator(".ultra-team")
        .first()
        .getByRole("button", { name: "2 RECITATIVE" })
        .click();
      await expect(
        phases.getByRole("button", { name: "2 RECITATIVE" }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.reload();
      await expect(
        phases.getByRole("button", { name: "1 OVERTURE" }),
      ).toHaveAttribute("aria-pressed", "true");
      const broken = await page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.filter((i) => i.complete && !i.naturalWidth).map((i) => i.src),
        );
      expect(broken).toEqual([]);
      expect(errors).toEqual([]);
      report.contexts.push({ width, theme, phases: 4, status: "passed" });
      await page.close();
    }
  report.status = "passed";
} catch (e) {
  report.status = browser ? "failed" : "blocked";
  report.errors.push(e.message);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await fs.writeFile(
    "qa/v12-darkon/browser-report.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log({
  status: report.status,
  contexts: report.contexts.length,
  errors: report.errors.map((e) => e.slice(0, 350)),
});
