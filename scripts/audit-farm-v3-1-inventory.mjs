// Read existing cache/catalog only. Candidate rows remain candidates until reviewed.
import fs from 'node:fs';
import { farmBoost } from '../src/lib/farm-details.mjs';
const requiredNames=['Goddess of War','Radiant Goddess of War','Goddess of War Cloak','Goddess of War Blades','Goddess of War Battlefield','Malgor the ShadowLord',"Malgor's Shadowflame Blade","Malgor's Half-Wing",'Higure','Empowered Higure',"Darkon's Debris 1","Empowered Darkon's Debris 1","Darkon's Debris 2 (Recovered)","Darkon's Debris 2 (Reconstructed)","Dual Darkon's Debris 2",'Hollowborn Vindicator','Chaos Avenger','Chaos Avenger Armor',"Chaos Avenger's Greatsword","Chaos Avenger's Hook Blade","Chaos Avenger's Armet","Chaos Avenger's Helm","Chaos Avenger's Tentacled Armet","Chaos Avenger's Cloak",'Empowered Chaos Avenger Armor'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read('src/content/farm/catalog-v2.generated.json');
const sets=read('src/content/farm/equipment-sets.generated.json').sets;
const diff=read('Update/FARM_V3_SOURCE_DIFF.json');
const setAudit=read('Update/_farm-sources/set-audit.json');
const manifest=read('Update/_farm-sources/manifest.json');
const byUrl=new Map(catalog.items.map(i=>[i.wikiUrl,i]));
const members=id=>sets.filter(s=>s.memberIds.includes(id)).map(s=>s.id);
const known=v=>v!=null&&v!==''&&!['unknown','—','-'].includes(v);
const missing=i=>[
  ...(!known(i.membership||i.wikiDetails?.membership)?['membership']:[]),
  ...(!known(i.rarity||i.wikiDetails?.rarity)?['rarity']:[]),
  ...(!i.wikiUrl?.startsWith('https://aqwwiki.wikidot.com/')?['canonicalWikiUrl']:[]),
  ...(!i.descriptionVi&&!i.wikiDetails?.descriptionVi?['descriptionVi']:[]),
  ...(farmBoost(i).some(b=>/Chưa xác minh|Unknown|N\/A/.test(b))?['boostVerification']:[]),
];
const candidates=[...diff.siteReferences.map(r=>({...r,sourceKind:'Sites'})),...diff.docsTargets.map(r=>({...r,sourceKind:'Docs'})),...diff.materialReferences.map(r=>({...r,sourceKind:'material-candidate'}))].map(r=>{
  const i=r.url?byUrl.get(r.url):catalog.items.find(i=>i.id===r.canonicalId);
  return {sourceItem:r.name,canonicalItemName:i?.name||null,canonicalWikiUrl:i?.wikiUrl||null,sourceUrl:r.url||null,faction:i?.primaryGroupId||null,itemType:i?.category||null,setIds:i?members(i.id):[],sourceKind:r.sourceKind,sourceEvidence:r.provenance||r.source||{guideId:r.guideId,lines:r.lines},productionStatus:i?'present':r.status,missingFields:i?missing(i):['identity-role-and-fields-review'],verificationStatus:r.verificationStatus||'pending-role-and-wiki-review',candidateIds:r.candidateIds||[],role:r.sourceKind==='material-candidate'?'material-candidate':'pending-target-vs-mention-review'};
});
const requiredTargets=requiredNames.map(name=>{
 const exact=value=>String(value||'').normalize('NFKC').replace(/[’‘]/g,"'").toLocaleLowerCase('en');
 const matches=catalog.items.filter(i=>[i.name,i.originalName].some(n=>exact(n)===exact(name))||exact(i.name)===exact(name+' (Class)'));
 return {sourceItem:name,sourceKind:'explicit-user-target',matches:matches.map(i=>({id:i.id,name:i.name,wikiUrl:i.wikiUrl,faction:i.primaryGroupId,setIds:members(i.id)})),status:matches.length===1?'present-needs-field-and-scope-audit':matches.length?'ambiguous':'missing-exact-name-needs-canonical-review'};
});
for(const target of requiredTargets.filter(t=>t.matches.length!==1))candidates.push({sourceItem:target.sourceItem,canonicalItemName:null,canonicalWikiUrl:null,sourceUrl:null,faction:null,itemType:null,setIds:[],sourceKind:target.sourceKind,sourceEvidence:'Current user task sections 3–6',productionStatus:target.status,missingFields:['canonical-identity','required-fields'],verificationStatus:'pending-cache-and-identity-review',role:'explicit-target'});
const failures=Object.values(manifest).filter(r=>['PERMANENT_FAILURE','ACCESS_BLOCKED','RETRY_LATER'].includes(r.syncStatus)||r.status==='blocked');
const pending=Object.values(manifest).filter(r=>r.syncStatus==='PENDING'||r.status==='pending');
const counts={};for(const row of Object.values(manifest)){const s=row.syncStatus||row.status;counts[s]=(counts[s]||0)+1;}
let syncProcess='no-lock';try{const lock=read('Update/_farm-sources/sync.lock');try{process.kill(lock.pid,0);syncProcess='alive';}catch(e){syncProcess=e.code==='ESRCH'?'stopped-stale-lock':`unknown-${e.code}`;}}catch{}
const audit={schemaVersion:1,generatedAt:new Date().toISOString(),complete:false,status:'PARTIAL',packageVersion:read('package.json').version,catalogBeforeThisBatch:571,catalogAfter:catalog.items.length,setsBeforeThisBatch:33,setsAfter:sets.length,changesThisBatch:{addedItems:0,addedSets:0,restoredSets:0,factionChanges:0,addedClasses:0,removedClasses:0,translatedItems:0,normalizedBoostItems:0},metrics:{classes:catalog.items.filter(i=>i.category==='Classes').length,translatedDescriptions:catalog.items.filter(i=>i.descriptionVi||i.wikiDetails?.descriptionVi).length,missingMembership:catalog.items.filter(i=>missing(i).includes('membership')).length,missingRarity:catalog.items.filter(i=>missing(i).includes('rarity')).length,invalidOrMissingCanonicalUrl:catalog.items.filter(i=>missing(i).includes('canonicalWikiUrl')).length,boostUnverified:catalog.items.filter(i=>missing(i).includes('boostVerification')).length},requiredTargets,sourceStatus:{syncProcess,manifestCounts:counts,failures:failures.map(r=>({url:r.url,status:r.syncStatus||r.status,attempts:r.attempts})),pendingUrls:pending.map(r=>r.url),note:'Manifest current; coverage/last-run are older batch snapshots. Pending is not a network failure. No crawl started.'},candidates,production:catalog.items.map(i=>({id:i.id,name:i.name,wikiUrl:i.wikiUrl,faction:i.primaryGroupId,setIds:members(i.id),missingFields:missing(i)})),sets:setAudit.inventorySets.map(s=>({id:s.id,name:s.name,expectedMembers:s.inventoryMemberRows,reviewedExpectedMembers:s.reviewedMemberUrls?.length?s.reviewedMemberUrls:null,existingMembers:s.existingMembers,missingMembers:s.missingMembers,addedMembersThisBatch:[],missingEvidence:s.blockers,status:s.status,note:'Expected scope remains pending unless raw member inventory has been reviewed.'})),pendingSetScopes:setAudit.pendingSetScopes};
fs.writeFileSync('Update/FARM_V3_1_INVENTORY_AUDIT.json',JSON.stringify(audit,null,2)+'\n');
const headers=['source item','canonical item name','canonical wiki URL','faction','item type','set ID','source evidence','production status','missing fields','verification status'];
const csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const rows=candidates.filter(r=>r.productionStatus!=='present'||r.missingFields.length).map(r=>[r.sourceItem,r.canonicalItemName,r.canonicalWikiUrl,r.faction,r.itemType,r.setIds.join(';'),JSON.stringify({sourceKind:r.sourceKind,sourceUrl:r.sourceUrl,evidence:r.sourceEvidence}),r.productionStatus,r.missingFields.join(';'),r.verificationStatus]);
fs.writeFileSync('Update/FARM_V3_1_MISSING_ITEMS.csv',[headers,...rows].map(r=>r.map(csv).join(',')).join('\n')+'\n');
console.log(JSON.stringify({catalog:audit.catalogAfter,sets:sets.length,metrics:audit.metrics,syncProcess,manifestCounts:counts,candidateRows:candidates.length,reviewQueueRows:rows.length}));
