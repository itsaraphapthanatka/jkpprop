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

    /* The roster is seeded, so "add" appends a fifth row — target that one,
       not whichever member happens to be first. */
    await page.getByText('เพิ่มคน').click();
    await page.getByPlaceholder('คุณสมชาย ใจดี').last().fill(NAME);
    await page.getByPlaceholder('Sales Executive').last().fill('QA');
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
    await page.getByPlaceholder('2019').last().fill('2562');
    await page.getByPlaceholder('ก่อตั้ง').last().fill('ปีที่ก่อตั้ง');
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

test.describe('the section editor\'s controls are wired', () => {
  /* This screen was ported from a static HTML prototype, and five of its
     controls came across as styled divs with no handler: the green "เผยแพร่"
     button, "เลือกจากคลัง" and the upload icon over the image, an overlay
     strength picker, and "ดูตัวอย่าง". They all looked live. Clicking the one
     labelled "choose from the library" is what a person does first when they
     want to change a picture, and nothing happened. */

  test('every clickable-looking control in the panel does something', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/sections?page=about');
    await expect(page.locator('#sec-preview')).toHaveAttribute('data-editing-key', 'ah');

    // the media picker opens from the button on the image itself
    await page.getByText('เลือกจากคลัง', { exact: true }).click();
    await expect(page.getByText(/ยังไม่มีรูปในคลังสื่อ|เปิดหน้าคลังสื่อ/).first()).toBeVisible();

    // both routes out of an empty library go somewhere real
    await expect(page.locator('#sec-preview a[href="/admin/media"]').first()).toBeVisible();

    // preview opens the page being edited, in the language being edited
    await expect(page.locator('#sec-preview a[href="/th/about"]')).toBeVisible();
    await page.getByText('中文', { exact: true }).click();
    await expect(page.locator('#sec-preview a[href="/zh/about"]')).toBeVisible();

    // the top-right primary button saves rather than sitting there
    await page.getByText('บันทึกและเผยแพร่').click();
    await expect(page.getByText('บันทึกแล้ว')).toBeVisible();
  });

  test('a pasted image URL shows in the preview before saving', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/sections?page=about');
    await expect(page.locator('#sec-preview')).toHaveAttribute('data-editing-key', 'ah');

    await page.getByPlaceholder('เลือกจากคลังสื่อ หรือวาง URL').fill('/assets/jkp-logo-green.png');
    await expect(page.locator('#sec-preview img[alt="รูป section"]')).toHaveAttribute('src', '/assets/jkp-logo-green.png');
  });
});

test.describe('the CMS screens are reachable and honest', () => {
  /* Two working CMS screens had no link anywhere in the admin — the sidebar
     had no Media entry and the CMS hub pointed only at the Page Builder, the
     one screen that could delete sections. */

  test('the sidebar links to the media library', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin');
    await page.locator('#admin-sidebar').getByText('คลังสื่อ').click();
    await expect(page).toHaveURL(/\/admin\/media/);
    await expect(page.locator('body')).toContainText('Media Manager');
  });

  test('the CMS hub reaches both editors', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');
    await expect(page.locator('#cms-actions a[href="/admin/sections"]')).toBeVisible();
    await expect(page.locator('#cms-actions a[href="/admin/media"]')).toBeVisible();
  });

  test('the retired page builder sends you to the section editor', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/page-builder');
    await expect(page).toHaveURL(/\/admin\/sections/);
  });

  test('the media library shows only real uploads, and upload is clickable', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/media');

    /* Eight Unsplash demo files used to pad this grid while /api/media — what
       the section picker reads — returned nothing. */
    expect(await page.locator('#media-grid img[src*="unsplash.com"]').count()).toBe(0);

    // the topbar button opens the file dialog rather than doing nothing
    await expect(page.getByRole('button', { name: /อัปโหลด/ })).toBeEnabled();
    await expect(page.locator('#media-file-input')).toHaveCount(1);
  });
});

test.describe('the editor shows only fields the page renders', () => {
  /* Every block used to offer six text inputs and an image box regardless of
     what it rendered. Typing into the wrong one saved fine and changed
     nothing, with no way to tell which was live. */

  test('the KPI strip offers its figures and nothing it cannot show', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/sections?page=home');
    await page.locator('[data-section-key="wk"]').click();
    await expect(page.locator('#sec-preview')).toHaveAttribute('data-editing-key', 'wk');

    await expect(page.locator('#sec-f-headline')).toHaveCount(0);
    await expect(page.locator('#sec-f-sub')).toHaveCount(0);
    await expect(page.locator('#sec-f-note')).toHaveCount(0);
    await expect(page.locator('#sec-preview')).not.toContainText('รูปพื้นหลัง');
    // what it does render
    await expect(page.locator('#sec-preview')).toContainText('ตัวเลข');
  });

  test('the team block offers the background image it now renders', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/sections?page=about');
    await page.locator('[data-section-key="as"]').click();
    await expect(page.locator('#sec-preview')).toHaveAttribute('data-editing-key', 'as');
    await expect(page.locator('#sec-preview')).toContainText('รูปพื้นหลัง');

    await page.getByPlaceholder('เลือกจากคลังสื่อ หรือวาง URL').fill('/assets/jkp-logo-green.png');
    await page.getByText('บันทึก section').click();
    await expect(page.getByText('บันทึกแล้ว')).toBeVisible();

    await page.goto('/th/about');
    await expect(page.locator('#team-grid img[src="/assets/jkp-logo-green.png"]')).toHaveCount(1);
  });

  test('a hero says its switch is unavailable instead of drawing a dead one', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/sections?page=about');
    await expect(page.locator('[data-section-key="ah"]')).toContainText('ปิดไม่ได้');
    // a normal block keeps its switch
    await expect(page.locator('[data-section-key="aw"]')).not.toContainText('ปิดไม่ได้');
  });
});

test.describe('file uploads reach the server', () => {
  /* Both admin uploaders posted FormData through a wrapper that forced
     Content-Type: application/json, so the multipart boundary was lost and
     every upload failed with "ไม่พบไฟล์ที่อัปโหลด". Driving the real file
     input is the only way this class of bug shows up. */

  test('an image uploads into the media library', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/media');

    /* Count by filename, not by card: the grid is empty for a moment while
       /api/media loads, so a total taken too early is always wrong. */
    const card = page.locator('#media-grid > div', { hasText: 'jkp-logo-green.png' });
    await expect(page.locator('#media-grid')).toBeVisible();
    await expect(card).toHaveCount(0);

    await page.locator('#media-file-input').setInputFiles('public/assets/jkp-logo-green.png');
    await expect(card).toHaveCount(1, { timeout: 20_000 });
  });

  test('llms.txt uploads on the SEO page', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/seo');

    const picker = page.locator('input[type="file"]');
    await expect(picker).toHaveCount(1);
    await picker.setInputFiles({ name: 'llms.txt', mimeType: 'text/plain', buffer: Buffer.from('# JKP Property\n') });

    // the card flips from "waiting" to showing the stored file
    await expect(page.locator('body')).toContainText('llms.txt', { timeout: 20_000 });
    await expect(page.locator('body')).not.toContainText('ไม่พบไฟล์ที่อัปโหลด');
  });

  test.afterAll(async () => {
    const { PrismaClient } = await import('@prisma/client');
    const c = new PrismaClient();
    await c.mediaAsset.deleteMany({ where: { filename: 'jkp-logo-green.png' } });
    await c.seoFile.deleteMany({ where: { key: 'llms' } });
    await c.$disconnect();
  });
});

test.describe('brand colours reach the public site', () => {
  /* /admin/branding wrote to the database and the site ignored it: every
     brand colour was a literal inside an inline style. Picking a preset
     changed a row and nothing on screen. */
  const restore = { primary: '#034956', accent: '#034956', neon: '#2DFB91', pine: '#273c33' };

  /* Straight to the table: a PUT here has no session cookie, so it 401s and
     the palette stays changed for every test that runs after. */
  test.afterEach(async () => {
    if (!db) {
      const { PrismaClient } = await import('@prisma/client');
      db = new PrismaClient();
    }
    await db.branding.updateMany({ data: restore });
  });

  test('changing the palette changes what the public page serves', async ({ page, request }) => {
    await signIn(page, OWNER);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    const before = await (await request.get('/th')).text();
    expect(before).toContain('--accent:#034956');

    const res = await request.put('/api/branding', {
      headers: { cookie },
      data: { ...restore, primary: '#1E5AA8', accent: '#1E5AA8', neon: '#4FC3F7', pine: '#1B3A5C' },
    });
    expect(res.ok(), await res.text()).toBeTruthy();

    const after = await (await request.get('/th')).text();
    expect(after).toContain('--accent:#1E5AA8');
    expect(after).toContain('--neon:#4FC3F7');
    // the rgba glows follow too, or half the design stays the old colour
    expect(after).toContain('--neon-rgb:79,195,247');
    // and the dark panels are derived from the new pine rather than fixed green
    expect(after).toMatch(/--ink-rgb:\d+,\d+,\d+/);
    expect(after).not.toContain('--ink-rgb:2,35,16');
  });
});

test.describe('the CMS editor shows each language its own text', () => {
  /* /api/cms returned `content.th.body` regardless of the language tab, and the
     editor rendered that. A fully translated FAQ entry therefore looked
     untranslated on the EN and 中文 tabs — and because the editor holds those
     fields in state and PUTs them back under the selected language, opening the
     EN tab and pressing Publish overwrote the English translation with Thai. */
  test('the feed carries every language, not just Thai', async ({ page, request }) => {
    await signIn(page, OWNER);
    const cookies = await page.context().cookies();
    const cookie = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const res = await request.get('/api/cms?kind=faq', { headers: { cookie } });
    expect(res.ok(), 'the CMS feed did not load').toBeTruthy();
    const { items } = await res.json();
    expect(Array.isArray(items) && items.length, 'no FAQ entries to check').toBeTruthy();

    for (const it of items) {
      expect(it.blocks, `${it.slug} has no per-language blocks`).toBeTruthy();
      for (const l of ['th', 'en', 'zh']) {
        expect(typeof it.blocks[l]?.title, `${it.slug}.${l}.title`).toBe('string');
        expect(typeof it.blocks[l]?.body, `${it.slug}.${l}.body`).toBe('string');
      }
    }

    /* At least one translated entry must differ between Thai and English,
       otherwise the payload is still the Thai record wearing three hats. */
    const translated = items.filter(
      (it: { blocks: Record<string, { title: string }> }) => it.blocks.en.title && it.blocks.th.title,
    );
    test.skip(translated.length === 0, 'nothing is translated yet — run npm run faq:translate');
    expect(
      translated.some((it: { blocks: Record<string, { title: string }> }) => it.blocks.en.title !== it.blocks.th.title),
      'every English title equals its Thai one — the feed is still returning Thai',
    ).toBeTruthy();
  });

  test('switching to EN shows the English text, not the Thai', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');
    await page.getByText('FAQ', { exact: false }).first().click();

    const title = page.locator('#cms-title-input');
    await expect(title).toBeVisible();
    await expect.poll(async () => title.inputValue()).not.toBe('');
    const thai = await title.inputValue();

    await page.locator('[data-lang-tab="en"]').click();
    await expect
      .poll(async () => title.inputValue(), { message: 'the EN tab still shows the Thai title' })
      .not.toBe(thai);
    expect(await title.inputValue(), 'the EN title is empty').not.toBe('');
  });
});

