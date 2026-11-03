/* Opt-in browser inference, using the same model format as /lab/train/. */
declare global {interface Window {tf:any;cocoSsd:any;mobilenet:any;}}
const scripts=new Map<string,Promise<void>>();
function script(url:string){if(!scripts.has(url))scripts.set(url,new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=()=>resolve();s.onerror=()=>{scripts.delete(url);s.remove();reject(Error('Model library blocked by network'));};document.head.append(s);}));return scripts.get(url)!;}
export class VisionAI {
 private detector:any;private network:any;private model:any;
 mode:'off'|'objects'|'custom'='off';
 async load(mode:'objects'|'custom'){
  await script('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
  if(mode==='objects'){await script('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');this.detector??=await window.cocoSsd.load({base:'lite_mobilenet_v2'});}
  else{
   const model:any=await new Promise((resolve,reject)=>{const r=indexedDB.open('lockwoodstem-classifier-model',1);r.onupgradeneeded=()=>r.result.createObjectStore('models');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,t=db.transaction('models'),q=t.objectStore('models').get('current');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);t.oncomplete=()=>db.close();};});
   if(model?.format!=='lockwoodstem-classifier-v1'||model.featureExtractor?.name!=='mobilenet-v2'||model.featureExtractor.alpha!==.5||!Array.isArray(model.classes)||model.classes.length<2||model.classes.length>20||!model.classes.every((c:any)=>typeof c.name==='string'&&Array.isArray(c.center)&&c.center.length>100&&c.center.length<5000&&c.center.every(Number.isFinite)))throw Error('Train or import a compatible classifier in Model Builder first.');
   await script('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');this.network??=await window.mobilenet.load({version:2,alpha:.5});this.model=model;
  }
  this.mode=mode;
 }
 async predict(frame:ImageData){
  if(this.mode==='objects'){const items=await this.detector.detect(frame,12,.4);return {detections:items.map((x:any)=>({label:x.class,score:x.score,bbox:x.bbox})),predictions:[]};}
  if(this.mode==='custom'){
   const vector:number[]=window.tf.tidy(()=>{const t=window.tf.browser.fromPixels(frame),v=this.network.infer(t,true).flatten();return Array.from(v.div(v.norm().add(1e-8)).dataSync());});
   if(!this.model.classes.every((c:any)=>c.center.length===vector.length))throw Error("Classifier feature size is incompatible; retrain in Model Builder.");
   const logits=this.model.classes.map((c:any)=>c.center.reduce((s:number,v:number,i:number)=>s+v*vector[i],0));const max=Math.max(...logits),probs=logits.map((x:number)=>Math.exp((x-max)*10)),sum=probs.reduce((a:number,b:number)=>a+b,0);
   return {detections:[],predictions:this.model.classes.map((c:any,i:number)=>({label:c.name,score:probs[i]/sum})).sort((a:any,b:any)=>b.score-a.score)};
  }return {detections:[],predictions:[]};
 }
}
