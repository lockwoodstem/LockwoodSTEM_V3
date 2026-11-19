/* Offline transfer staging only: no WebSerial/USB/UDP/network APIs.
 * This is NOT a driver. Importing an .rd file NEVER transmits or executes it.
 * The USB serial transport is intentionally not implemented here.
 */
(function(root){
"use strict";
const MAX=1048576;
function assert(x,msg){if(!x)throw Error(msg)}
function hex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join(" ")}
function chunkPlan(data,size=256){
 assert(data instanceof Uint8Array&&data.length>=100&&data.length<=MAX,"Select a supported RD file under 1 MB.");
 assert(Number.isInteger(size)&&size>=32&&size<=1024,"Invalid dry-run chunk size.");
 const plan=[];
 for(let start=0;start<data.length;start+=size){
  const slice=data.subarray(start,Math.min(data.length,start+size));
  plan.push({index:plan.length+1,start,end:start+slice.length,length:slice.length,firstBytes:hex(slice.subarray(0,Math.min(8,slice.length)))});
 }
 return plan;
}
function stageFile(bytes,inspector){
 assert(bytes instanceof Uint8Array,"Expected binary RD input");
 assert(inspector&&typeof inspector.inspect==="function","Reference inspector missing");
 const info=inspector.inspect(bytes);
 assert(info.cutSegments===4&&info.paths.length===5,"This first test only accepts a single four-edge rectangle");
 const bounds=info.boundsMm;
 assert(bounds.width>0&&bounds.height>0&&bounds.maxX<=700&&bounds.maxY<=500,"Reference job exceeds configured test workspace");
 assert(info.layerSettings.speedMmPerSec>0,"Cannot determine speed from RD file");
 const plan=chunkPlan(bytes,256);
 return Object.freeze({format:"ruida-serial-staging-dryrun-v1",bytes:bytes.length,chunks:plan.length,
  chunkPlan:plan,decodedInfo:info,simulatedResponses:plan.map(p=>({index:p.index,status:"SIMULATED_ACCEPT",realControllerAck:false})),
  serialPortOpened:false,serialBytesWritten:0,laserMoved:false,laserFired:false,hardwareUploadImplemented:false,
  warning:"This is a transfer staging model only, NOT a verified USB serial transport or an approved laser job."});
}
root.LockwoodRuidaTransferDryRun=Object.freeze({stageFile,chunkPlan,version:1});
})(window);
