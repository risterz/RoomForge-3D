import { test, expect } from '@playwright/test';

test('drag and drop furniture, clear room, and room dimensions', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas is missing');
  const initial = await page.evaluate(() => JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}'));
  const initialCount = initial.items.length;
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await page.getByRole('button', { name: 'Add Lounge Chair' }).dispatchEvent('dragstart', { dataTransfer });
  await canvas.dispatchEvent('drop', { dataTransfer, clientX: box.x + box.width * 0.52, clientY: box.y + box.height * 0.58 });
  await expect(page.locator('.selection-heading strong')).toHaveText('Lounge Chair');
  await page.waitForTimeout(650);
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('roomforge-current-design') ?? '{}').items.length)).toBe(initialCount + 1);
  await page.getByRole('button', { name: 'Room', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Room width' }).fill('7');
  await page.getByRole('spinbutton', { name: 'Room depth' }).fill('6');
  await expect(page.locator('.room-caption')).toContainText('7 × 6 m');
  await page.getByRole('button', { name: 'Clear room', exact: true }).click();
  await page.getByRole('button', { name: 'Clear furniture', exact: true }).click();
  await expect(page.locator('.selection-toolbar')).toHaveCount(0);
  await expect(page.locator('.room-caption')).toContainText('0 pieces');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.locator('.room-caption')).not.toContainText('0 pieces');
  await dataTransfer.dispose();
});
