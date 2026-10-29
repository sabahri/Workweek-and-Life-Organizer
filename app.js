(function(){
"use strict";
const RCAT_SEED=[['Breakfast','#B07A1E'],['Main','#2F5D8A'],['Side','#3F7A55'],['Dessert','#BE185D'],['Snack','#C2410C'],['Drink','#2E7C82']];
const EVT=[{id:'birthday',name:'Birthday',color:'#B07A1E'},{id:'conference',name:'Conference',color:'#2E7C82'},
  {id:'holiday',name:'Holiday or trip',color:'#3F7A55'},{id:'other',name:'Other',color:'#6B6F78'}];
const LIB_SEED={"genres": ["Chemistry", "Spectroscopy & Magnetic Resonance", "Physics", "Astronomy & Space", "Mathematics & Logic", "Computing & Machine Learning", "Biology, Biochemistry & Medicine", "Oceans, Climate & Environment", "Popular Science", "History & Society", "Biography & Memoir", "Economics & Business", "Psychology & Self-Improvement", "Parenting", "Religion & Philosophy", "Classics & Poetry", "Fiction", "Comics", "Languages & Dictionaries", "Art, Colour & Design", "Photography", "Writing & Storytelling", "Crafts, Sewing & Fashion", "Electronics & Making", "Food, Baking & Brewing", "Gardening", "Travel & Guides"], "books": []};
const GROUP_SEED=[
  ['Science',['Chemistry','Spectroscopy & Magnetic Resonance','Physics','Astronomy & Space','Biology, Biochemistry & Medicine','Oceans, Climate & Environment','Popular Science']],
  ['Mathematics & Computing',['Mathematics & Logic','Computing & Machine Learning']],
  ['Society & Ideas',['History & Society','Biography & Memoir','Economics & Business','Psychology & Self-Improvement','Parenting','Religion & Philosophy']],
  ['Literature',['Classics & Poetry','Fiction','Comics','Writing & Storytelling']],
  ['Languages',['Languages & Dictionaries']],
  ['Arts',['Art, Colour & Design','Photography']],
  ['Practical & Hobbies',['Crafts, Sewing & Fashion','Electronics & Making','Food, Baking & Brewing','Gardening','Travel & Guides']]];
const HI=['#FFE14D','#FFC400','#FF8A3D','#FF6B6B','#FF5C8A','#E0457B','#C77DFF','#A66CFF',
  '#6C8CFF','#3DA5FF','#00B8D9','#2EC4A0','#1FAA59','#8BC34A','#C8A27A','#9AA3B2'];
const HI_DEFAULT='#FFC400';
const SW=['#2F5D8A','#1E6FB8','#2E7C82','#3F7A55','#4D7C0F','#B07A1E','#C2410C','#A8472F',
  '#9F1239','#BE185D','#8A3F6B','#7E22CE','#5B4FA8','#8B5E3C','#475569','#6B6F78'];
function textOn(hex){
  const m=/^#?([0-9a-f]{6})$/i.exec(hex||''); if(!m) return '#fff';
  const n=parseInt(m[1],16), c=[n>>16&255,n>>8&255,n&255].map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
  return (.2126*c[0]+.7152*c[1]+.0722*c[2])>.4?'#1C2433':'#fff';
}
const LS='planner-state-v1', LSV='planner-view-v1';
const fmtD=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'});
const fmtDow=new Intl.DateTimeFormat('en-GB',{weekday:'short'});
const fmtLong=new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long'});
const pad=n=>String(n).padStart(2,'0');
const key=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseKey=k=>{const[y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
const diffDays=(a,b)=>Math.round((parseKey(b)-parseKey(a))/864e5);
const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x};
let WEEK_START=0; // 0 = Sunday, 1 = Monday
const startOfWeekFor=(d,ws)=>addDays(d,-((d.getDay()-ws+7)%7));
const mondayOf=d=>startOfWeekFor(d,WEEK_START);
const wkNum=ws=>isoWeek(addDays(ws,WEEK_START===0?1:0));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
function isoWeek(d){const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);const y0=new Date(Date.UTC(x.getUTCFullYear(),0,1));return Math.ceil(((x-y0)/86400000+1)/7)}

function defaults(){return{themes:[
  {id:'work',name:'Work',color:SW[0],show:true},
  {id:'personal',name:'Personal',color:SW[1],show:true}],tasks:[],goals:[],events:[],tags:[{id:'gardening',name:'Gardening',color:'#3F7A55'}],evtypes:JSON.parse(JSON.stringify(EVT)),settings:{today:HI_DEFAULT}}}
function packBase(q,unit){ const f={g:1,gr:1,gram:1,grams:1,ml:1,kg:1000,kilo:1000,l:1000,liter:1000,litre:1000,cl:10,dl:100}[String(unit||'').trim().toLowerCase()]; return f&&typeof q==='number'&&q>0?q*f:null; }
function deriveK100(it,p){ if(typeof p.kcal!=='number') return; const b=packBase(p.qty,it.unit); if(b) p.k100=Math.round(p.kcal/b*1000)/10; }
function normalize(s){
  s=(s&&typeof s==='object')?JSON.parse(JSON.stringify(s)):{};
  if(!Array.isArray(s.themes)||!s.themes.length) s.themes=defaults().themes;
  s.themes.forEach(t=>{
    if(t.show===undefined)t.show=true;
    if(t.sections===undefined&&/meal/i.test(t.name||'')) t.sections=['Breakfast','Lunch','Dinner','Snacks'].map(n=>({id:uid(),name:n}));
    if(/meal/i.test(t.name||'')&&Array.isArray(t.sections)&&!t.addedExWater){
      if(!t.sections.some(x=>/exercis/i.test(x.name))) t.sections.push({id:uid(),name:'Exercise'});
      if(!t.sections.some(x=>/water/i.test(x.name))) t.sections.push({id:uid(),name:'Water'});
      t.addedExWater=true;
    }
    if(!Array.isArray(t.sections)) t.sections=[];
  });
  if(!Array.isArray(s.tasks)) s.tasks=[];
  if(!Array.isArray(s.goals)) s.goals=[];
  if(!Array.isArray(s.events)) s.events=[];
  if(!s.water||typeof s.water!=='object') s.water={};
  if(!Array.isArray(s.pantry)) s.pantry=[];
  if(!Array.isArray(s.pantryNeeded)) s.pantryNeeded=[];
  s.pantry.forEach(it=>{ if(!Array.isArray(it.packs)){ const pk={id:uid()}; if(typeof it.qty==='number') pk.qty=it.qty; if(it.exp) pk.exp=it.exp; it.packs=[pk]; } delete it.qty; delete it.exp; if(typeof it.kcal==='number'){ it.packs.forEach(p=>{ if(typeof p.kcal!=='number') p.kcal=it.kcal; }); } delete it.kcal; if(typeof it.k100==='number'){ it.packs.forEach(p=>{ if(typeof p.k100!=='number') p.k100=it.k100; }); } delete it.k100; it.packs.forEach(p=>{ if(typeof p.k100!=='number') deriveK100(it,p); }); });
  if(!Array.isArray(s.recipes)) s.recipes=[];
  s.recipes.forEach(r=>{ if(!Array.isArray(r.sections)||!r.sections.length) r.sections=[{id:uid(),title:'Ingredients',items:[]}]; r.sections.forEach(x=>{ if(!Array.isArray(x.items)) x.items=[]; if(!Array.isArray(x.comps)) x.comps=[]; x.comps.forEach(c=>{ if(!Array.isArray(c.items)) c.items=[]; }); }); if(!(r.servings>0)) r.servings=1; });
  if(!Array.isArray(s.recipeCats)) s.recipeCats=RCAT_SEED.map(([name,color])=>({id:uid(),name,color}));
  s.recipes.forEach(r=>{
    if(r.cat&&!r.catId){ const nm=String(r.cat).trim(); let c=s.recipeCats.find(x=>x.name.toLowerCase()===nm.toLowerCase());
      if(!c){ c={id:uid(),name:nm,color:SW[(s.recipeCats.length*3)%SW.length]}; s.recipeCats.push(c); } r.catId=c.id; }
    delete r.cat;
    if(r.catId&&!s.recipeCats.some(c=>c.id===r.catId)) delete r.catId;
  });
  if(!s.ingDB||typeof s.ingDB!=='object') s.ingDB={};
  if(!Array.isArray(s.books)){ s.books=LIB_SEED.books.map(b=>{ const o={id:uid(),title:b[0],author:b[1],genre:b[2]}; if(b[3]) o.lang=b[3]; return o; }); }
  if(!Array.isArray(s.genreGroups)){
    const subs=Array.isArray(s.bookGenres)?s.bookGenres:LIB_SEED.genres.slice();
    const groups=GROUP_SEED.map(([name,list])=>({name,subs:[]}));
    const find=sub=>{ const i=GROUP_SEED.findIndex(([,list])=>list.includes(sub)); return i>-1?groups[i]:null; };
    subs.forEach(sub=>{ let g=find(sub); if(!g){ g=groups.find(x=>x.name==='Other')||(groups.push({name:'Other',subs:[]}),groups[groups.length-1]); } g.subs.push(sub); });
    s.genreGroups=groups;
  }
  delete s.bookGenres;
  s.genreGroups.forEach(g=>{ if(!Array.isArray(g.subs)) g.subs=[]; });
  const allSubs=s.genreGroups.flatMap(g=>g.subs);
  s.books.forEach(b=>{ if(!b.genre) b.genre='Unsorted';
    if(!allSubs.includes(b.genre)){ let o=s.genreGroups.find(x=>x.name==='Other'); if(!o){ o={name:'Other',subs:[]}; s.genreGroups.push(o); } o.subs.push(b.genre); allSubs.push(b.genre); } });
  if(!Array.isArray(s.tags)) s.tags=[{id:uid(),name:'Gardening',color:'#3F7A55'}];
  if(!Array.isArray(s.evtypes)||!s.evtypes.length) s.evtypes=JSON.parse(JSON.stringify(EVT));
  if(!s.settings||typeof s.settings!=='object') s.settings={};
  if(!s.settings.today) s.settings.today=HI_DEFAULT;
  if(!s.settings.currency) s.settings.currency='EUR';
  if(!(s.settings.waterGoalL>0)) s.settings.waterGoalL=2;
  delete s.settings.waterGoal;
  if(s.settings.weekStart!==0&&s.settings.weekStart!==1) s.settings.weekStart=0;
  const wsd=s.settings.weekStart;
  const fixWk=x=>{ if(x&&typeof x.week==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.week)){ x.week=key(startOfWeekFor(addDays(parseKey(x.week),3),wsd)); } };
  s.tasks.forEach(fixWk);
  s.goals.forEach(g=>(g.subs||[]).forEach(sub=>(sub.steps||[]).forEach(fixWk)));
  s.goals.forEach(g=>{
    if(!Array.isArray(g.subs)){ g.subs=(Array.isArray(g.steps)&&g.steps.length)?[{id:uid(),title:'General',steps:g.steps}]:[]; }
    delete g.steps;
    g.subs.forEach(x=>{ if(!Array.isArray(x.steps)) x.steps=[]; });
  });
  return s;
}

const S={state:normalize(defaults()),subAdd:null,view:'week',week:mondayOf(new Date()),month:(d=>new Date(d.getFullYear(),d.getMonth(),1))(new Date()),editing:null,filter:'all',confirm:null,focus:null,themeFocus:null,touched:false,sel:null,selAt:0};
try{const raw=localStorage.getItem(LS); if(raw) S.state=normalize(JSON.parse(raw))}catch(e){}
function applyWeekStart(){ WEEK_START=S.state.settings.weekStart===1?1:0; S.week=mondayOf(addDays(S.week,3)); }
applyWeekStart();
try{const v=localStorage.getItem(LSV); if(['goals','library','pantry','recipes'].includes(v)) S.view=v}catch(e){}

const $=id=>document.getElementById(id);
const main=$('main'), themeDlg=$('themeDlg'), themeList=$('themeList'), syncEl=$('sync');

function h(tag,a,...kids){
  const el=document.createElement(tag);
  for(const [k,v] of Object.entries(a||{})){
    if(v==null||v===false) continue;
    if(k==='class') el.className=v;
    else if(k==='text') el.textContent=v;
    else if(k==='style') el.style.cssText=v;
    else if(k.startsWith('on')) el.addEventListener(k.slice(2),v);
    else if(k in el && typeof v!=='string') el[k]=v;
    else el.setAttribute(k,v===true?'':v);
  }
  for(const c of kids.flat()) if(c!=null&&c!==false) el.append(c.nodeType?c:String(c));
  return el;
}
const themeOf=id=>S.state.themes.find(t=>t.id===id)||S.state.themes[0];
const goalById=id=>S.state.goals.find(g=>g.id===id);
const allSteps=g=>g?g.subs.flatMap(x=>x.steps):[];
function findStep(g,id){ if(!g) return null; for(const sub of g.subs){ const i=sub.steps.findIndex(x=>x.id===id); if(i>-1) return {sub,list:sub.steps,i,step:sub.steps[i]}; } return null; }

/* ---------- persistence ---------- */
let docRef=null, saveTimer=null, writing=false, dirty=false;
function setSync(t){syncEl.textContent=t}
function saveLocal(){try{localStorage.setItem(LS,JSON.stringify(S.state))}catch(e){}}
function save(){
  S.touched=true; saveLocal();
  clearTimeout(saveTimer); saveTimer=setTimeout(pushRemote,600);
}
async function pushRemote(){
  if(!docRef) return;
  if(writing){dirty=true;return}
  writing=true; setSync('Saving…');
  try{ await docRef.set({state:S.state,v:1}); setSync('Saved to your account') }
  catch(e){ setSync('Saved on this device only') }
  writing=false;
  if(dirty){dirty=false;pushRemote()}
}
(async function connect(){
  try{
    if(!window.claude||typeof window.claude.use!=='function') return;
    const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
    if(!db||!user) return;
    const id=await user.id();
    if(!id) return;
    const ref=db.doc('data/users/'+id+'/planner');
    const snap=await ref.get();
    docRef=ref;
    const remote=snap.exists?snap.data():null;
    if(remote&&remote.state&&!S.touched){
      S.state=normalize(remote.state); applyWeekStart(); saveLocal(); render(); setSync('Saved to your account');
    } else {
      await pushRemote();
    }
  }catch(e){ setSync('Saved on this device') }
})();

function commit(){ render(); save(); }

/* ---------- backup ---------- */
const dlP=(window.claude&&typeof window.claude.use==='function')?window.claude.use('downloads').catch(()=>null):Promise.resolve(null);
function flash(t){ const prev=syncEl.textContent; syncEl.textContent=t; setTimeout(()=>{ if(syncEl.textContent===t) syncEl.textContent=prev; },3500); }
async function exportBackup(){
  const data=JSON.stringify({app:'planner',version:1,exported:new Date().toISOString(),state:S.state},null,2);
  const name=`planner-backup-${key(new Date())}.json`;
  const dl=await dlP;
  if(dl){
    try{ await dl.save({filename:name,data}); flash('Backup saved'); }
    catch(e){ if(!e||e.code!=='declined') flash('Couldn’t save the backup here. Try the downloaded copy of the planner.'); }
    return;
  }
  const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
  const a=h('a',{href:url,download:name}); document.body.append(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  flash('Backup saved to your downloads');
}
let pendingImport=null;
const impDlg=$('impDlg');
$('exportBtn').addEventListener('click',exportBackup);
$('importBtn').addEventListener('click',()=>$('importFile').click());
$('importFile').addEventListener('change',async e=>{
  const f=e.target.files&&e.target.files[0]; e.target.value='';
  if(!f) return;
  let obj; try{ obj=JSON.parse(await f.text()); }catch(err){ flash('That file isn’t a planner backup'); return; }
  const st=obj&&obj.state?obj.state:obj;
  if(!st||!Array.isArray(st.themes)){ flash('That file isn’t a planner backup'); return; }
  pendingImport=normalize(st);
  const when=obj.exported?new Date(obj.exported).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'an unknown date';
  const n=pendingImport.tasks.length, g=pendingImport.goals.length, ev=pendingImport.events.length;
  $('impText').textContent=`This backup is from ${when} and has ${n} task${n===1?'':'s'}, ${g} project${g===1?'':'s'} and ${ev} all-day event${ev===1?'':'s'}. It replaces everything currently in your planner, so export a backup first if you want to keep what’s here.`;
  impDlg.showModal(); $('impCancel').focus();
});
$('impCancel').addEventListener('click',()=>impDlg.close());
$('impOk').addEventListener('click',()=>{
  if(pendingImport){ S.state=pendingImport; applyWeekStart(); S.editing=null; S.sel=null; S.confirm=null; commit(); flash('Backup restored'); }
  pendingImport=null; impDlg.close();
});
impDlg.addEventListener('close',()=>{pendingImport=null});

/* ---------- editing ---------- */
function applyEdit(ed){
  const text=(ed.draft||'').trim();
  if(ed.kind==='new'){
    if(text){ const nt=ed.week?{id:uid(),themeId:ed.themeId,date:null,week:ed.week,text,done:false}:{id:uid(),themeId:ed.themeId,date:ed.date,text,done:false}; if(ed.section) nt.section=ed.section; S.state.tasks.push(nt); }
  } else if(ed.kind==='task'){
    const i=S.state.tasks.findIndex(x=>x.id===ed.id);
    if(i>-1){ if(text) S.state.tasks[i].text=text; else S.state.tasks.splice(i,1); }
  } else if(ed.kind==='log'){
    const o=ownerOf(ed); if(!o||!o.log) return;
    const i=o.log.findIndex(l=>l.id===ed.id);
    if(i>-1){ if(text) o.log[i].text=text; else o.log.splice(i,1); }
  } else if(ed.kind==='step'){
    const g=goalById(ed.goalId); if(!g) return;
    const f=findStep(g,ed.id);
    if(f){ if(text) f.step.text=text; else f.list.splice(f.i,1); }
  }
}
function ownerOf(ed){
  if(ed.ownerKind==='task') return S.state.tasks.find(x=>x.id===ed.ownerId);
  const g=goalById(ed.goalId); const f=findStep(g,ed.ownerId); return f&&f.step;
}
function startEdit(ed){
  if(S.editing){ if(S.editing.kind===ed.kind&&S.editing.id===ed.id&&S.editing.date===ed.date&&S.editing.week===ed.week&&S.editing.section===ed.section&&S.editing.themeId===ed.themeId) return; applyEdit(S.editing); }
  S.editing=Object.assign({},ed,{focus:true});
  commit();
}
function editorInput(ed){
  const inp=h('input',{class:'editor',type:'text',value:ed.draft||'',
    'aria-label':ed.kind==='new'?'New task':(ed.kind==='step'?'Edit step':(ed.kind==='log'?'Edit entry':'Edit task')),
    placeholder:ed.kind==='new'?'New task':'','data-autofocus':ed.focus?'1':null});
  inp.addEventListener('input',()=>{ed.draft=inp.value});
  inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      e.preventDefault(); applyEdit(ed);
      S.editing=ed.kind==='new'?{kind:'new',themeId:ed.themeId,date:ed.date,week:ed.week,section:ed.section,draft:'',focus:true}:null;
      commit();
    } else if(e.key==='Escape'){ e.preventDefault(); S.editing=null; render(); }
  });
  inp.addEventListener('blur',()=>{
    setTimeout(()=>{
      if(S.editing!==ed) return;
      const cur=document.querySelector('.editor');
      if(cur&&document.activeElement===cur) return;
      applyEdit(ed); S.editing=null; commit();
    },150);
  });
  return inp;
}
function editHandlers(ed){
  return {
    onmousedown:e=>{ if(S.editing){ e.preventDefault(); startEdit(ed); } },
    onclick:()=>startEdit(ed),
    onkeydown:e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); startEdit(ed); } }
  };
}

