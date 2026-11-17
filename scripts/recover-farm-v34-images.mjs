import fs from 'node:fs';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const canonical=value=>{const u=new URL(value);u.hash='';u.pathname=u.pathname.replace(/=(?:w\d+|h\d+|s\d+)(?:-[a-z0-9]+)*$/i,'');return u.href;};
const path='Update/FARM_V3_4_IMAGE_AUDIT.json';
const previous=fs.existsSync(path)?JSON.parse(fs.readFileSync(path)):null;
const pages=JSON.parse(fs.readFileSync('Update/_offline-staging/20261117-081737/source-review.json')).pages.filter(p=>p.origin==='google-sites');
const map=new Map();let references=0;
for(const page of pages)for(const image of page.images){references++;const url=canonical(image.src),r=map.get(url)||{id:sha(url),canonicalUrl:url,originalUrls:[],sourcePages:[],classification:'Unknown',status:'BLOCKED',reason:'Pixel bytes unavailable; HTML text is not image review.'};r.originalUrls.push(image.src);r.sourcePages.push({url:page.url,title:page.title,sourceFile:page.sourceFile,sourceHash:page.sourceHash});map.set(url,r);}
const rows=[...map.values()].map(row=>({...row,originalUrls:[...new Set(row.originalUrls)],sourcePages:[...new Map(row.sourcePages.map(p=>[p.url,p])).values()],...(previous?.rows.find(r=>r.id===row.id)||{})}));
const save=()=>fs.writeFileSync(path,JSON.stringify({schemaVersion:1,status:'PARTIAL',references,canonicalUnique:rows.length,duplicateReferences:references-rows.length,downloaded:rows.filter(r=>r.file).length,reviewed:rows.filter(r=>r.reviewStatus==='PIXELS_REVIEWED').length,blocked:rows.filter(r=>r.status==='BLOCKED').length,rows},null,2)+'\n');
const candidates=rows.filter(r=>!r.attempt&&!r.file).sort((a,b)=>Number(b.sourcePages.some(p=>/higure|malgor|material|token|combat-trophy/i.test(p.url)))-Number(a.sourcePages.some(p=>/higure|malgor|material|token|combat-trophy/i.test(p.url)))).slice(0,8);
let failures=0;fs.mkdirSync('Update/_offline-staging/20261117-081737/v3-4/site-images',{recursive:true});
for(const row of candidates){
 if(failures>=3)break;
 try{
  const response=await fetch(row.originalUrls[0],{signal:AbortSignal.timeout(30000)});row.attempt={at:new Date().toISOString(),url:row.originalUrls[0],httpStatus:response.status};
  if(!response.ok)throw Error('Image HTTP '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer()),type=response.headers.get('content-type');
  if(!type?.startsWith('image/')||bytes.length<100)throw Error('Response is not validated image bytes');
  const ext=/png/.test(type)?'png':/jpeg/.test(type)?'jpg':/gif/.test(type)?'gif':/webp/.test(type)?'webp':null;if(!ext)throw Error('Unrecognized image type '+type);
  row.file='Update/_offline-staging/20261117-081737/v3-4/site-images/'+row.id+'.'+ext;fs.writeFileSync(row.file,bytes);row.sha256=sha(bytes);row.contentType=type;row.status='PENDING_PIXEL_REVIEW';row.reviewStatus='PENDING';row.reason='Downloaded pixels await content review; no OCR status inferred.';failures=0;
 }catch(error){row.status='BLOCKED';row.reason=error.message;failures++;}
 save();await new Promise(resolve=>setTimeout(resolve,2000));
}
save();console.log({references,unique:rows.length,attempted:rows.filter(r=>r.attempt).length,downloaded:rows.filter(r=>r.file).length,blocked:rows.filter(r=>r.status==='BLOCKED').length});
