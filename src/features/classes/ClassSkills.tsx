import { TargetEffects } from "./TargetEffects";
import { useId, useState, type KeyboardEvent } from "react";
import type { ClassSkill } from "../../types/classes";
import { SkillIcon } from "./SkillIcon";
export const skillGroup = (s: ClassSkill) => (s.passive ? "passive" : "active");
export function ClassSkills({
  skills,
  selectedSkillId,
  onSelect,
}: {
  skills: ClassSkill[];
  selectedSkillId?: string;
  onSelect?: (id: string) => void;
}) {
  const [localId, setLocalId] = useState(skills[0]?.id || "");
  const [group, setGroup] = useState("active");
  const id = useId();
  const requested = skills.find((s) => s.id === (selectedSkillId || localId));
  const effectiveGroup = requested ? skillGroup(requested) : group;
  const entries = skills.filter((s) => skillGroup(s) === effectiveGroup);
  const selected = requested || entries[0];
  const select = (s: ClassSkill) => {
    setLocalId(s.id);
    onSelect?.(s.id);
    setGroup(skillGroup(s));
  };
  const groups = [
    { id: "active", name: "Active Skills" },
    { id: "passive", name: "Passive / Rank Passive" },
  ].filter((g) => skills.some((s) => skillGroup(s) === g.id));
  const slots = new Map<string, ClassSkill[]>();
  for (const s of entries) {
    const key = s.passive
      ? s.id
      : s.skillNumber == null
        ? s.id
        : "slot-" + s.skillNumber;
    slots.set(key, [...(slots.get(key) || []), s]);
  }
  const visible = [...slots.values()].map(
    (v) => v.find((s) => s.id === selected?.id) || v[0],
  );
  const keyNav = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const current = visible.findIndex((s) => s.id === selected?.id);
    const index =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? visible.length - 1
          : (current + (e.key === "ArrowRight" ? 1 : -1) + visible.length) %
            visible.length;
    select(visible[index]);
    e.currentTarget
      .querySelectorAll<HTMLButtonElement>("button")
      [index]?.focus();
  };
  return (
    <section
      className="class-section ability-inspection"
      id="bo-skill"
      aria-labelledby="skill-title"
    >
      <div className="class-section-title">
        <h2 id="skill-title" tabIndex={-1}>
          Bộ skill
        </h2>
      </div>
      {!selected ? (
        <p className="class-empty">Kỹ năng: Chưa xác minh.</p>
      ) : (
        <div className="ability-workbench" data-ui="class-codex">
          <div
            className="ability-groups"
            role="group"
            aria-label="Nhóm kỹ năng"
          >
            {groups.map((g) => (
              <button
                key={g.id}
                aria-pressed={effectiveGroup === g.id}
                onClick={() => {
                  setGroup(g.id);
                  select(skills.find((s) => skillGroup(s) === g.id)!);
                }}
              >
                {g.name}
                <span>
                  {skills.filter((s) => skillGroup(s) === g.id).length}
                </span>
              </button>
            ))}
          </div>
          <div
            className="ability-bar"
            role="tablist"
            aria-label="Chọn kỹ năng Class"
            onKeyDown={keyNav}
          >
            {visible.map((s) => (
              <button
                className="ability-slot"
                key={s.id}
                role="tab"
                id={`${id}-${s.id}`}
                aria-selected={s.id === selected.id}
                aria-controls={`${id}-panel`}
                tabIndex={s.id === selected.id ? 0 : -1}
                aria-label={s.name}
                onClick={() => select(s)}
              >
                <SkillIcon key={s.id} skill={s} />
                <span className="ability-key">
                  {s.passive
                    ? (s.rankRequirement ?? s.rank ?? 0) >= 10
                      ? "P10"
                      : "P"
                    : (s.skillNumber ?? "—")}
                </span>
                <span className="ability-slot-name">{s.name}</span>
              </button>
            ))}
          </div>
          <div
            className="ability-detail"
            role="tabpanel"
            tabIndex={0}
            id={`${id}-panel`}
            aria-labelledby={`${id}-${selected.id}`}
            key={selected.id}
            data-selected-skill={selected.id}
          >
            <header>
              <SkillIcon key={selected.id} skill={selected} eager />
              <div>
                <p>
                  {selected.passive
                    ? (selected.rankRequirement ?? selected.rank ?? 0) >= 10
                      ? "Rank Passive"
                      : "Passive Ability"
                    : selected.effectType}
                </p>
                <h3>{selected.name}</h3>
              </div>
            </header>
            {entries.filter(
              (s) =>
                s.skillNumber != null && s.skillNumber === selected.skillNumber,
            ).length > 1 && (
              <label className="ability-variant">
                Biến thể cùng slot
                <select
                  value={selected.id}
                  onChange={(e) =>
                    select(skills.find((s) => s.id === e.target.value)!)
                  }
                >
                  {entries
                    .filter((s) => s.skillNumber === selected.skillNumber)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {selected.passive ? (
              <div className="passive-unlock">
                <small>MỞ KHÓA</small>
                <strong>
                  Rank{" "}
                  {selected.rankRequired ??
                    selected.rankRequirement ??
                    selected.rank ??
                    "—"}
                </strong>
              </div>
            ) : (
              <dl className="ability-stats active-stats">
                <div>
                  <dt>Mana</dt>
                  <dd>
                    {selected.manaCostDisplay ??
                      (selected.manaCost == null
                        ? "—"
                        : selected.manaCost + " Mana")}
                  </dd>
                </div>
                <div>
                  <dt>Cooldown</dt>
                  <dd>
                    {selected.cooldownDisplay ??
                      (selected.cooldownSeconds == null
                        ? "—"
                        : selected.cooldownSeconds + "s")}
                  </dd>
                </div>
                <div>
                  <dt>Rank</dt>
                  <dd>
                    {selected.rankRequired ??
                      selected.rankRequirement ??
                      selected.rank ??
                      "—"}
                  </dd>
                </div>
                <div>
                  <dt>Range</dt>
                  <dd>{selected.rangeCategory ?? "—"}</dd>
                </div>
                <div>
                  <dt>Target</dt>
                  <dd>{selected.targetCount ?? "—"}</dd>
                </div>
              </dl>
            )}
            <h4 className="effects-heading">HIỆU ỨNG</h4>
            <TargetEffects skill={selected} />
            {!selected.passive &&
              (selected.damageDisplay || selected.healingDisplay) && (
                <dl className="ability-stats">
                  <div>
                    <dt>Damage / Healing</dt>
                    <dd>
                      {[selected.damageDisplay, selected.healingDisplay]
                        .filter(Boolean)
                        .join(" · ")}
                    </dd>
                  </div>
                </dl>
              )}
            {selected.replacesSkillId && (
              <p>
                Thay thế kỹ năng:{" "}
                {skills.find((s) => s.id === selected.replacesSkillId)?.name ||
                  selected.replacesSkillId}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
