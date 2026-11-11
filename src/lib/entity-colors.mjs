const rgb=h=>h.replace('#','').match(/../g).map(n=>parseInt(n,16));
const hex=c=>'#'+c.map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');
const luminance=h=>rgb(h).map(n=>{const s=n/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}).reduce((s,n,i)=>s+n*[.2126,.7152,.0722][i],0);
export function contrast(a,b){const l=[luminance(a),luminance(b)].sort((a,b)=>b-a);return(l[0]+.05)/(l[1]+.05);}
export function accessibleAccent(color,background,mode){const c=/^#[0-9a-f]{6}$/i.test(color)?color:'#a65bfa';const target=mode==='light'?0:255;for(let t=0;t<=1;t+=.025){const next=hex(rgb(c).map(n=>n*(1-t)+target*t));if(contrast(next,background)>=4.5)return next;}return mode==='light'?'#101113':'#f5f0ff';}
export function classColors(profile){const themes=[[/void-highlord/i,'#c295ed'],[/legion-revenant/i,'#79c6e3'],[/archpaladin/i,'#e5bf75'],[/lord-of-order/i,'#ecd488'],[/dragon-of-time/i,'#ef9c8d'],[/chaos-avenger/i,'#b7a0ef'],[/^calendar-|archivist-of-time/i,'#81d6d9']];const seed=themes.find(([p])=>p.test(profile.id))?.[1]||profile.accent;return{dark:accessibleAccent(seed,'#130d1d','dark'),light:accessibleAccent(seed,'#f4f4f0','light')};}
