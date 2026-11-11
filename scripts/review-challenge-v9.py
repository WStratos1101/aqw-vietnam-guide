import json,subprocess,time
from pathlib import Path
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1];folder=root/'content-sources/v9';folder.mkdir(exist_ok=True)
class Page(HTMLParser):
 def __init__(self):super().__init__();self.text=[];self.images=[]
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='img' and a.get('src'):self.images.append(a['src'])
 def handle_data(self,d):
  if d.strip():self.text.append(d.strip())
slugs=['god-of-the-depths','kolr-usurper-of-flames','astral-empyrean','champion-drakath-monster','darkon-the-conductor','gramiel-the-graceful','kasuko','ultra-kala','ultra-iara']
report=[]
for slug in slugs:
 file=folder/(slug+'.json');url='https://aqwwiki.wikidot.com/'+slug
 if file.exists():report.append(json.loads(file.read_text()));continue
 p=subprocess.run(['curl','-4','-fLsS','--max-time','20',url],capture_output=True,text=True)
 if p.returncode:report.append({'slug':slug,'url':url,'error':p.stderr});print(slug,'FAILED',flush=True);continue
 parser=Page();parser.feed(p.stdout.split('id="page-content"',1)[-1].split('id="page-info-break"',1)[0]);r={'slug':slug,'url':url,'text':'\n'.join(parser.text),'images':parser.images};file.write_text(json.dumps(r,ensure_ascii=False,indent=2));report.append(r);print(slug,'OK',flush=True);time.sleep(1)
(folder/'challenge-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
