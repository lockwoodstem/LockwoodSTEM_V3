/* LockwoodSTEM virtual controller — simulation ONLY.
 * No USB, WebSerial, WebUSB, network, physical machine commands or .rd loading.
 * Treat all browser files and material settings as untrusted for actual laser use.
 */
(function(root){
"use strict";
const states=Object.freeze({idle:"idle",reviewed:"reviewed",sent:"sent-to-simulator",framed:"virtual-frame-complete",finished:"virtual-job-complete"});
let state=states.idle,job=null;
function finite(v){return typeof v==="number"&&Number.isFinite(v)}
function box(items,canvas){
 if(!Array.isArray(items)||!items.length||items.length>500)throw Error("Add a design before testing.");
 if(!canvas||!finite(canvas.w)||!finite(canvas.h)||canvas.w<=0||canvas.h<=0)throw Error("Invalid material dimensions.");
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const o of items){
  if(!o||!["cut","engrave"].includes(o.layer)||!["rect","circle","line","text"].includes(o.type))throw Error("Unsupported geometry.");
  if(![o.x,o.y,o.w,o.h].every(finite))throw Error("Invalid object dimensions.");
  const x1=Math.min(o.x,o.x+o.w),x2=Math.max(o.x,o.x+o.w),y1=Math.min(o.y,o.y+o.h),y2=Math.max(o.y,o.y+o.h);
  if(x1<0||y1<0||x2>canvas.w||y2>canvas.h||x2===x1&&y2===y1)throw Error("Design extends outside the material or has zero size.");
  minX=Math.min(minX,x1);minY=Math.min(minY,y1);maxX=Math.max(maxX,x2);maxY=Math.max(maxY,y2);
 }
 return {minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};
}
function prepare({items,canvas,preset}){
 const b=box(items,canvas);
 const snap=JSON.parse(JSON.stringify({items,canvas,preset}));
 if(!preset||typeof preset.id!=="string")throw Error("Choose a material preset.");
 state=states.reviewed;
 job={...snap,bounds:b};
 return snapshot();
}
function send(){
 if(state!==states.reviewed||!job)throw Error("Review the design before virtual transfer.");
 state=states.sent;return snapshot();
}
function frame(){
 if(!job||![states.sent,states.framed].includes(state))throw Error("Send to the simulator before framing.");
 state=states.framed;return snapshot();
}
function start(){
 if(!job||state!==states.framed)throw Error("Complete the virtual frame before starting the virtual job.");
 state=states.finished;return snapshot();
}
function reset(){state=states.idle;job=null;return snapshot()}
function snapshot(){return {state,loaded:!!job,bounds:job?{...job.bounds}:null,objects:job?job.items.length:0,hardwareConnected:false,bytesTransmitted:0,virtualOnly:true}}
root.LockwoodLaserSimulator=Object.freeze({prepare,send,frame,start,reset,snapshot,states});
})(window);
