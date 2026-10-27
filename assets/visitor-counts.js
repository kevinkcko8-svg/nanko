(()=>{
  'use strict';
  // Lightweight, approximate unique-browser counter for the public site.
  // No IP address, fingerprint or user account is collected by this script.
  // A person using multiple browsers/devices may be counted more than once.
  const HOST='kevinkcko8-svg.github.io';
  if(location.hostname!==HOST||!location.pathname.startsWith('/nanko/'))return;
  const footer=document.querySelector('footer');
  if(!footer)return;

  const STORAGE_EXCLUDE='nanko-counter-exclude-v1';
  const STORAGE_ALL='nanko-counter-all-v1';
  const API='https://abacus.jasoncameron.dev';
  const NAMESPACE='nanko-jishi-kevinkcko8-svg-visitors-20261027';
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{
    timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date()).map(p=>[p.type,p.value]));
  const today=parts.year+parts.month+parts.day;
  const STORAGE_TODAY='nanko-counter-day-'+today;
  const KEYS=[{name:'今日',remote:'day-'+today,local:STORAGE_TODAY},{name:'累計',remote:'all',local:STORAGE_ALL}];

  function read(key){
    try{return localStorage.getItem(key)}catch{return null}
  }
  function write(key,value){
    try{localStorage.setItem(key,value);return true}catch{return false}
  }

  // Visiting ?nanko_no_count=1 opts this browser out before any request increments.
  // The author dashboard also enables this flag after successful sign-in.
  const search=new URLSearchParams(location.search);
  if(search.get('nanko_no_count')==='1'){
    write(STORAGE_EXCLUDE,'1');
    try{
      const clean=new URL(location.href);
      clean.searchParams.delete('nanko_no_count');
      history.replaceState(history.state,'',clean.pathname+clean.search+clean.hash);
    }catch{}
  }
  const excluded=read(STORAGE_EXCLUDE)==='1';
  const display=document.createElement('p');
  display.className='visitor-counts';
  display.setAttribute('aria-label','網站訪客統計');
  display.title='從 2026 年 10 月 27 日啟用，以瀏覽器估算，台灣時間每日歸零；非精確人數。';
  const todayEl=document.createElement('span');
  const allEl=document.createElement('span');
  todayEl.textContent='今日訪客 —';
  allEl.textContent='累計訪客 —';
  const separator=document.createElement('span');
  separator.textContent=' · ';
  separator.setAttribute('aria-hidden','true');
  display.append(todayEl,separator,allEl);
  const footerLead=footer.querySelector('div');
  if(footerLead)footerLead.append(display);
  else footer.append(display);

  async function counter(verb,key){
    const url=API+'/'+verb+'/'+encodeURIComponent(NAMESPACE)+'/'+encodeURIComponent(key);
    const response=await fetch(url,{mode:'cors',cache:'no-store',referrerPolicy:'no-referrer'});
    if(response.status===404&&verb==='get')return 0;
    if(!response.ok)throw new Error('counter '+response.status);
    const payload=await response.json();
    const n=Number(payload.value);
    if(!Number.isSafeInteger(n)||n<0)throw new Error('invalid count');
    return n;
  }
  function formatted(n){return n.toLocaleString('zh-TW')}
  // Only a first visit on this browser (today / all time) increases the count.
  // Reading a value never increases it. Owner devices always use read-only.
  KEYS.forEach((item,index)=>{
    const target=index===0?todayEl:allEl;
    const shouldHit=!excluded&&!navigator.webdriver&&read(item.local)!=='1';
    if(shouldHit)write(item.local,'1'); // conservative deduplication across page navigation
    counter(shouldHit?'hit':'get',item.remote)
      .then(value=>{target.textContent=item.name+'訪客 '+formatted(value)})
      .catch(()=>{target.textContent=item.name+'訪客 —'});
  });
})();