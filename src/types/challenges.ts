import type{TeamClassAssignment}from'./team-assignments';
import type{RichBlock,ContentSection}from'./content';import type{EncounterInspection,EquipmentRoute}from'./ultra';
export type ChallengeType='dungeon'|'arena'|'multi_boss'|'other_challenge';
export interface ChallengeSummary{id:string;name:string;type:ChallengeType;href:string;bodyUrl:string;map:string|null;levelRequirement:number|null;partySize:number|null;description:string;image:string|null;stageCount:number;rewardSummary:string;sources:string[];unlockRequirements:string[]}
export interface ChallengeStage{id:string;order:number;name:string;stageType:string;encounter:EncounterInspection|null;objectives:string[];mechanics:string[];strategy:string[];sourceBlocks:RichBlock[];source:string}
export interface ChallengeEncounter extends ChallengeSummary{challengeContent:true;stages:ChallengeStage[];teams:RichBlock[];recommendedTeams?:{id:string;name:string;assignments:TeamClassAssignment[];source:string}[];equipmentRoutes:EquipmentRoute[];progression:ContentSection[];progressionRelation?:{branches:string[];unlocks:string;parallel:boolean}}
