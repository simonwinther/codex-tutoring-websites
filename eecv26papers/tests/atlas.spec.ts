import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {Paper,Figure} from '../src/types';
const papers:Paper[]=JSON.parse(readFileSync(new URL('../data/papers.json',import.meta.url),'utf8'));
const figures:Figure[]=JSON.parse(readFileSync(new URL('../data/figures.json',import.meta.url),'utf8'));

test('atlas filters, labelled connections, previews, and navigation',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('.map-paper')).toHaveCount(papers.length);
 await page.locator('.map-paper[href="#/paper/drift"]').hover();await expect(page.locator('.paper-popover')).toContainText('slice thickness');
 await page.getByRole('button',{name:'Connection: ParaFlow and DRIFT, Efficient flow inference',exact:true}).click();await expect(page.locator('.edge-inspector')).toContainText('parallelizes tentative steps');await page.getByRole('button',{name:'Close connection'}).click();
 await page.getByRole('button',{name:'Flow matching',exact:true}).click();await expect(page.locator('.map-paper:not(.dimmed)')).toHaveCount(3);
 await page.getByRole('button',{name:'Paper card view'}).click();await expect(page.locator('.paper-tile')).toHaveCount(3);await page.locator('.paper-tile').filter({hasText:'DRIFT'}).getByRole('link',{name:'Understand the method'}).click();await expect(page.locator('h1')).toContainText('DRIFT');expect(errors).toEqual([]);
});

for(const paper of papers){test(`${paper.short}: complete source-grounded page, walkthrough and all visuals`,async({page,request})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`/#/paper/${paper.id}`);await expect(page.locator('h1')).toContainText(paper.short);
 for(const section of ['overview','method','training','evidence','equations','connections'])await expect(page.locator(`#${section}`)).toBeAttached();
 const stages=page.locator('.pipeline-item>button');await expect(stages).toHaveCount(paper.stages.length);await stages.last().click();await expect(page.locator('.stage-detail h3')).toHaveText(paper.stages.at(-1)!.label);
 await expect(page.locator('.phase-card')).toHaveCount(2);await expect(page.locator('.result-card')).toHaveCount(paper.results.length);await expect(page.locator('.katex-error')).toHaveCount(0);
 const images=page.locator('.figure-image img');await expect(images).toHaveCount(3);for(const img of await images.all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBeTruthy()}
 for(const fig of figures.filter(f=>f.paper===paper.id)){const image=await request.get(`/${fig.file}`);expect(image.ok()).toBeTruthy();expect(image.headers()['content-type']).toContain('image/png');const vector=await request.get(`/${fig.vector}`);expect(vector.ok()).toBeTruthy()}
 await page.getByRole('button',{name:'Mark as reviewed',exact:true}).click();await expect(page.getByRole('button',{name:'Reviewed',exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:'Reviewed',exact:true})).toBeAttached();expect(errors).toEqual([]);
})}

test('source reader renders cited physical page and handles rapid navigation',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/#/paper/paraflow');await page.locator('.one-sentence .citation').click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(page.getByLabel('PDF page',{exact:true})).toHaveValue('3');await expect.poll(()=>page.locator('.pdf-canvas-wrap canvas').evaluate((c:HTMLCanvasElement)=>c.width)).toBeGreaterThan(500);await expect(page.locator('.loading')).toHaveCount(0);await page.getByRole('button',{name:'Next PDF page'}).click();await page.getByRole('button',{name:'Next PDF page'}).click();await expect(page.getByLabel('PDF page',{exact:true})).toHaveValue('5');await expect(page.locator('.loading')).toHaveCount(0);await page.getByRole('button',{name:'Zoom in PDF'}).click();await expect(page.locator('.pdf-toolbar')).toContainText('120%');await expect(page.locator('.loading')).toHaveCount(0);await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);expect(errors).toEqual([]);
});

