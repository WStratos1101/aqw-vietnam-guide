import fs from 'node:fs';
import {item,parseExpression,parseMaterialLines,requiredMaterials} from '../src/lib/material-requirements.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),out=read('src/content/ultra/recovery.json'),folder='content-sources/recovery/';
const id=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');
const groups={
 'ultra-tyndarius':['Infernal Flame Khopesh','Infernal Flame Pyromancer','Infernal Flame Horns','Infernal Flame Hood','Infernal Claws + Runes','Infernal Flame Claws','Infernal Flame Runes'],
 'ultra-speaker':['War Blade of Courage','War Blades of Courage','War Blade of Power','War Blade of Speed','War Blades of Speed','War Blade of Strength','War Blade of Wisdom','Goddess Of War Blades','Goddess of War Cloak','Goddess Of War Prestige Cloak','Goddess Of War','Radiant Goddess of War'],
 'god-of-the-depths':['Apex MindSmasher Blade','Apex MindSmasher Blades','Adeptus Kathooli'],
 'kolr-usurper-of-flames':['Liberta Aeterna','Flame Scion Gauntlets'],
 'astral-empyrean':['Star Light of Destiny','Star Lights of Destiny','Star Light of the Empyrean','Star Lights of the Empyrean','Celestial Paladin'],
 'champion-drakath':['Empowered Blade of Chaos',"Empowered Chaos Avenger's Greatsword",'Empowered Chaos Avenger Armor'],
 'darkon-the-conductor':["Darkon's Debris 2 (Reconstructed)","Dual Darkon's Debris 2","Empowered Darkon's Debris 1"],
 'gramiel-the-graceful':["Gramiel's Divine Enoch",'Empowered Grandmaster Gramiel',"Gramiel's Divine Enoch Pet","Gramiel's Divine Enoch Battle Pet"],
 kasuko:['Blaze of Awe','Blazing Light of Destiny','Burning Sword of Doom'],
 'batara-kala':['Dalang Sinden',"Kala's Living Head"],
 'ultra-iara':["Iara's Water Orb","Iara's Brush","Iara's Acolyte's Staff","Iara's Acolyte"],
 'ultra-drago':["Prince Darkon's Poleaxe","Drago's Royal Guard"],
 'ultra-nulgath':['Empowered Overfiend Blade','Empowered Ungodly Reavers','Empowered Shadow Spear','Empowered Bloodletter','Empowered Prismatic Manslayer','Empowered Prismatic Manslayers','Empowered Oblivion Blade','Empowered Charged Oblivion Blade','Empowered Legacy of Nulgath','Empowered Worshipper of Nulgath','Empowered Evolved Void','Empowered Evolved Fiend','Empowered Evolved Blood','Empowered Evolved Hex','Empowered Evolved Shadow'],
 'ultra-dage':['Necrotic Blade of the Underworld','Empowered BladeMaster',"Empowered BladeMaster's Katana",'Empowered Dual Katanas','Empowered Caladbolg','Empowered Dual Caladbolgs','Empowered Dark Caster','Empowered Forge Spawn','Empowered Lich King','Empowered Paragon Plate','Empowered Undead Champion','Empowered Hollowborn Caladbolg','Empowered Dual Hollowborn Caladbolgs','Empowered Prismatic Paragon'],
};
const aliases={"Darkon's Debris 2 (Reconstructed)":'darkon-s-debris-2-reconstructed','Celestial Paladin':'celestial-paladin-2','Infernal Claws + Runes':'infernal-claws-runes'};
groups['ultra-nulgath'].push('Empowered Sole Bloodletter');
groups['god-of-the-depths'].push('Thyllian Domination Spear','Thyllian Domination Spears');
groups['champion-drakath'].push('Empowered Drakath Armor','Empowered Original Drakath Armor','Chaorrupter Locked','Dual Chaorrupter Locked','Polished Sword of Dragon Control','Polished Supreme Arcane Staff','Colorful Chaos Rose','Royal Chaos Rose',"Empowered Kitsune's Chaos Mask",'Chaotic Guilt Blade');
groups['darkon-the-conductor'].push('Empowered Higure');
groups['gramiel-the-graceful'].push('Hollowborn Vindicator Spear','Hollowborn Vindicator Armor','Hollowborn Vindicator Helm','Hollowborn Vindicator Wings','Celestial Grace Orb','Celestial Grace Orbs','Celestial Gramiel Armor','Celestial Gramiel Robes','Celestial Gramiel Halo','Celestial Gramiel Gaze','Ascended Gramiel Wings');
groups['ultra-dage'].push('Sin of the Underworld');
groups['ultra-dage'].push('Empowered Bonfire Altar');
for(const boss of ['ultra-ezrajal','ultra-warden','ultra-engineer'])groups[boss]=['Dual Exalted Apotheosis','Exalted Duality'];
const legacy=read('content-sources/v678/review.json');
const pageFor=name=>{const p=folder+(aliases[name]||id(name))+'.json';if(fs.existsSync(p))return read(p);const r=legacy.find(r=>r.kind==='equipment'&&r.name===name&&!r.error);return r?{...r,links:r.links.map(l=>typeof l==='string'?{url:l}:l)}:null;};
const reviewedMaterials=read(folder+'reviewed-materials.json');
function mats(text,source){const reviewed=reviewedMaterials[source.split('/').at(-1)];const parsed=reviewed?{confidenceStatus:reviewed.confidenceStatus,tree:{kind:'allOf',requirements:reviewed.rows.map(row=>parseExpression(row.map(t=>Array.isArray(t)?item(t[0],t[1],source):t)))}}:parseMaterialLines(text,source);return {materials:requiredMaterials(parsed.tree),materialTree:parsed.tree,materialConfidenceStatus:parsed.confidenceStatus,materialEvidence:reviewed||{sourceUrl:source,confidenceStatus:parsed.confidenceStatus,notes:parsed.reason||'List of mandatory items; no structural operators.'}};}
function recipe(name,page){const merge=page.text.split('Merge the following:')[1]?.split('Sellback:')[0];if(merge)return {...mats(merge,page.url),requirements:[],source:page.url,kind:'merge',title:'Merge '+name};
 const rewardQuest=page.text.match(/Reward from the '\s*([^\n]+)\s*' quest/);const link=page.links.find(l=>/quests/.test(l.url));if(!link)return null;const p=folder+link.url.split('#')[0].replace(/^\//,'')+'.json';if(!fs.existsSync(p))return null;const quest=read(p);const chunks=quest.text.split('Items Required:');for(let n=1;n<chunks.length;n++){const [req,rest]=chunks[n].split('Rewards:');if(!rest)continue;const reward=rest.split('Requirements:')[0].split('Quest Location:')[0].split('//<![CDATA[')[0].split('Thanks to')[0];if(!reward.split('\n').some(l=>id(l.trim())===id(name)))continue;const previous=chunks[n-1];const requirements=previous.split('Requirements:').at(-1).split(/Defeat me|Dage's|\+\s*When|You |The |My /)[0].trim();return {...mats(req,quest.url),requirements:requirements?requirements.split('\n').filter(Boolean):[],source:quest.url,kind:'quest',title:rewardQuest?.[1]||name};}return null;}
out.routeOverrides={};out.equipment={};out.recipeAudit=[];
const existingBosses=read('src/content/ultra/bosses.json');
const repeat={ 'god-of-the-depths':['Frenzy Feast','Adeptus Relic'],'kolr-usurper-of-flames':['Dulcify','Cinders of a Champion'],'astral-empyrean':["Asterism's Toll",'Star of the Empyrean'],'champion-drakath':['Drakath, Champion of Chaos','Champion Drakath Insignia'],'darkon-the-conductor':['Darkon, the Conductor','Darkon Insignia'],'gramiel-the-graceful':['Resuscitated Hope',"Gramiel the Graceful's Insignia"],kasuko:['The Molten Heart','Volcanic Essence'],'batara-kala':['Batara Kala','Kala Insignia'],'ultra-iara':['Ultra Iara','Iara Insignia']};
function entity(name,page,r){const text=page.text.replace(/\s+/g,' '),base=text.match(/Base Damage:\s*(-?\d+)-(-?\d+)/),level=text.match(/Base Level:\s*(\d+)/),boost=text.match(/(?:does|do|deals|gives)\s+(\d+)%\s+more damage to\s+([^.(]+)/i);const tag=page.text.split('\n');const type=base?'weapon':tag.includes('armor')?'armor':tag.includes('helm')?'helmet':(tag.includes('cape')||tag.includes('back'))?'cape':tag.includes('pet')?'pet':'unknown';const categories=tag.filter(t=>/^(fixed-dmg|defaultdmg|mediumdmg|highdmg|otherdmg)$/.test(t));return {id:id(name),name,image:'equipment-'+id(name),equipmentType:type,category:type,levelRequirement:level?Number(level[1]):null,damageBoost:boost?{value:Number(boost[1]),targetType:/all monsters/i.test(boost[2])?'All Damage':boost[2].replace(/when equipped.*$/i,'').trim(),source:page.url}:null,boostStatus:boost?'verified':tag.some(t=>t.startsWith('xdmg'))?'unknown':'none',weaponStability:base&&base[1]===base[2]?'stable':'unknown',weaponDamageRange:base?{minimum:Number(base[1]),maximum:Number(base[2]),classification:base[1]===base[2]?'stable':'unknown',officialRangeCategory:categories[0]||null,source:page.url,verifiedAt:'2026-11-08'}:undefined,baseDamage:base?base[1]+'-'+base[2]:null,materialTree:r.materialTree,materialConfidenceStatus:r.materialConfidenceStatus,materialEvidence:r.materialEvidence,materialRequirements:r.materials.map(m=>({...m,source:r.source})),source:page.url,lastVerified:'2026-11-08'};}
for(const [bossId,names]of Object.entries(groups)){const routes=[];for(const name of names){const page=pageFor(name);if(!page){out.recipeAudit.push({bossId,name,status:'missing_item_page'});continue;}const r=recipe(name,page);if(!r||r.materialConfidenceStatus!=="verified"){out.recipeAudit.push({bossId,name,status:'missing_recipe',source:page.url});continue;}const e=entity(name,page,r);out.equipment[e.id]=e;const quests=[];
 const seen=new Set([name]);function ingredient(material){if(seen.has(material.name))return;seen.add(material.name);const subPage=pageFor(material.name),sub=subPage&&recipe(material.name,subPage);if(!sub||sub.materialConfidenceStatus!=="verified")return;for(const child of sub.materials)ingredient(child);out.equipment[id(material.name)]=entity(material.name,subPage,sub);quests.push({id:'ingredient-'+id(material.name),name:(sub.kind==='merge'?'Merge ':'Nhận ')+material.name,stepType:sub.kind,requirements:sub.requirements,materialTree:sub.materialTree,materialScope:id(material.name),items:sub.materials.map(m=>`${m.name} ×${m.quantity}`),reward:material.name,dependencies:sub.materials.map(m=>'ingredient-'+id(m.name)).filter(q=>quests.some(s=>s.id===q)),repeatability:'once',source:sub.source});}for(const material of r.materials)ingredient(material);
 const daily=repeat[bossId];if(daily)quests.push({id:'repeat-reward',name:daily[0],stepType:'quest',requirements:[],items:[],reward:daily[1],dependencies:[],repeatability:out.bosses.find(b=>b.id===bossId)?.challengeCategory==='weekly'?'weekly':'daily',source:out.bosses.find(b=>b.id===bossId).sources[0].url});
 const oldBoss=existingBosses.find(b=>b.id===bossId),oldRoute=oldBoss?.equipmentRoutes.find(r=>r.itemName===name),weekly=(oldRoute?.quests||oldBoss?.equipmentRoutes.flatMap(r=>r.quests)||[]).find(q=>q.repeatability==='weekly');
 if(weekly)quests.push({...weekly,dependencies:[]});
 quests.push({id:'acquire',name:r.title,stepType:r.kind,requirements:r.requirements,materialTree:r.materialTree,materialScope:e.id,items:r.materials.map(m=>`${m.name} ×${m.quantity}`),reward:name,dependencies:quests.filter(q=>q.repeatability==='once').map(q=>q.id),repeatability:'once',source:r.source});
 const previousAcquisition=oldRoute?.quests.find(q=>q.repeatability==='once'&&q.reward===name);if(previousAcquisition){const final=quests.at(-1);final.id=previousAcquisition.id;}
 routes.push({id:oldRoute?.id||'route-'+e.id,canonicalId:e.id,itemName:name,image:e.image,category:e.category,note:'',prerequisites:r.requirements,quests,rewards:[name],source:r.source,group:(bossId==='ultra-nulgath'||bossId==='ultra-dage')&&name.startsWith('Empowered')?'empowered':'endgame'});out.recipeAudit.push({bossId,name,status:'structured',source:page.url,recipeSource:r.source});}
 const boss=out.bosses.find(b=>b.slug===bossId);if(boss){boss.equipmentRoutes=routes;boss.rewardSummary=routes[0]?.itemName||'';}else out.routeOverrides[bossId]=['ultra-ezrajal','ultra-warden','ultra-engineer'].includes(bossId)?[...existingBosses.find(b=>b.id===bossId).equipmentRoutes,...routes]:routes;
}
const manifest=read('src/data/aqw-assets.json');for(const e of Object.values(out.equipment)){const verified=manifest.find(a=>a.entityName===e.name&&a.entityType==='item'&&a.verificationStatus==='verified'&&a.usageStatus==='approved');if(verified)e.image=verified.assetId;}
for(const e of Object.values(out.equipment)){
 const range=e.weaponDamageRange;
 if(range?.officialRangeCategory==='defaultdmg'&&range.minimum===27&&range.maximum===33){e.weaponStability='normal';range.classification='normal';range.classificationEvidence={sourceUrl:'https://aqwwiki.wikidot.com/forum/t-819161/weapon-damage-thread',sourceType:'wiki',verifiedAt:'2026-11-08',confidenceStatus:'verified',notes:'NORMAL is this guide’s display label for explicitly tagged Wiki DefaultDmg (27–33). No arbitrary numeric threshold; Medium/High/Other remain unknown.'};}
 const page=pageFor(e.name);if(!e.damageBoost&&page?.text.split('\n').includes('xdmg2monsters')){const m=page.text.match(/(?:(\d+)% damage boost|damage boost (\d+)%)/i);if(m){e.damageBoost={value:Number(m[1]||m[2]),targetType:'All Damage',source:page.url};e.boostStatus='verified';}}
}
// Legacy headings can describe several items; they are not separate equipment
// variants. Keep the source block but identify every canonical item it covers.
out.equipmentAliases={
 'Empowered Legacy of Nulgath (ELoN)':'Empowered Legacy of Nulgath',
 'Empowered Worshipper of Nulgath (EWoN)':'Empowered Worshipper of Nulgath',
};
const groupedEquipment={
 'Empowered Prismatic Manslayer và Empowered Prismatic Manslayers':['Empowered Prismatic Manslayer','Empowered Prismatic Manslayers'],
 'Empowered Evolved Fiend (EEF) và Empowered Evolved Void':['Empowered Evolved Fiend','Empowered Evolved Void'],
 'Empowered Evolved Blood (EEB), Empowered Evolved Hex (EEH) và Empowered Evolved Shadow':['Empowered Evolved Blood','Empowered Evolved Hex','Empowered Evolved Shadow'],
};
const oldDetails=read('src/content/ultra/details.json');
for(const detail of Object.values(oldDetails))for(const entry of detail.additionalEquipment){const plain=entry.name.replace(/\s+\([A-Za-z]+\)$/,'');const e=Object.values(out.equipment).find(e=>e.name.toLowerCase()===plain.toLowerCase());if(plain!==entry.name&&e&&JSON.stringify(entry.blocks).replaceAll('http://','https://').includes(e.source))out.equipmentAliases[entry.name]=e.name;}
out.details['ultra-nulgath']={...oldDetails['ultra-nulgath'],additionalEquipment:oldDetails['ultra-nulgath'].additionalEquipment.map(item=>({...item,canonicalItemIds:groupedEquipment[item.name]?.map(id)}))};
out.legacyEquipmentGroups=[...Object.keys(groupedEquipment),"Các items còn lại của Drago's Royal Guard Set"].map(id);
out.equipmentEntityKinds=Object.fromEntries(out.legacyEquipmentGroups.map(id=>[id,'equipment_group']));
for(const routes of [...out.bosses.map(b=>b.equipmentRoutes),...Object.values(out.routeOverrides)])for(const route of routes)route.image=out.equipment[route.canonicalId].image;
fs.writeFileSync('src/content/ultra/recovery.json',JSON.stringify(out,null,2)+'\n');console.log('Structured recipes:',out.recipeAudit.filter(a=>a.status==='structured').length,'pending:',out.recipeAudit.filter(a=>a.status!=='structured').length);
