import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { build } from "esbuild";
import { act, createElement, Fragment } from "react";
const window = new Window({
  url: "http://localhost/ultra-boss/darkon-the-conductor",
});
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "HTMLDetailsElement",
  "Node",
  "Event",
  "MouseEvent",
  "KeyboardEvent",
  "localStorage",
  "MutationObserver",
])
  globalThis[key] = key === "window" ? window : window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const compiled = await build({
  stdin: {
    contents: `export {BossPhaseProvider} from './src/features/ultra/BossPhaseInspection';export {EnemyInspection} from './src/features/ultra/EnemyInspection';export {Teams} from './src/features/ultra/Teams';export {findBoss} from './src/content/ultra';`,
    resolveDir: process.cwd(),
    loader: "tsx",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  packages: "external",
  loader: { ".css": "empty" },
});
// A local file keeps Node's React imports resolving to the project's own installation.
const fs = await import("node:fs/promises");
globalThis.fetch = async (url) =>
  new Response(
    await fs.readFile(
      "public" + new URL(String(url), "http://localhost").pathname,
    ),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
await fs.mkdir("qa/v12-darkon", { recursive: true });
await fs.writeFile(
  "qa/v12-darkon/interactions.mjs",
  compiled.outputFiles[0].text,
);
const { BossPhaseProvider, EnemyInspection, Teams, findBoss } = await import(
  "../qa/v12-darkon/interactions.mjs"
);
const host = document.createElement("div");
document.body.append(host);
const root = createRoot(host);
const click = async (el) => {
  assert.ok(el, "control exists");
  await act(async () =>
    el.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
  );
};
const tab = (name) =>
  [...host.querySelectorAll("[role=tab]")].find((e) => e.textContent === name);
const phase = (name) =>
  [
    ...host.querySelectorAll(".enemy-inspection .boss-phase-selector button"),
  ].find((e) => e.textContent.includes(name));
test("manual phase selection changes actual rendered stats, effects and passive groups without HP inference", async () => {
  await act(async () =>
    root.render(
      createElement(
        BossPhaseProvider,
        null,
        createElement(
          Fragment,
          null,
          createElement(EnemyInspection, { slug: "darkon-the-conductor" }),
          createElement(Teams, { boss: findBoss("darkon-the-conductor") }),
        ),
      ),
    ),
  );
  assert.equal(
    host.querySelectorAll(".enemy-inspection .boss-phase-selector button")
      .length,
    4,
  );
  assert.equal(phase("OVERTURE").getAttribute("aria-pressed"), "true");
  const globalTimeline = host.querySelector(
    ".boss-global-timeline",
  ).textContent;
  for (const [i, name] of [
    "OVERTURE",
    "RECITATIVE",
    "MADNESS",
    "RUSH",
  ].entries()) {
    await click(phase(name));
    await click(tab("THÔNG SỐ"));
    const stats = host.querySelector(".enemy-status-card");
    assert.ok(stats.textContent.includes("22.222.222"));
    assert.ok(stats.textContent.includes("90% HP hiện tại"));
    assert.equal(host.querySelectorAll(".attack-damage-row").length, 5);
    await click(tab("KỸ NĂNG"));
    const skills = host.querySelectorAll(".enemy-skill-entry");
    assert.equal(skills.length, i === 3 ? 6 : 7);
    const names = [...skills].map(
      (s) => s.querySelector("summary strong").textContent,
    );
    assert.equal(names.filter((s) => s === "Special 1").length, 1);
    assert.equal(names.filter((s) => s === "Special 2").length, 1);
    const text = [...skills].map((s) => s.textContent).join(" ");
    assert.ok(
      text.includes(
        [
          "Melancholic Melodies",
          "Realm of the Arcana",
          "The Last Symphony",
          "The Last Symphony",
        ][i],
      ),
    );
    if (i >= 2) {
      assert.ok(!text.includes("Seed Planted"));
      assert.ok(!names.includes("Overture"));
    }
    await click(tab("PASSIVE SKILL"));
    const passives = host.querySelectorAll(".passive-compact");
    assert.equal(passives.length, [5, 7, 10, 5][i]);
    assert.ok([...passives].some((p) => p.textContent.includes("Boss Shield")));
    assert.ok([...passives].some((p) => p.textContent.includes("Stun")));
    if (i === 3)
      assert.ok(
        ![...passives].some(
          (p) => p.querySelector("h4").textContent === "A Major",
        ),
      );
    assert.equal(
      host.querySelector(".boss-global-timeline").textContent,
      globalTimeline,
    );
  }
  await act(async () =>
    host
      .querySelector(".boss-phase-selector")
      .dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Home", bubbles: true }),
      ),
  );
  assert.equal(phase("OVERTURE").getAttribute("aria-pressed"), "true");
  await act(async () =>
    host
      .querySelector(".boss-phase-selector")
      .dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "End", bubbles: true }),
      ),
  );
  assert.equal(phase("RUSH").getAttribute("aria-pressed"), "true");
  assert.equal(host.querySelectorAll(".darkon-tactical-inspection").length, 1);
  assert.equal(host.querySelectorAll(".formation-slot").length, 4);
  assert.equal(host.querySelectorAll(".phase-rotations details").length, 0);
  const teamSelector = host.querySelector(".tactical-team-selector");
  await click(
    [...teamSelector.querySelectorAll("button")].find(
      (b) => b.textContent === "Team 4",
    ),
  );
  assert.equal(phase("RUSH").getAttribute("aria-pressed"), "true");
  await click(host.querySelectorAll(".formation-primary")[0]);
  assert.equal(
    host.querySelector(".tactical-class-inspection h4").textContent,
    "Void Highlord",
  );
  await click(phase("RECITATIVE"));
  assert.equal(
    host.querySelector(".tactical-team-selector button[aria-pressed=true]")
      .textContent,
    "Team 4",
  );
  assert.ok(
    host
      .querySelector(".tactical-class-inspection")
      .textContent.includes("3.000"),
  );
  assert.equal(host.querySelectorAll(".formation-slot").length, 4);
  await click(
    [...teamSelector.querySelectorAll("button")].find(
      (b) => b.textContent === "Team 1",
    ),
  );
  const alt = host.querySelector('[aria-label="Class thay thế vị trí 3"]');
  assert.equal(
    [...alt.querySelectorAll("button")].find(
      (b) => b.getAttribute("aria-label") === "Infinity Titan",
    ).textContent,
    "IT",
  );
  await click(
    [...alt.querySelectorAll("button")].find(
      (b) => b.getAttribute("aria-label") === "Infinity Titan",
    ),
  );
  assert.equal(host.querySelectorAll(".formation-slot").length, 4);
  assert.equal(
    host.querySelector(".tactical-class-inspection h4").textContent,
    "Infinity Titan",
  );
  assert.equal(phase("RECITATIVE").getAttribute("aria-pressed"), "true");
  await act(async () => root.unmount());
  await window.happyDOM.close();
});
