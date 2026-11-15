// Prepare source records and exact-page artwork; catalog remains generator-owned.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { Window } from "happy-dom";
import { equipmentSets } from "../content-sources/farm/aqw-equipment-sets.mjs";
import { loadVerifiedFarmPages } from "./lib/farm-review-parser.mjs";
import { farmWikiFacts } from "./lib/farm-wiki-facts.mjs";
const read=path=>JSON.parse(fs.readFileSync(path,"utf8"));
const root="content-sources/farm/equipment-sets", manifest=read(root+"/sources.json");
const pages=loadVerifiedFarmPages(manifest.sources),index=read(root+"/research-index.json").identities;
const priorRecords=fs.existsSync(root+"/canonical-records.json")?read(root+"/canonical-records.json"):[];
const existing=read("src/content/farm/catalog-v2.generated.json").items;
const norm=value=>value.normalize("NFKC").replace(/[’‘]/g,"'").trim().replace(/\s+/g," ").toLowerCase();
const window=new Window({settings:{disableJavaScriptEvaluation:true,disableCSSFileLoading:true,disableJavaScriptFileLoading:true}}),parser=new window.DOMParser();
const categories={"/armors":"Armors","/helmets-hoods":"Helms","/capes-back-items":"Capes / Back Items","/pets":"Pets","/battle-pets":"Pets","/classes":"Classes","/weapons":"Weapons"};
const records=[],assets=fs.existsSync(root+"/assets.json")?read(root+"/assets.json"):[],blocked=[],queue=[];
const seen=new Set();
for(const set of [...equipmentSets,...read(root+"/reviewed-inventories.json").sets])for(const member of set.members){
 const urls=index[norm(member.name)];if(urls?.length!==1){blocked.push({setId:set.id,name:member.name,reason:urls?.length?"Ambiguous Wiki links":"No exact linked Wiki identity"});continue;}
 const page=pages.find(page=>page.url===urls[0]);if(!page){blocked.push({setId:set.id,name:member.name,reason:"Wiki snapshot unavailable",url:urls[0]});continue;}
 if(seen.has(page.url))continue;seen.add(page.url);
 const doc=parser.parseFromString(fs.readFileSync(page.sourceFile,"utf8"),"text/html"),name=doc.querySelector("#page-title")?.textContent.trim();
 const tags=[...doc.querySelectorAll(".page-tags a")].map(a=>a.textContent.trim());
 const crumbs=[...doc.querySelectorAll("#breadcrumbs a")].map(a=>new URL(a.getAttribute("href"),page.url).pathname);
 const category=crumbs.map(path=>categories[path]).filter(Boolean).at(-1);
 if(!category||crumbs.includes("/housing")){blocked.push({setId:set.id,name:member.name,reason:"Non-equipment or missing Wiki category",url:page.url});continue;}
 const effects=page.text.split("\n").filter(line=>/\d+(?:\.\d+)?%/.test(line)&&/(?:when equipped|this item does|this item provides)/i.test(line)&&/(?:damage|gold|experience|class points|reputation|\bexp\b|\bcp\b|\brep\b)/i.test(line));
 const id=new URL(page.url).pathname.slice(1),base={id,originalName:name,wikiUrl:page.url,category,tags,text:page.text,effects};
 const facts=farmWikiFacts(base),reward=pages.flatMap(source=>source.quests.map(quest=>({source,quest}))).find(({quest})=>[...quest.fixedRewards,...quest.choiceRewards,...quest.randomRewards,...quest.randomChoiceRewards].some(row=>row.wikiUrl===page.url));
 if(!existing.some(item=>item.wikiUrl===page.url)||priorRecords.some(item=>item.wikiUrl===page.url)){
   if(!facts.materialTree&&!facts.purchase&&!reward&&!page.droppedBy?.length&&!/Price: N\/A \(Dropped by /.test(page.text)){blocked.push({setId:set.id,name,reason:"Acquisition workflow not yet verified",url:page.url});continue;}
   records.push({...base,disposition:"equipment",lastChecked:"2026-11-15",cachePath:page.sourceFile,reason:null,
    provenance:[{sourceDocument:"equipment-set-guide",sourceUrl:"https://docs.google.com/document/d/1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA/edit",lines:set.evidence.lines,lastChecked:"2026-11-15"}],
    collectionEvidence:{setId:set.id,sourceChapter:set.sourceChapter,guideLines:set.evidence.lines},
    questSource:reward?.source.url});
 }
 if(existing.find(item=>item.wikiUrl===page.url)?.image||assets.some(asset=>asset.sourcePage===page.url))continue;
 const images=[...doc.querySelectorAll("#page-content img.image")].map(img=>new URL(img.getAttribute("src"),page.url).href).filter(url=>/\.(?:png|jpe?g|gif|webp)(?:$|\?)/i.test(url)&&!url.includes("/image-tags/"));
 if(images.length)queue.push({id,name,url:images[0],sourcePage:page.url});else blocked.push({setId:set.id,name,reason:"No exact default item artwork",url:page.url});
}
fs.mkdirSync("public/images/aqw/equipment-sets",{recursive:true});const exec=promisify(execFile);let cursor=0;
await Promise.all(Array.from({length:6},async()=>{while(cursor<queue.length){const image=queue[cursor++];try{
 const ext=new URL(image.url).pathname.match(/\.([a-z]+)$/i)[1].toLowerCase(),imagePath="/images/aqw/equipment-sets/"+image.id+"."+ext;
 await exec("curl",["-fL","--retry","1","--max-time","25",image.url.replace("https://imgur.com/","https://i.imgur.com/"),"-o","public"+imagePath],{maxBuffer:1024*1024});
 const bytes=fs.readFileSync("public"+imagePath);if(!bytes.subarray(0,4).equals(Buffer.from([137,80,78,71]))&&!bytes.subarray(0,3).equals(Buffer.from([255,216,255]))&&!bytes.subarray(0,3).equals(Buffer.from("GIF"))&&bytes.toString("ascii",8,12)!=="WEBP")throw Error("Invalid image bytes");
 assets.push({assetId:"equipment-set:"+image.id,entityType:"item",entityName:image.name,imagePath,sourcePage:image.sourcePage,originalImageUrl:image.url,fileHash:createHash("sha256").update(bytes).digest("hex"),verificationStatus:"verified",usageStatus:"approved",authorOrCredit:"AQWorlds artwork © Artix Entertainment LLC; AQWorlds Wiki"});
 }catch(error){blocked.push({name:image.name,url:image.sourcePage,reason:"Artwork retrieval failed"});}}}));
fs.writeFileSync(root+"/canonical-records.json",JSON.stringify(records,null,2)+"\n");fs.writeFileSync(root+"/assets.json",JSON.stringify(assets,null,2)+"\n");fs.writeFileSync(root+"/identity-audit.json",JSON.stringify({newRecords:records.length,artwork:assets.length,blocked},null,2)+"\n");console.log({newRecords:records.length,artwork:assets.length,blocked:blocked.length});await window.happyDOM.close();
