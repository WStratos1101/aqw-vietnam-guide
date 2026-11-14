import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {comboFlow} from '../src/lib/class-presentation.mjs';
import {farmWikiFacts} from './lib/farm-wiki-facts.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const farm=read('src/content/farm/catalog-v2.generated.json');
const imported=read('content-sources/farm/import/ultra-import-audit.json');
const records=[...read('content-sources/farm/import/wiki-records.json'),...read('content-sources/farm/import/detail-wiki-records.json'),...imported.records];
const recipe=n=>!n?null:n.kind==='item'?{kind:n.kind,name:n.name.toLowerCase(),quantity:n.quantity}:{kind:n.kind,requiredChoices:n.requiredChoices||null,requirements:n.requirements.map(recipe)};
const issues=[];
const farmRows=farm.items.map(item=>{
 const record=records.find(r=>r.wikiUrl===item.wikiUrl),facts=record?farmWikiFacts(record):null;
 if(facts?.materialTree&&!item.acquisitionRoutes.some(r=>JSON.stringify(recipe(r.materialTree))===JSON.stringify(recipe(facts.materialTree))))issues.push({id:item.id,type:'recipe-conflict',source:item.wikiUrl,reason:'Cached Wiki recipe differs from all retained route recipes; route scope and curated priority require review.'});
 return {id:item.id,group:item.groupIds[0]||null,groupStatus:item.groupStatus,source:item.wikiUrl,hasCachedBody:!!record,snapshotStatus:record?.snapshotStatus||'cached',category:item.category,subtype:item.subtype||null,methods:item.acquisitionRoutes.map(r=>r.method),hasMaterialTree:item.acquisitionRoutes.some(r=>r.materialTree),hasStructuredQuests:item.acquisitionRoutes.some(r=>r.farmTasks?.length),unknownFields:['group','subtype','location','quest','map','buy','sell','boost'].filter(field=>field==='group'?!item.groupIds.length:field==='subtype'?item.category==='Weapons'&&!item.subtype:field==='location'?!item.acquisitionRoutes.some(r=>r.location):field==='quest'?!item.acquisitionRoutes.some(r=>r.questReward||r.farmTasks?.length):field==='map'?!item.acquisitionRoutes.some(r=>r.mapCommand):field==='buy'?!item.wikiDetails?.priceRaw&&!item.acquisitionRoutes.some(r=>r.purchase):field==='sell'?!item.wikiDetails?.sellback:!item.effects?.length&&!item.wikiDetails?.specialEffectsVi?.length)};
});
const classes=read('src/content/classes/catalog.json'), registry=read('src/content/classes/skill-registry.json');
let combos=0,iconUses=0;const missing=[];
const classRows=classes.map(profile=>{
 const body=read('public'+profile.bodyUrl);let count=0;
 for(const combo of body.combos){combos++;count++;for(const flow of comboFlow(combo))for(const slot of [...flow.sequences.flat(),...(flow.prioritySkill?[flow.prioritySkill]:[])]){iconUses++;const skill=body.skills.find(s=>s.skillNumber===slot&&!s.quarantined);if(!skill?.iconAsset||skill.iconAsset.classId!==skill.classId||skill.iconAsset.skillId!==skill.id||!fs.existsSync('public'+skill.iconAsset.imagePath))missing.push({classId:profile.id,comboId:combo.id,flowId:flow.id,slot});}}
 return {classId:profile.id,combos:count};
});
const sets=read('src/content/classes/calendar-items.json');
const calendar=classes.filter(p=>p.id.startsWith('calendar-')).map(p=>{
 const source=registry.classes[p.id]?.sourceUrl||p.sources?.find(s=>s.url?.includes('wikidot'))?.url;
 const slug=source?new URL(source).pathname.slice(1):null;
 const paths=slug?['content-sources/class-wiki/'+slug+'.html','content-sources/v12-6/wiki/'+slug+'.html']:[];
 const snapshot=paths.find(f=>fs.existsSync(f));
 const html=snapshot?fs.readFileSync(snapshot,'utf8'):'';
 const linked=[...new Set([...html.matchAll(/(?:https?:\/\/aqwwiki\.wikidot\.com)?\/(class-item-[a-z0-9-]+)/g)].map(m=>'https://aqwwiki.wikidot.com/'+m[1]))];
 const year=/calendar-(corrupted|timeless)-chronomancer$/.test(p.id)?'2019':/calendar-(underworld|overworld)-chronomancer$/.test(p.id)?'2020':null;
 return {classId:p.id,name:p.name,source:source||null,snapshot:snapshot||null,snapshotHash:snapshot?createHash('sha256').update(html).digest('hex'):null,items:year?sets[year].items.map(i=>i.wiki):[],linkedClassItems:linked,status:year?'item-set-reviewed':snapshot?'no-class-item-links-in-retained-page':'PENDING_SOURCE'};
});
const result={farm:{reviewed:farm.items.length,addedUltra:imported.added.length,assigned:farmRows.filter(i=>i.group).length,unassigned:farmRows.filter(i=>!i.group).length,rows:farmRows,conflicts:issues},classes:{reviewed:classes.length,combos,iconUses,missingIconUses:missing.length,missing,rows:classRows},calendar:{reviewed:calendar.length,items:Object.values(sets).reduce((n,s)=>n+s.items.length,0),missingIcons:Object.values(sets).flatMap(s=>s.items).filter(i=>!i.image).map(i=>i.wiki),rows:calendar}};
fs.mkdirSync('artifacts/qa/v3-2',{recursive:true});fs.writeFileSync('artifacts/qa/v3-2/data-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({farm:result.farm.reviewed,ultra:imported.added.length,unknownGroups:result.farm.unassigned,recipeConflicts:issues.length,classes:classes.length,combos,missingIconUses:missing.length,calendar:calendar.length,missingItemIcons:result.calendar.missingIcons.length}));
