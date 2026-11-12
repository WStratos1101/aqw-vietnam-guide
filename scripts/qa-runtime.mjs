import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import net from "node:net";
export const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
process.chdir(projectRoot);
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(
  projectRoot,
  ".playwright-browsers",
);
const browserTemp = path.join(projectRoot, ".playwright-browsers", ".tmp");
await fs.mkdir(browserTemp, { recursive: true });
process.env.TMPDIR = browserTemp;
export async function ensureServer() {
  if (process.env.AQW_QA_URL) {
    const url = process.env.AQW_QA_URL;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw Error(`Localhost unavailable: ${r.status}`);
    return { url, close: async () => {} };
  }
  const port = await new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
  const log = await fs.open("artifacts/qa/server.log", "a");
  const child = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: projectRoot, stdio: ["ignore", log.fd, log.fd] },
  );
  const url = `http://127.0.0.1:${port}`;
  const close = async () => {
    child.kill("SIGTERM");
    await log.close();
  };
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return { url, close };
    } catch {}
    if (child.exitCode !== null) {
      await close();
      throw Error("Dev server exited; see artifacts/qa/server.log");
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  await close();
  throw Error("Localhost unavailable: dev server startup timeout");
}
export function classifyLaunchError(message) {
  if (/Executable doesn't exist|ENOENT/i.test(message))
    return "browser_binary_missing";
  if (
    /Permission denied|bootstrap_check_in|Operation not permitted|KERN_|EPERM/i.test(
      message,
    )
  )
    return "os_or_sandbox_permission_denied";
  if (/bad CPU|incompatible|wrong architecture|dyld.*not found/i.test(message))
    return "executable_incompatible";
  if (/Timeout.*exceeded|timed out/i.test(message))
    return "browser_launch_timeout";
  if (/SIGTRAP|SIGABRT|Abort trap|Target.*closed|exitCode=134/i.test(message))
    return "browser_process_crash";
  return "unclassified_launch_failure";
}
export function formatQaError(error) {
  if (!(error instanceof Error)) return String(error);
  return (
    (error.stack || error.message) +
    (error.cause ? "\nCaused by: " + formatQaError(error.cause) : "")
  );
}
export function selectFarmBrowser(env = process.env) {
  return env.FARM_BROWSER || env.AQW_BROWSER || "webkit";
}
export async function runQa(kind, run, options = {}) {
  const dir = options.outputDir || `artifacts/qa/${kind}`;
  const logger = options.logger || console;
  await fs.mkdir(dir, { recursive: true });
  const result = {
    kind,
    status: "not_run",
    phase: "configuration",
    startedAt: new Date().toISOString(),
    browser: options.browserName || process.env.AQW_BROWSER || "chromium",
    browserPath: process.env.PLAYWRIGHT_BROWSERS_PATH,
    cases: [],
    screenshots: [],
    errors: [],
  };
  let server, browser;
  const recordError = (error, phase) => {
    const stack = formatQaError(error);
    result.errors.push(stack);
    logger.error(
      `[QA ${kind}] ${phase}; browser=${result.browser}; step=${JSON.stringify(result.currentStep || null)}\n${stack}`,
    );
  };
  try {
    if (!["chromium", "webkit", "firefox"].includes(result.browser))
      throw Error(
        `Unsupported browser "${result.browser}". Use FARM_BROWSER=webkit, chromium or firefox for Farm.`,
      );
    result.phase = "server_start";
    server = await (options.serverFactory || ensureServer)();
    result.baseUrl = server.url;
    result.phase = "browser_launch";
    const pw = await (
      options.playwrightFactory || (() => import("@playwright/test"))
    )();
    const engine = pw[result.browser];
    browser = await engine.launch({
      headless: process.env.AQW_HEADED !== "1",
      timeout: 15000,
      ...(result.browser === "chromium" ? { chromiumSandbox: true } : {}),
    });
    result.phase = "ui";
    result.status = "running";
    await run({ browser, base: server.url, result, dir, expect: pw.expect });
    result.status = result.cases.some((c) => c.status === "failed")
      ? "failed"
      : "passed";
    if (result.status === "failed")
      throw Error("One or more QA cases failed; inspect case details.");
  } catch (error) {
    const cause = classifyLaunchError(error.message || String(error));
    if (result.phase === "server_start") {
      result.status =
        cause === "os_or_sandbox_permission_denied"
          ? "server_start_blocked"
          : "failed";
      result.cause =
        cause === "unclassified_launch_failure" ? "server_start_failed" : cause;
    } else if (result.phase === "browser_launch") {
      result.status = "browser_launch_blocked";
      result.cause = cause;
    } else {
      result.status = "failed";
      result.cause =
        result.phase === "configuration"
          ? "invalid_configuration"
          : error.code === "ERR_ASSERTION" || error.name === "AssertionError"
            ? "ui_assertion_failed"
            : "ui_test_error";
    }
    recordError(error, result.phase);
    process.exitCode = 1;
  } finally {
    // Cleanup must not hide the original stack or prevent writing the report.
    for (const [name, resource] of [
      ["browser", browser],
      ["server", server],
    ]) {
      try {
        await resource?.close();
      } catch (error) {
        recordError(error, `${name}_cleanup`);
        if (result.status === "passed") {
          result.status = "failed";
          result.cause = "cleanup_failed";
        }
        process.exitCode = 1;
      }
    }
    result.finishedAt = new Date().toISOString();
    await fs.writeFile(
      `${dir}/results.json`,
      JSON.stringify(result, null, 2) + "\n",
    );
    logger.log({
      kind,
      status: result.status,
      phase: result.phase,
      browser: result.browser,
      cases: result.cases.length,
      screenshots: result.screenshots.length,
      ...(result.cause ? { cause: result.cause } : {}),
    });
  }
  return result;
}
export async function inspectPage(page) {
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images].map(async (i) => {
        i.loading = "eager";
        try {
          await i.decode();
        } catch {}
      }),
    );
  });
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    brokenImages: [...document.images]
      .filter((i) => !i.complete || !i.naturalWidth)
      .map((i) => i.src),
  }));
}
