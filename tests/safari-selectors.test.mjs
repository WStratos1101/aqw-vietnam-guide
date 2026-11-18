import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {Window} from 'happy-dom';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {isComingSoon} from '../src/lib/site-feature-access.mjs';

const source=ts.createSourceFile('safari.mjs',fs.readFileSync('tests/safari.mjs','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const calls=[];
function visit(node){
 if(ts.isCallExpression(node)&&['execute','click','find','waitFor'].includes(node.expression.getText(source))&&node.arguments[0]&&ts.isStringLiteralLike(node.arguments[0])){
  const script=node.arguments[0].text,args=node.arguments[1];
  assert.doesNotThrow(()=>new Function(script),`Invalid browser JavaScript: ${script}`);
  assert.ok(!/a\[href[\^*$|~]?=/.test(script),'CSS attribute selectors must be sent as WebDriver arguments');
  if(args&&ts.isArrayLiteralExpression(args)&&args.elements.length&&ts.isStringLiteralLike(args.elements[0])&&/a\[href/.test(args.elements[0].text))calls.push({script,args:[args.elements[0].text]});
 }
 ts.forEachChild(node,visit);
}
visit(source);
const run=(document,{script,args})=>new Function('document',`return function(){${script}}`)(document)(...args);
const get=selector=>{const call=calls.find(c=>c.args[0]===selector);assert.ok(call,selector);return JSON.parse(JSON.stringify(call));};

test('all five Safari href selectors are JSON arguments, not nested JavaScript string literals',()=>{
 assert.equal(calls.length,5);
 for(const call of calls){assert.match(call.script,/querySelector(?:All)?\(arguments\[0\]\)/);assert.equal(typeof call.args[0],'string');}
});

test('both declared feature gates render the exact recovery link targeted by Safari',async()=>{
 const jsx=fs.readFileSync('src/features/ComingSoonPage.tsx','utf8');
 const compiled=ts.transpileModule(jsx,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};new Function('require','exports',compiled)(createRequire(import.meta.url),exports);
 const html=renderToStaticMarkup(createElement(exports.ComingSoonPage));
 const window=new Window();
 try{
  for(const route of ['/huong-dan','/class/thu-vien']){
   assert.equal(isComingSoon(route),true);
   window.document.body.innerHTML=html;
   assert.ok(window.document.querySelector('.coming-soon-page'));
   assert.equal(window.document.querySelector('h1').textContent,'Thông tin đang được cập nhật');
   const link=run(window.document,get('.coming-soon-page a[href="/"]'));
   assert.equal(link.getAttribute('href'),'/');assert.equal(link.textContent,'Về trang chủ');
  }
 }finally{await window.happyDOM.close();}
});

test('TOC, mobile navigation, Ultra link and filtered document counts retain CSS semantics',async()=>{
 const window=new Window();
 try{
  const document=window.document;
  document.body.innerHTML='<a href="#progress-title">TOC</a><nav id="mobile-nav"><a href="/class">Class</a></nav><a href="/ultra-boss/ultra-dage">Dage</a><article></article><div class="sources"><a href="https://docs.google.com/document/source">Source</a></div>';
  for(const selector of ['a[href="#progress-title"]','#mobile-nav a[href="/class"]','a[href="/ultra-boss/ultra-dage"]'])assert.ok(run(document,get(selector)),selector);
  const count=get('article a[href*="docs.google.com/document"]:not(.sources a)');
  assert.equal(run(document,count),0);
  document.querySelector('article').insertAdjacentHTML('beforeend','<a href="https://docs.google.com/document/body">Unexpected external body link</a>');
  assert.equal(run(document,count),1,'the assertion still detects unwanted document links');
 }finally{await window.happyDOM.close();}
});

test('old home-link script demonstrates the division/NaN failure that arguments prevent',()=>{
 let selector;
 run({querySelector(value){selector=value;return null;}},{script:'return document.querySelector(".coming-soon-page a[href="/"]")',args:[]});
 assert.ok(Number.isNaN(selector));
});

test('Class selectors and the wait helper forward quoted aria-label values as arguments',async()=>{
 const selected=[];let helper;
 function collect(node){
  if(ts.isFunctionDeclaration(node)&&node.name?.text==='waitFor')helper=node.getText(source);
  if(ts.isCallExpression(node)&&node.arguments[0]&&ts.isStringLiteralLike(node.arguments[0])){
   const index=node.expression.getText(source)==='waitFor'?2:1,args=node.arguments[index];
   if(args&&ts.isArrayLiteralExpression(args)&&ts.isStringLiteralLike(args.elements[0])&&args.elements[0].text.includes('aria-label='))selected.push({script:node.arguments[0].text,args:[args.elements[0].text],wait: index===2});
  }ts.forEachChild(node,collect);
 }collect(source);assert.equal(selected.length,3);
 const window=new Window();
 try{
  window.document.body.innerHTML='<select aria-label="Vai trò"><option value="Support" selected>Support</option></select><div class="class-card">Support</div><div class="class-inspection-tabs"><button aria-label="CÁCH LẤY CLASS">Acquisition</button></div>';
  for(const call of selected){
   if(call.wait){
    const wait=new Function('execute','pause',helper+';return waitFor;')(async(script,args)=>run(window.document,{script,args}),()=>{throw Error('Wait lost its selector arguments');});
    await wait(call.script,'Support role filter failed',call.args);
   }else assert.ok(run(window.document,call));
  }
 }finally{await window.happyDOM.close();}
});
