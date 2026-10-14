(()=>{
'use strict';
const FIRST=-841, LAST=new Date().getFullYear(), KEY='nanke-timeline-draft-v1';
const body=document.getElementById('timelineBody');
const sizeInput=document.getElementById('pageSize');
const yearInput=document.getElementById('yearInput');
const rangeText=document.getElementById('rangeText');
const pageLabel=document.getElementById('pageLabel');
const editor=document.getElementById('timelineEditor');
const loadStatus=document.getElementById('timelineLoadStatus');
const years=[];
for(let n=FIRST;n<=LAST;n++)if(n!==0)years.push(n);
const fmt=n=>n<0?'前'+(-n)+'年':n+'年';
const inputFmt=n=>n<0?'前'+(-n):String(n);
const charCount=s=>[...String(s||'').replace(/\s/g,'')].length;
const rowId=n=>'timeline-'+(n<0?'bce-'+(-n):'ce-'+n);
function chinese(n){
  const d=['零','一','二','三','四','五','六','七','八','九'];
  if(n<10)return d[n];
  if(n<20)return '十'+(n%10?d[n%10]:'');
  if(n<100)return d[Math.floor(n/10)]+'十'+(n%10?d[n%10]:'');
  return String(n);
}
const preset=n=>n>=-841&&n<=-828?'共和'+chinese(-n-840)+'年':n>=-827&&n<=-782?'周宣王'+chinese(n+828)+'年':n>=-781&&n<=-771?'周幽王'+chinese(n+782)+'年':n>=-770&&n<=-720?'周平王'+chinese(n+771)+'年':'';
function parse(value){
  const s=String(value).trim().replace(/\s+/g,'');
  let n;
  if(/^(西元前|公元前|BCE|BC|前)/i.test(s))n=-Number(s.replace(/^(西元前|公元前|BCE|BC|前)/i,'').replace(/年$/,''));
  else n=Number(s.replace(/^(西元|公元)/,'').replace(/年$/,''));
  return Number.isInteger(n)&&n!==0&&n>=FIRST&&n<=LAST?n:null;
}
let published={},draft={},page=0,loaded=false;
try {
  draft=JSON.parse(localStorage.getItem(KEY)||'{}');
  if(!draft||typeof draft!=='object'||Array.isArray(draft))draft={};
} catch {draft={}}
const getPublic=n=>{
  const entry=published[String(n)]||{};
  return {era:typeof entry.era==='string'?entry.era:preset(n),event:typeof entry.event==='string'?entry.event:''};
};
const getEdit=n=>{
  const key=String(n),entry=Object.prototype.hasOwnProperty.call(draft,key)?draft[key]:published[key]||{};
  return {era:typeof entry.era==='string'?entry.era:preset(n),event:typeof entry.event==='string'?entry.event:''};
};
function publishedYears(){
  const keys=Object.keys(published).map(Number).filter(n=>Number.isInteger(n)&&n>=FIRST&&n<=LAST&&n!==0);
  if(!keys.length)return [];
  const end=Math.max(...keys);
  return years.filter(n=>n<=end);
}
function render(){
  const publishedMode=sizeInput.value==='published';
  const list=publishedMode?publishedYears():years;
  const count=publishedMode?list.length:Number(sizeInput.value);
  const totalPages=publishedMode?1:Math.ceil(list.length/count);
  page=Math.max(0,Math.min(page,totalPages-1));
  const part=publishedMode?list:list.slice(page*count,(page+1)*count);
  if(!part.length)return; // Leave the HTML fallback visible if the JSON is unavailable.
  const fragment=document.createDocumentFragment();
  for(const n of part){
    const tr=document.createElement('tr');
    tr.id=rowId(n);tr.dataset.year=String(n);
    const entry=getPublic(n);
    for(const value of [fmt(n),entry.era,entry.event,charCount(entry.event)]){
      const td=document.createElement('td');td.textContent=value;tr.appendChild(td);
    }
    fragment.appendChild(tr);
  }
  body.replaceChildren(fragment);
  rangeText.textContent=fmt(part[0])+' — '+fmt(part[part.length-1])+'（'+part.length+' 年）';
  pageLabel.textContent=publishedMode?'已顯示所有已編錄年份':('第 '+(page+1)+' / '+totalPages+' 頁');
  document.getElementById('prevPage').disabled=publishedMode||page===0;
  document.getElementById('nextPage').disabled=publishedMode||(page+1)>=totalPages;
  const all=Object.values(published);
  const words=all.reduce((sum,e)=>sum+charCount(e&&e.event),0);
  const written=all.filter(e=>e&&typeof e.event==='string'&&e.event.trim()).length;
  document.getElementById('timelineWordStats').textContent='已編錄 '+written+' 年事件 · 事件總字數 '+words.toLocaleString('zh-TW')+' 字（不含空白及換行；僅計已發布資料）';
  const latest=list[list.length-1];
  const latestInfo=document.getElementById('latestPublishedYear');
  if(latestInfo)latestInfo.textContent='最新編錄年份：'+fmt(latest);
}
function go(n){
  if(n===null)return;
  if(sizeInput.value==='published'&&!publishedYears().includes(n))sizeInput.value='50';
  if(sizeInput.value!=='published')page=Math.floor(years.indexOf(n)/Number(sizeInput.value));
  yearInput.value=inputFmt(n);
  render();
  const target=document.getElementById(rowId(n));
  if(target)target.scrollIntoView({behavior:'smooth',block:'center'});
}
document.getElementById('prevPage').addEventListener('click',()=>{if(page>0){page--;render()}});
document.getElementById('nextPage').addEventListener('click',()=>{if((page+1)*Number(sizeInput.value)<years.length){page++;render()}});
sizeInput.addEventListener('change',()=>{
  const current=Number(body.firstElementChild?.dataset.year);
  page=0;
  if(sizeInput.value!=='published'&&Number.isInteger(current)&&years.includes(current))
    page=Math.floor(years.indexOf(current)/Number(sizeInput.value));
  render();
});
document.getElementById('jumpBtn').addEventListener('click',()=>{
  const n=parse(yearInput.value);
  if(n===null){alert('請輸入介於西元前841年至今年的有效年份（沒有西元0年）。');return}
  go(n);
});
yearInput.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('jumpBtn').click()});
document.getElementById('latestBtn').addEventListener('click',()=>{
  const list=publishedYears();if(list.length)go(list[list.length-1]);
});
if(sessionStorage.getItem('nanke-author-unlocked-v2')==='1'){
  editor.hidden=false;
  if(new URLSearchParams(location.search).has('edit'))
    requestAnimationFrame(()=>editor.scrollIntoView({block:'start'}));
  const editYear=document.getElementById('editYear'),era=document.getElementById('editEra'),event=document.getElementById('editEvent'),status=document.getElementById('editorStatus');
  const loadEdit=()=>{
    const n=parse(editYear.value);
    if(n===null){status.textContent='年份無效';return}
    const entry=getEdit(n);
    era.value=entry.era;event.value=entry.event;
    document.getElementById('editLabel').textContent='正在編輯：'+fmt(n);
    status.textContent='';
  };
  loadEdit();
  editYear.addEventListener('change',loadEdit);
  document.getElementById('saveEntry').addEventListener('click',()=>{
    const n=parse(editYear.value);
    if(n===null){status.textContent='年份無效';return}
    draft[n]={era:era.value.trim(),event:event.value.trim()};
    try{localStorage.setItem(KEY,JSON.stringify(draft))}
    catch{status.textContent='本機儲存失敗，請檢查瀏覽器儲存空間。';return}
    status.textContent=fmt(n)+'已儲存至本機草稿（尚未公開）';
  });
  document.getElementById('downloadData').addEventListener('click',()=>{
    const entries={...published,...draft};
    const blob=new Blob([JSON.stringify({version:1,entries},null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='timeline-data.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='已匯出 JSON；請上傳至 GitHub 倉庫根目錄才會更新公開年表。';
  });
}
if(new URLSearchParams(location.search).has('edit')&&editor.hidden){
  const msg=document.createElement('p');msg.className='timeline-note';
  msg.textContent='要編輯年表，請先在同一個瀏覽器分頁登入作者工作台，再按「編輯年表」。';
  const a=document.createElement('a');a.href='./author-7c4f1e.html';a.textContent=' 前往作者工作台 →';msg.append(a);
  document.querySelector('.timeline-intro').append(msg);
}
// Keep the pre-rendered table until current JSON has been fetched successfully.
fetch('./timeline-data.json?v='+Date.now(),{cache:'no-store'})
  .then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()})
  .then(data=>{
    if(!data||!data.entries||typeof data.entries!=='object')throw Error('年表 JSON 格式錯誤');
    published=data.entries;
    loaded=true;
    loadStatus.textContent='';
    render();
    if(!editor.hidden)document.getElementById('editYear').dispatchEvent(new Event('change'));
  })
  .catch(err=>{
    console.error('公開年表資料載入失敗',err);
    loadStatus.textContent='最新年表資料載入失敗；下方保留部署時的已編錄內容，請稍後重新整理。';
  });
})();