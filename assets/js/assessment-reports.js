(() => {
'use strict';
function attach({form,button,resultBox,questions,getAnswers}){
 const L=window.LockwoodLearning;if(!L){resultBox.hidden=false;resultBox.textContent='Report tools could not load. Reload to try again.';return;}
 const box=document.createElement('div');box.className='report-identity';box.innerHTML='<label>Your name<input name="report-name" autocomplete="name" maxlength="120" required></label><label>Course / period<input name="report-course" maxlength="120" required></label><p>Responses save in this browser. On a shared computer, clear your work after exporting. Review the PDF, then submit it through your classroom assignment system.</p>';
 form.prepend(box);const toolbar=L.draftToolbar();form.prepend(toolbar);L.attachDraft(form,toolbar);button.textContent='Preview responses & export PDF';resultBox.setAttribute('role','status');
 button.addEventListener('click',()=>{
  resultBox.hidden=false;const fields=[...box.querySelectorAll('input')];
  if(fields.some(f=>f.disabled)){resultBox.textContent='Restore the saved draft or start fresh before previewing.';return;}
  for(const f of fields){if(!f.value.trim()){f.setCustomValidity('Please complete this field.');f.reportValidity();f.addEventListener('input',()=>f.setCustomValidity(''),{once:true});return;}}
  const {answers,missing}=getAnswers(form,questions);if(missing.length){resultBox.textContent=`Answer every question before previewing. ${missing.length} unanswered.`;form.querySelector(`input[name="${missing[0]}"]`)?.focus();return;}
  resultBox.textContent='Review your response report before downloading. Nothing has been submitted.';
  L.preview({title:document.querySelector('main .eyebrow')?.textContent.trim()||document.title,name:fields[0].value.trim(),course:fields[1].value.trim(),url:location.origin+location.pathname,sections:questions.map((q,i)=>({title:`${i+1}. ${q.question}`,text:answers[q.id]}))},button);
 });
}
window.LockwoodAssessmentReports={attach};
})();
