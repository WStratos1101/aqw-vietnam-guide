import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {Window} from 'happy-dom';
import {parseClassAcquisitionPage,parseLinkedAcquisitionPage} from './lib/class-acquisition-source.mjs';
import {item} from '../src/lib/material-requirements.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const file='src/content/classes/acquisition.json',data=read(file),initial=read('content-sources/v12-11/initial-queue.json');
const sha=x=>createHash('sha256').update(x).digest('hex');
const untouchedPath='content-sources/v12-11/acquisition-untouched-hashes.json';
if(!fs.existsSync(untouchedPath))fs.writeFileSync(untouchedPath,JSON.stringify(Object.fromEntries(Object.entries(data.classes).filter(([id])=>!initial.acquisitions.some(e=>e.classId===id)).map(([id,c])=>[id,sha(JSON.stringify(c))])),null,2)+'\n');
const reports=[];
function source(slug){const path=['content-sources/v12-11/','content-sources/class-acquisition/','content-sources/class-wiki/'].map(d=>d+slug+'.html').find(fs.existsSync);if(!path)throw Error('No source '+slug);return {path,html:fs.readFileSync(path,'utf8'),url:'https://aqwwiki.wikidot.com/'+slug};}
function reviewed(m,url,reason){m.detailsStatus='complete';m.verificationStatus='verified';m.evidence={...m.evidence,issues:[],recovery:{source:url,verifiedAt:'2026-11-11',reason,method:'Exact named page/row review; original class source retained'}};reports.push({classId:m.classId,methodId:m.id,source:url,reason});}
function base(classId,slug,id,variantName){const s=source(slug);return {id,classId,type:'other',variantName,isAvailable:true,availability:'available',verificationStatus:'verified',detailsStatus:'complete',source:s.url,sourceHash:sha(s.html),prerequisites:[],notes:[],membershipRequirement:null,levelRequirement:null,baseLevel:null,evidence:{classPage:s.url,issues:[]}};}
function put(c,m){const old=c.methods.find(x=>x.id===m.id);if(!old)c.methods.push(m);else if(old.detailsStatus==='partial'||old.evidence?.recovery)Object.assign(old,m);}
function exclude(c,id,sourceUrl,reason){const m=c.methods.find(m=>m.id===id);if(!m)return;if(m.detailsStatus!=='partial')throw Error('Never remove a complete acquisition method');c.excludedMethods??=[];c.excludedMethods.push({method:m,source:sourceUrl,verifiedAt:'2026-11-11',reason});c.methods=c.methods.filter(m=>m.id!==id);reports.push({classId:c.classId,methodId:id,source:sourceUrl,reason,action:'exclude_misclassified_map_row'});}
function clearIssue(c,url){c.issues=c.issues.filter(i=>i.source!==url);}
// Reparse only the two incomplete exact quest methods, preserving all complete methods.
for(const [classId,slug,name]of [['enforcer-protosartorium','taravya-s-quests','ProtoSartorium Parts'],['kathool-adept-ka','the-depths-of-your-madness-quests','Call of Kathool']]){
 const c=data.classes[classId],s=source(slug),parsed=await parseLinkedAcquisitionPage(s.html,s.url,name);
 if(!parsed.questMatched||parsed.issues.length||!parsed.materials)throw Error('Quest still incomplete '+name);
 for(const m of c.methods.filter(m=>m.detailsStatus==='partial'&&m.quest?.questName.toLowerCase()===name.toLowerCase())){
  Object.assign(m.quest,{npc:parsed.npc,map:parsed.map,materials:parsed.materials,prerequisites:parsed.prerequisites,verifiedQuestSteps:parsed.questSteps});
  reviewed(m,s.url,'Explicit x quantities remain on parent material; Dropped by nested lists are provenance, not additional material scope. Singular Requirement labels preserve quest chain.');
 }
}
function patchShop(classId,id,{url,npc,map,shopName,price,prerequisites=[],availability,reason}){
 const m=data.classes[classId].methods.find(m=>m.id===id);if(!m||m.detailsStatus==='complete')return;
 const currency=price?.currency||m.shop?.price?.currency;if(!currency)throw Error('No verified currency');
 m.type='shop';delete m.merge;
 m.shop={shopName:shopName||m.shop?.shopName,source:url,npc,map,price:price||m.shop.price};m.prerequisites=[...new Set([...m.prerequisites,...prerequisites])];
 if(availability){m.availability=availability;m.isAvailable=availability==='available'?true:['seasonal','limited'].includes(availability)?null:false;}
 reviewed(m,url,reason);
}
patchShop('oracle','oracle-shop-1',{url:'https://aqwwiki.wikidot.com/oracle-class',shopName:'Oracle Class',npc:'Ranad',map:'Class Hall A',price:{amount:0,currency:'AC',sourceText:'0 AC'},reason:'Web browser text access recovered exact Oracle row (0 AC), Ranad and Class Hall A. No prerequisites listed.'});
for(const [id,npc,map,availability]of [['blaze-binder-ac-shop-0','High Adept Thaumus','Battleon','legacy'],['blaze-binder-ac-shop-1','High Adept Caustus','Firestorm Forge','available']])patchShop('blaze-binder-bb-firelord-summoner-fls',id,{url:'https://aqwwiki.wikidot.com/blaze-binder-ac-class',shopName:'Blaze Binder AC Class',npc,map,availability,price:{amount:2000,currency:'AC',sourceText:'2,000 AC'},reason:'Exact Blaze Binder (AC) shop row is 2,000 AC with Rank N/A. The Battleon location alone has Rare tag; Firestorm Forge is current.'});
for(const [id,variant]of [['the-collector-class-0-ac-shop-0','Vindicator Of They (Merge)'],['the-collector-class-0-ac-shop-1','Vindicator Of They (AC)']])patchShop('vindicator-of-they-vot-the-collector-tc',id,{url:id.endsWith('-0')?'https://aqwwiki.wikidot.com/vindicator-of-they-armor-shop':'https://aqwwiki.wikidot.com/vindicator-of-they-shop-2',npc:'Will and Fred',map:'The Collector (Location)',price:{amount:0,currency:'AC',sourceText:'0 AC'},prerequisites:['Must have '+variant+' in your inventory with at least 1 Class Point to access this shop.'],availability:'limited',reason:'Recovered exact Collector (Class) (0 AC) row and variant-specific Vindicator prerequisite. Pseudo-rare badge access is not unconditional Free.'});
for(const [id,requirement]of [['sentinel-shop-0','Must have purchased membership or AdventureCoins between October 1 and October 31, 2009.'],['sentinel-shop-10','Must have had active membership expiring on or after November 4, 2019.']])patchShop('sentinel',id,{url:id.endsWith('-0')?'https://aqwwiki.wikidot.com/1st-upholder':'https://aqwwiki.wikidot.com/11th-upholder',npc:null,map:'Book of Lore',price:{amount:0,currency:'AC',sourceText:'0 AC'},prerequisites:[requirement],availability:'limited',reason:'Exact Sentinel shop row and historical Upholder badge access condition recovered through web page reader. Other unavailable Upholder pages stay partial.'});
// PirateShop sells Pirate for 0 AC; its recipe must not inherit Blazebeard Merge materials.
patchShop('alpha-pirate-pirate','pirate-merge-2',{url:'https://aqwwiki.wikidot.com/pirateshop',shopName:'PirateShop',npc:'Elissa Keelhaul',map:'Lolosia',price:{amount:0,currency:'AC',sourceText:'0 AC'},prerequisites:['Must have one of Classic Alpha Pirate, Classic Pirate (Class), or Pirate in inventory.'],reason:'Observed Class/Location links point to PirateShop. Exact Pirate row costs 0 AC; shop access has an OR prerequisite, not a merge recipe.'});
// The current Map Recovery disclosure explicitly lists Pirate as a reward;
// its prose also mentions shop access, so retain the shop as a separate route.
{
 const c=data.classes['alpha-pirate-pirate'],m=base(c.classId,'pirate','pirate-map-recovery-quest-reviewed','Pirate');
 Object.assign(m,{type:'quest',quest:{questId:'https://aqwwiki.wikidot.com/elissa-keelhaul-s-quests#1',questName:'Map Recovery',npc:'Elissa Keelhaul',map:'Lolosia',source:'https://aqwwiki.wikidot.com/elissa-keelhaul-s-quests#1',prerequisites:['Must have completed the previous quest, Salmagundi.'],materials:{kind:'allOf',requirements:[{...item('Map Fragment',5,'https://aqwwiki.wikidot.com/elissa-keelhaul-s-quests#1'),acquisitionSources:[{name:'Monsters in Lolosia',url:'https://aqwwiki.wikidot.com/lolosia'}]}]},reward:'Pirate',verifiedQuestSteps:[]}});
 reviewed(m,m.quest.source,'Current exact Map Recovery quest block: five Map Fragments, previous quest required, Pirate in Items rewards. Prose mentions opening the shop, which is preserved separately with its own inventory access prerequisites.');put(c,m);
}
// A map line is not an independent Merge Shop. Preserve the source line in exclusions,
// while keeping both the actual shops and the explicit Wheel reward alternatives.
for(const [classId,ids]of [['alpha-omega-doommega-ao',['alpha-doommega-merge-0','alpha-doommega-merge-2']],['mechajouster-mj',['mechajouster-merge-0','mechajouster-merge-1']]]){
 const c=data.classes[classId];for(const id of ids){const m=c.methods.find(m=>m.id===id);if(m)exclude(c,id,m.source,'Class page separately lists actual Destiny/Doom Merge shops and explicit Wheel rewards. This Location is a map, not another Merge Shop; recipe and rewards remain as their own methods.');}
}
// Twilly is a route into the already recorded Chaos Slayer Class shop at New Finale.
{
 const c=data.classes['chaos-slayer-cs-chaos-champion-prime-ccp'];
 const existing=c.methods.find(m=>m.source.endsWith('/chaos-slayer-berserker-ac')&&m.detailsStatus==='complete'&&m.shop?.shopName==='Chaos Slayer Class');
 if(!existing)throw Error('Do not exclude Twilly without the proven shop');
 exclude(c,'chaos-slayer-berserker-ac-shop-1',existing.source,'Twilly is an NPC access point at New Finale. The complete Chaos Slayer Class shop method already includes New Finale; no separate Twilly shop or price is invented.');
}
// Mystcroft is the drop branch, while Cruxshadows is the separate verified Merge.
{
 const c=data.classes['evolved-pumpkin-lord-epl'],m=c.methods.find(m=>m.id==='evolved-pumpkin-lord-legend-merge-1');
 if(m&&m.detailsStatus==='partial'){m.type='drop';delete m.merge;m.drop={from:'Great Pumpkin King',sources:[{name:'Great Pumpkin King',url:'https://aqwwiki.wikidot.com/great-pumpkin-king'}],source:m.source};m.availability='seasonal';m.isAvailable=null;reviewed(m,m.source,'Price list explicitly states Dropped by Great Pumpkin King as an alternative to Glowing Pumpkinseed x500 merge. Mystcroft is the drop location.');}
}
// Restore omitted legacy/drop methods from actual source Notes/Price; no invented prices.
{
 const c=data.classes['rogue-renegade'],m=base(c.classId,'classic-alpha-pirate','classic-alpha-pirate-legacy-creation','Classic Alpha Pirate');
 Object.assign(m,{availability:'legacy',isAvailable:false,other:{label:'Mulligan Day 2008',description:'Bản khởi tạo nhân vật trong Mulligan Day 2008; đã ngừng phát hành. Được trả lại vào túi đồ cho chủ sở hữu gốc.'}});reviewed(m,m.source,'Source Notes explicitly state one-time character creation and restoration to original 2008 owners. Price N/A is not interpreted as Free.');put(c,m);clearIssue(c,m.source);
}
{
 const c=data.classes['warrior-beast-warrior-pumpkin-lord-warlord'],s=source('pumpkin-lord'),parsed=await parseClassAcquisitionPage(s.html,s.url);
 if(parsed.methodType!=='drop'||parsed.dropSources.length!==2)throw Error('Pumpkin Lord drop evidence missing');
 const m=base(c.classId,'pumpkin-lord','pumpkin-lord-drop-reviewed','Pumpkin Lord');Object.assign(m,{type:'drop',availability:parsed.availability,isAvailable:null,membershipRequirement:parsed.membershipRequirement,drop:{from:parsed.dropName,sources:parsed.dropSources,source:s.url}});reviewed(m,s.url,'Exact Price disclosure names Great Pumpkin King and StalkWalker drops; no purchase price inferred.');put(c,m);clearIssue(c,s.url);
}
// MechaJouster quest reward has a separate armor prerequisite and an explicit x1 orb.
{
 const c=data.classes['mechajouster-mj'],m=base(c.classId,'mechajouster','mechajouster-gerrick-quest-reviewed','MechaJouster');
 Object.assign(m,{type:'quest',quest:{questId:'https://aqwwiki.wikidot.com/gerrick-s-quest',questName:'Quest to Unlock Jouster Class',npc:'Gerrick',map:'Air Storm',source:'https://aqwwiki.wikidot.com/gerrick-s-quest',prerequisites:['Must have Jouster in your inventory.'],materials:{kind:'allOf',requirements:[{...item('Energy Orb',1,'https://aqwwiki.wikidot.com/gerrick-s-quest'),acquisitionSources:[{name:'Lightning Ball',url:'https://aqwwiki.wikidot.com/lightning-ball'}]}]},reward:'MechaJouster',verifiedQuestSteps:[]}});reviewed(m,m.quest.source,'Exact Gerrick quest rewards MechaJouster, requires Jouster armor and Energy Orb x1 dropped by Lightning Ball.');put(c,m);
 const redundant=c.methods.find(x=>x.type==='other'&&x.other?.source===m.quest.source);if(redundant){c.supersededMethods??=[];c.supersededMethods.push({method:redundant,replacedBy:m.id,reason:'Generic reward entry upgraded to an exact Quest Reward with prerequisites and explicit materials.'});c.methods=c.methods.filter(x=>x!==redundant);}
}
// Frostval 0 AC has two independent branches: seasonal quest and chest-owned shop.
{
 const c=data.classes['frostval-barbarian-fb'],s=source('robina-blizzy-s-quests'),p=await parseLinkedAcquisitionPage(s.html,s.url,'Unleash the Frostvale Barbarian');
 if(!p.questMatched||p.issues.length||!p.materials)throw Error('Frostval quest not fully parsed');
 const q=base(c.classId,'frostval-barbarian-0-ac','frostval-barbarian-quest-reviewed','Frostval Barbarian (0 AC)');
 Object.assign(q,{type:'quest',availability:'seasonal',isAvailable:null,quest:{questId:s.url,questName:'Unleash the Frostvale Barbarian',npc:'Robina / Robina & Blizzy',map:'Frostvale',source:s.url,prerequisites:p.prerequisites,materials:p.materials,reward:'Frostval Barbarian (0 AC)',verifiedQuestSteps:p.questSteps}});reviewed(q,s.url,'Exact quest disclosure includes six explicitly quantified x1 items and this Class reward.');put(c,q);
 const shop=base(c.classId,'frostval-barbarian-0-ac','frostval-barbarian-icestorm-shop-reviewed','Frostval Barbarian (0 AC)');Object.assign(shop,{type:'shop',availability:'limited',isAvailable:null,prerequisites:['Must have IceStorm Collection Chest Pet 2018 in inventory.'],shop:{shopName:'IceStorm Collection',source:'https://aqwwiki.wikidot.com/icestorm-collection',npc:'IceStorm Collection Chest Pet 2018',map:null,price:{amount:0,currency:'AC',sourceText:'0 AC'}}});reviewed(shop,shop.shop.source,'Exact Class row 0 AC, accessible through the owned 2018 chest pet; not unconditional Free or a world map.');put(c,shop);clearIssue(c,q.source);
}
// Curiosities is the Darkside Gear quest branch, not an unnamed Merge Shop.
{
 const c=data.classes['dark-lord-dl-darkside'];
 const q=base(c.classId,'dark-lord','dark-lord-darkside-gear-quest','Dark Lord');
 Object.assign(q,{type:'quest',availability:'limited',isAvailable:null,quest:{questId:'https://aqwwiki.wikidot.com/darkside-orb-s-quest',questName:'Darkside Gear',npc:'Catalogue of Oddities',map:'Curiosities',source:'https://aqwwiki.wikidot.com/darkside-orb-s-quest',prerequisites:['Must have Darkside with at least 1 Class Point in inventory.'],materials:null,reward:'Dark Lord',verifiedQuestSteps:[]}});
 reviewed(q,q.quest.source,'Exact quest disclosure: Catalogue of Oddities in Curiosities, requires original Darkside at 1 Class Point; Items Required N/A; Dark Lord is explicitly a reward. No material quantity invented.');put(c,q);
 exclude(c,'dark-lord-merge-0',q.quest.source,'Curiosities is the source-verified Darkside Gear quest route. The separate Murder Moon Merge method and all its six quantified ingredients remain unchanged.');
 const old=base(c.classId,'darkside','darkside-golden-cheezburger-legacy','Darkside');
 Object.assign(old,{availability:'legacy',isAvailable:false,other:{label:'Golden Cheezburger · 2012',description:'Golden Cheezburger được chuyển thành Darkside trong đợt phát hành tháng 1/2012. Phiên bản gốc đã ngừng phát hành.'}});
 reviewed(old,'https://www.aq.com/gamedesignnotes/darkside-class-skill-breakdown-1498','January 11, 2012 official release description explicitly says the Golden Cheezburger item turns into the Class. Current Wiki Location/Price N/A plus Rare establishes unavailable current acquisition. Do not mix with the seasonal Dark Lord merge or original-owner quest.');put(c,old);clearIssue(c,old.source);
}
for(const e of initial.acquisitions)for(const m of data.classes[e.classId].methods)if(m.availability==='limited'&&m.evidence?.recovery)m.isAvailable=null;
for(const e of initial.acquisitions){const c=data.classes[e.classId];c.reviewStatus=c.issues.length||c.methods.some(m=>m.detailsStatus==='partial'||m.verificationStatus!=='verified')?'partial':'reviewed';}
fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
fs.writeFileSync('artifacts/qa/v12-11/acquisition-recovery.json',JSON.stringify({verifiedAt:'2026-11-11',changes:reports,remaining:initial.acquisitions.filter(e=>data.classes[e.classId].reviewStatus==='partial').map(e=>e.classId)},null,2)+'\n');
console.log({completed:initial.acquisitions.filter(e=>data.classes[e.classId].reviewStatus==='reviewed').length,remaining:initial.acquisitions.filter(e=>data.classes[e.classId].reviewStatus==='partial').length});