test.describe('adding CMS content', () => {
  /* The "+" beside the search box had a pointer cursor and no onClick, so the
     only way to add a page, article or FAQ entry was to insert a row by hand.
     The search box next to it had no state either. */
  const stamp = () => `e2e-${Date.now().toString(36)}`;

  /* these tests write real rows — take them back out */
  test.afterAll(async () => {
    if (!db) {
      const { PrismaClient } = await import('@prisma/client');
      db = new PrismaClient();
    }
    await db.cmsPage.deleteMany({ where: { slug: { startsWith: 'e2e-' } } });
  });

  test('the + button creates an entry that appears in the list', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');
    await page.locator('#cms-new-btn').click();

    const title = `ทดสอบเพิ่มบทความ ${stamp()}`;
    await page.locator('#cms-new-title').fill(title);
    await page.locator('#cms-new-slug').fill(stamp());
    await page.locator('#cms-new-submit').click();

    // the new record is selected, so the editor shows its title
    await expect.poll(async () => page.locator('#cms-title-input').inputValue()).toBe(title);
    await expect(page.getByText(title).first()).toBeVisible();
  });

  test('creating without a title reports the problem instead of doing nothing', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');
    await page.locator('#cms-new-btn').click();
    await page.locator('#cms-new-submit').click();
    await expect(page.locator('#cms-new-error')).toBeVisible();
    // the dialog stays open so the title can be typed
    await expect(page.locator('#cms-new-title')).toBeVisible();
  });

  test('the search box filters the list', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');
    const rows = page.locator('#cms-split > div').first().locator('.a-scroll > div');
    await expect.poll(async () => rows.count()).toBeGreaterThan(0);
    const before = await rows.count();

    await page.locator('#cms-search').fill('ไม่มีทางตรงกับอะไรเลย-zzz');
    await expect.poll(async () => rows.count()).toBeLessThan(before);
    await expect(page.getByText(/ไม่พบเนื้อหาที่ตรงกับ/)).toBeVisible();
  });
});

test.describe('changing a CMS slug', () => {
  /* The slug row showed an "แก้" link with a pointer cursor that did nothing —
     and PUT /api/cms/:id had no slug handling at all, so even a hand-written
     request could not change the public URL of a page. */
  test.afterAll(async () => {
    if (!db) {
      const { PrismaClient } = await import('@prisma/client');
      db = new PrismaClient();
    }
    await db.cmsPage.deleteMany({ where: { slug: { startsWith: 'e2e-' } } });
  });

  test('the slug can be edited and the new one sticks', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');

    // work on a throwaway record, never on real content
    await page.locator('#cms-new-btn').click();
    await page.locator('#cms-new-title').fill('ทดสอบแก้ slug');
    const first = `e2e-${Date.now().toString(36)}`;
    await page.locator('#cms-new-slug').fill(first);
    await page.locator('#cms-new-submit').click();
    await expect.poll(async () => page.locator('#cms-title-input').inputValue()).toBe('ทดสอบแก้ slug');

    const next = `${first}-x`;
    await page.locator('#cms-slug-edit').click();
    await page.locator('#cms-slug-input').fill(next);
    await page.locator('#cms-slug-save').click();

    await expect.poll(async () => page.locator('code').first().innerText()).toContain(next);
  });

  test('a duplicate slug is refused rather than silently ignored', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');

    const base = `e2e-${Date.now().toString(36)}`;
    for (const s of [`${base}-a`, `${base}-b`]) {
      await page.locator('#cms-new-btn').click();
      await page.locator('#cms-new-title').fill(`ทดสอบ slug ซ้ำ ${s}`);
      await page.locator('#cms-new-slug').fill(s);
      await page.locator('#cms-new-submit').click();
      await expect.poll(async () => page.locator('#cms-title-input').inputValue()).toContain(s);
    }

    // the second record is selected; try to take the first one's slug
    await page.locator('#cms-slug-edit').click();
    await page.locator('#cms-slug-input').fill(`${base}-a`);
    await page.locator('#cms-slug-save').click();

    await expect(page.getByText(/slug นี้มีอยู่แล้ว/)).toBeVisible();
  });
});

test.describe('the CMS category dropdown', () => {
  /* Two faults in one control. The option list was seven names hardcoded from
     the design prototype, so it offered categories nothing used and could not
     offer the nine the FAQ actually runs on — and there was no way to add one.
     The menu was also absolutely positioned inside a card with
     overflow:hidden, so the list was cut off by the card's edge. */
  test.afterAll(async () => {
    if (!db) {
      const { PrismaClient } = await import('@prisma/client');
      db = new PrismaClient();
    }
    await db.cmsPage.deleteMany({ where: { slug: { startsWith: 'e2e-' } } });
  });

  test('the options are the categories actually in use', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');

    /* the category on the selected record must be offered by the menu — read
       it only once the list has settled, or the tab switch races the reload */
    await expect.poll(async () => (await page.locator('#cms-cat-trigger').innerText()).trim()).not.toBe('');
    const shown = (await page.locator('#cms-cat-trigger').innerText()).trim();
    test.skip(!shown || shown === '—', 'the selected record has no category');

    await page.locator('#cms-cat-trigger').click();
    await expect(page.locator('#cms-cat-menu')).toBeVisible();
    await expect(page.locator('#cms-cat-menu').getByText(shown, { exact: true }).first()).toBeVisible();
  });

  test('the whole menu is on screen, not clipped by the card', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');
    await page.locator('#cms-cat-trigger').click();

    const menu = page.locator('#cms-cat-menu');
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box, 'the menu has no box').toBeTruthy();

    const viewport = page.viewportSize()!;
    expect(box!.x, 'the menu starts off the left edge').toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width, 'the menu runs past the right edge').toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.height, 'the menu has no height').toBeGreaterThan(40);

    // the last option must be reachable, not hidden behind an ancestor's clip
    const last = menu.locator('> div').filter({ hasText: /\S/ }).last();
    await expect(last).toBeVisible();
  });

  test('a new category can be typed and is kept', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');

    // never touch real content
    await page.locator('#cms-new-btn').click();
    await page.locator('#cms-new-title').fill('ทดสอบหมวดใหม่');
    await page.locator('#cms-new-slug').fill(`e2e-${Date.now().toString(36)}`);
    await page.locator('#cms-new-submit').click();
    await expect.poll(async () => page.locator('#cms-title-input').inputValue()).toBe('ทดสอบหมวดใหม่');

    const name = `หมวดทดสอบ ${Date.now().toString(36)}`;
    await page.locator('#cms-cat-trigger').click();
    await page.locator('#cms-cat-add').click();
    await page.locator('#cms-cat-new').fill(name);
    await page.locator('#cms-cat-new-ok').click();

    await expect(page.locator('#cms-cat-trigger')).toContainText(name);

    // it survives a save
    await page.getByText('บันทึกร่าง').click();
    await expect.poll(async () => (await page.locator('#cms-cat-trigger').innerText()).trim()).toContain(name);
  });
});

test.describe('deleting CMS content', () => {
  /* There was no DELETE route and no button. A page created by mistake could
     only be removed by hand in the database. */
  test.afterAll(async () => {
    if (!db) {
      const { PrismaClient } = await import('@prisma/client');
      db = new PrismaClient();
    }
    await db.cmsPage.deleteMany({ where: { slug: { startsWith: 'e2e-' } } });
  });

  test('an entry can be deleted and stops being listed', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');

    const title = `ทดสอบลบ ${Date.now().toString(36)}`;
    await page.locator('#cms-new-btn').click();
    await page.locator('#cms-new-title').fill(title);
    await page.locator('#cms-new-slug').fill(`e2e-${Date.now().toString(36)}`);
    await page.locator('#cms-new-submit').click();
    await expect.poll(async () => page.locator('#cms-title-input').inputValue()).toBe(title);

    await page.locator('#cms-delete-btn').click();
    await page.locator('#cms-delete-confirm').click();

    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  });

  test('the confirm step names what is about to go', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/cms');

    const title = `ทดสอบยกเลิกลบ ${Date.now().toString(36)}`;
    await page.locator('#cms-new-btn').click();
    await page.locator('#cms-new-title').fill(title);
    await page.locator('#cms-new-slug').fill(`e2e-${Date.now().toString(36)}`);
    await page.locator('#cms-new-submit').click();
    await expect.poll(async () => page.locator('#cms-title-input').inputValue()).toBe(title);

    await page.locator('#cms-delete-btn').click();
    await expect(page.getByText('ลบเนื้อหานี้?')).toBeVisible();
    // the dialog must show which record, not just "are you sure"
    await expect(page.getByText(title).first()).toBeVisible();

    await page.getByText('ยกเลิก', { exact: true }).click();
    await expect(page.locator('#cms-title-input')).toHaveValue(title);
  });

  test('an agent cannot delete content', async ({ page, request }) => {
    // create it as the owner, then try to remove it as an agent
    await signIn(page, OWNER);
    const ownerCookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const slug = `e2e-${Date.now().toString(36)}`;
    const made = await request.post('/api/cms', {
      headers: { cookie: ownerCookie },
      data: { kind: 'articles', title: 'ทดสอบสิทธิ์ลบ', slug },
    });
    expect(made.ok()).toBeTruthy();
    const { id } = await made.json();

    await page.goto('/admin/login');
    await signIn(page, AGENT);
    const agentCookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    const res = await request.delete(`/api/cms/${id}`, { headers: { cookie: agentCookie } });
    expect(res.status(), 'an agent must not be able to delete CMS content').toBe(403);
  });

  test('a core page refuses to be deleted', async ({ page, request }) => {
    await signIn(page, OWNER);
    const cookies = await page.context().cookies();
    const cookie = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const list = await (await request.get('/api/cms?kind=pages', { headers: { cookie } })).json();
    const home = (list.items as { id: string; slug: string }[]).find((p) => p.slug === 'home');
    test.skip(!home, 'no home metadata row in this database');

    const res = await request.delete(`/api/cms/${home!.id}`, { headers: { cookie } });
    expect(res.status(), 'deleting the home row should be refused').toBe(400);
    expect(JSON.stringify(await res.json())).toContain('หน้าหลักของเว็บ');

    // and it is still there
    const after = await (await request.get('/api/cms?kind=pages', { headers: { cookie } })).json();
    expect((after.items as { slug: string }[]).some((p) => p.slug === 'home')).toBeTruthy();
  });
});

