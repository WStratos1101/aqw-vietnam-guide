#!/usr/bin/env python3
"""Offline-only recovery of exact canonical item detail caches. Does not import items or fetch URLs."""
import importlib.util,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('reader',ROOT/'scripts/import-farm-sources.py')
reader=importlib.util.module_from_spec(spec);spec.loader.exec_module(reader)
items=json.loads((ROOT/'src/content/farm/catalog-v2.generated.json').read_text())['items']
records=json.loads((ROOT/'content-sources/farm/import/wiki-records.json').read_text())
known={r['wikiUrl'] for r in records}
bodies,paths=reader.reuse_wiki_caches({i['wikiUrl'] for i in items if i['wikiUrl'] not in known},ROOT)
recovered=[]
for url,body in sorted(bodies.items()):
    page=reader.read_html(body,'wiki')
    recovered.append({'wikiUrl':url,'text':page.text(),'lastChecked':None,'cachePath':paths[url],
        'tags':sorted(set(re.findall(r'/system:page-tags/tag/([^#"/]+)',body))),
        'sourceMethod':'exact_canonical_existing_item_cache','scope':'header metadata only; no new identity/route/recipe'})
(ROOT/'content-sources/farm/import/detail-wiki-records.json').write_text(json.dumps(recovered,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'existingCanonicalItems':len(items),'supplementalDetailCaches':len(recovered)}))
