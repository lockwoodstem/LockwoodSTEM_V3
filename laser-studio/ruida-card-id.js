/* Narrow Ruida card-ID diagnostic. NO movement, file, cut, power, or arbitrary command support.
 * Source: MeerK40t Ruida GET_SETTING MEM_CARD_ID (DA 00 05 7E);
 * EduTech Ruida USB notes (19200, 8N1, hardware flow) and byte-swizzle algorithm.
 * This is a protocol candidate: KT332N firmware and serial transport still require validation.
 */
(function(root){
"use strict";
const REQUEST=Object.freeze([0xda,0x00,0x05,0x7e]);
const MAGIC=0x88;
function swizzleByte(value,magic=MAGIC){let b=value&255;b^=b>>7;b^=(b<<7)&255;b^=b>>7;b^=magic;return (b+1)&255}
function unswizzleByte(value,magic=MAGIC){let b=(value-1)&255;b^=magic;b^=b>>7;b^=(b<<7)&255;b^=b>>7;return b&255}
function bytesToHex(arr){return Array.from(arr).map(v=>v.toString(16).padStart(2,"0")).join(" ")}
function makeCardIdRequest(){
 const out=Uint8Array.from(REQUEST.map(b=>swizzleByte(b)));
 // No UDP checksum: the USB serial path is a separate transport in the reference.
 if(out.length!==4||out.some(x=>!Number.isInteger(x)))throw Error("Invalid fixed Card ID request");
 return out;
}
function detectCardId(raw){
 if(!Array.isArray(raw)&&!(raw instanceof Uint8Array))throw Error("Invalid response bytes");
 if(raw.length>512)throw Error("Oversized response");
 const decoded=Array.from(raw,v=>unswizzleByte(v));
 // A response is DA 01 05 7E followed by 5 base-128 encoded value bytes.
 const candidates=[{kind:"swizzled",arr:decoded},{kind:"clear",arr:Array.from(raw)}];
 for(const c of candidates){
  for(let i=0;i+9<=c.arr.length;i++){
   const a=c.arr;
   if(a[i]!==0xda||a[i+1]!==0x01||a[i+2]!==0x05||a[i+3]!==0x7e)continue;
   const value=a.slice(i+4,i+9);
   if(value.some(b=>b>127))continue;
   let card=0;
   for(const b of value)card=card*128+b;
   if(!Number.isSafeInteger(card))continue;
   const upper=(card>>>16)&0xffff,lower=card&0xffff;
   const repeatedHalves=upper===lower;
   return {matched:true,encoding:c.kind,cardId:"0x"+card.toString(16).toUpperCase().padStart(8,"0"),repeatedHalves,cardId16:"0x"+lower.toString(16).toUpperCase().padStart(4,"0"),responseBytes:raw.length,rawHex:bytesToHex(raw),decodedHex:bytesToHex(a),offset:i,ackSeen:a.includes(0xcc),note:repeatedHalves?"Ruida Card ID value has two matching 16-bit halves; consistent with documented replies.":"Card ID value does not have matching halves; verify against a second capture."};
  }
 }
 return {matched:false,decodedHex:bytesToHex(decoded),rawHex:bytesToHex(raw),ackSeen:decoded.includes(0xcc),reason:"No complete DA 01 05 7E card-ID reply matched."};
}
root.LockwoodRuidaCardId=Object.freeze({request:makeCardIdRequest,decode:detectCardId,swizzleByte,unswizzleByte,bytesToHex,settings:Object.freeze({baudRate:19200,dataBits:8,stopBits:1,parity:"none",flowControl:"hardware"})});
})(window);
