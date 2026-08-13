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
