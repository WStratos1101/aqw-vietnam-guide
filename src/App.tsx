import {ComingSoonPage} from './features/ComingSoonPage';
import {isComingSoon} from './lib/site-feature-access.mjs';
import challengeCatalog from './content/challenges/catalog.json';
import {RouteView,loadRouteViews} from './features/route-views';
import {findClass,findBoss} from './lib/route-summaries';
import "./styles/classes/codex.css";
import './styles/ultra/codex.css';
import './styles/ultra/v9.css';
import './styles/ultra/v11.css';
import './styles/classes/v12.css';
import {findChallenge} from './content/ultra/challenge-catalog';
import { NativeGuide } from "./features/NativeGuide";
import { resolveRoute } from "./lib/routes";
import React, { useEffect, useState, Component, type ReactNode } from "react";
import { Header, Footer, Breadcrumb, disclaimer } from "./components/Shell";
import { Home } from "./features/Home";
import { Library } from "./features/Library";
import { Article } from "./features/Article";
import { guides, categories } from "./content/data";
import type { SectionKey } from "./types/content";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main id="main" className="message-page">
        <h1>Không tải được trang</h1>
        <p>Hãy tải lại trang. Tiến độ đã lưu trong trình duyệt vẫn được giữ.</p>
        <button className="button" onClick={() => location.reload()}>
          Tải lại
        </button>
        <a href="/">Về trang chủ</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
