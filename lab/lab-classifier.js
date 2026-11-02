/* Read a browser-trained image classifier and display live predictions in the Studio. */
(()=>{
const $=id=>document.getElementById(id);
const load=$("classifier-load"),stop=$("classifier-stop"),status=$("classifier-result"),camera=$("original");
if(!load||!stop||!status||!camera)return;
let network=null,model=null,timer=null,active=false,busy=false;
function readModel(){return new Promise((resolve,reject)=>{
 const request=indexedDB.open("lockwoodstem-classifier-model",1);
 request.onupgradeneeded=()=>request.result.createObjectStore("models");
 request.onerror=()=>reject(request.error);
 request.onsuccess=()=>{
  const db=request.result,transaction=db.transaction("models","readonly"),read=transaction.objectStore("models").get("current");
  read.onsuccess=()=>resolve(read.result);
  read.onerror=()=>reject(read.error);
  transaction.oncomplete=()=>db.close();
 };
})}
function valid(m){return m?.format==="lockwoodstem-classifier-v1"&&m.featureExtractor?.name==="mobilenet-v2"&&m.featureExtractor.alpha===.5&&Array.isArray(m.classes)&&m.classes.length>=2&&m.classes.length<=20&&m.classes.every(c=>typeof c.name==="string"&&Array.isArray(c.center)&&c.center.length>100&&c.center.length<5000&&c.center.every(x=>Number.isFinite(x)))}
function features(){
 return window.tf.tidy(()=>{
  const tensor=window.tf.browser.fromPixels(camera);
  const vector=network.infer(tensor,true).flatten();
  return Array.from(vector.div(vector.norm().add(1e-8)).dataSync());
 });
}
function predict(vector){
 const logits=model.classes.map(c=>c.center.reduce((s,v,i)=>s+v*vector[i],0));
 const max=Math.max(...logits),probs=logits.map(x=>Math.exp((x-max)*10)),sum=probs.reduce((a,b)=>a+b,0);
 return model.classes.map((c,i)=>({name:c.name,score:probs[i]/sum})).sort((a,b)=>b.score-a.score);
}
function halt(){active=false;if(timer)clearTimeout(timer);timer=null;load.disabled=false;stop.disabled=true}
async function loop(){
 if(!active||busy)return;
 if(camera.readyState<2||!camera.srcObject){status.textContent="Start the Studio webcam to classify live images.";timer=setTimeout(loop,700);return}
 busy=true;
 try{
 const result=predict(features());
 status.textContent=result.slice(0,3).map(x=>x.name+" "+(x.score*100).toFixed(1)+"%").join(" · ");
 window.dispatchEvent(new CustomEvent("lockwoodstem:custom-prediction",{detail:result.slice(0,5).map(x=>({label:x.name,score:x.score}))}));
 }catch(err){status.textContent="Classifier error: "+err;halt()}
 finally{busy=false}
 if(active)timer=setTimeout(loop,650);
}
load.onclick=async()=>{
 try{
  load.disabled=true;status.textContent="Loading saved classifier…";
  const stored=await readModel();if(!valid(stored))throw new Error("No compatible trained model saved. Open Model Builder to train or import one.");
  if(!window.tf||!window.mobilenet)throw new Error("TensorFlow.js or MobileNet unavailable on this network.");
  if(!network)network=await window.mobilenet.load({version:2,alpha:.5});
  model=stored;active=true;stop.disabled=false;await loop();
 }catch(err){status.textContent=String(err);halt()}
};
stop.onclick=()=>{halt();status.textContent="Custom classifier stopped."};
document.addEventListener("visibilitychange",()=>{if(document.hidden)halt()});
window.addEventListener("pagehide",halt);
})();