(()=>{'use strict';
const repo='kevinkcko8-svg/nanko', dataPath='site-data.json';
const $=id=>document.getElementById(id);
if(!$('stat-chars')) return;
const fmt=n=>new Intl.NumberFormat('zh-TW').format(n);
const signed=n=>`${n>0?'+':''}${fmt(n)}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
const labelDate=iso=>new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(`${iso}T12:00:00+08:00`));

const poem=document.querySelector('.vertical-poem');
if(poem) poem.innerHTML='序時記事<br>逐事而書';
const logSummary=document.querySelector('.update-log summary');
if(logSummary) logSummary.textContent='開發者紀錄';
const note=document.querySelector('.stats-note');
if(note) note.textContent='正文總字數與史料數由目前資料即時計算；開發者紀錄由站主自行編寫。';

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
  }catch(e){
    $('progress-date').textContent='統計資料暫時無法更新';
    $('stat-today-note').textContent='稍後重新整理即可再試';
  }

  try{
    const log=await fetchJson('./dev-log.json?log='+Date.now());
    const rows=(log.entries||[]).map(x=>`<li><time datetime="${esc(x.date)}">${esc(labelDate(x.date))}</time><div><strong>${esc(x.title||'開發紀錄')}</strong>${x.body?`<span>${esc(x.body)}</span>`:''}</div></li>`);
    $('update-history').innerHTML=rows.join('')||'<li><div><strong>尚無開發者紀錄</strong></div></li>';
  }catch{
    $('update-history').innerHTML='<li><div><strong>開發者紀錄暫時無法載入</strong></div></li>';
  }
})();
})();
