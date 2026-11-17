// Import only the reviewed allowlist; parsed/fetched alone never authorizes import.
import fs from 'node:fs';
import {sha256,equipmentCategory,sameItemName} from './lib/farm-offline-sources.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const root='Update/_offline-staging/20261117-081737',input=process.argv[2]||root+'/batch-001-staged.json',batch=read(input),review=read(process.argv[3]||'content-sources/farm/refinement/v3-3-artwork-review.json');
if(sha256(fs.readFileSync(review.contactSheet))!==review.contactSheetHash)throw Error('Artwork contact sheet changed');
const base='content-sources/farm/equipment-sets',records=read(base+'/canonical-records.json'),sources=read(base+'/sources.json'),assets=read(base+'/assets.json'),fields=read('content-sources/farm/refinement/v3-verified-fields.json'),translations=read(process.argv[4]||'content-sources/farm/refinement/v3-3-translations.json');
const imported=[],excluded=[],blocked=[];
for(const row of batch.rows){
 const category=equipmentCategory(row.meta.crumbs),id=new URL(row.url).pathname.slice(1);
 if(!category&&row.meta.crumbs.includes('/grounds')){blocked.push({url:row.url,status:'PENDING_TYPE_SUPPORT',reason:'Grounds is a source item category unsupported by the current Farm schema; keep this guide member pending.'});continue;}
 if(!category){excluded.push({url:row.url,name:row.meta.name,reason:'Authoritative Wiki breadcrumbs are not a supported Farm item category; retain this candidate in the audit.',sourceFile:row.sourceFile,sourceHash:row.sourceHash});continue;}
 if(records.some(record=>record.wikiUrl===row.url)){imported.push({id,status:'ALREADY_IMPORTED'});continue;}
 const approval=review.rows.find(entry=>entry.url===row.url&&entry.status==='INSPECTED_EXACT_ITEM_ARTWORK');
 const problems=[...row.problems];
 if(!approval||approval.sourceHash!==row.sourceHash||approval.imageHash!==row.artwork?.sha256)problems.push('Artwork approval does not match');
 if(!translations[id])problems.push('Reviewed Vietnamese description missing');
 if(!sameItemName(row.name,row.meta.name))problems.push('Identity mismatch');
 if(sha256(fs.readFileSync(row.sourceFile))!==row.sourceHash)problems.push('Snapshot changed');
 if(row.docFile&&sha256(fs.readFileSync(row.docFile))!==row.docHash)problems.push('Docs source changed');
 if(problems.length){blocked.push({url:row.url,problems});continue;}
 let file=base+'/wiki/'+id+'.html';
 if(fs.existsSync(file)&&sha256(fs.readFileSync(file))!==row.sourceHash)file=base+'/wiki/'+id+'-'+row.sourceHash.slice(0,12)+'.html';
 const previousAsset=assets.find(asset=>asset.sourcePage===row.url&&asset.fileHash===row.artwork.sha256);
 const globalAssets=read('src/data/aqw-assets.json');
 const matchingGlobal=(Array.isArray(globalAssets)?globalAssets:globalAssets.assets||[]).find(asset=>asset.sourcePage===row.url&&asset.fileHash===row.artwork.sha256);
 const imagePath=previousAsset?.imagePath||matchingGlobal?.imagePath||'/images/aqw/equipment-sets/'+id+'.png';
 if(fs.existsSync(file)&&sha256(fs.readFileSync(file))!==row.sourceHash)throw Error('Existing Wiki snapshot differs: '+id);
 if(fs.existsSync('public'+imagePath)&&sha256(fs.readFileSync('public'+imagePath))!==row.artwork.sha256)throw Error('Existing artwork differs: '+id);
 if(!fs.existsSync(file))fs.copyFileSync(row.sourceFile,file);
 if(!fs.existsSync('public'+imagePath))fs.copyFileSync(row.artwork.path,'public'+imagePath);
 const chapter=row.sourceChapter||({hollowborn:'Hollowborn',chaos:'Chaos','alternative-hero':'Alternative Hero','debris-astravian':'Debris & Astravian',evil:'Evil',good:'Good',nation:'Nation',legion:'Legion',elemental:'Elemental',dragonkin:'Dragonkin'}[row.group])||'Other Items';
 records.push({id,originalName:row.meta.name,wikiUrl:row.url,category,tags:row.meta.tags,text:row.page.text,effects:row.page.text.split('\n').filter(line=>/\d+%/.test(line)),disposition:'equipment',lastChecked:new Date().toISOString().slice(0,10),cachePath:file,reason:null,provenance:[{sourceDocument:row.authority||'equipment-set-guide',sourceUrl:row.authority?row.url:'https://docs.google.com/document/d/1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA/edit',sourceFile:row.docFile||'content-sources/farm/refinement/v3-3-faction-overrides.json',sourceHash:row.docHash||null,lines:row.lines||null}],collectionEvidence:{setId:row.family,sourceChapter:chapter,guideLines:row.lines||[202,223],...(row.authority?{authority:row.authority,scopeSource:'content-sources/farm/refinement/v3-3-faction-overrides.json'}:{})},...(row.questSource?{questSource:row.questSource}:{}),offlineRecovery:{batch:batch.id,identityStatus:'verified',membershipStatus:row.membership?'verified':'unverified',fieldGaps:row.fieldGaps||[]}});
 sources.sources.push({url:row.url,itemId:id,status:'read',checkedAt:new Date().toISOString(),sourceFile:file,sourceHash:row.sourceHash,title:row.meta.name,breadcrumbs:row.meta.crumbs.map(path=>({path,name:path.slice(1)}))});
 assets.push({assetId:'v3-3:'+id,entityType:'item',entityName:row.meta.name,imagePath,sourcePage:row.url,originalImageUrl:row.artwork.url,fileHash:row.artwork.sha256,verificationStatus:'verified',usageStatus:'approved',authorOrCredit:'AQWorlds artwork © Artix Entertainment LLC; AQWorlds Wiki',visualReview:review.contactSheet});
 const boosts=[],all=percent=>({kind:'damageToAll',percent}),gold=percent=>({kind:'gold',percent});
 if(['hollowborn-empress-blade-sword','hollowborn-doomblade-sword'].includes(id))boosts.push(all(id.includes('empress')?15:30),...['classPoints','experience','gold','reputation'].map(kind=>({kind,percent:25})));
 if(id==='hollowborn-doomknight-armor')boosts.push({kind:'damageToTagged',percent:51,targets:['Human']},gold(25));
 if(['hollowborn-sepulchure-s-helm-helm','hollowborn-doom-shade-cape'].includes(id))boosts.push(gold(25));
 if(id==='hollowborn-sword-of-doom-sword')boosts.push(all(51),gold(25));
 if(id==='empowered-darkon-s-debris-1')boosts.push(all(35),...['classPoints','experience','gold','reputation'].map(kind=>({kind,percent:25})));
 if(id==='dual-darkon-s-debris-2')boosts.push({kind:'damageToTagged',percent:75,targets:['Human']});
 if(id==='hollowborn-chaotic-portal-cape')boosts.push(gold(25));
 if(id==='empowered-chaos-avenger-armor')boosts.push({kind:'damageToTagged',percent:50,targets:['Chaos']});
 fields.records.push({id,url:row.url,sourceFile:file,sourceHash:row.sourceHash,descriptionVi:translations[id],rarity:row.rarity,...(row.membership?{membership:row.membership,membershipTag:row.membership==='member'?'legend':'freeplayer'}:{}),boosts,quotes:row.page.text.split('\n').filter(line=>line.startsWith('Description:')||/When equipped/.test(line)),verificationScope:'Identity/artwork/description/explicit fields reviewed; no-boost absence is not verified none.'});
 imported.push({id,url:row.url,status:'IMPORTED',fieldGaps:row.fieldGaps||[]});
}
write(base+'/canonical-records.json',records);write(base+'/sources.json',sources);write(base+'/assets.json',assets);write('content-sources/farm/refinement/v3-verified-fields.json',fields);
write(input.replace('-staged.json','-import.json'),{id:batch.id,imported,excluded,blocked,at:new Date().toISOString()});console.log({imported:imported.filter(r=>r.status==='IMPORTED').length,excluded:excluded.length,blocked});
