import {test,expect} from '@playwright/test';

const cases = [
  {id:'sensor-control',number:'2.1.8',snippet:'THRESHOLD = 512',mode:'Program'},
  {id:'color-detection',number:'2.1.9',snippet:'MIN_AREA = 400',mode:'Live vision'},
  {id:'vision-sorter',number:'2.1.10',snippet:'STABLE_FRAMES = 3',mode:'Live vision'}
];
for (const entry of cases) {
  test(`ADM ${entry.number} loads Python starter code in the editor`,async ({page})=>{
    await page.goto('/studio/');
    await expect(page.getByRole('textbox',{name:'Python filename'})).toBeVisible({timeout:65000});
    await page.getByLabel('Classroom lesson',{exact:true}).selectOption(entry.id);
    await expect(page.getByRole('textbox',{name:'Python filename'})).toHaveValue(entry.id+'.py');
    // The simple editor is an ordinary textbox, allowing us to check actual code.
    await page.getByRole('button',{name:'Simple editor',exact:true}).click();
    await expect(page.getByRole('textbox',{name:'Python code',exact:true})).toContainText(entry.snippet);
    await expect(page.getByLabel('Run mode',{exact:true})).toHaveValue(entry.mode==='Program'?'once':'live');
  });
}
