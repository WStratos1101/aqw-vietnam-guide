#!/usr/bin/env python3
"""Extract source-grounded Farming Codex evidence from the user's AQW Vietnam guide.

The source supports guide sections, named Quest candidates, explicitly mentioned
materials, numbers, maps and monsters. It does NOT prove that every mentioned
material is consumed, a reward belongs to an aggregate, or a map is the Quest
acceptance location. No guessed Wiki page links or invented fields.
Python standard library only, Python 3.9+.
"""
from __future__ import annotations
import re, json, argparse, hashlib, csv, collections
from pathlib import Path

CHAPTER=re.compile(r'^\s*(?P<num>XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\.\s+(?P<title>[A-Za-z][^\n]+?)\s*$')
SECTION=re.compile(r'^(?P<num>\d{1,2})\.\s+(?P<title>[^\n]{3,140}?)\s*$')
MAP=re.compile(r'(?<![\w])/?join\s+(?P<map>[a-z][a-z0-9_-]{1,40})',re.I)
QTY=re.compile(r'(?P<name>[^:×\n]{2,95}?)\s*[×xX]\s*(?P<qty>\d[\d.,]*)',re.I)
INTM=re.compile(r'\b(?P<quantity>\d[\d.,]*)\s+(?P<name>[A-Z][A-Za-z0-9’\'() +\-]{2,50}?)\s*(?=\(|[.,;:]|$)')
QUEST_NAME=re.compile(r'(?:[“"\'](?P<quoted>[^”"\']{3,100})[”"\']\s*(?:quest|Quest))|(?:^\s*(?:◆\s*)?(?P<plain>[^:]{3,95}?\s+Quest)\s*:)',re.I)
QUEST_HEADER=re.compile(r'^\s*(?:◆|\u25c6)?\s*(?:(?P<qlabel>Quest\s*\d+)\s*:\s*(?P<qname>[^\n]{3,100})|(?P<qtitle>[^\n]{3,120}?\s+Quest)\s*:|[“"](?P<quote>[^”"]{3,100})[”"]\s*quest\b)',re.I)
BULLET=re.compile(r'^\s*(?P<mark>→|➜|\*|[-•])\s*(?P<body>.*)$')
DROP=re.compile(r'(?i)\b(?:drop|rớt|rơi)\s+(?:từ|bởi)\s+(?P<monster>[^.;,\n]{2,90}?)\s+(?:ở|tại|in)\s+(?P<where>/join\s+[a-z][a-z\d_-]+)')
DROP_ALT=re.compile(r'(?i)\bđánh\s+(?P<monster>[^.;,\n]{2,85}?)\s+(?:ở|tại)\s+(?P<where>/join\s+[a-z][a-z\d_-]+)')
ACQ=re.compile(r'(?i)\b(drop\s+từ|drop\s+bởi|đánh|mua\s+(?:tại|trong|với)|merge\s+(?:tại|ở)|nhận\s+(?:từ|ở)|hoàn\s+thành|Quest|Shop|NPC|Ultra)\b')
PRECOND=re.compile(r'(?i)(?:yêu cầu(?:\s+trước\s+khi)?|trước khi bắt đầu|cần (?:có|đạt)|phải (?:có|hoàn thành)|hoàn thành (?:chuỗi|story|quest)|mở khoá|unlock|rank\s*\d+|level\s*\d+|lvl\s*\d+|member)')
SHOP=re.compile(r'(?i)\b(shop|merge shop|mở shop|unlock shop|mở khoá shop|unlock.*shop)\b')
NATURAL_REQ=re.compile(r'(?i)\b(?:cần|yêu cầu|turn in cần|bạn cần)\s+(?P<qty>\d[\d.,]*)\s+(?P<name>[A-Za-z][A-Za-z0-9’\' &+\-]{2,65}?)(?=\s*\(|[.,;:]|$)')
MERGE=re.compile(r'(?i)\bmerge\b')
INSIGNIA=re.compile(r'(?i)insignia')
ULTRA=re.compile(r'(?i)ultra\s+(?:nulgath|dage|speaker|engineer|warden|darkon|drakath|drago|gramiel|malgor|boss)')
STOP_RE=re.compile(r'(?i)\b(?:note:|ghi chú|xem thêm|click here|full walkthrough|quest sẽ|cách farm)\b')

