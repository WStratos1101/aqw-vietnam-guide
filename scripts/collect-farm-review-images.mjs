// Downloads only artwork URLs actually embedded in the exact item Wiki snapshot.
// Candidates require a separate visual/hash approval before entering the catalog.
import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
const exec = promisify(execFile), root = "content-sources/farm/review";
const read = p => JSON.parse(fs.readFileSync(p, "utf8"));
const pages = read(root + "/pages.json"), items = read("src/content/farm/catalog-v2.generated.json").items;
const prior = fs.existsSync(root + "/image-candidates.json") ? read(root + "/image-candidates.json") : [];
const records = new Map(prior.map(r => [r.itemId, r]));
fs.mkdirSync(root + "/images", { recursive: true });
let cursor = 0;
const targets = items.filter(i => !i.image && i.category !== "Classes");
async function worker() {
  while (cursor < targets.length) {
    const item = targets[cursor++], page = pages.find(p => p.url === item.wikiUrl && p.status === "read");
    if (!page || records.get(item.id)?.status === "downloaded") continue;
    const row = { itemId: item.id, name: item.name, sourcePage: item.wikiUrl, sourceHash: page.sourceHash, status: "blocked", attempts: [] };
    for (const image of page.images.slice(0, 3)) {
      try {
        const { stdout: bytes } = await exec("curl", ["-fLsS", "--max-time", "15", "--max-filesize", "8000000", image.url], { encoding: "buffer", maxBuffer: 8_000_000 });
        const ext = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "png" : /^GIF8[79]a$/.test(bytes.subarray(0,6).toString()) ? "gif" : bytes[0] === 255 && bytes[1] === 216 ? "jpg" : null;
        if (!ext) throw Error("Response is not PNG/GIF/JPEG artwork");
        const file = root + "/images/" + item.id + "." + ext;
        fs.writeFileSync(file, bytes);
        Object.assign(row, { status: "downloaded", originalImageUrl: image.url, candidatePath: file, fileHash: createHash("sha256").update(bytes).digest("hex"), downloadedAt: new Date().toISOString() });
        break;
      } catch (e) { row.attempts.push({ url: image.url, error: e.message.slice(0, 300) }); }
    }
    records.set(item.id, row);
    fs.writeFileSync(root + "/image-candidates.json", JSON.stringify([...records.values()], null, 2) + "\n");
    if (records.size % 25 === 0) console.log({ processed: records.size, targets: targets.length });
    await new Promise(r => setTimeout(r, 150));
  }
}
await Promise.all([worker(), worker()]);
console.log({ downloaded: [...records.values()].filter(r => r.status === "downloaded").length, blocked: [...records.values()].filter(r => r.status !== "downloaded").length });
