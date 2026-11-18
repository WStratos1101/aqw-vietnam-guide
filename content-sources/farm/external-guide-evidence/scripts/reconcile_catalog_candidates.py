#!/usr/bin/env python3
"""Read-only item-level crosswalk from generated guide evidence to a local Farm catalog.
Outputs one row per canonical item and lists evidence candidate IDs. Does not
write catalog. No name match is treated as proof of output/merge/faction.
"""
import re,json,argparse,csv
from pathlib import Path
from collections import defaultdict

def norm(s):
 s=str(s).replace('’',"'").casefold()
 s=re.sub(r'\s*\(([a-z\d]{2,8}(?:/[a-z\d]{2,8})*)\)\s*$','',s)
 return re.sub(r'[^a-z\d]+',' ',s).strip()

def read_jsonl(p):return [json.loads(x) for x in p.read_text(encoding='utf-8').splitlines() if x.strip()]

def get_items(p):
 d=json.loads(p.read_text(encoding='utf-8'))
 if isinstance(d,list):return d
 if isinstance(d,dict):
  for key in ('items','farmItems','catalog','data'):
   a=d.get(key)
   if isinstance(a,list):return a
   if isinstance(a,dict) and isinstance(a.get('items'),list):return a['items']
 raise ValueError('Unsupported catalog; must be array or object with items, farmItems, catalog or data')

def getval(x,*keys):
 for k in keys:
  v=x.get(k)
  if isinstance(v,(str,int,float)) and str(v).strip():return str(v)
 return ''

def build(catalog,guide,subtarget,wiki,out):
 items=get_items(catalog)
 wiki_obj=json.loads(wiki.read_text(encoding='utf-8'))
 wf=defaultdict(list)
 for w in wiki_obj.get('records',[]):wf[norm(w['official_name'])].append(w)
 candidates=defaultdict(list)
 for g in read_jsonl(guide):
  candidates[norm(g['target_name'])].append({'id':g['id'],'line':g['source_span']['start_line'],'kind':'guide_title'})
 for s in read_jsonl(subtarget):
  candidates[norm(s['item_or_set_candidate'])].append({'id':s['id'],'line':s['source_span']['start_line'],'kind':'subsection_title'})
 seen=set();rows=[]
 for ix,item in enumerate(items):
  if not isinstance(item,dict):continue
  n=getval(item,'name','title','itemName')
  if not n:continue
  item_id=getval(item,'canonicalId','itemId','id','slug') or f'row-{ix}'
  if item_id in seen:raise ValueError('Duplicate canonical id in catalog: '+item_id)
  seen.add(item_id)
  evidence=candidates.get(norm(n),[])
  wiki_records=wf.get(norm(n),[])
  rows.append({
   'canonical_id':item_id,'canonical_name':n,
   'current_category':getval(item,'category','type'),
   'current_subtype':getval(item,'subtype'),
   'current_group':getval(item,'primaryGroupId','groupId','group','faction'),
   'source_candidate_count':len(evidence),
   'guide_candidate_ids':';'.join(x['id'] for x in evidence),
   'guide_source_lines':';'.join(str(x['line']) for x in evidence),
   'wiki_curated_match':bool(wiki_records),
   'wiki_url':wiki_records[0]['wiki_url'] if wiki_records else '',
   'readiness':'WIKI_SPECIFIC_FIELDS_VERIFIED' if wiki_records else ('GUIDE_NAME_ONLY_REVIEW_REQUIRED' if evidence else 'UNMAPPED_RESEARCH_REQUIRED'),
   'verification_note':'Matching a guide title is not proof of faction, recipe, output or canonical identity.'
  })
 out.mkdir(exist_ok=True,parents=True)
 with (out/'CANONICAL_ITEM_EVIDENCE_CROSSWALK.csv').open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]) if rows else []);w.writeheader();w.writerows(rows)
 (out/'CANONICAL_ITEM_EVIDENCE_CROSSWALK.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(f'Crosswalk: {len(rows)} canonical items, {sum(x["source_candidate_count"]>0 for x in rows)} guide-name candidates, {sum(x["wiki_curated_match"] for x in rows)} Wiki-curated examples. No catalog edited.')

if __name__=='__main__':
 p=argparse.ArgumentParser()
 for x in ('catalog','guide','subtargets','wiki','out'):p.add_argument('--'+x,required=True,type=Path)
 x=p.parse_args();build(x.catalog,x.guide,x.subtargets,x.wiki,x.out)
