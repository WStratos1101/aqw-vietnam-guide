// Reclassify pending source references using exact fields, never the whole page.
import fs from 'node:fs';
import {parseFarmReviewPage} from './lib/farm-review-parser.mjs';
import {materialLeaves} from '../src/lib/material-requirements.mjs';
import {sha256} from './lib/farm-offline-sources.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),root='Update/_offline-staging/20261117-081737/v3-5';
const previous=read('Update/FARM_V3_4_PENDING_QUEUE.json'),sources=read('content-sources/farm/equipment-sets/sources.json').sources,cache=new Map();
const clean=u=>{const url=new URL(u);url.hash='';return url.href;};
const rows=previous.additionalTransportQueue.map(row=>{
 const pin=sources.find(s=>s.url===row.referredBy);if(!pin)return {...row,role:'UNVERIFIED_REFERENCE',priority:'P4',reason:'No exact referring snapshot; retain reference pending review.'};
 let page=cache.get(pin.url);if(!page){const html=fs.readFileSync(pin.sourceFile,'utf8');if(sha256(html)!==pin.sourceHash)throw Error('Changed referring source '+pin.url);page=parseFarmReviewPage(html,pin.url);cache.set(pin.url,page);}
 const merge=page.mergeRecipes.flatMap(r=>materialLeaves(r.tree)).filter(r=>r.wikiUrl&&clean(r.wikiUrl)===clean(row.url));
 const locations=page.locationLinks.filter(link=>clean(link.url)===clean(row.url));
 const acquisition=page.acquisitionLinks.filter(link=>clean(link.url)===clean(row.url));
 const role=merge.length?'directMergeIngredient':acquisition.length?'acquisitionSource':locations.length?'acquisitionLocation':'incidentalReference';
 return {...row,role,priority:role==='incidentalReference'?'P4':'P3',reason:role==='incidentalReference'?'Only a reference outside bounded acquisition/location and exact recipe fields. Retain URL, exclude from automatic dependency crawl.':'Exact bounded source field or recipe input; no target import implied.',proof:{sourceFile:pin.sourceFile,sourceHash:pin.sourceHash,...(merge.length?{quantities:merge.map(r=>r.quantity)}:{})}};
});
fs.writeFileSync(root+'/source-link-classification.json',JSON.stringify({schemaVersion:1,resumes:'Update/FARM_V3_4_PENDING_QUEUE.json',rows,counts:rows.reduce((a,r)=>(a[r.role]=(a[r.role]||0)+1,a),{}),preservedReferenceCount:rows.length},null,2)+'\n');console.log(rows.reduce((a,r)=>(a[r.role]=(a[r.role]||0)+1,a),{}));
