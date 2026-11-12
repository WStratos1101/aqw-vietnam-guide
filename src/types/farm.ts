import type { MaterialNode } from "../lib/material-requirements.mjs";
export interface FarmFact<T = string> {
  value: T;
  source: string;
}
export type FarmType = "weapon" | "armor" | "helm" | "cape" | "pet" | "class";
export interface FarmRegion {
  id: string;
  name: string;
  evidence: string[];
  mappingNote: string;
}
export interface FarmAcquisition {
  id: string;
  regionId?: string | null;
  regionEvidence?: string[];
  location?: FarmFact;
  joinCommand?: FarmFact | null;
  steps?: FarmFact[];
  method:
    | "Merge"
    | "Shop"
    | "Quest"
    | "Reputation"
    | "Drop"
    | "Craft"
    | "Other";
  description: string;
  source: string;
  materialTree?: MaterialNode;
}
export interface FarmItem {
  id: string;
  officialName: string;
  classHref?: string;
  type: FarmType;
  regionId: string | null;
  regionEvidence: string[];
  location: FarmFact;
  acquisition: FarmAcquisition[];
  sources: string[];
  verificationStatus: "verified" | "needs_review";
  retrievedAt: string;
  availability: FarmFact<
    "available" | "seasonal" | "legacy" | "rare" | "unknown"
  >;
  membership: FarmFact;
  requiredLevel: FarmFact<number> | null;
  price: FarmFact | null;
  joinCommand: FarmFact | null;
  boosts: FarmFact[];
  stability: FarmFact | null;
  prerequisites: FarmFact[];
  reviewReason: string | null;
  image: {
    path: string;
    source: string;
    assetId: string;
    credit: string;
    verificationStatus: string;
    usageStatus: string;
  } | null;
  communityEvidence: {
    url: string;
    readAt: string;
    sourceIndices: number[];
    guideHrefs: string[];
  };
}
