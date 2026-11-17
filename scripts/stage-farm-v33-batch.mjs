import fs from 'node:fs';
import {Window} from 'happy-dom';
import {equipmentCategory,sameItemName,sha256} from './lib/farm-offline-sources.mjs';
import {retryAfter} from './lib/farm-sync-engine.mjs';
const root='Update/_offline-staging/20261117-081737',input=process.argv[2]||root+'/batch-001-parsed.json',parsed=JSON.parse(fs.readFileSync(input)),window=new Window();
const staged=[];
for(const row of parsed.rows){
 const category=equipmentCategory(row.meta.crumbs),html=fs.readFileSync(row.sourceFile,'utf8'),doc=new window.DOMParser().parseFromString(html,'text/html');
 const canonical=doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
 const problems=[];
 if(sha256(html)!==row.sourceHash)problems.push('source hash mismatch');
 if(!sameItemName(row.name,row.meta.name))problems.push('exact name mismatch');
 if(canonical&&new URL(canonical,row.url).pathname!==new URL(row.url).pathname)problems.push('canonical redirect requires review');
 const rarity=row.page.text.match(/^Rarity:\s*(.+)$/m)?.[1]||null;
 const membership=row.meta.tags.includes('freeplayer')?'non-member':row.meta.tags.includes('legend')?'member':null;
 // Acquisition may require membership while equipment membership is unknown.
 // Preserve the gap; never infer equipment membership from AC or quest gates.
 if(category&&category!=='Classes'&&!rarity)problems.push('rarity not explicit');
 const artworkImages=row.meta.images.filter(url=>!url.includes('/classes-skills/'));
 if(category&&!artworkImages.length)problems.push('no exact artwork');
 const item={...row,category,rarity,membership,fieldGaps:membership?[]:['membership'],canonical:canonical||null,problems,status:!category?(row.meta.crumbs.includes('/grounds')?'PENDING_TYPE_SUPPORT':'EXCLUDED_NON_EQUIPMENT'):problems.length?'UNVERIFIED':'ARTWORK_PENDING_REVIEW'};
 if(item.status==='ARTWORK_PENDING_REVIEW'){
  const id=new URL(row.url).pathname.slice(1),url=artworkImages[0].replace(/^http:/,'https:');
  const destination=root+'/images/'+id+'.png';fs.mkdirSync(root+'/images',{recursive:true});
  try{
   if(!fs.existsSync(destination)){
    let bytes=null;
    for(let attempt=0;attempt<3;attempt++){
     const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
     if(response.ok){bytes=Buffer.from(await response.arrayBuffer());break;}
     if(response.status!==429&&response.status<500)throw Error('Artwork HTTP '+response.status);
     await new Promise(resolve=>setTimeout(resolve,Math.max(retryAfter(response.headers.get('retry-after')),2000*2**attempt)));
    }
    if(!bytes||!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Artwork not a validated PNG');
    fs.writeFileSync(destination,bytes);
   }
   item.artwork={url,path:destination,sha256:sha256(fs.readFileSync(destination)),reviewStatus:'PENDING_VISUAL_REVIEW'};
  }catch(error){item.status='UNVERIFIED';item.problems.push(error.message);}
 }
 staged.push(item);
 fs.writeFileSync(input.replace('-parsed.json','-staged.json'),JSON.stringify({id:parsed.id,rows:staged},null,2)+'\n');
 console.log(item.status,item.name,item.problems.join('; '));
}
await window.happyDOM.close();
