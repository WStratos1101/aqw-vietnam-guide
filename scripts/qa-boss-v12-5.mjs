import fs from "node:fs";
import { runQa, inspectPage } from "./qa-runtime.mjs";
const raw = JSON.parse(fs.readFileSync("src/content/ultra/bosses.json")),
  recovery = JSON.parse(fs.readFileSync("src/content/ultra/recovery.json")),
  bosses = [...raw, ...recovery.bosses],
  strategies = JSON.parse(
    fs.readFileSync("src/content/ultra/speaker-strategies.json"),
  );
const darkon = bosses.find((b) => b.slug === "darkon-the-conductor"),
  speaker = bosses.find((b) => b.slug === "ultra-speaker");
if (!darkon || !speaker) throw Error("Current Boss routes missing");
await runQa("boss-v12-5", async ({ browser, base, result, dir, expect }) => {
  for (const width of [375, 768, 1440, 1920])
    for (const theme of ["dark", "light"]) {
      const page = await browser.newPage({
          viewport: { width, height: 1000 },
          reducedMotion: "reduce",
        }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.addInitScript(
        (t) => localStorage.setItem("aqw-theme", t),
        theme,
      );
      const item = { width, theme, status: "not_run" };
      result.cases.push(item);
      try {
        await page.goto(base + "/ultra-boss");
        const font = await page
          .locator(".codex-display")
          .first()
          .evaluate((el) => {
            const s = getComputedStyle(el);
            return [
              s.fontFamily,
              s.fontWeight,
              s.fontStyle,
              Math.round(
                (parseFloat(s.letterSpacing) / parseFloat(s.fontSize)) * 1000,
              ) / 1000,
            ];
          });
        await page.goto(base + "/ultra-boss/" + darkon.slug);
        const title = page.locator(".boss-display-title");
        const actual = await title.evaluate((el) => {
          const s = getComputedStyle(el);
          return [
            s.fontFamily,
            s.fontWeight,
            s.fontStyle,
            Math.round(
              (parseFloat(s.letterSpacing) / parseFloat(s.fontSize)) * 1000,
            ) / 1000,
          ];
        });
        expect(actual).toEqual(font);
        for (const [id, label] of [
          ["overture", "1 OVERTURE"],
          ["recitative", "2 RECITATIVE"],
          ["madness", "3 MADNESS"],
          ["rush", "4 RUSH"],
        ]) {
          await page
            .getByRole("group", { name: "Chọn phase" })
            .getByRole("button", { name: label })
            .click();
          const indicator = page.locator("[data-phase-indicator]");
          await expect(indicator).toHaveAttribute("data-phase-indicator", id);
          if (id === "overture" || id === "recitative")
            await expect(indicator.locator("[data-hp-marker]")).toHaveAttribute(
              "data-hp-marker",
              id === "overture" ? "70" : "20",
            );
          if (id === "madness") await expect(indicator).toContainText("90% HP");
          if (id === "rush")
            await expect(indicator.locator("[data-hp-marker]")).toHaveCount(0);
          expect(
            await page.locator(".enemy-inspection").innerText(),
          ).not.toMatch(
            /Nguồn: Challenge Boss Guide|Docs khuyến cáo|Overture · Overture/,
          );
          const check = await inspectPage(page);
          expect(check.overflow).toBe(false);
          expect(check.brokenImages).toEqual([]);
          const file = `darkon-${id}-${width}-${theme}.png`;
          await page.screenshot({ path: dir + "/" + file, fullPage: true });
          result.screenshots.push(file);
        }
        await page.goto(base + "/ultra-boss/" + speaker.slug);
        const board = page.locator(".speaker-tactical-board");
        await expect(
          board.locator(".speaker-team-selector button"),
        ).toHaveCount(6);
        for (const s of strategies) {
          await board
            .getByRole("button", {
              name: s.name.toUpperCase() + " · " + s.label,
            })
            .click();
          await expect(board).toHaveAttribute("data-speaker-team", s.id);
          await expect(board.locator("[data-step]").first()).toHaveAttribute(
            "data-step",
            "1",
          );
          await expect(
            page.locator(".speaker-formation .team-role-card"),
          ).toHaveCount(4);
          const orders = [];
          const buttons = board.locator(".rotation-phase-buttons button");
          for (let p = 0; p < (await buttons.count()); p++) {
            if (await buttons.first().isVisible()) await buttons.nth(p).click();
            else
              await board
                .locator(".rotation-phase-select select")
                .selectOption(String(p));
            orders.push(
              ...(await board
                .locator("[data-step]")
                .evaluateAll((es) => es.map((e) => Number(e.dataset.step)))),
            );
          }
          expect(orders).toEqual(s.rotationSteps.map((s) => s.order));
          const alternative = page
            .locator(".speaker-formation .team-slot-alternatives button")
            .last();
          if (await alternative.count()) {
            await alternative.click();
            await expect(alternative).toHaveAttribute("aria-pressed", "true");
          }
          const check = await inspectPage(page);
          expect(check.overflow).toBe(false);
          expect(check.brokenImages).toEqual([]);
          const file = `speaker-${s.id}-${width}-${theme}.png`;
          await page.screenshot({ path: dir + "/" + file, fullPage: true });
          result.screenshots.push(file);
        }
        await page.evaluate(() =>
          localStorage.setItem("qa:v12-5:navigation-progress", "retained"),
        );
        await page.locator(".ultra-back").click();
        await expect(page).toHaveURL(base + "/ultra-boss");
        await expect(page.locator(".ultra-directory")).toBeVisible();
        expect(
          await page.evaluate(() =>
            localStorage.getItem("qa:v12-5:navigation-progress"),
          ),
        ).toBe("retained");
        expect(errors).toEqual([]);
        item.status = "passed";
      } catch (e) {
        item.status = "failed";
        item.error = e.message;
        item.consoleErrors = errors;
      } finally {
        await page.close();
      }
    }
});
