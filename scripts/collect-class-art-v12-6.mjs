import fs from 'node:fs';
import {wiki,asset,batch,sha} from './lib/wiki-v12-6.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const profiles=read('src/content/classes/catalog.json'),portraits=read('src/content/classes/portrait-registry.json');
const file='src/content/classes/art-variants.json';const variants=fs.existsSync(file)?read(file):[];const issues=[];
await batch(profiles,async c=>{
 const primary=portraits.find(p=>p.id===c.image);if(!primary)return;
 let page;
 try{
 page=await wiki(primary.sourceUrl);const tab=[...page.d.querySelectorAll('.yui-navset')].find(n=>/Male/.test(n.querySelector('.yui-nav')?.textContent||'')&&/Female/.test(n.querySelector('.yui-nav')?.textContent||''));
 if(!tab)return;const labels=[...tab.querySelectorAll('.yui-nav li')].map(n=>n.textContent.trim());const panels=[...tab.querySelector('.yui-content').children];
 for(let i=0;i<panels.length;i++){
 if(!/^(Male|Female)$/i.test(labels[i]||''))continue;
 const images=[...panels[i].querySelectorAll('img')].filter(im=>!im.closest('.collapsible-block'));
 if(images.length!==1)continue;const sourceUrl=new URL(images[0].getAttribute('src'),page.url).href.replace(/^http:/,'https:');
 const id=c.id+'-'+labels[i].toLowerCase();if(variants.some(v=>v.id===id))continue;
 const a=await asset(sourceUrl,'/images/aqw/class-art');
 variants.push({...a,id,classId:c.id,variantName:labels[i],variantType:'art',skillSetId:c.id,iconSetId:c.id,source:page.url,sourceHash:page.hash,originalImageUrl:sourceUrl,verificationMethod:'Exact Male/Female artwork tab on the canonical Class page; no skill or identity substitution'});
 }
 }catch(e){issues.push({classId:c.id,reason:e.message});}finally{await page?.w.happyDOM.close();fs.writeFileSync(file,JSON.stringify(variants,null,2)+'\n');}
},3);
fs.writeFileSync('content-sources/v12-6/art-issues.json',JSON.stringify(issues,null,2)+'\n');console.log({verified:variants.length,classes:new Set(variants.map(v=>v.classId)).size,issues:issues.length});

fs.writeFileSync('src/content/classes/art-runtime.json',JSON.stringify(variants.map(({id,classId,variantName,imagePath,width,height,verificationStatus,usageStatus})=>({id,classId,variantName,imagePath,width,height,verificationStatus,usageStatus})))+'\n');
