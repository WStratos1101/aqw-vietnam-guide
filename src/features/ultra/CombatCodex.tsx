import { ChevronDown, ShieldAlert, Swords } from "lucide-react";
import data from "../../content/ultra/combat.json";
import type { BossCombatCodex } from "../../types/ultra";

export const combatFor = (slug: string) =>
  (data as unknown as Record<string, BossCombatCodex>)[slug];
export function SkillJournal({ codex }: { codex: BossCombatCodex }) {
  return (
    <div className="boss-skill-journal">
      <div className="boss-codex-caption">
        <Swords size={18} aria-hidden="true" />
        <span>Bộ kỹ năng</span>
        <span>{codex.mechanics.length} mục giao chiến</span>
      </div>
      {codex.mechanics.map((m, i) => (
        <details
          key={m.id}
          className={`boss-skill-entry ${m.severity}`}
          open={i === 0 || undefined}
        >
          <summary>
            <span className="boss-skill-index">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="boss-skill-title">
              <small>{m.type}</small>
              <h3>{m.name}</h3>
            </span>
            <span className="boss-skill-risk">
              {m.severity === "danger" ? (
                <ShieldAlert size={15} aria-hidden="true" />
              ) : null}
              {m.severity === "danger" ? "Cần chú ý" : "Theo dõi"}
            </span>
            <ChevronDown
              className="boss-skill-chevron"
              size={18}
              aria-hidden="true"
            />
          </summary>
          <div className="boss-skill-body">
            <dl>
              <div>
                <dt>Kích hoạt</dt>
                <dd>{m.trigger}</dd>
              </div>
              <div>
                <dt>Hiệu ứng</dt>
                <dd>{m.effect}</dd>
              </div>
              <div className="boss-skill-response">
                <dt>Cách xử lý</dt>
                <dd>{m.response}</dd>
              </div>
              {m.notes.length > 0 && (
                <div>
                  <dt>Ghi chú</dt>
                  <dd>{m.notes.join(" ")}</dd>
                </div>
              )}
            </dl>
          </div>
        </details>
      ))}
    </div>
  );
}
export function CombatStats({ codex }: { codex: BossCombatCodex }) {
  const groups = [...new Set(codex.stats.map((s) => s.group))].sort(
    (a, b) => Number(b.startsWith("Wiki")) - Number(a.startsWith("Wiki")),
  );
  return (
    <div className="boss-stat-sheet">
      <p className="boss-stat-intro">
        Chỉ số được tách theo mục tiêu. Mở “Chi tiết” để xem điều kiện, thời hạn
        và nguyên văn thông số trong guide cộng đồng.
      </p>
      {groups.map((group) => (
        <section className="boss-stat-group" key={group}>
          <h3>{group}</h3>
          <div className="boss-stat-grid">
            {codex.stats
              .filter((s) => s.group === group)
              .map((s) => (
                <div className="boss-stat-row" key={s.key}>
                  <div className="boss-stat-label">
                    <small>{s.subject}</small>
                    <strong>{s.label}</strong>
                  </div>
                  <div className="boss-stat-value">
                    {typeof s.value === "number"
                      ? s.value.toLocaleString("vi-VN")
                      : s.value}
                    {s.unit && <span>{s.unit}</span>}
                  </div>
                  {s.explanation && (
                    <details className="boss-stat-explanation">
                      <summary>Chi tiết</summary>
                      <p>{s.explanation}</p>
                    </details>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
