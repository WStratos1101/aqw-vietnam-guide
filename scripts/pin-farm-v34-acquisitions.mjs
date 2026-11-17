import fs from 'node:fs';
import {sha256} from './lib/farm-offline-sources.mjs';
import {loadVerifiedFarmPages} from './lib/farm-review-parser.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const sourceFile='content-sources/farm/equipment-sets/sources.json',registry=read(sourceFile),records=read('content-sources/farm/equipment-sets/canonical-records.json').filter(r=>r.offlineRecovery?.batch?.includes('v34')||r.offlineRecovery?.batch==='offline-v33-007');
const pinned=registry.sources.filter(s=>records.some(r=>r.wikiUrl===s.url));
const pages=loadVerifiedFarmPages(pinned),existing=new Set(registry.sources.map(s=>s.url));
const archive=read('Update/_offline-staging/20261117-081737/source-index.json').pages;
const added=[],pending=[];
for(const page of pages)for(const link of [...page.acquisitionLinks,...page.locationLinks]){
 const parsed=new URL(link.url);if(parsed.hostname!=='aqwwiki.wikidot.com')continue;parsed.hash='';const url=parsed.href;if(existing.has(url))continue;existing.add(url);
 const slug=parsed.pathname.slice(1),local=['content-sources/class-acquisition/','content-sources/farm/review/wiki/','content-sources/farm/external-guide-evidence/wiki/','content-sources/farm/equipment-sets/seed-research/','content-sources/farm/equipment-sets/quest-research/','content-sources/farm/equipment-sets/shop-research/'].map(d=>d+slug+'.html').find(p=>fs.existsSync(p));
 const cached=archive.find(r=>r.url===url);let file=local,hash;
 if(local)hash=sha256(fs.readFileSync(local));
 else if(cached){const source=read(cached.file);if(sha256(source.body)!==source.sha256)throw Error('Changed acquisition cache');file='Update/_offline-staging/20261117-081737/wiki/'+source.sha256+'.html';if(!fs.existsSync(file))fs.writeFileSync(file,source.body);hash=source.sha256;}
 if(file){registry.sources.push({url,sourceFile:file,sourceHash:hash,status:'read',breadcrumbs:[],retainedSource:true,role:'acquisition-dependency',referredBy:page.url});added.push({url,sourceFile:file,sourceHash:hash,referredBy:page.url});}
 else pending.push({url,name:link.name,role:'acquisitionDependency',referredBy:page.url});
}
fs.writeFileSync(sourceFile,JSON.stringify(registry,null,2)+'\n');
fs.writeFileSync('Update/_offline-staging/20261117-081737/v3-4/acquisition-source-reuse.json',JSON.stringify({added,pending},null,2)+'\n');console.log({localSourcesPinned:added.length,pending:pending.length});
