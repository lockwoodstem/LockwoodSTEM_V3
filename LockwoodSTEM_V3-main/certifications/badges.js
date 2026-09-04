(function() {
  const CATALOG = [{"certId":"engineering-safety","fullName":"Engineering Safety","short":"Safety","category":"safety","categoryLabel":"Engineering Safety","requiresHandsOn":false,"image":"engineering-safety.png","access":"General FabLab readiness"},{"certId":"technical-sketching","fullName":"Technical Sketching","short":"Sketching","category":"academic","categoryLabel":"Academic Skill","requiresHandsOn":false,"image":"technical-sketching.png"},{"certId":"engineering-documentation","fullName":"Engineering Documentation","short":"Documentation","category":"academic","categoryLabel":"Academic Skill","requiresHandsOn":false,"image":"engineering-documentation.png"},{"certId":"fusion-cad-level-1","fullName":"Fusion CAD Level 1","short":"CAD Level 1","category":"academic","categoryLabel":"Academic Skill","requiresHandsOn":false,"image":"fusion-cad-level-1.png"},{"certId":"engineering-drawings","fullName":"Engineering Drawings","short":"Drawings","category":"academic","categoryLabel":"Academic Skill","requiresHandsOn":false,"image":"engineering-drawings.png"},{"certId":"fusion-cad-level-2","fullName":"Fusion CAD Level 2","short":"CAD Level 2","category":"academic","categoryLabel":"Academic Skill","requiresHandsOn":false,"image":"fusion-cad-level-2.png"},{"certId":"design-review","fullName":"Design Review","short":"Design Review","category":"professional","categoryLabel":"Professional Skill","requiresHandsOn":false,"image":"design-review.png"},{"certId":"3d-printing","fullName":"3D Printing","short":"3D Printing","category":"equipment","categoryLabel":"FabLab Equipment","requiresHandsOn":true,"image":"3d-printing.png","access":"3D printer access"},{"certId":"laser-cutting","fullName":"Laser Cutting","short":"Laser Cutting","category":"equipment","categoryLabel":"FabLab Equipment","requiresHandsOn":true,"image":"laser-cutting.png","access":"Laser cutter access"},{"certId":"cnc","fullName":"CNC","short":"CNC","category":"equipment","categoryLabel":"FabLab Equipment","requiresHandsOn":true,"image":"cnc.png","access":"CNC access"},{"certId":"drill-press","fullName":"Drill Press","short":"Drill Press","category":"equipment","categoryLabel":"FabLab Equipment","requiresHandsOn":true,"image":"drill-press.png","access":"Drill press access"},{"certId":"soldering","fullName":"Soldering","short":"Soldering","category":"equipment","categoryLabel":"FabLab Equipment","requiresHandsOn":true,"image":"soldering.png","access":"Soldering station access"},{"certId":"hand-cutting-tools","fullName":"Hand & Cutting Tools","short":"Hand Tools","category":"equipment","categoryLabel":"FabLab Equipment","requiresHandsOn":true,"image":"hand-cutting-tools.png","access":"Hand and cutting tool access"}];
  const CACHE_KEY = "lockwoodstem_cert_status_cache_v2";

  function ensureStyles() {
    if (document.querySelector('link[data-cert-progress-css]')) return;
    const link=document.createElement('link'); link.rel='stylesheet'; link.href='../assets/css/certification-progress.css?v=1'; link.dataset.certProgressCss='true'; document.head.appendChild(link);
  }
  function esc(value) { return String(value||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[ch]); }
  function formatDate(value) { if(!value)return""; const d=new Date(value); return Number.isNaN(d.getTime())?"":d.toLocaleDateString(); }
  function getCert(id) { return CATALOG.find(c=>c.certId===id); }
  function readCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY)||"{}") } catch(e) { return {}; } }
  function writeCache(statuses) { try { localStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:new Date().toISOString(),statuses})); } catch(e) {} }
  async function fetchStatuses() {
    const auth=window.LockwoodCertAuth, session=auth&&auth.getSession?auth.getSession():null;
    if(!auth||!session||!session.token) return (readCache().statuses||{});
    try { const r=await auth.request('getAllCertificationStatuses',{token:session.token}); const statuses=r.statuses||{}; writeCache(statuses); return statuses; }
    catch(err) { return (readCache().statuses||{}); }
  }
  function normalize(cert, raw) {
    const s=raw||{}; const attempts=Number(s.attempts||0); const best=Number(s.bestPercent||0);
    const onlinePassed=!!s.onlinePassed || best>=80; const handsOnComplete=!!s.handsOnComplete;
    const earned=onlinePassed && (!cert.requiresHandsOn || handsOnComplete);
    let state='not-started', label='Not Started', detail='Begin the study guide and practice test when ready.';
    if(earned) { state='earned'; label='Earned'; detail=cert.requiresHandsOn?'Online test and teacher approval complete.':'Online certification complete.'; }
    else if(onlinePassed && cert.requiresHandsOn) { state='pending'; label='Pending Approval'; detail='Online test passed. Complete the hands-on check with your teacher.'; }
    else if(attempts>0) { state='retake'; label='Retake Available'; detail=`Best score: ${best}%. Reach 80% to pass.`; }
    return {...s,attempts,bestPercent:best,onlinePassed,handsOnComplete,earned,state,label,detail};
  }
  function allNormalized(statuses) { const out={}; CATALOG.forEach(c=>out[c.certId]=normalize(c,statuses[c.certId])); return out; }
  function summarize(n) {
    const vals=CATALOG.map(c=>n[c.certId]);
    const earned=vals.filter(s=>s.earned).length, online=vals.filter(s=>s.onlinePassed).length, pending=vals.filter(s=>s.state==='pending').length;
    const equipment=CATALOG.filter(c=>c.category==='equipment'&&n[c.certId].earned).length;
    return {earned,online,pending,equipment,total:CATALOG.length,percent:Math.round(earned/CATALOG.length*100)};
  }
  function summaryMarkup(n) { const s=summarize(n); return `
    <div class="cert-progress-head"><div><div class="eyebrow">Your Progress</div><h2>${s.earned} of ${s.total} badges earned</h2><p>Pass online certifications with 80% or higher. Equipment certifications also require teacher approval.</p></div><div class="cert-progress-ring" style="--progress:${s.percent}"><strong>${s.percent}%</strong><span>complete</span></div></div>
    <div class="cert-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.percent}"><span style="width:${s.percent}%"></span></div>
    <div class="cert-stat-grid"><div><strong>${s.earned}</strong><span>Badges earned</span></div><div><strong>${s.online}</strong><span>Online tests passed</span></div><div><strong>${s.pending}</strong><span>Teacher approvals pending</span></div><div><strong>${s.equipment} / 6</strong><span>Equipment access badges</span></div></div>`; }
  function renderSummaries(n) { document.querySelectorAll('[data-cert-progress-summary]').forEach(el=>el.innerHTML=summaryMarkup(n)); }
  function stateClass(s) { return `cert-state-chip ${s.state}`; }
  function renderCards(n) {
    document.querySelectorAll('[data-cert-card]').forEach(card=>{ const id=card.dataset.certId,c=getCert(id),s=n[id]; if(!c||!s)return; card.dataset.certState=s.state; const box=card.querySelector('[data-card-progress]'); if(box) box.innerHTML=`<span class="${stateClass(s)}">${esc(s.label)}</span>${s.attempts?`<span class="cert-score">Best: ${s.bestPercent}% • ${s.attempts} attempt${s.attempts===1?'':'s'}</span>`:''}`; const btn=card.querySelector('a.btn'); if(btn) btn.textContent=s.earned?'Review Certification':s.state==='retake'?'Prepare to Retake':s.state==='pending'?'View Hands-on Requirements':'Start Certification'; });
  }
  function nextCertification(n) { return CATALOG.find(c=>!n[c.certId].earned && n[c.certId].state==='pending') || CATALOG.find(c=>n[c.certId].state==='retake') || CATALOG.find(c=>n[c.certId].state==='not-started') || null; }
  function renderNext(n) { const el=document.querySelector('[data-cert-next-step]'); if(!el)return; const c=nextCertification(n); if(!c) {el.innerHTML='<span class="tag">Complete</span><h2>All badges earned</h2><p>Your certification collection is complete.</p><a class="btn" href="badges.html">View Badges</a>';return;} const s=n[c.certId]; el.innerHTML=`<span class="tag">Next Step</span><h2>${esc(c.fullName)}</h2><p>${esc(s.detail)}</p><a class="btn" href="${esc(c.certId)}.html">${s.state==='pending'?'Review Requirements':'Continue Certification'}</a>`; }
  function dashboardMarkup(n) {
    const rows=CATALOG.map(c=>{const s=n[c.certId]; return `<tr><td><div class="cert-table-name"><img src="../assets/img/certification-badges/${esc(c.image)}" alt=""><div><strong>${esc(c.fullName)}</strong><span>${esc(c.categoryLabel)}</span></div></div></td><td><span class="${stateClass(s)}">${esc(s.label)}</span></td><td>${s.attempts?s.bestPercent+'%':'—'}</td><td>${s.attempts}</td><td>${c.requiresHandsOn?(s.handsOnComplete?'Complete':'Required'):'Not required'}</td><td>${formatDate(s.certifiedAt||(!c.requiresHandsOn&&s.onlinePassed?s.lastAttemptAt:''))||'—'}</td><td><a href="${esc(c.certId)}.html">Open</a></td></tr>`;}).join('');
    return `<div class="cert-dashboard-table-wrap"><table class="cert-dashboard-table"><thead><tr><th>Certification</th><th>Status</th><th>Best Score</th><th>Attempts</th><th>Hands-on</th><th>Completed</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function renderDashboard(n) { document.querySelectorAll('[data-cert-dashboard]').forEach(el=>el.innerHTML=dashboardMarkup(n)); }
  function badgeCard(c,s) {
    const imgClass=s.earned?'earned':s.state==='pending'?'pending':'locked';
    const date=formatDate(s.certifiedAt||(!c.requiresHandsOn&&s.onlinePassed?s.lastAttemptAt:''));
    return `<article class="achievement-card ${imgClass}" data-badge-state="${s.state}" data-badge-category="${c.category}"><div class="achievement-image-wrap"><img src="../assets/img/certification-badges/${esc(c.image)}" alt="${esc(c.fullName)} badge"></div><div class="achievement-body"><span class="${stateClass(s)}">${esc(s.label)}</span><h3>${esc(c.fullName)}</h3><p>${esc(s.detail)}</p><dl><div><dt>Best score</dt><dd>${s.attempts?s.bestPercent+'%':'—'}</dd></div><div><dt>Attempts</dt><dd>${s.attempts}</dd></div>${date?`<div><dt>Earned</dt><dd>${esc(date)}</dd></div>`:''}</dl>${c.access&&s.earned?`<p class="equipment-unlock">✓ ${esc(c.access)} unlocked</p>`:''}<a class="btn small ${s.earned?'secondary':'dark'}" href="${esc(c.certId)}.html">${s.earned?'View Certification':'Continue'}</a></div></article>`;
  }
  function renderCollections(n) { document.querySelectorAll('[data-badge-collection]').forEach(el=>{ const mode=el.dataset.badgeMode||'all'; let list=CATALOG; if(mode==='preview') { const earned=CATALOG.filter(c=>n[c.certId].earned); list=(earned.length?earned:CATALOG).slice(0,6); } el.innerHTML=list.map(c=>badgeCard(c,n[c.certId])).join(''); }); }
  function setupFilters() {
    document.querySelectorAll('[data-cert-filter]').forEach(btn=>{if(btn.dataset.filterReady==='true')return;btn.dataset.filterReady='true';btn.addEventListener('click',()=>{document.querySelectorAll('[data-cert-filter]').forEach(b=>b.classList.toggle('active',b===btn)); const f=btn.dataset.certFilter; document.querySelectorAll('[data-cert-card]').forEach(card=>{const state=card.dataset.certState,cat=card.dataset.certCategory; const show=f==='all'||f===cat||(f==='earned'&&state==='earned')||(f==='next'&&state!=='earned'); card.hidden=!show;});});});
    document.querySelectorAll('[data-badge-filter]').forEach(btn=>{if(btn.dataset.filterReady==='true')return;btn.dataset.filterReady='true';btn.addEventListener('click',()=>{document.querySelectorAll('[data-badge-filter]').forEach(b=>b.classList.toggle('active',b===btn)); const f=btn.dataset.badgeFilter; document.querySelectorAll('.achievement-card').forEach(card=>{const state=card.dataset.badgeState,cat=card.dataset.badgeCategory; const show=f==='all'||f===state||(f==='locked'&&(state==='not-started'||state==='retake'))||(f==='equipment'&&cat==='equipment'); card.hidden=!show;});});});
  }
  function compactBadge(c,s) { const title=`${c.fullName}: ${s.label}${s.attempts?' • '+s.bestPercent+'%':''}`; return `<a class="micro-badge ${s.earned?'earned':s.state==='pending'?'pending':'locked'} compact" href="${esc(c.certId)}.html" title="${esc(title)}" aria-label="${esc(title)}"><span class="micro-badge-icon"><img src="../assets/img/certification-badges/${esc(c.image)}" alt=""></span><span class="micro-badge-label">${esc(c.short)}</span></a>`; }
  function renderTopBar(n) { const strip=document.querySelector('[data-microbadge-strip]'); if(strip) strip.innerHTML=CATALOG.map(c=>compactBadge(c,n[c.certId])).join(''); }
  async function refresh() { ensureStyles(); const raw=await fetchStatuses(); const n=allNormalized(raw); window.LockwoodCertificationStatuses=n; renderSummaries(n); renderCards(n); renderNext(n); renderDashboard(n); renderCollections(n); renderTopBar(n); setupFilters(); }
  window.LockwoodMicroBadges={BADGES:CATALOG,refresh,getCert,normalize,fetchStatuses};
  document.addEventListener('DOMContentLoaded',()=>{ensureStyles();setTimeout(refresh,250);});
})();
