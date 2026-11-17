/** Parse fetched Wiki bodies with the existing quest/shop parser; no publishing. */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { loadVerifiedFarmPages } from './lib/farm-review-parser.mjs';
const base='Update/_farm-sources';
const manifest=JSON.parse(fs.readFileSync(base+'/manifest.json','utf8'));
const previous=fs.existsSync(base+'/wiki-parsed.json')?JSON.parse(fs.readFileSync(base+'/wiki-parsed.json','utf8')).records:[];
const byUrl=new Map(previous.map(p=>[p.url,p]));
const sources=Object.values(manifest).filter(r=>r.kind==='wiki'&&r.status==='fetched').map(r=>{
 const key=createHash('sha256').update(r.url).digest('hex');
 const cache=JSON.parse(fs.readFileSync(`${base}/pages/${key}.json`,'utf8'));
 if(createHash('sha256').update(cache.body).digest('hex')!==cache.sha256)throw Error('Cache hash mismatch: '+r.url);
 const sourceFile=`${base}/wiki/${key}.html`;fs.mkdirSync(`${base}/wiki`,{recursive:true});fs.writeFileSync(sourceFile,cache.body);
 return {url:r.url,sourceFile,sourceHash:cache.sha256};
});
const fresh=sources.filter(s=>byUrl.get(s.url)?.sourceHash!==s.sourceHash);
for(const page of loadVerifiedFarmPages(fresh))if(byUrl.get(page.url)?.verificationStatus!=='verified')byUrl.set(page.url,{...page,verificationStatus:'parsed-not-reviewed'});
const metadata=[];
const metaSources=sources.filter(s=>!byUrl.get(s.url)?.metadata);
for(let start=0;start<metaSources.length;start+=12)metadata.push(...JSON.parse(execFileSync(process.execPath,['scripts/lib/farm-set-page-metadata.mjs'],{input:JSON.stringify(metaSources.slice(start,start+12)),encoding:'utf8',maxBuffer:16*1024*1024})));
for(const meta of metadata){const page=byUrl.get(meta.url);if(page?.verificationStatus!=='verified')byUrl.set(meta.url,{...page,metadata:meta});}
const records=[...byUrl.values()];
fs.writeFileSync(base+'/wiki-parsed.json',JSON.stringify({complete:false,records},null,2)+'\n');
console.log(`Parsed ${fresh.length} new/changed, retained ${records.length} Wiki pages; ${records.reduce((n,p)=>n+p.quests.length,0)} quest panels. All remain pending review.`);
