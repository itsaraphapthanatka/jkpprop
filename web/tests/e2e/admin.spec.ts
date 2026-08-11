import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/* The admin app, driven through the browser.

   These cover what an API test cannot see: that the guard actually redirects
   in a browser, that a form's submit button is wired, that a page renders
   rather than crashing on hydration. */

const OWNER = { email: 'owner@jkp.local', password: 'jkp12345' };
const AGENT = { email: 'agent@jkp.local', password: 'jkp12345' };

/* Put the seeded page sections back, whichever assertion failed.
   One client for the whole file: a fresh PrismaClient per hook leaves
   connections behind faster than Postgres reclaims them, and the app losing a
   connection mid-suite is exactly the flake this used to produce. */
let db: import('@prisma/client').PrismaClient | undefined;
async function resetSections() {
  if (!db) {
    const { PrismaClient } = await import('@prisma/client');
    db = new PrismaClient();
  }
  await db.pageSection.updateMany({
    where: { pageKey: { in: ['about', 'home'] } },
    data: { content: {}, enabled: true },
  });
}
test.afterAll(async () => { await db?.$disconnect(); db = undefined; });

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

    // the documentation panel lists response codes too, so assert on the
    // result badge itself rather than on the text "200"
    await expect(page.locator('#try-status')).toHaveText('200');
    await expect(page.locator('#try-response')).toContainText('owner');
  });
});

test.describe('page sections', () => {
  /* The loop the marketing team actually uses: type into /admin/sections,
     reload the public page, see the change. It was broken end-to-end for a
     long time — the editor wrote to the database and nothing read it back —
     so this covers the whole circuit rather than either half. */
  const NAME = 'คุณทดสอบ อีทูอี';
  const AWARD = 'รางวัลทดสอบ e2e 2569';

  /* Selecting a card is not enough to start typing: the list arrives from the
     API and resets the selection to the first section when it lands, so a
     click that beats the response is silently undone. Wait for the edit panel
     to say which section it is actually on. */
  async function openAboutSection(page: Page, key: string) {
    await page.goto('/admin/sections?page=about');
    await expect(page.locator('[data-section-key="ah"]')).toBeVisible();
    await expect(page.locator('#sec-preview')).toHaveAttribute('data-editing-key', 'ah');
    await page.locator(`[data-section-key="${key}"]`).click();
    await expect(page.locator('#sec-preview')).toHaveAttribute('data-editing-key', key);
  }

  const save = async (page: Page) => {
    await page.getByText('บันทึก section').click();
    await expect(page.getByText('บันทึกแล้ว')).toBeVisible();
  };

  /* Straight to the table rather than through a test-only endpoint: the
     suite runs against the production build, and a reset route that only
     exists for tests is a reset route that ships. */
  test.afterEach(resetSections);

  test('a team member added in the CMS appears on the public page', async ({ page }) => {
    await signIn(page, OWNER);
    await openAboutSection(page, 'as');

    await page.getByText('เพิ่มคน').click();
    await page.getByPlaceholder('คุณสมชาย ใจดี').fill(NAME);
    await page.getByPlaceholder('Sales Executive').fill('QA');
    await save(page);

    await page.goto('/th/about');
    await expect(page.getByText(NAME)).toBeVisible();

    // a name is a name in every language, so it carries over untranslated
    await page.goto('/en/about');
    await expect(page.getByText(NAME)).toBeVisible();
  });

  test('a stat row entered in one language leaves the others on their own defaults', async ({ page }) => {
    await signIn(page, OWNER);
    await openAboutSection(page, 'st');

    await page.getByText('เพิ่มตัวเลข').click();
    await page.getByPlaceholder('2019').fill('2562');
    await page.getByPlaceholder('ก่อตั้ง').fill('ปีที่ก่อตั้ง');
    await save(page);

    await page.goto('/th/about');
    await expect(page.locator('#stats-row')).toContainText('2562');

    /* Chinese was never filled in, so it keeps the translated default rather
       than showing Thai — the opposite of what a naive fallback would do. */
    await page.goto('/zh/about');
    await expect(page.locator('#stats-row')).not.toContainText('ปีที่ก่อตั้ง');
    await expect(page.locator('#stats-row')).toContainText('成立年份');
  });

  test('the award line is blank until someone fills it in, and the publish switch hides a section', async ({ page }) => {
    await signIn(page, OWNER);

    // nothing seeded, so the invented award name is simply absent
    await page.goto('/th/about');
    await expect(page.locator('#award-grid')).not.toContainText('2025');

    await openAboutSection(page, 'aw');
    await page.locator('#sec-f-note').fill(AWARD);
    await save(page);

    await page.goto('/th/about');
    await expect(page.locator('#award-grid')).toContainText(AWARD);

    // switching the section off takes it off the page without a deploy
    await openAboutSection(page, 'aw');
    await page.locator('[data-section-key="aw"] div[style*="border-radius: 9999px"]').last().click();
    await save(page);

    await page.goto('/th/about');
    await expect(page.locator('#award-grid')).toHaveCount(0);
  });
});