test.describe('Flow B — requirement to shortlist', () => {
  /* This whole stage was a mock-up: no table, no routes, no list screen. The
     detail page showed one imaginary enquiry whose Cancel button repainted the
     screen and forgot on refresh, whose availability panel always said the same
     three things, and whose "สร้าง Shortlist" was a plain link.

     These drive it through the API the way the screens do, then check the two
     rules the spec puts at the centre of Flow B: a cancellation must name the
     failing item (FR-CRM-07), and only checked-available properties may enter a
     shortlist (FR-AVL-04). */
  let cookie = '';
  let leadId = '';
  const made: string[] = [];

  const api = (page: Page) => async () => {
    const cookies = await page.context().cookies();
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  };

  test.beforeEach(async ({ page, request }) => {
    await signIn(page, OWNER);
    cookie = await (api(page))();
    const leads = await (await request.get('/api/leads', { headers: { cookie } })).json();
    leadId = leads.items?.[0]?.id ?? '';
    expect(leadId, 'no lead to attach a requirement to').toBeTruthy();
  });

  test.afterAll(async () => {
    if (!db) {
      const { PrismaClient } = await import('@prisma/client');
      db = new PrismaClient();
    }
    for (const id of made) await db.requirement.deleteMany({ where: { id } });
  });

  const create = async (request: import('@playwright/test').APIRequestContext, extra: Record<string, unknown> = {}) => {
    const res = await request.post('/api/requirements', {
      headers: { cookie },
      data: { leadId, dealIntent: 'เช่า', usage: 'คลังสินค้า', areaMin: 2000, areaMax: 3500, needsRor4: true, ...extra },
    });
    expect(res.status(), await res.text()).toBe(201);
    const r = await res.json();
    made.push(r.id);
    return r;
  };

  test('a requirement gets a code and lands in the queue', async ({ request }) => {
    const r = await create(request);
    expect(r.code, 'no REQ code issued').toMatch(/^REQ-\d+$/);
    expect(r.status).toBe('submitted');
    // ranges arrive the way round they read
    expect(r.areaMin).toBe(2000);
    expect(r.areaMax).toBe(3500);

    const list = await (await request.get('/api/requirements?status=submitted', { headers: { cookie } })).json();
    expect((list.items as { id: string }[]).some((x) => x.id === r.id)).toBeTruthy();
    expect(list.counts.submitted, 'the chip count is not from the table').toBeGreaterThan(0);
  });

  test('a reversed range is stored the way it reads', async ({ request }) => {
    const r = await create(request, { areaMin: 5000, areaMax: 1000, budgetMin: 300000, budgetMax: 100000 });
    expect(r.areaMin).toBe(1000);
    expect(r.areaMax).toBe(5000);
    expect(r.budgetMin).toBe(100000);
    expect(r.budgetMax).toBe(300000);
  });

  test('cancelling without naming the failing item is refused (FR-CRM-07)', async ({ request }) => {
    const r = await create(request);

    const noField = await request.patch(`/api/requirements/${r.id}`, {
      headers: { cookie }, data: { action: 'cancel', cancelReason: 'งบไม่ถึง' },
    });
    expect(noField.status()).toBe(400);

    const noReason = await request.patch(`/api/requirements/${r.id}`, {
      headers: { cookie }, data: { action: 'cancel', cancelField: 'budget' },
    });
    expect(noReason.status()).toBe(400);

    const ok = await request.patch(`/api/requirements/${r.id}`, {
      headers: { cookie }, data: { action: 'cancel', cancelField: 'budget', cancelReason: 'งบไม่ถึงราคาตลาด' },
    });
    expect(ok.ok(), await ok.text()).toBeTruthy();
    expect((await ok.json()).status).toBe('cancelled');
  });

  test('a shortlist needs a confirmed requirement and an available property (FR-AVL-04)', async ({ request }) => {
    const r = await create(request);

    // still submitted → refused
    const early = await request.post(`/api/requirements/${r.id}/shortlist`, { headers: { cookie }, data: {} });
    expect(early.status(), 'an unconfirmed requirement must not build a shortlist').toBe(400);

    await request.patch(`/api/requirements/${r.id}`, { headers: { cookie }, data: { action: 'confirm' } });

    // confirmed but nothing checked → still refused
    const unchecked = await request.post(`/api/requirements/${r.id}/shortlist`, { headers: { cookie }, data: {} });
    expect(unchecked.status(), 'no availability check should block the shortlist').toBe(400);
    expect(JSON.stringify(await unchecked.json())).toContain('ว่าง');

    // record "not free" → still refused
    const listings = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const active = (listings.items as { publicCode: string; status: string }[]).find((p) => p.status === 'active');
    test.skip(!active, 'no active property to check against');

    await request.post(`/api/requirements/${r.id}/checks`, {
      headers: { cookie }, data: { code: active!.publicCode, result: 'unavailable' },
    });
    const stillNo = await request.post(`/api/requirements/${r.id}/shortlist`, { headers: { cookie }, data: {} });
    expect(stillNo.status(), 'an unavailable property must not open the gate').toBe(400);

    // record "free" → allowed
    await request.post(`/api/requirements/${r.id}/checks`, {
      headers: { cookie }, data: { code: active!.publicCode, result: 'available' },
    });
    const built = await request.post(`/api/requirements/${r.id}/shortlist`, { headers: { cookie }, data: {} });
    expect(built.status(), await built.text()).toBe(201);
    const sl = await built.json();
    expect(sl.count).toBeGreaterThan(0);
    expect(sl.url).toContain('/client-shortlist?token=');
  });

  test('re-checking a property replaces its answer rather than stacking', async ({ request }) => {
    const r = await create(request);
    const listings = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const active = (listings.items as { publicCode: string; status: string }[]).find((p) => p.status === 'active');
    test.skip(!active, 'no active property to check against');

    for (const result of ['available', 'unavailable', 'available']) {
      await request.post(`/api/requirements/${r.id}/checks`, {
        headers: { cookie }, data: { code: active!.publicCode, result },
      });
    }
    const detail = await (await request.get(`/api/requirements/${r.id}`, { headers: { cookie } })).json();
    const rows = (detail.checks as { code: string; result: string }[]).filter((c) => c.code === active!.publicCode);
    expect(rows.length, 'checks stacked instead of replacing').toBe(1);
    expect(rows[0].result).toBe('available');
  });

  test('confirming moves the lead forward, and never backwards', async ({ request }) => {
    const r = await create(request);
    const statusOf = async () => {
      const list = await (await request.get('/api/leads', { headers: { cookie } })).json();
      return (list.items as { id: string; status: string }[]).find((l) => l.id === leadId)?.status ?? '';
    };
    const beforeStatus = await statusOf();

    await request.patch(`/api/requirements/${r.id}`, { headers: { cookie }, data: { action: 'confirm' } });

    const afterStatus = await statusOf();

    const ORDER = ['new', 'qualified', 'profile_received', 'requirements_confirmed', 'shortlisted', 'visit_scheduled', 'negotiating', 'won', 'lost'];
    expect(
      ORDER.indexOf(afterStatus),
      `lead went backwards: ${beforeStatus} → ${afterStatus}`,
    ).toBeGreaterThanOrEqual(ORDER.indexOf(beforeStatus));
  });


  test('what the parser could not read can be typed in by hand', async ({ page, request }) => {
    // a submission the parser cannot fully read — free text, no numbers
    // start with nothing filled in, the way an unreadable submission arrives
    const r = await create(request, { areaMin: null, areaMax: null, budgetMin: null, budgetMax: null, usage: '', needsRor4: false });
    await page.goto(`/admin/requirements/${r.id}`);
    await expect(page.locator('#cms-title-input, h1')).toBeVisible();

    await page.locator('#req-edit').click();
    await page.locator('#req-f-usage').fill('คลังสินค้า/โลจิสติกส์');
    await page.locator('#req-f-areaMin').fill('2000');
    await page.locator('#req-f-areaMax').fill('3500');
    await page.locator('#req-f-budgetMin').fill('150000');
    await page.locator('#req-f-budgetMax').fill('250000');
    await page.locator('#req-f-needsRor4').click();
    await page.locator('#req-f-locations').fill('สมุทรปราการ, ชลบุรี');
    await page.locator('#req-edit-save').click();

    await expect.poll(async () => {
      const d = await (await request.get(`/api/requirements/${r.id}`, { headers: { cookie } })).json();
      return { area: d.areaMin, budget: d.budgetMax, ror4: d.needsRor4, locs: (d.locations ?? []).length, usage: d.usage };
    }, { message: 'the edit never reached the server' }).toEqual({
      area: 2000, budget: 250000, ror4: true, locs: 2, usage: 'คลังสินค้า/โลจิสติกส์',
    });

    await page.reload();
    await expect(page.locator('#req-fields').getByText('2,000 – 3,500 ตร.ม.')).toBeVisible();
  });

  test('the queue screen lists requirements and opens one', async ({ page }) => {
    await page.goto('/admin/requirements');
    const rows = page.locator('a.req-row');
    await expect.poll(async () => rows.count(), { message: 'the queue is empty' }).toBeGreaterThan(0);
    await rows.first().click();
    await expect(page).toHaveURL(/\/admin\/requirements\/[a-z0-9]+/);
    // the detail page shows a real code, not the hardcoded REQ-1042
    await expect(page.locator('h1')).toContainText(/REQ-\d+/);
  });

  test('the sidebar badge counts real rows, not the literal 18 and 7', async ({ page, request }) => {
    const counts = await (await request.get('/api/nav-counts', { headers: { cookie } })).json();
    expect(typeof counts.leads).toBe('number');
    expect(typeof counts.requirements).toBe('number');

    await page.goto('/admin/requirements');
    const badge = page.locator('[data-badge="requirements"]');
    if (counts.requirements === 0) {
      await expect(badge, 'a zero badge should not be shown at all').toHaveCount(0);
    } else {
      await expect(badge).toHaveText(String(counts.requirements));
    }
  });
});

