import {bossDisplayName} from '../../lib/boss-names';
import {useEffect,useState} from 'react';
import {ultraBosses} from '../../content/ultra';
import {challengeCategoryFor} from '../../content/ultra/categories';
import {inspectionFor} from './EnemyInspection';
import {BossDirectoryCard,type BossDirectoryEntry} from './BossDirectoryCard';
import {eligibleBossRecommendations,chooseBossRecommendations} from '../../lib/boss-recommendations.mjs';
const entries:BossDirectoryEntry[]=ultraBosses.map(b=>({id:b.slug,name:bossDisplayName(b.slug,inspectionFor(b.slug)?.monsters.find(m=>m.id==='boss')?.canonicalName||b.name),href:'/ultra-boss/'+b.slug,image:b.images.portrait,category:challengeCategoryFor(b.slug)}));
export function BossRecommendations({currentSlug}:{currentSlug:string}){
 // Deterministic initial markup for SSR; randomize only when entering the page.
 const [choices,setChoices]=useState(()=>eligibleBossRecommendations(entries,currentSlug).slice(0,3));
 useEffect(()=>{setChoices(chooseBossRecommendations(entries,currentSlug));},[currentSlug]);
 return choices.length?<section className="ultra-section boss-recommendations" aria-labelledby="boss-recommendations-title"><h2 id="boss-recommendations-title">Tiếp tục tra cứu</h2><div className="ultra-gallery">{choices.map(entry=><BossDirectoryCard key={entry.id} entry={entry}/>)}</div></section>:null;
}
