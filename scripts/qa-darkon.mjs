import fs from "node:fs";
import { runQa, inspectPage } from "./qa-runtime.mjs";
const models = JSON.parse(
  fs.readFileSync("src/content/ultra/darkon-phases.json"),
);
const bosses = JSON.parse(
  fs.readFileSync("src/content/ultra/recovery.json"),
).bosses;
const boss = bosses.find((b) => b.slug === models.bossId);
if (!boss) throw Error("Darkon route does not resolve in current catalog");
await runQa("darkon", async ({ browser, base, result, dir, expect }) => {
  result.route = "/ultra-boss/" + boss.slug;
  for (const width of [375, 768, 1440, 1920])
    for (const theme of ["dark", "light"]) {
      const item = { width, theme, status: "not_run", phases: [] };
      result.cases.push(item);
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      try {
        await page.addInitScript(
          (t) => localStorage.setItem("aqw-theme", t),
          theme,
        );
        await page.goto(base + result.route);
        const root = page.locator(".enemy-inspection"),
          selector = root.getByRole("group", { name: "Chọn phase" });
        await expect(selector.getByRole("button")).toHaveCount(4);
        const timeline = await root
          .locator(".boss-global-timeline")
          .innerText();
        for (const [i, p] of models.phases.entries()) {
          const label = p.phaseOrder + " " + p.name.toUpperCase();
          await selector.getByRole("button", { name: label }).click();
          await expect(
            selector.getByRole("button", { name: label }),
          ).toHaveAttribute("aria-pressed", "true");
          await root
            .getByRole("tab", { name: "THÔNG SỐ", exact: true })
            .click();
          await expect(root.locator(".enemy-status-card")).toContainText(
            "22.222.222",
          );
          await expect(root.locator(".enemy-status-card")).toContainText(
            p.name,
          );
          await expect(root.locator(".attack-damage-row")).toHaveCount(5);
          await expect(root.locator(".attack-damage-table")).toContainText(
            "90% HP hiện tại",
          );
          await expect(root.locator(".tactical-mechanics")).toContainText(
            [
              "Melancholic Melodies",
              "Realm of the Arcana",
              "The Last Symphony",
              "The Last Symphony",
            ][i],
          );
          const filename = `${width}-${theme}-${p.id}.png`;
          await root.screenshot({ path: dir + "/" + filename });
          result.screenshots.push(filename);
          await root.getByRole("tab", { name: "KỸ NĂNG", exact: true }).click();
          await root
            .getByRole("tab", { name: "ACTIVE SKILL", exact: true })
            .click();
          const skills = root.locator(".enemy-skill-entry");
          await expect(skills).toHaveCount(i === 3 ? 6 : 7);
          for (const name of ["Special 1", "Special 2"])
            await expect(
              skills.filter({
                has: page.locator("summary strong", {
                  hasText: new RegExp("^" + name + "$"),
                }),
              }),
            ).toHaveCount(1);
          const auto = skills.filter({
            has: page.locator("summary strong", { hasText: /^Auto Attack$/ }),
          });
          await auto.locator("summary").click();
          await expect(auto).toContainText(
            i < 2
              ? ["Melancholic Melodies", "Realm of the Arcana"][i]
              : "Requiem for the Wicked",
          );
          await root
            .getByRole("tab", { name: "PASSIVE SKILL", exact: true })
            .click();
          await expect(root.locator(".passive-compact")).toHaveCount(
            [5, 7, 10, 5][i],
          );
          await expect(
            root.locator(".passive-compact h4", { hasText: "Boss Shield" }),
          ).toHaveCount(1);
          if (i === 3) {
            await expect(
              root.locator(".passive-compact h4", { hasText: /^A Major$/ }),
            ).toHaveCount(0);
            await expect(root.locator(".passive-compact").last()).toContainText(
              "Dirge of Astravia",
            );
          }
          const skillFile = `${width}-${theme}-${p.id}-passives.png`;
          await root.screenshot({ path: dir + "/" + skillFile });
          result.screenshots.push(skillFile);
          expect(
            await root.locator(".boss-global-timeline").innerText(),
          ).toEqual(timeline);
          const layout = await inspectPage(page);
          expect(layout.overflow).toBe(false);
          expect(layout.brokenImages).toEqual([]);
          item.phases.push({
            id: p.id,
            status: "passed",
            screenshot: filename,
          });
        }
        const formation = root.locator(".tactical-formation");
        await expect(formation.locator(".formation-slot")).toHaveCount(4);
        await formation
          .getByRole("button", { name: "Team 4", exact: true })
          .click();
        await expect(
          selector.getByRole("button", { name: "4 RUSH" }),
        ).toHaveAttribute("aria-pressed", "true");
        await formation.locator(".formation-primary").first().click();
        await expect(root.locator(".tactical-class-inspection")).toContainText(
          "Rush",
        );
        await selector.getByRole("button", { name: "2 RECITATIVE" }).click();
        await expect(
          formation.getByRole("button", { name: "Team 4", exact: true }),
        ).toHaveAttribute("aria-pressed", "true");
        await expect(root.locator(".tactical-class-inspection")).toContainText(
          "Recitative",
        );
        await page.reload();
        await expect(
          selector.getByRole("button", { name: "1 OVERTURE" }),
        ).toHaveAttribute("aria-pressed", "true");
        expect(errors).toEqual([]);
        item.status = "passed";
      } catch (e) {
        item.status = "failed";
        item.error = e.message;
        item.consoleErrors = errors;
      } finally {
        await page.close();
      }
    }
});
