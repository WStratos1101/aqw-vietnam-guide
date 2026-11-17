import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseFarmReviewPage} from './lib/farm-review-parser.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),hash=v=>createHash('sha256').update(v).digest('hex');
const root='Update/_offline-staging/20261117-081737', doc='Update/_offline-sources/20261117-081737/FARM_DOCS_SOURCE.txt';
const expected='2d16c4134b48acb409af95a310d7742d38b4bfe08d303d3e97b7cd4ea8b93663';
if(hash(fs.readFileSync(doc))!==expected)throw Error('Offline Docs changed; recheck ranges before importing');
const records=read('src/content/farm/catalog-v2.generated.json').items,existing=new Set(records.map(i=>i.wikiUrl));
const laeFile='content-sources/farm/external-guide-evidence/wiki/lae-s-quests.html',laeUrl='https://aqwwiki.wikidot.com/lae-s-quests';
const lae=parseFarmReviewPage(fs.readFileSync(laeFile,'utf8'),laeUrl);
const rows=[];
for(const quest of ['A Dark Knight','A Dark Knight Rises','A Dark Knight Falls','A Dark Knight Returns']){
 const q=lae.quests.find(q=>q.name===quest);
 for(const reward of [...q.fixedRewards,...q.choiceRewards,...q.randomRewards,...q.randomChoiceRewards]){
  if(!/\((?:Helm|Cape|Armor|Sword)\)$/.test(reward.name)||existing.has(reward.wikiUrl))continue;
  rows.push({name:reward.name,url:reward.wikiUrl,role:'setMember',group:'hollowborn',family:quest==='A Dark Knight Returns'?'hollowborn-doomknight':'classic-hollowborn-doomknight',docFile:doc,docHash:expected,lines:quest==='A Dark Knight Returns'?[6984,7006]:[6922,6983],quest,questSource:laeUrl,questSourceFile:laeFile,questSourceHash:hash(fs.readFileSync(laeFile)),basis:'Exact equipment reward link; Misc variants excluded'});
 }
}
const inventories=read('content-sources/farm/equipment-sets/reviewed-inventories.json').sets;
for(const id of ['hollowborn-lich-king','hollowborn-legacy-of-nulgath','hollowborn-metamorphosis-of-nulgath']){
 const set=inventories.find(s=>s.id===id);
 for(const member of set.members)if(!existing.has(member.wikiUrl))rows.push({name:member.name,url:member.wikiUrl,role:'setMember',group:'hollowborn',family:id,docFile:doc,docHash:expected,lines:set.evidence.lines,inventoryEvidence:set.inventoryEvidence,basis:'Previously reviewed scoped reward inventory; still requires exact item validation'});
}
const darkonFile='content-sources/farm/equipment-sets/wiki/darkon-ultra-merge.html',darkonUrl='https://aqwwiki.wikidot.com/darkon-ultra-merge';
const darkon=parseFarmReviewPage(fs.readFileSync(darkonFile,'utf8'),darkonUrl);
for(const name of ["Darkon's Debris 1","Empowered Darkon's Debris 1","Darkon's Debris 2 (Recovered)","Dual Darkon's Debris 2"]){
 const link=darkon.itemLinks.find(l=>l.name===name);if(!link)throw Error('Missing exact Darkon reference '+name);
 if(!existing.has(link.url))rows.push({name,url:link.url,role:'target',group:'debris-astravian',family:'darkon-equipment',authority:'user-task-v3.3',referenceFile:darkonFile,referenceHash:hash(fs.readFileSync(darkonFile)),basis:'Explicit user target plus exact Wiki item reference; no shop-wide set membership inference'});
}
const cavFile='content-sources/class-acquisition/chaos-avenger-class.html',cav=parseFarmReviewPage(fs.readFileSync(cavFile,'utf8'),'https://aqwwiki.wikidot.com/chaos-avenger-class');
for(const name of ['Chaos Avenger Armor',"Chaos Avenger's Greatsword","Chaos Avenger's Hook Blade","Chaos Avenger's Armet","Chaos Avenger's Helm","Chaos Avenger's Tentacled Armet","Chaos Avenger's Cloak"]){
 const link=cav.itemLinks.find(l=>l.name===name);if(!link)throw Error('Missing exact CAV reference '+name);
 if(!existing.has(link.url))rows.push({name,url:link.url,role:'target',group:'chaos',family:'chaos-avenger',authority:'user-task-v3.3',referenceFile:cavFile,referenceHash:hash(fs.readFileSync(cavFile)),basis:'Explicit equipment target, distinct from Class; Wiki category remains mandatory'});
}
const unique=[...new Map(rows.map(row=>[row.url,row])).values()];
fs.writeFileSync(root+'/batch-001-plan.json',JSON.stringify({id:'offline-v33-001',status:'PLANNED',docs:{file:doc,sha256:expected},rows:unique.slice(0,25),next:unique.slice(25)},null,2)+'\n');
console.log('Batch 001',unique.slice(0,25).map(r=>new URL(r.url).pathname));
