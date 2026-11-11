/* AQW Vietnam Collectors - runtime compatibility adapter for unknown header markup.
   No React root replacements; only attaches a CSS marker to a matching header brand.
   ACs coloring: a standalone ACs element receives a CSS marker; a short price-only
   text node ("2,000 ACs") is wrapped to color just the currency suffix. */
(() => {
  'use strict';
  const BRAND_RE = /\bAQW\b[\s\S]{0,30}\bVietnam\s+Guide\b/i;
  const GOLD_RE = /\bACs\b/i;
  const SELECTORS='header a, nav a, header [role="link"], [class*="Header"] a, [class*="header"] a, a[href="/"]';
  let seenBrand=false, warned=false, scheduled=false;
  function brand() {
    const nodes=[...new Set(document.querySelectorAll(SELECTORS))];
    const match=nodes.find(el=>{
      const t=(el.textContent||'').replace(/\s+/g,' ').trim();
      return t.length>0 && t.length<100 && BRAND_RE.test(t);
    });
    if(match) {
      if(!match.classList.contains('aqw-collectors-header-brand')){
        match.classList.add('aqw-collectors-header-brand');
        if(!match.hasAttribute('aria-label'))match.setAttribute('aria-label','AQW Vietnam Collectors — Trang chủ');
      }
      seenBrand=true;
    }
  }
  function currency() {
    // Most sites already render the currency suffix as a dedicated element.
    for(const el of document.querySelectorAll('span, strong, b, small, em, label')) {
      if(el.children.length||el.classList.contains('aqw-ac-currency-gold'))continue;
      if(/^\s*ACs\s*$/i.test(el.textContent||''))el.classList.add('aqw-ac-currency-gold');
    }
    // For price-only text such as "2,000 ACs", color the ACs suffix alone.
    // Never split general paragraphs, editable content, interactive children, or code.
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const eligible=[];
    while(walker.nextNode()){
      const t=walker.currentNode,el=t.parentElement;
      if(!el||el.closest('script, style, pre, code, textarea, [contenteditable="true"], .aqw-ac-currency-gold'))continue;
      if(el.children.length!==0 || (el.childNodes.length!==1))continue;
      const value=t.nodeValue||'';
      if(value.length>42||!GOLD_RE.test(value))continue;
      const m=value.match(/^(\s*[\d][\d., ]*\s+)(ACs)(\s*)$/i);
      if(m)eligible.push({el,before:m[1],currency:m[2],after:m[3]});
    }
    for(const {el,before,currency:label,after} of eligible){
      if(el.children.length)continue;
      const span=document.createElement('span');span.className='aqw-ac-currency-gold';span.textContent=label;
      el.replaceChildren(document.createTextNode(before),span,document.createTextNode(after));
    }
  }
  function run(){scheduled=false;brand();currency();}
  function schedule(){if(scheduled)return;scheduled=true;setTimeout(run,120);}
  const start=()=>{
    schedule();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>{if(!seenBrand&&!warned){warned=true;console.warn('[AQW Brand] Khong tim thay header logo "AQW Vietnam Guide"; can cap nhat selector theo source.');}},2500);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
