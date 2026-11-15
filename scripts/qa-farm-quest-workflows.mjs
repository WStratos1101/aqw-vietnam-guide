import assert from "node:assert/strict";
import { runQa } from "./qa-runtime.mjs";

for (const browserName of ["chromium", "webkit"]) {
  await runQa("farm-quest-workflows", async ({ browser, base, result, dir, expect }) => {
    for (const width of [375, 768, 1024, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
      const current = { width, status: "running", steps: [] };
      result.cases.push(current);
      const capture = async name => {
        const path = `${dir}/${width}-${name}.png`;
        await page.screenshot({ path, fullPage: false });
        result.screenshots.push(path);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${name}: page overflow at ${width}`);
        current.steps.push(name);
      };
      const farm = async id => {
        await page.goto(`${base}/farm?item=${id}`);
        await expect(page.locator(`[data-item-id="${id}"]`)).toBeVisible();
      };
      const classWorkflow = async id => {
        await page.goto(`${base}/class/${id}`);
        await page.getByRole("tab", { name: /CÁCH LẤY CLASS/i }).click();
        await page.locator(".class-quest-workflow > summary").click();
        await expect(page.locator(".class-quest-workflow .fv32-facts")).toBeVisible();
      };
      try {
        result.currentStep = { width, name: "CPC drop drill-down" };
        await farm("celestial-pirate-commander");
        await page.getByRole("tab", { name: "Nguyên liệu", exact: true }).click();
        await page.locator(".fv2-material-row").filter({ hasText: "Sapphire Orb" }).locator("summary").first().click();
        await expect(page.locator(".fv2-material-facts")).toContainText("Legion Lich Lord (Monster)");
        await expect(page.locator(".fv2-material-facts")).toContainText("/join frozenlair");
        const quantity = page.locator(".fv2-material-row").filter({ hasText: "Sapphire Orb" }).locator(":scope > details > summary > strong");
        await expect(quantity).toHaveText("×5");
        const quantityBounds = await quantity.boundingBox();
        assert.ok(quantityBounds && quantityBounds.x + quantityBounds.width <= width, "Material quantity must remain visible on the right");
        await capture("cpc-source");

        result.currentStep = { width, name: "BLoD final shop claim" };
        await farm("blinding-light-of-destiny");
        await page.getByRole("tab", { name: "Hướng dẫn Farm", exact: true }).click();
        const workflowChoice = page.getByRole("button", { name: "Quest và Shop đã đối chiếu", exact: true });
        if (await workflowChoice.count()) await workflowChoice.click();
        await expect(page.locator(".fv31-step-numbers button")).toHaveCount(29);
        await page.locator(".fv31-step-numbers button").last().click();
        await expect(page.locator(".fv31-step-content")).toContainText("Get Your Blinding Light of Destiny ×1");
        await expect(page.locator(".fv31-step-content")).toContainText("Book of Lore");
        await capture("blod-final");

        result.currentStep = { width, name: "LR source and Ultra alternative" };
        await farm("legion-revenant-class");
        await page.getByRole("tab", { name: "Nguyên liệu", exact: true }).click();
        await page.locator(".fv2-material-row").filter({ hasText: "Conquest Wreath" }).locator("summary").first().click();
        const wreath = page.locator(".fv2-material-facts");
        await expect(wreath).toContainText("Conquest Wreath ×2");
        await expect(wreath.locator('a[href="/ultra-boss/ultra-dage"]')).toBeVisible();
        await capture("lr-wreath");

        result.currentStep = { width, name: "ArchPaladin quest unlock and ownership alternative" };
        await classWorkflow("archpaladin-ap");
        await expect(page.locator(".class-quest-workflow .fv32-facts > section")).toHaveCount(8);
        await expect(page.locator(".class-quest-workflow")).toContainText("Sacred Magic: Eden");
        await page.getByRole("button", { name: "Có Silver Paladin", exact: true }).click();
        await expect(page.locator(".class-quest-workflow .fv32-facts")).toContainText("Silver Paladin's Vow");
        await page.locator(".class-quest-workflow").scrollIntoViewIfNeeded();
        await capture("archpaladin");

        result.currentStep = { width, name: "Gramiel weekly alternatives" };
        await classWorkflow("hollowborn-vindicator-hbv");
        await page.getByRole("button", { name: "Weekly dùng Ultra Gramiel", exact: true }).click();
        await expect(page.locator(".class-quest-workflow")).toContainText("Echoes of a Forgotten Fate");
        await expect(page.locator('.class-quest-workflow a[href="/ultra-boss/gramiel-the-graceful"]').first()).toBeVisible();
        await capture("gramiel");

        result.currentStep = { width, name: "Arcana nested recipes" };
        await classWorkflow("arcana-invoker-ai");
        await page.locator(".class-quest-workflow summary").filter({ hasText: "1 - The Magician's Desire" }).click();
        await expect(page.locator(".class-quest-workflow")).toContainText("Calamitous Warlic's Tome");
        await expect(page.locator(".class-quest-workflow")).toContainText("Arcana's Debris");
        await capture("arcana-nested");
        assert.deepEqual(errors, []);
        current.status = "passed";
      } catch (error) {
        current.status = "failed";
        current.errors = errors;
        throw error;
      } finally { await page.close(); }
    }
  }, { browserName, outputDir: `artifacts/qa/farm/quest-workflows/browser-${browserName}` });
}
