import type { ContentSection, RichBlock } from "./content";
export interface BossSource {
  id: string;
  title: string;
  url: string;
  kind: "community" | "official";
  verified: string;
}
export interface GameAsset {
  id: string;
  name: string;
  entity: string;
  sourceUrl: string;
  credit: string;
  usageStatus: "pending" | "approved";
  usageNote: string;
  localPath?: string;
}
export interface BossMechanic {
  id: string;
  name: string;
  description: string;
  phase?: string;
  severity: "normal" | "danger";
  counterStrategy: string;
  source: string;
}
export interface BossStat {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  explanation: string;
  source: string;
}
export interface TeamClass {
  alternatives?: string[];
  className: string;
  icon: string;
  role: string;
  enhancement?: string;
  rotation?: string;
  notes: string;
}
export interface RecommendedTeam {
  guideKey?: string;
  id: string;
  title: string;
  description: string;
  classes: TeamClass[];
  strategy: string[];
  source: string;
}
export interface QuestStep {
  materialTree?: import("../lib/material-requirements.mjs").MaterialNode;
  materialScope?: string;
  id: string;
  name: string;
  requirements: string[];
  items: string[];
  reward: string;
  dependencies: string[];
  repeatability: "once" | "daily" | "weekly" | "repeatable";
  source: string;
  guide?: string;
}
export interface EquipmentRoute {
  group?: "endgame" | "empowered";
  id: string;
  canonicalId?: string;
  itemName: string;
  image?: string;
  category: string;
  note: string;
  prerequisites: string[];
  quests: QuestStep[];
  rewards: string[];
  source: string;
}
export interface UltraBoss {
  challengeCategory?: "daily" | "weekly" | "seasonal" | "other";
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  location: string;
  joinCommand: string;
  accessRequirements: string[];
  questRequirements?: string[];
  images: { portrait: string; map?: string };
  accent: string;
  status: "Đã biên soạn" | "Đang cập nhật" | "Hướng dẫn cộng đồng";
  sourceContentUrl?: string;
  stats: BossStat[];
  mechanics: BossMechanic[];
  recommendedTeams: RecommendedTeam[];
  equipmentRoutes: EquipmentRoute[];
  sources: BossSource[];
  lastVerified: string;
  relatedGuides: { title: string; url: string }[];
  rewardSummary: string;
}

export interface UltraGuideContent {
  ultraContent: true;
  bossId: string;
  sourceGuide: string;
  mechanics: ContentSection[];
  teamSetup: RichBlock[];
  teams: { id: string; title: string; blocks: RichBlock[] }[];
  progression: ContentSection[];
}

/** Normalized view model; legacy imports remain supported at the boundary. */
export interface BossSkillEntry {
  id: string;
  name: string;
  type: string;
  trigger: string;
  effect: string;
  response: string;
  severity: "normal" | "danger";
  notes: string[];
  relatedStats: string[];
  source: string;
}
export interface CombatStat extends BossStat {
  group: string;
  subject: string;
}
export interface BossCombatCodex {
  notes?: BossNote[];
  nameVerification?: {
    source: string;
    skillNames: string[];
    checkedAt: string;
  };
  mechanics: BossSkillEntry[];
  stats: CombatStat[];
  reference: ContentSection[];
}

export interface EncounterMonster {
  id: string;
  canonicalName: string;
  role: string;
  level: number | null;
  maxHp: number | null;
  count: number;
  source: string;
}

export interface EncounterSkill {
  id: string;
  monsterId: string;
  name: string;
  type?: string;
  activation?: string;
  cooldown?: string;
  damage?: string;
  damageFormat?:
    | "fixed"
    | "range"
    | "current-hp"
    | "max-hp"
    | "before-crit"
    | "conditional";
  damageType?: string;
  targets?: string;
  playerEffects?: string[];
  bossEffects?: string[];
  phase?: string;
  phaseEffects?: { phase: string; playerEffects: string[] }[];
  nextSkillId?: string;
  source: string;
}

export interface EncounterPassive {
  id: string;
  monsterId: string;
  name?: string;
  label: string;
  condition: string;
  effect: string;
  values?: string[];
  source: string;
}

export interface EncounterInspection {
  encounterTitle: string;
  locationName: string;
  monsters: EncounterMonster[];
  activeSkills: EncounterSkill[];
  passiveSkills: EncounterPassive[];
}
export interface BossNote {
  id: string;
  icon: string;
  label: string;
  text: string;
  severity: string;
  source: string;
}
export interface TauntEntry {
  id: string;
  target: string;
  timing: string;
  role: string;
  instruction: string;
  failureRisk: string;
  source: string;
}
export interface ProgressionTimelineStep {
  id: string;
  title: string;
  description: string;
  requirement: string;
  reward: string;
  source: string;
  blocks: RichBlock[];
  dependencies: string[];
}
export interface BossDetailData {
  storyDescription: string;
  storyStatus: string;
  resetInfo: { label: string; text: string; source: string };
  notes: BossNote[];
  tauntGuide: TauntEntry[];
  tauntTables?: RichBlock[];
  additionalEquipment: {
    id: string;
    canonicalId?: string;
    canonicalItemIds?: string[];
    name: string;
    description: string;
    image?: string;
    routeId?: string;
    status: string;
    source: string;
    blocks: RichBlock[];
  }[];
  progressionTimelines: {
    id: string;
    title: string;
    steps: ProgressionTimelineStep[];
    notes?: RichBlock[];
    dependencyNote: string;
    source: string;
  }[];
  sources: string[];
}
