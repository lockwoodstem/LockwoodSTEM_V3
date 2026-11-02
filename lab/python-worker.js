/* LockwoodSTEM Unified Lab: isolated Pyodide worker, no remote frame uploads. */
const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
const CASCADE = "https://cdn.jsdelivr.net/gh/opencv/opencv@4.10.0/data/haarcascades/haarcascade_frontalface_default.xml";
let pyodide = null, globals = null, busy = false, mode = "idle", logs = 0, cascadeReady = false;
const LIMIT = 120;
function emit(type, fields = {}) { self.postMessage({type, ...fields}); }
function log(text) { if(logs++ < LIMIT) emit("output",{text:String(text).slice(0,2000)}); }
async function loadPython() {
  try {
    importScripts(PYODIDE + "pyodide.js");
    pyodide = await loadPyodide({indexURL:PYODIDE});
    pyodide.setStdout({batched:log});
    pyodide.setStderr({batched:log});
    emit("ready");
  } catch (error) { emit("error",{message:"Python could not initialize. Verify CDN access: " + String(error)}); }
}
async function ensureOpenCV() {
  emit("status",{text:"Loading NumPy and OpenCV…"});
  await pyodide.loadPackage(["numpy","opencv-python"]);
  if (!cascadeReady) {
    try {
      const response = await fetch(CASCADE);
      if(!response.ok) throw new Error("HTTP " + response.status);
      pyodide.FS.writeFile("/tmp/lockwoodstem_face_cascade.xml",new Uint8Array(await response.arrayBuffer()));
      cascadeReady=true;
    } catch(err) { emit("status",{text:"OpenCV ready; face model blocked by network. Other examples work."}); }
  }
}
async function configure(code) {
  if(busy) return;
  busy=true;mode="idle";logs=0;
  try {
    await ensureOpenCV();
    if(globals){globals.destroy();globals=null;}
    globals=pyodide.toPy({__name__:"__main__"});
    await pyodide.loadPackagesFromImports(code);
    await pyodide.runPythonAsync(code,{globals,filename:"live_vision.py"});
    const valid=pyodide.runPython('callable(globals().get("process_frame"))',{globals});
    if(!valid) throw new Error("Define process_frame(frame), returning an RGBA, RGB, or grayscale image.");
    mode="vision";emit("configured");
  } catch(err) {mode="idle";emit("error",{message:String(err)});}
  finally{busy=false;}
}
async function execute(code,input,frame) {
  if(busy)return;
  busy=true;logs=0;mode="idle";
  const runGlobals=pyodide.toPy({__name__:"__main__"});
  const lines=String(input||"").replace(/\r\n/g,"\n").split("\n");
  let position=0;
  pyodide.setStdin({stdin:()=>position<lines.length?lines[position++]:undefined});
  self._vision_pixels=frame?new Uint8Array(frame.data):null;
  self._vision_width=frame?.width||0;
  self._vision_height=frame?.height||0;
  try{
    await pyodide.loadPackagesFromImports(code);
    await pyodide.runPythonAsync(String.raw`
import numpy as np
from js import _vision_pixels, _vision_width, _vision_height
def get_frame():
    if _vision_pixels is None:
        raise RuntimeError("Start camera and capture a frame before calling get_frame().")
    return np.frombuffer(_vision_pixels.to_py(),dtype=np.uint8).reshape(
        (int(_vision_height),int(_vision_width),4)).copy()
`,{globals:runGlobals});
    const value=await pyodide.runPythonAsync(code,{globals:runGlobals,filename:"student_program.py"});
    if(value?.destroy)value.destroy();
    emit("done");
  }catch(err){emit("error",{message:String(err)});}
  finally{runGlobals.destroy();self._vision_pixels=null;busy=false;}
}
async function processFrame(message) {
  if(busy||mode!=="vision")return;
  busy=true;
  self._vision_pixels=new Uint8Array(message.data);
  self._vision_width=message.width;
  self._vision_height=message.height;
  let output=null, buffer=null;
  try {
    const start=performance.now();
    output=await pyodide.runPythonAsync(String.raw`
import numpy as np
import cv2
from js import _vision_pixels, _vision_width, _vision_height
_input=np.frombuffer(_vision_pixels.to_py(),dtype=np.uint8).reshape(
    (int(_vision_height),int(_vision_width),4)).copy()
_result=process_frame(_input)
if _result is None: _result=_input
_result=np.asarray(_result)
if _result.dtype!=np.uint8: _result=np.clip(_result,0,255).astype(np.uint8)
if _result.ndim==2: _result=cv2.cvtColor(_result,cv2.COLOR_GRAY2RGBA)
elif _result.ndim==3 and _result.shape[2]==3: _result=cv2.cvtColor(_result,cv2.COLOR_RGB2RGBA)
if _result.shape!=_input.shape:
    raise ValueError("process_frame must return an image with the original width and height.")
np.ascontiguousarray(_result)
`,{globals});
    buffer=output.getBuffer("u8");
    const array=new Uint8ClampedArray(buffer.data);
    emit("frame",{data:array.buffer,width:message.width,height:message.height,ms:Math.round(performance.now()-start)});
  } catch(err) {mode="idle";emit("error",{message:String(err)});}
  finally {
    if(buffer)buffer.release();
    if(output)output.destroy();
    self._vision_pixels=null;
    busy=false;
  }
}
self.onmessage=async({data})=>{
  if(!pyodide)return;
  if(data.type==="configure")await configure(data.code);
  else if(data.type==="run")await execute(data.code,data.input,data.frame);
  else if(data.type==="frame")await processFrame(data);
  else if(data.type==="reset") {mode="idle";if(globals){globals.destroy();globals=null;}emit("stopped");}
};
loadPython();
