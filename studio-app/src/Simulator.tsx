import {useRef,useState} from 'react';
import type {Hardware,HardwareState} from './hardware';
export function Simulator({hardware,state,running}:{hardware:Hardware;state:HardwareState;running:boolean}){
  const lastAngle=useRef<number|null>(null),lastMode=useRef(state.mode);if(lastMode.current!==state.mode){lastMode.current=state.mode;lastAngle.current=null;}if(state.servo!==null)lastAngle.current=state.servo;
  const [error,setError]=useState('');
  const manualDisabled=running||!state.armed||state.mode!=='simulation';
  async function command(name:string,value:number){try{setError('');await hardware.command(name,value);}catch(e){setError(String(e));}}
  return <div className="simulator-visual">
    <svg viewBox="0 0 240 155" role="img" aria-label={`Servo diagram: ${state.servo===null?(lastAngle.current===null?'detached; no commanded angle':'detached; last commanded angle '+lastAngle.current):state.servo} degrees`}>
      <path d="M 40 115 A 80 80 0 0 1 200 115" fill="none" stroke="#526c89" strokeWidth="3"/>
      <text x="22" y="137">0°</text><text x="106" y="24">90°</text><text x="193" y="137">180°</text>
      <g className={'servo-arm '+(state.servo===null?'detached':'')} style={{transform:`rotate(${(lastAngle.current??90)-90}deg)`,transformOrigin:'120px 115px'}}>
        <line x1="120" y1="115" x2="120" y2="46" stroke="currentColor" strokeWidth="9" strokeLinecap="round"/>
        <circle cx="120" cy="46" r="6" fill="currentColor"/>
      </g><circle cx="120" cy="115" r="12" fill="#d5e5f6"/>
    </svg>
    <p className="hint">{state.mode==='simulation'?'Simulated servo':'Commanded servo position'} · {state.servo===null?(lastAngle.current===null?'detached (no angle commanded)':'detached (last command shown)'):'attached'}. {state.mode==='board'?'This diagram is not measured position feedback.':'The diagram follows your Python commands.'}</p>
    {state.mode==='simulation'&&<><div className="button-row"><button disabled={manualDisabled} onClick={()=>void command('LED',state.led?0:1)}>Toggle simulated LED</button>{[0,90,180].map(angle=><button key={angle} disabled={manualDisabled} onClick={()=>void command('SERVO',angle)}>Servo {angle}°</button>)}</div>
      <p className="hint">Arm hardware to try these manual controls. They pause while Python is running; the sensor slider remains available.</p>
      <div className="button-row" aria-label="Sensor presets">{[0,512,513,1023].map(value=><button key={value} onClick={()=>hardware.update({sensor:value})}>A0 {value}</button>)}</div>
    </>}
    <meter aria-label="Sensor level" min="0" max="1023" value={state.sensor}/><p className="hint">Sensor: {state.sensor} / 1023 ({Math.round(state.sensor/1023*100)}%)</p>
    {error&&<p role="alert">{error}</p>}
  </div>;
}
