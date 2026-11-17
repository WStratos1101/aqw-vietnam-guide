import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {farmBoostState} from '../src/lib/farm-details.mjs';
import {validateEquipmentSets} from '../src/lib/farm-equipment-sets.mjs';
import {fingerprint} from './qa-farm-local.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const root='Update/_offline-staging/20261117-081737',base=root+'/v3-4',old=read('Update/FARM_V3_3_PENDING_QUEUE.json');
const items=read('src/content/farm/catalog-v2.generated.json').items,sets=read('src/content/farm/equipment-sets.generated.json').sets;
const before=read(base+'/catalog-v2.generated.json').items,beforeSets=read(base+'/equipment-sets.generated.json').sets,manifest=read('Update/_farm-sources/manifest.json');
const byId=new Map(items.map(i=>[i.id,i])),byUrl=new Map(items.map(i=>[i.wikiUrl,i])),beforeId=new Map(before.map(i=>[i.id,i]));
const known=v=>v!=null&&!/^(?:unknown|—|-|n\/a)?$/i.test(String(v).trim());
const gaps=i=>[...(!i.descriptionVi&&!i.wikiDetails?.descriptionVi?['descriptionVi']:[]),...(!known(i.membership)&&!known(i.wikiDetails?.membership)?['membership']:[]),...(!known(i.rarity)&&!known(i.wikiDetails?.rarity)?['rarity']:[]),...(farmBoostState(i)==='unverified'?['boostVerification']:[])];
const fieldQueue=items.filter(i=>gaps(i).length).map(i=>({id:i.id,name:i.name,url:i.wikiUrl,fields:gaps(i),status:'PENDING',reason:'Missing field evidence; fetch/parse/identity alone is not certification.'}));
const batches=[];
for(let n=7;n<=20;n++){
 const f=root+`/batch-${String(n).padStart(3,'0')}-fetch.json`;if(!fs.existsSync(f))continue;
 const fetched=read(f),imp=f.replace('-fetch.json','-import.json');batches.push({id:fetched.id,stats:fetched.stats,rows:fetched.rows,import:fs.existsSync(imp)?read(imp):null});
}
const failureFile='Update/_farm-sources/v3-4-permanent-failure-review.json';
const permanent=fs.existsSync(failureFile)?read(failureFile).rows:old.permanentFailures;
const transport=old.transportQueue.filter(row=>!['SUCCESS','CACHE_HIT','PERMANENT_FAILURE'].includes(manifest[row.url]?.syncStatus)).map(row=>({...row,fetchStatus:manifest[row.url]?.syncStatus||row.fetchStatus}));
const acquisitionReuse=read(base+'/acquisition-source-reuse.json');
const additionalTransport=acquisitionReuse.pending.filter(row=>!transport.some(r=>r.url===row.url)&&!['SUCCESS','CACHE_HIT'].includes(manifest[row.url]?.syncStatus)).map(row=>({...row,status:'PENDING',fetchStatus:manifest[row.url]?.syncStatus||'PENDING'}));
const variantDecisions=read('content-sources/farm/refinement/v3-4-class-variant-review.json').rows;
const reviewQueue=old.reviewQueue.map(row=>{
 const variant=variantDecisions.find(r=>r.url===row.url);if(variant)return {...row,status:variant.status,evidence:variant};
 const removal=read('content-sources/farm/refinement/v3-4-class-scope.json').decisions.find(d=>d.wikiUrl===row.url);
 if(removal)return {...row,status:'REMOVED_FROM_FARM_SCOPE',evidence:removal};
 const item=byUrl.get(row.url);if(item)return {...row,status:gaps(item).length?'PARTIAL_FIELDS':'VERIFIED_TARGET_FIELDS_PARTIAL_ROUTE',canonicalId:item.id,missingFields:gaps(item),materialTotalsComplete:item.acquisitionRoutes.every(r=>r.materialTotalsComplete)};
 return {...row,status:row.status||'PENDING'};
});
const scope=read('Update/FARM_V3_3_CLASS_SCOPE_AUDIT.json');
const norm=s=>s.normalize('NFKC').replace(/\([^)]*\)/g,'').replace(/Class Obtain Guide.*|\bClass\b/gi,'').replace(/^\d+\.\s*/,'').replace(/\s+/g,' ').trim().toLowerCase();
const classTargets=scope.FARM_CLASS_TARGETS.map(target=>({...target,canonicalIds:items.filter(i=>i.category==='Classes'&&(norm(i.name)===target.key||(target.key==='elemental warrior'&&/^(legendary|ultra|mythic) elemental warrior$/.test(norm(i.name)))||(target.key==='naval commander'&&norm(i.name)==='legendary naval commander'))).map(i=>i.id)}));
write('Update/FARM_V3_4_CLASS_SCOPE_AUDIT.json',{status:classTargets.every(t=>t.canonicalIds.length)?'VERIFIED_DECLARED_TEXT_TARGETS_MEDIA_PENDING':'PARTIAL',count:items.filter(i=>i.category==='Classes').length,targets:classTargets,additionalDecisions:read('content-sources/farm/refinement/v3-4-class-scope.json'),removedPreviously:scope.RemovedFromFarm,ClassCodexChanged:false});
const setAudit=read('content-sources/farm/equipment-sets/audit.json');
const membership={schemaVersion:1,status:'PARTIAL',setsBefore:beforeSets.length,setsAfter:sets.length,validationErrors:validateEquipmentSets(sets,items),
 sets:sets.map(set=>({id:set.id,name:set.name,memberIds:set.memberIds,classMemberIds:set.memberIds.filter(id=>byId.get(id)?.category==='Classes'),addedMemberIds:set.memberIds.filter(id=>!beforeSets.find(s=>s.id===set.id)?.memberIds.includes(id)),canonicalUnique:new Set(set.memberIds).size===set.memberIds.length,artworkMissing:set.memberIds.filter(id=>!byId.get(id)?.image)})),
 remainingOriginalScopes:read('Update/FARM_V3_3_INVENTORY_AUDIT.json').pendingSetScopes.map(original=>{const current=setAudit.sets.find(s=>s.id===original.id);return {id:original.id,previousStatus:original.status,status:current?.status||'PENDING',expectedMembers:current?.members||original.members,blockers:current?.blockers||[],enumerationCertified:current?.status==='DONE'};}),
 classMembershipPolicy:'Exact set/variant evidence only. Chaos Avenger Class is explicitly evidenced. Similar names and prerequisites never assign other Classes automatically.'};
