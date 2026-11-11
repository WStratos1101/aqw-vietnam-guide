"""Bounded source review; preserve successful snapshots and stop on host rate limits."""
import json,subprocess,time,sys,re
from pathlib import Path
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1];out=root/'content-sources/recovery';out.mkdir(exist_ok=True)
class Page(HTMLParser):
 def __init__(self):super().__init__();self.text=[];self.images=[];self.links=[]
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='img' and a.get('src'):self.images.append({'url':a['src'],'alt':a.get('alt','')})
  if t=='a' and a.get('href'):self.links.append({'url':a['href'],'index':len(self.text)})
 def handle_data(self,d):
  if d.strip():self.text.append(d.strip())
slugs=(json.loads((out/'item-requests.json').read_text()) if '--items' in sys.argv else sys.argv[1:]) or ['god-of-the-depths','kolr-usurper-of-flames','astral-empyrean','champion-drakath-monster','darkon-the-conductor','gramiel-the-graceful','kasuko','batara-kala','ultra-iara-monster','prince-darkon-s-poleaxe','nulgath-s-quests','calamitus-quests','dage-challenge-merge']
for slug in slugs:
 target=out/(slug+'.json')
 if target.exists() and json.loads(target.read_text()).get('text'):print(slug,'cached',flush=True);continue
 url='https://aqwwiki.wikidot.com/'+slug
 p=subprocess.run(['curl','-4','-LsS','--max-time','20','-w','\n%{http_code}',url],capture_output=True,text=True)
 raw,_,status=p.stdout.rpartition('\n')
 if status in ['403','429']:print('Source denied or rate limited; stopping',slug,status,flush=True);break
 if p.returncode or status!='200':print(slug,'failed',status,p.stderr.strip(),flush=True);continue
 if 'id="page-content"' not in raw:print(slug,'invalid page',flush=True);continue
 parser=Page();parser.feed(raw.split('id="page-content"',1)[1].split('id="page-info-break"',1)[0]);target.write_text(json.dumps({'url':url,'text':'\n'.join(parser.text),'images':parser.images,'links':parser.links,'reviewedAt':'2026-11-08'},ensure_ascii=False,indent=2));print(slug,'OK',flush=True);time.sleep(.8)
