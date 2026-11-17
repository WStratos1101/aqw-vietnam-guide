import test from 'node:test';
import assert from 'node:assert/strict';
import { validateImport } from '../scripts/qa-farm-local.mjs';
const fixture=()=>({bundle:{fingerprint:{source:'hash'},playwrightVersion:'1.65.0',exitCode:0},result:{kind:'farm',status:'passed',phase:'ui',browser:'chromium',profile:'full',finishedAt:'2026-11-16T00:00:00Z',errors:[],screenshots:['shot.png'],cases:[390,768,1024,1440].map(width=>({width,status:'passed',consoleErrors:[],steps:[{name:'source-backed step counts 1/2/3/4/6 and farm mode reset',status:'passed'},{name:'no console, hydration or page errors',status:'passed'}]}))}});
test('local import requires full UI completion and matching source, never launch-only/static/partial PASS',()=>{
  const {bundle,result}=fixture();assert.equal(validateImport(bundle,result,{source:'hash'}),true);
  for(const mutate of [r=>r.profile='steps',r=>r.status='browser_launch_blocked',r=>r.cases.pop(),r=>r.cases[0].status='running',r=>r.cases[0].steps.pop(),r=>r.cases[0].consoleErrors.push('error'),r=>r.errors.push('failure'),r=>r.screenshots=[],r=>r.browser='webkit']){
    const f=fixture();mutate(f.result);assert.throws(()=>validateImport(f.bundle,f.result,{source:'hash'}));
  }
  assert.throws(()=>validateImport(bundle,result,{source:'changed'}));
  assert.throws(()=>validateImport({...bundle,exitCode:1},result,{source:'hash'}));
});
