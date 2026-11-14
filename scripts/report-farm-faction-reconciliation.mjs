import fs from "node:fs";

const read = (path) => JSON.parse(fs.readFileSync(path, "utf8"));
const catalog = read("src/content/farm/catalog-v2.generated.json");
const before = read("content-sources/farm/import/group-reconciliation-before.json").items;
const source = read("content-sources/farm/manual-faction-guide/faction_goals.json");
const aliases = read("content-sources/farm/import/faction-goal-aliases.json");
const ultra = read("content-sources/farm/import/ultra-import-audit.json");
const rewardBlockCount = fs
  .readFileSync("content-sources/farm/manual-faction-guide/reward_blocks_to_review.csv", "utf8")
  .trim()
  .split(/\r?\n/).length - 1;
const groups = new Map(catalog.groups.map((group) => [group.id, group.name]));
const normalize = (value) => String(value || "")
  .normalize("NFKC")
  .toLocaleLowerCase("en")
  .replace(/[’‘]/g, "'")
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();
const byName = new Map(source.goals.map((goal) => [normalize(goal.name), goal]));
const goalFor = (item) => {
  const alias = aliases.find((entry) => entry.itemId === item.id);
  if (alias) return byName.get(normalize(alias.goalName)) || null;
  return byName.get(normalize(item.name)) || byName.get(normalize(item.originalName)) || null;
};
const unknown = catalog.items.filter((item) => !item.primaryGroupId);
const assigned = catalog.items.filter((item) => item.primaryGroupId);
const transitions = [];
let alreadyCorrect = 0;
let moved = 0;
let newlyAssigned = 0;
let unassigned = 0;
for (const item of catalog.items) {
  const oldGroup = before[item.id]?.groupIds?.[0] || null;
  const newGroup = item.primaryGroupId || null;
  if (oldGroup === newGroup) {
    if (newGroup) alreadyCorrect++;
    continue;
  }
  if (oldGroup && newGroup) moved++;
  else if (oldGroup) unassigned++;
  else if (newGroup) newlyAssigned++;
  const goal = goalFor(item);
  transitions.push({
    name: item.originalName || item.name,
    id: item.id,
    old: oldGroup ? groups.get(oldGroup) || oldGroup : "UNVERIFIED_GROUP",
    next: newGroup ? groups.get(newGroup) || newGroup : "UNVERIFIED_GROUP",
    line: goal?.source_line ?? "—",
    goal: goal?.name ?? "no exact goal identity",
  });
}
const exactGoals = catalog.items.filter((item) => goalFor(item)).length;
const otherGoals = catalog.items.filter((item) => goalFor(item)?.group_id === "other-items");
const aggregateKinds = new Set(["set", "collection", "weapon-group", "class-family"]);
const aggregateGoals = source.goals.filter((goal) => aggregateKinds.has(goal.record_kind));
const unresolvedAggregates = aggregateGoals.filter((goal) => {
  const aliasMatch = aliases.some((alias) => normalize(alias.goalName) === normalize(goal.name));
  return !aliasMatch && !catalog.items.some((item) =>
    normalize(item.name) === normalize(goal.name) || normalize(item.originalName) === normalize(goal.name),
  );
});
const ultraUnknown = ultra.added.filter((id) => {
  const item = catalog.items.find((entry) => entry.id === id);
  return item && !item.primaryGroupId;
});
const counts = catalog.groups.map((group) => ({
  group,
  count: assigned.filter((item) => item.primaryGroupId === group.id).length,
}));
const transitionLines = transitions.length
  ? transitions.map((entry) => `| ${entry.name} (${entry.id}) | ${entry.old} → ${entry.next} | ${entry.line} | ${entry.goal} |`).join("\n")
  : "| — | No changes | — | — |";
const ultraLines = ultraUnknown.map((id) => `\`${id}\``).join(", ");
const aggregateLines = unresolvedAggregates
  .map((goal) => `| ${goal.name} | ${goal.record_kind} | ${goal.group_id} | ${goal.source_line} |`)
  .join("\n") || "| — | — | — | — |";
