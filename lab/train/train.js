(()=>{
const $=id=>document.getElementById(id),store=window.VisionStore;
let classes=[],images=[],cameraStream=null,featureNet=null,trained=null,liveTimer=null,working=false,annotationImage=null,drag=null;
const status=text=>$("global-status").textContent=text;
const uid=()=>store.uid();
const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)};
const escape=s=>String(s).replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
const nameOf=id=>classes.find(c=>c.id===id)?.name||"Unknown";
function optionList(){return classes.map(c=>'<option value="'+escape(c.id)+'">'+escape(c.name)+'</option>').join("")}
async function refresh(){
 classes=(await store.classes()).sort((a,b)=>a.created-b.created);
 images=await store.images();
 $("classes").innerHTML=classes.map(c=>'<div class="train-class"><span>'+escape(c.name)+' · '+images.filter(i=>i.classId===c.id).length+' images</span><button data-delete-class="'+c.id+'" class="btn-small">Remove</button></div>').join("")||'<p class="lab-card-note">Create your first image category.</p>';
 $("target-class").innerHTML=optionList();$("annotation-class").innerHTML=optionList();
 $("dataset-count").textContent=images.length+" images · "+classes.length+" categories";
 $("annotation-image").innerHTML=images.map(i=>'<option value="'+i.id+'">'+escape(nameOf(i.classId))+' · '+i.id.slice(0,7)+'</option>').join("");
 $("gallery").replaceChildren(...images.slice(-120).map(i=>{
  const box=document.createElement("div");box.className="train-thumb";
  const pic=document.createElement("img");pic.alt=nameOf(i.classId);pic.src=i.dataUrl;
  const del=document.createElement("button");del.textContent="×";del.title="Delete image";del.onclick=async()=>{await store.deleteImage(i.id);await refresh()};
  box.append(pic,del);return box;
 }));
 $("classes").querySelectorAll("[data-delete-class]").forEach(btn=>btn.onclick=async()=>{
  const id=btn.dataset.deleteClass;
  if(!confirm("Remove this class and its collected images?"))return;
  for(const image of images.filter(i=>i.classId===id))await store.deleteImage(image.id);
  await store.deleteClass(id);await refresh();
 });
 if(images.length){if(!images.find(i=>i.id===annotationImage))annotationImage=images[0].id;$("annotation-image").value=annotationImage;}
 else annotationImage=null;
 await drawAnnotations();
}
$("add-class").onclick=async()=>{
 const name=$("class-name").value.trim();
 if(!name||name.length>40)return status("Enter a class name of 1–40 characters.");
 if(classes.some(c=>c.name.toLowerCase()===name.toLowerCase()))return status("Class names must be unique.");
 if(classes.length>=20)return status("Maximum 20 classes per dataset.");
 await store.saveClass({id:uid(),name,created:Date.now()});$("class-name").value="";await refresh();
};
const c=document.createElement("canvas");c.width=c.height=224;const cc=c.getContext("2d",{willReadFrequently:true});
async function imageFromData(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error("Image could not be decoded"));im.src=url})}
async function normalizeImage(fileOrCanvas){
 let source;
 if(fileOrCanvas instanceof Blob){
  if(fileOrCanvas.size>10*1024*1024)throw new Error("Image exceeds 10 MB");
  const object=URL.createObjectURL(fileOrCanvas);
  try{source=await imageFromData(object)}finally{URL.revokeObjectURL(object)}
 }else source=fileOrCanvas;
 cc.clearRect(0,0,224,224);
 const w=source.videoWidth||source.width,h=source.videoHeight||source.height;
 if(!w||!h)throw new Error("Image has invalid dimensions");
 const scale=Math.max(224/w,224/h),sw=w*scale,sh=h*scale;
 cc.drawImage(source,(224-sw)/2,(224-sh)/2,sw,sh);
 return c.toDataURL("image/jpeg",.82);
}
async function addImage(source){
 const classId=$("target-class").value;if(!classes.some(x=>x.id===classId))throw new Error("Choose a category first");
 if(images.length>=600)throw new Error("Maximum 600 images; export your dataset before adding more");
 const url=await normalizeImage(source);
 await store.saveImage({id:uid(),classId,dataUrl:url,created:Date.now(),boxes:[]});
}
$("upload").onchange=async e=>{
 try{for(const file of Array.from(e.target.files||[]).slice(0,100)){
 if(!["image/jpeg","image/png","image/webp"].includes(file.type))continue;
 await addImage(file);
 }await refresh();status("Images imported into browser storage.");}
 catch(err){status(String(err))}finally{e.target.value=""}
};
const video=$("camera-preview");
$("camera").onclick=async()=>{
 if(cameraStream){stopCamera();return}
 try{cameraStream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480},audio:false});
 video.srcObject=cameraStream;await video.play();$("camera").textContent="Stop camera";$("capture").disabled=false;status("Webcam ready. Choose a category and capture training examples.");}
 catch(err){stopCamera();status("Camera permission failed: "+err)}
};
function stopCamera(){if(liveTimer)clearTimeout(liveTimer);liveTimer=null;cameraStream?.getTracks().forEach(t=>t.stop());cameraStream=null;video.srcObject=null;$("camera").textContent="Start camera";$("capture").disabled=true;$("predict").textContent="Start live prediction"}
$("capture").onclick=async()=>{try{await addImage(video);await refresh();status("Captured a training image.")}catch(err){status(String(err))}};
async function loadNet(){
 if(featureNet)return featureNet;
 if(!window.tf||!window.mobilenet)throw new Error("MobileNet or TensorFlow.js blocked by the network");
 status("Downloading MobileNet feature extractor…");
 featureNet=await window.mobilenet.load({version:2,alpha:.5});return featureNet;
}
async function embedding(source){
 const net=await loadNet();
 return window.tf.tidy(()=>{
  const pixels=window.tf.browser.fromPixels(source);
  const vector=net.infer(pixels,true).flatten();
  const norm=vector.div(vector.norm().add(1e-8));
  return Array.from(norm.dataSync());
 });
}
function similarity(a,b){let score=0;for(let k=0;k<a.length;k++)score+=a[k]*b[k];return score}
function predict(vector,model){
 const logits=model.classes.map(o=>similarity(vector,o.center));
 const peak=Math.max(...logits),values=logits.map(v=>Math.exp((v-peak)*10)),sum=values.reduce((a,b)=>a+b,0);
 return model.classes.map((o,i)=>({label:o.name,score:values[i]/sum})).sort((a,b)=>b.score-a.score);
}
async function train(){
 if(working)return;working=true;$("train").disabled=true;
 try{
  if(classes.length<2)throw new Error("Create at least two categories.");
  for(const cls of classes){if(images.filter(i=>i.classId===cls.id).length<5)throw new Error("Collect at least five images per class. Aim for 50–100.");
  }
  await loadNet();
  const rows=[];let count=0;
  for(const im of images){
   status("Computing image features "+(++count)+"/"+images.length+"…");
   const picture=await imageFromData(im.dataUrl);
   rows.push({classId:im.classId,vector:await embedding(picture)});
   if(count%8===0)await new Promise(resolve=>setTimeout(resolve,0));
  }
  const trainRows=[],testRows=[];
  // Deterministic seeded split within each class to ensure every class has a held-out set.
  for(const cls of classes){
   const subset=rows.filter(r=>r.classId===cls.id);
   subset.forEach((r,i)=>(i%5===0?testRows:trainRows).push(r));
  }
  const centers=classes.map(cls=>{
   const vectors=trainRows.filter(x=>x.classId===cls.id).map(x=>x.vector);
   const center=new Array(vectors[0].length).fill(0);
   vectors.forEach(v=>v.forEach((x,j)=>center[j]+=x/vectors.length));
   const magnitude=Math.hypot(...center)||1;
   return {name:cls.name,center:center.map(x=>x/magnitude),samples:vectors.length};
  });
  trained={format:"lockwoodstem-classifier-v1",created:new Date().toISOString(),featureExtractor:{name:"mobilenet-v2",version:2,alpha:.5,embedding:true},classes:centers};
  let correct=0;const matrix=classes.map(()=>new Array(classes.length).fill(0));
  for(const row of testRows){
   const pred=predict(row.vector,trained)[0].label,actual=nameOf(row.classId);
   const ai=classes.findIndex(c=>c.name===actual),pi=classes.findIndex(c=>c.name===pred);
   matrix[ai][pi]++;if(actual===pred)correct++;
  }
  const pct=correct/testRows.length*100;
  $("training-result").textContent="Model trained. Held-out accuracy: "+pct.toFixed(1)+"% ("+correct+"/"+testRows.length+").";
  $("metrics").textContent="Training: "+trainRows.length+" images · Testing: "+testRows.length+" images · Accuracy is an estimate, not a safety guarantee.";
  $("export-model").disabled=false;$("predict").disabled=false;
  await saveModel(trained);
  status("Classifier saved for use in the Programming Studio.");
 }catch(err){status(String(err));$("training-result").textContent="Training stopped: "+err}
 finally{working=false;$("train").disabled=false}
}
$("train").onclick=train;
function validateModel(m){return m?.format==="lockwoodstem-classifier-v1"&&m?.featureExtractor?.name==="mobilenet-v2"&&m.featureExtractor.alpha===.5&&Array.isArray(m.classes)&&m.classes.length>=2&&m.classes.length<=20&&m.classes.every(c=>typeof c.name==="string"&&c.name.length<100&&Array.isArray(c.center)&&c.center.length>100&&c.center.length<5000&&c.center.every(x=>typeof x==="number"&&Number.isFinite(x)))}
async function saveModel(m){await new Promise((resolve,reject)=>{const req=indexedDB.open("lockwoodstem-classifier-model",1);req.onupgradeneeded=()=>req.result.createObjectStore("models");req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction("models","readwrite");tx.objectStore("models").put(m,"current");tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}}})}
$("export-model").onclick=()=>trained&&download(new Blob([JSON.stringify(trained)],{type:"application/json"}),"lockwoodstem-classifier.json");
$("import-model").onchange=async e=>{try{const file=e.target.files?.[0];if(!file||file.size>2e6)throw new Error("Choose a model JSON under 2 MB");
 const m=JSON.parse(await file.text());if(!validateModel(m))throw new Error("Unrecognized classifier format");
 trained=m;await saveModel(m);$("export-model").disabled=$("predict").disabled=false;$("training-result").textContent="Imported model: "+m.classes.map(c=>c.name).join(", ");
 }catch(err){status(String(err))}finally{e.target.value=""}};
