import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { materialLeaves } from "../src/lib/material-requirements.mjs";
import { parseClassAcquisitionPage } from "./lib/class-acquisition-source.mjs";
const exec = promisify(execFile),
  file = "src/content/classes/acquisition.json",
  data = JSON.parse(await fs.readFile(file, "utf8"));
const outcomes = {};
try {
  Object.assign(
    outcomes,
    JSON.parse(
      await fs.readFile(
        "content-sources/class-acquisition/merge-dependencies.json",
        "utf8",
      ),
    ),
  );
} catch {}
const urls = [
  ...new Set(
    Object.values(data.classes).flatMap((c) =>
      c.methods.flatMap((m) =>
        m.merge
          ? materialLeaves(m.merge.materials)
              .filter((n) => n.source && n.source !== m.source)
              .map((n) => n.source)
          : [],
      ),
    ),
  ),
];
async function source(url) {
  if (new URL(url).hostname !== "aqwwiki.wikidot.com")
    throw Error("Not an observed Wiki item source");
  const name = new URL(url).pathname.slice(1);
  for (const root of [
    "content-sources/class-acquisition/",
    "content-sources/class-wiki/",
  ])
    try {
      const h = await fs.readFile(root + name + ".html", "utf8");
      if (h.includes('id="page-content"')) return h;
    } catch {}
  if (process.argv.includes("--cached-only"))
    throw Error("Item source not cached");
  const path = "content-sources/class-acquisition/" + name + ".html";
  await exec(
    "curl",
    [
      "-fsSL",
      "--connect-timeout",
      "8",
      "--max-time",
      "18",
      "-o",
      path + ".download",
      url,
    ],
    { maxBuffer: 1024 },
  );
  const h = await fs.readFile(path + ".download", "utf8");
  if (!h.includes('id="page-content"')) throw Error("Invalid item page");
  await fs.rename(path + ".download", path);
  return h;
}
for (let i = 0; i < urls.length; i += 3) {
  await Promise.all(
    urls.slice(i, i + 3).map(async (url) => {
      if (outcomes[url]?.verificationStatus === "verified") return;
      try {
        const p = await parseClassAcquisitionPage(await source(url), url);
        outcomes[url] = {
          source: url,
          sourceHash: p.sourceHash,
          name: p.title,
          type: p.methodType,
          verificationStatus:
            p.methodType === "other" ? "needs_review" : "verified",
          materials: p.materials,
          rawMaterials: p.rawMaterials,
          questName: p.questName,
          questSource: p.questSource,
          locations: p.locations.map((l) => l.text),
          prerequisites: p.prerequisites,
          issue: p.materialIssue || null,
        };
      } catch (e) {
        outcomes[url] = {
          source: url,
          verificationStatus: "needs_review",
          issue: e.stderr?.slice(0, 250) || e.message,
        };
      }
    }),
  );
  await fs.writeFile(
    "content-sources/class-acquisition/merge-dependencies.json",
    JSON.stringify(outcomes, null, 2) + "\n",
  );
}
for (const c of Object.values(data.classes))
  for (const m of c.methods.filter((m) => m.merge)) {
    const nodes = materialLeaves(m.merge.materials);
    m.merge.dependencies = nodes
      .filter((n) => outcomes[n.source])
      .map((n) => ({
        ...outcomes[n.source],
        itemId: n.itemId,
        itemName: n.name,
        requiredQuantity: n.quantity,
      }));
    m.merge.prerequisiteItems = m.merge.dependencies
      .filter((d) => d.type === "merge" && d.verificationStatus === "verified")
      .map((d) => d.itemName);
  }
await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n");
console.log({
  observedItemSources: urls.length,
  verifiedDependencies: Object.values(outcomes).filter(
    (d) => d.verificationStatus === "verified",
  ).length,
  pending: Object.values(outcomes).filter(
    (d) => d.verificationStatus !== "verified",
  ).length,
});
