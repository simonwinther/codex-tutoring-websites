import { test, expect } from '@playwright/test';

for (const lab of ['model', 'wireframe', 'architecture']) {
  test(`${lab} opens without saved checkpoints and survives reload`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(`/#/labs/${lab}`);
    await expect(page.getByLabel('Checkpoint name')).toBeVisible();
    await expect(page.getByLabel('Saved attempts')).toHaveCount(0);
    await expect(page.locator('.save-state')).toContainText('Saved');

    await page.reload();
    await expect(page.getByLabel('Checkpoint name')).toBeVisible();
    await expect(page.getByLabel('Saved attempts')).toHaveCount(0);
    await expect(page.locator('.save-state')).toContainText('Saved');
    expect(errors).toEqual([]);
  });
}
