import { ArrowUpRight, Compass } from "lucide-react";
import { useRef, useState } from "react";
import { loreRegions, loreRegionHref, type LoreRegion } from "../content/lore-regions";
import "../styles/lore-atlas.css";

export function LoreAtlas() {
  const viewport = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const pins = loreRegions.filter(region => region.x !== null && region.y !== null);
  const extra = loreRegions.filter(region => region.x === null || region.y === null);
  const pan = (x:number,y:number) => viewport.current?.scrollBy({left:x,top:y,behavior:"smooth"});
  const reset = () => {
    setZoom(1);
    viewport.current?.scrollTo({left:0,top:0});
  };
  const adjust = (delta:number) => setZoom(z => Math.max(1, Math.min(2, z+delta)));
  const control = (label:string, x:number, y:number, w:number, h:number, action:()=>void) => (
    <button type="button" className="lore-map-control" aria-label={label} title={label}
      style={{left:x/742*100+"%",top:y/444*100+"%",width:w/742*100+"%",height:h/444*100+"%"}} onClick={action}/>
  );
  return (
    <section className="chapter lore-atlas" id="ban-do-lore" aria-labelledby="lore-atlas-title">
      <div className="section-heading lore-atlas-heading">
        <h2 id="lore-atlas-title">Thế giới sau<br />chân trời.</h2>
        <p>Vượt qua những cánh rừng cổ, những vương quốc chìm trong bóng tối và những vùng đất chưa từng đặt chân tới. Mỗi miền đất của Lore đều mang một câu chuyện đang chờ được kể.</p>
      </div>
      <div className="lore-map-frame">
        <div className="lore-map-top"><Compass size={20} aria-hidden="true" /><span>WORLD MAP · LORE</span><small>Chạm vào biểu tượng vùng đất để khám phá</small></div>
        <div className="lore-map-toolbar">
          <span>Di chuyển bản đồ bằng cuộn ngang hoặc các mũi tên khi phóng to.</span>
          <button type="button" onClick={()=>adjust(-.25)} disabled={zoom<=1} aria-label="Thu nhỏ bản đồ">−</button>
          <button type="button" onClick={()=>adjust(.25)} disabled={zoom>=2} aria-label="Phóng to bản đồ">+</button>
          <button type="button" onClick={reset}>Mặc định</button>
        </div>
        <div className="lore-official-viewport" ref={viewport} aria-label="Bản đồ Lore có thể cuộn" tabIndex={0}>
          <div className="lore-official-stage" style={{width:zoom*100+"%",minWidth:742*zoom+"px"}}>
            <img className="lore-official-image" src="/art/aqw-world-map-official.png" alt="World Map gốc trong AdventureQuest Worlds" width={742} height={444} loading="lazy" draggable={false}/>
            {pins.map(region => (
              <a key={region.slug} className="lore-official-pin" href={loreRegionHref(region)}
                style={{left:region.x+"%",top:region.y+"%"}}
                data-lore-pin={region.slug} aria-label={"Khám phá "+region.name} title={region.name}>
                <span className="lore-map-tooltip" aria-hidden="true">{region.name}</span>
              </a>
            ))}
            {control("Di chuyển lên",371,20,48,30,()=>pan(0,-180))}
            {control("Di chuyển sang trái",20,221,27,56,()=>pan(-220,0))}
            {control("Di chuyển sang phải",721,216,27,56,()=>pan(220,0))}
            {control("Di chuyển xuống",372,425,48,31,()=>pan(0,180))}
            {control("Lore Center",76,423,116,28,reset)}
            {control("Thu nhỏ",650,427,29,29,()=>adjust(-.25))}
            {control("Phóng to",685,427,29,29,()=>adjust(.25))}
          </div>
        </div>
        <div className="lore-map-caption">World Map trong game AQW · © Artix Entertainment · Ảnh lưu từ <a href="https://aqwwiki.wikidot.com/maps" target="_blank" rel="noreferrer">AQWorlds Wiki</a>. Các điểm bấm dẫn đến biên niên sử trên AQW Vietnam Guide.</div>
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
