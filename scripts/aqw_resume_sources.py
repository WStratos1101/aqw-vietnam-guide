#!/usr/bin/env python3
"""AQW Farm resume: local evidence discovery, safe cache, and Codex worklist.

Stdlib Python 3.9+. Does NOT write catalog or classify item data.
Usage: python3 scripts/aqw_resume_sources.py --repo "$PWD" prepare|lookup|docs|wiki|next
"""
from __future__ import annotations
import argparse
import csv
import datetime as dt
from html.parser import HTMLParser
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.parse
import urllib.request

WORK_REL = Path('Update/_farm-source-recovery')
PROTECTED = ('.git', 'node_modules', 'dist', 'build', '.next')
DOC_ID = '1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA'
WIKI_HOSTS = {'aqwwiki.wikidot.com', 'aqwwiki.wikidot.com'}
KNOWN_REPORTS = ('FARM_SOURCE_PENDING.csv', 'FARM_SOURCE_NEXT_TASK.md', 'FARM_SOURCE_DRIVEN_RECONCILIATION.md',
                 'FARM_FACTION_PENDING_ITEMS.csv', 'FARM_FACTION_COVERAGE_RECOVERY.md')
PRIORITIES = (
    ('P0','QA/rollback review','Confirm source/test baseline and previously passed QA without unnecessary reruns'),
    ('P1','11 missing images','Exact canonical item and image evidence; retain missing if not verified'),
    ('P2','BLoD / VHL / Legion Revenant','Per-quest inputs, total, turns, stack, alternate OR, NPC and /join'),
    ('P3','ArchPaladin / Arcana Invoker','Reuse canonical Class identity rather than duplicating Farm/Class'),
    ('P4','Dual Hollowborn Oblivion Blade','Verify identity and both-direction merge recipe, add record/verified image only if missing'),
    ('P5','86 unknown faction items','Reward/shop/quest chapter evidence only; do not force into a faction'),
    ('P6','Ultra Insignia / UI regression','Quest, NPC, map, boss linking and condition placements'),
)


def sha256(path: Path) -> str:
    h=hashlib.sha256()
    with path.open('rb') as f:
        for part in iter(lambda:f.read(1<<18),b''):
            h.update(part)
    return h.hexdigest()