test.describe('the shortlist screen shows the shortlist it will send', () => {
  /* The rows, the candidates, the requirement summary and the title were all
     constants — but the send button was real, PATCHing the newest actual
     shortlist. You could read two properties off the screen, press send, and
     the customer would receive two different ones. Reorder, remove and add
     were local state that vanished on refresh; the note field had no handler
     at all. The API behind it was complete the whole time. */
  let cookie = '';

  test.beforeEach(async ({ page }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  });

  test('the rows on screen are the rows in the record', async ({ page, request }) => {
    const list = await (await request.get('/api/shortlists', { headers: { cookie } })).json();
    const withRows = (list.items as { id: string; count: number }[]).find((s) => s.count > 0);
    test.skip(!withRows, 'no shortlist with rows to look at');

    const detail = await (await request.get(`/api/shortlists/${withRows!.id}`, { headers: { cookie } })).json();
    const codes = (detail.items as { code: string }[]).map((i) => i.code);
    expect(codes.length, 'the record says it has rows but the detail is empty').toBeGreaterThan(0);

    await page.goto(`/admin/shortlists/${withRows!.id}`);
    for (const code of codes) {
      await expect(page.getByText(code, { exact: true }).first(), `${code} is missing from the screen`).toBeVisible();
    }

    // and the invented ones are gone
    for (const ghost of ['JKP-PTE0033', 'SL-208']) {
      await expect(page.getByText(ghost, { exact: true }), `${ghost} is demo data`).toHaveCount(0);
    }
  });

  test('the header names the real record, not SL-208', async ({ page, request }) => {
    const list = await (await request.get('/api/shortlists', { headers: { cookie } })).json();
    const first = list.items?.[0];
    test.skip(!first, 'no shortlist to look at');

    await page.goto(`/admin/shortlists/${first.id}`);
    await expect(page.locator('h1')).toContainText(first.name);
  });

  test('removing a row persists across a reload', async ({ page, request }) => {
    // build a throwaway shortlist from real properties
    const props = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const codes = (props.items as { publicCode: string; status: string }[])
      .filter((p) => p.status === 'active').slice(0, 2).map((p) => p.publicCode);
    test.skip(codes.length < 2, 'need two active properties');

    const made = await request.post('/api/shortlists', {
      headers: { cookie }, data: { name: `e2e-shortlist-${Date.now().toString(36)}`, codes },
    });
    expect(made.status()).toBe(201);
    const { id } = await made.json();

    await page.goto(`/admin/shortlists/${id}`);
    await expect(page.getByText(codes[0], { exact: true }).first()).toBeVisible();

    await page.getByTitle('เอาออกจาก shortlist').first().click();
    await expect.poll(async () => {
      const d = await (await request.get(`/api/shortlists/${id}`, { headers: { cookie } })).json();
      return (d.items as unknown[]).length;
    }, { message: 'the removal never reached the server' }).toBe(1);

    await page.reload();
    await expect(page.getByTitle('เอาออกจาก shortlist')).toHaveCount(1);

    await request.delete(`/api/shortlists/${id}`, { headers: { cookie } }).catch(() => null);
  });

  test('an empty database says so instead of showing a demo shortlist', async ({ page, request }) => {
    const list = await (await request.get('/api/shortlists', { headers: { cookie } })).json();
    test.skip((list.items ?? []).length > 0, 'there are real shortlists — nothing to assert');
    await page.goto('/admin/shortlists');
    await expect(page.getByText('ยังไม่มี shortlist')).toBeVisible();
  });
});

test.describe('lead notes and follow-up tasks', () => {
  /* Both were POSTed and never read back, so "Timeline & Notes" was four
     invented events and "งานติดตาม" three invented rows, identical on every
     lead — and the POST's failure was swallowed, so a rejected save looked
     exactly like a saved one. Ticking a task called a setState that changed
     nothing; there was no PATCH to tick it with. */
  let cookie = '';
  let leadId = '';

  test.beforeEach(async ({ page, request }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const leads = await (await request.get('/api/leads', { headers: { cookie } })).json();
    leadId = leads.items?.[0]?.id ?? '';
    expect(leadId, 'no lead to work with').toBeTruthy();
  });

  test('a note survives a reload', async ({ page, request }) => {
    const text = `โน้ตทดสอบ ${Date.now().toString(36)}`;
    await page.goto('/admin/leads');
    await page.locator('#lead-note-input').fill(text);
    await page.locator('#lead-note-save').click();

    await expect.poll(async () => {
      const d = await (await request.get(`/api/leads/${leadId}`, { headers: { cookie } })).json();
      return (d.notes as { text: string }[]).some((n) => n.text === text);
    }, { message: 'the note never reached the server' }).toBeTruthy();

    await page.reload();
    await expect(page.getByText(text)).toBeVisible();
  });

  test('a task survives a reload and can be ticked off', async ({ page, request }) => {
    const title = `งานทดสอบ ${Date.now().toString(36)}`;
    await page.goto('/admin/leads');
    await page.getByText('งานติดตาม').first().locator('..').locator('span').last().click();
    await page.locator('#lead-task-input').fill(title);
    await page.locator('#lead-task-save').click();

    const taskOf = async () => {
      const d = await (await request.get(`/api/leads/${leadId}`, { headers: { cookie } })).json();
      return (d.tasks as { title: string; done: boolean }[]).find((t) => t.title === title);
    };
    await expect.poll(async () => !!(await taskOf()), { message: 'the task never reached the server' }).toBeTruthy();

    await page.reload();
    const row = page.getByText(title);
    await expect(row).toBeVisible();

    // tick it — the box used to be decoration
    await row.locator('../..').locator('div').first().click();
    await expect.poll(async () => (await taskOf())?.done, { message: 'ticking did not persist' }).toBe(true);
  });

  test('the timeline is this lead\'s notes, not four invented events', async ({ page, request }) => {
    const d = await (await request.get(`/api/leads/${leadId}`, { headers: { cookie } })).json();
    await page.goto('/admin/leads');
    // the ported demo events must be gone
    for (const ghost of ['โทรครั้งแรก — ลูกค้าสนใจโซนบางนา', 'มอบหมายให้ อารยา', 'เตรียม shortlist 5 รายการ']) {
      await expect(page.getByText(ghost), `${ghost} is demo data`).toHaveCount(0);
    }
    // and every real note is shown
    for (const n of (d.notes as { text: string }[]).slice(0, 3)) {
      await expect(page.getByText(n.text).first()).toBeVisible();
    }
  });

  test('the linked strip points at records that exist', async ({ page, request }) => {
    const d = await (await request.get(`/api/leads/${leadId}`, { headers: { cookie } })).json();
    await page.goto('/admin/leads');
    await expect(page.getByText('Requirement #REQ-1042'), 'REQ-1042 never existed').toHaveCount(0);
    await expect(page.getByText('Shortlist #SL-208'), 'SL-208 never existed').toHaveCount(0);

    const reqs = d.linked?.requirements as { code: string }[] | undefined;
    if (reqs?.length) {
      await expect(page.getByText(`Requirement ${reqs[0].code}`)).toBeVisible();
    }
  });
});

test.describe('follow-up task deadlines', () => {
  /* The three tick boxes were red / amber / green because those colours were
     typed next to three hardcoded tasks — they looked like urgency and meant
     nothing, and there was no way to give a task a date at all. The colour is
     computed from the deadline now, and the deadline is spelled out in words
     next to it so the colour is never the only signal. */
  let cookie = '';
  let leadId = '';

  test.beforeEach(async ({ page, request }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const leads = await (await request.get('/api/leads', { headers: { cookie } })).json();
    leadId = leads.items?.[0]?.id ?? '';
    expect(leadId).toBeTruthy();
  });

  const iso = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  };

  test('a deadline entered on the form reaches the record', async ({ page, request }) => {
    const title = `งานมีกำหนด ${Date.now().toString(36)}`;
    await page.goto('/admin/leads');
    await page.getByText('งานติดตาม').first().locator('..').locator('span').last().click();
    await page.locator('#lead-task-input').fill(title);
    await page.locator('#lead-task-due').fill(iso(3));
    await page.locator('#lead-task-save').click();

    await expect.poll(async () => {
      const d = await (await request.get(`/api/leads/${leadId}`, { headers: { cookie } })).json();
      return (d.tasks as { title: string; due: number | null }[]).find((t) => t.title === title)?.due ?? null;
    }, { message: 'the deadline never reached the server' }).not.toBeNull();

    await page.reload();
    await expect(page.getByText(title)).toBeVisible();
  });

  test('the wording follows the deadline, not a fixed colour', async ({ page, request }) => {
    const cases: [number, RegExp][] = [
      [-2, /เลยกำหนด/],
      [0, /ครบกำหนดวันนี้/],
      [1, /พรุ่งนี้/],
      [5, /อีก 5 วัน/],
    ];
    const made: string[] = [];
    for (const [days] of cases) {
      const title = `deadline ${days} ${Date.now().toString(36)}`;
      made.push(title);
      const res = await request.post(`/api/leads/${leadId}/tasks`, {
        headers: { cookie }, data: { title, due: iso(days) },
      });
      expect(res.ok(), await res.text()).toBeTruthy();
    }

    await page.goto('/admin/leads');
    for (let i = 0; i < cases.length; i++) {
      const row = page.getByText(made[i]).locator('..');
      await expect(row, `${made[i]} is missing`).toBeVisible();
      await expect(row, `wrong wording for ${cases[i][0]} days`).toContainText(cases[i][1]);
    }

    // clean up
    const d = await (await request.get(`/api/leads/${leadId}`, { headers: { cookie } })).json();
    for (const t of d.tasks as { id: string; title: string }[]) {
      if (made.includes(t.title)) {
        await request.delete(`/api/leads/${leadId}/tasks?taskId=${t.id}`, { headers: { cookie } });
      }
    }
  });

  test('a task with no deadline says so rather than inventing one', async ({ page, request }) => {
    const title = `งานไม่มีกำหนด ${Date.now().toString(36)}`;
    const made = await request.post(`/api/leads/${leadId}/tasks`, { headers: { cookie }, data: { title } });
    expect(made.ok()).toBeTruthy();

    await page.goto('/admin/leads');
    await expect(page.getByText(title).locator('..')).toContainText('ไม่ได้กำหนดวัน');

    const d = await (await request.get(`/api/leads/${leadId}`, { headers: { cookie } })).json();
    const t = (d.tasks as { id: string; title: string }[]).find((x) => x.title === title);
    if (t) await request.delete(`/api/leads/${leadId}/tasks?taskId=${t.id}`, { headers: { cookie } });
  });
});

test.describe('the visit plan shows the visit it will close', () => {
  /* Two invented appointments with invented landlords and invented outcomes, a
     four-stop route and a fixed date of 22 ก.ค. 2026 — while "ปิด plan" closed
     whichever real visit was newest. You could read one plan and close another.
     There was also no way to record the outcome of a stop, despite the API
     accepting one. */
  let cookie = '';
  const made: string[] = [];

  test.beforeEach(async ({ page }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  });

  test.afterAll(async () => {
    if (!db) {
      const { PrismaClient } = await import('@prisma/client');
      db = new PrismaClient();
    }
    for (const id of made) await db.visit.deleteMany({ where: { id } });
  });

  const makeVisit = async (request: import('@playwright/test').APIRequestContext) => {
    const props = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const codes = (props.items as { publicCode: string; status: string }[])
      .filter((p) => p.status === 'active').slice(0, 2).map((p) => p.publicCode);
    test.skip(codes.length === 0, 'no active property to visit');
    const res = await request.post('/api/visits', {
      headers: { cookie },
      data: { date: new Date().toISOString(), codes, note: 'e2e' },
    });
    expect(res.status(), await res.text()).toBe(201);
    const { id } = await res.json();
    made.push(id);
    return { id, codes };
  };

  test('the stops on screen are the stops on the plan', async ({ page, request }) => {
    const { id, codes } = await makeVisit(request);
    await page.goto(`/admin/visits/${id}`);
    for (const code of codes) {
      await expect(page.locator(`[data-stop="${code}"]`), `${code} is missing`).toBeVisible();
    }
    // the invented ones are gone
    for (const ghost of ['คุณประเสริฐ (เจ้าของ SPK)', 'บ. ปิ่นทอง แลนด์', '22 ก.ค. 2026']) {
      await expect(page.getByText(ghost), `${ghost} is demo data`).toHaveCount(0);
    }
  });

  test('an outcome recorded on a stop is saved', async ({ page, request }) => {
    const { id, codes } = await makeVisit(request);
    await page.goto(`/admin/visits/${id}`);
    await page.locator(`[data-outcome="${codes[0]}:สนใจมาก"]`).click();

    await expect.poll(async () => {
      const d = await (await request.get('/api/visits', { headers: { cookie } })).json();
      const v = (d.items as { id: string; stops: { code: string; result: string | null }[] }[]).find((x) => x.id === id);
      return v?.stops.find((s) => s.code === codes[0])?.result ?? null;
    }, { message: 'the outcome never reached the server' }).toBe('สนใจมาก');

    await page.reload();
    await expect(page.locator('[data-tally="สนใจมาก"]')).toContainText('1');
  });
});

