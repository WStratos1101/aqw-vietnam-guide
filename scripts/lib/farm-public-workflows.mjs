import fs from "node:fs";
import { createHash } from "node:crypto";
import { parseFarmReviewPage } from "./farm-review-parser.mjs";
import { materialId, materialLeaves } from "../../src/lib/material-requirements.mjs";
import { sumMaterials, voidHighlordMix } from "../../src/lib/farm-workflows.mjs";

const read = path => JSON.parse(fs.readFileSync(path, "utf8"));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const base = "content-sources/farm/external-guide-evidence";
const nostalgia = /nostalgia|yulgar.s dual wield (?:drop off|shop)/i;
const bossGroups = { "champion-drakath": "chaos", "darkon-the-conductor": "debris-astravian",
  "ultra-drago": "debris-astravian", "gramiel-the-graceful": "hollowborn", "ultra-speaker": "alternative-hero",
  "ultra-nulgath": "nation", "ultra-dage": "legion" };
const cleanLocation = value => value?.split(/\n|\s*·\s*/).map(part=>part.replace(/\s*Yulgar's Dual Wield[^]*$/i,"" )).filter(part=>part&&!nostalgia.test(part)).join(" · ").trim() || null;
const outputs = q => [...q.fixedRewards,...q.choiceRewards,...q.randomRewards,...q.randomChoiceRewards];

export function applyDirectUltraGroups(items, pages, audit = { factionChanges: [], conflicts: [] }) {
  for (const item of items) {
    const direct = item.acquisitionRoutes.flatMap(route => route.insigniaSources || []).filter(source => source.scope === "direct" && source.status !== "PENDING_SOURCE" && bossGroups[source.bossId]);
    const factions = [...new Set(direct.map(source => bossGroups[source.bossId]))];
    if (factions.length > 1) audit.conflicts.push({ itemId: item.id, kind: "direct-ultra-factions", bosses: direct.map(source => source.bossId), groups: factions });
    if (factions.length === 1) {
      const group = factions[0];
      if (item.primaryGroupId === group) continue;
      const page = pages.get(item.wikiUrl);
      if (!page?.sourceHash) { audit.conflicts.push({ itemId: item.id, kind: "missing-direct-recipe-snapshot" }); continue; }
      audit.factionChanges.push({ itemId: item.id, before: item.primaryGroupId, after: group });
      item.primaryGroupId = group; item.groupIds = [group]; item.groupStatus = "verified-ultra-quest";
      item.groupEvidence = direct.map(source => ({ groupId: group, status: "verified", sourceUrl: item.wikiUrl, questSourceUrl: source.sourcePage,
        sourceDocument: "aqwwiki-ultra-exchange", sourceBossId: source.bossId, relationship: "direct-insignia-exchange",
        sourceHash: page.sourceHash, recipeUrl: item.wikiUrl, insigniaName: source.name, insigniaQuantity: source.quantity,
        sourceFile: page.sourceFile, goalName: item.name, sourceLine: null, sourceChapter: source.bossName,
        recordKind: "canonical-item-ultra-exchange", evidenceText: `${source.name} ×${source.quantity}`, matchKind: "verified-direct-ultra-exchange" }));
    }
  }
  return items;
}

export function buildFarmPurchaseTasks(page, pages, name, id=materialId(name)) {
  const mapFor=page=>{const map=page?.text.match(/^Map Name:\s*([a-z0-9_-]+)$/im)?.[1];return map&&page.joinCommands.includes("/join "+map)?"/join "+map:null;};
        const shopLocations=(page.locationLinks || []).map(link=>pages.get(link.url)).filter(candidate=>candidate?.shopRows?.some(row=>row.url===page.url));
        return shopLocations.flatMap(place=>{
          const listed=place.shopRows.find(row=>row.url===page.url);
          const shopName=page.locationLinks.find(link=>link.url===place.url)?.name;
          const header=place.text.split(/^(?:Note:|Weapons$|Classes \/ Armors$|Name$)/m)[0];
          const locations=header.replace(/^Locations?:\s*/m, "").split("\n").flatMap(line=>{
            const pair=line.match(/^(.+?) - (.+)$/);
            if(!pair)return [];
            const link=place.locationLinks.find(link=>link.name===pair[2]), map=mapFor(pages.get(link?.url));
            const menu=/^(?:Game Menu|Book of Lore)$/.test(pair[2]);
            if(!map&&!menu)return [];
            return [{npc:menu?null:pair[1],location:pair[2],map:map || null,shopAccess:menu?pair[2]+" → "+pair[1]:undefined}];
          });
          return (locations.length?locations:[{npc:null,location:page.location,map:null}]).map((location,index)=>({
            id:"material-shop-"+id+":"+materialId(shopName || "shop")+":"+index,quest:null,title:name,source:page.url,
            ...location,shop:shopName,purchase:listed.purchase,
            preconditions:[...new Set([...listed.requirements,...[page,place].flatMap(source=>source.text.split("\n").filter(line=>/^(?:Note: )?(?:Must |Requires |Need )/i.test(line)))])],requirements:[],rows:[],reward:name+" ×1",rewardQuantity:1}));
        });
}

export function applyFarmPublicWorkflows(items, cachedPages, materialSources, bosses) {
  const pages = new Map(cachedPages.map(page => [page.url, page]));
  for (const source of read("content-sources/farm/quest-workflow-review.json").sources) {
    if (pages.has(source.url)) continue;
    const html = fs.readFileSync(source.sourceFile, "utf8");
    if (hash(html) !== source.sourceHash) throw Error("Changed public workflow source: " + source.url);
    pages.set(source.url, { ...source, ...parseFarmReviewPage(html, source.url) });
  }
  const audit = { removedRoutes: [], cleanedRoutes: [], factionChanges: [], conflicts: [], batches: [] };
  const quests = {}, registrations = new Map();
  const mapFor = page => {
    const name = page?.text.match(/^Map Name:\s*([a-z0-9_-]+)$/im)?.[1];
    return name && page.joinCommands.includes("/join " + name) ? "/join " + name : null;
  };
  const questRows = [...pages.values()].flatMap(page => (page.quests || []).map(q => ({ page, q })));
  const byName = name => questRows.filter(row => row.q.name === name);
  const byReward = new Map();
  for (const row of questRows) for (const reward of outputs(row.q)) {
    const key = reward.wikiUrl || reward.name;
    const entries = byReward.get(key) || [];
    if (!entries.some(entry => entry.page.url === row.page.url && entry.q.name === row.q.name)) entries.push(row);
    byReward.set(key, entries);
  }
  const register = ({ page, q }) => {
    const variants = byName(q.name).filter(row => row.page.url === page.url);
    const key = new URL(page.url).pathname.slice(1) + ":" + materialId(q.name) + (variants.length > 1 ? ":" + hash(q.requirements.join("\n")).slice(0,8) : "");
    if (registrations.has(key)) return key;
    registrations.set(key, true);
    const locations = [...new Set(q.locationLinks.filter(link => (link.name === q.location || q.locationNames?.includes(link.name))).map(link => mapFor(pages.get(link.url))).filter(Boolean))];
    const task = { id: key, quest: q.name, npc: q.npc, location: q.location || q.locationNames?.join(" · ") || null, acceptanceMaps:locations, map: locations.length === 1 ? locations[0] : null,
      source: page.url, sourceHash: page.sourceHash, preconditions: q.requirements, requirements: [],
      ownedItems: [...new Map((q.ownedItems || []).map(item => [item.wikiUrl, item])).values()],
      rows: q.required.map(row => ({ name: row.name, itemId: materialId(row.name), quantity: row.quantity,
        monster: row.monster || null, map: null, source: page.url })),
      reward: q.fixedRewards.map(r => `${r.name} ×${r.quantity}`).join("; "),
      fixedRewards: q.fixedRewards, rewardChoices: q.choiceRewards, randomRewards: q.randomRewards,
      randomChoiceRewards: q.randomChoiceRewards, repeatability: q.repeatability,
      dependencies: [], dependencyChoices: [], unresolvedDependencies: [] };
    const mapPages = q.locationLinks.filter(link=>(link.name===q.location || q.locationNames?.includes(link.name))).map(link=>pages.get(link.url)).filter(Boolean);
    task.mapEvidence = mapPages.filter(page=>mapFor(page)).map(page=>({url:page.url,sourceFile:page.sourceFile,sourceHash:page.sourceHash}));
    task.preconditions = [...new Set([...task.preconditions,...mapPages.flatMap(page=>page.text.split("\n").filter(line=>/^(?:Note: )?Must .*access this location/.test(line)).map(line=>line.replace(/^Note: /,"")))])];
    quests[key] = task;
    const dependencies = [];
    for (const requirement of task.preconditions.filter(text => /completed/i.test(text))) {
      if (/previous quest/i.test(requirement) && q.previousQuest) {
        const previous = questRows.find(row => row.page.url === page.url && row.q.name === q.previousQuest && row.q.location === q.location);
        if (previous && !/\bor\b|one of/i.test(requirement)) dependencies.push(previous);
        else {
          task.dependencyChoices.push({ requirement, questNames: [q.previousQuest, ...[...requirement.matchAll(/'([^']+)'/g)].map(m => m[1])] });
          if (previous) dependencies.push(previous);
        }
      } else {
        const named = [...new Set([...questRows.filter(row=>requirement.includes("'"+row.q.name+"'")).map(row=>row.q.name),...[page,...mapPages].flatMap(source=>source.itemLinks || []).filter(link=>requirement.includes("'"+link.name+"'")).map(link=>link.name)])];
        if (/\bor\b|one of/i.test(requirement)) { task.dependencyChoices.push({ requirement, questNames: named }); continue; }
        for (const name of named) {
          const local = byName(name).filter(row => row.page.url === page.url);
          const matches = local.length ? local : byName(name);
          if (matches.length === 1) dependencies.push(matches[0]);
          else task.unresolvedDependencies.push({ name, requirement });
        }
      }
    }
    // Ownership gates are not consumed. Quest-only prerequisites from the same
    // NPC's page are dependencies, including the Hollowborn contract chain.
    for (const owned of task.ownedItems) {
      const producers = (byReward.get(owned.wikiUrl) || []).filter(row => !row.page.url.includes("story:") && row.q.name !== q.name);
      const itemPage = pages.get(owned.wikiUrl);
      if (producers.length === 1 && (producers[0].page.url===page.url || /Reward from/.test(itemPage?.text || "")) &&
        !itemPage?.mergeRecipes?.length && !/Dropped by/.test(itemPage?.text || "")) dependencies.push(producers[0]);
    }
    task.dependencies = [...new Set(dependencies.map(register))].filter(id => id !== key);
    return key;
  };
  const ordered = (ids, visiting = new Set(), result = []) => {
    for (const id of ids) {
      if (result.includes(id)) continue;
      if(visiting.has(id))throw Error("Cyclic Wiki Quest dependency: "+id);
      visiting.add(id); ordered(quests[id]?.dependencies || [], visiting, result); visiting.delete(id); result.push(id);
    }
    return result;
  };
  // Existing reviewed per-turn quantities and maps take precedence over the
  // generic cached panel. No candidate text supplies quantities.
  const useReviewedTask = task => {
    if (!task.quest || !task.source) return null;
    const row = questRows.find(row => row.page.url === task.source && row.q.name === task.quest);
    if (!row) return null; // A merge/shop instruction is not a real Wiki Quest.
    const key = row ? register(row) : new URL(task.source).pathname.slice(1) + ":" + materialId(task.quest);
    quests[key] = { ...(quests[key] || {}), ...task, id: key,
      preconditions: quests[key]?.preconditions?.length ? quests[key].preconditions : task.preconditions || [],
      dependencies: quests[key]?.dependencies || [], ownedItems: quests[key]?.ownedItems || [] };
    return key;
  };
  for (const source of Object.values(materialSources)) for (const task of source.tasks || []) useReviewedTask(task);
  const manualMaterials = read("content-sources/farm/material-guides.json");
  for (const task of manualMaterials["roentgenium-of-nulgath"].tasks) useReviewedTask(task);

  const taskId = name => Object.keys(quests).find(id => quests[id].quest === name && !id.startsWith("story:"));
  const makeModes = (item, route) => {
    if (item.id === "void-highlord-class") {
      const daily = taskId("Void HighLord's Challenge"), weekly = taskId("Nulgath, the Archfiend");
      if (!daily || !weekly) throw Error("Missing verified VHL daily / Ultra source");
      const final = route.farmTasks.filter(task => !task.quest);
      const crystals = ["void-crystal-a","void-crystal-b"].flatMap(id=>materialSources[id].tasks[0].rows);
      const exchange = manualMaterials["roentgenium-of-nulgath"].tasks.find(task => task.id === "ultra-nulgath-insignia-exchange");
      const mix = voidHighlordMix(0);
      route.mixRule={dailyQuestId:daily,weeklyQuestId:weekly,remainingMaterials:crystals};
      route.farmModes = [
        { id: "standard", label: "Farm thông thường", questIds: [daily], questRuns: { [daily]: 15 },
          materials: sumMaterials([{ ...quests[daily], numberOfRuns: 15 },{rows:crystals}]), finishingTasks: final },
        { id: "insignia", label: "Farm bằng Insignia", questIds: [weekly], questRuns: { [weekly]: mix.weeklyCompletions },
          materials: sumMaterials([{rows:[{ name: "Nulgath Insignia", itemId: "nulgath-insignia", quantity: mix.insignia, source: exchange.source }, ...crystals]},{...quests[weekly],numberOfRuns:mix.weeklyCompletions}]),
          finishingTasks: [{ ...exchange, numberOfRuns: mix.exchanges }, ...final],
          insignia: { name: "Nulgath Insignia", quantity: mix.insignia, perQuest: 5, questCompletions: mix.weeklyCompletions,
            quest:quests[weekly].quest,npc:quests[weekly].npc,bossName:"Ultra Nulgath",
            bossId: "ultra-nulgath", map: "/join ultranulgath", repeatability: "weekly", exchangeInput: 5, exchangeOutput: 2, exchanges: mix.exchanges, excess: mix.excess },
          notes: ["8 lượt đổi nhận 16 Roentgenium; dùng 15 để merge, còn dư 1. Void Crystal A và B vẫn bắt buộc."] },
      ];
      route.questWorkflowIds = [daily];
    }
    if (item.id === "legion-revenant-class") {
      const ids = [1,2,3,4].map(n => taskId("Legion Fealty " + n)), weekly = taskId("Dage, Lord of the Undead Legion");
      if (ids.some(id => !id) || !weekly) throw Error("Missing LF1–4 / Ultra Dage source");
      const counts = [20,6,10,1];
      const traditional = sumMaterials(ids.slice(0,3).map((id,i) => ({ ...quests[id], numberOfRuns: counts[i] })));
      const remaining = sumMaterials(ids.slice(0,3).map(id => ({ ...quests[id], numberOfRuns: 1 })));
      const token = remaining.find(row => row.name === "Legion Token");
      token.quantity += 31 * 50;
      remaining.push({ name: "Dage the Evil Insignia", itemId: "dage-the-evil-insignia", quantity: 31, source: "https://aqwwiki.wikidot.com/dage-challenge-merge" });
      route.farmModes = [
        { id: "standard", label: "Farm thông thường", questIds: ids, questRuns: Object.fromEntries(ids.map((id,i) => [id,counts[i]])), materials: traditional, finishingTasks: [] },
        { id: "insignia", label: "Farm bằng Insignia", questIds: [weekly,...ids], questRuns: { [weekly]: 7, ...Object.fromEntries(ids.map(id => [id,1])) },
          materials: sumMaterials([{rows:remaining},{...quests[weekly],numberOfRuns:7}]), finishingBeforeQuestId: ids[3], finishingTasks: [
            ...[["revenant-s-spellscroll",19],["exalted-crown",9],["conquest-wreath",3]].map(([id,runs]) => ({ ...materialSources[id].tasks.find(task => !task.quest), numberOfRuns: runs })),
          ], insignia: { name: "Dage the Evil Insignia", quantity: 31, perQuest: 5, questCompletions: 7, bossId: "ultra-dage", bossName:"Ultra Dage", quest:quests[weekly].quest,npc:quests[weekly].npc,map: "/join ultradage", repeatability: "weekly" },
          notes: ["Tính cho người chưa mở Legion Fealty 4: vẫn làm LF1, LF2, LF3 mỗi Quest một lần để mở khóa.",
            "Đổi thêm 19 Spellscroll, 9 Crown và 3 lượt Wreath (nhận 6, dư 1). Cần 31 Insignia; 7 weekly nhận 35, còn dư 4 Insignia.",
            "Legion Token tổng 5.550 gồm 4.000 cho LF3 và 1.550 cho các lượt đổi. Các nguyên liệu LF1–3 một lượt vẫn bắt buộc."] },
      ];
    }
    if (!route.farmModes) {
      const sources = (route.insigniaSources || []).filter(source => source.scope === "direct" && source.status !== "PENDING_SOURCE");
      if (sources.length) {
        const weekly=sources.flatMap(source=>{
          const matches=questRows.filter(row=>row.page.url===source.sourcePage&&row.q.name===source.quest);
          return matches.length===1?[{id:register(matches[0]),runs:Math.ceil(source.quantity/source.rewardQuantity)}]:[];
        });
        route.farmModes=[{id:"insignia",label:"Farm bằng Insignia",questIds:[...weekly.map(q=>q.id),...route.questWorkflowIds],
          questRuns:Object.fromEntries(weekly.map(q=>[q.id,q.runs])),
          materials:sumMaterials([{rows:materialLeaves(route.materialTree)},...weekly.map(q=>({...quests[q.id],numberOfRuns:q.runs}))]),
          finishingTasks:(route.farmTasks || []).filter(task=>!task.quest),
          insignias:sources.map(source=>({...source,perQuest:source.rewardQuantity,questCompletions:Math.ceil(source.quantity/source.rewardQuantity)}))}];
      }
    }
  };

  for (const item of items) {
    item.acquisitionRoutes = item.acquisitionRoutes.filter(route => {
      if (!nostalgia.test(route.location || "")) return true;
      const leaves = materialLeaves(route.materialTree);
      const onlyNostalgia = !cleanLocation(route.location) || /dual wield|nostalgia/i.test(route.location.split(" - ")[0]) ||
        (route.method === "Merge" && leaves.length === 1 && /dual /i.test(leaves[0].name));
      if (onlyNostalgia) { audit.removedRoutes.push({ itemId: item.id, routeId: route.id, previous: route }); return false; }
      audit.cleanedRoutes.push({ itemId: item.id, routeId: route.id, before: route.location });
      route.location = cleanLocation(route.location); return true;
    });
    if(item.acquisitionBrief && nostalgia.test(JSON.stringify(item.acquisitionBrief))) {
      (audit.cleanedBriefs ||= []).push({itemId:item.id,previous:structuredClone(item.acquisitionBrief)});
      item.acquisitionBrief.location=cleanLocation(item.acquisitionBrief.location);
      item.acquisitionBrief.text=item.acquisitionRoutes.map(route=>`${route.method}: ${route.npc || route.location || item.name}`).join("; ") || "Chưa xác minh được cách nhận thông thường.";
      if(!item.acquisitionRoutes.length){item.acquisitionBrief.status="pending";item.acquisitionBrief.kind="Unknown";item.acquisitionBrief.reason="Chưa xác minh được cách nhận thông thường.";}
      if(item.acquisitionBrief.sourceQuotes)item.acquisitionBrief.sourceQuotes=item.acquisitionBrief.sourceQuotes.filter(quote=>!nostalgia.test(quote));
    }
    if (item.wikiDetails && nostalgia.test(item.wikiDetails.location || "")) item.wikiDetails.location = cleanLocation(item.wikiDetails.location);
    for (const route of item.acquisitionRoutes) {
      route.guidePaths = (route.guidePaths || []).map(path => ({ ...path, steps: path.steps.filter(step => !nostalgia.test(step.text + " " + step.title)) })).filter(path => path.steps.length);
      if (nostalgia.test(route.description || "")) route.description = null;
      const reviewed = (route.farmTasks || []).map(useReviewedTask).filter(Boolean);
      const rewardMatches = questRows.filter(row => outputs(row.q).some(reward => reward.wikiUrl === item.wikiUrl));
      if(route.method==="Other" && !route.questReward && !route.questAlternatives?.length && rewardMatches.length){
        route.method="Quest";
        if(rewardMatches.length===1)route.questReward=rewardMatches[0].q.name;
        else route.questAlternatives=rewardMatches.map(row=>({quest:row.q.name,npc:row.q.npc,sources:[row.page.url]}));
        for(const row of rewardMatches)if(!route.sources.some(source=>source.url===row.page.url))route.sources.push({url:row.page.url,label:"AQW Wiki",sourceType:"wiki"});
      }
      const finish = route.questReward ? rewardMatches.filter(row => row.q.name.toLowerCase() === route.questReward.toLowerCase()) : [];
      const alternatives = (route.questAlternatives || []).flatMap(option => byName(option.quest).filter(row => option.sources.includes(row.page.url)));
      const shopUnlocks=[];
      if(["Shop","Merge"].includes(route.method)) {
        const page=pages.get(item.wikiUrl);
        for(const link of page?.locationLinks || []) {
          const shop=pages.get(link.url);
          for(const line of (shop?.text || "").split("\n").filter(line=>/Must have completed/i.test(line))) {
            for(const name of [...new Set((shop.itemLinks || []).filter(link=>line.includes("'"+link.name+"'")).map(link=>link.name))]) {
              const links=(shop.itemLinks || []).filter(link=>link.name===name);
              const matches=byName(name).filter(row=>links.some(link=>link.url===row.page.url));
              if(matches.length===1)shopUnlocks.push(matches[0]);
            }
          }
        }
      }
      const terminal = [...finish, ...alternatives,...shopUnlocks].map(register);
      route.questWorkflowIds = ordered(reviewed.length ? reviewed : terminal);
      route.questFinishIds = terminal;
      if (alternatives.length > 1) route.questOptions = alternatives.map(row => ({ name: row.q.name, questId: register(row), workflowIds: ordered([register(row)]) }));
      route.operationGroups = [];
      let waiting = [];
      for (const task of route.farmTasks || []) {
        if (!task.quest) waiting.push(task);
        else if (waiting.length) {
          const next = useReviewedTask(task);
          route.operationGroups.push({ beforeQuestId: next, tasks: waiting }); waiting = [];
        }
      }
      // NPC/map and public summary belong to the receiving Quest, not its ingredients.
      if (route.questWorkflowIds.length) {
        const last = quests[terminal[0] || route.questWorkflowIds.at(-1)];
        if (last?.npc) route.npc = last.npc;
        if (last?.map && route.method === "Quest") route.mapCommand = last.map;
      }
      if (route.description) route.description = route.description.replace(/theo nguyên liệu và phương án AND\/OR của tuyến này\.?/g, "");
      if (!route.farmTasks?.some(task=>!task.quest) && ["Merge","Shop","Drop"].includes(route.method)) route.completionTasks=[{
        id:"receive-"+item.id+"-"+route.id,quest:null,title:route.method==="Merge"?`Merge ${item.name}`:route.method==="Shop"?`Mua ${item.name}`:`Nhận ${item.name}`,
        source:item.wikiUrl,npc:route.npc,map:route.mapCommand,location:route.location,preconditions:(route.prerequisites || []).map(requirement=>requirement.value),requirements:[],
        rows:materialLeaves(route.materialTree),reward:item.name,purchase:route.purchase,dropSource:route.dropSource,
      }];
      makeModes(item, route);
      route.materialTotalsComplete=["void-highlord-class","legion-revenant-class","celestial-pirate-commander","polly-roger"].includes(item.id);
    }

  }
  // A verified, single acquisition workflow for an owned canonical prerequisite
  // is shared by reference, including BLoD -> Drakath -> Ascended ownership.
  for (const task of Object.values(quests)) for (const owned of task.ownedItems || []) {
    const prerequisite = items.find(item=>item.wikiUrl===owned.wikiUrl);
    if(prerequisite?.acquisitionRoutes.length===1) {
      const ids=prerequisite.acquisitionRoutes[0].questWorkflowIds || [];
      task.dependencies=[...new Set([...(task.dependencies || []),...ids.filter(id=>id!==task.id)])];
    }
  }
  const operationGroups = {};
  for(const item of items) for(const route of item.acquisitionRoutes) for(const group of route.operationGroups || [])
    operationGroups[group.beforeQuestId]=group.tasks;
  for(const item of items) for(const route of item.acquisitionRoutes) {
    route.questWorkflowIds=ordered(route.questWorkflowIds);
    for(const option of route.questOptions || [])option.workflowIds=ordered(option.workflowIds);
    for(const mode of route.farmModes || []){
      const selected=new Set(mode.questIds);
      mode.questIds=ordered(mode.questIds);
      const unlocks=mode.questIds.filter(id=>!selected.has(id)).map(id=>({...quests[id],numberOfRuns:mode.questRuns[id] || 1}));
      mode.materials=sumMaterials([{rows:mode.materials},...unlocks]);
    }
  }
  applyDirectUltraGroups(items,pages,audit);
  const materials = {}, materialLinks = {}, profileSeen = new Set();
  const linksByName = new Map();
  for(const page of pages.values()) for(const link of page.itemLinks || []) {
    const urls=linksByName.get(link.name)||new Set();urls.add(link.url);linksByName.set(link.name,urls);
  }
  const needed = items.flatMap(item => item.acquisitionRoutes.flatMap(route => [
    ...materialLeaves(route.materialTree), ...(route.farmTasks || []).flatMap(task => task.rows),
  ]));
  for (const {q} of questRows) needed.push(...q.required, ...(q.ownedItems || []));
  // Prefer exact resource links over name-only recipe rows. A name can also
  // link to a quest/NPC elsewhere on the Wiki page.
  needed.sort((a,b)=>Number(Boolean(b.wikiUrl))-Number(Boolean(a.wikiUrl)));
  for (let index = 0; index < needed.length; index++) {
    const row = needed[index], id = row.itemId || materialId(row.name);
    if (profileSeen.has(id)) continue;
    profileSeen.add(id);
    let url = row.wikiUrl;
    if (!url) {
      const matches = [...(linksByName.get(row.name) || [])];
      if (matches.length === 1) url = matches[0];
    }
    const page = pages.get(url);
    if(url)materialLinks[id]=url;
    const producers = (byReward.get(url) || []).filter(entry => !entry.page.url.includes("story:"));
    const distinct = [...new Map(producers.map(entry=>[entry.page.url+entry.q.name,entry])).values()];
    if (distinct.length) {
      materials[id] = {name:row.name,method:"Quest",questIds:distinct.map(register),tasks:[],sourceUrl:url};
    }
    if (!page) continue;
    const recipe = page.mergeRecipes?.length===1 && page.mergeRecipes[0].status==="explicit-list" ? page.mergeRecipes[0].tree : null;
    const locations = (page.locationLinks || []).flatMap(link=>{
      const directMap = mapFor(pages.get(link.url));
      return directMap ? [{map:directMap,label:link.name}] : [];
    });
    const shop = (page.locationLinks || []).map(link=>pages.get(link.url)).find(candidate=>candidate && /^Locations?:/m.test(candidate.text));
    if (recipe) {
      const inputs = materialLeaves(recipe); needed.push(...inputs);
      materials[id] = {name:row.name,method:distinct.length?"Quest / Merge":"Merge",questIds:distinct.map(register),tasks:[{id:"material-merge-"+id,quest:null,title:row.name,source:page.url,
        npc:shop?.text.match(/^Location:\s*(.+?) - /m)?.[1] || null, map:locations.length===1?locations[0].map:null,
        location:page.location,preconditions:(shop?.text || "").split("\n").filter(line=>/^Must |^Requires /.test(line)),requirements:[],
        rows:inputs,reward:row.name+" ×1",rewardQuantity:1}],sourceHash:page.sourceHash};
    } else {
      const direct=page.text.match(/^Price: N\/A \(Dropped by (.+)\)$/m)?.[1];
      const monsters=direct || page.droppedBy?.map(monster=>monster.name).join(", ");
      const price=page.price?.match(/^([\d,]+) (Gold|ACs?)$/);
      if(price){
        const shopTasks=buildFarmPurchaseTasks(page, pages, row.name, id);
        materials[id]={name:row.name,method:distinct.length?"Quest / Shop":"Shop",questIds:distinct.map(register),tasks:shopTasks,sourceHash:page.sourceHash};
      }
      if(monsters){
        const wholeMap=direct?.match(/^any monster in (.+)$/i)?.[1];
        const dropRows=direct?[{name:row.name,quantity:null,monster:direct,map:locations.find(location=>location.label===wholeMap)?.map || (locations.length===1?locations[0].map:null),source:page.url}]:page.droppedBy.flatMap(monster=>{
          const monsterPage=pages.get(monster.wikiUrl);
          const farmMaps=[...new Set((monsterPage?.locationLinks || []).map(link=>mapFor(pages.get(link.url))).filter(Boolean))];
          return (farmMaps.length?farmMaps:[null]).map(map=>({name:row.name,quantity:null,monster:monster.name,map,source:page.url,monsterSource:monster.wikiUrl}));
        });
        materials[id]={name:row.name,method:distinct.length?"Quest / Drop":"Drop",questIds:distinct.map(register),tasks:dropRows.map((drop,index)=>({id:"material-drop-"+id+index,quest:null,title:drop.monster,
          source:page.url,preconditions:page.text.split("\n").filter(line=>/^Must |^Requires /.test(line)),requirements:[],
          rows:[drop],reward:row.name})),sourceHash:page.sourceHash};
      }
    }
  }
  // Each batch audits a distinct set of identities. Incomplete evidence remains
  // explicit; a cached item page alone can never promote an item to DONE.
  const previous = new Map(read(`${base}/FARM_CANONICAL_QUEST_WORKFLOWS.json`).records.map(record => [record.canonicalId, record]));
  const unfinished=items.filter(item=>previous.get(item.id)?.status!=="DONE");
  const batchCount=Math.ceil(unfinished.length/25), size=Math.floor(unfinished.length/batchCount), remainder=unfinished.length%batchCount;
  let offset=0;
  for (let batch=0;batch<batchCount;batch++) {
    const count=size+(batch<remainder?1:0);
    audit.batches.push({ batch: batch+1,
    items: unfinished.slice(offset,offset+count).map(item => ({ id: item.id, status: previous.get(item.id)?.status || "PENDING",
      image: item.image ? "verified-existing" : "BLOCKED", workflows: item.acquisitionRoutes.map(route => ({ id: route.id, quests: route.questWorkflowIds.length,
        missing: route.questWorkflowIds.flatMap(id => quests[id].unresolvedDependencies || []) })) })) });
    offset+=count;
  }
  return { registry: { schemaVersion: 1, quests, materials, materialLinks, operationGroups }, audit, pages, ordered, quests, useReviewedTask };
}
