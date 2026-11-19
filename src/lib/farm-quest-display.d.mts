/**
 * TypeScript declarations for the V3 Farm quest display helper.
 *
 * Keep exported runtime functions in farm-quest-display.mjs unchanged.
 * Generic deduplication preserves the exact caller-provided FarmTask shape,
 * so callbacks on availableTasks are contextually typed under noImplicitAny.
 */
export declare function distinctMaterialQuestChoices<
  T extends { quest?: string | null }
>(tasks: readonly T[]): T[];

export type VerifiedMaterialIngredient = {
  name: string;
  quantity: number;
  source: string;
  map: string;
};

export type VerifiedMaterialQuest = {
  quest: string;
  npc: string;
  map: string;
  prerequisites: string[];
  ingredients: VerifiedMaterialIngredient[];
  quantityPerTurn: number;
  url: string;
};

export declare function verifiedMaterialQuest(
  name: string
): VerifiedMaterialQuest | null;
