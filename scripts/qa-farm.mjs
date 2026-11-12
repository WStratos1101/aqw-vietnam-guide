// FARM_BROWSER=webkit|chromium|firefox; AQW_BROWSER remains a legacy fallback.
import {
  runQa,
  inspectPage,
  selectFarmBrowser,
  formatQaError,
} from "./qa-runtime.mjs";
import assert from "node:assert/strict";
export const farmSmokeRoutes = [
  { path: "/farm/necrotic-sword-of-doom-nsod", selector: "main .article-body" },
  { path: "/class", selector: "main.class-directory" },
  { path: "/ultra-boss", selector: "main.ultra-directory" },
  { path: "/challenge-dungeon", selector: "main.challenge-directory" },
  { path: "/other-challenges", selector: "main.challenge-directory" },
];
await runQa(
  "farm",
  async ({ browser, base, result, dir, expect }) => {
    for (const width of [375, 768, 1440]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      page.setDefaultTimeout(15000);
      const errors = [];
      const currentCase = {
        width,
        status: "running",
        steps: [],
        consoleErrors: errors,
      };
      result.cases.push(currentCase);
      page.on("pageerror", (error) =>
        errors.push(error.stack || error.message),
      );
      page.on("console", (message) => {
        if (message.type() === "error")
          errors.push(`${page.url()}: ${message.text()}`);
      });
      const step = async (name, action) => {
        result.currentStep = { width, name, url: page.url() };
        try {
          await action();
          currentCase.steps.push({ name, status: "passed", url: page.url() });
        } catch (error) {
          currentCase.steps.push({ name, status: "failed", url: page.url() });
          result.currentStep.url = page.url();
          throw error;
        }
      };
      const navigate = async (path, selector) => {
        const response = await page.goto(base + path);
        assert.ok(
          response?.ok(),
          `${path}: HTTP ${response?.status() ?? "no response"}`,
        );
        assert.equal(
          new URL(page.url()).pathname,
          path.split("?")[0],
          `Unexpected redirect from ${path}`,
        );
        // Vite serves a client shell: goto(load) does not guarantee React has rendered main.
        await expect(
          page.locator("main#main"),
          `Rendered main for ${path}`,
        ).toBeVisible();
        await expect(
          page.locator(selector),
          `Expected route content for ${path}`,
        ).toBeVisible();
        await expect(
          page.locator("main h1"),
          `Route heading for ${path}`,
        ).toHaveCount(1);
      };
      const screenshot = async (name) => {
        const path = `${dir}/${name}-${width}.png`;
        await page.screenshot({ path, fullPage: true });
        result.screenshots.push(path);
      };
      try {
        await step("load Farm inventory", () =>
          navigate("/farm", ".farm-codex"),
        );
        await step("Region → class → Shaman acquisition/source", async () => {
          if (width <= 1100)
            await page
              .locator(".farm-mobile-region select")
              .selectOption("arcangrove");
          else
            await page
              .locator(".farm-region-list button")
              .filter({ hasText: "Arcangrove" })
              .click();
          await expect(page.locator(".farm-item-row")).toHaveCount(1);
          await page
            .locator(".farm-item-row")
            .filter({ hasText: "Shaman" })
            .click();
          await expect(page.locator('[data-item-id="shaman"]')).toBeVisible();
          await expect(page.locator(".farm-detail")).toContainText(
            "Arcangrove Rank 10",
          );
          await expect(
            page
              .locator(
                '.farm-detail a[href="https://aqwwiki.wikidot.com/arcangrove-rep-shop"]',
              )
              .first(),
          ).toBeAttached();
          await expect(
            page.locator('.farm-type-tabs button[aria-pressed="true"]'),
          ).toContainText("Classes");
        });
        await step("item direct route and image fallback", async () => {
          await navigate(
            "/farm/item/sin-of-the-abyss",
            '[data-item-id="sin-of-the-abyss"]',
          );
          const image = page.locator(".farm-preview img");
          if (await image.count())
            await image.evaluate((img) =>
              img.dispatchEvent(new Event("error")),
            );
          await expect(
            page.locator(".farm-preview .farm-art-fallback"),
          ).toBeVisible();
        });
        await step("query route, recipe and persisted checklist", async () => {
          await navigate(
            "/farm?region=greenguard-forest&category=cape&view=now&item=cape-of-awe",
            '[data-item-id="cape-of-awe"]',
          );
          await expect(page.locator(".farm-detail")).toContainText(
            "Cape Relic",
          );
          await page.locator(".material-tree input").first().check();
          await page.reload();
          await expect(
            page.locator('[data-item-id="cape-of-awe"]'),
          ).toBeVisible();
          await expect(
            page.locator(".material-tree input").first(),
          ).toBeChecked();
        });
        await step("empty search and category filtering", async () => {
          if (width <= 640) await page.locator(".farm-mobile-back").click();
          await page
            .getByLabel("Tìm trang bị trong mọi Region")
            .fill("no-matching-equipment");
          await expect(page.locator(".farm-item-row")).toHaveCount(0);
          await expect(
            page.locator(".farm-list-pane .farm-empty"),
          ).toBeVisible();
          await page.getByLabel("Tìm trang bị trong mọi Region").fill("");
          await page
            .locator(".farm-type-tabs button")
            .filter({ hasText: "Armors" })
            .click();
          await expect(page.locator(".farm-item-row")).toHaveCount(1);
          await page
            .locator(".farm-item-row")
            .filter({ hasText: "Armor of Awe" })
            .click();
          await expect(
            page.locator('[data-item-id="armor-of-awe"]'),
          ).toBeVisible();
        });
        await step("keyboard, screenshot, images and overflow", async () => {
          await page.keyboard.press("Tab");
          assert.ok(
            await page.evaluate(() => document.activeElement !== document.body),
            "Tab must focus a control",
          );
          const measure = await inspectPage(page);
          Object.assign(currentCase, measure);
          await screenshot("inventory");
          assert.equal(
            measure.overflow,
            false,
            `Horizontal overflow at ${width}px`,
          );
          assert.deepEqual(
            measure.brokenImages,
            [],
            `Broken images at ${width}px`,
          );
        });
        for (const route of farmSmokeRoutes)
          await step(`route ${route.path}`, () =>
            navigate(route.path, route.selector),
          );
        await step("no console, hydration or page errors", async () =>
          assert.deepEqual(errors, [], `Browser errors at ${width}px`),
        );
        currentCase.status = "passed"; // Only after every route and assertion succeeds.
      } catch (error) {
        currentCase.status = "failed";
        try {
          await screenshot("failure");
        } catch (captureError) {
          currentCase.screenshotError =
            captureError.stack || String(captureError);
        }
        throw error;
      } finally {
        try {
          await page.close();
        } catch (cleanupError) {
          currentCase.pageCleanupError = formatQaError(cleanupError);
          if (currentCase.status === "failed")
            console.error(
              `[QA farm] page cleanup at ${width}px\n${currentCase.pageCleanupError}`,
            );
          else {
            currentCase.status = "failed";
            throw cleanupError;
          }
        }
      }
    }
  },
  { browserName: selectFarmBrowser() },
);
