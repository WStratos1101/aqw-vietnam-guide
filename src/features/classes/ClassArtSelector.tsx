import {alternativeChoices}from'../../lib/class-ui-v12-8.mjs';
import {useState} from 'react';
import variants from '../../content/classes/art-runtime.json';
import {ClassAsset} from './ClassAsset';
export function ClassArtSelector({classId,image,name}:{classId:string;image?:string;name:string}){
 const arts=alternativeChoices(variants,classId,name);
 const [selected,setSelected]=useState(0);
 if(arts.length<2)return <ClassAsset id={image} name={name} eager/>;
 const art=arts[selected%arts.length];
 return <div className="class-art-selector"><div className="class-art-switch" role="group" aria-label="Đổi Art">{arts.map((a,i)=><button type="button" key={a.id} aria-pressed={i===selected} onClick={()=>setSelected(i)}>{a.variantName}</button>)}</div><div className="class-art"><img key={art.imagePath} className="class-character-art" src={art.imagePath} width={art.width} height={art.height} style={{maxWidth:art.width,maxHeight:art.height}} alt={`${art.variantName} — AdventureQuest Worlds`} decoding="async"/></div><span className="class-art-caption">{art.variantName}</span></div>;
}
