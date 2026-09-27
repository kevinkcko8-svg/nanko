(()=>{'use strict';
const base=document.body.dataset.base||'./';
// Retain links shared by the previous hash-routed site.
function redirectLegacy(){if(location.hash.startsWith('#/')){
  const [route,query='']=location.hash.slice(2).split('?');
  const [kind,id]=route.split('/');
  const section=new URLSearchParams(query).get('section');
  const safeId=id&&/^[a-zA-Z0-9_-]+$/.test(id);
  let target=kind==='contents'?'contents.html':kind==='sources'?'sources.html':kind==='article'&&safeId?`articles/${id}/`:kind==='reference'&&safeId?`sources/${id}/`:'index.html';
  if(section)target+='#sec-'+encodeURIComponent(section);
  location.replace(base+target);return true;
}return false;}
if(redirectLegacy())return;
window.addEventListener('hashchange',redirectLegacy);
const status=document.getElementById('status');let timer;
function announce(text){status.textContent=text;status.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>status.classList.remove('visible'),4000);}
document.querySelectorAll('[data-copy-link]').forEach(button=>button.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(location.href);announce('本篇連結已複製');}
  catch{window.prompt('請複製以下連結：',location.href);}
}));
const input=document.getElementById('site-search');if(!input)return;
const results=document.getElementById('search-results'),summary=document.getElementById('search-summary');
let indexPromise,sequence=0;
const fold=s=>s.normalize('NFKC').toLocaleLowerCase();
input.addEventListener('input',async()=>{
  const current=++sequence,q=input.value.trim();results.replaceChildren();
  if(!q){summary.textContent='輸入關鍵字，尋找相關段落。';return;}
  summary.textContent='正在搜尋…';
  try{
    if(!indexPromise)indexPromise=fetch(base+'assets/search-index.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(e=>{indexPromise=null;throw e;});
    const index=await indexPromise;if(current!==sequence)return;
    const words=fold(q).split(/\s+/),matches=index.filter(x=>words.every(w=>fold(x.title+' '+x.section+' '+x.text).includes(w)));
    summary.textContent=matches.length?`找到 ${matches.length} 個段落${matches.length>30?'，顯示前 30 筆；可加上關鍵字縮小範圍':''}。`:'沒有符合的段落，試試人名、事件或古籍名稱。';
    for(const x of matches.slice(0,30)){
      const a=document.createElement('a');a.className='search-result';a.href=base+x.url;
      const label=document.createElement('small');label.textContent=x.type+' · '+x.title;
      const title=document.createElement('strong');title.textContent=x.section;
      const snippet=document.createElement('p');const text=x.text.replace(/\s+/g,' '),pos=fold(text).indexOf(words[0]),start=Math.max(0,pos-35);
      snippet.textContent=(start?'…':'')+text.slice(start,start+160)+(text.length>start+160?'…':'');
      a.append(label,title,snippet);results.append(a);
    }
  }catch{if(current===sequence)summary.textContent='搜尋索引暫時無法載入，請重新輸入重試，或由完整目錄閱讀。';}
});
})();
