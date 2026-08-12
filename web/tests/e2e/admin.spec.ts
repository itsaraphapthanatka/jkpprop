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
