import "./qa-runtime.mjs";
import { spawnSync } from "node:child_process";
const engines = process.argv.slice(2);
const run = spawnSync(
  process.execPath,
  [
    "node_modules/playwright/cli.js",
    "install",
    ...(engines.length ? engines : ["chromium", "webkit"]),
  ],
  { stdio: "inherit", env: process.env },
);
if (run.error) throw run.error;
process.exitCode = run.status ?? 1;
