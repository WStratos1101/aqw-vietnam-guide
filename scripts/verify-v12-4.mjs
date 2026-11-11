import "./qa-runtime.mjs";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
await fs.mkdir("artifacts/qa/v12-4", { recursive: true });
const report = { at: new Date().toISOString(), checks: [] };
for (const name of [
  "lint",
  "typecheck",
  "test",
  "test:semantic",
  "build",
  "test:build",
  "test:server",
  "assets:validate-class-skills",
]) {
  const file = "artifacts/qa/v12-4/" + name.replaceAll(":", "-") + ".log",
    log = await fs.open(file, "w");
  const start = Date.now();
  const status = await new Promise((resolve) => {
    const p = spawn("npm", ["run", name], {
      stdio: ["ignore", log.fd, log.fd],
      env: process.env,
    });
    p.on("error", (e) => resolve({ code: 1, error: e.message }));
    p.on("close", (code) => resolve({ code }));
  });
  await log.close();
  const text = await fs.readFile(file, "utf8");
  const row = {
    name,
    status: status.code === 0 ? "passed" : "failed",
    exitCode: status.code,
    log: file,
    durationMs: Date.now() - start,
  };
  const count = text.match(/ℹ tests (\d+)/);
  if (count) row.tests = Number(count[1]);
  report.checks.push(row);
  console.log(row);
  if (status.code !== 0) {
    process.exitCode = 1;
    break;
  }
}
await fs.writeFile(
  "artifacts/qa/v12-4/checks.json",
  JSON.stringify(report, null, 2) + "\n",
);