SOURCE_DOCS='https://docs.google.com/document/d/1yPGo5Qa6hS70jy8AIHhUUnosSknAY9N_qH6m1NETIEA/edit?tab=t.0'
FACTION={'Good':'good','Evil':'evil','Chaos':'chaos','Museum':'awe','Forge':'blacksmithing','Nation':'nation','Legion':'legion','Dragonkin':'dragonkin','Elemental':'elemental','Hollowborn':'hollowborn','Debris & Astravian':None,'Other Items':None,'Farming List':None}


def norm(s):
    return re.sub(r'\s+', ' ',s).strip()

def category_from_title(t):
    v=t.lower()
    if 'class obtain' in v or ' class ' in ' '+v+' ':return 'Class'
    if 'helm' in v: return 'Helm'
    if 'armor' in v: return 'Armor'
    if any(x in v for x in ('sword','blade','dagger','halberd','scythe','poleaxe','staff','bow ')) and not any(x in v for x in ('set','series','theme')):return 'Weapon (title hint)'
    if any(x in v for x in ('set','series','theme','items farming')):return 'Aggregate / collection'
    if 'house' in v or 'portals guide' in v:return 'House / utility'
    if 'resources' in v or 'token' in v:return 'Resource guide'
    return None

def title_clean(s):
    s=re.sub(r'(?i)\s*(?:class\s+obtain|farming\s+guides|farming\s+guide|obtain\s+guide|guide|quests)\s*$', '', s).strip()
    return s

def get_chapters(lines):
    data=[]
    for i,raw in enumerate(lines,1):
        m=CHAPTER.fullmatch(raw.strip())
        if m:data.append({'chapter_id':m['num'],'chapter':m['title'].strip(),'start_line':i,'end_line':len(lines)})
    for a,b in zip(data,data[1:]):a['end_line']=b['start_line']-1
    return data

def get_sections(lines,chapters):
    sections=[]
    for ch in chapters:
        if ch['chapter']=='Farming List':continue
        subs=[]
        for line_no in range(ch['start_line']+1,ch['end_line']+1):
            s=lines[line_no-1]
            if not s or s[0].isspace():continue
            m=SECTION.fullmatch(s.strip())
            if m and not (m['title'].lower().startswith('step ') or m['title'].lower().startswith('quest ')):
                subs.append({'id':f"{ch['chapter_id']}-{m['num']}-{line_no}",
                             'name':title_clean(m['title']),'heading':m['title'].strip(),
                             'chapter':ch['chapter'],'source_chapter_id':ch['chapter_id'],
                             'start_line':line_no,'end_line':ch['end_line']})
        for a,b in zip(subs,subs[1:]):a['end_line']=b['start_line']-1
        sections.extend(subs)
    return sections

def parse_qty(text):
    # Material line is most trustworthy with arrow / standalone ingredient phrase.
    b=BULLET.match(text)
    body=b.group('body') if b else text.strip()
    # discard only short metadata-style title prefixes; protect names with colon.
    match=QTY.search(body)
    if not match:
        natural=NATURAL_REQ.search(body)
        if not natural:return None
        rawname=natural['name'].strip(' :-—•*\t')
        qty=natural['qty']
    else:
        rawname=match['name'].strip(' :-—•*\t')
        qty=match['qty']
    # Avoid matching narrative sentences with item mention in the middle as an item name.
    if ':' in rawname:rawname=rawname.rsplit(':',1)[-1].strip()
    if len(rawname)>80:return None
    if not rawname[0].isupper() and not rawname[0].isdigit():return None
    rawname=re.sub(r'^(?i:items required|nguyên liệu|cần có|để hoàn thành|yêu cầu)\s*[:：]?\s*','',rawname).strip()
    if not rawname:return None
    try:
        asnum=int(qty.replace('.','').replace(',',''))
        if asnum<=0:return None
    except ValueError:return None
    return {'name_candidate':rawname,'quantity_mentioned':asnum,'quantity_text':qty,'role':'UNVERIFIED_INGREDIENT_OR_REWARD_OR_GOAL'}

