import {monsterDisplayName} from '../../lib/boss-names';
import {
  ChevronDown,
  Clock3,
  HeartPulse,
  Shield,
  Swords,
  Zap,
} from "lucide-react";
import type { KeyboardEvent } from "react";
import { useId, useState } from "react";
import data from "../../content/ultra/inspection.json";
import recovery from "../../content/ultra/recovery.json";
import type {
  EncounterInspection,
  EncounterMonster,
  EncounterSkill,
  EncounterPassive,
} from "../../types/ultra";
import { detailFor, QuickNotes } from "./BossTactics";
import { PassivePanel } from "./PassivePanel";
import { MonsterPortrait } from "./MonsterPortrait";
import { AttackDamageTable } from "./AttackDamageTable";

import {
  phaseSystemFor,
  encounterForPhase,
  type BossPhase,
} from "../../lib/boss-phases";
import {
  useBossPhase,
  BossPhaseSelector,
  PhaseStrategy,
  BossGlobalTimeline,
} from "./BossPhaseInspection";
import "../../styles/ultra/phases.css";

export const inspectionFor = (slug: string) =>
  (
    ({ ...data, ...recovery.inspection }) as unknown as Record<
      string,
      EncounterInspection
    >
  )[slug];

function MonsterStatuses({
  encounter,
  phase,
}: {
  encounter: EncounterInspection;
  phase?: BossPhase;
}) {
  return (
    <section className="enemy-status" aria-labelledby="enemy-status-title">
      <header className="enemy-section-heading">
        <div>
          <h3 id="enemy-status-title">Thông số Monster</h3>
        </div>
      </header>
      <div className="enemy-status-grid">
        {encounter.monsters.map((monster: EncounterMonster) => (
          <article
            className={`enemy-status-card ${monster.id === "boss" ? "is-primary" : ""}`}
            key={monster.id}
          >
            <div className="monster-status-portrait">
              <MonsterPortrait
                source={monster.source}
                name={monsterDisplayName(monster)}
              />
            </div>
            <div className="enemy-status-card-heading">
              <div>
                <small>{monster.role.split(" · ")[0]}</small>
                <h4>{monsterDisplayName(monster)}</h4>
              </div>
              {monster.count > 1 && (
                <span className="enemy-count">×{monster.count}</span>
              )}
            </div>
            <dl>
              <div>
                <dt>Level</dt>
                <dd>{monster.level ?? "—"}</dd>
              </div>
              <div>
                <dt>Tổng HP</dt>
                <dd>
                  {monster.maxHp == null
                    ? "Đang đối chiếu"
                    : monster.maxHp.toLocaleString("vi-VN")}
                </dd>
              </div>
            </dl>
            {phase && (
              <>
                <dl>
                  <div>
                    <dt>Current Phase</dt>
                    <dd>
                      {phase.name === phase.officialState
                        ? phase.name
                        : `${phase.name} · ${phase.officialState}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Damage Type</dt>
                    <dd>
                      {[
                        ...new Set(
                          encounter.activeSkills
                            .map((s) => s.damageType)
                            .filter(Boolean),
                        ),
                      ].join(" · ")}
                    </dd>
                  </div>
                </dl>
                <div className="phase-stat-modifiers">
                  {phase.phaseModifiers.map((m) => (
                    <p key={m.id}>
                      <strong>{m.name}</strong> · {m.effect}{" "}
                      <small>{m.condition}</small>
                    </p>
                  ))}
                </div>
              </>
            )}
            <AttackDamageTable encounter={encounter} monster={monster} />
          </article>
        ))}
      </div>
    </section>
  );
}

function InspectionSkill({
  skill,
  monsterName,
  passive = false,
}: {
  skill: EncounterSkill | EncounterPassive;
  monsterName: string;
  passive?: boolean;
}) {
  const s = skill as EncounterSkill;
  const p = skill as EncounterPassive;
  const title = passive ? p.name || p.label : s.name;
  const summaryBits = passive
    ? [p.condition]
    : [s.type, s.cooldown, s.damage].filter(Boolean);
  const playerEffects = passive ? [] : s.playerEffects || [];
  const bossEffects = passive ? [] : s.bossEffects || [];
  return (
    <details
      className={`enemy-skill-entry ${passive ? "is-passive" : "is-active"}`}
    >
      <summary>
        <span className="enemy-skill-mark" aria-hidden="true">
          {passive ? <Shield size={18} /> : <Swords size={18} />}
        </span>
        <span className="enemy-skill-heading">
          <small>
            {monsterName}
            {!passive && s.phase ? ` · ${s.phase}` : ""} ·{" "}
            {passive ? p.label : s.type || "Active Skill"}
          </small>
          <strong>{title}</strong>
          <span>{summaryBits.join(" · ")}</span>
        </span>
        <ChevronDown
          className="enemy-skill-chevron"
          size={18}
          aria-hidden="true"
        />
      </summary>
      <div className="enemy-skill-detail">
        {passive ? (
          <dl className="enemy-skill-fields">
            <div>
              <dt>Điều kiện</dt>
              <dd>{p.condition}</dd>
            </div>
            <div>
              <dt>Tác dụng</dt>
              <dd>{p.effect}</dd>
            </div>
            {!!p.values?.length && (
              <div className="is-wide">
                <dt>Giá trị</dt>
                <dd>
                  {p.values.map((v) => (
                    <span className="enemy-value" key={v}>
                      {v}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <dl className="enemy-skill-fields">
            {!!s.activation && (
              <div>
                <dt>Kích hoạt</dt>
                <dd>{s.activation}</dd>
              </div>
            )}
            <div>
              <dt>Cooldown</dt>
              <dd>
                {s.cooldown ||
                  "Theo điều kiện kích hoạt; chưa công bố cooldown riêng"}
              </dd>
            </div>
            {!!s.damageType && (
              <div>
                <dt>Sát thương</dt>
                <dd>
                  {s.damage || "Chưa công bố lượng sát thương"}
                  {s.damageType ? ` · ${s.damageType}` : ""}
                </dd>
              </div>
            )}
            {!!s.targets && (
              <div>
                <dt>Mục tiêu</dt>
                <dd>{s.targets}</dd>
              </div>
            )}
            {!!playerEffects.length && (
              <div className="is-wide">
                <dt>Ảnh hưởng lên người chơi</dt>
                <dd>
                  {playerEffects.map((effect) => (
                    <span className="enemy-effect" key={effect}>
                      {effect}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {!!bossEffects.length && (
              <div className="is-wide">
                <dt>Ảnh hưởng lên Monster</dt>
                <dd>
                  {bossEffects.map((effect) => (
                    <span className="enemy-effect" key={effect}>
                      {effect}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {!!s.phaseEffects?.length && (
              <div className="is-wide">
                <dt>Hiệu ứng theo phase</dt>
                <dd>
                  {s.phaseEffects.map((effect) => (
                    <div className="enemy-phase-effect" key={effect.phase}>
                      <strong>{effect.phase}</strong>
                      {effect.playerEffects.map((text) => (
                        <span className="enemy-effect" key={text}>
                          {text}
                        </span>
                      ))}
                    </div>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </details>
  );
}

export function EnemyInspection({ slug, encounter: supplied }: { slug: string; encounter?:EncounterInspection }) {
  const baseEncounter = supplied || inspectionFor(slug);
  const { phaseId, selectPhase } = useBossPhase();
  const system = supplied ? undefined : phaseSystemFor(slug);
  const phase =
    system?.phases.find((p) => p.id === phaseId) || system?.phases[0];
  const encounter =
    baseEncounter && phase && system
      ? encounterForPhase(baseEncounter, phase, system.attacks)
      : baseEncounter;
  const [tab, setTab] = useState<"active" | "passive">("active");
  const [mainTab, setMainTab] = useState<"stats" | "skills">("stats");
  const [monsterId, setMonsterId] = useState<string>("");
  const id = useId();
  if (!encounter)
    return (
      <p className="ultra-empty">
        Dữ liệu kiểm tra Monster đang được cập nhật.
      </p>
    );
  const selectedMonster =
    encounter.monsters.find((m) => m.id === monsterId) ||
    encounter.monsters.find((m) => m.id === "boss") ||
    encounter.monsters[0];
  const selectedEncounter = { ...encounter, monsters: [selectedMonster] };
  const monsterNames = new Map(
    encounter.monsters.map((m) => [m.id, monsterDisplayName(m)]),
  );
  const skills =
    tab === "active" ? encounter.activeSkills : encounter.passiveSkills;
  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    )
      return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? "active"
        : event.key === "End"
          ? "passive"
          : tab === "active"
            ? "passive"
            : "active";
    setTab(next);
    event.currentTarget
      .querySelector<HTMLButtonElement>(`#${id}-${next}-tab`)
      ?.focus();
  };
  return (
    <div className="enemy-inspection">
      {phase && system && (
        <BossPhaseSelector
          phases={system.phases}
          phase={phase}
          onChange={selectPhase}
        />
      )}
      <div className="phase-content" key={phase?.id || slug}>
        {encounter.monsters.length > 1 && (
          <div className="monster-selector" aria-label="Chọn Monster">
            {encounter.monsters.map((m) => (
              <button
                key={m.id}
                aria-pressed={m.id === selectedMonster.id}
                onClick={() => setMonsterId(m.id)}
              >
                <MonsterPortrait
                  source={m.source}
                  name={monsterDisplayName(m)}
                  compact
                />
                <span>{monsterDisplayName(m)}</span>
              </button>
            ))}
          </div>
        )}
        <div
          className="enemy-skill-tabs inspection-main-tabs"
          role="tablist"
          aria-label="Thông tin chiến đấu"
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? "stats"
                  : e.key === "End"
                    ? "skills"
                    : mainTab === "stats"
                      ? "skills"
                      : "stats";
              setMainTab(next);
              e.currentTarget
                .querySelector<HTMLButtonElement>(`[data-panel="${next}"]`)
                ?.focus();
            }
          }}
        >
          <button
            role="tab"
            data-panel="stats"
            id={`${id}-stats-tab`}
            aria-controls={`${id}-stats`}
            tabIndex={mainTab === "stats" ? 0 : -1}
            aria-selected={mainTab === "stats"}
            onClick={() => setMainTab("stats")}
          >
            THÔNG SỐ
          </button>
          <button
            role="tab"
            data-panel="skills"
            id={`${id}-skills-tab`}
            aria-controls={`${id}-skills`}
            tabIndex={mainTab === "skills" ? 0 : -1}
            aria-selected={mainTab === "skills"}
            onClick={() => {
              setMainTab("skills");
              setTab("active");
            }}
          >
            KỸ NĂNG
          </button>
        </div>
        {mainTab === "stats" ? (
          <div
            role="tabpanel"
            id={`${id}-stats`}
            aria-labelledby={`${id}-stats-tab`}
            className="enemy-skill-list"
          >
            <MonsterStatuses encounter={selectedEncounter} phase={phase} />
          </div>
        ) : (
          <section
            role="tabpanel"
            id={`${id}-skills`}
            className={`enemy-skill-section ${tab === "active" ? "active-mode" : "passive-mode"}`}
            aria-labelledby={`${id}-skills-tab`}
          >
            <h3 id="enemy-skills-title" className="sr-only">
              Kỹ năng Monster
            </h3>
            <div
              className="enemy-skill-tabs"
              role="tablist"
              aria-label="Nhóm kỹ năng Monster"
              onKeyDown={handleTabKeyDown}
            >
              <button
                role="tab"
                id={`${id}-active-tab`}
                aria-controls={`${id}-active-panel`}
                aria-selected={tab === "active"}
                tabIndex={tab === "active" ? 0 : -1}
                onClick={() => setTab("active")}
              >
                <Zap size={16} />
                ACTIVE SKILL
              </button>
              <button
                role="tab"
                id={`${id}-passive-tab`}
                aria-controls={`${id}-passive-panel`}
                aria-selected={tab === "passive"}
                tabIndex={tab === "passive" ? 0 : -1}
                onClick={() => setTab("passive")}
              >
                <Shield size={16} />
                PASSIVE SKILL
              </button>
            </div>
            <div
              role="tabpanel"
              id={`${id}-${tab}-panel`}
              aria-labelledby={`${id}-${tab}-tab`}
              className="enemy-skill-list"
              key={tab}
            >
              {selectedEncounter.monsters.map((monster) => {
                const entries = skills.filter(
                  (skill) => skill.monsterId === monster.id,
                );
                if (!entries.length) return null;
                return (
                  <section className="enemy-skill-group" key={monster.id}>
                    {encounter.monsters.length > 1 && (
                      <h4>
                        {monsterDisplayName(monster)}
                        {monster.count > 1 ? ` ×${monster.count}` : ""}
                      </h4>
                    )}
                    {tab === "passive" ? (
                      <>
                        <h4>{phase ? "Global Passive" : "Passive Skill"}</h4>
                        <PassivePanel entries={entries as EncounterPassive[]} />
                        {phase && (
                          <>
                            <h4>Phase Effects · {phase.name}</h4>
                            <PassivePanel entries={phase.phaseModifiers} />
                          </>
                        )}
                      </>
                    ) : (
                      entries.map((skill) => (
                        <InspectionSkill
                          key={skill.id}
                          skill={skill}
                          monsterName={
                            monsterNames.get(monster.id) || "Monster"
                          }
                        />
                      ))
                    )}
                  </section>
                );
              })}
              {!skills.length && (
                <p className="ultra-empty">
                  Chưa có kỹ năng được xác minh cho Monster này.
                </p>
              )}
            </div>
          </section>
        )}
        {!phase && detailFor(slug)?.notes.some((n) => n.text.trim()) && (
          <section className="enemy-notes" aria-labelledby="enemy-notes-title">
            <header>
              <HeartPulse size={18} />
              <h3 id="enemy-notes-title">Lưu ý trong trận</h3>
              <Clock3 size={15} />
            </header>
            <QuickNotes detail={detailFor(slug)} />
          </section>
        )}
      </div>
      {phase && <PhaseStrategy phase={phase} />}
      <BossGlobalTimeline slug={slug} />
    </div>
  );
}
