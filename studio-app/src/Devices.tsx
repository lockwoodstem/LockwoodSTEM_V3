import {useEffect, useRef, useState} from 'react';
export type Frame = {data:Uint8ClampedArray; width:number; height:number};
type Port = {open:(options:{baudRate:number})=>Promise<void>; close:()=>Promise<void>};
type Serial = {requestPort:()=>Promise<Port>; addEventListener:(event:string,callback:EventListener)=>void; removeEventListener:(event:string,callback:EventListener)=>void};
export function Devices({onFrame}:{onFrame:(frame:Frame|null)=>void}) {
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream|null>(null), port = useRef<Port|null>(null);
  const mounted = useRef(true), cameraGeneration = useRef(0);
  const [camera,setCamera] = useState('Camera off'), [cameraBusy,setCameraBusy] = useState(false), [active,setActive] = useState(false);
  const [serialStatus,setSerialStatus] = useState('Not connected'), [serialBusy,setSerialBusy] = useState(false), [connected,setConnected] = useState(false);
  const [snapshot,setSnapshot] = useState(false);
  const serial = (navigator as Navigator & {serial?:Serial}).serial;
  function stopCamera() {
    cameraGeneration.current++;
    stream.current?.getTracks().forEach(track=>track.stop()); stream.current=null;
    if(video.current) video.current.srcObject=null;
    setActive(false); setCameraBusy(false); setCamera('Camera off');
  }
  useEffect(()=>{
    mounted.current=true;
    const disconnected:EventListener = event => {
      if (event.target === port.current) { port.current=null; setConnected(false); setSerialStatus('Board disconnected'); }
    };
    serial?.addEventListener('disconnect',disconnected);
    const hide = () => { if(document.hidden) stopCamera(); };
    document.addEventListener('visibilitychange',hide);
    return ()=>{ mounted.current=false; cameraGeneration.current++; stream.current?.getTracks().forEach(t=>t.stop()); void port.current?.close().catch(()=>{}); serial?.removeEventListener('disconnect',disconnected); document.removeEventListener('visibilitychange',hide); };
  },[]);
  async function startCamera() {
    const generation = ++cameraGeneration.current;
    setCameraBusy(true);setCamera('Waiting for camera permission…');
    try {
      const media = await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480}},audio:false});
      if(!mounted.current || generation!==cameraGeneration.current || document.hidden) {media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;
      video.current!.srcObject=media;
      await video.current!.play();
      media.getVideoTracks()[0].addEventListener('ended',stopCamera,{once:true});
      setActive(true);setCamera('Camera on · preview stays in this browser');
    } catch(error) { if(generation===cameraGeneration.current) {stopCamera();setCamera('Camera unavailable or permission denied. Check browser permissions.');} }
    finally {if(mounted.current && generation===cameraGeneration.current)setCameraBusy(false);}
  }
  function capture() {
    const v=video.current!, c=canvas.current!;
    if(!v.videoWidth || v.readyState<2) {setCamera('Camera is warming up. Try capturing again.');return;}
    c.width=640; c.height=Math.round(v.videoHeight/v.videoWidth*640);
    const context=c.getContext('2d')!;context.drawImage(v,0,0,c.width,c.height);
    onFrame({data:context.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height});setSnapshot(true);
    setCamera('Frame captured · available to your next run');
  }
  async function toggleSerial() {
    setSerialBusy(true);
    try {
      if(port.current) {await port.current.close();port.current=null;setConnected(false);setSerialStatus('Not connected');}
      else {
        const chosen=await serial!.requestPort();await chosen.open({baudRate:115200});
        if(!mounted.current) {await chosen.close();return;}
        port.current=chosen;setConnected(true);setSerialStatus('Connected at 115200 baud · connection test only');
      }
    } catch {setSerialStatus('Connection canceled or unavailable. Close other apps using the board, then retry.');}
    finally {if(mounted.current)setSerialBusy(false);}
  }
  return <>
    <section className="studio-panel device-panel" aria-labelledby="camera-title"><div className="panel-heading"><h2 id="camera-title">Vision lab</h2><span className="badge">Prototype</span></div>
      <div className="video-wrap"><video ref={video} muted playsInline aria-label="Live webcam preview" />{!active && <div className="video-placeholder"><span aria-hidden="true">◎</span><strong>Your camera, your browser</strong><span>Start a preview to explore computer vision.</span></div>}</div>
      <p className="device-status" role="status">{camera}</p><div className="button-row"><button onClick={active?stopCamera:startCamera} disabled={cameraBusy || !navigator.mediaDevices?.getUserMedia}>{active?'Stop camera':'Start camera'}</button><button disabled={!active} onClick={capture}>Capture frame</button></div>
      <canvas ref={canvas} hidden={!snapshot} className="snapshot" aria-label="Captured frame" />
      {snapshot && <button className="text-button" onClick={()=>{onFrame(null);setSnapshot(false);}}>Clear captured frame</button>}
      <p className="hint">Use <code>get_frame()</code> in Python for an RGBA snapshot. The camera stops when you leave this tab. Frames are not autosaved.</p>
    </section>
    <section className="studio-panel device-panel" aria-labelledby="serial-title"><div className="panel-heading"><h2 id="serial-title">Arduino connection</h2><span className="badge">Preview</span></div><p>Check the USB connection to a board with firmware already loaded.</p><button disabled={!serial || serialBusy} onClick={toggleSerial}>{connected?'Disconnect board':'Connect board'}</button><p className="device-status" role="status">{serial ? serialStatus : 'Web Serial is unavailable here. Try desktop Chrome or Edge over HTTPS.'}</p><p className="hint">Connection test only. Python commands, serial messages, and firmware upload are planned for a later phase. Opening a port may reset your board.</p></section>
  </>;
}
