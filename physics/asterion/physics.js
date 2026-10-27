(function(root){
const physics={
 near:(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<=Math.max(.015,Math.abs(b)*.02),
 series:(v,load,r)=>({current:v/(load+r),loadVoltage:v*load/(load+r),resistorPower:(v/(load+r))**2*r}),
 parallel:(v,r1,r2)=>({i1:v/r1,i2:v/r2,total:v/r1+v/r2,power:v*v/r1+v*v/r2}),
 valid:(...values)=>values.every(v=>Number.isFinite(v)&&v>=0)
};root.Physics=physics;if(typeof module!=='undefined')module.exports=physics;
})(typeof window!=='undefined'?window:globalThis);
