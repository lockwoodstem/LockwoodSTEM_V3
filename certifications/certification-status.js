document.addEventListener("DOMContentLoaded", async () => {
  const boxes=document.querySelectorAll("[data-cert-status]"); if(!boxes.length)return;
  const tracker=window.LockwoodMicroBadges, auth=window.LockwoodCertAuth, session=auth&&auth.getSession?auth.getSession():null;
  if(!tracker||!auth||!session||!session.token)return;
  const all=await tracker.fetchStatuses();
  for(const box of boxes){
    const cert=tracker.getCert(box.dataset.certId); if(!cert)continue;
    const s=tracker.normalize(cert,all[cert.certId]);
    const date=s.certifiedAt?new Date(s.certifiedAt).toLocaleDateString():"";
    box.innerHTML=`<div class="cert-status-panel ${s.earned?'passed':s.state==='pending'?'warning':s.state==='retake'?'failed':''}"><h3>${s.label}</h3><p>${s.detail}</p><p><strong>Best score:</strong> ${s.attempts?s.bestPercent+'%':'No attempt yet'}</p><p><strong>Attempts:</strong> ${s.attempts}</p>${cert.requiresHandsOn?`<p><strong>Hands-on approval:</strong> ${s.handsOnComplete?'Complete':'Not complete'}</p>`:'<p><strong>Hands-on approval:</strong> Not required</p>'}${date?`<p><strong>Badge earned:</strong> ${date}</p>`:''}</div>`;
  }
});
