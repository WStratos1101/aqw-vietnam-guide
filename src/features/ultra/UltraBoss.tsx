import {BossOfficialTitle}from'./BossOfficialTitle';
import {bossDisplayName,bossPresentation,monsterDisplayName} from '../../lib/boss-names';
import { BossPhaseProvider } from "./BossPhaseInspection";
import { BossRecommendations } from "./BossRecommendations";
import {
  BossDirectoryCard,
  type BossDirectoryEntry,
} from "./BossDirectoryCard";
import { detailFor, TauntPanel } from "./BossTactics";
import { useUltraContent } from "./SourceSections";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Search, MapPin } from "lucide-react";
import { ultraBosses } from "../../content/ultra";
import {
  challengeCategoryFor,
  challengeLabels,
  type ChallengeCategory,
} from "../../content/ultra/categories";
import {
  challengeGuides,
  challengeResources,
} from "../../content/ultra/challenge-catalog";

import { Asset } from "./Asset";
import { BossPanel } from "./BossPanel";
import { Teams } from "./Teams";
import { Equipment } from "./Equipment";
import { inspectionFor } from "./EnemyInspection";
import { CopyCommand } from "../Interactions";
import type { UltraBoss } from "../../types/ultra";
import "../../styles/ultra/codex.css";
import "../../styles/ultra/v9.css";
import "../../styles/ultra/v12-5.css";
function useReveal(key: string) {
  useEffect(() => {
    const elements = document.querySelectorAll(".ultra-reveal");
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const observer = new IntersectionObserver(
      (items) =>
        items.forEach((item) => {
          if (item.isIntersecting) {
            item.target.classList.add("shown");
            observer.unobserve(item.target);
          }
        }),
      { threshold: 0.06 },
    );
    elements.forEach((el) => {
      el.classList.add("will-reveal");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [key]);
}
export function UltraDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ChallengeCategory | "all">("all");
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(
        "aqw:boss-directory:category",
      );
      if (saved && ["all", "daily", "weekly", "seasonal"].includes(saved))
        setCategory(saved as ChallengeCategory | "all");
    } catch {}
  }, []);
  function selectCategory(value: ChallengeCategory | "all") {
    setCategory(value);
    try {
      window.sessionStorage.setItem("aqw:boss-directory:category", value);
    } catch {}
  }
  useReveal("directory");
  const filtered = ultraBosses.filter(
    (b) =>
      (category === "all" || challengeCategoryFor(b.slug) === category) &&
      (
        b.name +
        " " +
        b.subtitle +
        " " +
        b.location +
        " " +
        inspectionFor(b.slug)
          ?.monsters.map((m) => m.canonicalName)
          .join(" ")
      )
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  const otherGuides = challengeGuides.filter(
    (g) =>
      !ultraBosses.some((b) => b.slug === g.id) &&
      (category === "all" || g.category === category) &&
      (g.name + " " + g.summary)
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <main id="main" className="ultra-codex ultra-directory">
      <header className="ultra-directory-intro">
        <p className="ultra-eyebrow">AdventureQuest Worlds / Endgame codex</p>
        <h1 className="codex-heading">
          Ultra Boss
          <br />
          <em className="codex-display">Codex</em>
        </h1>
        <p>
          Hồ sơ Ultra Boss dành cho những trận đánh cần cả đội cùng hiểu cơ chế.
        </p>
        <div className="ultra-directory-tools">
          <label>
            <Search size={18} />
            <span className="sr-only">Tìm Ultra Boss</span>
            <input
              type="search"
              placeholder="Tên boss hoặc map…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div
            className="challenge-filters"
            role="group"
            aria-label="Chu kỳ Boss"
          >
            {(["all", "daily", "weekly", "seasonal"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={category === value}
                onClick={() => selectCategory(value)}
              >
                {value === "all"
                  ? "Tất cả"
                  : value === "daily"
                    ? "Daily Boss"
                    : value === "weekly"
                      ? "Weekly Boss"
                      : "Seasonal"}
              </button>
            ))}
          </div>
        </div>
      </header>
      {(["daily", "weekly", "seasonal"] as const).map((group) => {
        const order: Record<string, string[]> = {
          daily: [
            "ultra-ezrajal",
            "ultra-warden",
            "ultra-engineer",
            "ultra-tyndarius",
            "god-of-the-depths",
            "kolr-usurper-of-flames",
            "astral-empyrean",
          ],
          weekly: [
            "champion-drakath",
            "ultra-nulgath",
            "ultra-dage",
            "ultra-speaker",
            "ultra-drago",
            "darkon-the-conductor",
            "gramiel-the-graceful",
          ],
          seasonal: ["kasuko", "batara-kala", "ultra-iara"],
        };
        const entries: BossDirectoryEntry[] = [
          ...filtered.map((b) => ({
            id: b.slug,
            name:
              bossDisplayName(b.slug,inspectionFor(b.slug)?.monsters.find((m) => m.id === "boss")
                ?.canonicalName || b.name),
            href: "/ultra-boss/" + b.slug,
            image: b.images.portrait,
            category: challengeCategoryFor(b.slug),
            location: b.location,
            unlock: b.accessRequirements[0],
            reward: b.rewardSummary,
          })),
          ...otherGuides.map((g) => ({
            id: g.id,
            name: g.name,
            href: g.href,
            image: g.image || "challenge-" + g.id,
            category: g.category,
          })),
        ]
          .filter((e) => e.category === group)
          .sort(
            (a, b) => order[group].indexOf(a.id) - order[group].indexOf(b.id),
          );
        return entries.length ? (
          <section
            key={group}
            className="ultra-directory-group"
            aria-labelledby={group + "-title"}
          >
            <h2 className="codex-display" id={group + "-title"}>
              {challengeLabels[group]}
            </h2>
            <div className="ultra-gallery">
              {entries.map((e) => (
                <BossDirectoryCard key={e.id} entry={e} />
              ))}
            </div>
          </section>
        ) : null;
      })}
      {!filtered.length && !otherGuides.length && (
        <div className="ultra-empty">
          <p>Không tìm thấy boss phù hợp.</p>
          <button
            onClick={() => {
              setQuery("");
              selectCategory("all");
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
      {category === "all" && !query && (
        <section className="ultra-section challenge-resources">
          <h2>Dungeon & thử thách khác</h2>
          <div><a href="/challenge-dungeon">Challenge Dungeon <ArrowRight size={16}/></a><a href="/other-challenges">Other Challenges <ArrowRight size={16}/></a></div>
          <div>
            {challengeResources.map((g) => (
              <a href={g.href} key={g.id}>
                <span>
                  <small>
                    {g.category === "Challenge Dungeon"
                      ? "Dungeon Guide"
                      : "Other Challenge"}
                  </small>
                  {g.title}
                </span>
                <ArrowRight size={16} />
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
export function UltraDetail({ boss }: { boss: UltraBoss }) {
  const presentation=bossPresentation(boss.slug);
  const monsters = inspectionFor(boss.slug)?.monsters || [];
  const heroName =
    bossDisplayName(boss.slug,monsters.length === 1 ? monsters[0].canonicalName : boss.name);
  const detail = detailFor(boss.slug);
  const questRequirements = boss.questRequirements || [];
  const accessRequirements = boss.accessRequirements;
  useReveal(boss.id);
  const { content, error, retry } = useUltraContent(boss);
  return (
    <BossPhaseProvider key={boss.slug}>
      <main
        id="main"
        className="ultra-codex ultra-detail"
        style={{ "--boss-accent-dark": presentation?.dark||boss.accent,"--boss-accent-light":presentation?.light||boss.accent } as CSSProperties}
      >
        <div className="ultra-back-row">
          <button
            className="ultra-back"
            onClick={() => {
              history.pushState(null, "", "/ultra-boss");
              window.dispatchEvent(new PopStateEvent("popstate"));
              window.scrollTo(0, 0);
            }}
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          <span>Ultra Boss Codex</span>
        </div>
        <section className="ultra-hero" aria-labelledby="boss-name">
          <BossOfficialTitle name={heroName}/>
          <div className="ultra-hero-copy">
            <p className="ultra-subtitle">{presentation?.ultraName||boss.name}</p>
            <p className="ultra-description">{detail.storyDescription}</p>
            <dl className="ultra-hero-meta">
              <div>
                <dt>Map</dt>
                <dd>{boss.location}</dd>
              </div>
              <div>
                <dt>Mở khóa</dt>
                <dd>
                  {accessRequirements.length
                    ? accessRequirements.join(" ")
                    : "Điều kiện vào map chưa xác minh."}
                </dd>
              </div>
              {(
                <div>
                  <dt>Điều kiện quest</dt>
                  <dd>{questRequirements.length?questRequirements.join(" "):"Điều kiện nhận quest chưa xác minh."}</dd>
                </div>
              )}
              <div>
                <dt>Reset</dt>
                <dd>
                  {detail.resetInfo.label} · {detail.resetInfo.text}
                </dd>
              </div>
            </dl>
            <CopyCommand command={boss.joinCommand} />
          </div>
          <div className="ultra-hero-art">
            <div className="ultra-portrait-frame">
              <Asset id={boss.images.portrait} eager />
            </div>
            <span className="ultra-art-caption">{boss.subtitle}</span>
          </div>
        </section>
        {boss.sourceContentUrl && !content && (
          <div className="ultra-content-status" role="status">
            {error ? (
              <>
                <p>{error}</p>
                <button onClick={retry}>Thử tải lại hướng dẫn</button>
              </>
            ) : (
              "Đang tải phần hướng dẫn chi tiết…"
            )}
          </div>
        )}
        <BossPanel boss={boss} />
        {boss.slug !== "darkon-the-conductor" && <TauntPanel detail={detail} />}
        {boss.slug !== "darkon-the-conductor" &&
          boss.slug !== "ultra-speaker" && (
            <Teams boss={boss} guide={content} />
          )}
        <Equipment key={boss.slug} boss={boss} guide={content} />
        <BossRecommendations
          key={"recommendations-" + boss.slug}
          currentSlug={boss.slug}
        />
      </main>
    </BossPhaseProvider>
  );
}
