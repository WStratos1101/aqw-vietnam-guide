// Shared by offline import, semantic tests, and the browser. Operators are
// structural tokens, never inferred from substrings inside an item name.
export const materialId=name=>name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');
export function item(name,quantity=1,source){return {kind:'item',itemId:materialId(name),name,quantity,...(source?{source}:{})};}
export function parseExpression(tokens){
 let at=0;
 function primary(){const t=tokens[at++];if(t==='('){const node=or();if(tokens[at++]!==')')throw Error('Unclosed material group');return node;}if(t&&typeof t==='object'&&t.kind==='item')return t;throw Error('Expected material item');}
 function and(){const nodes=[primary()];while(tokens[at]==='AND'){at++;nodes.push(primary());}return nodes.length===1?nodes[0]:{kind:'allOf',requirements:nodes};}
 function or(){const nodes=[and()];while(tokens[at]==='OR'){at++;nodes.push(and());}return nodes.length===1?nodes[0]:{kind:'anyOf',requiredChoices:1,requirements:nodes};}
 const result=or();if(at!==tokens.length)throw Error('Ambiguous material expression');const errors=validateMaterials(result);if(errors.length)throw Error(errors.join('; '));return result;
}
export function materialLeaves(node){return !node?[]:node.kind==='item'?[node]:node.requirements.flatMap(materialLeaves);}
export function requiredMaterials(node){return !node?[]:node.kind==='item'?[node]:node.kind==='allOf'?node.requirements.flatMap(requiredMaterials):[];}
export function validateMaterials(node,path='root'){
 if(!node)return [path+': missing recipe'];
 if(node.kind==='item')return [!node.name?.trim()||/^(?:OR|AND|N\/A)$/i.test(node.name.trim())?'invalid material name':null,!node.itemId?'missing item ID':null,!Number.isSafeInteger(node.quantity)||node.quantity<=0?'invalid quantity':null].filter(Boolean).map(e=>path+': '+e);
 if(!['allOf','anyOf'].includes(node.kind)||!Array.isArray(node.requirements)||!node.requirements.length)return [path+': invalid group'];
 const keys=node.requirements.map(n=>n.kind==='item'?n.itemId:JSON.stringify(n));const errors=keys.length!==new Set(keys).size?[path+': duplicate requirement']:[];
 if(node.kind==='anyOf'&&(!Number.isInteger(node.requiredChoices)||node.requiredChoices<1||node.requiredChoices>node.requirements.length))errors.push(path+': invalid requiredChoices');
 return [...errors,...node.requirements.flatMap((n,i)=>validateMaterials(n,path+'.'+i))];
}
// Flat text cannot prove the scope of a standalone OR/AND. Fail closed; the
// caller must provide reviewed source rows/tree, or keep needs_verification.
export function parseMaterialLines(text,source){
 const lines=text.split('\n').map(s=>s.trim()).filter(Boolean);
 if(lines.some(l=>/^(OR|AND)$/i.test(l)))return {confidenceStatus:'needs_verification',tree:null,reason:'Operator scope lost in flattened source; source list structure required.'};
 const nodes=[];for(let i=0;i<lines.length;i++){
  if(/^x[\d,]+$/.test(lines[i]))throw Error('Quantity without material');
  if(/Dropped by|Stacks up|^Note:|^Requirements/.test(lines[i]))continue;
  if(/[x×][\d,]+\s+(?:OR|AND)\s+/.test(lines[i])){
   const parts=lines[i].split(/\s+(OR|AND)\s+/);const tokens=[];
   for(let j=0;j<parts.length;j++){if(j%2){tokens.push(parts[j]);continue;}const m=parts[j].match(/^(.*?)\s+[x×]([\d,]+)$/);if(!m)return {confidenceStatus:'needs_verification',tree:null,reason:'Ambiguous inline material operator.'};tokens.push(item(m[1],Number(m[2].replaceAll(',','')),source));}
   try{nodes.push(parseExpression(tokens));}catch(error){return {confidenceStatus:'needs_verification',tree:null,reason:error.message};}continue;
  }
  const match=lines[i].match(/^(.*?)\s+[x×]([\d,]+)$/);let name=match?.[1]||lines[i],qty=match?Number(match[2].replaceAll(',','')):1;
  if(!match&&/^x[\d,]+$/.test(lines[i+1]||''))qty=Number(lines[++i].slice(1).replaceAll(',',''));
  nodes.push(item(name,qty,source));
 }
 const tree={kind:'allOf',requirements:nodes};const errors=validateMaterials(tree);
 return {confidenceStatus:errors.length?'needs_verification':'verified',tree:errors.length?null:tree,reason:errors.join('; ')};
}
export function selectedMaterials(tree,selections={},path='root'){
 if(!tree)return [];if(tree.kind==='item')return [{...tree,path}];
 const raw=selections[path],selected=tree.kind==='anyOf'?(Array.isArray(raw)?[...new Set(raw.filter(i=>Number.isInteger(i)&&i>=0&&i<tree.requirements.length))].slice(0,tree.requiredChoices):[...Array(tree.requiredChoices).keys()]):tree.requirements.map((_,i)=>i);
 return selected.flatMap(i=>tree.requirements[i]?selectedMaterials(tree.requirements[i],selections,path+'.'+i):[]);
}
export function materialProgress(tree,selections={},done=[]){const leaves=selectedMaterials(tree,selections);return {total:leaves.length,done:leaves.filter(n=>done.includes(n.path+':'+n.itemId)).length};}
