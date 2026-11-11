import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Window} from 'happy-dom';
import {build} from 'esbuild';
import {act,createElement} from 'react';
const css=fs.readFileSync('src/styles/themes.css','utf8');
test('Chaos palette is owned by dark source tokens; Light palette is unchanged',()=>{
 const dark=css.match(/:root\[data-theme=dark\]\{([\s\S]*?)\}/)[1];
 for(const [name,value]of Object.entries({ground:'#08050D',panel:'#130D1D',raised:'#20132F',line:'#4B3265',accent:'#A65BFA',hover:'#D2A5FF',focus:'#C58BFF',text:'#F5F0FF',secondary:'#B9AACD'}))assert.ok(dark.includes(`--theme-${name}:${value}`),name);
 const light=css.match(/:root\[data-theme=light\]\{[^}]*\}/)[0];
 assert.equal(light,fs.readFileSync('tests/fixtures/light-theme-palette.css','utf8'));
 assert.ok(!light.includes('--chaos-'));
 assert.ok(!fs.readFileSync('index.html','utf8').includes('AQW CHAOS THEME V2'));
});
test('Theme toggle changes root and persists selection through remount',async()=>{
 const win=new Window({url:'http://localhost/'});
 for(const k of ['window','document','HTMLElement','Node','Event','MouseEvent','localStorage'])globalThis[k]=k==='window'?win:win[k];
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const {createRoot}=await import('react-dom/client');
 const compiled=await build({stdin:{contents:"export {ThemeToggle} from './src/components/ThemeToggle';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'esm',packages:'external'});
 fs.writeFileSync('artifacts/qa/chaos-theme/toggle.mjs',compiled.outputFiles[0].text);
 const {ThemeToggle}=await import('../artifacts/qa/chaos-theme/toggle.mjs');
 document.documentElement.dataset.theme='dark';const host=document.createElement('div');document.body.append(host);let root=createRoot(host);
 await act(async()=>root.render(createElement(ThemeToggle)));
 await act(async()=>host.querySelector('button').click());assert.equal(document.documentElement.dataset.theme,'light');assert.equal(localStorage.getItem('aqw-theme'),'light');
 await act(async()=>root.unmount());root=createRoot(host);await act(async()=>root.render(createElement(ThemeToggle)));assert.match(host.querySelector('button').getAttribute('aria-label'),/giao diện tối/);
 await act(async()=>host.querySelector('button').click());assert.equal(document.documentElement.dataset.theme,'dark');assert.equal(localStorage.getItem('aqw-theme'),'dark');await act(async()=>root.unmount());win.close();
});
