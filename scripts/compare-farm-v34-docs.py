import json,re,unicodedata,difflib,hashlib,pathlib
root=pathlib.Path('Update/_offline-staging/20261117-081737');old=json.load(open(root/'docs-offline-comparison.json'))
a_path=pathlib.Path(old['providedSource']['file']);b_path=pathlib.Path(old['cachedExport']['file']);a=a_path.read_text();record=json.load(open(b_path));b=record['body']
assert hashlib.sha256(a_path.read_bytes()).hexdigest()==old['providedSource']['sha256']
assert hashlib.sha256(b.encode()).hexdigest()==record['sha256']
def norm(s):
 s=unicodedata.normalize('NFKC',s).translate(str.maketrans({'“':'"','”':'"','‘':"'",'’':"'",'–':'-','—':'-','…':'...','\ufeff':'','\u200b':''}))
 s=re.sub(r'(?m)^\s*\*\s+', '', s)
 return re.sub(r'\s+',' ',s).strip()
# Tokens compare complete prose across arbitrary line wraps/empty paragraphs.
aw,bw=norm(a).split(),norm(b).split();diff=difflib.SequenceMatcher(None,aw,bw,autojunk=False);blocks=[]
for kind,i,j,k,l in diff.get_opcodes():
 if kind=='equal':continue
 before=' '.join(aw[i:j]);after=' '.join(bw[k:l]);context=' '.join(aw[max(0,i-22):i]);combined=before+' '+after
 categories=[]
 if re.search(r'Class Obtain Guide|Class Farming|More Classes',combined,re.I):categories.append('class-target')
 if re.search(r'×\s*\d|\bx\d|[\d,]+\s*(Gold|ACs|Insignia)|\d+\s*(ngày|tuần|lần)',combined,re.I):categories.append('quantity-or-duration')
 if re.search(r'quest|QUEST|nhiệm vụ',combined):categories.append('quest-step')
 if re.search(r'/join|Screen|route|cách |merge|shop',combined,re.I):categories.append('route')
 if re.search(r'nguyên liệu|Material|drop|Insignia|Token|Voucher',combined,re.I):categories.append('material')
 if re.search(r'set|Armor|Helm|Cape|Blade|Sword|Class',combined):categories.append('item-or-family-target')
 blocks.append({'id':len(blocks)+1,'kind':kind,'beforeTokenRange':[i,j],'afterTokenRange':[k,l],'sectionContext':context,'before':before,'after':after,'categories':categories or ['prose-or-content'],'status':'SEMANTIC_CONTENT_DELTA_REQUIRES_SOURCE_RECONCILIATION'})
def headings(s):return [norm(l) for l in s.splitlines() if re.search(r'Class Obtain Guide',l,re.I) and len(l.strip())<180 and not re.search(r'xem chi tiết|tại ',l,re.I)]
ah,bh=headings(a),headings(b)
report={'schemaVersion':1,'status':'DONE_NORMALIZED_TEXT_COMPARISON','snapshotA':{'file':str(a_path),'sha256':hashlib.sha256(a_path.read_bytes()).hexdigest(),'lines':len(a.splitlines())},'snapshotB':{'file':str(b_path),'sha256':record['sha256'],'lines':len(b.splitlines()),'freshness':'Retained cached export snapshot; NOT current live Docs'},'rawChangedBlocks':old['changedBlocks'],'normalization':['Unicode NFKC','typographic quote/dash normalization','all whitespace/line-wrap/empty-paragraph normalization'],'normalizedTokenChanges':len(blocks),'tokensA':len(aw),'tokensB':len(bw),'addedClassHeadings':[s for s in bh if s not in ah],'removedClassHeadings':[s for s in ah if s not in bh],'categoryCounts':{c:sum(c in r['categories'] for r in blocks) for c in sorted(set(c for r in blocks for c in r['categories']))},'changes':blocks,'note':'Changed spans are semantic text candidates, not item counts. Categories may overlap. No automatic catalog import or source freshness claim.'}
pathlib.Path('Update/FARM_V3_4_DOCS_SEMANTIC_DELTA.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print({k:v for k,v in report.items() if k not in ['changes','normalization','snapshotA','snapshotB']})