test('all global routes, concept roles, comparison limit and quick recall figures',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));for(const route of ['thesis','concepts','compare','recall','study']){await page.goto(`/#/${route}`);await expect(page.locator('main h1')).toBeVisible();}
 await page.goto('/#/concepts');await page.getByRole('button',{name:'Wavelets / frequency',exact:true}).click();await expect(page.locator('.distinction-mini')).toContainText('DeBaT ≠ KernelWave');await page.getByRole('button',{name:/Haar DWT/}).click();await expect(page.getByRole('dialog')).toContainText('training augmentation');await page.keyboard.press('Escape');
 await page.goto('/#/compare');await page.getByRole('button',{name:'DeBaT',exact:true}).click();await page.getByRole('button',{name:'WCC4MS',exact:true}).click();await expect(page.getByRole('button',{name:'SPHERE',exact:true})).toBeDisabled();await expect(page.locator('thead th')).toHaveCount(5);await page.getByLabel('Essentials only').check();await expect(page.locator('tbody tr')).toHaveCount(6);
 await page.goto('/#/recall');await expect(page.locator('.recall-card')).toHaveCount(8);for(const img of await page.locator('.recall-card img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBeTruthy()}expect(errors).toEqual([]);
});

test('study hints, answers, per-paper questions, persistence and filtering',async({page})=>{
 await page.goto('/#/study/drift');await expect(page.getByLabel('Study paper')).toHaveValue('drift');await expect(page.locator('.study-card-top')).toContainText('1 of 8');await expect(page.locator('.study-answer')).toHaveCount(0);await page.getByRole('button',{name:'Show hint',exact:true}).click();await expect(page.locator('.study-hint')).toBeVisible();await page.getByRole('button',{name:'Show answer',exact:true}).click();await page.getByRole('button',{name:'I can explain it',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Show answer',exact:true}).click();await expect(page.getByRole('button',{name:'I can explain it',exact:true})).toHaveClass(/selected/);await page.getByLabel('Hide confident questions').check();await expect(page.locator('.study-card-top')).toContainText('1 of 7');await page.getByLabel('Question level').selectOption('Method');await expect(page.locator('.study-card-top')).toContainText('1 of 3');
});

test('published interactive controls expose formula and measured trade-offs',async({page})=>{
 await page.goto('/#/paper/drift');await page.getByLabel('Input slice thickness',{exact:true}).fill('0.7');await expect(page.locator('.lab-readouts')).toContainText('0.000');await expect(page.locator('.step-dots .filled')).toHaveCount(0);await page.getByLabel('Input slice thickness',{exact:true}).fill('5.6');await expect(page.locator('.step-dots .filled')).toHaveCount(13);
 await page.goto('/#/paper/paraflow');await page.getByRole('button',{name:'32',exact:true}).click();await expect(page.locator('.lab-readouts')).toContainText('472.44');await expect(page.locator('.lab-readouts')).toContainText('15.12');
 await page.goto('/#/paper/wcc4ms');await page.getByLabel('KernelWave gain').fill('2');await expect(page.locator('.coefficient-grid')).toContainText('0.50× HF');await expect(page.locator('.coefficient-grid')).toContainText('2.00× HF');
});

test('phone layout, navigation, search, figures and page bounds',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.getByRole('button',{name:'Paper card view'}).click();await page.locator('.paper-tile').filter({hasText:'DRIFT'}).getByRole('link',{name:'Understand the method'}).click();await expect(page.locator('h1')).toContainText('DRIFT');await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.getByRole('button',{name:'Enlarge DRIFT Figure 2'}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Zoom in figure'}).click();await expect(page.locator('.figure-inspector-toolbar')).toContainText('125%');await page.getByRole('button',{name:'Close dialog'}).click();await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('link',{name:'Study mode',exact:true}).click();await expect(page.locator('h1')).toContainText('without the abstract');
 for(const route of ['thesis','concepts','compare','recall']){await page.goto(`/#/${route}`);await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()}
});
