#!/usr/bin/env python3
"""Normalize reviewed web-reader item bodies. Never fetch, infer URLs, or accept a partial page."""
import json,re
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parent.parent
items=json.loads((ROOT/'src/content/farm/catalog-v2.generated.json').read_text())['items']
by_url={i['wikiUrl']:i for i in items}
target=ROOT/'content-sources/farm/import/detail-wiki-records.json'
records={r['wikiUrl']:r for r in json.loads(target.read_text())};added=[]
for name in ['snapshot-web-01.txt','snapshot-web-02.txt']:
 evidence=ROOT/'artifacts/qa/farm/completion'/name
 for block in re.split(r'-{8,}',evidence.read_text()):
  block=block.strip()
  heading=re.search(r'^(.+?) - AQW \((https://aqwwiki.wikidot.com/[^)]+)\)',block)
  if not heading:continue
  title,url=heading.groups()
  if url not in by_url or url in records:continue
  numbered=[(int(n),line) for n,line in re.findall(r'^L(\d+): ?(.*)$',block,re.M)]
  main=[line for n,line in numbered if n>=237]
  if not any('Terms of Service' in line and 'Help' in line for line in main):raise ValueError('Incomplete page window: '+url)
  clean=[];tags=[]
  for line in main:
   if 'Terms of Service' in line and 'Help' in line:break
   if 'AQWorlds Wiki' in line:continue
   links=re.findall(r'【\d+†([^】]+)】',line)
   if links and any(v.startswith('_') for v in links) and ('freeplayer' in links or 'legend' in links):
    tags=links;continue
   line=re.sub(r'【\d+†([^】]+)】',r'\1',line).strip()
   line=re.sub(r'^\*\s*','',line)
   if not line or line==title or line.startswith('Thanks to '):continue
   clean.append(line)
  text='\n'.join(clean)
  if not tags or not all(re.search(r'^'+field+':',text,re.M) for field in ['Locations?','Price','Description']):raise ValueError('Missing item content: '+url)
  records[url]={'wikiUrl':url,'originalName':title,'text':text,'tags':tags,'lastChecked':datetime.now(timezone.utc).isoformat(),'sourceMethod':'web_reader_main_body','verificationScope':'complete displayed main content; game availability not verified','evidenceFile':str(evidence.relative_to(ROOT)),'snapshotStatus':'complete'}
  added.append(url)
target.write_text(json.dumps(list(records.values()),ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'recovered':len(added),'urls':added}))
