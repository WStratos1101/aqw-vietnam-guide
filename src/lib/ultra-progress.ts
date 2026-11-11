import type {
  EquipmentRoute,
  QuestStep,
  UltraGuideContent,
} from "../types/ultra";
export function periodFor(quest: QuestStep, date = new Date()) {
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  if (quest.repeatability === "daily") return day.toISOString().slice(0, 10);
  if (quest.repeatability === "weekly") {
    day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 2) % 7));
    return day.toISOString().slice(0, 10);
  }
  return "permanent";
}
// Friday UTC is a local planning bucket, not a claim about the server reset clock.
export const progressKey = (
  boss: string,
  route: string,
  quest: QuestStep,
  date?: Date,
) => `aqw:ultra:${boss}:${route}:${quest.id}:${periodFor(quest, date)}`;
export function completedMilestones(route: EquipmentRoute, done: Set<string>) {
  const milestones = route.quests.filter((q) => q.repeatability === "once");
  return {
    done: milestones.filter((q) => done.has(q.id)).length,
    total: milestones.length,
  };
}
export function safeBackPath(
  candidate: string | null,
  origin: string,
  knownPaths: string[],
) {
  try {
    if (!candidate) return null;
    const url = new URL(candidate, origin);
    return url.origin === origin && knownPaths.includes(url.pathname)
      ? url.pathname + url.search + url.hash
      : null;
  } catch {
    return null;
  }
}

export function isUltraGuideContent(
  value: unknown,
  bossId: string,
): value is UltraGuideContent {
  if (!value || typeof value !== "object") return false;
  const body = value as Partial<UltraGuideContent>;
  return (
    body.ultraContent === true &&
    body.bossId === bossId &&
    Array.isArray(body.mechanics) &&
    Array.isArray(body.teams) &&
    Array.isArray(body.progression) &&
    Array.isArray(body.teamSetup)
  );
}
