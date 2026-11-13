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
const bundle = await build({
  stdin: {
    contents: "export {Directory} from './src/features/farm/route';",
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
  "artifacts/qa/farm-v2-interactions.mjs",
  bundle.outputFiles[0].text,
);
const { Directory } = await import("../artifacts/qa/farm-v2-interactions.mjs");
const host = document.createElement("div");
document.body.append(host);
const root = createRoot(host);
const click = async (e) => {
  assert.ok(e, "control missing");
  await act(async () =>
    e.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
  );
};
const button = (selector, text) =>
  [...host.querySelectorAll(selector)].find((e) =>
    e.textContent.includes(text),
  );
const tab = (text) => button("[role=tab]", text);
const navigate = async (url) => {
  window.history.replaceState(null, "", url);
  await act(async () =>
    window.dispatchEvent(new window.PopStateEvent("popstate")),
  );
};
test("production Directory renders V2, honors legacy query aliases, tabs and material checklist", async () => {
  window.history.replaceState(
    null,
    "",
    "/farm?region=greenguard-forest&category=cape&view=now&item=cape-of-awe",
  );
  await act(async () => root.render(createElement(Directory)));
  assert.ok(
    host.querySelector(".fv2-root"),
    "live route must not silently render legacy Directory",
  );
  assert.ok(host.querySelector("main#main.fv2-root"), "skip link target and landmark must survive integration");
  assert.equal(
    host.querySelector("[data-item-id]").dataset.itemId,
    "cape-of-awe",
  );
  assert.ok(host.querySelector(".fv2-specs"));
  await click(tab("Nguyên liệu"));
  assert.match(host.querySelector("[role=tabpanel]").textContent, /Cape Relic/);
  await click(host.querySelector(".material-tree input"));
  assert.equal(host.querySelector(".material-tree input").checked, true);
  await click(host.querySelector(".fv2-material-source summary"));
  assert.ok(host.querySelector(".fv2-material-source").open);
  await click(tab("Nguồn"));
  assert.ok(
    host.querySelector(".fv2-specs"),
    "basic specs must remain above all tabs",
  );
  assert.ok(
    host.querySelector(
      '[role=tabpanel] a[href="https://aqwwiki.wikidot.com/cape-of-awe"]',
    ),
  );
  await click(tab("Nguyên liệu"));
  assert.equal(
    host.querySelector(".material-tree input").checked,
    true,
    "progress survives tab switch",
  );
});
test("unknown-Region route remains discoverable for mapped canonical item and filters recipe precisely", async () => {
  await navigate(
    "/farm?item=blade-of-awe&region=unknown-region&view=reference",
  );
  assert.equal(
    host.querySelector("[data-item-id]").dataset.itemId,
    "blade-of-awe",
  );
  await click(tab("Nguyên liệu"));
  assert.match(
    host.querySelector("[role=tabpanel]").textContent,
    /Dual Blades of Awe/,
  );
  assert.doesNotMatch(
    host.querySelector("[role=tabpanel]").textContent,
    /Legendary Stonewrit/,
  );
  await navigate("/farm?item=blade-of-awe&region=greenguard-forest");
  await click(tab("Nguyên liệu"));
  assert.match(
    host.querySelector("[role=tabpanel]").textContent,
    /Legendary Stonewrit/,
  );
  assert.doesNotMatch(
    host.querySelector("[role=tabpanel]").textContent,
    /Dual Blades of Awe/,
  );
});
test("active item change resets tabs; tab keyboard controls focus and ARIA relationship", async () => {
  await navigate("/farm?region=arcangrove&category=class&item=shaman&view=now");
  assert.equal(host.querySelectorAll(".fv2-item").length, 1);
  assert.equal(host.querySelector("[data-item-id]").dataset.itemId, "shaman");
  assert.equal(
    tab("Nguyên liệu"),
    undefined,
    "no material tab without route materials",
  );
  await click(tab("Cách nhận"));
  assert.match(
    host.querySelector("[role=tabpanel]").textContent,
    /Arcangrove Rank 10/,
  );
  await act(async () =>
    tab("Cách nhận").dispatchEvent(
      new window.KeyboardEvent("keydown", { bubbles: true, key: "End" }),
    ),
  );
  assert.equal(document.activeElement, tab("Nguồn"));
  assert.equal(tab("Nguồn").getAttribute("aria-selected"), "true");
  assert.equal(
    host.querySelector("[role=tabpanel]").getAttribute("aria-labelledby"),
    tab("Nguồn").id,
  );
  await navigate("/farm?item=blade-of-awe");
  assert.equal(tab("Thông tin").getAttribute("aria-selected"), "true");
  await click(tab("Cách nhận"));
  const routes = host.querySelectorAll(".fv2-route-chips button");
  assert.equal(routes.length, 2);
  await click(routes[1]);
  assert.match(
    host.querySelector("[role=tabpanel]").textContent,
    /Nostalgia Quest/,
  );
});
test("deep-link slug, approved image error fallback, empty search and popstate filters", async () => {
  await act(async () =>
    root.render(createElement(Directory, { slug: "sin-of-the-abyss" })),
  );
  assert.equal(
    host.querySelector("[data-item-id]").dataset.itemId,
    "sin-of-the-abyss",
  );
  const image = host.querySelector(".fv2-image-large img");
  assert.ok(image);
  await act(async () => image.dispatchEvent(new window.Event("error")));
  assert.match(
    host.querySelector(".fv2-image-large").textContent,
    /Chưa có ảnh xác minh/,
  );
  await navigate("/farm?q=no-matching-equipment");
  assert.equal(host.querySelectorAll(".fv2-item").length, 0);
  assert.ok(host.querySelector(".fv2-empty"));
  await navigate("/farm?region=arcangrove&category=class&view=now");
  assert.equal(host.querySelectorAll(".fv2-item").length, 1);
  assert.equal(
    host
      .querySelector(".fv2-categories button[aria-pressed=true]")
      .textContent.trim()
      .startsWith("Classes"),
    true,
  );
  await navigate(
    "/farm?item=dual-exalted-apotheosis&category=weapon&region=unknown-region&view=reference",
  );
  await click(tab("Nguyên liệu"));
  const materialButton = button(
    ".fv2-material-source button",
    "Exalted Apotheosis",
  );
  await click(materialButton);
  assert.equal(
    host.querySelector("[data-item-id]").dataset.itemId,
    "exalted-apotheosis",
  );
  assert.equal(tab("Thông tin").getAttribute("aria-selected"), "true");
  await click(host.querySelector(".fv2-return"));
  assert.equal(
    host.querySelector("[data-item-id]").dataset.itemId,
    "dual-exalted-apotheosis",
  );
  assert.match(window.location.search, /region=unknown-region/);
  assert.match(window.location.search, /category=Weapons/);
  await act(async () => root.unmount());
});