def is_quest(line):
    s=line.strip()
    if len(s)>145:return None
    if not re.search('quest',s,re.I):return None
    q=QUEST_HEADER.match(s)
    if q:
        name=q.group('qname') or q.group('qtitle') or q.group('quote')
        if not name:return None
        # reduce quote including "quest" at tail
        name=re.sub(r'(?i)\s+quest\s*$', '', name).strip('“”\'" :')
        if len(name)<3:return None
        return name
    return None

def parse_material_source(line):
    m=DROP.search(line) or DROP_ALT.search(line)
    if m:
        monster=norm(m['monster']).strip(' ,;:')
        # avoid long narrative monster candidates
        if len(monster)<65:
            return {'kind':'monster_drop_candidate','monster_candidate':monster,
                    'map_candidate':m['where'].split()[-1].lower(),'verification':'SOURCE_EXPLICIT_NEEDS_WIKI'}
    return None

def make_record(section,lines):
    ch=section['chapter']; label=section['name']
    obj={'id':section['id'],'target_name':label,'canonical_id':None,
         'category':category_from_title(section['heading']),'official_subtype':None,
         'primary_group_verified':None,
         'source_chapter':ch,'chapter_group_hint':FACTION.get(ch),
         'source_span':{'start_line':section['start_line'],'end_line':section['end_line']},
         'guide_url':SOURCE_DOCS,
         'verification_status':'SOURCE_EXTRACTED_NEEDS_CANONICAL_AND_WIKI',
         'quest_chain_candidates':[],'merge_recipe_candidates':[],'material_mentions':[],
         'prerequisite_lines':[],'shop_unlock_lines':[],'source_locations':[],
         'ultra_insignia_lines':[],'additional_targets':[],'quest_mentions':[],
         'source_line_count':section['end_line']-section['start_line']+1}
    current_quest=None
    current_step=None
    current_route=None
    qindex=-1
    for lineno in range(section['start_line']+1,section['end_line']+1):
        text=lines[lineno-1].strip()
        if not text:continue
        if len(text)<130 and re.match(r'(?i)^(?:step\s*\d+|giai đoạn\s*\d+|bước\s*\d+|b\d+\s*:)',text):
            current_step={'title':text,'line':lineno}
            current_quest=None
        if len(text)<110 and re.match(r'(?i)^(?:◆\s*)?(?:cách\s*\d+|option\s*\d+)\s*:',text):
            current_route={'title':text,'line':lineno}
            current_quest=None
        for qm in re.finditer(r'[“"\']([^”"\']{3,100})[”"\']\s*(?:quest|Quest)\b',text):
            obj['quest_mentions'].append({'line':lineno,'name_candidate':qm.group(1).strip(), 'source_text':text[:420]})
        qname=is_quest(text)
        if qname:
            qindex+=1
            quest={'sequence':qindex+1,'name_candidate':qname,'heading_line':lineno,
                   'step':current_step,'alternative_route':current_route,
                   'quest_giver':None,'accept_map':None,
                   'materials_candidates':[],'maps_mentioned':[],
                   'requirements_line_refs':[],'shop_unlock_line_refs':[],
                   'status':'QUEST_NAME_ONLY_NEEDS_WIKI_AND_CONTEXT'}
            obj['quest_chain_candidates'].append(quest)
            current_quest=quest
        if PRECOND.search(text) and len(text)<350:
            obj['prerequisite_lines'].append({'line':lineno,'text':text[:400],
                                              'near_quest_sequence':current_quest['sequence'] if current_quest else None})
            if current_quest:current_quest['requirements_line_refs'].append(lineno)
        if SHOP.search(text) and len(text)<400:
            obj['shop_unlock_lines'].append({'line':lineno,'text':text[:450]})
            if current_quest: current_quest['shop_unlock_line_refs'].append(lineno)
        if INSIGNIA.search(text):
            obj['ultra_insignia_lines'].append({'line':lineno,'text':text[:700],
                                               'ultra_mentioned':bool(ULTRA.search(text))})
        for mm in MAP.finditer(text):
            loc={'line':lineno,'map':mm['map'].lower(),'source_text':text[:350],
                 'context':'MAP_MENTION_NOT_NECESSARILY_QUEST_ACCEPTANCE'}
            obj['source_locations'].append(loc)
            if current_quest and mm['map'].lower() not in current_quest['maps_mentioned']:
                current_quest['maps_mentioned'].append(mm['map'].lower())
        if re.match(r'^\s*◆\s+',text) and not qname and len(text)<135:
            title=re.sub(r'^◆\s+','',text).strip()
            if '×' not in title and not title.lower().startswith(('cách ', 'daily quest', 'quest ', 'yêu cầu')):
                obj['additional_targets'].append({'line':lineno,'name_candidate':title,
                    'status':'HEADING_NOT_VERIFIED_AS_CANONICAL_OUTPUT'})
        # Some named pieces in theme/seasonal sections are plain unbulleted headers,
        # e.g. "Hollowborn Oblivion Blade (HBOB)". They are candidate headings only.
        elif (('theme' in section['heading'].lower() or 'other items' in section['chapter'].lower()
               or 'scavenger hunts' in section['heading'].lower())
              and text == lines[lineno-1] and 8 <= len(text) <= 115
              and not any(c in text for c in ('→','×',':','/join','Click here','\t'))
              and re.search(r'(?i)\b(?:blade|blades|sword|daggers?|armor|class|set|scythe|helm|cape|paladin|oblivion|weapon|seasonal|staff|caster)\b',text)
              and not text.lower().startswith(('đây ', 'nếu ', 'các ', 'bạn ', 'sau ', 'cần ', 'yêu ', 'quest ', 'note','mỗi ', 'có ', 'chỉ ', 'để ', 'nên ', 'bước ', 'trước '))
              and not re.match(r'^\d+\s*[-–]',text)
              and not is_quest(text)):
            obj['additional_targets'].append({'line':lineno,'name_candidate':text,
                'status':'UNBULLETED_HEADING_NEEDS_CANONICAL_VERIFICATION'})
        ingred=parse_qty(text)
        if ingred:
            ingest={**ingred,'line':lineno,'source_text':text[:800],
                    'step':current_step['title'] if current_step else None,
                    'quest_sequence':current_quest['sequence'] if current_quest else None,
                    'route':current_route['title'] if current_route else None,
                    'source_candidate':parse_material_source(text),
                    'maps_mentioned_on_line':[m['map'].lower() for m in MAP.finditer(text)]}
            obj['material_mentions'].append(ingest)
            if current_quest:current_quest['materials_candidates'].append(ingest)
            if MERGE.search(text):obj['merge_recipe_candidates'].append(ingest)
    # Do not treat a chapter as owning all items mentioned; `primary_group_verified` stays null.
    return obj

