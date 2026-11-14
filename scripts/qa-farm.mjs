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
    for (const width of [375, 768, 1024, 1440]) {
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
        await step(
          "load active Farm V2 inventory and canonical counts",
          async () => {
            await navigate("/farm", ".fv2-root");
            const { default: data } = await import(
              "../src/content/farm/catalog-v2.generated.json",
              { with: { type: "json" } }
            );
            await expect(
              page
                .locator(".fv2-count")
                .filter({ hasText: /\d+\s+trang bị(?:\s|·|$)/ }),
            ).toContainText(`${data.items.length} trang bị`);
            await expect(
              page.locator(".fv2-groups button").first().locator("b"),
            ).toHaveText(String(data.items.length));
          },
        );
        await step(
          "legacy geography URL → Shaman acquisition/source and conditional tabs",
          async () => {
            await navigate(
              "/farm?region=arcangrove&category=class&item=shaman",
              '[data-item-id="shaman"]',
            );
            await expect(
              page
                .locator(".fv2-categories button")
                .filter({ hasText: "Classes" }),
            ).toHaveAttribute("aria-pressed", "true");
            await expect(page.locator(".fv2-item")).toHaveCount(1);
            await expect(
              page.locator('[data-inventory-item="shaman"]'),
            ).toHaveAttribute("aria-pressed", "true");
            await expect(page.locator('[data-item-id="shaman"]')).toBeVisible();
            await expect(
              page.getByRole("tab", { name: "Nguyên liệu", exact: true }),
            ).toHaveCount(0);
            await page
              .getByRole("tab", { name: "Cách nhận", exact: true })
              .click();
            await expect(
              page.locator(".fv2-tab-body[role=tabpanel]"),
            ).toContainText("Arcangrove Rank 10");
            await expect(page.locator(".fv2-sources")).toHaveCount(0);
            await expect(
              page.locator(".fv2-tab-body[role=tabpanel]"),
            ).toContainText("Arcangrove Rep Shop");
            await expect(page.locator(".fv2-specs")).toBeVisible();
          },
        );
        await step(
          "group navigation, category counts, keyboard and browser history",
          async () => {
            await navigate(
              "/farm?group=awe&category=weapon&item=blade-of-awe",
              '[data-item-id="blade-of-awe"]',
            );
            await expect(
              page.locator(".fv2-groups button[aria-pressed=true]"),
            ).toContainText("AWE");
            const good = page
              .locator(".fv2-groups button")
              .filter({ hasText: "GOOD" });
            // The group selector remains available even on a mobile detail deep link.
            await expect(
              good,
              "Faction switcher must remain visible in item detail",
            ).toBeVisible();
            await good.focus();
            await expect(good).toBeFocused();
            await good.press("Enter");
            await expect(page).toHaveURL(/group=good/);
            await expect(good).toHaveAttribute("aria-pressed", "true");
            const { default: groupData } = await import(
              "../src/content/farm/catalog-v2.generated.json",
              { with: { type: "json" } }
            );
            const goodItems = groupData.items.filter((item) =>
              item.groupIds.includes("good"),
            );
            await expect(good.locator("b")).toHaveText(
              String(goodItems.length),
            );
            for (const category of await page
              .locator(".fv2-categories button")
              .all()) {
              const label = await category.getAttribute("aria-label");
              const count = goodItems.filter(
                (item) => label === "Tất cả" || item.category === label,
              ).length;
              await expect(category.locator("small")).toHaveText(String(count));
            }
            await expect(
              page.locator(".fv2-categories button[aria-pressed=true]"),
            ).toContainText("Weapons");
            await page.goBack();
            await expect(page).toHaveURL(
              /group=awe&category=weapon&item=blade-of-awe/,
            );
            await expect(
              page.locator('[data-item-id="blade-of-awe"]'),
            ).toBeVisible();
            await expect(
              page.locator(".fv2-groups button[aria-pressed=true]"),
            ).toContainText("AWE");
            await expect(good).toBeVisible();
            await page.goForward();
            await expect(
              page.locator(".fv2-groups button[aria-pressed=true]"),
            ).toContainText("GOOD");
            await screenshot("group-selector");
          },
        );
        await step("item direct route and image fallback", async () => {
          await navigate(
            "/farm/item/sin-of-the-abyss",
            '[data-item-id="sin-of-the-abyss"]',
          );
          const image = page.locator(".fv2-image-large img");
          await expect(image).toHaveCount(1);
          await image.evaluate((img) => img.dispatchEvent(new Event("error")));
          await expect(
            page.locator(".fv2-image-large .fv2-placeholder"),
          ).toBeVisible();
        });
        await step(
          "all detail tabs, materials, expansion and persisted checklist",
          async () => {
            await navigate(
              "/farm?region=greenguard-forest&category=cape&view=now&item=cape-of-awe",
              '[data-item-id="cape-of-awe"]',
            );
            for (const name of [
              "Thông tin",
              "Cách nhận",
              "Nguyên liệu",
              "Hướng dẫn Farm",
            ]) {
              await page.getByRole("tab", { name, exact: true }).click();
              await expect(
                page.locator(".fv2-tab-body[role=tabpanel]"),
              ).toBeVisible();
              await expect(page.locator(".fv2-specs")).toBeVisible();
              if (name === "Nguyên liệu") {
                await page.locator(".material-tree input").first().check();
                await page
                  .locator(".fv2-material-source summary")
                  .first()
                  .click();
                await expect(
                  page.locator(".fv2-material-source[open]"),
                ).toHaveCount(1);
              }
              await screenshot("tab-" + name.replaceAll(" ", "-"));
            }
            await page.reload();
            await page
              .getByRole("tab", { name: "Nguyên liệu", exact: true })
              .click();
            await expect(
              page.locator(".material-tree input").first(),
            ).toBeChecked();
          },
        );
        await step(
          "canonical multi-route item filters known and unknown Region precisely",
          async () => {
            await navigate(
              "/farm?item=blade-of-awe&region=unknown-region",
              '[data-item-id="blade-of-awe"]',
            );
            await page
              .getByRole("tab", { name: "Nguyên liệu", exact: true })
              .click();
            await expect(
              page.locator(".fv2-tab-body[role=tabpanel]"),
            ).toContainText("Dual Blades of Awe");
            await expect(
              page.locator(".fv2-tab-body[role=tabpanel]"),
            ).not.toContainText("Legendary Stonewrit");
            await navigate(
              "/farm?item=blade-of-awe&region=greenguard-forest",
              '[data-item-id="blade-of-awe"]',
            );
            await page
              .getByRole("tab", { name: "Nguyên liệu", exact: true })
              .click();
            await expect(
              page.locator(".fv2-tab-body[role=tabpanel]"),
            ).toContainText("Legendary Stonewrit");
            await expect(
              page.locator(".fv2-tab-body[role=tabpanel]"),
            ).not.toContainText("Dual Blades of Awe");
            await navigate(
              "/farm?item=blade-of-awe",
              '[data-item-id="blade-of-awe"]',
            );
            await page
              .getByRole("tab", { name: "Cách nhận", exact: true })
              .click();
            await expect(page.locator(".fv2-route-chips button")).toHaveCount(
              2,
            );
            await page.locator(".fv2-route-chips button").nth(1).click();
            await expect(
              page.locator(".fv2-tab-body[role=tabpanel]"),
            ).toContainText("Nostalgia Quest");
          },
        );
        await step(
          "material internal navigation restores item and filter state",
          async () => {
            await navigate(
              "/farm?item=dual-exalted-apotheosis&category=weapon&region=unknown-region",
              '[data-item-id="dual-exalted-apotheosis"]',
            );
            await page
              .getByRole("tab", { name: "Nguyên liệu", exact: true })
              .click();
            await page
              .locator(".fv2-material-source summary")
              .filter({ hasText: "Exalted Apotheosis" })
              .click();
            await page
              .locator(".fv2-material-source button")
              .filter({ hasText: "Exalted Apotheosis" })
              .click();
            await expect(
              page.locator('[data-item-id="exalted-apotheosis"]'),
            ).toBeVisible();
            await page.locator(".fv2-return").click();
            await expect(
              page.locator('[data-item-id="dual-exalted-apotheosis"]'),
            ).toBeVisible();
            await expect(page).toHaveURL(/region=unknown-region/);
            await navigate(
              "/farm?item=blade-of-awe",
              '[data-item-id="blade-of-awe"]',
            );
          },
        );
        await step(
          "empty search, category filter and mobile back",
          async () => {
            if (width <= 720) await page.locator(".fv2-back").click();
            await page
              .getByLabel("Tìm trang bị", { exact: true })
              .fill("no-matching-equipment");
            await expect(page.locator(".fv2-item")).toHaveCount(0);
            await expect(page.locator(".fv2-empty")).toBeVisible();
            await page.getByLabel("Tìm trang bị", { exact: true }).fill("");
            await page
              .locator(".fv2-categories button")
              .filter({ hasText: "Armors" })
              .click();
            await page
              .locator(".fv2-item")
              .filter({ hasText: "Armor of Awe" })
              .click();
            await expect(
              page.locator('[data-item-id="armor-of-awe"]'),
            ).toBeVisible();
          },
        );
        await step(
          "V3.1 localized Wiki details, selected guide step and shared Role filter",
          async () => {
            await navigate(
              "/farm?item=legion-revenant-class",
              '[data-item-id="legion-revenant-class"]',
            );
            await expect(
              page.getByRole("tab", { name: "Nguồn", exact: true }),
            ).toHaveCount(0);
            await expect(page.locator(".fv31-wiki-info")).toContainText(
              "Wizard",
            );
            await page
              .getByRole("tab", { name: "Hướng dẫn Farm", exact: true })
              .click();
            await expect(page.locator(".fv31-step-numbers button")).toHaveCount(
              11,
            );
            await expect(page.locator(".fv31-step-content")).toContainText(
              "Điều kiện mở khóa",
            );
            await page
              .locator(".fv31-step-actions")
              .getByRole("button", { name: "Tiếp", exact: true })
              .click();
            await expect(page.locator(".fv31-step-content")).toContainText(
              "Aeacus",
            );
            await page
              .getByRole("button", {
                name: "Ultra Dage · bổ sung",
                exact: true,
              })
              .click();
            await expect(page.locator(".fv31-step-numbers button")).toHaveCount(
              2,
            );
            await expect(page.locator(".fv31-step-content")).toContainText(
              "Nguồn bổ sung",
            );
            await screenshot("v31-stepper");
            await navigate(
              "/farm?category=Classes&subtype=Support",
              ".fv2-root",
            );
            if (width <= 720 && (await page.locator(".fv2-back").isVisible()))
              await page.locator(".fv2-back").click();
            await expect(
              page.getByLabel("Role Class", { exact: true }),
            ).toHaveValue("Support");
            await screenshot("v31-class-role");
            await navigate(
              "/farm?item=blade-of-awe",
              '[data-item-id="blade-of-awe"]',
            );
          },
        );
        await step(
          "Farming Codex themes, faction tokens, icons, A–Z and single-step",
          async () => {
            await navigate("/farm", ".fv2-root");
            await expect(page.locator(".fv2-top h1")).toHaveText(
              "Farming Codex",
            );
            await expect(
              page.getByLabel("Sắp xếp", { exact: true }),
            ).toHaveCount(0);
            await expect(
              page.getByLabel("Phạm vi availability", { exact: true }),
            ).toHaveCount(0);
            const names = await page
              .locator(".fv2-item strong")
              .allTextContents();
            assert.deepEqual(
              names,
              [...names].sort((a, b) => a.localeCompare(b, "en")),
            );
            for (const theme of ["light", "dark"]) {
              if (
                (await page.locator("html").getAttribute("data-theme")) !==
                theme
              )
                await page.locator(".theme-toggle").click();
              const accents = new Set();
              for (const group of ["GOOD", "LEGION", "NATION", "CHAOS"]) {
                const control = page
                  .locator(".fv2-groups button")
                  .filter({ hasText: group });
                await control.click();
                await expect(control).toHaveAttribute("aria-pressed", "true");
                const colors = await page
                  .locator(".fv2-root")
                  .evaluate((el) => {
                    const s = getComputedStyle(el);
                    const rgb = (v) =>
                      v
                        .match(/[\d.]+/g)
                        .slice(0, 3)
                        .map(Number);
                    const luminance = (v) =>
                      rgb(v)
                        .map((n) => {
                          const c = n / 255;
                          return c <= 0.04045
                            ? c / 12.92
                            : ((c + 0.055) / 1.055) ** 2.4;
                        })
                        .reduce(
                          (n, c, i) => n + c * [0.2126, 0.7152, 0.0722][i],
                          0,
                        );
                    const ink = luminance(s.color),
                      paper = luminance(s.backgroundColor);
                    const link = getComputedStyle(
                      el.querySelector(".fv2-detail a"),
                    );
                    return {
                      accent: s.getPropertyValue("--fv2-accent").trim(),
                      bg: s.backgroundColor,
                      contrast:
                        (Math.max(ink, paper) + 0.05) /
                        (Math.min(ink, paper) + 0.05),
                      linkColor: link.color,
                    };
                  });
                assert.ok(
                  colors.contrast >= 4.5,
                  `${theme} ${group} body contrast`,
                );
                assert.equal(
                  colors.bg,
                  theme === "light" ? "rgb(247, 246, 240)" : "rgb(16, 17, 18)",
                );
                accents.add(colors.accent);
                await screenshot(`theme-${theme}-${group}`);
              }
              assert.equal(accents.size, 4);
            }
            await navigate("/farm?category=Weapons", ".fv2-root");
            if (width <= 720 && (await page.locator(".fv2-back").isVisible()))
              await page.locator(".fv2-back").click();
            const axe = page.locator('.fv2-subtypes button[aria-label="Axe"]');
            await axe.focus();
            await page.keyboard.press("Enter");
            await expect(axe).toHaveAttribute("aria-pressed", "true");
            await expect(page).toHaveURL(/subtype=Axe/);
            for (const icon of await page.locator(".fv2-type-icon").all())
              assert.ok(
                await icon.evaluate(
                  (img) => img.complete && img.naturalWidth > 0,
                ),
                "Verified local icon loaded",
              );
            await navigate(
              "/farm?item=blade-of-awe&region=unknown-region",
              '[data-item-id="blade-of-awe"]',
            );
            await page
              .getByRole("tab", { name: "Hướng dẫn Farm", exact: true })
              .click();
            await expect(page.locator(".fv31-step-numbers")).toHaveCount(0);
            await expect(page.locator(".fv31-step-actions")).toHaveCount(0);
            await expect(page.locator(".fv31-step-content")).toContainText(
              "Merge Blade of Awe",
            );
            await expect(page.locator(".fv2-boost")).toContainText("10%");
            await screenshot("single-step");
          },
        );
        await step("keyboard, screenshot, images and overflow", async () => {
          await page
            .getByRole("tab", { name: "Thông tin", exact: true })
            .focus();
          await page.keyboard.press("End");
          await expect(
            page.getByRole("tab", { name: "Hướng dẫn Farm", exact: true }),
          ).toBeFocused();
          await expect(
            page.getByRole("tab", { name: "Hướng dẫn Farm", exact: true }),
          ).toHaveAttribute("aria-selected", "true");
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
  {
    browserName: selectFarmBrowser(),
    outputDir: "artifacts/qa/v3-2/farm",
  },
);
