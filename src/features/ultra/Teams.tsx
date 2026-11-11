import teamUi from "../../content/ultra/team-ui.json";
import { phaseSystemFor } from "../../lib/boss-phases";
import {
  useBossPhase,
  BossPhaseSelector,
  PhaseStrategy,
} from "./BossPhaseInspection";
import { RichContent } from "../RichContent";
import { useState, useId } from "react";
import { ChevronDown, Crosshair } from "lucide-react";
import type {
  RecommendedTeam,
  UltraBoss,
  UltraGuideContent,
} from "../../types/ultra";
import { TeamAssignments, TeamRoleSummary } from "./TeamAssignments";
function Team({
  team,
  guide,
  slug,
}: {
  team: RecommendedTeam;
  guide?: UltraGuideContent | null;
  slug: string;
}) {
  const { phaseId, selectPhase } = useBossPhase();
  const system = phaseSystemFor(slug);
  const phase =
    system?.phases.find((p) => p.id === phaseId) || system?.phases[0];
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const id = useId();
  return (
    <article className={`ultra-team ${open ? "is-open" : ""}`}>
      <button
        className="ultra-team-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span className="ultra-team-heading">
          <strong>Đội hình {team.id.match(/\d+/)?.[0] || ""}</strong>
          <ChevronDown className="ultra-chevron" size={20} />
        </span>
        <TeamRoleSummary slug={slug} teamId={team.id} selected={selected} />
        {!team.description.includes("các tên ngăn bằng /") && (
          <span className="ultra-team-description">{team.description}</span>
        )}
      </button>
      <div className="ultra-accordion" inert={!open} aria-hidden={!open}>
        <div id={id} className="ultra-accordion-inner">
          <div className="ultra-team-detail">
            <>
              {system && phase && (
                <>
                  <BossPhaseSelector
                    phases={system.phases}
                    phase={phase}
                    onChange={selectPhase}
                  />
                  <PhaseStrategy phase={phase} compact teamId={team.id} />
                </>
              )}
            </>
            <TeamAssignments
              slug={slug}
              teamId={team.id}
              selected={selected}
              onSelect={(slot, id) =>
                setSelected((prev) => ({ ...prev, [slot]: id }))
              }
            />
            <TeamNotes slug={slug} teamId={team.id} />
          </div>
        </div>
      </div>
    </article>
  );
}
export function Teams({
  boss,
  guide,
}: {
  boss: UltraBoss;
  guide?: UltraGuideContent | null;
}) {
  if (boss.slug === "darkon-the-conductor") return null;
  return (
    <section
      className="ultra-section ultra-reveal"
      aria-labelledby="teams-title"
    >
      <h2 id="teams-title">Đội hình đề xuất</h2>
      {boss.recommendedTeams.length ? (
        <>
          <p className="ultra-section-lead">
            Gợi ý từ cộng đồng. Chọn đội hình phù hợp rồi thống nhất nhiệm vụ
            trước trận.
          </p>
          {boss.slug === "ultra-speaker" ? null : guide?.teamSetup.length ? (
            <details className="ultra-team-setup">
              <summary>Chuẩn bị và phân công chung</summary>
              <RichContent blocks={guide.teamSetup} />
            </details>
          ) : null}
          <div className="ultra-teams" data-ui="ultra-codex">
            {boss.recommendedTeams.map((t) => (
              <Team key={t.id} team={t} guide={guide} slug={boss.slug} />
            ))}
          </div>
        </>
      ) : (
        <p className="ultra-empty">
          Đội hình và phân công đang được biên soạn. Chưa có đề xuất hoàn chỉnh
          cho hồ sơ này.
        </p>
      )}
    </section>
  );
}

export function TeamNotes({ slug, teamId }: { slug: string; teamId: string }) {
  const notes =
    (teamUi as unknown as Record<string, Record<string, { notes: string[] }>>)[
      slug
    ]?.[teamId]?.notes || [];
  if (!notes.length) return null;
  const rows = (
    <ul>
      {notes.map((n, i) => (
        <li key={i}>
          <Crosshair size={15} />
          <span>{n}</span>
        </li>
      ))}
    </ul>
  );
  return notes.length > 3 || notes.some((n) => n.length > 180) ? (
    <details className="team-general-notes">
      <summary>Lưu ý</summary>
      {rows}
    </details>
  ) : (
    <section className="team-general-notes">
      <h4>Lưu ý</h4>
      {rows}
    </section>
  );
}
