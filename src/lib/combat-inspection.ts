import type {
  EncounterSkill,
  EncounterMonster,
  EncounterPassive,
  BossNote,
} from "../types/ultra";
export type MonsterBaseStats = Pick<
  EncounterMonster,
  "id" | "canonicalName" | "level" | "maxHp"
>;
export type BossPassive = EncounterPassive;
export interface AttackDamage {
  phase?: string;
  skillId: string;
  officialSkillName: string;
  damageType: string | null;
  minDamage: number | null;
  maxDamage: number | null;
  damageFormula: string | null;
  displayDamage: string;
  source: string;
}
export interface CombatNote {
  id: string;
  icon: string;
  shortText: string;
  severity: string;
  source: string;
  relatedSkillId?: string;
}
export function attackDamageFor(
  skills: EncounterSkill[],
  monsterId: string,
): AttackDamage[] {
  const scalar = /^[\d.,]+(?:[–−-][\d.,]+)?$/;
  return skills
    .map((s) =>
      s.damage ? { ...s, damage: s.damage.replace(/\s*([–−-])\s*/g, "$1") } : s,
    )
    .filter(
      (s) =>
        s.monsterId === monsterId &&
        s.damage &&
        (s.damageFormat === "conditional" ||
          scalar.test(s.damage) ||
          /HP (?:hiện tại|tối đa)/.test(s.damage) ||
          /^\d+ \((?:before Crit Damage modifiers|trước hệ số sát thương chí mạng)\)$/.test(
            s.damage,
          ) ||
          /^(Instant Death|Death)$/.test(s.damage)),
    )
    .flatMap((s) => {
      const displayDamage = s.damage!;
      const numbers = scalar.test(displayDamage)
        ? displayDamage
            .split(/[–−-]/)
            .map((v) => Number(v.replace(/[.,]/g, "")))
        : [];
      return s.name
        .split(" / ")
        .map((name) => ({
          phase: s.phase,
          skillId: s.id,
          officialSkillName: name.split(" → ").at(-1)!,
          damageType: s.damageType || null,
          minDamage: numbers[0] ?? null,
          maxDamage: numbers.at(-1) ?? null,
          damageFormula: numbers.length ? null : displayDamage,
          displayDamage,
          source: s.source,
        }));
    });
}
export function combatNoteText(text: string): string {
  return text
    .replace(
      /^(?:Wiki ghi|Theo Wiki|Wiki cho biết|Nguồn ghi rằng|Theo dữ liệu|Đối chiếu Wiki)[,:\s]*/i,
      "",
    )
    .replace(/^Guide cộng đồng ưu tiên /, "Ưu tiên ")
    .replace(
      /^đòn này bỏ qua Focus; ưu tiên giữ nhịp hồi phục\.$/i,
      "Bỏ qua Focus; duy trì hồi máu.",
    );
}
export function combatNotesFor(notes: BossNote[]): CombatNote[] {
  return notes
    .map((n) => ({
      id: n.id,
      icon: n.icon,
      shortText: combatNoteText(n.text),
      severity: n.severity,
      source: n.source,
    }))
    .filter(
      (n, i, all) =>
        n.shortText.trim() &&
        all.findIndex((o) => o.shortText === n.shortText) === i,
    );
}
