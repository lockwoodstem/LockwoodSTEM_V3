/* LockwoodSTEM Vision Training — browser-only IndexedDB data layer. */
(()=>{
const DATABASE="lockwoodstem-custom-vision",VERSION=1;
let dbPromise;
function open(){
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DATABASE,VERSION);
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains("classes"))db.createObjectStore("classes",{keyPath:"id"});
   if(!db.objectStoreNames.contains("images")){
    const store=db.createObjectStore("images",{keyPath:"id"});
    store.createIndex("classId","classId");
   }
  };
  request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result)};
  request.onerror=()=>reject(request.error||new Error("Unable to open browser dataset storage"));
  request.onblocked=()=>reject(new Error("Close other Studio training tabs and reload"));
 }).catch(err=>{dbPromise=null;throw err});
 return dbPromise;
}
async function perform(table,mode,method,value){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const transaction=db.transaction(table,mode),store=transaction.objectStore(table);
  let output;
  const request=method==="getAll"?store.getAll():method==="delete"?store.delete(value):store.put(value);
  request.onsuccess=()=>{output=request.result};
  request.onerror=()=>reject(request.error||new Error("Storage operation failed"));
  transaction.oncomplete=()=>resolve(output);
  transaction.onerror=()=>reject(transaction.error||new Error("Storage transaction failed"));
  transaction.onabort=()=>reject(transaction.error||new Error("Storage operation cancelled"));
 });
}
const uid=()=>crypto.randomUUID();
window.VisionStore={
 open,
 uid,
 classes:()=>perform("classes","readonly","getAll"),
 images:()=>perform("images","readonly","getAll"),
 saveClass:c=>perform("classes","readwrite","put",c),
 saveImage:i=>perform("images","readwrite","put",i),
 deleteClass:id=>perform("classes","readwrite","delete",id),
 deleteImage:id=>perform("images","readwrite","delete",id),
 async clearAll(){
  const images=await this.images(),classes=await this.classes();
  for(const x of images)await this.deleteImage(x.id);
  for(const c of classes)await this.deleteClass(c.id);
 }
};
})();