test.describe('home page sections', () => {
  /* The home page carried the most invented material of anywhere on the site:
     an award nobody had told us about, a 4.9 rating with no reviews behind it,
     and eight random stock photos captioned as delivered deals. Each is now a
     CMS field that renders nothing until someone fills it in — these tests
     pin "nothing" as the default so a future edit cannot quietly restore it. */

  async function openHomeSection(page: Page, key: string) {
    await page.goto('/admin/sections?page=home');
    await expect(page.locator('#sec-preview')).toHaveAttribute('data-editing-key', 'h');
    await page.locator(`[data-section-key="${key}"]`).click();
    await expect(page.locator('#sec-preview')).toHaveAttribute('data-editing-key', key);
  }

  const save = async (page: Page) => {
    await page.getByText('บันทึก section').click();
    await expect(page.getByText('บันทึกแล้ว')).toBeVisible();
  };

  test.afterEach(resetSections);

  test('no award, no rating and no stock-photo wall until the CMS says so', async ({ page }) => {
    await page.goto('/th');
    const body = page.locator('body');
    await expect(body).not.toContainText('Real Estate Agent Awards');
    await expect(body).not.toContainText('Thailand · 2025');
    // the eight picsum tiles are gone with the section that held them
    expect(await page.locator('img[src*="picsum.photos"]').count()).toBe(0);
  });

  test('the award ribbon and rating appear once entered, and split on the dot', async ({ page }) => {
    await signIn(page, OWNER);
    await openHomeSection(page, 'w');

    await page.locator('#sec-f-note').fill('รางวัลนายหน้ายอดเยี่ยม · 2569');
    await page.locator('#sec-f-cta').fill('4.2');
    await save(page);

    await page.goto('/th');
    await expect(page.getByText('รางวัลนายหน้ายอดเยี่ยม')).toBeVisible();
    await expect(page.getByText('2569', { exact: true })).toBeVisible();
    await expect(page.getByText('4.2', { exact: true })).toBeVisible();
  });

  test('KPI figures can be switched off without losing the block around them', async ({ page }) => {
    await signIn(page, OWNER);

    await page.goto('/th');
    await expect(page.getByText('ทรัพย์ในระบบทั่วประเทศ')).toBeVisible();

    /* Open first, then toggle: openHomeSection navigates, so flipping the
       switch before it would be thrown away by the page load. */
    await openHomeSection(page, 'wk');
    await page.locator('[data-section-key="wk"] div[style*="border-radius: 9999px"]').last().click();
    await save(page);

    await page.goto('/th');
    await expect(page.getByText('ทรัพย์ในระบบทั่วประเทศ')).toHaveCount(0);
    // the surrounding "why us" block is untouched
    await expect(page.locator('#page-sheet')).toContainText('รองรับหลายภาษา');
  });
});
