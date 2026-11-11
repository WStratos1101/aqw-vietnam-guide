import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const base = process.env.AQW_QA_URL || "http://127.0.0.1:4173";
await fs.mkdir("qa/chromium", { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const width of [375, 768, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    for (const route of [
      "/",
      "/class",
      "/class/archpaladin",
      "/ultra-boss",
      "/ultra-boss/ultra-ezrajal",
      "/ultra-boss/ultra-dage",
    ]) {
      const errors = [];
      const handler = (e) => errors.push(e.message);
      page.on("pageerror", handler);
      const response = await page.goto(base + route);
      await page.waitForLoadState("networkidle");
      await page.evaluate(async () => {
        await Promise.all(
          [...document.images].map(async (i) => {
            i.loading = "eager";
            try {
              await i.decode();
            } catch {}
          }),
        );
      });
      const checks = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        broken: [...document.images]
          .filter((i) => !i.complete || !i.naturalWidth)
          .map((i) => i.src),
        heading: document.querySelector("h1")?.textContent,
      }));
      if (route === "/class/archpaladin") {
        await page.locator('a[href="#combo"]').first().click();
        await page.locator('input[type="checkbox"]').first().check();
        await page.reload();
        await page.waitForFunction(
          () =>
            document.querySelector("input[type=checkbox]")?.checked === true,
        );
        checks.persisted = await page
          .locator('input[type="checkbox"]')
          .first()
          .isChecked();
        await page.locator('input[type="checkbox"]').first().uncheck();
      }
      if (route.includes("/ultra-boss/")) {
        for (const tab of await page.getByRole("tab").all()) await tab.click();
        const team = page.locator(".ultra-team-toggle").first();
        if (await team.count()) {
          await team.click();
          checks.accordion =
            (await team.getAttribute("aria-expanded")) === "true";
          await team.click();
        }
        const choices = page.locator(".ultra-equipment-choice");
        if ((await choices.count()) > 1) {
          await choices.nth(1).click();
          checks.equipment =
            (await choices.nth(1).getAttribute("aria-pressed")) === "true";
        }
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `qa/chromium/hero-${width}-${route.replaceAll("/", "_") || "home"}.png`,
      });
      await page.screenshot({
        path: `qa/chromium/${width}-${route.replaceAll("/", "_") || "home"}.png`,
        fullPage: true,
      });
      results.push({
        width,
        route,
        status: response.status(),
        ...checks,
        errors,
      });
      page.off("pageerror", handler);
    }
    await page.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(
    "qa/chromium/report.json",
    JSON.stringify(results, null, 2),
  );
}
console.log(
  JSON.stringify(
    results.map(
      ({ width, route, status, overflow, broken, errors, persisted }) => ({
        width,
        route,
        status,
        overflow,
        broken,
        errors,
        persisted,
      }),
    ),
    null,
    2,
  ),
);
if (
  results.some(
    (r) =>
      r.status !== 200 ||
      r.overflow ||
      r.broken.length ||
      r.errors.length ||
      r.persisted === false ||
      r.accordion === false ||
      r.equipment === false,
  )
)
  process.exitCode = 1;
