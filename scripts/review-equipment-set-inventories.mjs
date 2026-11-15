// Explicit scoped reviews. Similar-name candidates are never promoted by themselves.
import fs from "node:fs";
import { parseFarmReviewPage } from "./lib/farm-review-parser.mjs";
import { pendingSets } from "../content-sources/farm/aqw-equipment-sets.mjs";
const root="content-sources/farm/equipment-sets",read=path=>JSON.parse(fs.readFileSync(path,"utf8"));
const sources=read(root+"/sources.json").sources;
const page=url=>{const source=sources.find(source=>source.url===url);if(!source)throw Error("Missing inventory evidence "+url);return {...source,...parseFarmReviewPage(fs.readFileSync(source.sourceFile,"utf8"),url)};};
const spec=(name,members,evidence,expectedCount,notes)=>{
 const seed=pendingSets.find(set=>set.name===name);if(members.length!==expectedCount)throw Error("Unexpected scoped inventory "+name);
 return {...seed,id:name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),members:members.map(member=>({name:member.name,itemId:null,category:null,status:"WIKI_INVENTORY_REVIEW",wikiUrl:member.url || member.wikiUrl})),inventoryEvidence:evidence,expectedCount,notes};
};
const sets=[],trissa=page("https://aqwwiki.wikidot.com/trissa-s-shop");
for(const name of ["Apprentice of Awe","Adept of Awe","Archmaster of Awe","Awescended"]){
 const members=trissa.shopRows.filter(row=>row.name===name||row.name.startsWith(name+" "));
 sets.push(spec(name,members,{url:trissa.url,sourceHash:trissa.sourceHash,kind:"scoped-shop-inventory",guideScope:"Guide explicitly distinguishes four tiers, each Weapon/Armor/Helm/Cape. Exact shop rows checked independently for each tier."},4,"Four independently acquired Awe tiers; no cross-tier merge and no IoDA armor."));
}
const jill=page("https://aqwwiki.wikidot.com/jill-ette-s-quests");
const scrolls=["The First Scroll","The Second Scroll","The Third Scroll","The Fourth Scroll","The Fifth Scroll","The Final Scroll"];
const silver=jill.quests.filter(quest=>scrolls.includes(quest.name)).flatMap(quest=>[...quest.fixedRewards,...quest.choiceRewards]);
sets.push(spec("Silver Exalted Paladin",silver,{url:jill.url,sourceHash:jill.sourceHash,kind:"scoped-quest-rewards",quests:scrolls,guideScope:"Only Silver set reward quests from the declared guide range; excludes Ancient Alloy and One Holy Discovery."},11,"Gold is a separate upgrade collection; Ancient Alloy is not a member."));
const beetle=page("https://aqwwiki.wikidot.com/beetle-warlord-pet-s-quest"),hungry=beetle.quests.find(quest=>quest.name==="Still Hungry");
sets.push(spec("Void Beetle Warlord",[...hungry.fixedRewards,...hungry.choiceRewards],{url:beetle.url,sourceHash:beetle.sourceHash,kind:"scoped-quest-rewards",quests:[hungry.name],guideScope:"Guide explicitly states 12 equipment rewards from Still Hungry; all 12 exact reward links reviewed."},12,"Beetle Warlord Pet unlocks the quest and is excluded from membership."));
const awe=spec("Set of Awe",["Armor of Awe","Helm of Awe","Cape of Awe"].map((name,index)=>({name,url:["https://aqwwiki.wikidot.com/armor-of-awe","https://aqwwiki.wikidot.com/helm-of-awe","https://aqwwiki.wikidot.com/cape-of-awe"][index]})),{kind:"explicit-guide-subsection",guideScope:"Armor of Awe - Helm of Awe - Cape of Awe: the guide explicitly calls these the full set. Blade of Awe unlocks the gear and is not added as a prerequisite."},3,"Blade of Awe and other Awe weapons remain independent without collection proof.");
sets.push(awe);
const paradise=page("https://aqwwiki.wikidot.com/infernal-paradise-merge");
sets.push(spec("Archangel of Mysteries",paradise.shopInventory.filter(row=>["Archangel of Mysteries","Archangel of Mysteries Helm","Archangel of Mysteries Wings"].includes(row.name)),{url:paradise.url,sourceHash:paradise.sourceHash,kind:"scoped-shop-inventory",guideScope:"Guide explicitly states this set has one armor, one helm and one cape; excludes the separately awarded Companion and other shop collections."},3,"Celestial of Mysteries is a separate collection; Companion is not added to this three-piece inventory."));
const pendingQuests=read(root+"/pending-quest-review.json");
for(const [name,questNames,count] of [
 ["Celestial of Mysteries",["Luctus in Perpetuum"],2],
 ["Drakath the Eternal",["Eternal Drakath Set"],5],
 ["Arch DoomKnight",["Gathering Power","Death's Door","Chaotic Lords","A Means to an End"],8],
 ["Malgor the ShadowLord",["Build Malgor's Armor Set"],2],
 ["Celestial Pirate Commander",["Sailor of the Celestial Skies"],12],
]){
 const entry=pendingQuests.find(set=>set.name===name),questRows=entry.quests.filter(quest=>questNames.includes(quest.name));
 const urls=[...new Set(questRows.map(quest=>quest.url))];if(urls.length!==1)throw Error("Ambiguous inventory source "+name);
 const evidencePage=page(urls[0]),members=questRows.flatMap(quest=>quest.rewards);
 sets.push(spec(name,members,{url:urls[0],sourceHash:evidencePage.sourceHash,kind:"scoped-quest-rewards",quests:questNames,guideScope:"Named collection in the declared guide chapter; only its explicitly selected gear reward Quests, excluding prerequisite quests and materials."},count,"Exact collection reward inventory; prerequisite equipment excluded."));
}
fs.writeFileSync(root+"/reviewed-inventories.json",JSON.stringify({sets},null,2)+"\n");console.log({reviewedInventories:sets.length,members:sets.reduce((sum,set)=>sum+set.members.length,0)});
