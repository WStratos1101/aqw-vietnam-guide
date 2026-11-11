import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const classes = read("src/content/classes/catalog.json");
test("Class bodies preserve identity, unique skills and ordered obtain dependencies", () => {
  for (const c of classes) {
    const b = read(`public/content/classes/${c.slug}.json`);
    assert.equal(b.classId, c.id);
    assert.equal(
      new Set(b.skills.map((s) => s.id)).size,
      b.skills.length,
      c.slug,
    );
    const seen = new Set();
    for (const s of b.obtainSteps) {
      for (const d of s.dependencies || []) assert(seen.has(d), c.slug);
      seen.add(s.id);
    }
  }
});
test("four curated Class profiles have active skills, obtain steps and grounded combos", () => {
  for (const c of classes.filter((c) => c.status === "Hồ sơ biên soạn")) {
    const b = read(`public/content/classes/${c.slug}.json`);
    assert.deepEqual(
      b.skills
        .filter((s) => typeof s.skillNumber === "number")
        .map((s) => s.skillNumber),
      [1, 2, 3, 4, 5],
    );
    assert(b.obtainSteps.length > 3);
    assert(b.combos.length);
    assert(c.sources.some((s) => s.url.includes("aqwwiki.wikidot.com")));
  }
});
test("verified image assets require local bytes, evidence and matching hash", async () => {
  const { createHash } = await import("node:crypto");
  for (const a of read("src/data/aqw-assets.json").filter(
    (a) => a.verificationStatus === "verified",
  )) {
    assert.equal(a.usageStatus, "approved");
    assert(a.review.visualEvidence);
    assert(a.review.entityEvidence);
    assert.equal(
      createHash("sha256")
        .update(fs.readFileSync("public" + a.imagePath))
        .digest("hex"),
      a.fileHash,
    );
  }
});
