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

/* The grid drew every asset in the library, so the page got heavier with each
   upload and the search filtered a list the browser had already paid for. */
test.describe('คลังสื่อแบ่งหน้า', () => {
  test('เปิดมาแล้วเห็นทีละหน้า ไม่ใช่ทั้งคลัง', async ({ page, request }) => {
    await signIn(page);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const all = await (await request.get('/api/media?limit=200', { headers: { cookie } })).json();
    test.skip((all.total ?? 0) < 2, 'คลังสื่อยังมีไฟล์น้อยเกินกว่าจะแบ่งหน้า');

    await page.goto('/admin/media');
    await expect(page.locator('img[src*="/api/media/"], [data-media-card]').first()).toBeVisible();
    const cards = await page.locator('img[src*="/api/media/"]').count();
    expect(cards, `หน้าเดียวไม่ควรวาดครบทั้ง ${all.total} ไฟล์`).toBeLessThanOrEqual(60);

    // ตัวเลขพื้นที่ใช้งานยังนับทั้งคลัง ไม่ใช่แค่หน้านี้
    await expect(page.locator('#media-layout')).toContainText(`${all.totalFiles} ไฟล์`);
  });

  test('กดถัดไปแล้วได้ไฟล์คนละชุด', async ({ page, request }) => {
    await signIn(page);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const all = await (await request.get('/api/media?limit=200', { headers: { cookie } })).json();
    test.skip((all.total ?? 0) <= 60, `มี ${all.total} ไฟล์ ยังไม่ถึงสองหน้า`);

    /* สองหน้าต้องไม่ซ้ำกัน — อ่านจาก API ในจังหวะเดียวกัน เพราะถ้าเทียบจากหน้าจอ
       สองครั้งคนละเวลา เทสต์ตัวอื่นที่อัปโหลดไฟล์คั่นกลางจะดันของจากหน้า 1 ไป
       หน้า 2 แล้วกลายเป็น "ซ้ำ" ทั้งที่การแบ่งหน้าถูกต้อง */
    const [p1, p2] = await Promise.all([
      (await request.get('/api/media?page=1&limit=60', { headers: { cookie } })).json(),
      (await request.get('/api/media?page=2&limit=60', { headers: { cookie } })).json(),
    ]);
    const ids1 = (p1.items as { id: string }[]).map((m) => m.id);
    const ids2 = (p2.items as { id: string }[]).map((m) => m.id);
    expect(ids2.some((id) => ids1.includes(id)), 'หน้า 2 ต้องไม่ซ้ำหน้า 1').toBe(false);
    expect(ids1.length).toBe(60);

    // และปุ่มบนหน้าจอต้องพาไปหน้า 2 จริง ๆ ไม่ใช่แค่เลขเปลี่ยน
    await page.goto('/admin/media');
    const firstName = await page.locator('[data-media-name]').first().innerText();
    await page.locator('[data-media-next]').click();
    await expect(page.locator('#media-pager')).toContainText('2 /');
    await expect(page.locator('[data-media-name]').first()).not.toHaveText(firstName);
  });

  test('ค้นหาถามเซิร์ฟเวอร์ ไม่ใช่กรองรายการที่โหลดมาแล้ว', async ({ page, request }) => {
    await signIn(page);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const all = await (await request.get('/api/media?limit=200', { headers: { cookie } })).json();
    const sample = (all.items as { name: string }[])[0];
    test.skip(!sample, 'คลังสื่อยังไม่มีไฟล์');
    const needle = sample.name.slice(0, 6);

    const asked: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/api/media?')) asked.push(r.url()); });
    await page.goto('/admin/media');
    /* รอคำขอที่มีคำค้นจริง ๆ — การ์ดใบแรกอาจมีคำนั้นอยู่แล้วตั้งแต่ก่อนค้น
       ทำให้เช็คจากหน้าจออย่างเดียวผ่านได้ทั้งที่ยังไม่ได้ยิงอะไรเลย */
    const hit = page.waitForRequest((r) => r.url().includes(`q=${encodeURIComponent(needle)}`), { timeout: 10000 });
    await page.getByPlaceholder(/ค้นหา/).first().fill(needle);
    await hit;
    await expect(page.locator('[data-media-name]').first()).toContainText(needle, { timeout: 10000 });
    expect(asked.some((u) => u.includes(`q=${encodeURIComponent(needle)}`)), 'คำค้นต้องถูกส่งไปที่เซิร์ฟเวอร์').toBe(true);
    const names = await page.locator('[data-media-name]').allInnerTexts();
    expect(names.every((n) => n.toLowerCase().includes(needle.toLowerCase())), 'ผลลัพธ์ต้องตรงคำค้นทุกใบ').toBe(true);
  });
});
