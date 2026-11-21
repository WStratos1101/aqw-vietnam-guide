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
  assert.match(host.querySelector("[role=tabpanel]").textContent,/Legendary Stonewrit/);
  assert.doesNotMatch(host.querySelector("[role=tabpanel]").textContent,/Nostalgia|Dual Blades of Awe/);
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
  await navigate("/farm?category=class&q=Infinity+Titan&item=infinity-titan-class&view=reference");
  assert.equal(host.querySelectorAll(".fv2-item").length, 1);
  assert.equal(host.querySelector("[data-item-id]").dataset.itemId, "infinity-titan-class");
  assert.equal(
    tab("Nguyên liệu"),
    undefined,
    "no material tab without route materials",
  );
  await click(tab("Cách nhận"));
  assert.match(
    host.querySelector("[role=tabpanel]").textContent,
    /0 ACs/,
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
  assert.equal(routes.length, 0,"one ordinary route needs no route picker");
  assert.doesNotMatch(host.querySelector("[role=tabpanel]").textContent,/Nostalgia Quest/);
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
  await navigate("/farm?category=class&q=Infinity+Titan&view=reference");
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
  await click(button('[aria-label="Chọn nguyên liệu"] button',"Exalted Apotheosis"));
  assert.equal(host.querySelector('[data-item-id]').dataset.itemId,"dual-exalted-apotheosis");
  assert.match(host.querySelector('[aria-label="Nguyên liệu đang chọn"]').textContent,/Exalted Apotheosis/);
  assert.ok(window.location.search.includes('farm-material='));
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
      .textContent.includes("Khác"),
    true,
  );
  for (const tile of host.querySelectorAll(".fv2-groups button")) {
    assert.equal(tile.type, "button");
    assert.equal(tile.tabIndex, 0);
    assert.ok(tile.hasAttribute("aria-pressed"));
    assert.ok(tile.getAttribute("aria-label").startsWith("Lọc phe phái:"));
    assert.ok(tile.title);
    assert.equal(tile.querySelector(".fv2-group-initial"), null);
  }
  for (const tile of host.querySelectorAll(".fv2-item"))
    assert.doesNotMatch(tile.textContent, /Cần đối chiếu|Chưa rõ thời điểm mở/);
  const css = await fs.readFile("src/features/farm/farm-v2.css", "utf8");
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  const mobileGroupLayout = css.match(/@media \(max-width: 720px\) \{\s*\.fv2-groups nav \{([^}]+)\}([\s\S]*?)\n\}/g)?.at(-1);
  assert.ok(mobileGroupLayout, "mobile faction layout is defined");
  assert.match(mobileGroupLayout, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(mobileGroupLayout, /overflow: visible/);
  assert.match(mobileGroupLayout, /\.fv2-group-all \{\s*position: static/);
  assert.match(css, /:focus-visible/);
});

