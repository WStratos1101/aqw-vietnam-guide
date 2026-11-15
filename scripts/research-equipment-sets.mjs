// Collect only exact linked Wiki identities; never invent item URLs from names.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadVerifiedFarmPages } from "./lib/farm-review-parser.mjs";
import { equipmentSets, pendingSets, supplementalEvidence } from "../content-sources/farm/aqw-equipment-sets.mjs";
const read=path=>JSON.parse(fs.readFileSync(path,"utf8"));
const hash=path=>createHash("sha256").update(fs.readFileSync(path)).digest("hex");
const norm=value=>value.normalize("NFKC").replace(/[’‘]/g,"'").trim().replace(/\s+/g," ").toLowerCase();
const root="content-sources/farm/equipment-sets";fs.mkdirSync(root+"/wiki",{recursive:true});
const existing=new Map();
for(const row of [...read("content-sources/farm/review/pages.json"),...read("content-sources/farm/quest-workflow-review.json").sources,...read("content-sources/farm/refinement/sources.json").sources])if(fs.existsSync(row.sourceFile))existing.set(row.url,{...row,sourceHash:hash(row.sourceFile)});
for(const row of [...read("content-sources/farm/import/wiki-records.json"),...read("content-sources/farm/import/detail-wiki-records.json")])if(row.cachePath&&fs.existsSync(row.cachePath)&&!existing.has(row.wikiUrl))existing.set(row.wikiUrl,{url:row.wikiUrl,sourceFile:row.cachePath,sourceHash:hash(row.cachePath)});
const oldPath=root+"/sources.json";
const manifest=fs.existsSync(oldPath)?read(oldPath):{sources:[],failures:[]};
for(const source of manifest.sources)if(fs.existsSync(source.sourceFile))existing.set(source.url.split(/[?#]/)[0],{...source,url:source.url.split(/[?#]/)[0],sourceHash:hash(source.sourceFile)});
const names=new Set([...equipmentSets.flatMap(set=>set.members.map(member=>norm(member.name))),...pendingSets.map(set=>norm(set.name))]);
const reviewedPath=root+"/reviewed-inventories.json",reviewed=fs.existsSync(reviewedPath)?read(reviewedPath).sets:[];
for(const set of reviewed)for(const member of set.members)names.add(norm(member.name));
const pages=loadVerifiedFarmPages([...existing.values()]);
const links=new Map();for(const page of pages)for(const link of page.itemLinks){const key=norm(link.name);if(!names.has(key))continue;const urls=links.get(key)||new Set();if(/^https:\/\/aqwwiki\.wikidot\.com\/[a-z0-9-]+$/.test(link.url))urls.add(link.url);links.set(key,urls);}
for(const set of reviewed)for(const member of set.members)links.set(norm(member.name),new Set([member.wikiUrl]));
const additional=read(root+"/additional-sources.json");
for(const identity of additional.identities)links.set(norm(identity.name),new Set([identity.url]));
const requested=new Set([...links.values()].flatMap(urls=>[...urls]));
for(const url of additional.pages)requested.add(url);
for(const urls of Object.values(supplementalEvidence))for(const url of urls)requested.add(url);
// Include exact quest/shop links on already resolved collection target pages.
for(const set of [...equipmentSets,...pendingSets]){const urls=links.get(norm(set.name));if(urls?.size!==1)continue;const page=pages.find(page=>page.url===[...urls][0]);if(page)for(const link of page.itemLinks)if(/quests?|shop|merge/i.test(new URL(link.url).pathname+" "+link.name))requested.add(link.url);}
for(const urls of links.values())if(urls.size===1){const page=pages.find(page=>page.url===[...urls][0]);if(page)for(const link of page.itemLinks)if(/quests?|shop|merge/i.test(new URL(link.url).pathname+" "+link.name))requested.add(link.url);}
for(const urls of links.values())if(urls.size===1){const page=pages.find(page=>page.url===[...urls][0]);if(page)for(const link of page.locationLinks)requested.add(link.url);}
const pendingCandidates=Object.fromEntries(pendingSets.map(set=>[set.name,[]]));
for(const page of pages)for(const link of page.itemLinks){
  if(!/^https:\/\/aqwwiki\.wikidot\.com\/[a-z0-9-]+$/.test(link.url))continue;
  for(const set of pendingSets){const base=norm(set.name).replace(/ set$/, "");if(norm(link.name)===base || norm(link.name).startsWith(base+" ")){
    if(!pendingCandidates[set.name].some(row=>row.url===link.url))pendingCandidates[set.name].push({name:link.name,url:link.url,sourcePage:page.url,status:"CANDIDATE_ONLY"});
    requested.add(link.url);
  }}
}
if(process.argv.includes("--identities-only")){requested.clear();for(const urls of links.values())for(const url of urls)requested.add(url);for(const url of additional.pages)requested.add(url);}
const normalizedRequested=[...requested].map(url=>url.split(/[?#]/)[0]);requested.clear();for(const url of normalizedRequested)requested.add(url);
const failures=[];const exec=promisify(execFile),queue=[...requested].filter(url=>!existing.has(url));
let cursor=0;
await Promise.all(Array.from({length:6},async()=>{while(cursor<queue.length){const url=queue[cursor++],slug=new URL(url).pathname.slice(1),sourceFile=root+"/wiki/"+slug+".html";try{
 await exec("curl",["-fL","--retry","1","--max-time","25",url,"-o",sourceFile],{maxBuffer:1024*1024});
 const html=fs.readFileSync(sourceFile,"utf8");if(!html.includes('id="page-content"'))throw Error("No Wiki body");
 existing.set(url,{url,sourceFile,sourceHash:hash(sourceFile),checkedAt:"2026-11-15"});
 }catch(error){failures.push({url,reason:error.message.slice(0,180)});}}}));
const used=[...existing.values()];
fs.writeFileSync(oldPath,JSON.stringify({sources:used,failures},null,2)+"\n");
const result={seedSets:equipmentSets.length,pendingSets:pendingSets.length,requested:requested.size,retained:used.length,failures:failures.length,pendingCandidates,identities:Object.fromEntries([...links].map(([name,urls])=>[name,[...urls]]))};
fs.writeFileSync(root+"/research-index.json",JSON.stringify(result,null,2)+"\n");
console.log({seedSets:result.seedSets,pendingSets:result.pendingSets,requested:result.requested,retained:result.retained,failures:result.failures});
