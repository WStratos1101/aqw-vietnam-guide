import type { MaterialNode } from "../lib/material-requirements.mjs";
import type { ObtainStep } from "./classes";
export interface AcquisitionPrice {
  amount: number;
  currency: string;
  sourceText: string;
}
export type AcquisitionKind =
  | "ac_purchase"
  | "gold_purchase"
  | "quest_reward"
  | "merge"
  | "shop_unlock"
  | "free"
  | "calendar_code"
  | "heromart"
  | "heropoints"
  | "other_verified";
export interface ClassAcquisitionMethod {
  acquisitionKind?: AcquisitionKind;
  purchaseKind?: "ac_purchase" | "gold_purchase" | null;
  verifiedFields?: {
    shopName: string | null;
    npc: string | null;
    map: string | null;
    currency: string | null;
    price: number | null;
    requiredQuest: string | null;
    materials: MaterialNode | null;
    prerequisites: string[];
    availability: string;
    sourceUrl: string;
    verificationStatus: string;
  };
  id: string;
  classId: string;
  type: "shop" | "quest" | "merge" | "drop" | "other";
  variantName: string;
  isAvailable: boolean | null;
  availability: "available" | "legacy" | "seasonal" | "limited" | "unknown";
  verificationStatus: "verified" | "needs_review";
  detailsStatus: "complete" | "partial";
  source: string;
  sourceHash: string;
  prerequisites: string[];
  unlockSteps?: ObtainStep[];
  unlockUseLegacyProgressKey?: boolean;
  notes: string[];
  membershipRequirement: boolean | null;
  levelRequirement: number | null;
  baseLevel: number | null;
  shop?: {
    shopName: string;
    source: string | null;
    npc: string | null;
    map: string | null;
    price: AcquisitionPrice;
  };
  quest?: {
    questId: string;
    questName: string;
    npc: string | null;
    map: string | null;
    source: string | null;
    prerequisites: string[];
    materials: MaterialNode | null;
    steps?: ObtainStep[];
    useLegacyProgressKey?: boolean;
    reward: string;
  };
  merge?: {
    mergeShop: string;
    source: string | null;
    npc: string | null;
    map: string | null;
    materials: MaterialNode | null;
    rawMaterials: string[];
    prerequisiteItems: string[];
    requiredQuests: string[];
    dependencies?: {
      itemId: string;
      itemName: string;
      requiredQuantity: number;
      type: string;
      source: string;
      sourceHash?: string;
      verificationStatus: string;
      materials?: MaterialNode | null;
      questName?: string | null;
      locations?: string[];
      prerequisites?: string[];
    }[];
  };
  other?: { label: string; description: string };
  drop?: { from: string; source: string | null };
  evidence: {
    classPage: string;
    linkedSource?: string | null;
    priceText: string | null;
    locationText: string[];
    linkedSourceHash?: string;
    issues: string[];
  };
}
export interface ClassAcquisition {
  classId: string;
  methods: ClassAcquisitionMethod[];
  reviewStatus: "reviewed" | "partial";
  reviewedPages: string[];
  excludedSources?: { source: string; game: string; reason: string }[];
  issues: { source: string; reason: string }[];
}
