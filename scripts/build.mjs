import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'site-data.json'),'utf8'));
const site='https://kevinkcko8-svg.github.io/nanko/';
const repo='https://github.com/kevinkcko8-svg/nanko';
const brand='南柯紀事';
const subtitle='中國歷史・史料整理與討論';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
function numeral(value){const n=Number(value),digits=['','壹','貳','參','肆','伍','陸','柒','捌','玖'];if(n>0&&n<10)return digits[n];if(n>=10&&n<100)return (n>=20?digits[Math.floor(n/10)]:'')+'拾'+digits[n%10];return String(value);}
const entries=data.dynasties.flatMap(d=>d.chronicles.flatMap(c=>c.entries.map(e=>({d,c,e}))));
const urls=[];
const ids=new Set();
for(const {e} of entries){if(!/^[a-zA-Z0-9_-]+$/.test(e.id)||ids.has(e.id))throw Error('Invalid or duplicate entry id: '+e.id);ids.add(e.id);}
// These two directories are generated exclusively by this script.
for(const dir of ['articles','sources'])fs.rmSync(path.join(root,dir),{recursive:true,force:true});
const article=e=>`articles/${e.id}/`;
const reference=e=>`sources/${e.id}/`;
const sectionAnchor=s=>'sec-'+encodeURIComponent(s.id);
const description=e=>clean(e.summary)||`${e.name}〈${e.title}〉：${e.sections.map(s=>s.title).join('、')}。閱讀紀事正文與分節古籍原文，參與史料討論。`;
const discussionQuery=e=>`is:issue "[${e.id}]"`;
const discussionList=e=>`${repo}/issues?q=${encodeURIComponent(e?discussionQuery(e):'is:issue')}`;
function newTopic(e,topic=''){
  const title=e?`[${e.id}] ${e.title}｜${topic||'討論題目'}`:topic;
  const body=`## 想討論的問題\n\n\n## 相關篇章\n${e?site+article(e):'請貼上相關文章網址（如有）'}\n\n## 史料與出處\n請附書名、篇卷及相關原文；若暫無資料，也歡迎先提問。\n\n## 我的理解\n\n`;
  return `${repo}/issues/new?${new URLSearchParams({title,body})}`;
}
function shell(file,title,desc,body,active='read',structured={}){
  const depth=file.split('/').length-1,base='../'.repeat(depth)||'./';
  const href=p=>base+p;
  const canonical=site+file.replace(/index\.html$/,'');
  const json=JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:title,url:canonical,description:desc,inLanguage:'zh-Hant',...structured}).replace(/</g,'\\u003c');
  const result=`<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}｜${brand}</title><meta name="description" content="${esc(desc)}"><meta name="theme-color" content="#f7f5ef">
<link rel="canonical" href="${canonical}"><meta property="og:type" content="${structured['@type']==='Article'?'article':'website'}"><meta property="og:locale" content="zh_TW"><meta property="og:site_name" content="${brand}"><meta property="og:title" content="${esc(title)}｜${brand}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}">
<link rel="icon" href="${href('assets/seal.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${href('assets/public.css')}"><script type="application/ld+json">${json}</script><script defer src="${href('assets/public.js')}"></script></head>
<body data-base="${base}"><a class="skip" href="#main">跳到主要內容</a><header class="header"><a class="brand" href="${href('index.html')}"><span class="seal">柯</span><span>${brand}<small>${subtitle}</small></span></a><nav aria-label="主導覽"><a ${active==='home'?'aria-current="page"':''} href="${href('index.html')}">首頁</a><a ${active==='read'?'aria-current="page"':''} href="${href('contents.html')}">讀紀事</a><a ${active==='sources'?'aria-current="page"':''} href="${href('sources.html')}">查史料</a><a ${active==='community'?'aria-current="page"':''} href="${href('community.html')}">一起讀史</a></nav></header>
<main id="main">${body.replaceAll('@@BASE@@',base)}</main><footer><div><b>${brand}</b><p>以朝代為綱，以紀事為目。循篇讀史，據書尋源。</p></div><div class="footer-links"><a href="${href('about.html')}">關於本站</a><a href="${href('community.html')}">參與討論</a><a href="${href('editor.html')}">作者工作台</a></div></footer><p id="status" class="status" role="status" aria-live="polite"></p></body></html>`;
  const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,result);urls.push(canonical);
}
function card({d,c,e},i,ref=false){return `<a class="entry-card" href="@@BASE@@${ref?reference(e):article(e)}"><span class="card-number">${String(i+1).padStart(2,'0')}</span><div><p class="eyebrow">${esc(d.name)} · ${esc(c.name)} · ${esc(e.name)}</p><h3>${esc(e.title||e.name)}</h3><p>${esc(e.sections.map(s=>s.title).join(' / '))}</p><span class="card-link">${ref?'查閱古籍原文':'閱讀紀事'} <span aria-hidden="true">↗</span></span></div></a>`;}
function topics(){return `<div class="topic-grid">${entries.map(({e},i)=>`<a class="topic" href="${esc(newTopic(e))}"><span class="eyebrow">${esc(e.name)} · 發起話題</span><h3>${esc(e.title)}</h3><p>有不同的解讀，或找到值得補充的史料？</p><span>帶著問題來聊 ↗</span></a>`).join('')}</div>`;}
const totalSections=entries.reduce((n,{e})=>n+e.sections.length,0);
shell('index.html',subtitle,'以紀事本末的方式整理中國歷史，對照《史記》《尚書》等古籍原文。從西周出發，閱讀武王伐紂、周公攝政、成康昭穆，交流史料與不同解讀。',`
<section class="hero wrap"><div><p class="eyebrow">中國歷史 · 紀事本末 · 史料共讀</p><h1>循一事讀歷史，<br>據一書尋來處。</h1><p class="lead">南柯紀事是一個持續編纂的歷史閱讀計畫。<br>把事件的來龍去脈寫在一起，也把所據史料攤開，<br class="wide-only">邀你一起讀、提問、辨析。</p><div class="actions"><a class="button" href="contents.html">從西周開始讀 <span>↗</span></a><a class="button secondary" href="community.html">找人一起聊歷史</a></div><p class="hero-note">目前收錄 ${entries.length} 篇紀事 · ${totalSections} 個小節 · 正文與史料對讀</p></div><div class="hero-art" aria-hidden="true"><span class="art-label">南柯藏讀 · 周</span><div class="vertical-poem">以史為鑑<br>逐事而書</div><div class="art-line"></div><span class="art-seal">南柯<br>紀事</span><span class="art-bottom">讀史，也尋同好。</span></div></section>
<section class="wrap section"><div class="section-heading"><div><p class="eyebrow">THE READING ROOM</p><h2>從一段歷史開始</h2></div><a href="contents.html">完整篇目 ↗</a></div>${entries.map((x,i)=>card(x,i)).join('')}</section>
<section class="wrap section"><div class="section-heading"><div><p class="eyebrow">FIND A PASSAGE</p><h2>你正在找哪一段？</h2></div></div>${searchUI()}<noscript><p>搜尋需啟用 JavaScript；仍可透過<a href="contents.html">完整目錄</a>閱讀全部篇章。</p></noscript></section>
<section class="invitation"><div class="wrap"><p class="eyebrow">一起讀史</p><h2>一段史料，可以有不只一種讀法。</h2><p>哪裡記載不同？這句應該怎麼解？你的問題，也可以成為下一段討論的起點。</p><a class="button" href="community.html">看看如何參與 ↗</a></div></section>`, 'home',{'@type':'WebSite'});
function searchUI(){return `<div class="search-box"><label for="site-search">搜尋篇名、小節、正文或史料</label><input id="site-search" type="search" placeholder="例如：昭王、牧野、尚書" autocomplete="off" aria-controls="search-results"><p id="search-summary" role="status">輸入關鍵字，尋找相關段落。</p><div id="search-results"></div></div>`;}
for(const ref of [false,true]) shell(ref?'sources.html':'contents.html',ref?'史料目錄':'紀事目錄',ref?'依篇章與小節閱讀南柯紀事所據古籍原文。':'南柯紀事正文目錄：依朝代、紀與紀事，閱讀中國歷史事件。',`<section class="wrap section"><p class="eyebrow">${ref?'SOURCE INDEX':'TABLE OF CONTENTS'}</p><h1>${ref?'史料目錄':'紀事目錄'}</h1><p class="lead">${ref?'沿著正文的小節，回到古籍的文字。':'依朝代入卷，沿事件讀下去。'}</p>${entries.map((x,i)=>card(x,i,ref)).join('')}</section>`,ref?'sources':'read');
for(const {d,c,e} of entries)for(const ref of [false,true]){
  const i=entries.findIndex(x=>x.e.id===e.id),prev=entries[i-1]?.e,next=entries[i+1]?.e;
  const sections=e.sections.map(s=>`<section class="reading-section" id="${esc('sec-'+s.id)}"><h2>${esc(s.title)}</h2>${ref?(s.sources||[]).slice().sort((a,b)=>a.number-b.number).map(src=>`<div class="source-card"><h3>${esc(numeral(src.number))}、${esc(src.title)}</h3><div class="prose source-prose">${esc(src.body)}</div></div>`).join('')||'<p class="muted">本節史料尚待整理。</p>':`<div class="prose">${esc(s.body)}</div>`}<a class="source-link" href="@@BASE@@${ref?article(e):reference(e)}#${sectionAnchor(s)}">${ref?'回到本節正文':'對照本節史料'} →</a></section>`).join('');
  shell((ref?reference(e):article(e))+'index.html',`${e.title}${ref?'｜史料原文':''}・${e.name}`,description(e),`<div class="wrap reader-layout"><aside class="reader-aside"><a href="@@BASE@@${ref?'sources':'contents'}.html">← ${ref?'史料':'紀事'}目錄</a><details open><summary>本篇目次</summary><nav aria-label="本篇目次">${e.sections.map(s=>`<a href="#${sectionAnchor(s)}">${esc(s.title)}</a>`).join('')}</nav></details><a class="aside-discuss" href="#discussion">參與本篇討論 ↓</a></aside><article><header class="article-header"><p class="eyebrow">${esc(d.name)} / ${esc(c.name)} / ${esc(e.name)}</p><h1>${esc(e.title)}</h1>${ref?'<p class="source-label">史料原文</p>':''}${e.summary?`<p class="lead">${esc(e.summary)}</p>`:''}<div class="actions"><a class="button secondary" href="@@BASE@@${ref?article(e):reference(e)}">${ref?'閱讀正文':'對照史料'} ↗</a><button class="button secondary" data-copy-link>複製本篇連結</button></div></header>${sections}<section id="discussion" class="discussion-box"><p class="eyebrow">READ & DISCUSS</p><h2>讀到這裡，你怎麼看？</h2><p>歡迎提問、補充史料，或提出不同解讀。引用時附上書名與篇卷，讓大家一起核對。</p><div class="actions"><a class="button" href="${esc(newTopic(e))}">發起本篇討論 ↗</a><a class="button secondary" href="${esc(discussionList(e))}">查看本篇話題 ↗</a></div><p class="muted">討論在 GitHub 公開進行，發言需要免費 GitHub 帳號。文章不會因留言而被直接修改。</p></section><nav class="next-prev" aria-label="前後篇章">${prev?`<a href="@@BASE@@${ref?reference(prev):article(prev)}">← ${esc(prev.title)}</a>`:'<span>卷首</span>'}${next?`<a href="@@BASE@@${ref?reference(next):article(next)}">${esc(next.title)} →</a>`:'<span>卷末</span>'}</nav></article></div>`,ref?'sources':'read',{'@type':'Article',headline:e.title,isPartOf:{'@type':'WebSite',name:brand,url:site}});
}
shell('community.html','一起讀史・提問與討論','與中國歷史愛好者一起討論紀事、比對史料、提出勘誤與不同解讀。',`<section class="wrap section"><p class="eyebrow">THE COMMON TABLE</p><h1>讀史，也尋同好。</h1><p class="lead">不必先有完整的論文。一個讀不懂的字、一處互相矛盾的記載，<br class="wide-only">都值得拿出來聊。</p><div class="actions"><a class="button" href="${esc(discussionList())}">瀏覽所有話題 ↗</a><a class="button secondary" href="${esc(newTopic(null,'[共讀] '))}">提出新問題 ↗</a></div><div class="notice"><strong>這裡的討論如何運作？</strong><p>點擊後會前往 GitHub 的公開話題區（Issues）。任何人都能閱讀；發言、回覆與追蹤通知需要免費 GitHub 帳號。目前採用這個方式集中保存討論，本站沒有另外的會員註冊。</p></div></section><section class="wrap section"><div class="section-heading"><h2>選一篇，一起讀</h2></div>${topics()}</section><section class="wrap section"><h2>我們可以聊什麼？</h2><div class="principles"><div><span>01</span><h3>問一個問題</h3><p>先說你讀到哪裡、哪一點不明白，不需要擔心問題太基礎。</p></div><div><span>02</span><h3>帶一段史料</h3><p>附上古籍名稱、篇卷與原文，分清記載、推論和自己的猜想。</p></div><div><span>03</span><h3>容納不同解讀</h3><p>針對證據討論，尊重提出問題的人。也歡迎指出本站的錯字與疏漏。</p></div></div></section>`, 'community');
shell('about.html','關於南柯紀事','南柯紀事是一個以中國歷史紀事與史料對讀為核心的個人編纂與共讀計畫。',`<section class="wrap section about"><p class="eyebrow">ABOUT THE PROJECT</p><h1>南柯紀事</h1><p class="lead">中國歷史・史料整理與討論</p><h2>從整理自己的閱讀，到邀請別人一起讀。</h2><p>本站依「朝代 → 紀 → 紀事 → 小節」編排正文，將參考古籍原文放在對應的小節中。你可以先讀事件，再回頭對照史料，也可以從某一句原文開始提出問題。</p><p>目前從西周的篇章起步，持續整理中。這是個人編纂與交流計畫，內容可能仍有疏漏；歡迎附上依據補充、勘誤或提出不同解釋。</p><h2>如何參與</h2><p>每篇文章下方都有討論入口。閱讀不需帳號；公開提問與回覆使用 GitHub 帳號。留言不會直接改動正文，整理者可以核對後修訂。</p><a class="button" href="community.html">前往共讀空間 ↗</a></section>`, 'about');
const search=entries.flatMap(({e})=>e.sections.flatMap(s=>[{title:e.title,section:s.title,type:'正文',url:article(e)+'#'+sectionAnchor(s),text:s.body||''},...(s.sources||[]).map(src=>({title:e.title,section:s.title+' · '+src.title,type:'史料',url:reference(e)+'#'+sectionAnchor(s),text:src.body||''}))]));
fs.writeFileSync(path.join(root,'assets/search-index.json'),JSON.stringify(search));
// Keep the editor's offline fallback aligned with the published source.
fs.writeFileSync(path.join(root,'data.js'),'/* Generated from site-data.json. */\nwindow.NANKE_DATA = '+JSON.stringify(data,null,2)+';\n');
fs.writeFileSync(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>`<url><loc>${esc(u)}</loc></url>`).join('')+'</urlset>\n');
console.log(`Built ${urls.length} public pages; ${entries.length} entries; ${search.length} searchable passages.`);