write('Update/FARM_V3_4_SET_MEMBERSHIP_AUDIT.json',membership);
const isolation=read('Update/FARM_V3_4_QUEST_ISOLATION_AUDIT.json');
const qaFingerprint=createHash('sha256').update(JSON.stringify(fingerprint())).digest('hex');
const browser={};
for(const engine of ['chromium','webkit']){
 const priorFile=`artifacts/qa/v3-2/farm/${engine}/results.json`,currentFile=`artifacts/qa/farm/v3-4/${engine}/results.json`;
 const prior=read(priorFile),current=fs.existsSync(currentFile)?read(currentFile):null;
 const file=current&&Date.parse(current.finishedAt||current.startedAt)>=Date.parse(prior.finishedAt||prior.startedAt)?currentFile:priorFile,r=file===currentFile?current:prior;
 browser[engine]={file,startedAt:r.startedAt,finishedAt:r.finishedAt,reportedStatus:r.status,reportedFingerprint:r.sourceFingerprint,currentFingerprint:qaFingerprint,status:r.phase==='browser_launch'?'BLOCKED':r.sourceFingerprint!==qaFingerprint?'PENDING_LOCAL_RUN':r.status==='passed'?'PASS':r.phase==='ui'?'FAIL':'BLOCKED',currentSourceUIRun:r.sourceFingerprint===qaFingerprint&&r.status==='passed'?'VERIFIED':'PENDING_LOCAL_RUN',cause:r.cause,errors:r.errors,
 previousLocalResult:{file:priorFile,status:prior.status,sourceFingerprint:prior.sourceFingerprint,finishedAt:prior.finishedAt,current:prior.sourceFingerprint===qaFingerprint}};
}
browser.nativeSafari='UNVERIFIED';
const resolved=before.flatMap(i=>{const next=byId.get(i.id);if(!next)return [];const fields=gaps(i).filter(f=>!gaps(next).includes(f));return fields.length?[{id:i.id,fields}]:[];});
const metrics={items:items.length,sets:sets.length,classes:items.filter(i=>i.category==='Classes').length,missingDescriptionVi:items.filter(i=>gaps(i).includes('descriptionVi')).length,missingMembership:items.filter(i=>gaps(i).includes('membership')).length,missingRarity:items.filter(i=>gaps(i).includes('rarity')).length,boostStates:items.reduce((a,i)=>(a[farmBoostState(i)]=(a[farmBoostState(i)]||0)+1,a),{}),uncertifiedRoutes:items.flatMap(i=>i.acquisitionRoutes).filter(r=>!r.materialTotalsComplete).length};
const queue={schemaVersion:1,generatedAt:new Date().toISOString(),status:'PARTIAL',complete:false,resumes:'Update/FARM_V3_3_PENDING_QUEUE.json',transportPendingCount:transport.length,transportQueue:transport,
 reviewQueue,additionalTransportQueue:additionalTransport,fieldGapQueue:fieldQueue,missingClassTargets:classTargets.filter(t=>!t.canonicalIds.length),remainingSetScopes:membership.remainingOriginalScopes.filter(s=>s.status!=='DONE'),permanentFailures:permanent,
 questIsolationPending:isolation.records.filter(r=>r.verificationStatus==='UNVERIFIED').map(r=>({itemId:r.itemId,routeId:r.routeId,sourceUrl:r.sourceUrl,reasons:r.reasons})),
 uncertifiedMaterialRoutes:isolation.records.filter(r=>!r.materialTotalsComplete).map(r=>({itemId:r.itemId,routeId:r.routeId,sourceUrl:r.sourceUrl,status:'PARTIAL'})),batches,
 previousOutOfScope:old.outOfScope,sourceMediaStatus:'See FARM_V3_4_IMAGE_AUDIT.json; absent pixel bytes remain BLOCKED',note:'Transport, target verification, dependencies and imports are counted separately. Remaining URLs are preserved from the V3.3 queue; no pending URL is discarded as out-of-scope without role evidence.'};
