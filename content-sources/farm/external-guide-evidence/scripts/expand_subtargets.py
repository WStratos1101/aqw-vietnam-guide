#!/usr/bin/env python3
"""Make sub-item/collection block dossiers from heading candidates within a guide.
Do not assume each header is a canonical reward, or each qty is a recipe material.
"""
import argparse,re,json,csv
from pathlib import Path

def main(guide_file,out):
    rows=[];recs=[]
    for line in guide_file.read_text(encoding='utf-8').splitlines():
        if line.strip():recs.append(json.loads(line))
    for r in recs:
        members=sorted(r['additional_targets'],key=lambda x:x['line'])
        for idx,member in enumerate(members):
            start=member['line'];end=(members[idx+1]['line']-1) if idx+1<len(members) else r['source_span']['end_line']
            raw=member['name_candidate']
            label=raw.split(':',1)[0].strip('—:- ')
            if len(label)>125:label=label[:125]
            markers={'multiple_item_names_possible':bool(re.search(r'(?:\s+&\s+|\s+và\s+|,\s+)',label)),
                     'not_verified_as_canonical':True}
            material=[m for m in r['material_mentions'] if start<=m['line']<=end]
            quests=[q for q in r['quest_chain_candidates'] if start<=q['heading_line']<=end]
            maps=[m for m in r['source_locations'] if start<=m['line']<=end]
            rows.append({'id':f"{r['id']}-sub-{start}", 'parent_guide_id':r['id'],
                         'item_or_set_candidate':label,'raw_heading':raw,
                         'source_chapter':r['source_chapter'],
                         'chapter_group_hint':r['chapter_group_hint'],
                         'category_verified':None,'canonical_id':None,'primary_group_verified':None,
                         'source_span':{'start_line':start,'end_line':end},
                         'subsection_material_mentions':material,
                         'subsection_quest_candidates':quests,
                         'subsection_map_mentions':maps,
                         'state':'HEADING_SUBSECTION_NEEDS_WIKI_IDENTITY_AND_RECIPE_REVIEW',
                         **markers})
    with (out/'FARM_SUBTARGET_EVIDENCE.jsonl').open('w',encoding='utf-8') as f:
        for x in rows:f.write(json.dumps(x,ensure_ascii=False)+'\n')
    with (out/'FARM_SUBTARGET_INDEX.csv').open('w',encoding='utf-8-sig',newline='') as f:
        fields=['id','parent_guide_id','item_or_set_candidate','source_chapter','start_line','end_line','material_mentions','quest_candidates','map_mentions','status'];w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
        for r in rows:
            w.writerow({'id':r['id'],'parent_guide_id':r['parent_guide_id'],'item_or_set_candidate':r['item_or_set_candidate'],
                'source_chapter':r['source_chapter'],'start_line':r['source_span']['start_line'],'end_line':r['source_span']['end_line'],
                'material_mentions':len(r['subsection_material_mentions']),'quest_candidates':len(r['subsection_quest_candidates']),
                'map_mentions':len(r['subsection_map_mentions']),'status':r['state']})
    print('subtarget headings',len(rows))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--guide-records',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args();main(a.guide_records,a.out)