/* ---------- week view ---------- */
const COLS_DEFAULT=[1,1,1,1,1,1,1];
function colWeights(){ let c=S.state.settings.cols; if(Array.isArray(c)&&c.length===8) c=c.slice(1); return (Array.isArray(c)&&c.length===7&&c.every(x=>typeof x==='number'&&x>0))?c:COLS_DEFAULT; }
function colTemplate(w=colWeights()){ return `2.9rem ${w.map(x=>`minmax(4.5rem,${x}fr)`).join(' ')}`; }
function setGripHeight(){ const g=main.querySelector('.week'); if(!g) return; const hd=g.querySelector('.dayhead'); g.style.setProperty('--gh',(g.getBoundingClientRect().bottom-(hd?hd.getBoundingClientRect().top:g.getBoundingClientRect().top))+'px'); }
window.addEventListener('resize',setGripHeight);
function startResize(e,i,grid,hdrs){
  if(e.button!==0) return;
  e.preventDefault();
  const w=colWeights().slice();
  const a=hdrs[i].getBoundingClientRect().width, b=hdrs[i+1].getBoundingClientRect().width;
  const x0=e.clientX, tot=a+b, wt=w[i]+w[i+1], min=72;
  const grip=e.currentTarget; grip.setPointerCapture(e.pointerId);
  grip.classList.add('active'); document.body.classList.add('resizing');
  let moved=false;
  const move=ev=>{ moved=true; const pa=Math.min(tot-min,Math.max(min,a+ev.clientX-x0));
    w[i]=wt*pa/tot; w[i+1]=wt-w[i]; grid.style.gridTemplateColumns=colTemplate(w); };
  const up=()=>{
    grip.removeEventListener('pointermove',move); grip.removeEventListener('pointerup',up); grip.removeEventListener('pointercancel',up);
    grip.classList.remove('active'); document.body.classList.remove('resizing');
    if(moved){ S.state.settings.cols=w.map(x=>Math.round(x*1000)/1000); save(); render(); } else setGripHeight();
  };
  grip.addEventListener('pointermove',move); grip.addEventListener('pointerup',up); grip.addEventListener('pointercancel',up);
}
function moveThemeTo(id,targetId){
  const a=S.state.themes, from=a.findIndex(x=>x.id===id), to=a.findIndex(x=>x.id===targetId);
  if(from<0||to<0||from===to) return;
  const [t]=a.splice(from,1); a.splice(to,0,t); commit();
}
function renderSpine(t){
  const sp=h('div',{class:'spine',role:'button',tabindex:'0',draggable:'true','data-k':'sp:'+t.id,style:`--c:${t.color};--on:${textOn(t.color)}`,
    'aria-label':`${t.name}. Click for themes and colours. Drag, or Alt plus up or down arrow, to reorder`,
    title:'Drag to reorder rows. Click for themes and colours.'},t.name);
  sp.addEventListener('click',()=>openThemes(t.id));
  sp.addEventListener('keydown',e=>{
    if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){
      e.preventDefault();
      const vis=S.state.themes.filter(x=>x.show), i=vis.indexOf(t), j=i+(e.key==='ArrowUp'?-1:1);
      if(j>=0&&j<vis.length) moveThemeTo(t.id,vis[j].id);
    } else if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openThemes(t.id); }
  });
  sp.addEventListener('dragstart',e=>{
    e.dataTransfer.setData('application/x-theme',t.id); e.dataTransfer.setData('text/plain',JSON.stringify({kind:'theme',id:t.id}));
    e.dataTransfer.effectAllowed='move'; sp.classList.add('dragging');
  });
  sp.addEventListener('dragend',()=>{ sp.classList.remove('dragging'); document.querySelectorAll('.spine.over').forEach(x=>x.classList.remove('over')); });
  sp.addEventListener('dragover',e=>{ if(!e.dataTransfer.types.includes('application/x-theme')) return; e.preventDefault(); e.dataTransfer.dropEffect='move'; sp.classList.add('over'); });
  sp.addEventListener('dragleave',()=>sp.classList.remove('over'));
  sp.addEventListener('drop',e=>{ const id=e.dataTransfer.getData('application/x-theme'); if(!id) return; e.preventDefault(); sp.classList.remove('over'); moveThemeTo(id,t.id); });
  return sp;
}
const fmtMonth=new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric'});
function syncMonth(){ const t=addDays(S.week,3); S.month=new Date(t.getFullYear(),t.getMonth(),1); }
function goWeek(d){ S.week=mondayOf(d); syncMonth(); render(); }
function setMonth(delta){ S.month=new Date(S.month.getFullYear(),S.month.getMonth()+delta,1); S.week=mondayOf(S.month); render(); }
function eventsOn(k){
  const y=Number(k.slice(0,4));
  return S.state.events.filter(ev=>{
    if(!ev.yearly) return ev.start<=k&&ev.end>=k;
    const span=Number(ev.end.slice(0,4))-Number(ev.start.slice(0,4));
    for(let yy=y-1;yy<=y;yy++){ const s0=shiftYear(ev.start,yy), e0=shiftYear(ev.end,yy+span); if(s0<=k&&e0>=k) return true; }
    return false;
  });
}
function renderMonth(){
  const m0=S.month, last=new Date(m0.getFullYear(),m0.getMonth()+1,0);
  const start=mondayOf(m0), end=addDays(mondayOf(last),6);
  const nWeeks=Math.round((diffDays(key(start),key(end))+1)/7);
  const today=key(new Date()), curWk=key(S.week);
  const prio={};
  S.state.tasks.forEach(x=>{ if(x.prio&&x.date) (prio[x.date]=prio[x.date]||[]).push({o:x,t:themeOf(x.themeId)}); });
  S.state.goals.forEach(g=>allSteps(g).forEach(x=>{ if(x.prio&&x.date) (prio[x.date]=prio[x.date]||[]).push({o:x,t:themeOf(g.themeId)}); }));
  const grid=h('div',{class:'month',role:'grid','aria-label':fmtMonth.format(m0)});
  grid.append(h('div',{class:'mdow first'}));
  for(let i=0;i<7;i++) grid.append(h('div',{class:'mdow',text:fmtDow.format(addDays(start,i))}));
  for(let w=0;w<nWeeks;w++){
    const ws=addDays(start,w*7), isCur=key(ws)===curWk;
    grid.append(h('button',{class:'mwk'+(isCur?' cur':''),'aria-label':`Show week ${wkNum(ws)} above`,title:`Show week ${wkNum(ws)} above`,
      onclick:()=>{ S.week=ws; render(); window.scrollTo({top:0,behavior:'smooth'}); }},String(wkNum(ws))));
    for(let i=0;i<7;i++){
      const d=addDays(ws,i), k=key(d);
      const cell=h('div',{class:'mday'+(d.getMonth()!==m0.getMonth()?' out':'')+(isCur?' cur':'')+(k===today?' today':''),
        role:'button',tabindex:'0','aria-label':`${fmtLong.format(d)}. Show this week above`});
      const go=()=>{ S.week=mondayOf(d); render(); window.scrollTo({top:0,behavior:'smooth'}); };
      cell.addEventListener('click',go);
      cell.addEventListener('keydown',e=>{ if(e.target===cell&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); go(); } });
      cell.append(h('div',{class:'mnum',text:String(d.getDate())}),
        h('button',{class:'madd','aria-label':`Add an all-day event on ${fmtLong.format(d)}`,title:'Add an event on this day',
          onclick:e=>{ e.stopPropagation(); openEvent(null,k); }},'+'));
      const entries=[];
      eventsOn(k).forEach(ev=>{ const t=evType(ev.type);
        entries.push(h('div',{class:'mev',role:'button',tabindex:'0',style:`--c:${t.color}`,title:evTip(ev,t.name),
          onclick:e=>{ e.stopPropagation(); openEvent(ev.id); },onkeydown:e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); e.stopPropagation(); openEvent(ev.id); } }},
          ev.t1?h('span',{class:'evtm',text:ev.t1}):null,h('span',{class:'evtxt',text:ev.title||'Untitled'}),ev.notes?h('span',{class:'evnote','aria-hidden':'true',text:'✎'}):null,evLink(ev))); });
      (prio[k]||[]).forEach(({o,t})=>{ const tg=tagOf(o);
        entries.push(h('div',{class:'mpr'+(o.done?' done':'')+(o.missed&&!o.done?' missed':''),style:`--c:${tg?tg.color:t.color}`,
          title:`High priority: ${o.text} (${t.name}${tg?`, ${tg.name}`:''})`},h('i'),h('b',{text:'!'}),o.text)); });
      const MAX=4;
      entries.slice(0,MAX).forEach(x=>cell.append(x));
      if(entries.length>MAX) cell.append(h('div',{class:'mmore',text:`+${entries.length-MAX} more`}));
      grid.append(cell);
    }
  }
  return h('section',{class:'monthsec','aria-label':'Month'},
    h('div',{class:'monthhead'},
      h('h2',{text:fmtMonth.format(m0)}),
      h('button',{class:'icon','aria-label':'Previous month',onclick:()=>setMonth(-1)},'‹'),
      h('button',{class:'pill',disabled:m0.getFullYear()===new Date().getFullYear()&&m0.getMonth()===new Date().getMonth(),
        onclick:()=>{ const n=new Date(); S.month=new Date(n.getFullYear(),n.getMonth(),1); S.week=mondayOf(n); render(); }},'This month'),
      h('button',{class:'icon','aria-label':'Next month',onclick:()=>setMonth(1)},'›'),
      h('button',{class:'pill primary',onclick:()=>{ const n=new Date(); const inMonth=n.getFullYear()===m0.getFullYear()&&n.getMonth()===m0.getMonth(); openEvent(null,key(inMonth?n:m0)); }},'+ Add event'),
      h('span',{class:'monthnote',text:'All-day events and high-priority tasks. Hover a day and click + to add an event there; click the day itself to show its week above.'})),
    h('div',{class:'monthscroll'},grid));
}
function spendIn(match){
  const by=new Map(); let total=0;
  const add=(themeId,n)=>{ const t=themeOf(themeId); by.set(t,(by.get(t)||0)+n); total+=n; };
  S.state.tasks.forEach(x=>{ if(typeof x.amount==='number'&&match(x)) add(x.themeId,x.amount); });
  S.state.goals.forEach(g=>allSteps(g).forEach(x=>{ if(typeof x.amount==='number'&&match(x)) add(g.themeId,x.amount); }));
  return {total:Math.round(total*100)/100,by:[...by.entries()].filter(([,n])=>n)};
}
function spendCell(res,cls,label,extraLine){
  const c=h('div',{class:'cell spend'+cls,role:'group','aria-label':`Spent ${label}: ${money(res.total)}`});
  c.append(h('div',{class:'stot'+(res.total?'':' zero'),text:res.total?money(res.total):'–'}));
  if(extraLine) c.append(extraLine);
  if(res.by.length>1||(res.by.length===1&&extraLine)) res.by.forEach(([t,n])=>c.append(h('div',{class:'sline',style:`--c:${t.color}`},h('i'),h('span',{text:t.name}),money(n))));
  return c;
}
function renderSpendRow(grid,days,today){
  const wk=key(S.week), dayKeys=days.map(key);
  const week=spendIn(x=>(x.date&&dayKeys.includes(x.date))||(!x.date&&x.week===wk));
  const undated=spendIn(x=>!x.date&&x.week===wk);
  grid.append(h('div',{class:'spine spendspine',style:'--c:#475569;--on:#fff',
    title:`Daily spending totals across all themes. Week total ${money(week.total)}${undated.total?`, incl. ${money(undated.total)} from This week tasks`:''}`},
    week.total?`Spent · ${money(week.total)}`:'Spent'));
  days.forEach((d,i)=>{ const k=dayKeys[i]; grid.append(spendCell(spendIn(x=>x.date===k),(k===today?' today':'')+(i===6?' last':''),fmtLong.format(d))); });
}
/* ---------- recipes ---------- */
const RUNITS=['g','kg','ml','L','tsp','tbsp','cup','pcs','slice','clove','pinch','can'];
const RF=['kcal','carb','prot'];
const rnum=v=>{ v=String(v??'').trim().replace(',','.'); if(v==='') return null; const n=Number(v); return isFinite(n)?n:NaN; };
const rround=(f,v)=>f==='kcal'?Math.round(v):Math.round(v*10)/10;
const ingKey=it=>`${(it.name||'').trim().toLowerCase()}|${(it.unit||'').trim().toLowerCase()}`;
function ingApply(it){ const e=S.state.ingDB[ingKey(it)]; if(!e||!(it.amt>0)||!it.name) return false; let any=false;
  RF.forEach(f=>{ if(typeof e[f]==='number'){ it[f]=rround(f,e[f]*it.amt); any=true; } }); return any; }
function ingLearn(it,only){ if(!it.name||!(it.amt>0)) return; const k=ingKey(it); const e=S.state.ingDB[k]||(S.state.ingDB[k]={});
  (only?[only]:RF).forEach(f=>{ if(typeof it[f]==='number') e[f]=it[f]/it.amt; }); }
function recTotals(items){ const t={kcal:0,carb:0,prot:0}; items.forEach(it=>RF.forEach(f=>{ if(typeof it[f]==='number') t[f]+=it[f]; })); return t; }
function fmtNut(f,v){ return f==='kcal'?String(Math.round(v)):(Math.round(v*10)/10).toLocaleString(undefined,{maximumFractionDigits:1}); }
const UNIT_MAP={g:'g',gr:'g',gram:'g',grams:'g',gramme:'g',grammes:'g',kg:'kg',kilo:'kg',kilos:'kg',kilogram:'kg',kilograms:'kg',mg:'mg',
  ml:'ml',millilitre:'ml',milliliter:'ml',millilitres:'ml',milliliters:'ml',cl:'cl',dl:'dl',l:'L',liter:'L',litre:'L',liters:'L',litres:'L',
  tsp:'tsp',tsps:'tsp',teaspoon:'tsp',teaspoons:'tsp',tl:'tsp',theelepel:'tsp',theelepels:'tsp',
  tbsp:'tbsp',tbsps:'tbsp',tbs:'tbsp',tablespoon:'tbsp',tablespoons:'tbsp',el:'tbsp',eetlepel:'tbsp',eetlepels:'tbsp',
  cup:'cup',cups:'cup',oz:'oz',ounce:'oz',ounces:'oz',lb:'lb',lbs:'lb',pound:'lb',pounds:'lb',
  clove:'clove',cloves:'clove',teen:'clove',teentjes:'clove',can:'can',cans:'can',blik:'can',blikken:'can',tin:'can',tins:'can',
  pinch:'pinch',pinches:'pinch',snufje:'pinch',slice:'slice',slices:'slice',plak:'slice',plakken:'slice',
  piece:'pcs',pieces:'pcs',pc:'pcs',pcs:'pcs',stuk:'pcs',stuks:'pcs',bunch:'bunch',bunches:'bunch',bos:'bunch',handful:'handful',handfuls:'handful',
  sprig:'sprig',sprigs:'sprig',takje:'sprig',takjes:'sprig',stick:'stick',sticks:'stick',pack:'pack',packs:'pack',package:'pack',packages:'pack',pak:'pack',zakje:'pack',
  jar:'jar',jars:'jar',pot:'jar',bottle:'bottle',bottles:'bottle',fles:'bottle',dash:'dash',dashes:'dash',drop:'drop',drops:'drop'};
const FRAC={'½':.5,'¼':.25,'¾':.75,'⅓':1/3,'⅔':2/3,'⅛':.125,'⅜':.375,'⅝':.625,'⅞':.875,'⅕':.2,'⅖':.4,'⅗':.6,'⅘':.8,'⅙':1/6,'⅚':5/6};
function parseIngLine(raw){
  let t=String(raw).replace(/\u00a0/g,' ').trim();
  t=t.replace(/^[\s•●○◦▪▫■□▢☐✓✔\-–—*·]+/,'').trim();
  t=t.replace(/^\d+[.)]\s+(?=\S)/,'');
  if(!t) return null;
  if(/^(ingredients?|ingrediënten|ingredienti|ingrédients|method|instructions|directions|bereiding|preparation|equipment|notes?)\s*:?$/i.test(t)) return null;
  if(/:$/.test(t)&&t.length<60&&!/^\d/.test(t)){ const hd=t.replace(/:$/,'').replace(/^(for|voor)\s+(the|de|het)?\s*/i,'').trim(); return hd?{header:hd.charAt(0).toUpperCase()+hd.slice(1)}:null; }
  for(const [c,v] of Object.entries(FRAC)) t=t.replace(new RegExp('(\\d)\\s*'+c),(m,d)=>`${d} ${v}`).replace(new RegExp(c,'g'),String(v));
  const num='(?:\\d+(?:[.,]\\d+)?(?:\\s*/\\s*\\d+)?)';
  const m=t.match(new RegExp(`^(${num}(?:\\s+${num})?)(?:\\s*(?:-|–|to)\\s*${num})?\\s*(.*)$`,'i'));
  let amt=null, rest=t;
  if(m&&m[1]){
    amt=m[1].trim().split(/\s+/).reduce((sum,part)=>{ if(part.includes('/')){ const [a,b]=part.split('/').map(x=>Number(x.replace(',','.'))); return sum+(b?a/b:0); } return sum+Number(part.replace(',','.')); },0);
    rest=m[2]||'';
    if(!isFinite(amt)) amt=null;
  }
  let note='';
  const pm=rest.match(/^\(([^)]*)\)\s*/); if(pm){ note=pm[1].trim(); rest=rest.slice(pm[0].length); }
  let unit=null;
  const um=rest.match(/^([A-Za-zÀ-ÿ]+)\.?(?=\s|$|,)/);
  if(um&&UNIT_MAP[um[1].toLowerCase()]&&(amt!==null||um[1].length>1)){
    const u=um[1].toLowerCase();
    if(!(u==='l'&&amt===null)){ unit=UNIT_MAP[u]; rest=rest.slice(um[0].length); }
  }
  rest=rest.replace(/^\s*\.?\s*(of|van)\s+/i,'').replace(/^\s*[-–,]\s*/,'').trim().replace(/[,;]\s*$/,'');
  if(!rest&&unit){ rest=unit; unit=null; }
  if(note) rest+=` (${note})`;
  if(!rest) return null;
  const it={id:uid(),name:rest.charAt(0).toUpperCase()+rest.slice(1)};
  if(amt!==null&&amt>0) it.amt=Math.round(amt*1000)/1000;
  if(unit) it.unit=unit;
  return it;
}
function parseIngText(text){ return String(text||'').split(/\r?\n/).map(parseIngLine).filter(Boolean); }
function newRecipe(){ const r={id:uid(),name:'',servings:1,sections:[{id:uid(),title:'Ingredients',items:[]}],method:''};
  const sc=S.rec&&S.rec.cat; if(sc&&sc!=='all'&&S.state.recipeCats.some(c=>c.id===sc)) r.catId=sc;
  S.state.recipes.unshift(r); S.focus='rt:'+r.id; commit(); }
