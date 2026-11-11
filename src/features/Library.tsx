import {isComingSoon} from '../lib/site-feature-access.mjs';
import { useEffect, useState } from "react";
import { ArrowUpRight, Search, X, SlidersHorizontal } from "lucide-react";
import { guides, categories, href } from "../content/data";
import { searchEntries } from "../lib/search";
import { readStored } from "../lib/storage";
import type { Entry, SectionKey, GameClass, Item } from "../types/content";
import { Breadcrumb } from "../components/Shell";
const descriptions: Record<SectionKey, string> = {
  "huong-dan": "Tìm đúng chỉ dẫn cho chặng đường tiếp theo của bạn.",
  class: "Hiểu Class trước khi chọn cách chiến đấu.",
  farm: "Từ điều kiện đầu tiên đến món đồ trong hành trang.",
  "trang-bi": "Tên gốc, nguồn sở hữu và những điều cần kiểm tra.",
  "he-thong": "Hiểu cơ chế. Chơi có chủ đích.",
  "cot-truyen": "Một lối đi qua những chương truyện của Lore.",
};
export function EntryRow({ entry }: { entry: Entry }) {
  const locked = isComingSoon(href(entry));
  return (
    <a className="entry-row" href={href(entry)}>
      <div>
        <span className="entry-category">
          {categories[entry.category]} · {entry.difficulty}
        </span>
        <h3>{entry.title}</h3>
        <p>{entry.summary}</p>
      </div>
      <div className="entry-meta">
        <span
          className={locked || entry.status === "Đang cập nhật" ? "pending" : "verified"}
        >
          {locked ? "Đang cập nhật" : entry.status === "Theo tài liệu cộng đồng"
            ? "Hướng dẫn"
            : entry.status}
        </span>
        {!locked && <span>
          {entry.readMinutes} phút đọc ·{" "}
          {new Date(entry.updatedAt).toLocaleDateString("vi-VN")}
        </span>}
        <ArrowUpRight size={25} />
      </div>
    </a>
  );
}
export function Library({ category }: { category: SectionKey }) {
  const [query, setQuery] = useState(
    new URLSearchParams(location.search).get("q") || "",
  );
  const [filter, setFilter] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [ownership, setOwnership] = useState("all");
  const [page, setPage] = useState(1);
  const [searchIndex, setSearchIndex] = useState<Record<string, string> | null>(
    null,
  );
  const [indexError, setIndexError] = useState(false);
  const [indexAttempt, setIndexAttempt] = useState(0);
  useEffect(
    () => setPage(1),
    [query, filter, difficulty, savedOnly, ownership],
  );
  useEffect(() => {
    if (!query.trim() || searchIndex) return;
    const abort = new AbortController();
    setIndexError(false);
    fetch("/content/search-index.json", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error("index");
        return r.json();
      })
      .then(setSearchIndex)
      .catch((e) => {
        if (e.name !== "AbortError") setIndexError(true);
      });
    return () => abort.abort();
  }, [Boolean(query.trim()), searchIndex, indexAttempt]);
  const all = category === "huong-dan";
  const filtered = searchEntries(
    guides,
    query,
    searchIndex || undefined,
  ).filter(
    (entry) =>
      (all || entry.category === category) &&
      (difficulty === "all" || entry.difficulty === difficulty) &&
      (filter === "all" ||
        (category === "class"
          ? filter === "__unclassified"
            ? !("role" in entry)
            : (entry as GameClass).role === filter
          : category === "trang-bi"
            ? filter === "__unclassified"
              ? !("itemType" in entry)
              : (entry as Item).itemType === filter
            : entry.category === filter)) &&
      (!savedOnly ||
        readStored<string[]>("aqw:bookmarks", []).includes(href(entry))) &&
      (ownership === "all" || (entry as GameClass).ownership === ownership),
  );
  const choices =
    category === "class"
      ? ["Cận chiến", "Phép thuật", "Hỗ trợ", "__unclassified"]
      : category === "trang-bi"
        ? [
            "Vũ khí",
            "Giáp",
            "Mũ",
            "Áo choàng",
            "Thú cưng",
            "Vật phẩm khác",
            "__unclassified",
          ]
        : all
          ? Object.keys(categories)
          : [];
  const pageCount = Math.max(1, Math.ceil(filtered.length / 24));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 24, currentPage * 24);
  const [compare, setCompare] = useState<string[]>([]);
  return (
    <main id="main" className="library-page">
      <div className="page-intro">
        <Breadcrumb
          items={[{ label: all ? "Thư viện hướng dẫn" : categories[category] }]}
        />
        <h1>
          {all
            ? "Thư viện hướng dẫn"
            : categories[category] === "Class"
              ? "Khám phá Class"
              : categories[category]}
        </h1>
        <p>{descriptions[category]}</p>
      </div>
      <div className="library-content" data-ui>
        <div className="search-field">
          <Search size={23} />
          <label className="sr-only" htmlFor="library-search">
            Tìm kiếm nội dung
          </label>
          <input
            id="library-search"
            autoFocus={new URLSearchParams(location.search).has("search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              all
                ? "Tìm Class, vật phẩm, hướng dẫn…"
                : "Tìm trong " + categories[category]
            }
            type="search"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Xóa tìm kiếm">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="filters">
          <SlidersHorizontal size={18} />
          {choices.length > 0 && (
            <label>
              {category === "class" ? "Vai trò" : "Danh mục"}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                {choices.map((c) => (
                  <option key={c} value={c}>
                    {c === "__unclassified"
                      ? "Chủ đề / chưa phân loại"
                      : all
                        ? categories[c as SectionKey]
                        : c}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Độ khó
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option>Dễ</option>
              <option>Vừa</option>
              <option>Chưa đánh giá</option>
            </select>
          </label>
          {category === "class" && (
            <label>
              Sở hữu
              <select
                value={ownership}
                onChange={(e) => setOwnership(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option>Miễn phí</option>
              </select>
            </label>
          )}
          <label className="saved-filter">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(e) => setSavedOnly(e.target.checked)}
            />{" "}
            Bài đã lưu
          </label>
        </div>
        {query.trim() && !searchIndex && !indexError && (
          <p role="status">Đang tải chỉ mục tìm trong toàn bộ nội dung…</p>
        )}
        {indexError && (
          <div className="search-index-error" role="status">
            <p>
              Chưa tải được chỉ mục đầy đủ. Bạn vẫn có thể tìm theo tiêu đề.
            </p>
            <button
              className="text-button"
              onClick={() => setIndexAttempt(indexAttempt + 1)}
            >
              Thử tải lại chỉ mục
            </button>
          </div>
        )}
        <p className="results-count" role="status">
          {filtered.length} kết quả {query && `cho “${query}”`}
        </p>
        {filtered.length ? (
          visible.map((entry) => (
            <div key={href(entry)}>
              <EntryRow entry={entry} />
              {category === "class" && "role" in entry && (
                <label className="compare-choice">
                  <input
                    type="checkbox"
                    checked={compare.includes(entry.slug)}
                    onChange={() =>
                      setCompare(
                        compare.includes(entry.slug)
                          ? compare.filter((s) => s !== entry.slug)
                          : [...compare, entry.slug],
                      )
                    }
                  />{" "}
                  So sánh {entry.title}
                </label>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h2>Chưa tìm thấy nội dung</h2>
            <p>
              Thử tên ngắn hơn hoặc bỏ bớt bộ lọc. Một số danh mục đang được
              biên soạn.
            </p>
            <button
              className="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
                setDifficulty("all");
                setSavedOnly(false);
                setOwnership("all");
              }}
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
        {pageCount > 1 && (
          <nav className="pagination" aria-label="Phân trang thư viện">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setPage(currentPage - 1);
                document.querySelector(".library-content")?.scrollIntoView();
              }}
            >
              Trang trước
            </button>
            <span>
              Trang {currentPage} / {pageCount}
            </span>
            <button
              disabled={currentPage === pageCount}
              onClick={() => {
                setPage(currentPage + 1);
                document.querySelector(".library-content")?.scrollIntoView();
              }}
            >
              Trang sau
            </button>
          </nav>
        )}
        {category === "class" && compare.length > 0 && (
          <section className="comparison">
            <h2>So sánh cơ bản</h2>
            <p>
              Vai trò là cách phân nhóm biên tập; không phải bảng xếp hạng sức
              mạnh.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Vai trò</th>
                    <th>Enhancement nền tảng</th>
                    <th>Sở hữu</th>
                  </tr>
                </thead>
                <tbody>
                  {guides
                    .filter(
                      (e) =>
                        e.category === "class" &&
                        "role" in e &&
                        compare.includes(e.slug),
                    )
                    .map((e) => {
                      const c = e as GameClass;
                      return (
                        <tr key={c.slug}>
                          <th>
                            <a href={href(c)}>{c.title}</a>
                          </th>
                          <td>{c.role}</td>
                          <td>{c.enhancement}</td>
                          <td>{c.ownership}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
