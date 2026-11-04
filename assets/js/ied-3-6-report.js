/* IED 3.6: concept-specific report and merged sketch PDF */
(()=>{
'use strict';
document.addEventListener('DOMContentLoaded',()=>{
const root=document.getElementById('lesson-report'),L=window.LockwoodLearning;
if(!root||!L)return;
const $=id=>root.querySelector('#'+id);
const status=$('rocket-report-status');
const button=$('rocket-generate');
const front=$('rocket-front'),iso=$('rocket-iso'),extra=$('rocket-extra');
const imageList=[$('rocket-front'),$('rocket-iso'),$('rocket-extra')];
const fields=[
['rocket-modules','Printed modules and assembly arrangement'],
['rocket-joints','Two detachable interfaces and connections'],
['rocket-fin-count','Number of fins'],
['rocket-fin-material','Laser-cut fin material'],
['rocket-fin-plan','Fin spacing, location and retention'],
['rocket-launcher','Launch tube bore and clearance'],
['rocket-print-plan','Manufacturing and support-free print plan'],
['rocket-constraints','Design checks and outstanding questions']
];
const toolbar=L.draftToolbar();root.querySelector('h2').after(toolbar);
L.attachDraft(root,toolbar);
function esc(s){return L.esc(s);}
function chosen(){
return [{file:front.files[0],label:'Front-view annotated sketch'},{file:iso.files[0],label:'Isometric annotated sketch'},...Array.from(extra.files).map((file,i)=>({file,label:'Additional annotated detail '+(i+1)}))].filter(x=>x.file);
}
function update(){
const img=chosen(),summary=$('rocket-image-summary'),prev=$('rocket-image-previews');
summary.textContent=img.length+' image(s) selected for the combined PDF. Files remain on this device until exported.';
prev.replaceChildren();
img.forEach(({file,label})=>{
const card=document.createElement('div');card.style.cssText='width:170px;max-width:100%;border:1px solid #a4adba;border-radius:8px;padding:6px';
const pic=document.createElement('img');const url=URL.createObjectURL(file);pic.src=url;pic.alt=label;pic.style.cssText='width:100%;height:115px;object-fit:contain';pic.onload=()=>URL.revokeObjectURL(url);
const t=document.createElement('small');t.textContent=label+': '+file.name;
card.append(pic,t);prev.append(card);
});
}
imageList.forEach(el=>el.addEventListener('change',()=>{
if(el===extra&&extra.files.length>4){extra.value='';status.textContent='Select up to four additional screenshots.';}
else status.textContent='';
update();
}));
const readImage=file=>new Promise((resolve,reject)=>{
if(!/^image\/(png|jpeg|webp)$/.test(file.type)){reject(new Error('Use PNG, JPG, or WebP sketch screenshots.'));return;}
if(file.size>15*1024*1024){reject(new Error('Each image must be under 15 MB.'));return;}
const image=new Image(),url=URL.createObjectURL(file);
image.onload=()=>{
URL.revokeObjectURL(url);
try{
const scale=Math.min(1,2200/Math.max(image.naturalWidth,image.naturalHeight));
const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
resolve({data:canvas.toDataURL('image/jpeg',0.88),width:canvas.width,height:canvas.height});
}catch(err){reject(err);}
};
image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not open image '+file.name));};
image.src=url;
});
function filename(name){
const words=name.trim().split(/\s+/).map(s=>s.replace(/[^a-z0-9-]/gi,'')).filter(Boolean);
const first=words.length>1?words[0]:'Student',last=words.length>1?words.slice(1).join(''):(words[0]||'Student');
return last+'_'+first+'_3_6_Concept.pdf';
}
function wrap(doc,text,maxW=175){return doc.splitTextToSize(text||'Not provided',maxW);}
button.addEventListener('click',async()=>{
const required=Array.from(root.querySelectorAll('input[required],textarea[required],select[required]'));
for(const f of required){if(!f.checkValidity()){f.reportValidity();return;}}
if(extra.files.length>4){status.textContent='Select up to four additional screenshots.';return;}
button.disabled=true;status.textContent='Processing sketches and creating combined PDF…';
try{
const imageData=[];
for(const item of chosen())imageData.push({...item,...await readImage(item.file)});
await L.loadPDF();
const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'});
if(window.AsterionReportFont){doc.addFileToVFS('DejaVuSans.ttf',window.AsterionReportFont);doc.addFont('DejaVuSans.ttf','Report','normal');doc.setFont('Report');}
let y=19;
function newPage(){doc.addPage();y=19;}
function write(text,size=10,space=3){
doc.setFontSize(size);
const rows=wrap(doc,text);
for(const row of rows){if(y>272)newPage();doc.text(row,18,y);y+=Math.max(5,size*0.53);}y+=space;
}
write('LockwoodSTEM | IED 3.6',15,2);
write('Modular Rocket Concept Design Report',14,4);
write('Student: '+$('learning-name').value.trim(),11,1);
write('Class / period: '+$('learning-course').value.trim(),10,6);
write('Concept design requirements',12,2);
for(const [id,title] of fields){if(y>253)newPage();write(title,11,1);write($(id).value.trim()||'Not provided',10,4);}
write('Annotated concept sketches',12,2);
write('Front and isometric views, followed by any additional detail views.',10,2);
for(const item of imageData){
newPage();
write(item.label,13,2);
write('Source: '+item.file.name,9,3);
const availableW=174,availableH=233;
const s=Math.min(availableW/item.width,availableH/item.height);
const w=item.width*s,h=item.height*s;
doc.addImage(item.data,'JPEG',18+(availableW-w)/2,y,w,h);
y+=h+5;
}
newPage();
write('Design review checklist',14,5);
for(const line of [
'Front and isometric sketches include labels for the nose/upper, hollow body, and lower/fin modules.',
'Both removable interfaces and their connection methods are identified.',
'Three or four fins, their material, and locating/retaining features are shown.',
'Launch tube opening and fit plan are identified.',
'Manufacturing approach and support-free print orientation are described.'
]){write('[ ] '+line,10,5);}
write('Submission: upload this single PDF to Google Classroom. No final Fusion model is due for Lesson 3.6.',10,3);
const count=doc.getNumberOfPages();
for(let page=1;page<=count;page++){doc.setPage(page);doc.setFontSize(8);doc.text('LockwoodSTEM  |  IED 3.6  |  '+page+' / '+count,18,287);}
const file=filename($('learning-name').value);
doc.save(file);
status.textContent='Created '+file+' with '+imageData.length+' embedded screenshot(s). Check Downloads, then upload the PDF to Google Classroom.';
}catch(err){status.textContent='PDF could not be created: '+(err?.message||String(err));}
finally{button.disabled=false;}
});
update();
});
})();