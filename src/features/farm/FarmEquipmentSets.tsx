import { useEffect, useState } from "react";
import setData from "../../content/farm/equipment-sets.generated.json";
import { equipmentSetMembers, farmSetItemHref, type FarmEquipmentSet } from "../../lib/farm-equipment-sets.mjs";
import type { FarmV2Item } from "../../types/farm-v2";
import { factionTokens } from "./faction-tokens";
import "./farm-refinement-v3.css";
import "./set-card-v2.css"; // AQWVN-UI-REFINEMENT-V2
export const farmEquipmentSets=setData.sets as FarmEquipmentSet[];
export function FarmEquipmentSets({item,items,onItemClick}:{item:FarmV2Item;items:FarmV2Item[];onItemClick:(id:string)=>void}){
 const isHigure=/^(?:Empowered )?Higure$/i.test(item.name.trim());
 const sets=farmEquipmentSets.filter(set=>item.setIds?.includes(set.id) || (isHigure && /astravian corsair/i.test(set.name)));
 const [selected,setSelected]=useState(()=>new URLSearchParams(typeof window==="undefined"?"":window.location.search).get("farm-set") || sets[0]?.id);
 useEffect(()=>{const restore=()=>setSelected(new URLSearchParams(window.location.search).get("farm-set") || sets[0]?.id);window.addEventListener("popstate",restore);return()=>window.removeEventListener("popstate",restore);},[item.id]);
 const active=sets.find(set=>set.id===selected) || sets[0];
 if(!active) return isHigure ? <section className="fv-set" aria-label="Set đồ liên quan"><h3>Higure &amp; Astravian Corsair</h3><p>Higure và Empowered Higure thuộc cùng hướng dẫn farm với bộ Astravian Corsair. Bộ trang phục trong rương gồm 1 Armor, 3 Helms và 2 Capes.</p><a href="/farm/higure-astravian-corsair">Xem hướng dẫn Higure &amp; Astravian Corsair</a></section> : null;
 const members=equipmentSetMembers(active,items);
 const related=/astravian corsair/i.test(active.name) ? items.filter(entry=>/^(?:Empowered )?Higure$/i.test(entry.name.trim()) && !active.memberIds.includes(entry.id)) : [];
 return <section className="fv-set" aria-label="Set đồ" style={factionTokens(item.primaryGroupId || "all")}>
  {sets.length>1 && <label>Chọn set <select value={active.id} onChange={event=>{
    setSelected(event.target.value);const url=new URL(window.location.href);url.searchParams.set("farm-set",event.target.value);window.history.pushState(window.history.state,"",url.pathname+url.search);
  }}>{sets.map(set=><option value={set.id} key={set.id}>{set.name}</option>)}</select></label>}
  <div className="fv-set-heading"><h3>{active.name}</h3><output aria-label={`Số trang bị trong set: ${members.length}`}>{members.length}</output></div>
  <div className="fv-set-grid">{members.map(member=><a key={member.id} href={farmSetItemHref(member)} aria-current={member.id===item.id?"page":undefined} onClick={event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();const current=new URL(window.location.href);current.searchParams.set("farm-tab","sets");current.searchParams.set("farm-set",active.id);window.history.replaceState(window.history.state,"",current.pathname+current.search);onItemClick(member.id);
  }}>
    <div className="fv-set-art">{member.image && <img src={member.image} alt={member.name} width={145} height={145} loading="lazy"/>}</div>
    <span className="fv-set-name">{member.name}</span>
  </a>)}</div>
  {related.length>0 && <div className="fv33-set-related"><h4>Vũ khí liên quan · Higure &amp; Astravian Corsair</h4><p>Hai vũ khí cùng tuyến hướng dẫn, không tính vào 6 phần trang phục nhận từ rương.</p><ul>{related.map(entry=><li key={entry.id}><a href={farmSetItemHref(entry)} onClick={event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();onItemClick(entry.id);}}>{entry.name}</a></li>)}</ul></div>}
 </section>;
}
