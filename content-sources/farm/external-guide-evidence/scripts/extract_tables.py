#!/usr/bin/env python3
"""Extract clearly tabulated per-quest / totals / stack information from raw guide.
Preserves every row with source line. Values are transcriptions, not Wiki cross-checks.
"""
from pathlib import Path
import argparse,json,re,csv

def num(x):
 x=x.strip().lower()
 if re.fullmatch(r'\d[\d.,]*',x):return int(x.replace('.','').replace(',',''))
 if re.fullmatch(r'\d+(?:[.,]\d+)?[km]',x):
  f=1000 if x[-1]=='k' else 1000000
  return int(float(x[:-1].replace(',','.'))*f)
 return None

def generate(src:Path,out:Path):
 lines=src.read_text(encoding='utf-8-sig').splitlines();tables=[]
 for i,line in enumerate(lines):
  if line.strip()!='Mỗi Quest' or lines[i+1].strip()!='Total' or lines[i+2].strip()!='Max stack':continue
  j=i+3;rows=[]
  while j+3<len(lines):
   name=lines[j].strip()
   if not name or name.lower().startswith(('note:','legion fealty ','bạn cần','◆','step ')):break
   values=lines[j+1:j+4]
   vals=[num(x) for x in values]
   if vals[0] is None or vals[1] is None:break
   rows.append({'material_name':name,'per_quest':vals[0],'total_for_guide':vals[1],
                'max_stack':vals[2],'source_line':j+1,
                'values_source_lines':[j+2,j+3,j+4],
                'status':'EXPLICIT_GUIDE_TABLE_WIKI_NOT_YET_VERIFIED'})
   j+=4
  title=''
  for k in range(i-1,max(0,i-7),-1):
   if re.match(r'^Legion Fealty \d$',lines[k].strip()):title=lines[k].strip();break
  tables.append({'quest_name':title or 'UNRESOLVED','header_line':i+1,'rows':rows,
                 'verification':'NUMBERS_FROM_GUIDE_NOT_WIKI_VERIFIED'})
 out.mkdir(exist_ok=True,parents=True)
 (out/'QUEST_PER_TURN_TOTAL_TABLES.json').write_text(json.dumps(tables,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 with (out/'QUEST_PER_TURN_TOTAL_TABLES.csv').open('w',encoding='utf-8-sig',newline='') as f:
  fieldnames=['quest','material','per_quest','total','max_stack','source_line']
  w=csv.DictWriter(f,fieldnames=fieldnames);w.writeheader()
  for t in tables:
   for r in t['rows']:
    w.writerow(dict(zip(fieldnames,[t['quest_name'],r['material_name'],r['per_quest'],r['total_for_guide'],r['max_stack'],r['source_line']])))
 print('tables',len(tables),'rows',sum(len(t['rows']) for t in tables))
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--source',type=Path,required=True);a.add_argument('--out',type=Path,required=True);v=a.parse_args();generate(v.source,v.out)
