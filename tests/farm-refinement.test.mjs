import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { materialTasksForMode, materialFarmMaps, distinctFarmText } from "../src/lib/farm-workflows.mjs";
import { parseFarmReviewPage } from "../scripts/lib/farm-review-parser.mjs";
const read=path=>JSON.parse(fs.readFileSync(path,"utf8"));
const catalog=read("src/content/farm/catalog-v2.generated.json");
const registry=read("src/content/farm/quest-workflows.generated.json");

test("ordinary material sources exclude Insignia exchanges/rewards while preserving direct Ultra drops",()=>{
  const manual=read("content-sources/farm/material-guides.json");
  const tasks=manual["roentgenium-of-nulgath"].tasks;
  assert.deepEqual(materialTasksForMode(tasks).map(task=>task.quest),["Void HighLord's Challenge"]);
  assert.equal(materialTasksForMode(tasks,"insignia").length,3);
  assert.deepEqual(materialFarmMaps({name:"Roentgenium of Nulgath"},tasks,"standard"),[]);
  const direct={quest:null,bossId:"ultra-fixture",rows:[{name:"Direct drop",monster:"Ultra Fixture",map:"/join actualdrop"}]};
  assert.equal(materialTasksForMode([direct]).length,1);
  assert.deepEqual(materialFarmMaps({name:"Direct drop"},[direct]),["/join actualdrop"]);
});
test("equivalent names and maps appear once without removing distinct facts",()=>{
  assert.deepEqual(distinctFarmText(["any monster in The Death Pits"," /join deathpits ","NPC","npc"],["any monster in The Death Pits","/join deathpits"]),["NPC"]);
});
test("verified Cowl purchase keeps price, currency, NPC, shop, unlock and map",()=>{
  const task=registry.materials["hooded-legion-cowl"].tasks[0];
  assert.deepEqual(task.purchase,{amount:500000,currency:"Gold"});
  assert.equal(task.npc,"Dage the Evil (NPC)");assert.equal(task.shop,"Undead Legion Shop");assert.equal(task.map,"/join underworld");
  assert.match(task.preconditions.join(" "),/Fail to the King/);
});
test("shop prices come from the exact item row and preserve reputation requirements",()=>{
  const html=fs.readFileSync("content-sources/farm/external-guide-evidence/wiki/doomwood-ii-rep.html","utf8");
  const page=parseFarmReviewPage(html,"https://aqwwiki.wikidot.com/doomwood-ii-rep");
  const row=page.shopRows.find(row=>row.url==="https://aqwwiki.wikidot.com/dark-arts-scholar");
  assert.ok(row);assert.equal(row.purchase.currency,"Gold");assert.equal(row.purchase.amount,20000);
  assert.match(row.requirements.join(" "),/Rank 3 DoomWood/);
});
test("every retained explicit Rarity survives the canonical adapter; unknown Class rarity stays unknown",()=>{
  for(const item of catalog.items)if(item.wikiDetails?.rarity)assert.equal(item.rarity,item.wikiDetails.rarity,item.id);
  assert.equal(catalog.items.find(item=>item.id==="infernal-flame-horns").rarity,"Legendary Rarity");
  assert.equal(catalog.items.find(item=>item.id==="goddess-of-war").rarity,"Champion Rarity");
  assert.equal(catalog.items.find(item=>item.id==="void-highlord-class").rarity,null);
});
