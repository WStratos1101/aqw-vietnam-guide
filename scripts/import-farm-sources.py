#!/usr/bin/env python3
"""Bounded public source reader. No inferred Wiki URLs; offline replay is supported.
Store visible main content, links and image references, never navigation as equipment.
Wiki technical fields are accepted only from the item body and equipment page tags.
"""
import argparse, concurrent.futures, hashlib, json, re, time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote, parse_qs, quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'content-sources/farm/import'
CACHE = ROOT / 'Update/_farm-direct/sources'
A = 'https://sites.google.com/view/vncollector/adventure-quest-worlds/farming-guide'
B = 'https://docs.google.com/document/d/1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA/edit'
W = 'https://aqwwiki.wikidot.com'

class Visible(HTMLParser):
    def __init__(self, mode):
        super().__init__(convert_charrefs=True)
        self.mode=mode; self.depth=0; self.active=None; self.skip=0
        self.parts=[]; self.links=[]; self.images=[]; self.all_links=[]; self.title=[];self.in_title=False
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag not in ['img','br','meta','link','input','hr','source','wbr','embed']: self.depth+=1
        if tag=='title':self.in_title=True
        if self.active is None and ((self.mode=='sites' and ('tyJCtd' in a.get('class','').split())) or (self.mode=='wiki' and a.get('id')=='page-content') or self.mode=='doc'):
            self.active=self.depth
        if tag in ['script','style']:self.skip+=1
        if tag=='a' and a.get('href'):self.all_links.append(a['href'])
        if self.active is not None and not self.skip:
            if tag in ['p','div','li','h1','h2','h3','h4','tr','br']:self.parts.append('\n')
            if tag=='a' and a.get('href'):self.links.append(a['href'])
            if tag=='img':self.images.append({k:v for k,v in a.items() if k in ['src','alt','aria-label']})
    def handle_endtag(self,tag):
        # HTMLParser calls this for XHTML <img /> and <br />. Void elements
        # never opened a depth level and cannot close the containing main body.
        if tag in ['img','br','meta','link','input','hr','source','wbr','embed']:return
        if tag in ['script','style']:self.skip=max(0,self.skip-1)
        if tag=='title':self.in_title=False
        if self.active==self.depth:self.active=None
        if tag not in ['img','br','meta','link','input','hr','source','wbr','embed']:self.depth-=1
    def handle_data(self,data):
        if self.in_title:self.title.append(data)
        if self.active is not None and not self.skip:self.parts.append(data)
    def text(self):return '\n'.join(re.sub(r'\s+',' ',x).strip() for x in ''.join(self.parts).splitlines() if x.strip())

def read_html(body,mode):
    p=Visible(mode);p.feed(body);return p

def fetch(url,timeout=15):
    req=Request(quote(url,safe=':/?=&%#'),headers={'User-Agent':'AQW-Vietnam-Guide/'+json.loads((ROOT/'package.json').read_text())['version']+' source-review (bounded public reads)'})
    with urlopen(req,timeout=timeout) as r:
        data=r.read(8_000_001)
        if len(data)>8_000_000:raise ValueError('response exceeds 8MB')
        body=data.decode('utf-8-sig')
        if 'accounts.google.com/ServiceLogin' in r.url or '<title>Sign in' in body:raise ValueError('Google authentication required')
        return body

def canon(url):
    if 'google.com/url?' in url:url=parse_qs(urlparse(url).query).get('q',[url])[0]
    u=urlparse(urljoin(W,url))
    if u.hostname not in ['aqwwiki.wikidot.com','www.aqwwiki.wikidot.com']:return None
    name=unquote(u.path).strip('/').lower()
    if not name or ':' in name or name in ['start','locations','maps']:return None
    return W+'/'+name