def write_atomic(path: Path, value: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.is_symlink() or path.parent.is_symlink():
        raise RuntimeError('Refusing symlink output: ' + str(path))
    tmp=path.with_name(path.name + '.tmp-' + str(os.getpid()))
    try:
        with tmp.open('x', encoding='utf-8') as f:
            f.write(value)
        tmp.replace(path)
    finally:
        if tmp.exists():tmp.unlink()


def save_json(path: Path, obj: dict):
    write_atomic(path, json.dumps(obj,ensure_ascii=False,indent=2)+'\n')


def work_root(repo: Path)->Path:
    return repo/WORK_REL


def find_reports(repo:Path) -> dict:
    """Bounded source-report discovery, never walk .git or node_modules."""
    hits={}
    for base in (repo,repo/'Update',repo/'content-sources'/'farm'):
        if not base.exists(): continue
        base_depth=len(base.parts)
        for dirname,dirs,files in os.walk(base):
            dpath=Path(dirname)
            depth=len(dpath.parts)-base_depth
            dirs[:]=[d for d in dirs if d not in PROTECTED and (depth < 4)]
            for filename in files:
                if filename not in KNOWN_REPORTS:continue
                path=dpath/filename
                if not path.is_file() or path.is_symlink():continue
                key=path.name
                if key not in hits or path.stat().st_mtime>hits[key].stat().st_mtime:
                    hits[key]=path
    return hits


def read_csv_entries(path:Path) -> list[dict]:
    if not path or not path.is_file():return []
    with path.open('r',encoding='utf-8-sig',newline='') as fh:
        sample=fh.read(4096);fh.seek(0)
        try:dialect=csv.Sniffer().sniff(sample,delimiters=',;\t')
        except csv.Error:dialect=csv.excel
        reader=csv.DictReader(fh,dialect=dialect)
        return [dict(row) for row in reader if isinstance(row,dict)]


def summary_row(record:dict) -> dict:
    keys={re.sub('[^a-z0-9]','',str(k).lower()):str(v or '').strip() for k,v in record.items() if k}
    def pick(*names):return next((keys.get(x,'') for x in names if keys.get(x)), '')
    return dict(item_id=pick('canonicalid','itemid','id','slug'),
                name=pick('itemname','name','title','canonicalname'),
                status=pick('status','resolutionstatus','reviewstatus'),
                reason=pick('reason','blocker','issue','notes'),
                source=pick('sourceurl','source','wikiurl','evidence'))


def manifest(repo:Path)->dict:
    root=work_root(repo)
    reports=find_reports(repo)
    inputs={}
    for name in ('CODEX_SESSION_LOG.md','FARMING_ITEM_GUIDE_SOURCE.txt','USER_REPORTED_LATEST_STATUS.md'):
        p=root/'input'/name
        if p.is_file():inputs[name]=dict(path=str(p.relative_to(repo)),bytes=p.stat().st_size,sha256=sha256(p))
    for name,p in reports.items():
        inputs[name]=dict(path=str(p.relative_to(repo)),bytes=p.stat().st_size,sha256=sha256(p))
    pending=reports.get('FARM_SOURCE_PENDING.csv') or reports.get('FARM_FACTION_PENDING_ITEMS.csv')
    records=read_csv_entries(pending) if pending else []
    return dict(schema=1,generated_at=dt.datetime.now(dt.timezone.utc).isoformat(),repo=str(repo),
                inputs=inputs,pending_rows=len(records), pending_source=pending.as_posix() if pending else None,
                source_urls={'docs':f'https://docs.google.com/document/d/{DOC_ID}/edit',
                             'wiki':'https://aqwwiki.wikidot.com/'},
                note='AUTO-GENERATED WORKLIST, not evidence that any task is finished. User report is later than attached session log.')


def prepare(repo:Path):
    root=work_root(repo)
    if not (root/'input'/'FARMING_ITEM_GUIDE_SOURCE.txt').exists():
        raise RuntimeError('Missing guide snapshot. Run installer first.')
    m=manifest(repo)
    save_json(root/'SOURCE_MANIFEST.json',m)
    reports=find_reports(repo)
    pending=reports.get('FARM_SOURCE_PENDING.csv') or reports.get('FARM_FACTION_PENDING_ITEMS.csv')
    records=[summary_row(x) for x in read_csv_entries(pending)] if pending else []
    out=root/'PENDING_ITEM_INDEX.csv'
    header=('item_id','name','status','reason','source')
    if out.is_symlink():raise RuntimeError('Refusing symlink output')
    import io
    stream=io.StringIO(newline='');w=csv.DictWriter(stream,fieldnames=header);w.writeheader();w.writerows(records)
    write_atomic(out,stream.getvalue())
    lines=[
        '# AQWVN — FILE-DRIVEN FARM RECOVERY', '',
        '> Chỉ là danh sách thực thi, phải đọc lại source và code để xác nhận DONE. Không tự sửa catalog.', '',
        '## Tài liệu và trạng thái',
        '- Báo cáo mới nhất do người dùng cung cấp: `Update/_farm-source-recovery/input/USER_REPORTED_LATEST_STATUS.md`',
        '- Nhật ký Codex lịch sử: `Update/_farm-source-recovery/input/CODEX_SESSION_LOG.md` (không phải QA cuối)',
        '- Raw guide: `Update/_farm-source-recovery/input/FARMING_ITEM_GUIDE_SOURCE.txt`',
        '- Google Docs hiện tại: https://docs.google.com/document/d/'+DOC_ID+'/edit',
        '- AQW Wiki (exact item/quest pages only): https://aqwwiki.wikidot.com/',
        '- Chứng cứ/các file tìm thấy: `Update/_farm-source-recovery/SOURCE_MANIFEST.json`',
        f'- Pending CSV thật: `{m["pending_source"] or "CHƯA TÌM THẤY, phải tra repo"}`',
        f'- Dòng pending đọc được: {m["pending_rows"]}', '',
        '## Thứ tự tiếp tục (đừng lặp phần DONE)', ''
    ]
    for key,name,instruction in PRIORITIES:
        lines.append(f'- **{key} — {name}:** {instruction}')
    lines.extend(['', '## Các record cần đối chiếu từ CSV (tối đa 35 tên đầu)', ''])
    if records:
        for rec in records[:35]:
            lines.append(f'- `{rec["item_id"] or "?"}` {rec["name"] or "(missing name)"}: {rec["status"] or "UNVERIFIED"}; {rec["reason"][:160] or "read CSV"}')
    else:
        lines.append('- Chưa tìm thấy pending CSV trong repo. Dùng checkpoint nội bộ; không tự phát minh tên 11 ảnh thiếu.')
    lines.extend(['', '## Lệnh lấy nguồn cục bộ',
                  '`python3 scripts/aqw_resume_sources.py --repo . lookup --term "Legion Revenant"`',
                  '`python3 scripts/aqw_resume_sources.py --repo . docs` (yêu cầu có quyền xem công khai)',
                  '`python3 scripts/aqw_resume_sources.py --repo . wiki --limit 12` (URL có thật trong WIKI_TARGETS.csv)',
                  '', '## Guardrails',
                  '- Ưu tiên report mới và Git thực tế. Không dùng FAILED trong session log cũ để kết luận QA cuối.',
                  '- Đối chiếu item->Quest->NPC->shop->map->materials->Insignia theo trang Wiki chính xác.',
                  '- Chưa có evidence thì UNVERIFIED/BLOCKED, không xóa verified data và không gán phe suy đoán.',
                  '- QA targeted trước, full tests/smoke một lượt cuối. Không tự commit, push hay deploy.', ''])
    write_atomic(root/'NEXT_CODEX_TASK.md','\n'.join(lines))
    targets=root/'WIKI_TARGETS.csv'
    if not targets.exists():write_atomic(targets,'item_id,source_url,reason\n')
    print(json.dumps({'pending_rows':len(records),'report_files':list(reports),'manifest':str(root/'SOURCE_MANIFEST.json'),
                      'next':str(root/'NEXT_CODEX_TASK.md')},ensure_ascii=False))


def lookup(repo:Path,term:str,context:int,limit:int):
    root=work_root(repo)
    for file in (root/'sources'/'google_docs_current.txt',root/'input'/'FARMING_ITEM_GUIDE_SOURCE.txt'):
        if not file.is_file():continue
        lines=file.read_text(encoding='utf-8-sig').splitlines()
        matches=[i for i,line in enumerate(lines) if term.casefold() in line.casefold()]
        print('\nSOURCE:',file.relative_to(repo),'matches:',len(matches),'(first',limit,')')
        for i in matches[:limit]:
            lo=max(0,i-context);hi=min(len(lines),i+context+1)
            for j in range(lo,hi):print(f'L{j+1}: {lines[j][:350]}')
            print('---')


def http_get(url:str,timeout:int,max_bytes:int,hosts:set)->bytes:
    parsed=urllib.parse.urlparse(url)
    if parsed.scheme!='https' or parsed.hostname not in hosts or parsed.username or parsed.password:
        raise RuntimeError('Rejected non-whitelisted HTTPS URL: '+url)
    req=urllib.request.Request(url,headers={'User-Agent':'AQWVNResearch/1.0 (manual research; no auto publish)', 'Accept':'text/html,text/plain;q=0.9'})
    with urllib.request.urlopen(req,timeout=timeout) as r:
        actual=urllib.parse.urlparse(r.geturl())
        if actual.scheme!='https' or not (actual.hostname in hosts or (parsed.hostname=='docs.google.com' and actual.hostname and actual.hostname.endswith('.googleusercontent.com'))):
            raise RuntimeError('Redirect to unapproved host: '+str(r.geturl()))
        b=r.read(max_bytes+1)
        if len(b)>max_bytes:raise RuntimeError('Response larger than safety limit')
        return b


def docs(repo:Path,refresh:bool=False):
    root=work_root(repo)
    dest=root/'sources'/'google_docs_current.txt'
    status=root/'sources'/'google_docs_fetch_status.json'
    if dest.exists() and not refresh:
        print('CACHED',dest,sha256(dest));return
    url=f'https://docs.google.com/document/d/{DOC_ID}/export?format=txt'
    try:
        raw=http_get(url,25,3_000_000,{'docs.google.com','doc-00-00-docs.googleusercontent.com'})
        text=raw.decode('utf-8-sig')
        if not text.startswith('FARMING ITEM GUIDE'):
            raise RuntimeError('Docs export did not return the guide content. May require sign-in.')
        write_atomic(dest,text)
        save_json(status,{'status':'READ','url':url,'sha256':sha256(dest),'bytes':len(raw)})
        print('READ',dest,sha256(dest))
    except Exception as e:
        save_json(status,{'status':'BLOCKED','url':url,'reason':str(e)[:500],
                          'fallback':'Use included user-supplied guide snapshot; do not treat it as live Docs.'})
        print('BLOCKED:',str(e)[:350],'| fallback: included guide snapshot')


class TextExtractor(HTMLParser):
    def __init__(self):super().__init__();self.ignore=0;self.parts=[]
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style','noscript'):self.ignore+=1
        if tag in ('p','li','div','h1','h2','h3','tr','br'):self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('script','style','noscript'):self.ignore=max(0,self.ignore-1)
        if tag in ('p','li','div','h1','h2','h3','tr'):self.parts.append('\n')
    def handle_data(self,data):
        if not self.ignore:self.parts.append(data)
    def text(self):return re.sub(r'\n\s*\n+', '\n', ''.join(self.parts)).strip()


def wiki(repo:Path,limit:int=12,refresh:bool=False):
    root=work_root(repo)
    paths=root/'WIKI_TARGETS.csv'
    rows=read_csv_entries(paths)
    if not rows:
        print('No exact URL targets. Populate',paths,'with item_id,source_url,reason. Not guessing URLs.');return
    done=[];blocked=[]
    for row in rows:
        if len(done)+len(blocked)>=max(1,min(60,limit)):break
        u=(row.get('source_url') or '').strip()
        slug=hashlib.sha256(u.encode()).hexdigest()[:20]
        raw=root/'wiki-cache'/f'{slug}.html';summary=root/'wiki-cache'/f'{slug}.txt'
        if raw.exists() and not refresh:
            done.append({'url':u,'status':'CACHED','file':str(raw.relative_to(repo))});continue
        try:
            b=http_get(u,25,2_000_000,WIKI_HOSTS)
            html=b.decode('utf-8',errors='replace')
            if '<html' not in html.lower():raise RuntimeError('Not a Wiki HTML page')
            write_atomic(raw,html)
            parser=TextExtractor();parser.feed(html)
            write_atomic(summary,'SOURCE URL: '+u+'\nSTATUS: UNVERIFIED_WEB_SNAPSHOT\n\n'+parser.text()[:160_000]+'\n')
            done.append({'url':u,'status':'READ','sha256':sha256(raw),'file':str(raw.relative_to(repo))})
        except Exception as e:
            blocked.append({'url':u,'status':'BLOCKED','reason':str(e)[:300]})
        time.sleep(0.3)
    save_json(root/'wiki-cache'/'wiki_fetch_status.json',{'read_or_cached':done,'blocked':blocked,
               'warning':'Wiki HTML is source evidence only, not canonical approval or image verification.'})
    print(json.dumps({'cached_or_read':len(done),'blocked':len(blocked),'status_file':str(root/'wiki-cache'/'wiki_fetch_status.json')},ensure_ascii=False))


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--repo',type=Path,default=Path.cwd())
    sub=p.add_subparsers(dest='cmd',required=True)
    sub.add_parser('prepare')
    s=sub.add_parser('lookup');s.add_argument('--term',required=True);s.add_argument('--context',type=int,default=2);s.add_argument('--limit',type=int,default=8)
    s=sub.add_parser('docs');s.add_argument('--refresh',action='store_true')
    s=sub.add_parser('wiki');s.add_argument('--limit',type=int,default=12);s.add_argument('--refresh',action='store_true')
    sub.add_parser('next')
    a=p.parse_args(); repo=a.repo.expanduser().resolve()
    if not repo.is_dir():p.error('Repo not found: '+str(repo))
    if a.cmd=='prepare':prepare(repo)
    elif a.cmd=='lookup':lookup(repo,a.term,max(0,min(6,a.context)),max(1,min(30,a.limit)))
    elif a.cmd=='docs':docs(repo,a.refresh)
    elif a.cmd=='wiki':wiki(repo,a.limit,a.refresh)
    elif a.cmd=='next':
        x=work_root(repo)/'NEXT_CODEX_TASK.md'
        print(x.read_text(encoding='utf-8') if x.is_file() else 'Run prepare first')


if __name__=='__main__':main()
