/* Offline local RD file inspector, focused on the verified rectangle reference.
 * Reads file bytes ONLY via File API; does not provide controller transport or execute jobs.
 * Reverse-engineered command interpretation is provisional; verify before machine operation.
 */
(function(root){
'use strict';
function fail(m){throw Error(m)}
function descramble(b){let x=(b-1)&255;x^=0x88;x^=x>>7;x^=(x<<7)&255;x^=x>>7;return x&255}
function findBytes(bytes,seq,start=0){for(let i=start;i<=bytes.length-seq.length;i++){let ok=true;for(let j=0;j<seq.length;j++)if(bytes[i+j]!==seq[j]){ok=false;break}if(ok)return i}return -1}
function base128(bytes,idx,count){if(idx<0||idx+count>bytes.length)fail('Truncated payload');let n=0;for(let j=0;j<count;j++){const v=bytes[idx+j];if(v>127)fail('Invalid base-128 byte');n=n*128+v}return n}
function xy(bytes,idx){return {x:base128(bytes,idx,5)/1000,y:base128(bytes,idx+5,5)/1000}}
function setting(bytes,op,kind){const i=findBytes(bytes,op);if(i<0)return null;return kind==='speed'?base128(bytes,i+op.length,5)/1000:Math.round(base128(bytes,i+op.length,2)*10000/16383)/100}
function inspect(data){
 if(!(data instanceof Uint8Array)||data.length<100||data.length>2000000)fail('Expected a small binary RD file');
 const raw=Uint8Array.from(data,descramble);
 const bmin=findBytes(raw,[0xe7,0x03]),bmax=findBytes(raw,[0xe7,0x07]);
 if(bmin<0||bmax<0)fail('Unsupported RD file: expected global bounds commands');
 const min=xy(raw,bmin+2),max=xy(raw,bmax+2);
 const speed=setting(raw,[0xc9,0x04,0x00],'speed');
 const minPower=setting(raw,[0xc6,0x31,0x00],'power');
 const maxPower=setting(raw,[0xc6,0x32,0x00],'power');
 const paths=[];const start=findBytes(raw,[0xca,0x03,0x01]);
 if(start>=0){let at=start+3;while(at<raw.length&&paths.length<2000){const code=raw[at];if(code!==0x88&&code!==0xa8)break;const next=xy(raw,at+1);paths.push({operation:code===0x88?'move-laser-off':'cut-vector',...next});at+=11}}
 const width=max.x-min.x,height=max.y-min.y;
 return {format:'ruida-rd-reference-inspection',offlineOnly:true,inputBytes:data.length,headerHex:Array.from(raw.slice(0,12),b=>b.toString(16).padStart(2,'0')).join(' '),boundsMm:{minX:min.x,minY:min.y,maxX:max.x,maxY:max.y,width,height},layerSettings:{speedMmPerSec:speed,minPowerPercent:minPower,maxPowerPercent:maxPower},paths,cutSegments:paths.filter(p=>p.operation==='cut-vector').length,notes:['Coordinates are encoded job-space coordinates and may differ from LightBurn design positions.','Speed/power fields are interpretations of known Ruida command patterns.','Offline inspection is not proof of safe controller execution.']};
}
root.LockwoodRDInspector=Object.freeze({inspect,version:1});
})(window);
