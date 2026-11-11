import classes from "../content/home-starters.json";
import poster from "../content/home-poster.json";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Search } from "lucide-react";
import { guides, href } from "../content/data";
import { EntryRow } from "./Library";
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
            Cẩm nang phiêu lưu dành cho cộng đồng AdventureQuest Worlds Việt Nam
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
            <a href="#bat-dau" aria-label="Cuộn tới Bắt đầu hành trình">
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
      <section className="start chapter" id="bat-dau">
        <div className="section-heading">
          <h2>
            Bắt đầu
            <br />
            hành trình.
          </h2>
          <p>
            Vừa đặt chân đến Battleon?
            <br />
            Đi từng bước, hiểu từng cơ chế.
          </p>
        </div>
        <div className="start-layout">
          <a href="/huong-dan/bat-dau" className="start-feature">
            <span>Cho người mới</span>
            <div>
              <h3>
                Chặng đầu
                <br />ở thế giới Lore
              </h3>
              <p>
                Giao diện, Class đầu tiên và cách đọc quest. Những điều nhỏ giúp
                bạn tự tin bắt đầu.
              </p>
              <span className="plain-link">
                Mở hướng dẫn <ArrowUpRight />
              </span>
            </div>
          </a>
          <div className="start-links">
            <a href="/huong-dan">
              <span>Chọn cách chiến đấu</span>
              <p>Tìm hiểu bốn Class khởi đầu.</p>
              <ArrowUpRight />
            </a>
            <a href="/he-thong/enhancement">
              <span>Hiểu Enhancement</span>
              <p>Một món đồ tốt cần lựa chọn phù hợp.</p>
              <ArrowUpRight />
            </a>
            <a href="/cot-truyen/hanh-trinh-chaos">
              <span>Theo mạch cốt truyện</span>
              <p>Lần theo các chương về Chaos.</p>
              <ArrowUpRight />
            </a>
          </div>
        </div>
      </section>
      <section className="class-chapter chapter">
        <div className="section-heading">
          <h2>
            Chọn Class.
            <br />
            Định lối chơi.
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
              Không có Class tốt nhất cho mọi hành trình. Bắt đầu từ cách bạn
              muốn chơi.
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
            <span>{selected.role.join(" / ")} · Class khởi đầu</span>
            <h3>{selected.name}</h3>
            <p>{selected.summary}</p>
            <dl>
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
      <section className="farm-chapter chapter">
        <div className="farm-art">
          <img
            src="/art/awe.svg"
            alt="Biểu tượng kiếm tự tạo minh họa hành trình thu thập vật phẩm"
            width="900"
            height="650"
            loading="lazy"
          />
        </div>
        <div className="farm-copy">
          <h2>
            Từng bước.
            <br />
            Từng mảnh.
          </h2>
          <p>
            Hướng dẫn farm có điều kiện, nguyên liệu và checklist. Hành trình
            dài dễ theo dõi hơn khi bạn biết mình đang ở đâu.
          </p>
          <a href="/farm/blade-of-awe" className="button">
            Farm Blade of Awe <ArrowUpRight size={20} />
          </a>
          <a href="/farm" className="plain-link">
            Xem hướng dẫn farm <ArrowRight size={20} />
          </a>
          <span>Tiến độ lưu trên thiết bị · Không cần đăng nhập</span>
        </div>
      </section>
      <section className="atlas chapter">
        <div className="section-heading">
          <h2>
            Mở rộng
            <br />
            hành trang.
          </h2>
          <p>Tra cứu nhanh, rồi trở lại cuộc phiêu lưu.</p>
        </div>
        <div className="atlas-links">
          <a href="/trang-bi">
            <h3>Trang bị</h3>
            <span>Nguồn sở hữu & điều kiện</span>
            <ArrowUpRight />
          </a>
          <a href="/he-thong">
            <h3>Hệ thống</h3>
            <span>Enhancement & cơ chế game</span>
            <ArrowUpRight />
          </a>
          <a href="/cot-truyen">
            <h3>Thế giới Lore</h3>
            <span>Các chương truyện & lối đi</span>
            <ArrowUpRight />
          </a>
        </div>
      </section>
      <section className="updates chapter">
        <div className="section-heading">
          <h2>Đọc tiếp.</h2>
          <p>Hướng dẫn nổi bật và nội dung vừa cập nhật.</p>
        </div>
        {[
          guides[0],
          guides.find((g) => g.slug === "cam-nang-aqw-vietnam")!,
          guides.find((g) => g.category === "farm")!,
        ].map((e) => (
          <EntryRow key={href(e)} entry={e} />
        ))}
        <a className="plain-link all-guides" href="/huong-dan">
          Toàn bộ thư viện <ArrowUpRight />
        </a>
      </section>
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
