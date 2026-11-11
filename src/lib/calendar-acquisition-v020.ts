import type { ClassAcquisitionMethod } from "../types/class-acquisition";

/* Source-backed presentation normalisation. Never changes generated acquisition JSON.
 * Semantically identical imports from different wiki location rows collapse to one tab.
 */
function materialSignature(method: ClassAcquisitionMethod): string {
  const tree = method.merge?.materials;
  return JSON.stringify(tree ?? method.merge?.rawMaterials ?? []);
}
function methodSignature(method: ClassAcquisitionMethod): string {
  return JSON.stringify({
    type: method.type,
    kind: method.acquisitionKind,
    shop: method.shop?.shopName?.trim().toLowerCase() ?? "",
    map: method.shop?.map?.trim().toLowerCase() ?? "",
    price: method.shop?.price ?? null,
    mergeShop: method.merge?.mergeShop?.trim().toLowerCase() ?? "",
    materials: materialSignature(method),
    quest: method.quest?.questName ?? "",
    conditions: [...(method.prerequisites ?? [])].map((x) => x.trim()).sort(),
  });
}

const pointsSource = "https://www.aq.com/gamedesignnotes/aqw-july8-heropointsreturn-8426";
const pointTree = {
  kind: "allOf" as const,
  requirements: [{ kind: "item" as const, itemId: "heropoint", name: "HeroPoint", quantity: 5, source: "https://aqwwiki.wikidot.com/heropoint" }],
};
const mergeFor: Record<string, { name: string; source: string }> = {
  "calendar-timeless-chronomancer": {
    name: "Timeless Chronomancer",
    source: "https://aqwwiki.wikidot.com/timeless-chronomancer-class-merge",
  },
  "calendar-overworld-chronomancer": {
    name: "Overworld Chronomancer",
    source: pointsSource,
  },
};
function confirmedHeroPointMethod(classId: string, name: string, source: string): ClassAcquisitionMethod {
  return {
    id: "v020-heropoints-merge-" + classId,
    classId,
    type: "merge",
    acquisitionKind: "heropoints",
    variantName: name,
    isAvailable: true,
    availability: "available",
    verificationStatus: "verified",
    detailsStatus: "complete",
    source,
    sourceHash: "v020-official-heropoints-and-class-wiki",
    prerequisites: [],
    notes: ["Đổi 5 HeroPoints tại HeroPoints Merge — /join heromart. Không yêu cầu Calendar Key."],
    membershipRequirement: null,
    levelRequirement: null,
    baseLevel: null,
    merge: {
      mergeShop: "HeroPoints Merge",
      source: pointsSource,
      npc: "Stryche",
      map: "HeroMart",
      materials: pointTree,
      rawMaterials: ["HeroPoint x5"],
      prerequisiteItems: [],
      requiredQuests: [],
    },
    evidence: { classPage: source, linkedSource: pointsSource, priceText: "HeroPoint x5", locationText: ["HeroPoints Merge - HeroMart"], issues: [] },
  };
}

export function presentedCalendarMethods(classId: string, methods: ClassAcquisitionMethod[]): ClassAcquisitionMethod[] {
  if (!classId.startsWith("calendar-")) return methods;
  const unique = new Map<string, ClassAcquisitionMethod>();
  for (const method of methods) {
    const signature = methodSignature(method);
    if (!unique.has(signature)) unique.set(signature, method);
  }
  const result = [...unique.values()];
  const merge = mergeFor[classId];
  if (merge && !result.some((m) => m.type === "merge" && /hero.?points?/i.test(JSON.stringify(m.merge ?? {})))) {
    result.push(confirmedHeroPointMethod(classId, merge.name, merge.source));
  }
  // Calendar Code/Book of Lore methods are 0 ACs *after unlocking*; never mistake them for a 5-HP merge.
  return result.sort((a, b) => {
    const order = (m: ClassAcquisitionMethod) => m.type === "shop" ? 0 : m.type === "merge" ? 1 : 2;
    return order(a) - order(b);
  });
}

export function acquisitionTabLabel(method: ClassAcquisitionMethod): string {
  if (method.type === "merge" && /heropoints/i.test(method.acquisitionKind ?? "")) return "5 HEROPOINTS";
  if (method.shop?.price?.amount === 0 && method.shop?.price?.currency === "AC") return "0 ACs";
  return method.acquisitionKind === "calendar_code" ? "CALENDAR SHOP" : method.type.toUpperCase();
}
