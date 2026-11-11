export function pickOtherClasses(profiles,currentId,random=Math.random){
 const pool=profiles.filter(c=>c.id!==currentId&&typeof c.slug==='string'&&/^[a-z0-9-]+$/.test(c.slug));
 const unique=[...new Map(pool.map(c=>[c.id,c])).values()];
 for(let i=unique.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[unique[i],unique[j]]=[unique[j],unique[i]];}
 return unique.slice(0,4);
}
