/** Explicit six-member recovery, not a general candidate importer. */
import fs from 'node:fs';
import { sha, atomic } from './lib/farm-sync-engine.mjs';
import { parseFarmReviewPage } from './lib/farm-review-parser.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='content-sources/farm/equipment-sets';
const set=read(base+'/reviewed-inventories.json').sets.find(s=>s.id==='void-beetle-general');
const proof=set.inventoryEvidence.proofs[0];
if(sha(fs.readFileSync(proof.sourceFile))!==proof.sourceHash)throw Error('Reward proof hash mismatch');
const quest=parseFarmReviewPage(fs.readFileSync(proof.sourceFile,'utf8'),proof.url).quests.find(q=>q.name==="I'm Hungry");
const pages=read('Update/_farm-sources/wiki-parsed.json').records;
const catalog=read('src/content/farm/catalog-v2.generated.json').items;
const planned=[];
for(const member of set.members){
 if(catalog.some(i=>i.wikiUrl===member.wikiUrl))continue;
 const page=pages.find(p=>p.url===member.wikiUrl),meta=page?.metadata;
 if(!page||!meta||meta.name!==member.name||!quest.choiceRewards.some(r=>r.wikiUrl===member.wikiUrl))throw Error('Unproved member identity or reward '+member.name);
 if(sha(fs.readFileSync(page.sourceFile))!==page.sourceHash)throw Error('Item proof hash mismatch');
 const categories={'/helmets-hoods':'Helms','/capes-back-items':'Capes / Back Items','/weapons':'Weapons'};
 const category=meta.crumbs.map(c=>categories[c]).filter(Boolean).at(-1);
 if(!category||meta.images.length!==1||!page.text.includes("Reward from the 'I'm Hungry' quest"))throw Error('Ambiguous item category/artwork/acquisition');
 const id=new URL(page.url).pathname.slice(1),imagePath='/images/aqw/equipment-sets/'+id+'.png';
 if(!fs.existsSync('public'+imagePath)){
  const response=await fetch(meta.images[0],{signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error('Image HTTP '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid PNG');fs.writeFileSync('public'+imagePath,bytes);
 }
 planned.push({member,page,category,id,imagePath,imageUrl:meta.images[0],imageHash:sha(fs.readFileSync('public'+imagePath))});
}
atomic('Update/_farm-sources/general-recovery-plan.json',{setId:set.id,proof,planned});
console.log(planned.map(p=>({id:p.id,image:p.imagePath,category:p.category})));
