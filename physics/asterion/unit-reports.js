'use strict';
const UNIT_REFLECTIONS={
 1:[
 'Use two of your charge-analyzer measurements to explain how electric force depends on separation. What evidence supports an inverse-square relationship?',
 'Why could the electric fields cancel between two positive charges? Explain the directions and magnitudes of the two contributions at your selected position.',
 'For the charged-probe launcher, predict what would happen to vertical displacement if the field strength doubled. Then consider doubling the time in the field instead. Explain your reasoning using the model.'
 ],
 2:[
 'Use your measured charge and voltage values to explain how you determined the unknown capacitance. How did the second measurement help you check the result?',
 'Explain why your capacitor-bank connection met the required energy target. Compare the equivalent capacitance and stored energy of series and parallel connections at the same supply voltage.',
 'Explain the energy changes in the potential lift. What would change if a negative capsule traveled through the same potential difference? State your assumptions.'
 ],
 3:[
 'Use your measurements and series-repair values to explain how you identified the recovered resistor and chose the additional resistor. How did you check the controller voltage?',
 'Explain why the fixed load and actuator needed parallel branches. Use one network’s values to distinguish branch current from source current and explain the total power draw.',
 'Describe one unsuccessful configuration and how you diagnosed it. If your configurations worked on the first attempt, analyze a plausible incorrect one. What did the reserve trial require you to recalculate, and why?'
 ],
 4:[
 'Use two wire-force measurements to explain how you determined the magnetic-field strength. Which assumptions made your calculation valid?',
 'Explain how you used the right-hand rule to choose the gantry field direction. What would happen if the current reversed while the field stayed the same?',
 'For the calibration ion, explain how magnetic force produces circular motion without changing speed. Predict how orbit radius and period would change if the magnetic-field magnitude doubled.'
 ],
 5:[
 'Use your flux readings to explain the role of the angle between the field and coil normal. How did you infer the coil area?',
 'Explain how sweep time controlled induced emf and how you chose the induced current direction. If the into-screen field decreased instead, what would reverse, and why?',
 'Use your beacon settings to connect frequency, wavelength, and period. What would happen to wavelength and period if the frequency doubled in the same propagation medium?'
 ],
 6:[
 'Use your refraction measurements to explain how you inferred the window’s refractive index. Why must the angles be measured from the normal?',
 'Explain where the calibration lens formed the image and why it was inverted. How would the image distance change if the object moved much farther from the lens?',
 'Use your fringe measurements to explain how you found the source wavelength. Predict how fringe spacing would change if slit separation doubled or screen distance doubled, keeping other quantities fixed.'
 ],
 7:[
 'Explain the photon detector’s threshold and your selected wavelength. Why would increasing the intensity of light below the threshold photon energy not produce photoelectrons in this model?',
 'Explain how the selected hydrogen transition produced the observed line. How do the discrete energy levels determine photon energy and wavelength?',
 'Use your decay records to explain the inferred half-life and elapsed time to 100 counts/s. Then explain how the mass defect determines energy per event. Which parts of these calculations would be affected by real measurement uncertainty?'
 ]
};
function reflectionsReady(state,student){return !!student?.name?.trim()&&UNIT_REFLECTIONS[state.chapter].every((_,i)=>!!state.reflection?.responses?.[i]?.trim());}
function unitReportModel(chapter,state,student,createdAt=new Date().toISOString()){
 const questions=UNIT_REFLECTIONS[chapter.id];
 const observations=(state.readings||[]).map(r=>({setting:`Test voltage: ${r.v.toFixed(2)} V`,value:`Measured current: ${r.i.toFixed(3)} A`}));
 for(const [id,rows]of Object.entries(state.labReadings||{})){const lab=(typeof LABS!=='undefined'?LABS[chapter.id]:[])?.find(l=>l.id===id);for(const row of rows)observations.push({setting:(lab?lab.title+' / ':'')+row.label,value:row.value});}
 for(const [id,trials] of Object.entries(state.missionTrials||{})){for(const [i,trial] of trials.entries())observations.push({setting:`${id} / experiment ${i+1}: ${Object.entries(trial.settings).map(([k,v])=>k+'='+v).join(', ')}${trial.wires?.length?' / wires '+trial.wires.join(', '):''}`,value:trial.result+(trial.working?' · target reached':' · revise configuration')});}
 const solutions=[];
 for(const[id,solution]of Object.entries(state.labSolutions||{})){
  const lab=(typeof LABS!=='undefined'?LABS[chapter.id]:[])?.find(l=>l.id===id);
  const values=[];for(const [key,value]of Object.entries(solution.settings||{}))values.push(`${lab?.controls.find(c=>c.id===key)?.label||key}: ${value}`);
  for(const[key,value]of Object.entries(solution.predictions||{}))values.push(`${lab?.answers.find(c=>c.id===key)?.label||key}: ${value}`);
  solutions.push({title:lab?.title||solution.title||id,values});
 }
 return {chapter:chapter.id,title:chapter.title,unit:chapter.unit,student:{name:student.name.trim(),section:(student.section||'').trim()},createdAt,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,gameplayComplete:!!(state.turbine&&state.main&&state.reserve),reflections:questions.map((question,i)=>({question,response:state.reflection?.responses?.[i]||''})),observations,solutions,evidence:[...(state.evidence||[])],notes:state.notes||''};
}
// Shared by the browser export and the PDF layout tests. No network or backend needed.
function makeUnitReportPDF(report,jsPDFConstructor,fontData){
 const doc=new jsPDFConstructor({unit:'pt',format:'letter',compress:true,putOnlyUsedFonts:true});
 doc.addFileToVFS('AsterionSans.ttf',fontData);doc.addFont('AsterionSans.ttf','AsterionSans','normal');doc.setFont('AsterionSans');
 doc.setProperties({title:`PHY 2054C - Unit ${report.chapter} - ${report.student.name}`,subject:report.unit,author:report.student.name,creator:'LockwoodSTEM / Asterion unit report'});
 const margin=48,width=516,bottom=716;let y=52;
 const clean=t=>String(t).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').replace(/\t/g,'    ');
 function header(continued=false){doc.setFillColor(25,77,74);doc.rect(0,0,612,9,'F');doc.setFontSize(9);doc.setTextColor(65,92,103);doc.text('LOCKWOODSTEM  /  PHY 2054C',margin,33);if(continued){doc.text(`UNIT ${String(report.chapter).padStart(2,'0')} - CONTINUED`,564,33,{align:'right'});}y=57;}
 function newPage(){doc.addPage();header(true);}
 function room(height){if(y+height>bottom)newPage();}
 function paragraph(value,{size=10.5,color=[36,48,58],gap=9,lineHeight=15}={}){
  doc.setFont('AsterionSans');doc.setFontSize(size);doc.setTextColor(...color);
  const lines=doc.splitTextToSize(clean(value)||' ',width);
  for(const line of lines){room(lineHeight);doc.setFontSize(size);doc.setTextColor(...color);doc.text(line,margin,y);y+=lineHeight;}
  y+=gap;
 }
 function heading(value){room(48);y+=8;paragraph(value,{size:13,color:[25,77,74],lineHeight:18,gap:10});}
 header();paragraph(`UNIT ${String(report.chapter).padStart(2,'0')} LAB REPORT`,{size:10,color:[65,92,103],gap:5});paragraph(report.title,{size:22,lineHeight:28,gap:7});paragraph(report.unit,{size:11,color:[65,92,103],gap:16});
 paragraph(`Student: ${report.student.name}`,{size:11,gap:5});if(report.student.section)paragraph(`Course / section: ${report.student.section}`,{size:10,gap:5});
 const generated=new Date(report.createdAt).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:report.timezone||'UTC'});
 paragraph(`Generated: ${generated} (${report.timezone||'UTC'})`,{size:9,color:[80,96,106],gap:6});paragraph(`Unit challenges: ${report.gameplayComplete?'completed':'not yet completed'}  |  Reflections: ${report.reflections.filter(r=>r.response.trim()).length} of ${report.reflections.length} answered`,{size:9,color:[80,96,106],gap:12});
 doc.setDrawColor(196,211,213);doc.line(margin,y,564,y);y+=12;
 heading('Reflection responses');
 report.reflections.forEach((r,i)=>{room(65);paragraph(`${i+1}. ${r.question}`,{size:11,color:[25,77,74],lineHeight:16,gap:7});paragraph(r.response,{lineHeight:15,gap:17});});
 heading('Recorded measurements');if(report.observations.length){for(const row of report.observations){room(42);paragraph(row.setting,{size:9.5,color:[65,92,103],gap:3,lineHeight:14});paragraph(row.value,{size:10.5,gap:10,lineHeight:15});}}else paragraph('No instrument readings were stored for this unit in this browser.');
 if(report.solutions.length){heading('Successful configurations and predictions');for(const solution of report.solutions){room(45);paragraph(solution.title,{size:11,color:[25,77,74],gap:5});for(const value of solution.values)paragraph(value,{size:10,gap:3,lineHeight:14});y+=8;}}
 heading('Completed challenges and recovered evidence');if(report.evidence.length)report.evidence.forEach(e=>paragraph('• '+e,{size:10,gap:6,lineHeight:14}));else paragraph('No completed-challenge details were stored.');
 if(report.notes.trim()){heading('Student field notes');paragraph(report.notes);}
 room(45);y+=10;paragraph('Upload this PDF to your course submission. Exporting a report does not submit it to an instructor.',{size:9,color:[80,96,106],lineHeight:13});
 const pages=doc.getNumberOfPages();for(let page=1;page<=pages;page++){doc.setPage(page);doc.setDrawColor(196,211,213);doc.line(margin,742,564,742);doc.setFontSize(8);doc.setTextColor(80,96,106);doc.text(`ASTERION  /  UNIT ${String(report.chapter).padStart(2,'0')}`,margin,758);doc.text(`Page ${page} of ${pages}`,564,758,{align:'right'});}
 return doc;
}
function openReflections(chapter=s.chapter,atExit=false){
 save();const state=campaign.chapters[chapter];if(!state||!(state.turbine&&state.main&&state.reserve))return speak('Complete this unit’s challenges before opening its reflection report.');
 state.reflection??={version:1,responses:[]};campaign.student??={name:'',section:''};const ch=CHAPTERS[chapter-1];if($('panel').open)close();
 open(`<p class="eyebrow">UNIT ${String(chapter).padStart(2,'0')} / MISSION REFLECTION</p><h2>Explain the physics.</h2><p>${ch.title} is restored. Use your measurements and experience to explain how the physics guided your decisions.</p><div class="spec">${ch.unit}<br><b>Answer all three prompts and enter your name to export your unit PDF.</b></div><label for="reportName">Student name <span aria-hidden="true">*</span></label><input id="reportName" type="text" autocomplete="name" maxlength="150" required><label for="reportSection">Course / section (optional)</label><input id="reportSection" type="text" maxlength="150">${UNIT_REFLECTIONS[chapter].map((q,i)=>`<label for="reflection-${i}" class="reflection-question">${i+1}. ${escapeHTML(q)}</label><textarea id="reflection-${i}" class="reflection-answer" required placeholder="Write your explanation here. Refer to your own observations and calculations."></textarea>`).join('')}<details><summary>Review this unit’s evidence</summary><div id="reflectionEvidence"></div></details><p id="reflectionSaveStatus" class="small" role="status" aria-live="polite">Drafts save automatically in this browser. The PDF is your submission file.</p><div id="reflectionError" role="alert"></div><button id="exportUnitPDF" class="primary full">Export unit PDF report</button><button id="finishReflection" class="full">${atExit?(chapter===7?'Save reflection & finish expedition':'Save reflection & continue to next chapter'):'Save & return to journal'}</button><p class="small">Exporting downloads a file; it does not submit to your instructor. You can revise and re-export from Journal.</p>`);
 $('reportName').value=campaign.student.name||'';$('reportSection').value=campaign.student.section||'';
 const review=unitReportModel(ch,state,{name:campaign.student.name||'Student',section:campaign.student.section});
 $('reflectionEvidence').innerHTML=review.observations.map(r=>`<p>${escapeHTML(r.setting)}<br>${escapeHTML(r.value)}</p>`).join('')+'<ul>'+review.evidence.map(e=>'<li>'+escapeHTML(e)+'</li>').join('');
 function persist(){campaign.student={name:$('reportName').value,section:$('reportSection').value};state.reflection.responses=UNIT_REFLECTIONS[chapter].map((_,i)=>$('reflection-'+i).value);state.reflection.updatedAt=new Date().toISOString();if(!reflectionsReady(state,campaign.student))delete state.reflection.completedAt;const saved=save();$('reflectionSaveStatus').textContent=saved===false?'Browser storage is unavailable. Keep this tab open and export your PDF before leaving.':'Draft saved in this browser.';$('reflectionError').textContent='';}
 UNIT_REFLECTIONS[chapter].forEach((_,i)=>{$('reflection-'+i).value=state.reflection.responses[i]||'';$('reflection-'+i).oninput=persist;});$('reportName').oninput=persist;$('reportSection').oninput=persist;
 function validate(){persist();if(!campaign.student.name.trim()){$('reflectionError').textContent='Enter your name so your instructor can identify this report.';$('reportName').focus();return false;}const missing=UNIT_REFLECTIONS[chapter].findIndex((_,i)=>!state.reflection.responses[i]?.trim());if(missing!==-1){$('reflectionError').textContent=`Please answer reflection question ${missing+1} before exporting or continuing.`;$('reflection-'+missing).focus();return false;}state.reflection.completedAt=new Date().toISOString();save();return true;}
 $('exportUnitPDF').onclick=async()=>{if(!validate())return;const button=$('exportUnitPDF');button.disabled=true;button.textContent='Preparing PDF…';try{const report=unitReportModel(ch,state,campaign.student);const doc=makeUnitReportPDF(report,window.jspdf.jsPDF,window.AsterionReportFont);const url=URL.createObjectURL(doc.output('blob'));const a=document.createElement('a');a.href=url;let name=campaign.student.name.trim().replace(/[^\p{L}\p{N} _-]/gu,'').replace(/\s+/g,'_').slice(0,80)||'Student';a.download=`PHY2054C_Unit_${String(chapter).padStart(2,'0')}_${name}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);state.reflection.lastExportedAt=report.createdAt;save();$('reflectionSaveStatus').textContent='PDF download requested. Check your downloads, then upload the file to your course submission.';AudioEngine.fx('success');}catch(e){$('reflectionError').textContent='The PDF could not be generated. Your responses remain in the form. Please try again.';console.error('Unit PDF export failed',e);}finally{button.disabled=false;button.textContent='Export unit PDF report';}};
 $('finishReflection').onclick=()=>{if(!validate())return;close();if(atExit&&chapter===s.chapter)completeCampaignExit();else journal();};
}
if(typeof module!=='undefined')module.exports={UNIT_REFLECTIONS,reflectionsReady,unitReportModel,makeUnitReportPDF};
