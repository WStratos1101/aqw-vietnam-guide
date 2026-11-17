import fs from 'node:fs';
import {equipmentCategory,sha256} from './lib/farm-offline-sources.mjs';
const root='Update/_offline-staging/20261117-081737',plan=JSON.parse(fs.readFileSync(root+'/batch-002-class-parsed.json'));
for(const row of plan.rows){
 if(equipmentCategory(row.meta.crumbs)!=='Classes'||!row.meta.tags.includes('class')){row.status='UNVERIFIED_NOT_CLASS';continue;}
 if(sha256(fs.readFileSync(row.sourceFile))!==row.sourceHash)throw Error('Class snapshot changed');
 row.membership=row.meta.tags.includes('freeplayer')?'non-member':row.meta.tags.includes('legend')?'member':null;
 row.rarity=row.page.text.match(/^Rarity:\s*(.+)$/m)?.[1]||null;
 row.fieldGaps=[...(!row.membership?['membership']:[]),...(!row.rarity?['rarity']:[])];
 if(row.portrait){if(sha256(fs.readFileSync('public'+row.portrait.imagePath))!==row.portrait.sha256)throw Error('Portrait hash mismatch');row.artwork={path:'public'+row.portrait.imagePath,url:row.portrait.originalImageUrl,sha256:row.portrait.sha256,reused:true,reviewStatus:'REUSED_EXACT_APPROVED_CLASS_ARTWORK'};}
 else{
  const url=row.meta.artworkImages[0]?.replace(/^http:/,'https:');
  if(!url){row.status='UNVERIFIED_NO_ARTWORK';continue;}
  const id=new URL(row.url).pathname.slice(1),file=root+'/images/'+id+'.png';
  if(!fs.existsSync(file)){const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok){row.status='UNVERIFIED_ARTWORK_HTTP_'+response.status;continue;}const bytes=Buffer.from(await response.arrayBuffer());if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Invalid class PNG');fs.writeFileSync(file,bytes);}
  row.artwork={path:file,url,sha256:sha256(fs.readFileSync(file)),reused:false,reviewStatus:'PENDING_VISUAL_REVIEW'};
 }
 row.status='IDENTITY_VERIFIED_FIELDS_PARTIAL';
 fs.writeFileSync(root+'/batch-002-class-staged.json',JSON.stringify(plan,null,2)+'\n');
 console.log(row.meta.name,row.status,row.fieldGaps.join(','));
}
