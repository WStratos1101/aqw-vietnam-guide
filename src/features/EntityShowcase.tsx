import { Asset } from "./ultra/Asset";
import { ArrowDown } from "lucide-react";
import type { Entry } from "../types/content";
import { mediaFor } from "../content/media/entities";
export function EntityShowcase({ entry }: { entry: Entry }) {
  const media = mediaFor(entry);
  if (!media) return null;
  const boss = media.kind === "boss";
  return (
    <section
      className={`entity-showcase ${boss ? "boss-showcase" : "item-showcase"}`}
      aria-label={boss ? "Hồ sơ boss" : "Hình ảnh trang bị"}
    >
      <div className="entity-art">
        <Asset id={media.assetId || ""} label={media.name} eager />
      </div>
      <div className="entity-dossier">
        <p className="entity-kicker">
          {boss ? "Challenge Boss / Hồ sơ chiến đấu" : "Equipment / Trang bị"}
        </p>
        <h2>{media.name}</h2>
        <dl>
          {media.level !== undefined && (
            <div>
              <dt>Level</dt>
              <dd>{media.level}</dd>
            </div>
          )}
          {media.hp && (
            <div>
              <dt>HP</dt>
              <dd>{media.hp}</dd>
            </div>
          )}
          <div>
            <dt>Thế giới</dt>
            <dd>AdventureQuest Worlds</dd>
          </div>
        </dl>
        <p>
          {boss
            ? "Nắm cơ chế. Chuẩn bị đội hình. Bước vào trận đấu."
            : "Theo dõi điều kiện và các bước sở hữu bên dưới."}
        </p>
        <a className="button primary" href="#muc-chinh">
          {boss ? "Chọn mục chiến thuật" : "Xem hướng dẫn"}
          <ArrowDown size={18} />
        </a>
      </div>
    </section>
  );
}