def save_json(path,x):path.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def save_csv(path, rows, fields):
    with path.open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(rows)

def build(source:Path,out:Path):
    text=source.read_text(encoding='utf-8-sig'); lines=text.splitlines()
    if not text.strip().startswith('FARMING ITEM GUIDE'):raise ValueError('Expected FARMING ITEM GUIDE source')
    chapters=get_chapters(lines);sections=get_sections(lines,chapters)
    records=[make_record(x,lines) for x in sections]
    out.mkdir(parents=True,exist_ok=True)
    meta={'schema_version':1,'source_file':source.name,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
          'source_lines':len(lines),'sources':{'guide':'USER_SUPPLIED_LOCAL','google_doc':SOURCE_DOCS,
           'google_doc_read':'Connector text read in creation session; cross-format line alignment not guaranteed',
           'aqw_wiki':'https://aqwwiki.wikidot.com/'},
          'limitations':['Guide record is an item/collection/utility guide candidate, not necessarily canonical equipment.',
           'A ×N mention is NOT inherently a consumed material. Verify Quest or Merge source before promoting.',
           'Quest near /join map does not prove this is its acceptance map.',
           'Chapter is a SOURCE chapter, not proof of faction ownership for all mentioned items.',
           'Raw guide text export can omit live embedded hyperlinks, tables or images.'],
          'chapters':chapters,'guide_records_count':len(records)}
    save_json(out/'SOURCE_MANIFEST.json',meta)
    with (out/'FARM_CATALOG_SOURCE_EVIDENCE.jsonl').open('w',encoding='utf-8') as f:
        for rec in records:f.write(json.dumps(rec,ensure_ascii=False)+'\n')
    quest_rows=[]; mat_rows=[]; map_rows=[]; extra=[]; a=[]
    for r in records:
        for q in r['quest_chain_candidates']:
            quest_rows.append({'guide_id':r['id'],'target':r['target_name'],'chapter':r['source_chapter'],
                               'quest_sequence':q['sequence'],'quest_name':q['name_candidate'],'line':q['heading_line'],
                               'accept_map':'','status':q['status']})
        for m in r['material_mentions']:
            mat_rows.append({'guide_id':r['id'],'target':r['target_name'],'chapter':r['source_chapter'],
                             'quest_sequence':m['quest_sequence'],'name':m['name_candidate'],'quantity':m['quantity_mentioned'],
                             'line':m['line'],'monster_candidate':(m['source_candidate'] or {}).get('monster_candidate',''),
                             'farm_map_candidate':(m['source_candidate'] or {}).get('map_candidate',''),
                             'maps_on_line':';'.join(m['maps_mentioned_on_line']),'role':m['role'],
                             'source_text':m['source_text']})
        for m in r['source_locations']:
            map_rows.append({'guide_id':r['id'],'target':r['target_name'],'chapter':r['source_chapter'],
                             'map':m['map'],'line':m['line'],'context':m['context'],'source_text':m['source_text']})
        for e in r['additional_targets']:
            extra.append({'guide_id':r['id'],'guide_title':r['target_name'],'chapter':r['source_chapter'],
                          'candidate_item_or_subsection':e['name_candidate'],'line':e['line'],'status':e['status']})
        a.append({'guide_id':r['id'],'target':r['target_name'],'chapter':r['source_chapter'],
                  'kind_hint':r['category'] or 'UNVERIFIED','primary_group_verified':'',
                  'quest_candidates':len(r['quest_chain_candidates']), 'material_mentions':len(r['material_mentions']),
                  'maps_mentioned':len(r['source_locations']),'source_start':r['source_span']['start_line'],
                  'source_end':r['source_span']['end_line'],'status':r['verification_status']})
    save_csv(out/'FARM_GUIDES_INDEX.csv',a,list(a[0]) if a else [])
    save_csv(out/'QUEST_WORKFLOW_CANDIDATES.csv',quest_rows, ['guide_id','target','chapter','quest_sequence','quest_name','line','accept_map','status'])
    save_csv(out/'MATERIAL_SOURCE_CANDIDATES.csv',mat_rows,['guide_id','target','chapter','quest_sequence','name','quantity','line','monster_candidate','farm_map_candidate','maps_on_line','role','source_text'])
    save_csv(out/'MAP_MENTIONS.csv',map_rows,['guide_id','target','chapter','map','line','context','source_text'])
    save_csv(out/'AGGREGATE_ITEM_CANDIDATES.csv',extra,['guide_id','guide_title','chapter','candidate_item_or_subsection','line','status'])
    summary={'chapters':len(chapters),'guide_records':len(records),'quest_candidates':len(quest_rows),
             'material_mentions':len(mat_rows),'map_mentions':len(map_rows),'aggregate_item_candidates':len(extra),
             'insignia_mention_lines':sum(len(r['ultra_insignia_lines']) for r in records)}
    save_json(out/'EXTRACTION_SUMMARY.json',summary)
    print(json.dumps(summary,ensure_ascii=False,indent=2))

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('--source',required=True,type=Path)
    ap.add_argument('--out',required=True,type=Path)
    args=ap.parse_args();build(args.source,args.out)
