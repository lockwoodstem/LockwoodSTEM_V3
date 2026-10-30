(() => {
'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const root=document.querySelector('[data-lesson-workspace]');if(!root||!window.LockwoodLearning)return;
 const L=window.LockwoodLearning;const bar=L.draftToolbar();root.querySelector('h2').after(bar);
 L.attachDraft(root,bar);
 const reportButton=root.querySelector('[data-preview-lesson]');
 reportButton.addEventListener('click',()=>{
  const fields=root.querySelectorAll('[data-report-required]');if([...fields].some(f=>f.disabled)){bar.querySelector('[data-draft-status]').textContent='Restore your saved draft or choose Clear my work / start fresh before previewing.';bar.querySelector('[data-draft-restore]').focus();return;}for(const f of fields){if(!f.value.trim()){f.setCustomValidity('Complete this field before previewing your report.');f.reportValidity();f.addEventListener('input',()=>f.setCustomValidity(''),{once:true});return;}}
  const value=id=>root.querySelector('#'+id)?.value.trim()||'';
  const sections=[{title:'Lesson objective',text:document.querySelector('[data-lesson-objective]')?.textContent||document.title},...['learning-notes','learning-calculations','learning-evidence','learning-trials','learning-reflection','learning-revision'].map(id=>({title:root.querySelector('label[for="'+id+'"]')?.textContent||id,text:value(id)}))];
  L.preview({title:document.querySelector('main h1')?.textContent.trim()||document.title,name:value('learning-name'),course:value('learning-course'),url:location.origin+location.pathname,sections},reportButton);
 });
});
})();
