import fs from 'node:fs';
import {sumMaterials,mainWorkflowTasks,finalReceiptTasks} from '../src/lib/farm-workflows.mjs';
import {materialLeaves,requiredMaterials,selectedMaterials} from '../src/lib/material-requirements.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const base='Update/_offline-staging/20261117-081737/v3-4';
const previous=read(base+'/catalog-v2.generated.json').items,current=read('src/content/farm/catalog-v2.generated.json').items;
const registries=[read(base+'/quest-workflows.generated.json'),read('src/content/farm/quest-workflows.generated.json')];
function displayed(route,registry,after){
 if(route.materialTree&&!route.questWorkflowIds?.length&&!route.farmModes?.length)return selectedMaterials(route.materialTree).map(r=>({name:r.name,itemId:r.itemId,quantity:r.quantity,source:r.source}));
 const mode=route.farmModes?.[0],tasks=mainWorkflowTasks(route,registry,mode?.id);
 const grouped=new Set((route.operationGroups||[]).flatMap(g=>g.tasks.map(t=>t.id)));
 const finish=[...(mode?.finishingTasks?.length?mode.finishingTasks:route.completionTasks||(route.farmTasks||[]).filter(t=>!t.quest&&!grouped.has(t.id))),...finalReceiptTasks(route,registry,mode)];
 const operations=tasks.flatMap(t=>registry.operationGroups?.[t.id]||[]);
 const total=mode?.materials||(after&&route.materialPlan?.materials)||sumMaterials([...tasks,...operations,...finish]);
 return (total.length?total:after?route.directMaterials??requiredMaterials(route.materialTree):materialLeaves(route.materialTree)).map(r=>({name:r.name,itemId:r.itemId,quantity:r.quantity,source:r.source}));
}
const records=[];
for(const item of current)for(const route of item.acquisitionRoutes){
 const old=previous.find(i=>i.id===item.id)?.acquisitionRoutes.find(r=>r.id===route.id);
 const before=old?displayed(old,registries[0],false):null,after=displayed(route,registries[1],true);
 records.push({itemId:item.id,routeId:route.id,status:route.materialTotalsComplete?'RETAINED_CERTIFIED':'PARTIAL_UNCERTIFIED',baselinePresent:Boolean(old),
  uiMaterialsBefore:before,uiMaterialsAfter:after,changed:Boolean(before)&&JSON.stringify(before)!==JSON.stringify(after),directMaterials:route.directMaterials,
  equivalentCosts:route.materialPlan?.equivalentCosts||[],storyConditions:route.storyPrerequisites,planStatus:route.materialPlan?.status||null,planGaps:route.materialPlan?.gaps||[],
  note:'Before reproduces the default V3.3 display from its preserved catalog/registry. After uses the isolated selected default route; alternatives are not added. Unknown/nested evidence is not certified by this arithmetic comparison.'});
}
const file='Update/FARM_V3_4_MATERIAL_AUDIT.json',audit=read(file);
Object.assign(audit,{baselineComparison:{baselineItems:previous.length,items:current.length,baselineRoutes:previous.reduce((n,i)=>n+i.acquisitionRoutes.length,0),currentRoutes:records.length,defaultDisplaysChanged:records.filter(r=>r.changed).length,newlyCertifiedRoutes:0,retainedCertifiedRoutes:records.filter(r=>r.status==='RETAINED_CERTIFIED').length,records}});
fs.writeFileSync(file,JSON.stringify(audit,null,2)+'\n');console.log({routes:records.length,changed:records.filter(r=>r.changed).length});
