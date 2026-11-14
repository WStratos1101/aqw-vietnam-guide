import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { Window } from "happy-dom";
import { build } from "esbuild";
import { act, createElement } from "react";
const window = new Window({ url: "http://localhost/class" });
for (const key of [
  "window",
  "document",
  "HTMLElement",
  "Node",
  "Event",
  "MouseEvent",
  "localStorage",
])
  globalThis[key] = key === "window" ? window : window[key];
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");
const bundle = await build({
  stdin: {
    contents:
      "export {ComboContext} from './src/features/classes/ComboContext';export {CalendarConsumables} from './src/features/classes/CalendarConsumables';export {FarmRouteFacts} from './src/features/farm/FarmRouteFacts';",
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
await fs.mkdir("artifacts/qa/v3-2", { recursive: true });
await fs.writeFile(
  "artifacts/qa/v3-2/ui-interactions.mjs",
  bundle.outputFiles[0].text,
);
const { ComboContext, CalendarConsumables, FarmRouteFacts } = await import(
  "../artifacts/qa/v3-2/ui-interactions.mjs"
);
const host = document.createElement("div");
document.body.append(host);
const root = createRoot(host);
const click = async (element) => {
  assert.ok(element);
  await act(async () =>
    element.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
  );
};
test("Timing and conditions have independent accessible panels, with no empty icons", async () => {
  await act(async () =>
    root.render(
      createElement(ComboContext, {
        text: "2 → 3. Chỉ dùng 4 khi đủ 3 stack.",
      }),
    ),
  );
  const timing = host.querySelector('[aria-label="Timing"]'),
    conditions = host.querySelector('[aria-label="Điều kiện"]');
  assert.equal(host.textContent.includes("Timing & điều kiện"), false);
  await click(timing);
  assert.equal(timing.getAttribute("aria-expanded"), "true");
  assert.equal(conditions.getAttribute("aria-expanded"), "false");
  assert.equal(
    document.getElementById(timing.getAttribute("aria-controls")).hidden,
    false,
  );
  await click(conditions);
  assert.equal(timing.getAttribute("aria-expanded"), "true");
  assert.equal(conditions.getAttribute("aria-expanded"), "true");
  await click(timing);
  assert.equal(conditions.getAttribute("aria-expanded"), "true");
  await act(async () =>
    root.render(createElement(ComboContext, { key: "empty", text: "" })),
  );
  assert.equal(host.querySelectorAll("button").length, 0);
});
test("Calendar items open by name and remain grouped independently for the correct year", async () => {
  await act(async () =>
    root.render(
      createElement(CalendarConsumables, {
        classId: "calendar-timeless-chronomancer",
      }),
    ),
  );
  assert.equal(host.querySelectorAll(".calendar-item-choice").length, 6);
  const power = host.querySelector('[aria-label="Chọn Hourglass of Power"]'),
    foresee = host.querySelector('[aria-label="Chọn Foresee Corruption"]');
  await click(power);
  await click(foresee);
  assert.equal(host.querySelectorAll(".calendar-item-detail").length, 2);
  assert.match(host.textContent, /Hourglass Inversion/);
  assert.match(host.textContent, /Change the Future/);
  await act(async () =>
    root.render(
      createElement(CalendarConsumables, {
        classId: "calendar-underworld-chronomancer",
      }),
    ),
  );
  assert.equal(host.querySelectorAll(".calendar-item-choice").length, 6);
  assert.match(host.textContent, /Timepieces/);
  assert.doesNotMatch(host.textContent, /Foresee Corruption/);
  await click(host.querySelector('[aria-label="Chọn Hourglass of Paradise"]'));
  assert.match(
    host.querySelector(".calendar-item-detail").textContent,
    /Distortion Through Time/,
  );
});
test("Quest material tables are divided by map, preserve quantity and keep unknown drop sources explicit", async () => {
  const route = {
    id: "fixture",
    method: "Quest",
    regionId: null,
    steps: [],
    sources: [],
    farmTasks: [
      {
        id: "q",
        quest: "Verified Quest",
        source: "https://aqwwiki.wikidot.com/fixture",
        requirements: ["Legacy requirement"],
        preconditions: ["Level 80"],
        rows: [
          {
            name: "Token A",
            quantity: 5,
            monster: "Monster A",
            map: "/join a",
          },
          { name: "Token B", quantity: 20, map: "/join b" },
        ],
        reward: "Verified reward",
      },
    ],
    location: "Quest NPC",
    mapCommand: "/join verifiedmap",
  };
  await act(async () => root.render(createElement(FarmRouteFacts, { route })));
  const questTitle = host.querySelector("h4");
  assert.equal(questTitle.textContent, "Verified Quest");
  assert.equal(questTitle.nextElementSibling.className, "fv32-quest-conditions");
  assert.match(questTitle.nextElementSibling.textContent, /Điều kiện nhận Quest/);
  assert.match(questTitle.nextElementSibling.textContent, /Level 80/);
  assert.doesNotMatch(questTitle.nextElementSibling.textContent, /Legacy requirement/);
  assert.match(host.textContent, /Nơi nhận: Quest NPC/);
  assert.match(host.textContent, /\/join verifiedmap/);
  assert.doesNotMatch(host.textContent, /\bRegion\b|<dt>Map<\/dt>/);
  assert.equal(host.querySelectorAll("table").length, 2);
  assert.equal(
    host.querySelectorAll('.fv32-table-scroll[tabindex="0"]').length,
    2,
  );
  assert.match(host.textContent, /Monster A/);
  assert.match(host.textContent, /Chưa xác minh/);
  assert.equal(
    host.querySelectorAll("tbody tr")[1].children[1].textContent,
    "20",
  );
});
test("Quest location keeps its receiver while hiding an unverified map command", async () => {
  const route = {
    id: "fixture-no-map",
    method: "Quest",
    regionId: null,
    location: "Known NPC",
    mapCommand: "unknown map name",
    steps: [],
    sources: [],
  };
  await act(async () => root.render(createElement(FarmRouteFacts, { route })));
  assert.match(host.textContent, /Known NPC/);
  assert.doesNotMatch(host.textContent, /\/join/);
  assert.doesNotMatch(host.textContent, /\bRegion\b|<dt>Map<\/dt>/);
});
test.after(async () => {
  await act(async () => root.unmount());
  await window.happyDOM.close();
});
