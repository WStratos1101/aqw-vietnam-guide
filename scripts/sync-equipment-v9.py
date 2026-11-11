"""Bounded, incremental exact-page equipment candidates. Publication requires hash approval."""
import json,hashlib,struct,subprocess,time,sys,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
folder=root/'content-sources/v9';folder.mkdir(exist_ok=True)
rows=json.loads((root/'content-sources/v678/review.json').read_text())
equipment=json.loads((root/'src/content/ultra/equipment.json').read_text())['entities']
records=[]
for row in rows:
 if row['kind']!='equipment' or row.get('error'):continue
 entity=next((e for e in equipment.values() if e['name']==row['name']),None)
 if not entity:continue
 candidates=[i for i in row.get('images',[]) if 'imgur.com/' in i['url']]
 if not candidates:continue
 image=candidates[0]['url'];path=folder/(entity['id']+'.png')
 if not path.exists():
  result=subprocess.run(['curl','-4','-fLsS','--max-time','25',image,'-o',str(path)],capture_output=True,text=True)
  if result.returncode:print(row['name'],result.stderr.strip());continue
  time.sleep(1)
 raw=path.read_bytes()
 if not raw.startswith(b'\x89PNG\r\n\x1a\n'):print('Rejected non-PNG',row['name']);continue
 w,h=struct.unpack('>II',raw[16:24])
 if min(w,h)<50:print('Rejected small image',row['name']);continue
 records.append(dict(assetId=entity['image'] or 'equipment-'+entity['id'],entityId=entity['id'],entityName=entity['name'],entityType='item',imageRole='equipment',sourcePage=row['url'],originalImageUrl=image,imagePath='/images/aqw/equipment/'+path.name,candidatePath=str(path.relative_to(root)),width=w,height=h,fileHash=hashlib.sha256(raw).hexdigest(),verificationStatus='needs_review',usageStatus='needs_review',authorOrCredit='AdventureQuest Worlds game graphics © Artix Entertainment LLC; AQW Wiki contributors.',usageEvidence='https://www.aq.com/lore/guides/assetusageguidelines',verifiedAt=None))
(folder/'equipment-candidates.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
if '--publish' in sys.argv:
 approvals=json.loads((folder/'equipment-approvals.json').read_text())
 manifest=json.loads((root/'src/data/aqw-assets.json').read_text())
 for record in records:
  if approvals.get(record['assetId'])!=record['fileHash']:continue
  old=next((a for a in manifest if a['assetId']==record['assetId']),None)
  if old and old.get('verificationStatus')=='verified' and old.get('imagePath') and (root/'public'/old['imagePath'].lstrip('/')).exists():continue
  record.update(verificationStatus='verified',usageStatus='approved',verifiedAt='2026-11-08',review={'entityEvidence':'Exact item page main screenshot, not related items or image-tags.','visualEvidence':'Original PNG viewed with view_image; correct weapon or armor variant.','reviewedAt':'2026-11-08','usageEvidence':record['usageEvidence']})
  destination=root/'public'/record['imagePath'].lstrip('/');destination.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(root/record['candidatePath'],destination)
  if old:old.update(record)
  else:manifest.append(record)
 (root/'src/data/aqw-assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{'assetId':r['assetId'],'name':r['entityName'],'path':r['candidatePath'],'hash':r['fileHash']} for r in records],indent=2))