const UNCAT={id:'',name:'Uncategorised',color:'#6B6F78'};
const COMPC=['#E0A100','#2E7C82','#BE185D','#4D7C0F','#7E22CE','#C2410C','#1E6FB8','#8B5E3C'];
const secItems=x=>[...x.items,...(x.comps||[]).flatMap(c=>c.items)];
const rcatOf=r=>S.state.recipeCats.find(c=>c.id===r.catId)||null;
function moveRecipe(src,target,aft){
  const a=S.state.recipes; if(src===target) return;
  if(target.catId) src.catId=target.catId; else delete src.catId;
  a.splice(a.indexOf(src),1); a.splice(a.indexOf(target)+(aft?1:0),0,src); commit();
}
function renderRecipes(){
  const R=S.rec||(S.rec={q:'',cat:'all',closed:new Set()});
  const all=S.state.recipes, q=R.q.trim().toLowerCase(), C=S.state.recipeCats;
  if(R.cat!=='all'&&R.cat!==''&&!C.some(c=>c.id===R.cat)) R.cat='all';
  const match=r=>!q||[r.name,(rcatOf(r)||{}).name,r.method,...r.sections.flatMap(x=>[x.title,x.method,...(x.comps||[]).flatMap(c=>[c.title,c.method]),...secItems(x).map(i=>i.name)])].some(x=>x&&String(x).toLowerCase().includes(q));
  const groups=[...C.map(c=>({c,list:all.filter(r=>r.catId===c.id)})),{c:UNCAT,list:all.filter(r=>!rcatOf(r))}];
  const shown=groups.filter(g=>R.cat==='all'||g.c.id===R.cat).map(g=>({c:g.c,list:g.list.filter(match)}));
  const vis=shown.flatMap(g=>g.list);
  const wrap=h('div');
  const search=h('input',{class:'libsearch',type:'search',placeholder:'Search recipes, parts and ingredients…','aria-label':'Search recipes','data-k':'rq',value:R.q});
  search.addEventListener('input',()=>{ R.q=search.value; renderMain(); const el=document.querySelector('[data-k="rq"]'); if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);} });
  wrap.append(h('div',{class:'libbar'},h('button',{class:'pill primary',onclick:newRecipe},'New recipe'),search,
    vis.length?h('button',{class:'link',onclick:()=>{ const allC=vis.every(r=>R.closed.has(r.id)); vis.forEach(r=>allC?R.closed.delete(r.id):R.closed.add(r.id)); render(); }},vis.every(r=>R.closed.has(r.id))?'Expand all':'Collapse all'):null,
    h('span',{class:'libcount',text:(q||R.cat!=='all')?`${vis.length} of ${all.length} recipes`:`${all.length} recipe${all.length===1?'':'s'}`})));
  const goTo=r=>{ if(R.cat!=='all'&&R.cat!==(r.catId||'')) R.cat='all'; R.closed.delete(r.id); render();
    setTimeout(()=>{ const el=document.getElementById('rc-'+r.id); if(el){ const rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches; el.scrollIntoView({behavior:rm?'auto':'smooth',block:'start'}); } },0); };
  const dropOn=(li,onDrop)=>{
    li.addEventListener('dragover',e=>{ if(!e.dataTransfer.types.includes('application/x-recipe')) return; e.preventDefault(); e.stopPropagation(); li.classList.add('over'); });
    li.addEventListener('dragleave',e=>{ if(!li.contains(e.relatedTarget)) li.classList.remove('over'); });
    li.addEventListener('drop',e=>{ const id=e.dataTransfer.getData('application/x-recipe'); if(!id) return; e.preventDefault(); e.stopPropagation(); li.classList.remove('over'); const src=all.find(x=>x.id===id); if(src) onDrop(src,e); });
  };
  // sidebar
  const toc=h('aside',{class:'toc ptoc rtoc','aria-label':'Recipe categories'},
    h('div',{class:'tochd'},h('b',{text:'Categories'}),h('button',{class:'link',style:'width:auto;padding:0','data-k':'rce',onclick:()=>{R.editCats=!R.editCats;S.confirm=null;render()}},R.editCats?'Done':'Edit')));
  if(R.editCats){
    C.forEach((c,ci)=>{
      const nm=h('input',{class:'nm',type:'text',value:c.name,style:`--c:${c.color}`,'aria-label':'Category name','data-k':'rcn:'+c.id,'data-autofocus':S.focus==='rcn:'+c.id?'1':null});
      nm.addEventListener('change',()=>{ const v=nm.value.trim(); if(v){ c.name=v; commit(); } else nm.value=c.name; });
      nm.addEventListener('keydown',e=>{ if(e.key==='Enter') nm.blur(); });
      const mv=d=>{ const j=ci+d; if(j<0||j>=C.length) return; [C[ci],C[j]]=[C[j],C[ci]]; commit(); };
      const n=all.filter(r=>r.catId===c.id).length;
      const del=S.confirm==='rcd:'+c.id
        ? h('button',{class:'link danger','data-k':'rcd:'+c.id,title:n?'Its recipes become uncategorised':'',onclick:()=>{ S.state.recipeCats=C.filter(x=>x!==c); all.forEach(r=>{ if(r.catId===c.id) delete r.catId; }); S.confirm=null; commit(); }},'Delete?')
        : h('button',{class:'x',style:'opacity:.6','aria-label':`Delete ${c.name}`,title:'Delete category','data-k':'rcd:'+c.id,onclick:()=>{S.confirm='rcd:'+c.id;render()}},'×');
      toc.append(h('div',{class:'rce'},
        h('div',{class:'rcerow'},nm,
          h('button',{class:'gmove','aria-label':`Move ${c.name} up`,disabled:ci===0,onclick:()=>mv(-1)},'↑'),
          h('button',{class:'gmove','aria-label':`Move ${c.name} down`,disabled:ci===C.length-1,onclick:()=>mv(1)},'↓'),del),
        h('div',{class:'dots',role:'group','aria-label':`Colour for ${c.name}`},
          SW.map((col,k)=>h('button',{style:`--sw:${col}`,'aria-label':`Colour ${k+1}`,'aria-pressed':String(c.color.toLowerCase()===col.toLowerCase()),onclick:()=>{c.color=col;commit()}})),
          colourPick(c.color,SW,`Custom colour for ${c.name}`,'rcc:'+c.id,v=>{c.color=v}))));
    });
    toc.append(h('button',{class:'pill',style:'margin-top:10px;width:auto',onclick:()=>{ const c={id:uid(),name:'New category',color:SW[(C.length*3)%SW.length]}; C.push(c); S.focus='rcn:'+c.id; commit(); }},'+ Add category'));
  } else {
    const ul=h('ul',{});
    ul.append(h('li',{},h('button',{class:'pitem'+(R.cat==='all'?' on':''),style:'--c:var(--ink)',onclick:()=>{R.cat='all';render()}},h('i'),h('span',{class:'pt',text:'All recipes'}),h('span',{class:'pn',text:String(all.length)}))));
    groups.forEach(g=>{
      if(g.c===UNCAT&&!g.list.length) return;
      const li=h('li',{style:`--c:${g.c.color}`});
      li.append(h('button',{class:'pitem'+(R.cat===g.c.id?' on':''),'data-k':'rcf:'+g.c.id,title:'Show only this category. Drop a recipe here to move it.',
        onclick:()=>{ R.cat=R.cat===g.c.id?'all':g.c.id; render(); }},h('i'),h('span',{class:'pt',text:g.c.name}),h('span',{class:'pn',text:String(g.list.length)})));
      dropOn(li,src=>{ if(g.c.id) src.catId=g.c.id; else delete src.catId; const a=S.state.recipes; a.splice(a.indexOf(src),1); const last=g.list.filter(x=>x!==src).slice(-1)[0]; a.splice(last?a.indexOf(last)+1:a.length,0,src); commit(); });
      const items=g.list.filter(match);
      if(items.length){
        const sub=h('ul',{class:'rlist'});
        items.forEach(r=>{
          const ri=h('li',{});
          const b=h('button',{class:'ritem',draggable:'true','data-k':'rci:'+r.id,title:'Click to go to this recipe. Drag to another category or position.',onclick:()=>goTo(r)},h('span',{class:'pt',text:r.name||'Untitled recipe'}));
          b.addEventListener('dragstart',e=>{ e.dataTransfer.setData('application/x-recipe',r.id); e.dataTransfer.effectAllowed='move'; });
          const aft=e=>{ const x=ri.getBoundingClientRect(); return e.clientY>x.top+x.height/2; };
          ri.addEventListener('dragover',e=>{ if(!e.dataTransfer.types.includes('application/x-recipe')) return; e.preventDefault(); e.stopPropagation(); const x=aft(e); ri.classList.toggle('gdrop-after',x); ri.classList.toggle('gdrop-before',!x); });
          ri.addEventListener('dragleave',e=>{ if(!ri.contains(e.relatedTarget)) ri.classList.remove('gdrop-before','gdrop-after'); });
          ri.addEventListener('drop',e=>{ const id=e.dataTransfer.getData('application/x-recipe'); if(!id) return; e.preventDefault(); e.stopPropagation(); ri.classList.remove('gdrop-before','gdrop-after'); const src=all.find(x=>x.id===id); if(src) moveRecipe(src,r,aft(e)); });
          ri.append(b); sub.append(ri);
        });
        li.append(sub);
      }
      ul.append(li);
    });
    toc.append(ul);
  }
  // main
  const content=h('div',{});
  if(!all.length) content.append(h('p',{class:'empty',text:'No recipes yet. Add one, split it into parts (for a cake: sponge, icing…), list each part’s ingredients with calories, carbs and protein, and the totals add up for you.'}));
  else if(!vis.length) content.append(h('p',{class:'empty',text:q?'No recipes match.':'No recipes in this category yet. Use New recipe to add one here, or drag recipes onto it in the sidebar.'}));
  else shown.forEach(g=>{
    if(!g.list.length) return;
    const blk=h('div',{class:'rcatblock',style:`--c:${g.c.color}`});
    blk.append(h('h2',{class:'rcathd'},h('i'),g.c.name,h('span',{text:`${g.list.length} recipe${g.list.length===1?'':'s'}`})));
    blk.append(h('div',{class:'goals'},g.list.map((r,i)=>recipeCard(r,i,g.list))));
    content.append(blk);
  });
  wrap.append(h('div',{class:'projwrap'},toc,content));
  wrap.append(h('datalist',{id:'runits'},RUNITS.map(u=>h('option',{value:u}))));
  return wrap;
}
function recipeCard(r,ri,vis){
  const R=S.rec, closed=R.closed.has(r.id);
  const rc=rcatOf(r)||UNCAT;
  const card=h('section',{class:'goal recipe',id:'rc-'+r.id,style:`--c:${rc.color}`,'aria-label':r.name||'Untitled recipe'});
  const title=h('input',{class:'gtitle',type:'text',value:r.name||'',placeholder:'Name this recipe','aria-label':'Recipe name','data-autofocus':S.focus==='rt:'+r.id?'1':null});
  title.addEventListener('input',()=>{r.name=title.value;save()});
  title.addEventListener('keydown',e=>{if(e.key==='Enter')title.blur()});
  const handle=h('span',{class:'ghandle',draggable:'true',title:'Drag to reorder recipes','aria-hidden':'true'},'⠿');
  handle.addEventListener('dragstart',e=>{ e.dataTransfer.setData('application/x-recipe',r.id); e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setDragImage(card,20,20)}catch(err){} card.classList.add('dragging'); });
  handle.addEventListener('dragend',()=>{ card.classList.remove('dragging'); document.querySelectorAll('.gdrop-before,.gdrop-after').forEach(x=>x.classList.remove('gdrop-before','gdrop-after')); });
  const after=e=>{ const b=card.getBoundingClientRect(); return e.clientY>b.top+b.height/2; };
  const moveR=(src,target,aft)=>moveRecipe(src,target,aft);
  card.addEventListener('dragover',e=>{ if(!e.dataTransfer.types.includes('application/x-recipe')) return; e.preventDefault(); const a=after(e); card.classList.toggle('gdrop-after',a); card.classList.toggle('gdrop-before',!a); });
  card.addEventListener('dragleave',e=>{ if(!card.contains(e.relatedTarget)) card.classList.remove('gdrop-before','gdrop-after'); });
  card.addEventListener('drop',e=>{ const id=e.dataTransfer.getData('application/x-recipe'); if(!id) return; e.preventDefault(); card.classList.remove('gdrop-before','gdrop-after');
    const src=S.state.recipes.find(x=>x.id===id); if(src) moveR(src,r,after(e)); });
  card.append(h('div',{class:'ghead'},handle,
    h('button',{class:'rcollapse','aria-expanded':String(!closed),'aria-label':closed?'Show ingredients':'Hide ingredients','data-k':'rc:'+r.id,onclick:()=>{ closed?R.closed.delete(r.id):R.closed.add(r.id); render(); }},closed?'▸':'▾'),
    title));
  const serv=h('input',{class:'rnum',type:'number',min:'1',step:'1',value:String(r.servings||1),'aria-label':'Servings','data-k':'rs:'+r.id});
  const cat=h('select',{'aria-label':'Category','data-k':'rk:'+r.id,onchange:e=>{ if(e.target.value) r.catId=e.target.value; else delete r.catId; commit(); }},
    S.state.recipeCats.map(c=>h('option',{value:c.id},c.name)),h('option',{value:''},'Uncategorised'));
  cat.value=r.catId||'';
  const delBtn=S.confirm==='r:'+r.id
    ? h('button',{class:'link danger','data-k':'rd:'+r.id,onclick:()=>{S.state.recipes=S.state.recipes.filter(x=>x!==r);S.confirm=null;commit()}},'Confirm delete')
    : h('button',{class:'link','data-k':'rd:'+r.id,onclick:()=>{S.confirm='r:'+r.id;render()}},'Delete');
  card.append(h('div',{class:'gmeta'},h('label',{},'Servings ',serv),h('label',{},'Category ',cat),
    h('button',{class:'gmove','aria-label':'Move recipe up',title:'Move up',disabled:ri===0,'data-k':'ru:'+r.id,onclick:()=>moveR(r,vis[ri-1],false)},'↑'),
    h('button',{class:'gmove','aria-label':'Move recipe down',title:'Move down',disabled:ri===vis.length-1,'data-k':'rdn:'+r.id,onclick:()=>moveR(r,vis[ri+1],true)},'↓'),
    h('span',{class:'spacer'}),
    h('button',{class:'link',onclick:()=>{ const c=JSON.parse(JSON.stringify(r)); c.id=uid(); c.name=(r.name||'Recipe')+' (copy)'; c.sections.forEach(x=>{x.id=uid(); x.items.forEach(i=>i.id=uid()); (x.comps||[]).forEach(k=>{k.id=uid(); k.items.forEach(i=>i.id=uid())}); }); S.state.recipes.splice(S.state.recipes.indexOf(r)+1,0,c); commit(); }},'Duplicate'),
    delBtn));
  // totals
  const refs={};
  const grp=(label,key)=>h('div',{class:'grp'},h('span',{class:'lbl',text:label}),
    ...RF.map(f=>h('span',{},(refs[key+f]=h('span',{class:'val'})),h('span',{class:'u',text:f==='kcal'?'kcal':f==='carb'?'g carbs':'g protein'}))));
  const totBox=h('div',{class:'rtot','aria-live':'polite'},grp('Total','t'),grp('Per serving','s'));
  card.append(totBox);
  const subRefs=[];
  const refresh=()=>{ const items=r.sections.flatMap(secItems); const t=recTotals(items); const sv=r.servings>0?r.servings:1;
    RF.forEach(f=>{ refs['t'+f].textContent=fmtNut(f,t[f]); refs['s'+f].textContent=fmtNut(f,t[f]/sv); });
    subRefs.forEach(({sec,cells})=>{ const st=recTotals(sec.items?secItems(sec):sec.list); RF.forEach(f=>cells[f].textContent=fmtNut(f,st[f])); }); };
  serv.addEventListener('change',()=>{ const v=Math.round(Number(serv.value)); if(v>0){ r.servings=v; save(); refresh(); } else serv.value=String(r.servings); });
  if(!closed){
    const row=h('div',{class:'subs'});
    r.sections.forEach((sec,si)=>row.append(recipeSection(r,sec,si,refresh,subRefs)));
    row.append(h('button',{class:'addsub',onclick:()=>{ const x={id:uid(),title:'',items:[],comps:[]}; r.sections.push(x); S.focus='rst:'+x.id; commit(); }},'+ Add part\n(e.g. Idli, Sambar)'));
    card.append(row);
    const m=h('textarea',{class:'rmethod',rows:'4',placeholder:'Assembly, overall method, notes, source…','aria-label':'Method and notes','data-k':'rm:'+r.id},r.method||'');
    m.addEventListener('input',()=>{ r.method=m.value; save(); });
    card.append(m);
  }
  refresh();
  return card;
}
function ingTable(holder,refresh,cells){
  const colg=h('colgroup',{},h('col',{}),h('col',{style:'width:3.4rem'}),h('col',{style:'width:3.4rem'}),h('col',{style:'width:3.6rem'}),h('col',{style:'width:3.4rem'}),h('col',{style:'width:3.4rem'}),h('col',{style:'width:1.5rem'}));
  const head=h('thead',{},h('tr',{},h('th',{text:'Ingredient'}),h('th',{class:'n',text:'Amt'}),h('th',{text:'Unit'}),h('th',{class:'n',text:'kcal'}),h('th',{class:'n',text:'Carbs g'}),h('th',{class:'n',text:'Prot. g'}),h('th',{})));
  const body=h('tbody');
  const fieldIn=(it,f,attrs,onCh)=>{ const inp=h('input',Object.assign({value:it[f]==null?'':String(it[f])},attrs)); inp.addEventListener('change',()=>onCh(inp)); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); inp.blur(); } }); return inp; };
  holder.items.forEach((it,ii)=>{
    const ins={};
    const sync=()=>RF.forEach(f=>{ ins[f].value=it[f]==null?'':String(it[f]); });
    const onIdent=()=>{ if(ingApply(it)) sync(); else ingLearn(it); save(); refresh(); };
    body.append(h('tr',{},
      h('td',{},fieldIn(it,'name',{type:'text','aria-label':'Ingredient','data-k':`ri:${it.id}:name`},inp=>{ const v=inp.value.trim(); if(!v){ inp.value=it.name; return; } it.name=v; onIdent(); })),
      h('td',{class:'n'},fieldIn(it,'amt',{type:'text',inputmode:'decimal','aria-label':`Amount of ${it.name}`,'data-k':`ri:${it.id}:amt`},inp=>{ const n=rnum(inp.value);
        if(Number.isNaN(n)){ inp.value=it.amt??''; return; }
        const old=it.amt; if(n===null) delete it.amt; else it.amt=n;
        if(!ingApply(it)){ if(old>0&&it.amt>0){ RF.forEach(f=>{ if(typeof it[f]==='number') it[f]=rround(f,it[f]*it.amt/old); }); sync(); } ingLearn(it); }
        else sync();
        save(); refresh(); })),
      h('td',{},fieldIn(it,'unit',{type:'text',list:'runits','aria-label':`Unit for ${it.name}`,'data-k':`ri:${it.id}:unit`},inp=>{ const v=inp.value.trim(); if(v) it.unit=v; else delete it.unit; onIdent(); })),
      ...RF.map(f=>h('td',{class:'n'},(ins[f]=fieldIn(it,f,{type:'text',inputmode:'decimal','aria-label':`${f==='kcal'?'Calories':f==='carb'?'Carbs':'Protein'} for ${it.name}`,'data-k':`ri:${it.id}:${f}`},inp=>{
        const n=rnum(inp.value); if(Number.isNaN(n)){ inp.value=it[f]??''; return; }
        if(n===null) delete it[f]; else it[f]=rround(f,n); ingLearn(it,f); save(); refresh(); })))),
      h('td',{},h('button',{class:'x','aria-label':`Remove ${it.name}`,title:'Remove ingredient',onclick:()=>{ holder.items.splice(ii,1); commit(); }},'×'))));
  });
  const D=(S.recDraft=S.recDraft||{})[holder.id]||(S.recDraft[holder.id]={});
  const adding=S.ingAdd===holder.id;
  const tbl=h('table',{class:'rtab'});
  const openAdd=()=>{ S.ingAdd=holder.id; S.focus='ra:'+holder.id; render(); };
  const closeAdd=()=>{ S.ingAdd=null; Object.keys(D).forEach(k=>delete D[k]); render(); };
  const addBtn=h('button',{class:'addingbtn','data-k':'rab:'+holder.id,onclick:openAdd},'+ Add ingredient');
  if(!holder.items.length&&!adding){
    if(cells) RF.forEach(f=>{ cells[f]=h('span'); });
    return h('div',{class:'rtabempty'},addBtn);
  }
  const addIn=(f,attrs)=>{ const inp=h('input',Object.assign({value:D[f]||''},attrs)); inp.addEventListener('input',()=>{D[f]=inp.value}); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addIng(); } else if(e.key==='Escape'){ e.preventDefault(); closeAdd(); } }); return inp; };
  const addIng=(keepFocus=true)=>{ const name=(D.name||'').trim(); if(!name){ if(keepFocus){ const f=tbl.querySelector('[data-k="ra:'+holder.id+'"]'); if(f) f.focus(); } return; }
    const it={id:uid(),name}; const a=rnum(D.amt); if(typeof a==='number'&&!Number.isNaN(a)) it.amt=a; if((D.unit||'').trim()) it.unit=D.unit.trim();
    let typed=false; RF.forEach(f=>{ const n=rnum(D[f]); if(typeof n==='number'&&!Number.isNaN(n)){ it[f]=rround(f,n); typed=true; } });
    if(!typed) ingApply(it); ingLearn(it);
    holder.items.push(it); Object.keys(D).forEach(k=>delete D[k]); if(keepFocus) S.focus='ra:'+holder.id; commit(); };
  const foot=h('tfoot',{},adding?h('tr',{class:'addr'},
    h('td',{},addIn('name',{type:'text',placeholder:'Ingredient','aria-label':'New ingredient','data-k':'ra:'+holder.id,'data-autofocus':S.focus==='ra:'+holder.id?'1':null})),
    h('td',{class:'n'},addIn('amt',{type:'text',inputmode:'decimal',placeholder:'amt','aria-label':'Amount'})),
    h('td',{},addIn('unit',{type:'text',list:'runits',placeholder:'unit','aria-label':'Unit'})),
    ...RF.map(f=>h('td',{class:'n'},addIn(f,{type:'text',inputmode:'decimal',placeholder:f==='kcal'?'kcal':'g','aria-label':f==='kcal'?'Calories':f==='carb'?'Carbs':'Protein'}))),
    h('td',{}))
    :h('tr',{},h('td',{colspan:'7'},addBtn)));
  if(adding){
    const tr=foot.firstChild;
    tr.addEventListener('focusout',e=>{ if(tr.contains(e.relatedTarget)||(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest('.addacts'))) return; setTimeout(()=>{ if(!tr.isConnected) return; if(S.ingAdd===holder.id&&(D.name||'').trim()&&!tr.contains(document.activeElement)) addIng(false); },0); });
    foot.append(h('tr',{},h('td',{colspan:'7'},h('div',{class:'addacts'},
      h('button',{class:'pill primary sm',onmousedown:e=>e.preventDefault(),onclick:()=>addIng(true)},'Add'),
      h('button',{class:'pill sm',onmousedown:e=>e.preventDefault(),onclick:()=>{ if((D.name||'').trim()) addIng(false); S.ingAdd=null; render(); }},'Done'),
      h('span',{class:'rhint',style:'margin:0',text:'Enter adds and keeps the row open for the next one'})))));
  }
  if(cells){ foot.append(h('tr',{class:'stot'},h('td',{colspan:'3',text:cells.label}),...RF.map(f=>(cells[f]=h('td',{}))),h('td',{}))); }
  tbl.append(colg,head,body,foot);
  return tbl;
}
function pasteBox(id,hint,onAdd){
  const ta=h('textarea',{class:'rmethod',rows:'5',placeholder:hint,'aria-label':'Paste an ingredient list','data-autofocus':'1'},S.pasteDraft||'');
  const prev=h('p',{class:'rhint','aria-live':'polite'});
  const upd=()=>{ S.pasteDraft=ta.value; const items=parseIngText(ta.value); const nh=items.filter(x=>x.header).length, ni=items.length-nh;
    prev.textContent=ni?`Will add ${ni} ingredient${ni>1?'s':''}${nh?`, with ${nh} new component${nh>1?'s':''}`:''}. You can fix anything afterwards.`:'Nothing recognised yet.'; };
  ta.addEventListener('input',upd); upd();
  const go=()=>{ const parsed=parseIngText(ta.value); if(!parsed.some(x=>!x.header)){ ta.focus(); return; } onAdd(parsed); S.pasteSec=null; S.pasteDraft=''; commit(); };
  return [ta,prev,h('div',{class:'subfoot',style:'gap:8px'},
    h('button',{class:'pill',onclick:()=>{S.pasteSec=null;S.pasteDraft='';render()}},'Cancel'),
    h('button',{class:'pill primary',onclick:go},'Add ingredients'))];
}
function recipeSection(r,sec,si,refresh,subRefs){
  const box=h('div',{class:'sub',role:'group','aria-label':sec.title||'Ingredients'});
  const ti=h('input',{class:'subtitle',type:'text',value:sec.title||'',placeholder:'Part, e.g. Sambar','aria-label':'Part name','data-k':'rst:'+sec.id,'data-autofocus':S.focus==='rst:'+sec.id?'1':null});
  ti.addEventListener('input',()=>{sec.title=ti.value;save()});
  ti.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); S.ingAdd=sec.id; S.focus='ra:'+sec.id; commit(); } });
  const mv=d=>{ const j=si+d; if(j<0||j>=r.sections.length) return; [r.sections[si],r.sections[j]]=[r.sections[j],r.sections[si]]; commit(); };
  box.append(h('div',{class:'subhd'},
    h('button',{class:'submove','aria-label':'Move part left',title:'Move left',disabled:si===0,onclick:()=>mv(-1)},'‹'),ti,
    h('button',{class:'submove','aria-label':'Move part right',title:'Move right',disabled:si===r.sections.length-1,onclick:()=>mv(1)},'›')));
  const comps=sec.comps||(sec.comps=[]);
  // the part's own (main) ingredients
  box.append(ingTable(sec,refresh,null));
  const ps=h('textarea',{class:'psteps',rows:'2',placeholder:`Steps for ${sec.title||'this part'} (optional)`,'aria-label':`Steps for ${sec.title||'this part'}`,'data-k':'pst:'+sec.id},sec.method||'');
  ps.addEventListener('input',()=>{ sec.method=ps.value; save(); });
  box.append(ps);
  // components, stacked
  comps.forEach((c,ci)=>{
    const col=c.color||COMPC[ci%COMPC.length];
    const cb=h('div',{class:'rcomp',style:`--cc:${col}`,role:'group','aria-label':c.title||'Component'});
    const ct=h('input',{class:'ctitle',type:'text',value:c.title||'',placeholder:'Component, e.g. Tamarind paste','aria-label':'Component name','data-k':'rct:'+c.id,'data-autofocus':S.focus==='rct:'+c.id?'1':null});
    ct.addEventListener('input',()=>{c.title=ct.value;save()});
    ct.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); S.ingAdd=c.id; S.focus='ra:'+c.id; commit(); } });
    const cmv=d=>{ const j=ci+d; if(j<0||j>=comps.length) return; [comps[ci],comps[j]]=[comps[j],comps[ci]]; commit(); };
    const del=S.confirm==='rcp:'+c.id
      ? h('button',{class:'link danger',onclick:()=>{ sec.comps=comps.filter(x=>x!==c); S.confirm=null; commit(); }},c.items.length?'Delete?':'Delete')
      : h('button',{class:'cbtn','aria-label':`Delete ${c.title||'component'}`,title:'Delete component',onclick:()=>{S.confirm='rcp:'+c.id;render()}},'×');
    cb.append(h('div',{class:'rcomphd'},ct,
      h('button',{class:'cbtn','aria-label':'Move component up',title:'Move up',disabled:ci===0,onclick:()=>cmv(-1)},'↑'),
      h('button',{class:'cbtn','aria-label':'Move component down',title:'Move down',disabled:ci===comps.length-1,onclick:()=>cmv(1)},'↓'),del));
    const cells={label:'Subtotal'}; subRefs.push({sec:{list:c.items},cells});
    cb.append(ingTable(c,refresh,cells));
    const cs=h('textarea',{class:'psteps',rows:'2',placeholder:`Steps for ${c.title||'this component'} (optional)`,'aria-label':`Steps for ${c.title||'this component'}`},c.method||'');
    cs.addEventListener('input',()=>{ c.method=cs.value; save(); });
    cb.append(cs);
    if(S.pasteSec===c.id){
      cb.append(...pasteBox(c.id,`Paste the ingredients for ${c.title||'this component'} here, one per line, e.g.\n30 g tamarind\n250 ml warm water`,parsed=>{
        let target=c, at=comps.indexOf(c);
        parsed.forEach(x=>{ if(x.header){ target={id:uid(),title:x.header,items:[]}; comps.splice(++at,0,target); return; } ingApply(x); target.items.push(x); });
      }));
    } else cb.append(h('div',{class:'subfoot',style:'justify-content:flex-start;margin-top:4px'},
      h('button',{class:'link',onclick:()=>{S.pasteSec=c.id;S.pasteDraft='';render()}},`Paste ingredients into ${c.title||'this component'}`)));
    box.append(cb);
  });
  box.append(h('button',{class:'addcomp',onclick:()=>{ const c={id:uid(),title:'',items:[]}; comps.push(c); S.focus='rct:'+c.id; commit(); }},'+ Add component (e.g. tamarind paste)'));
  if(r.sections.length>1||comps.length){
    const cells={label:`${sec.title||'Part'} total`}; subRefs.push({sec,cells});
    box.append(h('table',{class:'rtab'},h('colgroup',{},h('col',{}),h('col',{style:'width:3.4rem'}),h('col',{style:'width:3.4rem'}),h('col',{style:'width:3.6rem'}),h('col',{style:'width:3.4rem'}),h('col',{style:'width:3.4rem'}),h('col',{style:'width:1.5rem'})),
      h('tbody',{},h('tr',{class:'stot ptot'},h('td',{colspan:'3',text:cells.label}),...RF.map(f=>(cells[f]=h('td',{}))),h('td',{})))));
  }
  if(S.pasteSec===sec.id){
    const ta=h('textarea',{class:'rmethod',rows:'6',placeholder:'Paste the ingredient list here, one per line. Headings like "For the tamarind paste:" become components, e.g.\n2 cups toor dal\n1 tsp turmeric\nFor the tamarind paste:\n30 g tamarind\n250 ml warm water',
      'aria-label':'Paste an ingredient list','data-autofocus':'1'},S.pasteDraft||'');
    const prev=h('p',{class:'rhint','aria-live':'polite'});
    const upd=()=>{ S.pasteDraft=ta.value; const items=parseIngText(ta.value); const nh=items.filter(x=>x.header).length, ni=items.length-nh;
      prev.textContent=ni?`Will add ${ni} ingredient${ni>1?'s':''}${nh?`, with ${nh} component${nh>1?'s':''}`:''}. You can fix anything afterwards.`:'Nothing recognised yet.'; };
    ta.addEventListener('input',upd); upd();
    const doAdd=()=>{
      const parsed=parseIngText(ta.value); if(!parsed.some(x=>!x.header)){ ta.focus(); return; }
      let target=sec;
      parsed.forEach(x=>{
        if(x.header){ target={id:uid(),title:x.header,items:[]}; comps.push(target); return; }
        ingApply(x); target.items.push(x);
      });
      sec.comps=comps.filter(c=>c.items.length||c.title);
      S.pasteSec=null; S.pasteDraft=''; commit(); };
    box.append(ta,prev,h('div',{class:'subfoot',style:'gap:8px'},
      h('button',{class:'pill',onclick:()=>{S.pasteSec=null;S.pasteDraft='';render()}},'Cancel'),
      h('button',{class:'pill primary',onclick:doAdd},'Add ingredients')));
  }
  box.append(h('p',{class:'rhint',text:'Enter adds the ingredient. Type its calories, carbs and protein once, and next time the same ingredient fills in and scales with the amount.'}));
  const nAll=secItems(sec).length;
  box.append(h('div',{class:'subfoot',style:'justify-content:space-between'},
    S.pasteSec===sec.id?h('span'):h('button',{class:'link',onclick:()=>{S.pasteSec=sec.id;S.pasteDraft='';render()}},'Paste ingredient list'),
    S.confirm==='rs:'+sec.id
    ? h('button',{class:'link danger',onclick:()=>{ r.sections=r.sections.filter(x=>x!==sec); if(!r.sections.length) r.sections.push({id:uid(),title:'Ingredients',items:[],comps:[]}); S.confirm=null; commit(); }},nAll?`Delete with ${nAll} ingredient${nAll>1?'s':''}`:'Confirm delete')
    : h('button',{class:'link',onclick:()=>{S.confirm='rs:'+sec.id;render()}},'Delete part')));
  return box;
}

