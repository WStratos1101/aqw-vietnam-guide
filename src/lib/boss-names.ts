import presentation from '../content/presentation/bosses.json';
export function bossPresentation(slug:string){return (presentation as Record<string,{officialName:string;ultraName:string;dark:string;light:string}>)[slug];}
export const bossNameMappings={ 'ultra-drago':{displayName:'King Draco',canonicalSourceName:'King Drago',encounterName:'Ultra Drago',mapCommand:'/join ultradrago',source:'https://aqwwiki.wikidot.com/king-drago-monster'} };
export function bossDisplayName(slug:string,name:string){return bossPresentation(slug)?.officialName || name;}
export function monsterDisplayName(monster:{canonicalName:string;source?:string}){return monster.canonicalName==='King Drago'&&monster.source?.includes('king-drago-monster')?'King Draco':monster.canonicalName;}
