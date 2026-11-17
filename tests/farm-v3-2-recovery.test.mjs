import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {farmBoost, farmBoostState, formatFarmBoost} from '../src/lib/farm-details.mjs';
import {parseFarmReviewPage} from '../scripts/lib/farm-review-parser.mjs';
import {materialLeaves} from '../src/lib/material-requirements.mjs';
import {validateFarmV2} from '../src/lib/farm-v2.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const catalog=read('src/content/farm/catalog-v2.generated.json');
const get=id=>catalog.items.find(i=>i.id===id);
for(const id of ['higure','empowered-higure'])test(`${id}: exact item identity, recipe, artwork, boost and seasonal distinction`,()=>{
 const item=get(id);assert.ok(item);assert.equal(item.wikiUrl,'https://aqwwiki.wikidot.com/'+id);
 assert.equal(item.category,'Weapons');assert.equal(item.membership,'non-member');assert.equal(item.primaryGroupId,'debris-astravian');
 const source=read('content-sources/farm/equipment-sets/sources.json').sources.find(s=>s.url===item.wikiUrl);
 const body=fs.readFileSync(source.sourceFile,'utf8');assert.equal(createHash('sha256').update(body).digest('hex'),source.sourceHash);
 const page=parseFarmReviewPage(body,item.wikiUrl);
 const expected=materialLeaves(page.mergeRecipes[0].tree).map(r=>[r.name,r.quantity]);
 assert.deepEqual(materialLeaves(item.acquisitionRoutes[0].materialTree).map(r=>[r.name,r.quantity]),expected);
 assert.equal(expected.length,id==='higure'?9:3);
 assert.ok(fs.existsSync('public'+item.image));assert.ok(item.descriptionVi);
 assert.equal(item.rarity,id==='higure'?'Seasonal Rarity':'Champion Rarity');
 assert.deepEqual(item.setIds,[], 'same merge shop is not proof of a visual set');
 const boosts=farmBoost(item).join(' ');assert.match(boosts,id==='higure'?/40%.*All Monsters/:/51%.*All Monsters/);
 assert.match(boosts,id==='higure'?/30% Class Point/:/35% Class Point/);assert.match(boosts,id==='higure'?/30% EXP/:/35% EXP/);
});
test('Goddess and Malgor exact task taxonomy does not move unrelated equipment',()=>{
 for(const id of ['goddess-of-war','goddess-of-war-blades','goddess-of-war-cloak','goddess-of-war-prestige-cloak','radiant-goddess-of-war','malgor-the-shadowlord','shadowlord-s-helm','malgor-s-shadowflame-blade'])assert.equal(get(id).primaryGroupId,'alternative-hero',id);
 assert.equal(get('hollowborn-paladin').primaryGroupId,'hollowborn');
 assert.deepEqual(validateFarmV2(catalog),[]);
 const broken=structuredClone(catalog);broken.items.find(i=>i.id==='goddess-of-war').groupEvidence[0].sourceHash='invalid';
 assert.ok(validateFarmV2(broken).some(error=>error.includes('Missing verified faction evidence goddess-of-war')));
});
test('boost display retains percentages and named targets; none requires explicit evidence',()=>{
 assert.equal(farmBoostState({effects:[]}), 'unverified');assert.equal(farmBoostState({effects:['Không có boost']}),'none');assert.deepEqual(farmBoost({effects:['Không có boost']}),['Không']);
 const english='When equipped, this item provides a 25% bonus to Gold when battling monsters or turning in quests and does 75% more damage to Undead Monsters.';
 const text=formatFarmBoost(english);assert.match(text,/25% Gold/);assert.match(text,/75% sát thương lên Undead/);assert.doesNotMatch(text,/When equipped|provides|more damage|Description:/);
 assert.deepEqual([...text.matchAll(/\d+%/g)].map(m=>m[0]),['25%','75%']);
 const description="The infamous helm once shattered a kingdom. This item does 15% more damage to any monster, and gives 25% more class points, experience, gold, and rep when equipped. Extra lore.";
 const concise=formatFarmBoost(description);assert.doesNotMatch(concise,/infamous|kingdom|Extra lore|This item|gives|when equipped/);
 assert.match(concise,/15% sát thương lên All Monsters/);assert.match(concise,/25% Class Point, EXP, Gold, và Reputation/);
 assert.equal(formatFarmBoost("Narrative. (Item does 40% more damage to dragon tagged monsters when equipped.) More narrative."),"tăng 40% sát thương lên Dragon khi trang bị");
 assert.match(formatFarmBoost("This item does 20% more damage to all tagged monsters when equipped."),/mọi quái có tag/);
 assert.doesNotMatch(farmBoost(get('goddess-of-war')).join(' '),/EXP/);
 assert.equal(get('goddess-of-war-blades').category,'Capes / Back Items');
});

test('the current catalog never exposes English lore templates inside Boost',()=>{
 for(const item of catalog.items)for(const text of farmBoost(item))assert.doesNotMatch(text,/When equipped|provides|more damage|This item|gives|Description:/i,item.id);
});
