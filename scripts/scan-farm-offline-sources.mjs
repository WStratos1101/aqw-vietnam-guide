import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {sourceOrigin,validateOfflinePage,sha256} from './lib/farm-offline-sources.mjs';
const root='Update/_offline-staging/20261117-081737',pages=[];
for(const file of fs.readdirSync(root+'/pages').filter(name=>name.endsWith('.json'))){
 const sourceFile=root+'/pages/'+file,record=JSON.parse(fs.readFileSync(sourceFile));
 try{
  const origin=validateOfflinePage(record);
  if(origin!=='google-sites'){pages.push({sourceFile,url:record.url,sourceHash:record.sha256,origin,status:'SECONDARY_CACHE_NOT_SITES_EVIDENCE'});continue;}
  const tables=[];
  const images=(record.images||[]).map(image=>({...image,mediaStatus:String(image.src||'').startsWith('data:image/')?'INLINE_BYTES_AVAILABLE':'MEDIA_BYTES_NOT_IN_ARCHIVE'}));
  pages.push({sourceFile,url:record.url,sourceHash:record.sha256,origin,title:record.title||null,text:record.text,textHash:sha256(record.text||''),tables,images,itemLinks:(record.links||[]).filter(link=>sourceOrigin(link)==='aqw-wiki'),status:images.some(image=>image.mediaStatus==='MEDIA_BYTES_NOT_IN_ARCHIVE')?'TEXT_TABLES_PARSED_MEDIA_PENDING':'TEXT_TABLES_PARSED_REVIEW_PENDING'});
 }catch(error){pages.push({sourceFile,url:record.url,status:'UNVERIFIED',reason:error.message});}
}
const sites=pages.filter(page=>page.origin==='google-sites');
for(let offset=0;offset<sites.length;offset+=6){
 const batch=sites.slice(offset,offset+6);
 const parsed=JSON.parse(execFileSync(process.execPath,['scripts/lib/farm-offline-site-parse.mjs'],{input:JSON.stringify(batch.map(page=>page.sourceFile)),encoding:'utf8',maxBuffer:16000000}));
 for(const row of parsed)sites.find(page=>page.url===row.url).tables=row.tables;
}

const report={schemaVersion:1,complete:false,sourceArchive:'Update/_offline-sources/20261117-081737/FARM_SITES_CACHE.zip',pages,summary:{sites:sites.length,wiki:pages.filter(p=>p.origin==='aqw-wiki').length,docs:pages.filter(p=>p.origin==='google-docs').length,siteImages:sites.reduce((n,p)=>n+p.images.length,0),missingMediaBytes:sites.reduce((n,p)=>n+p.images.filter(i=>i.mediaStatus==='MEDIA_BYTES_NOT_IN_ARCHIVE').length,0),inlineMedia:sites.reduce((n,p)=>n+p.images.filter(i=>i.mediaStatus==='INLINE_BYTES_AVAILABLE').length,0),siteTables:sites.reduce((n,p)=>n+p.tables.length,0)},note:'HTML/text/table extraction is not full human/media review. Wiki/staging files in the archive never count as Google Sites evidence.'};
fs.writeFileSync(root+'/source-review.json',JSON.stringify(report,null,2)+'\n');
console.log(report.summary);