/* ---------- pantry ---------- */
const PUNITS=['pcs','g','kg','ml','L','cans','jars','packs','boxes','bottles','bags'];
const effExp=e=>{ if(!e) return ''; if(/^\d{4}-\d{2}$/.test(e)){ const [y,m]=e.split('-').map(Number); return `${e}-${pad(new Date(y,m,0).getDate())}`; } return e; };
function parseExp(str){
  const t=String(str||'').trim(); if(!t) return '';
  let m;
  const yr=y=>{ y=Number(y); return y<100?2000+y:y; };
  const ok=(y,mo,d)=>mo>=1&&mo<=12&&y>=1900&&y<=2200&&(d==null||(d>=1&&d<=new Date(y,mo,0).getDate()));
  if((m=t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))){ const y=+m[1],mo=+m[2],d=+m[3]; return ok(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:null; }
  if((m=t.match(/^(\d{4})-(\d{1,2})$/))){ const y=+m[1],mo=+m[2]; return ok(y,mo)?`${y}-${pad(mo)}`:null; }
  if((m=t.match(/^(\d{1,2})[\s.\/-](\d{1,2})[\s.\/-](\d{2}|\d{4})$/))){ const d=+m[1],mo=+m[2],y=yr(m[3]); return ok(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:null; }
  if((m=t.match(/^(\d{1,2})[\s.\/-](\d{2}|\d{4})$/))){ const mo=+m[1],y=yr(m[2]); return ok(y,mo)?`${y}-${pad(mo)}`:null; }
  if((m=t.match(/^(\d{2})(\d{2})(\d{4})$/))){ const d=+m[1],mo=+m[2],y=+m[3]; return ok(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:null; }
  return null;
}
const showExp=e=>{ if(!e) return ''; const [y,mo,d]=e.split('-'); return d?`${d}-${mo}-${y}`:`${mo}-${y}`; };
function expStatus(exp){
  if(!exp) return {cls:'',text:''};
  const d=diffDays(key(new Date()),effExp(exp));
  if(d<0) return {cls:'expired',text:d===-1?'Expired yesterday':`Expired ${-d} days ago`};
  if(d===0) return {cls:'expired',text:'Expires today'};
  if(d<=(S.state.settings.soonDays||30)) return {cls:'soon',text:d===1?'Tomorrow':`In ${d} days`};
  const m=Math.round(d/30.4);
  return {cls:'',text:m<2?`In ${d} days`:m<24?`In ${m} months`:`In ${Math.round(m/12)} years`};
}
const itemExp=it=>it.packs.map(p=>p.exp).filter(Boolean).sort((a,b)=>effExp(a)<effExp(b)?-1:effExp(a)>effExp(b)?1:0)[0]||'';
const packCmp=(a,b)=>(!a.exp)-(!b.exp)||(effExp(a.exp)<effExp(b.exp)?-1:effExp(a.exp)>effExp(b.exp)?1:0);
const itemQty=it=>{ const q=it.packs.filter(p=>typeof p.qty==='number'); return q.length?Math.round(q.reduce((n,p)=>n+p.qty,0)*1000)/1000:null; };
const itemKcal=it=>{ const q=it.packs.filter(p=>typeof p.kcal==='number'); return q.length?Math.round(q.reduce((n,p)=>n+p.kcal,0)):null; };
const P_PER={g:1,gr:1,gram:1,grams:1,ml:1,kg:1000,kilo:1000,l:1000,liter:1000,litre:1000,cl:10,dl:100};
const per100Base=(q,unit)=>{ const f=P_PER[String(unit||'').trim().toLowerCase()]; return f&&typeof q==='number'?q*f:null; };
function applyK100(it){ it.packs.forEach(p=>{ if(typeof p.k100!=='number') return; const b=per100Base(p.qty,it.unit); if(b!=null) p.kcal=Math.round(b*p.k100/100); }); }
const pantryStatus=it=>expStatus(itemExp(it));
const fmtExp=showExp;
function renderPantry(){
  const P=S.pantry||(S.pantry={sort:'exp',dir:1,q:'',open:new Set()});
  if(!P.open) P.open=new Set();
  const items=S.state.pantry;
  const q=P.q.trim().toLowerCase();
  const shown=items.filter(it=>!q||[it.name,it.cat,it.unit,it.notes,...it.packs.map(p=>p.note)].some(x=>x&&String(x).toLowerCase().includes(q)));
  const cmpStr=(a,b)=>(a||'').localeCompare(b||'',undefined,{sensitivity:'base',numeric:true});
  shown.sort((a,b)=>{
    let r=0;
    if(P.sort==='name') r=cmpStr(a.name,b.name);
    else if(P.sort==='cat') r=(!a.cat)-(!b.cat)||cmpStr(a.cat,b.cat)||cmpStr(a.name,b.name);
    else { const ea=effExp(itemExp(a)), eb=effExp(itemExp(b)); r=(!ea)-(!eb); if(!r&&ea&&eb) r=ea<eb?-1:ea>eb?1:0; if(!r) r=cmpStr(a.name,b.name); if(!ea||!eb) return r; }
    return r*P.dir;
  });
  const wrap=h('div');
  const search=h('input',{class:'libsearch',type:'search',placeholder:'Search items, categories, notes…','aria-label':'Search pantry','data-k':'pq',value:P.q});
  search.addEventListener('input',()=>{ P.q=search.value; renderMain(); const el=document.querySelector('[data-k="pq"]'); if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length);} });
  const sortSel=h('select',{'aria-label':'Sort pantry',onchange:e=>{ const [k,d]=e.target.value.split(':'); P.sort=k; P.dir=Number(d); render(); }},
    h('option',{value:'exp:1'},'Expiry: soonest first'),h('option',{value:'exp:-1'},'Expiry: latest first'),
    h('option',{value:'name:1'},'Name: A → Z'),h('option',{value:'name:-1'},'Name: Z → A'),
    h('option',{value:'cat:1'},'Category: A → Z'));
  sortSel.value=`${P.sort}:${P.dir}`;
  const allPacks=items.flatMap(it=>it.packs);
  const nExp=allPacks.filter(p=>expStatus(p.exp).cls==='expired').length, nSoon=allPacks.filter(p=>expStatus(p.exp).cls==='soon').length;
  const anyMulti=shown.some(it=>it.packs.length>1);
  const allOpen=anyMulti&&shown.filter(it=>it.packs.length>1).every(it=>P.open.has(it.id));
  wrap.append(h('div',{class:'libbar'},search,sortSel,
    anyMulti?h('button',{class:'link',onclick:()=>{ shown.forEach(it=>{ if(it.packs.length>1){ allOpen?P.open.delete(it.id):P.open.add(it.id); } }); render(); }},allOpen?'Collapse all':'Expand all'):null,
    h('span',{class:'libcount',text:q?`${shown.length} of ${items.length} items`:`${items.length} item${items.length===1?'':'s'}, ${allPacks.length} pack${allPacks.length===1?'':'s'}`}),
    h('span',{class:'pkey'},h('span',{},h('i',{style:'background:color-mix(in srgb,var(--miss) 45%,var(--sheet))'}),`Expired ${nExp}`),
      h('span',{},h('i',{style:'background:color-mix(in srgb,var(--rd) 55%,var(--sheet))'}),`Within ${S.state.settings.soonDays||30} days ${nSoon}`))));
  const delBtn=(label,onDel)=>{ const b=h('button',{class:'pdel','aria-label':label,title:`${label} (click twice)`,onclick:()=>{
      if(!b.classList.contains('armed')){ b.classList.add('armed'); b.textContent='Delete?'; setTimeout(()=>{ if(b.isConnected){ b.classList.remove('armed'); b.textContent='×'; } },3000); return; }
      onDel(); }},'×'); return b; };
  // still-needed checklist
  const NEED=S.state.pantryNeeded;
  const toggleNeed=nd=>{ if(nd.done) delete nd.done; else nd.done=true; commit(); };
  const nDone=NEED.filter(x=>x.done).length;
  const addNeed=el=>{ const v=el.value.trim(); if(!v) return;
    v.split(/\s*[,;]\s*/).filter(Boolean).forEach(name=>{ if(!S.state.pantryNeeded.some(x=>x.name.trim().toLowerCase()===name.toLowerCase())) S.state.pantryNeeded.push({id:uid(),name}); });
    S.focus='pneed-add'; commit(); };
  const needIn=h('input',{type:'text',placeholder:'+ Add something you still need (Enter; commas for several)','aria-label':'Add an item you still need','data-k':'pneed-add','data-autofocus':S.focus==='pneed-add'?'1':null});
  needIn.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addNeed(needIn); } });
  const needSec=(h('section',{class:'pneed','aria-labelledby':'pneed-h'},
    h('div',{class:'pneedhd'},h('h2',{id:'pneed-h',text:'Still needed'}),
      h('span',{class:'libcount',text:NEED.length?`${NEED.length-nDone} of ${NEED.length} still to get`:'Nothing on the list'}),
      nDone?h('button',{class:'link',onclick:()=>{ S.state.pantryNeeded=S.state.pantryNeeded.filter(x=>!x.done); commit(); }},`Clear ${nDone} ticked`):null),
    NEED.length?h('ul',{class:'pneedlist'},NEED.map(nd=>{
      const nm=h('input',{type:'text',value:nd.name,'aria-label':'Needed item','data-k':`pn:${nd.id}`});
      nm.addEventListener('change',()=>{ const v=nm.value.trim(); if(v){ nd.name=v; save(); } else nm.value=nd.name; });
      nm.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); nm.blur(); } });
      return h('li',{class:nd.done?'done':null},
        h('input',{type:'checkbox',checked:!!nd.done,'aria-label':`Got ${nd.name}`,onchange:()=>toggleNeed(nd)}),
        nm,
        delBtn(`Remove ${nd.name} from the list`,()=>{ S.state.pantryNeeded=S.state.pantryNeeded.filter(x=>x!==nd); commit(); }));
    })):null,
    h('div',{class:'pneedadd'},needIn)));
  needSec.style.margin='22px 0 0';
  const th=(label,k,cls)=>{ if(!k) return h('th',{scope:'col',class:cls||null},h('span',{text:label}));
    const on=P.sort===k, arrow=on?(P.dir===1?' ↑':' ↓'):'';
    return h('th',{scope:'col','aria-sort':on?(P.dir===1?'ascending':'descending'):null},
      h('button',{'aria-sort':on?'1':null,title:`Sort by ${label.toLowerCase()}`,onclick:()=>{ if(P.sort===k) P.dir=-P.dir; else { P.sort=k; P.dir=1; } render(); }},label+arrow)); };
  const inp=(obj,field,k,attrs,after)=>{
    const el=h('input',Object.assign({'data-k':k,value:obj[field]==null?'':String(obj[field])},attrs||{}));
    el.addEventListener('change',()=>{
      let v=el.value.trim();
      if(field==='qty'||field==='kcal'||field==='k100'){ if(v===''){ delete obj[field]; } else { const n=Number(v.replace(',','.')); if(isFinite(n)) obj[field]=n; else { el.value=obj[field]??''; return; } } }
      else if(v) obj[field]=v; else if(field!=='name') delete obj[field]; else { el.value=obj.name; return; }
      if(field==='kcal'){ const own=S.state.pantry.find(x=>x.packs.includes(obj)); if(own){ if(typeof obj.kcal==='number') deriveK100(own,obj); else delete obj.k100; } }
      if(field==='qty'||field==='unit'||field==='k100'){ S.state.pantry.forEach(applyK100); S.state.pantry.forEach(x=>x.packs.forEach(p=>{ if(typeof p.k100!=='number') deriveK100(x,p); })); after='commit'; }
      if(after!=='commit'){ save(); return; }
      if(el.type==='date'){ save(); dirty=true; return; }   // dates re-sort on blur, so typing a date isn't interrupted
      setTimeout(()=>commit(),0);
    });
    let dirty=false;
    el.addEventListener('blur',()=>{ if(!dirty) return; dirty=false; setTimeout(()=>commit(),0); });
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); el.blur(); } });
    return h('td',{},el);
  };
  const expIn=(pk,k,label,extra)=>{
    const el=h('input',Object.assign({type:'text',class:'pexp','data-k':k,value:showExp(pk.exp||''),placeholder:'dd-mm-yyyy','aria-label':label,
      title:'Day-month-year, e.g. 05-11-2026. Leave out the day for month only, e.g. 11-2026.'},extra||{}));
    el.addEventListener('change',()=>{ const v=parseExp(el.value);
      if(v===null){ el.classList.add('bad'); el.title='Couldn’t read that date. Use dd-mm-yyyy, or mm-yyyy for month only.'; return; }
      el.classList.remove('bad'); if(v) pk.exp=v; else delete pk.exp; setTimeout(()=>commit(),0); });
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); el.blur(); } });
    return h('td',{},el);
  };
  const rows=[];
  const isWater=it=>/water/i.test(it.name||'')||/^water$/i.test((it.cat||'').trim());
  const foodItems=shown.filter(it=>!isWater(it)), waterItems=shown.filter(isWater);
  [...foodItems,...waterItems].forEach(it=>{
    if(waterItems.length&&foodItems.length&&it===foodItems[0]) rows.push(h('tr',{class:'pgroup'},h('td',{colspan:'11',text:'Food'})));
    if(waterItems.length&&it===waterItems[0]) rows.push(h('tr',{class:'pgroup water'},h('td',{colspan:'11',text:'Water'})));
    const multi=it.packs.length>1, open=multi&&P.open.has(it.id);
    const st=pantryStatus(it), tq=itemQty(it), tk=itemKcal(it);
    const toggle=()=>{ open?P.open.delete(it.id):P.open.add(it.id); render(); };
    const nameIn=h('input',{type:'text','data-k':`p:${it.id}:name`,value:it.name,'aria-label':'Item'});
    nameIn.addEventListener('change',()=>{ const v=nameIn.value.trim(); if(v){ it.name=v; save(); } else nameIn.value=it.name; });
    nameIn.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); nameIn.blur(); } });
    const one=it.packs.length===1?it.packs[0]:null;
    const addPack=()=>{ const last=it.packs[it.packs.length-1]; const pk={id:uid()}; if(last&&typeof last.qty==='number') pk.qty=last.qty; if(last&&typeof last.kcal==='number') pk.kcal=last.kcal; if(last&&typeof last.k100==='number') pk.k100=last.k100; it.packs.push(pk); applyK100(it); P.open.add(it.id); S.focus=`pk:${pk.id}:exp`; commit(); };
    rows.push(h('tr',{class:'pitemrow '+st.cls+(tq===0?' empty':'')+(P.flash===it.id?' pfresh':'')},
      h('td',{},h('div',{class:'pname'},
        multi?h('button',{class:'ptog','aria-expanded':String(open),'aria-label':open?`Hide ${it.name} packs`:`Show all ${it.packs.length} packs of ${it.name}`,'data-k':`pt:${it.id}`,onclick:toggle},open?'▾':'▸'):h('span',{class:'ptogsp'}),
        nameIn)),
      h('td',{class:'pcount'},multi?h('button',{class:'pcbtn',onclick:toggle,title:open?'Hide packs':'Show all packs'},`${it.packs.length}`):h('span',{text:it.packs.length?'1':'0'})),
      one?inp(one,'qty',`pk:${one.id}:qty`,{type:'text',inputmode:'decimal',class:'num',placeholder:'amount','aria-label':`${it.name} amount`,'data-autofocus':S.focus===`pk:${one.id}:qty`?'1':null},'commit')
         :h('td',{class:'pro num'},h('button',{class:'ptotal',title:'Total across all packs. Click to edit each pack’s amount.','aria-label':`${it.name}: total ${tq??0}. Edit pack amounts`,
            onclick:()=>{ P.open.add(it.id); const first=[...it.packs].sort(packCmp)[0]; if(first) S.focus=`pk:${first.id}:qty`; render(); }},
            tq==null?'—':String(tq),h('span',{class:'ptedit','aria-hidden':'true',text:'✎'}))),
      inp(it,'unit',`p:${it.id}:unit`,{type:'text',list:'punits','aria-label':`${it.name} unit`}),
      one?inp(one,'k100',`pk:${one.id}:k100`,{type:'text',inputmode:'decimal',class:'num',placeholder:'per 100','aria-label':`${it.name} calories per 100 g or 100 ml`,title:'Calories per 100 g or 100 ml, from the label. With the amount in g, kg, ml or L, the pack’s kcal is worked out for you.'},'commit')
         :(()=>{ const vs=[...new Set(it.packs.filter(p=>typeof p.k100==='number').map(p=>p.k100))];
            return h('td',{class:'pro num'},h('button',{class:'ptotal',title:'Each pack has its own kcal per 100 g or ml. Click to edit them.','aria-label':`${it.name}: kcal per 100 ${vs.length>1?'varies':vs[0]??'not set'}. Edit per pack`,
              onclick:()=>{ P.open.add(it.id); const first=[...it.packs].sort(packCmp)[0]; if(first) S.focus=`pk:${first.id}:k100`; render(); }},
              vs.length>1?h('span',{style:'color:var(--muted);font-size:12px',text:'varies'}):vs.length?String(vs[0]):'—',h('span',{class:'ptedit','aria-hidden':'true',text:'✎'}))); })(),
      one?inp(one,'kcal',`pk:${one.id}:kcal`,{type:'text',inputmode:'decimal',class:'num',placeholder:'kcal','aria-label':`${it.name} calories`},'commit')
         :h('td',{class:'pro num'},h('button',{class:'ptotal',title:'Total calories across all packs. Click to edit each pack’s calories.','aria-label':`${it.name}: total ${tk??0} kcal. Edit pack calories`,
            onclick:()=>{ P.open.add(it.id); const first=[...it.packs].sort(packCmp)[0]; if(first) S.focus=`pk:${first.id}:kcal`; render(); }},
            tk==null?'—':String(tk),h('span',{class:'ptedit','aria-hidden':'true',text:'✎'}))),
      inp(it,'cat',`p:${it.id}:cat`,{type:'text',list:'pcats','aria-label':`${it.name} category`},'commit'),
      one?expIn(one,`pk:${one.id}:exp`,`${it.name} expiry date`)
         :h('td',{class:'pro',title:multi?'Closest expiry date':''},multi&&itemExp(it)?h('span',{},fmtExp(itemExp(it)),h('span',{class:'pfirst',text:' (first)'})):''),
      h('td',{class:'pstat',text:st.text}),
      inp(it,'notes',`p:${it.id}:notes`,{type:'text','aria-label':`${it.name} notes`}),
      h('td',{class:'pacts2'},h('button',{class:'paddpk',title:'Add another pack with its own expiry date','aria-label':`Add a pack of ${it.name}`,onclick:addPack},'+ pack'),
        delBtn(`Delete ${it.name}`,()=>{ S.state.pantry=S.state.pantry.filter(x=>x!==it); commit(); }))));
    if(open){
      [...it.packs].sort(packCmp).forEach((pk,pi)=>{
        const ps=expStatus(pk.exp);
        rows.push(h('tr',{class:'packrow '+ps.cls+(pk.qty===0?' empty':'')+(P.flash===it.id&&!pk.qty&&!pk.exp&&pk===it.packs[it.packs.length-1]?' pfresh':'')},
          h('td',{class:'pklabel',text:`Pack ${pi+1}`}),
          h('td',{}),
          inp(pk,'qty',`pk:${pk.id}:qty`,{type:'text',inputmode:'decimal',class:'num',placeholder:'amount','aria-label':`${it.name} pack ${pi+1} amount`,'data-autofocus':S.focus===`pk:${pk.id}:qty`?'1':null},'commit'),
          h('td',{class:'pro',text:it.unit||''}),
          inp(pk,'k100',`pk:${pk.id}:k100`,{type:'text',inputmode:'decimal',class:'num',placeholder:'per 100','aria-label':`${it.name} pack ${pi+1} calories per 100 g or 100 ml`,'data-autofocus':S.focus===`pk:${pk.id}:k100`?'1':null},'commit'),
          inp(pk,'kcal',`pk:${pk.id}:kcal`,{type:'text',inputmode:'decimal',class:'num',placeholder:'kcal','aria-label':`${it.name} pack ${pi+1} calories`,'data-autofocus':S.focus===`pk:${pk.id}:kcal`?'1':null},'commit'),
          h('td',{}),
          expIn(pk,`pk:${pk.id}:exp`,`${it.name} pack ${pi+1} expiry date`,{'data-autofocus':S.focus===`pk:${pk.id}:exp`?'1':null}),
          h('td',{class:'pstat',text:ps.text}),
          inp(pk,'note',`pk:${pk.id}:note`,{type:'text','aria-label':`${it.name} pack ${pi+1} note`,placeholder:'pack note'}),
          h('td',{class:'pacts2'},delBtn(`Delete this pack of ${it.name}`,()=>{ it.packs=it.packs.filter(x=>x!==pk); if(it.packs.length<2) P.open.delete(it.id); commit(); }))));
      });
    }
  });
  // add row
  const D=P.draft||(P.draft={});
  const addCell=(field,attrs)=>{ const el=h('input',Object.assign({value:D[field]||'','aria-label':`New item ${field==='cat'?'category':field==='exp'?'expiry date':field==='qty'?'amount':field==='kcal'?'calories':field==='k100'?'calories per 100 g or ml':field}`},attrs||{}));
    el.addEventListener('input',()=>{D[field]=el.value});
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); addItem(); } });
    return h('td',{},el); };
  const addItem=()=>{
    const name=(D.name||'').trim(); if(!name){ const f=main.querySelector('[data-k="padd"]'); if(f) f.focus(); return; }
    const pk={id:uid()}; const qn=Number(String(D.qty||'').replace(',','.'));
    if(String(D.qty||'').trim()&&isFinite(qn)) pk.qty=qn; const pe=parseExp(D.exp); if(pe===null){ const f=main.querySelector('[data-k="paddexp"]'); if(f){ f.classList.add('bad'); f.focus(); } return; } if(pe) pk.exp=pe; const kn=Number(String(D.kcal||'').replace(',','.')); if(String(D.kcal||'').trim()&&isFinite(kn)) pk.kcal=kn;
    let it=items.find(x=>x.name.trim().toLowerCase()===name.toLowerCase());
    if(it){ it.packs.push(pk); if(!it.unit&&(D.unit||'').trim()) it.unit=D.unit.trim(); if(!it.cat&&(D.cat||'').trim()) it.cat=D.cat.trim(); P.open.add(it.id); }
    else { it={id:uid(),name,packs:[pk]}; ['unit','cat','notes'].forEach(k=>{ if(D[k]&&String(D[k]).trim()) it[k]=String(D[k]).trim(); }); S.state.pantry.push(it); }
    const kh=Number(String(D.k100||'').replace(',','.')); if(String(D.k100||'').trim()&&isFinite(kh)) pk.k100=kh; applyK100(it); if(typeof pk.k100!=='number') deriveK100(it,pk);
    P.draft={unit:D.unit||'',cat:D.cat||''}; S.focus='pantry-add'; commit();
  };
  const kTot=foodItems.reduce((n,it)=>n+(itemKcal(it)||0),0);
  const totRow=h('tr',{class:'ptotrow'},h('td',{colspan:'5',text:q?`Total food for the items shown`:'Total food'}),
    h('td',{class:'n','aria-label':`Total calories: ${kTot}`},String(Math.round(kTot)),h('span',{class:'u',text:'kcal'})),h('td',{colspan:'5'}));
  const ST=S.state.settings, ppl=ST.pantryPeople>0?ST.pantryPeople:4, kpp=ST.pantryKcal>0?ST.pantryKcal:2000;
  const days=kTot/(ppl*kpp);
  const pnum=(val,label,key,step)=>{ const el=h('input',{class:'pdn',type:'number',min:'1',step,value:String(val),'aria-label':label,'data-k':'pd:'+key});
    el.addEventListener('change',()=>{ const n=Math.round(Number(el.value)); if(n>0){ ST[key]=n; commit(); } else el.value=String(val); });
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); el.blur(); } }); return el; };
  const daysRow=h('tr',{class:'pdays'},h('td',{colspan:'5'},'Days of food for',pnum(ppl,'Number of people','pantryPeople','1'),'people at',pnum(kpp,'Calories per person per day','pantryKcal','50'),'kcal a day'),
    h('td',{class:'n','aria-label':`${days.toFixed(1)} days`},(Math.round(days*10)/10).toLocaleString(undefined,{maximumFractionDigits:1}),h('span',{class:'u',text:Math.round(days*10)/10===1?'day':'days'})),h('td',{colspan:'5'}));
  const wL=waterItems.reduce((n,it)=>n+it.packs.reduce((m,p)=>m+(packBase(p.qty,it.unit)||0),0),0)/1000;
  const lpp=ST.pantryWaterL>0?ST.pantryWaterL:2, wDays=wL/(ppl*lpp);
  const fmt1=v=>(Math.round(v*10)/10).toLocaleString(undefined,{maximumFractionDigits:1});
  const wpIn=h('input',{class:'pdn',type:'number',min:'1',step:'1',value:String(ppl),'aria-label':'Number of people','data-k':'pd:wPeople'});
  wpIn.addEventListener('change',()=>{ const n=Math.round(Number(wpIn.value)); if(n>0){ ST.pantryPeople=n; commit(); } else wpIn.value=String(ppl); });
  const wlIn=h('input',{class:'pdn',type:'number',min:'0.5',step:'0.5',value:String(lpp),'aria-label':'Litres of water per person per day','data-k':'pd:wL'});
  wlIn.addEventListener('change',()=>{ const n=Math.round(Number(String(wlIn.value).replace(',','.'))*10)/10; if(n>0){ ST.pantryWaterL=n; commit(); } else wlIn.value=String(lpp); });
  [wpIn,wlIn].forEach(el=>el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); el.blur(); } }));
  const waterTot=h('tr',{class:'ptotrow pwater'},h('td',{colspan:'5',title:'Items with “water” in the name or a Water category, counted in L, ml, cl or dl',text:q?'Total water for the items shown':'Total water'}),
    h('td',{class:'n'},fmt1(wL),h('span',{class:'u',text:'L'})),h('td',{colspan:'5'}));
  const waterDays=h('tr',{class:'pdays pwater'},h('td',{colspan:'5'},'Days of water for',wpIn,'people at',wlIn,'L a day'),
    h('td',{class:'n'},fmt1(wDays),h('span',{class:'u',text:Math.round(wDays*10)/10===1?'day':'days'})),h('td',{colspan:'5'}));
  const cats=[...new Set(items.map(x=>x.cat).filter(Boolean))].sort(cmpStr);
  const units=[...new Set(PUNITS.concat(items.map(x=>x.unit).filter(Boolean)))];
  const table=h('table',{class:'pantry'},
    h('colgroup',{},h('col',{style:'width:17%'}),h('col',{style:'width:5%'}),h('col',{style:'width:7%'}),h('col',{style:'width:6%'}),h('col',{style:'width:7.5%'}),h('col',{style:'width:7%'}),h('col',{style:'width:11%'}),h('col',{style:'width:10.5%'}),h('col',{style:'width:10.5%'}),h('col',{}),h('col',{style:'width:8.5rem'})),
    h('thead',{},h('tr',{},th('Item','name'),th('Packs'),th('Amount'),th('Unit'),th('kcal / 100 g·ml'),th('kcal'),th('Category','cat'),th('Expires','exp'),th('Status'),th('Notes'),th(''))),
    h('tbody',{},rows.length?rows:h('tr',{},h('td',{colspan:'11',class:'pstat',style:'padding:14px 10px',text:items.length?'No items match that search.':'No items yet. Add your first one in the row below.'}))),
    h('tfoot',{},h('tr',{},addCell('name',{type:'text',placeholder:'+ New item or pack','data-k':'padd','data-autofocus':S.focus==='pantry-add'?'1':null}),h('td',{}),
      addCell('qty',{type:'text',inputmode:'decimal',class:'num',placeholder:'0'}),
      addCell('unit',{type:'text',list:'punits',placeholder:'unit'}),addCell('k100',{type:'text',inputmode:'decimal',class:'num',placeholder:'per 100'}),addCell('kcal',{type:'text',inputmode:'decimal',class:'num',placeholder:'kcal'}),addCell('cat',{type:'text',list:'pcats',placeholder:'category'}),
      addCell('exp',{type:'text',placeholder:'dd-mm-yyyy','data-k':'paddexp',title:'Day-month-year, e.g. 05-11-2026, or mm-yyyy for month only'}),h('td',{}),addCell('notes',{type:'text',placeholder:'notes'}),
      h('td',{},h('button',{class:'pill primary',style:'margin:3px 6px;padding:4px 10px',onclick:addItem},'Add'))),totRow,daysRow,waterTot,waterDays));
  P.flash=null;
  wrap.append(h('div',{class:'pwrap'},table),
    h('datalist',{id:'punits'},units.map(u=>h('option',{value:u}))),
    h('datalist',{id:'pcats'},cats.map(c=>h('option',{value:c}))),
    h('p',{class:'libcount',style:'margin-top:10px',text:'Items with several packs show the closest expiry date, the number of packs, and the total amount and calories across them; click ▸ or the pack count to see each pack. Use “+ pack” to add another pack with its own date, or type an existing item’s name in the bottom row to add a pack to it. Dates are day-month-year (05-11-2026); leave out the day for month-only dates (11-2026), which count as the end of that month. Fill in kcal per 100 g or 100 ml from the label, with the amount in g, kg, ml or L, and each pack’s kcal is calculated for you. Packs of the same item can each have their own kcal per 100. Anything with “water” in its name, or in a category called Water, is listed separately and counted in litres.'}));
  wrap.append(needSec);
  return wrap;
}

