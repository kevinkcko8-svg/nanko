import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'_site');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out);
for(const name of ['index.html','contents.html','sources.html','community.html','about.html','sitemap.xml','assets','articles','sources']){
  fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
}
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('Prepared public-only _site; author workspace files are excluded.');
