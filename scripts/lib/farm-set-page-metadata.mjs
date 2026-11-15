import fs from "node:fs";
import {Window} from "happy-dom";
const window=new Window({settings:{disableJavaScriptEvaluation:true,disableCSSFileLoading:true,disableJavaScriptFileLoading:true}}),parser=new window.DOMParser();
const sources=JSON.parse(fs.readFileSync(0,"utf8"));
const result=sources.map(source=>{
 const doc=parser.parseFromString(fs.readFileSync(source.sourceFile,"utf8"),"text/html");
 return {url:source.url,name:doc.querySelector("#page-title")?.textContent.trim(),
  tags:[...doc.querySelectorAll(".page-tags a")].map(a=>a.textContent.trim()),
  crumbs:[...doc.querySelectorAll("#breadcrumbs a")].map(a=>new URL(a.getAttribute("href"),source.url).pathname),
  images:[...doc.querySelectorAll("#page-content img.image")].map(img=>new URL(img.getAttribute("src"),source.url).href).filter(url=>/\.(?:png|jpe?g|gif|webp)(?:$|\?)/i.test(url)&&!url.includes("/image-tags/"))};
});
process.stdout.write(JSON.stringify(result));await window.happyDOM.close();
