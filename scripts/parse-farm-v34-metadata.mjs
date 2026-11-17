import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {Window} from 'happy-dom';
import {wikiText} from './lib/farm-review-parser.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
if(process.argv.includes('--worker')){
 const sources=JSON.parse(fs.readFileSync(0,'utf8')),win=new Window(),parser=new win.DOMParser();
 const result=sources.map(source=>{
  const html=fs.readFileSync(source.sourceFile,'utf8');if(sha(html)!==source.sourceHash)throw Error('Changed metadata snapshot '+source.id);
  const doc=parser.parseFromString(html,'text/html'),body=doc.querySelector('#page-content');
  const canonical=doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  if(!body || canonical && new URL(canonical,source.url).pathname!==new URL(source.url).pathname)return {...source,status:'UNVERIFIED_IDENTITY'};
  const text=wikiText(body),tags=[...doc.querySelectorAll('.page-tags a')].map(a=>a.textContent.trim());
  const title=doc.querySelector('#page-title')?.textContent.trim();
  const header=text.split(/^Skills?:/im)[0];
  const description=header.match(/^Description:[ \t]*([^\n][^]*?)(?=\n(?:Notes?:|Thanks to|Male|Female|Image|Normal|Animated|Color Custom|Also see|Special Effects?:|\+| -)|$)/im)?.[1]?.trim() || null;
  const rarity=[...new Set([...header.matchAll(/^Rarity:\s*(.+)$/gm)].map(m=>m[1]))];
  const membership=tags.includes('legend')||tags.includes('legendpet')?'member':tags.some(t=>['freeplayer','freeplayerpet','legendarea-free'].includes(t))?'non-member':null;
  const equipmentLines=text.split('\n').filter(line=>/when equipped|while equipped|item (?:does|gives|provides)|provides? (?:a |an )?\d+%|increase(?:s)? (?:all|damage|gold|exp|rep|class point)|\d+% (?:more damage|boost|bonus)/i.test(line));
  const hasBoostTag=tags.some(t=>/^(?:xdmg|goldboost|xpboost|expboost|cpboost|repboost)/.test(t));
  const explicitEquipped=equipmentLines.filter(line=>/when equipped|while equipped|\bthis item\b|\bitem (?:does|gives|provides)/i.test(line)&&/\d+(?:\.\d+)?\s*%/.test(line));
  const noBoost=!hasBoostTag&&(source.category==='Classes'?!explicitEquipped.length:!equipmentLines.length&&!/\d+(?:\.\d+)?\s*%/.test(header));
  return {...source,title,tags,description,rarity:rarity.length===1?rarity[0]:null,membership,
    membershipTag:membership==='member'?tags.includes('legend')?'legend':'legendpet':tags.find(t=>['freeplayer','freeplayerpet','legendarea-free'].includes(t))||null,
    equipmentLines,hasBoostTag,noBoost,acquisition:header.match(/^Price:\s*(.+)$/m)?.[1]||null,
    requirements:header.split('\n').filter(l=>/^Must |^Requires |^Base Level:/.test(l)),artwork:[...body.querySelectorAll('img.image')].map(i=>new URL(i.getAttribute('src'),source.url).href),status:'EXACT_SNAPSHOT_PARSED'};
 });process.stdout.write(JSON.stringify(result));await win.happyDOM.close();
}else{
 const read=p=>JSON.parse(fs.readFileSync(p));const catalog=read('src/content/farm/catalog-v2.generated.json').items;
 const pins=['content-sources/farm/review/pages.json','content-sources/farm/refinement/sources.json','content-sources/farm/equipment-sets/sources.json'].flatMap(p=>{const d=read(p);return Array.isArray(d)?d:d.sources;});
 const sourceRows=[],blocked=[];
 for(const item of catalog){const source=pins.find(s=>s.url===item.wikiUrl&&s.sourceFile&&fs.existsSync(s.sourceFile));
  if(!source){blocked.push({id:item.id,url:item.wikiUrl,status:'PENDING_SOURCE'});continue;}
  sourceRows.push({id:item.id,url:item.wikiUrl,category:item.category,sourceFile:source.sourceFile,sourceHash:source.sourceHash});
 }
 const rows=[];for(let i=0;i<sourceRows.length;i+=8)rows.push(...JSON.parse(execFileSync(process.execPath,[process.argv[1],'--worker'],{input:JSON.stringify(sourceRows.slice(i,i+8)),encoding:'utf8',maxBuffer:16*1024*1024})));
 const dest='Update/_offline-staging/20261117-081737/v3-4/metadata-parsed.json';fs.writeFileSync(dest,JSON.stringify({rows,blocked},null,2)+'\n');
 console.log({rows:rows.length,blocked:blocked.length,noBoost:rows.filter(r=>r.noBoost).length,membership:rows.filter(r=>r.membership).length,description:rows.filter(r=>r.description).length});
}
