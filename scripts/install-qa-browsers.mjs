import "./qa-browser-env.mjs";
import fs from "node:fs";
const lock=JSON.parse(fs.readFileSync(new URL("../package-lock.json",import.meta.url)));
const installed=JSON.parse(fs.readFileSync(new URL("../node_modules/@playwright/test/package.json",import.meta.url)));
if(lock.packages["node_modules/@playwright/test"].version!==installed.version)throw Error("Playwright installed version differs from lockfile; use npm ci before browser install");
import { spawnSync } from "node:child_process";
const args = process.argv.slice(2);
const engines = args.filter(arg=>!arg.startsWith("--"));
const flags=args.filter(arg=>arg.startsWith("--"));
if(flags.some(flag=>!["--force","--dry-run"].includes(flag)))throw Error("Unsupported install option");
if(engines.some(engine=>!["chromium","webkit","firefox"].includes(engine)))throw Error("Unsupported browser engine");
const run = spawnSync(
  process.execPath,
  [
    "node_modules/playwright/cli.js",
    "install",
    ...flags,
    ...(engines.length ? engines : ["chromium", "webkit"]),
  ],
  { stdio: "inherit", env: process.env },
);
if (run.error) throw run.error;
process.exitCode = run.status ?? 1;
