import {test,expect} from '@playwright/test';
test('lesson and code stay beside devices, with persistent run controls',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/studio/');await expect(page.getByText('Python ready',{exact:true})).toBeVisible({timeout:65000});await page.getByLabel('Classroom lesson',{exact:true}).selectOption('sensor-control');
 const lesson=await page.locator('.classroom').boundingBox(),code=await page.locator('.workspace-column').boundingBox(),devices=await page.locator('.studio-sidebar').boundingBox();
 expect(Math.abs(lesson!.y-code!.y)).toBeLessThan(2);expect(Math.abs(devices!.y-code!.y)).toBeLessThan(2);expect(lesson!.x+lesson!.width).toBeLessThanOrEqual(code!.x);expect(code!.x+code!.width).toBeLessThanOrEqual(devices!.x);
 await page.getByRole('button',{name:'Arm hardware',exact:true}).click();await page.getByRole('button',{name:'▶ Run lesson',exact:true}).click();await expect(page.getByRole('log',{name:'Python console output'})).toContainText('A0=');await expect(page.locator('.lesson-content')).toHaveAttribute('open','');
 await page.locator('.classroom').evaluate(e=>e.scrollTop=e.scrollHeight);await page.evaluate(()=>window.scrollTo(0,400));
 const toolbar=await page.locator('.studio-toolbar').boundingBox();expect(toolbar!.y).toBeGreaterThanOrEqual(0);expect(toolbar!.y+toolbar!.height).toBeLessThan(400);
 await page.getByRole('button',{name:'■ Stop',exact:true}).click();await expect(page.getByText('Python stopped',{exact:true})).toBeVisible();
});
test('compact screens offer jump links without horizontal overflow',async({page})=>{
 for(const width of [1024,800,390]){await page.setViewportSize({width,height:844});await page.goto('/studio/');await expect(page.getByRole('navigation',{name:'Workspace sections'})).toBeVisible();await page.getByRole('navigation',{name:'Workspace sections'}).getByRole('link',{name:'Code & console',exact:true}).click();await expect(page).toHaveURL(/#code-workspace/);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);}
});
