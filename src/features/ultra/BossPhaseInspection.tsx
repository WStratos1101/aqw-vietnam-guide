import { PhaseTransitionIndicator } from "./PhaseTransitionIndicator";
import { DarkonTacticalInspection } from "./DarkonTacticalInspection";
import { Clock3, Repeat2, Flame, Skull } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  useId,
  type ReactNode,
  type CSSProperties,
} from "react";
import { phaseSystemFor, type BossPhase } from "../../lib/boss-phases";
const PhaseContext = createContext({
  phaseId: "overture",
  selectPhase: (_id: string) => {},
});
export function BossPhaseProvider({ children }: { children: ReactNode }) {
  const [phaseId, selectPhase] = useState("overture");
  return (
    <PhaseContext.Provider value={{ phaseId, selectPhase }}>
      {children}
    </PhaseContext.Provider>
  );
}
export const useBossPhase = () => useContext(PhaseContext);
export function BossPhaseSelector({
  phases,
  phase,
  onChange,
}: {
  phases: BossPhase[];
  phase: BossPhase;
  onChange: (id: string) => void;
}) {
  const id = useId();
  return (
    <section className="boss-phase-control" aria-label="Boss Phase Selection">
      <div
        className="boss-phase-selector"
        role="group"
        aria-label="Chọn phase"
        style={{ "--phase-index": phase.phaseOrder - 1 } as CSSProperties}
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
            return;
          e.preventDefault();
          const index =
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? phases.length - 1
                : (phase.phaseOrder -
                    1 +
                    (e.key === "ArrowRight" ? 1 : -1) +
                    phases.length) %
                  phases.length;
          onChange(phases[index].id);
          e.currentTarget
            .querySelectorAll<HTMLButtonElement>("button")
            [index]?.focus();
        }}
      >
        {phases.map((p) => (
          <button
            type="button"
            key={p.id}
            aria-pressed={phase.id === p.id}
            aria-describedby={id}
            onClick={() => onChange(p.id)}
          >
            <span>{p.phaseOrder}</span>
            {p.name.toUpperCase()}
          </button>
        ))}
      </div>
      <PhaseTransitionIndicator phase={phase} id={id} />
    </section>
  );
}
export function PhaseStrategy({
  phase,
}: {
  phase: BossPhase;
  compact?: boolean;
  teamId?: string;
}) {
  return <DarkonTacticalInspection phase={phase} />;
}

export function BossGlobalTimeline({ slug }: { slug: string }) {
  const system = phaseSystemFor(slug);
  if (!system) return null;
  return (
    <aside
      className="boss-global-timeline tactical-encounter-timeline"
      aria-label="Encounter Timeline"
    >
      <h3>
        <Clock3 size={17} />
        Encounter Timeline
      </h3>
      <ol>
        {system.timeline.map((event, i) => {
          const Icon = [Repeat2, Flame, Skull][i];
          const name =
            system.attacks.find((a) => a.id === event.id)?.officialName ||
            event.id;
          return (
            <li key={event.id}>
              <Icon size={18} />
              <strong>{event.triggerValue}s</strong>
              <span>{name}</span>
              <button
                type="button"
                className="timeline-event-info"
                aria-label={`Chi tiết ${name}`}
                aria-describedby={`timeline-${event.id}`}
              >
                <span aria-hidden="true">i</span>
                <span role="tooltip" id={`timeline-${event.id}`}>
                  {event.description}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p>Mốc tính từ đầu trận · Tham khảo thủ công, không đồng bộ với game.</p>
    </aside>
  );
}
