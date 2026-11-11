import { useState } from "react";
import {
  Shield,
  Heart,
  HandHelping,
  Swords,
  Crosshair,
  Wrench,
  ChevronDown,
} from "lucide-react";
import data from "../../content/ultra/team-loadouts.json";
import recovery from "../../content/ultra/recovery.json";
import ui from "../../content/ultra/team-ui.json";
import { classProfiles } from "../../content/classes";
import type {
  ClassLoadout as Choice,
  TeamClassAssignment as Assignment,
} from "../../types/team-assignments";
const roles = [
  { pattern: /taunt/i, label: "Taunter", Icon: Crosshair },
  { pattern: /heal|hồi máu/i, label: "Healer", Icon: Heart },
  { pattern: /buff|hỗ trợ|support/i, label: "Support", Icon: HandHelping },
  { pattern: /tank|đỡ đòn/i, label: "Tank", Icon: Shield },
  { pattern: /DPS|damage dealer/i, label: "DPS", Icon: Swords },
];
export function roleFor(choice: Choice) {
  const normalized = (name: string) =>
    name
      .replace(/\([^)]*\)/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const profile = classProfiles.find((p) =>
    p.name.split(" - ").some((n) => normalized(n) === normalized(choice.name)),
  );
  const resolvedRoles = choice.roles?.length
    ? choice.roles
    : profile?.role || [];
  const text = resolvedRoles.length
    ? resolvedRoles.join(" ")
    : choice.instructions
        .filter((t) => !/không.*(?:taunt|heal)/i.test(t))
        .join(" ");
  const role = roles.find((r) => r.pattern.test(text)) || {
    label: "Theo phân công",
    Icon: Wrench,
  };
  return { ...role, label: resolvedRoles.join(" · ") || role.label };
}
function Enhancement({ value }: { value: string }) {
  const parts = value.split(/\s*\+\s*/);
  let slots: string[] = [];
  if (parts.length === 4) slots = parts;
  else if (parts.length === 3 && /class\/helm/i.test(parts[1]))
    slots = [parts[0], parts[1], parts[1], parts[2]];
  return (
    <div>
      {slots.length ? (
        <dl className="loadout-slots">
          {["Weapon", "Class", "Helm", "Cape"].map((name, i) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{slots[i]}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>{value}</p>
      )}
    </div>
  );
}
export function AssignmentCard({
  assignment,
  selectedId,
  onSelect,
}: {
  assignment: Assignment;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const choices = [assignment.primaryClass, ...assignment.alternativeClasses];
  const [selected, setSelected] = useState(0);
  const c =
    choices.find((c) => c.classId === selectedId) ||
    choices[selected] ||
    choices[0];
  const { Icon, label } = roleFor(c);
  const consumables = c.instructions.filter((t) =>
    /^Potion(?:\/Scroll)?:/i.test(t),
  );
  const rotation = c.instructions.filter(
    (t) => !/^Potion(?:\/Scroll)?:/i.test(t),
  );
  return (
    <article className="team-role-card">
      <small>
        {c.classId === assignment.primaryClass.classId
          ? "CLASS CHÍNH"
          : "CLASS THAY THẾ"}
      </small>
      <details key={c.classId}>
        <summary>
          <Icon size={20} aria-hidden="true" />
          <span>
            <strong>{c.name}</strong>
            <small>
              {c.abbreviation} · {label}
            </small>
          </span>
          <ChevronDown size={16} />
        </summary>
        <div className="team-loadout">
          <h5>Enhancement</h5>
          {c.enhancement.length ? (
            c.enhancement.map((e, i) => <Enhancement key={i} value={e} />)
          ) : (
            <p>Đang cập nhật</p>
          )}
          <h5>Rotation & nhiệm vụ trong đội</h5>
          {rotation.length ? (
            rotation.map((line, i) => (
              <p key={i}>{line.replace(/^→\s*/, "")}</p>
            ))
          ) : (
            <p>Đang cập nhật cấu hình riêng cho lựa chọn này.</p>
          )}
          {consumables.length > 0 && (
            <>
              <h5>Consumables</h5>
              {consumables.map((t) => (
                <p key={t}>{t.replace(/^Potion(?:\/Scroll)?:\s*/i, "")}</p>
              ))}
            </>
          )}
        </div>
      </details>
      {choices.length > 1 && (
        <div
          className="team-slot-alternatives"
          role="group"
          aria-label={`Class thay thế ${assignment.id}`}
        >
          <span>Thay thế:</span>
          {choices.map((option, i) => (
            <button
              type="button"
              key={option.classId}
              title={option.name}
              aria-label={option.name}
              aria-pressed={c.classId === option.classId}
              onClick={() => {
                setSelected(i);
                onSelect?.(option.classId);
              }}
            >
              {option.abbreviation || option.name}
              {i === 0 ? " · chính" : ""}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
export function TeamAssignments({
  slug,
  teamId,
  selected = {},
  onSelect,
}: {
  slug: string;
  teamId: string;
  selected?: Record<string, string>;
  onSelect?: (slot: string, classId: string) => void;
}) {
  return (
    <div className="team-assignment-list">
      {assignmentsFor(slug, teamId).map((a) => (
        <AssignmentCard
          key={a.id}
          assignment={a}
          selectedId={selected[a.id]}
          onSelect={(id) => onSelect?.(a.id, id)}
        />
      ))}
    </div>
  );
}
export function TeamRoleSummary({
  slug,
  teamId,
  selected = {},
}: {
  slug: string;
  teamId: string;
  selected?: Record<string, string>;
}) {
  return (
    <span className="ultra-team-icons">
      {assignmentsFor(slug, teamId).map((a) => {
        const choices = [a.primaryClass, ...a.alternativeClasses];
        const current =
          choices.find((c) => c.classId === selected[a.id]) || a.primaryClass;
        const alternatives = choices.filter(
          (c) => c.classId !== current.classId,
        );
        const { Icon, label } = roleFor(current);
        return (
          <span key={a.id} title={label}>
            <Icon size={16} />
            <span>
              {current.name} <small>· {label}</small>
              {alternatives.length > 0 && (
                <small className="team-alt-summary">
                  Thay thế:{" "}
                  {alternatives
                    .map((c) => c.abbreviation || c.name)
                    .join(" · ")}
                </small>
              )}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function assignmentsFor(slug: string, teamId: string): Assignment[] {
  const encounters = {
    ...data.encounters,
    ...recovery.teamLoadouts,
  } as unknown as Record<string, Record<string, Assignment[]>>;
  const model = (
    ui as unknown as Record<
      string,
      Record<
        string,
        {
          edits: Record<
            string,
            { added: string[]; removed: string[]; enh: string[] }
          >;
        }
      >
    >
  )[slug]?.[teamId];
  const decorate = (c: Choice) => {
    const e = model?.edits[c.classId];
    return e
      ? {
          ...c,
          instructions: [
            ...c.instructions.filter((t) => !e.removed.includes(t)),
            ...e.added,
          ],
          enhancement: [...c.enhancement, ...e.enh],
        }
      : c;
  };
  return (encounters[slug]?.[teamId] || []).map((s) => ({
    ...s,
    primaryClass: decorate(s.primaryClass),
    alternativeClasses: s.alternativeClasses.map(decorate),
  }));
}
