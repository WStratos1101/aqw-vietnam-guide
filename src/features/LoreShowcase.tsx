import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import "../styles/lore-showcase.css";

const base = "/art/lore-showcase/";
const entries = [
  {
    id: "armory", label: "Trang bị", href: "/trang-bi",
    title: ["Kho báu", "huyền thoại"],
    description: "Truy tìm những báu vật xứng tầm với danh hiệu anh hùng.",
    artist: "Darkon", artwork: "darkon.png",
    alt: "Nhân vật tóc trắng trong minh họa của Darkon",
  },
  {
    id: "chronicles", label: "Hướng dẫn", href: "/huong-dan",
    title: ["Cẩm nang", "phiêu lưu"],
    description: "Từ những bước chân đầu tiên đến các thử thách trên khắp Lore.",
    artist: "8X6·HAIIRO", artwork: "drago-iona.png",
    alt: "Drago và Iona trong minh họa của 8X6·HAIIRO",
  },
  {
    id: "forge", label: "Hệ thống", href: "/he-thong",
    title: ["Khai phá", "sức mạnh"],
    description: "Làm chủ Enhancement, chỉ số và cơ chế chiến đấu.",
    artist: "Lae", artwork: "lae-paladia.png",
    alt: "Founders of Paladia, minh họa của Lae",
  },
] as const;
const alternate = [
  { file: "lae-paladia.png", label: "Founders of Paladia" },
  { file: "lae-portrait.png", label: "Chân dung nhân vật của Lae" },
] as const;

export function LoreShowcase() {
  const [active, setActive] = useState("chronicles");
  const [art, setArt] = useState<0 | 1>(0);
  return (
    <section className="chapter lore-showcase" data-lore-showcase aria-labelledby="lore-showcase-title">
      <div className="lore-showcase-heading">
        <div>
          <h2 id="lore-showcase-title">Di sản của <span>Lore.</span></h2>
        </div>
        <p>Vũ khí, sức mạnh và câu chuyện đã định hình thế giới AdventureQuest Worlds.</p>
      </div>
      <div className="lore-showcase-panels"
        onMouseLeave={() => setActive("chronicles")}>
        {entries.map((entry) => {
          const forge = entry.id === "forge";
          const image = forge ? alternate[art].file : entry.artwork;
          const alt = forge && art === 1 ? alternate[1].label : entry.alt;
          return (
            <article key={entry.id}
              className={`lore-showcase-panel lore-showcase-${entry.id}${active === entry.id ? " is-active" : ""}`}
              onMouseEnter={() => setActive(entry.id)}
              onFocus={() => setActive(entry.id)}>
              <a href={entry.href} data-showcase-link={entry.id}
                className="lore-showcase-link" aria-label={entry.label + " — " + entry.title.join(" ")}>
                <img src={base + image} alt={alt} loading="lazy" decoding="async"
                  className="lore-showcase-art" draggable={false} />
                <span className="lore-showcase-credit">ART / {entry.artist}</span>
                <div className="lore-showcase-copy">
                  <h3>{entry.title[0]}<br />{entry.title[1]}</h3>
                  <p>{entry.description}</p>
                  <div className="lore-showcase-cta">
                    <span>{entry.label}</span><span aria-hidden="true"><ArrowUpRight size={18} /></span>
                  </div>
                </div>
              </a>
              {forge && (
                <div className="lore-showcase-variants" role="group" aria-label="Đổi minh họa Lae">
                  {alternate.map((variant, i) => (
                    <button type="button" key={variant.file} aria-label={variant.label}
                      aria-pressed={art === i} onClick={() => { setArt(i === 0 ? 0 : 1); setActive("forge"); }}>
                      <img src={base + variant.file} alt="" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className="lore-showcase-footer">
        <span>Battle on · Justice. Chaos. Legacy.</span>
        <div className="lore-showcase-indicator" aria-hidden="true">
          {entries.map(entry => <i key={entry.id} className={active === entry.id ? "is-active" : ""} />)}
        </div>
        <span>AQW character art</span>
      </div>
    </section>
  );
}
