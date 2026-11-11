import {
  Shield,
  Swords,
  HeartPulse,
  HandHelping,
  Wheat,
  Compass,
  BookOpen,
  Crosshair,
} from "lucide-react";
const icons = {
  Tank: Shield,
  DPS: Swords,
  Healer: HeartPulse,
  Support: HandHelping,
  Farming: Wheat,
  Utility: Compass,
  Solo: Compass,
  PvP: Crosshair,
};
export function ClassRoles({
  roles,
  primaryOnly = false,
}: {
  roles: string[];
  primaryOnly?: boolean;
}) {
  const list = primaryOnly ? roles.slice(0, 1) : roles;
  return (
    <span className="class-role-icons">
      {list.length ? (
        list.map((r, i) => {
          const Icon = icons[r as keyof typeof icons] || BookOpen;
          return (
            <span key={r} data-primary={i === 0}>
              <Icon size={16} aria-hidden="true" />
              {r}
            </span>
          );
        })
      ) : (
        <span>
          <BookOpen size={16} aria-hidden="true" />
          Chưa phân loại
        </span>
      )}
    </span>
  );
}
