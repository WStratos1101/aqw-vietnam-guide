import fs from "node:fs";
import { createHash } from "node:crypto";
import { loadFarmReviewPages } from "./lib/farm-review-enrichment.mjs";
import { materialLeaves } from "../src/lib/material-requirements.mjs";
const root = "content-sources/farm/review", read = p => JSON.parse(fs.readFileSync(p, "utf8"));
const catalog = read("src/content/farm/catalog-v2.generated.json"), baseline = read(root + "/baseline.json"), enrichment = read(root + "/enrichment-audit.json");
const pages = loadFarmReviewPages(), attempts = read(root + "/pages.json"), materials = read("src/content/farm/material-sources.generated.json");
const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const normalized = tree => !tree ? null : tree.kind === "item" ? { kind: tree.kind, name: tree.name.normalize("NFKC").toLowerCase().replaceAll("’", "'"), quantity: tree.quantity } : { kind: tree.kind, requiredChoices: tree.requiredChoices || null, requirements: tree.requirements.map(normalized).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) };
const rows = catalog.items.map(item => {
  const page = pages.find(p => p.url === item.wikiUrl), before = baseline.items.find(i => i.id === item.id), blockers = [], conflicts = [];
  if (!page) blockers.push("Live item page unavailable; retained source facts preserved");
  if (!item.primaryGroupId) blockers.push(item.groupEvidence.some(e => e.status === "ungrouped-source-chapter") ? "Guide explicitly places item in an ungrouped chapter; no primary faction asserted" : "Primary faction lacks direct ownership/reward/shop evidence");
  if (item.category === "Weapons" && !item.subtype) blockers.push("Weapon subtype pending exact Wiki breadcrumb");
  if (item.category === "Classes" && !item.classRoles?.length) blockers.push("Class role has no exact Class Codex evidence");
  if (!item.image) blockers.push("Exact local Wiki item artwork unavailable/unapproved");
  if (!item.membership || item.membership === "unknown") blockers.push("Membership not proven");
  if (!item.rarity && !item.wikiDetails?.rarity) blockers.push("Rarity not proven");
  if (!item.acquisitionRoutes.length) blockers.push("No structured acquisition route");
  const sourceRecipe = page?.mergeRecipes.length === 1 ? page.mergeRecipes[0].tree : null;
  let recipeStatus = sourceRecipe ? "matches-page" : "retained-or-not-applicable";
  if (sourceRecipe && !item.acquisitionRoutes.some(r => JSON.stringify(normalized(r.materialTree)) === JSON.stringify(normalized(sourceRecipe)))) {
    recipeStatus = "CONFLICT";
    conflicts.push({ field: "materials", sourcePage: page.url, sourceHash: page.sourceHash, sourceRecipe, retainedRecipes: item.acquisitionRoutes.map(r => ({ id: r.id, recipe: r.materialTree })) });
  }
  if (page?.mergeRecipes.some(r => !r.tree)) blockers.push("Wiki merge list has unresolved operator/list structure");
  const routes = item.acquisitionRoutes.map(route => {
    const missingMaterials = materialLeaves(route.materialTree).filter(n => !["Gold", "AC", "ACs"].includes(n.name) && !materials[n.itemId] && !catalog.items.some(i => i.id === n.itemId || i.originalName === n.name)).map(n => ({ id: n.itemId, name: n.name, quantity: n.quantity, sourcePage: n.source }));
    if (!route.mapCommand) blockers.push(route.id + ": receiving /join map not proven (or multiple locations)");
    if (route.method === "Other") blockers.push(route.id + ": acquisition method pending");
    if (route.method === "Merge" && !route.materialTree) blockers.push(route.id + ": merge material tree missing");
    if (route.method === "Quest" && !route.npc && !route.farmTasks?.some(t => t.npc)) blockers.push(route.id + ": quest NPC/unlock details incomplete");
    if (missingMaterials.length) blockers.push(route.id + ": " + missingMaterials.length + " material sources unresolved");
    if (route.insigniaSources?.some(s => s.status === "PENDING_SOURCE")) blockers.push(route.id + ": Insignia linkage pending");
    return { id: route.id, method: route.method, quest: route.questReward || null, npc: route.npc || null, location: route.location, map: route.mapCommand,
      missingMaterials, insigniaSources: route.insigniaSources || [], sources: route.sources };
  });
  if (conflicts.length) blockers.push("Source conflict requires explicit review; retained recipe not overwritten");
  const changed = before ? [
    ...["category", "subtype", "primaryGroupId", "image"].filter(field => (before[field] ?? null) !== (item[field] ?? null)),
    ...(before.recipesHash !== hash(item.acquisitionRoutes.map(r => ({ id: r.id, tree: r.materialTree }))) ? ["materials-or-routes"] : []),
    ...(before.routes.some(old => item.acquisitionRoutes.find(r => r.id === old.id)?.method !== old.method) ? ["method"] : []),
    ...(before.routes.some(old => item.acquisitionRoutes.find(r => r.id === old.id)?.mapCommand !== old.map) ? ["map"] : []),
    ...(item.acquisitionRoutes.some(r => r.insigniaSources?.length) ? ["ultra-insignia"] : []),
  ] : [];
  return { id: item.id, name: item.name, sourcePage: item.wikiUrl, status: blockers.length ? "PARTIAL" : "DONE", blockers, conflicts, category: item.category, subtype: item.subtype,
    primaryGroupId: item.primaryGroupId, factionEvidence: item.groupEvidence, image: item.image, imageEvidence: item.imageEvidence,
    liveSnapshot: page ? { sourceFile: page.sourceFile, sourceHash: page.sourceHash, checkedAt: page.checkedAt } : null, recipeStatus, changed, routes };
});
const count = field => rows.filter(r => r.changed.includes(field)).length;
const result = { status: rows.some(r => r.blockers.length) ? "PARTIAL" : "DONE", auditedAt: new Date().toISOString(),
  definition: "DONE requires exact item page, verified category/subtype/role, one evidenced faction, membership/rarity, approved local artwork, receiving maps, structured method/recipe and material-source coverage. This is a source audit, not an in-game availability guarantee.",
  summary: { baselineItems: baseline.items.length, canonicalItems: rows.length, fullyVerified: rows.filter(r => r.status === "DONE").length,
    partial: rows.filter(r => r.status !== "DONE").length, unknownGroups: rows.filter(r => !r.primaryGroupId).length,
    fixedCategory: count("category"), fixedSubtype: count("subtype"), fixedFaction: count("primaryGroupId"), fixedMaterialsOrRoutes: count("materials-or-routes"),
    fixedMethod: count("method"), fixedMap: count("map"), linkedUltraInsignia: count("ultra-insignia"),
    withWikiImage: rows.filter(r => r.image).length, missingImages: rows.filter(r => !r.image).length,
    materialGuides: Object.keys(materials).length, sourceRecipeConflicts: rows.filter(r => r.conflicts.length).length,
    liveItemPages: rows.filter(r => r.liveSnapshot).length, failedSourceReads: attempts.filter(p => p.status !== "read").map(p => ({ url: p.url, error: p.error })) },
  exclusions: enrichment.excluded, rows };
fs.writeFileSync(root + "/inventory-audit.json", JSON.stringify(result, null, 2) + "\n");
fs.writeFileSync(root + "/blockers.csv", "id,name,status,blockers,source\n" + rows.filter(r => r.blockers.length).map(r => [r.id,r.name,r.status,r.blockers.join("; "),r.sourcePage].map(s => '"' + s.replaceAll('"','""') + '"').join(",")).join("\n") + "\n");
console.log(JSON.stringify({ ...result.summary, failedSourceReads: result.summary.failedSourceReads.length }));
