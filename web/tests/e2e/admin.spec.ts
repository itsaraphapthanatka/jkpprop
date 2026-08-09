import { test, expect, type Page } from '@playwright/test';

/* The admin app, driven through the browser.

   These cover what an API test cannot see: that the guard actually redirects
   in a browser, that a form's submit button is wired, that a page renders
   rather than crashing on hydration. */

const OWNER = { email: 'owner@jkp.local', password: 'jkp12345' };
const AGENT = { email: 'agent@jkp.local', password: 'jkp12345' };

async function signIn(page: Page, who: { email: string; password: string }) {
  await page.goto('/admin/login');
  await page.locator('#login-email').fill(who.email);
  await page.locator('#login-password').fill(who.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
}

test.describe('the guard', () => {
  test('an anonymous visitor is sent to the login page with a return path', async ({ page }) => {
    await page.goto('/admin/properties');
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fproperties/);
  });

  test('a wrong password shows the error instead of letting you in', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill(OWNER.email);
    await page.locator('#login-password').fill('definitely-wrong');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    // Next.js' route announcer is also role=alert, so target the form's own
    await expect(page.locator('form [role="alert"]')).toContainText('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('signing in lands on the dashboard, and signing out locks it again', async ({ page }) => {
    await signIn(page, OWNER);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('#admin-sidebar')).toContainText('กิตติพงษ์ พรหมทอง');

    await page.getByLabel('ออกจากระบบ').click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('pages render for a signed-in owner', () => {
  test.beforeEach(async ({ page }) => { await signIn(page, OWNER); });

  const pages: [string, RegExp][] = [
    ['/admin', /Dashboard/],
    ['/admin/properties', /Properties/],
    ['/admin/leads', /Leads/],
    ['/admin/listings', /Listings/],
    ['/admin/deals', /Deal/],
    ['/admin/visits', /Visit/],
    ['/admin/shortlists', /Shortlist/],
    ['/admin/media', /คลัง|Media/],
    ['/admin/cms', /CMS/],
    ['/admin/users', /ผู้ใช้|Users/],
    ['/admin/audit', /Audit/],
    ['/admin/settings', /Settings/],
    ['/admin/api-docs', /API Reference/],
  ];

  for (const [path, heading] of pages) {
    test(`${path} renders without a client error`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(path);
      await expect(page.locator('#admin-sidebar')).toBeVisible();
      await expect(page.locator('body')).toContainText(heading);
      expect(errors, `${path} threw: ${errors.join(' | ')}`).toEqual([]);
    });
  }
});

test.describe('dashboard shows live numbers', () => {
  test('the stat cards are real counts, not the ported placeholders', async ({ page, request }) => {
    await signIn(page, OWNER);
    const api = await (await request.get('/api/dashboard', {
      headers: { cookie: (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ' ) },
    })).json();
    // the card for leads must show what the API reports
    await expect(page.locator('#stat-grid')).toContainText(String(api.stats.leads));
  });
});

test.describe('RBAC reaches the browser', () => {
  test('an agent cannot open the users page', async ({ page }) => {
    await signIn(page, AGENT);
    await page.goto('/admin/users');
    // the page loads, but the API refuses — so no real user rows appear
    await expect(page.locator('#admin-sidebar')).toBeVisible();
    await expect(page.getByText('owner@jkp.local')).toHaveCount(0);
  });

  test('an agent cannot read the audit log', async ({ page, request }) => {
    await signIn(page, AGENT);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await request.get('/api/audit', { headers: { cookie } });
    expect(res.status()).toBe(403);
  });
});

test.describe('creating a property through the UI', () => {
  test('the drawer saves and the new row appears in the table', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/properties');

    const title = `ทดสอบผ่านเบราว์เซอร์ ${Date.now()}`;
    await page.getByText('เพิ่มทรัพย์ใหม่').first().click();
    await expect(page.locator('#np-modal')).toBeVisible();
    await page.locator('#np-modal input').first().fill(title);
    await page.getByText('บันทึกร่าง').click();

    await expect(page.locator('#np-modal')).toBeHidden();
    await expect(page.locator('table')).toContainText(title);
    // the code is issued by the server, never typed
    await expect(page.locator('table')).toContainText(/JKP/);
  });
});

test.describe('API reference', () => {
  test('lists the operations and can fire one with the current session', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/api-docs');

    await expect(page.getByText('JKP Property API')).toBeVisible();
    await expect(page.getByText(/operations/)).toBeVisible();

    // open a harmless GET and run it
    await page.getByPlaceholder('ค้นหา path หรือคำอธิบาย').fill('/api/me/permissions');
    await page.getByText('/api/me/permissions').first().click();
    await page.getByRole('button', { name: 'ส่ง request' }).click();

    await expect(page.getByText('200', { exact: true })).toBeVisible();
    await expect(page.locator('pre')).toContainText('owner');
  });
});
