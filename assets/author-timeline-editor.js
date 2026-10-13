(()=>{'use strict';
const KEY='nanke-timeline-draft-v1',FIRST=-841,yearEl=document.getElementById('timelineEditYear'),eraEl=document.getElementById('timelineEditEra'),eventEl=document.getElementById('timelineEditEvent'),status=document.getElementById('timelineEditStatus');
const parse=s=>{s=String(s).trim().replace(/\s/g,'');let n;if(/^(前|西元前|公元前|BC|BCE)/i.test(s)){n=-Number(s.replace(/^(西元前|公元前|前|BC|BCE)/i,'').replace(/年$/,''))}else{n=Number(s.replace(/^(西元|公元)/,'').replace(/年$/,''))}return Number.isInteger(n)&&n!==0&&n>=FIRST&&n<=new Date().getFullYear()?n:null};
const fmt=n=>n<0?'前'+(-n):String(n);
const preview=document.getElementById('authorTimelinePreview');
const adjacent=(n,d)=>n===-1&&d===1?1:n===1&&d===-1?-1:n+d;
let published={},draft={};
try{draft=JSON.parse(localStorage.getItem(KEY)||'{}');if(!draft||typeof draft!=='object'||Array.isArray(draft))draft={}}catch{draft={}}
const zh=n=>{const d=['零','一','二','三','四','五','六','七','八','九'];if(n<10)return d[n];if(n<20)return '十'+(n%10?d[n%10]:'');return d[Math.floor(n/10)]+'十'+(n%10?d[n%10]:'')};
const preset=n=>n>=-841&&n<=-828?'共和'+zh(-n-840)+'年':n>=-827&&n<=-782?'周宣王'+zh(n+828)+'年':n>=-781&&n<=-771?'周幽王'+zh(n+782)+'年':n>=-770&&n<=-720?'周平王'+zh(n+771)+'年':'';
const charCount=s=>[...String(s||"").replace(/\s/g,"")].length;
let current=null;
function renderPreview(){
  if(!preview)return;
  const n=parse(yearEl.value);if(n===null){preview.replaceChildren();return}
  const yearList=[n];for(let i=1;i<=2;i++){const earlier=yearList[0]===-841?null:adjacent(yearList[0],-1);if(earlier!==null)yearList.unshift(earlier)}
  let later=n;for(let i=0;i<2;i++){later=adjacent(later,1);if(later<=new Date().getFullYear())yearList.push(later)}
  const fragment=document.createDocumentFragment();
  for(const y of yearList){
    const entry=Object.prototype.hasOwnProperty.call(draft,y)?draft[y]:(published[y]||{});
    const era=y===n?eraEl.value:(typeof entry.era==='string'?entry.era:preset(y));
    const event=y===n?eventEl.value:(typeof entry.event==='string'?entry.event:'');
    const tr=document.createElement('tr');if(y===n){tr.style.background='#f0f4e8';tr.style.fontWeight='600'}
    for(const value of [fmt(y)+'年',era,event,charCount(event)]){const td=document.createElement('td');td.textContent=value;td.style.cssText='padding:12px;border-top:1px solid #d9ddd4;white-space:pre-wrap;overflow-wrap:anywhere;vertical-align:top';tr.appendChild(td)}
    fragment.appendChild(tr);
  }
  preview.replaceChildren(fragment);const all=new Set([...Object.keys(published),...Object.keys(draft),String(n)]);let total=0,written=0;for(const k of all){const x=Number(k);const v=x===n?eventEl.value:(Object.prototype.hasOwnProperty.call(draft,k)?draft[k]?.event:published[k]?.event)||'';const c=charCount(v);total+=c;if(c)written++}const summary=document.getElementById('timelineWordStatsEditor');if(summary)summary.textContent='本年事件：'+charCount(eventEl.value)+' 字｜已編錄 '+written+' 年事件｜事件總字數：'+total.toLocaleString('zh-TW')+' 字（不含空白與換行，含尚未儲存的當前年份）';
}
function load(){const n=parse(yearEl.value);if(n===null){status.textContent='請輸入西元前841年至今年的有效年份，沒有西元0年。';return}current=n;const entry=Object.prototype.hasOwnProperty.call(draft,n)?draft[n]:(published[n]||{});eraEl.value=typeof entry.era==='string'?entry.era:preset(n);eventEl.value=typeof entry.event==='string'?entry.event:'';status.textContent='正在編輯：'+(n<0?'西元前'+(-n):'西元'+n)+'年';renderPreview()}
yearEl.addEventListener('change',load);
for(const field of [eraEl,eventEl])field.addEventListener('input',renderPreview);
function save(){const n=parse(yearEl.value);if(n===null){load();return false}draft[n]={era:eraEl.value.trim(),event:eventEl.value.trim()};try{localStorage.setItem(KEY,JSON.stringify(draft))}catch(e){status.textContent='儲存失敗：瀏覽器儲存空間無法使用';return false}current=n;status.textContent='已儲存 '+(n<0?'前'+(-n):n)+' 年的草稿（尚未公開）';renderPreview();return true}
document.getElementById('timelineEntryForm').addEventListener('submit',e=>{e.preventDefault();save()});
document.getElementById('timelinePrevYear').addEventListener('click',()=>{if(!save())return;if(current<=FIRST){status.textContent='已到年表起始年（前841年）';return}yearEl.value=fmt(adjacent(current,-1));load();eventEl.focus()});
document.getElementById('timelineNextYear').addEventListener('click',()=>{if(!save())return;const n=current===-1?1:current+1;if(n>new Date().getFullYear()){status.textContent='已到今年';return}yearEl.value=fmt(n);load();eventEl.focus()});
document.getElementById('timelineDownload').addEventListener('click',()=>{const all={...published,...draft};const blob=new Blob([JSON.stringify({version:1,entries:all},null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='timeline-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='JSON 已下載；請上傳至 GitHub 才會更新公開網站。'});
fetch('./timeline-data.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{published=data.entries||{};load()}).catch(()=>{load();status.textContent+='（暫時無法載入公開資料）'});
})();