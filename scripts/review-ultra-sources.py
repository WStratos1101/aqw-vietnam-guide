"""Bounded exact-page review: no guessed image URLs and no automatic approval."""
import json,re,time,urllib.request,hashlib,subprocess
from pathlib import Path
from html import unescape
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.images=[];self.text=[];self.links=[]
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='img' and a.get('src'):self.images.append({'url':a['src'],'alt':a.get('alt','')})
  if t=='a' and a.get('href'):self.links.append(a['href'])
 def handle_data(self,d):
  if d.strip():self.text.append(d.strip())
def fetch(url):
 time.sleep(.7)
 data=subprocess.check_output(['curl','-4','-fLsS','--max-time','25',url]);return data,'image/png' if data.startswith(b'\x89PNG') else 'image/gif' if data[:3]==b'GIF' else 'text/html'
inspection=json.loads((ROOT/'src/content/ultra/inspection.json').read_text());bosses=json.loads((ROOT/'src/content/ultra/bosses.json').read_text());details=json.loads((ROOT/'src/content/ultra/details.json').read_text())
pages={}
for slug,e in inspection.items():
 for m in e['monsters']:pages[m['source']]={'name':m['canonicalName'],'kind':'monster','entityId':slug+'-'+m['id']}
for b in bosses:
 for r in b['equipmentRoutes']:
  s=next((s for s in b['sources'] if s['id']==r['source']),None)
  if s and 'wikidot' in s['url'] and not re.search('quests',s['url']):pages[s['url']]={'name':r['itemName'],'kind':'equipment'}
for name,slug in [('Dual Exalted Apotheosis','dual-exalted-apotheosis'),('Exalted Duality','exalted-duality'),('Necrotic Blade of the Underworld','necrotic-blade-of-the-underworld'),('Empowered Undead Champion','empowered-undead-champion')]:pages['https://aqwwiki.wikidot.com/'+slug]={'name':name,'kind':'equipment'}
out=ROOT/'content-sources/v678';out.mkdir(parents=True,exist_ok=True);review=[]
previous={r['url']:r for r in json.loads((out/'review.json').read_text())} if (out/'review.json').exists() else {}
for url,entity in pages.items():
 row={**entity,'url':url}
 if previous.get(url,{}).get('text') and not (entity['kind']=='monster' and not any(c.get('localCandidate') and 'image-tags' not in c['url'] for c in previous[url].get('candidates',[]))):review.append(previous[url]);continue
 try:
  raw,mime=fetch(url);html=raw.decode('utf8');body=html.split('id="page-content"',1)[-1].split('id="page-info-break"',1)[0];p=Page();p.feed(body);text='\n'.join(p.text);row.update(text=text,images=p.images,links=p.links)
  (out/(url.rsplit('/',1)[-1]+'.txt')).write_text(text)
  if entity['kind']=='monster':
   candidates=[i for i in p.images if re.search(r'(imgur\.com|aqwwiki\.wdfiles\.com|aqwwiki\.wikidot\.com)',i['url']) and not re.search(r'(image-tags|arrow|acsmall|bossshield|boss-shield|legend|rare|difficulty)',i['url']+i['alt'],re.I)]
   row['candidates']=candidates
   for n,i in enumerate(candidates):
    try:
     image,typ=fetch(i['url']);ext='png' if image.startswith(b'\x89PNG') else 'gif' if image[:3]==b'GIF' else 'jpg' if image[:2]==b'\xff\xd8' else None
     if not ext:continue
     path=out/(entity['entityId']+'-'+str(n)+'.'+ext);path.write_bytes(image);i.update(localCandidate=str(path.relative_to(ROOT)),mime=typ,sha256=hashlib.sha256(image).hexdigest())
    except Exception as ex:i['error']=str(ex)
 except Exception as ex:row['error']=str(ex)
 review.append(row);print(entity['name'],row.get('error','OK'),flush=True)
(out/'review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2))
