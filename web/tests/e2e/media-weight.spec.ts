import { test, expect, type Page } from '@playwright/test';

/* /admin/media took twenty-six seconds. It rendered every asset at once and
   pointed each 150px grid box at the full-size original: 412 images, 114 MB
   over the wire, on a page whose whole job is to show small squares.
   These tests measure the page rather than describing it. */

const OWNER = { email: 'owner@jkp.local', password: 'jkp12345' };
async function signIn(page: Page) {
  await page.goto('/admin/login');
  await page.locator('#login-email').fill(OWNER.email);
  await page.locator('#login-password').fill(OWNER.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
}

test.describe('น้ำหนักของหน้าคลังสื่อ', () => {
  test('รูปในตารางเป็นภาพย่อ ไม่ใช่ไฟล์เต็ม', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/media');
    const first = page.locator('img[src*="/api/media/"]').first();
    await expect(first).toBeVisible();

    const srcs = await page.locator('img[src*="/api/media/"]')
      .evaluateAll((es) => es.map((e) => (e as HTMLImageElement).getAttribute('src') ?? ''));
    const full = srcs.filter((s) => !s.includes('w='));
    expect(full, 'ทุกรูปในตารางต้องขอขนาดย่อ').toEqual([]);

    // และต้องโหลดแบบ lazy ไม่ใช่ดึงทุกใบพร้อมกันตั้งแต่เปิดหน้า
    const eager = await page.locator('img[src*="/api/media/"]:not([loading="lazy"])').count();
    expect(eager, 'รูปที่ไม่ได้ตั้ง lazy').toBe(0);
  });

  test('ภาพย่อเล็กกว่าไฟล์เต็มอย่างมีนัยสำคัญ', async ({ page, request }) => {
    await signIn(page);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const media = await (await request.get('/api/media', { headers: { cookie } })).json();
    const photo = (media.items as { src: string; mime: string }[]).find((m) => m.mime === 'image/jpeg');
    test.skip(!photo, 'คลังสื่อยังไม่มีรูป');

    const full = (await (await request.get(photo!.src)).body()).length;
    const small = (await (await request.get(`${photo!.src}?w=320`)).body()).length;
    expect(small, `ย่อแล้ว ${small} ไบต์ ต้องเล็กกว่าเต็ม ${full} ไบต์ อย่างน้อยครึ่งหนึ่ง`).toBeLessThan(full / 2);
    expect(small).toBeGreaterThan(0);
  });

  test('ขนาดที่ไม่อยู่ในรายการ ไม่สร้างไฟล์ใหม่ตามใจผู้เรียก', async ({ page, request }) => {
    await signIn(page);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const media = await (await request.get('/api/media', { headers: { cookie } })).json();
    const photo = (media.items as { src: string; mime: string }[]).find((m) => m.mime === 'image/jpeg');
    test.skip(!photo, 'คลังสื่อยังไม่มีรูป');

    /* ถ้ารับทุกความกว้าง ใครก็ยิง ?w=1..2000 ให้เซิร์ฟเวอร์ย่อรูปจนดิสก์เต็มได้ */
    const odd = await request.get(`${photo!.src}?w=333`);
    const full = await request.get(photo!.src);
    expect((await odd.body()).length, 'ความกว้างนอกรายการต้องได้ไฟล์เต็มไปตามเดิม').toBe((await full.body()).length);
  });

  test('รวมทั้งหน้าแล้วต้องไม่หนักเป็นสิบเมกะไบต์', async ({ page }) => {
    test.slow();
    await signIn(page);
    let bytes = 0;
    page.on('response', (r) => {
      if (!r.url().includes('/api/media/')) return;
      bytes += Number(r.headers()['content-length'] ?? 0);
    });
    await page.goto('/admin/media', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    const mb = bytes / 1048576;
    console.log(`คลังสื่อโหลดรูปรวม ${mb.toFixed(1)} MB`);
    expect(mb, `หน้านี้ดึงรูปรวม ${mb.toFixed(1)} MB`).toBeLessThan(8);
  });
});
