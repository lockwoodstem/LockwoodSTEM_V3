(() => {
  'use strict';
  function createDocument({title,name,course,questions,answers,date=new Date()}) {
    if(!window.jspdf?.jsPDF)throw new Error('PDF tools could not load. Reload this page and try again.');
    const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'});
    if(window.AsterionReportFont){doc.addFileToVFS('DejaVuSans.ttf',window.AsterionReportFont);doc.addFont('DejaVuSans.ttf','Report','normal');doc.setFont('Report');}
    let y=22;
    function line(text,size=11){
      doc.setFontSize(size);
      const rows=doc.splitTextToSize(String(text),174);
      for(const row of rows){if(y>272){doc.addPage();y=22;}doc.text(row,18,y);y+=size*.48;}
      y+=3;
    }
    line('LockwoodSTEM | Assessment responses',17);line(title,14);
    line('Student: '+name);line('Course / period: '+course);line('Prepared: '+date.toLocaleString());
    line('For teacher review. This report is not a score, certification, or equipment authorization. Submit this PDF through your teacher’s assignment system.',10);
    questions.forEach((q,i)=>{if(y>242){doc.addPage();y=22;}line(`${i+1}. ${q.question}`);line('Response: '+answers[q.id]);});
    const pages=doc.getNumberOfPages();for(let page=1;page<=pages;page++){doc.setPage(page);doc.setFontSize(9);doc.text(`LockwoodSTEM | Student response report | ${page} / ${pages}`,18,287);}
    return doc;
  }
  function attach({form,button,resultBox,questions,getAnswers}){
    const box=document.createElement('div');box.className='report-identity';
    box.innerHTML='<label>Your name<input name="report-name" autocomplete="name" maxlength="120" required></label><label>Course / period<input name="report-course" maxlength="120" required></label><p>Your answers stay in this open page. They are not saved to an account. Download before leaving; then turn the PDF in to your teacher.</p>';
    form.prepend(box);button.textContent='Download response PDF';resultBox.setAttribute('role','status');
    button.addEventListener('click',async()=>{
      resultBox.hidden=false;
      const fields=[...box.querySelectorAll('input')];
      for(const input of fields){if(!input.value.trim()){input.setCustomValidity('Please complete this field.');input.reportValidity();input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});return;}}
      const {answers,missing}=getAnswers(form,questions);
      if(missing.length){resultBox.textContent=`Answer every question before downloading. ${missing.length} unanswered.`;form.querySelector(`input[name="${missing[0]}"]`)?.focus();return;}
      button.disabled=true;
      try{
        const title=document.querySelector('main .eyebrow')?.textContent.trim()||document.title.split('|')[0].trim();
        const doc=createDocument({title,name:fields[0].value.trim(),course:fields[1].value.trim(),questions,answers});
        await doc.save('LockwoodSTEM-'+location.pathname.split('/').pop().replace('.html','')+'-responses.pdf',{returnPromise:true});
        resultBox.textContent='PDF download started. Check your downloads, then submit the file through your teacher’s assignment system. Nothing has been submitted by this website.';
      }catch(e){resultBox.textContent='Report could not be downloaded: '+e.message;}
      finally{button.disabled=false;}
    });
  }
  window.LockwoodAssessmentReports={attach,createDocument};
})();