def dump(name,data):
    (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

def refresh_document(pages, failures, reader=fetch):
    """Try one authorized HTML export, preserving prior readable evidence on failure."""
    checked=datetime.now(timezone.utc).isoformat()
    try:
        body=reader(B.replace('/edit','/export?format=html'),20)
        p=read_html(body,'doc')
        if not p.text():raise ValueError('HTML export has no readable content')
        pages[B]={'url':B,'sourceDocument':'google-docs','title':'FARMING ITEM GUIDE','text':p.text(),'links':list(dict.fromkeys(urljoin(B,l) for l in p.links)),'images':p.images,'lastChecked':checked,'format':'html','sha256':hashlib.sha256(body.encode()).hexdigest()}
        failures[:]=[f for f in failures if f['url']!=B]
    except Exception as e:
        # Failure dates are attempts, never fresh verification of cached content.
        failures[:]=[f for f in failures if f['url']!=B]
        failures.append({'url':B,'reason':'HTML/embedded content incomplete: '+str(e),'attemptedAt':checked})
        if B not in pages:
            try:
                body=reader(B.replace('/edit','/export?format=txt'),20)
                pages[B]={'url':B,'sourceDocument':'google-docs','title':'FARMING ITEM GUIDE','text':body,'links':[],'images':[],'lastChecked':datetime.now(timezone.utc).isoformat(),'format':'text-only-live','limitation':'No embedded link/table/image coverage'}
            except Exception as text_error:
                cached=CACHE/'google-doc.txt'
                if cached.exists():
                    pages[B]={'url':B,'sourceDocument':'google-docs','title':'FARMING ITEM GUIDE','text':cached.read_text(),'links':[],'images':[],'lastChecked':'2026-11-12 (cache)','format':'text-only','limitation':'No embedded link/table/image coverage; live text failed: '+str(text_error)}
                else:
                    failures.append({'url':B.replace('/edit','/export?format=txt'),'reason':str(text_error),'attemptedAt':checked})

def reuse_wiki_caches(urls, root=ROOT):
    """Reuse only observed exact slugs, with a real item-body/tagged page.
    A cache is evidence of content, never evidence of a fresh verification date.
    """
    bodies={}; paths={}
    directories=['Update/_farm-direct/sources/wiki-pages', 'content-sources/class-wiki',
                 'content-sources/class-acquisition', 'content-sources/v12-6/wiki']
    for url in sorted(urls):
        if canon(url)!=url:continue
        slug=url.rsplit('/',1)[1]
        for directory in directories:
            candidate=root/directory/(slug+'.html')
            if not candidate.is_file():continue
            body=candidate.read_text()
            if 'page-tags' not in body or not read_html(body,'wiki').text():continue
            # Reject copied pages whose canonical URL identifies a different entity.
            canonical=re.search(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)',body,re.I)
            if canonical and canon(canonical.group(1))!=url:continue
            bodies[url]=body;paths[url]=str(candidate.relative_to(root));break
    return bodies,paths

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--offline',action='store_true');ap.add_argument('--wiki-limit',type=int,default=150);ap.add_argument('--refresh-sites',action='store_true');ap.add_argument('--refresh-doc',action='store_true',help='Retry one authorized HTML export, retaining prior text on failure');ap.add_argument('--reparse-cache',action='store_true',help='Re-extract available raw Wiki cache; no new verification date');ap.add_argument('--retry-failed',action='store_true');args=ap.parse_args()
    if args.offline and (args.refresh_doc or args.refresh_sites):ap.error('--offline cannot refresh remote sources')
    OUT.mkdir(parents=True,exist_ok=True)
    prior=json.loads((OUT/'source-extracts.json').read_text()) if (OUT/'source-extracts.json').exists() else {'pages':[]}
    pages={p['url']:p for p in prior['pages'] if not (args.refresh_sites and p['sourceDocument']=='vncollector')}; failures=[]
    old_access=json.loads((OUT/'source-access.json').read_text()) if (OUT/'source-access.json').exists() else {}
    # Keep every unresolved failure, including Docs embedded scope. A success clears
    # only its own URL; --retry-failed must not erase failures outside this batch.
    failures=list(old_access.get('failures',[]))
    def site(url):
        if url in pages:return pages[url]
        if args.offline:raise ValueError('uncached public source; offline')
        raw_path=CACHE/'farm-source-pages'/(hashlib.sha256(url.encode()).hexdigest()+'.html')
        raw_path.parent.mkdir(parents=True,exist_ok=True)
        body=raw_path.read_text() if raw_path.exists() else fetch(url)
        raw_path.write_text(body)
        p=read_html(body,'sites')
        if not p.text():raise ValueError('No main source content')
        return {'url':url,'sourceDocument':'vncollector','title':''.join(p.title),'text':p.text(),'links':list(dict.fromkeys(urljoin(url,l) for l in p.links)),'images':p.images,'sha256':hashlib.sha256(body.encode()).hexdigest(),'lastChecked':datetime.now(timezone.utc).isoformat()}
    try:
        if A not in pages:
            # Include relevant descendant navigation links in the crawl frontier, but never treat their labels as items.
            raw=fetch(A) if not args.offline else (CACHE/'vncollector.html').read_text()
            p=read_html(raw,'sites'); root=site(A) if not args.offline else {'url':A,'sourceDocument':'vncollector','text':p.text(),'links':[],'images':p.images,'lastChecked':'2026-11-12 (cache)'}
            root['childPages']=sorted(set(urljoin(A,l).split('?')[0] for l in p.all_links if urljoin(A,l).startswith(A+'/')))
            pages[A]=root
        frontier=pages[A].get('childPages',[])
        if len(frontier)>300:raise ValueError('More than 300 child pages; review frontier before continuing')
        def job(url):
            if url in pages:return url,pages[url],None
            time.sleep(.5)
            try:return url,site(url),None
            except Exception as e:return url,None,str(e)
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            for i,(url,p,error) in enumerate(pool.map(job,frontier)):
                if p:
                    pages[url]=p
                    failures[:]=[f for f in failures if f['url']!=url]
                else:failures.append({'url':url,'reason':error})
                if i%10==0: print(f'A children {i+1}/{len(frontier)}; failures={len(failures)}',flush=True)
                dump('source-extracts.json',{'pages':list(pages.values()),'failures':failures})
    except Exception as e:failures.append({'url':A,'reason':str(e)})
    if not args.offline and (B not in pages or args.refresh_doc):
        refresh_document(pages,failures)
    dump('source-extracts.json',{'pages':list(pages.values()),'failures':failures})
    wiki_urls=set()
    for p in pages.values():
        for l in p['links']:
            c=canon(l)
            if c:wiki_urls.add(c)
    # Reuse all prior Wiki bodies as candidates; exact source occurrence is required downstream.
    wiki_pages={}
    for f in (CACHE/'wiki-pages').glob('*.html'):wiki_pages[W+'/'+f.stem]=f.read_text()
    reused,cache_paths=reuse_wiki_caches(wiki_urls)
    wiki_pages.update(reused)
    for url in wiki_pages:
        cache_paths.setdefault(url,str((CACHE/'wiki-pages'/(url.rsplit('/',1)[1]+'.html')).relative_to(ROOT)))
    # Bounded batch, two requests at a time. A failed URL is recorded rather than retried in a loop.
    failed_urls=set() if args.retry_failed else {f['url'] for f in failures}
    review_path=OUT/'wiki-reviewed-pages.json'
    reviewed=json.loads(review_path.read_text()) if review_path.exists() else []
    reviewed_urls={r['url'] for r in reviewed if r.get('status')=='reviewed' and r.get('method')=='web-reader' and r.get('evidenceFile') and (ROOT/r['evidenceFile']).is_file()}
    known_urls=set(wiki_pages)|set(old_access.get('wikiReadUrls',[]))|(reviewed_urls & wiki_urls)
    todo=sorted(wiki_urls-known_urls-failed_urls,key=lambda u:(bool(re.search(r"(?:quest|shop|merge|ultra|monster|location)",u)),u))
    def wiki_job(url):
        if args.offline:return url,None,'uncached (offline)'
        try:
            time.sleep(.5);return url,fetch(url,10),None
        except Exception as e:return url,None,str(e)
    batch=[] if args.offline else todo[:max(0,min(args.wiki_limit,300))]
    read_dates={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for i,(url,body,error) in enumerate(pool.map(wiki_job,batch)):
            failures[:]=[f for f in failures if f['url']!=url]
            if body:
                parsed=read_html(body,'wiki')
                if not parsed.text() or 'page-tags' not in body:
                    failures.append({'url':url,'reason':'Response is not a tagged Wiki content page (possibly missing page or access challenge)'})
                    continue
                wiki_pages[url]=body
                read_dates[url]=datetime.now(timezone.utc).isoformat()
                (CACHE/'wiki-pages'/(url.rsplit('/',1)[1]+'.html')).write_text(body)
            elif error:failures.append({'url':url,'reason':error})
            if i%10==0:print(f'Wiki {i+1}/{len(batch)}; failures={len(failures)}',flush=True)
    if args.offline and not args.reparse_cache and (OUT/'wiki-records.json').exists():
        # A clean checkout replays normalized evidence, not ignored HTTP caches.
        # Offline means no fresh verification or provenance-date changes.
        previous=old_access.copy()
        previous['wikiReadUrls']=sorted(known_urls|set(wiki_pages))
        previous['wikiPending']=sorted(wiki_urls-known_urls-set(wiki_pages))
        dump('source-access.json',previous)
        print(json.dumps({'status':'offline snapshot replay','sourcePages':len(pages),'wikiRecords':len(json.loads((OUT/'wiki-records.json').read_text()))}),flush=True)
        return
    tag_cats={'sword':'Weapons','dagger':'Weapons','axe':'Weapons','staff':'Weapons','gun':'Weapons','mace':'Weapons','polearm':'Weapons','bow':'Weapons','wand':'Weapons','scythe':'Weapons','weapon':'Weapons','rifle':'Weapons','whip':'Weapons','gauntlet':'Weapons','handgun':'Weapons','armor':'Armors','helmet':'Helms','helm':'Helms','cape':'Capes / Back Items','pet':'Pets','battlepet':'Pets','class':'Classes'}
    old_records={r['wikiUrl']:r for r in (json.loads((OUT/'wiki-records.json').read_text()) if (OUT/'wiki-records.json').exists() else [])}
    records=[r for r in old_records.values() if r['wikiUrl'] not in wiki_pages]
    for url,body in sorted(wiki_pages.items()):
        p=read_html(body,'wiki'); text=p.text();tags=set(re.findall(r'/system:page-tags/tag/([^#"/]+)',body))
        title=''.join(p.title).removesuffix(' - AQW').strip()
        m=re.search(r'<div\s+id="page-title"[^>]*>(.*?)</div>',body,re.S)
        if m:title=re.sub('<[^>]+>','',m[1]).strip();title=__import__('html').unescape(title)
        cats=set(tag_cats[t] for t in tags if t in tag_cats)
        if 'class' in tags:cats={'Classes'}
        refs=[]
        # Match literal names (and Wiki's explicit parenthesized subtype) in main text, preserving context.
        names={title,re.sub(r'\s*\((?:Sword|Axe|Armor|Class|Daggers?|Cape|Helm|Pet|Staff|Polearm)\)$','',title,flags=re.I)}
        for source in pages.values():
            hits=[i+1 for i,line in enumerate(source['text'].splitlines()) if any(re.search(r'(?<![\w])'+re.escape(n)+r'(?![\w])',line,re.I) for n in names if n)]
            if hits:refs.append({'sourceDocument':source['sourceDocument'],'sourceUrl':source['url'],'lines':hits,'lastChecked':source['lastChecked']})
        if not refs:continue
        # Do not let price/rarity on a quest reward list classify its containing page as gear.
        status='equipment' if len(cats)==1 and not tags.intersection({'misc','house','quest','monster','location','shop'}) else 'excluded'
        records.append({'id':url.rsplit('/',1)[1],'originalName':title,'wikiUrl':url,'category':next(iter(cats)) if len(cats)==1 else None,'tags':sorted(tags),'disposition':status,'reason':None if status=='equipment' else 'Wiki tags identify non-equipment or ambiguous category','text':text,'provenance':refs,'lastChecked':read_dates.get(url,old_records.get(url,{}).get('lastChecked')),'cachePath':cache_paths.get(url,str((CACHE/'wiki-pages'/(url.rsplit('/',1)[1]+'.html')).relative_to(ROOT)))})
    records.sort(key=lambda r:r['wikiUrl'])
    dump('wiki-records.json',records)
    dump('source-access.json',{'sources':[{k:p.get(k) for k in ['url','sourceDocument','lastChecked','format','limitation']} for p in pages.values()],'failures':failures,'wikiReferences':sorted(wiki_urls),'wikiReadUrls':sorted(known_urls|set(wiki_pages)),'wikiPending':sorted(wiki_urls-known_urls-set(wiki_pages))})
    print(json.dumps({'sourcePages':len(pages),'sourceFailures':len(failures),'wikiRecords':len(records),'equipment':sum(r['disposition']=='equipment' for r in records),'wikiPending':len(wiki_urls-known_urls-set(wiki_pages))}),flush=True)
if __name__=='__main__':main()
