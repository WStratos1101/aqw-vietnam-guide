import { useEffect, useState } from "react";
import setData from "../../content/farm/equipment-sets.generated.json";
import { equipmentSetMembers, farmSetItemHref, type FarmEquipmentSet } from "../../lib/farm-equipment-sets.mjs";
import { farmBoost } from "../../lib/farm-details.mjs";
import type { FarmV2Item } from "../../types/farm-v2";
import { factionTokens } from "./faction-tokens";
import { FarmTypeIcon } from "./FarmTypeIcon";
export const farmEquipmentSets=setData.sets as FarmEquipmentSet[];
export function FarmEquipmentSets({item,items,onItemClick}:{item:FarmV2Item;items:FarmV2Item[];onItemClick:(id:string)=>void}){
 const sets=farmEquipmentSets.filter(set=>item.setIds?.includes(set.id));
 const [selected,setSelected]=useState(()=>new URLSearchParams(typeof window==="undefined"?"":window.location.search).get("farm-set") || sets[0]?.id);
 useEffect(()=>{const restore=()=>setSelected(new URLSearchParams(window.location.search).get("farm-set") || sets[0]?.id);window.addEventListener("popstate",restore);return()=>window.removeEventListener("popstate",restore);},[item.id]);
 const active=sets.find(set=>set.id===selected) || sets[0];
 if(!active)return null;
 const members=equipmentSetMembers(active,items);
 return <section className="fv-set" aria-label="Set đồ" style={factionTokens(item.primaryGroupId || "all")}>
  {sets.length>1 && <label>Chọn set <select value={active.id} onChange={event=>{
    setSelected(event.target.value);const url=new URL(window.location.href);url.searchParams.set("farm-set",event.target.value);window.history.pushState(window.history.state,"",url.pathname+url.search);
  }}>{sets.map(set=><option value={set.id} key={set.id}>{set.name}</option>)}</select></label>}
  <h3>{active.name}</h3><p>{members.length} trang bị</p>
  <div className="fv-set-grid">{members.map(member=><a key={member.id} href={farmSetItemHref(member)} aria-current={member.id===item.id?"page":undefined} onClick={event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();const current=new URL(window.location.href);current.searchParams.set("farm-tab","sets");current.searchParams.set("farm-set",active.id);window.history.replaceState(window.history.state,"",current.pathname+current.search);onItemClick(member.id);
  }}>
    <div className="fv-set-art">{member.image && <img src={member.image} alt={member.name} width={145} height={145} loading="lazy"/>}</div>
    <span className="fv-set-name"><FarmTypeIcon name={member.subtype || member.category} fallbackName={member.category}/>{member.name}</span>
    {(member.descriptionVi||member.wikiDetails?.descriptionVi) && <small>{member.descriptionVi||member.wikiDetails?.descriptionVi}</small>}
    {!farmBoost(member).includes("Chưa xác minh") && <small>{farmBoost(member).join(" · ")}</small>}
  </a>)}</div>
 </section>;
}
