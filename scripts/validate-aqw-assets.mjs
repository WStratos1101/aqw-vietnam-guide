import fs from "node:fs";
import crypto from "node:crypto";
const assets = JSON.parse(fs.readFileSync("src/data/aqw-assets.json", "utf8"));
const seen = new Map(),
  errors = [],
  duplicates = [];
for (const a of assets.filter((a) => a.verificationStatus === "verified")) {
  if (
    a.usageStatus !== "approved" ||
    !a.sourcePage ||
    !a.review?.visualEvidence ||
    !a.review?.entityEvidence
  )
    errors.push(a.assetId + ": missing metadata/evidence");
  if (!a.imagePath?.startsWith("/images/aqw/") || a.imagePath.includes("..")) {
    errors.push(a.assetId + ": invalid path");
    continue;
  }
  if (!fs.existsSync("public" + a.imagePath)) {
    errors.push(a.assetId + ": missing file");
    continue;
  }
  const bytes = fs.readFileSync("public" + a.imagePath),
    hash = crypto.createHash("sha256").update(bytes).digest("hex");
  if (hash !== a.fileHash) errors.push(a.assetId + ": hash mismatch");
  if (
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    errors.push(a.assetId + ": unexpected signature");
  else if (
    bytes.readUInt32BE(16) !== a.width ||
    bytes.readUInt32BE(20) !== a.height
  )
    errors.push(a.assetId + ": dimensions mismatch");
  if (seen.has(hash)) duplicates.push([seen.get(hash), a.assetId]);
  else seen.set(hash, a.assetId);
}
const result = {
  slots: assets.length,
  verified: assets.filter((a) => a.verificationStatus === "verified").length,
  uniqueFiles: seen.size,
  errors,
  duplicates,
};
fs.writeFileSync("qa/image-validation.json", JSON.stringify(result, null, 2));
console.log(result);
if (errors.length) process.exitCode = 1;