test.describe('the deal screen shows the deal, not a worked example', () => {
  /* Four negotiation rounds, a ฿385,000 agreed price, a ฿13.86M contract value
     and three PDFs were all constants — and the real offers were appended after
     the invented ones, so the timeline mixed fiction with the record. */
  let cookie = '';
  const made: string[] = [];

  test.beforeEach(async ({ page }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  });

  test.afterAll(async () => {
    if (!db) {
      const { PrismaClient } = await import('@prisma/client');
      db = new PrismaClient();
    }
    for (const id of made) await db.deal.deleteMany({ where: { id } });
  });


  test('a document can be attached to a deal, downloaded and removed', async ({ page, request }) => {
    const res = await request.post('/api/deals', {
      headers: { cookie }, data: { title: `e2e docs ${Date.now().toString(36)}`, amount: 1000 },
    });
    const { id } = await res.json();
    made.push(id);

    await page.goto(`/admin/deals/${id}`);
    await expect(page.getByText('ยังไม่มีเอกสาร')).toBeVisible();

    // a minimal but genuinely valid PDF
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
    await page.locator('#deal-doc-upload').click();
    await page.locator('input[type="file"]').setInputFiles({ name: 'สัญญาเช่า.pdf', mimeType: 'application/pdf', buffer: pdf });

    const row = page.locator('[data-doc]').first();
    await expect(row).toBeVisible();
    await expect(row).toContainText('สัญญาเช่า.pdf');
    await expect(row).toContainText('รอเซ็น');

    // it survives a reload, and the file really comes back
    await page.reload();
    await expect(page.locator('[data-doc]').first()).toContainText('สัญญาเช่า.pdf');

    const list = await (await request.get(`/api/deals/${id}/docs`, { headers: { cookie } })).json();
    const doc = list.items[0];
    const dl = await request.get(doc.url, { headers: { cookie } });
    expect(dl.ok(), 'the stored file could not be read back').toBeTruthy();
    expect((await dl.body()).subarray(0, 4).toString()).toBe('%PDF');
    /* HTTP headers are latin-1 and Thai filenames are the norm here — putting
       one in raw threw and killed the download. */
    expect(dl.headers()['content-disposition'], 'the Thai filename is not carried').toContain("filename*=UTF-8''");

    // status toggles, then it deletes
    await page.locator(`[data-doc-status="${doc.id}"]`).click();
    await expect.poll(async () => {
      const r = await (await request.get(`/api/deals/${id}/docs`, { headers: { cookie } })).json();
      return r.items[0]?.status;
    }).toBe('ครบ');

    await page.locator(`[data-doc-remove="${doc.id}"]`).click();
    await expect.poll(async () => {
      const r = await (await request.get(`/api/deals/${id}/docs`, { headers: { cookie } })).json();
      return (r.items as unknown[]).length;
    }).toBe(0);
  });

  test('an executable is refused, and a closed deal will not take new paperwork', async ({ request }) => {
    const res = await request.post('/api/deals', {
      headers: { cookie }, data: { title: `e2e docs guard ${Date.now().toString(36)}`, amount: 1000 },
    });
    const { id } = await res.json();
    made.push(id);

    const bad = await request.post(`/api/deals/${id}/docs`, {
      headers: { cookie },
      multipart: { file: { name: 'run.sh', mimeType: 'application/x-sh', buffer: Buffer.from('rm -rf /') } },
    });
    expect(bad.status(), 'a deal folder is not a place to park scripts').toBe(400);

    // close the deal, then try again
    await request.patch(`/api/deals/${id}`, { headers: { cookie }, data: { status: 'won' } });
    const afterClose = await request.post(`/api/deals/${id}/docs`, {
      headers: { cookie },
      multipart: { file: { name: 'late.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF\n') } },
    });
    expect(afterClose.status(), 'a closed deal should need unlocking first').toBe(400);
  });

  test('a new deal has an empty timeline, not four invented rounds', async ({ page, request }) => {
    const res = await request.post('/api/deals', {
      headers: { cookie }, data: { title: `e2e deal ${Date.now().toString(36)}`, amount: 123456 },
    });
    expect(res.status()).toBe(201);
    const { id } = await res.json();
    made.push(id);

    await page.goto(`/admin/deals/${id}`);
    await expect(page.getByText('ยังไม่มีการเสนอราคา')).toBeVisible();
    for (const ghost of ['฿350,000/ด.', '฿405,000/ด.', '฿13.86M', 'สัญญาเช่า (ฉบับร่าง).pdf']) {
      await expect(page.getByText(ghost), `${ghost} is demo data`).toHaveCount(0);
    }
    // the real amount is shown
    await expect(page.getByText('฿123,456').first()).toBeVisible();
  });

  test('an offer that is added shows up in the timeline', async ({ page, request }) => {
    const res = await request.post('/api/deals', {
      headers: { cookie }, data: { title: `e2e offer ${Date.now().toString(36)}`, amount: 100000 },
    });
    const { id } = await res.json();
    made.push(id);

    await request.post(`/api/deals/${id}/offers`, {
      headers: { cookie }, data: { side: 'ฝั่งลูกค้า', amount: '฿99,000/ด.', terms: 'ขอลดราคา' },
    });

    await page.goto(`/admin/deals/${id}`);
    await expect(page.getByText('฿99,000/ด.')).toBeVisible();
    await expect(page.getByText('ขอลดราคา')).toBeVisible();
    await expect(page.getByText('ยังไม่มีการเสนอราคา')).toHaveCount(0);
  });
});

test.describe('the chain from requirement to deal, clicked end to end', () => {
  /* Every stage worked on its own; the joins between them did not exist.
     POST /api/requirements, /api/visits and /api/deals had all shipped and
     nothing on any screen called them, so the flow could only be walked by
     hand in the database. */
  let cookie = '';
  const madeReq: string[] = [];
  const madeVisit: string[] = [];
  const madeDeal: string[] = [];

  test.beforeEach(async ({ page }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  });

  test.afterAll(async () => {
    if (!db) {
      const { PrismaClient } = await import('@prisma/client');
      db = new PrismaClient();
    }
    for (const id of madeDeal) await db.deal.deleteMany({ where: { id } });
    for (const id of madeVisit) await db.visit.deleteMany({ where: { id } });
    for (const id of madeReq) await db.requirement.deleteMany({ where: { id } });
  });

  test('a requirement can be raised from the queue screen', async ({ page, request }) => {
    await page.goto('/admin/requirements');
    await page.locator('#req-new-btn').click();
    await expect(page.getByText('เพิ่ม requirement').last()).toBeVisible();

    const leads = await (await request.get('/api/leads', { headers: { cookie } })).json();
    const lead = leads.items?.[0];
    test.skip(!lead, 'no lead to attach to');

    await page.locator(`[data-lead="${lead.id}"]`).click();
    await page.locator('#req-new-save').click();
    await expect(page).toHaveURL(/\/admin\/requirements\/[a-z0-9]+/);

    const id = page.url().split('/').pop()!;
    madeReq.push(id);
    await expect(page.locator('h1')).toContainText(/REQ-\d+/);
  });

  test('a viewing is booked from the shortlist and a deal opened from the viewing', async ({ page, request }) => {
    // a shortlist with a property, sent to the customer
    const props = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const code = (props.items as { publicCode: string; status: string }[]).find((p) => p.status === 'active')?.publicCode;
    test.skip(!code, 'no active property');

    const sl = await (await request.post('/api/shortlists', {
      headers: { cookie }, data: { name: `e2e-chain-${Date.now().toString(36)}`, codes: [code] },
    })).json();
    await request.patch(`/api/shortlists/${sl.id}`, { headers: { cookie }, data: { status: 'sent' } });

    // book the viewing from the shortlist screen
    await page.goto(`/admin/shortlists/${sl.id}`);
    await page.locator('#sl-book-visit').click();
    const when = new Date();
    when.setDate(when.getDate() + 2);
    await page.locator('#sl-visit-date').fill(when.toISOString().slice(0, 10));
    await page.locator('#sl-visit-save').click();

    await expect(page).toHaveURL(/\/admin\/visits\/[a-z0-9]+/, { timeout: 15000 });
    const visitId = page.url().split('/').pop()!;
    madeVisit.push(visitId);
    await expect(page.locator(`[data-stop="${code}"]`)).toBeVisible();

    // record an outcome, then open the deal from the viewing
    await page.locator(`[data-outcome="${code}:สนใจมาก"]`).click();
    await expect.poll(async () => {
      const d = await (await request.get('/api/visits', { headers: { cookie } })).json();
      return (d.items as { id: string; stops: { result: string | null }[] }[])
        .find((v) => v.id === visitId)?.stops[0]?.result ?? null;
    }).toBe('สนใจมาก');

    await page.locator('#visit-open-deal').click();
    await page.locator('#visit-deal-amount').fill('250000');
    await page.locator('#visit-deal-save').click();

    await expect(page).toHaveURL(/\/admin\/deals\/[a-z0-9]+/, { timeout: 15000 });
    madeDeal.push(page.url().split('/').pop()!);
    await expect(page.getByText('฿250,000').first()).toBeVisible();

    await request.delete(`/api/shortlists/${sl.id}`, { headers: { cookie } }).catch(() => null);
  });

  test("the customer's answer reaches the team", async ({ page, request }) => {
    const props = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const code = (props.items as { publicCode: string; status: string }[]).find((p) => p.status === 'active')?.publicCode;
    test.skip(!code, 'no active property');

    const sl = await (await request.post('/api/shortlists', {
      headers: { cookie }, data: { name: `e2e-fb-${Date.now().toString(36)}`, codes: [code] },
    })).json();

    // the customer opens the tokenized link and says yes
    const pub = await (await request.get(`/api/public/shortlists/${sl.token}`)).json();
    const item = (pub.data ?? pub).items[0];
    const said = await request.post(`/api/public/shortlists/${sl.token}`, {
      data: { itemId: item.itemId, feedback: 'interested' },
    });
    expect(said.ok(), await said.text()).toBeTruthy();

    // and the team sees it on the admin screen
    await page.goto(`/admin/shortlists/${sl.id}`);
    await expect(page.locator(`[data-feedback="${code}"]`)).toContainText('ลูกค้าสนใจ');

    await request.delete(`/api/shortlists/${sl.id}`, { headers: { cookie } }).catch(() => null);
  });


  test('all three answers save, not just the cheerful one', async ({ request }) => {
    const props = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const code = (props.items as { publicCode: string; status: string }[]).find((p) => p.status === 'active')?.publicCode;
    test.skip(!code, 'no active property');

    const sl = await (await request.post('/api/shortlists', {
      headers: { cookie }, data: { name: `e2e-fb3-${Date.now().toString(36)}`, codes: [code] },
    })).json();
    const pub = await (await request.get(`/api/public/shortlists/${sl.token}`)).json();
    const itemId = (pub.data ?? pub).items[0].itemId;

    /* The UI keys ('interested' | 'undecided' | 'not') and the stored values
       ('interested' | 'maybe' | 'not_interested') are different sets. A wrong
       mapping quietly rejected two of the three — leaving only the good news
       able to reach the team. */
    for (const value of ['interested', 'maybe', 'not_interested']) {
      const res = await request.post(`/api/public/shortlists/${sl.token}`, { data: { itemId, feedback: value } });
      expect(res.ok(), `${value} was refused: ${await res.text()}`).toBeTruthy();
      const back = await (await request.get(`/api/public/shortlists/${sl.token}`)).json();
      expect((back.data ?? back).items[0].feedback, `${value} did not stick`).toBe(value);
    }

    await request.delete(`/api/shortlists/${sl.id}`, { headers: { cookie } }).catch(() => null);
  });

  test('the client page reads in the language the link asks for', async ({ page, request }) => {
    const props = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const code = (props.items as { publicCode: string; status: string }[]).find((p) => p.status === 'active')?.publicCode;
    test.skip(!code, 'no active property');
    const sl = await (await request.post('/api/shortlists', {
      headers: { cookie }, data: { name: `e2e-lang-${Date.now().toString(36)}`, codes: [code] },
    })).json();

    /* the language must be right in the HTML the server sends, not applied
       after JS runs — otherwise the customer watches it flip */
    const html = await (await request.get(`/client-shortlist?token=${sl.token}&lang=en`)).text();
    expect(html, 'the server rendered Thai for an English link').toContain('Properties that match what you asked for');

    await page.goto(`/client-shortlist?token=${sl.token}&lang=en`);
    await expect(page.getByText('Properties that match what you asked for')).toBeVisible();
    await expect(page.getByText('ทรัพย์ที่ตรงกับความต้องการของคุณ')).toHaveCount(0);

    // and the customer can switch it themselves
    await page.locator('[data-lang="zh"]').click();
    await expect(page.getByText('符合您需求的房源')).toBeVisible();

    await request.delete(`/api/shortlists/${sl.id}`, { headers: { cookie } }).catch(() => null);
  });

  test('the client link refuses to invent a shortlist when opened without a token', async ({ page }) => {
    await page.goto('/client-shortlist');
    await expect(page.getByText('ไม่พบรายการนี้')).toBeVisible();
    // the worked example is gone
    await expect(page.getByText('บริษัท ไทยโลจิสติกส์ กรุ๊ป จำกัด')).toHaveCount(0);
    await expect(page.getByText('อารยา สุขสวัสดิ์')).toHaveCount(0);
  });
});

