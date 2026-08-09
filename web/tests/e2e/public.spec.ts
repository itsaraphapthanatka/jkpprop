import { test, expect } from './fixtures';

/* The public site, driven as a visitor would. */

test.describe('locale routing', () => {
  test('a locale-less URL lands on Thai', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/th$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  });

  test('each locale renders with the right lang attribute', async ({ page }) => {
    for (const [path, lang] of [['/th', 'th'], ['/en', 'en'], ['/zh', 'zh-Hans']] as const) {
      // lang is in the initial HTML — waiting for the full load event makes
      // this hostage to how fast the webfont CDN answers
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
    }
  });

  test('an unknown locale 404s instead of rendering a page', async ({ page }) => {
    const res = await page.goto('/jp', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(404);
  });

  test('internal links keep the visitor in their language', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    // every in-page link to a public route should already be /en-prefixed —
    // without this a click bounces through /th and silently drops the language
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('href') ?? ''));
    const publicLinks = hrefs.filter((h) =>
      h !== '/' && !h.startsWith('/admin') && !h.startsWith('/api') && !h.startsWith('/client-shortlist'));
    expect(publicLinks.length).toBeGreaterThan(3);
    for (const href of publicLinks) {
      expect(href, `${href} lost the locale prefix`).toMatch(/^\/(th|en|zh)(\/|$)/);
    }
  });
});

test.describe('listing and property', () => {
  test('the listing page shows published inventory', async ({ page }) => {
    await page.goto('/th/listing');
    await expect(page.locator('#listing-grid')).toBeVisible();
    // seeded properties carry JKP codes; the ported demo set used TIP-
    await expect(page.locator('#listing-grid')).toContainText(/JKP/);
  });

  test('a card opens that exact property, not a hardcoded one', async ({ page }) => {
    await page.goto('/th/listing');
    // wait for the client fetch to replace the ported demo set
    const link = page.locator('#listing-grid a[href*="/property/JKP"]').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    const code = decodeURIComponent(href!.split('/property/')[1]);

    await link.click();
    await expect(page).toHaveURL(new RegExp(`/property/${code}$`));
    await expect(page.locator('h1')).toBeVisible();
    // the page must show the code it was opened with, not a hardcoded one
    await expect(page.getByText(code).first()).toBeVisible();
  });

  test('an unknown property code 404s', async ({ page }) => {
    const res = await page.goto('/th/property/JKP-NOPE9999', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(404);
  });
});

test.describe('layout', () => {
  test('the page never scrolls sideways', async ({ page }) => {
    // the responsive rules keyed off inline-style strings used to fail
    // silently; this is the symptom that would have caught it
    for (const path of ['/th', '/th/listing', '/th/about', '/th/contact']) {
      await page.goto(path);
      // measure only once the webfont has landed — Thai falls back to very
      // different metrics until then, which makes this flake per-environment
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} scrolls horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });

  test('no console errors on the home page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/th');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#page-sheet, main, body').first().waitFor();

    // the fixture refuses third-party hosts, so the browser logs a failed
    // fetch for each blocked font/photo — those are ours to ignore
    const ours = errors.filter((e) =>
      !/favicon|ERR_FAILED|net::|Failed to load resource/i.test(e));
    // a hydration mismatch (React #418) would show up here — it has before
    expect(ours, ours.join(' | ')).toEqual([]);
  });
});

test.describe('AI-readable files', () => {
  test('robots.txt keeps admin and the token view out of any index', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Disallow: /client-shortlist');
  });

  test('sitemap.xml carries hreflang for all three locales', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text();
    for (const l of ['th', 'en', 'zh']) expect(body).toContain(`hreflang="${l}"`);
  });
});
