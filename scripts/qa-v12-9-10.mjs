import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runQa, inspectPage } from "./qa-runtime.mjs";

const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const catalog = read("src/content/classes/catalog.json");
const bossRegistry = read("src/content/presentation/bosses.json");
const classPath = (id) => "/class/" + catalog.find((c) => c.id === id).slug;
const vhl = classPath("void-highlord-vhl-debris-highlord-dhl");
const css = classPath("calendar-chrono-shadowslayer");
const csh = classPath("calendar-chrono-shadowhunter");
const timekiller = classPath("calendar-timekiller");
const shadow = classPath("shadowwalker-stalker-weaver-of-time-swot-ssot");
const cav = classPath("chaos-avenger-cav");
const blood = classPath("blood-ancient-ba");
const lord = classPath(
  catalog.find((c) => c.id.startsWith("lord-of-order")).id,
);
const locked = [
  "/huong-dan",
  "/farm",
  "/trang-bi",
  "/he-thong",
  "/cot-truyen",
  "/gioi-thieu",
  "/huong-dan/bat-dau",
];
const bossPaths = [
  "ultra-nulgath",
  "ultra-speaker",
  "ultra-dage",
  "ultra-darkon",
].map((id) => "/ultra-boss/" + id);
export const routes = [
  "/",
  "/class",
  vhl,
  css,
  csh,
  timekiller,
  shadow,
  cav,
  blood,
  lord,
  ...bossPaths,
  ...locked,
];
export const sizes = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