test.describe('the properties screen', () => {
  /* Export was href="#", "ทำสำเนา" was href="#", and the pager offered pages
     1 · 2 · 3 · … above a list of three items on one page. The row menu did
     pass ?code=, but /admin/property-view ignored it and rendered a fixed
     warehouse — so "ดูรายละเอียด" opened the same imaginary record from every
     row. */
  let cookie = '';

  test.beforeEach(async ({ page }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  });

  test('ดูรายละเอียด opens the row it was clicked from', async ({ page, request }) => {
    const props = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const rows = props.items as { publicCode: string; title: string }[];
    test.skip(rows.length < 2, 'need two properties to tell them apart');

    for (const r of rows.slice(0, 2)) {
      await page.goto(`/admin/property-view?code=${encodeURIComponent(r.publicCode)}`);
      await expect(page.locator('h1'), `${r.publicCode} did not open`).toContainText(r.publicCode);
    }

    // the imaginary one is gone
    await expect(page.getByText('4 ไร่')).toHaveCount(0);
  });

  test('an unknown or missing code says so instead of showing a stand-in', async ({ page }) => {
    await page.goto('/admin/property-view?code=JKP-NOPE9999');
    await expect(page.getByText('ไม่พบทรัพย์รหัส JKP-NOPE9999')).toBeVisible();

    await page.goto('/admin/property-view');
    await expect(page.getByText('ไม่ได้ระบุว่าจะดูทรัพย์ไหน')).toBeVisible();
  });

  test('the pager no longer offers pages that do not exist', async ({ page, request }) => {
    const props = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const n = (props.items as unknown[]).length;
    await page.goto('/admin/properties');
    await expect(page.getByText(`แสดง ${n} จาก`)).toBeVisible();
    // a single page of results must not be dressed up as three
    await expect(page.getByText('…', { exact: true })).toHaveCount(0);
  });

  test('Export downloads the rows that are on screen', async ({ page }) => {
    await page.goto('/admin/properties');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#prop-export').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^properties-\d{4}-\d{2}-\d{2}\.csv$/);

    const stream = await download.createReadStream();
    const csv = await new Promise<string>((resolve) => {
      let out = '';
      stream.on('data', (c) => { out += c; });
      stream.on('end', () => resolve(out));
    });
    // a BOM so Excel on Windows reads Thai, and a real header row
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('รหัส');
    expect(csv).toContain('JKP');
  });

  /* The menu lived inside a card with `overflow: hidden` wrapped around a
     horizontal scroller, so its lower half — "ทำสำเนา" and "ลบทรัพย์" — was
     cut off by the card edge on every row. */
  test('the row menu is not clipped by the table card', async ({ page }) => {
    await page.goto('/admin/properties');
    const rows = page.locator('tr.prop-row');
    await expect(rows.first()).toBeVisible();

    // the last row is the one the card used to cut in half
    await rows.last().locator('.prop-menu-btn').click();
    const menu = page.locator('#prop-row-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('ลบทรัพย์')).toBeInViewport();

    const box = (await menu.boundingBox())!;
    const vp = page.viewportSize()!;
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);

    // and it still belongs to the row it was opened from
    const code = await rows.last().locator('code').innerText();
    await menu.getByText('ดูรายละเอียด').click();
    await expect(page.locator('h1')).toContainText(code);
  });

  test('the checkboxes select rows and the bulk bar acts on exactly those', async ({ page }) => {
    await page.goto('/admin/properties');
    const rows = page.locator('tr.prop-row');
    await expect(rows.first()).toBeVisible();
    const n = await rows.count();

    // nothing ticked → no bulk bar at all
    await expect(page.locator('#prop-bulk')).toHaveCount(0);

    await rows.first().locator('input[type=checkbox]').check();
    await expect(page.locator('#prop-bulk')).toContainText('เลือกไว้ 1 รายการ');

    // the header box takes the whole visible list, and gives it back
    await page.locator('thead input[type=checkbox]').check();
    await expect(page.locator('#prop-bulk')).toContainText(`เลือกไว้ ${n} รายการ`);
    await page.getByRole('button', { name: 'ล้างการเลือก' }).click();
    await expect(page.locator('#prop-bulk')).toHaveCount(0);

    // Export with a selection gives the ticked rows, not the whole page
    const code = await rows.first().locator('code').innerText();
    await rows.first().locator('input[type=checkbox]').check();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export ที่เลือก' }).click(),
    ]);
    const stream = await download.createReadStream();
    const csv = await new Promise<string>((resolve) => {
      let out = '';
      stream.on('data', (c) => { out += c; });
      stream.on('end', () => resolve(out));
    });
    expect(csv.split('\n').filter(Boolean)).toHaveLength(2); // header + the one row
    expect(csv).toContain(code);
  });

  test('a bulk status change reaches the database', async ({ page, request }) => {
    const made = await request.post('/api/properties', {
      headers: { cookie },
      data: { typeKey: 'warehouse', title: 'ทรัพย์ทดสอบ bulk', values: {}, status: 'draft' },
    });
    const p = (await made.json()) as { id: string; publicCode: string };

    try {
      await page.goto(`/admin/properties?`);
      await page.getByPlaceholder('ค้นหาด้วยรหัส').fill(p.publicCode);
      const row = page.locator('tr.prop-row');
      await expect(row).toHaveCount(1);

      await row.locator('input[type=checkbox]').check();
      await page.getByRole('button', { name: 'เผยแพร่' }).click();

      // the row is what the server says it is, not what the button implied
      await expect.poll(async () => {
        const r = await request.get(`/api/properties/${p.id}`, { headers: { cookie } });
        return (await r.json()).status;
      }).toBe('active');
      // and the selection is released once the work is done
      await expect(page.locator('#prop-bulk')).toHaveCount(0);
    } finally {
      await request.delete(`/api/properties/${p.id}`, { headers: { cookie } });
    }
  });
});

