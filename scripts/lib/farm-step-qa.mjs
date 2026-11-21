import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkMaterialTable, expectedMaterialHeaders } from './farm-material-table-qa.mjs';
import { mainWorkflowTasks } from '../../src/lib/farm-workflows.mjs';
import { stepCases } from '../../tests/fixtures/farm-step-cases.mjs';
export async function checkFarmSteps({ page, base, expect, screenshot, recordTable }) {
  const catalog = JSON.parse(fs.readFileSync('src/content/farm/catalog-v2.generated.json', 'utf8'));
  const registry = JSON.parse(fs.readFileSync('src/content/farm/quest-workflows.generated.json', 'utf8'));
  const coveredColumns = new Set();
  for (const spec of stepCases) {
    const route = catalog.items.find(item=>item.id===spec.itemId).acquisitionRoutes.find(route=>route.id===spec.routeId);
    const expectedTasks = mainWorkflowTasks(route, registry, spec.modeId);
    const query = new URLSearchParams({ item:spec.itemId, 'farm-route':spec.routeId, 'farm-tab':'guide' });
    if (spec.modeId) query.set('farm-mode',spec.modeId);
    await page.goto(`${base}/farm?${query}`);
    await expect(page.locator('[data-item-id]')).toHaveAttribute('data-item-id',spec.itemId);
    assert.equal(new URL(page.url()).searchParams.get('farm-route'),spec.routeId);
    if (spec.modeId) await expect(page.getByRole('button',{name:spec.modeId==='standard'?'Farm thông thường':'Farm bằng Insignia',exact:true})).toHaveAttribute('aria-pressed','true');
    const buttons=page.locator('.fv31-step-numbers button');
    await expect(buttons).toHaveCount(spec.names.length);
    await expect(buttons).toHaveText(spec.names.map((_,i)=>String(i+1)));
    for (const [i,name] of spec.names.entries()) {
      await expect(buttons.nth(i)).toHaveAttribute('title',name);
      await buttons.nth(i).click();
      await expect(buttons.nth(i)).toHaveAttribute('aria-selected','true');
      await expect(page.locator('.fv31-step-content').getByRole('heading',{name,exact:true})).toBeVisible();
      const rows = expectedTasks[i].rows;
      const material = page.locator('.fv31-step-content > .fv32-facts').filter({has:page.getByRole('heading',{name,exact:true})}).locator('.fv32-material-table').first();
      if(rows.length) {
        coveredColumns.add(expectedMaterialHeaders(rows,spec.modeId).length);
        await checkMaterialTable({wrapper:material.locator('..'),rows,modeId:spec.modeId,record:recordTable});
      }
      else await expect(material).toHaveCount(0);
    }
    if (spec.itemId==='legion-revenant-class') {
      const receipt=page.getByRole('region',{name:'Quest đang chọn',exact:true}).locator('section[aria-label="Cách nhận cuối"]');
      await expect(receipt).toHaveCount(1);
      await expect(receipt).toContainText('Legion Fealty 4');
      for (const [name,count] of [["Revenant's Spellscroll",'20'],['Conquest Wreath','6'],['Exalted Crown','10']]) await expect(receipt.locator('tr').filter({hasText:name})).toContainText(count);
      // Switch on the last selected quest: mode navigation must reset to LF1.
      const next=spec.modeId==='standard'?'Farm bằng Insignia':'Farm thông thường';
      await page.getByRole('button',{name:next,exact:true}).click();
      await expect(buttons).toHaveCount(3);
      await expect(buttons.first()).toHaveAttribute('aria-selected','true');
      await expect(page.locator('.fv31-step-content')).toContainText('Legion Fealty 1');
      await expect(page.locator('.fv31-step-content')).not.toContainText('Legion Fealty 3');
    }
  }
  assert.deepEqual([...coveredColumns].sort(),[3,4],'source fixtures must exercise both three- and four-column material tables');
  // Inspect the shared material table and two navigation levels in both themes.
  for (const theme of ['light','dark']) {
    await page.goto(`${base}/farm?item=legion-revenant-class&farm-route=wiki-location&farm-mode=insignia&farm-tab=guide`);
    await expect(page.locator('.fv32-workflow')).toBeVisible();
    if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('.theme-toggle').click();
    await page.getByRole('button',{name:'Tổng nguyên liệu',exact:true}).click();
    const totalMaterials = page.locator('details[data-aqw-material-table="total"]');
    await expect(totalMaterials).toHaveCount(1);
    await totalMaterials.locator('summary').click();
    const table=page.getByRole('region',{name:'Tổng nguyên liệu',exact:true});
    const route = catalog.items.find(item=>item.id==='legion-revenant-class').acquisitionRoutes.find(route=>route.id==='wiki-location');
    const rows = route.farmModes.find(mode=>mode.id==='insignia').materials.filter(row=>row.usage!=="owned"&&!row.temporary&&row.role!=="tempQuestItem"&&!/^(?:Gold|ACs?)$/i.test(row.name));
    await checkMaterialTable({wrapper:table, rows, modeId:'insignia', record:recordTable});
    await expect(table.locator('details')).toHaveCount(0);
    for(const picker of await page.locator('.fv32-route-picker').all()){
      assert.equal(await picker.evaluate(el=>{const s=getComputedStyle(el);return parseFloat(s.columnGap)>=8&&parseFloat(s.rowGap)>=8;}),true,'navigation gap');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'no page overflow');
    if(screenshot) {
      await screenshot('materials-'+theme);
      await table.evaluate(wrapper=>{wrapper.scrollLeft=wrapper.scrollWidth;});
      await screenshot('materials-'+theme+'-end');
      await table.evaluate(wrapper=>{wrapper.scrollLeft=0;});
    }
    await page.getByRole('button',{name:'Quest farm',exact:true}).click();
    await expect(page.locator('.fv31-step-numbers button')).toHaveCount(3);
  }

}
