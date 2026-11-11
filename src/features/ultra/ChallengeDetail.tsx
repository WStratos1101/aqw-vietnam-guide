import {BossOfficialTitle}from'./BossOfficialTitle';
import "../../styles/ultra/v12-5.css";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { initialImportedBody } from "../../lib/imported";
import type { ImportedBody } from "../../types/content";
import type { ChallengeGuide } from "../../content/ultra/challenge-catalog";
import { challengeLabels } from "../../content/ultra/categories";
import { SourceSections } from "./SourceSections";
import { Asset } from "./Asset";
export function ChallengeDetail({ guide }: { guide: ChallengeGuide }) {
  const [body, setBody] = useState<ImportedBody | null>(initialImportedBody);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (body) return;
    const controller = new AbortController();
    fetch(guide.bodyUrl, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error("Không tải được hướng dẫn.");
        return r.json();
      })
      .then(setBody)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [guide, body, attempt]);
  const sections =
    body?.sections.filter(
      (s) => !guide.sectionId || s.id === guide.sectionId,
    ) || [];
  return (
    <main id="main" className="ultra-codex challenge-detail">
      <div className="ultra-back-row">
        <a className="ultra-back" href="/ultra-boss">
          <ArrowLeft size={18} />
          Quay lại
        </a>
        <span>{challengeLabels[guide.category]}</span>
      </div>
      <section className="ultra-hero">
        <BossOfficialTitle name={guide.name} eyebrow={challengeLabels[guide.category]}/>
        <div className="ultra-hero-copy">
          <p className="ultra-description">{guide.summary}</p>
          {guide.level != null && (
            <dl className="challenge-base-stats">
              <div>
                <dt>Level</dt>
                <dd>{guide.level}</dd>
              </div>
              <div>
                <dt>Tổng HP · {guide.name}</dt>
                <dd>{guide.maxHp?.toLocaleString("vi-VN")}</dd>
              </div>
            </dl>
          )}
          <nav className="challenge-section-nav" aria-label="Trong hướng dẫn">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.title}
              </a>
            ))}
          </nav>
        </div>
        <div className="ultra-hero-art">
          <Asset
            id={guide.image || `challenge-${guide.id}`}
            label={guide.name}
            eager
          />
        </div>
      </section>
      {!body && (
        <div role="status">
          {error ? (
            <>
              <p>{error}</p>
              <button
                onClick={() => {
                  setError("");
                  setAttempt((n) => n + 1);
                }}
              >
                Thử lại
              </button>
            </>
          ) : (
            "Đang tải hướng dẫn…"
          )}
        </div>
      )}
      <div className="challenge-chapters">
        {sections.map((s) => (
          <details key={s.id} id={s.id}>
            <summary>
              {s.title}
              <ChevronDown size={18} />
            </summary>
            <SourceSections sections={[{ ...s, id: `content-${s.id}` }]} />
          </details>
        ))}
      </div>
    </main>
  );
}
