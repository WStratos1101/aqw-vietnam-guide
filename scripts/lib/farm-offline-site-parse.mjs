import fs from 'node:fs';
import {Window} from 'happy-dom';
const files=JSON.parse(fs.readFileSync(0,'utf8')),window=new Window(),result=[];
for(const file of files){const record=JSON.parse(fs.readFileSync(file)),doc=new window.DOMParser().parseFromString(record.body,'text/html'),roots=[...doc.querySelectorAll('.tyJCtd')];result.push({url:record.url,tables:roots.flatMap(root=>[...root.querySelectorAll('table')].map(table=>table.textContent.replace(/\s+/g,' ').trim()))});}
process.stdout.write(JSON.stringify(result));await window.happyDOM.close();
