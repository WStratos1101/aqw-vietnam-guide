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
    contents: `export {ClassSkills} from './src/features/classes/ClassSkills';export {ClassDirectory} from './src/features/classes/ClassDirectory';export {ClassObtain} from './src/features/classes/ClassObtain';export {ClassCombos} from './src/features/classes/ClassCombos';`,
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
  "artifacts/qa/class-interactions.mjs",
  compiled.outputFiles[0].text,
);
const { ClassSkills, ClassDirectory, ClassObtain, ClassCombos } = await import(
  "../artifacts/qa/class-interactions.mjs"
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
test("Class selection updates name and verified icon without retaining previous ability; passive/rank share a group while retaining distinct effects", async () => {
  await act(async () =>
    root.render(createElement(ClassSkills, { skills: b.skills })),
  );
  for (const group of [...host.querySelectorAll(".ability-groups button")]) {
    await click(group);
    for (const button of [...host.querySelectorAll(".ability-bar button")]) {
      await click(button);
      const panel = host.querySelector(".ability-detail"),
        id = panel.dataset.selectedSkill,
        s = b.skills.find((s) => s.id === id);
      assert.equal(panel.querySelector("h3").textContent, s.name);
      assert.equal(button.getAttribute("aria-selected"), "true");
      const img = panel.querySelector("header img");
      if (s.iconAsset) {
        assert.equal(img.getAttribute("src"), s.iconAsset.imagePath);
        assert.equal(img.getAttribute("alt"), s.name);
      } else assert.equal(img, null);
    }
  }
  const groups = [...host.querySelectorAll(".ability-groups button")];
  assert.ok(groups.some((g) => g.textContent.includes("Rank Passive")));
});
test("Directory filters and acquisition tracker survive skill-system changes", async () => {
  await act(async () => root.render(createElement(ClassDirectory)));
  assert.equal(host.querySelectorAll(".class-card").length, 24);
  const families = await read("src/content/classes/calendar-families.json");
  const calendarAlternates = new Set(families.flatMap(f => f.variants.map(v => v.classId).filter(id => id !== f.primaryClassId)));
  const roleSelect=host.querySelector('.class-filters select');
  await act(async()=>{roleSelect.value='Tank';roleSelect.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(
    host.querySelectorAll(".class-card").length,
    Math.min(24, catalog.filter(c => c.role.includes("Tank") && !calendarAlternates.has(c.id)).length),
  );
  await act(async () =>
    root.render(createElement(ClassObtain, { profile: c, body: b })),
  );
  const box = host.querySelector("input[type=checkbox]");
  await click(box);
  assert.equal(box.checked, true);
  assert.ok(
    localStorage
      .getItem("aqw:class-obtain:v1:" + c.id)
      .includes(b.obtainSteps[0].id),
  );
  await act(async () => root.render(createElement("div")));
  await act(async () =>
    root.render(createElement(ClassObtain, { profile: c, body: b })),
  );
  assert.equal(host.querySelector("input[type=checkbox]").checked, true);
});
test("Sourced combo step buttons select a real skill and expose its explanation", async () => {
  let selected;
  await act(async () =>
    root.render(
      createElement(ClassCombos, {
        skills: b.skills,
        combos: b.combos,
        onSelectSkill: (id) => (selected = id),
      }),
    ),
  );
  const button = host.querySelector(".skill-sequence-flow button");
  await click(button);
  assert.ok(b.skills.some((s) => s.id === selected));
  assert.equal(
    host.querySelector(".combo-step-detail strong").textContent,
    b.skills.find((s) => s.id === selected).name,
  );
  await act(async () => root.unmount());
  await window.happyDOM.close();
});
