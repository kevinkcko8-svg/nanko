import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const targets=['index.html','contents.html','sources.html','community.html','about.html'];
for(const dir of ['articles','sources']){
  const base=path.join(root,dir);
  if(!fs.existsSync(base)) continue;
  for(const name of fs.readdirSync(base)){
    const file=path.join(base,name,'index.html');
    if(fs.existsSync(file)) targets.push(path.relative(root,file).replaceAll('\\','/'));
  }
}

for(const rel of targets){
  const file=path.join(root,rel);
  let html=fs.readFileSync(file,'utf8');
  const depth=rel.split('/').length-1;
  const prefix='../'.repeat(depth);
  html=html.replace(/<a href="[^"]*editor\.html">作者工作台<\/a>/g,`<a href="${prefix}author-7c4f1e.html">作者工作台</a>`);
  if(!html.includes('author-7c4f1e.html')){
    html=html.replace(/(<div class="footer-links">)([\s\S]*?)(<\/div><\/footer>)/,`$1$2<a href="${prefix}author-7c4f1e.html">作者工作台</a>$3`);
  }
  fs.writeFileSync(file,html);
}
console.log(`Author workspace link applied to ${targets.length} public pages.`);
