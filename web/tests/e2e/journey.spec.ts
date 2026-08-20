import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/* Journeys that cross the whole system. These are the ones worth having:
   each spans the public site, the API, the database and the admin app, so a
   break anywhere along the chain shows up here. */

const OWNER = { email: 'owner@jkp.local', password: 'jkp12345' };

async function signIn(page: Page) {
  await page.goto('/admin/login');
  await page.locator('#login-email').fill(OWNER.email);
  await page.locator('#login-password').fill(OWNER.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
}

test('a requirement submitted on the website reaches the Leads workspace', async ({ page }) => {
  const company = `บ. ทดสอบวงจร ${Date.now()}`;

  // --- a visitor fills in the public requirement form ---
  await page.goto('/th/contact');
  await page.getByPlaceholder('กรอกชื่อของคุณ').fill('คุณทดสอบ ผ่านเบราว์เซอร์');
  await page.getByPlaceholder('08x-xxx-xxxx').fill('081-222-3333');
  await page.getByPlaceholder('เช่น บ. ไทยโลจิสติกส์').fill(company);

  // these three are required and are chip buttons, not selects (§8)
  await page.getByRole('button', { name: 'ลูกค้า', exact: true }).click();
  await page.getByRole('button', { name: 'โกดัง / คลังสินค้า' }).click();
  await page.getByRole('button', { name: 'เช่า', exact: true }).click();

  await page.getByRole('button', { name: 'ส่งความต้องการ' }).click();
  await expect(page.getByText('ส่งความต้องการแล้ว')).toBeVisible();

  // --- the same submission is visible to the sales team ---
  await signIn(page);
  await page.goto('/admin/leads');
  await expect(page.locator('body')).toContainText(company);
});

test('the form refuses to submit without the mandatory phone number', async ({ page }) => {
  await page.goto('/th/contact');
  await page.getByPlaceholder('กรอกชื่อของคุณ').fill('ไม่ใส่เบอร์');
  await page.getByRole('button', { name: 'ลูกค้า', exact: true }).click();
  await page.getByRole('button', { name: 'ส่งความต้องการ' }).click();
  await expect(page.getByText('กรุณากรอกเบอร์โทรศัพท์')).toBeVisible();
  await expect(page.getByText('ส่งความต้องการแล้ว')).toHaveCount(0);
});

test('an admin publishes a property and it appears on the public site', async ({ page, request }) => {
  await signIn(page);
  const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  const headers = { cookie, 'Content-Type': 'application/json' };

  // a property with no photo must be refused — the publish gate
  const created = await (await request.post('/api/properties', {
    headers,
    data: { typeKey: 'warehouse', title: `ทดสอบเผยแพร่ ${Date.now()}`, values: { province: 'ระยอง', price_rent: 123456 } },
  })).json();

  const blocked = await request.patch(`/api/listings/${created.publicCode}`, { headers, data: { status: 'published' } });
  expect((await blocked.json()).error.code).toBe('PUBLISH_GATE');

  // add a photo, then publishing succeeds
  await request.patch(`/api/properties/${created.id}`, {
    headers,
    data: { values: { province: 'ระยอง', price_rent: 123456, photos: ['/api/media/demo/raw'] } },
  });
  const published = await request.patch(`/api/listings/${created.publicCode}`, { headers, data: { status: 'published' } });
  expect(published.status()).toBe(200);

  // and a visitor can now open it
  await page.goto(`/th/property/${created.publicCode}`);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByText(created.publicCode).first()).toBeVisible();

  await request.delete(`/api/properties/${created.id}`, { headers });
});

test('a shortlist sent to a client opens without logging in', async ({ page, request }) => {
  await signIn(page);
  const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  const headers = { cookie, 'Content-Type': 'application/json' };

  // create the inventory this test needs instead of assuming another test
  // left some behind — ambient data made this skip at random
  const prop = await (await request.post('/api/properties', {
    headers,
    data: {
      typeKey: 'warehouse',
      title: `ทดสอบ shortlist ${Date.now()}`,
      status: 'active',
      values: { province: 'ชลบุรี', price_rent: 99000, photos: ['/api/media/demo/raw'] },
    },
  })).json();

  const shortlist = await (await request.post('/api/shortlists', {
    headers,
    data: { name: `ทดสอบส่งลูกค้า ${Date.now()}`, codes: [prop.publicCode] },
  })).json();

  // the client view uses only the token — no session at all
  const anon = await page.context().browser()!.newContext();
  const clientPage = await anon.newPage();
  await clientPage.goto(`/client-shortlist?token=${shortlist.token}`);
  await expect(clientPage.getByText('ลิงก์ส่วนตัว · ไม่ต้องเข้าสู่ระบบ')).toBeVisible();
  await expect(clientPage.locator('body')).toContainText(prop.publicCode);
  await anon.close();

  await request.delete(`/api/properties/${prop.id}`, { headers });
});

test('an uploaded photo is watermarked before the public ever sees it', async ({ page, request }) => {
  await signIn(page);
  const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFUlEQVR42mNk+M9QzwAFjDAGACwLA/8AAAAASUVORK5CYII=',
    'base64',
  );
  const uploaded = await (await request.post('/api/media', {
    headers: { cookie },
    multipart: {
      file: { name: 'e2e.png', mimeType: 'image/png', buffer: png },
      watermarkType: 'corner',
    },
  })).json();

  const shown = await (await request.get(uploaded.src)).body();
  expect(shown.equals(png), 'the public file must not be the original').toBe(false);

  // the original needs a session; without one it is refused
  const anon = await page.context().browser()!.newContext();
  const res = await anon.request.get(`/api/media/${uploaded.id}/raw?original=1`);
  expect(res.status()).toBe(401);
  await anon.close();

  await request.delete(`/api/media/${uploaded.id}`, { headers: { cookie } });
});