$("predict").onclick=async()=>{
 if(liveTimer){clearTimeout(liveTimer);liveTimer=null;$("predict").textContent="Start live prediction";return}
 if(!trained||!cameraStream)return status("Start camera and train or import a classifier first.");
 try{await loadNet();$("predict").textContent="Stop live prediction";
  const loop=async()=>{if(!cameraStream||!trained)return;
   try{const vector=await embedding(video),results=predict(vector,trained);
    $("prediction").textContent=results.slice(0,3).map(p=>p.label+": "+(p.score*100).toFixed(1)+"%").join(" · ");
   }catch(err){status(String(err))}
   if(cameraStream)liveTimer=setTimeout(loop,600);
  };await loop();
 }catch(err){status(String(err))}
};
// Annotation workspace stores normalized bounding rectangles for images.
const canvas=$("annotator"),context=canvas.getContext("2d");
$("annotation-image").onchange=async e=>{annotationImage=e.target.value;await drawAnnotations()};
async function drawAnnotations(){
 const record=images.find(i=>i.id===annotationImage);
 context.clearRect(0,0,canvas.width,canvas.height);
 if(!record){$("boxes").textContent="Select an image to annotate.";return}
 const img=await imageFromData(record.dataUrl);
 canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
 context.drawImage(img,0,0,canvas.width,canvas.height);
 for(const box of record.boxes||[]){
  const [x,y,w,h]=box.bbox;
  context.strokeStyle="#f2bd53";context.lineWidth=2;context.strokeRect(x,y,w,h);
  context.fillStyle="#f2bd53";context.font="12px sans-serif";context.fillText(nameOf(box.classId),x+2,Math.max(12,y-4));
 }
 $("boxes").textContent=(record.boxes||[]).length+" boxes annotated. Drag within the image to add another.";
}
function point(e){const rect=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(canvas.width,(e.clientX-rect.left)*canvas.width/rect.width)),y:Math.max(0,Math.min(canvas.height,(e.clientY-rect.top)*canvas.height/rect.height))}}
canvas.onpointerdown=e=>{if(!annotationImage)return;drag=point(e);canvas.setPointerCapture(e.pointerId)};
canvas.onpointerup=async e=>{
 if(!drag)return;const end=point(e),x=Math.round(Math.min(drag.x,end.x)),y=Math.round(Math.min(drag.y,end.y)),w=Math.round(Math.abs(drag.x-end.x)),h=Math.round(Math.abs(drag.y-end.y));drag=null;
 const record=images.find(i=>i.id===annotationImage);if(!record||w<5||h<5)return;
 record.boxes=[...(record.boxes||[]),{classId:$("annotation-class").value,bbox:[x,y,w,h]}];
 await store.saveImage(record);await drawAnnotations();
};
$("clear-boxes").onclick=async()=>{const record=images.find(i=>i.id===annotationImage);if(!record)return;record.boxes=[];await store.saveImage(record);await drawAnnotations()};
$("export-coco").onclick=async()=>{
 try{
  if(!images.length)throw new Error("Collect images first");
  if(!window.JSZip)throw new Error("ZIP library blocked");
  const zip=new JSZip(),categories=classes.map((c,i)=>({id:i+1,name:c.name}));
  const dataset={info:{description:"LockwoodSTEM annotated images"},images:[],annotations:[],categories};
  let count=0;
  for(const [i,item]of images.entries()){
   const filename="images/"+item.id+".jpg";
   zip.file(filename,item.dataUrl.split(",")[1],{base64:true});
   dataset.images.push({id:i+1,file_name:filename,width:224,height:224});
   for(const box of item.boxes||[]){
    const [x,y,w,h]=box.bbox;
    dataset.annotations.push({id:++count,image_id:i+1,category_id:classes.findIndex(c=>c.id===box.classId)+1,bbox:[x,y,w,h],area:w*h,iscrowd:0});
   }
  }
  zip.file("annotations.json",JSON.stringify(dataset,null,2));
  zip.file("README.txt","LockwoodSTEM COCO dataset. Images are 224x224 crops. Import into an object detection training platform; this export does not create a detector model.");
  const result=await zip.generateAsync({type:"blob"});download(result,"lockwoodstem-annotated-dataset.zip");status("COCO dataset ZIP exported.");
 }catch(err){status(String(err))}
};
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopCamera()});
window.addEventListener("pagehide",stopCamera);
refresh().catch(err=>status("Browser storage unavailable: "+err));
})();