import { UserRound, Users, Skull, GitBranch } from "lucide-react";
import { targetEffects } from "../../lib/class-ui-v12-8.mjs";
import type { ClassSkill } from "../../types/classes";
export function TargetEffects({ skill }: { skill: ClassSkill }) {
  if (skill.noAdditionalEffects)
    return (
      <div className="target-effect-list">
        <p>Không có hiệu ứng</p>
      </div>
    );
  if (Array.isArray(skill.effects) && !skill.effects.length)
    return (
      <div className="target-effect-list">
        <p>Hiệu ứng: Chưa xác minh.</p>
      </div>
    );
  return (
    <div className="target-effect-list">
      {targetEffects(skill).map((effect, i) => (
        <article className="target-effect-row" key={i}>
          <div className="target-effect-labels">
            {effect.targets.length ? (
              effect.targets.map((t) => {
                const Icon =
                  t === "SELF" ? UserRound : t === "ALLY" ? Users : Skull;
                return (
                  <span
                    className={"target-badge target-" + t.toLowerCase()}
                    key={t}
                  >
                    <Icon size={13} />
                    {t}
                  </span>
                );
              })
            ) : (
              <span className="target-badge">
                <GitBranch size={13} />
                {/^(?:Note:|Lưu ý|Nếu|Khi)/i.test(effect.text)
                  ? "ĐIỀU KIỆN"
                  : "HIỆU ỨNG"}
              </span>
            )}
          </div>
          <div>
            {effect.name && <strong>{effect.name}</strong>}
            <p>{effect.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
