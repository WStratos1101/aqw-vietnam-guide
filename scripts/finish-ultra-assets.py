import json,subprocess,hashlib,struct,shutil,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];folder=root/'content-sources/v678';rows=json.loads((folder/'review.json').read_text());inspection=json.loads((root/'src/content/ultra/inspection.json').read_text())
fallback={'Dage the Dark Lord':('https://aqwwiki.wikidot.com/dage-the-dark-lord','https://imgur.com/zWsbpo2.png'),'Nulgath the Archfiend':('https://aqwwiki.wikidot.com/nulgath-the-archfiend','https://i.imgur.com/GdeB3eq.png'),'Overfiend Blade':('https://aqwwiki.wikidot.com/overfiend-blade','https://i.imgur.com/BCcj538.png')}
for name,(page,url) in fallback.items():
 row=next(r for r in rows if r['name']==name);path=folder/(row['entityId']+'-reviewed.png')
 if not path.exists():subprocess.run(['curl','-4','-fLsS','--max-time','25',url,'-o',str(path)],check=True)
 row['candidates']=[{'url':url,'localCandidate':str(path.relative_to(root))}];row['browserEvidence']='Exact image link opened from the Monster page via web tool; terminal page connection failed.'
records=[]
for slug,e in inspection.items():
 for m in e['monsters']:
  row=next(r for r in rows if r['url']==m['source']);c=next((c for c in row.get('candidates',[]) if c.get('localCandidate') and 'image-tags' not in c['url']),None)
  if not c:continue
  path=root/c['localCandidate'];raw=path.read_bytes()
  if not raw.startswith(b'\x89PNG\r\n\x1a\n'):raise ValueError('Not PNG: '+str(path))
  w,h=struct.unpack('>II',raw[16:24]);records.append({'assetId':slug+'-portrait' if m['id']=='boss' else slug+'-'+m['id']+'-portrait','entityId':slug+'-'+m['id'],'entityName':m['canonicalName'],'entityType':'monster','imageRole':'portrait','sourcePage':m['source'],'originalImageUrl':c['url'],'imagePath':'/images/aqw/ultra-bosses/'+path.name,'candidatePath':str(path.relative_to(root)),'width':w,'height':h,'fileHash':hashlib.sha256(raw).hexdigest(),'verificationStatus':'needs_review','usageStatus':'needs_review','authorOrCredit':'AdventureQuest Worlds game graphics © Artix Entertainment LLC; AQW Wiki contributors (CC BY-SA 3.0 page).','usageEvidence':'https://www.aq.com/lore/guides/assetusageguidelines','verifiedAt':None,'usedBy':[{'page':'/ultra-boss/'+slug,'component':'MonsterPortrait','role':'inspection'},{'page':'/ultra-boss','component':'Asset','role':'directory'}]})
(folder/'image-candidates.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
if '--publish' in sys.argv:
 approvals={a['assetId']:a['fileHash'] for a in json.loads((folder/'image-approvals.json').read_text())['approved']}
 manifest=json.loads((root/'src/data/aqw-assets.json').read_text());dest=root/'public/images/aqw/ultra-bosses';dest.mkdir(parents=True,exist_ok=True)
 for record in records:
  if approvals.get(record['assetId'])!=record['fileHash']:raise ValueError('Candidate requires a new visual review: '+record['assetId'])
  record.update(verificationStatus='verified',usageStatus='approved',verifiedAt='2026-11-08',entityEvidence='Exact Monster page; screenshot visually inspected against canonical Monster label and encounter; not an NPC, item or location image.')
  record['review']={'approved':True,'imageUrl':record['originalImageUrl'],'entityEvidence':record['entityEvidence'],'pageRegionEvidence':'Main screenshot in the exact Monster page, outside image-tags and related entity links.','visualEvidence':'view_image inspection of original PNG on 2026-11-08; visible Monster label matches '+record['entityName'],'usageEvidence':record['usageEvidence'],'reviewer':'Codex source and visual inspection','reviewedAt':'2026-11-08'}
  record['candidateImages']=[{'url':record['originalImageUrl'],'status':'verified','evidence':record['entityEvidence']}]
  if not record['entityId'].endswith('-boss'):record['usedBy']=[record['usedBy'][0]]
  else:record['usedBy'].append({'page':record['usedBy'][0]['page'],'component':'BossHero','role':'hero'})
  old=next((a for a in manifest if a['assetId']==record['assetId']),None)
  if old and old.get('verificationStatus')=='verified' and old.get('usageStatus')=='approved' and old.get('imagePath') and (root/'public'/old['imagePath'].lstrip('/')).exists():
   old.update(review=record['review'],candidateImages=record['candidateImages'],usedBy=record['usedBy']);continue
  shutil.copyfile(root/record['candidatePath'],root/'public'/record['imagePath'].lstrip('/'))
  if old:old.update(record)
  else:manifest.append(record)
 (root/'src/data/aqw-assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 credits=root/'public/images/aqw/CREDITS.md';text=credits.read_text().split('\n## Ultra Monster screenshots reviewed 2026-11-08')[0];text+='\n## Ultra Monster screenshots reviewed 2026-11-08\n'+ '\n'.join('- '+r['entityName']+': '+r['sourcePage']+' · Original: '+r['originalImageUrl'] for r in records)+'\nScreenshots are unmodified. Game artwork belongs to Artix Entertainment. Wiki page content: CC BY-SA 3.0. This fan guide is not an official Artix publication.\n';credits.write_text(text)
print(json.dumps([{'name':r['entityName'],'path':r['candidatePath'],'size':[r['width'],r['height']]} for r in records],indent=2))
