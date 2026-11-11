import { Clock3, HeartPulse, ChevronRight } from "lucide-react";
import type { BossPhase } from "../../lib/boss-phases";
const indicators = {
  overture: { from: 100, to: 70, next: "Recitative" },
  recitative: { from: 70, to: 20, next: "Aria" },
};
export function PhaseTransitionIndicator({
  phase,
  id,
}: {
  phase: BossPhase;
  id: string;
}) {
  const hp = indicators[phase.id as keyof typeof indicators];
  return (
    <div
      className="boss-phase-transition phase-transition-status"
      id={id}
      data-phase-indicator={phase.id}
    >
      <div className="phase-status-heading">
        <strong>{phase.name}</strong>
        <small>Minh họa · chọn phase thủ công</small>
      </div>
      {hp ? (
        <>
          <div
            className="phase-hp-track"
            aria-label={`${hp.from}% đến ${hp.to}% HP`}
          >
            <span>{hp.from}%</span>
            <div>
              <i style={{ width: hp.to + "%" }} data-hp-marker={hp.to} />
            </div>
            <b>{hp.to}%</b>
          </div>
          <p>
            {hp.to}% HP <ChevronRight size={14} />
            {hp.next}
          </p>
        </>
      ) : phase.id === "madness" ? (
        <>
          <div className="phase-aria-event">
            <span>20% HP</span>
            <ChevronRight size={16} />
            <HeartPulse size={22} />
            <strong>ARIA</strong>
            <ChevronRight size={16} />
            <b>90% HP</b>
          </div>
          <p>Sống sót trong Aria → các buff chủ chốt hết hạn → Rush</p>
        </>
      ) : (
        <>
          <div className="phase-aria-event">
            <Clock3 size={22} />
            <span>Aria Buffs Expire</span>
            <ChevronRight size={16} />
            <strong>RUSH</strong>
          </div>
          <p>Kết thúc trận trước Curtain Call · không có ngưỡng HP riêng</p>
        </>
      )}
      <details>
        <summary>Điều kiện chuyển phase</summary>
        <p>{phase.trigger}</p>
        <p>{phase.exitCondition}</p>
      </details>
    </div>
  );
}
