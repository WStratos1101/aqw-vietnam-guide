import fs from 'node:fs';
import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePrice,
  parseClassAcquisitionPage,
  parseLinkedAcquisitionPage,
} from "../scripts/lib/class-acquisition-source.mjs";
import {
  validateMaterials,
  selectedMaterials,
} from "../src/lib/material-requirements.mjs";
const html = (body) =>
  `<div id="page-title">Example Class</div><div id="page-content">${body}</div>`;
const url = "https://aqwwiki.wikidot.com/example-class";
test("Shop price uses observed Price/currency, preserving free zero and never reading Sellback as purchase price", async () => {
  assert.deepEqual(parsePrice("2,000 AC"), {
    amount: 2000,
    currency: "AC",
    sourceText: "2,000 AC",
  });
  assert.equal(parsePrice("N/A"), null);
  assert.equal(parsePrice("2,000"), null);
  assert.equal(parsePrice("2,000 AC / 100,000 Gold"), null);
  assert.equal(parsePrice("0 AC").amount, 0);
  assert.equal(parsePrice("100,000 Gold").currency, "Gold");
  const p = await parseClassAcquisitionPage(
    html(
      '<p><strong>Location:</strong> <a href="/example-shop">Example Shop</a> - <a href="/battleon">Battleon</a><br><strong>Price:</strong> 100,000 Gold<br><strong>Sellback:</strong> 2,000 AC</p>',
    ),
    url,
  );
  assert.equal(p.methodType, "shop");
  assert.equal(p.price.amount, 100000);
  assert.equal(p.price.currency, "Gold");
  const missing = await parseClassAcquisitionPage(
    html("<p><strong>Sellback:</strong> 2,000 AC</p>"),
    url,
  );
  assert.equal(missing.price, null);
  assert.equal(missing.methodType, "other");
});
test("Quest rewards and merges cannot acquire a fabricated shop price; rare and seasonal tags remain conditional", async () => {
  const q = await parseClassAcquisitionPage(
    html(
      '<img src="https://aqwwiki.wdfiles.com/local--files/image-tags/rarelarg.png"><p><strong>Location:</strong> Map<br><strong>Price:</strong> N/A (Reward from the \'<a href="/npc-s-quests#3">Final Quest</a>\' quest)</p>',
    ),
    url,
  );
  assert.equal(q.methodType, "quest");
  assert.equal(q.price, null);
  assert.equal(q.questName, "Final Quest");
  assert.equal(q.availability, "legacy");
  const s = await parseClassAcquisitionPage(
    html(
      '<img src="https://aqwwiki.wdfiles.com/local--files/image-tags/seasonallarge.png"><p><strong>Price:</strong> 0 AC</p>',
    ),
    url,
  );
  assert.equal(s.availability, "seasonal");
  const m = await parseClassAcquisitionPage(
    html(
      '<p><strong>Price:</strong> N/A</p><ul><li>Merge the following:<ul><li><a href="/crystal">Crystal</a> x15</li></ul></li></ul>',
    ),
    url,
  );
  assert.equal(m.methodType, "merge");
  assert.equal(m.price, null);
  assert.equal(m.materials.requirements[0].quantity, 15);
  assert.equal(
    m.materials.requirements[0].source,
    "https://aqwwiki.wikidot.com/crystal",
  );
});
test("structured materials preserve OR scope and mandatory siblings; standalone ambiguous operators stay pending", async () => {
  const p = await parseClassAcquisitionPage(
    html(
      "<p><strong>Price:</strong> N/A</p><ul><li>Merge the following:<ul><li>One of the following:<ul><li>A x1</li><li>B x1</li></ul></li><li>C x2</li></ul></li></ul>",
    ),
    url,
  );
  assert.deepEqual(validateMaterials(p.materials), []);
  assert.equal(p.materials.requirements[0].kind, "anyOf");
  assert.deepEqual(
    selectedMaterials(p.materials).map((n) => n.name),
    ["A", "C"],
  );
  assert.deepEqual(
    selectedMaterials(p.materials, { "root.0": [1] }).map((n) => n.name),
    ["B", "C"],
  );
  const bad = await parseClassAcquisitionPage(
    html(
      "<p><strong>Price:</strong> N/A</p><ul><li>Merge the following:<ul><li>A x1</li><li>OR</li><li>B x1</li></ul></li></ul>",
    ),
    url,
  );
  assert.equal(bad.materials, null);
  assert.ok(bad.materialIssue.includes("operator"));
});
test("quest tab names bind prerequisites/materials to the exact quest; explicit previous-quest dependency forms a chain", async () => {
  const content =
    '<p><strong>Quest Location:</strong> Map B<br><strong>Quests Begun From:</strong> NPC B</p><div class="yui-navset"><ul class="yui-nav"><li>First Quest</li><li>Final Quest</li></ul><div class="yui-content"><div><p><strong>Requirements:</strong> Must be Level 50.</p><p><strong>Items Required:</strong></p><ul><li>A x2</li></ul></div><div><p><strong>Requirements:</strong> Must have completed the previous quest.</p><p><strong>Items Required:</strong></p><ul><li>B x3</li></ul></div></div></div>';
  const p = await parseLinkedAcquisitionPage(
    html(content),
    "https://aqwwiki.wikidot.com/npc-s-quests",
    "Final Quest",
  );
  assert.equal(p.questMatched, true);
  assert.equal(p.map, "Map B");
  assert.equal(p.npc, "NPC B");
  assert.equal(p.materials.requirements[0].name, "B");
  assert.equal(p.materials.requirements[0].quantity, 3);
  assert.deepEqual(
    p.questSteps.map((s) => s.name),
    ["First Quest", "Final Quest"],
  );
  const missing = await parseLinkedAcquisitionPage(
    html(content),
    "https://aqwwiki.wikidot.com/npc-s-quests",
    "Unrelated Quest",
  );
  assert.equal(missing.questMatched, false);
  assert.equal(missing.materials, null);
});

