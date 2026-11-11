import json,subprocess,struct,hashlib,time,shutil,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'content-sources/recovery';data=json.loads((root/'src/content/ultra/recovery.json').read_text());records=[]
targets=[]
for slug,enc in data['inspection'].items():
 for m in enc['monsters']:targets.append((('challenge-'+slug) if m['id']=='boss' else 'challenge-'+slug+'-'+m['id'],m['canonicalName'],'monster',m['source']))
for slug,boss in data.get('routeOverrides',{}).items():
 pass
for e in data['equipment'].values():
 if e.get('source'):targets.append((e['image'],e['name'],'item',e['source']))
for aid,name,kind,url in targets:
 slug=url.rsplit('/',1)[-1];source=next((p for p in [out/(slug+'.json'),root/'content-sources/v9'/(slug+'.json')] if p.exists()),None)
 if not source:continue
 page=json.loads(source.read_text());images=[i if isinstance(i,str) else i['url'] for i in page.get('images',[])];image=next((i for i in images if ('imgur.com/' in i or 'aqwwiki.wdfiles.com/local--files/' in i) and 'image-tags' not in i),None)
 if not image:continue
 target=out/(aid+'.png')
 if not target.exists():
  p=subprocess.run(['curl','-4','-fLsS','--max-time','20',image,'-o',str(target)],capture_output=True,text=True)
  if p.returncode:print(name,'download_failed',flush=True);continue
  time.sleep(.5)
 raw=target.read_bytes()
 if not raw.startswith(b'\x89PNG\r\n\x1a\n'):print(name,'invalid_png',flush=True);continue
 w,h=struct.unpack('>II',raw[16:24]);records.append(dict(assetId=aid,entityId=aid,entityName=name,entityType=kind,imageRole='portrait' if kind=='monster' else 'equipment',sourcePage=url,originalImageUrl=image,candidatePath=str(target.relative_to(root)),imagePath='/images/aqw/'+('ultra-bosses' if kind=='monster' else 'equipment')+'/'+target.name,width=w,height=h,fileHash=hashlib.sha256(raw).hexdigest(),verificationStatus='needs_review',usageStatus='needs_review',authorOrCredit='AdventureQuest Worlds game graphics © Artix Entertainment LLC; AQW Wiki contributors.',usageEvidence='https://www.aq.com/lore/guides/assetusageguidelines',verifiedAt=None))
(out/'asset-candidates.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
if '--publish' in sys.argv:
 approvals=json.loads((out/'asset-approvals.json').read_text());manifest=json.loads((root/'src/data/aqw-assets.json').read_text())
 for r in records:
  if approvals.get(r['assetId'])!=r['fileHash']:continue
  old=next((a for a in manifest if a['assetId']==r['assetId']),None)
  if old and old.get('verificationStatus')=='verified':continue
  r.update(verificationStatus='verified',usageStatus='approved',verifiedAt='2026-11-08',review={'entityEvidence':'Main screenshot on exact entity page; source URL retained.','visualEvidence':'Original Monster PNG viewed directly with view_image.' if r['entityType']=='monster' else 'Item original PNG inspected with view_image in labeled contact sheets; exact item page proves variant association.','usageEvidence':r['usageEvidence'],'reviewedAt':'2026-11-08'})
  duplicate=next((a for a in manifest if a.get('fileHash')==r['fileHash'] and a.get('entityName')==r['entityName'] and a.get('verificationStatus')=='verified' and a.get('imagePath')),None)
  if duplicate:r['imagePath']=duplicate['imagePath']
  else:
   dest=root/'public'/r['imagePath'].lstrip('/');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(root/r['candidatePath'],dest)
  if old:old.update(r)
  else:manifest.append(r)
 (root/'src/data/aqw-assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Candidate images:',len(records),flush=True)
