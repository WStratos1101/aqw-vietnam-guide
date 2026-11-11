"""Read a bounded set of public Google Sites pages; no auth/protection bypass."""
from pathlib import Path
from html.parser import HTMLParser
import json,subprocess,time,sys
from urllib.parse import quote
root=Path(__file__).resolve().parents[1]
base='https://sites.google.com/view/vncollector/adventure-quest-worlds/ultra-boss-guide/'
paths={'god-of-the-depths':'daily-ultra-challenge-boss/god-of-the-depths','kasuko':'seasonal-ultra-challenge-boss/kasuku','batara-kala':'seasonal-ultra-challenge-boss/batara-kala','ultra-iara':'seasonal-ultra-challenge-boss/ultra-iara'}
paths['darkon-the-conductor']='weekly-ultra-challenge-boss/darkon-the-conductor'
paths.update({'class-dragon-of-time':'https://sites.google.com/view/vncollector/adventure-quest-worlds/classes-guide/combo-guide/dragon-of-time-dtedot','acronyms':'https://sites.google.com/view/vncollector/adventure-quest-worlds/gameguide/acronyms-thuật-ngữ-hay-dùng'})
class Text(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.skip=0
 def handle_starttag(self,t,a):
  if t in ['script','style']:self.skip+=1
 def handle_endtag(self,t):
  if t in ['script','style']:self.skip=max(0,self.skip-1)
 def handle_data(self,d):
  if not self.skip and d.strip():self.rows.append(d.strip())
for slug,path in paths.items():
 if sys.argv[1:] and slug not in sys.argv[1:]:continue
 url=quote(path if path.startswith('https:') else base+path,safe=':/?=&%')
 p=subprocess.run(['curl','-fLsS','--max-time','25','-w','\n%{http_code}',url],capture_output=True,text=True)
 raw,_,status=p.stdout.rpartition('\n')
 if status in ['403','429']:print('Denied/rate limited; stopped',status);break
 if p.returncode or status!='200':print(slug,'failed',status);continue
 parser=Text();parser.feed(raw);text='\n'.join(parser.rows)
 (root/'content-sources/recovery'/('sites-'+slug+'.json')).write_text(json.dumps({'sourceUrl':url,'sourceType':'community','retrievedAt':'2026-11-08','text':text,'notes':'Includes Google Sites navigation; only relevant page body may be used as evidence.'},ensure_ascii=False,indent=2))
 print(slug,len(text));time.sleep(1)
