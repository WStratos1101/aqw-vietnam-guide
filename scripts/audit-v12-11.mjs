import fs from 'node:fs';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const initial = read('content-sources/v12-11/initial-queue.json');
const catalog = read('src/content/classes/catalog.json');
const acquisition = read('src/content/classes/acquisition.json').classes;
const body = new Map(catalog.map(profile => [profile.id, read('public' + profile.bodyUrl)]));
const escape = value => String(value ?? '—').replaceAll('|', '\\|').replaceAll('\n',' ');
const rows = initial.skills.map(entry => {
  const skill = body.get(entry.classId)?.skills.find(skill => skill.id === entry.skillId);
  const remaining = entry.missingFields.filter(field => field === 'sourceConflict' ? skill?.effectsVerificationStatus === 'source_conflict' : field === 'effects' ? skill?.effectsVerificationStatus === 'unverified' : skill?.[field] == null);
  return {...entry, status:remaining.length?'PENDING':'VERIFIED', remaining, currentValue:Object.fromEntries(entry.missingFields.map(field => [field, field==='effects'?skill?.effects:field==='sourceConflict'?skill?.effectEvidence:skill?.[field]]))};
});
const acquisitionRows = initial.acquisitions.map(entry => ({...entry, status:acquisition[entry.classId]?.reviewStatus==='reviewed'?'VERIFIED':'PENDING',currentValue:acquisition[entry.classId]}));
const lines = ['# V12.11 Verification Queue', '', 'Danh sách được tính từ source. Mỗi Skill chỉ có một entry, các field thiếu cùng nằm trong entry đó. Snapshot trước khi sửa nằm tại content-sources/v12-11/initial-queue.json.', '', '| Class ID / Name | Skill ID / Name | Missing Fields | Current Value | Source References | Status / Reason |','| --- | --- | --- | --- | --- | --- |'];
for (const entry of rows) lines.push('| '+[entry.classId+' / '+entry.className,entry.skillId+' / '+entry.skillName,entry.missingFields.join(', '),JSON.stringify(entry.currentValue),entry.sources.join(' · '),entry.status+' · '+(entry.remaining.length?entry.reason:'Nguồn kiểm chứng đã tích hợp')].map(escape).join(' | ')+' |');
lines.push('','## Acquisition','','Có '+initial.acquisitions.length+' hồ sơ trong backlog gốc. Các hồ sơ partial mới ngoài phạm vi này được giữ nguyên và liệt kê ở cuối.','','| Class ID / Name | Missing Fields | Current Value | Source References | Status / Reason |','| --- | --- | --- | --- | --- |');
for(const entry of acquisitionRows){const record=entry.currentValue;const pending=record.methods.filter(m=>m.detailsStatus==='partial').map(m=>({id:m.id,source:m.source,fields:m.evidence?.issues}));lines.push('| '+[entry.classId+' / '+entry.className,'acquisition',JSON.stringify({issues:record.issues,methods:pending}),entry.sources.join(' · '),entry.status+' · '+entry.reason].map(escape).join(' | ')+' |');}
lines.push('','Partial ngoài backlog gốc: '+initial.additionalPartial.join(', ')+'.');
fs.writeFileSync('V12_11_VERIFICATION_QUEUE.md', lines.join('\n')+'\n');
fs.writeFileSync('artifacts/qa/v12-11/queue.json',JSON.stringify({skills:rows,acquisitions:acquisitionRows},null,2)+'\n');
console.log({uniqueSkills:rows.length,range:rows.filter(r=>r.remaining.includes('rangeCategory')).length,target:rows.filter(r=>r.remaining.includes('targetCount')).length,effects:rows.filter(r=>r.remaining.includes('effects')).length,conflicts:rows.filter(r=>r.remaining.includes('sourceConflict')).length,acquisition:acquisitionRows.filter(r=>r.status!=='VERIFIED').length});
