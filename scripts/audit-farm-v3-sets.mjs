import fs from 'node:fs';
import inventory from '../Update/AQW_Farm_Inventory_V3/aqw-farm-inventory.mjs';
import { sha,atomic,canonical } from './lib/farm-sync-engine.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root='content-sources/farm/equipment-sets',catalog=read('src/content/farm/catalog-v2.generated.json').items,production=read('src/content/farm/equipment-sets.generated.json').sets;
const index=read(root+'/research-index.json').identities,reviewed=read(root+'/reviewed-inventories.json').sets,blockers=read(root+'/research-blockers.json');
const norm=s=>s.normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
const byUrl=new Map(catalog.map(i=>[canonical(i.wikiUrl),i]));
const sets=inventory.equipmentSets.map(set=>{
 const reviewedSet=reviewed.find(s=>s.id===set.id),existing=production.find(s=>s.id===set.id);
 const members=set.members.map(member=>{
   const alias=blockers.aliases.find(a=>a.setId===set.id&&a.name===member.name);
   const urls=member.wikiUrl?[canonical(member.wikiUrl)]:alias?[canonical(alias.wikiUrl)]:index[norm(member.name)]||[];
   const matches=urls.map(u=>byUrl.get(canonical(u))).filter(Boolean);
   const item=matches.length===1?matches[0]:null;
   return {...member,observedWikiUrls:urls,canonicalId:item?.id||null,status:urls.length>1?'ambiguous':item?'present':'missing-set-member',membership:!item?'pending-item-verification':existing?.memberIds.includes(item.id)?'existing-source-backed-relation':'pending-relation-review',aliasEvidence:alias||null};
 });
 return {id:set.id,name:set.name,existingMembers:existing?.memberIds||[],inventoryMemberRows:members,missingMembers:members.filter(m=>!m.canonicalId),resolvedButOutsideSet:members.filter(m=>m.canonicalId&&!existing?.memberIds.includes(m.canonicalId)),reviewedExpectedCount:reviewedSet?.expectedCount||null,reviewedMemberUrls:reviewedSet?.members.map(m=>m.wikiUrl)||[],blockers:blockers.sets.filter(s=>s.id===set.id),status:'PARTIAL'};
});
const integrity=production.map(set=>({id:set.id,memberCount:set.memberIds.length,duplicateIds:set.memberIds.filter((id,i,ids)=>ids.indexOf(id)!==i),danglingIds:set.memberIds.filter(id=>!catalog.some(i=>i.id===id)),evidence:set.evidence.map(e=>({itemId:e.itemId,guideHashValid:sha(fs.readFileSync(e.guide.sourceFile))===e.guide.sourceHash,wikiHashValid:sha(fs.readFileSync(e.wiki.sourceFile))===e.wiki.sourceHash}))}));
const pending=inventory.pendingSetScopes.map(scope=>({...scope,productionMatches:production.filter(s=>norm(s.name)===norm(scope.name)).map(s=>s.id),disposition:'pending-scope-review'}));
atomic('Update/_farm-sources/set-audit.json',{complete:false,catalogCount:catalog.length,productionSets:production.length,inventorySets:sets,pendingSetScopes:pending,integrity});
console.log({sets:sets.length,pendingScopes:pending.length,production:production.length,unmatchedMembers:sets.flatMap(s=>s.missingMembers).length,invalidProduction:integrity.filter(s=>s.duplicateIds.length||s.danglingIds.length||s.evidence.some(e=>!e.guideHashValid||!e.wikiHashValid)).length});
