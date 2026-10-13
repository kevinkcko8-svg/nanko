import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'_site');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const name of ['index.html','contents.html','sources.html','community.html','about.html','sitemap.xml','timeline.html','timeline-data.json','googleee692dbd7863a3c7.html','assets','articles','sources','author-7c4f1e.html','app.js','data.js','site-data.json','dev-log.json','styles.css']){
  fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
}
// Rebuild the no-JavaScript timeline fallback from the latest published JSON on every deployment.
const timeline=JSON.parse(fs.readFileSync(path.join(root,'timeline-data.json'),'utf8'));
const entries=timeline.entries||{};
const encode=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const characters=s=>[...String(s||'').replace(/\\s/g,'')].length;
const yearKeys=Object.keys(entries).map(Number).filter(n=>Number.isInteger(n)&&n!==0).sort((a,b)=>a-b);
const label=n=>n<0?'前'+(-n)+'年':n+'年';
const rows=yearKeys.map(n=>{const e=entries[n]||{};return '<tr><td>'+label(n)+'</td><td>'+encode(e.era)+'</td><td>'+encode(e.event)+'</td><td>'+characters(e.event)+'</td></tr>'}).join('');
const timelineFile=path.join(out,'timeline.html');
let timelineHtml=fs.readFileSync(timelineFile,'utf8');
if(!/<tbody id="timelineBody">[\\s\\S]*?<\\/tbody>/.test(timelineHtml))throw Error('Timeline fallback table not found');
timelineHtml=timelineHtml.replace(/<tbody id="timelineBody">[\\s\\S]*?<\\/tbody>/,'<tbody id="timelineBody">'+rows+'</tbody>');
timelineHtml=timelineHtml.replace(/(<p id="timelineWordStats"[^>]*>)[\\s\\S]*?(<\\/p>)/,'$1已收錄事件字數：'+Object.values(entries).reduce((sum,e)=>sum+characters(e?.event),0).toLocaleString('zh-TW')+' 字（不含空白及換行）$2');
fs.writeFileSync(timelineFile,timelineHtml);
fs.writeFileSync(path.join(out,'.nojekyll'),'');
if(!fs.existsSync(path.join(out,'timeline.html')) || !fs.existsSync(path.join(out,'timeline-data.json'))) throw Error('Timeline publication files are missing');
console.log('Prepared public site, timeline data, and password-gated author workspace.');
