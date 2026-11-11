import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Guide, ImportedBody } from "../types/content";
import { initialImportedBody } from "../lib/imported";
import { Article } from "./Article";
import { Breadcrumb } from "../components/Shell";
export function NativeGuide({ entry }: { entry: Guide }) {
  const [body, setBody] = useState<ImportedBody | null>(initialImportedBody);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (body) return;
    const abort = new AbortController();
    fetch(entry.imported!.bodyUrl, { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw Error("Không tải được nội dung bài viết.");
        return r.json();
      })
      .then((data) => {
        setBody(data);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => abort.abort();
  }, [entry, attempt, body]);
  if (!body)
    return (
      <main id="main" className="article-page">
        <div className="article-intro">
          <Breadcrumb
            items={[
              { label: "Cẩm nang", href: "/huong-dan/cam-nang-aqw-vietnam" },
              { label: entry.title },
            ]}
          />
          <h1>{entry.title}</h1>
          <p className="article-summary">{entry.summary}</p>
        </div>
        <div className="native-loading" role="status">
          {error ? (
            <>
              <p>{error}</p>
              <button
                className="button"
                onClick={() => setAttempt(attempt + 1)}
              >
                Thử tải lại
              </button>
            </>
          ) : (
            <p>Đang tải nội dung hướng dẫn…</p>
          )}
        </div>
      </main>
    );
  return (
    <>
      <Article entry={{ ...entry, sections: body.sections }} />
      <nav className="chapter-pager" aria-label="Bài trước và bài tiếp theo">
        {body.previous ? (
          <a href={body.previous.url}>
            <ArrowLeft size={20} />
            <span>
              <small>Bài trước</small>
              {body.previous.title}
            </span>
          </a>
        ) : (
          <a href="/huong-dan/cam-nang-aqw-vietnam">Mục lục cẩm nang</a>
        )}
        {body.next && (
          <a href={body.next.url}>
            <span>
              <small>Bài tiếp theo</small>
              {body.next.title}
            </span>
            <ArrowRight size={20} />
          </a>
        )}
      </nav>
    </>
  );
}
