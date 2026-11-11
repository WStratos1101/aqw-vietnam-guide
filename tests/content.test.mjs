import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import path from "node:path";
import { isComingSoon } from "../src/lib/site-feature-access.mjs";
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  new Function("exports", "require", code)(exports, (name) =>
    name.endsWith(".json")
      ? JSON.parse(
          fs.readFileSync(path.resolve(path.dirname(file), name), "utf8"),
        )
      : name.endsWith("site-feature-access.mjs") ? { isComingSoon } : load(path.resolve(path.dirname(file), name + ".ts")),
  );
  return exports;
}
const { guides, href } = load("src/content/data.ts");
const { searchEntries } = load("src/lib/search.ts");
const { readStored, readStoredValue, writeStored } = load("src/lib/storage.ts");
test("Class identity resolves confirmed aliases to a single canonical entity",()=>{
  const {classIdentity}=load('src/lib/class-identity.ts');
  assert.equal(classIdentity('DT').id,'dragon-of-time');
  assert.equal(classIdentity('EDoT').id,classIdentity('Dragon of Time').id);
  assert.equal(classIdentity('CDK').name,'Chrono DragonKnight');
  assert.equal(classIdentity('unverified-abbreviation'),undefined);
});
test("object-shaped material progress persists through a guarded storage reader",()=>{
  const saved={selected:{branch:'halberd'},completed:['star-piece']};
  const valid=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Array.isArray(v.completed)&&typeof v.selected==='object';
  globalThis.localStorage={getItem:()=>JSON.stringify(saved)};
  assert.deepEqual(readStoredValue('materials',{},valid),saved);
  globalThis.localStorage={getItem:()=>'["wrong-shape"]'};
  assert.deepEqual(readStoredValue('materials',{},valid),{});
  globalThis.localStorage={getItem:()=>{throw Error('denied');}};
  assert.deepEqual(readStoredValue('materials',{},valid),{});
});
test("unique valid routes, source provenance and section anchors", () => {
  const paths = guides.map(href);
  assert.equal(new Set(paths).size, paths.length);
  for (const e of guides) {
    assert(e.sources.length);
    assert(e.sections.length);
    assert.equal(new Set(e.sections.map((s) => s.id)).size, e.sections.length);
    for (const s of e.sources) {
      assert(new URL(s.url));
      assert.match(s.checkedAt || s.accessedAt, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
});
test("Vietnamese accent-insensitive and multi-token search", () => {
  assert(searchEntries(guides, "BAT DAU").some((e) => e.slug === "bat-dau"));
  assert(searchEntries(guides, "phep thuat").some((e) => e.slug === "mage"));
  assert.equal(searchEntries(guides, "zxzxzx").length, 0);
  assert(searchEntries(guides, "blade awe").length >= 2);
});
test("farm requirements reference preceding steps and materials are explicit", () => {
  const f = guides.find((e) => e.category === "farm");
  assert.equal(f.materials.length, 5);
  const seen = new Set();
  for (const s of f.checklist) {
    if (s.requires) assert(seen.has(s.requires));
    seen.add(s.id);
  }
  assert.equal(f.checklist.length, 6);
});
test("storage tolerates corruption and denied browser persistence", () => {
  globalThis.localStorage = {
    getItem: () => "{bad",
    setItem: () => {
      throw Error("denied");
    },
  };
  assert.deepEqual(readStored("x", []), []);
  assert.equal(writeStored("x", []), false);
  globalThis.localStorage = { getItem: () => '{"wrong":true}' };
  assert.deepEqual(readStored("x", []), []);
  globalThis.localStorage = { getItem: () => '["one"]' };
  assert.deepEqual(readStored("x", []), ["one"]);
});
test("all related slugs resolve and unverified rotations stay absent", () => {
  for (const e of guides) {
    for (const slug of e.related) assert(guides.some((g) => g.slug === slug));
    if (e.category === "class") assert.equal(e.rotation, undefined);
  }
});

test("all required beginner systems have substantive sourced articles", () => {
  for (const slug of [
    "enhancement",
    "stats",
    "combat",
    "reputation",
    "hanh-trang",
    "quest-mechanics",
    "gold-adventurecoins",
    "membership",
  ]) {
    const entry = guides.find(
      (g) => g.category === "he-thong" && g.slug === slug,
    );
    assert(entry, slug);
    assert.equal(entry.status, "Đã đối chiếu");
    assert(
      entry.sources.some((s) => s.kind === "official"),
      slug,
    );
    assert(entry.sections.length >= 3, slug);
  }
});
const { resolveRoute } = load("src/lib/routes.ts");
test("invalid, prototype and malformed routes resolve to 404", () => {
  const categories = {
    "huong-dan": "Hướng dẫn",
    class: "Class",
    farm: "Farm",
    "trang-bi": "Trang bị",
    "he-thong": "Hệ thống",
    "cot-truyen": "Cốt truyện",
  };
  for (const route of [
    "/toString",
    "/constructor",
    "/%E0%A4%A",
    "/class/missing",
    "/class/warrior/extra",
  ])
    assert.equal(resolveRoute(route, guides, categories).is404, true, route);
  assert.equal(
    resolveRoute("/class/warrior/", guides, categories).entry.title,
    "Warrior",
  );
  assert.equal(resolveRoute("/", guides, categories).is404, false);
});

test("community material keeps read provenance separate from game verification", () => {
  for (const slug of [
    "cam-nang-aqw-vietnam",
    "thuat-ngu-aqw",
    "hieu-ve-boost",
  ]) {
    const entry = guides.find((g) => g.slug === slug);
    assert.equal(entry.status, "Theo tài liệu cộng đồng");
    const source = entry.sources.find((s) => s.kind === "community-guide");
    assert(source);
    assert.equal(source.checkedAt, undefined);
    assert.equal(source.accessedAt, "2026-11-05");
  }
  const commands = guides.find((g) => g.slug === "lenh-game");
  assert.equal(commands.status, "Theo tài liệu cộng đồng");
  assert(commands.imported);
  assert(
    commands.sources.every(
      (source) => source.kind === "community-guide" && !source.checkedAt,
    ),
  );
});
test("full text search locates native chapters and Class definitions", () => {
  const index = JSON.parse(
    fs.readFileSync("public/content/search-index.json", "utf8"),
  );
  assert(
    searchEntries(guides, "alchemy", index).some((g) => g.title === "Alchemy"),
  );
  assert(
    searchEntries(guides, "Mana Points", index).some(
      (g) => g.title === "Thuật ngữ chiến đấu",
    ),
  );
  assert(
    searchEntries(guides, "/who", index).some((g) => g.slug === "lenh-game"),
  );
  assert(
    searchEntries(guides, "Synthetic Viscera", index).some((g) => g.imported),
  );
});