test("Observed Location links need actual Shop evidence; unlock requirements come from the linked shop", async () => {
  const html = (inner) =>
    `<div id="page-title">Source</div><div id="page-content">${inner}</div>`;
  const shop = await parseLinkedAcquisitionPage(
    html(
      "<p><strong>Shop Owner:</strong> NPC</p><ul><li>Must have completed a source quest.</li></ul>",
    ),
    "https://aqwwiki.wikidot.com/source",
  );
  assert.equal(shop.isShop, true);
  assert.deepEqual(shop.prerequisites, ["Must have completed a source quest."]);
  const map = await parseLinkedAcquisitionPage(
    html("<p><strong>Location:</strong> Map</p>"),
    "https://aqwwiki.wikidot.com/map",
  );
  assert.equal(map.isShop, false);
});

test('Observed nested drop lists, IoDA redemption and Infinity-only gameplay are distinct source methods',async()=>{
 const load=slug=>{for(const dir of ['content-sources/class-acquisition','content-sources/class-wiki','content-sources/v12-6/wiki']){const file=dir+'/'+slug+'.html';if(fs.existsSync(file))return fs.readFileSync(file,'utf8');}throw Error('Missing snapshot '+slug);};
 const drop=await parseClassAcquisitionPage(load('northlands-monk-class-free-player'),'https://aqwwiki.wikidot.com/northlands-monk-class-free-player');assert.equal(drop.methodType,'drop');assert.equal(drop.dropSources.length,2);assert.match(drop.dropName,/Level 50.*Level 100/);assert.equal(drop.price,null);
 const ioda=await parseClassAcquisitionPage(load('void-highlord-ioda-class'),'https://aqwwiki.wikidot.com/void-highlord-ioda-class');assert.equal(ioda.otherAcquisition.label,'IoDA');assert.equal(ioda.price,null);assert.match(ioda.otherAcquisition.description,/không cấp badge/);
 const infinity=await parseClassAcquisitionPage(load('dragonslayer-infinity'),'https://aqwwiki.wikidot.com/dragonslayer-infinity');assert.equal(infinity.excludedGame,'AQWorlds Infinity');
 const sentinel=await parseClassAcquisitionPage(load('sentinel'),'https://aqwwiki.wikidot.com/sentinel');assert.equal(sentinel.locations.length,18);assert.ok(sentinel.locations.every(l=>l.links.length>=2));
});
