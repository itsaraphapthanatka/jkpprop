import { test, expect, type Page } from '@playwright/test';

/* หลังบ้านทั้งระบบเคยมีนิสัยเดียวกัน: ถ้าอ่านข้อมูลจริงไม่ได้ (หรือยังไม่ทันอ่าน)
   ก็โชว์ข้อมูลที่พิมพ์ไว้ในไฟล์แทน — พนักงานสมมุติ 7 คนพร้อมสิทธิ์, lead ปลอม 6
   รายพร้อมเบอร์โทร, บันทึกการใช้งานที่แต่งขึ้นพร้อมเลข IP, ค่าคอมมิชชัน
   ฿138,600 บนทุกดีล, KPI 246/198/34/12 และบทความ CMS ที่ไม่มีอยู่จริง
   ทั้งหมดเจอเพราะผู้ใช้ทักมา ไม่ใช่เพราะมีอะไรคอยจับ — อันนี้คือตัวจับ */

const OWNER = { email: 'owner@jkp.local', password: 'jkp12345' };
async function signIn(page: Page) {
  await page.goto('/admin/login');
  await page.locator('#login-email').fill(OWNER.email);
  await page.locator('#login-password').fill(OWNER.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
}

/* ชื่อ เบอร์ อีเมล รหัสทรัพย์ และตัวเลขที่เคยถูกฝังไว้ในโค้ด ไม่มีอันไหนอยู่ใน
   ฐานข้อมูลจริง ถ้าโผล่บนหน้าจอเมื่อไหร่ แปลว่ามีของสาธิตกลับมาอีกแล้ว */
const GHOSTS = [
  'อารยา', 'วีรพล', 'ณัฐพร', 'Lin Wei', 'ธนกฤต',
  'kittipong@jkp.co', 'araya@jkp.co', 'somchai@thailog.co.th', 'wipa@metropack.com',
  'บ. ไทยโลจิสติกส์', 'Sunrise Foods', 'Metro Pack', 'Nippon Steel', 'Global Ware',
  '+66 81-234-5678', '203.150.x.x', '฿138,600', 'JKP-RYG2081',
];

const PAGES = [
  '/admin', '/admin/properties', '/admin/listings', '/admin/social-status', '/admin/leads',
  '/admin/requirements', '/admin/shortlists', '/admin/visits', '/admin/deals', '/admin/cms',
  '/admin/media', '/admin/seo', '/admin/geography', '/admin/sections', '/admin/page-builder',
  '/admin/branding', '/admin/company', '/admin/users', '/admin/audit', '/admin/notifications',
  '/admin/field-builder', '/admin/settings',
];

test.describe('ไม่มีข้อมูลสาธิตหลงเหลือในหลังบ้าน', () => {
  test('ทุกหน้าไม่โชว์ชื่อ เบอร์ หรือตัวเลขที่ไม่มีอยู่จริง', async ({ page }) => {
    test.slow();
    await signIn(page);
    const found: string[] = [];
    for (const p of PAGES) {
      await page.goto(p, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(700);
      const body = await page.locator('body').innerText().catch(() => '');
      for (const g of GHOSTS) if (body.includes(g)) found.push(`${p} → ${g}`);
    }
    expect(found, 'ข้อมูลสาธิตที่ยังโผล่บนหน้าจอ').toEqual([]);
  });

  /* หน้าที่พึ่ง API จะเห็นของสาธิตชัดที่สุดตอน API ล่ม — จำลองด้วยการตัดคำขอทิ้ง */
  test('API ล่มแล้วต้องว่างหรือบอกว่าอ่านไม่ได้ ไม่ใช่แต่งข้อมูลมาแทน', async ({ page }) => {
    test.slow();
    await signIn(page);
    await page.route('**/api/**', (r) => (r.request().method() === 'GET' ? r.abort() : r.continue()));

    const found: string[] = [];
    for (const p of ['/admin/leads', '/admin/users', '/admin/audit', '/admin/cms', '/admin/properties', '/admin/deals']) {
      await page.goto(p, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(900);
      const body = await page.locator('body').innerText().catch(() => '');
      for (const g of GHOSTS) if (body.includes(g)) found.push(`${p} → ${g}`);
      /* ตัวเลขที่เดาไม่ได้ต้องเป็นขีด ไม่ใช่ค่าจากไฟล์ออกแบบ — KPI ของหน้าทรัพย์
         (246/198/34/12) และจำนวนเนื้อหาข้างชื่อหมวดใน CMS (14/32/26/3) */
      const numbers: Record<string, string[]> = {
        '/admin/properties': ['246', '198'],
        '/admin/cms': ['14', '32', '26'],
      };
      for (const n of numbers[p] ?? []) {
        if (body.includes(n)) found.push(`${p} → ตัวเลข ${n}`);
      }
    }
    expect(found, 'ข้อมูลที่แต่งขึ้นตอน API ล่ม').toEqual([]);
  });
});

/* หน้าแผนเข้าชมประกาศรหัส 'VP-064 · confirming' และ breadcrumb 'SL-208' ไว้ตายตัว
   ทั้งที่ในระบบไม่มีแผนเข้าชมสักแผน และปุ่ม 'ปิด plan' กับ 'ยืนยันไม่เปลี่ยน'
   เปลี่ยนสถานะบนหน้าจอให้ดูเหมือนสำเร็จ ทั้งที่ไม่มีอะไรถูกบันทึก */
test.describe('หน้าแผนเข้าชมเมื่อยังไม่มีแผน', () => {
  test('ไม่ประกาศรหัสแผนที่ไม่มีอยู่', async ({ page, request }) => {
    await signIn(page);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const visits = (await (await request.get('/api/visits', { headers: { cookie } })).json()).items as unknown[];

    await page.goto('/admin/visits');
    await page.waitForTimeout(900);
    const body = await page.locator('body').innerText();
    expect(body.includes('VP-064'), 'รหัสแผนจากไฟล์ออกแบบ').toBe(false);
    expect(body.includes('SL-208'), 'รหัส shortlist จากไฟล์ออกแบบ').toBe(false);
    if (!visits.length) {
      expect(body).toContain('ยังไม่มีแผนเข้าชม');
      // ด่านยืนยันเกณฑ์ต้องไม่ขึ้นเมื่อไม่มีแผนให้ยืนยัน
      expect(body.includes('FR-VIS-07'), 'ด่านยืนยันขึ้นทั้งที่ไม่มีแผน').toBe(false);
    }
  });

  test('ปุ่มปิดแผนไม่บอกว่าสำเร็จเมื่อไม่มีแผนให้ปิด', async ({ page }) => {
    await signIn(page);
    /* บังคับให้ระบบไม่มีแผนเข้าชม แทนที่จะข้ามเทสต์เมื่อฐานข้อมูลมีแผนอยู่ —
       production ไม่มีแผนสักแผน ซึ่งเป็นสภาพที่ต้องคุมให้ได้ */
    await page.route('**/api/visits*', (r) =>
      r.request().method() === 'GET'
        ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) })
        : r.continue());

    await page.goto('/admin/visits');
    await page.waitForTimeout(700);
    await page.getByText('ปิด plan (completed)').click();
    await page.waitForTimeout(600);
    await expect(page.getByText('ปิด plan แล้ว'), 'ปุ่มบอกว่าปิดแล้วทั้งที่ไม่มีแผน').toHaveCount(0);
    await expect(page.getByText('ยังไม่มีแผนเข้าชม')).toBeVisible();
  });
});
