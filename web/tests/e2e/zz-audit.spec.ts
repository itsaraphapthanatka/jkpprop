import { test } from '@playwright/test';
const B = 'https://jkppropertyagency.com';
test.use({ storageState: { cookies: [], origins: [] } });

test('interactions', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(B + '/th/property/JKP-CBI0007');
  await page.locator('#consent-accept').click().catch(() => {});
  await page.waitForTimeout(1200);

  // 1. หัวใจ ข้างวันที่อัปเดต
  const fav = page.locator('[data-fav]').first();
  const before = await page.evaluate(() => localStorage.getItem('jkp.favourites.v1'));
  await fav.click().catch((e) => console.log('หัวใจกดไม่ได้:', String(e).slice(0, 60)));
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => localStorage.getItem('jkp.favourites.v1'));
  console.log('1) หัวใจบนหัวเรื่อง:', before !== after ? 'ทำงาน → ' + after : 'ไม่มีผล (' + String(before) + ')');

  // 2. ปุ่มแชร์
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const share = page.locator('svg').locator('..').filter({ hasText: '' });
  const shareBtn = page.locator('[data-share], button:has(svg)').last();
  console.log('2) ปุ่มแชร์: มี', await page.locator('[data-share]').count(), 'ตัวที่ติดป้าย data-share');

  // 3. Line / WeChat / WhatsApp
  for (const name of ['Line', 'WeChat', 'WhatsApp']) {
    const el = page.getByText(name, { exact: true }).first();
    const href = await el.evaluate((e) => (e.closest('a') as HTMLAnchorElement)?.getAttribute('href') ?? '(ไม่ใช่ลิงก์)').catch(() => '(หาไม่เจอ)');
    console.log(`3) ${name}: href = ${href}`);
  }

  // 4. ฟอร์มส่งคำถาม — ตรวจว่ามีการตรวจสอบข้อมูล โดยไม่ส่งจริง
  await page.getByRole('button', { name: /ส่งคำถาม/ }).click();
  await page.waitForTimeout(900);
  const err = await page.locator('body').innerText();
  const complained = /กรอก|จำเป็น|required|กรุณา/i.test(err);
  console.log('4) กดส่งฟอร์มเปล่า:', complained ? 'มีการเตือนให้กรอกข้อมูล' : 'ไม่เตือนอะไรเลย');

  // 5. breadcrumb
  const crumb = page.getByRole('link', { name: 'อสังหาริมทรัพย์ทั้งหมด' });
  console.log('5) breadcrumb "อสังหาริมทรัพย์ทั้งหมด": href =', await crumb.getAttribute('href'));

  // 6. ลิงก์ Google Maps
  console.log('6) เปิดใน Google Maps: href =', (await page.getByRole('link', { name: /Google Maps/ }).getAttribute('href'))?.slice(0, 60));
});
