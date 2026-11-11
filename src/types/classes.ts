import type { ContentSection, RichBlock } from "./content";
export type ClassRole =
  | "DPS"
  | "Tank"
  | "Support"
  | "Healer"
  | "Solo"
  | "Farming"
  | "PvP"
  | "Utility";
export type AcquisitionType =
  | "free"
  | "reputation"
  | "questline"
  | "member"
  | "seasonal"
  | "token"
  | "ac-shop";
export interface ClassSource {
  id: string;
  title: string;
  url: string;
  type: "official" | "wiki" | "community-guide";
  verifiedAt: string;
  verification: "checked" | "community";
}
export interface SkillAsset {
  id: string;
  classId: string;
  skillId: string;
  imagePath: string;
  width: number;
  height: number;
  sourceUrl: string;
  verificationStatus: "verified";
  usageStatus: "approved_noncommercial";
}
export interface ClassSkill {
  rangeCategory?:"Close"|"Medium"|"Long"|"Infinite"|null;
  targetCount?:number|null;
  rankRequired?:number|null;
  cooldownSeconds?:number|null;
  skillType?:string;
  effects?:{targets:string[];text:string;name?:string}[];
  effectsVerificationStatus?:string;
  noAdditionalEffects?:boolean;
  damageDisplay?:string;
  healingDisplay?:string;
  classId?: string;
  supplemental?: boolean;
  quarantined?: boolean;
  officialName?: string;
  rankRequirement?: number | null;
  iconAssetId?: string;
  iconAsset?: SkillAsset;
  target?: string;
  damage?: string;
  healing?: string;
  replacesSkillId?: string;
  sourceUrl?: string;
  officialDescription?: string;
  wikiNotes?: string[];
  verificationStatus?: string;
  id: string;
  skillNumber?: number;
  rank?: number;
  name: string;
  icon?: string;
  cooldown?: number;
  manaCost?: number;
  manaCostDisplay?: string;
  cooldownDisplay?: string;
  effectType: string;
  description: string;
  usageNotes: string[];
  source: string;
  passive?: boolean;
}
export interface ObtainStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  map?: string;
  location?: string;
  materials?: string[];
  materialTree?: import("../lib/material-requirements.mjs").MaterialNode;
  npc?: string;
  joinCommand?: string;
  requirement: string[];
  reward: string;
  repeatable: boolean;
  source: string;
  dependencies: string[];
  details?: RichBlock[];
}
export interface ClassCombo {
  verificationStatus?: string;
  verificationNote?: string;
  id: string;
  title: string;
  situation: string;
  sequence: number[];
  explanation: string;
  notes: string[];
  source: string;
}
export interface AqwClass {
  id: string;
  slug: string;
  aliases: string[];
  name: string;
  shortDescription: string;
  longDescription: string;
  image: string;
  role: ClassRole[];
  roleBasis?: string;
  playstyle: string;
  difficulty?: "Newbie" | "Midgame" | "Lategame" | "Endgame";
  difficultyStatus?: string;
  progressionTier?: "Newbie"|"Midgame"|"Lategame"|"Endgame";
  displayCategory?: string;
  difficultyBasis?: string;
  acquisitionType: AcquisitionType[];
  acquisitionSummary: string;
  strengths: string[];
  weaknesses: string[];
  skills: ClassSkill[];
  obtainSteps: ObtainStep[];
  combos: ClassCombo[];
  relatedClasses: string[];
  sources: ClassSource[];
  lastVerified: string;
  status: "Hồ sơ biên soạn" | "Đang cập nhật";
  accent: string;
  featured: boolean;
  bodyUrl: string;
  sourceGuide?: string;
  codexVersion?: string;
  skillCount?: number;
}
export interface ClassBody {
  acquisition?: import("./class-acquisition").ClassAcquisition;
  classContent: true;
  classId: string;
  skills: ClassSkill[];
  obtainSteps: ObtainStep[];
  combos: ClassCombo[];
  obtainOverview: RichBlock[];
  notes: ContentSection[];
}
