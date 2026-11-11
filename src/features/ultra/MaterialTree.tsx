import {useEffect,useId,useState} from 'react';
import {Package} from 'lucide-react';
import {materialProgress,selectedMaterials,type MaterialNode,type MaterialSelections} from '../../lib/material-requirements.mjs';
import {readStoredValue,writeStored} from '../../lib/storage';
import assets from '../../data/aqw-assets.json';
interface State {selections:MaterialSelections;done:string[]}
function isState(value:unknown):value is State {if(!value||typeof value!=='object')return false;const s=value as Partial<State>;return !!s.selections&&typeof s.selections==='object'&&!Array.isArray(s.selections)&&Object.values(s.selections).every(v=>Array.isArray(v)&&v.every(n=>Number.isInteger(n)&&n>=0))&&Array.isArray(s.done)&&s.done.every(v=>typeof v==='string');}
export function MaterialTree({tree,scope}:{tree:MaterialNode;scope:string}){
 const key='aqw:materials:v2:'+scope,id=useId();const [state,setState]=useState<State>({selections:{},done:[]});const [error,setError]=useState('');
 useEffect(()=>{const load=()=>setState(readStoredValue<State>(key,{selections:{},done:[]},isState));load();window.addEventListener('aqw-material-change',load);window.addEventListener('storage',load);return()=>{window.removeEventListener('aqw-material-change',load);window.removeEventListener('storage',load);};},[key]);
 function update(next:State){setState(next);const ok=writeStored(key,next);setError(ok?'':'Bộ nhớ bị chặn; tiến độ chỉ giữ trong phiên này.');if(ok)window.dispatchEvent(new Event('aqw-material-change'));}
 function render(node:MaterialNode,path='root'):React.ReactNode{
  if(node.kind==='item'){const token=path+':'+node.itemId;const asset=assets.find(a=>a.entityType==='item'&&a.entityName===node.name&&a.verificationStatus==='verified'&&a.usageStatus==='approved'&&a.imagePath);return <li className="material-tree-item" key={path}><label><input type="checkbox" checked={state.done.includes(token)} onChange={()=>update({...state,done:state.done.includes(token)?state.done.filter(k=>k!==token):[...state.done,token]})}/>{asset?<img src={asset.imagePath!} alt="" width={24} height={24} loading="lazy" style={{objectFit:'contain'}}/>:<Package size={15} aria-hidden="true"/>}<span>{node.name}</span><strong>×{node.quantity.toLocaleString('vi-VN')}</strong></label></li>;}
  const stored=state.selections[path];const choices=Array.isArray(stored)?stored:Array.from({length:node.requiredChoices||1},(_,i)=>i);
  return <li key={path} className={'material-tree-group '+node.kind}>{node.kind==='anyOf'?<fieldset><legend>Chọn {node.requiredChoices||1} trong các phương án</legend>{node.requirements.map((child,i)=><div key={i}><label className="material-option"><input type={(node.requiredChoices||1)===1?'radio':'checkbox'} name={id+path} checked={choices.includes(i)} onChange={()=>{let selected=(node.requiredChoices||1)===1?[i]:choices.includes(i)?choices.filter(c=>c!==i):[...choices,i].slice(-(node.requiredChoices||1));update({...state,selections:{...state.selections,[path]:selected}});}}/>{child.kind==='item'?`${child.name} ×${child.quantity}`:`Phương án ${i+1}`}</label>{choices.includes(i)&&<ul>{render(child,path+'.'+i)}</ul>}</div>)}</fieldset>:<ul>{node.requirements.map((n,i)=>render(n,path+'.'+i))}</ul>}</li>;
 }
 const progress=materialProgress(tree,state.selections,state.done);const count=selectedMaterials(tree,state.selections).length;
 return <div className="material-tree"><p className="material-progress">Nguyên liệu đã đánh dấu: {progress.done} / {count} loại theo phương án đang chọn</p><ul>{render(tree)}</ul>{error&&<p role="status">{error}</p>}</div>;
}
