/** Research/staging only. No catalog writes and no automatic publication. */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import inventory, { auditCatalog } from '../Update/AQW_Farm_Inventory_V3/aqw-farm-inventory.mjs';
export const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'Update/_farm-sources');
const read = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write = (p,d) => { const file=path.join(root,p); fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file+'.tmp',JSON.stringify(d,null,2)+'\n'); fs.renameSync(file+'.tmp',file); };
export function disposition(row, role) {
  const conflict = ['URL_NAME_CONFLICT_CHECK_WIKI','AMBIGUOUS'].includes(row.status);
  return {...row, auditStatus:row.status, status:conflict?'ambiguous':row.status==='MATCHED_NEEDS_ROLE_REVIEW'?'present':`missing-${role}`, canonicalId:row.candidateIds?.length===1&&!conflict?row.candidateIds[0]:null, verificationStatus:'pending-role-and-wiki-review'};
}
export function duplicateGroups(items, key) {
  const groups=new Map(); for(const i of items){const k=key(i);if(k)groups.set(k,[...(groups.get(k)||[]),i.id]);}
  return [...groups].filter(([,ids])=>ids.length>1).map(([identity,ids])=>({identity,ids,status:'review-required-no-auto-merge'}));
}
export function prepare() {
  fs.mkdirSync(out,{recursive:true});
  const doc = inventory.sources.docs.replace(/\/edit$/, '/export?format=txt');
  const pages=[...inventory.sourcePages.map(p=>({...p,kind:'site'})),{url:doc,kind:'docs'},{url:inventory.sources.wiki,kind:'wiki'},...inventory.wikiRefs.map(p=>({...p,kind:'wiki'}))];
  write('Update/_farm-sources/plan.json',{site:inventory.sources.site,pages:[...new Map(pages.map(p=>[p.url,p])).values()]});
}
export function report() {
  const catalog=read('src/content/farm/catalog-v2.generated.json').items;
  const adapter=catalog.map(i=>({id:i.id,name:i.originalName||i.name,category:i.category,wikiUrl:i.wikiUrl,aliases:i.aliases||[]}));
  const audit=auditCatalog(adapter);
  const saved=fs.existsSync(path.join(out,'manifest.json'))?read('Update/_farm-sources/manifest.json'):{};
  const manifest=Object.fromEntries(read('Update/_farm-sources/plan.json').pages.map(r=>[r.url,{...r,status:'pending',...saved[r.url]}]));
  Object.assign(manifest,saved);
  const guidePath='Update/AQW_Farm_Inventory_V3/FARMING_ITEM_GUIDE_SOURCE.txt';
  const guide=fs.readFileSync(path.join(root,guidePath),'utf8'), lines=guide.split(/\r?\n/);
  const proof=row=>({sourceFile:guidePath,sourceHash:createHash('sha256').update(guide).digest('hex'),guideId:row.guideId,lineRefs:row.lineRefs,lines:row.lines,excerpt:row.lines?lines.slice(row.lines.start_line-1,row.lines.end_line).join('\n'):undefined});
  const diff={schemaVersion:1,catalogCount:catalog.length,complete:false,
    siteReferences:audit.siteReferences.map((r,i)=>({...disposition(r,'target'),source:inventory.wikiItemCandidates[i]})),
    docsTargets:audit.docsTargets.map(r=>({...disposition(r,'target'),provenance:proof(r)})),
    materialReferences:audit.materialReferences.map((r,i)=>({...disposition(r,'material'),provenance:inventory.materialCandidates[i]})),
    sets:audit.sets.map(s=>({...s,members:s.members.map(r=>disposition(r,'set-member'))})),
    duplicates:{urls:duplicateGroups(adapter,i=>i.wikiUrl),names:duplicateGroups(adapter,i=>`${i.category}:${i.name}`)},
    sourcePages:inventory.sourcePages.map(p=>({...p,liveStatus:manifest[p.url]?.status||'pending',disposition:'pending-content-media-and-child-link-review'})),
    pendingSetScopes:inventory.pendingSetScopes.map(s=>({...s,disposition:'pending-member-enumeration'}))};
  write('Update/FARM_V3_SOURCE_DIFF.json',diff);
  // Existing catalog records are exported verbatim with status, never promoted by a fetch alone.
  const envelope=records=>({schemaVersion:1,stage:'research',complete:false,records});
  write('Update/_farm-sources/items.json',envelope(catalog.map(i=>({canonicalId:i.id,catalogRecord:i,liveSourceStatus:manifest[i.wikiUrl]?.status||'pending',syncVerification:'pending'}))));
  const productionSets=read('src/content/farm/equipment-sets.generated.json').sets;
  write('Update/_farm-sources/equipment-sets.json',envelope({existing:productionSets,candidates:diff.sets,pending:diff.pendingSetScopes}));
  const routes=catalog.flatMap(i=>(i.acquisitionRoutes||[]).map(r=>({itemId:i.id,routeId:r.id,route:r})));
  write('Update/_farm-sources/quests.json',envelope(routes.map(({itemId,routeId,route})=>({itemId,routeId,guidePaths:route.guidePaths||[],syncVerification:'pending-quest-role-review'}))));
  const materialSources=read('src/content/farm/material-sources.generated.json');
  write('Update/_farm-sources/materials.json',envelope({sources:materialSources,candidates:diff.materialReferences,routeRecipes:routes.filter(r=>r.route.materialTree).map(r=>({itemId:r.itemId,routeId:r.routeId,tree:r.route.materialTree}))}));
  write('Update/_farm-sources/insignia.json',envelope(Object.entries(materialSources).filter(([id])=>id.includes('insignia')).map(([id,data])=>({id,...data,syncVerification:'pending'}))));
  write('Update/_farm-sources/farm-time.json',envelope({verifiedBySync:[],candidates:inventory.timeHints,existing:routes.filter(r=>r.route.farmTime).map(r=>({itemId:r.itemId,routeId:r.routeId,farmTime:r.route.farmTime}))}));
  const coverage={schemaVersion:1,complete:false,catalogBefore:catalog.length,catalogAfter:catalog.length,productionSets:productionSets.length,uniqueSetMembers:new Set(productionSets.flatMap(s=>s.memberIds)).size,docsSnapshot:{path:guidePath,sha256:createHash('sha256').update(guide).digest('hex'),lines:lines.length,guideCount:inventory.guideTargets.length,subtargets:inventory.docSubtargets.length},sources:{}};
  for(const kind of ['site','docs','wiki']){
    const rows=Object.values(manifest).filter(r=>r.kind===kind);
    coverage.sources[kind]={total:rows.length,fetched:rows.filter(r=>r.status==='fetched').length,reviewed:0,attemptedFailures:rows.filter(r=>r.status==='blocked').length,unattemptedBlocked:rows.filter(r=>r.status==='blocked-unattempted').length,failures:rows.filter(r=>r.status.startsWith('blocked')),pending:rows.filter(r=>r.status==='pending').map(r=>r.url),mediaReviewRequired:rows.filter(r=>r.images?.length).map(r=>r.url)};
  }
  const docsEntry=Object.values(manifest).find(r=>r.kind==='docs'&&r.status==='fetched');
  let liveDocs=null;
  if(docsEntry){
    const cached=read('Update/_farm-sources/pages/'+createHash('sha256').update(docsEntry.url).digest('hex')+'.json');
    if(createHash('sha256').update(cached.body).digest('hex')!==cached.sha256)throw Error('Docs cache hash mismatch');
    const liveLines=cached.text.split(/\r?\n/);
    liveDocs={url:docsEntry.url,sha256:cached.sha256,lineCount:liveLines.length,snapshotMatches:cached.text.replace(/\r\n/g,'\n').trim()===guide.replace(/\r\n/g,'\n').trim(),targets:[...inventory.guideTargets,...inventory.docSubtargets].map(r=>({name:r.name,guideId:r.guideId,snapshotLines:r.lines,liveLineRefs:liveLines.flatMap((line,i)=>line.includes(r.name)?[i+1]:[]),status:'pending-content-review'}))};
  }
  write('Update/_farm-sources/docs-analysis.json',{snapshot:coverage.docsSnapshot,live:liveDocs,status:liveDocs?'parsed-needs-review':'blocked-live-export'});
  coverage.setComparison=diff.sets.map(s=>{const prod=productionSets.find(p=>p.id===s.id);return {id:s.id,existingMembers:prod?.memberIds||[],missingCatalogMembers:s.members.filter(m=>!m.canonicalId),resolvedButNotInSet:s.members.filter(m=>m.canonicalId&&!prod?.memberIds.includes(m.canonicalId)),status:'pending-relation-verification'};});
  write('Update/_farm-sources/coverage.json',coverage);
  console.log(JSON.stringify({catalog:catalog.length,sets:productionSets.length,siteReferences:diff.siteReferences.length,docsTargets:diff.docsTargets.length,materials:diff.materialReferences.length,sources:Object.fromEntries(Object.entries(coverage.sources).map(([k,v])=>[k,{total:v.total,fetched:v.fetched,blocked:v.failures.length}]))},null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  prepare();
  const args=process.argv.slice(2);
  if(!args.includes('--report-only')){
    const result=spawnSync('python3',['scripts/farm-sync-crawl.py',...args],{cwd:root,stdio:'inherit'});
    report();if(result.status!==0)process.exitCode=result.status||1;
  } else report();
}
