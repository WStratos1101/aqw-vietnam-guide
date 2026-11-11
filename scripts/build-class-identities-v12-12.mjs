import fs from 'node:fs';
import {Window} from 'happy-dom';
const read=p=>JSON.parse(fs.readFileSync(p));
const profiles=read('src/content/classes/catalog.json'),families=read('src/content/classes/calendar-families.json');
const registry=read('src/content/classes/skill-registry.json'),art=read('src/content/classes/art-variants.json');
const doc=read('content-sources/class-guide.json'),imported=read('src/content/imported/catalog.json');
const docUrl='https://docs.google.com/document/d/'+doc.source.id+'/edit';
const normalized=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const clean=s=>s.replace(/\s*·\s*(Male|Female)$/i,'').replace(/\s*\((?:Class|AC|0 AC|Merge|Legend|Non-Legend|Legendary|Non-Legendary|Rare|Non-Rare|IoDA|Original|Quest|[1-9])\)/gi,'').trim();
const evidence=new Map();
function add(name,tokens,line,text,url=docUrl,kind='abbreviation'){
 const key=normalized(clean(name));if(!evidence.has(key))evidence.set(key,{officialName:clean(name),primary:null,alternatives:[],nicknames:[],sources:[]});const e=evidence.get(key);
 if(kind==='nickname')e.nicknames.push(...tokens);
 else if(!e.primary){e.primary=tokens[0];e.alternatives.push(...tokens.slice(1));}
 else e.alternatives.push(...tokens.filter(t=>t!==e.primary));
 e.sources.push({url,sourceIndex:line||null,sourceText:text,kind});
}
const headings=imported.filter(p=>p.category==='class'&&p.level===3).map(p=>({text:p.title,line:Number(p.sourceHeadingId?.replace('line-',''))}));
for(const h of headings)for(const chunk of h.text.split(/\s+-\s+/)){
 const m=chunk.match(/^(.+?)\s*\(([A-Za-z][A-Za-z0-9/]{1,20})\)$/);if(m&&!m[1].includes('/')&&!['AC','Class','Merge'].includes(m[2]))add(m[1],m[2].split('/'),h.line,h.text);
}
// Explicit slash-name/abbreviation groupings in the guide; no generated initials.
const grouped=[
 [9915,['ChronoCorruptor','Chrono Chaorruptor'],[['CCR'],['CCR']]],
 [9989,['TimeKiller','TimeKeeper'],[['TK'],['TK']]],
 [10071,['ChronoCommander','Chrono Commandant'],[['CMD'],['CMD']]],
 [10146,['Chrono DragonKnight','Chrono DataKnight'],[['CDK'],['CDK']]],
 [10471,['Corrupted Chronomancer','Timeless Chronomancer','Underworld Chronomancer','Overworld Chronomancer'],[['CCM'],['TCM'],['UCM'],['OCM']]],
 [11151,['Nechronomancer','Necrotic Chronomancer'],[['NCM'],['NCM']]],
 [11234,['Continuum Chronomancer','Quantum Chronomancer'],[['QCM'],['QCM']]],
 [11312,['Paladin Chronomancer','Obsidian Paladin Chronomancer'],[['PCM'],['PCM']]],
 [11391,['Chrono ShadowSlayer','Chrono ShadowHunter'],[['CSS'],['CSH']]],
 [11488,['Phantom Chronomancer','Phantasm Chronomancer'],[['PhCM'],['PhCM']]],
 [11570,['Archivist of Time','Archivist of Temporis'],[['AoT'],['AoT']]],
];
for(const [line,names,tokens]of grouped){const n=doc.nodes.find(n=>n.sourceIndex===line),text=n.runs.map(r=>r.text).join('').trim();for(let i=0;i<names.length;i++)add(names[i],tokens[i],line,text);}
const wiki='https://aqwwiki.wikidot.com/abbreviations-acronyms';
for(const [name,tokens,kind]of [
 ['Alpha Pirate',['AP']],['Acolyte',['Aco']],['ChronoCommander',['CC']],['ShadowWalker of Time',['SWoT']],['ShadowStalker of Time',['SSoT']],['ShadowWeaver of Time',['SWoT']],['Pinkomancer',['Pinko']],['Warlord',['WL']],['Classic DoomKnight',['CDK']],['Beta Berserker',['BB']],['Sorcerer',['Sorc']],['Paladin',['Pally'],'nickname'],['Berserker',['Zerker'],'nickname'],['Lord of Order',['LOO']],['Lord of Order',['Lorder'],'nickname'],['Glacial Warlord',['GW']],['BattleMage',['RBM']],['Chaos Slayer Berserker',['CS']],['Eternal Chronomancer',['IC']],['Immortal Chronomancer',['IC']],['Empyrean Chronomancer',['IC']]
])add(name,tokens,null,tokens.join('/')+' — '+name,wiki,kind||'abbreviation');
for(const [names,token,phrase]of [[['Alpha Omega','DOOMmega'],'AO','Alpha Omega/DOOMmega (AO)'],[['Undead Goat','Unundead Goat'],'UG','Undead Goat - Unundead Goat (UG)']]){const h=headings.find(h=>h.text===phrase);if(h)for(const name of names)add(name,[token],h.line,h.text);}
const reviewedCompound=[
 ['Artifact Hunter',['AH']],['Antique Hunter',['AH']],['Dark BattleMage',['DBM']],['Royal BattleMage',['RBM']],['Dragon Knight',['DrK']],['Drakkar Knight',['DrK']],['Draco Knight',['DrK']],['Dragon Shinobi',['DSS']],['DragonSoul Shinobi',['DSS']],['Shadow Dragon Shinobi',['DSS']],['Legendary Elemental Warrior',['LEW']],['Ultra Elemental Warrior',['UEW']],['Mythic Elemental Warrior',['MEW']],['Prismatic ClawSuit',['PCS']],['Evolved ClawSuit',['ECS']],['Eternal Chronomancer',['ECM']],['Immortal Chronomancer',['ICM']],['Infinity Knight',['IK']],['Interstellar Knight',['IK']]
];
for(const [name,tokens]of reviewedCompound){const h=headings.find(h=>{const words=name.split(' ');return words.every(w=>h.text.toLowerCase().includes(w.toLowerCase()))||(/DragonSoul|Shadow Dragon/.test(name)&&h.text.includes('Shinobi'));});if(!h)continue;add(name,tokens,h.line,h.text);}
async function officialName(profile){const url=registry.classes[profile.id]?.sourceUrl;if(url){const slug=new URL(url).pathname.slice(1);const file=['content-sources/v12-6/wiki/','content-sources/class-wiki/','content-sources/class-acquisition/'].map(d=>d+slug+'.html').find(fs.existsSync);if(file){const w=new Window();w.document.write(fs.readFileSync(file,'utf8'));const title=w.document.querySelector('#page-title')?.textContent.trim();await w.happyDOM.close();if(title)return {name:clean(title),source:url};}}return {name:clean(profile.name.split(/\s+-\s+/)[0].replace(/\s*\([A-Za-z/]+\)/g,'')),source:url||profile.sources[0]?.url};}
const rows=[];
for(const c of profiles){
 const primary=await officialName(c),family=families.find(f=>f.variants.some(v=>v.classId===c.id));
 const candidates=[{name:primary.name,source:primary.source,primary:true},...art.filter(a=>a.classId===c.id&&a.variantType==='class_skin').map(a=>({name:clean(a.variantName),source:a.source,primary:false})),...(family?.variants.filter(v=>v.classId===c.id).map(v=>({name:v.name,source:v.source,primary:normalized(v.name)===normalized(primary.name)}))||[])];
 const seen=new Set();for(const v of candidates){const key=normalized(v.name);if(seen.has(key))continue;seen.add(key);const e=evidence.get(key);
 rows.push({id:c.id+'/'+key,classId:c.id,officialName:v.name,primary:v.primary,primaryAbbreviation:e?.primary||null,alternativeAbbreviations:[...new Set(e?.alternatives||[])],nicknames:[...new Set(e?.nicknames||[])],familyId:family?.id||c.id,sources:[...(e?.sources||[]),...(v.source?[{url:v.source,kind:'identity'}]:[])],verificationStatus:e?.primary?'verified':'not_documented',verifiedAt:'2026-11-11'});
 }
}
fs.writeFileSync('src/content/classes/abbreviations.json',JSON.stringify(rows,null,2)+'\n');
fs.writeFileSync('src/content/classes/abbreviations-runtime.json',JSON.stringify(rows.map(({classId,officialName,primary,primaryAbbreviation,alternativeAbbreviations,nicknames,familyId})=>({classId,officialName,primary,primaryAbbreviation,alternativeAbbreviations,nicknames,familyId})))+'\n');
console.log({profiles:profiles.length,identities:rows.length,verified:rows.filter(r=>r.verificationStatus==='verified').length,primaryVerified:rows.filter(r=>r.primary&&r.primaryAbbreviation).length,primaryMissing:rows.filter(r=>r.primary&&!r.primaryAbbreviation).map(r=>r.officialName)});
