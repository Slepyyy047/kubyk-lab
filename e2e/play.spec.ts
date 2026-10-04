import { test, expect } from '@playwright/test';

test('home model, exploded view and separate solver', async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Почни з повороту.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Знайти розв’язання',exact:true})).toHaveCount(0);
  await expect(page.getByTestId('interactive-cube-canvas')).toBeVisible();
  await page.getByRole('button',{name:'Зазирнути всередину'}).click();
  await expect(page.getByRole('button',{name:'Зібрати деталі'})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Зібрати деталі'}).click();
  await page.getByRole('link',{name:'Маю фізичний кубик'}).click();
  await expect(page).toHaveURL('/solve');
  await expect(page.getByRole('button',{name:'Знайти розв’язання',exact:true})).toBeVisible();
});

for(const size of [2,3,4])test(`manual ${size}x${size}, inverse, restore and shuffle`,async({page})=>{
  await page.goto('/play');
  await page.locator('.model-select select').selectOption(String(size));
  const canvas=page.getByTestId('interactive-cube-canvas');
  await canvas.press(size===4?'Alt+r':'r');
  await expect(page.locator('.game-status')).toContainText('1 рух');
  await expect(page.locator('.game-status')).toContainText('У процесі');
  await page.reload();
  await expect(page.locator('.model-select select')).toHaveValue(String(size));
  await expect(page.locator('.game-status')).toContainText('1 рух');
  await canvas.press(size===4?'Alt+Shift+r':'Shift+r');
  await expect(page.locator('.game-status')).toContainText('Готовий до гри');
  await page.getByRole('button',{name:'Перемішати кубик'}).click();
  await expect(page.getByRole('button',{name:'Перемішати кубик'})).toBeEnabled({timeout:20000});
  await expect(page.locator('.game-status')).toContainText('У процесі');
  await expect(page.locator('.game-status')).toContainText('0 рухів');
  const before=await page.evaluate((n)=>localStorage.getItem(`kubyk:play:v1:${n}`),size);
  await page.reload();
  expect(await page.evaluate((n)=>localStorage.getItem(`kubyk:play:v1:${n}`),size)).toBe(before);
});

test('mobile menu and reachable play controls',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Відкрити меню'}).click();
  await page.getByRole('link',{name:'Грати',exact:true}).click();
  await expect(page).toHaveURL('/play');
  await expect(page.getByRole('button',{name:'Відкрити меню'})).toHaveAttribute('aria-expanded','false');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('summary').click();
  await page.getByRole('button',{name:'Повернути Праворуч',exact:true}).click();
  await expect(page.locator('.game-status')).toContainText('1 рух');
});

test('WebGL fallback and reduced motion complete real moves',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=(()=>null) as typeof HTMLCanvasElement.prototype.getContext;});
  await page.goto('/play');
  await expect(page.locator('.interactive-cube__fallback')).toBeVisible();
  await page.getByRole('button',{name:'Повернути Праворуч',exact:true}).click();
  await expect(page.locator('.game-status')).toContainText('1 рух');
  await page.getByLabel('У зворотний бік',{exact:true}).check();
  await page.getByRole('button',{name:'Повернути Праворуч у зворотний бік',exact:true}).click();
  await expect(page.locator('.game-status')).toContainText('Готовий до гри');
});
