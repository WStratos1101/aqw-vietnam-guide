import summaries from '../content/route-summaries.json';
export const findClass=(slug:string)=>summaries.classes.find(c=>c.slug===slug||c.aliases.includes(slug));
export const findBoss=(slug:string)=>summaries.bosses.find(b=>b.slug===slug);
