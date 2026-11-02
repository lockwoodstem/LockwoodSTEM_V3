(()=>{
const $=id=>document.getElementById(id), code=$("code"), output=$("output"), ctx=output.getContext("2d"), video=$("original"), scratch=document.createElement("canvas"), sc=scratch.getContext("2d",{willReadFrequently:true});
const examples={
face:'import cv2\nface = cv2.CascadeClassifier("/tmp/lockwoodstem_face_cascade.xml")\ndef process_frame(frame):\n    gray = cv2.cvtColor(frame, cv2.COLOR_RGBA2GRAY)\n    if face.empty(): raise RuntimeError("Face model unavailable on your network")\n    for x,y,w,h in face.detectMultiScale(gray,1.1,5):\n        cv2.rectangle(frame,(x,y),(x+w,y+h),(255,210,40,255),3)\n    return frame',
edge:'import cv2\ndef process_frame(frame):\n    gray=cv2.cvtColor(frame,cv2.COLOR_RGBA2GRAY)\n    return cv2.Canny(gray,70,140)',
color:'import cv2\nimport numpy as np\ndef process_frame(frame):\n    hsv=cv2.cvtColor(frame,cv2.COLOR_RGBA2RGB)\n    hsv=cv2.cvtColor(hsv,cv2.COLOR_RGB2HSV)\n    mask=cv2.inRange(hsv,(35,70,60),(85,255,255))\n    for c in cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)[0]:\n        if cv2.contourArea(c)>400:\n            x,y,w,h=cv2.boundingRect(c)\n            cv2.rectangle(frame,(x,y),(x+w,y+h),(255,240,40,255),3)\n    return frame',
motion:'import cv2\nprevious=None\ndef process_frame(frame):\n    global previous\n    gray=cv2.cvtColor(frame,cv2.COLOR_RGBA2GRAY)\n    if previous is not None:\n        delta=cv2.absdiff(gray,previous)\n        mask=cv2.threshold(delta,35,255,cv2.THRESH_BINARY)[1]\n        for c in cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)[0]:\n            if cv2.contourArea(c)>250:\n                x,y,w,h=cv2.boundingRect(c)\n                cv2.rectangle(frame,(x,y),(x+w,y+h),(255,100,50,255),2)\n    previous=gray.copy()\n    return frame',
marker:'import cv2\ndef process_frame(frame):\n    gray=cv2.cvtColor(frame,cv2.COLOR_RGBA2GRAY)\n    dictionary=cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)\n    corners,ids,_=cv2.aruco.detectMarkers(gray,dictionary)\n    if ids is not None:\n        rgb=cv2.cvtColor(frame,cv2.COLOR_RGBA2RGB)\n        cv2.aruco.drawDetectedMarkers(rgb,corners,ids)\n        return cv2.cvtColor(rgb,cv2.COLOR_RGB2RGBA)\n    return frame',
ai:'import cv2\n\ndef process_frame(frame):\n    for d in get_detections():\n        x,y,w,h=map(int,d["bbox"])\n        cv2.rectangle(frame,(x,y),(x+w,y+h),(255,200,40,255),2)\n        label="%s %.0f%%"%(d["label"],100*d["score"])\n        cv2.putText(frame,label,(x,max(15,y-5)),cv2.FONT_HERSHEY_SIMPLEX,.5,(255,200,40,255),2)\n    return frame',
serial:'print("Board reply:",read_sensor())\nserial_send("LED_ON")\nprint("Requested LED_ON (connection and arm required)")',
basic:'print("LockwoodSTEM Python ready!")\nfor i in range(5):\n    print("Countdown",5-i)'
};
const allow=new Set(["LED_ON","LED_OFF","STOP","SERVO_0","SERVO_90","SERVO_180","MOTOR_STOP"]);
let worker,ready=false,running=false,pending=false,stream=null,tick=null,port=null,reader=null,writer=null,armed=false,model=null,ai=false,detecting=false,lastDetections=[],frames=0,startAt=0,runId=0;
const setStatus=t=>$("status").textContent=t, log=t=>{const c=$("console");c.textContent=(c.textContent+"\n"+t).slice(-12000);c.scrollTop=c.scrollHeight;};
function restore(){code.value=examples[$("example").value];save();}function save(){localStorage.setItem("lockwood_unified_studio",JSON.stringify({code:code.value,example:$("example").value}));}
$("restore").onclick=restore;code.oninput=save;
try{const saved=JSON.parse(localStorage.getItem("lockwood_unified_studio")||"null");if(saved?.code){code.value=saved.code;$("example").value=saved.example||"face";}else restore();}catch{restore();}
$("export").onclick=()=>{const url=URL.createObjectURL(new Blob([code.value],{type:"text/x-python"}));const a=document.createElement("a");a.href=url;a.download="studio_program.py";a.click();URL.revokeObjectURL(url);};
$("import").onchange=async e=>{const file=e.target.files?.[0];if(file&&file.size<=1048576&&file.name.endsWith(".py")&&confirm("Replace current Python program?")){code.value=await file.text();save();}};
function launch(){if(worker)worker.terminate();ready=false;pending=false;running=false;const generation=++runId;
setStatus("Loading Python runtime…");$("run").disabled=$("run-live").disabled=true;
worker=new Worker("./worker-v2.js");
worker.onmessage=e=>{if(generation!==runId)return;const m=e.data;
if(m.type==="ready"){ready=true;setStatus("Python ready");$("run").disabled=false;$("run-live").disabled=!stream;}
if(m.type==="status")setStatus(m.message);
if(m.type==="configured"){running=true;pending=false;frames=0;startAt=performance.now();setStatus("Live Python processing");schedule();}
if(m.type==="frame"){pending=false;const data=new ImageData(new Uint8ClampedArray(m.data),m.width,m.height);ctx.putImageData(data,0,0);frames++;const seconds=(performance.now()-startAt)/1000;if(seconds>0.8)$("stats").textContent=(frames/seconds).toFixed(1)+" processed FPS · "+m.ms+" ms/frame · AI "+(ai?"on":"off");schedule();}
if(m.type==="output")log(m.message);
if(m.type==="serial")void sendCommand(m.command);
if(m.type==="done"){setStatus("Program finished");$("run").disabled=false;}
if(m.type==="error"||m.type==="fatal"){running=false;pending=false;log(m.message);setStatus("Python error — see console");$("run").disabled=!ready;}
};worker.onerror=e=>{log(e.message);setStatus("Worker failed");running=false;};}
function stop(){running=false;pending=false;if(tick)clearTimeout(tick);launch();} $("stop").onclick=stop;$("restart").onclick=launch;
function capture(){if(!stream||video.readyState<2)return null;const width=Number($("resolution").value);const height=Math.max(1,Math.round(width*video.videoHeight/video.videoWidth));scratch.width=output.width=width;scratch.height=output.height=height;sc.drawImage(video,0,0,width,height);return sc.getImageData(0,0,width,height);}
$("camera").onclick=async()=>{if(stream){closeCamera();return;}try{stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});video.srcObject=stream;await video.play();$("camera").textContent="Stop webcam";$("capture").disabled=false;$("run-live").disabled=!ready;setStatus("Camera on");}catch(e){log("Camera: "+e);}};
function closeCamera(){running=false;if(tick)clearTimeout(tick);stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;$("camera").textContent="Start webcam";$("capture").disabled=true;$("run-live").disabled=true;}
$("capture").onclick=()=>{const img=capture();if(img){ctx.putImageData(img,0,0);setStatus("Snapshot captured");}};
$("compare").onchange=e=>video.classList.toggle("show",e.target.checked);
$("run").onclick=()=>{if(!ready)return;running=false;if(tick)clearTimeout(tick);const img=stream?capture():null;$("run").disabled=true;worker.postMessage({type:"run",code:code.value,input:$("input").value,frame:img?{data:img.data,width:img.width,height:img.height}:null});};
$("run-live").onclick=()=>{if(!ready||!stream)return;running=false;if(tick)clearTimeout(tick);worker.postMessage({type:"configure",code:code.value});setStatus("Preparing live OpenCV…");};
function schedule(){if(!running||pending||!stream)return;tick=setTimeout(()=>void process(),1000/Number($("fps").value));}
async function process(){if(!running||pending||!stream)return;const img=capture();if(!img){schedule();return;}pending=true;if(ai&&model&&!detecting){detecting=true;const source=scratch;model.detect(source,12,.4).then(items=>{lastDetections=items.map(p=>({label:p.class,score:p.score,bbox:p.bbox}));}).catch(e=>log("AI: "+e)).finally(()=>detecting=false);}worker.postMessage({type:"frame",data:img.data,width:img.width,height:img.height,detections:lastDetections});}
$("ai-enable").onclick=async()=>{try{$("ai-enable").disabled=true;setStatus("Downloading AI object detection model…");if(!window.cocoSsd)throw new Error("COCO-SSD model library blocked; check school network");model=await window.cocoSsd.load({base:"lite_mobilenet_v2"});ai=true;$("ai-disable").disabled=false;setStatus("AI detection ready");}catch(e){log(String(e));$("ai-enable").disabled=false;}};
$("ai-disable").onclick=()=>{ai=false;lastDetections=[];$("ai-enable").disabled=false;$("ai-disable").disabled=true;};
const serial=navigator.serial;
function statusRobot(t){$("robot-status").textContent=t;}
function disarm(){armed=false;$("arm").textContent="Arm commands";$("send").disabled=true;statusRobot(port?"Connected · disarmed":"Disconnected");}
async function sendCommand(command,force=false){const line=String(command).trim().toUpperCase();if(!allow.has(line)){log("Blocked command: "+line);return;}if(!port||(!armed&&!force)){log("Command blocked: board not armed");return;}try{await writer.write(new TextEncoder().encode(line+"\n"));log("Sent: "+line);}catch(e){log("Serial write failed: "+e);disarm();}}
async function closeSerial(){if(port){try{await sendCommand("STOP",true);}catch{}disarm();try{await reader?.cancel();}catch{}try{reader?.releaseLock();}catch{}try{writer?.releaseLock();}catch{}try{await port.close();}catch{}port=null;reader=null;writer=null;}disarm();$("connect").textContent="Connect USB board";$("arm").disabled=true;}
$("connect").onclick=async()=>{if(port){await closeSerial();return;}if(!serial){statusRobot("Web Serial requires desktop Chrome or Edge over HTTPS");return;}try{port=await serial.requestPort();await port.open({baudRate:115200});writer=port.writable.getWriter();reader=port.readable.getReader();$("connect").textContent="Disconnect USB board";$("arm").disabled=false;disarm();(async()=>{let pendingLine="";while(port&&reader){let result;try{result=await reader.read();}catch{break;}if(result.done)break;pendingLine+=new TextDecoder().decode(result.value);const parts=pendingLine.split(/\r?\n/);pendingLine=parts.pop()||"";for(const s of parts){$("sensor").value=s.slice(0,256);worker?.postMessage({type:"sensor",value:s});}}})();}catch(e){log("Serial connect: "+e);await closeSerial();}};
$("arm").onclick=()=>{armed=!armed;if(armed){$("arm").textContent="Disarm commands";$("send").disabled=false;statusRobot("ARMED: permitted commands may reach the board");}else{void sendCommand("STOP",true);disarm();}};
$("send").onclick=()=>void sendCommand($("command").value);
$("estop").onclick=()=>{void sendCommand("STOP",true);disarm();running=false;if(tick)clearTimeout(tick);setStatus("Emergency stop requested · verify physical hardware is stopped");};
document.addEventListener("visibilitychange",()=>{if(document.hidden){closeCamera();void sendCommand("STOP",true);disarm();}});
window.addEventListener("pagehide",()=>{closeCamera();void sendCommand("STOP",true);disarm();worker?.terminate();});
launch();
})();