import { normalize } from "./search";
import type {
  AcquisitionType,
  AqwClass,
  ClassBody,
  ClassRole,
} from "../types/classes";
export interface ClassFilters {
  query: string;
  role: string;
  difficulty: string;
  acquisition: string;
}
export function filterClasses(profiles: AqwClass[], filters: ClassFilters) {
  const tokens = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  return profiles.filter(
    (c) =>
      tokens.every((t) =>
        normalize([c.name, ...c.aliases].join(" ")).includes(t),
      ) &&
      (filters.role === "all" ||
        (filters.role === "unknown"
          ? !c.role.length
          : c.role.includes(filters.role as ClassRole))) &&
      (filters.difficulty === "all" ||
        (filters.difficulty === "unknown"
          ? !c.difficulty
          : c.difficulty === filters.difficulty)) &&
      (filters.acquisition === "all" ||
        (filters.acquisition === "unknown"
          ? !c.acquisitionType.length
          : c.acquisitionType.includes(
              filters.acquisition as AcquisitionType,
            ))),
  );
}
export const classProgressKey = (id: string) => `aqw:class-obtain:v1:${id}`;
export function classProgress(ids: string[], steps: { id: string }[]) {
  const valid = new Set(steps.map((s) => s.id));
  return [...new Set(ids)].filter((id) => valid.has(id));
}
export function isClassBody(value: unknown, id: string): value is ClassBody {
  if (!value || typeof value !== "object") return false;
  const b = value as Partial<ClassBody>;
  return (
    b.classContent === true &&
    b.classId === id &&
    Array.isArray(b.skills) &&
    Array.isArray(b.obtainSteps) &&
    Array.isArray(b.combos) &&
    Array.isArray(b.obtainOverview) &&
    Array.isArray(b.notes)
  );
}
