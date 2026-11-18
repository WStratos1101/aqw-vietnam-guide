import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import { build } from "esbuild";
import { ensureServer } from "../scripts/qa-runtime.mjs";
const { version } = JSON.parse(await fs.readFile("package.json", "utf8"));
await fs.mkdir("artifacts/qa", { recursive: true });
const compiled = await build({
  stdin: {
    contents:
      "export {ultraBosses} from './src/content/ultra';export {challengeGuides} from './src/content/ultra/challenge-catalog';export {monsterDisplayName} from './src/lib/boss-names';",
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  packages: "external",
});
await fs.writeFile(
  "artifacts/qa/boss-browser-fixtures.mjs",
  compiled.outputFiles[0].text,
);
const { ultraBosses, challengeGuides, monsterDisplayName } = await import(
  "../artifacts/qa/boss-browser-fixtures.mjs"
);
const directoryRoutes = [
  ...ultraBosses.map((b) => "/ultra-boss/" + b.slug),
  ...challengeGuides
    .filter((g) => !ultraBosses.some((b) => b.slug === g.id))
    .map((g) => g.href),
].sort();
const encounters = JSON.parse(
  await fs.readFile("src/content/ultra/inspection.json"),
);
const results = [];
await fs.mkdir("qa/v678", { recursive: true });
let browser;
async function imageLoaded(locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  await expect
    .poll(() => locator.evaluate((i) => i.complete && i.naturalWidth > 0))
    .toBe(true);
}
const server = await ensureServer();
const base = server.url;
try {
  browser = await chromium.launch();
  for (const width of [375, 768, 1440, 1920])
    for (const theme of ["dark", "light"]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(base + "/ultra-boss");
      await page.evaluate((t) => localStorage.setItem("aqw-theme", t), theme);
      await page.reload();
      await page.getByRole("button", { name: "Tất cả", exact: true }).click();
      await expect(page.locator(".ultra-gallery .ultra-boss-card")).toHaveCount(
        directoryRoutes.length,
      );
      expect(
        (
          await page
            .locator(".ultra-gallery .ultra-boss-card")
            .evaluateAll((cards) => cards.map((c) => c.getAttribute("href")))
        ).sort(),
      ).toEqual(directoryRoutes);
      await expect(page.locator(".ultra-card-art img")).toHaveCount(
        directoryRoutes.length,
      );
      for (const img of await page.locator(".ultra-card-art img").all())
        await imageLoaded(img);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        `Boss directory must fit ${width}px in ${theme} theme`,
      ).toBe(false);
      await page.screenshot({
        path: `qa/v678/${width}-${theme}-directory.png`,
      });
      for (const [slug, e] of Object.entries(encounters)) {
        if ([768, 1920].includes(width) && slug !== "ultra-ezrajal") continue;
        await page.goto(base + "/ultra-boss/" + slug);
        await imageLoaded(page.locator(".ultra-hero-art img"));
        await page
          .locator(".ultra-hero")
          .screenshot({ path: `qa/v678/${width}-${theme}-${slug}-hero.png` });
        for (let i = 0; i < e.monsters.length; i++) {
          const monster = e.monsters[i];
          if (e.monsters.length > 1)
            await page.locator(".monster-selector button").nth(i).click();
          await expect(
            page.locator(".enemy-status-card-heading h4"),
          ).toHaveText(monsterDisplayName(monster));
          await expect(page.locator(".enemy-status-card dl")).toContainText(
            monster.maxHp.toLocaleString("vi-VN"),
          );
          await imageLoaded(page.locator(".monster-status-portrait img"));
          await expect(page.locator(".enemy-status")).not.toContainText(
            /Boss Shield|Miễn nhiễm Stun|Quy tắc nội tại/,
          );
          await page.getByRole("tab", { name: "KỸ NĂNG", exact: true }).click();
          await page
            .getByRole("tab", { name: "PASSIVE SKILL", exact: true })
            .click();
          await expect(page.locator(".passive-compact")).toHaveCount(
            e.passiveSkills.filter((p) => p.monsterId === monster.id).length,
          );
          await page
            .getByRole("tab", { name: "THÔNG SỐ", exact: true })
            .click();
        }
        await page
          .locator(".ultra-inspect")
          .screenshot({ path: `qa/v678/${width}-${theme}-${slug}-stats.png` });
        await expect(page.locator(".enemy-notes")).not.toContainText(
          /Wiki ghi|Theo Wiki|Wiki cho biết|Nguồn ghi rằng|Theo dữ liệu|Đối chiếu Wiki/,
        );
        await expect(page.locator(".footer")).toContainText(
          "Bản quyền thuộc về Guild AQW Vietnam Collectors.",
        );
        await expect(page.locator(".footer")).toContainText(
          "Bản quyền Website thuộc về W.Stratos",
        );
        await expect(page.locator(".footer")).toContainText(
          "Version " + version,
        );
        await expect(page.locator(".footer")).not.toContainText(
          "Mỗi hành trình hay",
        );
        await expect(page.locator("main")).not.toContainText(
          "Quest lặp không tính vào mốc vĩnh viễn",
        );
        if (slug === "ultra-ezrajal") {
          await page.locator(".boss-progression-toggle").click();
          const check = page
            .locator(".ultra-route-quests input[type=checkbox]")
            .first();
          await check.check();
          await page.reload();
          await page.locator(".boss-progression-toggle").click();
          await expect(
            page.locator(".ultra-route-quests input[type=checkbox]").first(),
          ).toBeChecked();
          await page
            .locator(".ultra-route-quests input[type=checkbox]")
            .first()
            .uncheck();
          await page
            .getByRole("button", {
              name: "Dual Exalted Apotheosis",
              exact: true,
            })
            .click();
          const equipment = page.locator(".rpg-equipment-preview");
          await expect(equipment.locator("h3")).toHaveText(
            "Dual Exalted Apotheosis",
          );
          await equipment.locator(".material-requirements > summary").click();
          await expect(
            equipment.locator(
              ".material-requirements .material-tree-item strong",
            ),
          ).toHaveText(["×1", "×14", "×14", "×14"]);
          await expect(equipment).not.toContainText("Cần thêm 12 ngày");
          await page
            .locator(".ultra-section:has(#equipment-title)")
            .screenshot({ path: `qa/v678/${width}-${theme}-equipment.png` });
          await page
            .locator(".footer")
            .screenshot({ path: `qa/v678/${width}-${theme}-footer.png` });
          if (width >= 1440) {
            const rows = await page
              .locator(".equipment-progression-path>span")
              .evaluateAll(
                (elements) =>
                  new Set(
                    elements.map((e) =>
                      Math.round(e.getBoundingClientRect().top),
                    ),
                  ).size,
              );
            expect(rows).toBe(1);
          }
        }
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        );
        expect(overflow).toBe(false);
        results.push({
          width,
          theme,
          slug,
          monsters: e.monsters.map((m) => m.canonicalName),
          imagesDisplayed: true,
          overflow,
          errors: [...errors],
        });
      }
      await page.close();
    }
} finally {
  try {
    await browser?.close();
  } finally {
    await server.close();
  }
  await fs.writeFile("qa/v678/report.json", JSON.stringify(results, null, 2));
}
console.log({
  runs: results.length,
  failures: results.filter((r) => r.overflow || r.errors.length).length,
});
if (results.some((r) => r.errors.length)) process.exitCode = 1;
