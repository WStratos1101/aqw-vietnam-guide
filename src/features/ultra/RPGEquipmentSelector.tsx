import challengeEquipment from '../../content/challenges/equipment.json';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ChevronLeft,ChevronRight,Swords,Shield,Shirt,Package} from 'lucide-react';
import assets from '../../data/aqw-assets.json';
import type {EquipmentRoute} from '../../types/ultra';
import {equipmentFilters,equipmentCategory,equipmentCategoryLabel,selectEquipment} from '../../lib/equipment-category.mjs';
import {equipmentFor,EquipmentStatStrip,MaterialRequirements} from './EquipmentMetadata';

function EquipmentArtwork({route,thumbnail=false}:{route:EquipmentRoute;thumbnail?:boolean}){
 const [failed,setFailed]=useState(false);
 const asset=assets.find(a=>a.assetId===route.image&&a.verificationStatus==='verified'&&a.usageStatus==='approved'&&a.imagePath)||challengeEquipment.assets.find(a=>a.id===route.image&&a.verificationStatus==='verified'&&a.usageStatus==='approved');
 const category=equipmentCategory(route.category),Icon=category==='weapon'?Swords:category==='armor'?Shirt:category==='helm'||category==='cape'?Shield:Package;
 return asset&&!failed?<img src={asset.imagePath!} alt={thumbnail?'':route.itemName} width={asset.width||320} height={asset.height||320} loading={thumbnail?'lazy':'eager'} decoding="async" onError={()=>setFailed(true)}/>:<span className="equipment-type-fallback" role={thumbnail?undefined:'img'} aria-label={thumbnail?undefined:route.itemName}><Icon size={thumbnail?28:80} aria-hidden="true"/></span>;
}
export function RPGEquipmentSelector({routes,renderDetails}:{routes:EquipmentRoute[];renderDetails:(route:EquipmentRoute)=>ReactNode}){
 const [filter,setFilter]=useState('all'),[selectedId,setSelectedId]=useState<string|undefined>(routes[0]?.id);
 const strip=useRef<HTMLDivElement>(null);
 const {choices,selected}=selectEquipment(routes,filter,selectedId);
 const [edges,setEdges]=useState({start:true,end:false});
 useEffect(()=>{setSelectedId(selected?.id);},[selected?.id]);
 useEffect(()=>{const el=strip.current,button=el?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');if(el&&button)el.scrollTo({left:button.offsetLeft-el.offsetLeft-(el.clientWidth-button.clientWidth)/2,behavior:'instant'});},[filter,selected?.id]);
 useEffect(()=>{
  const el=strip.current;if(!el)return;
  const update=()=>setEdges({start:el.scrollLeft<2,end:el.scrollLeft+el.clientWidth>=el.scrollWidth-2});
  update();el.addEventListener('scroll',update,{passive:true});const observer=new ResizeObserver(update);observer.observe(el);
  return()=>{el.removeEventListener('scroll',update);observer.disconnect();};
 },[filter,choices.length]);
 const move=(direction:number)=>{const el=strip.current;if(el)el.scrollBy({left:direction*el.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 const item=selected&&equipmentFor(selected.itemName);
 return <div className="rpg-equipment-selector">
  <div className="challenge-filters equipment-type-filters" role="group" aria-label="Loại trang bị">{equipmentFilters.map(f=><button key={f.id} aria-pressed={filter===f.id} onClick={()=>setFilter(f.id)}>{f.label}</button>)}</div>
  {selected?<>
   <div className="equipment-strip-navigation">
    <button className="equipment-strip-arrow" aria-label="Trang bị trước" disabled={edges.start} onClick={()=>move(-1)}><ChevronLeft size={18}/></button>
    <div className="equipment-selection-strip ultra-equipment-gallery" ref={strip} role="group" aria-label="Chọn trang bị" key={filter}>
     {choices.map(route=><button className={`equipment-thumbnail ultra-equipment-choice ${selected.id===route.id?'selected':''}`} key={route.id} title={route.itemName} aria-label={route.itemName} aria-pressed={selected.id===route.id} onClick={()=>setSelectedId(route.id)}><EquipmentArtwork key={route.image} route={route} thumbnail/></button>)}
    </div>
    <button className="equipment-strip-arrow" aria-label="Trang bị tiếp theo" disabled={edges.end} onClick={()=>move(1)}><ChevronRight size={18}/></button>
   </div>
   <div className="equipment-selection-meta"><span>SELECTED EQUIPMENT</span><span>{choices.findIndex(r=>r.id===selected.id)+1} / {choices.length}</span></div>
   <div className="rpg-equipment-preview" key={selected.id} data-equipment-id={selected.canonicalId||selected.id}>
    <div className="equipment-large-art"><EquipmentArtwork key={selected.image} route={selected}/></div>
    <div className="equipment-selected-content">
     <p className="equipment-selected-type">{equipmentCategoryLabel(item?.equipmentType||selected.category)}{selected.group==='empowered'?' · EMPOWERED':''}</p>
     <h3>{selected.itemName}</h3>
     <EquipmentStatStrip name={selected.itemName}/>
     <MaterialRequirements name={selected.itemName}/>
     {renderDetails(selected)}
    </div>
   </div>
  </>:<p className="ultra-empty" role="status">Không có trang bị thuộc loại này.</p>}
 </div>;
}
