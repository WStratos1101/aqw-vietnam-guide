import { isUltraGuideContent } from "../../lib/ultra-progress";
import { useEffect, useState } from "react";
import type { ContentSection } from "../../types/content";
import type { UltraBoss, UltraGuideContent } from "../../types/ultra";
import { initialImportedBody } from "../../lib/imported";
import { RichContent } from "../RichContent";
function initialContent(bossId: string) {
  const value = initialImportedBody() as unknown as UltraGuideContent | null;
  return isUltraGuideContent(value, bossId) ? value : null;
}
export function useUltraContent(boss: UltraBoss) {
  const [content, setContent] = useState<UltraGuideContent | null>(() =>
    initialContent(boss.id),
  );
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!boss.sourceContentUrl || content) return;
    const controller = new AbortController();
    fetch(boss.sourceContentUrl, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error("Không tải được phần hướng dẫn chi tiết.");
        return r.json();
      })
      .then((value) => {
        if (!isUltraGuideContent(value, boss.id))
          throw Error("Dữ liệu hướng dẫn chưa hợp lệ.");
        setContent(value);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [boss.sourceContentUrl, content, attempt]);
  return { content, error, retry: () => setAttempt((n) => n + 1) };
}
export function SourceSections({
  sections,
  title,
}: {
  sections: ContentSection[];
  title?: string;
}) {
  return (
    <div className="ultra-source-guide">
      {title && <h3>{title}</h3>}
      {sections.map((s) => (
        <section key={s.id} id={s.id}>
          <h3>{s.title}</h3>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {s.blocks && <RichContent blocks={s.blocks} />}
        </section>
      ))}
    </div>
  );
}