write('Update/FARM_V3_4_PENDING_QUEUE.json',queue);
const audit={schemaVersion:1,generatedAt:queue.generatedAt,status:'PARTIAL',complete:false,packageVersion:read('package.json').version,baseline:{items:before.length,sets:beforeSets.length,classes:before.filter(i=>i.category==='Classes').length},metrics,
 addedItemIds:items.filter(i=>!beforeId.has(i.id)).map(i=>i.id),removedItemIds:before.filter(i=>!byId.has(i.id)).map(i=>i.id),addedClassIds:items.filter(i=>i.category==='Classes'&&!beforeId.has(i.id)).map(i=>i.id),
 setsCompleted:membership.remainingOriginalScopes.filter(s=>s.status==='DONE').map(s=>s.id),setsExpanded:membership.sets.filter(s=>s.addedMemberIds.length&&beforeSets.some(b=>b.id===s.id)).map(s=>({id:s.id,addedMemberIds:s.addedMemberIds})),
 metadataResolvedExisting:resolved,metadataFieldCounts:Object.fromEntries(['descriptionVi','membership','rarity','boostVerification'].map(f=>[f,resolved.filter(r=>r.fields.includes(f)).length])),
 production:items.map(i=>({id:i.id,name:i.name,wikiUrl:i.wikiUrl,category:i.category,faction:i.primaryGroupId,setIds:i.setIds,boostState:farmBoostState(i),missingFields:gaps(i)})),
 sourceFingerprint:qaFingerprint,browserQA:browser,nonFarmFingerprints:read(base+'/baseline-fingerprints.json').files,
 preservedNonFarm:Object.entries(read(base+'/baseline-fingerprints.json').files).every(([p,hash])=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')===hash),
 batches:batches.map(b=>({id:b.id,networkPages:b.stats.networkPages,networkRequests:b.stats.requests,cacheHits:b.stats.cacheHits,imported:b.import?.imported.filter(r=>r.status==='IMPORTED').length||0})),
 pendingTransport:transport.length,permanentFailures:permanent.length,validationFile:'artifacts/qa/farm/v3-4/checks.json'};
write('Update/FARM_V3_4_INVENTORY_AUDIT.json',audit);
console.log({metrics,resolvedExisting:audit.metadataFieldCounts,setsCompleted:audit.setsCompleted,pendingTransport:transport.length,nonFarmUnchanged:audit.preservedNonFarm});