test("actual Quest tabs preserve completion, mode independence and keyboard navigation", async () => {
  await navigate("/farm?item=legion-revenant-class");
  await click(tab("Cách nhận"));
  await click(button(".fv32-workflow-summary button","Legion Fealty 2"));
  assert.equal(tab("Hướng dẫn Farm").getAttribute("aria-selected"),"true");
  const panel=()=>host.querySelector('[aria-label="Quest đang chọn"]');
  assert.equal(host.querySelectorAll('.fv31-step-numbers [role=tab]').length,3);
  assert.match(panel().textContent,/Legion Fealty 2/);
  assert.deepEqual([...panel().querySelector('.fv32-material-table thead').querySelectorAll('th')].map(th=>th.textContent), ['Tên nguyên liệu','Số lượng','Map farm','Điều kiện farm']);
  assert.doesNotMatch(panel().querySelector('thead').textContent,/quái|Monster/);
  await act(async()=>host.querySelector('.fv31-step-numbers [role=tab]').dispatchEvent(new window.KeyboardEvent("keydown",{bubbles:true,key:"End"})));
  assert.match(panel().textContent,/Legion Fealty 4/);
  assert.equal(document.activeElement,host.querySelectorAll(".fv31-step-numbers button")[2]);
  assert.equal(host.querySelectorAll('.fv31-step-numbers [aria-selected=true]')[0].textContent,"3");
  await click(panel().querySelector('input'));assert.equal(panel().querySelector('input').checked,true);
  await click(button('[aria-label="Phương án farm"] button',"Farm bằng Insignia"));
  assert.match(host.querySelector('.fv32-insignia-sources').textContent,/31/);
  assert.equal(host.querySelector('.fv31-step-numbers button[title="Dage, Lord of the Undead Legion"]'),null);
  assert.match(host.querySelector('.fv32-insignia-sources').textContent,/ultradage/);
  await click(button('[aria-label="Phương án farm"] button',"Farm thông thường"));
  await click(host.querySelectorAll('.fv31-step-numbers button')[2]);
  assert.equal(panel().querySelector('input').checked,true);
  await navigate("/farm?item=blade-of-awe");
  assert.equal(tab("Thông tin").getAttribute("aria-selected"),"true");
  await click(tab("Hướng dẫn Farm"));
  assert.equal(host.querySelector('.fv31-step-actions'),null);
  assert.doesNotMatch(panel().textContent,/Nostalgia|Bước 1\s*\/\s*1/);
});
test("V3.1 Wiki info is localized, Sources cards removed, and Role filters share Codex membership/history", async () => {
  await act(async () => root.render(createElement(Directory)));
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
  assert.equal(host.querySelector(".fv2-boost").textContent.trim(), "Không");
  assert.doesNotMatch(
    host.querySelector(".fv31-wiki-info").textContent,
    /Tên và loại khớp Wiki/,
  );
  await click(tab("Cách nhận"));
  assert.equal(host.querySelector(".fv2-sources"), null);
  assert.equal(
    host.querySelector('.fv2-heading a').getAttribute('href'),
    'https://aqwwiki.wikidot.com/legion-revenant-class',
  );
  const catalog = JSON.parse(
    await fs.readFile("src/content/farm/catalog-v2.generated.json", "utf8"),
  );
  await navigate("/farm?category=all&subtype=Sword");
  assert.equal(host.querySelector(".fv2-subtypes"), null);
  assert.doesNotMatch(window.location.search, /subtype=/);
  await navigate("/farm?category=Classes&subtype=Support");
  assert.equal(host.querySelector(".fv2-subtypes"), null);
  assert.doesNotMatch(window.location.search, /subtype=/);
  assert.equal(host.querySelectorAll(".fv2-item").length, catalog.items.filter((i) => i.category === "Classes").length);
  await click(host.querySelector('.fv2-categories button[aria-label="Weapons"]'));
  assert.ok(host.querySelector(".fv2-subtypes"));
  assert.doesNotMatch(window.location.search, /subtype=/);
  await navigate("/farm?category=Armors&subtype=Support");
  assert.equal(host.querySelector(".fv2-subtypes"), null);
  assert.doesNotMatch(window.location.search, /subtype=/);
  await click(button(".fv2-groups button", "AWE"));
  assert.doesNotMatch(window.location.search, /subtype=/);
  await navigate("/farm?category=Grounds&subtype=unrelated");
  assert.equal(host.querySelector(".fv2-subtypes"), null);
  assert.doesNotMatch(window.location.search, /subtype=/);
  assert.match(
    host.querySelector('.fv2-categories button[aria-label="Grounds"] img').src,
    /Ground_Table\.png$/,
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

test("multiple acquisition routes show the selected shop price or Quest reward without fabricating a stepper", async () => {
  await navigate("/farm?item=crag-bamboozle");
  await click(tab("Cách nhận"));
  assert.match(host.querySelector(".fv2-tab-body").textContent, /5,000 ACs/);
  await click(host.querySelectorAll(".fv2-route-chips button")[1]);
  assert.match(
    host.querySelector(".fv2-tab-body").textContent,
    /Assistance of Nulgath/,
  );
  await click(host.querySelectorAll(".fv2-route-chips button")[0]);
  await click(tab("Hướng dẫn Farm"));
  assert.equal(host.querySelector(".fv31-stepper"), null);
  await navigate("/farm?item=crimson-plate-of-nulgath");
  await click(tab("Hướng dẫn Farm"));
  const questButtons=host.querySelectorAll('.fv31-step-numbers [role=tab]');
  assert.equal(questButtons.length,1,"one valid Quest has exactly one numbered button");
  assert.ok([...questButtons].every(node=>node.title));
  assert.match(host.querySelector('.fv31-step-content').textContent,/Twisted Items of Nulgath/);
});

test("VHL modes preserve Crystal costs and internally navigate to Ultra materials",async()=>{
  await navigate("/farm?item=void-highlord-class");await click(tab("Hướng dẫn Farm"));
  assert.match(host.querySelector('.fv31-step-content').textContent,/Void HighLord's Challenge/);
  await click(button('[aria-label="Phương án farm"] button',"Farm bằng Insignia"));
  const ultra=host.querySelector('.fv32-insignia-sources');
  assert.match(ultra.textContent,/40/);assert.match(ultra.textContent,/Weekly/);
  assert.ok(ultra.querySelector('a[href="/ultra-boss/ultra-nulgath"]'));
  assert.equal(host.querySelector('[aria-label="Hướng dẫn Farm nguyên liệu"]'),null);
  await click(tab("Nguyên liệu"));
  assert.equal(button('[aria-label="Phương án farm"] button',"Farm bằng Insignia").getAttribute("aria-pressed"),"true");
  await click(button('[aria-label="Chọn nguyên liệu"] button',"Void Crystal B"));
  await click(button('.fv32-material-body table button',"Elders' Blood"));
  assert.match(host.querySelector('[aria-label="Nguyên liệu đang chọn"]').textContent,/2/);
  assert.ok(window.location.search.includes('farm-material='));
});
test("Reaper's Oath renders and switches its evidenced Quest alternatives",async()=>{
  await navigate("/farm/item/reaper-s-oath?farm-tab=guide");
  await click(tab("Hướng dẫn Farm"));
  for(const name of ["Obsidian Mining","Soul Forgery","Undead Legion Member Special"]){
    const option=button('[aria-label="Quest nhận thưởng"] button',name);
    await click(option);
    assert.equal(option.getAttribute("aria-pressed"),"true");
    const panel=host.querySelector('[aria-label="Quest đang chọn"]');
    assert.match(panel.textContent,new RegExp(name));
    assert.match(panel.textContent,/Reaper's Oath/);
    assert.ok(panel.querySelector('tbody tr'),"selected Quest shows its actual required materials");
  }
});
test("Legion Fealty final ingredients navigate to the selected Spellscroll source",async()=>{
  await navigate("/farm?item=legion-revenant-class");await click(tab("Hướng dẫn Farm"));
  await click(host.querySelectorAll('.fv31-step-numbers button')[2]);
  await click(button('.fv31-step-content button',"Revenant's Spellscroll"));
  const facts=host.querySelector('[aria-label="Nguyên liệu đang chọn"]');
  assert.match(facts.textContent,/Legion Fealty 1/);assert.match(facts.textContent,/20/);
  assert.match(facts.textContent,/Dracolich Contract/);
  assert.deepEqual([...facts.querySelector('.fv32-material-table thead').querySelectorAll('th')].map(th=>th.textContent),['Tên nguyên liệu','Số lượng','Map farm','Điều kiện farm']);
});


test("material links open a single dedicated guide, keep the mode and display purchase totals",async()=>{
  await navigate("/farm?item=legion-revenant-class&farm-tab=guide&farm-mode=insignia");
  assert.equal(host.querySelector('[aria-label="Hướng dẫn Farm nguyên liệu"]'),null);
  const notes=host.querySelector('[aria-label="Lưu ý khi farm bằng Insignia"]');
  assert.equal(notes.querySelectorAll("table").length,1);
  assert.equal(host.querySelector('[aria-label="Quest cần tự hoàn thành"]'),null);
  assert.equal(host.querySelector('[aria-label="Tổng nguyên liệu"]'),null);
  await click(button('[aria-label="Nội dung Insignia"] button',"Tổng nguyên liệu"));
  assert.equal(host.querySelectorAll('[aria-label="Tổng nguyên liệu"]').length,1);
  assert.match(notes.textContent,/31/);assert.match(notes.textContent,/5.550/);
  await click(tab("Nguyên liệu"));
  assert.equal(host.querySelectorAll('[aria-label="Hướng dẫn Farm nguyên liệu"]').length,1);
  await click(button('[aria-label="Chọn nguyên liệu"] button',"Exalted Crown"));
  await click(button('[aria-label="Nguồn nguyên liệu"] button',"Legion Fealty 3"));
  await click(button('.fv32-material-body table button',"Hooded Legion Cowl"));
  assert.equal(tab("Nguyên liệu").getAttribute("aria-selected"),"true");
  assert.match(window.location.search,/farm-mode=insignia/);
  const material=host.querySelector('[aria-label="Nguyên liệu đang chọn"]');
  assert.match(material.textContent,/Dage the Evil/);assert.match(material.textContent,/Undead Legion Shop/);
  assert.match(material.textContent,/underworld/);assert.match(material.textContent,/500.000 Gold/);
  assert.match(material.textContent,/Fail to the King/);
  assert.equal(material.querySelector('[aria-label="Chi phí mua"] tbody tr').textContent,"500.000 Gold1500.000 Gold");
});

test("drop material body renders the Monster once and keeps the reward",async()=>{
  await navigate("/farm?item=legion-revenant-class&farm-tab=materials&farm-material=darkblood-cohort-conquered");
  const material=host.querySelector('[aria-label="Nguyên liệu đang chọn"]');
  assert.equal(material.textContent.split("any monster in The Death Pits").length-1,1);
  assert.equal(material.textContent.split("/join deathpits").length-1,1);
  assert.match(material.textContent,/Phần thưởng: Darkblood Cohort Conquered/);
});


test("equivalent Ultra Aeacus drop profiles do not create duplicate source buttons",async()=>{
  await navigate("/farm?item=legion-revenant-class&farm-tab=materials&farm-material=aeacus-empowered");
  const material=host.querySelector('[aria-label="Nguyên liệu đang chọn"]');
  assert.equal(material.textContent.split("Ultra Aeacus").length-1,1);
  assert.match(material.textContent,/judgement/);
});


test("verified set inventory navigates to canonical Farm guides and standalone items have no empty tab",async()=>{
  await navigate("/farm?item=void-paladin");
  await click(tab("Set đồ"));
  assert.equal(host.querySelectorAll(".fv-set-grid > a").length,8);
  const current=host.querySelector('.fv-set-grid a[aria-current="page"]');assert.match(current.textContent,/Void Paladin/);
  assert.equal(host.querySelectorAll(".fv-set-grid img:not(.fv2-type-icon)").length,8);
  const helmet=host.querySelector('.fv-set-grid a[href*="/farm/item/void-paladin-helm?"]');
  assert.ok(helmet);assert.equal(helmet.href.includes("farm-tab=guide"),true);
  await click(helmet);
  assert.equal(host.querySelector('[data-item-id]').dataset.itemId,"void-paladin-helm");
  assert.equal(tab("Hướng dẫn Farm").getAttribute("aria-selected"),"true");
  assert.match(window.location.pathname,/void-paladin-helm/);assert.match(window.location.search,/category=Helms/);
  assert.match(host.querySelector('.fv31-step-content').textContent,/A Dark Temptation/);
  await navigate("/farm?item=void-paladin&farm-tab=sets&farm-set=void-paladin");
  assert.equal(tab("Set đồ").getAttribute("aria-selected"),"true");
  await navigate("/farm?item=legion-revenant-class");assert.equal(tab("Set đồ"),undefined);
});

test("all twelve V4 items are searchable in the regular directory and open canonical detail tabs",async()=>{
  const coverage=JSON.parse(await fs.readFile("src/content/farm/guide-coverage-v4.json","utf8"));
  const catalog=JSON.parse(await fs.readFile("src/content/farm/catalog-v2.generated.json","utf8"));
  for(const item of coverage){
    const canonical=catalog.items.find(entry=>entry.id===item.id);
    assert.ok(canonical,`${item.name} has a canonical generated record`);
    await navigate(`/farm?q=${encodeURIComponent(item.name)}&category=${encodeURIComponent(item.category)}&view=reference`);
    const row=host.querySelector(`[data-inventory-item="${item.id}"]`);
    assert.ok(row,`${item.name} appears through normal search`);
    await click(row);
    assert.equal(host.querySelector("[data-item-id]")?.dataset.itemId,item.id);
    assert.equal(host.querySelector("[role=tab][aria-selected=true]")?.textContent.trim(),"Thông tin");
    assert.ok(tab("Cách nhận"),`${item.name} uses the shared acquisition tab`);
    assert.ok(tab("Hướng dẫn Farm"),`${item.name} uses the shared guide tab`);
    const route=canonical.acquisitionRoutes[0];
    const hasMaterials=Boolean(route.materialTree||route.farmModes?.some(mode=>mode.materials.length)||route.questWorkflowIds?.length||route.farmTasks?.some(task=>task.rows.length));
    assert.equal(Boolean(tab("Nguyên liệu")),hasMaterials,`${item.name} only shows its materials tab when the route has material data`);
    assert.equal(Boolean(tab("Set đồ")),Boolean(canonical.setIds?.length||/^(?:Empowered )?Higure$/i.test(item.name.trim())));
    assert.match(host.querySelector(".fv2-heading")?.textContent||"",new RegExp(item.name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
    await click(tab("Cách nhận"));
    assert.ok(host.querySelector("[role=tabpanel]"),`${item.name} acquisition renders in the shared panel`);
    await click(tab("Hướng dẫn Farm"));
    assert.ok(host.querySelector("[role=tabpanel]"),`${item.name} guide renders in the shared panel`);
    if(hasMaterials){
      await click(tab("Nguyên liệu"));
      assert.ok(host.querySelector("[role=tabpanel]"),`${item.name} materials render in the shared panel`);
    }
  }
});


test("source fixtures retain isolated numbered quests and matching content", async () => {
  const {stepCases}=await import('./fixtures/farm-step-cases.mjs');
  for(const spec of stepCases){
    await navigate('/farm?'+new URLSearchParams({item:spec.itemId,'farm-route':spec.routeId,'farm-tab':'guide',...(spec.modeId?{'farm-mode':spec.modeId}:{})}));
    assert.equal(host.querySelector('[data-item-id]').dataset.itemId,spec.itemId);
    const buttons=()=>[...host.querySelectorAll('.fv31-step-numbers button')];
    assert.deepEqual(buttons().map(b=>b.textContent),spec.names.map((_,i)=>String(i+1)));
    assert.deepEqual(buttons().map(b=>b.title),spec.names);
    for(const [i,name] of spec.names.entries()){
      await click(buttons()[i]);
      assert.equal(buttons()[i].getAttribute('aria-selected'),'true');
      assert.ok([...host.querySelectorAll('.fv31-step-content h4')].some(h=>h.textContent===name));
    }
    if(spec.itemId==='legion-revenant-class'){
      assert.equal(host.querySelectorAll('section[aria-label="Cách nhận cuối"]').length,1);
      assert.match(host.querySelector('section[aria-label="Cách nhận cuối"]').textContent,/Legion Fealty 4/);
      await click(button('[aria-label="Phương án farm"] button',spec.modeId==='standard'?'Farm bằng Insignia':'Farm thông thường'));
      assert.equal(buttons()[0].getAttribute('aria-selected'),'true');
      assert.equal(buttons().length,3);
      assert.doesNotMatch(host.querySelector('.fv31-step-content').textContent,/Legion Fealty 3|Training With Dage/);
    }
  }
});


test("direct merge renders once, canonical item link and currency reset UI stay correct",async()=>{
  const catalog=JSON.parse(await fs.readFile('src/content/farm/catalog-v2.generated.json','utf8'));
  for(const itemId of ['cape-of-awe','blade-of-awe']){
    await navigate('/farm?item='+itemId+'&farm-tab=guide');
    assert.equal(host.querySelectorAll('.fv31-step-content h4').length,1);
    const link=[...host.querySelectorAll('.fv2-heading a')].find(a=>a.textContent==='Liên kết vật phẩm');
    assert.equal(link.href,catalog.items.find(i=>i.id===itemId).wikiUrl);
    assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');
  }
  await navigate('/farm?item=legion-revenant-class&farm-tab=guide&farm-mode=insignia');
  assert.doesNotMatch(host.textContent,/reset giữa các lượt; chỉ tính currency/);
  assert.match(host.querySelector('.fv2-specs').textContent,/7 lượt Weekly/);
});


test("material totals use a separate Quest condition column without item accordions",async()=>{
  await navigate('/farm?item=legion-revenant-class&farm-tab=guide&farm-mode=insignia');
  await click(button('[aria-label="Nội dung Insignia"] button','Tổng nguyên liệu'));
  const table=host.querySelector('[aria-label="Tổng nguyên liệu"] table');
  assert.deepEqual([...table.querySelectorAll('th')].map(th=>th.textContent),['Tên nguyên liệu','Số lượng','Map farm','Điều kiện farm']);
  assert.ok(table.querySelectorAll('tbody tr').length>0);
  for(const row of table.querySelectorAll('tbody tr')){
    assert.equal(row.children.length,4);
    assert.equal(row.querySelector('details'),null);
    assert.doesNotMatch(row.children[3].textContent,/Yêu cầu|phần thưởng|Chưa xác minh/);
    assert.ok(row.children[1].textContent.trim());
  }
  const aeacus=[...table.querySelectorAll('tbody tr')].find(row=>row.children[0].textContent==='Aeacus Empowered');
  assert.equal(aeacus.children[3].textContent,'Legion Fealty 1');
  assert.equal(aeacus.children[2].textContent,'/join judgement');
});
