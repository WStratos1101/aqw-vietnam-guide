#!/usr/bin/env python3
"""AQW Farming Guide: offline, traceable extraction for Codex.

This script DOES NOT confirm item factions, recipes, rewards, drops, or mappings.
Every extracted object is a CANDIDATE with an exact source line. It never changes
app/catalog source data. Requires Python 3.9+; Python standard library only.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import re
import sys
from pathlib import Path
from collections import Counter, defaultdict

VERSION = "1.0.0"
ROMAN = re.compile(r"^(?P<num>XIII|XII|XI|VIII|VII|VI|IV|III|II|IX|X|V|I)\.\s+(?P<title>\S.*)$")
GUIDE = re.compile(r"^(?P<num>\d{1,2})\.\s+(?P<title>.+?(?:Guide|Guides|Obtain Guide|Farming Guides))\s*$", re.I)
BONUS = re.compile(r"^BONUS:\s*(?P<title>.+?Guide)\s*$", re.I)
QUEST = re.compile(r"^\s*(?:[◆•→*-]\s*)?(?:(?:Quest|Q)\s*\d+\s*:\s*)?(?P<title>[^:\n]{2,115}?(?:Quest|Q\.|Q|quests?))\s*:\s*(?:.*)?$", re.I)
QUEST_ALT = re.compile(r"^\s*(?:[◆•→*-]\s*)?\b(?P<title>(?:Quest|Q)\s*\d+\s*:\s*[^\n]{3,120})$", re.I)
MAP = re.compile(r"(?i)(?<![\w])/join\s+([A-Za-z][A-Za-z0-9_-]{1,45})")
MATERIAL = re.compile(r"(?<![\w])(?P<name>[A-Za-zÀ-ỹ][A-Za-zÀ-ỹ0-9’'()&+.,\-/ ]{1,100}?)\s*[×xX]\s*(?P<qty>\d[\d.,]*)\b")
NATURAL_QTY = re.compile(r"(?i)\b(?:cần|yêu cầu)\s+(?P<qty>\d[\d,.]*)\s+(?P<name>[A-Za-z][A-Za-z0-9’' -]{2,65}?)(?=\s*(?:\(|[.,;:]|$))")
PRE = re.compile(r"(?i)^(?:[◆•→*-]\s*)?(?:yêu cầu|trước khi|cần (?:phải|có|đạt)|phải (?:có|hoàn thành)|hoàn thành|đạt (?:ít nhất|rank)|rank\s*\d|level\s*\d|optional\b|không bắt buộc|member\b|non[- ]?mem\b)")
INSIGNIA = re.compile(r"(?i)insignia")
ULTRA = re.compile(r"(?i)ultra|challenge boss|king drago|darkon the conductor")
REWARD = re.compile(r"(?i)\breward(?:s)?\b|phần thưởng|món nhận được|quest reward|shop\b|merge shop")
COLLAPSE = re.compile(r"[\W_]+", re.UNICODE)


def norm(value: str) -> str:
    return COLLAPSE.sub(" ", value.casefold().replace("’", "'")).strip()


def clean_line(value: str) -> str:
    return value.strip().replace("\ufeff", "")


def write_json(path: Path, data: object):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, records: list[dict], fields: list[str]):
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fields, extrasaction="ignore")
        writer.writeheader()
        for item in records:
            writer.writerow({k: json.dumps(item[k], ensure_ascii=False) if isinstance(item.get(k), (list, dict)) else item.get(k, "") for k in fields})


def source_lines(source: Path) -> list[str]:
    if not source.is_file():
        raise ValueError(f"Không tìm thấy guide: {source}")
    raw = source.read_text(encoding="utf-8-sig")
    if not raw.startswith("FARMING ITEM GUIDE"):
        raise ValueError("File không có tiêu đề FARMING ITEM GUIDE; kiểm tra lại nguồn")
    return raw.splitlines()


def index_document(source: Path) -> dict:
    original = source.read_bytes()
    lines = source_lines(source)
    chapters, sections, quests, materials, maps, prereqs, insignias = [], [], [], [], [], [], []
    active_chapter = None
    active_guide = None
    active_quest = None
    section_counter = 0
    for idx, raw in enumerate(lines, 1):
        line = clean_line(raw)
        if not line:
            continue
        heading = ROMAN.fullmatch(line)
        if heading:
            if active_guide:
                active_guide["end_line"] = idx - 1
            if active_chapter:
                active_chapter["end_line"] = idx - 1
            ch = {"chapter_id": heading['num'], "chapter": heading['title'].strip(), "start_line": idx,
                  "end_line": len(lines), "is_faction_chapter": heading['num'] != 'I'}
            chapters.append(ch)
            active_chapter = ch
            active_guide = None
            active_quest = None
            continue
        guide_match = GUIDE.fullmatch(line) or BONUS.fullmatch(line)
        if guide_match and active_chapter:
            if active_guide:
                active_guide['end_line'] = idx - 1
            section_counter += 1
            active_guide = {
                'section_id': f'S{section_counter:03d}', 'chapter_id': active_chapter['chapter_id'],
                'chapter': active_chapter['chapter'], 'title': guide_match['title'].strip(),
                'start_line': idx, 'end_line': len(lines)
            }
            sections.append(active_guide)
            active_quest = None
        # These hints must never be treated as verified structured recipes. They only
        # help Codex locate lines to check within the full raw guide.
        qm = QUEST.match(line) or QUEST_ALT.match(line)
        if qm and active_guide:
            title = qm.group('title').strip(' ◆•→*- :')
            if 3 <= len(title) <= 115:
                active_quest = title
                quests.append({
                    'line': idx, 'chapter': active_chapter['chapter'], 'section_id': active_guide['section_id'],
                    'guide_title': active_guide['title'], 'quest_candidate': title,
                    'source_text': line, 'status': 'NEEDS_VERIFICATION'
                })
        context = {
            'line': idx,
            'chapter': active_chapter['chapter'] if active_chapter else 'UNSCOPED',
            'chapter_id': active_chapter['chapter_id'] if active_chapter else '',
            'section_id': active_guide['section_id'] if active_guide else '',
            'guide_title': active_guide['title'] if active_guide else '',
            'nearby_quest_candidate': active_quest or '',
            'source_text': line,
            'status': 'NEEDS_VERIFICATION'
        }
        for found in MAP.finditer(line):
            maps.append({**context, 'map': found.group(1).lower(), 'join_command': '/join ' + found.group(1).lower()})
        if active_guide:
            for found in MATERIAL.finditer(line):
                # Usually the guide uses quantities ×; this is a *mention*, not proof
                # of an input requirement or an item's final total.
                name = found.group('name').strip(' •→*-:,')
                if len(name) >= 2:
                    materials.append({**context, 'material_candidate': name, 'quantity_text': found.group('qty'),
                                      'interpretation': 'MENTION_ONLY_NOT_RECIPE'})
            # Some quest descriptions say "cần 25 Undead Essence" rather than
            # "Undead Essence ×25". Still a non-authoritative quantity mention.
            for found in NATURAL_QTY.finditer(line):
                material_name = found.group('name').strip(' •→*-:,')
                if len(material_name) >= 2:
                    materials.append({**context, 'material_candidate': material_name,
                                      'quantity_text': found.group('qty'),
                                      'interpretation': 'MENTION_ONLY_NOT_RECIPE'})
            if PRE.match(line) and len(line) <= 440:
                prereqs.append({**context, 'condition_candidate': line})
            if INSIGNIA.search(line):
                insignias.append({**context, 'ultra_mentioned': bool(ULTRA.search(line)),
                                  'insignia_names_unverified': True})
    if active_guide:
        active_guide['end_line'] = len(lines)
    if active_chapter:
        active_chapter['end_line'] = len(lines)
    return {
        'schema': 1, 'extractor_version': VERSION, 'source_file': source.name,
        'source_sha256': hashlib.sha256(original).hexdigest(), 'source_total_lines': len(lines),
        'warning': ('Quests, materials, maps, preconditions and Insignia are POSITIONAL CANDIDATES only. '
                    'No item-to-faction, canonical identity, item rewards, recipe, quest dependency, drop, '
                    'or Ultra Boss link is verified by this extractor.'),
        'chapters': chapters, 'guide_sections': sections, 'quest_candidates': quests,
        'material_mentions': materials, 'map_mentions': maps,
        'precondition_candidates': prereqs, 'insignia_mentions': insignias
    }


def get_catalog_items(catalog: Path) -> list[dict]:
    data = json.loads(catalog.read_text(encoding='utf-8'))
    if isinstance(data, list):
        collection = data
    elif isinstance(data, dict):
        collection = None
        for key in ('items', 'catalog', 'farmItems', 'farmingItems', 'data'):
            candidate = data.get(key)
            if isinstance(candidate, list):
                collection = candidate
                break
            if isinstance(candidate, dict):
                for nest in ('items', 'catalog', 'farmItems'):
                    if isinstance(candidate.get(nest), list):
                        collection = candidate[nest]
                        break
            if collection is not None:
                break
        if collection is None:
            raise ValueError('Catalog JSON không có mảng items/catalog/farmItems/data. Chỉ hỗ trợ JSON; đừng ghi đè source.')
    else:
        raise ValueError('Catalog phải là JSON array hoặc object chứa array')
    items = []
    for i, x in enumerate(collection):
        if not isinstance(x, dict):
            continue
        name = next((x[k] for k in ('name', 'title', 'itemName') if isinstance(x.get(k), str) and x[k].strip()), None)
        if not name:
            continue
        ident = next((x[k] for k in ('canonicalId', 'itemId', 'id', 'slug') if isinstance(x.get(k), (str, int))), f'row-{i}')
        items.append({'id': str(ident), 'name': name, 'current_group': str(x.get('primaryGroupId') or x.get('faction') or x.get('groupId') or '')})
    if not items:
        raise ValueError('Không tìm thấy item có name/title trong catalog JSON; chưa xuất crosswalk')
    return items


def crosswalk_candidates(index: dict, catalog: Path) -> list[dict]:
    """Produce REVIEW ONLY matches; do not assign faction from mention frequency."""
    items = get_catalog_items(catalog)
    section_names = defaultdict(list)
    for section in index['guide_sections']:
        title = section['title']
        # Only near-exact guide title matching: remove trailing "Guide" and abbreviations;
        # still not enough to prove that this canonical item is a reward.
        short = re.sub(r'(?i)\s+(?:Class\s+Obtain|Farming|Obtain)?\s*Guides?$', '', title)
        short = re.sub(r'\s*\([^)]*\)\s*$', '', short)
        section_names[norm(short)].append(section)
    results = []
    for item in items:
        hits = section_names.get(norm(item['name']), [])
        if len(hits) == 1:
            chapter, line, how = hits[0]['chapter'], hits[0]['start_line'], 'EXACT_GUIDE_TITLE_CANDIDATE'
        elif hits:
            chapter, line, how = '', '', 'MULTIPLE_GUIDE_TITLE_CANDIDATES'
        else:
            chapter, line, how = '', '', 'NO_EXACT_GUIDE_TITLE'
        results.append({'canonical_id': item['id'], 'canonical_name': item['name'],
                        'current_group': item['current_group'], 'candidate_chapter': chapter,
                        'evidence_line': line, 'match_type': how,
                        'proposed_group': '', 'validation_status': 'PENDING_SOURCE_REWARD_OR_SHOP_VERIFICATION'})
    return results


def write_outputs(out: Path, index: dict, candidates: list[dict] | None = None) -> None:
    out.mkdir(parents=True, exist_ok=True)
    write_json(out / 'guide_index.json', index)
    specs = [
        ('chapters.csv', 'chapters', ['chapter_id','chapter','start_line','end_line','is_faction_chapter']),
        ('guide_sections.csv','guide_sections',['section_id','chapter_id','chapter','title','start_line','end_line']),
        ('quest_candidates.csv','quest_candidates',['line','chapter','section_id','guide_title','quest_candidate','source_text','status']),
        ('material_mentions.csv','material_mentions',['line','chapter','section_id','guide_title','nearby_quest_candidate','material_candidate','quantity_text','source_text','interpretation']),
        ('map_mentions.csv','map_mentions',['line','chapter','section_id','guide_title','nearby_quest_candidate','join_command','source_text']),
        ('precondition_candidates.csv','precondition_candidates',['line','chapter','section_id','guide_title','condition_candidate']),
        ('insignia_mentions.csv','insignia_mentions',['line','chapter','section_id','guide_title','nearby_quest_candidate','ultra_mentioned','source_text'])
    ]
    for filename, key, fields in specs:
        write_csv(out / filename, index[key], fields)
    if candidates is None and (out / 'canonical_match_candidates.csv').exists():
        (out / 'canonical_match_candidates.csv').unlink()  # avoid stale suggested matches
    if candidates is not None:
        write_csv(out / 'canonical_match_candidates.csv', candidates,
                  ['canonical_id','canonical_name','current_group','candidate_chapter','evidence_line','match_type','proposed_group','validation_status'])
    counts = {key: len(index[key]) for _,key,_ in specs}
    text = [
        '# AQW Farming Guide — extraction report', '',
        f'- Source SHA-256: `{index["source_sha256"]}`',
        f'- Source file: `{index["source_file"]}`',
        f'- Source lines: **{index["source_total_lines"]}**',
        '- **All candidate fields require human/source validation.** They are not confirmed recipes or faction assignments.',
        '- `I. Farming List` is a goal/difficulty list, NOT a faction.',
        '- `Other Items` is NOT a faction.',
        '- Material ×quantity mentions may be per turn, total, option, reward or prerequisite: DO NOT auto-merge.',
        '- `/join` mentions do not automatically mean the map is the acquisition location.',
        '- Insignia mentions do not prove which Ultra Boss rewards the exact Insignia.',
        '', '## Extracted candidates', ''
    ]
    text.extend(f'- {key}: {value}' for key,value in counts.items())
    if candidates is not None:
        match = Counter(x['match_type'] for x in candidates)
        text.extend(['', '## Canonical match candidate audit', ''] + [f'- {key}: {value}' for key,value in match.items()])
    text.extend(['', '## Next step', '',
                 'Open the corresponding source line in `FARMING_ITEM_GUIDE_SOURCE.txt`; verify item vs aggregate vs prerequisite vs quest input.',
                 'Only then reconcile to actual canonical IDs, item source-of-truth, Ultra Boss codex and Wiki.',
                 'Do not bulk-generate faction, recipe or image mappings from these candidates.', ''])
    (out / 'EXTRACTION_REPORT.md').write_text('\n'.join(text), encoding='utf-8')


def lookup(index_path: Path, term: str, limit: int = 20):
    index = json.loads(index_path.read_text(encoding='utf-8'))
    query = norm(term)
    count = 0
    for key in ('guide_sections','quest_candidates','material_mentions','map_mentions','precondition_candidates','insignia_mentions'):
        for record in index.get(key, []):
            text = ' '.join(str(record.get(k, '')) for k in ('title','quest_candidate','material_candidate','source_text','condition_candidate'))
            if query in norm(text):
                line = record.get('line', record.get('start_line'))
                brief = (record.get('title') or record.get('source_text') or record.get('condition_candidate') or '')[:165]
                print(f'{key} L{line} [{record.get("chapter", "")}] {brief}')
                count += 1
                if count >= limit:
                    return
    if not count:
        print('Không tìm thấy trong chỉ mục. Hãy tìm trực tiếp bằng rg trên file guide gốc.')


def main(argv=None):
    parser = argparse.ArgumentParser(description='AQW farming guide evidence index; never modifies catalog')
    subs = parser.add_subparsers(dest='command', required=True)
    build = subs.add_parser('build', help='Index original guide and optionally produce non-authoritative catalog candidates')
    build.add_argument('--source', type=Path, required=True)
    build.add_argument('--out', type=Path, required=True)
    build.add_argument('--catalog', type=Path, help='Optional existing catalog JSON array/object; read only')
    look = subs.add_parser('lookup', help='Search extracted candidates by name or quest')
    look.add_argument('--index', type=Path, required=True)
    look.add_argument('--term', required=True)
    look.add_argument('--limit', type=int, default=20)
    args = parser.parse_args(argv)
    try:
        if args.command == 'build':
            idx = index_document(args.source)
            candidates = crosswalk_candidates(idx, args.catalog) if args.catalog else None
            write_outputs(args.out, idx, candidates)
            print('✓ Indexed', idx['source_total_lines'], 'source lines; SHA256', idx['source_sha256'][:16])
            for name in ('chapters','guide_sections','quest_candidates','material_mentions','map_mentions','precondition_candidates','insignia_mentions'):
                print(f'  {name}: {len(idx[name])}')
            if candidates is not None:
                print('  canonical candidates:', len(candidates), '(review only; no group assigned)')
            print('✓ Output:', args.out.resolve())
        else:
            if args.limit < 1:
                raise ValueError('--limit must be >= 1')
            lookup(args.index, args.term, args.limit)
    except (ValueError, OSError, json.JSONDecodeError) as e:
        print('ERROR:', e, file=sys.stderr)
        return 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
