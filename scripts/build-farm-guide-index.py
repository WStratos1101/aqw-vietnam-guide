"""Build a compact line index for the supplied Farming Item Guide."""
import csv, hashlib, json, re
from pathlib import Path
root = Path('content-sources/farm/manual-guide')
source = root / 'FARMING_ITEM_GUIDE_SOURCE.txt'
text = source.read_text()
lines = text.splitlines()
chapters = []
for n, line in enumerate(lines, 1):
    match = re.match(r'^\s*([IVX]+)\.\s+(.+?)\s*$', line)
    if match and match.group(1) in {'I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII'}:
        chapters.append({'chapter': match.group(1), 'title': match.group(2), 'startLine': n})
for i, chapter in enumerate(chapters):
    chapter['endLine'] = chapters[i + 1]['startLine'] - 1 if i + 1 < len(chapters) else len(lines)
section_path = Path('content-sources/farm/manual-faction-guide/guide_sections.csv')
sections = []
with section_path.open(newline='') as f:
    for row in csv.DictReader(f):
        sections.append({
            'groupId': row['group_id'], 'title': row['guide_title'],
            'startLine': int(row['start_line']), 'endLine': int(row['end_line']),
            'chapter': row['source_chapter'], 'equipmentRecord': row['is_equipment_record'].lower() == 'true',
        })
titles, quests = [], []
for n, line in enumerate(lines, 1):
    value = line.strip()
    if not value:
        continue
    if re.match(r'^(?:\d+\.\s+|[A-Z][^.!?]{3,90}(?:Guide|Walkthrough)\s*$)', value):
        titles.append({'line': n, 'text': value})
    if re.search(r'\bquest\b', value, re.I) and (re.match(r'^(?:[-→◆\d]|[A-Z])', value) or ':' in value):
        quests.append({'line': n, 'text': value})
out = {
    'schemaVersion': 1,
    'sourceFile': str(source),
    'lineCount': len(lines),
    'sha256': hashlib.sha256(text.encode()).hexdigest(),
    'chapters': chapters,
    'guideSections': sections,
    'titleLines': titles,
    'questMentionLines': quests,
}
(root / 'guide-index.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
print(f"indexed {len(lines)} lines, {len(chapters)} chapters, {len(sections)} guide sections, {len(titles)} headings, {len(quests)} quest mentions")
