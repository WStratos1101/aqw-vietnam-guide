import fs from "node:fs";
import assert from "node:assert/strict";
import { runQa, inspectPage } from "./qa-runtime.mjs";
const profiles = JSON.parse(
  fs.readFileSync("src/content/classes/catalog.json", "utf8"),
);
await runQa(
  "codex-v32",
  async ({ browser, base, result, dir, expect }) => {
    for (const width of [375, 768, 1024, 1440])
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({
          viewport: { width, height: 1000 },
          hasTouch: true,
          reducedMotion: "reduce",
        });
        await page.addInitScript(
          (t) => localStorage.setItem("aqw-theme", t),
          theme,
        );
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        try {
          for (const id of process.argv.includes("--farm-only")
            ? []
            : process.argv.includes("--calendar-only")
              ? [
                  "calendar-timeless-chronomancer",
                  "calendar-underworld-chronomancer",
                ]
              : [
                  "archmage-am",
                  "yami-no-ronin-ynr",
                  "calendar-timeless-chronomancer",
                  "calendar-underworld-chronomancer",
                ]) {
            const profile = profiles.find((p) => p.id === id),
              entry = { classId: id, width, theme, status: "running" };
            result.cases.push(entry);
            try {
              await page.goto(base + "/class/" + profile.slug);
              const tabs = page.getByRole("tablist", {
                name: "Điều hướng hồ sơ Class",
              });
              await tabs
                .getByRole("tab", { name: "HƯỚNG DẪN COMBO", exact: true })
                .click();
              const alternatives = page.locator(".class-combo-tabs button");
              const total = await alternatives.count();
              for (let i = 0; i < Math.max(1, total); i++) {
                if (total) await alternatives.nth(i).click();
                await expect(
                  page
                    .locator(".skill-sequence-flow small")
                    .filter({ hasText: /Slot \d/ }),
                ).toHaveCount(0);
                for (const image of await page
                  .locator(".skill-sequence-flow img")
                  .all()) {
                  await image.scrollIntoViewIfNeeded();
                  await expect
                    .poll(() =>
                      image.evaluate(
                        (img) => img.complete && img.naturalWidth > 0,
                      ),
                    )
                    .toBe(true);
                }
              }
              if (total) await alternatives.first().click();
              const contextButtons = page.locator(
                ".combo-context-actions button",
              );
              assert.ok(
                (await contextButtons.count()) > 0,
                `${id}: retained combo context`,
              );
              const context = contextButtons.first();
              await context.focus();
              await expect(context.locator("[role=tooltip]")).toBeVisible();
              await page.keyboard.press("Enter");
              await expect(context).toHaveAttribute("aria-expanded", "true");
              const panel = page.locator(
                '[id="' + (await context.getAttribute("aria-controls")) + '"]',
              );
              await expect(panel).toBeVisible();
              const sibling = context.locator("xpath=..").getByRole("button");
              if ((await sibling.count()) === 2) {
                await sibling.nth(1).click();
                await expect(context).toHaveAttribute("aria-expanded", "true");
                await expect(sibling.nth(1)).toHaveAttribute(
                  "aria-expanded",
                  "true",
                );
              }
              await expect(
                page.locator(".combo-flow-condition summary"),
              ).toHaveCount(0);
              if (id.startsWith("calendar-")) {
                await tabs
                  .getByRole("tab", { name: "BỘ SKILL", exact: true })
                  .click();
                await expect(page.locator(".calendar-item-choice")).toHaveCount(
                  6,
                );
                await page
                  .getByRole("button", {
                    name: "Chọn Hourglass of Power",
                    exact: true,
                  })
                  .tap();
                await page
                  .getByRole("button", {
                    name: id.includes("timeless")
                      ? "Chọn Foresee Corruption"
                      : "Chọn Timepiece of Inevitability",
                    exact: true,
                  })
                  .tap();
                await expect(page.locator(".calendar-item-detail")).toHaveCount(
                  2,
                );
                await expect(
                  page.locator(".calendar-item-detail").first(),
                ).toContainText(
                  id.includes("timeless")
                    ? "Hourglass Inversion"
                    : "Hourglass Reversal",
                );
              }
              const check = await inspectPage(page);
              assert.equal(check.overflow, false);
              assert.deepEqual(check.brokenImages, []);
              const imagePath = `${dir}/${id}-${width}-${theme}.png`;
              await page.screenshot({ path: imagePath, fullPage: true });
              result.screenshots.push(imagePath);
              entry.status = "passed";
            } catch (error) {
              entry.status = "failed";
              entry.error = error.message;
              throw error;
            }
          }
          const entry = {
            scope: "farm-structured-materials",
            width,
            theme,
            status: "running",
          };
          result.cases.push(entry);
          await page.goto(base + "/farm?item=armor-of-awe");
          await page
            .getByRole("tab", { name: "Nguyên liệu", exact: true })
            .click();
          const summaries = page.locator(".fv2-material-source summary");
          const rightEdges = [];
          for (const summary of await summaries.all()) {
            const b = await summary.locator("strong").boundingBox();
            rightEdges.push(b.x + b.width);
          }
          assert.ok(
            Math.max(...rightEdges) - Math.min(...rightEdges) < 2,
            "Material quantities align",
          );
          const pauldron = summaries.filter({ hasText: "Pauldron Relic" });
          await pauldron.focus();
          await page.keyboard.press("Enter");
          await expect(page.locator(".fv2-material-source[open]")).toHaveCount(
            1,
          );
          await expect(page.locator(".fv2-material-facts table")).toContainText(
            "Ultra Akriloth",
          );
          await expect(page.locator(".fv2-material-facts table")).toContainText(
            "/join gravestrike",
          );
          const region = page.locator(".fv2-material-facts .fv32-table-scroll");
          if (await region.evaluate((el) => el.scrollWidth > el.clientWidth)) {
            await region.focus();
            await page.keyboard.press("ArrowRight");
            await expect
              .poll(() => region.evaluate((el) => el.scrollLeft))
              .toBeGreaterThan(0);
          }
          await expect(page.locator(".fv2-material-facts")).not.toContainText(
            "Nguồn hướng dẫn",
          );
          await expect(page.locator(".fv2-material-facts")).not.toContainText(
            "Nguồn nguyên liệu",
          );
          const check = await inspectPage(page);
          assert.equal(check.overflow, false);
          assert.deepEqual(check.brokenImages, []);
          const imagePath = `${dir}/farm-materials-${width}-${theme}.png`;
          await page.screenshot({ path: imagePath, fullPage: true });
          result.screenshots.push(imagePath);
          entry.status = "passed";
          assert.deepEqual(errors, []);
        } finally {
          await page.close();
        }
      }
  },
  { browserName: "chromium", outputDir: "artifacts/qa/v3-2/recovery-browser" },
);
