import { test } from '@playwright/test';
test('shot the vector map', async ({ page }) => {
  await page.goto('/th');
  const plane = page.locator('#lf-map-plane');
  await plane.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await plane.screenshot({ path: 'test-results/v-air.png' });
  await page.locator('[data-factor="eec"]').click();
  await page.waitForTimeout(600);
  await plane.screenshot({ path: 'test-results/v-eec.png' });
  await page.locator('[data-province="chonburi"]').hover();
  await page.waitForTimeout(400);
  await plane.screenshot({ path: 'test-results/v-hover.png' });
});
