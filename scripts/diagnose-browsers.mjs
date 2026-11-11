import {
  projectRoot,
  classifyLaunchError,
  ensureServer,
} from "./qa-runtime.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
const dir = "artifacts/qa/diagnostics";
await fs.mkdir(dir, { recursive: true });
const { chromium, webkit } = await import("@playwright/test");
const report = {
  at: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  os: os.release(),
  node: process.version,
  playwright: JSON.parse(
    await fs.readFile("node_modules/playwright-core/package.json"),
  ).version,
  projectRoot,
  browserPath: process.env.PLAYWRIGHT_BROWSERS_PATH,
  attempts: [],
};
let server;
try {
  server = await ensureServer();
  report.localhost = { status: "passed", url: server.url };
} catch (e) {
  report.localhost = { status: "failed", error: e.message };
}
for (const [name, engine, headless] of [
  ["chromium-headless", chromium, true],
  ["chromium-headed", chromium, false],
  ["webkit-headless", webkit, true],
]) {
  const executable = engine.executablePath();
  let exists = false,
    executablePermission = false;
  try {
    await fs.access(executable);
    exists = true;
    await fs.access(executable, 1);
    executablePermission = true;
  } catch {}
  let browser;
  const attempt = {
    name,
    executable,
    exists,
    executablePermission,
    headless,
    status: "not_run",
  };
  try {
    browser = await engine.launch({
      headless,
      timeout: 12000,
      ...(name.startsWith("chromium") ? { chromiumSandbox: true } : {}),
    });
    const page = await browser.newPage();
    await page.goto(server?.url || "about:blank");
    attempt.status = "passed";
  } catch (e) {
    attempt.status = "browser_launch_blocked";
    attempt.cause = classifyLaunchError(e.message);
    attempt.error = e.stack || e.message;
    await fs.writeFile(path.join(dir, name + ".log"), attempt.error);
  } finally {
    await browser?.close();
    report.attempts.push(attempt);
    console.log({ name, status: attempt.status, cause: attempt.cause, exists });
  }
}
await server?.close();
await fs.writeFile(
  path.join(dir, "results.json"),
  JSON.stringify(report, null, 2) + "\n",
);
