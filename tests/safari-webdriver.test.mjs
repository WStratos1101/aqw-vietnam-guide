import test from "node:test";
import assert from "node:assert/strict";
import {
  requestSafariDriver,
  webdriverDiagnostic,
} from "./lib/safari-webdriver.mjs";
test("driver failure captures command/status/W3C error/step and redacts secrets before limiting body to 3 KB", async () => {
  const recorded = [];
  let sent;
  await assert.rejects(
    requestSafariDriver({
      base: "http://localhost:4444",
      method: "POST",
      endpoint: "/session/private-session/element/button/value",
      body: { text: "private-input" },
      step: { name: "Class keyboard", url: "/class?token=private-token" },
      onError: (d) => recorded.push(d),
      fetcher: async (url, init) => {
        sent = JSON.parse(init.body);
        return new Response(
          JSON.stringify({
            value: {
              error: "invalid argument",
              message:
                "Missing value at /session/private-session; Bearer private-auth",
              data: {
                token: "private-token",
                cookie: "private-cookie",
                password: "private-password",
              },
              stacktrace: "x".repeat(5000),
            },
          }),
          { status: 400 },
        );
      },
    }),
    (error) => {
      assert.equal(error.webdriver.command, "Element Send Keys");
      assert.equal(error.webdriver.httpStatus, 400);
      assert.equal(error.webdriver.w3cError, "invalid argument");
      assert.match(error.message, /Class|Element Send Keys/);
      return true;
    },
  );
  assert.deepEqual(sent, { text: "private-input" });
  assert.equal(recorded.length, 1);
  const diagnostic = recorded[0];
  assert.ok(Buffer.byteLength(diagnostic.responseBody) <= 3072);
  assert.match(diagnostic.responseBody, /truncated/);
  assert.equal(diagnostic.step.name, "Class keyboard");
  assert.doesNotMatch(
    JSON.stringify(diagnostic),
    /private-(session|token|cookie|password|auth|input)/,
  );
});
test("plain non-JSON HTTP error and root-level W3C errors remain inspectable", () => {
  const plain = webdriverDiagnostic(
    "POST",
    "/session/secret/actions",
    500,
    "upstream unavailable",
    { name: "Keys" },
  );
  assert.equal(plain.command, "Actions");
  assert.equal(plain.responseBody, "upstream unavailable");
  const root = webdriverDiagnostic(
    "POST",
    "/session/secret/element/button/value",
    400,
    JSON.stringify({
      error: "invalid argument",
      message: "Missing required value",
    }),
    { name: "Keyboard" },
  );
  assert.equal(root.w3cError, "invalid argument");
  assert.equal(root.w3cMessage, "Missing required value");
});
test("success retains ordinary WebDriver return value", async () => {
  const value = await requestSafariDriver({
    base: "http://localhost",
    method: "POST",
    endpoint: "/session/id/execute/sync",
    body: { script: "return true", args: [] },
    onError: () => assert.fail("No error expected"),
    fetcher: async () =>
      new Response(JSON.stringify({ value: true }), { status: 200 }),
  });
  assert.equal(value, true);
});

test("empty W3C message is preserved and response limit counts UTF-8 bytes", () => {
  const d = webdriverDiagnostic(
    "POST",
    "/session/id/element/node/click",
    400,
    JSON.stringify({
      value: {
        error: "element not interactable",
        message: "",
        stacktrace: "界".repeat(4000),
      },
    }),
    { name: "Acquisition route" },
  );
  assert.equal(d.w3cMessage, "");
  assert.equal(d.command, "Element Click");
  assert.ok(Buffer.byteLength(d.responseBody) <= 3072);
  assert.doesNotMatch(d.responseBody, /�/);
});
