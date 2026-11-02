import {useCallback,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Editor} from './Editor';
import {Devices,type Frame} from './Devices';
import {readProject,saveProject,pythonFilename,type Project} from './storage';
import {examples} from './examples';
import './studio.css';
type Status = 'loading'|'ready'|'running'|'stopped'|'error';
type Line = {kind:string; text:string};
function App() {
  const [project,setProject]=useState<Project>(examples[0]);
  const [restored,setRestored]=useState(false),[storageOK,setStorageOK]=useState(true),[saved,setSaved]=useState('Opening saved work…');
  const [status,setStatus]=useState<Status>('loading'),[lines,setLines]=useState<Line[]>([]),[fontSize,setFontSize]=useState(16),[plain,setPlain]=useState(false);
  const [notice,setNotice]=useState(''),[replace,setReplace]=useState<Project|null>(null);
  const worker=useRef<Worker|null>(null), generation=useRef(0),runtimeState=useRef<Status>('loading'), saveVersion=useRef(0), frame=useRef<Frame|null>(null),file=useRef<HTMLInputElement>(null),consoleEnd=useRef<HTMLDivElement>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const current=useRef(project);current.current=project;
  const append=useCallback((line:Line)=>setLines(old=>[...old,line].slice(-550)),[]);
  function state(value:Status) {runtimeState.current=value;setStatus(value);}
  function stop() {
    generation.current++; worker.current?.terminate();worker.current=null;clearTimeout(timer.current);
    state('stopped');append({kind:'system',text:'Stopped. Python memory was cleared; your code is kept. Restart Python to run again.'});
  }
  function start() {
    generation.current++;const id=generation.current;
    worker.current?.terminate();clearTimeout(timer.current);state('loading');
    try {
      const instance=new Worker(new URL('python-worker.js', document.baseURI));worker.current=instance;
      const fail=(text:string)=>{if(id!==generation.current)return;clearTimeout(timer.current);instance.terminate();worker.current=null;state('error');append({kind:'stderr',text});};
      instance.onerror=()=>fail('Python worker could not start. Check your connection and restart Python.');
      timer.current=setTimeout(()=>fail('Python loading timed out. Check school network access to cdn.jsdelivr.net and restart Python.'),60000);
      instance.onmessage=({data})=>{
        if(id!==generation.current)return;
        if(data.type==='ready'){clearTimeout(timer.current);state('ready');}
        if(data.type==='output')append({kind:data.kind,text:data.text});
        if(data.type==='done'){state('ready');append({kind:'system',text:data.success?'Program finished.':'Program ended with an error. Check the message above.'});}
        if(data.type==='fatal')fail(data.text);
      };
    } catch {state('error');append({kind:'stderr',text:'This browser could not create a Python worker. Try a current browser.'});}
  }
  function run() {
    if(runtimeState.current!=='ready' || !worker.current)return;
    state('running');setLines([{kind:'system',text:`Running ${pythonFilename(current.current.name)}…`}]);
    worker.current.postMessage({type:'run',...current.current,name:pythonFilename(current.current.name),frame:frame.current});
  }
  useEffect(()=>{let alive=true;readProject().then(p=>{if(alive){if(p)setProject(p);setRestored(true);}}).catch(()=>{if(alive){setStorageOK(false);setSaved('Autosave unavailable — export your work');setRestored(true);}});start();return()=>{alive=false;generation.current++;worker.current?.terminate();clearTimeout(timer.current);};},[]);
  useEffect(()=>{
    if(!restored || !storageOK)return;
    const revision=++saveVersion.current;setSaved('Saving…');
    saveProject(project).then(()=>{if(revision===saveVersion.current)setSaved('Saved on this browser');}).catch(()=>{if(revision===saveVersion.current)setSaved('Save failed — export your work');});
  },[project,restored,storageOK]);
  useEffect(()=>{const container=consoleEnd.current?.parentElement;if(container)container.scrollTop=container.scrollHeight;},[lines]);
  const edit=(patch:Partial<Project>)=>setProject(p=>({...p,...patch}));
  function download() {
    const url=URL.createObjectURL(new Blob([project.code],{type:'text/x-python;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=pythonFilename(project.name);a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice('Python file exported. Keep this copy for another device or your next class.');
  }
  async function importFile(selected?:File) {
    if(!selected)return;
    if(!selected.name.toLowerCase().endsWith('.py')){setNotice('Choose a Python (.py) file.');return;}
    if(selected.size>1024*1024){setNotice('Choose a Python file smaller than 1 MB.');return;}
    try {setReplace({name:pythonFilename(selected.name),code:await selected.text(),input:''});}catch{setNotice('The file could not be read. Please try again.');}
  }
  const busy=status==='loading'||status==='running';
  return <div className="studio-shell">
    <div className="studio-intro"><div><div className="eyebrow">Build · Run · Discover</div><h1>AI Programming Studio<span>Phase 1 / Python lab</span></h1><p>Your engineering ideas, running in your browser. No installation needed.</p></div><span className={'runtime '+status} role="status"><i />{status==='loading'?'Loading Python…':status==='running'?'Program running':status==='ready'?'Python ready':status==='stopped'?'Python stopped':'Python unavailable'}</span></div>
    <div className="studio-toolbar" aria-label="Program controls"><div className="button-row"><button className="run-button" disabled={status!=='ready'||!restored} onClick={run}>▶ Run</button><button disabled={!busy} onClick={stop}>■ Stop</button><button disabled={status==='running'} onClick={start}>Restart Python</button><span className="keyboard-hint">Ctrl / ⌘ + Enter to run</span></div><div className="button-row"><button disabled={!restored} onClick={()=>file.current?.click()}>Import .py</button><button disabled={!restored} onClick={download}>Export .py</button><input hidden ref={file} type="file" accept=".py,text/x-python" onChange={e=>{void importFile(e.target.files?.[0]);e.target.value='';}} /></div></div>
    {notice && <div className="studio-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notice">×</button></div>}
    {replace && <section className="replace-confirm" role="alert" aria-label="Replace current program"><p>Replace your current program with <strong>{replace.name}</strong>? Export first if you want to keep the current version.</p><div className="button-row"><button onClick={download}>Export current program</button><button onClick={()=>{setProject(replace);setReplace(null);}}>Replace program</button><button onClick={()=>setReplace(null)}>Cancel</button></div></section>}
    <div className="studio-grid"><div className="workspace-column"><section className="studio-panel" aria-labelledby="editor-title"><div className="panel-heading editor-heading"><h2 id="editor-title">Editor</h2><label className="filename"><span className="sr-only">Python filename</span><input aria-label="Python filename" value={project.name} disabled={!restored} maxLength={100} onChange={e=>edit({name:e.target.value})} onBlur={()=>edit({name:pythonFilename(project.name)})} /></label><div className="button-row"><button onClick={()=>setFontSize(n=>Math.max(12,n-2))} aria-label="Decrease editor font size">A−</button><button onClick={()=>setFontSize(n=>Math.min(28,n+2))} aria-label="Increase editor font size">A+</button><button aria-pressed={plain} onClick={()=>setPlain(p=>!p)}>{plain?'Monaco editor':'Simple editor'}</button></div></div>
      {!restored?<p className="loading-work">Restoring your work…</p>:plain?<textarea className="plain-editor" aria-label="Python code" value={project.code} style={{fontSize}} spellCheck={false} onChange={e=>edit({code:e.target.value})} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run();}}}/>:<Editor code={project.code} onChange={code=>edit({code})} onRun={run} fontSize={fontSize}/>}
      <div className="editor-footer"><span role="status">{saved}</span><span>Python · UTF-8</span></div></section>
      <section className="studio-panel console-panel" aria-labelledby="console-title"><div className="panel-heading"><h2 id="console-title">Python console</h2><button onClick={()=>setLines([])}>Clear console</button></div><div className="console-output" role="log" aria-label="Python console output" aria-live="polite" tabIndex={0}>{lines.length?lines.map((line,i)=><pre className={line.kind} key={i}>{line.text}</pre>):<p className="console-empty">Ready for your next idea. Run a program to see its output here.</p>}<div ref={consoleEnd}/></div><details className="program-input"><summary>Program input · for input()</summary><label htmlFor="program-input">Enter answers before running, one per line. Python reads them in order; when they run out, input() raises EOFError.</label><textarea id="program-input" value={project.input} disabled={!restored} onChange={e=>edit({input:e.target.value})} placeholder={'Example:\n12\n5'} /></details></section>
    </div><aside className="studio-sidebar"><section className="studio-panel starter-panel"><div className="panel-heading"><h2>Launch a program</h2></div><p>Start small. Make a change. See what happens.</p>{examples.map(example=><button key={example.name} disabled={!restored||status==='running'} onClick={()=>setReplace(example)}>{example.label}<span aria-hidden="true">↗</span></button>)}<p className="hint">Starter programs replace the editor after confirmation.</p></section><Devices onFrame={value=>{frame.current=value;}}/></aside></div>
    <footer className="studio-footer"><p><strong>Before you leave:</strong> export your .py file. Autosave belongs to this browser profile and may be cleared on shared school devices.</p><details><summary>Classroom help &amp; Phase 1 limits</summary><p>Internet access is needed to load Python and packages. Stop clears Python memory, then Restart Python prepares a fresh runtime. Each run starts with fresh program variables; imported modules can stay cached until restart. Use the Simple editor for a plain text alternative, or Ctrl+M in Monaco to let Tab move focus.</p><p>Camera and board access require permission and HTTPS (or localhost). The studio does not upload code or camera frames itself; Python programs can make network requests. No AI assistant or model service is connected in Phase 1. Computer vision uses captured frames; live processing, image output, Arduino commands, and firmware upload are future work.</p></details></footer>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
