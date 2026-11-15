import { test, expect } from '@playwright/test';

test('wall openings and appliances can be added, edited, and persisted', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();

  await page.getByRole('button', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Add Oak Door' }).click();
  await expect(page.locator('.selection-heading strong')).toHaveText('Oak Door');
  await expect.poll(async () => page.evaluate(() => {
    const design = JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}');
    return design.items.find((item: { kind: string }) => item.kind === 'door')?.position[2];
  })).toBe(-2.5);

  await page.getByRole('button', { name: 'Appliances', exact: true }).click();
  for (const name of ['Frame TV', 'Air Conditioner', 'Refrigerator', 'Washing Machine']) {
    await page.getByRole('button', { name: `Add ${name}` }).click();
    await expect(page.locator('.selection-heading strong')).toHaveText(name);
  }
  await page.getByRole('button', { name: 'Increase furniture size' }).click();
  await page.getByRole('button', { name: 'Furniture color #a6b4b3' }).click();
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('.selection-heading strong')).toHaveText('Washing Machine');
  await page.getByRole('button', { name: 'Remove', exact: true }).click();

  await expect.poll(async () => page.evaluate(() => {
    const design = JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}');
    return ['door', 'tv', 'aircond', 'fridge', 'washer'].every((kind) => design.items.some((item: { kind: string }) => item.kind === kind));
  })).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: 'Appliances', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add Frame TV' })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const design = JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}');
    return design.items.find((item: { kind: string }) => item.kind === 'washer')?.color;
  })).toBe('#a6b4b3');
  await page.getByRole('button', { name: 'Deselect furniture' }).click();
  await page.screenshot({ path: 'artifacts/appliances.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('enlarged doors keep left-wall placement through room resizing and reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Add Oak Door' }).click();
  await page.getByRole('button', { name: 'Increase furniture size' }).click();
  await page.getByRole('button', { name: 'Increase furniture size' }).click();
  await page.getByRole('button', { name: 'Rotate', exact: true }).click();

  await expect.poll(async () => page.evaluate(() => {
    const design = JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}');
    return design.items.find((item: { kind: string }) => item.kind === 'door')?.position;
  })).toEqual([-3, 0, 1.65]);
  await expect.poll(async () => page.evaluate(() => {
    const design = JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}');
    return design.items.find((item: { kind: string }) => item.kind === 'door')?.scale;
  })).toBeCloseTo(1.2);

  await page.getByRole('button', { name: 'Rotate', exact: true }).click();
  await expect.poll(async () => page.evaluate(() => {
    const design = JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}');
    return design.items.find((item: { kind: string }) => item.kind === 'door')?.position;
  })).toEqual([-1.65, 0, -2.5]);
  await page.getByRole('button', { name: 'Rotate', exact: true }).click();
  await expect.poll(async () => page.evaluate(() => {
    const design = JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}');
    return design.items.find((item: { kind: string }) => item.kind === 'door')?.position;
  })).toEqual([-3, 0, 1.65]);

  await page.getByRole('button', { name: 'Room', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Room width' }).fill('7.5');
  await expect.poll(async () => page.evaluate(() => {
    const design = JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}');
    return design.items.find((item: { kind: string }) => item.kind === 'door')?.position;
  })).toEqual([-3.75, 0, 1.65]);

  await page.reload();
  await expect(page.locator('canvas')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => {
    const design = JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}');
    return design.items.find((item: { kind: string }) => item.kind === 'door')?.position;
  })).toEqual([-3.75, 0, 1.65]);
  await expect.poll(async () => page.evaluate(() => {
    const design = JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}');
    return design.items.find((item: { kind: string }) => item.kind === 'door')?.scale;
  })).toBeCloseTo(1.2);
});
