import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
test("source extraction reads Sites content after main heading, excludes navigation and retains linked images", () => {
  const code = `import importlib.util\nspec=importlib.util.spec_from_file_location('farm','scripts/import-farm-sources.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\np=m.read_html('<nav>Unrelated Class Name</nav><div class="tyJCtd" role="main"><h1>Guide</h1></div><div class="tyJCtd"><p>Actual Equipment</p><a href="https://aqwwiki.wikidot.com/actual-equipment">Wiki</a><img src="https://source.invalid/guide.png"></div>','sites')\nassert p.text()=='Guide\\nActual EquipmentWiki',repr(p.text())\nassert len(p.images)==1 and len(p.links)==1\nassert 'Unrelated' not in p.text()\nassert m.canon('https://www.google.com/url?q=https%3A%2F%2Faqwwiki.wikidot.com%2Fblade-of-awe')=='https://aqwwiki.wikidot.com/blade-of-awe'\n`;
  execFileSync("python3", ["-B", "-c", code], {
    env: { ...process.env, PYTHONPYCACHEPREFIX: "/tmp/aqw-farm-python-cache" },
  });
});
test("offline source replay preserves Wiki evidence without ignored HTTP caches or network", () => {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "aqw-farm-source-replay-"),
  );
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(root, "content-sources/farm/import"), {
    recursive: true,
  });
  fs.copyFileSync(
    "scripts/import-farm-sources.py",
    path.join(root, "scripts/import-farm-sources.py"),
  );
  for (const f of [
    "source-extracts.json",
    "wiki-records.json",
    "source-access.json",
  ])
    fs.copyFileSync(
      "content-sources/farm/import/" + f,
      path.join(root, "content-sources/farm/import", f),
    );
  const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
  const before = read("content-sources/farm/import/wiki-records.json");
  execFileSync(
    "python3",
    [
      "-B",
      path.join(root, "scripts/import-farm-sources.py"),
      "--offline",
      "--wiki-limit",
      "0",
    ],
    {
      env: {
        ...process.env,
        PYTHONPYCACHEPREFIX: "/tmp/aqw-farm-python-cache",
      },
      timeout: 30000,
    },
  );
  assert.deepEqual(
    read(path.join(root, "content-sources/farm/import/wiki-records.json")),
    before,
  );
  assert.deepEqual(
    read(path.join(root, "content-sources/farm/import/source-access.json"))
      .wikiPending,
    read("content-sources/farm/import/source-access.json").wikiPending,
  );
});

// Real Wiki bodies begin with self-closing membership/AC badges. Losing the
// containing div here silently removed every subsequent technical field.
test("Wiki extraction survives XHTML badges and line breaks without absorbing sidebar/footer", () => {
  const code = `import importlib.util
spec=importlib.util.spec_from_file_location('farm','scripts/import-farm-sources.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
p=m.read_html('<nav>Sidebar</nav><div id="page-content"><img src="badge.png" /><p><strong>Location:</strong> Museum<br /><strong>Rarity:</strong> Epic Rarity<br />Required Level: 80</p><img src="item.png" /></div><footer>Not item data</footer>','wiki')
assert 'Location: Museum' in p.text(),repr(p.text())
assert 'Rarity: Epic Rarity' in p.text(),repr(p.text())
assert 'Required Level: 80' in p.text()
assert 'Sidebar' not in p.text() and 'Not item data' not in p.text()
assert len(p.images)==2
`;
  execFileSync("python3", ["-B", "-c", code]);
});
test("Docs refresh preserves cached text/dates on failure and replaces it with complete HTML evidence on success", () => {
  const code = `import importlib.util
spec=importlib.util.spec_from_file_location('farm','scripts/import-farm-sources.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
old={'text':'Prior complete text','lastChecked':'original date','format':'text-only-live'}
pages={m.B:old.copy()};failures=[{'url':m.W+'/pending','reason':'timeout'}]
def fail(*args):raise TimeoutError('controlled HTML timeout')
m.refresh_document(pages,failures,fail)
assert pages[m.B]==old
assert len(failures)==2 and 'controlled HTML timeout' in failures[1]['reason']
assert failures[1]['attemptedAt']!='original date'
html='<p>Item</p><table><tr><td>Material ×5</td></tr></table><a href="https://aqwwiki.wikidot.com/item">Wiki</a><img src="image.png" />'
m.refresh_document(pages,failures,lambda *args:html)
assert pages[m.B]['format']=='html'
assert 'Material ×5' in pages[m.B]['text'] and len(pages[m.B]['links'])==1 and len(pages[m.B]['images'])==1
assert len(failures)==1 and failures[0]['url'].endswith('/pending')
`;
  execFileSync("python3", ["-B", "-c", code]);
});

test("shared Wiki cache reuse requires observed exact URL, tagged body and matching canonical entity", () => {
  const code = `import importlib.util,tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('farm','scripts/import-farm-sources.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as d:
 root=Path(d);directory=root/'content-sources/class-acquisition';directory.mkdir(parents=True)
 body='<link rel="canonical" href="https://aqwwiki.wikidot.com/item"><div id="page-content">Evidence</div><div class="page-tags">armor</div>'
 (directory/'item.html').write_text(body)
 (directory/'other.html').write_text(body)
 (directory/'challenge.html').write_text('<div id="page-content">Access denied</div>')
 urls={m.W+'/item',m.W+'/other',m.W+'/challenge'}
 bodies,paths=m.reuse_wiki_caches(urls,root)
 assert set(bodies)=={m.W+'/item'},repr(bodies)
 assert paths[m.W+'/item']=='content-sources/class-acquisition/item.html'
 assert m.reuse_wiki_caches({m.W+'/unobserved'},root)==({}, {})
`;
  execFileSync("python3", ["-B", "-c", code]);
});