test.describe('the listings screen', () => {
  /* The table fell back to nine invented listings whenever the API returned
     nothing, the status tabs read 2,956 · 2,410 · 48 · … above them, and
     every action — Publish ทั้งหมด, Unpublish, and four of the six row-menu
     items — was a dead div. */
  let cookie = '';

  test.beforeEach(async ({ page }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  });

  test('the rows and the tab counts are the org\'s own, not a demo set', async ({ page, request }) => {
    const real = (await (await request.get('/api/listings', { headers: { cookie } })).json()).items as { code: string; status: string }[];
    await page.goto('/admin/listings');
    await expect(page.getByText(`แสดง ${real.length} จาก ${real.length} ประกาศ`)).toBeVisible();

    /* The demo set is checked by title, not by code: codes are issued in the
       same JKP#### shape the generator uses, so a real record can land on one
       of the old demo codes by coincidence. */
    for (const ghost of ['ที่ดินอุตสาหกรรม วังน้อย', 'โรงงานผลิตอาหาร นวนคร', 'คลังห้องเย็น บางปะกง', 'โกดังโลจิสติกส์ ลาดกระบัง']) {
      await expect(page.getByText(ghost)).toHaveCount(0);
    }
    // and the invented totals with them
    await expect(page.getByText('2,956')).toHaveCount(0);
    await expect(page.getByText('20 ต่อหน้า')).toHaveCount(0);

    const published = real.filter((r) => r.status === 'published').length;
    await expect(page.locator('.lst-row')).toHaveCount(real.length);
    await expect(page.getByText('เผยแพร่', { exact: true }).first()).toBeVisible();
    expect(published).toBeLessThanOrEqual(real.length);
  });

  test('Unpublish ทั้งหมด reaches the database and the site', async ({ page, request }) => {
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: 'ประกาศทดสอบ bulk', values: { province: 'ระยอง', price_rent: 90000, photos: ['/api/media/demo/raw'] } },
    })).json();
    await request.patch(`/api/listings/${made.publicCode}`, { headers: { cookie, 'Content-Type': 'application/json' }, data: { status: 'published' } });

    try {
      await page.goto('/admin/listings');
      await page.getByPlaceholder('ค้นหา listing code หรือชื่อ').fill(made.publicCode);
      const row = page.locator('.lst-row');
      await expect(row).toHaveCount(1);

      await row.locator('td').first().click();          // the row checkbox
      await page.locator('#lst-bulk-unpublish').click();

      await expect.poll(async () => {
        const r = await request.get(`/api/properties/${made.id}`, { headers: { cookie } });
        return (await r.json()).status;
      }).toBe('hidden');
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } });
    }
  });

  /* Publishing is gated on a photo. A batch must not fail silently — the
     listing that was refused has to be named, with the reason. */
  test('a bulk publish that the gate refuses says which listing and why', async ({ page, request }) => {
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: 'ประกาศทดสอบ ไม่มีรูป', values: { province: 'ระยอง' } },
    })).json();

    try {
      await page.goto('/admin/listings');
      await page.getByPlaceholder('ค้นหา listing code หรือชื่อ').fill(made.publicCode);
      await expect(page.locator('.lst-row')).toHaveCount(1);

      const said = new Promise<string>((resolve) => page.once('dialog', (d) => { resolve(d.message()); void d.accept(); }));
      await page.locator('.lst-row td').first().click();
      await page.locator('#lst-bulk-publish').click();

      const message = await said;
      expect(message).toContain(made.publicCode);
      expect(message).toContain('รูป');   // the gate's own words, not "ไม่สำเร็จ"

      // and nothing was published behind the message
      const after = await (await request.get(`/api/properties/${made.id}`, { headers: { cookie } })).json();
      expect(after.status).toBe('draft');
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } });
    }
  });

  test('the row menu can feature a listing, and the homepage leads with it', async ({ page, request }) => {
    const listings = (await (await request.get('/api/listings', { headers: { cookie } })).json()).items as { id: string; code: string; status: string }[];
    const target = listings.find((l) => l.status === 'published');
    test.skip(!target, 'needs a published listing');

    await page.goto('/admin/listings');
    await page.getByPlaceholder('ค้นหา listing code หรือชื่อ').fill(target!.code);
    await expect(page.locator('.lst-row')).toHaveCount(1);
    await page.locator('.lst-menu-btn').click();
    await page.getByText('ตั้งเป็นแนะนำ').click();

    try {
      await expect.poll(async () => {
        const r = await request.get(`/api/properties/${target!.id}`, { headers: { cookie } });
        return (await r.json()).values?.featured;
      }).toBe(true);

      // the star is what decides the order of the homepage strip
      const home = await (await request.get('/api/public/listings?locale=th&limit=6')).json();
      expect((home.items as { code: string }[])[0].code).toBe(target!.code);
    } finally {
      const full = await (await request.get(`/api/properties/${target!.id}`, { headers: { cookie } })).json();
      const { featured: _drop, ...rest } = full.values ?? {};
      await request.patch(`/api/properties/${target!.id}`, { headers: { cookie, 'Content-Type': 'application/json' }, data: { values: rest } });
    }
  });

  /* Same clipping as the properties table: the menu lived inside a card with
     `overflow: hidden`, so its lower half — ทำสำเนา and ลบประกาศ — was cut off. */
  test('the row menu is not clipped by the table card', async ({ page }) => {
    await page.goto('/admin/listings');
    const rows = page.locator('.lst-row');
    await expect(rows.first()).toBeVisible();

    await rows.last().locator('.lst-menu-btn').click();
    const menu = page.locator('#lst-row-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('ลบประกาศ')).toBeInViewport();

    const box = (await menu.boundingBox())!;
    const vp = page.viewportSize()!;
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);

    // and it still belongs to the row it was opened from
    const code = await rows.last().locator('code').innerText();
    await menu.getByText('ดูรายละเอียด').click();
    await expect(page.locator('h1')).toContainText(code);
  });

  test('Export writes a CSV of the rows on screen', async ({ page }) => {
    await page.goto('/admin/listings');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#lst-export').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^listings-\d{4}-\d{2}-\d{2}\.csv$/);
    const stream = await download.createReadStream();
    const csv = await new Promise<string>((resolve) => {
      let out = '';
      stream.on('data', (c) => { out += c; });
      stream.on('end', () => resolve(out));
    });
    expect(csv.charCodeAt(0)).toBe(0xfeff);   // Excel on Windows reads the Thai
    expect(csv).toContain('ชื่อประกาศ');
  });

  test('สร้างประกาศ sets the deal and price on a real property', async ({ page, request }) => {
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: 'ทรัพย์ทดสอบ create-listing', values: { province: 'ระยอง' } },
    })).json();

    try {
      await page.goto('/admin/listings');
      await page.getByRole('button', { name: 'สร้างประกาศ' }).or(page.locator('#lst-actions >> text=สร้างประกาศ')).first().click();
      await page.getByPlaceholder('ค้นด้วยรหัส JKP หรือชื่อทรัพย์').fill(made.publicCode);
      await page.locator('#lst-create-props').getByText(made.publicCode).click();
      await page.locator('#lc-rent').fill('123456');
      await page.locator('#lc-save').click();

      // it lands on the editor for the record it just changed
      await expect(page).toHaveURL(new RegExp(`/admin/property-edit\\?code=${made.publicCode}`));
      const after = await (await request.get(`/api/properties/${made.id}`, { headers: { cookie } })).json();
      expect(Number(after.values.price_rent)).toBe(123456);
      expect(String(after.values.deal_type)).toContain('เช่า');
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } });
    }
  });
});

test.describe('the social status screen', () => {
  /* Its rows were imported from the Listings page's demo array, so every
     channel tick was filed against a listing code the org does not own — and
     the ticks are stored per code, so they were unreachable afterwards. */
  test('the rows are the real listings, and a tick is stored against a real code', async ({ page, request }) => {
    await signIn(page, OWNER);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const real = (await (await request.get('/api/listings', { headers: { cookie } })).json()).items as { code: string }[];

    await page.goto('/admin/social-status');
    await expect(page.getByText(`แสดง ${real.length} จาก ${real.length} ประกาศ`)).toBeVisible();
    for (const ghost of ['ที่ดินอุตสาหกรรม วังน้อย', 'คลังห้องเย็น บางปะกง']) {
      await expect(page.getByText(ghost)).toHaveCount(0);
    }
    if (real.length) await expect(page.locator('.soc-row').first().locator('code')).toHaveText(real[0].code);
  });
});

test.describe('the lead contact chips', () => {
  /* Both were href="#": clicking the phone number on a lead did nothing. */
  test('the number dials and the address opens a mail draft, unless the contact is masked', async ({ page }) => {
    await signIn(page, OWNER);
    await page.goto('/admin/leads');
    const phone = page.locator('a', { hasText: /^0\d|^\+66/ }).first();
    const masked = await page.getByText('ดูข้อมูลติดต่อเต็ม').count();

    if (masked) {
      // nothing to dial until it is revealed — the chip must not pretend otherwise
      await expect(phone).toHaveCount(0);
    } else {
      await expect(phone).toHaveAttribute('href', /^tel:\+?\d+$/);
      // a lead that left no address has nothing to link — only check one that did
      const mail = page.locator('a', { hasText: '@' }).first();
      if (await mail.count()) await expect(mail).toHaveAttribute('href', /^mailto:.+@/);
    }
  });
});

test.describe('the client shortlist page reads in the customer\'s language', () => {
  /* The chrome was already translated, but everything around it was not: the
     "criteria" strip was five hardcoded Thai chips (the same invented brief for
     every customer), the office address was a Thai constant, the shortlist code
     read SL-208 on every link, and the units, prices, dates and type labels were
     formatted in Thai whatever ?lang= said. */
  let cookie = '';
  let cleanup: (() => Promise<unknown>)[] = [];

  test.beforeEach(async ({ page }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    cleanup = [];
  });

  test.afterEach(async () => { for (const fn of cleanup) await fn().catch(() => null); });

  const dropShortlists = async (where: { id?: string; requirementId?: string }) => {
    const { PrismaClient } = await import('@prisma/client');
    const p = new PrismaClient();
    const rows = await p.shortlist.findMany({ where, select: { id: true } });
    await p.shortlistItem.deleteMany({ where: { shortlistId: { in: rows.map((r) => r.id) } } });
    await p.shortlist.deleteMany({ where });
    await p.$disconnect();
  };

  const plainShortlist = async (request: import('@playwright/test').APIRequestContext) => {
    const props = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const code = (props.items as { publicCode: string; status: string }[]).find((p) => p.status === 'active')?.publicCode;
    const sl = await (await request.post('/api/shortlists', {
      headers: { cookie }, data: { name: `e2e-i18n-${Date.now().toString(36)}`, codes: code ? [code] : [] },
    })).json();
    /* there is no DELETE on /api/shortlists/:id — the cleanup other tests do
       through the API answers 405 and leaves the row behind */
    cleanup.push(() => dropShortlists({ id: sl.id }));
    return sl as { id: string; token: string };
  };

  test('the invented brief, address and shortlist code are gone', async ({ page, request }) => {
    const sl = await plainShortlist(request);
    await page.goto(`/client-shortlist?token=${sl.token}`);
    await expect(page.getByText('Shortlist').first()).toBeVisible();

    for (const ghost of ['เช่าโกดัง', '2,000–3,500 ตร.ม.', '฿150K–250K/ด.', 'SL-208', '99/1 ถ.บางนา-ตราด กม.19']) {
      await expect(page.getByText(ghost), `"${ghost}" is still on the page`).toHaveCount(0);
    }
    // no requirement behind this shortlist → no criteria strip at all
    await expect(page.locator('#cs-criteria')).toHaveCount(0);
  });

  test('units, prices and type labels follow ?lang=, in the cards and the table', async ({ page, request }) => {
    const sl = await plainShortlist(request);
    const payload = (await (await request.get(`/api/public/shortlists/${sl.token}`)).json());
    const first = ((payload.data ?? payload).items ?? [])[0] as { area: number | null; priceRent: number | null } | undefined;
    test.skip(!first, 'no property on the shortlist');

    await page.goto(`/client-shortlist?token=${sl.token}&lang=en`);
    const cards = page.locator('#cs-item');
    await expect(cards.first()).toBeVisible();
    /* Only the chips are checked, not the whole card: the property's own title
       is Thai data until someone translates it, and it often carries "ตร.ม."
       itself — the chips are the part this page builds. */
    const specs = cards.first().locator('[data-specs]');
    await expect(specs.getByText('โกดัง')).toHaveCount(0);   // a Thai enum key must not reach the reader
    await expect(specs.getByText('ตร.ม.')).toHaveCount(0);
    if (first!.area !== null) await expect(specs.getByText('sqm')).toBeVisible();
    if (first!.priceRent !== null) await expect(cards.first().getByText('/ month')).toBeVisible();

    // the compare table is built from the same rows and must follow too
    await page.getByText('Comparison').click();
    await expect(page.getByText('Floor area')).toBeVisible();
    await expect(page.getByText('พื้นที่ทรัพย์')).toHaveCount(0);

    // switching language re-formats what is already on screen
    await page.locator('[data-lang="zh"]').click();
    await expect(page.getByText('建筑面积')).toBeVisible();
    await expect(page).toHaveURL(/lang=zh/);      // and the link keeps the choice
  });

  test('the criteria strip is the customer\'s own requirement, translated', async ({ page, request }) => {
    const leads = await (await request.get('/api/leads', { headers: { cookie } })).json();
    const leadId = leads.items?.[0]?.id;
    test.skip(!leadId, 'no lead');

    const r = await (await request.post('/api/requirements', {
      headers: { cookie },
      data: { leadId, dealIntent: 'เช่า', typeKey: 'warehouse', areaMin: 1200, areaMax: 4800, budgetMin: 111000, needsRor4: true },
    })).json();
    cleanup.push(async () => {
      await dropShortlists({ requirementId: r.id });
      const { PrismaClient } = await import('@prisma/client');
      const p = new PrismaClient();
      await p.availabilityCheck.deleteMany({ where: { requirementId: r.id } });
      await p.requirement.deleteMany({ where: { id: r.id } });
      await p.$disconnect();
    });

    const props = await (await request.get('/api/properties', { headers: { cookie } })).json();
    const active = (props.items as { publicCode: string; status: string }[]).find((p) => p.status === 'active');
    test.skip(!active, 'no active property');
    await request.patch(`/api/requirements/${r.id}`, { headers: { cookie }, data: { action: 'confirm' } });
    await request.post(`/api/requirements/${r.id}/checks`, { headers: { cookie }, data: { code: active!.publicCode, result: 'available' } });
    const built = await (await request.post(`/api/requirements/${r.id}/shortlist`, { headers: { cookie }, data: {} })).json();
    const token = String(built.url).split('token=')[1];

    await page.goto(`/client-shortlist?token=${token}&lang=en`);
    const strip = page.locator('#cs-criteria');
    await expect(strip).toBeVisible();
    // the numbers are this customer's, and the words are English
    await expect(strip).toContainText('1,200 – 4,800 sqm');
    await expect(strip).toContainText('Ror. 4 licence needed');
    await expect(strip).toContainText('Warehouse');
    await expect(strip.getByText('ต้องการ ร.ง.4')).toHaveCount(0);

    await page.goto(`/client-shortlist?token=${token}`);
    await expect(page.locator('#cs-criteria')).toContainText('ต้องการ ร.ง.4');
  });
});