/* ---------- library ---------- */
const NEWG='__new__';
const allSubgenres=()=>S.state.genreGroups.flatMap(g=>g.subs);
const groupOfSub=sub=>S.state.genreGroups.find(g=>g.subs.includes(sub));
function uniqueName(base,taken){ let n=base, i=2; while(taken.includes(n)) n=`${base} ${i++}`; return n; }
function renameInput(cls,value,onDone){
  const inp=h('input',{class:cls,type:'text',value,'aria-label':'Name','data-autofocus':'1'});
  let fin=false;
  const done=save=>{ if(fin) return; fin=true; S.lib.rename=null; if(save) onDone(inp.value.trim()); else render(); };
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();done(true)} else if(e.key==='Escape'){e.preventDefault();done(false)} });
  inp.addEventListener('blur',()=>done(true));
  return inp;
}
function setupTocSpy(){
  if(S.tocObs){ S.tocObs.disconnect(); S.tocObs=null; }
  if(S.view!=='library'||!('IntersectionObserver' in window)) return;
  const secs=[...main.querySelectorAll('.libcontent .genre')]; if(!secs.length) return;
  const vis=new Set();
  const mark=()=>{
    const top=secs.find(x=>vis.has(x)); if(!top) return;
    main.querySelectorAll('.toc .on').forEach(x=>x.classList.remove('on'));
    const t=main.querySelector(`.toc [data-toc="${top.id}"]`); if(!t) return;
    t.classList.add('on'); const p=main.querySelector(`.toc [data-toc="${t.dataset.parent}"]`); if(p) p.classList.add('on');
    const toc=main.querySelector('.toc'); if(toc&&toc.scrollHeight>toc.clientHeight){ const r=t.getBoundingClientRect(), tr=toc.getBoundingClientRect(); if(r.top<tr.top||r.bottom>tr.bottom) t.scrollIntoView({block:'nearest'}); }
  };
  S.tocObs=new IntersectionObserver(es=>{ es.forEach(e=>e.isIntersecting?vis.add(e.target):vis.delete(e.target)); mark(); },{rootMargin:'0px 0px -60% 0px'});
  secs.forEach(x=>S.tocObs.observe(x));
}
function renderLibrary(){
  const L=S.lib||(S.lib={q:'',sort:'title',closed:new Set(),rename:null});
  const q=L.q.trim().toLowerCase();
  const G=S.state.genreGroups;
  const match=b=>!q||[b.title,b.author,b.genre,b.lang,b.notes,(groupOfSub(b.genre)||{}).name].some(x=>x&&String(x).toLowerCase().includes(q));
  L.status=L.status||'all';
  const stOk=b=>L.status==='all'||(L.status==='none'?!b.status:b.status===L.status);
  L.int=L.int||'any';
  const intOk=b=>L.int==='any'||(L.int==='0'?!b.interest:(b.interest||0)>=Number(L.int));
  const books=S.state.books.filter(b=>match(b)&&stOk(b)&&intOk(b));
  const filtering=!!q||L.status!=='all'||L.int!=='any';
  const sortKey=b=>(L.sort==='author'?(b.author||'~'):b.title).replace(/^(the|a|an|il|lo|la|i|de|het|le|les|un|une)\s+/i,'').replace(/^['"‘’]+/,'').toLowerCase();
  let wrap=h('div');
  const search=h('input',{class:'libsearch',type:'search',placeholder:'Search title, author, genre, language…','aria-label':'Search library','data-k':'libq',value:L.q});
  search.addEventListener('input',()=>{ L.q=search.value; renderMain(); const el=document.querySelector('[data-k="libq"]'); if(el){el.focus(); el.setSelectionRange(el.value.length,el.value.length);} });
  const sortSel=h('select',{'aria-label':'Sort books by',onchange:e=>{L.sort=e.target.value;render()}},h('option',{value:'title'},'Sort by title'),h('option',{value:'author'},'Sort by author'),h('option',{value:'interest'},'Sort by interest'));
  sortSel.value=L.sort;
  const stSel=h('select',{'aria-label':'Show books by reading status',onchange:e=>{L.status=e.target.value;render()}},
    h('option',{value:'all'},'All books'),h('option',{value:'reading'},'Reading'),h('option',{value:'read'},'Read'),h('option',{value:'none'},'Not started'));
  stSel.value=L.status;
  const nRd=S.state.books.filter(b=>b.status==='reading').length, nDone=S.state.books.filter(b=>b.status==='read').length;
  const keys=[...G.map(g=>'g:'+g.name),...allSubgenres().map(x=>'s:'+x)];
  const allClosed=G.every(g=>L.closed.has('g:'+g.name));
  wrap.append(h('div',{class:'libbar'},
    h('button',{class:'pill primary',onclick:()=>openBook(null)},'Add book'),
    search, sortSel, stSel,
    (()=>{ const x=h('select',{'aria-label':'Filter by interest',onchange:e=>{L.int=e.target.value;render()}},
      h('option',{value:'any'},'Any interest'),h('option',{value:'3'},'★★★ only'),h('option',{value:'2'},'★★ and up'),h('option',{value:'1'},'★ and up'),h('option',{value:'0'},'Not rated'));
      x.value=L.int; return x; })(),
    h('button',{class:'pill',onclick:()=>{ const n=uniqueName('New genre',G.map(g=>g.name)); G.push({name:n,subs:[]}); L.rename={t:'g',name:n}; L.q=''; commit(); }},'Add genre'),
    h('button',{class:'link',onclick:()=>{ if(allClosed) L.closed.clear(); else G.forEach(g=>L.closed.add('g:'+g.name)); render(); }},allClosed?'Expand all':'Collapse all'),
    h('span',{class:'libcount',text:filtering?`${sumV(books)} of ${sumV(S.state.books)} books`:`${sumV(S.state.books)} books in ${G.length} genres, ${allSubgenres().length} subgenres`}),
    h('span',{class:'statkey'},h('span',{},h('i',{style:'background:var(--rd)'}),`Reading ${nRd}`),h('span',{},h('i',{style:'background:var(--ok)'}),`Read ${nDone}`))));
  const jumpTo=(id,gName,sName)=>{ if(gName) L.closed.delete('g:'+gName); if(sName) L.closed.delete('s:'+sName); render();
    const el=document.getElementById(id); if(el){ const rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches; el.scrollIntoView({behavior:rm?'auto':'smooth',block:'start'}); } };
  const toc=h('aside',{class:'toc','aria-label':'Library contents'},
    h('div',{class:'tochd'},h('b',{text:'Contents'}),h('button',{class:'link',style:'width:auto;padding:0',onclick:()=>window.scrollTo({top:0,behavior:'smooth'})},'↑ Top')),
    h('ul',{class:'tocg'},G.map((g,gi)=>{ const n=sumV(books.filter(b=>g.subs.includes(b.genre)));
      return h('li',{},
        h('button',{class:'tg','data-toc':'lg-'+gi,disabled:filtering&&!n,onclick:()=>jumpTo('lg-'+gi,g.name)},g.name,h('span',{text:String(n)})),
        h('ul',{class:'tocs'},g.subs.map((x,si)=>{ const m=sumV(books.filter(b=>b.genre===x));
          return h('li',{},h('button',{class:'ts','data-toc':`ls-${gi}-${si}`,'data-parent':'lg-'+gi,disabled:filtering&&!m,onclick:()=>jumpTo(`ls-${gi}-${si}`,g.name,x)},x,h('span',{text:String(m)}))); }))); })));
  const content=h('div',{class:'libcontent'});
  const outer=wrap; outer.append(h('div',{class:'libwrap'},toc,content));
  wrap=content;
  setTimeout(setupTocSpy,0);
  if(filtering&&!books.length){ wrap.append(h('p',{class:'empty',text:q?'No books match that search.':'No books with that status yet. Click the circle next to a book to mark it.'})); return outer; }
  G.forEach((grp,gi)=>{
    const inGroup=books.filter(b=>grp.subs.includes(b.genre));
    if(filtering&&!inGroup.length) return;
    const gClosed=L.closed.has('g:'+grp.name)&&!filtering;
    const sec=h('section',{class:'ggroup','aria-label':grp.name,id:'lg-'+gi});
    const gmv=d=>{ const j=gi+d; if(j<0||j>=G.length) return; [G[gi],G[j]]=[G[j],G[gi]]; commit(); };
    const head=(L.rename&&L.rename.t==='g'&&L.rename.name===grp.name)
      ? renameInput('gname',grp.name,v=>{ if(v&&v!==grp.name&&!G.some(x=>x.name===v)){ if(L.closed.delete('g:'+grp.name)) L.closed.add('g:'+v); grp.name=v; } commit(); })
      : h('button',{class:'gtoggle','aria-expanded':String(!gClosed),'data-k':'gg:'+grp.name,onclick:()=>{ const k='g:'+grp.name; L.closed.has(k)?L.closed.delete(k):L.closed.add(k); render(); }},
          h('span',{class:'chev',text:gClosed?'▸':'▾'}),h('h2',{text:grp.name}));
    sec.append(h('div',{class:'ggrouphd'},head,h('span',{class:'gcount',text:`${sumV(inGroup)} book${sumV(inGroup)===1?'':'s'}`}),h('span',{class:'spacer'}),
      q?null:h('button',{class:'gmove','aria-label':`Move ${grp.name} up`,title:'Move up',disabled:gi===0,'data-k':'ggu:'+grp.name,onclick:()=>gmv(-1)},'↑'),
      q?null:h('button',{class:'gmove','aria-label':`Move ${grp.name} down`,title:'Move down',disabled:gi===G.length-1,'data-k':'ggd:'+grp.name,onclick:()=>gmv(1)},'↓'),
      h('button',{class:'link',onclick:()=>{ const n=uniqueName('New subgenre',allSubgenres()); grp.subs.push(n); L.closed.delete('g:'+grp.name); L.rename={t:'s',name:n}; L.q=''; commit(); }},'Add subgenre'),
      h('button',{class:'link',onclick:()=>{L.rename={t:'g',name:grp.name};render()}},'Rename'),
      grp.subs.length||q?null:h('button',{class:'link',onclick:()=>{G.splice(gi,1);commit()}},'Delete')));
    if(!gClosed){
      if(!grp.subs.length) sec.append(h('p',{class:'libempty',text:'No subgenres yet. Use Add subgenre.'}));
      grp.subs.forEach((sub,si)=>{
        const list=inGroup.filter(b=>b.genre===sub).sort((a,b)=>(L.sort==='interest'?((b.interest||0)-(a.interest||0)):0)||sortKey(a).localeCompare(sortKey(b)));
        if(filtering&&!list.length) return;
        const closed=L.closed.has('s:'+sub)&&!filtering;
        const ss=h('section',{class:'genre','aria-label':sub,id:`ls-${gi}-${si}`});
        const smv=d=>{ const j=si+d; if(j<0||j>=grp.subs.length) return; [grp.subs[si],grp.subs[j]]=[grp.subs[j],grp.subs[si]]; commit(); };
        const shead=(L.rename&&L.rename.t==='s'&&L.rename.name===sub)
          ? renameInput('gname',sub,v=>{ if(v&&v!==sub&&!allSubgenres().includes(v)){ grp.subs[si]=v; S.state.books.forEach(b=>{if(b.genre===sub)b.genre=v}); if(L.closed.delete('s:'+sub)) L.closed.add('s:'+v); } commit(); })
          : h('button',{class:'gtoggle','aria-expanded':String(!closed),'data-k':'gt:'+sub,onclick:()=>{ const k='s:'+sub; L.closed.has(k)?L.closed.delete(k):L.closed.add(k); render(); }},
              h('span',{class:'chev',text:closed?'▸':'▾'}),h('h3',{text:sub}));
        const moveSel=G.length>1&&!q?h('select',{'aria-label':`Move ${sub} to another genre`,title:'Move to another genre',onchange:e=>{
            const to=G.find(x=>x.name===e.target.value); if(!to||to===grp) return; grp.subs.splice(si,1); to.subs.push(sub); commit(); }},
            h('option',{value:''},'Move to…'),G.filter(x=>x!==grp).map(x=>h('option',{value:x.name},x.name))):null;
        ss.append(h('div',{class:'genrehd'},shead,h('span',{class:'gcount',text:String(sumV(list))}),
          h('button',{class:'addbook','data-k':'ab:'+sub,'aria-label':`Add a book to ${sub}`,onclick:()=>{ L.adding=sub; L.addDraft={title:'',author:'',status:''}; L.closed.delete('s:'+sub); render(); }},'+ Add book'),
          h('span',{class:'spacer'}),
          q?null:h('button',{class:'gmove','aria-label':`Move ${sub} up`,title:'Move up',disabled:si===0,'data-k':'gmu:'+sub,onclick:()=>smv(-1)},'↑'),
          q?null:h('button',{class:'gmove','aria-label':`Move ${sub} down`,title:'Move down',disabled:si===grp.subs.length-1,'data-k':'gmd:'+sub,onclick:()=>smv(1)},'↓'),
          moveSel,
          h('button',{class:'link',onclick:()=>{L.rename={t:'s',name:sub};render()}},'Rename'),
          list.length||q?null:h('button',{class:'link',onclick:()=>{grp.subs.splice(si,1);commit()}},'Delete')));
        ss.addEventListener('dragover',e=>{
          if(!e.dataTransfer.types.includes('application/x-book')) return;
          e.preventDefault(); e.dataTransfer.dropEffect='move';
          document.querySelectorAll('.genre.over').forEach(x=>{ if(x!==ss) x.classList.remove('over'); });
          ss.classList.add('over');
        });
        ss.addEventListener('dragleave',e=>{ if(!ss.contains(e.relatedTarget)) ss.classList.remove('over'); });
        ss.addEventListener('drop',e=>{
          const id=e.dataTransfer.getData('application/x-book'); if(!id) return;
          e.preventDefault(); ss.classList.remove('over'); document.body.classList.remove('bookdrag');
          const bk=S.state.books.find(x=>x.id===id); if(!bk||bk.genre===sub) return;
          bk.genre=sub; L.closed.delete('s:'+sub); commit();
        });
        let addRow=null;
        if(L.adding===sub&&!closed){
          const D=L.addDraft||(L.addDraft={title:'',author:'',status:''});
          const ti=h('input',{class:'at',type:'text',placeholder:'Title',value:D.title,'aria-label':`Title of new book in ${sub}`,'data-autofocus':'1'});
          const au=h('input',{class:'aa',type:'text',placeholder:'Author (optional)',value:D.author,'aria-label':'Author'});
          const av=h('input',{class:'av',type:'number',min:'1',step:'1',placeholder:'# books',value:D.vols||'','aria-label':'Number of books in the series (leave blank for one)',title:'Books in series (leave blank for a single book)'});
          ti.addEventListener('input',()=>{D.title=ti.value}); au.addEventListener('input',()=>{D.author=au.value}); av.addEventListener('input',()=>{D.vols=av.value});
          const stLabel={'':'○ Not started',reading:'◐ Reading',read:'● Read'};
          const stb=h('button',{class:'astat '+(D.status||''),type:'button',title:'Click to change reading status','aria-label':`Status: ${stLabel[D.status||'']}. Click to change`,
            onclick:()=>{ D.status=!D.status?'reading':D.status==='reading'?'read':''; stb.className='astat '+D.status; stb.textContent=stLabel[D.status]; stb.setAttribute('aria-label',`Status: ${stLabel[D.status]}. Click to change`); }},stLabel[D.status||'']);
          const add=()=>{ const t=D.title.trim(); if(!t){ ti.focus(); return; }
            const nb={id:uid(),title:t,author:D.author.trim(),genre:sub}; if(D.status) nb.status=D.status; if(D.interest) nb.interest=D.interest; const nv=Math.round(Number(D.vols)); if(nv>1) nb.vols=nv;
            S.state.books.push(nb); L.addDraft={title:'',author:'',status:D.status,interest:0}; commit(); };
          const close=()=>{ L.adding=null; L.addDraft=null; render(); };
          [ti,au,av].forEach(x=>x.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); add(); } else if(e.key==='Escape'){ e.preventDefault(); close(); } }));
          const aint=h('span',{class:'aint',role:'group','aria-label':'Interest'},[1,2,3].map(n=>h('button',{type:'button',class:(D.interest||0)>=n?'on':'',title:`Interest ${n} of 3 (click again to clear)`,'aria-label':`Interest ${n} of 3`,
            onclick:()=>{ D.interest=D.interest===n?0:n; aint.querySelectorAll('button').forEach((x,i)=>x.classList.toggle('on',(D.interest||0)>i)); }},'★')));
          addRow=h('li',{class:'addrow'},stb,aint,ti,au,av,
            h('button',{class:'pill primary',type:'button',onclick:add},'Add'),
            h('button',{class:'pill',type:'button',onclick:close},'Done'),
            h('span',{class:'addhint',text:`Press Enter to add to ${sub} and start the next one. Esc or Done when finished.`}));
        }
        if(!closed){
          if(addRow) ss.append(h('ul',{class:'booklist'},addRow));
          if(!list.length&&!addRow) ss.append(h('p',{class:'libempty',text:'No books in this subgenre yet.'}));
          else ss.append(h('ul',{class:'booklist'},list.map(b=>h('li',{class:'bookrow'+(b.status?' '+b.status:''),draggable:'true','data-bid':b.id,
              ondragstart:e=>{ e.dataTransfer.setData('application/x-book',b.id); e.dataTransfer.setData('text/plain',b.title); e.dataTransfer.effectAllowed='move';
                e.currentTarget.classList.add('dragging'); document.body.classList.add('bookdrag'); },
              ondragend:e=>{ e.currentTarget.classList.remove('dragging'); document.body.classList.remove('bookdrag'); document.querySelectorAll('.genre.over').forEach(x=>x.classList.remove('over')); }},
            h('button',{class:'bstat','data-k':'bs:'+b.id,
              'aria-label':`${b.title}: ${b.status==='reading'?'reading':b.status==='read'?'read':'not started'}. Click to change`,
              title:b.status==='reading'?'Reading (click: mark read)':b.status==='read'?'Read (click: clear)':'Not started (click: mark reading)',
              onclick:()=>{ b.status=!b.status?'reading':b.status==='reading'?'read':undefined; if(!b.status) delete b.status; commit(); }},
              b.status==='reading'?'◐':b.status==='read'?'●':'○'),
            h('div',{class:'book',role:'button',tabindex:'0','data-k':'bk:'+b.id,onclick:()=>openBook(b.id),
              onkeydown:e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openBook(b.id); } },
              title:'Click to edit. Drag to another subgenre to move it.','aria-label':`${b.title}${b.author?`, ${b.author}`:''}. Edit`},
            h('span',{class:'bt'},b.title,b.vols>1?h('span',{class:'bv',title:`A series of ${b.vols} books`,text:`${b.vols} books`}):null),
            b.lang&&!/^english$/i.test(b.lang)?h('span',{class:'bl',text:b.lang}):null,
            b.author?h('span',{class:'ba',text:b.author}):null,
            b.notes?h('span',{class:'bn',text:b.notes}):null),
            h('span',{class:'bint'+(b.interest?' set':''),role:'group','aria-label':`Interest in ${b.title}`},[1,2,3].map(n=>h('button',{class:(b.interest||0)>=n?'on':'','data-k':`bi:${b.id}:${n}`,
              title:b.interest===n?'Click to clear interest':`Interest: ${['','low','medium','high'][n]}`,'aria-label':`Interest ${n} of 3`,'aria-pressed':String(b.interest===n),
              onclick:()=>{ if(b.interest===n) delete b.interest; else b.interest=n; commit(); }},'★')))))));
        }
        sec.append(ss);
      });
    }
    wrap.append(sec);
  });
  return outer;
}
const bookDlg=$('bookDlg');
let bookId=null;
function fillGenreSel(sel){
  $('bkGenre').replaceChildren(h('option',{value:'',disabled:true},'Choose a subgenre…'),...S.state.genreGroups.filter(g=>g.subs.length).map(g=>h('optgroup',{label:g.name},g.subs.map(x=>h('option',{value:x},x)))),h('option',{value:NEWG},'New subgenre…'));
  $('bkNewGroup').replaceChildren(h('option',{value:'',disabled:true},'Choose a genre…'),...S.state.genreGroups.map(g=>h('option',{value:g.name},g.name)));
  $('bkNewGroup').value='';
  $('bkGenre').value=(sel&&allSubgenres().includes(sel))?sel:'';
  $('bkErr').textContent='';
  $('bkNewWrap').hidden=$('bkGenre').value!==NEWG;
}
const bvol=b=>b&&b.vols>1?b.vols:1;
const sumV=list=>list.reduce((n,b)=>n+bvol(b),0);
let bkMerge=[];
function fillMerge(){
  const g=$('bkGenre').value, others=S.state.books.filter(x=>x.id!==bookId&&!bkMerge.includes(x.id));
  const same=others.filter(x=>x.genre===g).sort((a,b)=>a.title.localeCompare(b.title)), rest=others.filter(x=>x.genre!==g).sort((a,b)=>a.title.localeCompare(b.title));
  const opt=x=>h('option',{value:x.id},x.title+(x.vols>1?` (${x.vols} books)`:'')+(x.author?` – ${x.author}`:''));
  $('bkMerge').replaceChildren(h('option',{value:''},'Choose a book…'),
    same.length?h('optgroup',{label:'Same subgenre'},same.map(opt)):null,
    rest.length?h('optgroup',{label:'Other subgenres'},rest.map(opt)):null);
  $('bkMerge').value='';
  $('bkMerged').replaceChildren(...bkMerge.map(id=>{ const x=S.state.books.find(y=>y.id===id); if(!x) return null;
    return h('span',{class:'mchip'},`Merging: ${x.title}`,h('button',{type:'button','aria-label':`Don't merge ${x.title}`,title:'Undo',onclick:()=>{
      bkMerge=bkMerge.filter(y=>y!==id); const v=Math.max(1,(Number($('bkVols').value)||1)-bvol(x)); $('bkVols').value=v>1?String(v):''; fillMerge(); }},'×')); }));
}
$('bkMerge').addEventListener('change',()=>{ const id=$('bkMerge').value; if(!id) return; const x=S.state.books.find(y=>y.id===id); if(!x) return;
  bkMerge.push(id); $('bkVols').value=String((Number($('bkVols').value)||1)+bvol(x)); fillMerge(); });
