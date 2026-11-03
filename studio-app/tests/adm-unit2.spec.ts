import {test,expect} from '@playwright/test';
test('ADM unit has eleven lessons and old bookmarks redirect',async({page})=>{
 await page.goto('/courses/adm/units/unit-2.html');
 const rows=page.locator('tbody tr');await expect(rows).toHaveCount(11);
 await expect(rows.nth(7)).toContainText('2.1.8');await expect(rows.nth(10)).toContainText('2.1.11');
 await page.goto('/courses/adm/units/unit-2/project-2-1-8.html');await expect(page).toHaveURL(/project-2-1-11.html/);await expect(page.locator('h1')).toContainText('AI-Powered Sorting Machine');
 await page.goto('/courses/adm/units/unit-2/activity-2-2-1.html');await expect(page).toHaveURL(/units\/unit-2.html/);
});
for(const [file,id] of [['activity-2-1-8','sensor-control'],['activity-2-1-9','color-detection'],['project-2-1-10','vision-sorter']])test(`ADM ${file} opens its Studio lesson safely`,async({page})=>{
 await page.goto(`/courses/adm/units/unit-2/${file}.html`);await page.getByRole('link',{name:'Open this lesson in Studio',exact:true}).first().click();
 await expect(page.getByRole('region',{name:'Requested classroom lesson'})).toBeVisible();
 await expect(page.getByText('Python ready',{exact:true})).toBeVisible({timeout:65000});
 await page.getByRole('button',{name:'Open requested lesson',exact:true}).click();await expect(page.getByRole('textbox',{name:'Python filename'})).toHaveValue(id+'.py');
 await expect(page.getByRole('region',{name:'Requested classroom lesson'})).toHaveCount(0);await expect(page).not.toHaveURL(/lesson=/);
 await page.getByLabel('Saved projects',{exact:true}).selectOption('default');await expect(page.getByRole('textbox',{name:'Python filename'})).not.toHaveValue(id+'.py');
});

test('ADM overview titles and buttons remain aligned with a stale navigation manifest',async({page})=>{
 await page.addInitScript(()=>{(window as any).LOCKWOODSTEM_LESSONS={adm:{2:[['2.1.8','Old wrong title','activity-2-2-1.html'],['2.1.9','Another old title','activity-2-2-2.html']]}};});
 await page.goto('/courses/adm/units/unit-2.html');
 const expected=[['2.1.8','Sensor-controlled LED & servo','activity-2-1-8.html'],['2.1.9','Detect a colored object','activity-2-1-9.html'],['2.1.10','Build a vision-controlled sorter','project-2-1-10.html'],['2.1.11','AI-Powered Sorting Machine','project-2-1-11.html']];
 for(const [number,title,file] of expected){const link=page.getByRole('link',{name:`Open Lesson ${number}`,exact:true});await expect(link).toHaveAttribute('href',`unit-2/${file}`);await expect(link.locator('xpath=ancestor::tr').locator('td').nth(1)).toHaveText(title);}
 await expect(page.locator('table')).not.toContainText('Old wrong title');
});

test('Studio lesson pages teach concepts before the practice activity',async({page})=>{
 for(const [file,concept] of [['activity-2-1-8','Boolean'],['activity-2-1-9','false positive'],['project-2-1-10','streak']]){
  await page.goto(`/courses/adm/units/unit-2/${file}.html`);
  await expect(page.locator('#lesson-concepts')).toContainText(concept);
  await expect(page.getByRole('heading',{name:'Predict before opening Studio',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Guided investigation',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'If the result is unexpected',exact:true})).toBeVisible();
  expect(await page.locator('#lesson-concepts').evaluate(e=>!!(e.compareDocumentPosition(document.querySelector('#lesson-activity')!)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 }
});
