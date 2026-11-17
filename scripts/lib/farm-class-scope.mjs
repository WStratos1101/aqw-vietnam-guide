import fs from 'node:fs';
import {createHash} from 'node:crypto';
// Farm scope only: original import records and the Class Codex remain intact.
export function applyFarmClassScope(items,review){
 const verified=new Set();
 const additionalFile='content-sources/farm/refinement/v3-4-class-scope.json';
 const additional=fs.existsSync(additionalFile)?JSON.parse(fs.readFileSync(additionalFile,'utf8')).decisions:[];
 for(const decision of [...review.decisions,...additional]){
  const {sourceFile,sourceHash,lines,excerpt}=decision.evidence;
  const body=fs.readFileSync(sourceFile,'utf8');
  if(createHash('sha256').update(body).digest('hex')!==sourceHash)throw Error('Changed Class scope source '+decision.id);
  const range=body.split(/\r?\n/).slice(lines[0]-1,lines[1]).join('\n');
  if(!range.includes(excerpt))throw Error('Changed Class scope excerpt '+decision.id);
  const item=items.find(i=>i.id===decision.id);
  if(item&&(item.category!=='Classes'||item.wikiUrl!==decision.wikiUrl))throw Error('Class scope identity mismatch '+decision.id);
  if(decision.decision!=='RemovedFromFarm')throw Error('Unsupported Class scope decision');
  verified.add(decision.id);
 }
 return items.filter(item=>!verified.has(item.id));
}
