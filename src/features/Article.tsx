import { EntityShowcase } from "./EntityShowcase";
import { mediaFor } from "../content/media/entities";
import { RichContent, WeaponRanges } from "./RichContent";
import { ArrowLeft } from "lucide-react";
import type { Entry, FarmingGuide, GameClass } from "../types/content";
import { categories, href, guides } from "../content/data";
import { Breadcrumb } from "../components/Shell";
import {
  BookmarkButton,
  CopyCommand,
  Checklist,
  SectionProgress,
} from "./Interactions";
import { EntryRow } from "./Library";
export function Article({ entry }: { entry: Entry }) {
  const c = entry as GameClass;
  const boss = mediaFor(entry)?.kind === "boss";
  const related = guides
    .filter(
      (g) =>
        g !== entry &&
        entry.related.includes(g.slug) &&
        href(g) !== href(entry),
    )
    .slice(0, 3);
  return (
    <main
      id="main"
      className={`article-page ${entry.imported ? "native-article" : ""} ${boss ? "boss-article" : ""}`}
    >
      <div className="article-intro">
        <Breadcrumb
          items={[
            { label: categories[entry.category], href: `/${entry.category}` },
            { label: entry.title },
          ]}
        />
        <h1>{entry.title}</h1>
        <p className="article-summary">{entry.summary}</p>
        <div className="article-meta">
          <span>{entry.readMinutes} phút đọc</span>
          <span>
            {entry.status === "Đã đối chiếu" ? "Đối chiếu" : "Biên soạn"}{" "}
            {new Date(entry.updatedAt).toLocaleDateString("vi-VN")}
          </span>
          <span>Độ khó: {entry.difficulty} (biên tập)</span>
        </div>
        <BookmarkButton id={href(entry)} />
      </div>
      <EntityShowcase entry={entry} />
      <nav
        id="muc-chinh"
        className="article-section-index"
        aria-label="Mục chính"
      >
        <h2>{boss ? "Chiến thuật & chuẩn bị" : "Mục chính"}</h2>
        <div>
          {entry.sections.map((s, index) => (
            <a key={s.id} href={`#${s.id}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {s.title}
            </a>
          ))}
        </div>
      </nav>
      <div className="article-layout">
        <aside className="toc">
          <a
            className="guide-directory-link"
            href="/huong-dan/cam-nang-aqw-vietnam"
          >
            Mục lục cẩm nang
          </a>
          <h2>Trong bài này</h2>
          <nav aria-label="Mục lục bài viết">
            {entry.sections.map((s) => (
              <a href={`#${s.id}`} key={s.id}>
                {s.title}
              </a>
            ))}
            {entry.category === "farm" && "checklist" in entry && (
              <a href="#progress-title">Checklist tiến độ</a>
            )}
          </nav>
        </aside>
        <article className="article-body">
          {entry.category === "class" && "role" in entry && (
            <div className="class-facts">
              <dl>
                <div>
                  <dt>Vai trò (biên tập)</dt>
                  <dd>{c.role}</dd>
                </div>
                <div>
                  <dt>Enhancement nền tảng</dt>
                  <dd>{c.enhancement}</dd>
                </div>
                <div>
                  <dt>Sở hữu</dt>
                  <dd>{c.ownership}</dd>
                </div>
              </dl>
              <h2>Điểm mạnh và giới hạn</h2>
              <p>{c.strengths}</p>
              <p>{c.weaknesses}</p>
            </div>
          )}
          {entry.imported?.slug === "general-boosted" && <WeaponRanges />}
          {entry.sections.map((s) => (
            <section className="guide-topic" id={s.id} key={s.id}>
              <h2>{s.title}</h2>
              {s.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {s.steps && (
                <ol>
                  {s.steps.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ol>
              )}
              {s.terms && (
                <dl className="glossary">
                  {s.terms.map((term) => (
                    <div key={term.term}>
                      <dt>{term.term}</dt>
                      <dd>{term.definition}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {s.links && (
                <ul className="resource-links">
                  {s.links
                    .filter(
                      (link) =>
                        link.url.startsWith("/") || link.url.startsWith("#"),
                    )
                    .map((link) => (
                      <li key={link.url}>
                        <a
                          href={link.url}
                          {...(link.url.startsWith("https://")
                            ? { target: "_blank", rel: "noreferrer" }
                            : {})}
                        >
                          {link.title}
                        </a>
                      </li>
                    ))}
                </ul>
              )}
              {s.blocks && <RichContent blocks={s.blocks} parentId={s.id} />}
              {s.command && <CopyCommand command={s.command} />}{" "}
              {entry.imported &&
                entry.category === "farm" &&
                /^(Step|Bước)\b/i.test(s.title) && (
                  <SectionProgress
                    pageId={entry.imported.id}
                    sectionId={s.id}
                  />
                )}
              {s.note && (
                <aside className="note">
                  <strong>Lưu ý</strong>
                  <p>{s.note}</p>
                </aside>
              )}
            </section>
          ))}
          {entry.category === "farm" && "checklist" in entry && (
            <>
              <section>
                <h2>Nguyên liệu cần giữ</h2>
                <ul>
                  {(entry as FarmingGuide).materials.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </section>
              <Checklist guide={entry as FarmingGuide} />
            </>
          )}
        </article>
      </div>
      {(!entry.imported || related.length > 0) && (
        <section className="related">
          <h2>Tiếp tục khám phá</h2>
          {related.map((e) => (
            <EntryRow key={href(e)} entry={e} />
          ))}
          <a className="plain-link" href={`/${entry.category}`}>
            <ArrowLeft size={18} /> Trở lại {categories[entry.category]}
          </a>
        </section>
      )}
    </main>
  );
}
