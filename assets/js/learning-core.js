/* Shared local drafts, report preview and on-demand PDF export. */
(() => {
'use strict';
const ROOT=new URL('../../',document.currentScript.src), PREFIX='lockwoodstem-draft-v2:';
const safe=v=>String(v??'');
const esc=v=>safe(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function collect(root){
 const data={};
 root.querySelectorAll('input,textarea,select').forEach((el,i)=>{
  if(el.closest('[data-no-draft]')||['password','file','submit','button','search','hidden'].includes(el.type)||el.disabled)return;
  const key=el.dataset.draftKey||el.id||el.name||`field-${i}`;
  if(el.type==='radio'){if(el.checked)data[key]={type:'radio',value:el.value};}
  else data[key]={type:el.type,value:el.type==='checkbox'?el.checked:el.value};
 });return data;
}
function restore(root,data){
 root.querySelectorAll('input,textarea,select').forEach((el,i)=>{
  if(el.closest('[data-no-draft]')||['password','file','submit','button','search','hidden'].includes(el.type)||el.disabled)return;
  const saved=data[el.dataset.draftKey||el.id||el.name||`field-${i}`];if(!saved)return;
  if(el.type==='radio')el.checked=el.value===saved.value;
  else if(el.type==='checkbox')el.checked=!!saved.value;
  else el.value=safe(saved.value);
 });
}
function attachDraft(root,toolbar,key=location.pathname){
 const storageKey=PREFIX+key;let timer,pending=null,active=true,last=null,dirty=false;
 const status=toolbar.querySelector('[data-draft-status]');
 const restoreBtn=toolbar.querySelector('[data-draft-restore]');
 const clearBtn=toolbar.querySelector('[data-draft-clear]');
 const resetInputs=()=>root.querySelectorAll('input,textarea,select').forEach(el=>{
  if(el.closest('[data-no-draft]'))return;
  if(el.type==='radio'||el.type==='checkbox')el.checked=el.defaultChecked;
  else if(el.tagName==='SELECT'){el.selectedIndex=0;[...el.options].forEach((o,i)=>{if(o.defaultSelected)el.selectedIndex=i;});}
  else if(!['file','button','submit','password'].includes(el.type))el.value=el.defaultValue;
 });
 const save=()=>{clearTimeout(timer);if(!active||!dirty)return;try{last={version:2,updatedAt:new Date().toISOString(),fields:collect(root)};localStorage.setItem(storageKey,JSON.stringify(last));dirty=false;status.textContent='Saved on this device at '+new Date(last.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}catch{status.textContent='Browser storage unavailable. Keep this page open and export your report.';}};
 try{pending=JSON.parse(localStorage.getItem(storageKey)||'null');if(pending?.version===2){active=false;restoreBtn.hidden=false;status.textContent='A draft from '+new Date(pending.updatedAt).toLocaleString()+' is on this device. Restore it or start fresh before editing.';}}catch{status.textContent='Browser storage unavailable. Export your report before leaving.';}
 // Old shared-device work is never shown or overwritten until the student chooses.
 const fields=[...root.querySelectorAll('input,textarea,select')].filter(e=>!e.closest('[data-no-draft]')&&!e.disabled);
 if(!active)fields.forEach(e=>e.disabled=true);
 const unlock=()=>fields.forEach(e=>e.disabled=false);
 restoreBtn.addEventListener('click',()=>{unlock();restore(root,pending.fields||{});active=true;restoreBtn.hidden=true;status.textContent='Draft restored. Changes save on this device.';root.dispatchEvent(new CustomEvent('learning:restored',{bubbles:true}));});
 clearBtn.addEventListener('click',()=>{
  const dialog=document.createElement('dialog');dialog.className='learning-dialog';dialog.innerHTML='<h2>Clear work from this device?</h2><p>This clears the saved responses and current fields for this lesson. Download your report first if you need a copy.</p><div class="learning-actions"><button type="button" data-confirm-clear>Clear this lesson</button><button type="button" data-cancel-clear>Keep my work</button></div>';
  document.body.append(dialog);dialog.querySelector('[data-cancel-clear]').onclick=()=>dialog.close();
  dialog.querySelector('[data-confirm-clear]').onclick=()=>{clearTimeout(timer);try{localStorage.removeItem(storageKey);}catch{}unlock();resetInputs();pending=null;last=null;dirty=false;active=true;restoreBtn.hidden=true;status.textContent='Work cleared. New changes will save on this device.';root.dispatchEvent(new CustomEvent('learning:cleared',{bubbles:true}));dialog.close();};
  dialog.addEventListener('close',()=>{dialog.remove();clearBtn.focus();},{once:true});dialog.showModal();dialog.querySelector('[data-cancel-clear]').focus();
 });
 const schedule=e=>{if(!e.target.matches('input,textarea,select')||e.target.closest('[data-no-draft]'))return;dirty=true;status.textContent='Saving on this device…';clearTimeout(timer);timer=setTimeout(save,350);};
 root.addEventListener('input',schedule);root.addEventListener('change',schedule);root.addEventListener('learning:save',save);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save();});
 return {save,key:storageKey};
}
function draftToolbar(){const el=document.createElement('div');el.className='draft-toolbar';el.dataset.noDraft='';el.innerHTML='<p role="status" data-draft-status>Changes save on this device. Nothing is submitted automatically.</p><div class="learning-actions"><button type="button" data-draft-restore hidden>Restore saved draft</button><button type="button" data-draft-clear>Clear my work / start fresh</button></div><small>Shared computer? Clear your work when you finish. Drafts are visible to other people using this browser.</small>';return el;}
let pdfPromise;
function loadScript(path){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(path,ROOT).href;s.onload=resolve;s.onerror=()=>{s.remove();reject(new Error('PDF tools did not load. Check your connection and try again.'));};document.head.append(s);});}
function loadPDF(){if(!pdfPromise)pdfPromise=(async()=>{if(!window.jspdf)await loadScript('assets/vendor/jspdf.umd.min.js');if(!window.AsterionReportFont)await loadScript('assets/vendor/report-font.js');})().catch(e=>{pdfPromise=null;throw e;});return pdfPromise;}
function createDocument(report){
 const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'});if(window.AsterionReportFont){doc.addFileToVFS('DejaVuSans.ttf',window.AsterionReportFont);doc.addFont('DejaVuSans.ttf','Report','normal');doc.setFont('Report');}
 let y=20;const line=(value,size=11)=>{doc.setFontSize(size);for(const row of doc.splitTextToSize(safe(value),174)){if(y>272){doc.addPage();y=20;}doc.text(row,18,y);y+=size*.48;}y+=3;};
 line('LockwoodSTEM | Learning report',17);line(report.title,14);line('Student: '+(report.name||'Not supplied'));line('Course / period: '+(report.course||'Not supplied'));line('Prepared: '+new Date().toLocaleString(),9);line('Lesson: '+(report.url||location.href),9);
 line('Student-reported evidence for teacher review. This document is not proof of mastery, a grade, or equipment authorization. Upload it through your classroom assignment system.',10);
 for(const section of report.sections){if(y>240){doc.addPage();y=20;}line(section.title,13);line(section.text||'[Not answered]');}
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(9);doc.text(`LockwoodSTEM | ${i} / ${pages}`,18,287);}return doc;
}
function preview(report,trigger){
 const dialog=document.createElement('dialog');dialog.className='learning-dialog report-preview';dialog.setAttribute('aria-labelledby','report-preview-title');
 dialog.innerHTML='<div class="learning-actions"><h2 id="report-preview-title">Preview your report</h2><button type="button" data-close-preview>Close preview</button></div><p>Review your responses, download the PDF, then submit it through your classroom assignment system.</p><article class="report-paper"><h3>'+esc(report.title)+'</h3><p>'+esc(report.name||'Name not supplied')+' · '+esc(report.course||'Course not supplied')+'</p>'+report.sections.map(s=>'<section><h4>'+esc(s.title)+'</h4><p>'+esc(s.text||'[Not answered]')+'</p></section>').join('')+'</article><p role="status" data-export-status></p><button type="button" data-download-report>Download PDF</button>';
 document.body.append(dialog);dialog.querySelector('[data-close-preview]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();trigger?.focus();},{once:true});
 dialog.querySelector('[data-download-report]').onclick=async e=>{const b=e.currentTarget,status=dialog.querySelector('[data-export-status]');b.disabled=true;status.textContent='Preparing PDF…';try{await loadPDF();const doc=createDocument(report);await doc.save('LockwoodSTEM-'+report.title.replace(/[^a-z0-9]+/gi,'-').slice(0,65)+'.pdf',{returnPromise:true});status.textContent='Download started. Check your downloads, then upload the PDF to your assignment. This website has not submitted it.';}catch(err){status.textContent=err.message;}finally{b.disabled=false;}};
 dialog.showModal();dialog.querySelector('[data-close-preview]').focus();return dialog;
}
window.LockwoodLearning={esc,attachDraft,draftToolbar,collect,restore,loadPDF,createDocument,preview};
})();
