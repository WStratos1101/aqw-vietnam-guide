import { useState } from "react";
import {
  Compass,
  Crosshair,
  Shield,
  AlertTriangle,
  Repeat2,
  Swords,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import type { BossPhase } from "../../lib/boss-phases";
import { findBoss } from "../../content/ultra";
import { classProfiles } from "../../content/classes";
import type { AqwClass, ClassSkill } from "../../types/classes";
import type { ClassLoadout } from "../../types/team-assignments";
import { assignmentsFor, roleFor } from "./TeamAssignments";
import { useClassBody } from "../classes/useClassBody";
import { SkillIcon } from "../classes/SkillIcon";
import "../../styles/ultra/tactical-v12-4.css";
const normalized = (s: string) =>
  s
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]/g, "");
export function profileForTacticalClass(name: string) {
  return classProfiles.find((c) =>
    [...c.name.split(" - "), ...c.aliases].some(
      (n) => normalized(n) === normalized(name),
    ),
  );
}
function ResolvedRotation({
  profile,
  sequence,
}: {
  profile: AqwClass;
  sequence: string[];
}) {
  const { body } = useClassBody(profile);
  const [selected, setSelected] = useState<ClassSkill>();
  return (
    <>
      <ol
        className="tactical-rotation-sequence"
        aria-label="Rotation theo phase"
      >
        {sequence.map((n, i) => {
          const matches =
            body?.skills.filter(
              (s) =>
                !s.passive && !s.quarantined && s.skillNumber === Number(n),
            ) || [];
          const skill = matches.length === 1 ? matches[0] : null;
          return (
            <li key={i}>
              {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
              <button
                type="button"
                disabled={!skill}
                aria-label={
                  skill ? `Xem ${skill.name}` : `Slot ${n}: chưa đối chiếu icon`
                }
                onClick={() => skill && setSelected(skill)}
              >
                {skill ? (
                  <SkillIcon key={skill.id} skill={skill} />
                ) : (
                  <span className="tactical-slot-pending">{n}</span>
                )}
                <span>{n}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {selected && (
        <div className="tactical-skill-preview">
          <strong>{selected.name}</strong>
          <p>{selected.description}</p>
        </div>
      )}
      <a href={"/class/" + profile.slug} className="tactical-source">
        Mở Class Codex <ArrowUpRight size={13} />
      </a>
    </>
  );
}
function Rotation({
  choice,
  phase,
  teamId,
}: {
  choice: ClassLoadout;
  phase: BossPhase;
  teamId: string;
}) {
  const rotation = phase.recommendedRotations.find(
    (r) =>
      r.teamIds.includes(teamId) &&
      r.className
        .split(" / ")
        .some((n) => normalized(n) === normalized(choice.name)),
  );
  const profile = profileForTacticalClass(choice.name);
  return (
    <section
      className="tactical-class-inspection"
      aria-label="Class Rotation theo phase"
    >
      <header>
        <div>
          <span>Nhiệm vụ · {phase.name}</span>
          <h4>{choice.name}</h4>
        </div>
        <Swords size={20} />
      </header>
      {rotation ? (
        <>
          <p className="tactical-assignment">{rotation.notes}</p>
          {rotation.sequence.length ? (
            profile ? (
              <ResolvedRotation
                key={choice.classId + phase.id}
                profile={profile}
                sequence={rotation.sequence}
              />
            ) : (
              <>
                <div className="tactical-rotation-fallback">
                  {rotation.sequence.join(" → ")}
                </div>
                <p className="tactical-muted">
                  Chưa có hồ sơ Class tương ứng để lấy icon; giữ slot theo hướng
                  dẫn.
                </p>
              </>
            )
          ) : (
            <p className="tactical-muted">
              Canh thời điểm theo nhiệm vụ; chưa có chuỗi phím riêng cho phase
              này.
            </p>
          )}
        </>
      ) : (
        <p>Chưa có rotation riêng cho lựa chọn này trong phase hiện tại.</p>
      )}
      {choice.enhancement.length > 0 && (
        <div className="tactical-enhancement">
          <strong>Enhancement</strong>
          {choice.enhancement.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}
    </section>
  );
}
export function DarkonTacticalInspection({ phase }: { phase: BossPhase }) {
  const boss = findBoss("darkon-the-conductor")!;
  const [teamId, setTeamId] = useState(boss.recommendedTeams[0].id);
  const [slot, setSlot] = useState(0);
  const [alternatives, setAlternatives] = useState<Record<string, string>>({});
  const [tauntMethod, setTauntMethod] = useState<"docs" | "site">("docs");
  const team =
    boss.recommendedTeams.find((t) => t.id === teamId) ||
    boss.recommendedTeams[0];
  const assignments = assignmentsFor(boss.slug, team.id);
  const activeSlot = assignments[Math.min(slot, assignments.length - 1)];
  const selected = (assignment: typeof activeSlot) =>
    [assignment.primaryClass, ...assignment.alternativeClasses].find(
      (c) => c.classId === alternatives[assignment.id],
    ) || assignment.primaryClass;
  const active = activeSlot && selected(activeSlot);
  const tauntNames = team.id.endsWith("-4")
    ? [assignments[2], assignments[3]].map((a) => selected(a).name)
    : [assignments[1], assignments[2]].map((a) => selected(a).name);
  const risk =
    phase.id === "overture"
      ? "Stun lặp và Do Dusk"
      : phase.id === "recitative"
        ? "Grown → Harvested"
        : phase.id === "madness"
          ? "Heal In −80% và người Taunt tử vong"
          : "The Last Symphony và Mana Cost tích lũy";
  return (
    <section
      className="darkon-tactical-inspection"
      aria-labelledby="darkon-tactical-title"
      data-ui="darkon-tactical"
    >
      <header className="tactical-heading">
        <h3 id="darkon-tactical-title">Tactical Inspection</h3>
        <span>
          {phase.name === phase.officialState
            ? phase.name
            : `${phase.name} · ${phase.officialState}`}
        </span>
      </header>
      <div className="tactical-layout">
        <div className="tactical-overview">
          <h4>
            <Compass size={18} />
            Tactical Overview
          </h4>
          <div className="tactical-objective">
            <strong>Phase Objective</strong>
            <p>{phase.objective}</p>
          </div>
          <section className="tactical-focus" aria-label="Focus / Taunt">
            <header>
              <h5>Focus / Taunt</h5>
              <div role="group" aria-label="Phương án Taunt">
                <button
                  aria-pressed={tauntMethod === "docs"}
                  onClick={() => setTauntMethod("docs")}
                >
                  2 người chính
                </button>
                <button
                  aria-pressed={tauntMethod === "site"}
                  onClick={() => setTauntMethod("site")}
                >
                  3 Support
                </button>
              </div>
            </header>
            <div className="tactical-focus-row">
              <Crosshair size={18} />
              <div>
                <strong>Focus</strong>
                <p>Target: Darkon. Auto Attack bỏ qua Focus.</p>
              </div>
            </div>
            <div className="tactical-focus-row">
              <Shield size={18} />
              <div>
                <strong>Taunt assignment</strong>
                {tauntMethod === "docs" ? (
                  <ul>
                    <li>{tauntNames.join(" ↔ ")} · hai người Taunt chính.</li>
                    <li>
                      Bật Class Actives/Auras UI; dùng SoE so le khi Focus còn
                      khoảng 1/8.
                    </li>
                    <li>
                      {team.id.endsWith("-4")
                        ? "Đội Speedrun: LR và LoO giữ phân công Taunt chính."
                        : "LoO có thể dự bị khi một người chính chết, đến khi họ trở lại."}
                    </li>
                    <li>DPS chính không Taunt thường quy.</li>
                  </ul>
                ) : (
                  <ul>
                    <li>LoO mở đầu và dùng Scroll of Enrage khi hồi xong.</li>
                    <li>
                      Hai Support còn lại so le khi Focus còn khoảng 1/8–1/10.
                    </li>
                    <li>
                      Nếu LoO chết hoặc Stun: hai Support bù nhịp đến khi LoO
                      trở lại.
                    </li>
                    <li>Không nhầm icon Decay của LR với Focus.</li>
                  </ul>
                )}
              </div>
            </div>
            <div className="tactical-focus-row">
              <Repeat2 size={18} />
              <div>
                <strong>Tactical Sequence</strong>
                <p>
                  {tauntMethod === "docs"
                    ? "Taunter 1 → Focus gần hết → Taunter 2 → lặp; LoO dự bị theo đội hình."
                    : "LoO → Support 2 → LoO → Support 3 → lặp."}
                </p>
              </div>
            </div>
            <div className="tactical-focus-row is-threat">
              <AlertTriangle size={18} />
              <div>
                <strong>Nguy cơ · {risk}</strong>
                <p>
                  Không để khoảng trống Focus; thay người dự bị theo phân công
                  khi người chính chết.
                </p>
              </div>
            </div>
          </section>
          <div className="tactical-mechanics">
            <h5>Important Mechanics / Phase Response</h5>
            <ul>
              {phase.combatNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <p className="tactical-warning">
              Khuyến cáo: Tránh Vainglory nếu gây bất lợi cho hồi máu trong
              Aria. Một số loadout vẫn liệt kê Vainglory; ưu tiên khả năng sống
              sót của đội.
            </p>
          </div>
        </div>
        <section className="tactical-formation" aria-label="Team Formation">
          <h4>
            <Swords size={18} />
            Team Formation
          </h4>
          <div
            className="tactical-team-selector"
            role="group"
            aria-label="Chọn đội hình Darkon"
          >
            {boss.recommendedTeams.map((t, i) => (
              <button
                key={t.id}
                aria-pressed={t.id === team.id}
                onClick={() => {
                  setTeamId(t.id);
                  setSlot(0);
                }}
              >
                Team {i + 1}
              </button>
            ))}
          </div>
          <p className="tactical-team-summary">{team.description}</p>
          <div className="tactical-formation-slots">
            {assignments.map((a, i) => {
              const c = selected(a);
              const { Icon, label } = roleFor(c);
              return (
                <div
                  className={
                    "formation-slot " + (i === slot ? "is-selected" : "")
                  }
                  key={a.id}
                >
                  <button
                    className="formation-primary"
                    aria-pressed={i === slot}
                    onClick={() => setSlot(i)}
                  >
                    <Icon size={18} />
                    <span>
                      <small>Vị trí {i + 1}</small>
                      <strong>{c.name}</strong>
                      <small>{label}</small>
                    </span>
                  </button>
                  {a.alternativeClasses.length > 0 && (
                    <div
                      className="formation-alternatives"
                      role="group"
                      aria-label={`Class thay thế vị trí ${i + 1}`}
                    >
                      <span className="formation-alternatives-label">
                        Thay thế:
                      </span>
                      {[a.primaryClass, ...a.alternativeClasses].map(
                        (option) => (
                          <button
                            key={option.classId}
                            title={option.name}
                            aria-label={option.name}
                            aria-pressed={c.classId === option.classId}
                            onClick={() => {
                              setAlternatives((prev) => ({
                                ...prev,
                                [a.id]: option.classId,
                              }));
                              setSlot(i);
                            }}
                          >
                            {option.abbreviation || option.name}
                            {option.classId === a.primaryClass.classId
                              ? " · chính"
                              : ""}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {active && (
            <Rotation choice={active} phase={phase} teamId={team.id} />
          )}
        </section>
      </div>
    </section>
  );
}
