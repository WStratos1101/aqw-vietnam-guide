import classes from "../content/home-starters.json";
import poster from "../content/home-poster.json";
import { useState } from "react";
import { LoreAtlas } from "./LoreAtlas";
import { ArrowRight, ArrowUpRight, ChevronDown, Search } from "lucide-react";
const journey = [
  {
    "chapter": "Chương I",
    "title": "Khởi đầu của câu chuyện",
    "href": "/cot-truyen",
    "description": "Từ những con đường quen thuộc của Battleon, số phận dẫn bạn đến những bí mật của thế giới Lore. Hãy lật mở trang đầu tiên, nơi một nhà thám hiểm vô danh có thể làm thay đổi cả lịch sử."
  },
  {
    "chapter": "Chương II",
    "title": "Món vũ khí đầu tiên",
    "href": "/farm/item/blade-of-awe",
    "description": "Năm mảnh di vật nằm rải rác, chờ người xứng đáng ghép lại thanh kiếm huyền thoại. Hãy lần theo dấu tích cổ xưa và rèn nên Blade of Awe, dấu ấn đầu tiên trên con đường trở thành huyền thoại."
  },
  {
    "chapter": "Chương III",
    "title": "Những người bạn, đồng minh hay kẻ thù",
    "href": "/ultra-boss",
    "description": "Không phải mọi kẻ đứng trước bạn đều là kẻ thù, và không phải mọi lời thề đều đáng tin. Khi đối mặt với những quyền năng hùng mạnh nhất của Lore, hãy chọn người sát cánh bên mình và tự viết nên kết cục của trận chiến."
  }
];
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
      <section className="start chapter" id="bat-dau">
        <div className="section-heading">
          <h2>
            Ngày anh hùng
            <br />
            gọi tên.
          </h2>
          <p>
            Tiếng chuông Battleon đã vang lên.
            <br />
            Lore đang chờ người đáp lời hiệu triệu.
          </p>
        </div>
        <div className="start-layout">
          <a href="/huong-dan/bat-dau" className="start-feature">
            <span>Lời hiệu triệu</span>
            <div>
              <h3>
                Ngọn lửa
                <br />đầu tiên
              </h3>
              <p>
                Nhận nhiệm vụ đầu tiên, khoác lên mình bộ trang bị và bước ra khỏi cổng thành.
                Ngay cả những huyền thoại vĩ đại nhất cũng từng là kẻ vô danh.
              </p>
              <span className="plain-link">
                Bước vào Lore <ArrowUpRight />
              </span>
            </div>
          </a>
          <div className="start-links">
            <a href="#class-khoi-dau">
              <span>Con đường của riêng bạn</span>
              <p>Kiếm, ma pháp, ánh sáng hay bóng tối? Hãy chọn sức mạnh sẽ đồng hành cùng bạn.</p>
              <ArrowUpRight />
            </a>
            <a href="/he-thong/enhancement">
              <span>Khắc sức mạnh lên thép</span>
              <p>Một lưỡi kiếm trở nên đáng sợ trong tay người biết cách đánh thức tiềm năng của nó.</p>
              <ArrowUpRight />
            </a>
            <a href="/cot-truyen/hanh-trinh-chaos">
              <span>Những dấu hiệu của Chaos</span>
              <p>Vương quốc rung chuyển, liên minh rạn nứt. Hãy lần theo dấu vết của biến cố đã đổi thay Lore.</p>
              <ArrowUpRight />
            </a>
          </div>
        </div>
      </section>
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
          <h2>Hành trình</h2>
          <p>Ba chặng đường, từ buổi đầu ở Battleon tới những trận chiến làm nên truyền thuyết.</p>
        </div>
        {journey.map((step) => (
          <a className="entry-row" href={step.href} key={step.href} data-home-journey={step.chapter}>
            <div>
              <span className="entry-category">{step.chapter}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
            <div className="entry-meta">
              <ArrowUpRight size={25} aria-hidden="true" />
            </div>
          </a>
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
