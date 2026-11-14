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
  assert.ok(
    host.querySelector("main#main.fv2-root"),
    "skip link target and landmark must survive integration",
  );
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
  assert.equal(tab("Nguồn"), undefined);
  await click(tab("Thông tin"));
  assert.ok(
    host.querySelector(".fv2-specs"),
    "basic specs must remain above all tabs",
  );
  assert.ok(
    host.querySelector("[role=tabpanel]").textContent.includes("Mô tả"),
  );
  assert.equal(host.querySelector(".fv2-sources"), null);
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
  assert.equal(document.activeElement, tab("Hướng dẫn Farm"));
  assert.equal(tab("Hướng dẫn Farm").getAttribute("aria-selected"), "true");
  assert.equal(
    host.querySelector("[role=tabpanel]").getAttribute("aria-labelledby"),
    tab("Hướng dẫn Farm").id,
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
  await click(button(".fv2-material-source summary", "Exalted Apotheosis"));
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
});

test("group tiles, category counts, aliases, search/sort and history restoration retain accessible controls", async () => {
  await navigate("/farm?group=museum&category=weapon&item=blade-of-awe");
  assert.equal(
    host
      .querySelector(".fv2-groups button[aria-pressed=true]")
      .textContent.includes("AWE"),
    true,
  );
  assert.equal(
    host.querySelector("[data-item-id]").dataset.itemId,
    "blade-of-awe",
  );
  assert.equal(host.querySelector(".fv2-regions"), null);
  const data = JSON.parse(
    await fs.readFile("src/content/farm/catalog-v2.generated.json", "utf8"),
  );
  const awe = data.items.filter((i) => i.groupIds.includes("awe"));
  const weapons = awe.filter((i) => i.category === "Weapons");
  assert.equal(
    Number(
      button(".fv2-categories button", "Weapons").querySelector("small")
        .textContent,
    ),
    weapons.length,
  );
  await click(button(".fv2-groups button", "GOOD"));
  assert.match(window.location.search, /group=good/);
  assert.doesNotMatch(window.location.search, /region=/);
  // Simulate the URLs supplied by browser back/forward; real browser execution is host-only.
  await navigate("/farm?group=awe&category=weapon&item=blade-of-awe");
  assert.equal(
    host.querySelector("[data-item-id]").dataset.itemId,
    "blade-of-awe",
  );
  await navigate("/farm?group=good&q=nonexistent");
  assert.ok(host.querySelector(".fv2-empty"));
  await navigate("/farm?group=unknown&sort=name");
  assert.equal(host.querySelector('[aria-label="Sắp xếp"]'), null);
  assert.equal(host.querySelector('[aria-label="Phạm vi availability"]'), null);
  const names = [...host.querySelectorAll(".fv2-item strong")].map(
    (e) => e.textContent,
  );
  assert.deepEqual(
    names,
    [...names].sort((a, b) => a.localeCompare(b, "en")),
  );
  assert.equal(
    host
      .querySelector(".fv2-groups button[aria-pressed=true]")
      .textContent.includes("Chưa xác minh nhóm"),
    true,
  );
  for (const tile of host.querySelectorAll(".fv2-groups button")) {
    assert.equal(tile.type, "button");
    assert.equal(tile.tabIndex, 0);
    assert.ok(tile.hasAttribute("aria-pressed"));
    assert.equal(tile.querySelector(".fv2-group-initial"), null);
  }
  const css = await fs.readFile("src/features/farm/farm-v2.css", "utf8");
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /:focus-visible/);
});

