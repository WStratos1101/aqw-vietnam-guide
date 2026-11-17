// Plan only explicitly selected, verified acquisition definitions. Unresolved
// variants, OR branches, yields and cycles remain gaps; never invent a total.
export function planAcquisitions(targets, definitions, { routes = {}, choices = {}, owned = {} } = {}) {
  const needs = new Map(), runs = new Map(), totals = new Map(), ownership = new Map(), temporary = new Map(), gaps = [], stack = new Set();
  const producers = id => Object.values(definitions).filter(d => (d.rewards || []).some(r => r.itemId === id));
  const add = (map, id, quantity) => map.set(id, (map.get(id) || 0) + quantity);
  function rows(tree, path) {
    if (!tree) { gaps.push({path,reason:'MISSING_RECIPE'}); return []; }
    if (tree.kind === 'item') return [tree];
    if (tree.kind === 'allOf') return tree.requirements.flatMap((r,i) => rows(r,path+'.'+i));
    const selection = choices[path];
    if (tree.kind !== 'anyOf' || !Array.isArray(selection) || new Set(selection).size !== tree.requiredChoices || selection.some(i=>!Number.isInteger(i)||i<0||i>=tree.requirements.length)) {
      gaps.push({path,reason:'UNSELECTED_OR'}); return [];
    }
    return selection.flatMap(i => rows(tree.requirements[i],path+'.'+i));
  }
  function need(id, quantity) {
    if (!Number.isSafeInteger(quantity) || quantity < 0) { gaps.push({itemId:id,reason:'UNKNOWN_QUANTITY'}); return; }
    if (!quantity) return;
    const options = producers(id);
    if (!options.length) { add(totals,id,quantity); return; }
    const definition = routes[id] ? options.find(d=>d.id===routes[id]) : options.length===1 ? options[0] : null;
    if (!definition) { gaps.push({itemId:id,reason:'UNSELECTED_ROUTE'}); return; }
    if (definition.status !== 'verified') { gaps.push({itemId:id,definitionId:definition.id,reason:'UNVERIFIED_SOURCE'}); return; }
    if (stack.has(definition.id)) { gaps.push({itemId:id,definitionId:definition.id,reason:'DEPENDENCY_CYCLE'}); return; }
    const reward = definition.rewards.find(r=>r.itemId===id);
    if (!Number.isSafeInteger(reward.quantity) || reward.quantity<=0 || reward.kind==='random') { gaps.push({itemId:id,reason:'UNVERIFIED_YIELD'}); return; }
    const key = definition.id+':'+id;
    add(needs,key,quantity);
    // Fixed co-rewards share one completion. Choice rewards require separate
    // completions when different selections are requested.
    const fixed = definition.rewards.filter(r=>!r.kind||r.kind==='fixed');
    const fixedRuns = Math.max(0,...fixed.map(r=>Math.ceil((needs.get(definition.id+':'+r.itemId)||0)/r.quantity)));
    const choiceRuns = definition.rewards.filter(r=>r.kind==='choice').reduce((n,r)=>n+Math.ceil((needs.get(definition.id+':'+r.itemId)||0)/r.quantity),0);
    const requiredRuns = Math.max(fixedRuns,choiceRuns), extra = requiredRuns-(runs.get(definition.id)||0);
    if (extra<=0) return;
    runs.set(definition.id,requiredRuns); stack.add(definition.id);
    for (const r of rows(definition.materialTree,definition.id)) {
      if (r.role==='storyPrerequisite' || r.role==='unlockRequirement') continue;
      if (r.usage==='owned') { ownership.set(r.itemId,Math.max(ownership.get(r.itemId)||0,r.quantity)); continue; }
      if (r.temporary) { add(temporary,r.itemId,r.quantity*extra); continue; }
      need(r.itemId,r.quantity*extra);
    }
    stack.delete(definition.id);
  }
  for (const target of targets) need(target.itemId,Math.max(0,target.quantity-(owned[target.itemId]||0)));
  const toRows = map => [...map].map(([itemId,quantity])=>({itemId,quantity}));
  return {status:gaps.length?'UNVERIFIED':'VERIFIED_PLAN',complete:!gaps.length,totals:toRows(totals),ownedRequirements:toRows(ownership),temporaryRequirements:toRows(temporary),
    acquisitions:[...runs].map(([id,numberOfRuns])=>({id,numberOfRuns,repeatability:definitions[id].repeatability||null,
      minimumResets:['daily','weekly'].includes(definitions[id].repeatability)?Math.max(0,numberOfRuns-1):null})),gaps};
}
