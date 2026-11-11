// Shared by the body/family generators and the UI. Preserve duplicate evidence.
export function normalizeCalendarMethods(methods) {
  const unique = new Map();
  for (const method of methods) {
    const signature = JSON.stringify({
      type: method.type, kind: method.acquisitionKind, variant: method.variantName,
      shop: method.shop && { ...method.shop, price: { amount: method.shop.price.amount, currency: method.shop.price.currency } },
      merge: method.merge, quest: method.quest, drop: method.drop, other: method.other,
      prerequisites: [...method.prerequisites].sort(), membership: method.membershipRequirement,
      level: method.levelRequirement, availability: method.availability,
    });
    const previous = unique.get(signature);
    if (previous) previous.importEvidence = [...(previous.importEvidence || [previous.evidence]), ...(method.importEvidence || [method.evidence])];
    else unique.set(signature, structuredClone(method));
  }
  return [...unique.values()];
}
