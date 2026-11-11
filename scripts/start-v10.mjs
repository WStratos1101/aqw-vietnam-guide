import fs from 'node:fs';
const file='src/features/ultra/UltraBoss.tsx';let text=fs.readFileSync(file,'utf8');
if(!text.includes("from './BossDirectoryCard'"))text="import {BossDirectoryCard,type BossDirectoryEntry} from './BossDirectoryCard';\n"+text;
const start=text.indexOf('      <section className="ultra-gallery"');const end=text.indexOf('      {!filtered.length',start);
if(start<0||end<0)throw Error('Directory boundary changed; refusing mutation');
text=text.slice(0,start)+`      {(['daily','weekly','seasonal'] as const).map(group=>{
        const order:Record<string,string[]>={daily:['ultra-ezrajal','ultra-warden','ultra-engineer','ultra-tyndarius','god-of-the-depths','kolr-usurper-of-flames','astral-empyrean'],weekly:['champion-drakath','ultra-nulgath','ultra-dage','ultra-speaker','ultra-drago','darkon-the-conductor','gramiel-the-graceful'],seasonal:['kasuko','batara-kala','ultra-iara']};
        const entries:BossDirectoryEntry[]=[...filtered.map(b=>({id:b.slug,name:inspectionFor(b.slug)?.monsters.find(m=>m.id==='boss')?.canonicalName||b.name,href:'/ultra-boss/'+b.slug,image:b.images.portrait,category:challengeCategoryFor(b.slug),location:b.location,unlock:b.accessRequirements[0],reward:b.rewardSummary})),...otherGuides.map(g=>({id:g.id,name:g.name,href:g.href,image:g.image||'challenge-'+g.id,category:g.category}))].filter(e=>e.category===group).sort((a,b)=>order[group].indexOf(a.id)-order[group].indexOf(b.id));
        return entries.length?<section key={group} className="ultra-directory-group" aria-labelledby={group+'-title'}><h2 id={group+'-title'}>{challengeLabels[group]}</h2><div className="ultra-gallery">{entries.map(e=><BossDirectoryCard key={e.id} entry={e}/>)}</div></section>:null;
      })}
`+text.slice(end);fs.writeFileSync(file,text);
console.log('Directory grouped; shared card installed.');
