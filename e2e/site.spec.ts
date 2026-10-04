import { test, expect } from '@playwright/test';

test('real worker solution, playback, pause, backward and refresh persistence', async ({ page }) => {
  const errors:string[]=[];page.on('pageerror', e=>errors.push(e.message));
  await page.goto('/solve');
  await expect(page.getByRole('heading',{name:'Перенесіть кольори'})).toBeVisible();
  await page.getByRole('button',{name:'Знайти розв’язання'}).click();
  await expect(page.getByRole('button',{name:'Наступний рух',exact:true})).toBeVisible({timeout:45000});
  const initial=await page.evaluate(()=>JSON.parse(localStorage.getItem('kubyk:v1')!));
  expect(initial.solution.moves.length).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Наступний рух',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kubyk:v1')!).step)).toBe(1);
  await page.getByRole('button',{name:'Назад',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kubyk:v1')!).step)).toBe(0);
  await page.getByRole('button',{name:'Відтворити',exact:true}).click();
  await expect(page.getByRole('button',{name:'Пауза',exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kubyk:v1')!).step)).toBeGreaterThanOrEqual(1);
  await page.getByRole('button',{name:'Пауза',exact:true}).click();
  await page.waitForTimeout(1100);
  const paused=await page.evaluate(()=>JSON.parse(localStorage.getItem('kubyk:v1')!).step);
  await page.waitForTimeout(1100);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kubyk:v1')!).step)).toBe(paused);
  await page.reload();
  await expect(page.getByRole('button',{name:'Назад',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kubyk:v1')!).step)).toBe(paused);
  await page.getByRole('button',{name:'На початок',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kubyk:v1')!).step)).toBe(0);
  await page.locator('.speed-label select').selectOption('2');
  for(let i=0;i<initial.solution.moves.length;i++){
    await page.getByRole('button',{name:'Наступний рух',exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kubyk:v1')!).step)).toBe(i+1);
  }
  await expect(page.getByText('Кубик складено!',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Назад',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('kubyk:v1')!).step)).toBe(initial.solution.moves.length-1);
  await page.locator('.move-list button').last().click();
  await expect(page.getByText('Кубик складено!',{exact:true})).toBeVisible();
  await page.screenshot({path:'outputs/solution-desktop.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('invalid, empty and already solved states',async({page})=>{
  await page.goto('/solve');
  await page.getByRole('button',{name:'Очистити',exact:true}).click();
  await page.getByRole('button',{name:'Знайти розв’язання'}).click();
  await expect(page.getByRole('alert')).toContainText(/заповн/i);
  await page.evaluate(()=>{const colors=['white','red','green','yellow','orange','blue'];localStorage.setItem('kubyk:v1',JSON.stringify({input:colors.flatMap(c=>Array(9).fill(c)),solution:null,step:0,speed:1}));});
  await page.reload();
  await page.getByRole('button',{name:'Знайти розв’язання'}).click();
  await expect(page.getByText('Кубик складено!',{exact:true})).toBeVisible();
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('kubyk:v1')!);[s.input[5],s.input[10]]=[s.input[10],s.input[5]];s.solution=null;localStorage.setItem('kubyk:v1',JSON.stringify(s));});
  await page.reload();
  await page.getByRole('button',{name:'Знайти розв’язання'}).click();
  await expect(page.getByRole('alert')).toContainText('реб');
  await expect(page.getByRole('button',{name:'Наступний рух',exact:true})).toHaveCount(0);
});

test('navigation, all lessons, mobile and keyboard controls',async({page})=>{
  await page.goto('/solve');
  await page.screenshot({path:'outputs/home-desktop.png',fullPage:true});
  await page.getByRole('link',{name:'Про кубик',exact:true}).click();
  await expect(page).toHaveURL('/about');
  await expect(page.getByRole('heading',{name:'Від навчального засобу до головоломки'})).toBeVisible();
  await page.getByRole('link',{name:'Уроки',exact:true}).click();
  await expect(page).toHaveURL('/lessons');
  for(let i=0;i<6;i++){
    await page.locator('.lesson-nav button').nth(i).click();
    await expect(page.getByRole('button',{name:'Наступний рух',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Наступний рух',exact:true}).click();
    await page.waitForTimeout(800);
    const selector=page.getByLabel('Обрати приклад');
    if(await selector.count()){
      const count=await selector.locator('option').count();
      for(let j=1;j<count;j++){
        await selector.selectOption(String(j));
        await expect(page.locator('.player .small-tag')).toHaveText(/^0 \//);
        await page.locator('.move-list button').last().click();
        await expect(page.getByText('Приклад завершено',{exact:true})).toBeVisible();
      }
    }
  }
  await page.screenshot({path:'outputs/lesson-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Відкрити меню'}).click();
  await page.getByRole('link',{name:'Розв’язати',exact:true}).click();
  await page.getByRole('button',{name:'Очистити',exact:true}).click();
  const sticker=page.getByRole('button',{name:'Передня, клітинка 1, не заповнена',exact:true});
  await sticker.focus();await page.keyboard.press('5');await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'Передня, клітинка 1, Синій',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Завантажити приклад',exact:true}).click();
  await page.getByRole('button',{name:'Обрати колір: Червоний',exact:true}).click();
  await page.locator('.mobile-face-tabs button').filter({hasText:'Передня'}).click();
  const expanded=page.getByRole('button',{name:/Збільшена Передня, клітинка 1,/});
  await expanded.click();
  await expect(expanded).toHaveAccessibleName('Збільшена Передня, клітинка 1, Червоний');
  expect((await expanded.boundingBox())!.width).toBeGreaterThanOrEqual(44);
  await page.getByRole('button',{name:'Завантажити приклад',exact:true}).click();
  await page.screenshot({path:'outputs/home-mobile.png',fullPage:true});
  await page.goto('/lessons');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'outputs/lesson-mobile.png',fullPage:true});
});

test('fallback without WebGL remains playable',async({page})=>{
  await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=(()=>null) as typeof HTMLCanvasElement.prototype.getContext;});
  await page.goto('/lessons');
  await expect(page.getByText('3D-огляд недоступний у цьому браузері. Кольорова розгортка показує поточний стан.')).toBeVisible();
  await page.getByRole('button',{name:'Наступний рух',exact:true}).click();
  await expect(page.locator('.player .small-tag')).toHaveText('1 / 4');
});

test('reduced-motion playback and navigation from direct URL',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/lessons');
  await page.getByRole('button',{name:'Наступний рух',exact:true}).click();
  await expect(page.locator('.player .small-tag')).toHaveText('1 / 4');
  await page.getByRole('button',{name:'Назад',exact:true}).click();
  await expect(page.locator('.player .small-tag')).toHaveText('0 / 4');
});


