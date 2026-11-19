/* Experimental offline Ruida .rd encoder: ONE rectangular CUT path only.
 * NEVER transmit these bytes directly to the controller.
 * Uses reverse-engineered command sequences; machine origin, firmware and
 * actual behavior have not been validated for the KT332N.
 * Reference LightBurn position fields can use a center anchor: center (25,15), size
 * (40,20) resolves to bounds (5,5)–(45,25). This compiler expects bounds
 * expressed as minimum X/Y plus width/height in the job coordinate system.
 * No USB access, motion or laser control methods are present in this module.
 */
(function(root){
'use strict';
const MAX_BYTES=25000;
function assert(condition,message){if(!condition)throw Error(message)}
function number(value,min,max,name){
 assert(typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max,name+' out of range');
 return value;
}
function base128(num,count){
 assert(Number.isInteger(num)&&num>=0&&num<Math.pow(128,count),'Base128 number out of range');
 const out=Array(count);
 for(let i=count-1;i>=0;i--){out[i]=num%128;num=Math.floor(num/128)}
 return out;
}
function mm(value){return base128(Math.round(number(value,0,1000,'Coordinate')*1000),5)}
function power(percent){return base128(Math.floor(number(percent,0,100,'Power')*16383/100),2)}
function speed(value){return mm(number(value,0.1,1000,'Speed'))}
function color(rgb){assert(Array.isArray(rgb)&&rgb.length===3&&rgb.every(v=>Number.isInteger(v)&&v>=0&&v<=255),'Color invalid');return base128((rgb[2]<<16)|(rgb[1]<<8)|rgb[0],5)}
function swapMagic(byte){
 let b=byte&255;
 b^=b>>7;b^=(b<<7)&255;b^=b>>7;b^=0x88;
 return (b+1)&255;
}
function unMagic(byte){
 let b=(byte-1)&255;b^=0x88;b^=b>>7;b^=(b<<7)&255;b^=b>>7;return b&255;
}
class Builder{
 constructor(){this.buf=[]}
 put(...values){for(const v of values){assert(Number.isInteger(v)&&v>=0&&v<=255,'Invalid command byte');this.buf.push(v);assert(this.buf.length<=MAX_BYTES,'File too large')}return this}
 h(str){return this.put(...str.trim().split(/\s+/).map(x=>parseInt(x,16)))}
 n(value){return this.put(...mm(value))}
 p(value){return this.put(...power(value))}
 c(value){return this.put(...color(value))}
 xy(a,b){this.n(a);this.n(b);return this}
 bytes(){return Uint8Array.from(this.buf)}
}
function bounding(path){
 const x=path.x,y=path.y,w=path.w,h=path.h;
 for(const [v,name] of [[x,'X'],[y,'Y'],[w,'Width'],[h,'Height']])number(v,0,1000,name);
 assert(w>=1&&h>=1,'Rectangles must be at least 1 mm in each dimension');
 return {xmin:x,ymin:y,xmax:x+w,ymax:y+h};
}
function compileRectangle({geometry,profile,canvas}){
 assert(Array.isArray(geometry)&&geometry.length===1,'First RD compiler supports exactly one rectangle.');
 const obj=geometry[0];
 assert(obj&&obj.type==='rect'&&obj.layer==='cut','Only a rectangular CUT object is supported.');
 assert(canvas&&typeof canvas.w==='number'&&typeof canvas.h==='number','Missing material size');
 number(canvas.w,20,1000,'Canvas width');number(canvas.h,20,700,'Canvas height');
 const b=bounding(obj);
 assert(b.xmax<=canvas.w&&b.ymax<=canvas.h,'Cut extends outside the selected material.');
 assert(profile&&profile.verified===true&&profile.cut,'Instructor-published cut profile required.');
 const s=number(profile.cut.speed,0.1,1000,'Cut speed');
 const p=number(profile.cut.power,0,100,'Cut maximum power');
 const pMin=profile.cut.minPower===undefined?p:number(profile.cut.minPower,0,100,'Cut minimum power');
 assert(pMin<=p,'Minimum cut power cannot exceed maximum cut power');
 assert(profile.cut.passes===1,'This experimental compiler supports only one pass.');
 const out=new Builder();
 const box=(command,minx,miny,maxx,maxy)=>{
  out.h(command).xy(minx,miny);
  out.h('e7 00').xy(maxx,maxy); // replaced below only in intentional templates
 };
 // Main job header and global bounds.
 out.h('d8 12 f0 f1 02 00 d8 00');
 out.h('e7 06').xy(0,0);
 for(const [cmd,coords] of [
  ['e7 03',[b.xmin,b.ymin]],['e7 07',[b.xmax,b.ymax]],
  ['e7 50',[b.xmin,b.ymin]],['e7 51',[b.xmax,b.ymax]]
 ])out.h(cmd).xy(...coords);
 out.h('e7 04 00 01 00 01').xy(0,0);
 out.h('e7 05 00');
 // One layer. Power1 uses tested profile. Other laser outputs remain zero.
 out.h('c9 04 00').put(...speed(s));
 for(const [cmd,val] of [['c6 31 00',pMin],['c6 32 00',p],['c6 41 00',0],
  ['c6 42 00',0],['c6 35 00',0],['c6 36 00',0],
  ['c6 37 00',0],['c6 38 00',0]])out.h(cmd).p(val);
 out.h('ca 06 00').c([40,123,177]);
 out.h('ca 41 00 00');
 for(const [cmd,coords] of [
  ['e7 52 00',[b.xmin,b.ymin]],['e7 53 00',[b.xmax,b.ymax]],
  ['e7 61 00',[b.xmin,b.ymin]],['e7 62 00',[b.xmax,b.ymax]]
 ])out.h(cmd).xy(...coords);
 out.h('ca 22 00');
 out.h('e7 54 00').n(0);out.h('e7 54 01').n(0);
 out.h('e7 55 00').n(0);out.h('e7 55 01').n(0);
 out.h('f1 03').xy(0,0);
 out.h('f1 00 00 f1 01 00 f2 00 00 f2 01 00');
 out.h('f2 02 05 2a 39 1c 41 04 6a 15 08 20');
 for(const [cmd,coords] of [
  ['f2 03',[b.xmin,b.ymin]],['f2 04',[b.xmax,b.ymax]],
  ['f2 06',[b.xmin,b.ymin]]
 ])out.h(cmd).xy(...coords);
 out.h('f2 07 00');
 out.h('f2 05 00 01 00 01').xy(b.xmax,b.ymax);
 out.h('ea 00 e7 60 00');
 for(const [cmd,coords] of [
  ['e7 13',[b.xmin,b.ymin]],['e7 17',[b.xmax,b.ymax]],['e7 23',[b.xmin,b.ymin]]
 ])out.h(cmd).xy(...coords);
 out.h('e7 24 00 e7 08 00 01 00 01').xy(b.xmax,b.ymax);
 // Body layer prolog.
 out.h('ca 01 00 ca 02 00 ca 01 30 ca 01 10 ca 01 13');
 out.h('c9 02').put(...speed(s));
 out.h('c6 15').n(0);out.h('c6 16').n(0);
 for(const [cmd,val] of [
  ['c6 01',pMin],['c6 02',p],['c6 21',0],['c6 22',0],
  ['c6 05',0],['c6 06',0],['c6 07',0],['c6 08',0]
 ])out.h(cmd).p(val);
 out.h('ca 03 01 ca 10 00');
 // Position with laser off, followed by four cutting movements.
 out.h('88').xy(b.xmin,b.ymin);
 out.h('a8').xy(b.xmax,b.ymin);
 out.h('a8').xy(b.xmax,b.ymax);
 out.h('a8').xy(b.xmin,b.ymax);
 out.h('a8').xy(b.xmin,b.ymin);
 // Job end; distance is recorded in meters.
 const length=2*((b.xmax-b.xmin)+(b.ymax-b.ymin));
 out.h('eb e7 00 da 01 06 20').n(length/1000).n(length/1000).h('d7');
 const plain=out.bytes();
 const scrambled=Uint8Array.from(plain,swapMagic);
 assert(scrambled.length===plain.length,'Scramble length mismatch');
 assert(scrambled.every((v,i)=>unMagic(v)===plain[i]),'Scramble validation failed');
 return {
  filenameExtension:'.rd',
  binary:scrambled,
  decoded:plain,
  info:{format:'Ruida RD experimental',validatedOnKT332N:false,transferEnabled:false,
   layers:1,objects:1,segments:4,operation:'cut',cutLengthMm:length,
   boundsMm:{minX:b.xmin,minY:b.ymin,maxX:b.xmax,maxY:b.ymax},
   speedMmPerSec:s,minPowerPercent:pMin,maxPowerPercent:p,powerPercent:p,passes:1,byteLength:scrambled.length}
 };
}
root.LockwoodRuidaRD=Object.freeze({compileRectangle,decode:bytes=>Uint8Array.from(bytes,unMagic),version:1});
})(window);
