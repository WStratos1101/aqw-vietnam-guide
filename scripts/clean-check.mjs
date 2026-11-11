import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const source = process.cwd();
const target = fs.mkdtempSync(path.join(os.tmpdir(), "aqw-clean-check-"));
const result = {
  at: new Date().toISOString(),
  source,
  target,
  method:
    "Fresh independent node_modules reconstructed from exact lockfile versions; each file hash verified against pnpm cache integrity. Registry installation is not tested.",
  steps: [],
  status: "running",
};
for (const entry of [
  "src",
  "public",
  "content-sources",
  "vite.config.js",
  "scripts",
  "tests",
  "index.html",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
])
  fs.cpSync(path.join(source, entry), path.join(target, entry), {
    recursive: true,
  });
try {
  for (const [command, args] of [
    [process.execPath, ["scripts/restore-cache.mjs"]],
    ["npm", ["run", "content:import"]],
    ["npm", ["run", "typecheck"]],
    ["npm", ["run", "lint"]],
    ["npm", ["test"]],
    ["npm", ["run", "build"]],
    ["npm", ["run", "test:build"]],
    ["npm", ["run", "test:server"]],
  ]) {
    const run = spawnSync(command, args, {
      cwd: target,
      encoding: "utf8",
      timeout: 120000,
      env: {
        ...process.env,
        npm_config_cache: path.join(target, ".npm-cache"),
      },
    });
    const step = {
      command: [command, ...args].join(" "),
      exitCode: run.status,
      output: (run.stdout || "") + (run.stderr || ""),
      error: run.error?.message,
    };
    result.steps.push(step);
    console.log(step.command, "→", run.status);
    if (run.error || run.status !== 0) throw Error(step.error || step.output);
  }
  result.status = "passed";
} catch (e) {
  result.status = "failed";
  result.error = e.message;
  process.exitCode = 1;
} finally {
  fs.mkdirSync("qa", { recursive: true });
  fs.writeFileSync(
    "qa/clean-install.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log("Clean workspace:", target);
  console.log("Report: qa/clean-install.json");
}
