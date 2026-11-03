import {test,expect,type Page} from '@playwright/test';
async function ready(page:Page) {await page.goto('/studio/');await expect(page.getByText('Python ready',{exact:true})).toBeVisible({timeout:65000});}
async function code(page:Page,text:string) {if(await page.getByRole('button',{name:'Simple editor',exact:true}).count())await page.getByRole('button',{name:'Simple editor',exact:true}).click();await page.getByRole('textbox',{name:'Python code',exact:true}).fill(text);}
const output=(page:Page)=>page.getByRole('log',{name:'Python console output'});
test('Monaco loads, runs Python and preserves site navigation',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await ready(page);await expect(page.locator('.monaco-editor')).toBeVisible();
  await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(output(page)).toContainText('Liftoff!');await expect(output(page)).toContainText('Program finished.');
  await expect(page.getByRole('link',{name:'Studio',exact:true})).toHaveAttribute('aria-current','page');
  expect(errors).toEqual([]);
});
test('input queue, Python error, and fresh run variables',async({page})=>{
  await ready(page);await code(page,'name = input("Name: ")\nprint("Hello", name)');
  await page.getByText('Program input · for input()').click();await page.locator('#program-input').fill('Ada');await page.getByRole('button',{name:'▶ Run'}).click();await expect(output(page)).toContainText('Hello Ada');
  await code(page,'print(name)');await page.getByRole('button',{name:'▶ Run'}).click();await expect(output(page)).toContainText('NameError');
  await code(page,'print(6 * 7)');await page.getByRole('button',{name:'▶ Run'}).click();await expect(output(page)).toContainText('42');
});
test('Stop interrupts infinite loop, restart recovers, output stays bounded',async({page})=>{
  await ready(page);await code(page,'while True:\n    print("loop")');await page.getByRole('button',{name:'▶ Run'}).click();await expect(output(page)).toContainText('Output limit reached');
  await page.getByRole('button',{name:'■ Stop'}).click();await expect(page.getByText('Python stopped',{exact:true})).toBeVisible();
  expect(await output(page).locator('pre').count()).toBeLessThan(550);
  await page.getByRole('button',{name:'Restart Python'}).click();await expect(page.getByText('Python ready',{exact:true})).toBeVisible({timeout:65000});
  await code(page,'print("Recovered")');await page.getByRole('button',{name:'▶ Run'}).click();await expect(output(page)).toContainText('Recovered');
});
test('IndexedDB restores code, filename, and input after reload',async({page})=>{
  await ready(page);await code(page,'print("Saved mission")');await page.getByRole('textbox',{name:'Python filename'}).fill('saved.py');
  await page.getByText('Program input · for input()').click();await page.locator('#program-input').fill('saved input');
  await expect(page.getByText('Saved on this browser',{exact:true})).toBeVisible();await page.reload();
  await expect(page.getByText('Saved on this browser',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Simple editor',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Python code',exact:true})).toHaveValue('print("Saved mission")');await expect(page.getByRole('textbox',{name:'Python filename'})).toHaveValue('saved.py');
  await page.getByText('Program input · for input()').click();await expect(page.locator('#program-input')).toHaveValue('saved input');
});
test('import requires replacement confirmation and exports exact Python',async({page})=>{
  await ready(page);await code(page,'print("keep")');
  await page.locator('input[type=file]').setInputFiles({name:'imported.py',mimeType:'text/x-python',buffer:Buffer.from('print("café 🚀")\n')});
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByRole('textbox',{name:'Python code',exact:true})).toHaveValue('print("keep")');
  await page.locator('input[type=file]').setInputFiles({name:'imported.py',mimeType:'text/x-python',buffer:Buffer.from('print("café 🚀")\n')});await page.getByRole('button',{name:'Replace program',exact:true}).click();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export .py',exact:true}).click();const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('imported.py');const stream=await download.createReadStream();let body='';for await(const chunk of stream!)body+=chunk.toString();expect(body).toBe('print("café 🚀")\n');
});
test('webcam snapshot reaches real Python/OpenCV',async({page})=>{
  await ready(page);await page.getByRole('button',{name:'Start camera',exact:true}).click();await expect(page.getByRole('button',{name:'Capture frame'})).toBeEnabled();
  await page.getByRole('button',{name:'Capture frame'}).click();await expect(page.getByText('Frame captured · available to your next run')).toBeVisible();
  await code(page,'import cv2\nframe = get_frame()\nprint(frame.shape)\nprint(cv2.cvtColor(frame, cv2.COLOR_RGBA2GRAY).shape)');await page.getByRole('button',{name:'▶ Run'}).click();
  await expect(output(page)).toContainText('(480, 640, 4)',{timeout:65000});await expect(output(page)).toContainText('(480, 640)');
  await page.getByRole('button',{name:'Stop camera'}).click();await expect(page.getByText('Camera off',{exact:true})).toBeVisible();
});
test('network failure and unavailable storage have actionable messages',async({page})=>{
  await page.route('**/pyodide.js',route=>route.abort());
  await page.addInitScript(()=>Object.defineProperty(window,'indexedDB',{value:{open:()=>{throw new Error('blocked');}}}));
  await page.goto('/studio/');await expect(page.getByText('Python unavailable',{exact:true})).toBeVisible({timeout:65000});await expect(output(page)).toContainText('Python could not load');
  await expect(page.getByText('Autosave unavailable — export your work')).toBeVisible();await expect(page.getByRole('button',{name:'Export .py',exact:true})).toBeEnabled();
});
test('mobile layout stays within viewport and menu remains usable',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/studio/');await expect(page.getByRole('heading',{name:/AI Programming Studio/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await page.getByRole('button',{name:'Menu',exact:true}).click();await expect(page.getByRole('link',{name:'Studio',exact:true})).toBeVisible();
});