test.describe('a property reads in the visitor\'s language', () => {
  /* The "การแปลภาษา" tab existed on both the create drawer and the edit page,
     pre-filled with a translation of one particular Bangna warehouse and badged
     "ครบ" — on every property. Nothing it held was saved anywhere, and the
     public site had no per-record translation to read. */
  let cookie = '';
  let id = '';
  let code = '';

  test.beforeEach(async ({ page, request }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse',
        title: 'โกดังทดสอบการแปล 1,000 ตร.ม.',
        status: 'active',
        values: { province: 'ระยอง', price_rent: 90000, deal_type: 'เช่า', photos: ['/api/media/demo/raw'] },
      },
    })).json();
    id = made.id;
    code = made.publicCode;
  });

  test.afterEach(async ({ request }) => {
    if (id) await request.delete(`/api/properties/${id}`, { headers: { cookie } }).catch(() => null);
  });

  test('what is typed in the translation tab is what the visitor reads', async ({ page, request }) => {
    await page.goto(`/admin/property-edit?code=${code}`);
    await page.getByText('การแปลภาษา').click();

    // the invented translation is gone — the fields start empty on a new record
    await expect(page.locator('[data-trans="en:title"]')).toHaveValue('');
    await expect(page.locator('[data-trans="zh:title"]')).toHaveValue('');
    await expect(page.getByText('ยังไม่แปล').first()).toBeVisible();

    await page.locator('[data-trans="en:title"]').fill('Test warehouse, 1,000 sqm');
    await page.locator('[data-trans="en:description"]').fill('A warehouse used by the end-to-end test.');
    await page.locator('[data-trans="zh:title"]').fill('测试仓库 1,000 平方米');
    await page.getByText('บันทึก', { exact: true }).click();
    await expect(page.getByText('บันทึกแล้ว')).toBeVisible();

    // it survives a reload of the editor
    await page.reload();
    await page.getByText('การแปลภาษา').click();
    await expect(page.locator('[data-trans="en:title"]')).toHaveValue('Test warehouse, 1,000 sqm');

    /* and it reaches the public page — in the server HTML, which is the copy
       a search engine indexes */
    const en = await (await request.get(`/en/property/${code}`)).text();
    expect(en).toContain('Test warehouse, 1,000 sqm');
    expect(en).toContain('A warehouse used by the end-to-end test.');
    const zh = await (await request.get(`/zh/property/${code}`)).text();
    expect(zh).toContain('测试仓库 1,000 平方米');

    // Thai keeps the record's own title
    const th = await (await request.get(`/th/property/${code}`)).text();
    expect(th).toContain('โกดังทดสอบการแปล 1,000 ตร.ม.');
  });

  test('an untranslated property falls back to Thai instead of rendering blank', async ({ request }) => {
    const cards = await (await request.get('/api/public/listings?locale=en&limit=60')).json();
    const mine = (cards.items as { code: string; title: string }[]).find((c) => c.code === code);
    expect(mine, 'the property should be published and listed').toBeTruthy();
    expect(mine!.title).toBe('โกดังทดสอบการแปล 1,000 ตร.ม.');
  });

  test('the "แปลไม่ครบ" card and column count the real thing', async ({ page, request }) => {
    const before = (await (await request.get('/api/properties', { headers: { cookie } })).json()).summary.transIncomplete;
    expect(before, 'a property with no translation must be counted').toBeGreaterThan(0);

    await page.goto('/admin/properties');
    await page.getByPlaceholder('ค้นหาด้วยรหัส').fill(code);
    const row = page.locator('tr.prop-row');
    await expect(row).toHaveCount(1);
    await expect(row.getByTitle('ยังไม่แปล EN')).toBeVisible();

    await request.patch(`/api/properties/${id}`, {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { i18n: { en: { title: 'Test warehouse', description: '' }, zh: { title: '测试仓库', description: '' } } },
    });
    const after = (await (await request.get('/api/properties', { headers: { cookie } })).json()).summary.transIncomplete;
    expect(after).toBe(before - 1);
  });

  test('the customer\'s shortlist link shows the translated title too', async ({ request }) => {
    await request.patch(`/api/properties/${id}`, {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { i18n: { en: { title: 'Shortlisted warehouse', description: 'Sent to the customer in English.' } } },
    });
    const sl = await (await request.post('/api/shortlists', {
      headers: { cookie, 'Content-Type': 'application/json' }, data: { name: `e2e-i18n-sl-${Date.now().toString(36)}`, codes: [code] },
    })).json();

    const en = (await (await request.get(`/api/public/shortlists/${sl.token}?lang=en`)).json());
    const item = (en.data ?? en).items[0];
    expect(item.title).toBe('Shortlisted warehouse');
    expect(item.description).toBe('Sent to the customer in English.');

    const th = (await (await request.get(`/api/public/shortlists/${sl.token}`)).json());
    expect((th.data ?? th).items[0].title).toBe('โกดังทดสอบการแปล 1,000 ตร.ม.');

    const { PrismaClient } = await import('@prisma/client');
    const p = new PrismaClient();
    await p.shortlistItem.deleteMany({ where: { shortlistId: sl.id } });
    await p.shortlist.deleteMany({ where: { id: sl.id } });
    await p.$disconnect();
  });
});

test.describe('the Field Builder reaches the public page', () => {
  /* Two halves of the same defect: the detail page built its table from a
     fixed list of keys, so a field the team added never appeared on the site,
     and a field they switched off kept being printed from whatever was stored.
     A custom field also had no name — nothing on the page could rename it. */
  let cookie = '';
  let propId = '';

  test.beforeEach(async ({ page }) => {
    await signIn(page, OWNER);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  });

  test.afterEach(async ({ request }) => {
    if (propId) await request.delete(`/api/properties/${propId}`, { headers: { cookie } }).catch(() => null);
    await request.put('/api/field-schema/warehouse', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { disabled: [], order: [], extra: [] },
    }).catch(() => null);
  });

  test('a field added and named in the builder shows up on the property page', async ({ page, request }) => {
    await page.goto('/admin/field-builder');
    // the schema is per type — switch the page to warehouse first
    await page.locator('#fb-actions').getByText(/^ฟิลด์ของ:/).click();
    await page.getByText('ฟิลด์ของ โกดัง / คลังสินค้า').click();
    await expect(page.locator('#fb-actions')).toContainText('โกดัง / คลังสินค้า');

    await page.locator('.fb-type').filter({ hasText: 'ตัวเลข' }).first().click();   // add a number field
    const editor = page.locator('[data-editor]').first();
    await expect(editor, 'a new field must open its editor — it had no name before').toBeVisible();

    await editor.locator('[data-edit-label]').fill('ค่าไฟเฉลี่ย/เดือน');
    await editor.locator('[data-edit-en]').fill('Average electricity / month');
    await editor.locator('[data-edit-zh]').fill('每月平均电费');
    await page.locator('#fb-save').click();
    await expect(page.getByText(/บันทึกฟิลด์ของ/)).toBeVisible();

    // the server issues the key; read it back and store a value against it
    const schema = await (await request.get('/api/field-schema', { headers: { cookie } })).json();
    const key = (schema.warehouse.extra as { key: string }[]).at(-1)!.key;
    expect(key).toMatch(/^custom_warehouse_number_\d+$/);

    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse', title: 'ทดสอบฟิลด์ที่เพิ่มเอง', status: 'active',
        values: { province: 'ระยอง', deal_type: 'เช่า', price_rent: 1000, [key]: 4200, photos: ['/api/media/demo/raw'] },
      },
    })).json();
    propId = made.id;

    for (const [locale, label] of [['th', 'ค่าไฟเฉลี่ย/เดือน'], ['en', 'Average electricity / month'], ['zh', '每月平均电费']] as const) {
      const html = await (await request.get(`/${locale}/property/${made.publicCode}`)).text();
      expect(html, `the custom field is missing on /${locale}`).toContain(label);
      expect(html).toContain('4,200');
    }
  });

  test('a field switched off leaves the website, not just the admin form', async ({ page, request }) => {
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse', title: 'ทดสอบปิดฟิลด์', status: 'active',
        values: { province: 'ระยอง', deal_type: 'เช่า', price_rent: 1000, parking: '20 คัน', photos: ['/api/media/demo/raw'] },
      },
    })).json();
    propId = made.id;

    // it is on the page to begin with
    expect(await (await request.get(`/th/property/${made.publicCode}`)).text()).toContain('20 คัน');

    await request.put('/api/field-schema/warehouse', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { disabled: ['parking'], order: [], extra: [] },
    });

    const html = await (await request.get(`/th/property/${made.publicCode}`)).text();
    expect(html, 'a field switched off must not stay on the website').not.toContain('20 คัน');
    expect(html).toContain(made.publicCode);   // the rest of the page is intact

    // and it is gone from the JSON too — hidden has to mean hidden
    const api = await (await request.get(`/api/public/properties/${made.publicCode}`)).json();
    expect('parking' in api.values).toBeFalsy();

    await page.goto(`/admin/property-view?code=${made.publicCode}`);
    await expect(page.getByText('20 คัน')).toHaveCount(0);
  });
});
