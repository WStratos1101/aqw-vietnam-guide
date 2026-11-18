import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const root = "content-sources/farm/";
const manifests = [
  "refinement/v3-3-class-scope.json",
  "refinement/v3-4-class-scope.json",
  "refinement/sources.json",
  "equipment-sets/sources.json",
  "quest-workflow-review.json",
  "material-guides.json",
  "review/image-candidates.json",
  "refinement/v3-4-metadata-review.json",
  "refinement/v3-verified-fields.json",
  "equipment-sets/reviewed-inventories.json",
];
function files(value, found = new Set()) {
  if (!value || typeof value !== "object") return found;
  for (const [key, child] of Object.entries(value)) {
    if (
      ["sourceFile", "guideSource", "candidatePath"].includes(key) &&
      typeof child === "string"
    )
      found.add(child);
    else files(child, found);
  }
  return found;
}
test("every Farm snapshot consumed by the clean build is present in copied, versionable source directories", () => {
  const required = new Set(manifests.map((p) => root + p));
  for (const manifest of manifests) {
    for (const file of files(
      JSON.parse(fs.readFileSync(root + manifest, "utf8")),
    ))
      required.add(file);
  }
  for (const file of required) {
    assert.match(file, /^(content-sources|src|public)\//, file);
    assert.ok(fs.statSync(file).isFile(), file);
  }
  const ignored = spawnSync("git", ["check-ignore", "--stdin"], {
    input: [...required].join("\n") + "\n",
    encoding: "utf8",
  });
  assert.equal(ignored.status, 1, ignored.stdout || ignored.stderr);
});
test("relocated Farm build evidence preserves original snapshot hashes and includes failed metadata inputs", () => {
  const index = JSON.parse(fs.readFileSync(root + "build-evidence/index.json"));
  for (const file of index.files) {
    assert.equal(
      createHash("sha256")
        .update(fs.readFileSync(file.sourceFile))
        .digest("hex"),
      file.sourceHash,
      file.sourceFile,
    );
  }
  const failed =
    "28b7ec0700ae01395171fb8d8351a89ee973657ff900967954ae685bfb0c677b.html";
  const spec = JSON.parse(
    fs.readFileSync(root + "refinement/v3-4-metadata-review.json"),
  ).records.find((r) => r.sourceFile.endsWith(failed));
  assert.ok(spec);
  assert.equal(
    index.files.find((r) => r.sourceFile === spec.sourceFile)?.sourceHash,
    spec.sourceHash,
  );
});