test("V3.1 shows only selected guide step, resets route/item/path, and keeps saved completion", async () => {
  await navigate("/farm?item=legion-revenant-class");
  assert.equal(tab("Nguồn"), undefined);
  await click(tab("Hướng dẫn Farm"));
  assert.equal(
    host.querySelectorAll(".fv31-step-numbers [role=tab]").length,
    11,
  );
  const panel = () => host.querySelector(".fv31-step-content");
  assert.match(panel().textContent, /Điều kiện mở khóa/);
  assert.doesNotMatch(panel().textContent, /Cohort Conquered/);
  await click(button(".fv31-step-actions button", "Tiếp"));
  assert.match(panel().textContent, /Aeacus/);
  await click(button(".fv31-step-actions button", "Trước"));
  assert.match(panel().textContent, /Điều kiện mở khóa/);
  const numbers = host.querySelector(".fv31-step-numbers");
  await act(async () =>
    numbers
      .querySelector("[role=tab]")
      .dispatchEvent(
        new window.KeyboardEvent("keydown", { bubbles: true, key: "End" }),
      ),
  );
  assert.equal(
    document.activeElement,
    numbers.querySelectorAll("[role=tab]")[10],
  );
  assert.match(panel().textContent, /Nhận Legion Revenant/);
  await click(panel().querySelector("input"));
  assert.equal(panel().querySelector("input").checked, true);
  await click(button('[aria-label="Chọn hướng dẫn"] button', "Ultra Dage"));
  assert.equal(
    host.querySelectorAll(".fv31-step-numbers [role=tab]").length,
    2,
  );
  assert.match(panel().textContent, /Nguồn bổ sung/);
  await click(button('[aria-label="Chọn hướng dẫn"] button', "Legion Fealty"));
  assert.match(panel().textContent, /Điều kiện mở khóa/);
  await click(host.querySelectorAll(".fv31-step-numbers button")[10]);
  assert.equal(panel().querySelector("input").checked, true);
  await navigate("/farm?item=blade-of-awe");
  assert.equal(tab("Thông tin").getAttribute("aria-selected"), "true");
  await click(tab("Hướng dẫn Farm"));
  assert.match(panel().textContent, /Bước 1/);
  await click(button(".fv31-step-actions button", "Tiếp"));
  await click(host.querySelectorAll(".fv2-route-chips button")[1]);
  assert.equal(
    host.querySelectorAll(".fv31-step-numbers [role=tab]").length,
    0,
  );
  assert.match(panel().textContent, /Merge Blade of Awe/);
  assert.equal(host.querySelector(".fv2-guide > small"), null);
  assert.equal(host.querySelector(".fv31-step-actions"), null);
  assert.doesNotMatch(panel().textContent, /Bước 1\s*\/\s*1/);
  await click(panel().querySelector("input"));
  assert.equal(panel().querySelector("input").checked, true);
  await click(host.querySelectorAll(".fv2-route-chips button")[0]);
  assert.match(panel().textContent, /Bước 1/);
});
test("V3.1 Wiki info is localized, Sources cards removed, and Role filters share Codex membership/history", async () => {
  await navigate("/farm?item=legion-revenant-class");
  assert.match(host.querySelector(".fv31-wiki-info").textContent, /Wizard/);
  assert.match(
    host.querySelector(".fv31-wiki-info").textContent,
    /Offensive Caster/,
  );
  assert.doesNotMatch(
    host.querySelector(".fv31-wiki-info").textContent,
    /Hiệu ứng đặc biệt|Điều kiện/,
  );
  assert.match(host.querySelector(".fv2-boost").textContent, /Chưa xác minh/);
  assert.doesNotMatch(
    host.querySelector(".fv31-wiki-info").textContent,
    /Tên và loại khớp Wiki/,
  );
  await click(tab("Cách nhận"));
  assert.equal(host.querySelector(".fv2-sources"), null);
  assert.equal(
    host.querySelector(
      'a[href="https://aqwwiki.wikidot.com/legion-revenant-class"]',
    ),
    null,
  );
  const catalog = JSON.parse(
    await fs.readFile("src/content/farm/catalog-v2.generated.json", "utf8"),
  );
  const roles = JSON.parse(
    await fs.readFile("src/data/class-roles.json", "utf8"),
  );
  await navigate("/farm?category=Classes&subtype=Support");
  const selector = host.querySelector('[aria-label="Role Class"]');
  assert.ok(selector);
  assert.equal(selector.value, "Support");
  assert.deepEqual(
    [...selector.options].map((o) => o.value),
    ["", ...roles, "unknown"],
  );
  const expected = catalog.items.filter(
    (i) => i.category === "Classes" && i.classRoles.includes("Support"),
  );
  assert.equal(host.querySelectorAll(".fv2-item").length, expected.length);
  assert.equal(
    new Set(
      [...host.querySelectorAll(".fv2-item")].map(
        (i) => i.dataset.inventoryItem,
      ),
    ).size,
    expected.length,
  );
  await click(button(".fv2-categories button", "Weapons"));
  assert.equal(host.querySelector('[aria-label="Role Class"]'), null);
  assert.doesNotMatch(window.location.search, /subtype=/);
  await navigate("/farm?category=Classes&subtype=Support");
  assert.equal(
    host.querySelector('[aria-label="Role Class"]').value,
    "Support",
  );
  await click(button(".fv2-groups button", "AWE"));
  assert.doesNotMatch(window.location.search, /subtype=/);
  await navigate("/farm?category=Classes&subtype=Endgame");
  assert.equal(host.querySelector('[aria-label="Role Class"]').value, "");
  await navigate("/farm?category=Classes&subtype=unknown");
  assert.equal(
    host.querySelectorAll(".fv2-item").length,
    catalog.items.filter(
      (i) => i.category === "Classes" && !i.classRoles.length,
    ).length,
  );
});
test("Farming Codex icons, Boost and exclusive material lookup preserve source and keyboard controls", async () => {
  await navigate("/farm?category=Weapons&subtype=Axe");
  assert.equal(host.querySelector("h1").textContent, "Farming Codex");
  assert.equal(
    host
      .querySelector('.fv2-subtypes [aria-label="Axe"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.match(
    host.querySelector('.fv2-subtypes [aria-label="Axe"] img').src,
    /Axe_Table.png$/,
  );
  await click(host.querySelector('.fv2-subtypes [aria-label="Sword"]'));
  const data = JSON.parse(
    await fs.readFile("src/content/farm/catalog-v2.generated.json", "utf8"),
  );
  assert.ok(
    [...host.querySelectorAll(".fv2-item")].every(
      (row) =>
        data.items.find((i) => i.id === row.dataset.inventoryItem)?.subtype ===
        "Sword",
    ),
  );
  assert.match(window.location.search, /subtype=Sword/);
  await navigate("/farm?item=sin-of-the-abyss");
  assert.match(host.querySelector(".fv2-boost").textContent, /51%.*25% Gold/);
  assert.doesNotMatch(
    host.querySelector(".fv2-specs").textContent,
    /Level yêu cầu/,
  );
  await navigate("/farm?item=blade-of-awe&region=greenguard-forest");
  await click(tab("Nguyên liệu"));
  const summaries = host.querySelectorAll(".fv2-material-source summary");
  assert.ok(summaries.length >= 2);
  await click(summaries[0]);
  assert.equal(host.querySelectorAll(".fv2-material-source[open]").length, 1);
  await click(summaries[1]);
  assert.equal(host.querySelectorAll(".fv2-material-source[open]").length, 1);
  assert.equal(host.querySelectorAll(".fv2-material-facts").length, 1);
  await click(summaries[1]);
  assert.equal(host.querySelectorAll(".fv2-material-facts").length, 0);
});
test.after(async () => {
  await act(async () => root.unmount());
});

test("zero-route acquisition facts remain visible without fabricating a route or stepper", async () => {
  await navigate("/farm?item=crag-bamboozle");
  await click(tab("Cách nhận"));
  assert.match(host.querySelector(".fv2-tab-body").textContent, /5,000 ACs/);
  assert.match(
    host.querySelector(".fv2-tab-body").textContent,
    /Assistance of Nulgath/,
  );
  await click(tab("Hướng dẫn Farm"));
  assert.match(host.querySelector(".fv2-tab-body").textContent, /5,000 ACs/);
  assert.equal(host.querySelector(".fv31-stepper"), null);
  await navigate("/farm?item=crimson-plate-of-nulgath");
  await click(tab("Hướng dẫn Farm"));
  assert.equal(
    host.querySelectorAll(".fv31-step-numbers [role=tab]").length,
    3,
  );
  assert.match(
    host.querySelector(".fv31-step-content").textContent,
    /Twisted Items of Nulgath/,
  );
  await click(button(".fv31-step-actions button", "Tiếp"));
  assert.match(
    host.querySelector(".fv31-step-content").textContent,
    /Totem of Nulgath ×3/,
  );
});
