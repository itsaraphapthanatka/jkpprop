/* ตั้งค่าเซิร์ฟเวอร์อีเมลจากหน้า Settings
 *
 * ค่าพวกนี้เคยอยู่ในไฟล์ตั้งค่าของเครื่องเซิร์ฟเวอร์ ทีมที่ดูแลเว็บเข้าไปแก้เอง
 * ไม่ได้ ต้องรอทีมพัฒนาทุกครั้งที่เปลี่ยนผู้ให้บริการหรือรหัสหมดอายุ
 */
import { test, expect } from './fixtures';

const OWNER = { email: 'owner@jkp.local', password: 'jkp12345' };

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.locator('#login-email').fill(OWNER.email);
  await page.locator('#login-password').fill(OWNER.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
  return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
}

async function clearSettings() {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  try { await db.mailSetting.deleteMany({}); } finally { await db.$disconnect(); }
}

test.describe('Settings · ตั้งค่าอีเมลเอง', () => {
  test.afterEach(clearSettings);

  test('บันทึกค่าได้ และรหัสผ่านไม่เคยถูกส่งกลับออกมา', async ({ page, request }) => {
    const cookie = await signIn(page);
    const h = { cookie, 'Content-Type': 'application/json' };

    const saved = await request.put('/api/mail-settings', {
      headers: h,
      data: { host: 'smtp.example.test', port: 587, username: 'u1', password: 'ความลับ-123', fromEmail: 'noreply@example.test', fromName: 'JKP' },
    });
    expect(saved.status(), await saved.text()).toBe(200);

    const back = await (await request.get('/api/mail-settings', { headers: { cookie } })).text();
    expect(back, 'รหัสผ่านหลุดออกมาทาง API').not.toContain('ความลับ-123');
    const j = JSON.parse(back).data ?? JSON.parse(back);
    expect(j.hasPassword, 'หน้าจอต้องรู้ว่าตั้งรหัสไว้แล้ว').toBe(true);
    expect(j.host).toBe('smtp.example.test');
  });

  test('เว้นช่องรหัสผ่านว่างตอนบันทึก = ใช้รหัสเดิมต่อ', async ({ page, request }) => {
    const cookie = await signIn(page);
    const h = { cookie, 'Content-Type': 'application/json' };

    await request.put('/api/mail-settings', {
      headers: h, data: { host: 'smtp.example.test', port: 587, username: 'u1', password: 'เก็บไว้นะ', fromEmail: 'noreply@example.test' },
    });
    /* แก้แค่พอร์ต — ถ้าตีความว่าลบรหัส การส่งอีเมลจะพังทันทีโดยไม่มีใครรู้ */
    const again = await request.put('/api/mail-settings', {
      headers: h, data: { host: 'smtp.example.test', port: 2525, username: 'u1', password: '', fromEmail: 'noreply@example.test' },
    });
    expect(again.status()).toBe(200);
    expect((await again.json()).data?.hasPassword ?? (await again.json()).hasPassword, 'รหัสเดิมหายไปหลังบันทึกครั้งที่สอง').toBe(true);
  });

  test('ตั้งค่าแล้ว หน้าลืมรหัสผ่านต้องรู้ว่าส่งอีเมลได้', async ({ page, request }) => {
    const cookie = await signIn(page);
    const before = await (await request.post('/api/auth/forgot', { headers: { 'Content-Type': 'application/json' }, data: { email: OWNER.email } })).json();
    expect((before.data ?? before).mailConfigured).toBe(false);

    await request.put('/api/mail-settings', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { host: 'smtp.example.test', port: 587, username: 'u', password: 'p', fromEmail: 'noreply@example.test' },
    });

    const after = await (await request.post('/api/auth/forgot', { headers: { 'Content-Type': 'application/json' }, data: { email: OWNER.email } })).json();
    expect((after.data ?? after).mailConfigured, 'ตั้งค่าแล้วแต่ระบบยังคิดว่าส่งไม่ได้').toBe(true);
  });

  test('หน้าจอกรอกได้ครบ และปุ่มผู้ให้บริการเติมค่าให้', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/mail');
    await expect(page.locator('#ms-host')).toBeVisible();
    await page.locator('[data-mail-preset="resend"]').click();
    await expect(page.locator('#ms-host')).toHaveValue('smtp.resend.com');
    await expect(page.locator('#ms-port')).toHaveValue('587');
  });

  test('คนที่ไม่ใช่เจ้าของระบบเข้าไม่ถึงค่าเหล่านี้', async ({ request }) => {
    /* ไม่ได้ล็อกอินเลย — ต้องไม่ได้ค่าอะไรกลับไป */
    const r = await request.get('/api/mail-settings');
    expect([401, 403]).toContain(r.status());
  });
});
