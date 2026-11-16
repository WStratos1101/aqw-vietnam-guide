/** Parse fetched Wiki bodies with the existing quest/shop parser; no publishing. */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { loadVerifiedFarmPages } from './lib/farm-review-parser.mjs';
const base='Update/_farm-sources';
const manifest=JSON.parse(fs.readFileSync(base+'/manifest.json','utf8'));
const sources=Object.values(manifest).filter(r=>r.kind==='wiki'&&r.status==='fetched').map(r=>{
 const key=createHash('sha256').update(r.url).digest('hex');
 const cache=JSON.parse(fs.readFileSync(`${base}/pages/${key}.json`,'utf8'));
 if(createHash('sha256').update(cache.body).digest('hex')!==cache.sha256)throw Error('Cache hash mismatch: '+r.url);
 const sourceFile=`${base}/wiki/${key}.html`;fs.mkdirSync(`${base}/wiki`,{recursive:true});fs.writeFileSync(sourceFile,cache.body);
 return {url:r.url,sourceFile,sourceHash:cache.sha256};
});
const records=loadVerifiedFarmPages(sources).map(page=>({...page,verificationStatus:'parsed-not-reviewed'}));
fs.writeFileSync(base+'/wiki-parsed.json',JSON.stringify({complete:false,records},null,2)+'\n');
console.log(`Parsed ${records.length} Wiki pages; ${records.reduce((n,p)=>n+p.quests.length,0)} quest panels. All remain pending review.`);
