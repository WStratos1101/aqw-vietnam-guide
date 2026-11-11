import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { Window } from "happy-dom";
import { build } from "esbuild";
import { act, createElement } from "react";
const read = async (p) => JSON.parse(await fs.readFile(p, "utf8"));
const window = new Window({ url: "http://localhost/class/archpaladin-ap" });
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
await fs.mkdir("artifacts/qa", { recursive: true });
const compiled = await build({
  stdin: {
    contents: `export {ClassInspectionTabs} from './src/features/classes/ClassInspectionTabs';export {ClassDetail} from './src/features/classes/ClassDetail';export {AcquisitionMaterials} from './src/features/classes/AcquisitionMaterials';`,
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
await fs.writeFile(
  "artifacts/qa/class-tabs-interactions.mjs",
  compiled.outputFiles[0].text,
);
const { ClassInspectionTabs, AcquisitionMaterials, ClassDetail } = await import(
  "../artifacts/qa/class-tabs-interactions.mjs"
);
const catalog = await read("src/content/classes/catalog.json"),
  c = catalog.find((c) => c.id === "archpaladin-ap"),
  b = await read("public" + c.bodyUrl);
const host = document.createElement("div");
document.body.append(host);
const root = createRoot(host);
const click = async (e) => {
  assert.ok(e);
  await act(async () =>
    e.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
  );
};
test("Real Class tabs expose one panel, support keyboard and preserve selected ability", async () => {
  await act(async () =>
    root.render(createElement(ClassInspectionTabs, { profile: c, body: b })),
  );
  const tabs = () => [
    ...host.querySelectorAll(".class-inspection-tabs [role=tab]"),
  ];
  const visible = () =>
    [...host.querySelectorAll("[data-class-panel]")].filter((p) => !p.hidden);
  assert.equal(tabs().length, 3);
  assert.equal(visible().length, 1);
  assert.equal(visible()[0].dataset.classPanel, "skills");
  const slot = host.querySelectorAll(".ability-bar button")[1];
  await click(slot);
  const skill = host.querySelector(".ability-detail").dataset.selectedSkill;
  await click(tabs()[1]);
  assert.equal(visible()[0].dataset.classPanel, "combo");
  assert.equal(
    host.querySelector("[data-class-panel=skills]").getAttribute("inert"),
    "",
  );
  await click(tabs()[0]);
  assert.equal(
    host.querySelector(".ability-detail").dataset.selectedSkill,
    skill,
  );
  await act(async () =>
    tabs()[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    ),
  );
  assert.equal(visible()[0].dataset.classPanel, "acquisition");
  assert.equal(document.activeElement, tabs()[2]);
  await act(async () =>
    tabs()[2].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    ),
  );
  assert.equal(visible()[0].dataset.classPanel, "skills");
});
test("Quest Reward shows only the named quest and preserves the independent AC shop", async () => {
  const catalog = await read("src/content/classes/catalog.json"),
    profile = catalog.find((c) => c.id.startsWith("lord-of-order")),
    body = await read("public" + profile.bodyUrl);
  await act(async () =>
    root.render(
      createElement(ClassInspectionTabs, { key: profile.id, profile, body }),
    ),
  );
  const main = () => [
    ...host.querySelectorAll(".class-inspection-tabs [role=tab]"),
  ];
  await click(main()[2]);
  const methodButtons = () => [
    ...host.querySelectorAll(".acquisition-method-tabs button"),
  ];
  const quest = methodButtons().find((t) => t.textContent.includes("QUEST"));
  assert.ok(quest);
  await click(quest);
  const card = host.querySelector(".acquisition-quest-card");
  assert.match(card.textContent, /Hoàn thành Quest: .* để nhận Class\./);
  assert.equal(
    card.querySelectorAll("input[type=checkbox], progress, .class-obtain-steps")
      .length,
    0,
  );
  const shop = methodButtons().find((t) => t.textContent.includes("SHOP"));
  await click(shop);
  assert.match(host.querySelector(".acquisition-price").textContent, /AC/);
  await click(quest);
  await click(main()[0]);
  await click(main()[2]);
  assert.ok(host.querySelector(".acquisition-quest-card"));
  assert.equal(
    host.querySelectorAll(".acquisition-quest-card input").length,
    0,
  );
  assert.equal(host.querySelectorAll(".class-acquisition-method").length, 1);
});
test("Merge OR branches are structural choices and checklist state persists", async () => {
  const tree = {
    kind: "allOf",
    requirements: [
      { kind: "item", itemId: "mandatory", name: "Mandatory", quantity: 2 },
      {
        kind: "anyOf",
        requiredChoices: 1,
        requirements: [
          { kind: "item", itemId: "a", name: "A", quantity: 1 },
          { kind: "item", itemId: "b", name: "B", quantity: 3 },
        ],
      },
    ],
  };
  await act(async () =>
    root.render(
      createElement(AcquisitionMaterials, { tree, scope: "test-branches" }),
    ),
  );
  assert.equal(host.querySelectorAll(".acquisition-material-row").length, 2);
  await click(host.querySelectorAll("input[type=radio]")[1]);
  assert.ok(
    host.querySelector(".acquisition-material-body").textContent.includes("B"),
  );
  assert.equal(host.querySelectorAll(".acquisition-material-row").length, 2);
  const box = host.querySelector(".acquisition-material-row input");
  await click(box);
  assert.equal(box.checked, true);
  await act(async () => root.render(createElement("div")));
  await act(async () =>
    root.render(
      createElement(AcquisitionMaterials, { tree, scope: "test-branches" }),
    ),
  );
  assert.equal(
    host.querySelector(".acquisition-material-row input").checked,
    true,
  );
  assert.equal(host.querySelectorAll("input[type=radio]")[1].checked, true);
});

test("Skill Inspector renders five Active stats and only the Passive unlock rank", async () => {
  const cav = catalog.find((c) => c.id === "chaos-avenger-cav");
  const cavBody = await read("public" + cav.bodyUrl);
  await act(async () =>
    root.render(
      createElement(ClassInspectionTabs, {
        key: cav.id,
        profile: cav,
        body: cavBody,
      }),
    ),
  );
  await click(
    [...host.querySelectorAll(".ability-bar button")].find(
      (b) => b.getAttribute("aria-label") === "Chaos Bulwark",
    ),
  );
  const stats = [...host.querySelectorAll(".active-stats > div")].map((row) => [
    row.querySelector("dt").textContent,
    row.querySelector("dd").textContent,
  ]);
  assert.deepEqual(stats, [
    ["Mana", "50 Mana"],
    ["Cooldown", "6 Seconds"],
    ["Rank", "3"],
    ["Range", "Infinite"],
    ["Target", "1"],
  ]);
  assert.match(
    host.querySelector(".target-effect-list").textContent,
    /Chaotic Armor.*60%.*15 giây/,
  );
  const blood = catalog.find((c) => c.id === "blood-ancient-ba");
  const bloodBody = await read("public" + blood.bodyUrl);
  await act(async () =>
    root.render(
      createElement(ClassInspectionTabs, {
        key: blood.id,
        profile: blood,
        body: bloodBody,
      }),
    ),
  );
  await click(
    [...host.querySelectorAll(".ability-groups button")].find((b) =>
      b.textContent.startsWith("Passive / Rank Passive"),
    ),
  );
  await click(
    [...host.querySelectorAll(".ability-bar button")].find(
      (b) => b.getAttribute("aria-label") === "Wonderful Night",
    ),
  );
  const passive = host.querySelector(".ability-detail");
  assert.equal(passive.querySelectorAll(".ability-stats").length, 0);
  assert.match(passive.querySelector(".passive-unlock").textContent, /Rank 10/);
  assert.match(
    passive.querySelector(".target-effect-list").textContent,
    /Tăng 50% Crit Damage/,
  );
  assert.doesNotMatch(
    passive.textContent,
    /Đối chiếu Wiki|Không áp dụng|Xem tác dụng/,
  );
});

test("Calendar variant keeps the active tab and selected skill while changing artwork and acquisition", async () => {
  globalThis.location = window.location;
  const css = catalog.find((c) => c.id === "calendar-chrono-shadowslayer");
  const body = await read("public" + css.bodyUrl);
  const seed = document.createElement("script");
  seed.id = "aqw-page-data";
  seed.textContent = JSON.stringify(body);
  document.body.append(seed);
  window.happyDOM.setURL("http://localhost/class/calendar-chrono-shadowslayer");
  await act(async () =>
    root.render(createElement(ClassDetail, { key: css.id, profile: css })),
  );
  const ability = [...host.querySelectorAll(".ability-bar button")].find(
    (b) => b.getAttribute("aria-label") === "Silver Bullet",
  );
  await click(ability);
  const selected = host.querySelector(".ability-detail").dataset.selectedSkill;
  const before = host.querySelector(".class-hero-portrait img").src;
  const hunter = [...host.querySelectorAll(".class-art-switch button")].find(
    (b) => b.textContent === "Chrono ShadowHunter",
  );
  await click(hunter);
  assert.match(host.querySelector("h1").textContent, /Chrono ShadowHunter/);
  assert.notEqual(host.querySelector(".class-hero-portrait img").src, before);
  assert.equal(
    host.querySelector(".ability-detail").dataset.selectedSkill,
    selected,
  );
  const tabs = [...host.querySelectorAll(".class-inspection-tabs [role=tab]")];
  await click(tabs[2]);
  assert.equal(
    host.querySelector("[data-class-panel=acquisition]").hidden,
    false,
  );
  assert.equal(
    host.querySelector(".class-acquisition-method").dataset.acquisitionType,
    "merge",
  );
  const slayer = [...host.querySelectorAll(".class-art-switch button")].find(
    (b) => b.textContent === "Chrono ShadowSlayer",
  );
  await click(slayer);
  assert.equal(
    host.querySelector("[data-class-panel=acquisition]").hidden,
    false,
  );
  assert.equal(
    host.querySelector(".class-acquisition-method").dataset.acquisitionType,
    "shop",
  );
  await click(tabs[0]);
  assert.equal(
    host.querySelector(".ability-detail").dataset.selectedSkill,
    selected,
  );
  seed.remove();
  await act(async () => root.unmount());
  await window.happyDOM.close();
});
