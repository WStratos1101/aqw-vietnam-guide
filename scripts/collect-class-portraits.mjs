import fs from "node:fs/promises";
import { Window } from "happy-dom";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
const exec = promisify(execFile),
  hash = (b) => createHash("sha256").update(b).digest("hex");
const r = JSON.parse(
  await fs.readFile("src/content/classes/skill-registry.json"),
);
const existing = JSON.parse(
  await fs.readFile("src/content/classes/portraits.json"),
);
let registry = [];
try {
  registry = JSON.parse(
    await fs.readFile("src/content/classes/portrait-registry.json"),
  );
} catch {}
const errors = [];
await fs.mkdir("content-sources/class-wiki/portraits", { recursive: true });
await fs.mkdir("public/images/aqw/classes", { recursive: true });
const entries = Object.values(r.classes);
for (let i = 0; i < entries.length; i += 3) {
  await Promise.all(
    entries.slice(i, i + 3).map(async (c) => {
      const id = "class-" + c.classId;
      if (
        existing.some((a) => a.id === id) ||
        registry.some((a) => a.id === id)
      )
        return;
      if (!c.portraitUrl && c.sourceUrl) {
        try {
          const w = new Window();
          w.document.write(
            await fs.readFile(
              "content-sources/class-wiki/" +
                new URL(c.sourceUrl).pathname.slice(1) +
                ".html",
              "utf8",
            ),
          );
          const d = w.document.querySelector("#page-content");
          const images = [...d.querySelectorAll("img")].filter(
            (i) =>
              !i.closest(".collapsible-block-content") &&
              !i.closest(".skills") &&
              !/image-tags/.test(i.getAttribute("src")),
          );
          const urls = [...new Set(images.map((i) => i.getAttribute("src")))];
          if (urls.length === 1) {
            c.portraitUrl = new URL(urls[0], c.sourceUrl).href.replace(
              /^http:/,
              "https:",
            );
            c.portraitMethod =
              "Single artwork image outside all skill disclosures on exact Class page";
          } else {
            const tab = [...d.querySelectorAll(".yui-navset")].find(
              (t) =>
                /normal|default|male|non.?animated|\bnew\b/i.test(
                  t.querySelector(".yui-nav")?.textContent || "",
                ) && !t.closest(".skills"),
            );
            const img = tab?.querySelector(".yui-content img");
            if (img) {
              c.portraitUrl = new URL(
                img.getAttribute("src"),
                c.sourceUrl,
              ).href.replace(/^http:/, "https:");
              c.portraitMethod =
                "Declared character artwork tab (normal/default/male/non-animated/new) on exact Class page";
            }
          }
          await w.happyDOM.close();
        } catch {}
      }
      if (!c.portraitUrl) {
        errors.push({
          classId: c.classId,
          reason: "No source-identified Male/Female portrait tab",
        });
        return;
      }
      try {
        const file =
          "content-sources/class-wiki/portraits/" + hash(c.portraitUrl);
        let b;
        try {
          b = await fs.readFile(file);
        } catch {
          await exec(
            "curl",
            [
              "-fsSL",
              "--retry",
              "1",
              "--retry-all-errors",
              "--retry-delay",
              "1",
              "--connect-timeout",
              "8",
              "--max-time",
              "25",
              "-o",
              file + ".download",
              c.portraitUrl,
            ],
            { maxBuffer: 2048 },
          );
          await fs.rename(file + ".download", file);
          b = await fs.readFile(file);
        }
        let width, height, ext;
        if (b.subarray(1, 4).toString() === "PNG") {
          width = b.readUInt32BE(16);
          height = b.readUInt32BE(20);
          ext = "png";
        } else if (b.subarray(0, 3).toString() === "GIF") {
          width = b.readUInt16LE(6);
          height = b.readUInt16LE(8);
          ext = "gif";
        } else throw Error("Not a supported validated raster");
        if (width < 100 || height < 150 || width > 2500 || height > 3000)
          throw Error(
            "Portrait dimensions invalid or deleted-image placeholder",
          );
        const digest = hash(b),
          imagePath = "/images/aqw/classes/" + digest.slice(0, 24) + "." + ext;
        await fs.writeFile("public" + imagePath, b);
        registry.push({
          id,
          classId: c.classId,
          name: c.name,
          imagePath,
          width,
          height,
          sha256: digest,
          sourceUrl: c.sourceUrl,
          originalImageUrl: c.portraitUrl,
          sourceHash: c.sourceHash,
          verificationStatus: "verified",
          verificationMethod:
            c.portraitMethod ||
            "Exact Class page Male/Female artwork tab; validated raster bytes/dimensions",
          usageStatus: "approved_noncommercial",
          policyUrl: r.policy.url,
        });
      } catch (e) {
        errors.push({
          classId: c.classId,
          sourceUrl: c.sourceUrl,
          imageUrl: c.portraitUrl,
          reason: e.stderr?.slice(0, 400) || e.message,
        });
      }
    }),
  );
  await fs.writeFile(
    "src/content/classes/portrait-registry.json",
    JSON.stringify(registry, null, 2) + "\n",
  );
}
await fs.writeFile(
  "artifacts/qa/portrait-collection.json",
  JSON.stringify(
    {
      integratedNewPortraits: registry.length,
      existingPortraits: existing.length,
      errors,
    },
    null,
    2,
  ),
);
console.log({ portraits: registry.length, errors: errors.length });
