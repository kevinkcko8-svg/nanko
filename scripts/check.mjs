import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const entries=JSON.parse(read('site-data.json')).dynasties.flatMap(d=>d.chronicles.flatMap(c=>c.entries));
const files=['index.html','contents.html','sources.html','community.html','about.html',...entries.flatMap(e=>[`articles/${e.id}/index.html`,`sources/${e.id}/index.html`])];
const unescape=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
for(const file of files){
 const html=read(file);
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file+' must have one h1');
 assert.match(html,/<link rel="canonical"/);
 const ld=html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);JSON.parse(ld[1]);
 for(const [,raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const url=new URL(unescape(raw),'https://test.local/'+file);
  if(url.origin!=='https://test.local')continue;
  let target=decodeURIComponent(url.pathname).slice(1);if(target.endsWith('/'))target+='index.html';
  assert.ok(fs.existsSync(path.join(root,target)),`${file}: missing ${target}`);
  if(url.hash&&target.endsWith('.html'))assert.ok(read(target).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`${file}: missing anchor ${url.hash}`);
 }
}
for(const e of entries){
 const body=read(`articles/${e.id}/index.html`),sources=read(`sources/${e.id}/index.html`);
 const actual=[...body.matchAll(/<div class="prose">(.*?)<\/div>/gs)].map(x=>unescape(x[1]));
 assert.deepEqual(actual,e.sections.map(s=>s.body??''),e.id+'正文完整保留');
 const originals=e.sections.flatMap(s=>(s.sources||[]).slice().sort((a,b)=>a.number-b.number).map(x=>x.body??''));
 const rendered=[...sources.matchAll(/<div class="prose source-prose">(.*?)<\/div>/gs)].map(x=>unescape(x[1]));
 assert.deepEqual(rendered,originals,e.id+'史料完整保留');
}
const index=JSON.parse(read('assets/search-index.json'));
assert.equal(index.length,entries.reduce((n,e)=>n+e.sections.reduce((m,s)=>m+1+(s.sources||[]).length,0),0));
assert.equal((read('sitemap.xml').match(/<loc>/g)||[]).length,files.length);
assert.match(read('editor.html'),/noindex,nofollow/);
console.log(`PASS: ${files.length} pages, all local links/anchors, exact article/source preservation, ${index.length} searchable passages.`);
