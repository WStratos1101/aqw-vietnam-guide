import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { Window } from "happy-dom";
const source = ts.createSourceFile(
  "safari.mjs",
  fs.readFileSync("tests/safari.mjs", "utf8"),
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
);
const functionText = (name) => {
  const node = source.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === name,
  );
  assert.ok(node, name);
  return node.getText(source);
};
test("reset pointer sequence waits for delivered down before up; it never synthesizes click or sleeps for success", async () => {
  const calls = [];
  const pointer = new Function(
    "find",
    "execute",
    "command",
    "waitFor",
    functionText("pointerClick") + ";return pointerClick;",
  )(
    async (script, args) => {
      assert.deepEqual(args, [".class-empty button"]);
      return "reset";
    },
    async () => {},
    async (method, path, payload) => calls.push({ method, path, payload }),
    async (script) => calls.push({ wait: script }),
  );
  await pointer(".class-empty button");
  assert.equal(calls.length, 5);
  assert.deepEqual(
    calls[0].payload.actions[0].actions.map((a) => a.type),
    ["pointerMove", "pointerDown"],
  );
  assert.match(calls[1].wait, /Pointer.down/);
  assert.deepEqual(calls[2].payload.actions[0].actions, [
    { type: "pointerUp", button: 0 },
  ]);
  assert.match(calls[3].wait, /Pointer.up/);
  assert.equal(calls[4].method, "DELETE");
  assert.ok(!functionText("pointerClick").includes("dispatchEvent"));
  assert.ok(!functionText("pointerClick").includes("pause("));
});
test("select-by-value sends input/change and rejects absent or disabled options without an option click", async () => {
  const window = new Window();
  try {
    window.document.body.innerHTML =
      '<select aria-label="Vai trò"><option value="all">Mọi vai trò</option><option value="Support">Support</option><option value="disabled" disabled>Disabled</option></select>';
    const select = window.document.querySelector("select"),
      events = [];
    for (const event of ["input", "change"])
      select.addEventListener(event, () =>
        events.push({ event, value: select.value }),
      );
    const execute = async (script, args) =>
      new Function("document", "Event", "return function(){" + script + "}")(
        window.document,
        window.Event,
      )(...args);
    const choose = new Function(
      "execute",
      "assert",
      functionText("selectValue") + ";return selectValue;",
    )(execute, assert);
    await choose('select[aria-label="Vai trò"]', "Support");
    assert.equal(select.value, "Support");
    assert.deepEqual(events, [
      { event: "input", value: "Support" },
      { event: "change", value: "Support" },
    ]);
    await assert.rejects(
      choose('select[aria-label="Vai trò"]', "missing"),
      /Enabled option not found/,
    );
    await assert.rejects(
      choose('select[aria-label="Vai trò"]', "disabled"),
      /Enabled option not found/,
    );
    assert.equal(select.value, "Support");
  } finally {
    await window.happyDOM.close();
  }
});

test("empty search uses native deletion instead of silent Element Clear", async () => {
  let value = "zz",
    requests = [];
  const fill = new Function(
    "find",
    "execute",
    "command",
    "waitFor",
    "revealControl",
    functionText("fill") + ";return fill;",
  )(
    async () => "search",
    async () => value.length,
    async (method, path, body) => {
      requests.push({ method, path, body });
      assert.equal(path, "/element/search/value");
      assert.equal(body.text, "\uE003");
      value = value.slice(0, -1);
    },
    async (script, message, args) => assert.ok(value.length < args[1]),
    async () => {},
  );
  await fill(".fv2-search input", "");
  assert.equal(value, "");
  assert.equal(requests.length, 2);
  assert.ok(!requests.some((r) => r.path.endsWith("/clear")));
});

test("Safari reveals only offscreen controls and waits for a hittable viewport rectangle", async () => {
  let rect = {
    x: 20,
    y: 1500,
    top: 1500,
    bottom: 1544,
    left: 20,
    right: 120,
    width: 100,
    height: 44,
  };
  const scrolls = [],
    element = {
      getBoundingClientRect: () => rect,
      contains: () => false,
      scrollIntoView: (options) => {
        scrolls.push(options);
        rect = { ...rect, y: 100, top: 100, bottom: 144 };
      },
    };
  let hit = element;
  const execute = async (script, args) =>
    new Function(
      "document",
      "innerHeight",
      "innerWidth",
      "return function(){" + script + "}",
    )(
      { elementFromPoint: () => hit },
      1000,
      1440,
    )(...args);
  const reveal = new Function(
    "execute",
    "waitFor",
    functionText("revealElement") + ";return revealElement;",
  )(execute, async (script, message, args) => {
    assert.equal(await execute(script, args), true, message);
  });
  await reveal(element);
  assert.deepEqual(scrolls, [
    { block: "center", inline: "nearest", behavior: "instant" },
  ]);
  await reveal(element);
  assert.equal(scrolls.length, 1, "visible controls must not scroll");
  hit = {};
  await assert.rejects(reveal(element), /Control is not visible/);
});

test("Safari native Element Click follows visibility preparation and retains failure diagnostics", async () => {
  const calls = [],
    report = {};
  const click = new Function(
    "find",
    "revealElement",
    "execute",
    "command",
    "report",
    functionText("click") + ";return click;",
  )(
    async () => "summary",
    async (ref) => {
      assert.equal(ref["element-6066-11e4-a52e-4f735466cecf"], "summary");
      calls.push("reveal");
    },
    async () => ({ tag: "SUMMARY" }),
    async (method, path) => {
      calls.push("click");
      assert.equal(method, "POST");
      assert.equal(path, "/element/summary/click");
      assert.equal(report.currentCommandTarget.tag, "SUMMARY");
      throw Error("native click failed");
    },
    report,
  );
  await assert.rejects(click("return summary"), /native click failed/);
  assert.deepEqual(calls, ["reveal", "click"]);
  assert.equal(report.currentCommandTarget, undefined);
});