export async function runSuite() {
  return await runQa(
    "v12-9-10-" + (process.env.AQW_BROWSER || "chromium"),
    async ({ browser, base, dir, result, expect }) => {
      for (const viewport of sizes)
        for (const theme of ["dark", "light"]) {
          const page = await browser.newPage({
            viewport,
            reducedMotion: "reduce",
          });
          await page.addInitScript(
            (mode) => localStorage.setItem("aqw-theme", mode),
            theme,
          );
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          page.on("console", (message) => {
            if (message.type() === "error") errors.push(message.text());
          });
          for (const route of routes) {
            const item = { route, viewport, theme, status: "not_run" };
            result.cases.push(item);
            try {
              errors.length = 0;
              const response = await page.goto(base + route);
              expect(response?.status()).toBe(200);
              await page.locator("main h1").waitFor();
              if (route === "/") {
                const toggle = page.locator(".theme-toggle").first();
                await toggle.click();
                const otherTheme = theme === "dark" ? "light" : "dark";
                expect(
                  await page.locator("html").getAttribute("data-theme"),
                ).toBe(otherTheme);
                expect(
                  await page.evaluate(() => localStorage.getItem("aqw-theme")),
                ).toBe(otherTheme);
                await toggle.click();
                expect(
                  await page.locator("html").getAttribute("data-theme"),
                ).toBe(theme);
                await expect(
                  page.locator(".calendar-poster img"),
                ).toHaveAttribute("alt", /Paradox of Lore/);
                await page.getByRole("tab", { name: "Rogue" }).click();
                await expect(
                  page.locator(".starter-class-art img"),
                ).toHaveAttribute("alt", "Rogue");
                await expect(
                  page.getByRole("link", { name: "Xem hồ sơ Class" }),
                ).toHaveAttribute("href", classPath("rogue-renegade"));
                await expect(
                  page.getByRole("link", { name: "Tìm Class phù hợp" }),
                ).toHaveAttribute("href", "/class");
                await expect(page.locator(".footer")).toContainText(
                  "Bản quyền thuộc về Guild AQW Vietnam Collectors.",
                );
                await expect(
                  page.locator(".footer").getByText("Nguồn ảnh AQW"),
                ).toHaveCount(0);
              }
              if (route === "/class") {
                const directoryShot = `${viewport.width}-${theme}-class-directory.png`;
                await page.screenshot({
                  path: dir + "/" + directoryShot,
                  fullPage: true,
                });
                result.screenshots.push(directoryShot);
                await page
                  .getByRole("button", { name: "CALENDAR", exact: true })
                  .click();
                await expect(
                  page.locator(`.class-card[href="${css}"]`),
                ).toHaveCount(1);
                await expect(
                  page.locator(`.class-card[href="${csh}"]`),
                ).toHaveCount(0);
              }
              if (route.startsWith("/class/"))
                await page.locator(".class-inspection-tabs").waitFor();
              if (
                route === css ||
                route === csh ||
                route === timekiller ||
                route === shadow
              ) {
                const selector = page.locator(".class-art-switch");
                const prior = await page
                  .locator(".class-hero-portrait img")
                  .getAttribute("src");
                await selector
                  .getByRole("button", { pressed: false })
                  .first()
                  .click();
                const next = await page
                  .locator(".class-hero-portrait img")
                  .getAttribute("src");
                expect(next).not.toEqual(prior);
                await page
                  .getByRole("tab", { name: "HƯỚNG DẪN COMBO", exact: true })
                  .click();
                await expect(
                  page
                    .locator(".class-combo-panel .skill-sequence-flow")
                    .first(),
                ).toBeVisible();
              }
              if (route.startsWith("/class/")) {
                const portrait = page.locator(".class-hero-portrait");
                if (await portrait.locator("img").count()) {
                  const g = await portrait.evaluate((el) => {
                    const frame = el.getBoundingClientRect(),
                      image = el.querySelector("img").getBoundingClientRect();
                    return {
                      top: image.top - frame.top,
                      bottom: image.bottom - frame.bottom,
                      left: image.left - frame.left,
                      right: image.right - frame.right,
                    };
                  });
                  expect(g.top).toBeGreaterThanOrEqual(-1);
                  expect(g.bottom).toBeLessThanOrEqual(1);
                  expect(g.left).toBeGreaterThanOrEqual(-1);
                  expect(g.right).toBeLessThanOrEqual(1);
                }
              }
              if (route === vhl) {
                const art = page.locator(".class-hero-portrait img");
                const before = await art.getAttribute("src");
                await page
                  .getByRole("button", { name: "Debris Highlord", exact: true })
                  .click();
                expect(await art.getAttribute("src")).not.toEqual(before);
                await page
                  .getByRole("tab", { name: "HƯỚNG DẪN COMBO", exact: true })
                  .click();
                await page
                  .getByRole("tab", { name: "Defensive Rotation", exact: true })
                  .click();
                const panel = page.locator(".class-combo-panel");
                await expect(panel).toBeVisible();
                expect(await panel.textContent()).not.toMatch(
                  /Offensive Rotation|Max DPS Rotation/,
                );
                await expect(page.locator(".class-combo-panel")).toHaveCount(1);
              }
              if (route === cav) {
                await page
                  .getByRole("tab", { name: "Chaos Bulwark", exact: true })
                  .click();
                await expect(page.locator(".active-stats dd")).toHaveText([
                  "50 Mana",
                  "6 Seconds",
                  "3",
                  "Infinite",
                  "1",
                ]);
                await expect(page.locator(".target-effect-list")).toContainText(
                  "Chaotic Armor",
                );
                const colors = await page
                  .locator(".target-badge")
                  .evaluateAll((es) =>
                    Object.fromEntries(
                      es.map((el) => [
                        el.textContent.trim(),
                        getComputedStyle(el).color,
                      ]),
                    ),
                  );
                expect(colors.SELF).toBe(
                  theme === "dark" ? "rgb(228, 194, 112)" : "rgb(121, 86, 18)",
                );
                expect(colors.ENEMY).toBe(
                  theme === "dark" ? "rgb(240, 146, 152)" : "rgb(160, 39, 54)",
                );
              }
              if (route === blood) {
                await page
                  .getByRole("button", { name: /Passive \/ Rank Passive/ })
                  .click();
                await page
                  .getByRole("tab", { name: "Wonderful Night", exact: true })
                  .click();
                await expect(page.locator(".active-stats")).toHaveCount(0);
                await expect(page.locator(".passive-unlock")).toContainText(
                  "Rank 10",
                );
                await expect(page.locator(".target-effect-list")).toContainText(
                  "Tăng 50% Crit Damage",
                );
              }
              if (route === lord) {
                await page
                  .getByRole("tab", { name: "CÁCH LẤY CLASS", exact: true })
                  .click();
                await page
                  .locator(".acquisition-method-tabs")
                  .getByRole("tab", { name: /QUEST/ })
                  .first()
                  .click();
                await expect(
                  page.locator(".acquisition-quest-card"),
                ).toContainText("Hoàn thành Quest:");
                await expect(
                  page.locator(".acquisition-quest-card input"),
                ).toHaveCount(0);
              }
              if (locked.includes(route)) {
                await expect(page.locator("main h1")).toHaveText(
                  "Thông tin đang được cập nhật",
                );
              }
              if (bossPaths.includes(route)) {
                const id = route.split("/").at(-1);
                const accent = await page
                  .locator(".ultra-detail")
                  .evaluate((el) =>
                    getComputedStyle(el)
                      .getPropertyValue("--boss-accent")
                      .trim()
                      .toLowerCase(),
                  );
                expect(accent).toBe(bossRegistry[id][theme].toLowerCase());
                const heroAccent = await page
                  .locator(".ultra-hero")
                  .evaluate((el) =>
                    getComputedStyle(el)
                      .getPropertyValue("--boss-accent")
                      .trim()
                      .toLowerCase(),
                  );
                expect(heroAccent).toBe(accent);
              }
              if (route === "/ultra-boss/ultra-darkon") {
                for (const label of [
                  "1 OVERTURE",
                  "2 RECITATIVE",
                  "3 MADNESS",
                  "4 RUSH",
                ]) {
                  const button = page.getByRole("button", {
                    name: label,
                    exact: true,
                  });
                  await button.click();
                  await expect(button).toHaveAttribute("aria-pressed", "true");
                }
              }
              item.consoleErrors = [...errors];
              item.computedStyles = await page.evaluate(() =>
                Object.fromEntries(
                  [
                    "body",
                    "header",
                    ".class-card",
                    ".active-stats",
                    ".footer",
                    ".ultra-hero",
                  ].map((selector) => {
                    const e = document.querySelector(selector);
                    if (!e) return [selector, null];
                    const s = getComputedStyle(e);
                    return [
                      selector,
                      {
                        color: s.color,
                        background: s.backgroundColor,
                        border: s.borderColor,
                        font: s.fontFamily,
                      },
                    ];
                  }),
                ),
              );
              const checks = await inspectPage(page);
              item.layoutChecks = checks;
              expect(checks.overflow).toBe(false);
              expect(checks.brokenImages).toEqual([]);
              expect(errors).toEqual([]);
              const file = `${viewport.width}-${theme}-${route.replaceAll("/", "_")}.png`;
              await page.screenshot({ path: dir + "/" + file, fullPage: true });
              result.screenshots.push(file);
              item.status = "passed";
            } catch (error) {
              item.status = "failed";
              item.error = error.message;
              item.consoleErrors = [...errors];
            }
          }
          await page.close();
        }
    },
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await runSuite();
