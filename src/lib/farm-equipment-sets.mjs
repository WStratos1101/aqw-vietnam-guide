import { farmItemHref } from "./farm-catalog.mjs";
const order=["Weapons","Armors","Helms","Capes / Back Items","Pets","Classes"];
export function equipmentSetMembers(set,items){
 const byId=new Map(items.map(item=>[item.id,item]));
 return set.memberIds.map(id=>byId.get(id)).filter(Boolean).sort((a,b)=>(order.indexOf(a.category)<0?order.length:order.indexOf(a.category))-(order.indexOf(b.category)<0?order.length:order.indexOf(b.category))||a.name.localeCompare(b.name,"en"));
}
export function farmSetItemHref(item){
 const query=new URLSearchParams({group:item.primaryGroupId || "unknown",category:item.category,view:"reference","farm-tab":"guide"});
 const route=item.acquisitionRoutes?.[0];
 if(route){query.set("farm-route",route.id);if(route.questFinishIds?.[0])query.set("farm-quest",route.questFinishIds[0]);}
 if(item.subtype)query.set("subtype",item.subtype);
 return farmItemHref(item.id)+"?"+query;
}
export function validateEquipmentSets(sets,items){
 const ids=new Set(items.map(item=>item.id)),setIds=new Set(),errors=[];
 for(const set of sets){
  if(setIds.has(set.id))errors.push("Duplicate set "+set.id);setIds.add(set.id);
  if(!set.memberIds.length)errors.push("Empty set "+set.id);
  if(new Set(set.memberIds).size!==set.memberIds.length)errors.push("Duplicate members "+set.id);
  for(const id of set.memberIds)if(!ids.has(id))errors.push("Dangling item "+set.id+":"+id);
 }
 for(const item of items)for(const id of item.setIds || [])if(!sets.find(set=>set.id===id)?.memberIds.includes(item.id))errors.push("Invalid reverse membership "+item.id+":"+id);
 return errors;
}
