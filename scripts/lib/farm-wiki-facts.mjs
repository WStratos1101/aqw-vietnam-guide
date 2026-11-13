import { item, validateMaterials } from "../../src/lib/material-requirements.mjs";

// Read only explicit labels in the retained Wiki body. Cache extraction does
// not establish current availability, route geography, or full verification.
export function farmWikiFacts(record) {
  const text = record.text || "";
  const field = (label) =>
    text.match(new RegExp(`^${label}:[ \\t]*([^\\n]+)$`, "im"))?.[1]?.trim() || null;
  const level = field("(?:Level Required|Required Level)");
  // Accept one explicit Price field only. AC tags and Sellback never imply purchase cost.
  const prices = [...text.matchAll(/^Price:[ \t]*([^\n]+)$/gim)];
  const priceText = prices.length === 1 ? prices[0][1].trim() : null;
  const purchase = priceText?.match(/^(\d{1,3}(?:,\d{3})*|\d+) (Gold|ACs?)$/i);
  const quest = priceText?.match(/^N\/A \(Reward from the '(.+)' quest\)$/i);
  const facts = {
    location: field("Locations?"),
    questReward: quest?.[1] || null,
    purchase: purchase ? { amount: Number(purchase[1].replaceAll(",", "")), currency: /^gold$/i.test(purchase[2]) ? "Gold" : "ACs" } : null,
    rarity: field("Rarity"),
    // A weapon's "Level:" is its enhancement level, not a requirement.
    level: level && /^\d+$/.test(level) ? Number(level) : null,
    materialTree: null,
    recipeReviewReason: null,
  };
  const sections = text.split(/^Merge the following:[ \t]*$/im);
  if (sections.length === 1) return facts;
  // Repeated sections or flattened OR groups need the original list structure.
  if (sections.length !== 2) {
    facts.recipeReviewReason = "Multiple merge sections; route scope needs review";
    return facts;
  }
  const body = sections[1].split(/^(?:Sellback|Rarity|Description|Notes|Price|Locations?):/im)[0];
  const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const nodes = [];
  for (const line of lines) {
    const match = line.match(/^(.+?)\s+[x×](\d{1,3}(?:,\d{3})+|\d+)$/);
    if (!match || /\b(?:OR|AND)\b/.test(match[1])) {
      facts.recipeReviewReason = "Ambiguous merge row/operator; preserve source for review";
      return facts;
    }
    nodes.push(item(match[1], Number(match[2].replaceAll(",", "")), record.wikiUrl));
  }
  const tree = { kind: "allOf", requirements: nodes };
  const errors = validateMaterials(tree);
  if (errors.length) facts.recipeReviewReason = errors.join("; ");
  else facts.materialTree = tree;
  return facts;
}
