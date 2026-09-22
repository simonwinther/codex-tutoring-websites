import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

const { base, sites } = JSON.parse(readFileSync(new URL('../../_site/sites.json', import.meta.url), 'utf8'));
const siteUrl = path => base + path.split('/').map(encodeURIComponent).join('/') + '/';

for (const width of [1440, 390]) {
  test(`library navigation at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base);
    await expect(page.locator('.site-card')).toHaveCount(sites.length);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const site of sites) {
      await expect(page.locator('.site-card', { hasText: site.title })).toHaveAttribute('href', siteUrl(site.path));
      const parts = site.path.split('/');
      for (let i = 1; i < parts.length; i++) {
        const folder = await request.get(siteUrl(parts.slice(0, i).join('/')));
        expect(folder.status()).toBe(200);
        expect(await folder.text()).toContain(site.title);
      }
    }
    await page.locator('.site-card').first().click();
    await expect(page.locator('#root')).not.toBeEmpty();
  });
}

for (const site of sites) {
  test(`${site.path}: assets and deep links survive nested hosting`, async ({ page, request }) => {
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    page.on('requestfailed', request => { if (!request.failure()?.errorText.includes('ERR_ABORTED')) failures.push(request.url()); });
    await page.goto(siteUrl(site.path));
    await expect(page.locator('#root')).not.toBeEmpty();
    await page.waitForLoadState('networkidle');
    if (site.path === 'ATDL/MeanFlows') {
      await expect(page.locator('h1')).toContainText(/noise/i);
      const pdf = page.locator('a[href*="paper/mean-flows.pdf"]').first();
      expect(await pdf.getAttribute('href')).toContain(siteUrl(site.path) + 'paper/mean-flows.pdf');
      expect((await request.get((await pdf.getAttribute('href')).split('#')[0])).status()).toBe(200);
      // Scroll through the gallery so lazy images and worker-backed plots load.
      await page.locator('img[src*="samples/"]').first().scrollIntoViewIfNeeded();
      await expect.poll(() => page.locator('img[src*="samples/"]').first().evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      const manifest = await request.get(siteUrl(site.path) + 'source-coverage.json');
      expect(manifest.status()).toBe(200);
      for (const image of (await manifest.json()).images) expect((await request.get(siteUrl(site.path) + image.file)).status()).toBe(200);
      await page.goto(siteUrl(site.path) + '#identity');
      await page.reload();
      await expect(page.locator('#identity')).toBeVisible();
    }
    if (site.path === 'netcompany-interview-lab') {
      await page.getByRole('link', { name: 'Learning path', exact: true }).click();
      await expect(page).toHaveURL(/#\/learn/);
      await page.reload();
      await expect(page.locator('h1')).toBeVisible();
      await page.goto(siteUrl(site.path) + '#/labs/api');
      await expect(page.getByRole('button', { name: 'Send request' })).toBeVisible();
      await page.getByRole('button', { name: 'Send request' }).click();
      await expect(page.getByText('HTTP 200', { exact: true })).toBeVisible();
    }
    await page.waitForLoadState('networkidle');
    expect(failures).toEqual([]);
  });
}
