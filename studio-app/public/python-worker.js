/* All student Python runs in this disposable worker. No server or shared memory. */
const INDEX_URL='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let python,busy=false,live=null,outputSize=0,outputLines=0,truncated=false,nextRequest=0;
const requests=new Map();
function output(kind,text){if(truncated)return;text=String(text).slice(0,Math.max(0,60000-outputSize));outputSize+=text.length;outputLines++;if(text)postMessage({type:'output',kind,text});if(outputSize>=60000||outputLines>=500){truncated=true;postMessage({type:'output',kind:'system',text:'Output limit reached. Use Stop if the program is still running.'});}}
self._hardware=(command,value)=>new Promise((resolve,reject)=>{if(requests.size>=1){reject(Error('Await each hardware command before sending another'));return;}const id=++nextRequest;requests.set(id,{resolve,reject});postMessage({type:'hardware',id,command,value});});
self._studio_frame=null;self._detections='[]';self._predictions='[]';
const API=String.raw`
def get_frame():
    from js import _studio_frame
    if _studio_frame is None:
        raise RuntimeError("Start the camera and capture a frame before running this program.")
    import numpy as np
    return np.frombuffer(_studio_frame.data.to_py(),dtype=np.uint8).reshape((_studio_frame.height,_studio_frame.width,4)).copy()
def get_detections():
    import json
    from js import _detections
    return json.loads(str(_detections))
def get_custom_prediction():
    import json
    from js import _predictions
    return json.loads(str(_predictions))
class _Arduino:
    async def led(self, on):
        from js import _hardware
        if on not in (True, False, 0, 1): raise ValueError("LED must be True or False")
        return await _hardware("LED", int(on))
    async def servo(self, angle):
        from js import _hardware
        if not isinstance(angle,int) or not 0 <= angle <= 180: raise ValueError("Servo angle must be an integer from 0 to 180")
        return await _hardware("SERVO", angle)
    async def sensor(self):
        from js import _hardware
        return await _hardware("SENSOR", 0)
    async def stop(self):
        from js import _hardware
        return await _hardware("STOP", 0)
arduino = _Arduino()
async def serial_send(command):
    commands={"LED_ON":("LED",1),"LED_OFF":("LED",0),"SERVO_0":("SERVO",0),"SERVO_90":("SERVO",90),"SERVO_180":("SERVO",180),"STOP":("STOP",0),"MOTOR_STOP":("STOP",0)}
    if command not in commands: raise ValueError("Unsupported command; use the arduino API")
    from js import _hardware
    return await _hardware(*commands[command])
async def read_sensor():
    return await arduino.sensor()
def show_image(image):
    import numpy as np
    from js import _show_image
    pixels=np.asarray(image)
    if pixels.ndim==2: pixels=np.stack([pixels,pixels,pixels,np.full_like(pixels,255)],axis=-1)
    elif pixels.ndim==3 and pixels.shape[2]==3: pixels=np.concatenate([pixels,np.full((*pixels.shape[:2],1),255,dtype=np.uint8)],axis=2)
    if pixels.ndim!=3 or pixels.shape[2]!=4 or not 0<pixels.shape[0]<=1080 or not 0<pixels.shape[1]<=1920: raise ValueError("Return gray, RGB or RGBA image, at most 1920 x 1080")
    pixels=np.ascontiguousarray(np.clip(pixels,0,255),dtype=np.uint8)
    _show_image(pixels, pixels.shape[1],pixels.shape[0])
`;
let imageSent=false;
self._show_image=(pixels,width,height)=>{if(imageSent)return;imageSent=true;const buffer=pixels.getBuffer('u8');try{const data=new Uint8ClampedArray(buffer.data);postMessage({type:'image',data,width,height},[data.buffer]);}finally{buffer.release();}};
async function initialize(){try{importScripts(INDEX_URL+'pyodide.js');python=await loadPyodide({indexURL:INDEX_URL});python.setStdout({batched:t=>output('stdout',t)});python.setStderr({batched:t=>output('stderr',t)});postMessage({type:'ready'});}catch(e){postMessage({type:'fatal',text:'Python could not load. Check internet access to cdn.jsdelivr.net, then restart Python. '+e});}}
self.onmessage=async({data})=>{
 if(data.type==='hardware-result'){const p=requests.get(data.id);if(p){requests.delete(data.id);data.error?p.reject(Error(data.error)):p.resolve(data.value);}return;}
 if(!python||busy)return;
 if(!['run','configure','frame'].includes(data.type))return;
 busy=true;imageSent=false;let globals=null;
 try{
  self._studio_frame=data.frame?{...data.frame,data:new Uint8Array(data.frame.data)}:null;
  self._detections=JSON.stringify(data.detections||[]);self._predictions=JSON.stringify(data.predictions||[]);
  if(data.type==='frame'){
   if(!live)throw Error('Start live processing first');
   globals=live;
   await python.runPythonAsync(`import inspect\n_frame = get_frame()\n_result = process_frame(_frame)\nif inspect.isawaitable(_result): _result = await _result\nshow_image(_frame if _result is None else _result)\ndel _frame, _result`,{globals});
   postMessage({type:'frame-done'});
  }else{
   outputSize=0;outputLines=0;truncated=false;
   if(live){live.destroy();live=null;}
   const lines=(data.input||'').replace(/\r\n/g,'\n').split('\n');let cursor=0;
   python.setStdin({stdin:()=>data.input&&cursor<lines.length?lines[cursor++]:undefined});
   globals=python.toPy({__name__:'__main__'});
   if(data.frame||data.type==='configure')await python.loadPackage('numpy');
   await python.loadPackagesFromImports(data.code);
   if(data.code.includes('lockwoodstem_face_cascade.xml')&&!python.FS.analyzePath('/tmp/lockwoodstem_face_cascade.xml').exists){
    const r=await fetch('https://cdn.jsdelivr.net/gh/opencv/opencv@4.10.0/data/haarcascades/haarcascade_frontalface_default.xml');if(!r.ok)throw Error('Face model download failed');python.FS.writeFile('/tmp/lockwoodstem_face_cascade.xml',new Uint8Array(await r.arrayBuffer()));
   }
   await python.runPythonAsync(API,{globals});
   const result=await python.runPythonAsync(data.code,{globals,filename:data.name});result?.destroy?.();
   if(data.type==='configure'){
    if(!python.runPython('callable(globals().get("process_frame"))',{globals}))throw Error('Live programs need def process_frame(frame):');
    live=globals;postMessage({type:'configured'});
   }else postMessage({type:'done',success:true});
  }
 }catch(e){output('stderr',String(e).slice(0,12000));postMessage({type:'done',success:false});if(live){live.destroy();if(globals===live)globals=null;live=null;}}
 finally{if(globals&&globals!==live)globals.destroy();self._studio_frame=null;busy=false;}
};
initialize();
