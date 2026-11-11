import fs from 'node:fs';
import {classSourceParser} from '../src/lib/team-source.mjs';
const bosses=JSON.parse(fs.readFileSync('src/content/ultra/bosses.json'));
const names=JSON.parse(fs.readFileSync('src/data/team-class-aliases.json'));
const text=b=>b.type==='table'?'':b.runs.map(r=>r.text).join('').trim();
const parser=classSourceParser(names);
const canonical=[...new Set(Object.values(names))].map(name=>{const abbreviations=Object.keys(names).filter(k=>names[k]===name);return {id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,abbreviation:abbreviations[0],aliases:abbreviations.slice(1),source:'community-guide'};});
const result={};
for(const boss of bosses){
 const body=boss.sourceContentUrl?JSON.parse(fs.readFileSync('public'+boss.sourceContentUrl)):null;
 result[boss.slug]={};
 for(const team of boss.recommendedTeams){
  const blocks=body?.teams.find(t=>t.id===team.guideKey)?.blocks||[];const per={};let current=[];const refs=[];
  let lines=blocks.map(text).filter(Boolean);
  if(boss.slug==='ultra-warden'){
   const source=fs.readFileSync('content-sources/v9/challenge-guide-current.txt','utf8');
   lines=source.split('ULTRA WARDEN')[1].split('◆ Team 2:')[0].split('\n').map(s=>s.trim()).filter(Boolean);
  }
  for(const raw of lines){const t=raw.replace(/^[*•]\s*/,'');if(t.startsWith('→'))current=parser.header(t);
   const references=parser.references(t);if(references.length){refs.push(...references);current=[];continue;}
   for(const alias of current)(per[alias]??=[]).push(t);
  }
  for(const ref of refs)for(const alias of ref.aliases){const ancestor=result[boss.slug][ref.team]?.flatMap(s=>[s.primaryClass,...s.alternativeClasses]).find(c=>c.name===names[alias]);if(ancestor)per[alias]=[...(per[alias]||[]),...ancestor.instructions,...ancestor.enhancement.map(e=>'Enh: '+e),ref.note];}
  const choice=name=>{name=names[name]||name;const c=canonical.find(c=>c.name===name);const legacy=team.classes.find(c=>c.className===name);const lines=[...new Set([...(per[c?.abbreviation]||[]),...(c?.aliases||[]).flatMap(a=>per[a]||[])])];const enhancement=[...new Set(lines.filter(l=>/^Enh:/i.test(l)).map(l=>l.replace(/^Enh:\s*/i,'')))];const instructions=[...new Set(lines.filter(l=>!/^Enh:/i.test(l)))];if(!lines.length&&legacy){if(legacy.enhancement)enhancement.push(legacy.enhancement);if(legacy.rotation)instructions.push(legacy.rotation);if(legacy.notes&&!legacy.notes.startsWith('Đọc nhiệm vụ'))instructions.push(legacy.notes);}return {classId:c?.id||name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name,abbreviation:c?.abbreviation||'',enhancement,instructions,source:body?.sourceGuide||'https://docs.google.com/document/d/18Z2Yu0O40dVyh0enB_2k_v4U-De3mg1y-HtThUmvxfU/edit',roles:legacy?.role&&!legacy.role.startsWith('Phân công')?[legacy.role]:[]};};
  result[boss.slug][team.id]=team.classes.map((c,i)=>({id:team.id+'-'+i,primaryClass:choice(c.className),alternativeClasses:(c.alternatives||[]).map(choice)}));
 }
}
fs.writeFileSync('src/content/ultra/team-loadouts.json',JSON.stringify({canonical,encounters:result},null,2)+'\n');
// Expand the source table's spans before creating phases; blank cells remain blank.
const detail=JSON.parse(fs.readFileSync('src/content/ultra/details.json'))['ultra-speaker'];
const table=detail.tauntTables.find(b=>b.type==='table');const grid=[];
table.rows.forEach((row,r)=>{grid[r]??=[];let col=0;for(const cell of row.cells){while(grid[r][col]!==undefined)col++;const value=cell.blocks.map(text).join(' ').trim();for(let y=0;y<cell.rowSpan;y++){grid[r+y]??=[];for(let x=0;x<cell.colSpan;x++)grid[r+y][col+x]=value;}col+=cell.colSpan;}});
const steps=grid.filter(r=>r[2]&&r[2]!=='Malgor Skill').map((r,i)=>({id:'step-'+i,sequence:i+1,bossSkill:r[2],taunter:r[3]||'—',zonePlayer:r[4]||'—',notes:r[5]||'',source:'community-guide'}));
const phases=[{id:'opening',label:'Mở đầu',steps:steps.slice(0,2)}];for(let i=2;i<steps.length;i+=4)phases.push({id:'loop-'+i,label:`Bước ${i+1}–${Math.min(i+4,steps.length)}`,steps:steps.slice(i,i+4)});
fs.writeFileSync('src/content/ultra/tactical-phases.json',JSON.stringify(phases,null,2)+'\n');
console.log('Encounter-specific Class loadouts and lossless Speaker steps generated.');