function openBook(id,preGenre){
  const b=id?S.state.books.find(x=>x.id===id):null;
  bookId=b?b.id:null;
  $('bookDlgTitle').textContent=b?'Edit book':'Add a book';
  $('bkTitle').value=b?b.title:''; $('bkAuthor').value=b?b.author||'':'';
  $('bkLang').value=b?b.lang||'':''; setBkStatus(b?b.status||'':''); setBkInt(b&&b.interest?String(b.interest):''); $('bkNotes').value=b?b.notes||'':''; $('bkNewGenre').value='';
  const langs=[...new Set(S.state.books.map(x=>x.lang).filter(Boolean).concat(['English']))].sort();
  $('bkLangs').replaceChildren(...langs.map(l=>h('option',{value:l})));
  fillGenreSel(b?b.genre:preGenre);
  bkMerge=[]; $('bkVols').value=b&&b.vols>1?String(b.vols):''; fillMerge();
  $('bkDel').hidden=!b;
  bookDlg.showModal(); $('bkTitle').focus();
}
$('bkGenre').addEventListener('change',()=>{ fillMerge(); $('bkNewWrap').hidden=$('bkGenre').value!==NEWG; if(!$('bkNewWrap').hidden) $('bkNewGenre').focus(); });
function saveBook(){
  const title=$('bkTitle').value.trim(); if(!title){ $('bkTitle').focus(); return; }
  let genre=$('bkGenre').value;
  const err=(msg,el)=>{ $('bkErr').textContent=msg; el.focus(); };
  if(!genre) return err('Choose a subgenre for this book.',$('bkGenre'));
  if(genre===NEWG){ genre=$('bkNewGenre').value.trim(); if(!genre) return err('Name the new subgenre.',$('bkNewGenre'));
    if(!allSubgenres().includes(genre)){ const grp=S.state.genreGroups.find(g=>g.name===$('bkNewGroup').value);
      if(!grp) return err('Choose which genre the new subgenre goes under.',$('bkNewGroup'));
      grp.subs.push(genre); } }
  const data={title,author:$('bkAuthor').value.trim(),genre,lang:$('bkLang').value.trim(),notes:$('bkNotes').value.trim()};
  const st=$('bkStatus').dataset.v||''; if(st) data.status=st;
  const iv=$('bkInt').dataset.v||''; if(iv) data.interest=Number(iv);
  const vols=Math.round(Number($('bkVols').value)); if(vols>1) data.vols=vols;
  if(!data.lang) delete data.lang; if(!data.notes) delete data.notes;
  if(bookId){ const b=S.state.books.find(x=>x.id===bookId); delete b.lang; delete b.notes; delete b.status; delete b.interest; delete b.vols; Object.assign(b,data); }
  else S.state.books.push(Object.assign({id:uid()},data));
  if(bkMerge.length){ S.state.books=S.state.books.filter(x=>!bkMerge.includes(x.id)); bkMerge=[]; }
  S.lib=S.lib||{q:'',sort:'title',closed:new Set(),rename:null}; S.lib.lastGenre=genre; S.lib.closed.delete('s:'+genre); const gg=groupOfSub(genre); if(gg) S.lib.closed.delete('g:'+gg.name);
  bookDlg.close(); commit();
}
$('bkNotes').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); saveBook(); } });
[['bkTitle','bkAuthor'],['bkAuthor','bkGenre'],['bkNewGenre','bkNewGroup'],['bkLang','bkNotes']].forEach(([a,b])=>$(a).addEventListener('keydown',e=>{
  if(e.key!=='Enter') return; e.preventDefault(); if(e.ctrlKey||e.metaKey){ saveBook(); return; } $(b).focus(); }));
['bkGenre','bkNewGroup'].forEach(id=>$(id).addEventListener('change',()=>{ $('bkErr').textContent=''; }));
$('bkSave').addEventListener('click',saveBook);
function setBkInt(v){ const g=$('bkInt'); g.dataset.v=v; g.querySelectorAll('button').forEach(x=>{ const on=x.dataset.v===v; x.setAttribute('aria-checked',String(on)); x.tabIndex=on?0:-1; }); }
$('bkInt').querySelectorAll('button').forEach(x=>x.addEventListener('click',()=>setBkInt(x.dataset.v)));
function setBkStatus(v){ const g=$('bkStatus'); g.dataset.v=v; g.querySelectorAll('button').forEach(x=>{ const on=x.dataset.v===v; x.setAttribute('aria-checked',String(on)); x.tabIndex=on?0:-1; }); }
$('bkStatus').querySelectorAll('button').forEach(x=>x.addEventListener('click',()=>setBkStatus(x.dataset.v)));
$('bkStatus').addEventListener('keydown',e=>{ if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft') return; e.preventDefault();
  const bs=[...$('bkStatus').querySelectorAll('button')], i=bs.findIndex(x=>x.dataset.v===($('bkStatus').dataset.v||'')), j=(i+(e.key==='ArrowRight'?1:-1)+bs.length)%bs.length;
  setBkStatus(bs[j].dataset.v); bs[j].focus(); });
$('bkCancel').addEventListener('click',()=>bookDlg.close());
$('bookClose').addEventListener('click',()=>bookDlg.close());
$('bkDel').addEventListener('click',()=>{
  if($('bkDel').dataset.armed!=='1'){ $('bkDel').dataset.armed='1'; $('bkDel').textContent='Click again to delete'; return; }
  S.state.books=S.state.books.filter(x=>x.id!==bookId); bookDlg.close(); commit();
});
bookDlg.addEventListener('close',()=>{ $('bkDel').dataset.armed=''; $('bkDel').textContent='Delete book'; });
bookDlg.addEventListener('click',e=>{ if(e.target===bookDlg) bookDlg.close(); });

function renderWeek(){
  const days=Array.from({length:7},(_,i)=>addDays(S.week,i));
  const today=key(new Date());
  const grid=h('div',{class:'week'});
  grid.style.gridTemplateColumns=colTemplate();
  const themes=S.state.themes.filter(t=>t.show);
  if(themes.length){
    grid.append(h('div',{class:'wklabel',title:'Things for this week without a set day'},'This week'));
    const wkrow=h('div',{class:'wkrow',role:'group','aria-label':'This week, any day'});
    themes.forEach(t=>{ const c=renderCell(t,{week:key(S.week)},false,false); c.prepend(h('div',{class:'wkthm',text:t.name})); wkrow.append(c); });
    grid.append(wkrow);
  }
  grid.append(h('div'));
  const hdrs=[];
  days.forEach(d=>{
    const k=key(d);
    hdrs.push(h('div',{class:'dayhead'+(k===today?' today':''),title:fmtLong.format(d)},
      h('span',{class:'dow',text:fmtDow.format(d)}),h('span',{class:'dnum',text:String(d.getDate())})));
  });
  hdrs.forEach((hd,i)=>{
    if(i<6){
      const grip=h('div',{class:'colgrip',role:'separator','aria-orientation':'vertical',tabindex:'0','data-k':'grip:'+i,
        'aria-label':'Resize column. Left and right arrows adjust, double-click resets all',title:'Drag to resize. Double-click to reset all columns.'});
      grip.addEventListener('pointerdown',e=>startResize(e,i,grid,hdrs));
      grip.addEventListener('dblclick',()=>{ delete S.state.settings.cols; commit(); });
      grip.addEventListener('keydown',e=>{
        if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight') return;
        e.preventDefault();
        const w=colWeights().slice(), d=e.key==='ArrowRight'?.05:-.05;
        if(w[i]+d<.3||w[i+1]-d<.3) return;
        w[i]+=d; w[i+1]-=d; S.state.settings.cols=w.map(x=>Math.round(x*1000)/1000); commit();
      });
      hd.append(grip);
    }
    grid.append(hd);
  });
  grid.append(renderAllDay(days,today));
  themes.forEach((t,ti)=>{
    grid.append(renderSpine(t));
    days.forEach((d,i)=>grid.append(renderCell(t,{date:key(d),d},key(d)===today,i===6)));
  });
  if(S.state.settings.showSpend) renderSpendRow(grid,days,today);
  const out=h('div');
  out.append(h('div',{class:'weekscroll'},grid));
  const foot=h('div',{class:'weekfoot'},
    h('button',{class:'pill',onclick:()=>openThemes()},'Themes and colours'),
    h('button',{class:'pill',onclick:()=>{S.state.settings.showSpend=!S.state.settings.showSpend;commit()}},S.state.settings.showSpend?'Hide spending row':'Show spending row'),
    S.state.settings.cols?h('button',{class:'pill',onclick:()=>{delete S.state.settings.cols;commit()}},'Reset column widths'):null,
    h('span',{text:themes.length?'Drag a theme name to reorder rows. Drag tasks to reorder them, or onto another day, theme or the This week row. Click ! to mark a task high priority. Click a task to edit it and see its sub-tasks.':'All themes are hidden. Open Themes and colours to show one.'}));
  out.append(foot);
  out.append(renderMonth());
  return out;
}
const evType=id=>S.state.evtypes.find(x=>x.id===id)||S.state.evtypes[S.state.evtypes.length-1];
function shiftYear(k,y){return y+k.slice(4)}
function weekOccurrences(days){
  const ws=key(days[0]), we=key(days[6]), out=[];
  S.state.events.forEach(ev=>{
    const cands=[];
    if(ev.yearly){
      const span=Number(ev.end.slice(0,4))-Number(ev.start.slice(0,4));
      for(let y=days[0].getFullYear()-1;y<=days[6].getFullYear();y++) cands.push({start:shiftYear(ev.start,y),end:shiftYear(ev.end,y+span)});
    } else cands.push({start:ev.start,end:ev.end});
    cands.forEach(c=>{
      if(c.start>we||c.end<ws) return;
      out.push({ev,s:c.start<ws?0:diffDays(ws,c.start),e:c.end>we?6:diffDays(ws,c.end),contL:c.start<ws,contR:c.end>we});
    });
  });
  out.sort((a,b)=>a.s-b.s||(b.e-b.s)-(a.e-a.s));
  const lanes=[];
  out.forEach(o=>{ let l=lanes.findIndex(end=>end<o.s); if(l<0){l=lanes.length;lanes.push(-1)} lanes[l]=o.e; o.lane=l; });
  return {occ:out,n:lanes.length};
}
function renderAllDay(days,today){
  const {occ,n}=weekOccurrences(days);
  const strip=h('div',{class:'allday',role:'group','aria-label':'All-day events',style:`grid-template-rows:${n?`repeat(${n},auto) `:''}minmax(30px,auto)`});
  const rows=`1/${n+2}`;
  strip.append(h('div',{class:'adlabel',style:`grid-row:${rows}`},'All day'));
  days.forEach((d,i)=>{
    const k=key(d);
    strip.append(h('button',{class:'adcell'+(k===today?' today':'')+(i===6?' last':''),style:`grid-column:${i+2};grid-row:${rows}`,
      'aria-label':`Add an event on ${fmtLong.format(d)}`,onclick:()=>openEvent(null,k)},h('span',{class:'adplus'},'+ Event')));
  });
  occ.forEach(o=>{
    const t=evType(o.ev.type);
    const label=(o.contL?'‹ ':'')+(o.ev.title||'Untitled')+(o.contR?' ›':'');
    strip.append(h('div',{class:'adev',role:'button',tabindex:'0',style:`--c:${t.color};grid-column:${o.s+2}/${o.e+3};grid-row:${o.lane+1}`,
      title:evTip(o.ev,t.name),'aria-label':`${o.ev.title||'Untitled'}${evTime(o.ev)?`, ${evTime(o.ev)}`:''}, ${t.name}. Edit`,onclick:()=>openEvent(o.ev.id),
      onkeydown:e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openEvent(o.ev.id); } }},o.ev.t1?h('span',{class:'evtm',text:o.ev.t1}):null,h('span',{class:'evtxt',text:label}),o.ev.notes?h('span',{class:'evnote','aria-hidden':'true',text:'✎'}):null,evLink(o.ev)));
  });
  return strip;
}

/* ---------- all-day event dialog ---------- */
const evDlg=$('evDlg'), evName=$('evName'), evTypeSel=$('evType'), evFrom=$('evFrom'), evTo=$('evTo'), evYearly=$('evYearly');
let evId=null;
function normUrl(u){ u=(u||'').trim(); if(!u) return ''; if(!/^[a-z][a-z0-9+.-]*:/i.test(u)) u='https://'+u; try{ const x=new URL(u); return /^https?:$/.test(x.protocol)?x.href:''; }catch(e){ return ''; } }
function evTime(ev){ return ev.t1?(ev.t2?`${ev.t1}–${ev.t2}`:ev.t1):(ev.t2?`until ${ev.t2}`:''); }
function evTip(ev,typeName){ const t=evTime(ev); return `${ev.title||'Untitled'} (${typeName})${t?`\n${t}`:''}${ev.notes?`\n${ev.notes}`:''}${ev.url?`\n${ev.url}`:''}`; }
function evLink(ev){ return ev.url?h('a',{class:'evlink',href:ev.url,target:'_blank',rel:'noopener noreferrer',title:`Open website: ${ev.url}`,'aria-label':`Open website for ${ev.title||'event'}`,
  onclick:e=>e.stopPropagation(),onkeydown:e=>e.stopPropagation()},'↗'):null; }
function evUrlPreview(){ const u=normUrl($('evUrl').value); const a=$('evUrlOpen'); a.hidden=!u; if(u) a.href=u; }
$('evUrl').addEventListener('input',evUrlPreview);
$('evUrl').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); saveEvent(); } });
function openEvent(id,date){
  const ev=id?S.state.events.find(e=>e.id===id):null;
  evId=ev?ev.id:null;
  evName.value=ev?ev.title:'';
  evTypeSel.replaceChildren(...S.state.evtypes.map(t=>h('option',{value:t.id},t.name)));
  evTypeSel.value=ev?evType(ev.type).id:(S.state.evtypes.some(t=>t.id==='birthday')?'birthday':S.state.evtypes[0].id);
  evFrom.value=ev?ev.start:date; evTo.value=ev?ev.end:date; evTo.min=evFrom.value;
  evYearly.checked=ev?!!ev.yearly:true;
  $('evUrl').value=ev&&ev.url?ev.url:''; evUrlPreview();
  $('evT1').value=ev&&ev.t1||''; $('evT2').value=ev&&ev.t2||''; $('evNotes').value=ev&&ev.notes||'';
  $('evDel').hidden=!ev;
  $('evDlgTitle').textContent=ev?'Edit event':'New event';
  evDlg.showModal(); evName.focus();
}
function saveEvent(){
  const start=evFrom.value; if(!start){evFrom.focus();return}
  let end=evTo.value||start; if(end<start) end=start;
  const data={title:evName.value.trim()||'Untitled',type:evTypeSel.value,start,end,yearly:evYearly.checked};
  const url=normUrl($('evUrl').value); if(url) data.url=url;
  const t1=$('evT1').value, t2=$('evT2').value, nt=$('evNotes').value.trim();
  if(t1) data.t1=t1; if(t2) data.t2=t2; if(nt) data.notes=nt;
  if(evId){ const ev=S.state.events.find(e=>e.id===evId); ['url','t1','t2','notes'].forEach(k=>delete ev[k]); Object.assign(ev,data); }
  else S.state.events.push(Object.assign({id:uid()},data));
  evDlg.close(); commit();
}
evTypeSel.addEventListener('change',()=>{ if(!evId) evYearly.checked=evTypeSel.value==='birthday'; });
evFrom.addEventListener('change',()=>{ evTo.min=evFrom.value; if(!evTo.value||evTo.value<evFrom.value) evTo.value=evFrom.value; });
evName.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();saveEvent()} });
$('evSave').addEventListener('click',saveEvent);
$('evCancel').addEventListener('click',()=>evDlg.close());
$('evClose').addEventListener('click',()=>evDlg.close());
$('evDel').addEventListener('click',()=>{ S.state.events=S.state.events.filter(e=>e.id!==evId); evDlg.close(); commit(); });
evDlg.addEventListener('click',e=>{ if(e.target===evDlg) evDlg.close(); });

