import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { build } from "esbuild";
import { Window } from "happy-dom";
import { act, createElement } from "react";

const compiled = await build({
  stdin: {
    contents: "export { enhancementRecords, enhancementOptions, findClassEnhancements, forgeAvailable } from './src/features/classes/enhancement-data';export { ClassEnhancementPanel } from './src/features/classes/ClassEnhancementPanel';",
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  packages: "external",
  loader: { ".css": "empty" },
});
await fs.mkdir("node_modules/.cache", { recursive: true });
const moduleFile = "node_modules/.cache/aqw-enhancement-test.mjs";
await fs.writeFile(moduleFile, compiled.outputFiles[0].text);
const { enhancementRecords, enhancementOptions, findClassEnhancements, forgeAvailable, ClassEnhancementPanel } = await import(`../${moduleFile}`);

test("Source keeps 248 exact identities and never invents missing slot values", () => {
  assert.equal(enhancementRecords.length, 248);
  assert.equal(new Set(enhancementRecords.map((r) => r.name)).size, 248);
  assert.equal(enhancementRecords.filter((r) => r.class === null).length, 47);
  assert.deepEqual(enhancementOptions(null), []);
  assert.deepEqual(enhancementOptions(" Lucky / Wizard/Lucky "), ["Lucky", "Wizard"]);
  const archmage = findClassEnhancements({ id: "archmage", name: "ArchMage" }, "ArchMage");
  assert.equal(archmage.row.name, "ArchMage");
  assert.deepEqual(enhancementOptions(archmage.row.weapon), ["Valiance", "Elysium", "Acheron"]);
});

test("StoneCrusher and Infinity Titan keep independent Awe recommendations", () => {
  const profile = { id: "stone-crusher-sc-infinity-titan-it", name: "StoneCrusher (SC) / Infinity Titan (IT)" };
  const sc = findClassEnhancements(profile, "StoneCrusher").row;
  const it = findClassEnhancements(profile, "Infinity Titan").row;
  assert.equal(sc.name, "StoneCrusher");
  assert.equal(it.name, "Infinity Titan");
  assert.deepEqual(enhancementOptions(sc.aweWeapon), ["Spiral Carve", "Awe Blast"]);
  assert.deepEqual(enhancementOptions(it.aweWeapon), ["Spiral Carve"]);
  assert.equal(findClassEnhancements(profile, "Unknown skin").row, null);
});

test("Missing Forge Class is not rewritten into a fabricated Forge recommendation", () => {
  const row = findClassEnhancements({ id: "alpha-pirate-pirate", name: "Alpha Pirate" });
  assert.equal(forgeAvailable(row.row), false);
  assert.deepEqual(enhancementOptions(row.row.weapon), []);
  assert.deepEqual(enhancementOptions(row.row.aweWeapon), ["Mana Vamp"]);
});

const browser = new Window({ url: "http://localhost/class/archpaladin-ap" });
for (const key of ["window","document","HTMLElement","Node","Event","MouseEvent","KeyboardEvent","MutationObserver"]) {
  globalThis[key] = key === "window" ? browser : browser[key];
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { createRoot } = await import("react-dom/client");

async function click(element) {
  assert.ok(element, "Expected clickable element");
  await act(async () => element.dispatchEvent(new browser.MouseEvent("click", { bubbles: true })));
}

test("Enhancement UI switches Forge/Awe and resets correctly across Class variants", async () => {
  const host = document.createElement("main");
  document.body.append(host);
  const root = createRoot(host);
  const profile = { id: "stone-crusher-sc-infinity-titan-it", name: "StoneCrusher (SC) / Infinity Titan (IT)" };
  await act(async () => root.render(createElement(ClassEnhancementPanel, { profile, variantName: "StoneCrusher" })));
  assert.equal(host.querySelector("[data-class-enhancement]").dataset.classEnhancement, "StoneCrusher");
  assert.ok(host.textContent.includes("Arcana's Concerto"));
  const awe = [...host.querySelectorAll('.aqw-class-enh__modes button')].find((b) => b.textContent.includes("Awe"));
  await click(awe);
  assert.equal(awe.getAttribute("aria-pressed"), "true");
  assert.ok(host.textContent.includes("Awe Blast"));
  assert.ok(!host.textContent.includes("Arcana's Concerto"));
  await act(async () => root.render(createElement(ClassEnhancementPanel, { profile, variantName: "Infinity Titan" })));
  assert.equal(host.querySelector("[data-class-enhancement]").dataset.classEnhancement, "Infinity Titan");
  await click([...host.querySelectorAll('.aqw-class-enh__modes button')].find((b) => b.textContent.includes("Awe")));
  assert.ok(host.textContent.includes("Spiral Carve"));
  assert.ok(!host.textContent.includes("Awe Blast"));
  await act(async () => root.unmount());
  host.remove();
});
