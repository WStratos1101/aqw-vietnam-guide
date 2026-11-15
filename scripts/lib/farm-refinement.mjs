import fs from "node:fs";
import { buildFarmPurchaseTasks } from "./farm-public-workflows.mjs";
import { materialId } from "../../src/lib/material-requirements.mjs";

// Additional reviewed locations are explicit alternatives, never inferred from names.
export function applyFarmRefinement(items, registry, pages, manifest) {
  const audit = { rarityAdded: [], rarityBlocked: [], shopAdded: [], canonicalShopUpdated: [], shopIncomplete: [], equipmentSets: { status: "SEPARATE_AUDIT", source: "content-sources/farm/equipment-sets/audit.json" } };
  for (const item of items) {
    const page=pages.get(item.wikiUrl);
    const values=[...new Set((page?.text || "").split(/^Skills?:/im)[0].split("\n").filter(line=>/^Rarity:/.test(line)).map(line=>line.replace(/^Rarity:\s*/, "").trim()).filter(Boolean))];
    if(!item.rarity && values.length===1){
      item.rarity=values[0];(item.fieldEvidence ||= {}).rarity=item.wikiUrl;
      item.unknownFields=(item.unknownFields || []).filter(field=>field!=="rarity");
      audit.rarityAdded.push({id:item.id,rarity:item.rarity,source:item.wikiUrl});
    }
    if(!item.rarity)audit.rarityBlocked.push({id:item.id,url:item.wikiUrl,reason:values.length>1?"Variant rarity conflict":"No explicit Rarity field in retained exact-item Wiki header"});
  }
  for(const spec of manifest.purchaseGuides){
    const page=pages.get(spec.url);
    if(!page)throw Error("Missing purchase evidence: "+spec.url);
    const price=page.price?.match(/^([\d,]+) (Gold|ACs?)$/);
    if(!price)throw Error("Missing unambiguous purchase price: "+spec.url);
    for(const location of spec.locations){
      for(const evidence of location.evidence){
        if(!pages.get(evidence.url)?.text.includes(evidence.quote))throw Error("Changed purchase location evidence: "+evidence.url);
      }
    }
    const id=materialId(spec.name);
    const tasks=spec.locations.map((location,index)=>({id:"purchase:"+id+":"+index,quest:null,title:spec.name,source:spec.url,
      npc:location.npc,shop:location.shop,location:location.name,map:location.map || null,shopAccess:location.shopAccess,
      purchase:{amount:Number(price[1].replaceAll(",","")),currency:price[2]},
      preconditions:spec.preconditions,requirements:[],rows:[],reward:spec.name+" ×1",rewardQuantity:1,
      evidence:location.evidence}));
    registry.materials[id]={name:spec.name,method:"Shop",tasks,questIds:[]};
    registry.materialLinks[id]=spec.url;
    const canonical=items.find(item=>item.wikiUrl===spec.url);
    if(canonical)for(const route of canonical.acquisitionRoutes.filter(route=>route.purchase))route.completionTasks=tasks;
    audit.shopAdded.push({id,alternatives:tasks.length});
  }
  for(const item of items){
    const page=pages.get(item.wikiUrl);
    for(const route of item.acquisitionRoutes.filter(route=>route.purchase)){
      const tasks=page?buildFarmPurchaseTasks(page,pages,item.name,item.id):[];
      if(tasks.length){
        route.completionTasks=tasks;
        registry.materials[materialId(item.name)]={name:item.name,method:"Shop",tasks,questIds:[]};
        audit.canonicalShopUpdated.push({id:item.id,routeId:route.id,alternatives:tasks.length});
      }else audit.shopIncomplete.push({id:item.id,routeId:route.id,source:item.wikiUrl,missing:["Exact-item Shop row / seller location snapshot"]});
    }
  }
  for(const [id,profile] of Object.entries(registry.materials))for(const task of profile.tasks || [])if(task.purchase){
    const missing=[!task.npc&&!task.shopAccess&&"npc",!task.shop&&"shop",!task.location&&"location",!task.map&&!task.shopAccess&&"map/access"].filter(Boolean);
    if(missing.length)audit.shopIncomplete.push({id,taskId:task.id,source:task.source,missing});
  }
  fs.writeFileSync("content-sources/farm/refinement/audit.json",JSON.stringify(audit,null,2)+"\n");
  return audit;
}
