#!/usr/bin/env python3
"""Flatten source evidence into explicit work queues for Codex; no gameplay inference."""
import argparse, json, csv
from pathlib import Path

def rows(p):
 return [json.loads(line) for line in p.read_text(encoding='utf-8').splitlines() if line.strip()]

def csvout(path,records,fields):
 with path.open('w',encoding='utf-8-sig',newline='') as file:
  writer=csv.DictWriter(file,fieldnames=fields,extrasaction='ignore')
  writer.writeheader(); writer.writerows(records)

def export(out:Path):
 guides=rows(out/'FARM_CATALOG_SOURCE_EVIDENCE.jsonl')
 subs=rows(out/'FARM_SUBTARGET_EVIDENCE.jsonl')
 queue=[];conditions=[];shop=[];quests=[]
 for g in guides:
  queue.append({'record_id':g['id'],'kind':'GUIDE','name':g['target_name'],'source_chapter':g['source_chapter'],
      'category_hint':g['category'] or '', 'source_start':g['source_span']['start_line'],
      'source_end':g['source_span']['end_line'],'quest_candidates':len(g['quest_chain_candidates']),
      'material_mentions':len(g['material_mentions']),'map_mentions':len(g['source_locations']),
      'verification_status':'PENDING_CANONICAL_AND_WIKI'})
  for row in g['prerequisite_lines']:
   conditions.append({'record_id':g['id'],'item_or_guide':g['target_name'],'quest_sequence':row.get('near_quest_sequence'),
      'source_line':row['line'],'text':row['text'],'status':'CANDIDATE_NOT_VERIFIED'})
  for row in g['shop_unlock_lines']:
   shop.append({'record_id':g['id'],'item_or_guide':g['target_name'],'source_line':row['line'],
                'source_text':row['text'],'status':'SHOP_MENTION_NOT_UNLOCK_PROOF'})
  for q in g['quest_chain_candidates']:
   quests.append({'guide_id':g['id'],'guide_title':g['target_name'],'quest_sequence':q['sequence'],
       'quest_name_candidate':q['name_candidate'],'source_line':q['heading_line'],
       'required_materials_candidate_count':len(q['materials_candidates']),
       'map_mentions':';'.join(q['maps_mentioned']),
       'status':'WIKI_QUEST_VALIDATION_REQUIRED'})
 for s in subs:
  queue.append({'record_id':s['id'],'kind':'SUBTARGET','name':s['item_or_set_candidate'],
      'source_chapter':s['source_chapter'],'category_hint':'',
      'source_start':s['source_span']['start_line'],'source_end':s['source_span']['end_line'],
      'quest_candidates':len(s['subsection_quest_candidates']),
      'material_mentions':len(s['subsection_material_mentions']),
      'map_mentions':len(s['subsection_map_mentions']),
      'verification_status':'PENDING_IS_CANONICAL_OR_COLLECTION_OR_SUBHEADING'})
 csvout(out/'CODEX_REVIEW_QUEUE.csv',queue, ['record_id','kind','name','source_chapter','category_hint','source_start','source_end','quest_candidates','material_mentions','map_mentions','verification_status'])
 csvout(out/'QUEST_PRECONDITION_CANDIDATES.csv',conditions,['record_id','item_or_guide','quest_sequence','source_line','text','status'])
 csvout(out/'SHOP_AND_UNLOCK_MENTIONS.csv',shop,['record_id','item_or_guide','source_line','source_text','status'])
 csvout(out/'QUEST_DETAILS_INDEX.csv',quests,['guide_id','guide_title','quest_sequence','quest_name_candidate','source_line','required_materials_candidate_count','map_mentions','status'])
 print('review queue',len(queue),'prerequisite mentions',len(conditions),'shop mentions',len(shop),'quest details',len(quests))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--out',required=True,type=Path);r=p.parse_args();export(r.out)
