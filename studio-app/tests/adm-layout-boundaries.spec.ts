import {test,expect} from '@playwright/test';

for (const id of ['sensor-control','color-detection','vision-sorter']) {
 test(`ADM ${id} keeps Python editor within workspace boundaries`, async ({page}) => {
   await page.setViewportSize({width:1842,height:900});
   await page.goto('/studio/');
   await expect(page.getByLabel('Classroom lesson',{exact:true})).toBeEnabled({timeout:65000});
   await page.getByLabel('Classroom lesson',{exact:true}).selectOption(id);
   await expect(page.getByRole('textbox',{name:'Python filename'})).toHaveValue(id+'.py');
   const editor=page.locator('.studio-editor');
   await expect(editor).toBeVisible();
   const bounds=await page.evaluate(()=>{
     const rect=(selector:string)=>document.querySelector(selector)!.getBoundingClientRect();
     const editor=rect('.studio-editor');
     const workspace=rect('.workspace-column');
     const sidebar=rect('.studio-sidebar');
     const grid=rect('.studio-grid');
     return {editor:{left:editor.left,right:editor.right},workspace:{left:workspace.left,right:workspace.right},sidebar:{left:sidebar.left,right:sidebar.right},grid:{left:grid.left,right:grid.right},documentWidth:document.documentElement.scrollWidth,windowWidth:innerWidth};
   });
   expect(bounds.editor.left).toBeGreaterThanOrEqual(bounds.workspace.left-2);
   expect(bounds.editor.right).toBeLessThanOrEqual(bounds.workspace.right+2);
   expect(bounds.workspace.right).toBeLessThanOrEqual(bounds.sidebar.left+2);
   expect(bounds.grid.right).toBeLessThanOrEqual(bounds.windowWidth+2);
   expect(bounds.documentWidth).toBeLessThanOrEqual(bounds.windowWidth+2);
 });
}
