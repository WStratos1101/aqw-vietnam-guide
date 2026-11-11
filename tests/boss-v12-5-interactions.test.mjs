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
  "ResizeObserver",
  "IntersectionObserver",
  "history",
  "location",
  "PopStateEvent",
])
  globalThis[key] = key === "window" ? window : window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const compiled = await build({
  stdin: {
    contents: `export {BossPhaseProvider} from './src/features/ultra/BossPhaseInspection';export {EnemyInspection} from './src/features/ultra/EnemyInspection';export {Teams} from './src/features/ultra/Teams';export {TacticalBoard} from './src/features/ultra/TacticalBoard';export {UltraDetail as UltraBoss,UltraDirectory} from './src/features/ultra/UltraBoss';export {rotationPages,speakerStrategies,speakerAssignment} from './src/lib/speaker-strategies';export {findBoss} from './src/content/ultra';`,
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
await fs.mkdir("artifacts/qa/v12-5", { recursive: true });
await fs.writeFile(
  "artifacts/qa/v12-5/boss-ui-interactions.mjs",
  compiled.outputFiles[0].text,
);
const {
  BossPhaseProvider,
  EnemyInspection,
  Teams,
  findBoss,
  TacticalBoard,
  UltraBoss,
  UltraDirectory,
  rotationPages,
  speakerStrategies,
  speakerAssignment,
} = await import("../artifacts/qa/v12-5/boss-ui-interactions.mjs");
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

globalThis.matchMedia = window.matchMedia.bind(window);
test("Darkon HP status shows 70/20 markers, Aria 20→90 event and no fake Rush HP threshold", async () => {
  await act(async () =>
    root.render(
      createElement(
        BossPhaseProvider,
        null,
        createElement(EnemyInspection, { slug: "darkon-the-conductor" }),
      ),
    ),
  );
  assert.ok(host.querySelector('[data-hp-marker="70"]'));
  await click(phase("RECITATIVE"));
  assert.ok(host.querySelector('[data-hp-marker="20"]'));
  await click(phase("MADNESS"));
  const event = host.querySelector(".phase-aria-event").textContent;
  assert.ok(event.includes("20% HP") && event.includes("90% HP"));
  await click(phase("RUSH"));
  assert.equal(host.querySelector("[data-hp-marker]"), null);
  assert.ok(
    host
      .querySelector(".phase-aria-event")
      .textContent.includes("Aria Buffs Expire"),
  );
  assert.ok(!host.textContent.includes("Overture · Overture"));
  assert.ok(!host.textContent.includes("Nguồn: Challenge Boss Guide"));
});
test("Speaker selector has own steps and pagination; changing Team resets opening and synchronizes formation", async () => {
  await act(async () => root.render(createElement(TacticalBoard)));
  const buttons = () => [
    ...host.querySelectorAll(".speaker-team-selector button"),
  ];
  assert.equal(buttons().length, 6);
  for (let i = 0; i < 6; i++) {
    await click(buttons()[i]);
    const all = [];
    const pages = [...host.querySelectorAll(".rotation-phase-buttons button")];
    for (const p of pages) {
      await click(p);
      all.push(
        ...[...host.querySelectorAll("[data-step]")].map((e) =>
          Number(e.dataset.step),
        ),
      );
    }
    assert.deepEqual(
      all,
      speakerStrategies[i].rotationSteps.map((s) => s.order),
    );
    assert.equal(host.querySelectorAll(".team-role-card").length, 4);
  }
  await click(buttons()[0]);
  assert.equal(host.querySelector("[data-step]").dataset.step, "1");
  assert.equal(
    host.querySelector(".team-role-card strong").textContent,
    "Quantum Chronomancer",
  );
  const alt = [...host.querySelectorAll(".team-slot-alternatives button")].find(
    (b) => b.textContent === "VHL",
  );
  await click(alt);
  assert.equal(
    host.querySelector(".team-role-card strong").textContent,
    "Void Highlord",
  );
  await click(host.querySelectorAll(".rotation-phase-buttons button")[1]);
  assert.ok(host.querySelector(".rotation-table").textContent.includes("VHL"));
  await click(buttons()[5]);
  assert.equal(host.querySelector("[data-step]").dataset.step, "1");
  assert.equal(
    host.querySelector(".team-role-card strong").textContent,
    "Great Thief",
  );
  const s = speakerStrategies[0],
    choice = s.classSlots[0].alternativeClasses.find(
      (c) => c.abbreviation === "VHL",
    );
  assert.equal(
    speakerAssignment("QCM", s, { [s.classSlots[0].id]: choice.classId }).label,
    "QCM",
  );
});
test("Recommended Team preview, abbreviation, role and loadout follow the selected alternative", async () => {
  await act(async () =>
    root.render(createElement(Teams, { boss: findBoss("ultra-ezrajal") })),
  );
  const team = host.querySelector(".ultra-team");
  await click(team.querySelector(".ultra-team-toggle"));
  const card = team.querySelector(".team-role-card");
  const alternative = [
    ...card.querySelectorAll(".team-slot-alternatives button"),
  ].find((b) => b.getAttribute("aria-label") === "Chaos Avenger");
  assert.equal(alternative.textContent, "CAv");
  await click(alternative);
  assert.equal(
    card.querySelector("summary strong").textContent,
    "Chaos Avenger",
  );
  assert.equal(
    card.querySelector(":scope > small").textContent,
    "CLASS THAY THẾ",
  );
  assert.ok(
    team
      .querySelector(".ultra-team-icons > span > span")
      .firstChild.textContent.includes("Chaos Avenger"),
  );
  assert.ok(
    card.querySelector(".team-loadout").textContent.includes("Ravenous"),
  );
  assert.ok(
    !card.querySelector(".team-loadout").textContent.includes("Dauntless"),
  );
  assert.equal(team.querySelectorAll(".team-role-card").length, 4);
});
test("Boss back goes directly to verified directory and retains persisted progress", async () => {
  localStorage.setItem("qa-progress", "keep");
  await act(async () =>
    root.render(createElement(UltraBoss, { boss: findBoss("ultra-speaker") })),
  );
  let backCalls = 0;
  window.history.back = () => backCalls++;
  await click(host.querySelector(".ultra-back"));
  assert.equal(window.location.pathname, "/ultra-boss");
  assert.equal(backCalls, 0);
  assert.equal(localStorage.getItem("qa-progress"), "keep");
  window.sessionStorage.setItem("aqw:boss-directory:category", "weekly");
  await act(async () => root.render(createElement(UltraDirectory)));
  assert.equal(
    [...host.querySelectorAll(".challenge-filters button")]
      .find((b) => b.textContent === "Weekly Boss")
      .getAttribute("aria-pressed"),
    "true",
  );
  await act(async () => root.unmount());
  await window.happyDOM.close();
});