function clearDropMarks(){ document.querySelectorAll('.drop-before,.drop-after').forEach(el=>el.classList.remove('drop-before','drop-after')); }
document.addEventListener('dragend',()=>document.querySelectorAll('.zone.over').forEach(z=>z.classList.remove('over')));
document.addEventListener('dragend',clearDropMarks);
function renderCell(t,slot,isToday,last){
  const isWk=!!slot.week;
  const where=isWk?'any day this week':fmtLong.format(slot.d);
  const cell=h('div',{class:'cell'+(isToday?' today':'')+(isWk?' wkcol':'')+(last?' last':''),style:`--c:${t.color}`,
    role:'group','aria-label':`${t.name}, ${where}`});
  const secs=(!isWk&&t.sections&&t.sections.length)?t.sections:null;
  if(secs){
    secs.forEach(sec=>cell.append(/water/i.test(sec.name)?renderWater(t,slot,sec,where):renderZone(t,slot,sec,secs,where)));
  } else {
    cell.classList.add('zone');
    renderZone(t,slot,null,null,where,cell);
  }
  if(isWk){
    const prevWk=key(addDays(S.week,-7));
    const left=S.state.tasks.filter(x=>x.themeId===t.id&&!x.date&&x.week===prevWk&&!x.done&&!x.missed);
    if(left.length) cell.append(h('button',{class:'carry',title:'Move unfinished Any day tasks from last week into this week',
      onclick:()=>{ left.forEach(x=>{x.week=slot.week; delete x.pos}); commit(); }},
      `Bring over ${left.length} unfinished from last week`));
  }
  return cell;
}
const DROP_L=0.5;
const fmtL=v=>`${(Math.round(v*10)/10).toLocaleString(undefined,{maximumFractionDigits:1})} L`;
function renderWater(t,slot,sec,where){
  const k=t.id+'|'+slot.date, n=S.state.water[k]||0, goalL=S.state.settings.waterGoalL||2, goal=Math.max(1,Math.round(goalL/DROP_L));
  const setN=v=>{ v=Math.max(0,v); if(v) S.state.water[k]=v; else delete S.state.water[k]; commit(); };
  const box=h('div',{class:'sect water'+(n>=goal?' met':''),role:'group','aria-label':`${sec.name}, ${where}: ${fmtL(n*DROP_L)} of ${fmtL(goalL)}`});
  box.append(h('div',{class:'secthd'},sec.name,h('span',{class:'wcount',text:`${fmtL(n*DROP_L).replace(' L','')} / ${fmtL(goalL)}`})));
  const row=h('div',{class:'drops'});
  for(let i=1;i<=Math.max(goal,n);i++){
    row.append(h('button',{class:'drop'+(i<=n?' on':''),'data-k':`wd:${k}:${i}`,'aria-label':i===n?`${fmtL(i*DROP_L)}. Click to remove 500 ml`:`Set to ${fmtL(i*DROP_L)}`,
      title:i===n?`${fmtL(i*DROP_L)} (click to remove 500 ml)`:fmtL(i*DROP_L),onclick:()=>setN(i===n?i-1:i)}));
  }
  row.append(h('button',{class:'dropplus','aria-label':'Add 500 ml',title:'Add 500 ml','data-k':`wp:${k}`,onclick:()=>setN(n+1)},'+'));
  box.append(row);
  return box;
}
function renderZone(t,slot,sec,secs,where,into){
  const isWk=!!slot.week;
  const secOf=o=>{ if(!secs) return null; const f=secs.find(x=>x.id===o.section); return (f||secs[0]).id; };
  const inSlot=o=>(isWk?(!o.date&&o.week===slot.week):o.date===slot.date)&&(!sec||secOf(o)===sec.id);
  const zone=into||h('div',{class:'sect zone',role:'group','aria-label':`${sec.name}, ${where}`});
  const items=[];
  S.state.tasks.forEach(x=>{ if(x.themeId===t.id&&inSlot(x)) items.push({kind:'task',obj:x}); });
  S.state.goals.forEach(g=>{ if(themeOf(g.themeId).id!==t.id) return;
    g.subs.forEach(sub=>sub.steps.forEach(s=>{ if(inSlot(s)) items.push({kind:'step',obj:s,goal:g,sub}); })); });
  items.forEach((it,i)=>it.i=i);
  items.sort((a,b)=>((a.obj.pos??1e9)-(b.obj.pos??1e9))||a.i-b.i);
  const place=(list)=>list.forEach((it,i)=>{it.obj.pos=i});
  const nd=isWk?{kind:'new',themeId:t.id,date:null,week:slot.week,draft:''}:{kind:'new',themeId:t.id,date:slot.date,draft:''};
  if(sec) nd.section=sec.id;
  const ed=S.editing;
  const editingHere=ed&&ed.kind==='new'&&ed.themeId===t.id&&(isWk?ed.week===slot.week:(!ed.week&&ed.date===slot.date))&&((ed.section||null)===(sec?sec.id:null));
  if(sec){
    zone.append(h('div',{class:'secthd'},sec.name,
      editingHere?null:h('button',{class:'addsec','aria-label':`Add to ${sec.name}, ${where}`,title:`Add to ${sec.name}`,
        onmousedown:e=>{ if(S.editing){e.preventDefault();startEdit(nd)} },onclick:()=>startEdit(nd)},'+')));
  }
  const ul=h('ul',{class:'tasks'},items.map((it,idx)=>{
    const li=renderItem(it,dir=>{
      const j=idx+dir; if(j<0||j>=items.length) return;
      const list=items.slice(); [list[idx],list[j]]=[list[j],list[idx]]; place(list); commit();
    });
    li.dataset.idx=String(idx); return li;
  }));
  if(editingHere) ul.append(h('li',{class:'task',style:'grid-template-columns:1fr'},editorInput(ed)));
  zone.append(ul);
  if(!editingHere&&!sec){
    zone.append(h('button',{class:'addbtn','aria-label':`Add task to ${t.name}, ${where}`,
      onmousedown:e=>{ if(S.editing){e.preventDefault();startEdit(nd)} },onclick:()=>startEdit(nd)},'+ Add'));
  }
  const dropAt=e=>{
    const lis=[...ul.querySelectorAll(':scope > li.task[data-idx]')];
    for(const li of lis){ const r=li.getBoundingClientRect(); if(e.clientY<r.top+r.height/2) return {idx:+li.dataset.idx,li,before:true}; }
    return {idx:items.length,li:lis[lis.length-1]||null,before:false};
  };
  zone.addEventListener('dragover',e=>{
    if(e.dataTransfer.types.includes('application/x-theme')) return;
    e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect='move';
    document.querySelectorAll('.zone.over').forEach(z=>{ if(z!==zone) z.classList.remove('over'); });
    zone.classList.add('over');
    clearDropMarks(); const d=dropAt(e); if(d.li) d.li.classList.add(d.before?'drop-before':'drop-after');
  });
  zone.addEventListener('dragleave',e=>{ if(!zone.contains(e.relatedTarget)){ zone.classList.remove('over'); clearDropMarks(); } });
  zone.addEventListener('drop',e=>{
    e.preventDefault(); e.stopPropagation(); zone.classList.remove('over'); clearDropMarks();
    let p; try{p=JSON.parse(e.dataTransfer.getData('text/plain'))}catch(err){return}
    if(!p) return;
    let obj=null;
    if(p.kind==='task'){
      obj=S.state.tasks.find(x=>x.id===p.id); if(!obj) return;
      obj.themeId=t.id;
    } else if(p.kind==='step'){
      const g=goalById(p.goalId); const f=findStep(g,p.id); obj=f&&f.step; if(!obj) return;
    } else return;
    if(isWk){ obj.date=null; obj.week=slot.week; } else { obj.date=slot.date; delete obj.week; }
    if(sec) obj.section=sec.id; else if(!isWk) delete obj.section;
    const d=dropAt(e);
    const before=items.slice(0,d.idx).filter(it=>it.obj!==obj).length;
    const list=items.filter(it=>it.obj!==obj).map(it=>it.obj);
    list.splice(before,0,obj);
    list.forEach((o,i)=>{o.pos=i});
    commit();
  });
  return zone;
}
function statusMark(o,k){
  const st=o.done?'done':(o.missed?'missed':'open');
  return h('button',{class:'cbx '+st,'data-k':k,
    'aria-label':st==='done'?'Done. Click to mark not done':st==='missed'?'Not done. Click to clear':'Not started. Click to mark done',
    title:st==='done'?'Done (click: not done)':st==='missed'?'Not done (click: clear)':'Click: done',
    onclick:()=>{ if(st==='open'){o.done=true;o.missed=false} else if(st==='done'){o.done=false;o.missed=true} else {o.done=false;o.missed=false} commit(); }},
    st==='done'?'✓':st==='missed'?'−':'–');
}
const CURR=['EUR','USD','GBP','CHF','TND'];
function money(n){ try{ return new Intl.NumberFormat(undefined,{style:'currency',currency:S.state.settings.currency||'EUR'}).format(n); }catch(e){ return (Math.round(n*100)/100).toFixed(2); } }
function parseMoney(str){
  let t=String(str||'').replace(/[^\d.,-]/g,'');
  if(!t) return null;
  if(t.includes(',')&&t.includes('.')) t=t.lastIndexOf(',')>t.lastIndexOf('.')?t.replace(/\./g,'').replace(',','.'):t.replace(/,/g,'');
  else if(t.includes(',')) t=t.replace(',','.');
  const n=parseFloat(t); return isFinite(n)?Math.round(n*100)/100:null;
}
function parseMoneySum(str){
  const t=String(str||'').replace(/\s+/g,'');
  if(!t) return null;
  const parts=t.match(/[+-]?[^+-]+/g); if(!parts) return null;
  let sum=0, any=false;
  for(const p of parts){ const sign=p[0]==='-'?-1:1; const v=parseMoney(p.replace(/^[+-]/,'')); if(v===null) return null; sum+=sign*v; any=true; }
  return any?Math.round(sum*100)/100:null;
}
const tagOf=o=>o&&o.tag?S.state.tags.find(x=>x.id===o.tag)||null:null;
function logLi(o,l,ownerKind,goalId){
  const le=S.editing&&S.editing.kind==='log'&&S.editing.id===l.id;
  const spec={kind:'log',id:l.id,ownerKind,ownerId:o.id,goalId,draft:l.text};
  return h('li',{},
    h('button',{class:'lchk'+(l.done?' on':''),'aria-pressed':String(!!l.done),'data-k':'lc:'+l.id,
      'aria-label':l.done?`${l.text}: done. Click to unmark`:`${l.text}: mark done`,title:l.done?'Done (click to unmark)':'Click to mark done',
      onclick:()=>{l.done=!l.done;commit()}},l.done?'✓':'–'),
    le?editorInput(S.editing):h('span',Object.assign({class:'txt',tabindex:'0',role:'button','aria-label':`Edit: ${l.text}`},editHandlers(spec)),l.text),
    h('button',{class:'x','aria-label':'Delete sub-task',title:'Delete sub-task',onclick:()=>{o.log=(o.log||[]).filter(x=>x!==l);commit()}},'×'));
}
function selectTask(id){ S.sel=id; S.selAt=Date.now(); }
function renderItem(it,move){
  const o=it.obj;
  const ed=S.editing;
  const isEd=ed&&ed.kind===it.kind&&ed.id===o.id;
  const sel=S.sel===o.id;
  const tg=tagOf(o);
  const li=h('li',{class:'task'+(o.done?' done':'')+(o.missed&&!o.done?' missed':'')+(o.prio?' prio':'')+(tg?' tagged':''),style:tg?`--tg:${tg.color}`:null,'data-tid':o.id,draggable:(isEd||sel)?'false':'true'});
  const extra=[];
  li.addEventListener('dragstart',e=>{
    e.dataTransfer.setData('text/plain',JSON.stringify({kind:it.kind,id:o.id,goalId:it.goal?it.goal.id:null}));
    e.dataTransfer.effectAllowed='move'; li.classList.add('dragging');
  });
  li.addEventListener('dragend',()=>li.classList.remove('dragging'));
  li.append(statusMark(o,'cb:'+o.id));
  if(isEd){ li.append(editorInput(ed)); }
  else{
    const edSpec={kind:it.kind,id:o.id,goalId:it.goal?it.goal.id:null,draft:o.text};
    const sp=h('span',{class:'txt',tabindex:'0',role:'button','data-k':'txt:'+o.id,
      'aria-label':`${o.text}${tg?`, ${tg.name}`:''}. Click to edit and see steps. Alt plus up or down arrow to reorder`,title:tg?tg.name:null},o.text);
    sp.addEventListener('mousedown',e=>{ if(S.editing){ e.preventDefault(); selectTask(o.id); startEdit(edSpec); } });
    sp.addEventListener('click',()=>{ selectTask(o.id); startEdit(edSpec); });
    sp.addEventListener('keydown',e=>{
      if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){ e.preventDefault(); move&&move(e.key==='ArrowUp'?-1:1); return; }
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); selectTask(o.id); startEdit(edSpec); }
    });
    li.append(h('div',{class:'tbody'},sp,it.goal?h('span',{class:'gtag',text:(it.goal.title||'Untitled project')+(it.sub&&it.sub.title?` › ${it.sub.title}`:'')}):null));
  }
  if(sel){
    const log=o.log||[];
    extra.push(h('ul',{class:'tfull log','aria-label':'Sub-tasks'},log.map(l=>logLi(o,l,it.kind,it.goal?it.goal.id:null))));
    const add=h('input',{class:'tfull logadd',type:'text',placeholder:'Add a sub-task','aria-label':'Add a sub-task','data-k':'la:'+o.id,
      value:S.logDraft&&S.logDraft.id===o.id?S.logDraft.text:'','data-autofocus':S.focus==='log:'+o.id?'1':null});
    add.addEventListener('input',()=>{ S.logDraft={id:o.id,text:add.value}; });
    const addLog=keep=>{ const v=add.value.trim(); if(!v) return; add.value=''; S.logDraft=null;
      (o.log=o.log||[]).push({id:uid(),text:v}); if(keep) S.focus='log:'+o.id; commit(); };
    add.addEventListener('keydown',e=>{
      if(e.key==='Enter'){e.preventDefault();addLog(true)}
      else if(e.key==='Escape'){e.preventDefault();S.sel=null;render()}
    });
    add.addEventListener('change',()=>addLog(false));
    extra.push(add);
    const amtIn=h('input',{type:'text',inputmode:'decimal',placeholder:'e.g. 12,50 + 4 + 3,20','aria-label':'Money spent on this task. Separate amounts with plus signs to add them up','data-k':'amt:'+o.id,
      value:o.amountExpr||(typeof o.amount==='number'?String(o.amount):'')});
    const tot=h('span',{class:'amttot','aria-live':'polite'});
    const preview=()=>{ const v=amtIn.value.trim(); const n=parseMoneySum(v);
      tot.textContent=!v?'':n===null?'Can’t read that':(/[+-]/.test(v.replace(/^[+-]/,''))?`= ${money(n)}`:''); tot.classList.toggle('bad',!!v&&n===null); };
    preview();
    const setAmt=()=>{ const v=amtIn.value.trim(); const n=parseMoneySum(v);
      if(!v||n===0){ delete o.amount; delete o.amountExpr; }
      else if(n===null){ return; }
      else { o.amount=n; if(/[+-]/.test(v.replace(/^[+-]/,''))) o.amountExpr=v; else delete o.amountExpr; }
      commit(); };
    amtIn.addEventListener('input',preview);
    amtIn.addEventListener('change',setAmt);
    amtIn.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); amtIn.blur(); } });
    extra.push(h('label',{class:'tfull spentrow'},'Spent',amtIn,tot,typeof o.amount==='number'?h('button',{class:'link',onclick:e=>{e.preventDefault();delete o.amount;delete o.amountExpr;commit()}},'Clear'):null));
    extra.push(h('div',{class:'tfull tagrow'},'Sub-theme:',
      S.state.tags.map(x=>h('button',{class:'tagchip',style:`--tg:${x.color}`,'aria-pressed':String(o.tag===x.id),'data-k':`tc:${o.id}:${x.id}`,
        onclick:()=>{ if(o.tag===x.id) delete o.tag; else o.tag=x.id; commit(); }},h('i'),x.name)),
      h('button',{class:'link',onclick:()=>{ openThemes(); const el=$('tagSec'); if(el) el.scrollIntoView({block:'start'}); }},S.state.tags.length?'Edit':'Add one')));
  }
  li.append(h('button',{class:'flag','aria-pressed':String(!!o.prio),'aria-label':'High priority','data-k':'pr:'+o.id,
    title:o.prio?'Remove high priority':'Mark as high priority',onclick:()=>{o.prio=!o.prio;commit()}},'!'));
  if(it.kind==='task'){
    li.append(h('button',{class:'x','aria-label':'Delete task',title:'Delete task',onclick:()=>{S.state.tasks=S.state.tasks.filter(x=>x!==o);commit()}},'×'));
  } else {
    li.append(h('button',{class:'x','aria-label':'Take this step off the day',title:'Unschedule (the task stays in its project)',onclick:()=>{o.date=null;commit()}},'×'));
  }
  li.append(...extra);
  return li;
}

/* ---------- goals view ---------- */
function newGoal(){
  const themeId=S.filter!=='all'?S.filter:S.state.themes[0].id;
  const g={id:uid(),title:'',themeId,due:'',done:false,open:true,subs:[]};
  S.state.goals.unshift(g); S.focus='g:'+g.id; commit();
}
function goalDelete(g){
  return S.confirm==='g:'+g.id
    ? h('button',{class:'link danger','data-k':'gd:'+g.id,onclick:()=>{S.state.goals=S.state.goals.filter(x=>x!==g);S.confirm=null;commit()}},'Confirm delete')
    : h('button',{class:'link','data-k':'gd:'+g.id,onclick:()=>{S.confirm='g:'+g.id;render()}},'Delete');
}
function renderGoals(){
  if(S.filter!=='all'&&!S.state.themes.some(t=>t.id===S.filter)) S.filter='all';
  const wrap=h('div');
  const chip=(id,label,color)=>h('button',{class:'chip','aria-pressed':String(S.filter===id),style:color?`--c:${color}`:null,'data-k':'chip:'+id,onclick:()=>{S.filter=id;render()}},color?h('i'):null,label);
  wrap.append(h('div',{class:'gbar'},
    h('button',{class:'pill primary',onclick:newGoal},'New project'),
    h('div',{class:'chips',role:'group','aria-label':'Filter by theme'},chip('all','All',null),S.state.themes.map(t=>chip(t.id,t.name,t.color)))));
  const vis=S.state.goals.filter(g=>S.filter==='all'||themeOf(g.themeId).id===S.filter);
  const active=vis.filter(g=>!g.done), done=vis.filter(g=>g.done);
  if(!S.state.goals.length){
    wrap.append(h('p',{class:'empty',text:'No projects yet. Add one, split it into sub-goals, list the tasks for each, then give a task a date to put it on your week.'}));
    return wrap;
  }
  const open=active.filter(g=>g.open);
  const scrollTo=id=>setTimeout(()=>{ const el=document.getElementById('proj-'+id); if(el){ const rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches; el.scrollIntoView({behavior:rm?'auto':'smooth',block:'start'}); } },0);
  const items=active.map((g,i)=>{
    const t=themeOf(g.themeId), st=allSteps(g), n=st.length, dn=st.filter(x=>x.done).length;
    const li=h('li',{});
    const btn=h('button',{class:'pitem'+(g.open?' on':''),style:`--c:${t.color}`,draggable:'true','data-k':'pi:'+g.id,'aria-expanded':String(!!g.open),
      title:g.open?'Click to collapse into the margin. Drag to reorder.':'Click to open. Drag to reorder.',
      onclick:()=>{ g.open=!g.open; commit(); if(g.open) scrollTo(g.id); }},
      h('i'),h('span',{class:'pt',text:g.title||'Untitled project'}),h('span',{class:'pn',text:n?`${dn}/${n}`:''}),
      g.subs.some(x=>x.active)?h('span',{class:'pact',title:'Has an active sub-goal','aria-label':'has an active sub-goal'}):null);
    btn.addEventListener('dragstart',e=>{ e.dataTransfer.setData('application/x-goal',g.id); e.dataTransfer.effectAllowed='move'; });
    const aft=e=>{ const r=li.getBoundingClientRect(); return e.clientY>r.top+r.height/2; };
    li.addEventListener('dragover',e=>{ if(!e.dataTransfer.types.includes('application/x-goal')) return; e.preventDefault(); const x=aft(e); li.classList.toggle('gdrop-after',x); li.classList.toggle('gdrop-before',!x); });
    li.addEventListener('dragleave',e=>{ if(!li.contains(e.relatedTarget)) li.classList.remove('gdrop-before','gdrop-after'); });
    li.addEventListener('drop',e=>{ const id=e.dataTransfer.getData('application/x-goal'); if(!id) return; e.preventDefault(); li.classList.remove('gdrop-before','gdrop-after'); const src=goalById(id); if(src) moveGoal(src,g,aft(e)); });
    li.append(btn); return li;
  });
  const allOpen=active.length&&active.every(g=>g.open);
  const toc=h('aside',{class:'toc ptoc','aria-label':'Projects'},
    h('div',{class:'tochd'},h('b',{text:'Projects'}),h('span',{class:'gcount',text:`${open.length} of ${active.length} open`})),
    active.length?h('ul',{},items):h('p',{class:'libempty',text:'No open projects in this view.'}),
    active.length?h('div',{class:'pacts'},
      h('button',{class:'link',disabled:allOpen,onclick:()=>{ active.forEach(g=>g.open=true); commit(); }},'Open all'),
      h('button',{class:'link',disabled:!open.length,onclick:()=>{ active.forEach(g=>g.open=false); commit(); }},'Collapse all')):null,
    done.length?h('p',{class:'pdone',text:`${done.length} completed — listed below the open projects.`}):null);
  const content=h('div',{});
  if(!open.length){
    content.append(h('div',{class:'pempty'},active.length
      ?'All projects are collapsed into the margin. Click one on the left to open it here.'
      :'No open projects here.'));
  } else content.append(h('div',{class:'goals'},open.map((g,i)=>goalCard(g,i,open))));
  if(done.length){
    content.append(h('h2',{class:'sub',text:`Completed (${done.length})`}),
      h('ul',{class:'donelist'},done.map(g=>h('li',{class:'donegoal',style:`--c:${themeOf(g.themeId).color}`},
        h('i'),h('span',{text:g.title||'Untitled project'}),
        h('button',{class:'link',onclick:()=>{g.done=false;commit()}},'Reopen'),goalDelete(g)))));
  }
  wrap.append(h('div',{class:'projwrap'},toc,content));
  return wrap;
}
function moveGoal(g,target,after){
  const a=S.state.goals; if(g===target) return;
  a.splice(a.indexOf(g),1); a.splice(a.indexOf(target)+(after?1:0),0,g); commit();
}
function goalCard(g,gi,vis){
  const t=themeOf(g.themeId);
  const steps=allSteps(g), n=steps.length, dn=steps.filter(s=>s.done).length;
  const card=h('section',{class:'goal',id:'proj-'+g.id,style:`--c:${t.color}`,'aria-label':g.title||'Untitled project'});
  const title=h('input',{class:'gtitle',type:'text',value:g.title||'',placeholder:'Name this project','aria-label':'Project name',
    'data-autofocus':S.focus==='g:'+g.id?'1':null});
  title.addEventListener('input',()=>{g.title=title.value;save()});
  title.addEventListener('keydown',e=>{if(e.key==='Enter')title.blur()});
  const sel=h('select',{'aria-label':'Theme','data-k':'gs:'+g.id,onchange:e=>{g.themeId=e.target.value;commit()}},
    S.state.themes.map(x=>h('option',{value:x.id},x.name)));
  sel.value=t.id;
  const due=h('input',{type:'date',value:g.due||'','aria-label':'Target date',onchange:e=>{g.due=e.target.value;save()}});
  const handle=h('span',{class:'ghandle',draggable:'true',title:'Drag to reorder projects','aria-hidden':'true'},'⠿');
  handle.addEventListener('dragstart',e=>{
    e.dataTransfer.setData('application/x-goal',g.id); e.dataTransfer.effectAllowed='move';
    try{ e.dataTransfer.setDragImage(card,20,20); }catch(err){}
    card.classList.add('dragging');
  });
  handle.addEventListener('dragend',()=>{ card.classList.remove('dragging'); document.querySelectorAll('.gdrop-before,.gdrop-after').forEach(x=>x.classList.remove('gdrop-before','gdrop-after')); });
  const after=e=>{ const r=card.getBoundingClientRect(); return e.clientY>r.top+r.height/2; };
  card.addEventListener('dragover',e=>{
    if(!e.dataTransfer.types.includes('application/x-goal')) return;
    e.preventDefault(); const aft=after(e);
    card.classList.toggle('gdrop-after',aft); card.classList.toggle('gdrop-before',!aft);
  });
  card.addEventListener('dragleave',e=>{ if(!card.contains(e.relatedTarget)) card.classList.remove('gdrop-before','gdrop-after'); });
  card.addEventListener('drop',e=>{
    const id=e.dataTransfer.getData('application/x-goal'); if(!id) return;
    e.preventDefault(); card.classList.remove('gdrop-before','gdrop-after');
    const src=goalById(id); if(src) moveGoal(src,g,after(e));
  });
  card.append(h('div',{class:'ghead'},handle,title),h('div',{class:'gmeta'},
    h('label',{},'Theme ',sel),h('label',{},'Target ',due),
    h('button',{class:'gmove','aria-label':'Move project up',title:'Move up','data-k':'gu:'+g.id,disabled:!vis||gi===0,onclick:()=>moveGoal(g,vis[gi-1],false)},'↑'),
    h('button',{class:'gmove','aria-label':'Move project down',title:'Move down','data-k':'gdn:'+g.id,disabled:!vis||gi===vis.length-1,onclick:()=>moveGoal(g,vis[gi+1],true)},'↓'),
    h('span',{class:'spacer'}),
    h('button',{class:'link',onclick:()=>{g.done=true;g.open=false;commit()}},'Mark done'),goalDelete(g),
    h('button',{class:'pcollapse','data-k':'pc:'+g.id,title:'Collapse into the margin',onclick:()=>{g.open=false;commit()}},'⇤ Collapse')));
  card.append(h('div',{class:'progress'},
    n?h('div',{class:'bar',role:'progressbar','aria-valuemin':'0','aria-valuemax':String(n),'aria-valuenow':String(dn),'aria-label':'Tasks done'},h('i',{style:`width:${Math.round(dn/n*100)}%`})):null,
    h('span',{text:n?`${dn} of ${n} tasks across ${g.subs.length} sub-goal${g.subs.length===1?'':'s'}`:(g.subs.length?'No tasks yet':'Break this project into sub-goals')})));
  const row=h('div',{class:'subs'});
  g.subs.forEach((sub,si)=>row.append(subCard(g,sub,si)));
  row.append(masonry(h('button',{class:'addsub',onclick:()=>{ const sub={id:uid(),title:'',steps:[]}; g.subs.push(sub); S.focus='sub:'+sub.id; commit(); }},'+ Add sub-goal')));
  card.append(row);
  return card;
}
function subTasks(g,s){
  const log=s.log||[];
  const frag=[];
  if(log.length) frag.push(h('ul',{class:'log sublog','aria-label':`Sub-tasks of ${s.text}`},log.map(l=>logLi(s,l,'step',g.id))));
  if(S.subAdd===s.id){
    const inp=h('input',{class:'subin',type:'text',placeholder:'Add a sub-task, press Enter','aria-label':`Add a sub-task to ${s.text}`,
      'data-k':'sa:'+s.id,'data-autofocus':'1'});
    const addIt=()=>{ const v=inp.value.trim(); if(!v) return false; inp.value=''; (s.log=s.log||[]).push({id:uid(),text:v}); return true; };
    inp.addEventListener('keydown',e=>{
      if(e.key==='Enter'){ e.preventDefault(); if(addIt()) commit(); }
      else if(e.key==='Escape'){ e.preventDefault(); S.subAdd=null; render(); }
    });
    inp.addEventListener('blur',()=>setTimeout(()=>{
      if(S.subAdd!==s.id) return;
      const cur=document.querySelector(`[data-k="sa:${s.id}"]`); if(cur&&document.activeElement===cur) return;
      addIt(); S.subAdd=null; commit();
    },150));
    frag.push(inp);
  }
  return frag;
}
const subRO=(typeof ResizeObserver!=='undefined')?new ResizeObserver(es=>{
  for(const e of es){ const el=e.target; const hgt=el.getBoundingClientRect().height; if(!hgt) continue;
    const sp='span '+Math.max(1,Math.ceil((hgt+12)/4)); if(el.style.gridRowEnd!==sp) el.style.gridRowEnd=sp; }
}):null;
function masonry(el){ if(subRO) subRO.observe(el); return el; }
function subCard(g,sub,si){
  const n=sub.steps.length, dn=sub.steps.filter(s=>s.done).length;
  const box=h('div',{class:'sub'+(sub.active?' active':''),role:'group','aria-label':(sub.title||'Untitled sub-goal')+(sub.active?', active':'')});
  const ti=h('input',{class:'subtitle',type:'text',value:sub.title||'',placeholder:'Name this sub-goal','aria-label':'Sub-goal name',
    'data-k':'subt:'+sub.id,'data-autofocus':S.focus==='sub:'+sub.id?'1':null});
  ti.addEventListener('input',()=>{sub.title=ti.value;save()});
  ti.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); S.focus='s:'+sub.id; commit(); } });
  const mv=d=>{ const j=si+d; if(j<0||j>=g.subs.length) return; [g.subs[si],g.subs[j]]=[g.subs[j],g.subs[si]]; commit(); };
  box.append(h('div',{class:'subhd'},
    h('button',{class:'submove','aria-label':'Move sub-goal left',title:'Move left',disabled:si===0,'data-k':'sml:'+sub.id,onclick:()=>mv(-1)},'‹'),
    ti,
    sub.active?h('span',{class:'actbadge',text:'Active'}):null,
    h('button',{class:'substar','aria-pressed':String(!!sub.active),'data-k':'sa*:'+sub.id,'aria-label':sub.active?'Unmark as active':'Mark as active',title:sub.active?'Active (click to unmark)':'Mark as active',onclick:()=>{sub.active=!sub.active;commit()}},sub.active?'★':'☆'),
    h('button',{class:'submove','aria-label':'Move sub-goal right',title:'Move right',disabled:si===g.subs.length-1,'data-k':'smr:'+sub.id,onclick:()=>mv(1)},'›')));
  box.append(h('div',{class:'subprog'},
    n?h('div',{class:'bar'},h('i',{style:`width:${Math.round(dn/n*100)}%`})):null,
    h('span',{text:n?`${dn}/${n}`:'No tasks yet'})));
  const ul=h('ul',{class:'steps','data-sid':sub.id});
  sub.steps.forEach(s=>{
    const ed=S.editing, isEd=ed&&ed.kind==='step'&&ed.id===s.id;
    const edSpec={kind:'step',id:s.id,goalId:g.id,draft:s.text};
    ul.append(h('li',{class:'step'+(s.done?' done':'')+(s.missed&&!s.done?' missed':'')},
      statusMark(s,'sc:'+s.id),
      isEd?editorInput(ed):h('span',{},h('span',Object.assign({class:'txt',tabindex:'0',role:'button','aria-label':`Edit: ${s.text}`},editHandlers(edSpec)),s.text),
        (s.log&&s.log.length)?h('span',{class:'scount',text:`${s.log.filter(l=>l.done).length}/${s.log.length}`}):null),
      h('button',{class:'stool','aria-label':`Add a sub-task to ${s.text}`,title:'Add a sub-task',onclick:()=>{S.subAdd=s.id;render()}},'+'),
      (s.date||S.dateEdit===s.id)?h('span'):h('button',{class:'stool','aria-label':'Schedule on a day',title:'Put this task on your week',style:'filter:grayscale(1)',onclick:()=>{S.dateEdit=s.id;render()}},'📅'),
      h('button',{class:'x','aria-label':'Delete task',title:'Delete task',onclick:()=>{sub.steps.splice(sub.steps.indexOf(s),1);commit()}},'×'),
      (s.date||S.dateEdit===s.id)?h('input',{type:'date',class:'sdate'+(s.date?'':' unset'),value:s.date||'','data-k':'sd:'+s.id,
        'data-autofocus':(!s.date&&S.dateEdit===s.id)?'1':null,
        title:'Pick a day to put this task on your week','aria-label':'Schedule on',
        onblur:e=>{ if(S.dateEdit===s.id&&!e.target.value) setTimeout(()=>{ if(S.dateEdit===s.id&&!s.date){ S.dateEdit=null; render(); } },200); },
        onchange:e=>{s.date=e.target.value||null;if(s.date)delete s.week;S.dateEdit=null;commit()}}):null,
      subTasks(g,s)));
  });
  box.append(ul);
  const add=h('input',{class:'addstep',type:'text',placeholder:'Add a task, press Enter','aria-label':`Add a task to ${sub.title||'this sub-goal'}`,
    'data-autofocus':S.focus==='s:'+sub.id?'1':null});
  add.addEventListener('keydown',e=>{
    if(e.key!=='Enter') return;
    const v=add.value.trim(); if(!v) return;
    sub.steps.push({id:uid(),text:v,done:false,date:null}); S.focus='s:'+sub.id; commit();
  });
  box.append(add);
  box.append(h('div',{class:'subfoot'},S.confirm==='sub:'+sub.id
    ? h('button',{class:'link danger','data-k':'subd:'+sub.id,onclick:()=>{g.subs=g.subs.filter(x=>x!==sub);S.confirm=null;commit()}},n?`Delete with ${n} task${n>1?'s':''}`:'Confirm delete')
    : h('button',{class:'link','data-k':'subd:'+sub.id,onclick:()=>{S.confirm='sub:'+sub.id;render()}},'Delete sub-goal')));
  return masonry(box);
}

