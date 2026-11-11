import { useState } from "react";
import { UserRound } from "lucide-react";
import portraits from "../../content/classes/portraits.json";
export function ClassAsset({
  id,
  name,
  compact = false,
  eager = false,
}: {
  id?: string;
  name: string;
  compact?: boolean;
  eager?: boolean;
}) {
  const asset = portraits.find((a) => a.id === id);
  const [failed, setFailed] = useState(false);
  return (
    <div className={`class-art ${compact ? "class-art-compact" : ""}`}>
      {asset && !failed ? (
        <img
          key={asset.imagePath}
          className="class-character-art"
          src={asset.imagePath}
          alt={`${name} — AdventureQuest Worlds`}
          width={asset.width}
          height={asset.height}
          style={{maxWidth:asset.width,maxHeight:asset.height}}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="class-portrait-pending"
          role="img"
          aria-label={`${name}: portrait chưa xác minh`}
        >
          <UserRound size={compact ? 24 : 48} aria-hidden="true" />
          <small>Portrait đang đối chiếu</small>
        </div>
      )}
    </div>
  );
}
