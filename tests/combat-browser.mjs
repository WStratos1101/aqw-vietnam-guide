import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import { ensureServer } from "../scripts/qa-runtime.mjs";
const encounter = JSON.parse(
  await fs.readFile("src/content/ultra/inspection.json", "utf8"),
)["ultra-tyndarius"];
await fs.mkdir("qa/combat", { recursive: true });
let browser;
const results = [];
const server = await ensureServer();
const base = server.url;
try {
  browser = await chromium.launch();
  for (const width of [375, 768, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/ultra-boss/ultra-tyndarius");
    await page.waitForLoadState("networkidle");
    const panel = page.locator(".ultra-inspect");
    await panel.scrollIntoViewIfNeeded();
    let count = 0;
    let stats = 0;
    for (let i = 0; i < encounter.monsters.length; i++) {
      const monster = encounter.monsters[i];
      await page.locator(".monster-selector button").nth(i).click();
      await expect(page.locator(".enemy-status-card-heading h4")).toHaveText(
        monster.canonicalName,
      );
      await expect(page.locator(".enemy-status-card dl")).toContainText(
        monster.maxHp.toLocaleString("vi-VN"),
      );
      stats += await page.locator(".enemy-status-card dl > div").count();
      await page.getByRole("tab", { name: "KỸ NĂNG", exact: true }).click();
      const rows = page.locator(".enemy-skill-entry.is-active");
      const skills = encounter.activeSkills.filter(
        (s) => s.monsterId === monster.id,
      );
      await expect(rows).toHaveCount(skills.length);
      for (let j = 0; j < skills.length; j++) {
        await expect(rows.nth(j).locator("summary")).toContainText(
          skills[j].name,
        );
      }
      count += await rows.count();
      await rows.first().locator("summary").click();
      await expect(rows.first()).toHaveAttribute("open", "");
      await panel.screenshot({
        path: `qa/combat/${width}-${monster.id}-skills.png`,
      });
      await rows.first().locator("summary").click();
      await expect(rows.first()).not.toHaveAttribute("open", "");
      await page.getByRole("tab", { name: "THÔNG SỐ", exact: true }).click();
    }
    const statsTab = page.getByRole("tab", { name: "THÔNG SỐ", exact: true });
    const skillsTab = page.getByRole("tab", { name: "KỸ NĂNG", exact: true });
    await statsTab.press("ArrowLeft");
    await expect(skillsTab).toHaveAttribute("aria-selected", "true");
    await expect(skillsTab).toBeFocused();
    await skillsTab.press("ArrowRight");
    await expect(statsTab).toHaveAttribute("aria-selected", "true");
    await expect(statsTab).toBeFocused();
    const checks = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      panelOverflow: [...document.querySelectorAll(".enemy-skill-list")].some(
        (e) => e.scrollWidth > e.clientWidth + 1,
      ),
    }));
    await panel.screenshot({ path: `qa/combat/${width}-stats.png` });
    results.push({
      width,
      count,
      stats,
      accordion: true,
      keyboard: true,
      ...checks,
      errors,
    });
    await page.close();
  }
} finally {
  try {
    await browser?.close();
  } finally {
    await server.close();
  }
  await fs.writeFile("qa/combat/report.json", JSON.stringify(results, null, 2));
}
console.log(results);
if (
  results.some(
    (r) =>
      r.count !== encounter.activeSkills.length ||
      r.stats !== encounter.monsters.length * 2 ||
      !r.accordion ||
      !r.keyboard ||
      r.overflow ||
      r.panelOverflow ||
      r.errors.length,
  )
)
  process.exitCode = 1;
