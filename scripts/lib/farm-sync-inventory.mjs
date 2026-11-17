import fs from 'node:fs';
import path from 'node:path';
import { canonical, atomic, sha } from './farm-sync-engine.mjs';
export function classify(row,{catalog=new Map(),missing=new Set(),setUrls=new Set()}={}){
  const url=canonical(row.url),item=catalog.get(url),hints=new Set(row.typeHints||[]),slug=new URL(url).pathname;
  let category='Other',evidence='unclassified';
  if(item){category=item.category==='Classes'?'Class':'Equipment';evidence='existing-catalog';}
  else {
    const rules=[['Merge Shop',hints.has('merge')||/merge/.test(slug)],['Quest',hints.has('quest')||/quest/.test(slug)],['Shop',hints.has('shop')||/shop/.test(slug)],['NPC',hints.has('npc')],['Monster',hints.has('monster')],['Location',hints.has('map')||hints.has('location')],['Material',hints.has('material')],['Class',hints.has('class')],['Equipment',hints.has('equipment')||hints.has('item')]];
    const match=rules.find(([,yes])=>yes);if(match){category=match[0];evidence='source-hint-needs-wiki-verification';}
  }
  const meta=row.cachedMetadata;
  if(meta){
    const crumbs=meta.crumbs||[],tags=meta.tags||[];
    const exact=crumbs.includes('/classes')?'Class':crumbs.some(c=>['/weapons','/armors','/helmets-hoods','/capes-back-items','/pets','/battle-pets'].includes(c))?'Equipment':crumbs.includes('/quests')?'Quest':crumbs.includes('/merge-shops')?'Merge Shop':crumbs.includes('/shops')||tags.includes('shop')?'Shop':crumbs.includes('/npcs')?'NPC':crumbs.includes('/monsters')?'Monster':crumbs.includes('/misc-items')?'Material':crumbs.includes('/locations')?'Location':'Other';
    category=exact;evidence='hash-checked-wiki-breadcrumbs';
  }
  return {...row,url,classification:{category,evidence,verified:false},priority:setUrls.has(url)?0:missing.has(url)&&['Equipment','Class','Other'].includes(category)?1:category==='Equipment'?10:['Quest','Shop','Merge Shop'].includes(category)?20:category==='Class'?30:70};
}
export function inventoryQueue(root,inventory){
  const norm=s=>String(s).normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
  const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const catalog=read('src/content/farm/catalog-v2.generated.json').items;
  const byUrl=new Map(catalog.map(i=>[canonical(i.wikiUrl),i]));
  const byName=new Map(catalog.map(i=>[norm(i.originalName||i.name),i]));
  const references=new Map(inventory.wikiRefs.map(r=>[canonical(r.url),r]));
  const missing=new Set(inventory.wikiItemCandidates.filter(r=>!byUrl.has(canonical(r.url))).map(r=>canonical(r.url)));
  const researchPath='content-sources/farm/equipment-sets/research-index.json';
  const identities=fs.existsSync(path.join(root,researchPath))?read(researchPath).identities:{};
  const setUrls=new Set(), extra=[];
  for(const set of inventory.equipmentSets)for(const member of set.members){
    const urls=member.wikiUrl?[member.wikiUrl]:identities[norm(member.name)]||[];
    for(const u of urls){const url=canonical(u);if(!url)continue;
      if(!byName.has(norm(member.name))||!byUrl.has(url))setUrls.add(url);
      extra.push({...references.get(url),url,kind:'wiki',setId:set.id,memberName:member.name});
    }
  }
  const plan=read('Update/_farm-sources/plan.json').pages;
  const manifest=read('Update/_farm-sources/manifest.json');
  const map=new Map();
  for(const row of [...Object.values(manifest),...plan,...extra]){
    const url=canonical(row.url);if(!url)continue;
    const old=map.get(url)||{};
    map.set(url,{...old,...row,url,aliases:[...new Set([...(old.aliases||[]),row.url])],setIds:[...new Set([...(old.setIds||[]),...(row.setId?[row.setId]:[])]) ]});
  }
  const parsedPath='Update/_farm-sources/wiki-parsed.json';
  const parsed=fs.existsSync(path.join(root,parsedPath))?new Map(read(parsedPath).records.map(p=>[canonical(p.url),p.metadata])):new Map();
  const rows=[...map.values()].map(r=>({...r,cachedMetadata:parsed.get(r.url)})).map(r=>r.kind==='wiki'?classify(r,{catalog:byUrl,missing,setUrls}):{...r,priority:50});
  atomic(path.join(root,'Update/_farm-sources/url-inventory.json'),{schemaVersion:1,complete:false,total:rows.length,wiki:rows.filter(r=>r.kind==='wiki').length,originalUnattempted:Object.values(manifest).filter(r=>r.status==='blocked-unattempted').length,categories:rows.filter(r=>r.kind==='wiki').reduce((a,r)=>(a[r.classification.category]=(a[r.classification.category]||0)+1,a),{}),rows});
  return rows;
}
export function discoverPages(page,site){
  const rows=[];
  for(const link of page.links||[]){const url=canonical(link);if(!url)continue;const u=new URL(url),base=new URL(site);
    if(u.hostname===base.hostname&&(u.pathname===base.pathname||u.pathname.startsWith(base.pathname+'/'))) {u.search='';rows.push({url:u.href,kind:'site',discoveredFrom:page.url,priority:50});}
    else if(page.kind!=='wiki'&&u.hostname==='aqwwiki.wikidot.com')rows.push({url,kind:'wiki',discoveredFrom:page.url,priority:70});
  }
  return rows;
}
export function preserveVerified(old,next){
  if(!old||typeof old!=='object')return next;
  if([old.verificationStatus,old.syncVerification,old.reviewStatus].includes('verified'))return old;
  if(Array.isArray(old)&&Array.isArray(next)){
    const key=r=>r&&typeof r==='object'?(r.canonicalId||r.id||r.wikiUrl||r.url||r.name):null;
    const prior=new Map(old.map(r=>[key(r),r]).filter(([k])=>k));const keys=new Set(next.map(key));
    return [...next.map(r=>key(r)?preserveVerified(prior.get(key(r)),r):r),...old.filter(r=>key(r)&&!keys.has(key(r))&&[r.verificationStatus,r.syncVerification,r.reviewStatus].includes('verified'))];
  }
  if(!Array.isArray(old)&&!Array.isArray(next)&&next&&typeof next==='object')return Object.fromEntries(Object.entries(next).map(([k,v])=>[k,preserveVerified(old[k],v)]));
  return next;
}
export function legacyFailureAudit(directory){
  const manifest=JSON.parse(fs.readFileSync(path.join(directory,'manifest.json'),'utf8'));
  const records=Object.values(manifest).filter(r=>r.status==='blocked').map(r=>({url:r.url,attempts:r.attempts,classification:(r.attempts||[]).every(a=>a.error?.includes('Errno 65'))?'CONNECTION_NO_ROUTE_TO_HOST':'UNCLASSIFIED_READ_ATTEMPTS',conclusion:'Evidence only; no HTTP/DNS/TLS cause inferred'}));
  const file=path.join(directory,'legacy-failure-audit.json');if(!fs.existsSync(file))atomic(file,{records,sourceHash:sha(JSON.stringify(manifest))});
}
