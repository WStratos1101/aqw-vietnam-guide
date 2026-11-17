import {createHash} from 'node:crypto';
export const sha256 = value => createHash('sha256').update(value).digest('hex');
export function sourceOrigin(value) {
  try { const u=new URL(value);
    if(u.hostname==='sites.google.com' && /^\/view\/vncollector(?:\/|$)/.test(u.pathname))return 'google-sites';
    if(u.hostname==='docs.google.com')return 'google-docs';
    if(u.hostname==='aqwwiki.wikidot.com')return 'aqw-wiki';
  }catch{}
  return 'other';
}
export function validateOfflinePage(record) {
  if(typeof record.body!=='string'||sha256(record.body)!==record.sha256)throw Error('Offline body hash mismatch: '+record.url);
  return sourceOrigin(record.url);
}
export function equipmentCategory(crumbs) {
  if(crumbs.at(-1)==='/grounds')return 'Grounds';
  const mappings={'/weapons':'Weapons','/armors':'Armors','/helmets-hoods':'Helms','/capes-back-items':'Capes / Back Items','/pets':'Pets','/battle-pets':'Pets','/classes':'Classes'};
  if(crumbs.some(path=>['/misc-items','/grounds','/house-items','/floor-items','/wall-items'].includes(path)))return null;
  return crumbs.map(path=>mappings[path]).filter(Boolean).at(-1)||null;
}
export function sameItemName(expected,actual) {
  const normalize=value=>value.normalize('NFKC').replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim().toLowerCase();
  return normalize(expected)===normalize(actual);
}
