import {ArrowRight,Repeat2,Flame,TriangleAlert}from'lucide-react';
import type{ClassSkill}from'../../types/classes';import{SkillIcon}from'./SkillIcon';
export function SkillSequenceFlow({sequence,skills,label,onSelect}:{sequence:number[];skills:ClassSkill[];label:string;onSelect:(skill:ClassSkill)=>void}){
 return <ol className="skill-sequence-flow" aria-label={label}>{sequence.map((slot,index)=>{const skill=skills.find(s=>s.skillNumber===slot&&!s.quarantined);return <li key={index}>{index>0&&<ArrowRight className="sequence-arrow" size={14} aria-hidden="true"/>}<button type="button" onClick={()=>skill&&onSelect(skill)} aria-label={`Bước ${index+1}: ${skill?.name||'Slot '+slot}`} disabled={!skill}>{skill&&<SkillIcon skill={skill}/>}<kbd>{slot}</kbd><small>{skill?.name||'Slot '+slot}</small></button></li>;})}</ol>;
}
export function FlowLabel({label,kind}:{label:string;kind:string}){const Icon=kind==='warning'?TriangleAlert:kind==='loop'||kind==='spam'||kind==='cooldown'?Repeat2:Flame;return <h4 className="combo-flow-label"><Icon size={15}/>{label}</h4>;}
