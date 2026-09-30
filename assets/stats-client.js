(()=>{'use strict';
const repo='kevinkcko8-svg/nanko', dataPath='site-data.json';
const $=id=>document.getElementById(id);
if(!$('stat-chars')) return;
const fmt=n=>new Intl.NumberFormat('zh-TW').format(n);
const signed=n=>`${n>0?'+':''}${fmt(n)}`;
const statsOf=d=>{
  const entries=(d.dynasties||[]).flatMap(x=>(x.chronicles||[]).flatMap(c=>c.entries||[]));
  let characters=0,sources=0,sections=0;
  for(const e of entries) for(const s of e.sections||[]){sections++;characters+=String(s.body||'').replace(/\s/g,'').length;sources+=(s.sources||[]).length;}
  return {characters,sources,entries:entries.length,sections};
};
const fetchJson=async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(`${r.status}`);return r.json();};
const rawAt=sha=>fetchJson(`https://raw.githubusercontent.com/${repo}/${sha}/${dataPath}`);
const api=path=>fetchJson(`https://api.github.com/repos/${repo}${path}`);
const taipeiDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const labelDate=iso=>new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(iso));
(async()=>{
  try{
    const currentData=await fetchJson('./site-data.json?stats='+Date.now());
    const current=statsOf(currentData);
    $('stat-chars').textContent=fmt(current.characters);
    $('stat-sources').textContent=fmt(current.sources);
    $('stat-entries').textContent=fmt(current.entries);
    $('stat-sections').textContent=`篇紀事 · ${fmt(current.sections)} 小節`;
    const day=taipeiDay(); $('progress-date').textContent=`統計至 ${day}`;
    const midnight=new Date(`${day}T00:00:00+08:00`).toISOString();
    let base=current;
    try{
      const before=await api(`/commits?path=${encodeURIComponent(dataPath)}&until=${encodeURIComponent(midnight)}&per_page=1`);
      if(before[0]) base=statsOf(await rawAt(before[0].sha));
    }catch{}
    const dChars=current.characters-base.characters, dSources=current.sources-base.sources;
    $('stat-today').textContent=signed(dChars);
    $('stat-today-note').textContent=`字${dSources?` · ${signed(dSources)} 則史料`:''}`;
    const commits=await api(`/commits?path=${encodeURIComponent(dataPath)}&per_page=8`);
    const rows=[];
    for(const c of commits){
      let deltaText='';
      try{
        const after=statsOf(await rawAt(c.sha));
        const parent=c.parents&&c.parents[0];
        if(parent){
          const before=statsOf(await rawAt(parent.sha));
          const dc=after.characters-before.characters, ds=after.sources-before.sources;
          deltaText=`${signed(dc)} 字${ds?` · ${signed(ds)} 則史料`:''}`;
        } else deltaText=`${fmt(after.characters)} 字`;
      }catch{}
      rows.push(`<li><time datetime="${c.commit.committer.date}">${labelDate(c.commit.committer.date)}</time><div><strong>${(c.commit.message||'更新').split('\n')[0].replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}</strong><span>${deltaText}</span></div></li>`);
    }
    $('update-history').innerHTML=rows.join('')||'<li><div><strong>尚無更新紀錄</strong></div></li>';
  }catch(e){
    $('progress-date').textContent='統計資料暫時無法更新';
    $('stat-today-note').textContent='稍後重新整理即可再試';
  }
})();
})();