function About() {
  return (
    <main id="main" className="about-page">
      <Breadcrumb items={[{ label: "Giới thiệu" }]} />
      <h1>
        Một cẩm nang.
        <br />
        Chung đam mê.
      </h1>
      <p className="article-summary">
        AQW Vietnam Guide giúp người chơi Việt tìm được chỉ dẫn rõ ràng cho
        AdventureQuest Worlds.
      </p>
      <div className="about-content">
        <section>
          <h2>Từ cộng đồng, cho cộng đồng</h2>
          <p>
            Đây là phiên bản thư viện ban đầu, tập trung vào hướng dẫn người mới
            và những dữ kiện có thể truy ngược nguồn. Website chỉ dành cho
            AdventureQuest Worlds, không gộp dữ liệu AdventureQuest, AQ3D hoặc
            AQWorlds Infinity.
          </p>
        </section>
        <section>
          <h2>Cách chúng tôi viết</h2>
          <p>
            Tên Class, Quest, NPC và Item giữ nguyên để tiện tra cứu. Dữ kiện
            được cập nhật định kỳ; nhận xét chủ quan được ghi là gợi ý biên tập.
            Phần chưa đủ nguồn mang trạng thái “Đang cập nhật”. Độ khó là đánh
            giá biên tập, thời gian đọc là ước tính.
          </p>
        </section>
        <section>
          <h2>Dự án cộng đồng</h2>
          <p>{disclaimer}</p>
        </section>
        <section>
          <h2>Dữ liệu trên thiết bị</h2>
          <p>
            Bookmark và checklist được lưu bằng localStorage. Không gửi tiến độ,
            tài khoản hay thông tin đăng nhập đến máy chủ. Xóa dữ liệu trình
            duyệt sẽ xóa các ghi chú này.
          </p>
        </section>
      </div>
    </main>
  );
}
function NotFound() {
  return (
    <main id="main" className="message-page">
      <span className="error-code">404</span>
      <h1>Lạc khỏi bản đồ?</h1>
      <p>
        Trang này không tồn tại. Hãy trở lại thư viện để tìm hành trình tiếp
        theo.
      </p>
      <a href="/huong-dan" className="button">
        Về thư viện
      </a>
    </main>
  );
}
export function App() {
  const [pathname, setPathname] = useState(location.pathname);
  useEffect(() => {
    const update = async () => {await loadRouteViews(location.pathname);setPathname(location.pathname);};
    const click = async (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element).closest?.("a");
      if (!link || link.target || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (
        url.origin !== location.origin ||
        !(
          /^\/(ultra-boss|challenge-dungeon|other-challenges)(?:\/|$)/.test(url.pathname) ||
          isComingSoon(url.pathname) || url.pathname === "/" ||
          url.pathname === "/class" ||
          url.pathname === "/class/thu-vien" ||
          (/^\/class\/[^/]+$/.test(url.pathname) &&
            !!findClass(url.pathname.split("/")[2]))
        ) ||
        url.hash
      )
        return;
      event.preventDefault();
      try{await loadRouteViews(url.pathname);}catch{location.assign(url.href);return;}
      history.pushState(
        { aqwPrevious: location.pathname + location.search },
        "",
        url.pathname + url.search,
      );
      setPathname(url.pathname);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", update);
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("popstate", update);
      document.removeEventListener("click", click);
    };
  }, []);

  const { path, category, valid, entry, is404, comingSoon } = resolveRoute(
    pathname,
    guides,
    categories,
  );
  const classProfile = path.startsWith("/class/")
    ? findClass(path.split("/")[2])
    : undefined;
  const challengeEntry = challengeCatalog.find(c => c.href === path);
  const challengeTitle = challengeEntry?.name || (path === "/challenge-dungeon" ? "Challenge Dungeon" : path === "/other-challenges" ? "Other Challenges" : undefined);
  const classTitle = path === "/class" ? "Class Codex" : classProfile?.name;
  const ultraBoss = path.startsWith("/ultra-boss/")
    ? findBoss(path.split("/")[2])
    : undefined;
  const challenge=path.startsWith('/ultra-boss/')?findChallenge(path.split('/')[2]):undefined;
  const ultraTitle =
    path === "/ultra-boss" ? "Ultra Boss Codex" : ultraBoss?.name||challenge?.name;
  useEffect(() => {
    document.title = `${comingSoon ? "Thông tin đang được cập nhật" : is404 ? "Không tìm thấy trang" : challengeTitle || classTitle || ultraTitle || entry?.title || (valid ? categories[category as SectionKey] : path === "/gioi-thieu" ? "Giới thiệu" : "Cẩm nang phiêu lưu")} | AQW Vietnam Guide`;
    if (classTitle)
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute(
          "content",
          classProfile?.shortDescription ||
            "Thư viện Class AdventureQuest Worlds: bộ skill, cách lấy và hướng dẫn combo.",
        );
    if (ultraTitle) {
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute(
          "content",
          ultraBoss?.description ||
            "Ultra Boss Codex: cơ chế, đội hình và lộ trình trang bị endgame trong AdventureQuest Worlds.",
        );
    }
    if (!is404)
      document
        .querySelector('meta[name="robots"][content="noindex"]')
        ?.remove();
    let robots = document.querySelector('meta[name="robots"]');
    if (is404) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      robots.setAttribute("content", "noindex");
      document.head.appendChild(robots);
    }
    const observer = new IntersectionObserver(
      (items) =>
        items.forEach((item) => {
          if (item.isIntersecting) {
            item.target.classList.add("is-visible");
            observer.unobserve(item.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll(".chapter > *, .hero-copy > *").forEach((el) => {
      el.classList.add("reveal");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [path, is404, entry, category, ultraTitle, classTitle, classProfile, challengeTitle, comingSoon]);
  return (
    <ErrorBoundary>
      <Header path={path} />
      {comingSoon ? <ComingSoonPage/> : is404 ? (
        <NotFound />
      ) : challengeEntry ? (
        <RouteView kind="challenge-detail" slug={challengeEntry.id}/>
      ) : path === "/challenge-dungeon" ? (
        <RouteView kind="challenge-dungeons"/>
      ) : path === "/other-challenges" ? (
        <RouteView kind="other-challenges"/>
      ) : path === "/class" ? (
        <RouteView kind="class-directory"/>
      ) : classProfile ? (
        <RouteView key={classProfile.id} kind="class-detail" slug={classProfile.slug}/>
      ) : path === "/ultra-boss" ? (
        <RouteView kind="ultra-directory"/>
      ) : ultraBoss ? (
        <RouteView key={ultraBoss.id} kind="ultra-detail" slug={ultraBoss.slug}/>
      ) : path === "/" ? (
        <Home />
      ) : path === "/gioi-thieu" ? (
        <About />
      ) : entry ? (
        entry.imported ? (
          <NativeGuide key={entry.imported.id} entry={entry} />
        ) : (
          <Article entry={entry} />
        )
      ) : (
        <Library category={category as SectionKey} />
      )}
      <Footer />
    </ErrorBoundary>
  );
}
