import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseFarmReviewPage} from '../scripts/lib/farm-review-parser.mjs';
import {materialLeaves} from '../src/lib/material-requirements.mjs';
const parse=html=>parseFarmReviewPage('<div id="page-content">'+html+'</div>','https://aqwwiki.wikidot.com/fixture');
test('Location/Price fields sharing a paragraph exclude later notes and See Also',()=>{
 const page=parse('<p><strong>Location:</strong> <a href="/town">Town</a><br><strong>Price:</strong> N/A (Reward from <a href="/npc-s-quests">Target Quest</a>)<br><strong>Sellback:</strong> 0 AC</p><ul><li>Also see: <a href="/unrelated">Unrelated Armor</a></li></ul>');
 assert.deepEqual(page.locationLinks,[{name:'Town',url:'https://aqwwiki.wikidot.com/town'}]);
 assert.deepEqual(page.acquisitionLinks,[{name:'Target Quest',url:'https://aqwwiki.wikidot.com/npc-s-quests'}]);
 assert.ok(page.itemLinks.some(r=>r.url.endsWith('/unrelated')),'reference is retained, but never classified as an acquisition');
});
test('collapsible sibling location lists survive and colonless Price stops location extraction',()=>{
 const page=parse('<p><strong>Locations:</strong></p><div><ul><li><a href="/shop-one">Shop One</a></li><li><a href="/shop-two">Shop Two</a></li></ul></div><p><strong>Price</strong> <a href="/drop-monster">Monster</a><br><strong>Rarity:</strong> Awesome Rarity</p><ul><li><a href="/unrelated">Also See</a></li></ul>');
 assert.deepEqual(page.locationLinks.map(r=>r.name),['Shop One','Shop Two']);assert.deepEqual(page.acquisitionLinks.map(r=>r.name),['Monster']);
});
test('merge ingredient quantities and identities remain separate from acquisition locations',()=>{
 const page=parse('<p><strong>Location:</strong> <a href="/merge-shop">Merge Shop</a><br><strong>Price:</strong> <strong>Merge the following:</strong></p><ul><li><a href="/token">Token</a> x12</li></ul><p><strong>Sellback:</strong> 0 AC</p><ul><li>Also see: <a href="/variant">Variant</a></li></ul>');
 assert.deepEqual(page.locationLinks.map(r=>r.name),['Merge Shop']);assert.deepEqual(materialLeaves(page.mergeRecipes[0]?.tree).map(r=>[r.name,r.quantity]),[['Token',12]]);
});
test('real Celestial Commander source has one location; alternate cosmetics stay as references',()=>{
 const source=JSON.parse(fs.readFileSync('content-sources/farm/equipment-sets/sources.json')).sources.find(s=>s.url==='https://aqwwiki.wikidot.com/celestial-commander-s-hat-morph');
 const page=parseFarmReviewPage(fs.readFileSync(source.sourceFile,'utf8'),source.url);
 assert.deepEqual(page.locationLinks.map(r=>r.name),['Lolosia']);assert.deepEqual(page.acquisitionLinks.map(r=>r.name),['Sailor of the Celestial Skies']);
 assert.ok(page.itemLinks.some(r=>r.url.endsWith('/celestial-hair-morph')));
});
test('recovered Titan intermediate merge keeps quantities and unlock separate from final weapon',()=>{
 const registry=JSON.parse(fs.readFileSync('src/content/farm/quest-workflows.generated.json'));
 const task=registry.materials['vindicator-titan-s-axes'].tasks.find(t=>t.id==='material-merge-vindicator-titan-s-axes');
 assert.deepEqual(task.rows.map(r=>[r.name,r.quantity]),[['AntiTitan Supplies',50],['Titanic Fluid',20],['Gold Voucher 200k',1],["Vindicator Titan's Axe",1]]);
 assert.equal(task.rewardQuantity,1);assert.ok(task.preconditions.some(r=>r.includes('Titanic Terror Times Two')));
 const item=JSON.parse(fs.readFileSync('src/content/farm/catalog-v2.generated.json')).items.find(i=>i.id==='titan-drakath-s-blades');
 assert.deepEqual(materialLeaves(item.acquisitionRoutes[0].materialTree).map(r=>[r.name,r.quantity]),[["Vindicator Titan's Axes",1],["Titan Paladin's Blades",1],['Titanic Destroyer Blades',1],["Heroic Titan's Greatswords",1],["Titan Drakath's Blade",1]]);
 assert.equal(item.acquisitionRoutes[0].materialTotalsComplete,false,'reading intermediates is not a full cost/yield certification');
});
test('Green Dragon Slayer intermediate has its own recipe rather than copying the upgraded weapon costs',()=>{
 const registry=JSON.parse(fs.readFileSync('src/content/farm/quest-workflows.generated.json'));
 const task=registry.materials['green-dragon-slayer-s-halberd'].tasks.find(t=>t.id==='material-merge-green-dragon-slayer-s-halberd');
 assert.deepEqual(task.rows.map(r=>[r.name,r.quantity]),[['Prismatic Seams',250],['Gold Voucher 500k',4]]);
 assert.equal(task.source,'https://aqwwiki.wikidot.com/green-dragon-slayer-s-halberd');
 assert.equal(task.rewardQuantity,1);
});
