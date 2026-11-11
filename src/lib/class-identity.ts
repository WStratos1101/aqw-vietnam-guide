import identities from '../content/classes/abbreviations-runtime.json';
const key=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
export function classIdentity(classId:string, variantName?:string){
 const rows=identities.filter(r=>r.classId===classId);
 if(variantName)return rows.find(r=>key(r.officialName)===key(variantName));
 return rows.find(r=>r.primary)??rows[0];
}
export function classIdentityLabel(classId:string, variantName?:string){
 const row=classIdentity(classId,variantName);
 if(!row)return variantName||'';
 return row.officialName+(row.primaryAbbreviation?' ('+row.primaryAbbreviation+')':'');
}
export function classIdentityAliases(classId:string){
 return identities.filter(r=>r.classId===classId).flatMap(r=>[r.officialName,...(r.primaryAbbreviation?[r.primaryAbbreviation]:[]),...r.alternativeAbbreviations,...r.nicknames]);
}
