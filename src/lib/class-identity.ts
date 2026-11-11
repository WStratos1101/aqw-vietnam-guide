import data from '../content/ultra/team-loadouts.json';
export function classIdentity(name:string){const query=name.trim().toLocaleLowerCase('en');return data.canonical.find(c=>[c.name,c.id,c.abbreviation,...c.aliases].some(value=>value.toLocaleLowerCase('en')===query));}
