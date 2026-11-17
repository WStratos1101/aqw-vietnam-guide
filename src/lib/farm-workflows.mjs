export function workflowTasks(route, registry, modeId = "standard", optionId) {
  const mode = route.farmModes?.find(mode => mode.id === modeId) || route.farmModes?.[0];
  const option = route.questOptions?.find(option => option.questId === optionId) || route.questOptions?.[0];
  return (option?.workflowIds || mode?.questIds || route.questWorkflowIds || []).map(id => {
    const task = registry.quests[id];
    return task && { ...task, numberOfRuns: mode?.questRuns?.[id] ?? task.numberOfRuns };
  }).filter(Boolean);
}

export function sumMaterials(tasks) {
  const result = new Map();
  const acquisitions = new Map(), unshared = [];
  for (const task of tasks) {
    if (!task.sectionIdentity || !task.sourceHash || task.rewardChoices?.length || task.randomChoiceRewards?.length) { unshared.push(task); continue; }
    const key = JSON.stringify([task.source,task.sectionIdentity,task.rows]);
    const previous = acquisitions.get(key);
    if (!previous || (task.numberOfRuns ?? 1) > (previous.numberOfRuns ?? 1)) acquisitions.set(key,task);
  }
  for (const task of [...unshared,...acquisitions.values()]) for (const row of task.rows) {
    if(row.usage === "owned" || row.temporary === true || row.role === "tempQuestItem" || task.numberOfRuns === 0)continue;
    const id = row.itemId || materialId(row.name);
    const previous = result.get(id);
    const total = row.quantity == null ? null : row.quantity * (task.numberOfRuns || 1);
    result.set(id, { ...row, itemId: id, quantity: previous?.quantity == null && previous ? null : total == null ? null : total + (previous?.quantity || 0) });
  }
  return [...result.values()];
}

export function voidHighlordMix(dailyRuns) {
  if (!Number.isInteger(dailyRuns) || dailyRuns < 0 || dailyRuns > 15) throw Error("Daily runs must be an integer from 0 to 15");
  const exchanges = Math.ceil((15 - dailyRuns) / 2);
  return { dailyRuns, exchanges, insignia: exchanges * 5, weeklyCompletions: exchanges,
    roentgenium: dailyRuns + exchanges * 2, excess: dailyRuns + exchanges * 2 - 15 };
}
import { materialId } from "./material-requirements.mjs";

// Identify the exchange/reward, rather than treating every Ultra drop as Insignia.
export function usesInsignia(task) {
  return /\binsignia\b/i.test([task.reward, ...(task.rows || []).map(row => row.name),
    ...(task.fixedRewards || []).map(row => row.name), ...(task.rewardChoices || []).map(row => row.name)].join(" "));
}
export function materialTasksForMode(tasks, modeId = "standard") {
  return modeId === "insignia" ? tasks : tasks.filter(task => !usesInsignia(task));
}
export function materialFarmMaps(row, tasks, modeId) {
  return [...new Set(materialTasksForMode(tasks, modeId).flatMap(task => task.quest ?
    (modeId === "insignia" && task.bossId && task.map &&
      ((task.fixedRewards || []).some(reward=>reward.name===row.name) || task.reward?.startsWith(row.name+" ×")) ? [task.map] : []) :
    task.rows.filter(input => input.name === row.name && input.monster && input.map).map(input => input.map)))];
}
export function distinctFarmText(values, alreadyShown = []) {
  const key = text => text?.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
  const seen = new Set(alreadyShown.filter(Boolean).map(key));
  return values.filter(value => { const normalized = key(value); if (!normalized || seen.has(normalized)) return false; seen.add(normalized); return true; });
}

export function mainWorkflowTasks(route, registry, modeId, optionId) {
 const tasks=workflowTasks(route,registry,modeId,optionId);
 return route.questGraph?tasks.filter(task=>route.questGraph.some(node=>node.questId===task.id&&node.display==='stepper')):tasks;
}
export function reachableMaterialRows(direct, profiles) {
 const rows=new Map(),pending=[...direct];
 for(let index=0;index<pending.length;index++){
  const row=pending[index],id=row.itemId||materialId(row.name);
  if(rows.has(id))continue;
  rows.set(id,row);
  for(const task of profiles[id]?.tasks||[])pending.push(...(task.rows||[]));
 }
 return [...rows.values()];
}
export function finalReceiptTasks(route,registry,mode) {
 return (route.questGraph||[]).filter(node=>node.display==='finalReceipt').map(node=>registry.quests[node.questId]).filter(Boolean).map(task=>({...task,numberOfRuns:mode?.questRuns?.[task.id]??1}));
}
export function farmTimeLabel(time) {
 if(!time||time.kind!=='gated'||!time.requiredRuns||!['daily','weekly','monthly'].includes(time.period))return null;
 return `${time.requiredRuns} lượt ${time.period==='daily'?'Daily':time.period==='weekly'?'Weekly':'Monthly'} (${time.scope})`;
}