test('continuous OpenCV displays processed frames and Stop releases the camera',async({page})=>{
 await ready(page);await page.getByRole('button',{name:'Start camera',exact:true}).click();await expect(page.getByRole('button',{name:'Capture frame'})).toBeEnabled();
 await code(page,'import cv2\ndef process_frame(frame):\n    return cv2.Canny(cv2.cvtColor(frame, cv2.COLOR_RGBA2GRAY), 70, 140)');
 await page.getByLabel('Run mode',{exact:true}).selectOption('live');await page.getByRole('button',{name:'▶ Run live',exact:true}).click();
 await expect(page.getByLabel('Processed image',{exact:true})).toBeVisible({timeout:65000});
 await expect(page.getByText(/^[2-9]\d* frames processed$/)).toBeVisible();
 const pixel=await page.getByLabel('Processed image',{exact:true}).evaluate((c:HTMLCanvasElement)=>Array.from(c.getContext('2d')!.getImageData(0,0,1,1).data));expect(pixel[0]).toBe(pixel[1]);expect(pixel[3]).toBe(255);
 await page.getByRole('button',{name:'■ Stop'}).click();await expect(page.getByText('Python stopped',{exact:true})).toBeVisible();await expect(page.getByText('Camera off',{exact:true})).toBeVisible();
 expect(await page.locator('video').evaluate((v:HTMLVideoElement)=>v.srcObject)).toBeNull();
});
test('invalid live output errors, and a stuck callback is terminable',async({page})=>{
 await ready(page);await page.getByRole('button',{name:'Start camera',exact:true}).click();await expect(page.getByRole('button',{name:'Capture frame'})).toBeEnabled();
 await code(page,'def process_frame(frame):\n    return 42');await page.getByLabel('Run mode',{exact:true}).selectOption('live');await page.getByRole('button',{name:'▶ Run live'}).click();await expect(output(page)).toContainText('Return gray, RGB or RGBA',{timeout:65000});
 await code(page,'def process_frame(frame):\n    while True: pass');await page.getByRole('button',{name:'▶ Run live'}).click();await page.waitForTimeout(500);await page.getByRole('button',{name:'■ Stop'}).click();await expect(page.getByText('Python stopped',{exact:true})).toBeVisible();
});
test('Python simulation reads sensor, updates actuators, validates values and stops',async({page})=>{
 await ready(page);await page.getByLabel('Simulated sensor').fill('800');await page.getByRole('button',{name:'Arm hardware',exact:true}).click();
 await code(page,'import asyncio\nprint(await arduino.sensor())\nawait arduino.led(True)\nawait arduino.servo(120)\nawait asyncio.sleep(30)');await page.getByRole('button',{name:'▶ Run',exact:true}).click();
 await expect(output(page)).toContainText('800');await expect(page.getByLabel('LED on',{exact:true})).toBeVisible();await expect(page.getByText('LED on · Servo 120°')).toBeVisible();
 await page.getByRole('button',{name:'■ Stop'}).click();await expect(page.getByLabel('LED off',{exact:true})).toBeVisible();await expect(page.getByText('LED off · Servo detached',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Restart Python'}).click();await expect(page.getByText('Python ready',{exact:true})).toBeVisible({timeout:65000});
 await code(page,'await arduino.servo(181)');await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(output(page)).toContainText('Servo angle must be');
 await code(page,'await arduino.led(True)');await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(output(page)).toContainText('Arm hardware before running');
});
test('migration keeps v1 current and legacy drafts; projects and submission round trip',async({page})=>{
 await page.goto('/studio/');await page.evaluate(async()=>{await new Promise<void>((resolve,reject)=>{const d=indexedDB.deleteDatabase('lockwoodstem-studio');d.onsuccess=()=>resolve();d.onerror=()=>reject(d.error);});await new Promise<void>((resolve,reject)=>{const r=indexedDB.open('lockwoodstem-studio',1);r.onupgradeneeded=()=>r.result.createObjectStore('projects');r.onsuccess=()=>{const db=r.result,t=db.transaction('projects','readwrite');t.objectStore('projects').put({name:'Old mission.py',code:'print("old")',input:'123'},'current');t.oncomplete=()=>{db.close();resolve();};};r.onerror=()=>reject(r.error);});localStorage.setItem('lockwood_unified_studio',JSON.stringify({code:'def process_frame(frame):\n    return frame',example:'edge'}));});
 await page.reload();await expect(page.getByText('Saved on this browser',{exact:true})).toBeVisible();await expect(page.getByRole('textbox',{name:'Python filename'})).toHaveValue('Old mission.py');
 await page.getByLabel('Saved projects').selectOption('legacy-unified');await expect(page.getByLabel('Run mode',{exact:true})).toHaveValue('live');
 await page.getByRole('button',{name:'New project',exact:true}).click();await code(page,'print("submission")');await page.getByRole('textbox',{name:'Python filename'}).fill('Flight project');
 await expect(page.getByText('Saved on this browser',{exact:true})).toBeVisible();
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export submission',exact:true}).click();const dl=await event;const stream=await dl.createReadStream();let body='';for await(const chunk of stream!)body+=chunk.toString();const data=JSON.parse(body);expect(data.project.code).toBe('print("submission")');expect(data.format).toBe('lockwoodstem-project-v2');
 await page.locator('input[type=file]').setInputFiles({name:'project.json',mimeType:'application/json',buffer:Buffer.from(body)});await page.getByRole('button',{name:'Replace program',exact:true}).click();await expect(page.getByRole('textbox',{name:'Python code',exact:true})).toHaveValue('print("submission")');
 expect(await page.evaluate(()=>localStorage.getItem('lockwood_unified_studio'))).not.toBeNull();
});
async function mockSerial(page:Page,timeout=false){await page.addInitScript(({timeout})=>{
 const state={writes:[] as string[],closed:false};(window as any).__serial=state;let controller:ReadableStreamDefaultController<Uint8Array>;
 const encoder=new TextEncoder();const port={open:async()=>{},close:async()=>{state.closed=true;},readable:new ReadableStream<Uint8Array>({start(c){controller=c;}}),writable:new WritableStream<Uint8Array>({write(bytes){const line=new TextDecoder().decode(bytes).trim();state.writes.push(line);const [id,cmd,value]=line.split(' ');if(timeout&&cmd==='LED')return;const reply=`${id} OK ${cmd==='HELLO'?'1':cmd==='SENSOR'?'723':value}\n`;const at=Math.floor(reply.length/2);controller.enqueue(encoder.encode('boot\n'+reply.slice(0,at)));controller.enqueue(encoder.encode(reply.slice(at)));}})};
 Object.defineProperty(navigator,'serial',{value:{requestPort:async()=>port},configurable:true});
 },{timeout});}
test('serial handshake, fragmented replies, Python commands and STOP cleanup',async({page})=>{
 await mockSerial(page);await ready(page);await page.getByLabel('Hardware mode').selectOption('board');await page.getByRole('button',{name:'Connect board',exact:true}).click();await expect(page.getByText('Firmware v1 ready · disarmed')).toBeVisible();await page.getByRole('button',{name:'Arm hardware',exact:true}).click();await expect(page.getByText('Armed · commands enabled',{exact:true})).toBeVisible();
 await code(page,'import asyncio\nprint(await arduino.sensor())\nawait arduino.led(True)\nawait arduino.servo(90)\nawait asyncio.sleep(30)');await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(output(page)).toContainText('723');await expect(page.getByText('LED on · Servo 90°')).toBeVisible();await page.getByRole('button',{name:'■ Stop'}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__serial.writes.at(-1))).toMatch(/ STOP 0$/);
 await page.getByRole('button',{name:'Disconnect board',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).__serial.closed)).toBe(true);
});
test('serial timeout disarms and reports failure to Python',async({page})=>{
 await mockSerial(page,true);await ready(page);await page.getByLabel('Hardware mode').selectOption('board');await page.getByRole('button',{name:'Connect board',exact:true}).click();await expect(page.getByText('Firmware v1 ready · disarmed')).toBeVisible();await page.getByRole('button',{name:'Arm hardware',exact:true}).click();await expect(page.getByText('Armed · commands enabled',{exact:true})).toBeVisible();
 await code(page,'await arduino.led(True)');await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(output(page)).toContainText('Board response timed out');await expect(page.getByLabel('LED off',{exact:true})).toBeVisible();await expect.poll(()=>page.evaluate(()=>(window as any).__serial.closed)).toBe(true);
});

