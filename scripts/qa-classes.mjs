import fs from "node:fs";
import { runQa, inspectPage } from "./qa-runtime.mjs";
const catalog = JSON.parse(fs.readFileSync("src/content/classes/catalog.json"));
const representative = [
  "void-highlord",
  "legion-revenant",
  "lord-of-order",
  "archpaladin",
  "dragon-of-time",
  "chaos-avenger",
].map((prefix) => catalog.find((c) => c.slug.startsWith(prefix)));
if (representative.some((c) => !c))
  throw Error("Representative Class missing from current catalog");
await runQa("classes", async ({ browser, base, result, dir, expect }) => {
  for (const width of [375, 768, 1440, 1920])
    for (const theme of ["dark", "light"]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      await page.addInitScript(
        (t) => localStorage.setItem("aqw-theme", t),
        theme,
      );
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      const directoryCase = {
        route: "/class",
        width,
        theme,
        status: "not_run",
      };
      result.cases.push(directoryCase);
      try {
        await page.goto(base + "/class");
        await expect(
          page.getByRole("heading", { name: "Class Codex", exact: true }),
        ).toBeVisible();
        await expect(page.locator(".class-card").first()).toBeVisible();
        await page
          .getByRole("searchbox", { name: "Tìm tên Class" })
          .fill("ArchPaladin");
        await expect(page.locator(".class-card")).toHaveCount(1);
        await page.getByRole("searchbox", { name: "Tìm tên Class" }).fill("");
        await page
          .getByRole("group", { name: "Lọc nhanh vai trò" })
          .getByRole("button", { name: "Tank", exact: true })
          .click();
        const tankCount = catalog.filter((c) => c.role.includes("Tank")).length;
        await expect(page.locator(".class-card")).toHaveCount(
          Math.min(24, tankCount),
        );
        await page
          .getByRole("group", { name: "Lọc nhanh vai trò" })
          .getByRole("button", { name: "Tất cả", exact: true })
          .click();
        const check = await inspectPage(page);
        expect(check.overflow).toBe(false);
        expect(check.brokenImages).toEqual([]);
        const file = `directory-${width}-${theme}.png`;
        await page.screenshot({ path: dir + "/" + file, fullPage: true });
        result.screenshots.push(file);
        directoryCase.status = "passed";
      } catch (e) {
        directoryCase.status = "failed";
        directoryCase.error = e.message;
      }
      for (const c of representative) {
        const item = {
          route: "/class/" + c.slug,
          width,
          theme,
          status: "not_run",
        };
        result.cases.push(item);
        try {
          await inspectClass(page, c, expect);
          const tabs = page.getByRole("tablist", {
            name: "Điều hướng hồ sơ Class",
          });
          await tabs
            .getByRole("tab", { name: "BỘ SKILL", exact: true })
            .focus();
          await page.keyboard.press("End");
          await expect(
            page.locator('[data-class-panel="acquisition"]'),
          ).toBeVisible();
          await page.keyboard.press("Home");
          await expect(
            page.locator('[data-class-panel="skills"]'),
          ).toBeVisible();

          for (const [panel, label] of [
            ["skills", "BỘ SKILL"],
            ["combo", "HƯỚNG DẪN COMBO"],
            ["acquisition", "CÁCH LẤY CLASS"],
          ]) {
            await tabs.getByRole("tab", { name: label, exact: true }).click();
            await expect(
              page.locator("[data-class-panel]:visible"),
            ).toHaveCount(1);
            await expect(
              page.locator(`[data-class-panel="${panel}"]`),
            ).toBeVisible();
            const methods = page.locator(".acquisition-method-tabs button");
            if (panel === "acquisition") {
              for (let i = 0; i < (await methods.count()); i++) {
                await methods.nth(i).click();
                await expect(
                  page.locator(".class-acquisition-method"),
                ).toHaveCount(1);
              }
              const quest = methods.filter({ hasText: "QUEST" }).first();
              if (await quest.count()) {
                await quest.click();
                const box = page
                  .locator(".class-obtain-steps input[type=checkbox]")
                  .first();
                if (await box.count()) {
                  await box.check();
                  await tabs
                    .getByRole("tab", { name: "BỘ SKILL", exact: true })
                    .click();
                  await tabs
                    .getByRole("tab", { name: "CÁCH LẤY CLASS", exact: true })
                    .click();
                  await expect(box).toBeChecked();
                  await box.uncheck();
                }
              }
            }
            const check = await inspectPage(page);
            expect(check.overflow).toBe(false);
            expect(check.brokenImages).toEqual([]);
            const file = `${c.slug}-${panel}-${width}-${theme}.png`;
            await page.screenshot({ path: dir + "/" + file, fullPage: true });
            result.screenshots.push(file);
          }
          const check = await inspectPage(page);
          expect(check.overflow).toBe(false);
          expect(check.brokenImages).toEqual([]);
          const file = `${c.slug}-${width}-${theme}.png`;
          await page.screenshot({ path: dir + "/" + file, fullPage: true });
          result.screenshots.push(file);
          item.status = "passed";
        } catch (e) {
          item.status = "failed";
          item.error = e.message;
        }
      }
      if (errors.length)
        result.cases.push({
          width,
          theme,
          status: "failed",
          consoleErrors: errors,
        });
      await page.close();
    }
  // Full route and skill-selection sweep, independently of representative screenshots.
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  for (const c of catalog) {
    const item = {
      route: "/class/" + c.slug,
      scope: "all-routes-and-skills",
      status: "not_run",
    };
    result.cases.push(item);
    try {
      await inspectClass(page, c, expect);
      await page
        .getByRole("tablist", { name: "Điều hướng hồ sơ Class" })
        .getByRole("tab", { name: "CÁCH LẤY CLASS", exact: true })
        .click();
      const data = JSON.parse(fs.readFileSync("public" + c.bodyUrl));
      const methods = page.locator(".acquisition-method-tabs button");
      await expect(methods).toHaveCount(
        data.acquisition.methods.filter(
          (m) => m.verificationStatus === "verified",
        ).length,
      );
      for (let i = 0; i < (await methods.count()); i++) {
        await methods.nth(i).click();
        const method = data.acquisition.methods.filter(
          (m) => m.verificationStatus === "verified",
        )[i];
        await expect(page.locator(".class-acquisition-method")).toHaveAttribute(
          "data-method-id",
          method.id,
        );
        if (method.shop) {
          await expect(page.locator(".acquisition-price")).toHaveAttribute(
            "data-currency",
            method.shop.price.currency,
          );
          await expect(page.locator(".acquisition-price strong")).toHaveText(
            method.shop.price.amount.toLocaleString("en-US"),
          );
        }
      }
      const check = await inspectPage(page);
      expect(check.brokenImages).toEqual([]);
      expect(check.overflow).toBe(false);
      item.status = "passed";
    } catch (e) {
      item.status = "failed";
      item.error = e.message;
    }
  }
  await page.close();
  async function inspectClass(page, c, expect) {
    await page.goto(base + "/class/" + c.slug);
    await expect(page.locator(".class-hero h1")).toHaveText(c.name);
    await expect(page.locator(".ability-detail")).toBeVisible();
    const groupButtons = page.locator(".ability-groups button");
    const groupNames = await groupButtons.allTextContents();
    for (let group = 0; group < groupNames.length; group++) {
      await groupButtons.nth(group).click();
      const slots = page.locator(".ability-bar button");
      for (let i = 0; i < (await slots.count()); i++) {
        const slot = slots.nth(i),
          name = await slot.getAttribute("aria-label");
        await slot.click();
        await expect(page.locator(".ability-detail h3")).toHaveText(name);
        await expect(slot).toHaveAttribute("aria-selected", "true");
        const selectedId = await page
          .locator(".ability-detail")
          .getAttribute("data-selected-skill");
        const data = JSON.parse(fs.readFileSync("public" + c.bodyUrl)),
          skill = data.skills.find((s) => s.id === selectedId);
        if (skill.iconAsset) {
          await expect(
            page.locator(".ability-detail header img"),
          ).toHaveAttribute("src", skill.iconAsset.imagePath);
          await expect(
            page.locator(".ability-detail header img"),
          ).toHaveAttribute("alt", skill.name);
        }
        const variant = page.locator(".ability-variant select");
        if (await variant.count()) {
          for (const value of await variant
            .locator("option")
            .evaluateAll((xs) => xs.map((x) => x.value))) {
            await variant.selectOption(value);
            await expect(page.locator(".ability-detail")).toHaveAttribute(
              "data-selected-skill",
              value,
            );
          }
        }
      }
    }
  }
});
