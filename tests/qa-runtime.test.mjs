import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  runQa,
  selectFarmBrowser,
  formatQaError,
} from "../scripts/qa-runtime.mjs";

test("FARM_BROWSER overrides legacy AQW_BROWSER; default is Chromium", () => {
  assert.equal(selectFarmBrowser({}), "chromium");
  assert.equal(selectFarmBrowser({ AQW_BROWSER: "chromium" }), "chromium");
  assert.equal(
    selectFarmBrowser({ FARM_BROWSER: "webkit", AQW_BROWSER: "chromium" }),
    "webkit",
  );
});
test("error formatting retains the original stack and nested cause", () => {
  const error = new Error("outer", {
    cause: new Error("root network failure"),
  });
  const message = formatQaError(error);
  assert.match(
    message,
    /Error: outer[\s\S]*Caused by: Error: root network failure/,
  );
  assert.match(message, /qa-runtime.test.mjs/);
});
async function harness(t) {
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "aqw-farm-qa-"));
  const previousExitCode = process.exitCode;
  t.after(() => {
    process.exitCode = previousExitCode;
  });
  const messages = [],
    closed = [];
  const browser = {
    close: async () => {
      closed.push("browser");
    },
  };
  return {
    outputDir,
    messages,
    closed,
    browser,
    options: {
      outputDir,
      browserName: "webkit",
      logger: { error: (value) => messages.push(value), log: () => {} },
      serverFactory: async () => ({
        url: "http://fixture.invalid",
        close: async () => {
          closed.push("server");
        },
      }),
      playwrightFactory: async () => ({
        webkit: { launch: async () => browser },
      }),
    },
  };
}
test("UI assertion failure prints full stack, current route, writes report and exits nonzero", async (t) => {
  const h = await harness(t);
  const result = await runQa(
    "farm",
    async ({ result }) => {
      result.currentStep = {
        width: 375,
        name: "route /class",
        url: "http://fixture.invalid/class",
      };
      assert.equal(0, 1, "main is not rendered yet");
    },
    h.options,
  );
  assert.equal(result.status, "failed");
  assert.equal(result.phase, "ui");
  assert.equal(result.cause, "ui_assertion_failed");
  assert.equal(process.exitCode, 1);
  assert.match(
    h.messages.join("\n"),
    /route \/class[\s\S]*AssertionError[\s\S]*qa-runtime.test.mjs/,
  );
  assert.deepEqual(h.closed, ["browser", "server"]);
  const saved = JSON.parse(
    await fs.readFile(path.join(h.outputDir, "results.json"), "utf8"),
  );
  assert.deepEqual(saved.errors, result.errors);
});
test("permission-denied server startup is BLOCKED with actual stack, never UI PASS", async (t) => {
  const h = await harness(t);
  h.options.serverFactory = async () => {
    throw new Error("listen EPERM: operation not permitted 127.0.0.1");
  };
  const result = await runQa(
    "farm",
    () => assert.fail("UI must not run"),
    h.options,
  );
  assert.equal(result.status, "server_start_blocked");
  assert.equal(result.cause, "os_or_sandbox_permission_denied");
  assert.match(h.messages[0], /listen EPERM[\s\S]*qa-runtime.test.mjs/);
});
test("browser launch failure and cleanup failures retain diagnostic evidence", async (t) => {
  const h = await harness(t);
  h.options.playwrightFactory = async () => ({
    webkit: {
      launch: async () => {
        throw new Error("Abort trap: 6 exitCode=134");
      },
    },
  });
  const result = await runQa(
    "farm",
    () => assert.fail("UI must not run"),
    h.options,
  );
  assert.equal(result.status, "browser_launch_blocked");
  assert.equal(result.cause, "browser_process_crash");
  assert.deepEqual(h.closed, ["server"]);
  h.options.playwrightFactory = async () => ({
    webkit: {
      launch: async () => ({
        close: async () => {
          throw new Error("cleanup also failed");
        },
      }),
    },
  });
  const ui = await runQa(
    "farm",
    () => {
      throw new Error("original UI failure");
    },
    h.options,
  );
  assert.equal(ui.status, "failed");
  assert.match(ui.errors[0], /original UI failure/);
  assert.match(ui.errors[1], /cleanup also failed/);
});
test("invalid browser configuration fails before starting server", async (t) => {
  const h = await harness(t);
  h.options.browserName = "safari";
  h.options.serverFactory = () =>
    assert.fail("Must validate browser before server startup");
  const result = await runQa("farm", () => {}, h.options);
  assert.equal(result.cause, "invalid_configuration");
  assert.match(result.errors[0], /Unsupported browser "safari"/);
});
