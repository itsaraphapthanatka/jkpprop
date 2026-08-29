/* ตั้งรหัสผ่านใหม่ทางอีเมล
 *
 * 29 ส.ค. 2569 · คุณกิตติพงษ์แจ้งว่าให้สิทธิ์ทีม Marketing แล้วแต่ไม่มีเมลส่งไป
 * ตรวจแล้วพบว่าทั้งโปรเจกต์ไม่มีการส่งอีเมลเลยสักที่:
 *   · เชิญเข้าระบบ → โชว์รหัสชั่วคราวใน alert ครั้งเดียว ปิดแล้วหายถาวร
 *     และไม่มีคำสั่งออกใหม่ให้เจ้าของระบบเลย
 *   · หน้า "ลืมรหัสผ่าน" → รอครึ่งวินาทีแล้วขึ้นว่า "ส่งลิงก์ไปแล้ว" โดยไม่เคย
 *     ยิงไปที่เซิร์ฟเวอร์ และไม่มี API อยู่จริง
 */
import { test, expect } from './fixtures';
import { createHash, randomBytes } from 'crypto';

const OWNER = { email: 'owner@jkp.local', password: 'jkp12345' };

/* ออกโทเคนตรงเข้าฐานข้อมูล — เทสต์นี้ตรวจ "ลิงก์ใช้ได้จริงไหม" ไม่ใช่ "เมลออก
   ไหม" ซึ่งต้องมี SMTP จริงจึงจะทดสอบได้ */
async function issue(userEmail: string, ttlMs = 3600_000) {
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  try {
    const u = await db.user.findUnique({ where: { email: userEmail } });
    if (!u) return null;
    const token = randomBytes(32).toString('base64url');
    await db.passwordReset.deleteMany({ where: { userId: u.id } });
    await db.passwordReset.create({
      data: { tokenHash: createHash('sha256').update(token).digest('hex'), userId: u.id, kind: 'reset', expiresAt: new Date(Date.now() + ttlMs) },
    });
    return token;
  } finally { await db.$disconnect(); }
}

async function restorePassword(email: string) {
  const { PrismaClient } = await import('@prisma/client');
  const bcrypt = (await import('bcryptjs')).default;
  const db = new PrismaClient();
  try {
    await db.user.update({ where: { email }, data: { passwordHash: await bcrypt.hash(OWNER.password, 10), mustChangePassword: false } });
    await db.passwordReset.deleteMany({});
  } finally { await db.$disconnect(); }
}

test.describe('ลืมรหัสผ่าน · ตั้งรหัสใหม่ทางลิงก์', () => {
  test('หน้าลืมรหัสผ่านยิงไปที่เซิร์ฟเวอร์จริง ไม่ใช่ฉากเปล่า', async ({ page }) => {
    /* เดิมหน้านี้ไม่เคยยิงไปไหนเลย — ดักคำขอไว้ ถ้าไม่มีคือกลับไปเป็นฉากเดิม */
    const calls: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/api/auth/forgot')) calls.push(r.method()); });

    await page.goto('/admin/forgot-password');
    await page.locator('#fp-email').fill(OWNER.email);
    await page.getByRole('button', { name: /ส่งลิงก์/ }).click();

    await expect.poll(() => calls.length, { message: 'หน้าลืมรหัสผ่านไม่ได้ยิงไปที่เซิร์ฟเวอร์เลย' }).toBeGreaterThan(0);
    expect(calls[0]).toBe('POST');
  });

  test('ตอบเหมือนกันไม่ว่าอีเมลนั้นจะมีบัญชีหรือไม่', async ({ request }) => {
    /* ไม่งั้นหน้านี้กลายเป็นเครื่องมือไล่เดาว่าอีเมลไหนมีบัญชีในระบบ */
    const call = async (email: string) => {
      const r = await request.post('/api/auth/forgot', { headers: { 'Content-Type': 'application/json' }, data: { email } });
      expect(r.status()).toBe(200);
      return JSON.stringify(await r.json());
    };
    expect(await call(OWNER.email)).toBe(await call(`ไม่มีจริง-${Date.now()}@nowhere.test`));
  });

  test('ลิงก์ตั้งรหัสใหม่ใช้ได้จริง ใช้ได้ครั้งเดียว และเข้าระบบด้วยรหัสใหม่ได้', async ({ page, request }) => {
    const token = await issue(OWNER.email);
    test.skip(!token, 'ไม่พบบัญชีเจ้าของระบบ');
    const NEW = `NewPass!${Date.now().toString(36)}`;

    try {
      await page.goto(`/admin/reset-password?token=${encodeURIComponent(token!)}`);
      await page.locator('#rp-pw').fill(NEW);
      await page.locator('#rp-pw2').fill(NEW);
      await page.getByRole('button', { name: /บันทึกรหัสผ่านใหม่/ }).click();
      await expect(page.locator('[data-rp-done]')).toBeVisible({ timeout: 15000 });

      /* ใช้ซ้ำไม่ได้ — ลิงก์ที่ค้างอยู่ในกล่องจดหมายต้องเปิดบัญชีไม่ได้อีก */
      const again = await request.post('/api/auth/reset', {
        headers: { 'Content-Type': 'application/json' }, data: { token, password: `${NEW}x` },
      });
      expect(again.status(), 'โทเคนที่ใช้ไปแล้วยังใช้ได้อยู่').toBe(400);

      const login = await request.post('/api/auth/login', {
        headers: { 'Content-Type': 'application/json' }, data: { email: OWNER.email, password: NEW },
      });
      expect(login.status(), 'ตั้งรหัสใหม่แล้วเข้าระบบไม่ได้').toBe(200);
    } finally {
      await restorePassword(OWNER.email);
    }
  });

  test('ลิงก์ที่หมดอายุแล้วใช้ไม่ได้', async ({ request }) => {
    const token = await issue(OWNER.email, -1000);
    test.skip(!token, 'ไม่พบบัญชีเจ้าของระบบ');
    try {
      const r = await request.post('/api/auth/reset', {
        headers: { 'Content-Type': 'application/json' }, data: { token, password: 'WhateverPass123' },
      });
      expect(r.status(), 'ลิงก์ที่หมดอายุแล้วยังตั้งรหัสได้').toBe(400);
    } finally {
      await restorePassword(OWNER.email);
    }
  });

  test('เปิดหน้าตั้งรหัสโดยไม่มีลิงก์ ต้องบอกว่าลิงก์ไม่ถูกต้อง', async ({ page }) => {
    await page.goto('/admin/reset-password');
    await expect(page.getByText('ลิงก์ไม่ถูกต้อง')).toBeVisible();
  });
});
