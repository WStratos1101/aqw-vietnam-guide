import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from './ThemeToggle';
import { APP_VERSION } from '../config/version';
import { Menu, X, Search, ArrowUp, ArrowUpRight, Swords } from "lucide-react";
export const nav = [
  ["/huong-dan", "Hướng dẫn"],
  ["/class", "Class"],
  ["/farm", "Farm"],
  ["/ultra-boss", "Ultra Boss"],
  ["/trang-bi", "Trang bị"],
  ["/he-thong", "Hệ thống"],
  ["/cot-truyen", "Cốt truyện"],
];
export function Header({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  return (
    <>
      <a className="skip" href="#main">
        Đến nội dung chính
      </a>
      <header className="header">
        <a
          className="brand"
          href="/"
          aria-label="AQW Vietnam Guide — Trang chủ"
        >
          <Swords size={28} />
          <span>
            AQW<span className="brand-sub">Vietnam Guide</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {nav.map(([url, title]) => (
            <a
              key={url}
              href={url}
              aria-current={path.startsWith(url) ? "page" : undefined}
            >
              {title}
            </a>
          ))}
        </nav>
        <a
          className="search-link"
          href="/huong-dan?search=1"
          aria-label="Tìm kiếm thư viện"
        >
          <Search size={21} />
          <span>Tìm kiếm</span>
        </a>
        <ThemeToggle />
        <button
          ref={toggle}
          className="menu-button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? <X /> : <Menu />}
        </button>
        {open && (
          <nav
            id="mobile-nav"
            className="mobile-nav"
            aria-label="Điều hướng di động"
          >
            {nav.map(([url, title]) => (
              <a key={url} href={url}>
                {title}
                <ArrowUpRight size={20} />
              </a>
            ))}
            
            <a href="/gioi-thieu">Giới thiệu</a>
          </nav>
        )}
      </header>
    </>
  );
}
export const disclaimer =
  "AQW Vietnam Guide là dự án hướng dẫn do cộng đồng thực hiện, không liên kết hoặc được bảo trợ bởi Artix Entertainment. AdventureQuest Worlds và các tài sản liên quan thuộc về Artix Entertainment LLC.";
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-wordmark">BATTLE ON.</div>
        <div>
          
          <a href="/gioi-thieu">
            Về dự án <ArrowUpRight size={18} />
          </a>
          <a href="https://www.artix.com/" target="_blank" rel="noreferrer">
            Artix Entertainment <ArrowUpRight size={18} />
          </a>
          <a href="https://www.aq.com/" target="_blank" rel="noreferrer">
            Website AQWorlds <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
      <BackToTop />
      <div className="footer-bottom">
        <div className="footer-ownership"><p><strong>Bản quyền Website thuộc về W.Stratos</strong></p><small>Bản quyền thuộc về Guild AQW Vietnam Collectors.<br/>Nhân vật, artwork, thương hiệu và game assets © Artix Entertainment LLC và chủ sở hữu tương ứng. Website không được Artix bảo trợ.<br/><a href="https://www.artix.com/" target="_blank" rel="noreferrer">Artix Entertainment</a> · <a href="https://www.aq.com/" target="_blank" rel="noreferrer">AdventureQuest Worlds</a> · <a href="https://www.artix.com/community/brand-and-assets-usage/" target="_blank" rel="noreferrer">Điều kiện sử dụng assets</a> · <a href="https://aqwwiki.wikidot.com/" target="_blank" rel="noreferrer">AQWorlds Wiki</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a></small></div>
        <span>Version {APP_VERSION}</span>
      </div>
    </footer>
  );
}
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="breadcrumb" aria-label="Đường dẫn">
      <a href="/">Trang chủ</a>
      {items.map((item, i) => (
        <span key={i}>
          <span aria-hidden="true">/</span>
          {item.href ? (
            <a href={item.href}>{item.label}</a>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function BackToTop() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      className={`back-to-top ${shown ? "is-shown" : ""}`}
      aria-label="Cuộn lên đầu trang"
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        })
      }
    >
      <ArrowUp size={22} />
    </button>
  );
}
