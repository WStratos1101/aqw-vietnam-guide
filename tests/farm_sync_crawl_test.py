import importlib.util, pathlib, tempfile, unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('crawler',pathlib.Path(__file__).resolve().parents[1]/'scripts/farm-sync-crawl.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
class CrawlTests(unittest.TestCase):
 def test_scope(self):
  base='https://sites.google.com/view/vncollector/adventure-quest-worlds/farming-guide'
  self.assertTrue(c.scoped(base+'/subpage',base))
  self.assertFalse(c.scoped(base+'-other',base))
  self.assertFalse(c.scoped('https://evil.example/'+base,base))
 def test_resume_and_tamper(self):
  with tempfile.TemporaryDirectory() as d, patch.object(c,'CACHE',pathlib.Path(d)), patch.object(c.reader,'fetch',return_value='<div class="tyJCtd">Guide <a href="/child">Child</a></div>') as fetch:
   row={'url':'https://sites.google.com/guide','kind':'site'}
   self.assertEqual(c.acquire(row)['status'],'fetched');c.acquire(row);self.assertEqual(fetch.call_count,1)
   p=next(pathlib.Path(d).rglob('*.json'));r=c.json.loads(p.read_text());r['body']='tampered';c.save(p,r)
   c.acquire(row);self.assertEqual(fetch.call_count,2)
 def test_auth_failure_not_success(self):
  with tempfile.TemporaryDirectory() as d, patch.object(c,'CACHE',pathlib.Path(d)), patch.object(c.reader,'fetch',return_value='<html>Sign in</html>'), patch.object(c.time,'sleep'):
   r=c.acquire({'url':'https://docs.google.com/export','kind':'docs'})
   self.assertEqual(r['status'],'blocked');self.assertEqual(len(r['attempts']),2)
if __name__=='__main__':unittest.main()