const report = `# Farm faction reconciliation report

Status: **PARTIAL** — source-locked primary assignments implemented; unexpanded rewards and unsupported identities remain pending. Catalog is ${catalog.items.length} canonical items.

## Reconciliation totals

- Canonical items checked: ${catalog.items.length}/${catalog.items.length}.
- Guide-goal identity matches: ${exactGoals} including ${aliases.length} reviewed category/variant aliases, retained in \`content-sources/farm/import/faction-goal-aliases.json\`.
- Assignments already correct: ${alreadyCorrect}.
- Existing primary groups corrected to a different sourced group: ${moved}.
- Newly assigned from previously unknown: ${newlyAssigned}.
- Former assignments removed because no exact owning chapter was proven: ${unassigned}.
- Current verified primary groups: ${assigned.length}; \`UNVERIFIED_GROUP\`: ${unknown.length}.
- Other Items exact matches intentionally left ungrouped: ${otherGoals.length}.

## Current group counts

| Guide chapter | Unique canonical items |
|---|---:|
${counts.map(({group,count})=>`| ${group.name} | ${count} |`).join("\n")}
| UNVERIFIED_GROUP | ${unknown.length} |

## Changed old group → new group

| Canonical item | Change | Guide line | Goal identity |
|---|---|---:|---|
${transitionLines}

A dash for Guide line means no exact canonical goal was found in the filtered list; the item stays unverified. Removed source-context membership counts are not treated as evidence of faction ownership. Each verified primary group retains the guide file, goal name, chapter, evidence text, and source line in the generated catalog.

## Aggregate goals and incomplete sets

There are ${aggregateGoals.length} guide goals tagged as set, collection, weapon-group, or class-family. ${unresolvedAggregates.length} have no exact current canonical identity and remain unexpanded; do not create a set-named synthetic item. The extraction package flags ${rewardBlockCount} reward blocks for item-level review.

| Guide target | Record kind | Group | Source line |
|---|---|---|---:|
${aggregateLines}

This report does not claim every reward member in these blocks has been matched to the catalog. Refer to \`content-sources/farm/manual-faction-guide/reward_blocks_to_review.csv\` and the exact source lines before extending assignments.

## Ultra Boss source items without guide group evidence

${ultraUnknown.length} Ultra import identities have no exact filtered-guide goal identity and remain unverified: ${ultraLines || "none"}.

## QA

- node --test tests/farm-groups.test.mjs tests/farm-v2.test.mjs tests/farm-v2-interactions.test.mjs: PASS, 26/26.
- npm run test:farm: PASS, 72/72; includes filter counts, direct links, popstate/back-forward interaction and no duplicate identities.
- npm run typecheck: PASS.
- npm run lint: PASS, 103 TypeScript files; 0 findings.
- npm test: PASS, 155/155.
- npm run build: PASS; Vite and prerender generated 689 routes / 404 HTML documents. Existing large-chunk warning remains.
- npm run test:build: PASS, 9/9.
- Generator replay is deterministic in the targeted Farm V2 test; no second Farm V2 generation was needed for the assertion.
- Browser QA: **UNVERIFIED / NOT RUN** for this change. No visual browser pass is claimed.
`;
fs.writeFileSync("FARM_FACTION_RECONCILIATION_REPORT.md", report);
const pending = `# Farm faction pending work

Current checkpoint: **PARTIAL**. Keep the source-locked assignments in the active catalog and continue only from these gaps.

- Review the ${unresolvedAggregates.length} unmatched aggregate guide targets listed in \`FARM_FACTION_RECONCILIATION_REPORT.md\`; enumerate actual rewards from the exact reward blocks and bind each to a verified canonical identity before assigning its chapter.
- Review the ${rewardBlockCount} extracted reward blocks; preserve source line and item identity. Never add synthetic set records.
- Resolve faction evidence for ${unknown.length} current canonical items only when their owning guide chapter or item-level reward is explicit. Do not use Wiki names, materials, maps, boss source, or the Goals List as faction evidence.
- Audit the ${ultraUnknown.length} Ultra-import items in the report; absent a direct guide identity/reward, leave each as \`UNVERIFIED_GROUP\`.
- Keep browser QA marked unverified for this data correction until host browser checks the faction counts, each filter, deep links, and back/forward navigation.

No generator rerun is required unless source assignments change. If changed, run the offline Farm V2 generator once, inspect generated diffs, run targeted Farm tests, typecheck, lint, full tests/build, and update the report with the observed results.
`;
fs.writeFileSync("FARM_FACTION_PENDING.md", pending);
console.log(JSON.stringify({total:catalog.items.length,exactGoals,alreadyCorrect,moved,newlyAssigned,unassigned,assigned:assigned.length,unknown:unknown.length,unresolvedAggregates:unresolvedAggregates.length,ultraUnknown:ultraUnknown.length}));
