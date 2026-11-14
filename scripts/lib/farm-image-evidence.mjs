import fs from "node:fs";
import { createHash } from "node:crypto";
const canonical = url => String(url || "").replace(/^http:/, "https:").split(/[?#]/)[0].replace(/\/$/, "");

export function verifiedFarmAsset(item, assets, readBytes = path => fs.existsSync(path) ? fs.readFileSync(path) : null) {
  for (const asset of assets) {
    if (asset.entityType !== "item" || asset.entityName !== item.originalName ||
        canonical(asset.sourcePage) !== canonical(item.wikiUrl) || !asset.sourcePage ||
        asset.verificationStatus !== "verified" || asset.usageStatus !== "approved" ||
        !asset.fileHash || !asset.imagePath?.startsWith("/images/") || asset.imagePath.includes("..")) continue;
    const bytes = readBytes("public" + asset.imagePath);
    if (!bytes) continue;
    if (createHash("sha256").update(bytes).digest("hex") !== asset.fileHash)
      throw Error("Farm image hash mismatch: " + item.id);
    return asset;
  }
  return null;
}

export function farmAssetEvidence(asset) {
  return { path: asset.imagePath, source: asset.sourcePage, originalImageUrl: asset.originalImageUrl || null,
    fileHash: asset.fileHash, assetId: asset.assetId, credit: asset.authorOrCredit || "Artix Entertainment",
    verificationStatus: "verified", usageStatus: "approved" };
}
