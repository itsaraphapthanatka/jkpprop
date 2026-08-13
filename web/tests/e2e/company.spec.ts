import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/* The company's own contact details lived in three places — the dictionary,
   a component, and one page's props — and had drifted: About and FAQ served
   info@thaiindustrialproperty.com, a domain the company does not own, and
   +66 90-000-0000, which does not ring. One record now feeds every page. */

const OWNER = { email: 'owner@jkp.local', password: 'jkp12345' };
const PAGES = ['/th', '/th/about', '/th/faq', '/th/contact', '/th/listing', '/th/factory-rent'];

async function signIn(page: Page) {
  await page.goto('/admin/login');
  await page.locator('#login-email').fill(OWNER.email);
  await page.locator('#login-password').fill(OWNER.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
}

test.afterEach(async () => {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  await db.companyProfile.deleteMany();
  await db.$disconnect();
});

test('no page serves the placeholder mailbox or the dead phone number', async ({ request }) => {
  for (const p of PAGES) {
    const html = await (await request.get(p)).text();
    expect(html, `${p} still shows the wrong mailbox`).not.toContain('info@thaiindustrialproperty.com');
    expect(html, `${p} still shows the placeholder number`).not.toContain('+66 90-000-0000');
  }
});

test('every footer shows the same mailbox', async ({ page }) => {
  /* The contact page also lists the sales mailbox, which is deliberate — so
     this compares the footer, the one place all six pages share. */
  const seen = new Set<string>();
  for (const p of PAGES) {
    await page.goto(p);
    const footer = page.locator('footer').last();
    const text = await footer.innerText();
    const email = /([a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,})/i.exec(text)?.[1];
    expect(email, `${p} has no mailbox in its footer`).toBeTruthy();
    seen.add(email!);
  }
  expect([...seen], 'footers disagree about the company mailbox').toHaveLength(1);
});

test('an edit in the admin reaches every page at once', async ({ page, request }) => {
  await signIn(page);
  await page.goto('/admin/company');

  await page.locator('#c-general').fill('hello@jkp.example');
  await page.locator('#c-legal').fill('บริษัท ทดสอบ จำกัด');
  await page.getByText('บันทึก', { exact: true }).click();
  await expect(page.getByText('บันทึกแล้ว')).toBeVisible();

  /* Poll rather than assert once: the save returns before every page's cached
     render has been dropped, and a single read occasionally landed on the
     previous one. What matters is that the edit arrives, not that it has
     already arrived by the time the button stops spinning. */
  for (const p of ['/th', '/th/about', '/th/faq', '/th/contact']) {
    await expect
      .poll(async () => (await request.get(p)).text(), { message: `${p} did not pick up the new mailbox`, timeout: 10_000 })
      .toContain('hello@jkp.example');
  }
  await expect
    .poll(async () => (await request.get('/th/contact')).text(), { message: '/th/contact did not pick up the new name' })
    .toContain('บริษัท ทดสอบ จำกัด');
});

test('the settings page links to it, so it is not another orphaned screen', async ({ page }) => {
  await signIn(page);
  await page.goto('/admin/settings');
  await expect(page.locator('a[href="/admin/company"]').first()).toBeVisible();
});

test.describe('links that go somewhere', () => {
  /* The site shipped with eighteen href="#" links: the social icons on the
     contact page and in both footers, the header's own "ติดต่อทีมงาน" button,
     the CTA band's call button, the cookie banner's PDPA link, and the footer
     entries for privacy and terms. Each looked like a way to reach the
     company. */
  const ALL = ['/th', '/th/about', '/th/faq', '/th/contact', '/th/listing', '/th/factory-rent'];

  test('no page contains a link to nowhere', async ({ request }) => {
    for (const p of ALL) {
      const html = await (await request.get(p)).text();
      const dead = html.match(/href="#"/g)?.length ?? 0;
      expect(dead, `${p} has ${dead} link(s) pointing at "#"`).toBe(0);
    }
  });

  test('the contact CTA keeps the visitor in their language', async ({ request }) => {
    for (const locale of ['th', 'en', 'zh']) {
      const html = await (await request.get(`/${locale}`)).text();
      expect(html, `${locale} CTA lost the locale prefix`).toContain(`href="/${locale}/contact"`);
    }
  });

  test('a social icon appears only once its link is set', async ({ page, request }) => {
    await page.goto('/th/contact');
    await expect(page.locator('a[aria-label="LINE"]')).toHaveCount(0);

    await signIn(page);
    await page.goto('/admin/company');
    await page.locator('#c-lineUrl').fill('https://line.me/R/ti/p/@jkptest');
    await page.getByText('บันทึก', { exact: true }).click();
    await expect(page.getByText('บันทึกแล้ว')).toBeVisible();

    for (const p of ['/th/contact', '/th', '/th/about']) {
      const html = await (await request.get(p)).text();
      expect(html, `${p} is missing the LINE icon`).toContain('aria-label="LINE"');
      expect(html).toContain('https://line.me/R/ti/p/@jkptest');
    }
  });

  test('a non-https social link is refused rather than rendered', async ({ page, request }) => {
    await signIn(page);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await request.put('/api/company', {
      headers: { cookie },
      data: { lineUrl: 'javascript:alert(1)' },
    });
    expect(res.status()).toBe(400);
    expect(await (await request.get('/th/contact')).text()).not.toContain('javascript:alert');
  });
});
