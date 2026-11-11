import catalog from '../imported/catalog.json';
import type {ChallengeCategory} from './categories';
const docId='18Z2Yu0O40dVyh0enB_2k_v4U-De3mg1y-HtThUmvxfU';
export interface ChallengeGuide {id:string;name:string;category:ChallengeCategory;href:string;summary:string;sourceHeadingId:string;image?:string;bodyUrl:string;sectionId?:string;level?:number;maxHp?:number;wikiUrl?:string}
const chapters:[string,ChallengeCategory][]=[['god-of-the-depths','daily'],['kolr-usurper-of-flames','daily'],['astral-empyrean','daily'],['champion-drakath','weekly'],['darkon-the-conductor','weekly'],['gramiel-the-graceful','weekly']];
export const challengeGuides:ChallengeGuide[]=chapters.map(([slug,category])=>{
 const entry=catalog.find(e=>e.documentId===docId&&e.slug===slug)!;
 return {id:slug,name:entry.title,category,href:`/ultra-boss/${slug}`,summary:entry.summary,sourceHeadingId:entry.sourceHeadingId,bodyUrl:entry.bodyUrl};
});
for(const [id,name,anchor] of [['kasuko','Kasuko','h.hmqpo35f4gw'],['batara-kala','Batara Kala','h.x0b84zh6m3iz'],['ultra-iara','Ultra Iara','h.sy72smaiyv2v']])challengeGuides.push({id,name,category:'seasonal',href:`/ultra-boss/${id}`,summary:'Hướng dẫn sự kiện, cơ chế và đội hình.',sourceHeadingId:anchor,sectionId:anchor,bodyUrl:'/content/guides/challenge-guide-huong-dan-seasonal-challenge-boss.json'});
// Exact Monster pages reviewed 2026-11-08. No aggregate encounter HP.
const baseStats:Record<string,[number,number,string]>={
 'god-of-the-depths':[95,40000000,'god-of-the-depths'],
 'kolr-usurper-of-flames':[90,3000000,'kolr-usurper-of-flames'],
 'astral-empyrean':[100,28000000,'astral-empyrean'],
 'champion-drakath':[100,20000000,'champion-drakath-monster'],
 'darkon-the-conductor':[22,22222222,'darkon-the-conductor'],
 'gramiel-the-graceful':[95,7500000,'gramiel-the-graceful'],
 kasuko:[90,5000000,'kasuko'],'batara-kala':[90,2000000,'batara-kala'],
};
for(const guide of challengeGuides){const stats=baseStats[guide.id];if(stats){[guide.level,guide.maxHp]=stats;guide.wikiUrl=`https://aqwwiki.wikidot.com/${stats[2]}`;}guide.image=`challenge-${guide.id}`;}
export const findChallenge=(id:string)=>challengeGuides.find(g=>g.id===id);
export const challengeResources=catalog.filter(e=>e.documentId===docId&&['Challenge Dungeon','Other Challenge Boss'].includes(e.sourceGroup)&&e.level===2).map(e=>({id:e.id,title:e.title,category:e.sourceGroup,href:`/${e.category}/${e.slug}`}));
