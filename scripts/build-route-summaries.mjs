import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p));const base=read('src/content/ultra/bosses.json'),recovery=read('src/content/ultra/recovery.json');
const presentation=read('src/content/presentation/bosses.json');
const classes=read('src/content/classes/catalog.json').map(({id,slug,name,aliases,shortDescription})=>({id,slug,name,aliases,shortDescription}));
const bosses=[...base,...recovery.bosses].map(({id,slug,name,description})=>({id,slug,name:presentation[slug]?.officialName||name,description}));
fs.writeFileSync('src/content/route-summaries.json',JSON.stringify({classes,bosses})+'\n');
