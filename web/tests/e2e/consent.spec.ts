import { test, expect } from '@playwright/test';

/* The banner that used to be here asked a question and threw the answer away:
   accept and decline both wrote to localStorage, nothing read it, and the map
   loaded from Google either way. These check that the answer is honoured. */

// a visitor who has not been asked yet
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('cookie consent', () => {
  test('it asks on the contact page — the one page with a third-party frame', async ({ page }) => {
    await page.goto('/th/contact');
    await expect(page.locator('#consent-gate')).toBeVisible();
    // no frame from Google before an answer is given
    expect(await page.locator('iframe[src*="google.com/maps"]').count()).toBe(0);
  });

  test('refusing keeps the map off, and it stays off after a reload', async ({ page }) => {
    await page.goto('/th/contact');
    await page.locator('#consent-reject').click();
    await expect(page.locator('#consent-gate')).toHaveCount(0);
    expect(await page.locator('iframe[src*="google.com/maps"]').count()).toBe(0);
    await expect(page.locator('#map-allow')).toBeVisible();

    await page.reload();
    await expect(page.locator('#consent-gate')).toHaveCount(0);   // not asked twice
    expect(await page.locator('iframe[src*="google.com/maps"]').count()).toBe(0);
  });

  test('accepting loads the map, and it is still there after a reload', async ({ page }) => {
    await page.goto('/th/contact');
    await page.locator('#consent-accept').click();
    await expect(page.locator('iframe[src*="google.com/maps"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('iframe[src*="google.com/maps"]')).toBeVisible();
  });

  test('the button on the blocked map is itself the consent', async ({ page }) => {
    await page.goto('/th/contact');
    await page.locator('#consent-reject').click();
    await page.locator('#map-allow').click();
    await expect(page.locator('iframe[src*="google.com/maps"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('iframe[src*="google.com/maps"]')).toBeVisible();
  });

  test('a refusal can be taken back from the footer, and vice versa', async ({ page }) => {
    await page.goto('/th/contact');
    await page.locator('#consent-accept').click();
    await expect(page.locator('iframe[src*="google.com/maps"]')).toBeVisible();

    await page.locator('#footer-consent').click();
    await expect(page.locator('#consent-gate')).toBeVisible();
    await page.locator('[data-consent-toggle]').click();       // embeds -> off
    await page.locator('#consent-save').click();
    expect(await page.locator('iframe[src*="google.com/maps"]').count()).toBe(0);
  });

  test('it is asked once, not on every page', async ({ page }) => {
    await page.goto('/th');
    await expect(page.locator('#consent-gate')).toBeVisible();
    await page.locator('#consent-reject').click();
    await page.goto('/th/listing');
    await expect(page.locator('#consent-gate')).toHaveCount(0);
    await page.goto('/th/contact');
    await expect(page.locator('#consent-gate')).toHaveCount(0);
  });

  /* The home page grew a second third party when the map started drawing over
     a real basemap. A category that covers one of two maps is not consent. */
  test('the basemap on the home page waits for the same answer', async ({ page }) => {
    const tiles: string[] = [];
    page.on('request', (r) => { if (r.url().includes('cartocdn.com')) tiles.push(r.url()); });

    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();
    await page.locator('#consent-reject').click();
    await page.waitForTimeout(1200);
    expect(tiles, 'tiles were fetched before anyone agreed to them').toEqual([]);
    await expect(page.locator('#belt-map-allow')).toBeVisible();

    await page.locator('#belt-map-allow').click();
    await expect.poll(() => tiles.length, { timeout: 15_000 }).toBeGreaterThan(0);
  });

  test('the policy it links to exists in all three languages', async ({ page, request }) => {
    for (const loc of ['th', 'en', 'zh']) {
      const r = await request.get(`/${loc}/p/cookies`);
      expect(r.status(), loc).toBe(200);
    }
    await page.goto('/en/contact');
    const link = page.locator('#consent-gate a[href="/en/p/cookies"]');
    await expect(link).toBeVisible();
  });
});
