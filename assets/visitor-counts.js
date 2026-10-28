(()=>{
  'use strict';
  // Counts estimated unique browsers, not verified humans.
  // Starts 2026-10-27, resetting the "today" counter at midnight Asia/Taipei.
  // Read-only for browsers excluded by author login or ?nanko_no_count=1.
  if(location.hostname!=='kevinkcko8-svg.github.io'||!location.pathname.startsWith('/nanko/'))return;
  const footer=document.querySelector('footer');
  if(!footer)return;

  const EXCLUDE_KEY='nanko-counter-exclude-v1';
  const ALL_KEY='nanko-counter-all-v1';
  const NAMESPACE='nanko-jishi-kevinkcko8-svg-visitors-20261027';
  const SERVERS=['https://abacus.jasoncameron.dev','https://abacus.jsn.cam'];
  const dateParts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{
    timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date()).map(p=>[p.type,p.value]));
  const dateKey=dateParts.year+dateParts.month+dateParts.day;
  const counters=[
    {name:'今日',key:'day-'+dateKey,storage:'nanko-counter-day-'+dateKey},
    {name:'累計',key:'all',storage:ALL_KEY}
  ];
  const timeout=5500;

  function getLocal(key){try{return localStorage.getItem(key)}catch{return null}}
  function setLocal(key,value){try{localStorage.setItem(key,value);return true}catch{return false}}
  if(new URLSearchParams(location.search).get('nanko_no_count')==='1'){
    setLocal(EXCLUDE_KEY,'1');
    const url=new URL(location.href);
    url.searchParams.delete('nanko_no_count');
    history.replaceState(history.state,'',url.pathname+url.search+url.hash);
  }
  const excluded=getLocal(EXCLUDE_KEY)==='1'||navigator.webdriver===true;
  const block=document.createElement('p');
  block.className='visitor-counts';
  block.title='估計的不重複瀏覽器數，從 2026/10/27 開始記錄，台灣時間每天歸零。';
  block.setAttribute('aria-label','今日與累計訪客數');
  const targets=counters.map(({name})=>{
    const span=document.createElement('span');
    span.textContent=name+'訪客 讀取中…';
    block.append(span);
    return span;
  });
  targets[0].after(document.createTextNode(' · '));
  (footer.querySelector('div')||footer).append(block);

  function checkValue(data){
    const value=Number(data&&data.value);
    if(!Number.isSafeInteger(value)||value<0)throw new Error('計數資料格式錯誤');
    return value;
  }
  function apiUrl(server,verb,key){
    return server+'/'+verb+'/'+encodeURIComponent(NAMESPACE)+'/'+encodeURIComponent(key);
  }
  async function fetchCounter(server,verb,key){
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),timeout);
    try{
      const response=await fetch(apiUrl(server,verb,key),{
        mode:'cors',cache:'no-store',referrerPolicy:'no-referrer',signal:ctrl.signal
      });
      if(verb==='get'&&response.status===404)return 0;
      if(!response.ok)throw new Error('HTTP '+response.status);
      return checkValue(await response.json());
    }finally{clearTimeout(timer)}
  }
  // Abacus supports callback= JSONP. This bypasses browsers that block
  // access to its JSON response with CORS, while retaining the same counter keys.
  let callbackIndex=0;
  function jsonpCounter(server,verb,key){
    return new Promise((resolve,reject)=>{
      const callback='nankoAbacusCallback'+(++callbackIndex);
      const script=document.createElement('script');
      let finished=false;
      function finish(error,value){
        if(finished)return;finished=true;
        clearTimeout(timer);script.remove();
        try{delete window[callback]}catch{window[callback]=undefined}
        if(error)reject(error);
        else{try{resolve(checkValue(value))}catch(e){reject(e)}}
      }
      const timer=setTimeout(()=>finish(new Error('JSONP timeout')),timeout);
      window[callback]=value=>finish(null,value);
      script.onerror=()=>finish(new Error('JSONP network error'));
      script.async=true;
      script.src=apiUrl(server,verb,key)+'?callback='+callback;
      document.head.append(script);
    });
  }
  async function request(verb,key){
    // JSONP first for increments: if an increment succeeds on the server
    // but its CORS response is blocked, blindly repeating /hit doubles it.
    const methods=verb==='hit'
      ? SERVERS.flatMap(server=>[()=>jsonpCounter(server,verb,key)])
      : SERVERS.flatMap(server=>[()=>fetchCounter(server,verb,key),()=>jsonpCounter(server,verb,key)]);
    if(verb==='hit')methods.push(()=>fetchCounter(SERVERS[0],verb,key));
    let lastError;
    for(const method of methods){
      try{return await method()}catch(error){lastError=error}
    }
    throw lastError||new Error('統計服務無法連線');
  }
  counters.forEach(async (item,index)=>{
    const display=targets[index];
    const countedBefore=getLocal(item.storage)==='1';
    const increment=!excluded&&!countedBefore;
    try{
      // Fix: do not mark a visit counted until the increment actually succeeds.
      const value=await request(increment?'hit':'get',item.key);
      if(increment)setLocal(item.storage,'1');
      setLocal('nanko-counter-last-'+item.key,String(value));
      display.textContent=item.name+'訪客 '+value.toLocaleString('zh-TW');
    }catch(error){
      console.warn('南柯紀事訪客統計暫時無法取得',item.name,error);
      const last=getLocal('nanko-counter-last-'+item.key);
      display.textContent=item.name+(last!==null?'上次紀錄 '+last:'統計暫不可用');
      display.title='統計服務暫時無法連線，這不代表訪客數是零。';
    }
  });
})();