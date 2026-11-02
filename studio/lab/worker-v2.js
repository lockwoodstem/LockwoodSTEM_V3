/* LockwoodSTEM unified lab Python worker. Pyodide runs off the UI thread. */
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
const FACE_MODEL = "https://cdn.jsdelivr.net/gh/opencv/opencv@4.10.0/data/haarcascades/haarcascade_frontalface_default.xml";
let pyodide = null, globals = null, busy = false, mode = "idle", faceReady = false, logCount = 0, fatal = false;
const LIMIT = 140;
function emit(type, rest = {}) { postMessage({type, ...rest}); }
function output(message) { if(logCount++ < LIMIT) emit("output", {message:String(message).slice(0, 3000)}); }
self._robot_send = line => emit("serial", {command:String(line)});
self._serial_last_sensor = "";
self._detections_json = "[]";
self._frame_data = null;
self._frame_width = 0;
self._frame_height = 0;
const API = String.raw`
def serial_send(command):
    """Request one validated serial command. Requires an armed board connection."""
    from js import _robot_send
    _robot_send(str(command))
def read_sensor():
    """Return last complete line received from the connected controller."""
    from js import _serial_last_sensor
    return str(_serial_last_sensor)
def get_detections():
    """Return AI detections: [{'label':str,'score':float,'bbox':[x,y,w,h]}]."""
    import json
    from js import _detections_json
    return json.loads(str(_detections_json))
def get_frame():
    """Return the current webcam snapshot as an RGBA NumPy array."""
    from js import _frame_data, _frame_width, _frame_height
    if _frame_data is None:
        raise RuntimeError("Start the camera and capture a frame first.")
    import numpy as np
    return np.frombuffer(_frame_data.to_py(),dtype=np.uint8).reshape(
        (int(_frame_height),int(_frame_width),4)).copy()
`;
const FRAME_SCRIPT = String.raw`
import cv2, numpy as np
from js import _frame_data, _frame_width, _frame_height
_original = np.frombuffer(_frame_data.to_py(),dtype=np.uint8).reshape(
    (int(_frame_height),int(_frame_width),4)).copy()
_processed = process_frame(_original)
if _processed is None: _processed = _original
_processed = np.asarray(_processed)
if _processed.dtype != np.uint8:
    _processed = np.clip(_processed,0,255).astype(np.uint8)
if _processed.ndim == 2:
    _processed = cv2.cvtColor(_processed,cv2.COLOR_GRAY2RGBA)
elif _processed.ndim == 3 and _processed.shape[2] == 3:
    _processed = cv2.cvtColor(_processed,cv2.COLOR_RGB2RGBA)
if _processed.shape != _original.shape:
    raise ValueError("process_frame(frame) must return the original width/height in gray, RGB or RGBA.")
np.ascontiguousarray(_processed)
`;
async function initialize() {
  try {
    importScripts(PYODIDE_URL + "pyodide.js");
    pyodide = await loadPyodide({indexURL:PYODIDE_URL});
    pyodide.setStdout({batched:output});
    pyodide.setStderr({batched:output});
    emit("ready");
  } catch(err) {fatal=true;emit("fatal",{message:"Python could not load. Verify access to cdn.jsdelivr.net: "+String(err)});}
}
async function configure(code) {
  if(busy)return;
  busy = true;mode="idle";logCount=0;
  try {
    emit("status",{message:"Loading OpenCV…"});
    await pyodide.loadPackage(["numpy","opencv-python"]);
    if(!faceReady){
      try {
        const r = await fetch(FACE_MODEL);
        if(!r.ok)throw new Error("HTTP "+r.status);
        pyodide.FS.writeFile("/tmp/lockwoodstem_face_cascade.xml",new Uint8Array(await r.arrayBuffer()));
        faceReady=true;
      } catch(err) { emit("status",{message:"Face classifier not available on this network; other vision examples still work."}); }
    }
    if(globals){globals.destroy();globals=null;}
    globals=pyodide.toPy({__name__:"__main__"});
    await pyodide.runPythonAsync(API,{globals});
    await pyodide.loadPackagesFromImports(code);
    await pyodide.runPythonAsync(code,{globals,filename:"vision.py"});
    if(!pyodide.runPython('callable(globals().get("process_frame"))',{globals}))
      throw new Error("Your live program needs a process_frame(frame) function.");
    mode="live";emit("configured");
  } catch(err) {mode="idle";emit("error",{message:String(err)});}
  finally{busy=false;}
}
async function run(code,input,frame) {
  if(busy)return;
  busy=true;mode="idle";logCount=0;
  const env=pyodide.toPy({__name__:"__main__"});
  const lines=input?String(input).replace(/\r\n/g,"\n").split("\n"):[];
  let idx=0;
  pyodide.setStdin({stdin:()=>idx<lines.length?lines[idx++]:undefined});
  self._frame_data=frame?new Uint8Array(frame.data):null;
  self._frame_width=frame?.width||0;
  self._frame_height=frame?.height||0;
  try{
    await pyodide.runPythonAsync(API,{globals:env});
    if(frame)await pyodide.loadPackage("numpy");
    await pyodide.loadPackagesFromImports(code);
    const result=await pyodide.runPythonAsync(code,{globals:env,filename:"student.py"});
    if(result?.destroy)result.destroy();
    emit("done");
  }catch(err){emit("error",{message:String(err)});}
  finally{env.destroy();self._frame_data=null;busy=false;}
}
async function frame(data) {
  if(busy || mode!=="live")return;
  busy=true;
  self._frame_data=new Uint8Array(data.data);
  self._frame_width=data.width;self._frame_height=data.height;
  self._detections_json=JSON.stringify(data.detections||[]);
  let value=null, buffer=null;
  try {
    const t=performance.now();
    value=await pyodide.runPythonAsync(FRAME_SCRIPT,{globals});
    buffer=value.getBuffer("u8");
    const pixelBytes=new Uint8ClampedArray(buffer.data);
    postMessage({type:"frame",data:pixelBytes.buffer,width:data.width,height:data.height,ms:Math.round(performance.now()-t)},[pixelBytes.buffer]);
  } catch(err){mode="idle";emit("error",{message:String(err)});}
  finally{
    if(buffer)buffer.release();
    if(value)value.destroy();
    self._frame_data=null;
    busy=false;
  }
}
self.onmessage=async({data})=>{
  if(data.type==="sensor"){self._serial_last_sensor=String(data.value).slice(0,256);return;}
  if(!pyodide||fatal)return;
  if(data.type==="configure")await configure(data.code);
  else if(data.type==="run")await run(data.code,data.input,data.frame);
  else if(data.type==="frame")await frame(data);
  else if(data.type==="reset"){
    mode="idle";if(globals){globals.destroy();globals=null;}
    emit("stopped");
  }
};
initialize();
