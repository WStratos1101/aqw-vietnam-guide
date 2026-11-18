import { ArrowUpRight, Compass } from "lucide-react";
import { loreRegions, loreRegionHref, type LoreRegion } from "../content/lore-regions";
import "../styles/lore-atlas.css";

export function LoreAtlas() {
  const pins = loreRegions.filter(region => region.x !== null && region.y !== null);
  const extra = loreRegions.filter(region => region.x === null || region.y === null);
  return (
    <section className="chapter lore-atlas" id="ban-do-lore" aria-labelledby="lore-atlas-title">
      <div className="section-heading lore-atlas-heading">
        <h2 id="lore-atlas-title">Thế giới sau<br />chân trời.</h2>
        <p>Vượt qua những cánh rừng cổ, những vương quốc chìm trong bóng tối và những vùng đất chưa từng đặt chân tới. Mỗi miền đất của Lore đều mang một câu chuyện đang chờ được kể.</p>
      </div>
      <div className="lore-map-frame">
        <div className="lore-map-top"><Compass size={20} aria-hidden="true" /><span>WORLD MAP · LORE</span><small>Chạm vào biểu tượng vùng đất để khám phá</small></div>
        <div className="lore-fixed-stage" data-lore-map-mode="fixed">
            <img className="lore-fixed-image" src="/art/aqw-world-map-official.png" alt="World Map gốc trong AdventureQuest Worlds" width={2048} height={1230} loading="lazy" draggable={false}/>
            {pins.map(region => (
              <a key={region.slug} className="lore-fixed-pin" href={loreRegionHref(region)}
                style={{left:region.x+"%",top:region.y+"%"}}
                data-lore-pin={region.slug} aria-label={"Khám phá "+region.name} title={region.name}>
                <span className="lore-fixed-tooltip" aria-hidden="true">{region.name}</span>
              </a>
            ))}
        </div>
        <div className="lore-map-caption">World Map trong game AQW · © Artix Entertainment · Chọn vùng đất để mở biên niên sử.</div>
      </div>
      <details className="lore-map-directory">
        <summary>Danh sách vùng đất trên bản đồ ({pins.length})</summary>
        <div className="lore-region-grid">
          {pins.map(region=><a className="lore-region-card" key={region.slug} href={loreRegionHref(region)} data-lore-region={region.slug}>
            <span><strong>{region.name}</strong><small>{region.description}</small></span><ArrowUpRight size={19} aria-hidden="true"/>
          </a>)}
        </div>
      </details>
      <div className="lore-extra-regions">
        <h3>Những điểm đến khác</h3>
        <p>Những vùng này không có biểu tượng riêng trên ảnh World Map hiện tại.</p>
        <div className="lore-region-grid">
          {extra.map(region=><a className="lore-region-card" key={region.slug} href={loreRegionHref(region)} data-lore-region={region.slug}>
            <span><strong>{region.name}</strong><small>{region.description}</small></span><ArrowUpRight size={19} aria-hidden="true"/>
          </a>)}
        </div>
      </div>
    </section>
  );
}

export function LoreRegionPage({region}:{region:LoreRegion}) {
  return <main id="main" className="lore-region-page" data-lore-region-page={region.slug}>
    <a href="/#ban-do-lore" className="plain-link">← Trở về bản đồ Lore</a>
    <span className="lore-region-kicker">BIÊN NIÊN SỬ LORE</span>
    <h1>{region.name}</h1>
    <p className="lore-region-intro">{region.description}</p>
    <div className="lore-region-pending">
      <Compass size={30} aria-hidden="true" />
      <h2>Một chương chưa được mở.</h2>
      <p>Biên niên sử vùng đất này đang được biên soạn. Hãy quay lại khi những trang tiếp theo được hé mở.</p>
      <a className="button" href="/#ban-do-lore">Tiếp tục khám phá <ArrowUpRight size={20} /></a>
    </div>
  </main>;
}
