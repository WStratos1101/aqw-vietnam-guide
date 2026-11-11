import darkon from "../content/ultra/darkon-phases.json";
import type { EncounterInspection, EncounterSkill } from "../types/ultra";
export type BossPhase = (typeof darkon.phases)[number];
export type BossAttack = (typeof darkon.attacks)[number];
export type BossPhaseEffect = BossAttack["phaseEffects"][number];
export type BossTimelineEvent = (typeof darkon.timeline)[number];
export const phaseSystemFor = (slug: string) =>
  slug === darkon.bossId ? darkon : null;
export function encounterForPhase(
  encounter: EncounterInspection,
  phase: BossPhase,
  attacks: BossAttack[],
): EncounterInspection {
  const activeSkills: EncounterSkill[] = phase.activeSkillIds.map((id) => {
    const a = attacks.find((a) => a.id === id)!;
    const e = a.phaseEffects.find((e) => e.phaseId === phase.id);
    return {
      id: a.id,
      monsterId: "boss",
      name: a.officialName,
      type: a.damageType || "Phase / Buff",
      damageType: a.damageType || undefined,
      damage: a.baseDamage || undefined,
      cooldown: a.cooldown || undefined,
      targets: a.targetCount || undefined,
      phase: e || a.phaseIds ? phase.officialState : undefined,
      activation:
        e?.condition || a.trigger || `Trong trạng thái ${phase.officialState}.`,
      playerEffects: [...a.sharedEffects, ...(e?.playerEffects || [])],
      bossEffects: [...a.sharedBossEffects, ...(e?.bossEffects || [])],
      source: a.source,
    };
  });
  return { ...encounter, activeSkills };
}
