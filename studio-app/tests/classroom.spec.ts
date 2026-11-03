import {test,expect,type Page} from '@playwright/test';
async function ready(page:Page){await page.goto('/studio/');await expect(page.getByText('Python ready',{exact:true})).toBeVisible({timeout:65000});}
async function code(page:Page,text:string){if(await page.getByRole('button',{name:'Simple editor',exact:true}).count())await page.getByRole('button',{name:'Simple editor',exact:true}).click();await page.getByRole('textbox',{name:'Python code',exact:true}).fill(text);}
async function lesson(page:Page,id:string){await page.getByLabel('Classroom lesson',{exact:true}).selectOption(id);await expect(page.getByRole('textbox',{name:'Python filename'})).toHaveValue(id+'.py');}
const output=(page:Page)=>page.getByRole('log',{name:'Python console output'});
async function syntheticCamera(page:Page){await page.addInitScript(()=>{
 (window as any).__scene='red';
 Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const context=canvas.getContext('2d')!;const draw=()=>{context.fillStyle=(window as any).__scene;context.fillRect(0,0,640,480);};draw();const timer=setInterval(draw,50);const stream=canvas.captureStream(15);stream.getTracks()[0].addEventListener('ended',()=>clearInterval(timer));return stream;}});
});}

test('guided first run preserves an existing project and prints success',async({page})=>{
 await ready(page);await code(page,'print("Keep my original work")');await expect(page.getByText('Saved on this browser',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Create first-run project',exact:true}).click();await expect(page.getByRole('textbox',{name:'Python filename'})).toHaveValue('first-success.py');await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(output(page)).toContainText('Success! My Python program runs in this browser.');await expect(page.getByText('Python ready',{exact:true})).toBeVisible();
 await page.getByLabel('Saved projects',{exact:true}).selectOption('default');await expect(page.getByRole('textbox',{name:'Python code',exact:true})).toHaveValue('print("Keep my original work")');
});

test('manual simulator follows arming, servo angles, sensor presets and Stop',async({page})=>{
 await ready(page);await expect(page.getByRole('button',{name:'Toggle simulated LED',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Arm hardware',exact:true}).click();await page.getByRole('button',{name:'Toggle simulated LED',exact:true}).click();await expect(page.getByLabel('LED on',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Servo 180°',exact:true}).click();await expect(page.getByRole('img',{name:'Servo diagram: 180 degrees',exact:true})).toBeVisible();await expect(page.locator('.servo-arm')).toHaveAttribute('style',/rotate\(90deg\)/);
 await page.getByRole('button',{name:'A0 513',exact:true}).click();await expect(page.getByLabel('Simulated sensor',{exact:true})).toHaveValue('513');await expect(page.getByLabel('Sensor level',{exact:true})).toHaveAttribute('value','513');
 await page.getByRole('button',{name:'Stop hardware',exact:true}).click();await expect(page.getByLabel('LED off',{exact:true})).toBeVisible();await expect(page.getByRole('img',{name:'Servo diagram: detached; last commanded angle 180 degrees',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Servo 90°',exact:true})).toBeDisabled();
});

test('sensor lesson checks prerequisites and executes boundary decisions',async({page})=>{
 await ready(page);await lesson(page,'sensor-control');await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(page.locator('.studio-notice')).toContainText('Arm hardware in the Hardware lab before running this lesson. Start with Simulator.');await expect(page.getByText('Python ready',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'A0 512',exact:true}).click();await page.getByRole('button',{name:'Arm hardware',exact:true}).click();await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(output(page)).toContainText('A0=512 | LED=False | servo=90');await expect(page.getByRole('button',{name:'Toggle simulated LED',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'A0 513',exact:true}).click();await expect(output(page)).toContainText('A0=513 | LED=True');await expect(page.getByLabel('LED on',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'A0 1023',exact:true}).click();await expect(page.getByRole('img',{name:'Servo diagram: 180 degrees',exact:true})).toBeVisible();await page.getByRole('button',{name:'■ Stop'}).click();await expect(page.getByLabel('LED off',{exact:true})).toBeVisible();
});

test('lesson notes persist and round-trip in submission without unrelated console',async({page})=>{
 await ready(page);await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(output(page)).toContainText('Liftoff!');await expect(page.getByText('Python ready',{exact:true})).toBeVisible();await lesson(page,'sensor-control');
 await page.getByLabel('I tested both sides of the threshold, including the boundary.',{exact:true}).check();await page.getByLabel('Observations & reflection',{exact:true}).fill('512: LED off. 513: LED on. Simulator only.');await expect(page.getByText('Saved on this browser',{exact:true})).toBeVisible();await page.reload();await expect(page.getByLabel('Observations & reflection',{exact:true})).toHaveValue('512: LED off. 513: LED on. Simulator only.');await expect(page.getByLabel('I tested both sides of the threshold, including the boundary.',{exact:true})).toBeChecked();
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export submission',exact:true}).click();const download=await event;const stream=await download.createReadStream();let body='';for await(const chunk of stream!)body+=chunk.toString();const data=JSON.parse(body);expect(data.project.lesson).toEqual({id:'sensor-control',checks:[0],reflection:'512: LED off. 513: LED on. Simulator only.'});expect(data.console).toBe('');
 await expect(page.getByText('Python ready',{exact:true})).toBeVisible({timeout:65000});await page.locator('input[type=file]').setInputFiles({name:'lesson.json',mimeType:'application/json',buffer:Buffer.from(body)});await page.getByRole('button',{name:'Replace program',exact:true}).click();await expect(page.getByLabel('Observations & reflection',{exact:true})).toHaveValue(data.project.lesson.reflection);
 data.project.lesson.checks=[99];await page.locator('input[type=file]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});await expect(page.locator('.studio-notice')).toContainText('The file could not be read. Please try again.');await expect(page.getByRole('button',{name:'Replace program',exact:true})).toHaveCount(0);
});

test('color lesson processes positive and negative scenes and requires live mode',async({page})=>{
 await syntheticCamera(page);await ready(page);await lesson(page,'color-detection');await page.getByLabel('Run mode',{exact:true}).selectOption('once');await page.getByRole('button',{name:'▶ Run',exact:true}).click();await expect(page.locator('.studio-notice')).toContainText('Choose Live vision in Run mode for this lesson.');await page.getByLabel('Run mode',{exact:true}).selectOption('live');await page.getByRole('button',{name:'▶ Run live'}).click();await expect(page.locator('.studio-notice')).toContainText('Start the camera before Run live.');
 await page.getByRole('button',{name:'Start camera',exact:true}).click();await expect(page.getByRole('button',{name:'Capture frame'})).toBeEnabled();await page.getByRole('button',{name:'▶ Run live'}).click();await expect(page.getByLabel('Processed image',{exact:true})).toBeVisible({timeout:65000});
 const center=()=>page.getByLabel('Processed image',{exact:true}).evaluate((c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(320,240,1,1).data[0]);await expect.poll(center).toBe(0);await page.evaluate(()=>(window as any).__scene='#00ff00');await expect.poll(center).toBe(255);await page.getByRole('button',{name:'■ Stop'}).click();await expect(page.getByText('Camera off',{exact:true})).toBeVisible();
});

test('sorter lesson drives both gate positions from webcam colors and stops',async({page})=>{
 await syntheticCamera(page);await ready(page);await lesson(page,'vision-sorter');await page.getByRole('button',{name:'Start camera',exact:true}).click();await expect(page.getByRole('button',{name:'Capture frame'})).toBeEnabled();await page.getByRole('button',{name:'Arm hardware',exact:true}).click();await page.getByRole('button',{name:'▶ Run live'}).click();await expect(page.getByRole('img',{name:'Servo diagram: 30 degrees',exact:true})).toBeVisible({timeout:65000});await expect(page.getByLabel('LED off',{exact:true})).toBeVisible();
 await page.evaluate(()=>(window as any).__scene='#00ff00');await expect(page.getByRole('img',{name:'Servo diagram: 150 degrees',exact:true})).toBeVisible();await expect(page.getByLabel('LED on',{exact:true})).toBeVisible();await page.evaluate(()=>(window as any).__scene='red');await expect(page.getByRole('img',{name:'Servo diagram: 30 degrees',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'■ Stop'}).click();await expect(page.getByText('Python stopped',{exact:true})).toBeVisible();await expect(page.getByLabel('LED off',{exact:true})).toBeVisible();await expect(page.getByText('Camera off',{exact:true})).toBeVisible();
});

test('camera denial offers recovery guidance and lessons fit a phone',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{throw new DOMException('denied','NotAllowedError');}}));await ready(page);await lesson(page,'color-detection');await page.getByRole('button',{name:'Start camera',exact:true}).click();await expect(page.getByText('Camera permission was denied. Allow camera access in the browser site settings, then select Start camera.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Start camera',exact:true})).toBeEnabled();await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
});