/* ---------- themes dialog ---------- */
function openThemes(focusId){ S.themeFocus=focusId||null; S.confirm=null; renderThemes(); if(!themeDlg.open) themeDlg.showModal(); focusTheme(); }
function focusTheme(){
  if(!S.themeFocus) return;
  const el=themeList.querySelector(`[data-k="tn:${S.themeFocus}"]`);
  if(el){el.focus();el.select()}
  S.themeFocus=null;
}
function moveTheme(i,dir){
  const a=S.state.themes, j=i+dir; if(j<0||j>=a.length) return;
  [a[i],a[j]]=[a[j],a[i]]; commit();
}
function deleteTheme(t){
  S.state.themes=S.state.themes.filter(x=>x!==t);
  S.state.tasks=S.state.tasks.filter(x=>x.themeId!==t.id);
  S.state.goals.forEach(g=>{if(g.themeId===t.id) g.themeId=S.state.themes[0].id});
  if(S.filter===t.id) S.filter='all';
  S.confirm=null; commit();
}
function customPick(t){
  const isCustom=!SW.some(c=>c.toLowerCase()===t.color.toLowerCase());
  const inp=h('input',{type:'color',class:'swpick'+(isCustom?' on':''),value:t.color,title:'Pick any colour',
    'aria-label':`Custom colour for ${t.name}`,'data-k':'swc:'+t.id});
  inp.addEventListener('input',()=>{ t.color=inp.value; save(); renderMain(); });
  inp.addEventListener('change',()=>{ t.color=inp.value; commit(); });
  return inp;
}
function colourPick(current,palette,label,k,apply){
  const isCustom=!palette.some(c=>c.toLowerCase()===current.toLowerCase());
  const inp=h('input',{type:'color',class:'swpick'+(isCustom?' on':''),value:current,title:'Pick any colour','aria-label':label,'data-k':k});
  inp.addEventListener('input',()=>{ apply(inp.value); save(); renderMain(); applyHi(); });
  inp.addEventListener('change',()=>{ apply(inp.value); commit(); });
  return inp;
}
function applyHi(){ document.documentElement.style.setProperty('--hibase',S.state.settings.today||HI_DEFAULT); }
function renderColours(){
  const cur=S.state.settings.today;
  $('hiRow').replaceChildren(
    ...HI.map((c,ci)=>h('button',{class:'sw',style:`--sw:${c}`,'aria-label':`Highlight colour ${ci+1}`,'aria-pressed':String(cur.toLowerCase()===c.toLowerCase()),
      'data-k':'hi:'+ci,onclick:()=>{S.state.settings.today=c;commit()}})),
    colourPick(cur,HI,'Custom highlight colour','hic',v=>{S.state.settings.today=v}),
    h('span',{class:'hiprev',text:'Today'}));
  const types=S.state.evtypes;
  $('evTypeList').replaceChildren(...types.map(t=>{
    const name=h('input',{class:'name',type:'text',value:t.name,'aria-label':'Event type name','data-k':'etn:'+t.id});
    name.addEventListener('input',()=>{ if(name.value.trim()){ t.name=name.value.trim(); save(); renderMain(); } });
    name.addEventListener('blur',()=>{ if(!name.value.trim()) name.value=t.name; });
    const used=S.state.events.filter(e=>evType(e.type)===t).length;
    const del=S.confirm==='et:'+t.id
      ? h('button',{class:'link danger','data-k':'etd:'+t.id,onclick:()=>{
          S.state.evtypes=types.filter(x=>x!==t);
          const fallback=S.state.evtypes[S.state.evtypes.length-1].id;
          S.state.events.forEach(e=>{ if(e.type===t.id) e.type=fallback; });
          S.confirm=null; commit(); }},used?`Delete (${used} event${used>1?'s':''} move to ${types.filter(x=>x!==t).slice(-1)[0].name})`:'Confirm delete')
      : h('button',{class:'link','data-k':'etd:'+t.id,disabled:types.length<2,title:types.length<2?'Keep at least one type':null,
          onclick:()=>{S.confirm='et:'+t.id;renderThemes()}},'Delete');
    return h('div',{class:'trow',style:`--c:${t.color}`},name,h('span'),
      h('div',{class:'swatches',role:'group','aria-label':`Colour for ${t.name}`},
        SW.map((c,ci)=>h('button',{class:'sw',style:`--sw:${c}`,'aria-label':`Colour ${ci+1}`,'aria-pressed':String(t.color.toLowerCase()===c.toLowerCase()),
          'data-k':`esw:${t.id}:${ci}`,onclick:()=>{t.color=c;commit()}})),
        colourPick(t.color,SW,`Custom colour for ${t.name}`,'eswc:'+t.id,v=>{t.color=v}),
        del));
  }));
}
function secInput(t){
  const inp=h('input',{class:'secin',type:'text','data-k':'sec:'+t.id,value:(t.sections||[]).map(x=>x.name).join(', '),
    placeholder:'Split days into sections, e.g. Breakfast, Lunch, Dinner, Snacks',
    'aria-label':`Day sections for ${t.name}, separated by commas. Leave empty for none`,title:'Sections, separated by commas. Leave empty for no sections.'});
  inp.addEventListener('change',()=>{
    const names=inp.value.split(',').map(x=>x.trim()).filter(Boolean);
    const old=t.sections||[];
    t.sections=names.map(n=>old.find(o=>o.name.toLowerCase()===n.toLowerCase())||{id:uid(),name:n}).map((o,i)=>({id:o.id,name:names[i]})); t.addedExWater=true;
    commit();
  });
  return inp;
}
function renderTags(){
  $('tagList').replaceChildren(...S.state.tags.map(t=>{
    const name=h('input',{class:'name',type:'text',value:t.name,'aria-label':'Sub-theme name','data-k':'tgn:'+t.id});
    name.addEventListener('input',()=>{ if(name.value.trim()){ t.name=name.value.trim(); save(); renderMain(); } });
    name.addEventListener('blur',()=>{ if(!name.value.trim()) name.value=t.name; });
    const used=S.state.tasks.filter(x=>x.tag===t.id).length+S.state.goals.reduce((n,g)=>n+allSteps(g).filter(x=>x.tag===t.id).length,0);
    const del=S.confirm==='tg:'+t.id
      ? h('button',{class:'link danger','data-k':'tgd:'+t.id,onclick:()=>{
          S.state.tags=S.state.tags.filter(x=>x!==t);
          S.state.tasks.forEach(x=>{if(x.tag===t.id) delete x.tag});
          S.state.goals.forEach(g=>allSteps(g).forEach(x=>{if(x.tag===t.id) delete x.tag}));
          S.confirm=null; commit(); }},used?`Delete (${used} task${used>1?'s':''} lose it)`:'Confirm delete')
      : h('button',{class:'link','data-k':'tgd:'+t.id,onclick:()=>{S.confirm='tg:'+t.id;renderThemes()}},'Delete');
    return h('div',{class:'trow',style:`--c:${t.color}`},name,h('span'),
      h('div',{class:'swatches',role:'group','aria-label':`Colour for ${t.name}`},
        SW.map((c,ci)=>h('button',{class:'sw',style:`--sw:${c}`,'aria-label':`Colour ${ci+1}`,'aria-pressed':String(t.color.toLowerCase()===c.toLowerCase()),
          'data-k':`tgsw:${t.id}:${ci}`,onclick:()=>{t.color=c;commit()}})),
        colourPick(t.color,SW,`Custom colour for ${t.name}`,'tgswc:'+t.id,v=>{t.color=v}),
        del));
  }));
}
function renderMoney(){
  const sel=h('select',{'aria-label':'Currency','data-k':'cur',onchange:e=>{S.state.settings.currency=e.target.value;commit()}},CURR.map(c=>h('option',{value:c},c)));
  sel.value=S.state.settings.currency||'EUR';
  $('moneyRow').replaceChildren(
    h('label',{},'Currency ',sel),
    h('label',{class:'showlbl'},h('input',{type:'checkbox',checked:!!S.state.settings.showSpend,'data-k':'ss',
      onchange:e=>{S.state.settings.showSpend=e.target.checked;commit()}}),'Show a Spent row with daily totals'));
}
function renderWeekStart(){
  const sel=h('select',{'aria-label':'Week starts on','data-k':'wks',onchange:e=>{
    S.state.settings.weekStart=Number(e.target.value); S.state=normalize(S.state); applyWeekStart(); commit(); }},
    h('option',{value:'0'},'Sunday'),h('option',{value:'1'},'Monday'));
  sel.value=String(S.state.settings.weekStart===1?1:0);
  const wg=h('input',{type:'number',min:'0.5',max:'8',step:'0.5',value:String(S.state.settings.waterGoalL||2),'aria-label':'Daily water goal in litres','data-k':'wg',style:'width:4.5rem;font-size:14px;padding:4px 6px;border:1px solid var(--line);border-radius:6px;background:var(--paper)',
    onchange:e=>{ const v=Math.round(Number(String(e.target.value).replace(',','.'))*2)/2; if(v>0&&v<=8){ S.state.settings.waterGoalL=v; commit(); } }});
  $('wsRow').replaceChildren(h('label',{},'Week starts on ',sel),h('label',{},'Daily water goal ',wg,' L (each droplet = 500 ml)'));
}
function renderThemes(){
  renderColours(); renderTags(); renderMoney(); renderWeekStart();
  const all=S.state.themes;
  themeList.replaceChildren(...all.map((t,i)=>{
    const name=h('input',{class:'name',type:'text',value:t.name,'aria-label':'Theme name','data-k':'tn:'+t.id});
    name.addEventListener('input',()=>{ if(name.value.trim()){ t.name=name.value.trim(); save(); renderMain(); } });
    name.addEventListener('blur',()=>{ if(!name.value.trim()) name.value=t.name; });
    const nTasks=S.state.tasks.filter(x=>x.themeId===t.id).length;
    const del=S.confirm==='t:'+t.id
      ? h('button',{class:'link danger','data-k':'td:'+t.id,onclick:()=>deleteTheme(t)},nTasks?`Delete with ${nTasks} task${nTasks>1?'s':''}`:'Confirm delete')
      : h('button',{class:'link','data-k':'td:'+t.id,disabled:all.length<2,title:all.length<2?'Keep at least one theme':null,onclick:()=>{S.confirm='t:'+t.id;renderThemes()}},'Delete');
    return h('div',{class:'trow',style:`--c:${t.color}`},
      name,
      h('div',{class:'tacts'},
        h('label',{class:'showlbl'},h('input',{type:'checkbox',checked:!!t.show,'data-k':'ts:'+t.id,onchange:e=>{t.show=e.target.checked;commit()}}),'Show'),
        h('button',{class:'icon sm','aria-label':`Move ${t.name} up`,'data-k':'tu:'+t.id,disabled:i===0,onclick:()=>moveTheme(i,-1)},'↑'),
        h('button',{class:'icon sm','aria-label':`Move ${t.name} down`,'data-k':'tdn:'+t.id,disabled:i===all.length-1,onclick:()=>moveTheme(i,1)},'↓')),
      secInput(t),
      h('div',{class:'swatches',role:'group','aria-label':`Colour for ${t.name}`},
        SW.map((c,ci)=>h('button',{class:'sw',style:`--sw:${c}`,'aria-label':`Colour ${ci+1}`,'aria-pressed':String(t.color.toLowerCase()===c.toLowerCase()),'data-k':`sw:${t.id}:${ci}`,onclick:()=>{t.color=c;commit()}})),
        colourPick(t.color,SW,`Custom colour for ${t.name}`,'swc:'+t.id,v=>{t.color=v}),
        del));
  }));
}
$('addTag').addEventListener('click',()=>{
  const t={id:uid(),name:'New sub-theme',color:SW[(S.state.tags.length*5+2)%SW.length]};
  S.state.tags.push(t); commit();
  const el=document.querySelector(`[data-k="tgn:${t.id}"]`); if(el){el.focus();el.select()}
});
$('addEvType').addEventListener('click',()=>{
  const t={id:uid(),name:'New type',color:SW[(S.state.evtypes.length*3)%SW.length]};
  S.state.evtypes.push(t); commit();
  const el=document.querySelector(`[data-k="etn:${t.id}"]`); if(el){el.focus();el.select()}
});
$('addTheme').addEventListener('click',()=>{
  const t={id:uid(),name:'New theme',color:SW[S.state.themes.length%SW.length],show:true};
  S.state.themes.push(t); S.themeFocus=t.id; commit(); focusTheme();
});
$('closeDlg').addEventListener('click',()=>themeDlg.close());
themeDlg.addEventListener('click',e=>{ if(e.target===themeDlg) themeDlg.close(); });
themeDlg.addEventListener('close',()=>{S.confirm=null});

/* ---------- shell ---------- */
const SUB_SHOW=5;
function capSubLists(prev){
  main.querySelectorAll('.goal:not(.recipe) .sub .steps[data-sid]').forEach(ul=>{
    const lis=ul.querySelectorAll(':scope > li'); ul.classList.remove('capped');
    if(lis.length<=SUB_SHOW) return;
    const top=ul.getBoundingClientRect().top, bot=lis[SUB_SHOW-1].getBoundingClientRect().bottom;
    ul.style.setProperty('--sh',Math.ceil(bot-top)+'px'); ul.classList.add('capped');
    const sid=ul.dataset.sid;
    if(S.focus==='s:'+sid) ul.scrollTop=ul.scrollHeight; else if(prev[sid]) ul.scrollTop=prev[sid];
  });
}
function renderMain(){ const prev={}; main.querySelectorAll('.steps.capped[data-sid]').forEach(ul=>{prev[ul.dataset.sid]=ul.scrollTop});
  main.replaceChildren(S.view==='week'?renderWeek():S.view==='library'?renderLibrary():S.view==='pantry'?renderPantry():S.view==='recipes'?renderRecipes():renderGoals()); setGripHeight(); capSubLists(prev); }
function render(){
  const ak=document.activeElement&&document.activeElement.dataset?document.activeElement.dataset.k:null;
  $('tab-week').setAttribute('aria-selected',String(S.view==='week'));
  $('tab-goals').setAttribute('aria-selected',String(S.view==='goals'));
  $('tab-library').setAttribute('aria-selected',String(S.view==='library'));
  $('tab-recipes').setAttribute('aria-selected',String(S.view==='recipes'));
  $('tab-pantry').setAttribute('aria-selected',String(S.view==='pantry'));
  $('weeknav').hidden=S.view!=='week';
  const end=addDays(S.week,6);
  $('wlabel').replaceChildren(h('b',{text:`Week ${wkNum(S.week)}`}),h('span',{text:`${fmtD.format(S.week)} – ${fmtD.format(end)} ${end.getFullYear()}`}));
  $('thisweek').disabled=key(S.week)===key(mondayOf(new Date()));
  applyHi();
  renderMain();
  if(themeDlg.open) renderThemes();
  const af=document.querySelector('[data-autofocus]');
  if(af){ af.focus(); const L=af.value.length; if(af.setSelectionRange) try{af.setSelectionRange(L,L)}catch(e){} }
  else if(ak){ const el=document.querySelector(`[data-k="${CSS.escape(ak)}"]`); if(el){ el.focus(); if(el.type==='text'&&el.setSelectionRange) try{el.setSelectionRange(el.value.length,el.value.length)}catch(e){} } }
  S.focus=null; if(S.editing) S.editing.focus=false;
}
function setView(v){ if(S.editing){applyEdit(S.editing);S.editing=null;save()} S.view=v; S.confirm=null; try{localStorage.setItem(LSV,v)}catch(e){} render(); }
$('tab-week').addEventListener('click',()=>setView('week'));
$('tab-goals').addEventListener('click',()=>setView('goals'));
$('tab-library').addEventListener('click',()=>setView('library'));
$('tab-recipes').addEventListener('click',()=>setView('recipes'));
$('tab-pantry').addEventListener('click',()=>setView('pantry'));
$('prev').addEventListener('click',()=>goWeek(addDays(S.week,-7)));
$('next').addEventListener('click',()=>goWeek(addDays(S.week,7)));
$('thisweek').addEventListener('click',()=>goWeek(new Date()));
document.addEventListener('keydown',e=>{
  if(e.target.closest('input,select,textarea')||themeDlg.open||evDlg.open||impDlg.open||bookDlg.open||S.view!=='week') return;
  if(e.key==='ArrowLeft'&&e.altKey) goWeek(addDays(S.week,-7));
  if(e.key==='ArrowRight'&&e.altKey) goWeek(addDays(S.week,7));
});
document.addEventListener('click',e=>{
  if(!S.sel||Date.now()-S.selAt<400) return;
  const t=e.target; if(!t||!t.closest) return;
  if(t.closest('dialog')) return;
  const li=t.closest('li.task');
  if(li&&li.dataset.tid===S.sel) return;
  S.sel=null; render();
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&S.sel&&!S.editing&&!themeDlg.open&&!evDlg.open&&!impDlg.open&&!bookDlg.open){ S.sel=null; render(); }
});
render();
})();
