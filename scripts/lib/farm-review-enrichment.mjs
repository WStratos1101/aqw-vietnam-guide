import fs from "node:fs";
import { createHash } from "node:crypto";
import { materialLeaves, materialId } from "../../src/lib/material-requirements.mjs";
import { parseFarmReviewPage } from "./farm-review-parser.mjs";

const read = p => JSON.parse(fs.readFileSync(p, "utf8"));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const wiki = url => String(url || "").split(/[?#]/)[0].replace(/^http:/, "https:");
const subtypeByPath = { "/swords": "Sword", "/axes": "Axe", "/daggers": "Dagger", "/polearms": "Polearm", "/maces": "Mace", "/bows": "Bow", "/staves": "Staff", "/staffs": "Staff", "/wands": "Wand", "/guns": "Gun", "/gauntlets": "Gauntlet", "/handguns": "HandGun", "/rifles": "Rifle", "/whips": "Whip" };
const categoryByPath = { "/weapons": "Weapons", "/armors": "Armors", "/helmets-hoods": "Helms", "/helmets": "Helms", "/capes-back-items": "Capes / Back Items", "/capes": "Capes / Back Items", "/pets": "Pets", "/classes": "Classes" };
const insigniaBosses = { "Nulgath Insignia": "ultra-nulgath", "Dage the Evil Insignia": "ultra-dage", "Avatar Tyndarius Insignia": "ultra-tyndarius", "King Drago Insignia": "ultra-drago", "Malgor Insignia": "ultra-speaker", "Darkon Insignia": "darkon-the-conductor", "Ezrajal Insignia": "ultra-ezrajal", "Warden Insignia": "ultra-warden", "Engineer Insignia": "ultra-engineer" };

export function loadFarmReviewPages(root = "content-sources/farm/review") {
  if (!fs.existsSync(root + "/pages.json")) return [];
  return read(root + "/pages.json").filter(p => p.status === "read").map(page => {
    const html = fs.readFileSync(page.sourceFile, "utf8");
    if (hash(html) !== page.sourceHash) throw Error("Changed Farm Wiki snapshot: " + page.url);
    return { ...page, ...parseFarmReviewPage(html, page.url) };
  });
}

function sourceRef(url) { return { url, label: "AQW Wiki", sourceType: "wiki" }; }
function addSource(route, url) { if (!route.sources.some(s => s.url === url)) route.sources.push(sourceRef(url)); }

export function enrichFarmReview(items, pages, bosses, approvals = [], candidates = []) {
  const changes = [], conflicts = [], excluded = [], materialSources = {};
  const byUrl = new Map(pages.map(p => [wiki(p.url), p]));
  const questRows = pages.flatMap(page => page.quests.map(quest => ({ page, quest })));
  for (const [name, bossId] of Object.entries(insigniaBosses)) {
    const matches = questRows.filter(({ quest }) => quest.rewards.some(r => r.name === name));
    if (matches.length !== 1) continue;
    const { page, quest } = matches[0], boss = bosses.find(b => b.slug === bossId);
    if (!boss || !quest.npc || !quest.required.length || !quest.repeatability) continue;
    const reward = quest.rewards.find(r => r.name === name);
    // The map here belongs to the Insignia fight. It never becomes the final
    // item's receiving map. The existing Boss Codex is retained as map evidence.
    materialSources[materialId(name)] = { name, method: "Ultra Quest", bossId, bossName: boss.name,
      bossHref: "/ultra-boss/" + boss.slug, sourcePage: page.url, sourceHash: page.sourceHash,
      mapEvidence: boss.sources?.filter(s => /map|location/.test(s.id)).map(s => s.url) || [],
      tasks: [{ id: "insignia-" + materialId(name), quest: quest.name, npc: quest.npc, map: boss.joinCommand,
        location: quest.location, requirements: quest.requirements, preconditions: quest.requirements,
        reward: `${name} ×${reward.quantity}`, rewardQuantity: reward.quantity, repeatability: quest.repeatability,
        source: page.url, bossId, bossName: boss.name,
        rows: quest.required.map(row => ({ name: row.name, quantity: row.quantity, monster: row.monster || null, map: boss.joinCommand, source: page.url })) }] };
  }

  const neededNames = new Set(items.flatMap(i => i.acquisitionRoutes.flatMap(r => materialLeaves(r.materialTree))).map(n => n.name));
  for (const name of neededNames) {
    if (materialSources[materialId(name)]) continue;
    const matches = questRows.flatMap(({ page, quest }) => quest.rewards.filter(r => r.name === name).map(reward => ({ page, quest, reward })));
    // Distinct pages with the same display name can be different item variants.
    if (!matches.length || new Set(matches.map(m => wiki(m.reward.wikiUrl))).size !== 1) continue;
    materialSources[materialId(name)] = { name, method: "Quest", tasks: matches.map(({ page, quest, reward }, index) => {
      const maps = [...new Set(quest.locationLinks.filter(l => l.name === quest.location).flatMap(l => byUrl.get(wiki(l.url))?.joinCommands || []))];
      return { id: "material-quest-" + index, quest: quest.name, npc: quest.npc,
        map: maps.length === 1 ? maps[0] : null, requirements: quest.requirements, preconditions: quest.requirements,
        source: page.url, sourceHash: page.sourceHash, reward: `${name} ×${reward.quantity}`,
        ...(quest.repeatability ? { repeatability: quest.repeatability } : {}),
        rows: quest.required.map(r => ({ name: r.name, quantity: r.quantity, monster: r.monster || null, map: null, source: page.url })) };
    }) };
  }

  for (const item of items) {
    const page = byUrl.get(wiki(item.wikiUrl));
    if (page) {
      if (page.breadcrumbs.some(c => c.path === "/housing")) {
        excluded.push({ itemId: item.id, name: item.name, previousCategory: item.category,
          reason: "Wiki breadcrumb identifies a Housing item, outside the six Farm equipment categories",
          sourcePage: page.url, sourceHash: page.sourceHash, breadcrumbs: page.breadcrumbs });
        continue;
      }
      const crumbCategory = page.breadcrumbs.map(c => categoryByPath[c.path]).filter(Boolean).at(-1);
      const crumbSubtype = page.breadcrumbs.map(c => subtypeByPath[c.path]).filter(Boolean).at(-1);
      for (const [field, value] of [["category", crumbCategory], ["subtype", crumbCategory === "Weapons" ? crumbSubtype : null]]) {
        if (value === undefined || (value === null && (!crumbCategory || field !== "subtype" || !item[field])) || value === item[field]) continue;
        changes.push({ itemId: item.id, field, before: item[field] ?? null, after: value, source: page.url, sourceHash: page.sourceHash, basis: "Wiki breadcrumb" });
        item[field] = value;
      }
      item.classificationEvidence = { sourcePage: page.url, sourceHash: page.sourceHash, breadcrumbs: page.breadcrumbs, checkedAt: page.checkedAt };
    }
    const rewardMatches = questRows.filter(({ quest }) => quest.rewards.some(r => wiki(r.wikiUrl) === wiki(item.wikiUrl)));
    if (page && !item.acquisitionRoutes.length) {
      const drop = page.text.match(/^Price: N\/A \(Dropped by (.+)\)$/m);
      const recipe = page.mergeRecipes.length === 1 && page.mergeRecipes[0].status === "explicit-list" ? page.mergeRecipes[0].tree : null;
      const price = page.text.match(/^Price:\s*([\d,]+) (ACs?|Gold)\b/im);
      const quest = page.text.match(/Reward from the '(.+?)' quest/)?.[1];
      const hasQuest = quest || page.questAlternatives.length || rewardMatches.length === 1;
      const methods = [...(recipe ? ["Merge"] : []), ...(drop ? ["Drop"] : []), ...(price ? ["Shop"] : []), ...(hasQuest ? ["Quest"] : [])];
      for (const method of methods) {
        const route = { id: "wiki-reviewed-" + method.toLowerCase(), regionId: null, method,
          location: page.location === "N/A" ? null : page.location, mapCommand: null,
          steps: [], sources: [sourceRef(page.url)], materialTree: method === "Merge" ? recipe : null,
          ...(method === "Drop" ? { dropSource: drop[1], description: "Drop: " + drop[1] } : {}),
          ...(method === "Shop" ? { purchase: { amount: Number(price[1].replaceAll(",", "")), currency: /^gold$/i.test(price[2]) ? "Gold" : "ACs" } } : {}),
          ...(method === "Quest" ? { questReward: quest || rewardMatches[0]?.quest.name || null,
            questAlternatives: page.questAlternatives } : {}) };
        item.acquisitionRoutes.push(route);
        changes.push({ itemId: item.id, field: "acquisitionRoute", before: null, after: route.id, method, source: page.url, sourceHash: page.sourceHash });
      }
    }
    for (const route of item.acquisitionRoutes) {
      const imported = route.id.startsWith("ultra-");
      if (page && route.method === "Other") {
        const drop = page.text.match(/^Price: N\/A \(Dropped by (.+)\)$/m);
        const recipe = page.mergeRecipes.length === 1 ? page.mergeRecipes[0] : null;
        const method = drop ? "Drop" : page.questAlternatives.length ? "Quest" : recipe ? "Merge" : null;
        if (method) {
          changes.push({ itemId: item.id, field: "method", before: route.method, after: method, source: page.url, sourceHash: page.sourceHash });
          route.method = method;
          if (drop) { route.dropSource = drop[1]; route.description = "Drop: " + drop[1]; }
          if (page.questAlternatives.length) route.questAlternatives = page.questAlternatives;
          if (!route.materialTree && recipe?.status === "explicit-list") {
            route.materialTree = recipe.tree;
            changes.push({ itemId: item.id, field: "materials", before: null, after: recipe.tree, source: page.url, sourceHash: page.sourceHash });
          }
          addSource(route, page.url);
        }
      }
      const directQuest = rewardMatches.filter(({ quest }) => quest.name === route.questReward);
      const match = directQuest.length === 1 ? directQuest[0] : rewardMatches.length === 1 && route.method === "Quest" ? rewardMatches[0] : null;
      const hasSingleReceivingLocation = page?.location && page.location !== "N/A" &&
        page.location.split(/\r?\n/).map(value => value.trim()).filter(Boolean).length === 1;
      if (imported && hasSingleReceivingLocation) {
        route.location = page.location;
        const mapMatches = pages.filter(p => p.joinCommands.length === 1 && page.locationLinks.some(l => wiki(l.url) === wiki(p.url)));
        const maps = [...new Set(mapMatches.flatMap(p => p.joinCommands))];
        route.mapCommand = maps.length === 1 ? maps[0] : null;
        route.geographyEvidence = { sources: [page.url, ...mapMatches.map(p => p.url)], checkedAt: page.checkedAt };
      }
      if (!route.mapCommand && page && hasSingleReceivingLocation) {
        const maps = [...new Set(pages.filter(p => p.joinCommands.length === 1 && page.locationLinks.some(l => wiki(l.url) === wiki(p.url))).flatMap(p => p.joinCommands))];
        if (maps.length === 1) route.mapCommand = maps[0];
      }
      if (match) {
        const { quest, page: questPage } = match;
        if (route.method === "Quest") {
          // Explicit reward match binds this quest/NPC/location to this item.
          if (route.questReward !== quest.name) changes.push({ itemId: item.id, field: "quest", before: route.questReward, after: quest.name, source: questPage.url });
          route.questReward = quest.name;
          route.npc = quest.npc;
          if (imported || !route.location || route.location === "N/A") route.location = quest.location || route.location;
          const mapLinks = quest.locationLinks.filter(l => l.name === quest.location);
          const maps = [...new Set(mapLinks.flatMap(l => byUrl.get(wiki(l.url))?.joinCommands || []))];
          if (maps.length === 1 && (imported || !route.mapCommand)) route.mapCommand = maps[0];
          const oldTask = route.farmTasks?.find(t => t.quest === quest.name || (imported && t.id === "acquire"));
          const task = { id: oldTask?.id || "reviewed-acquire", quest: quest.name, npc: quest.npc, map: route.mapCommand,
            requirements: quest.requirements, preconditions: quest.requirements, reward: item.name,
            source: questPage.url, rows: quest.required.map(r => ({ name: r.name, quantity: r.quantity, monster: r.monster || null, map: null, source: questPage.url })) };
          // NPC location never becomes the farming map of an unknown ingredient.
          route.farmTasks = [...(route.farmTasks || []).filter(t => t.id !== task.id && !(imported && t.quest === quest.name)), task];
          addSource(route, questPage.url);
        }
      }
      // Replace copied weekly facts with the exact Wiki quest, retaining its ID
      // so source-backed guide step navigation continues to resolve.
      route.farmTasks = route.farmTasks?.map(task => {
        if (task.repeatability !== "weekly" && task.repeatability !== "daily") return task;
        const sources = Object.values(materialSources).filter(s => s.bossId && s.tasks[0].quest.toLowerCase() === task.quest?.toLowerCase());
        return sources.length === 1 ? { ...sources[0].tasks[0], id: task.id } : task;
      });
      const leaves = materialLeaves(route.materialTree).map(n => ({ ...n, scope: "direct" }));
      for (const task of route.farmTasks || [])
        for (const row of task.rows)
          if (/Insignia/.test(row.name) && !leaves.some(n => n.name === row.name && n.quantity === row.quantity))
            leaves.push({ ...row, itemId: materialId(row.name), scope: task.id });
      route.insigniaSources = leaves.filter(n => /Insignia/.test(n.name)).map(n => {
        const source = materialSources[n.itemId]?.bossId ? materialSources[n.itemId] : null;
        if (source) addSource(route, source.sourcePage);
        return { materialId: n.itemId, name: n.name, quantity: n.quantity, scope: n.scope,
          status: source ? "verified-snapshot" : "PENDING_SOURCE",
          ...(source ? { bossId: source.bossId, bossName: source.bossName, sourcePage: source.sourcePage, sourceHash: source.sourceHash, ...source.tasks[0] } : {}) };
      });
    }
    if (!item.image) {
      const approval = approvals.find(a => a.itemId === item.id);
      const candidate = candidates.find(c => c.itemId === item.id && c.status === "downloaded");
      if (approval && candidate) {
        if (!page || candidate.sourcePage !== item.wikiUrl || approval.fileHash !== candidate.fileHash ||
            candidate.sourceHash !== page.sourceHash || !page.images.some(i => i.url === candidate.originalImageUrl) ||
            hash(fs.readFileSync(candidate.candidatePath)) !== approval.fileHash)
          throw Error("Unverified Farm image approval: " + item.id);
        const path = "/images/aqw/farm-reviewed/" + candidate.candidatePath.split("/").at(-1);
        fs.mkdirSync("public/images/aqw/farm-reviewed", { recursive: true });
        fs.copyFileSync(candidate.candidatePath, "public" + path);
        item.image = item.previewImage = path;
        item.imageEvidence = { path, source: item.wikiUrl, originalImageUrl: candidate.originalImageUrl,
          fileHash: candidate.fileHash, sourceHash: page.sourceHash, verificationStatus: "verified", usageStatus: "approved",
          credit: "AdventureQuest Worlds artwork © Artix Entertainment LLC; AQW Wiki contributors", review: approval };
        item.unknownFields = item.unknownFields?.filter(f => f !== "image");
        changes.push({ itemId: item.id, field: "image", before: null, after: path, source: item.wikiUrl });
      }
    }
  }
  for (let index = items.length - 1; index >= 0; index--)
    if (excluded.some(e => e.itemId === items[index].id)) items.splice(index, 1);
  return { changes, conflicts, excluded, materialSources };
}
