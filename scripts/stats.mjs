import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const dataPath='site-data.json';
const logPath='dev-log.json';
const indexPath='index.html';
const data=JSON.parse(fs.readFileSync(dataPath,'utf8'));
const devLog=fs.existsSync(logPath)?JSON.parse(fs.readFileSync(logPath,'utf8')):{entries:[]};

const entryRecords=d=>d.dynasties.flatMap(dynasty=>dynasty.chronicles.flatMap(chronicle=>chronicle.entries.map(entry=>({dynasty,chronicle,entry}))));
const entriesOf=d=>entryRecords(d).map(x=>x.entry);
const entryChars=entry=>(entry.sections||[]).reduce((n,section)=>n+String(section.body||'').replace(/\s/g,'').length,0);
const statsOf=d=>{
  const entries=entriesOf(d);
  let characters=0;
  let sources=0;
  let sections=0;
  for(const entry of entries){
    for(const section of entry.sections||[]){
      sections++;
      characters+=String(section.body||'').replace(/\s/g,'').length;
      sources+=(section.sources||[]).length;
    }
  }
  return {characters,sources,entries:entries.length,sections};
};
const current=statsOf(data);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const readAt=sha=>JSON.parse(git('show',`${sha}:${dataPath}`));

const now=new Date();
const taipeiDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
const midnight=`${taipeiDate}T00:00:00+08:00`;
let baseline={characters:current.characters,sources:current.sources};
try{
  const sha=git('log',`--before=${midnight}`,'-1','--format=%H','--',dataPath);
  if(sha)baseline=statsOf(readAt(sha));
}catch{}
const todayChars=current.characters-baseline.characters;
const todaySources=current.sources-baseline.sources;

const fmt=n=>new Intl.NumberFormat('zh-TW').format(n);
const signed=n=>`${n>0?'+':''}${fmt(n)}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateLabel=date=>new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(`${date}T12:00:00+08:00`));

const history=(devLog.entries||[]).length?(devLog.entries||[]).map(u=>`<li><time datetime="${esc(u.date)}">${esc(dateLabel(u.date))}</time><div><strong>${esc(u.title||'開發紀錄')}</strong>${u.body?`<span>${esc(u.body)}</span>`:''}</div></li>`).join(''):'<li><div><strong>尚無開發者紀錄</strong></div></li>';
const entryBreakdown=entryRecords(data).map(({dynasty,chronicle,entry})=>`<li><div><strong>${esc(entry.name)}　${esc(entry.title||'未命名')}</strong><span>${esc(dynasty.name)} · ${esc(chronicle.name)}</span></div><b>${fmt(entryChars(entry))} 字</b></li>`).join('');
const section=`
<section class="wrap section progress-section" aria-labelledby="progress-title">
  <div class="section-heading"><div><p class="eyebrow">PROJECT PROGRESS</p><h2 id="progress-title">南柯正在長大</h2></div><span class="progress-date">統計至 ${esc(taipeiDate)}</span></div>
  <div class="stats-grid">
    <article class="stat-card"><span>正文總字數</span><strong>${fmt(current.characters)}</strong><small>字</small></article>
    <article class="stat-card"><span>今日新增</span><strong class="${todayChars>=0?'positive':'negative'}">${signed(todayChars)}</strong><small>字${todaySources?` · ${signed(todaySources)} 則史料`:''}</small></article>
    <article class="stat-card"><span>史料來源</span><strong>${fmt(current.sources)}</strong><small>則</small></article>
    <article class="stat-card"><span>整理進度</span><strong>${fmt(current.entries)}</strong><small>篇紀事 · ${fmt(current.sections)} 小節</small></article>
  </div>
  <details class="update-log"><summary>各紀事正文篇幅</summary><ol class="entry-breakdown">${entryBreakdown}</ol></details>
  <details class="update-log"><summary>開發者紀錄</summary><ol>${history}</ol></details>
  <p class="stats-note">正文總字數與各篇篇幅皆不含空白；史料數由目前資料計算；開發者紀錄由站主自行編寫。</p>
</section>`;

let html=fs.readFileSync(indexPath,'utf8');
const anchor='</section>\n<section class="wrap section">';
if(!html.includes(anchor))throw new Error('Could not find home-page insertion point');
html=html.replace(anchor,`</section>${section}\n<section class="wrap section">`);
html=html.replace('以史為鑑<br>逐事而書','序時記事<br>逐事而書');
html=html.replace(/<a href="[^\"]*editor\.html">作者工作台<\/a>/g,'');
html=html.replace('</head>','<link rel="stylesheet" href="./assets/stats.css"></head>');
fs.writeFileSync(indexPath,html);
console.log(`Progress: ${current.characters} chars, ${current.sources} sources, today ${todayChars>=0?'+':''}${todayChars}`);
