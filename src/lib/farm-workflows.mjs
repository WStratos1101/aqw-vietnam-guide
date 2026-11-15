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
  for (const task of tasks) for (const row of task.rows) {
    if(row.usage === "owned" || task.numberOfRuns === 0)continue;
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