test('hidden tab stops an active program and disarms simulation',async({page})=>{
 await ready(page);await page.getByRole('button',{name:'Arm hardware',exact:true}).click();await code(page,'import asyncio\nawait arduino.led(True)\nawait asyncio.sleep(30)');await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(page.getByLabel('LED on',{exact:true})).toBeVisible();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.getByText('Python stopped',{exact:true})).toBeVisible();await expect(page.getByLabel('LED off',{exact:true})).toBeVisible();
});
test('AI detections from the current frame reach Python',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/**',route=>route.fulfill({contentType:'text/javascript',body:'window.tf={};window.cocoSsd={load:async()=>({detect:async()=>[{class:"cup",score:0.9,bbox:[10,20,30,40]}]})};'}));
 await ready(page);await page.getByRole('button',{name:'Start camera',exact:true}).click();await expect(page.getByRole('button',{name:'Capture frame'})).toBeEnabled();await page.getByText('AI models & custom classifier',{exact:true}).click();await page.getByRole('button',{name:'Load object detector',exact:true}).click();await expect(page.getByText('Model ready · predictions update during Run live · objects')).toBeVisible();
 await code(page,'def process_frame(frame):\n    print(get_detections()[0]["label"])\n    return frame');await page.getByLabel('Run mode',{exact:true}).selectOption('live');await page.getByRole('button',{name:'▶ Run live'}).click();await expect(output(page)).toContainText('cup',{timeout:65000});await expect(page.getByLabel('Processed image',{exact:true})).toBeVisible();await page.getByRole('button',{name:'■ Stop'}).click();
});

for(const starter of ['face.py','color.py','motion.py','marker.py'])test(`legacy ${starter} starter processes real OpenCV frames`,async({page})=>{
 await ready(page);await page.getByLabel('Starter program',{exact:true}).selectOption(starter);await page.getByRole('button',{name:'Replace program',exact:true}).click();await page.getByRole('button',{name:'Start camera',exact:true}).click();await expect(page.getByRole('button',{name:'Capture frame'})).toBeEnabled();await page.getByRole('button',{name:'▶ Run live'}).click();await expect(page.getByLabel('Processed image',{exact:true})).toBeVisible({timeout:65000});await page.getByRole('button',{name:'■ Stop'}).click();
});

test('saved custom classifier is consumed by React and exposed to Python',async({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/**',route=>route.fulfill({contentType:'text/javascript',body:`window.tf={tidy:f=>f(),browser:{fromPixels:()=>({})}};window.mobilenet={load:async()=>({infer:()=>({flatten:()=>({norm:()=>({add:()=>1}),div:()=>({dataSync:()=>new Float32Array(1280).fill(1/Math.sqrt(1280))})})})})};`}));
 await ready(page);await page.evaluate(async()=>{await new Promise<void>((resolve,reject)=>{const r=indexedDB.open('lockwoodstem-classifier-model',1);r.onupgradeneeded=()=>r.result.createObjectStore('models');r.onsuccess=()=>{const db=r.result,t=db.transaction('models','readwrite');t.objectStore('models').put({format:'lockwoodstem-classifier-v1',featureExtractor:{name:'mobilenet-v2',alpha:.5},classes:[{name:'bolt',center:Array(1280).fill(1/Math.sqrt(1280))},{name:'washer',center:Array(1280).fill(-1/Math.sqrt(1280))}]},'current');t.oncomplete=()=>{db.close();resolve();};t.onerror=()=>reject(t.error);};});});
 await page.getByRole('button',{name:'Start camera',exact:true}).click();await expect(page.getByRole('button',{name:'Capture frame'})).toBeEnabled();await page.getByText('AI models & custom classifier',{exact:true}).click();await page.getByRole('button',{name:'Load saved classifier',exact:true}).click();await expect(page.getByText('Model ready · predictions update during Run live · custom')).toBeVisible();await code(page,'def process_frame(frame):\n    print(get_custom_prediction()[0]["label"])\n    return frame');await page.getByLabel('Run mode',{exact:true}).selectOption('live');await page.getByRole('button',{name:'▶ Run live'}).click();await expect(output(page)).toContainText('bolt',{timeout:65000});await page.getByRole('button',{name:'■ Stop'}).click();
});
