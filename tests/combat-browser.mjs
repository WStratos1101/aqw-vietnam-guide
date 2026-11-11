import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("qa/combat", { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [375, 768, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:4173/ultra-boss/ultra-tyndarius");
    await page.waitForLoadState("networkidle");
    const panel = page.locator(".ultra-inspect");
    await panel.scrollIntoViewIfNeeded();
    await page.getByRole("tab", { name: "CƠ CHẾ", exact: true }).click();
    const rows = page.locator(".boss-skill-entry");
    const count = await rows.count();
    await rows.nth(1).locator("summary").click();
    const accordion = await rows.nth(1).evaluate((e) => e.open);
    await panel.screenshot({ path: `qa/combat/${width}-mechanics.png` });
    await page.getByRole("tab", { name: "STATS", exact: true }).click();
    await page
      .getByRole("tab", { name: "STATS", exact: true })
      .press("ArrowLeft");
    const keyboard =
      (await page
        .getByRole("tab", { name: "CƠ CHẾ", exact: true })
        .getAttribute("aria-selected")) === "true";
    await page.getByRole("tab", { name: "STATS", exact: true }).click();
    const stats = await page.locator(".boss-stat-row").count();
    const checks = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      panelOverflow: [
        ...document.querySelectorAll(".ultra-inspect-content"),
      ].some((e) => e.scrollWidth > e.clientWidth + 1),
    }));
    await panel.screenshot({ path: `qa/combat/${width}-stats.png` });
    results.push({
      width,
      count,
      stats,
      accordion,
      keyboard,
      ...checks,
      errors,
    });
    await page.close();
  }
} finally {
  await browser.close();
  await fs.writeFile("qa/combat/report.json", JSON.stringify(results, null, 2));
}
console.log(results);
if (
  results.some(
    (r) =>
      r.count !== 6 ||
      r.stats < 30 ||
      !r.accordion ||
      !r.keyboard ||
      r.overflow ||
      r.panelOverflow ||
      r.errors.length,
  )
)
  process.exitCode = 1;
