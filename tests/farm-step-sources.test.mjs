import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { parseFarmReviewPage } from '../scripts/lib/farm-review-parser.mjs';
import { mainWorkflowTasks, finalReceiptTasks } from '../src/lib/farm-workflows.mjs';
import { stepCases, stepSources } from './fixtures/farm-step-cases.mjs';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const catalog = read('src/content/farm/catalog-v2.generated.json');
const registry = read('src/content/farm/quest-workflows.generated.json');
const raw = new Map(stepSources.map(s => {
  const html = fs.readFileSync(s.file, 'utf8');
  assert.equal(createHash('sha256').update(html).digest('hex'), s.hash, s.file);
  return [s.url, parseFarmReviewPage(html, s.url).quests];
}));
for (const spec of stepCases) test(`source → production steps: ${spec.itemId}/${spec.modeId || 'default'}`, () => {
  const route = catalog.items.find(i => i.id === spec.itemId).acquisitionRoutes.find(r => r.id === spec.routeId);
  const tasks = mainWorkflowTasks(route, registry, spec.modeId);
  for(const name of spec.conditionNames||[]){
    const condition=route.questGraph.find(node=>registry.quests[node.questId]?.quest===name);
    assert.equal(condition?.display,"condition",name);
    assert.ok(raw.get(registry.quests[condition.questId].source)?.some(q=>q.name===name));
  }
  assert.deepEqual(tasks.map(t => t.quest), spec.names);
  assert.equal(new Set(tasks.map(t => t.id)).size, spec.names.length);
  for (const task of tasks) {
    const source = raw.get(task.source)?.find(q => q.name === task.quest);
    assert.ok(source, task.quest + ' in raw Wiki');
    assert.deepEqual(task.rows.map(r => [r.name, r.quantity]), source.required.map(r => [r.name, r.quantity]));
    assert.ok(task.rows.length || task.reward, 'no empty task');
  }
});
test('LR Wiki has four quests: three material farms plus a separate final class receipt', () => {
  const quests = raw.get(stepSources[0].url);
  assert.deepEqual(quests.map(q => q.name), ['Legion Fealty 1','Legion Fealty 2','Legion Fealty 3','Legion Fealty 4']);
  assert.deepEqual(Object.fromEntries(quests[3].required.map(r => [r.name,r.quantity])), { 'Exalted Crown':10, "Revenant's Spellscroll":20, 'Conquest Wreath':6 });
  assert.ok(quests[3].fixedRewards.some(r => r.name === 'Legion Revenant (Class)'));
  const route = catalog.items.find(i => i.id === 'legion-revenant-class').acquisitionRoutes[0];
  assert.deepEqual(finalReceiptTasks(route,registry).map(q => q.quest), ['Legion Fealty 4']);
  const site = read('Update/_farm-sources/pages/e7317b7f2896a658ccb66288cb76c0c1bb463d0e5950cb40c916e200acc17dd8.json');
  for (const label of ['LF1 tricks','LF2 tricks','LF3 tricks','Legion Fealty 4']) assert.ok(site.text.includes(label));
  const docs = fs.readFileSync('Update/AQW_Farm_Inventory_V3/FARMING_ITEM_GUIDE_SOURCE.txt','utf8');
  for (const label of ['Legion Fealty 1 Quest','Legion Fealty 2 Quest','Legion Fealty 3 Quest','Sau khi hoàn thành “Legion Fealty 4”']) assert.ok(docs.includes(label));
});
