import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import { ensureServer } from "../scripts/qa-runtime.mjs";
const classes = JSON.parse(
  await fs.readFile("src/content/classes/catalog.json", "utf8"),
);
const archpaladin = classes.find((c) => c.id === "archpaladin-ap");
const classRoute = "/class/" + archpaladin.slug;
await fs.mkdir("qa/chromium", { recursive: true });
let browser;
const results = [];
const server = await ensureServer();
const base = server.url;
try {
  browser = await chromium.launch({ headless: true });
  for (const width of [375, 768, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    for (const route of [
      "/",
      "/class",
      classRoute,
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
      if (route === classRoute) {
        const combo = page.getByRole("tab", {
          name: "HƯỚNG DẪN COMBO",
          exact: true,
        });
        const acquisition = page.getByRole("tab", {
          name: "CÁCH LẤY CLASS",
          exact: true,
        });
        await combo.click();
        await expect(page.locator('[data-class-panel="combo"]')).toBeVisible();
        const openProgress = async () => {
          await acquisition.click();
          await page.locator(".acquisition-unlock-route > summary").click();
        };
        await openProgress();
        const check = page
          .locator('.class-obtain-steps input[type="checkbox"]')
          .first();
        await check.check();
        await page.reload();
        await openProgress();
        await expect(check).toBeChecked();
        checks.persisted = await check.isChecked();
        await check.uncheck();
      }
      if (route.includes("/ultra-boss/")) {
        await page.getByRole("tab", { name: "KỸ NĂNG", exact: true }).click();
        await page
          .getByRole("tab", { name: "ACTIVE SKILL", exact: true })
          .click();
        await page
          .getByRole("tab", { name: "PASSIVE SKILL", exact: true })
          .click();
        await page.getByRole("tab", { name: "THÔNG SỐ", exact: true }).click();
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
  try {
    await browser?.close();
  } finally {
    await server.close();
  }
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
