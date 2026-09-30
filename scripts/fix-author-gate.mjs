import fs from 'node:fs';

const path='author-7c4f1e.html';
let html=fs.readFileSync(path,'utf8');

html=html.replace(
  '#authorGate{min-height:100vh;display:grid;place-items:center;background:#f7f5ef;padding:24px;box-sizing:border-box}',
  '#authorGate{min-height:100vh;display:grid;place-items:center;background:#f7f5ef;padding:24px;box-sizing:border-box}#authorGate[hidden]{display:none!important}'
);

const oldHandler="form.addEventListener('submit',async e=>{e.preventDefault();error.textContent='';const h=await digest(input.value);if(h!==HASH){error.textContent='密碼不正確。';input.select();return}sessionStorage.setItem(SESSION,'1');input.value='';await unlock()});";
const newHandler="form.addEventListener('submit',async e=>{e.preventDefault();error.textContent='驗證中…';try{const h=await digest(input.value);if(h!==HASH){error.textContent='密碼不正確。';input.select();return}sessionStorage.setItem(SESSION,'1');input.value='';await unlock();if(!workspace.hidden)error.textContent='';}catch(err){console.error(err);error.textContent='驗證或載入失敗，請重新整理後再試。';}});";

if(html.includes(oldHandler)) html=html.replace(oldHandler,newHandler);
else if(!html.includes("error.textContent='驗證中…'")) throw new Error('Author gate handler pattern not found');

fs.writeFileSync(path,html);
console.log('Author gate login flow patched.');