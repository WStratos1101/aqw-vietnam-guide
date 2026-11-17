import { materialFarmMaps } from './farm-workflows.mjs';
// Each producer is an alternative acquisition path. Conditions within one
// path are conjunctive; paths remain alternatives instead of one AND list.
export function materialQuestConditions(row, tasks = []) {
  const unique = values => [...new Set(values.filter(Boolean))];
  const base = row.requiredQuest ? [row.requiredQuest] : [];
  const direct = unique((row.sourceDetails || []).map(source => source.requiredQuest));
  if (direct.length) return direct.map(name => unique([...base, name]));
  if (base.length) return [base];
  const paths = tasks.flatMap(task => {
    if (task.quest) return [[task.quest]];
    const inputs = (task.rows || []).filter(input => input.name === row.name);
    const names = unique(inputs.flatMap(input => [input.requiredQuest, ...(input.sourceDetails || []).map(source => source.requiredQuest)]));
    return names.length ? names.map(name => [name]) : [[]];
  });
  return [...new Map(paths.map(path => [JSON.stringify(path), path])).values()];
}
export function materialConditionText(paths) {
  if (!paths.some(path => path.length)) return '—';
  return paths.map(path => path.length ? path.join(' và ') : '—').join(' hoặc ');
}
export const materialTableHeaders = hasConditions => ['Tên nguyên liệu', 'Số lượng', 'Map farm', ...(hasConditions ? ['Điều kiện farm'] : [])];

export function materialTableMaps(row, tasks, modeId) {
  const profileMaps = materialFarmMaps(row, tasks, modeId);
  const sourceMaps = (row.sourceDetails || []).map(source => source.mapJoin).filter(Boolean);
  const maps = profileMaps.length ? profileMaps : sourceMaps.length ? sourceMaps : [row.map];
  return [...new Set(maps.filter(map => typeof map === 'string' && /^\/join [a-z0-9_-]+$/i.test(map)))];
}
