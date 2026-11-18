import fs from 'node:fs';
import {sha256,sameItemName} from './lib/farm-offline-sources.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),file=process.argv[2],batch=read(file),destination='content-sources/farm/equipment-sets/sources.json',registry=read(destination);
const allPins=[...read('content-sources/farm/review/pages.json'),...read('content-sources/farm/refinement/sources.json').sources,...registry.sources];
const rows=[];
for(const row of batch.rows){
 const problems=[];
 if(!sameItemName(row.name,row.meta.name))problems.push('Exact title/variant does not match the referring recipe');
 if(sha256(fs.readFileSync(row.sourceFile))!==row.sourceHash)problems.push('Snapshot hash changed');
 if(new URL(row.url).hostname!=='aqwwiki.wikidot.com')problems.push('Not an exact Wiki source');
 if(!row.meta.crumbs.includes('/items'))problems.push('Referring recipe item URL points to a non-item page');
 if(problems.length){rows.push({url:row.url,status:'UNVERIFIED',problems});continue;}
 const previous=allPins.find(s=>s.url===row.url);
 if(previous){rows.push({url:row.url,status:'EXISTING_PIN_PRESERVED',sourceFile:previous.sourceFile,sourceHash:previous.sourceHash,additionalSnapshot:row.sourceFile});continue;}
 const pin={url:row.url,sourceFile:row.sourceFile,sourceHash:row.sourceHash,title:row.meta.name,breadcrumbs:row.meta.crumbs.map(path=>({path,name:path.slice(1)})),status:'read',role:'direct-material-dependency',referredBy:row.usedBy||row.referredBy,batch:batch.id,checkedAt:new Date().toISOString()};registry.sources.push(pin);allPins.push(pin);rows.push({...pin,status:'IDENTITY_VERIFIED_DEPENDENCY_PINNED',catalogImport:false});
}
fs.writeFileSync(destination,JSON.stringify(registry,null,2)+'\n');
fs.writeFileSync(file.replace('-parsed.json','-pins.json'),JSON.stringify({id:batch.id,rows,blocked:batch.blocked||[],note:'Dependency identity/snapshot verified; not a Farm target import, metadata completeness or total-cost certification.'},null,2)+'\n');console.log(rows.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{}));
