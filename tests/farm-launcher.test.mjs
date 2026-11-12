import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const available =
  fs.existsSync("Update/_codex-focus/AQW-Focus.command") &&
  fs.existsSync("Update/_codex-focus/AutoPublish-AQW.command");
const launcher = available
  ? fs.readFileSync("Update/_codex-focus/AQW-Focus.command", "utf8")
  : "";
const fn = (name, next) =>
  launcher.slice(
    launcher.indexOf(name + "() {"),
    launcher.indexOf(next + "() {"),
  );
test(
  "macOS Bash 3.2 launches with no empty-array nounset expansion",
  { skip: !available },
  () => {
    for (const mode of ["auto", "ask", "full"])
      for (const web of ["yes", "no"]) {
        const script = `set -eu\nROOT="$PWD"\naccess_mode(){ echo ${mode}; }\nsay(){ :; }\ncodex(){ printf '%s\\n' "$@"; }\n${fn("run_codex_command", "valid_task")}\nrun_codex_command medium ${web} prompt`;
        const result = spawnSync("/bin/bash", ["-c", script], {
          encoding: "utf8",
        });
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /prompt/);
        assert.equal(
          result.stdout.includes("sandbox_workspace_write.network_access=true"),
          web === "yes" && mode !== "full",
        );
      }
  },
);
test(
  "failed child and failed validation never print success or invoke publish",
  { skip: !available },
  () => {
    const blocked = spawnSync(
      "/bin/bash",
      [
        "-c",
        `set -eu\nsay(){ echo "$*"; }\n${fn("after_codex", "verify")}\nafter_codex 42`,
      ],
      { encoding: "utf8" },
    );
    assert.equal(blocked.status, 42);
    const verify = spawnSync(
      "/bin/bash",
      [
        "-c",
        `set -eu\nROOT="$PWD"\nsay(){ echo "$*"; }\ndie(){ exit 1; }\nnpm(){ return 9; }\n${fn("verify", "require_confirm")}\nverify full || exit $?`,
      ],
      { encoding: "utf8" },
    );
    assert.equal(verify.status, 9);
    assert.doesNotMatch(verify.stdout, /hoàn tất/);
    const publish = spawnSync(
      "/bin/bash",
      ["Update/_codex-focus/AutoPublish-AQW.command", "run", "42"],
      {
        encoding: "utf8",
        env: { ...process.env, AQW_PROJECT_ROOT: process.cwd() },
      },
    );
    assert.equal(publish.status, 1);
    assert.match(publish.stderr, /Codex exit=42/);
  },
);
