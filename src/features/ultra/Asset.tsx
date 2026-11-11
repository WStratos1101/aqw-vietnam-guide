import challengeAssets from '../../content/challenges/assets.json';
import verifiedAssets from "../../data/aqw-assets.json";
import type { GameAsset } from "../../types/ultra";
import { useState, useEffect } from "react";
import { ImageOff } from "lucide-react";
import legacyAssets from '../../content/ultra/assets.json';
const findAsset=(id:string)=>([...(legacyAssets as GameAsset[]),...(challengeAssets as GameAsset[])]).find(a=>a.id===id);
export function Asset({
  id,
  compact = false,
  eager = false,
  label,
  asset: suppliedAsset,
}: {
  id: string;
  compact?: boolean;
  eager?: boolean;
  label?: string;
  asset?: GameAsset;
}) {
  const registered = suppliedAsset || findAsset(id);
  const verified = verifiedAssets.find(
    (a) =>
      a.assetId === id &&
      a.verificationStatus === "verified" &&
      a.usageStatus === "approved" &&
      a.imagePath,
  );
  const asset =
    verified
      ? {
          ...(registered || {id,name:verified.entityName,entity:verified.entityId,sourceUrl:verified.sourcePage,credit:verified.authorOrCredit,usageNote:''}),
          usageStatus: "approved",
          name: verified.entityName,
          localPath: verified.imagePath!,
        }
      : registered;
  const [failed, setFailed] = useState(false);
  useEffect(()=>setFailed(false),[id,asset?.localPath]);
  if (!asset || asset.usageStatus !== "approved" || !asset.localPath || failed)
    return (
      <div
        className={`ultra-asset-placeholder ${compact ? "compact" : ""}`}
        role="img"
        aria-label={`${asset?.name || label || "Ảnh game"}: asset cần bổ sung`}
      >
        <ImageOff size={compact ? 18 : 32} aria-hidden="true" />
        {!compact && (
          <>
            <strong>{asset?.name || label || "Ảnh game"}</strong>
            <span>Asset cần bổ sung</span>
          </>
        )}
      </div>
    );
  return (
    <img
      className={`ultra-game-art ${compact ? "compact" : ""}`}
      src={asset.localPath}
      alt={`${asset.name} — AdventureQuest Worlds`}
      width={compact ? 64 : verified?.width || 640}
      height={compact ? 64 : verified?.height || 640}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
