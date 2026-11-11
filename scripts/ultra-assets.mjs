import fs from "node:fs";
import path from "node:path";
const manifestPath = "src/content/ultra/assets.json";
const assets = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const download = process.argv.includes("--download");
const report = {
  at: new Date().toISOString(),
  ready: [],
  pending: [],
  errors: [],
};
for (const asset of assets) {
  if (asset.usageStatus !== "approved") {
    report.pending.push(asset.id);
    continue;
  }
  if (asset.localPath && fs.existsSync(path.join("public", asset.localPath))) {
    report.ready.push(asset.id);
    continue;
  }
  if (!download || !asset.candidateImageUrl) {
    report.errors.push({
      id: asset.id,
      error:
        "Approved asset needs a local file or an explicit candidateImageUrl and --download.",
    });
    continue;
  }
  try {
    const url = new URL(asset.candidateImageUrl);
    if (
      url.protocol !== "https:" ||
      ![
        "lh3.googleusercontent.com",
        "lh4.googleusercontent.com",
        "lh5.googleusercontent.com",
        "lh6.googleusercontent.com",
      ].includes(url.hostname)
    )
      throw Error("Image host is outside the curated allowlist.");
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const mime = response.headers.get("content-type")?.split(";")[0];
    const extension = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    }[mime];
    if (!extension) throw Error(`Unsupported response type: ${mime}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 8 * 1024 * 1024) throw Error("Asset exceeds 8 MB.");
    const png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP";
    if (
      !(
        (extension === "png" && png) ||
        (extension === "jpg" && jpeg) ||
        (extension === "webp" && webp)
      )
    )
      throw Error("Image signature does not match response MIME type.");
    if (!/^[a-z0-9-]+$/.test(asset.id)) throw Error("Invalid asset ID.");
    asset.localPath = `/art/ultra/${asset.id}.${extension}`;
    fs.mkdirSync("public/art/ultra", { recursive: true });
    fs.writeFileSync("public" + asset.localPath, bytes);
    report.ready.push(asset.id);
  } catch (error) {
    report.errors.push({ id: asset.id, error: error.message });
  }
}
if (download)
  fs.writeFileSync(manifestPath, JSON.stringify(assets, null, 2) + "\n");
fs.mkdirSync("qa", { recursive: true });
fs.writeFileSync(
  "qa/ultra-assets.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      ready: report.ready.length,
      pending: report.pending.length,
      errors: report.errors,
    },
    null,
    2,
  ),
);
if (report.errors.length) process.exitCode = 1;
