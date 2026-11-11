import fs from 'node:fs';
const names=JSON.parse(fs.readFileSync('src/data/team-class-aliases.json'));
const canonical=JSON.parse(fs.readFileSync('src/content/ultra/team-loadouts.json')).canonical;
const aliases=Object.keys(names).sort((a,b)=>b.length-a.length);
const atom=`(?:${aliases.join('|')})`;
const group=`(?:[2-7]\\s+)?${atom}(?:\\s*/\\s*${atom})*`;
const list=new RegExp(`^(${group}(?:\\s*,\\s*${group})*)`);
const aliasPattern=new RegExp(`\\b(${aliases.join('|')})\\b`,'g');
export function challengeTeams(blocks,source){
 const lines=blocks.map(b=>(b.runs||[]).map(r=>r.text).join('').trim());const out=[];
 for(let i=0;i<lines.length;i++){
 const h=lines[i].match(/^(?:◆\s*)?Team\s*(\d+)(?:\s*người)?\s*:\s*(.*)$/i);if(!h)continue;
 const composition=h[2].match(list)?.[1];if(!composition)continue;
 let end=lines.findIndex((l,n)=>n>i&&(/^(?:◆\s*)?Team\s*\d+/.test(l)||/^Cách đánh/.test(l)));if(end<0)end=lines.length;
 const notes={};let current=[];
 for(const line of lines.slice(i+1,end)){
 if(line.startsWith('→'))current=[...line.matchAll(aliasPattern)].map(m=>m[1]);
 if(!current.length)continue;
 for(const alias of current){notes[alias]??={instructions:[],enhancement:[]};if(/^\s*\*\s*Enh:/.test(line))notes[alias].enhancement.push(line.replace(/^\s*\*\s*Enh:\s*/,''));else notes[alias].instructions.push(line);}
 }
 const choices=composition.split(/\s*,\s*/).flatMap((slot,j)=>{
 const count=Number(slot.match(/^(\d+)\s/)?.[1]||1);const candidates=[...new Set(slot.match(aliasPattern)||[])].map(abbreviation=>{
 const c=canonical.find(c=>c.name===names[abbreviation]);return{classId:c?.id||names[abbreviation].toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:names[abbreviation],abbreviation,enhancement:notes[abbreviation]?.enhancement||[],instructions:notes[abbreviation]?.instructions||[],source};
 }).filter((c,i,all)=>all.findIndex(x=>x.classId===c.classId)===i);
 return Array.from({length:count},(_,k)=>({id:`team-${out.length+1}-slot-${j+1}-${k+1}`,primaryClass:candidates[0],alternativeClasses:candidates.slice(1)}));
 });
 out.push({id:'source-team-'+h[1],name:lines[i].replace(/^◆\s*/,''),assignments:choices,source});
 }
 return out;
}
