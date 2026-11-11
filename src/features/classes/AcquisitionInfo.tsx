import {Coins,ScrollText,Package,KeyRound}from'lucide-react';import type{ClassAcquisition}from'../../types/class-acquisition';
export function AcquisitionInfo({summary,acquisition}:{summary:string;acquisition?:ClassAcquisition}){
 const primary=acquisition?.methods.find(m=>m.isAvailable!==false)||acquisition?.methods[0];const Icon=primary?.quest?ScrollText:primary?.merge?Package:Coins;
 return <div className="hero-acquisition-info"><span><Icon size={15}/>{summary}</span>{!!primary?.prerequisites.length&&<details><summary><KeyRound size={12}/>Điều kiện mở khóa</summary><ul>{primary.prerequisites.map((p,i)=><li key={i}>{p}</li>)}</ul></details>}</div>;
}
