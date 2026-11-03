import {useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Editor} from './Editor';
import {Devices,type Frame,type VisionControl} from './Devices';
import {readProject,saveProject,listProjects,validProject,pythonFilename,type Project} from './storage';
import {examples} from './examples';
import './studio.css';
import {Hardware,type HardwareState} from './hardware';
import {Classroom} from './Classroom';
import {lessons,lessonProject,type Lesson} from './lessons';
type Status = 'loading'|'ready'|'running'|'stopped'|'error';
type Line = {kind:string; text:string};
function App() {
  const [requestedLesson,setRequestedLesson]=useState(()=>lessons.find(lesson=>lesson.id===new URLSearchParams(location.search).get('lesson')));
  function dismissRequestedLesson(){setRequestedLesson(undefined);const url=new URL(location.href);url.searchParams.delete('lesson');history.replaceState(null,'',url);}
  const [project,setProject]=useState<Project>({...examples[0],id:'default',mode:'once'});
  const [library,setLibrary]=useState<Project[]>([]),[camera,setCamera]=useState(false),[processed,setProcessed]=useState<Frame|null>(null),[frames,setFrames]=useState(0);
  const vision=useRef<VisionControl|null>(null),hardware=useRef(new Hardware()),live=useRef(false),frameTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const [hardwareState,setHardwareState]=useState<HardwareState>(hardware.current.state);
  const lastRun=useRef<Project|null>(null);
  const [restored,setRestored]=useState(false),[storageOK,setStorageOK]=useState(true),[saved,setSaved]=useState('Opening saved work…');
  const [status,setStatus]=useState<Status>('loading'),[lines,setLines]=useState<Line[]>([]),[fontSize,setFontSize]=useState(16),[plain,setPlain]=useState(false);
  const [notice,setNotice]=useState(''),[replace,setReplace]=useState<Project|null>(null);
  const worker=useRef<Worker|null>(null), generation=useRef(0),runtimeState=useRef<Status>('loading'), saveVersion=useRef(0), frame=useRef<Frame|null>(null),file=useRef<HTMLInputElement>(null),consoleEnd=useRef<HTMLDivElement>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const current=useRef(project);current.current=project;
  const append=useCallback((line:Line)=>setLines(old=>[...old,line].slice(-550)),[]);
  function state(value:Status) {runtimeState.current=value;setStatus(value);}
  function endDevices(){live.current=false;clearTimeout(frameTimer.current);hardware.current.stop();}
  function stop() {
    endDevices();vision.current?.stop();
    generation.current++; worker.current?.terminate();worker.current=null;clearTimeout(timer.current);
    state('stopped');append({kind:'system',text:'Stopped. Python memory was cleared; your code is kept. Restart Python to run again.'});
  }
  function start() {
    endDevices();
    generation.current++;const id=generation.current;
    worker.current?.terminate();clearTimeout(timer.current);state('loading');
    try {
      const instance=new Worker(new URL('python-worker.js', document.baseURI));worker.current=instance;
      const fail=(text:string)=>{if(id!==generation.current)return;clearTimeout(timer.current);endDevices();instance.terminate();worker.current=null;state('error');append({kind:'stderr',text});};
      instance.onerror=()=>fail('Python worker could not start. Check your connection and restart Python.');
      timer.current=setTimeout(()=>fail('Python loading timed out. Check school network access to cdn.jsdelivr.net and restart Python.'),60000);
      instance.onmessage=({data})=>{
        if(id!==generation.current)return;
        if(data.type==='ready'){clearTimeout(timer.current);state('ready');}
        if(data.type==='output')append({kind:data.kind,text:data.text});
        if(data.type==='image'){setProcessed({data:new Uint8ClampedArray(data.data),width:data.width,height:data.height});}
        if(data.type==='configured'){scheduleFrame(id);}
        if(data.type==='frame-done'){setFrames(n=>n+1);scheduleFrame(id);}
        if(data.type==='hardware'){
          if(runtimeState.current!=='running')return;
          void hardware.current.command(data.command,data.value).then(value=>{if(id===generation.current)instance.postMessage({type:'hardware-result',id:data.id,value});}).catch(error=>{if(id===generation.current)instance.postMessage({type:'hardware-result',id:data.id,error:String(error)});});
        }
        if(data.type==='done'){endDevices();state('ready');append({kind:'system',text:data.success?'Program finished.':'Program ended with an error. Check the message above.'});}
        if(data.type==='fatal')fail(data.text);
      };
    } catch {state('error');append({kind:'stderr',text:'This browser could not create a Python worker. Try a current browser.'});}
  }
  function scheduleFrame(id:number){
    if(!live.current||id!==generation.current)return;
    frameTimer.current=setTimeout(async()=>{
      if(!live.current||id!==generation.current)return;
      const next=vision.current?.capture();if(!next){stop();return;}
      try{const predictions=await vision.current!.predict(next);
        if(!live.current||id!==generation.current)return;
        worker.current?.postMessage({type:'frame',frame:next,...predictions});
      }catch(error){append({kind:'stderr',text:String(error)});stop();}
    },1000/(vision.current?.fps()||7));
  }
  function run() {
    if(runtimeState.current!=='ready' || !worker.current)return;
    const lesson=lessons.find(l=>l.id===current.current.lesson?.id);
    if(lesson&&current.current.mode!==lesson.mode){setNotice(`Choose ${lesson.mode==='live'?'Live vision':'Program'} in Run mode for this lesson.`);return;}
    if(lesson?.hardware&&!hardware.current.state.armed){setNotice('Arm hardware in the Hardware lab before running this lesson. Start with Simulator.');return;}
    if(current.current.mode==='live'&&!camera){setNotice('Start the camera before Run live.');return;}
    lastRun.current={...current.current};
    live.current=current.current.mode==='live';setFrames(0);setProcessed(null);
    state('running');setLines([{kind:'system',text:`Running ${pythonFilename(current.current.name)}…`}]);
    worker.current.postMessage({type:live.current?'configure':'run',...current.current,name:pythonFilename(current.current.name),frame:frame.current});
  }
  useEffect(()=>{let alive=true;readProject().then(p=>{if(alive){if(p)setProject(p);void listProjects().then(setLibrary);setRestored(true);}}).catch(()=>{if(alive){setStorageOK(false);setSaved('Autosave unavailable — export your work');setRestored(true);}});start();return()=>{alive=false;endDevices();generation.current++;worker.current?.terminate();clearTimeout(timer.current);};},[]);
  useEffect(()=>{
    if(!restored || !storageOK)return;
    const revision=++saveVersion.current;setSaved('Saving…');
    saveProject(project).then(()=>{void listProjects().then(setLibrary);if(revision===saveVersion.current)setSaved('Saved on this browser');}).catch(()=>{if(revision===saveVersion.current)setSaved('Save failed — export your work');});
  },[project,restored,storageOK]);
  useEffect(()=>{const hide=()=>{if(document.hidden){stop();}};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',stop);return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',stop);};},[]);
  useEffect(()=>{const container=consoleEnd.current?.parentElement;if(container)container.scrollTop=container.scrollHeight;},[lines]);
  const edit=(patch:Partial<Project>)=>setProject(p=>({...p,...patch}));
  function download() {
    const url=URL.createObjectURL(new Blob([project.code],{type:'text/x-python;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=pythonFilename(project.name);a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice('Python file exported. Keep this copy for another device or your next class.');
  }
  async function openClassroomProject(next:Project){
    if(!storageOK){setNotice('Autosave is unavailable. Export your current work before opening a lesson in a browser with storage enabled.');return false;}
    try{await saveProject(current.current);setProject(next);setLines([]);setNotice('Opened a new project. Your previous program is kept in Saved projects.');return true;}catch{setNotice('Could not save your current work. Export it before opening a new lesson.');return false;}
  }
  function launchLesson(lesson:Lesson){void openClassroomProject(lessonProject(lesson));}
  function submission(){
    const data={format:'lockwoodstem-project-v2',exportedAt:new Date().toISOString(),project,console:lastRun.current!==null&&lastRun.current.id===project.id&&lastRun.current.code===project.code&&lastRun.current.input===project.input&&lastRun.current.mode===project.mode?lines.map(l=>l.text).join('\n'):'',lastRun:lastRun.current!==null&&lastRun.current.id===project.id?{name:lastRun.current.name,code:lastRun.current.code,input:lastRun.current.input,mode:lastRun.current.mode}:null};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=pythonFilename(project.name).replace(/\.py$/i,'.studio.json');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('Submission exported with code, input, mode and console. Upload this file to your teacher’s LMS.');
  }
  async function importFile(selected?:File) {
    if(!selected)return;
    if(!/\.(py|json)$/i.test(selected.name)){setNotice('Choose a Python (.py) or Studio (.json) file.');return;}
    if(selected.size>1024*1024){setNotice('Choose a Python file smaller than 1 MB.');return;}
    try {const text=await selected.text();if(selected.name.endsWith('.json')){const data=JSON.parse(text);if(data.format!=='lockwoodstem-project-v2'||!validProject(data.project))throw Error('Invalid project');setReplace({...data.project,id:crypto.randomUUID()});}else setReplace({id:crypto.randomUUID(),name:pythonFilename(selected.name),code:text,input:''});}catch{setNotice('The file could not be read. Please try again.');}
  }
  const busy=status==='loading'||status==='running';
  return <div className="studio-shell">
    <div className="studio-intro"><div><div className="eyebrow">Build · Run · Discover</div><h1>AI Programming Studio<span>Python · Vision · Robotics</span></h1><p>Your engineering ideas, running in your browser. No installation needed.</p></div><span className={'runtime '+status} role="status"><i />{status==='loading'?'Loading Python…':status==='running'?'Program running':status==='ready'?'Python ready':status==='stopped'?'Python stopped':'Python unavailable'}</span></div>
    <div className="studio-toolbar" aria-label="Program controls"><div className="button-row"><button className="run-button" disabled={status!=='ready'||!restored} onClick={run}>{project.mode==='live'?'▶ Run live':'▶ Run'}</button><button disabled={!busy} onClick={stop}>■ Stop</button><button disabled={status==='running'} onClick={start}>Restart Python</button><label>Run mode <select aria-label="Run mode" disabled={busy} value={project.mode||'once'} onChange={e=>edit({mode:e.target.value as 'once'|'live'})}><option value="once">Program</option><option value="live">Live vision</option></select></label><span className="keyboard-hint">Ctrl / ⌘ + Enter to run</span></div><div className="button-row"><button disabled={!restored||busy} onClick={()=>file.current?.click()}>Import project</button><button disabled={!restored} onClick={download}>Export .py</button><button disabled={!restored} onClick={submission}>Export submission</button><input hidden ref={file} type="file" accept=".py,.json,text/x-python,application/json" onChange={e=>{void importFile(e.target.files?.[0]);e.target.value='';}} /></div></div>
    <section className="project-bar studio-panel"><label>Saved projects <select aria-label="Saved projects" value={project.id||'default'} disabled={!restored||busy} onChange={e=>{const next=library.find(p=>p.id===e.target.value);if(next)setProject(next);}}>{!library.some(p=>p.id===project.id)&&<option value={project.id||'default'}>{project.name}</option>}{library.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button disabled={!restored||busy} onClick={()=>setProject({id:crypto.randomUUID(),name:'New project.py',code:'# Your next idea\n',input:'',mode:'once'})}>New project</button><button disabled={!restored||busy} onClick={()=>setProject({...project,id:crypto.randomUUID(),name:'Copy of '+project.name})}>Duplicate project</button><span>{frames} frames processed</span></section>
    {notice && <div className="studio-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notice">×</button></div>}
    {replace && <section className="replace-confirm" role="alert" aria-label="Replace current program"><p>Replace your current program with <strong>{replace.name}</strong>? Export first if you want to keep the current version.</p><div className="button-row"><button onClick={download}>Export current program</button><button onClick={()=>{setProject({...replace,id:replace.id||current.current.id});setReplace(null);}}>Replace program</button><button onClick={()=>setReplace(null)}>Cancel</button></div></section>}
    {requestedLesson && <section className="studio-panel" aria-label="Requested classroom lesson"><h2>{requestedLesson.title}</h2><p>Open this classroom lesson as a new project. Your current work will stay in Saved projects.</p><div className="button-row"><button disabled={!restored||busy} onClick={async()=>{if(await openClassroomProject(lessonProject(requestedLesson)))dismissRequestedLesson();}}>Open requested lesson</button><button onClick={dismissRequestedLesson}>Keep current project</button></div></section>}
    <Classroom project={project} runtime={status} camera={camera} hardware={hardwareState} disabled={!restored||busy} onLaunch={launchLesson} onEdit={lesson=>edit({lesson})} onFirstRun={()=>void openClassroomProject({id:crypto.randomUUID(),name:"first-success.py",code:'print("Success! My Python program runs in this browser.")\nprint("Next: open a classroom lesson and test an idea.")\n',input:"",mode:"once"})}/><div className="studio-grid"><div className="workspace-column"><section className="studio-panel" aria-labelledby="editor-title"><div className="panel-heading editor-heading"><h2 id="editor-title">Editor</h2><label className="filename"><span className="sr-only">Python filename</span><input aria-label="Python filename" value={project.name} disabled={!restored} maxLength={100} onChange={e=>edit({name:e.target.value})} onBlur={()=>edit({name:pythonFilename(project.name)})} /></label><div className="button-row"><button onClick={()=>setFontSize(n=>Math.max(12,n-2))} aria-label="Decrease editor font size">A−</button><button onClick={()=>setFontSize(n=>Math.min(28,n+2))} aria-label="Increase editor font size">A+</button><button aria-pressed={plain} onClick={()=>setPlain(p=>!p)}>{plain?'Monaco editor':'Simple editor'}</button></div></div>
      {!restored?<p className="loading-work">Restoring your work…</p>:plain?<textarea className="plain-editor" aria-label="Python code" value={project.code} style={{fontSize}} spellCheck={false} onChange={e=>edit({code:e.target.value})} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run();}}}/>:<Editor code={project.code} onChange={code=>edit({code})} onRun={run} fontSize={fontSize}/>}
      <div className="editor-footer"><span role="status">{saved}</span><span>Python · UTF-8</span></div></section>
      <section className="studio-panel console-panel" aria-labelledby="console-title"><div className="panel-heading"><h2 id="console-title">Python console</h2><button onClick={()=>setLines([])}>Clear console</button></div><div className="console-output" role="log" aria-label="Python console output" aria-live="polite" tabIndex={0}>{lines.length?lines.map((line,i)=><pre className={line.kind} key={i}>{line.text}</pre>):<p className="console-empty">Ready for your next idea. Run a program to see its output here.</p>}<div ref={consoleEnd}/></div><details className="program-input"><summary>Program input · for input()</summary><label htmlFor="program-input">Enter answers before running, one per line. Python reads them in order; when they run out, input() raises EOFError.</label><textarea id="program-input" value={project.input} disabled={!restored} onChange={e=>edit({input:e.target.value})} placeholder={'Example:\n12\n5'} /></details></section>
    </div><aside className={"studio-sidebar"+(project.lesson?.id==='sensor-control'?' hardware-first':'')}><section className="studio-panel starter-panel"><div className="panel-heading"><h2>Launch a program</h2></div><p>Start small. Make a change. See what happens.</p><label>Starter program <select aria-label="Starter program" value="" disabled={!restored||busy} onChange={e=>{const next=examples.find(p=>p.name===e.target.value);if(next)setReplace(next);}}><option value="">Choose a starter…</option>{examples.map(example=><option key={example.name} value={example.name}>{example.label}</option>)}</select></label><p className="hint">Starter programs replace the editor after confirmation.</p></section><Devices onHardware={setHardwareState} running={status==='running'} hardware={hardware.current} control={vision} processed={processed} onCamera={active=>{setCamera(active);if(!active&&runtimeState.current==='running'){endDevices();generation.current++;worker.current?.terminate();worker.current=null;state('stopped');}}} onFrame={value=>{frame.current=value;}}/></aside></div>
    <footer className="studio-footer"><p><strong>Before you leave:</strong> export your .py file. Autosave belongs to this browser profile and may be cleared on shared school devices.</p><details><summary>Classroom help &amp; runtime limits</summary><p>Internet access is needed to load Python and packages. Stop clears Python memory, then Restart Python prepares a fresh runtime. Each run starts with fresh program variables; imported modules can stay cached until restart. Use the Simple editor for a plain text alternative, or Ctrl+M in Monaco to let Tab move focus.</p><p>Camera and board access require permission and HTTPS (or localhost). The studio does not upload code or camera frames itself; Python programs can make network requests. Optional object detection and your saved custom classifier run locally in this browser. No chat assistant is connected. Arduino firmware must be loaded once by your teacher; firmware upload is not built into Studio. Stop terminates Python, disarms outputs and closes the camera. A detached servo is unpowered by its signal, not mechanically braked.</p></details></footer>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
