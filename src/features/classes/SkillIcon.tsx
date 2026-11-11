import { useState } from "react";
import type { ClassSkill } from "../../types/classes";
export function SkillIcon({
  skill,
  eager = false,
}: {
  skill: ClassSkill;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const a = skill.iconAsset;
  const usable =
    a?.verificationStatus === "verified" &&
    a.usageStatus === "approved_noncommercial" &&
    a.skillId === skill.id &&
    a.classId === skill.classId;
  return (
    <span className="ability-icon" data-skill-id={skill.id}>
      {usable && !failed ? (
        <img
          key={a.imagePath}
          src={a.imagePath}
          alt={skill.name}
          width={a.width}
          height={a.height}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="ability-icon-pending"
          role="img"
          aria-label={`${skill.name}: icon chưa xác minh`}
        >
          ?
        </span>
      )}
    </span>
  );
}
