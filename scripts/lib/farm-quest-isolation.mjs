import { materialId, materialLeaves } from '../../src/lib/material-requirements.mjs';
import { planAcquisitions } from '../../src/lib/farm-acquisition-plan.mjs';

export const canonicalWiki = url => String(url || '').replace(/^http:/, 'https:').split(/[?#]/)[0].replace(/\/$/, '');
const outputs = q => [...(q.fixedRewards || []), ...(q.rewardChoices || q.choiceRewards || []), ...(q.randomRewards || []), ...(q.randomChoiceRewards || [])];
const rowKey = r => r.wikiUrl ? canonicalWiki(r.wikiUrl) : r.itemId || materialId(r.name);
const sameRows = (a, b) => a.length === b.length && a.every(r => b.some(s => r.name === s.name && r.quantity === s.quantity));
const unique = rows => [...new Map(rows.map(r => [rowKey(r), r])).values()];
// Keep full extraction provenance in the shared registry and audit, not copied
// into every item detail row. The browser needs only these display/identity facts.
const publicRow = r => ({name:r.name,itemId:r.itemId||materialId(r.name),quantity:r.quantity,
  ...Object.fromEntries(['wikiUrl','source','monster','map','requiredQuest','usage','temporary','role'].filter(k=>r[k]!=null).map(k=>[k,r[k]])),
  ...(r.sourceDetails?.length?{sourceDetails:r.sourceDetails.map(s=>({kind:s.kind,monster:s.monster,mapJoin:s.mapJoin,requiredQuest:s.requiredQuest}))}: {})});

// An audit is a review of the evidence available offline, not a certification of
// absent sources. Quarantined rows remain in the audit with their full provenance.
export function isolateFarmQuests(items, registry, pages) {
  const records = [];
  const verified = task => {
    const page = pages.get(canonicalWiki(task.source));
    const panels = (page?.quests || []).filter(q => q.name === task.quest &&
      (!task.sectionIdentity || q.sectionIdentity === task.sectionIdentity) &&
      (!task.location || (q.location || q.locationNames?.join(' · ')) === task.location || q.locationNames?.includes(task.location)));
    return page && task.npc && task.location && page.sourceHash === task.sourceHash && panels.length === 1 && sameRows(task.rows || [], panels[0].required) ? panels[0] : null;
  };
  const definitions={}, materialNames=new Map();
  for(const task of Object.values(registry.quests))for(const row of task.rows||[]){
    const monster=pages.get(canonicalWiki(row.monsterWikiUrl));
    if(monster?.sourceHash&&(monster.temporaryDrops||[]).some(drop=>drop.name===row.name&&drop.requiredQuest===task.quest)){
      row.temporary=true;row.requiredQuest=task.quest;
      row.temporaryEvidence={sourceUrl:monster.url,sourceHash:monster.sourceHash,quest:task.quest};
    }
  }
  const identity=row=>canonicalWiki(row.wikiUrl || registry.materialLinks?.[row.itemId || materialId(row.name)]) || 'material:'+materialId(row.name);
  const planRow=row=>{const id=identity(row);materialNames.set(id,row);return {...row,kind:'item',itemId:id};};
  for(const task of Object.values(registry.quests)){
    if(!verified(task))continue;
    const rewards=[...(task.fixedRewards||[]).map(r=>({...r,kind:'fixed'})),...(task.rewardChoices||[]).map(r=>({...r,kind:'choice'}))].filter(r=>r.wikiUrl);
    if(!rewards.length)continue;
    definitions[task.id]={id:task.id,status:'verified',repeatability:task.repeatability,
      rewards:rewards.map(r=>({itemId:identity(r),quantity:r.quantity,kind:r.kind})),
      materialTree:{kind:'allOf',requirements:[...task.rows.map(planRow),...(task.ownedItems||[]).map(r=>planRow({...r,quantity:1,usage:'owned'}))]}};
  }
  for(const profile of Object.values(registry.materials||{}))for(const task of profile.tasks||[]){
    if(task.quest || task.purchase || !task.rewardQuantity || !task.title)continue;
    const source=pages.get(canonicalWiki(task.source));
    const recipe=source?.mergeRecipes?.length===1&&source.mergeRecipes[0].status==='explicit-list'?source.mergeRecipes[0].tree:null;
    if(!recipe||!sameRows(task.rows,materialLeaves(recipe)))continue;
    const id='merge:'+canonicalWiki(task.source);
    definitions[id]={id,status:'verified',rewards:[{itemId:canonicalWiki(task.source),quantity:task.rewardQuantity,kind:'fixed'}],materialTree:{kind:'allOf',requirements:materialLeaves(recipe).map(planRow)}};
  }
  for (const item of items) for (const route of item.acquisitionRoutes) {
    const original = structuredClone({ materialTree: route.materialTree, farmTasks: route.farmTasks,
      questWorkflowIds: route.questWorkflowIds, questGraph: route.questGraph, farmModes: route.farmModes,
      completionTasks: route.completionTasks, materialTotalsComplete: route.materialTotalsComplete });
    const allIds = [...new Set([...(route.questWorkflowIds || []), ...(route.questFinishIds || []),
      ...(route.farmModes || []).flatMap(m => m.questIds)])];
    const tasks = allIds.map(id => registry.quests[id]).filter(Boolean);
    const itemPage = pages.get(canonicalWiki(item.wikiUrl));
    const rewardTasks = tasks.filter(t => verified(t) && outputs(t).some(r => canonicalWiki(r.wikiUrl) === canonicalWiki(item.wikiUrl)));
    const finishIds = new Set(route.questFinishIds || []);
    let roots = rewardTasks.filter(t => finishIds.has(t.id));
    if (!roots.length && rewardTasks.length === 1) roots = rewardTasks;
    const receivingQuest = roots.length === 1 ? roots[0] : null;
    const isQuest = route.method === 'Quest';
    const exactRecipe = itemPage?.mergeRecipes?.length === 1 && itemPage.mergeRecipes[0].status === 'explicit-list' ? itemPage.mergeRecipes[0].tree : null;
    let direct = isQuest ? (receivingQuest?.rows || []) : materialLeaves(route.materialTree);
    let directVerified = isQuest ? Boolean(receivingQuest) : route.method === 'Merge' ? Boolean(exactRecipe && sameRows(direct, materialLeaves(exactRecipe))) : route.method === 'Shop' ? Boolean(itemPage?.price?.match(/^[\d,]+ (Gold|ACs?)/)) : route.method === 'Drop' ? Boolean(itemPage?.droppedBy?.length || /Dropped by/.test(itemPage?.price || '')) : false;
    if (route.method === 'Merge' && directVerified) direct = materialLeaves(exactRecipe);
    // Existing explicit scoped progression (Awe, Fealty, Radiant) has reviewed
    // role evidence; retain it. Generic completion dependencies are conditions.
    const scoped = route.questGraph || [];
    const active = new Set(scoped.filter(n => ['mainFarm','directAcquisition','insigniaSource'].includes(n.role)).map(n => n.questId));
    for (const root of roots) active.add(root.id);
    // A shop-unlocking quest is an acquisition cost only when the reviewed
    // source names that exact shop and exact Class. Other story gates stay gates.
    if (route.method === 'Shop' && item.category === 'Classes') {
      for (const t of tasks.filter(t => finishIds.has(t.id) && verified(t))) {
        const shops = (itemPage?.locationLinks || []).map(l => pages.get(canonicalWiki(l.url))).filter(Boolean);
        if (shops.some(shop => (shop.shopInventory || []).some(row => canonicalWiki(row.url) === canonicalWiki(item.wikiUrl)) &&
          shop.text.includes("'" + t.quest + "' quest to access this shop"))) {
          active.add(t.id); direct = [...direct, ...t.rows]; directVerified = true;
        }
      }
    }
    const consumed = () => [...direct, ...[...active].flatMap(id => registry.quests[id]?.rows || [])];
    // Only exact item identities connect producers. A Wiki hyperlink, a shared
    // map, an owned requirement or a previous story quest cannot create an edge.
    let grew = true;
    while (grew) {
      grew = false;
      for (const t of tasks) if (!active.has(t.id) && verified(t) && outputs(t).some(r => consumed().some(input =>
        input.wikiUrl && canonicalWiki(input.wikiUrl) === canonicalWiki(r.wikiUrl)))) {
        active.add(t.id); grew = true;
      }
    }
    for (const mode of route.farmModes || []) {
      const sources = mode.insignia ? [mode.insignia] : mode.insignias || [];
      for (const t of tasks) if (verified(t) && sources.some(s => s.quest === t.quest &&
        (canonicalWiki(s.sourcePage || s.source) === canonicalWiki(t.source) || s.bossId && s.bossId === t.bossId && s.map === t.map))) active.add(t.id);
    }
    const story = tasks.filter(t => !active.has(t.id));
    route.questGraph = allIds.map(id => {
      const previous = scoped.find(n => n.questId === id), task = registry.quests[id];
      const role = active.has(id) ? previous?.role && ['mainFarm','directAcquisition','insigniaSource'].includes(previous.role) ? previous.role : roots.some(t => t.id === id) ? 'directAcquisition' : 'mainFarm' : 'unlockCondition';
      return { questId: id, role, display: active.has(id) ? previous?.display || 'stepper' : 'condition', source: task?.source };
    });
    route.storyPrerequisites = story.filter(t=>finishIds.has(t.id)||[...active].some(id=>registry.quests[id]?.dependencies?.includes(t.id)))
      .map(t => ({questId:t.id,name:t.quest,source:t.source}));
    route.directMaterials = directVerified ? unique(direct).map(publicRow) : [];
    route.acquisitionDefinitionIds = roots.map(t => t.id);
    route.isolationStatus = directVerified ? 'VERIFIED_DIRECT' : 'UNVERIFIED';
    const reasons = [];
    if (!directVerified) reasons.push('Exact acquisition panel/recipe/variant evidence incomplete; prior rows retained in audit, excluded from direct-material guide.');
    if (story.length) reasons.push('Completion/ownership dependencies retained as conditions; excluded from acquisition materials and time.');
    if (receivingQuest && isQuest) {
      route.npc = receivingQuest.npc;
      // These are the shared canonical rewards, not the last imported item's label.
      route.acquisitionDefinitionIds = [receivingQuest.id];
    }
    if (route.questOptions?.length) {
      for (const option of route.questOptions) {
        const task = registry.quests[option.questId];
        option.directMaterials = task && verified(task) && outputs(task).some(r => canonicalWiki(r.wikiUrl) === canonicalWiki(item.wikiUrl)) ? task.rows.map(publicRow) : [];
      }
    }
    const dependencies = unique(route.directMaterials).map(r => {
      const profile = registry.materials?.[r.itemId];
      return { itemId: r.itemId, name: r.name, quantity: r.quantity, usage: r.usage || 'UNVERIFIED', temporary: r.temporary ?? null,
        source: r.source, wikiUrl: r.wikiUrl || registry.materialLinks?.[r.itemId] || null,
        nestedQuestIds: profile?.questIds || [], nestedTasks: (profile?.tasks || []).map(t => t.id),
        status: profile?.questIds?.length || profile?.tasks?.length ? 'EVIDENCE_AVAILABLE_NOT_FULLY_CERTIFIED' : 'PENDING_SOURCE' };
    });
    if(directVerified){
      const target=canonicalWiki(item.wikiUrl),id=receivingQuest?.id||'route:'+item.id+':'+route.id;
      const local={...definitions};
      if(!receivingQuest)local[id]={id,status:'verified',rewards:[{itemId:target,quantity:1,kind:'fixed'}],materialTree:{kind:'allOf',requirements:route.directMaterials.map(planRow)}};
      const plan=planAcquisitions([{itemId:target,quantity:1}],local,{routes:{[target]:id}});
      route.materialPlan={status:plan.status,gaps:plan.gaps,materials:plan.totals.map(row=>publicRow({...materialNames.get(row.itemId),name:materialNames.get(row.itemId)?.name||row.itemId,itemId:materialNames.get(row.itemId)?.itemId||row.itemId,quantity:row.quantity})),
        equivalentCosts:route.directMaterials.flatMap(row=>{
          const profile=registry.materials?.[row.itemId],purchases=(profile?.tasks||[]).filter(t=>t.purchase);
          const prices=[...new Set(purchases.map(t=>JSON.stringify(t.purchase)))];
          return prices.length===1?[{materialId:row.itemId,quantity:row.quantity,...purchases[0].purchase,total:(row.quantity||0)*purchases[0].purchase.amount,includeInMaterialTotal:false}]:[];
        })};
    }
    const previouslyCertified = route.materialTotalsComplete;
    if (!directVerified && !scoped.length) route.materialTotalsComplete = false;
    if (story.length && !scoped.length) route.materialTotalsComplete = false;
    records.push({ itemId: item.id, itemName: item.name, routeId: route.id, sourceUrl: item.wikiUrl,
      questIdentity: roots.map(t => ({ acquisitionId: t.id, sourceUrl: t.source, sourceHash: t.sourceHash, npc: t.npc,
        location: t.location, quest: t.quest, sectionIdentity: t.sectionIdentity, rewards: outputs(t), itemVariant: item.wikiUrl })),
      directMaterialsBefore: isQuest ? (original.farmTasks || []).filter(t => t.quest === route.questReward).flatMap(t => t.rows) : materialLeaves(original.materialTree),
      directMaterialsAfter: route.directMaterials,
      storyMaterialsExcluded: story.filter(t=>!scoped.length||scoped.some(n=>n.questId===t.id&&n.display!=='condition')).flatMap(t => t.rows.map(r => ({ ...r, questId: t.id, quest: t.quest, role: 'storyPrerequisite' }))),
      storyQuestIds: story.map(t => t.id), dependenciesRetained: dependencies, reasons,
      verificationStatus: directVerified ? 'VERIFIED_DIRECT_PARTIAL_DEPENDENCIES' : 'UNVERIFIED',
      plan: route.materialPlan?{status:route.materialPlan.status,gaps:route.materialPlan.gaps}:null,
      materialTotalsComplete: route.materialTotalsComplete, previouslyCertified,
      previousEvidence: story.length || !directVerified ? original : undefined });
  }
  return { schemaVersion: 1, status: 'PARTIAL', complete: false, itemsAudited: items.length, routesAudited: records.length,
    contaminatedRoutes: records.filter(r => r.storyMaterialsExcluded.length).length,
    fixedRoutes: records.filter(r => r.storyMaterialsExcluded.length).length,
    removedUnrelatedQuests: 0,
    uniqueStoryQuestsReclassified: new Set(records.flatMap(r => r.storyQuestIds)).size,
    verifiedDirectRoutes: records.filter(r => r.verificationStatus.startsWith('VERIFIED_DIRECT')).length,
    records };
}
