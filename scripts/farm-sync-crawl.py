#!/usr/bin/env python3
"""Resumable, bounded source acquisition. Never writes production content."""
import argparse, concurrent.futures, hashlib, importlib.util, json, time
from pathlib import Path
from urllib.parse import urljoin, urlparse, parse_qs
ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('farm_sources', ROOT/'scripts/import-farm-sources.py')
reader = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reader)
CACHE = ROOT/'Update/_farm-sources'
def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix+'.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')
    temp.replace(path)
def scoped(url, base):
    u, b = urlparse(url), urlparse(base)
    return u.scheme == 'https' and u.netloc == b.netloc and (u.path == b.path or u.path.startswith(b.path+'/'))
def acquire(row, refresh=False):
    key = hashlib.sha256(row['url'].encode()).hexdigest()
    path = CACHE/'pages'/f'{key}.json'
    if path.exists() and not refresh:
        old = json.loads(path.read_text())
        if old.get('status') == 'fetched' and old.get('sha256') == hashlib.sha256(old.get('body','').encode()).hexdigest():
            return {**old, "cacheHit":True}
    result = {**row, 'status':'blocked', 'attempts':[]}
    for attempt in range(2):
        try:
            body = reader.fetch(row['url'], timeout=10)
            p = None if row['kind']=='docs' else reader.read_html(body, 'sites' if row['kind']=='site' else 'wiki')
            text = body if p is None else p.text()
            if not text.strip() or (row['kind']=='docs' and ('<html' in body.lower() or len(text)<1000)):
                raise ValueError('Empty main content or invalid Docs export')
            links = [] if p is None else [urljoin(row['url'], x) for x in p.all_links]
            result.update(status='fetched', body=body, text=text, links=links, images=[] if p is None else p.images, sha256=hashlib.sha256(body.encode()).hexdigest(), reviewStatus='pending-human-review')
            result['attempts'].append({'at':reader.datetime.now(reader.timezone.utc).isoformat(),'ok':True})
            break
        except Exception as e:
            result['attempts'].append({'at':reader.datetime.now(reader.timezone.utc).isoformat(),'error':str(e)})
            if attempt == 0: time.sleep(1)
    save(path,result)
    return result

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--refresh',action='store_true');ap.add_argument('--limit',type=int,default=0);ap.add_argument('--offline',action='store_true');args=ap.parse_args()
    plan=json.loads((CACHE/'plan.json').read_text()); manifest_path=CACHE/'manifest.json'
    manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    rows={r['url']:r for r in plan['pages']}
    for url, r in manifest.items(): rows.setdefault(url,{k:r[k] for k in ['url','kind']})
    processed=set(); count=0
    for kind in ['site','docs','wiki']:
        failures=0
        while True:
            batch=[r for u,r in rows.items() if r['kind']==kind and u not in processed][:4]
            if not batch:break
            if args.limit and count>=args.limit:break
            if args.limit:batch=batch[:args.limit-count]
            if args.offline:
                results=[]
                for row in batch:
                    p=CACHE/'pages'/(hashlib.sha256(row['url'].encode()).hexdigest()+'.json')
                    if p.exists():
                        cached=json.loads(p.read_text())
                        if cached.get('status')=='fetched' and cached.get('sha256')!=hashlib.sha256(cached.get('body','').encode()).hexdigest():
                            cached={**row,'status':'blocked','reason':'cache hash mismatch'}
                        results.append(cached)
                    else:results.append({**row,'status':'pending','reason':'not cached'})
            elif failures>=4:
                results=[{**r,'status':'blocked-unattempted','reason':'source circuit open after four failed pages; retry next run'} for r in batch]
            else:
                with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
                    results=list(pool.map(lambda r:acquire(r,args.refresh),batch))
            for row in results:
                url=row['url'];processed.add(url);count+=0 if row.get("cacheHit") or row["status"]=="blocked-unattempted" else 1
                manifest[url]={k:v for k,v in row.items() if k not in ['body','text','links','cacheHit']}
                if row['status']=='blocked':failures+=1
                if row['status']=='fetched':
                    for link in row.get('links',[]):
                        if 'google.com/url?' in link:link=parse_qs(urlparse(link).query).get('q',[link])[0]
                        link=link.split('#')[0]
                        if scoped(link,plan['site']):
                            link=link.split('?')[0];rows.setdefault(link,{'url':link,'kind':'site','discoveredFrom':url})
                        elif row['kind']!='wiki' and scoped(link,'https://aqwwiki.wikidot.com'):
                            rows.setdefault(link,{'url':link,'kind':'wiki','discoveredFrom':url})
                save(manifest_path,manifest)
            print(json.dumps({'kind':kind,'processed':count,'queued':len(rows),'failures':failures}),flush=True)
    for url,row in rows.items():manifest.setdefault(url,{**row,'status':'pending'})
    save(manifest_path,manifest)
if __name__=='__main__':main()
