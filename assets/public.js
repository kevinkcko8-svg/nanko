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
// Shared visitor counter; inserted once on every public reading page.
(function(){const s=document.createElement('script');s.src=base+'assets/visitor-counts.js?v=20261028-1';document.head.append(s)})();
// Keep the timeline link visible even when generated HTML is rebuilt.
(function ensureTimelineNavigation(){
  const nav=document.querySelector('.header nav[aria-label="主導覽"]');
  if(!nav || nav.querySelector('a[href$="timeline.html"]'))return;
  const link=document.createElement('a');
  link.href=base+'timeline.html';
  link.textContent='年表';
  if(location.pathname.endsWith('/timeline.html'))link.setAttribute('aria-current','page');
  const community=Array.from(nav.querySelectorAll('a')).find(a=>a.getAttribute('href')?.includes('community.html'));
  nav.insertBefore(link,community||null);
})();

const status=document.getElementById('status');let timer;
function announce(text){status.textContent=text;status.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>status.classList.remove('visible'),4000);}
document.querySelectorAll('[data-copy-link]').forEach(button=>button.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(location.href);announce('本篇連結已複製');}
  catch{window.prompt('請複製以下連結：',location.href);}
}));
const poem=document.querySelector('.vertical-poem');
if(poem)poem.innerHTML='序時記事<br>逐事而書';

(function initTranslationModes(){
 const article=document.querySelector('.reader-layout article'),header=article?.querySelector('.article-header');
 const sections=Array.from(article?.querySelectorAll('.reading-section')||[]);
 if(!header||!sections.length)return;
 const controls=document.createElement('div');controls.className='translation-modes';
 controls.setAttribute('role','group');controls.setAttribute('aria-label','閱讀模式');
 const hint=document.createElement('p');hint.className='translation-hint';
 const modes=[['original','史料原文'],['modern','白話翻譯'],['both','文白對照']];
 const buttons=modes.map(([mode,label])=>{const b=document.createElement('button');b.type='button';b.dataset.mode=mode;b.textContent=label;controls.append(b);return b});
 header.append(controls,hint);
 const style=document.createElement('style');style.textContent=`
.translation-modes{display:flex;gap:7px;flex-wrap:wrap;margin:16px 0 4px}
.translation-modes button{cursor:pointer;border:1px solid #c3c2b8;background:transparent;color:inherit;border-radius:7px;padding:8px 13px;font:inherit;font-size:.9rem}
.translation-modes button[aria-pressed="true"]{background:#46584c;color:white;border-color:#46584c}
.translation-hint{font-size:.85rem;opacity:.75;margin:4px 0 14px}
.modern-prose{white-space:pre-wrap;line-height:2;background:#f3f1e9;padding:18px 20px;margin:12px 0;border-left:3px solid #8a9b83;border-radius:4px}
.modern-prose .translation-label{font-size:.8rem;color:#58685a;font-weight:600;margin:0 0 8px}
.modern-prose .missing-translation{opacity:.7;font-style:italic}
[hidden]{display:none!important}
`;document.head.append(style);
 let translations=null,mode='original';
 function build(){for(const section of sections){
  if(section.querySelector('.modern-prose'))continue;
  const panel=document.createElement('div');panel.className='modern-prose';panel.hidden=true;
  const label=document.createElement('p');label.className='translation-label';label.textContent='白話翻譯';
  const body=document.createElement('div');const value=translations?.[section.id];
  if(typeof value==='string'&&value.trim())body.textContent=value;
  else{body.textContent='本節尚未提供白話翻譯。';body.className='missing-translation'}
  panel.append(label,body);section.querySelector('.prose')?.after(panel);
 }}
 function apply(){
  for(const section of sections){const original=section.querySelector('.prose'),panel=section.querySelector('.modern-prose');
   if(original)original.hidden=mode==='modern';if(panel)panel.hidden=mode==='original';
  }
  for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.mode===mode));
  hint.textContent=mode==='original'?'目前顯示史料原文。':'翻譯仍在逐篇編寫；尚未翻譯的小節會顯示提示。';
 }
 buttons.forEach(b=>b.addEventListener('click',async()=>{
  mode=b.dataset.mode;
  if(mode!=='original'&&translations===null){
   try{const response=await fetch(base+'assets/translations.json');if(!response.ok)throw Error();
    const all=await response.json(),articleId=location.pathname.split('/')[location.pathname.split('/').indexOf('articles')+1];
    translations=(articleId&&all[articleId])||{};
   }catch{translations={}}
   build();
  }
  apply();
 }));
 apply();
})();

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
