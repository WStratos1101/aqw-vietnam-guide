import fs from "node:fs";
import { createHash } from "node:crypto";
import { Window } from "happy-dom";
import { parseFarmReviewPage, wikiText } from "./farm-review-parser.mjs";
import { materialId } from "../../src/lib/material-requirements.mjs";

const root = "content-sources/farm/external-guide-evidence";
const read = path => JSON.parse(fs.readFileSync(path, "utf8"));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

// The allowlist is a reviewed source, not a list of extraction candidates.
// Every accepted snapshot is pinned; builds run offline and fail on changes.
export function buildReviewedFarmWorkflows(items, materialSources) {
  const review = read("content-sources/farm/quest-workflow-review.json");
  if (hash(fs.readFileSync(review.guideSource)) !== review.guideSourceHash) throw Error("Changed supplied farming guide; recheck line evidence");
  const crosswalk = new Map(read(`${root}/CANONICAL_ITEM_EVIDENCE_CROSSWALK.json`).map(row => [row.canonical_id, row]));
  const guideEvidence = fs.readFileSync(`${root}/FARM_CATALOG_SOURCE_EVIDENCE.jsonl`, "utf8").trim().split(/\r?\n/).map(JSON.parse);
  const pages = new Map();
  for (const source of review.sources) {
    const html = fs.readFileSync(source.sourceFile, "utf8");
    if (hash(html) !== source.sourceHash) throw Error("Changed workflow evidence: " + source.url);
    pages.set(source.url, { ...source, html, ...parseFarmReviewPage(html, source.url) });
  }
  const evidence = page => ({ source: "wiki", url: page.url, sourceFile: page.sourceFile,
    sourceHash: page.sourceHash, verifiedAt: review.verifiedAt });
  const getPage = url => {
    const page = pages.get(url);
    if (!page) throw Error("Missing reviewed Wiki page: " + url);
    return page;
  };
  const mapFor = page => {
    const name = page.text.match(/^Map Name:\s*([a-z0-9_-]+)$/im)?.[1];
    return name && page.joinCommands.includes("/join " + name) ? "/join " + name : null;
  };
  const mapAt = (page, location) => {
    const matches = page.locationLinks.filter(link => link.name === location)
      .flatMap(link => pages.has(link.url) ? [getPage(link.url)] : [])
      .filter(p => mapFor(p));
    return matches.length === 1 ? matches[0] : null;
  };
  const resourceRow = (row, questPage, questName, override = {}) => {
    const resource = pages.get(override.resourceUrl || row.wikiUrl);
    const sourceDetails = [];
    if (resource) {
      const direct = resource.text.match(/^Price: N\/A \(Dropped by (.+)\)$/m)?.[1];
      const list = resource.text.match(/^Dropped by:\n([^]*?)(?=^Sellback:)/m)?.[1]?.trim();
      const monster = direct || list?.split("\n").join(", ") || null;
      const requiredQuest = /Dropped during/.test(resource.text) && resource.text.includes("'" + questName + "'") ? questName : null;
      for (const link of resource.locationLinks) {
        const mapPage = pages.get(link.url);
        if (!mapPage || !mapFor(mapPage) || !monster) continue;
        const wholeMap = direct?.match(/^any monster in (.+)$/i)?.[1];
        if (wholeMap && link.name !== wholeMap) continue;
        sourceDetails.push({ kind: "MONSTER_DROP", monster, mapJoin: mapFor(mapPage), requiredQuest,
          unlockRequirements: resource.text.split("\n").filter(line => /^(?:Must |Requires |You must |Only drops? |Can only )/.test(line)),
          evidence: [evidence(resource), evidence(mapPage)] });
      }
    }
    if (override.mapUrl) {
      const mapPage = getPage(override.mapUrl);
      const monster = override.monster;
      if (!mapFor(mapPage) || !monster || !row.monster?.split("\n").includes(monster) || !mapPage.text.includes(monster))
        throw Error("Unproved Quest drop / map pairing: " + row.name);
      sourceDetails.push({ kind: "MONSTER_DROP", monster, mapJoin: mapFor(mapPage), requiredQuest: questName,
        evidence: [evidence(questPage), evidence(mapPage)] });
    }
    const maxStack = resource?.text.match(/Stacks up to ([\d,]+)\./)?.[1];
    return { name: row.name, itemId: materialId(row.name), quantity: row.quantity, source: questPage.url,
      monster: sourceDetails[0]?.monster || row.monster?.replaceAll("\n", ", ") || null,
      map: sourceDetails[0]?.mapJoin || null,
      maxStack: maxStack ? Number(maxStack.replaceAll(",", "")) : null,
      requiredQuest: sourceDetails[0]?.requiredQuest || null,
      sourceDetails, evidence: [evidence(questPage), ...(resource ? [evidence(resource)] : [])] };
  };
  const taskFromQuest = spec => {
    const page = getPage(spec.url);
    const matches = page.quests.filter(q => q.name === spec.name);
    const quest = matches[spec.matchIndex || 0];
    if (!quest || (matches.length !== 1 && spec.matchIndex === undefined)) throw Error("Ambiguous / absent Quest: " + spec.name);
    const mapPage = mapAt(quest, quest.location);
    const fixed = quest.fixedRewards, choices = quest.choiceRewards;
    const selected = spec.rewardName ? [...fixed, ...choices].find(r => r.name === spec.rewardName) : null;
    if (spec.rewardName && !selected) throw Error("Quest does not reward " + spec.rewardName);
    const displayedRewards = selected && choices.includes(selected) ? [...fixed, selected] : fixed;
    const task = { id: spec.id || materialId(quest.name), quest: quest.name, npc: quest.npc,
      map: mapPage ? mapFor(mapPage) : null, preconditions: quest.requirements,
      requirements: spec.notes || [], source: page.url, repeatability: quest.repeatability || undefined,
      quantityScope: "perTurn", rows: quest.required.map(row => {
        const bossMap = spec.bossId && mapPage && row.monster && mapPage.text.includes(row.monster)
          ? { monster: row.monster, mapUrl: mapPage.url } : {};
        return resourceRow(row, page, quest.name, spec.rowSources?.[row.name] || bossMap);
      }),
      fixedRewards: fixed, rewardChoices: choices, randomRewards: quest.randomRewards,
      randomChoiceRewards: quest.randomChoiceRewards,
      reward: displayedRewards.map(r => `${r.name} ×${r.quantity}`).join("; "),
      rewardQuantity: selected?.quantity, numberOfRuns: spec.repeatCount,
      totalRequired: spec.repeatCount && selected ? spec.repeatCount * selected.quantity : undefined,
      evidence: [evidence(page), ...(mapPage ? [evidence(mapPage)] : [])],
      ...(spec.bossId ? { bossId: spec.bossId, bossName: spec.bossName } : {}),
      ...(spec.destination ? { destination: spec.destination } : {}),
      ...(spec.alternativeGroup ? { alternativeGroup: spec.alternativeGroup } : {}) };
    if (spec.repeatCount) for (const row of task.rows) row.quantityTotal = row.quantity * spec.repeatCount;
    return task;
  };
  const shopTasks = spec => {
    const page = getPage(spec.url);
    const window = new Window({ settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true, disableJavaScriptFileLoading: true } });
    try {
      window.document.write(page.html);
      const matches = [...window.document.querySelectorAll("#page-content table tr")].flatMap(tr => {
        const cells = [...tr.children].filter(cell => wikiText(cell));
        if (cells.length < 2) return [];
        const label = wikiText(cells[0]);
        const output = label.match(/^(.*?) x([\d,]+)$/);
        const name = output?.[1] || label;
        if (name !== spec.name) return [];
        const price = wikiText(cells.at(-1));
        const rows = price.split(/\n/).map(s => s.replace(/,$/, "").trim()).filter(Boolean).map(value => {
          const m = value.match(/^(.+?) x([\d,]+)$/);
          if (!m) throw Error("Unparsed reviewed shop input: " + value);
          return { name: m[1], itemId: materialId(m[1]), quantity: Number(m[2].replaceAll(",", "")), source: page.url };
        });
        return [{ id: spec.id || "merge-" + new URL(spec.url).pathname.slice(1) + "-" + materialId(spec.name), quest: null, title: spec.name, npc: spec.npc,
          map: spec.mapUrl ? mapFor(getPage(spec.mapUrl)) : null, requirements: spec.notes || [], preconditions: spec.preconditions || [],
          source: page.url, reward: `${name} ×${output ? Number(output[2].replaceAll(",", "")) : 1}`,
          rewardQuantity: output ? Number(output[2].replaceAll(",", "")) : 1,
          rows, alternativeGroup: spec.alternativeGroup,
          evidence: [evidence(page), ...(spec.mapUrl ? [evidence(getPage(spec.mapUrl))] : [])] }];
      });
      if (!matches.length || (matches.length > 1 && !spec.allowAlternatives)) throw Error("Ambiguous / absent shop output: " + spec.name);
      return matches.map((task, index) => ({ ...task, id: task.id + (matches.length > 1 ? "-" + index : "") }));
    } finally { window.happyDOM.close(); }
  };
  const itemMergeTask = spec => {
    const page = getPage(spec.url);
    const recipe = page.mergeRecipes;
    if (recipe.length !== 1 || recipe[0].status !== "explicit-list") throw Error("Unverified item Merge: " + spec.name);
    const mapPage = getPage(spec.mapUrl);
    return { id: materialId(spec.name), quest: null, title: spec.name, npc: spec.npc,
      map: mapFor(mapPage), requirements: [], preconditions: [], source: page.url,
      reward: spec.name + " ×1", rewardQuantity: 1,
      rows: recipe[0].tree.requirements.map(row => ({ name: row.name, itemId: row.itemId, quantity: row.quantity, source: page.url })),
      evidence: [evidence(page), evidence(mapPage)] };
  };
  const tasks = specs => {
    const built = specs.flatMap(spec => spec.kind === "MERGE" ? shopTasks(spec)
      : spec.kind === "MERGE_ITEM" ? [itemMergeTask(spec)] : [taskFromQuest(spec)]);
    if (new Set(built.map(task => task.id)).size !== built.length) throw Error("Duplicate Quest workflow step IDs");
    return built;
  };
  const reviewed = review.records.map(record => ({ ...record,
    guideEvidence: guideEvidence.filter(guide => guide.source_span.start_line <= record.guideLines[0] && guide.source_span.end_line >= record.guideLines[0])
      .map(guide => ({ id: guide.id, sourceSpan: guide.source_span, source: review.guideSource, sourceHash: review.guideSourceHash })),
    routes: record.routes.map(route => ({ ...route,
    tasks: tasks(route.steps), steps: undefined })) }));
  for (const material of review.materials) {
    const built = tasks(material.steps);
    materialSources[material.id] = { name: material.name, method: material.method,
      tasks: material.append ? [...(materialSources[material.id]?.tasks || []), ...built] : built };
  }
  for (const record of reviewed.filter(r => r.target === "farm")) {
    const item = items.find(i => i.id === record.canonicalId);
    if (!item) throw Error("Absent canonical Farm identity: " + record.canonicalId);
    for (const change of record.routes) {
      const route = item.acquisitionRoutes.find(r => r.id === change.routeId);
      if (!route) throw Error("Absent canonical Farm route: " + record.canonicalId + "/" + change.routeId);
      route.farmTasks = change.tasks;
      const path = { id: "wiki-quest-workflow", label: "Quest và Shop đã đối chiếu", verificationStatus: "verified",
        coverage: record.status === "DONE" ? "complete_workflow" : "reviewed_fields",
        steps: change.tasks.map(task => ({ id: task.id, title: task.quest || task.title,
          text: task.requirements.join(" ") || task.reward || "Xem bảng nguyên liệu của bước này.", sources: [task.source] })) };
      route.guidePaths = [...(route.guidePaths || []).filter(p => p.id !== path.id), path];
      if (change.location !== undefined) route.location = change.location;
      if (change.mapUrl) route.mapCommand = mapFor(getPage(change.mapUrl));
      if (change.materialQuest) {
        const task = change.tasks.find(t => t.quest === change.materialQuest);
        route.materialTree = { kind: "allOf", requirements: task.rows.map(row => ({ kind: "item", itemId: row.itemId,
          name: row.name, quantity: row.quantity, source: row.source })) };
      }
      for (const task of change.tasks) if (!route.sources.some(s => s.url === task.source))
        route.sources.push({ url: task.source, label: "AQW Wiki", sourceType: "wiki" });
    }
  }
  // Direct drop drill-downs are derived only from the accepted row evidence.
  // The quest acceptance map never stands in for an ingredient's farm map.
  const dropGuides = [];
  for (const task of [...reviewed.flatMap(record => record.routes.flatMap(route => route.tasks)),
    ...Object.values(materialSources).flatMap(source => source.tasks)]) {
    for (const row of task.rows) {
      if (!row.itemId || materialSources[row.itemId] || !row.sourceDetails?.length) continue;
      materialSources[row.itemId] = { name: row.name, method: "Drop", tasks: [{
        id: "drop-" + row.itemId, quest: null, title: row.name, source: row.source,
        requirements: row.sourceDetails.flatMap(source => source.unlockRequirements || []),
        preconditions: [], reward: row.name,
        rows: [{ ...row, itemId: undefined, quantity: null, quantityTotal: undefined }],
      }] };
      dropGuides.push(row.itemId);
    }
  }
  const byId = new Map(reviewed.filter(r => r.target === "farm").map(r => [r.canonicalId, r]));
  const records = items.map(item => {
    const reviewedItem = byId.get(item.id);
    return { canonicalId: item.id, officialName: item.originalName, category: item.category, subtype: item.subtype,
      primaryGroupId: item.groupIds?.[0] || null, verifiedWikiUrl: item.wikiUrl,
      status: reviewedItem?.status || "PENDING", blockers: reviewedItem?.blockers || ["Full Quest / ingredient / monster / map / alternative-route audit pending."],
      guideLines: reviewedItem?.guideLines || [], routes: reviewedItem?.routes || [],
      guideEvidence: reviewedItem?.guideEvidence || [],
      guideCandidates: { ids: crosswalk.get(item.id)?.guide_candidate_ids || null,
        lines: crosswalk.get(item.id)?.guide_source_lines || null, status: "candidate-pointers-only" },
      verificationScope: reviewedItem ? "reviewed-fields-only" : "inventory-only; existing evidence retained, not reverified" };
  });
  return { schemaVersion: 1, verifiedAt: review.verifiedAt, records,
    classReferences: reviewed.filter(r => r.target === "class"),
    materialWorkflows: [...review.materials.map(m => m.id), ...dropGuides].map(id => ({ id, ...materialSources[id] })),
    sourceCount: review.sources.length };
}

