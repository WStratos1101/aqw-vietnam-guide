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
const browserTemp=path.join(projectRoot,".playwright-browsers",".tmp");
await fs.mkdir(browserTemp,{recursive:true});
process.env.TMPDIR=browserTemp;
export async function ensureServer() {
  if (process.env.AQW_QA_URL) {
    const url = process.env.AQW_QA_URL;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw Error(`Localhost unavailable: ${r.status}`);
    return { url, close: async () => {} };
  }
  const port = await new Promise((resolve) => {
    const s = net.createServer();
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
export async function runQa(kind, run) {
  const dir = `artifacts/qa/${kind}`;
  await fs.mkdir(dir, { recursive: true });
  const result = {
    kind,
    status: "not_run",
    startedAt: new Date().toISOString(),
    browser: process.env.AQW_BROWSER || "chromium",
    browserPath: process.env.PLAYWRIGHT_BROWSERS_PATH,
    cases: [],
    screenshots: [],
    errors: [],
  };
  let server, browser;
  try {
    server = await ensureServer();
    result.baseUrl = server.url;
    const pw = await import("@playwright/test");
    const engine = pw[result.browser];
    if (!engine) throw Error("Unsupported AQW_BROWSER");
    try {
      browser = await engine.launch({
        headless: process.env.AQW_HEADED !== "1",
        timeout: 15000,
        ...(result.browser === "chromium" ? { chromiumSandbox: true } : {}),
      });
    } catch (e) {
      result.status = "browser_launch_blocked";
      result.cause = classifyLaunchError(e.message);
      throw e;
    }
    result.status = "running";
    await run({ browser, base: server.url, result, dir, expect: pw.expect });
    result.status = result.cases.some((c) => c.status === "failed")
      ? "failed"
      : "passed";
  } catch (e) {
    if (result.status === "not_run") result.status = "not_run";
    else if (result.status === "running") result.status = "failed";
    result.errors.push(e.stack || e.message);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    await server?.close();
    result.finishedAt = new Date().toISOString();
    await fs.writeFile(
      `${dir}/results.json`,
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log({
      kind,
      status: result.status,
      cases: result.cases.length,
      screenshots: result.screenshots.length,
      cause: result.cause,
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
