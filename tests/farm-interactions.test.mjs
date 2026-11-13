import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { build } from "esbuild";
import { Window } from "happy-dom";
import { act, createElement } from "react";
const window = new Window({ url: "http://localhost/farm" });
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
await fs.mkdir("artifacts/qa", { recursive: true });
const result = await build({
  stdin: {
    contents: "export {Directory} from './src/features/farm/route.farm-v2-legacy';",
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
  "artifacts/qa/farm-interactions.mjs",
  result.outputFiles[0].text,
);
const { Directory } = await import("../artifacts/qa/farm-interactions.mjs");
const host = document.createElement("div");
document.body.append(host);
const root = createRoot(host);
const click = async (e) => {
  assert.ok(e);
  await act(async () =>
    e.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
  );
};
const filter = (name) =>
  [...host.querySelectorAll(".farm-type-tabs button")].find((b) =>
    b.textContent.startsWith(name),
  );
const region = (name) =>
  [...host.querySelectorAll(".farm-region-list button")].find((b) =>
    b.textContent.startsWith(name),
  );
test("Region → type → item updates detail, empty filters work, and checklist persists", async () => {
  await act(async () => root.render(createElement(Directory)));
  assert.equal(
    host.querySelector(".farm-detail").dataset.itemId,
    "blade-of-awe",
  );
  await click(filter("Capes"));
  assert.equal(
    host.querySelector(".farm-detail").dataset.itemId,
    "cape-of-awe",
  );
  const input = host.querySelector(".material-tree input");
  await click(input);
  assert.equal(input.checked, true);
  await click(filter("Weapons"));
  await click(filter("Capes"));
  assert.equal(host.querySelector(".material-tree input").checked, true);
  assert.ok(localStorage.getItem("aqw:materials:v2:farm:cape-of-awe:merge-1"));
  assert.equal(
    region("Dwarfhold"),
    undefined,
    "Uncertain/seasonal items are excluded by default",
  );
  assert.equal(filter("Helms").disabled, true, "Conflicting Helm is excluded");
  await click(region("Arcangrove"));
  assert.equal(host.querySelector(".farm-detail").dataset.itemId, "shaman");
  assert.equal(host.querySelectorAll(".farm-item-row").length, 1);
  assert.match(
    host.querySelector(".farm-detail").textContent,
    /Arcangrove Rank 10/,
  );
  const scope = host.querySelector('[aria-label="Phạm vi availability"]');
  await act(async () => {
    scope.value = "reference";
    scope.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  await click(region("Chưa xác minh"));
  await click(filter("Weapons"));
  const rows = [...host.querySelectorAll(".farm-item-row")];
  assert.ok(rows.length > 2);
  await click(rows[1]);
  assert.equal(
    host.querySelector("#farm-item-title").textContent,
    rows[1].querySelector("strong").textContent,
  );
});
test("direct item props select correct region/type and reset stale search on navigation", async () => {
  await act(async () =>
    root.render(createElement(Directory, { slug: "polly-roger" })),
  );
  assert.equal(
    host.querySelector(".farm-detail").dataset.itemId,
    "polly-roger",
  );
  assert.equal(region("Dwarfhold").getAttribute("aria-pressed"), "true");
  assert.equal(filter("Pets").getAttribute("aria-pressed"), "true");
  await act(async () =>
    root.render(createElement(Directory, { slug: "sin-of-the-abyss" })),
  );
  assert.equal(
    host.querySelector(".farm-detail").dataset.itemId,
    "sin-of-the-abyss",
  );
  assert.equal(region("Chưa xác minh").getAttribute("aria-pressed"), "true");
  const image = host.querySelector(".farm-preview img");
  await act(async () => image.dispatchEvent(new window.Event("error")));
  assert.match(
    host.querySelector(".farm-preview").textContent,
    /Chưa có ảnh xác minh/,
  );
  // Query URLs survive reload and select Region/category/item together.
  window.history.replaceState(
    null,
    "",
    "/farm?region=arcangrove&category=class&view=now&item=shaman",
  );
  await act(async () => root.render(createElement(Directory)));
  assert.equal(host.querySelector(".farm-detail").dataset.itemId, "shaman");
  assert.equal(filter("Classes").getAttribute("aria-pressed"), "true");
  assert.match(window.location.search, /region=arcangrove/);
  await act(async () => root.unmount());
});
