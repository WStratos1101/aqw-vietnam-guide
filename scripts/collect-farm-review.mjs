// Explicit catalog URLs only; bounded refresh, never run by the production build.
import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { Window } from "happy-dom";
import { parseFarmReviewPage } from "./lib/farm-review-parser.mjs";

const exec = promisify(execFile);
const root = "content-sources/farm/review";
fs.mkdirSync(root + "/wiki", { recursive: true });
const catalog = JSON.parse(fs.readFileSync("src/content/farm/catalog-v2.generated.json"));
const extra = [
  "nulgath-s-quests", "calamitus-quests", "galanoth-s-quests", "vohu-s-quests",
  "re-s-quests", "la-s-quests", "sir-cole-s-quests", "tercessuinotlim-s-quests",
  "ultra-nulgath", "ultra-dage", "ultra-avatar-tyndarius-location", "ultra-speaker",
  "ultra-drago", "ultra-darkon", "tercessuinotlim", "inn-at-the-edge-of-time",
  "ultra-ezrajal-location", "ultra-warden-location", "ultra-engineer-location",
];
const targets = [...new Map([
  ...extra.map(slug => ["https://aqwwiki.wikidot.com/" + slug, { url: "https://aqwwiki.wikidot.com/" + slug }]),
  ...catalog.items.map(i => [i.wikiUrl, { url: i.wikiUrl, itemId: i.id }]),
]).values()];
const previous = fs.existsSync(root + "/pages.json")
  ? JSON.parse(fs.readFileSync(root + "/pages.json")) : [];
const targetUrls = new Set(targets.map(t => t.url));
const records = new Map(previous.filter(r => targetUrls.has(r.url)).map(r => [r.url, r]));
const reparse = process.argv.includes("--reparse");
let cursor = 0, processed = 0;
async function worker() {
  while (cursor < targets.length) {
    const target = targets[cursor++];
    if (!reparse && records.get(target.url)?.status === "read") continue;
    if (reparse && records.get(target.url)?.status !== "read") continue;
    const file = root + "/wiki/" + new URL(target.url).pathname.slice(1) + ".html";
    const checkedAt = reparse ? records.get(target.url)?.checkedAt : new Date().toISOString();
    try {
      const html = reparse ? fs.readFileSync(file, "utf8") : (await exec("curl", ["-fLsS", "--max-time", "20", "--max-filesize", "3000000", target.url], { maxBuffer: 3_000_000 })).stdout;
      const w = new Window({ settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true } });
      try {
        w.document.write(html);
        const canonical = w.document.querySelector('link[rel="canonical"]')?.getAttribute("href");
        if (canonical && new URL(canonical, target.url).pathname !== new URL(target.url).pathname)
          throw Error("Canonical URL mismatch: " + canonical);
        const body = w.document.querySelector("#page-content");
        if (!body || !w.document.querySelector(".page-tags")) throw Error("Missing Wiki body/tags");
        body.querySelectorAll("script, style, .wd-adunit").forEach(el => el.remove());
        const images = [...body.querySelectorAll("img")].map(img => ({ url: new URL(img.getAttribute("src"), target.url).href, alt: img.getAttribute("alt") || "" }))
          .filter(img => !/image-tags|common--|button|arrow|logo/i.test(img.url));
        const links = [...body.querySelectorAll("a[href]")].flatMap(a => {
          try { const url = new URL(a.getAttribute("href"), target.url); return /^https?:$/.test(url.protocol) ? [{ name: a.textContent.trim(), url: url.href }] : []; } catch { return []; }
        });
        body.querySelectorAll("br").forEach(el => el.replaceWith(w.document.createTextNode("\n")));
        body.querySelectorAll("p,li,div,h1,h2,h3,h4,tr").forEach(el => el.append(w.document.createTextNode("\n")));
        fs.writeFileSync(file, html);
        records.set(target.url, { ...target, status: "read", checkedAt, sourceFile: file,
          sourceHash: createHash("sha256").update(html).digest("hex"),
          title: w.document.querySelector("#page-title")?.textContent.trim(),
          breadcrumbs: [...w.document.querySelectorAll("#breadcrumbs a")].map(a => ({ name: a.textContent.trim(), path: a.getAttribute("href") })),
          tags: [...w.document.querySelectorAll(".page-tags a")].map(a => a.textContent.trim()),
          ...parseFarmReviewPage(html, target.url), images, links });
      } finally { await w.happyDOM.close(); }
    } catch (e) { records.set(target.url, { ...target, status: "blocked", attemptedAt: checkedAt, error: e.message.slice(0, 450) }); }
    fs.writeFileSync(root + "/pages.json", JSON.stringify([...records.values()], null, 2) + "\n");
    if (++processed % 25 === 0) console.log({ processed, total: targets.length });
    if (!reparse) await new Promise(r => setTimeout(r, 200));
  }
}
await Promise.all([worker(), worker()]);
console.log({ read: [...records.values()].filter(r => r.status === "read").length, blocked: [...records.values()].filter(r => r.status !== "read").length });
