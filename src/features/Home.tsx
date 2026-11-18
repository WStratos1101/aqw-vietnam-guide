import { LoreShowcase as AQWOriginalLoreShowcase } from "./LoreShowcase"; // AQW-LORE-REPLACE-HERO-V7
import { LoreShowcase } from "./JourneyShowcase";
import classes from "../content/home-starters.json";
import poster from "../content/home-poster.json";
import { useState } from "react";
import { LoreAtlas } from "./LoreAtlas";
import { ArrowRight, ArrowUpRight, ChevronDown, Search } from "lucide-react";

export function Home() {
  const [active, setActive] = useState(0);
  const selected = classes[active];
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-copy">
          <h1>
            <span>AQW VIETNAM</span>
            <span>GUIDE</span>
          </h1>
          <p>
            Từ Battleon đến những miền đất chưa được khám phá, mỗi bước chân mở ra một huyền thoại. Câu chuyện tiếp theo thuộc về bạn.
          </p>
          <div className="hero-actions">
            <a href="/huong-dan" className="button">
              Khám phá hướng dẫn <ArrowUpRight size={20} />
            </a>
            <a href="/class" className="plain-link">
              Tìm Class phù hợp <ArrowRight size={20} />
            </a>
          </div>
          <div className="hero-bottom">
            <span>Thế giới Lore đang chờ bạn.</span>
            <a href="#bat-dau" aria-label="Cuộn tới Ngày anh hùng gọi tên">
              <ChevronDown size={24} />
            </a>
          </div>
        </div>
        <div className="hero-art calendar-poster">
          <img
            src={poster.imagePath}
            alt="2026 Paradox of Lore Calendar — Artix Entertainment"
            width={poster.width}
            height={poster.height}
            fetchPriority="high"
          />
          <span className="art-caption">
            2026 Paradox of Lore · © Artix Entertainment
          </span>
        </div>
      </section>
      <AQWOriginalLoreShowcase />
      <section className="class-chapter chapter" id="class-khoi-dau">
        <div className="section-heading">
          <h2>
            Chọn con đường.
            <br />
            Khắc tên vào Lore.
          </h2>
          <a href="/class" className="plain-link">
            Mở Class database <ArrowUpRight />
          </a>
        </div>
        <div className="class-showcase">
          <div className="class-select">
            <div
              className="class-tabs"
              role="tablist"
              aria-label="Class khởi đầu"
            >
              {classes.map((c, i) => (
                <button
                  key={c.slug}
                  id={`class-tab-${i}`}
                  role="tab"
                  aria-selected={active === i}
                  aria-controls="class-preview"
                  tabIndex={active === i ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                    ) {
                      e.preventDefault();
                      const n =
                        e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? classes.length - 1
                            : (active +
                                (e.key === "ArrowRight" ? 1 : -1) +
                                classes.length) %
                              classes.length;
                      setActive(n);
                      document.getElementById(`class-tab-${n}`)?.focus();
                    }
                  }}
                >
                  {c.name}
                  <ArrowUpRight size={24} />
                </button>
              ))}
            </div>
            <p>
              Bốn con đường, bốn số phận. Hãy chọn cách bạn muốn để lại dấu
              ấn của mình trong Lore.
            </p>
          </div>
          <div className="starter-class-art">
            <img
              key={selected.classId}
              src={selected.portrait.imagePath}
              alt={selected.name}
              width={selected.portrait.width}
              height={selected.portrait.height}
              loading="lazy"
            />
          </div>
          <div
            className="class-preview"
            id="class-preview"
            role="tabpanel"
            aria-labelledby={`class-tab-${active}`}
            key={active}
          >
            <span>{selected.role.join(" - ")} · Class khởi đầu</span>
            <h3>{selected.name}</h3>
            <p data-starter-lore={selected.classId}>{selected.summary}</p>
            <dl>
              <div>
                <dt>Lối chơi</dt>
                <dd>{selected.playstyle}</dd>
              </div>
              <div>
                <dt>Loại sát thương</dt>
                <dd>{selected.damageType}</dd>
              </div>
              <div>
                <dt>Enhancement</dt>
                <dd>{selected.enhancement}</dd>
              </div>
            </dl>
            <a className="button" href={"/class/" + selected.slug}>
              Xem hồ sơ Class <ArrowUpRight size={20} />
            </a>
          </div>
        </div>
      </section>
      <LoreAtlas />
      <LoreShowcase />
      
      <section className="search-chapter chapter">
        <h2>Bạn đang tìm gì?</h2>
        <form action="/huong-dan" className="home-search">
          <label className="sr-only" htmlFor="home-q">
            Tìm kiếm toàn bộ thư viện
          </label>
          <Search size={28} />
          <input
            id="home-q"
            name="q"
            placeholder="Class, vật phẩm, hướng dẫn…"
            required
          />
          <button aria-label="Tìm trong thư viện">
            <ArrowRight size={28} />
          </button>
        </form>
        <p>Giữ tên Class, Quest và Item bằng tiếng Anh để tra cứu dễ hơn.</p>
      </section>
    </main>
  );
}
