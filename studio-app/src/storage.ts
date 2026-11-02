export type Project = {id?:string; name:string;code:string;input:string;mode?:'once'|'live'};
let database:Promise<IDBDatabase>|undefined;
export function validProject(p:unknown):p is Project {const v=p as Project;return !!v&&typeof v.name==='string'&&typeof v.code==='string'&&v.code.length<=1048576&&typeof v.input==='string'&&(!v.mode||['once','live'].includes(v.mode));}
function open(){return database??=new Promise((resolve,reject)=>{
 const r=indexedDB.open('lockwoodstem-studio',2);
 r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects');const library=db.createObjectStore('library');const old=r.transaction!.objectStore('projects').get('current');old.onsuccess=()=>{if(validProject(old.result))library.put({...old.result,id:'migrated-current'},'migrated-current');};};
 r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close other Studio tabs and reload.'));
});}
export async function listProjects():Promise<Project[]>{const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction('library').objectStore('library').getAll();r.onsuccess=()=>resolve(r.result.filter(validProject));r.onerror=()=>reject(r.error);});}
export async function readProject():Promise<Project|undefined>{
 const db=await open();
 // Copy the old Unified Lab draft once, without deleting its localStorage source.
 let legacy:string|null=null;try{legacy=localStorage.getItem('lockwood_unified_studio');}catch{}
 if(legacy){try{const p=JSON.parse(legacy);if(typeof p.code==='string'&&p.code.length<=1048576){await new Promise<void>((resolve,reject)=>{const t=db.transaction('library','readwrite'),s=t.objectStore('library'),r=s.get('legacy-unified');r.onsuccess=()=>{if(!r.result)s.put({id:'legacy-unified',name:'Recovered Unified Lab.py',code:p.code,input:'',mode:'live'},'legacy-unified');};t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});}}catch{}}
 return new Promise((resolve,reject)=>{const r=db.transaction('projects').objectStore('projects').get('current');r.onsuccess=()=>{if(r.result&&!validProject(r.result)){reject(Error('Unreadable saved project'));return;}resolve(r.result?{...r.result,id:r.result.id||'migrated-current'}:undefined);};r.onerror=()=>reject(r.error);});
}
export async function saveProject(project:Project){const db=await open();return new Promise<void>((resolve,reject)=>{const t=db.transaction(['projects','library'],'readwrite');t.objectStore('projects').put(project,'current');t.objectStore('library').put(project,project.id||'default');t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
export function pythonFilename(value:string){const name=value.replace(/[^a-zA-Z0-9_.-]/g,'_').replace(/^\.+/,'').slice(0,100)||'main';return name.toLowerCase().endsWith('.py')?name:`${name}.py`;}