export function writeFarmWorkflowReports(workflows) {
  fs.writeFileSync(`${root}/FARM_CANONICAL_QUEST_WORKFLOWS.json`, JSON.stringify(workflows, null, 2) + "\n");
  fs.writeFileSync("src/content/farm/class-workflows.generated.json", JSON.stringify(workflows.classReferences, null, 2) + "\n");
  const csv = value => '"' + String(value ?? "").replaceAll('"', '""') + '"';
  const rows = workflows.records.filter(r => r.status !== "DONE").map(r => [r.canonicalId, r.officialName, r.status,
    r.verifiedWikiUrl, r.guideLines.join("-"), r.blockers.join("; ")]);
  fs.writeFileSync(`${root}/FARM_PENDING_WIKI_REVIEW.csv`,
    ["canonicalId,officialName,status,wikiUrl,guideLines,blocker", ...rows.map(row => row.map(csv).join(","))].join("\n") + "\n");
  const materialById = new Map(workflows.materialWorkflows.map(material => [material.id, material]));
  const unresolved = (canonicalId, routeId, tasks, visited = []) => tasks.flatMap(task => task.rows.flatMap(row => {
    if (row.sourceDetails?.length) return [];
    const nested = materialById.get(row.itemId);
    if (nested && !visited.includes(row.itemId)) return unresolved(canonicalId, routeId, nested.tasks, [...visited, row.itemId]);
    return [[canonicalId, routeId, task.quest || task.title, row.name, task.source, "Direct source or remaining nested acquisition workflow pending"]];
  }));
  const missing = [...workflows.records.filter(r => r.routes.length), ...workflows.classReferences].flatMap(record =>
    record.routes.flatMap(route => unresolved(record.canonicalId, route.routeId, route.tasks)));
  fs.writeFileSync(`${root}/FARM_MATERIAL_SOURCE_PENDING.csv`,
    ["canonicalId,routeId,questOrShop,material,wikiUrl,blocker", ...missing.map(row => row.map(csv).join(","))].join("\n") + "\n");
  const reviewed = workflows.records.filter(r => r.routes.length);
  const aggregate = fs.readFileSync(`${root}/AGGREGATE_ITEM_CANDIDATES.csv`, "utf8").trim().split(/\r?\n/).length - 1;
  const counts = {
    inventoryAudited: workflows.records.length,
    wikiWorkflowReviewed: reviewed.length,
    done: workflows.records.filter(r => r.status === "DONE").length,
    partial: workflows.records.filter(r => r.status === "PARTIAL").length,
    pending: workflows.records.filter(r => r.status === "PENDING").length,
    reviewedClassReferences: workflows.classReferences.length,
    materialWorkflows: workflows.materialWorkflows.length,
    reviewedCanonicalWithMethod: reviewed.filter(r => r.routes.every(rt => rt.kind)).length,
    reviewedCanonicalWithIngredientTables: reviewed.filter(r => r.routes.every(rt => rt.tasks.some(t => t.rows.length))).length,
    reviewedCanonicalWithEveryQuestGiverAndAcceptMap: reviewed.filter(r => {
      const quests = r.routes.flatMap(route => route.tasks).filter(task => task.quest);
      return quests.length && quests.every(task => task.npc && task.map);
    }).length,
    reviewedCanonicalWithEveryDirectIngredientMonsterAndMap: reviewed.filter(r => r.routes.every(rt => rt.tasks.flatMap(t => t.rows).every(row => row.monster && row.map))).length,
    reviewedCanonicalWithShopUnlock: reviewed.filter(r => r.routes.some(rt => rt.shopUnlock)).length,
    pendingMaterialRows: missing.length,
    aggregateCandidateRowsScanned: aggregate,
    aggregateCandidatePolicy: "Headings remain candidates; no sets or resources promoted into canonical items.",
    sourceSnapshots: workflows.sourceCount,
  };
  fs.writeFileSync(`${root}/FARM_WORKFLOW_AUDIT_SUMMARY.json`, JSON.stringify(counts, null, 2) + "\n");
}
