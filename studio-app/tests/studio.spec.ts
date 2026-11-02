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
