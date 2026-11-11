import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("qa/boss-detail", { recursive: true });
const b = await chromium.launch();
const results = [];
try {
  for (const width of [375, 1440])
    for (const slug of [
      "ultra-ezrajal",
      "ultra-warden",
      "ultra-engineer",
      "ultra-tyndarius",
      "ultra-dage",
      "ultra-nulgath",
      "ultra-drago",
      "ultra-speaker",
    ]) {
      const p = await b.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto("http://127.0.0.1:4173/ultra-boss/" + slug);
      await p.waitForLoadState("networkidle");
      await expect(p.getByRole("tab")).toHaveCount(2);
      await expect(p.getByRole("tab", { name: "ACTIVE SKILL" })).toHaveAttribute("aria-selected", "true");
      await p.getByRole("tab", { name: "ACTIVE SKILL" }).focus();
      await p.keyboard.press("ArrowRight");
      await expect(p.getByRole("tab", { name: "PASSIVE SKILL" })).toHaveAttribute("aria-selected", "true");
      await expect(p.locator(".enemy-skill-entry").first()).toBeVisible();
      await p.keyboard.press("ArrowLeft");
      await expect(p.getByRole("tab", { name: "ACTIVE SKILL" })).toHaveAttribute("aria-selected", "true");
      await expect(p.locator(".enemy-notes .boss-quick-notes article").first()).toBeVisible();
      await expect(p.locator(".enemy-status-card").first()).toBeVisible();
      await p
        .locator(".ultra-inspect")
        .screenshot({ path: `qa/boss-detail/${width}-${slug}-inspection.png` });
      if (slug === "ultra-speaker") {
        const board = p.locator(".speaker-tactical-board");
        await board.locator("summary").click();
        await expect(board).not.toHaveAttribute("open", "");
        await board.locator("summary").click();
        await expect(board).toHaveAttribute("open", "");
        await p.screenshot({ path: `qa/boss-detail/${width}-ultra-speaker-full.png`, fullPage: true });
      }
      await expect(p.locator(".boss-taunt h2")).toHaveText("Taunt");
      const toggle = p.locator(".boss-progression-toggle");
      let collapsed = null,
        expanded = null,
        persisted = null;
      if (await toggle.count()) {
        collapsed = await p.locator(".ultra-route-quests .ultra-quest").count();
        await toggle.click();
        expanded = await p.locator(".ultra-route-quests .ultra-quest").count();
        if (expanded <= collapsed) throw Error("Progression did not expand");
        const checkbox = p
          .locator(".ultra-route-quests input[type=checkbox]")
          .first();
        await checkbox.check();
        await toggle.click();
        await p.reload();
        await p.waitForLoadState("networkidle");
        await expect(
          p.locator(".ultra-route-quests input[type=checkbox]").first(),
        ).toBeChecked();
        persisted = true;
        await p
          .locator(".ultra-route-quests input[type=checkbox]")
          .first()
          .uncheck();
      }
      const checks = await p.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        taunt: !!document.querySelector(".ultra-inspect + .boss-taunt"),
        notes: !!document.querySelector(".enemy-notes"),
        reset: [...document.querySelectorAll(".ultra-hero-meta dt")].some(
          (e) => e.textContent === "Reset",
        ),
        speakerBoard: location.pathname.endsWith("ultra-speaker")
          ? (() => {
              const board = document.querySelector(".speaker-tactical-layout .speaker-tactical-board");
              const layout = document.querySelector(".speaker-tactical-layout");
              if (!board || !layout || board.querySelectorAll("tr").length < 2) return false;
              const style = getComputedStyle(board);
              const cell = board.querySelector("td, th");
              const cellStyle = cell && getComputedStyle(cell);
              return style.backgroundColor === "rgb(8, 9, 11)" && style.color === "rgb(244, 243, 239)"
                && cellStyle?.backgroundColor === "rgb(8, 9, 11)" && cellStyle?.color === "rgb(244, 243, 239)";
            })()
          : true,
        speakerColumns: location.pathname.endsWith("ultra-speaker")
          ? getComputedStyle(document.querySelector(".speaker-tactical-layout")).gridTemplateColumns
          : null,
      }));
      results.push({
        width,
        slug,
        collapsed,
        expanded,
        persisted,
        ...checks,
        errors,
      });
      await p.close();
    }
} finally {
  await b.close();
  await fs.writeFile(
    "qa/boss-detail/report.json",
    JSON.stringify(results, null, 2),
  );
}
console.log(results);
if (results.some((r) => r.overflow || !r.taunt || !r.notes || !r.reset || !r.speakerBoard || r.errors.length))
  process.exitCode = 1;
