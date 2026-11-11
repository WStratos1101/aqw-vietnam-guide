import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const save=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const ext=read('src/content/classes/calendar-extension.json');
const catalog=read('src/content/classes/catalog.json');
for(const profile of ext.profiles){
  if(!catalog.some(c=>c.id===profile.id))catalog.push(profile);
  const file='public'+profile.bodyUrl;
  if(!fs.existsSync(file))save(file,ext.bodies[profile.id]);
}
const registry=read('src/content/classes/skill-registry.json');
for(const r of ext.records)if(!registry.skills.some(s=>s.classId===r.classId&&s.skillId===r.skillId))registry.skills.push(r);
for(const a of ext.assets)if(!registry.assets.some(s=>s.id===a.id))registry.assets.push(a);
const portraits=read('src/content/classes/portrait-registry.json');
for(const a of ext.portraits)if(!portraits.some(p=>p.id===a.id))portraits.push(a);
save('src/content/classes/catalog.json',catalog);save('src/content/classes/skill-registry.json',registry);save('src/content/classes/portrait-registry.json',portraits);
save('src/content/classes/calendar-membership.json',ext.calendar.map(e=>({classId:e.classId,source:e.source,year:typeof e.year==="number"?e.year:e.year?.year||null,yearSource:e.year?.source||null})));
console.log(`Calendar extension: ${ext.profiles.length} profiles; ${ext.records.length} named skill mappings.`);
