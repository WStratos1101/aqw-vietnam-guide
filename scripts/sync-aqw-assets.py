"""Bounded discovery; explicit evidence gate; never guesses an image URL.
Usage: python3 scripts/sync-aqw-assets.py [--discover] [--download] [--limit 4]
Review candidates in src/data/aqw-assets.json before --download.
"""
import argparse, hashlib, json, struct, time, urllib.request, urllib.parse
from pathlib import Path
from html.parser import HTMLParser
ROOT = Path(__file__).resolve().parents[1]
def read(p): return json.loads((ROOT/p).read_text())
def write(p,v): (ROOT/p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
class Images(HTMLParser):
    def __init__(self): super().__init__(); self.images=[]; self.title=''; self.in_title=False
    def handle_starttag(self,t,a):
        a=dict(a)
        if t=='title': self.in_title=True
        if t=='img' and a.get('src'): self.images.append({'url':a['src'],'alt':a.get('alt','')})
    def handle_endtag(self,t):
        if t=='title': self.in_title=False
    def handle_data(self,d):
        if self.in_title: self.title+=d

def dimensions(b):
    if b.startswith(b'\x89PNG\r\n\x1a\n') and len(b)>24: return 'png',*struct.unpack('>II',b[16:24])
    if b[:6] in (b'GIF87a',b'GIF89a') and len(b)>10: return 'gif',*struct.unpack('<HH',b[6:10])
    raise ValueError('Unsupported signature: keep needs_review; PNG/GIF only in this version')
def fetch(url):
    u=urllib.parse.urlparse(url)
    if u.scheme!='https' or not u.hostname or u.hostname in ('localhost','127.0.0.1'): raise ValueError('HTTPS public source required')
    # Explicit host allowlist also prevents arbitrary local-network fetches.
    if not (u.hostname in ('aqwwiki.wikidot.com','aqwwiki.wdfiles.com','www.aq.com','www.artix.com','i.imgur.com')): raise ValueError('Host requires policy review')
    time.sleep(1.2)
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'AQWVietnamGuide-AssetAudit/1.0'}),timeout=15) as r:
        if r.url!=url and urllib.parse.urlparse(r.url).hostname!=u.hostname: raise ValueError('Cross-host redirect requires review')
        data=r.read(12*1024*1024+1)
        if len(data)>12*1024*1024: raise ValueError('File exceeds 12 MB')
        return data,r.headers.get_content_type()
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--discover',action='store_true');ap.add_argument('--download',action='store_true');ap.add_argument('--limit',type=int,default=4);args=ap.parse_args()
    previous={a['assetId']:a for a in read('src/data/aqw-assets.json')} if (ROOT/'src/data/aqw-assets.json').exists() else {}
    entries=[]
    classes=read('src/content/classes/catalog.json'); bosses=read('src/content/ultra/bosses.json')
    assets=read('src/content/classes/assets.json')+read('src/content/ultra/assets.json')
    bodies={c['slug']:read('public/content/classes/'+c['slug']+'.json') for c in classes}
    for a in assets:
        c=next((c for c in classes if c['image']==a['id']),None)
        typ='class' if c else ('skill' if ('-skill-' in a['id'] or '-passive-' in a['id']) else ('monster' if a['id'].endswith('-portrait') else 'item'))
        page=a.get('referencePageUrl','')
        if c:
            page=next((s['url'] for s in c['sources'] if 'aqwwiki.wikidot.com' in s['url']),'')
        entry={'assetId':a['id'],'entityId':a['entity'],'entityName':a['name'],'entityType':typ,'aliases':c['aliases'] if c else [],'imageRole':'icon' if typ=='skill' else 'portrait','sourcePage':page,'officialSource':'https://www.aq.com/','candidateImages':[],'verificationStatus':'missing','usageStatus':'needs_review','imagePath':None,'originalImageUrl':None,'authorOrCredit':a['credit'],'verifiedAt':None,'width':None,'height':None,'fileHash':None}
        entry.update(previous.get(a['id'],{}));entry['entityType']=typ;entry['imageRole']='icon' if typ=='skill' else 'portrait';entries.append(entry)
    attempts=0
    for a in entries:
        if a['verificationStatus']=='verified':
            p=ROOT/'public'/str(a['imagePath']).lstrip('/')
            if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=a['fileHash']: a['verificationStatus']='needs_review';a['error']='Local file missing or hash changed'
            continue
        if args.discover and a['sourcePage'] and (not a['candidateImages'] or a.get('error')) and attempts<max(0,args.limit):
            attempts+=1
            try:
                b,mime=fetch(a['sourcePage']); parser=Images();parser.feed(b.decode('utf-8'))
                if mime!='text/html': raise ValueError('Expected HTML entity page')
                a['pageTitle']=parser.title;a['candidateImages']=[dict(i,url=urllib.parse.urljoin(a['sourcePage'],i['url']),status='needs_review') for i in parser.images]
                a['verificationStatus']='needs_review';a.pop('error',None)
            except Exception as e:
                a['error']=str(e)
                if getattr(e,'code',None) in (403,429): break
        if args.download and a.get('review',{}).get('approved'):
            try:
                review=a['review'];url=review['imageUrl']
                for key in ('entityEvidence','pageRegionEvidence','visualEvidence','usageEvidence','reviewer','reviewedAt'):
                    if not review.get(key): raise ValueError('Missing review evidence: '+key)
                if not any(c['url']==url for c in a['candidateImages']): raise ValueError('Image not linked by discovered entity page')
                if a['usageStatus']!='approved': raise ValueError('Usage approval missing')
                b,mime=fetch(url);ext,w,h=dimensions(b)
                if mime not in ('image/png','image/gif') or min(w,h)<24: raise ValueError('MIME or dimensions rejected')
                folder={'class':'classes','skill':'class-skills','monster':'ultra-bosses'}.get(a['entityType'],'items')
                dest=Path('images/aqw')/folder/(a['assetId']+'.'+ext);p=ROOT/'public'/dest;p.parent.mkdir(parents=True,exist_ok=True)
                digest=hashlib.sha256(b).hexdigest()
                if p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()!=digest: raise ValueError('Refusing overwrite of different file')
                shared=next((x for x in entries if x.get('verificationStatus')=='verified' and x.get('fileHash')==digest and x.get('imagePath')),None)
                if shared: dest=Path(shared['imagePath'].lstrip('/'))
                else: p.write_bytes(b)
                a.update(imagePath='/'+dest.as_posix(),originalImageUrl=url,width=w,height=h,fileHash=digest,verificationStatus='verified',verifiedAt=review['reviewedAt']);a.pop('error',None)
            except Exception as e: a['error']=str(e);a['verificationStatus']='needs_review'
    for a in entries:
        a['usedBy']=[]
        for c in classes:
            if c['image']==a['assetId']:
                a['usedBy'] += [{'page':'/class','component':'ClassCard','role':'thumbnail'},{'page':'/class/'+c['slug'],'component':'ClassDetail','role':'hero'}]
            body=bodies[c['slug']]
            if any(s.get('icon')==a['assetId'] for s in body['skills']):
                a['usedBy'].append({'page':'/class/'+c['slug'],'component':'ClassSkills','role':'skill-icon'})
                if not a['sourcePage']: a['sourcePage']=next((s['url'] for s in c['sources'] if 'aqwwiki.wikidot.com' in s['url']),'')
        for b in bosses:
            if b['images'].get('portrait')==a['assetId']:
                a['usedBy'] += [{'page':'/ultra-boss','component':'BossCard','role':'thumbnail'},{'page':'/ultra-boss/'+b['slug'],'component':'BossHero','role':'hero'}]
            if any(c.get('icon')==a['assetId'] for t in b['recommendedTeams'] for c in t['classes']):
                a['usedBy'].append({'page':'/ultra-boss/'+b['slug'],'component':'Teams','role':'class-icon'})
            if any(r.get('image')==a['assetId'] for r in b['equipmentRoutes']):
                a['imageRole']='equipment-preview'
                a['usedBy'].append({'page':'/ultra-boss/'+b['slug'],'component':'Equipment','role':'weapon-gallery'})
        a['failureReason']=a.get('error') or ('' if a['verificationStatus']=='verified' else ('Candidate requires exact entity/visual/usage review' if a['candidateImages'] else 'No exact source-page image verified yet'))
    write('src/data/aqw-assets.json',entries)
    inventory=[]
    for c in classes:
        body=bodies[c['slug']]
        inventory.append({'id':c['id'],'name':c['name'],'type':'class','aliases':c['aliases']})
        for s in body['skills']: inventory.append({'id':c['id']+':'+s['id'],'name':s['name'],'type':'skill'})
        for s in body['obtainSteps']: inventory.append({'id':c['id']+':'+s['id'],'name':s['title'],'type':'quest','location':s.get('map')})
    for b in bosses:
        inventory.extend([{'id':b['id'],'name':b['name'],'type':'monster'},{'id':b['id']+':location','name':b['location'],'type':'location'}])
        for r in b['equipmentRoutes']:
            inventory.append({'id':r['id'],'name':r['itemName'],'type':'equipment'})
            for q in r['quests']: inventory.append({'id':r['id']+':'+q['id'],'name':q['name'],'type':'quest'})
    write('src/data/aqw-entities.json',inventory)
    counts={s:sum(a['verificationStatus']==s for a in entries) for s in ('verified','needs_review','missing','rejected')}
    lines=['# Kiểm tra ảnh AQW','',f'Inventory: {len(inventory)} bản ghi entity; {len(entries)} vị trí ảnh. Trạng thái: {counts}.','', 'Chỉ verified + usage approved + file hash hợp lệ mới được hiển thị. Missing nghĩa là chưa có candidate được kiểm tra, không khẳng định ảnh không tồn tại. Xem qa/chromium/report.json để biết kết quả Chromium thực tế; Safari không phải điều kiện bắt buộc.','', 'Quy định: https://www.aq.com/lore/guides/assetusageguidelines','', 'Dễ nhầm: Class khác Armor; Ultra Nulgath là map, phải đối chiếu Monster Nulgath the Archfiend; Dage phải đúng encounter; Speaker phải đúng phiên bản. Nhóm Class có nhiều biến thể không tự dùng chung portrait. Icon cần đối chiếu skill ID và trạng thái.','', '| Entity | Type | Image Role | Source | Status | Local Path | Failure reason |','|---|---|---|---|---|---|---|']
    for a in entries: lines.append('| '+' | '.join(str(a.get(k) or '—').replace('|','/') for k in ('entityName','entityType','imageRole','sourcePage','verificationStatus','imagePath','failureReason'))+' |')
    lines+=['',f"Ban đầu: 163 vị trí logic; đã sửa {counts['verified']}; chưa verified {len(entries)-counts['verified']}. Các vị trí dùng chung ảnh không được tính thành file riêng. Chi tiết page/component/role trong usedBy của manifest.",'', 'Các giới hạn và kết quả lần khôi phục: xem docs/IMAGE-RECOVERY.md; network diagnostics: qa/network.json; kiểm tra byte/hash: qa/image-validation.json; Chromium: qa/chromium/report.json.','','## Lỗi mạng']+[f"- {a['assetId']}: {a['error']}" for a in entries if a.get('error')]
    (ROOT/'IMAGE_AUDIT.md').write_text('\n'.join(lines)+'\n');print(json.dumps(counts))
if __name__=='__main__': main()
