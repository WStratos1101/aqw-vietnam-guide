import challengeAssets from '../../content/challenges/assets.json';
import assets from '../../data/aqw-assets.json';
import {Asset} from './Asset';
export function MonsterPortrait({source,name,compact=false}:{source:string;name:string;compact?:boolean}){const a=assets.find(a=>a.entityType==='monster'&&a.sourcePage===source&&a.verificationStatus==='verified'&&a.usageStatus==='approved');const extra=challengeAssets.find(a=>a.sourceUrl===source&&a.usageStatus==='approved');return <Asset asset={extra as import('../../types/ultra').GameAsset|undefined} id={a?.assetId||extra?.id||'pending-monster'} label={name} compact={compact}/>;}
