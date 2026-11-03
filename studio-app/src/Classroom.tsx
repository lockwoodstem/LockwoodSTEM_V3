import {lessons,type Lesson} from './lessons';
import type {Project} from './storage';
import type {HardwareState} from './hardware';

type Props={project:Project;runtime:string;camera:boolean;hardware:HardwareState;disabled:boolean;
  onLaunch:(lesson:Lesson)=>void;onEdit:(lesson:NonNullable<Project['lesson']>)=>void;onFirstRun:()=>void;onRun:()=>void;onStop:()=>void;onRestart:()=>void};
export function Classroom({project,runtime,camera,hardware,disabled,onLaunch,onEdit,onFirstRun,onRun,onStop,onRestart}:Props){
  const lesson=lessons.find(l=>l.id===project.lesson?.id);
  const pythonReady=runtime==='ready'||runtime==='running';
  const modeReady=lesson?project.mode===lesson.mode:project.mode!=='live';
  return <section className="studio-panel classroom" aria-labelledby="classroom-title">
    <div className="panel-heading"><h2 id="classroom-title">Classroom launchpad</h2></div>
    <div className="classroom-body">
      <p>Write your own Python, test it, and explain what you observe. These lessons use ordinary Python and OpenCV; no AI coding assistant is included.</p>
      <details className="setup-guide" open={!lesson}>
        <summary>Guided setup · {lesson?'prepare this lesson':'your first successful run'}</summary>
        <ol>
          <li><strong>{pythonReady?'✓ Python is ready.':'Python is not ready yet.'}</strong> {runtime==='stopped'?'Select Restart Python after using Stop.':runtime==='error'?'Check the console and school network access, then select Restart Python.':'Wait for Python ready before running.'}</li>
          <li><strong>{modeReady?'✓ Run mode matches.':'Change Run mode.'}</strong> {lesson?.mode==='live'?'This lesson uses Live vision.':'Use Program for a regular Python script.'}</li>
          {lesson?.camera&&<li><strong>{camera?'✓ Camera is on.':'Start the camera.'}</strong> Use the <a href="#camera-title">Vision lab</a>. Allow access and point it at your workspace.</li>}
          {lesson?.hardware&&<li><strong>{hardware.armed?'✓ Hardware is armed.':'Prepare and arm hardware.'}</strong> In the <a href="#hardware-title">Hardware lab</a>, start with Simulator. {hardware.mode==='board'?(hardware.ready?'Firmware is confirmed. Arm when your setup is ready.':hardware.connected?'USB is connected. Wait for firmware confirmation, then arm.':'Connect a teacher-prepared board before arming.'):'No USB board is needed.'}</li>}
          <li>Select {lesson?.mode==='live'?'Run live':'Run'}, observe the result, then use Stop. Stop clears Python memory and disarms outputs. Export your work before leaving.</li>
        </ol>
        {!lesson&&<button disabled={disabled} onClick={onFirstRun}>Create first-run project</button>}
        {!lesson&&<p className="hint">Creates a new project that prints a success message. Your current project stays in Saved projects.</p>}
      </details>
      <label>Classroom lesson <select aria-label="Classroom lesson" value="" disabled={disabled} onChange={e=>{const l=lessons.find(l=>l.id===e.target.value);if(l)onLaunch(l);}}><option value="">Open a lesson as a new project…</option>{lessons.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
      <p className="hint">Each lesson opens a separate named project. Your existing programs stay in Saved projects.</p>
      {lesson&&<section aria-label="Lesson program controls" className="lesson-run-controls">
        <h3>Run your lesson program</h3>
        <p>{runtime==='running'?'Your lesson program is running. Use Stop lesson when you finish.':runtime==='loading'?'Loading Python… Run becomes available when Python is ready.':runtime==='stopped'||runtime==='error'?'Restart lesson Python, then prepare your devices and run again.':'Python is ready. Complete the setup below, then run your lesson.'}</p>
        <div className="button-row"><button className="run-button" disabled={disabled||runtime!=='ready'} onClick={onRun}>{lesson.mode==='live'?'▶ Run lesson live':'▶ Run lesson'}</button><button disabled={runtime!=='running'&&runtime!=='loading'} onClick={onStop}>Stop lesson</button>{(runtime==='stopped'||runtime==='error')&&<button onClick={onRestart}>Restart lesson Python</button>}</div>
        {!modeReady&&<p>Choose {lesson.mode==='live'?'Live vision':'Program'} in Run mode above.</p>}
        {lesson.camera&&!camera&&<p>Before Run: <a href="#camera-title">start the camera in the Vision lab</a>.</p>}
        {lesson.hardware&&!hardware.armed&&<p>Before Run: <a href="#hardware-title">choose Simulator and Arm hardware in the Hardware lab</a>.</p>}
      </section>}
      {lesson&&project.lesson&&<details className="lesson-content" open><summary>{lesson.title} · guide &amp; evidence</summary>
        <h3>{lesson.title}</h3><p className="lesson-duration">{lesson.duration} · {lesson.needs}</p><p><strong>Goal:</strong> {lesson.goal}</p>
        <details open><summary>Build &amp; test</summary><ol>{lesson.steps.map(step=><li key={step}>{step}</li>)}</ol></details>
        <fieldset><legend>Evidence checklist · student self-check</legend>{lesson.checks.map((text,i)=><label key={text}><input type="checkbox" checked={project.lesson!.checks.includes(i)} onChange={e=>onEdit({...project.lesson!,checks:e.target.checked?[...project.lesson!.checks,i]:project.lesson!.checks.filter(n=>n!==i)})}/>{text}</label>)}</fieldset>
        <label htmlFor="lesson-reflection">Observations &amp; reflection</label><p className="hint">{lesson.reflection}</p>
        <textarea id="lesson-reflection" maxLength={12000} value={project.lesson.reflection} onChange={e=>onEdit({...project.lesson!,reflection:e.target.value})} placeholder="Record your trials, results and explanation…"/>
        <p className="hint">Saved with this project and included in Export submission. Checkboxes record your observations; they are not an automatic grade or physical-device certification.</p>
        <details><summary>Extend the challenge</summary><p>{lesson.extension}</p></details>
      </details>}
    </div>
  </section>;
}
