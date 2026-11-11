import { useState } from "react";
import { Info, Crosshair, MapPin } from "lucide-react";
import {
  speakerStrategies,
  rotationPages,
  speakerAssignment,
} from "../../lib/speaker-strategies";
import { TeamAssignments } from "./TeamAssignments";
import { TeamNotes } from "./Teams";
export function TacticalBoard() {
  const [teamId, setTeamId] = useState(speakerStrategies[0].id),
    [index, setIndex] = useState(0),
    [selected, setSelected] = useState<Record<string, string>>({});
  const strategy = speakerStrategies.find((t) => t.id === teamId)!,
    pages = rotationPages(strategy.rotationSteps),
    page = pages[index] || pages[0];
  return (
    <div className="speaker-right-column">
      <section
        className="speaker-tactical-board"
        data-speaker-team={teamId}
        aria-label="Speaker Tactical Board"
      >
        <header>
          <h3>Bảng phân công chiến thuật</h3>
          <p>
            {strategy.tauntCount} người Taunt · {strategy.rotationSteps.length}{" "}
            bước
          </p>
        </header>
        <div
          className="speaker-team-selector"
          role="group"
          aria-label="Đội hình Speaker"
        >
          {speakerStrategies.map((t) => (
            <button
              type="button"
              key={t.id}
              aria-label={t.name.toUpperCase() + " · " + t.label}
              aria-pressed={teamId === t.id}
              onClick={() => {
                setTeamId(t.id);
                setIndex(0);
              }}
            >
              {t.name.toUpperCase()}
              <small>{t.label}</small>
            </button>
          ))}
        </div>
        <nav className="rotation-phase-nav" aria-label="Chọn lượt chiến thuật">
          <div className="rotation-phase-buttons">
            {pages.map((p, i) => (
              <button
                type="button"
                key={i}
                aria-pressed={index === i}
                onClick={() => setIndex(i)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label className="rotation-phase-select">
            Giai đoạn
            <select
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
            >
              {pages.map((p, i) => (
                <option value={i} key={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </nav>
        <div
          className="rotation-table"
          role="table"
          aria-label={`Rotation ${strategy.name}`}
        >
          <div className="rotation-row rotation-header" role="row">
            <span role="columnheader">Bước</span>
            <span role="columnheader">Malgor Skill</span>
            <span role="columnheader">
              <Crosshair size={12} /> Taunt
            </span>
            <span role="columnheader">
              <MapPin size={12} /> Zone
            </span>
          </div>
          <div key={teamId + "-" + index} className="rotation-page">
            {page.steps.map((s) => (
              <div
                className={
                  "rotation-step " + (s.tauntVariant ? "is-danger" : "")
                }
                key={s.stepId}
                data-step={s.order}
              >
                <div className="rotation-row" role="row">
                  <span role="cell">{String(s.order).padStart(2, "0")}</span>
                  <strong role="cell">{s.skill}</strong>
                  {(["taunt", "zone"] as const).map((key) => {
                    const a = speakerAssignment(s[key], strategy, selected);
                    return (
                      <span
                        role="cell"
                        key={key}
                        title={a.tip}
                        tabIndex={a.tip ? 0 : undefined}
                        aria-label={a.tip ? `${a.label}. ${a.tip}` : undefined}
                      >
                        {a.label}
                      </span>
                    );
                  })}
                </div>
                {s.notes && (
                  <details className="rotation-note">
                    <summary aria-label={`Ghi chú bước ${s.order}`}>
                      <Info size={13} />
                    </summary>
                    <p>{s.notes}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        className="speaker-formation"
        aria-label="Team Formation Speaker"
      >
        <TeamAssignments
          key={teamId}
          slug="ultra-speaker"
          teamId={teamId}
          selected={selected}
          onSelect={(slot, id) => setSelected((s) => ({ ...s, [slot]: id }))}
        />
        <TeamNotes slug="ultra-speaker" teamId={teamId} />
      </section>
    </div>
  );
}
