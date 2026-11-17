import fs from 'node:fs';
import {Window} from 'happy-dom';
import {sha256,equipmentCategory} from './lib/farm-offline-sources.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const root='Update/_offline-staging/20261117-081737',batch=read(root+'/batch-002-class-staged.json'),base='content-sources/farm/equipment-sets',records=read(base+'/canonical-records.json'),sources=read(base+'/sources.json'),assets=read(base+'/assets.json'),fields=read('content-sources/farm/refinement/v3-verified-fields.json'),translations=read('content-sources/farm/refinement/v3-3-class-translations.json'),directives=read('content-sources/farm/refinement/v3-3-faction-overrides.json');
const sheet='artifacts/qa/farm/v3-3/batch-002-new-artwork.png';if(!fs.existsSync(sheet))throw Error('New Class artwork review missing');
const chapters={Good:'Good',Evil:'Evil',Nation:'Nation',Legion:'Legion',Dragonkin:'Dragonkin',Elemental:'Elemental',Hollowborn:'Hollowborn',"Darkon's Debris":'Debris & Astravian','Debris & Astravian':'Debris & Astravian','Other Items':'Other Items',Chaos:'Chaos'};
const imported=[],blocked=[],window=new Window();
for(const row of batch.rows){
 const id=new URL(row.url).pathname.slice(1);
 if(records.some(record=>record.wikiUrl===row.url)){imported.push({id,status:'ALREADY_IMPORTED'});continue;}
 const html=fs.readFileSync(row.sourceFile,'utf8'),doc=new window.DOMParser().parseFromString(html,'text/html'),canonical=doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
 if(equipmentCategory(row.meta.crumbs)!=='Classes'||sha256(html)!==row.sourceHash||!row.artwork||!translations[id]||(canonical&&new URL(canonical,row.url).pathname!==new URL(row.url).pathname)){blocked.push({url:row.url,reason:'Class identity/artwork/translation/canonical proof incomplete'});continue;}
 const sourceFile=base+'/wiki/'+id+'.html';if(fs.existsSync(sourceFile)&&sha256(fs.readFileSync(sourceFile))!==row.sourceHash)throw Error('Conflicting Class snapshot '+id);
 if(!fs.existsSync(sourceFile))fs.copyFileSync(row.sourceFile,sourceFile);
 let imagePath=row.artwork.reused?row.artwork.path.slice('public'.length):'/images/aqw/equipment-sets/'+id+'.png';
 if(sha256(fs.readFileSync(row.artwork.path))!==row.artwork.sha256)throw Error('Class image changed');
 if(!row.artwork.reused&&!fs.existsSync('public'+imagePath))fs.copyFileSync(row.artwork.path,'public'+imagePath);
 const chapter=chapters[row.target.chapter]||'Other Items',lines=[row.target.lines.start_line,row.target.lines.end_line],docFile='Update/_offline-sources/20261117-081737/FARM_DOCS_SOURCE.txt';
 const text=row.page.text.split(/^Skills:\s*$/m)[0].trim();
 records.push({id,originalName:row.meta.name,wikiUrl:row.url,category:'Classes',tags:row.meta.tags,text,effects:[],disposition:'equipment',lastChecked:new Date().toISOString().slice(0,10),cachePath:sourceFile,reason:null,provenance:[{sourceDocument:'equipment-set-guide',sourceUrl:'https://docs.google.com/document/d/1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA/edit',sourceFile:docFile,sourceHash:sha256(fs.readFileSync(docFile)),lines}],collectionEvidence:{setId:'farm-class-targets',sourceChapter:chapter,guideLines:lines},offlineRecovery:{batch:batch.id,role:'farm-target',sourceGuideId:row.target.guideId,profileId:row.profileId,variantDecision:row.variantDecision||'Exact Class source entity matched to a dedicated Docs target heading',fieldGaps:row.fieldGaps}});
 if(id==='chaos-avenger'&&!directives.some(r=>r.itemId===id))directives.push({itemId:id,primaryGroupId:'chaos',authority:'user-task-v3.3',identitySource:row.url,reason:'Explicit V3.3 Chaos Avenger Class target; /chaos-avenger-class is the shop, /chaos-avenger is the Class item.'});
 sources.sources.push({url:row.url,itemId:id,sourceFile,sourceHash:row.sourceHash,status:'read',checkedAt:new Date().toISOString(),title:row.meta.name,breadcrumbs:row.meta.crumbs.map(path=>({path,name:path.slice(1)}))});
 assets.push({assetId:'v3-3-class:'+id,entityType:'item',entityName:row.meta.name,imagePath,sourcePage:row.url,originalImageUrl:row.artwork.url,fileHash:row.artwork.sha256,verificationStatus:'verified',usageStatus:'approved',authorOrCredit:'AQWorlds artwork © Artix Entertainment LLC; AQWorlds Wiki',visualReview:row.artwork.reused?'Reused approved Class portrait; exact artwork URL present on this variant page':sheet});
 fields.records.push({id,url:row.url,sourceFile,sourceHash:row.sourceHash,descriptionVi:translations[id],...(row.rarity?{rarity:row.rarity}:{}),...(row.membership?{membership:row.membership,membershipTag:row.membership==='member'?'legend':'freeplayer'}:{}),boosts:[],boostReviewStatus:'unverified',quotes:row.page.text.split('\n').filter(line=>line.startsWith('Description:')),verificationScope:'Class target identity, approved artwork, source/role mapping and lore. Missing rarity/membership and full nested acquisition remain explicit gaps.'});
 // Reuse local acquisition pages referenced by the item, never the whole Wiki.
 for(const link of row.page.locationLinks){let url;try{const parsed=new URL(link.url);if(parsed.hostname!=='aqwwiki.wikidot.com')continue;url=parsed.origin+parsed.pathname;}catch{continue;}
  if(sources.sources.some(s=>s.url===url))continue;
  const slug=new URL(url).pathname.slice(1),options=['content-sources/class-acquisition/'+slug+'.html',base+'/wiki/'+slug+'.html'];
  const file=options.find(file=>fs.existsSync(file));if(file)sources.sources.push({url,sourceFile:file,sourceHash:sha256(fs.readFileSync(file)),status:'read',checkedAt:new Date().toISOString(),retainedSource:true,breadcrumbs:[]});
 }
 imported.push({id,url:row.url,status:'IMPORTED',fieldGaps:row.fieldGaps});
}
write(base+'/canonical-records.json',records);write(base+'/sources.json',sources);write(base+'/assets.json',assets);write('content-sources/farm/refinement/v3-verified-fields.json',fields);write('content-sources/farm/refinement/v3-3-faction-overrides.json',directives);
write(root+'/batch-002-class-import.json',{id:batch.id,imported,blocked,at:new Date().toISOString()});console.log({imported:imported.filter(r=>r.status==='IMPORTED').length,blocked});await window.happyDOM.close();
