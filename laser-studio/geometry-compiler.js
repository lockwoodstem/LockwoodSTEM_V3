/* LockwoodSTEM geometry-only path compiler.
   No Ruida encoding, USB access, laser-on, motion, or executable machine commands.
   Contract: millimeters, bounded vector paths, explicit unsupported objects.
*/
(function(root){
"use strict";
const VERSION=1,MAX_OBJECTS=500,MAX_SEGMENTS=24000,MAX_COORD=1000;
function fail(m){throw new Error(m)}
function finite(x){return typeof x==="number"&&Number.isFinite(x)}
function xy(x,y){if(!finite(x)||!finite(y)||Math.abs(x)>MAX_COORD||Math.abs(y)>MAX_COORD)fail("Invalid geometry coordinate");return [Math.round(x*1000)/1000,Math.round(y*1000)/1000]}
function pointsFor(o){
 const x=o.x,y=o.y,w=o.w,h=o.h;
 if(![x,y,w,h].every(finite))fail("Non-numeric object dimension");
 if(o.type==="rect"){
  if(w<=0||h<=0)fail("Rectangle dimensions must be positive");
  return [xy(x,y),xy(x+w,y),xy(x+w,y+h),xy(x,y+h),xy(x,y)];
 }
 if(o.type==="line"){
  if(Math.hypot(w,h)<.1)fail("Line too short");
  return [xy(x,y),xy(x+w,y+h)];
 }
 if(o.type==="circle"){
  if(w<=0||h<=0)fail("Ellipse dimensions must be positive");
  const rx=w/2,ry=h/2;
  // Max sagitta under 0.05 mm for larger axes, minimum 32 sides.
  const radius=Math.max(rx,ry),theta=2*Math.acos(Math.max(-1,Math.min(1,1-.05/radius)));
  const sides=Math.min(1024,Math.max(32,Math.ceil(2*Math.PI/theta)));
  const pts=[];
  for(let i=0;i<=sides;i++){let a=i*2*Math.PI/sides;pts.push(xy(x+rx+rx*Math.cos(a),y+ry+ry*Math.sin(a)))}
  return pts;
 }
 fail("Unsupported object: "+o.type+". Text is not outlined.");
}
function compile({items,canvas}){
 if(!Array.isArray(items)||items.length>MAX_OBJECTS)fail("Too many objects");
 if(!canvas||![canvas.w,canvas.h].every(finite)||canvas.w<20||canvas.h<20||canvas.w>1000||canvas.h>700)fail("Invalid canvas size");
 const grouped={engrave:[],cut:[]};
 let segments=0,travel=0,cutLength=0,engraveLength=0;
 for(const obj of items){
  if(!obj||!["cut","engrave"].includes(obj.layer))fail("Unknown operation layer");
  if(obj.type==="text")fail("Text must be converted to vector outlines in a later stage; current job compiler rejects fonts.");
  const pts=pointsFor(obj);
  segments+=pts.length-1;
  if(segments>MAX_SEGMENTS)fail("Too many generated segments");
  for(const [x,y] of pts)if(x<0||y<0||x>canvas.w||y>canvas.h)fail("Object "+obj.id+" outside material bounds");
  const length=pts.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1]),0);
  if(obj.layer==="cut")cutLength+=length;else engraveLength+=length;
  grouped[obj.layer].push({sourceId:obj.id,type:obj.type,closed:obj.type!=="line",points:pts,lengthMm:Math.round(length*1000)/1000});
 }
 return {format:"lockwood-vector-ir",version:VERSION,units:"mm",machineExecutable:false,ruidaEncoded:false,canvas:{widthMm:canvas.w,heightMm:canvas.h},layers:grouped,metrics:{objects:items.length,segments,cutLengthMm:Math.round(cutLength*1000)/1000,engraveLengthMm:Math.round(engraveLength*1000)/1000}};
}
root.LockwoodLaserGeometry=Object.freeze({compile,version:VERSION});
})(window);
