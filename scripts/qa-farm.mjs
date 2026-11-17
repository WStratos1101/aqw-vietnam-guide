// FARM_BROWSER=webkit|chromium|firefox; AQW_BROWSER remains a legacy fallback.
import {
  runQa,
  inspectPage,
  selectFarmBrowser,
  formatQaError,
} from "./qa-runtime.mjs";
import assert from "node:assert/strict";
import { lrSteps } from "../tests/fixtures/farm-step-cases.mjs";
import { checkMaterialTable } from "./lib/farm-material-table-qa.mjs";
import { checkFarmSteps } from "./lib/farm-step-qa.mjs";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { fingerprint } from "./qa-farm-local.mjs";
const sourceFingerprint = () => createHash("sha256").update(JSON.stringify(fingerprint())).digest("hex");
const registry = JSON.parse(fs.readFileSync("src/content/farm/quest-workflows.generated.json", "utf8"));
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
    result.profile = "full";
    result.sourceFingerprint = sourceFingerprint();
    result.playwrightVersion = JSON.parse(fs.readFileSync("node_modules/@playwright/test/package.json", "utf8")).version;
    for (const width of [390, 768, 1024, 1440]) {
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
        // WebKit can return a valid conditional-cache response when the same
        // Vite shell is revisited; the rendered-main assertion below still
        // verifies the browser received and rendered the cached document.
        assert.ok(
          response?.ok() || response?.status() === 304,
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
        await step("source-scoped quest steps and farm mode reset", async () => {
          await checkFarmSteps({page,base,expect,screenshot,recordTable:diagnostic=>(result.materialTables ||= []).push(diagnostic)});
          await screenshot("step-regression");
        });
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
          "canonical Class acquisition, retired target exclusion and legacy geography URL",
          async () => {
            await navigate("/farm?region=arcangrove&category=class&item=stonecrusher-merge", '[data-item-id="stonecrusher-merge"]');
            await expect(page.locator('.fv2-categories button').filter({hasText:"Classes"})).toHaveAttribute("aria-pressed","true");
            await expect(page.locator('[data-inventory-item="shaman"]')).toHaveCount(0);
            await expect(page.locator('[data-item-id="stonecrusher-merge"]')).toBeVisible();
            await page.getByRole("tab",{name:"Cách nhận",exact:true}).click();
            await expect(page.locator('.fv2-tab-body[role=tabpanel]')).toContainText("Stonecrusher Class Merge Shop");
            await expect(page.locator('.fv2-specs')).toBeVisible();
            await expect(page.getByRole("tab",{name:"Nguyên liệu",exact:true})).toBeVisible();
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
            const good = page.getByRole("button", {
              name: "Lọc phe phái: GOOD",
              exact: true,
            });
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
        await step("Malgor quest isolation, seven direct materials and responsive Light/Dark guide", async () => {
          for(const theme of ['light','dark']){
            await navigate('/farm?item=malgor-the-shadowlord&farm-tab=methods','[data-item-id="malgor-the-shadowlord"]');
            if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('.theme-toggle').click();
            await page.getByRole('tab',{name:'Cách nhận',exact:true}).click();
            await page.locator('.fv2-method details summary').click();
            await expect(page.locator('.fv2-method details[open]')).toContainText('Your Hero');
            await page.getByRole('tab',{name:'Hướng dẫn Farm',exact:true}).click();
            await expect(page.locator('.fv31-step-numbers button')).toHaveCount(1);
            await expect(page.getByRole('region',{name:'Quest đang chọn',exact:true})).toContainText("Build Malgor's Armor Set");
            await page.getByRole('tab',{name:'Nguyên liệu',exact:true}).click();
            const controls=page.getByRole('group',{name:'Chọn nguyên liệu',exact:true}).getByRole('button');
            assert.deepEqual(await controls.allTextContents(),['Gold Voucher 500k','Timestream Ravager','ShadowFlame Defender','Mana Guardian','Dark Dragon Slayer','Mystical Devotee of Mana',"Dragon's Tear"]);
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Malgor page must not overflow');
            await screenshot('malgor-isolation-'+theme);
          }
        });
        await step("Reaper's Oath Quest alternatives render actual rewards and materials", async () => {
          await navigate("/farm/item/reaper-s-oath?farm-tab=guide", '[data-item-id="reaper-s-oath"]');
          await page.getByRole("tab", { name: "Hướng dẫn Farm", exact: true }).click();
          const choices = page.getByRole("group", { name: "Quest nhận thưởng", exact: true });
          await expect(choices.getByRole("button")).toHaveCount(3);
          for (const name of ["Obsidian Mining", "Soul Forgery", "Undead Legion Member Special"]) {
            const option = choices.getByRole("button", { name, exact: true });
            await expect(option).toBeVisible();
            await option.click();
            await expect(option).toHaveAttribute("aria-pressed", "true");
            const panel = page.getByRole("region", { name: "Quest đang chọn", exact: true });
            await expect(panel).toBeVisible();
            await expect(panel).toContainText(name);
            await expect(panel).toContainText("Reaper's Oath");
            assert.ok(await panel.locator("tbody tr").count(), "selected Quest must show required materials");
          }
          await screenshot("reapers-oath-alternatives");
        });
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
            ).toContainText("Legendary Stonewrit");
            await expect(
              page.locator(".fv2-tab-body[role=tabpanel]"),
            ).not.toContainText("Nostalgia");
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
            await expect(page.locator(".fv2-route-chips button")).toHaveCount(0);
            await expect(page.locator(".fv2-tab-body[role=tabpanel]")).not.toContainText("Nostalgia Quest");
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
            await page.getByRole("group",{name:"Chọn nguyên liệu",exact:true}).getByRole("button",{name:"Exalted Apotheosis",exact:true}).click();
            await expect(page.locator('[data-item-id="dual-exalted-apotheosis"]')).toBeVisible();
            await expect(page.getByRole("region",{name:"Nguyên liệu đang chọn",exact:true})).toContainText("Exalted Apotheosis");
            await expect(page).toHaveURL(/farm-material=exalted-apotheosis/);
          },
        );
        await step(
          "empty search, category filter and mobile back",
          async () => {
            await navigate("/farm?view=reference",".fv2-root");
            if (width <= 720 && await page.locator(".fv2-back").isVisible()) await page.locator(".fv2-back").click();
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
            await page.getByRole("tab",{name:"Cách nhận",exact:true}).click();
            await page.locator(".fv32-workflow-summary").getByRole("button",{name:"Legion Fealty 2",exact:true}).click();
            await expect(page.getByRole("tab",{name:"Hướng dẫn Farm",exact:true})).toHaveAttribute("aria-selected","true");
            await expect(page.locator(".fv31-step-content")).toContainText("Legion Fealty 2");
            await page.goBack();
            await expect(page.getByRole("tab",{name:"Cách nhận",exact:true})).toHaveAttribute("aria-selected","true");
            await page.getByRole("tab",{name:"Hướng dẫn Farm",exact:true}).click();
            // TASK scope: LF1–LF3 farm materials; LF4 remains a separate final receipt.
            await expect(page.locator('[data-item-id]')).toHaveAttribute('data-item-id','legion-revenant-class');
            assert.equal(new URL(page.url()).searchParams.get('farm-route'),'wiki-location');
            await expect(page.getByRole('button',{name:'Farm thông thường',exact:true})).toHaveAttribute('aria-pressed','true');
            await expect(page.locator(".fv31-step-numbers button")).toHaveCount(lrSteps.length);
            await expect(page.locator(".fv31-step-numbers button")).toHaveText(['1','2','3']);

            await page.locator(".fv31-step-numbers button").nth(1).click();
            await expect(page.locator(".fv31-step-content")).toContainText("Cohort Conquered");
            const lf2 = registry.quests["legion-revenant-s-quests:legion-fealty-2"];
            await checkMaterialTable({wrapper:page.locator('.fv31-step-content .fv32-material-table').locator('..'),rows:lf2.rows,modeId:'standard',record:diagnostic=>(result.materialTables ||= []).push(diagnostic)});
            await page.getByRole("button",{name:"Farm bằng Insignia",exact:true}).click();
            await expect(page.locator(".fv32-insignia-sources")).toContainText("31");
            await expect(page.locator('.fv32-insignia-sources a')).toHaveAttribute("href","/ultra-boss/ultra-dage");
            const questTabs=page.locator(".fv31-step-numbers button");
            await questTabs.first().focus();await page.keyboard.press("End");
            await expect(questTabs.last()).toBeFocused();
            await expect(page.locator(".fv31-step-content")).toContainText("Legion Fealty 4");
            const lf3 = registry.quests["legion-revenant-s-quests:legion-fealty-3"];
            await checkMaterialTable({wrapper:page.locator('.fv31-step-content .fv32-material-table').first().locator('..'),rows:lf3.rows,modeId:'insignia',record:diagnostic=>(result.materialTables ||= []).push(diagnostic)});
            await expect(page.locator('section[aria-label="Cách nhận cuối"]')).toHaveCount(1);
            await expect(page.locator('section[aria-label="Cách nhận cuối"]')).toContainText('Legion Fealty 4');
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
            await expect(page.locator(".fv31-step-numbers button")).toHaveCount(0);
            await expect(page.locator(".fv31-step-actions")).toHaveCount(0);
            await expect(page.locator(".fv31-step-content")).toContainText(
              "Merge Blade of Awe",
            );
            await expect(page.locator(".fv2-boost")).toContainText("10%");
            await screenshot("single-step");
          },
        );
        await step("Alternative Hero and Khác keep unique filtered identities", async () => {
          const { default: data } = await import(
            "../src/content/farm/catalog-v2.generated.json",
            { with: { type: "json" } }
          );
          await navigate("/farm?group=alternative-hero&view=reference", ".fv2-root");
          for (const [id, name] of [["alternative-hero", "Alternative Hero"], ["unknown", "Khác"]]) {
            const control = page.getByRole("button", {
              name: `Lọc phe phái: ${name}`,
              exact: true,
            });
            await expect(control).toBeVisible();
            if (id === "unknown") await control.click();
            await expect(page).toHaveURL(new RegExp(`group=${id}(?:&|$)`));
            await expect(control).toHaveAttribute("aria-pressed", "true");
            // Use canonical membership, independently of the UI's groupIds filter.
            // Source-backed collection imports can increase these totals.
            const expected = data.items
              .filter((item) => id === "unknown" ? !item.primaryGroupId : item.primaryGroupId === id)
              .sort((a, b) => a.name.localeCompare(b.name, "en"));
            await expect(control.locator("b")).toHaveText(String(expected.length));
            await expect(page.locator(".fv2-inventory > .fv2-count")).toHaveText(
              `${expected.length} trang bị · ${name}`,
            );
            await expect(page.locator(".fv2-inventory")).toBeVisible();
            await expect(page.locator(".fv2-item")).toHaveCount(Math.min(80, expected.length));
            for (let shown = 80; shown < expected.length; shown += 80) {
              const more = page.getByRole("button", { name: `Xem thêm (${expected.length - shown})`, exact: true });
              await expect(more).toBeVisible();
              await more.click();
              await expect(page.locator(".fv2-item")).toHaveCount(Math.min(shown + 80, expected.length));
            }
            assert.deepEqual(
              await page.locator(".fv2-item").evaluateAll((items) => items.map((item) => item.getAttribute("data-inventory-item"))),
              expected.map((item) => item.id),
              `${name}: exact canonical identities in name order`,
            );
            await expect(page.locator(".fv2-more")).toHaveCount(0);
          }
        });
        await step("keyboard, screenshot, images and overflow", async () => {
          await navigate("/farm?item=legion-revenant-class","[data-item-id=legion-revenant-class]");
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
    result.sourceUnchangedOnCompletion = sourceFingerprint() === result.sourceFingerprint;
    assert.equal(result.sourceUnchangedOnCompletion, true, "Source changed during UI QA");
  },
  {
    browserName: selectFarmBrowser(),
    outputDir: process.env.AQW_FARM_QA_OUTPUT || "artifacts/qa/v3-2/farm/" + selectFarmBrowser(),
  },
);
