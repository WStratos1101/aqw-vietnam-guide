import fs from 'node:fs';
import assert from 'node:assert/strict';
import { materialId } from '../../src/lib/material-requirements.mjs';
import { materialQuestConditions, materialTableHeaders } from '../../src/lib/farm-material-table.mjs';
import { materialTasksForMode } from '../../src/lib/farm-workflows.mjs';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const registry = read('src/content/farm/quest-workflows.generated.json');
const profiles = {...registry.materials, ...read('content-sources/farm/material-guides.json'), ...read('src/content/farm/material-sources.generated.json')};
export function expectedMaterialHeaders(rows, modeId) {
  const hasConditions = rows.some(row => {
    const id = row.itemId || materialId(row.name), profile = profiles[id];
    const additional = registry.materials?.[id];
    const tasks = [...(profile?.tasks || []), ...(additional?.tasks || []), ...(additional?.questIds || []).map(id => registry.quests[id]).filter(Boolean)];
    return materialQuestConditions(row, materialTasksForMode(tasks, modeId)).some(path => path.length);
  });
  return materialTableHeaders(hasConditions);
}
// This function is evaluated inside the browser; keep it closure-free.
export function inspectMaterialTable(wrapper) {
  const bounds = wrapper.getBoundingClientRect(), table = wrapper.querySelector('table');
  const url = new URL(location.href);
  const cells = [...table.querySelectorAll('th,td')].map(cell => {
    const style = getComputedStyle(cell), rect = cell.getBoundingClientRect();
    return { text: cell.textContent.trim(), column: cell.cellIndex + 1, header: cell.tagName === 'TH',
      width: rect.width, left: rect.left, right: rect.right, scrollWidth: cell.scrollWidth, clientWidth: cell.clientWidth,
      textAlign: style.textAlign, whiteSpace: style.whiteSpace, wordBreak: style.wordBreak, overflowWrap: style.overflowWrap,
      fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, lineHeight: style.lineHeight, padding: style.padding, border: style.border, background: style.backgroundColor };
  });
  const quantities = cells.filter(cell => cell.column === 2);
  const maxScroll = wrapper.scrollWidth - wrapper.clientWidth, before = wrapper.scrollLeft;
  wrapper.scrollLeft = maxScroll;
  const reached = wrapper.scrollLeft;
  wrapper.scrollLeft = before;
  const checks = {
    nonEmpty: table.querySelectorAll('tbody tr').length > 0,
    quantityAlignment: quantities.every(cell => cell.textAlign === 'right'),
    quantityNoWrap: quantities.every(cell => cell.whiteSpace === 'nowrap'),
    quantityWidth: quantities.every(cell => cell.width >= 80),
    quantityNotClipped: quantities.every(cell => cell.scrollWidth <= cell.clientWidth + 1),
    wordWrapping: cells.every(cell => cell.wordBreak === 'normal' && cell.overflowWrap === 'normal'),
    scrollContained: maxScroll <= 1 || /auto|scroll/.test(getComputedStyle(wrapper).overflowX),
    scrollReachable: maxScroll <= 1 || reached >= maxScroll - 1,
    noPageOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
  };
  return { itemId: document.querySelector('[data-item-id]')?.getAttribute('data-item-id'),
    routeId: url.searchParams.get('farm-route'), modeId: url.searchParams.get('farm-mode') || 'standard',
    viewport: {width: innerWidth, height: innerHeight}, theme: document.documentElement.dataset.theme,
    columnCount: table.querySelectorAll('thead th').length, headers: [...table.querySelectorAll('thead th')].map(cell => cell.textContent.trim()),
    wrapper: {left: bounds.left, right: bounds.right, width: bounds.width, clientWidth: wrapper.clientWidth, scrollWidth: wrapper.scrollWidth, maxScroll, reached},
    tableWidth: table.getBoundingClientRect().width, cells, checks,
    oldQuantityInsideViewport: quantities.every(cell => cell.left >= bounds.left - 1 && cell.right <= bounds.right + 1),
  };
}
export async function checkMaterialTable({ wrapper, rows, modeId, record = () => {} }) {
  const expectedHeaders = expectedMaterialHeaders(rows, modeId);
  const diagnostic = await wrapper.evaluate(inspectMaterialTable);
  diagnostic.expectedHeaders = expectedHeaders;
  diagnostic.checks.headerCount = diagnostic.columnCount === expectedHeaders.length;
  diagnostic.checks.headerOrder = JSON.stringify(diagnostic.headers) === JSON.stringify(expectedHeaders);
  diagnostic.checks.rowCount = diagnostic.cells.filter(cell => !cell.header && cell.column === 1).length === rows.length;
  record(diagnostic);
  const failed = Object.entries(diagnostic.checks).filter(([, pass]) => !pass).map(([name]) => name);
  if (failed.length) console.error('MATERIAL_TABLE_DIAGNOSTIC', JSON.stringify(diagnostic, null, 2));
  assert.deepEqual(failed, [], `material table: ${failed.join(', ')}; ${JSON.stringify({item:diagnostic.itemId,route:diagnostic.routeId,viewport:diagnostic.viewport})}`);
}
