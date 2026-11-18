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
    "Fresh independent npm ci installation using exact package-lock.json versions and npm integrity verification.",
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
  "QA-AQW-Browser.command",
])
  fs.cpSync(path.join(source, entry), path.join(target, entry), {
    recursive: true,
  });
// Copy only the offline evidence explicitly referenced by Farm build inputs.
const farmEvidence = new Set();
function collectEvidence(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (["sourceFile", "guideSource", "candidatePath"].includes(key) && typeof child === "string" &&
        /^Update\/_offline-(sources|staging)\//.test(child)) farmEvidence.add(child);
    else collectEvidence(child);
  }
}
for (const manifest of [
  "refinement/v3-3-class-scope.json", "refinement/v3-4-class-scope.json",
  "refinement/sources.json", "equipment-sets/sources.json",
  "quest-workflow-review.json", "material-guides.json",
  "review/image-candidates.json",
]) collectEvidence(JSON.parse(fs.readFileSync(path.join(source, "content-sources/farm", manifest), "utf8")));
for (const file of farmEvidence) {
  fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true });
  fs.copyFileSync(path.join(source, file), path.join(target, file));
}
try {
  for (const [command, args] of [
    ["npm", ["ci", "--include=dev", "--prefer-offline", "--no-fund"]],
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
      timeout: 600000,
      env: {
        ...process.env,
        
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
