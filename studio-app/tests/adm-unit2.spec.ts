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
