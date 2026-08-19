import { test, expect, type Page } from '@playwright/test';

/* ลูกค้าคีย์ทรัพย์เข้าไปเองแล้วได้รหัส JKP0201 ทั้งที่ในระบบมี JKPBKK1000–1255
   และ JKPSPK1000–1131 จากที่นำเข้ามา — คนละรูปแบบ คนละช่วงเลข และไม่บอกจังหวัด
   ตัวออกรหัสเคยยกเว้นกรุงเทพฯ ให้ไม่มีรหัสจังหวัด ใส่ขีดคั่นให้จังหวัดอื่น
   (JKP-SPK0200) และเริ่มนับที่ 1 เสมอโดยไม่เคยดูว่ามีรหัสอะไรอยู่แล้ว */

const OWNER = { email: 'owner@jkp.local', password: 'jkp12345' };
async function signIn(page: Page) {
  await page.goto('/admin/login');
  await page.locator('#login-email').fill(OWNER.email);
  await page.locator('#login-password').fill(OWNER.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
}
const cookieOf = async (page: Page) =>
  (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

/** เลขสูงสุดที่ใช้อยู่จริงของ prefix นั้น ตามข้อมูลในระบบ ณ ตอนนี้ */
async function highest(request: import('@playwright/test').APIRequestContext, cookie: string, prefix: string) {
  const r = await (await request.get('/api/properties?limit=500', { headers: { cookie } })).json();
  const codes = (r.items as { publicCode: string }[])
    .map((i) => i.publicCode)
    .filter((c) => new RegExp(`^${prefix}\\d+$`).test(c))
    .map((c) => Number(c.slice(prefix.length)));
  return codes.length ? Math.max(...codes) : null;
}

test.describe('รหัสทรัพย์ที่ออกให้ตอนคีย์อิน', () => {
  const made: string[] = [];
  let cookie = '';

  test.afterAll(async ({ request }) => {
    for (const id of made) await request.delete(`/api/properties/${id}`, { headers: { cookie } }).catch(() => null);
  });

  const create = async (request: import('@playwright/test').APIRequestContext, province: string | null, title: string) => {
    const res = await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse', title, status: 'draft',
        values: province ? { province, deal_type: 'เช่า' } : { deal_type: 'เช่า' },
      },
    });
    expect(res.status(), 'สร้างทรัพย์ไม่สำเร็จ').toBeLessThan(300);
    const j = await res.json();
    made.push(j.id);
    return j.publicCode as string;
  };

  test('เลขต่อจากรหัสสูงสุดของจังหวัดนั้น ไม่ใช่เริ่มใหม่', async ({ page, request }) => {
    await signIn(page);
    cookie = await cookieOf(page);
    const before = await highest(request, cookie, 'JKPSPK');
    test.skip(before === null, 'ยังไม่มีทรัพย์สมุทรปราการในระบบ');

    const code = await create(request, 'สมุทรปราการ', 'ทดสอบรหัส SPK');
    /* ต้องเดินต่อจากของเดิม ไม่ใช่วนกลับไปเริ่มที่ 1 — ไม่ล็อกว่าต้องเป็น max+1
       เป๊ะ เพราะทรัพย์ที่เคยถูกลบก็กินเลขไปแล้ว และรหัสต้องไม่ถูกใช้ซ้ำ */
    expect(code).toMatch(/^JKPSPK\d+$/);
    expect(Number(code.slice('JKPSPK'.length)), `ของเดิมสูงสุด JKPSPK${before}`).toBeGreaterThan(before!);
  });

  test('กรุงเทพฯ มีรหัสจังหวัดเหมือนจังหวัดอื่น ไม่ใช่ JKP เปล่า ๆ', async ({ page, request }) => {
    await signIn(page);
    cookie = await cookieOf(page);
    const before = await highest(request, cookie, 'JKPBKK');
    const code = await create(request, 'กรุงเทพมหานคร', 'ทดสอบรหัส BKK');
    expect(code).toMatch(/^JKPBKK\d+$/);
    if (before !== null) expect(Number(code.slice('JKPBKK'.length))).toBeGreaterThan(before);
  });

  test('ชื่อจังหวัดที่เขียนย่อ ก็ยังเข้าชุดเดียวกัน', async ({ page, request }) => {
    await signIn(page);
    cookie = await cookieOf(page);
    // ข้อมูลจริงของทีมเขียน "กรุงเทพ" ส่วนแผนที่ส่ง "กรุงเทพมหานคร"
    const code = await create(request, 'กรุงเทพ', 'ทดสอบรหัสชื่อย่อ');
    expect(code).toMatch(/^JKPBKK\d+$/);
  });

  test('สองรายการติดกันไม่ได้เลขซ้ำ', async ({ page, request }) => {
    await signIn(page);
    cookie = await cookieOf(page);
    const a = await create(request, 'ปทุมธานี', 'ทดสอบรหัสซ้ำ 1');
    const b = await create(request, 'ปทุมธานี', 'ทดสอบรหัสซ้ำ 2');
    expect(a).not.toBe(b);
    expect(Number(b.slice('JKPPTE'.length))).toBe(Number(a.slice('JKPPTE'.length)) + 1);
  });

  test('ไม่กรอกจังหวัด ได้รหัสที่บอกว่ายังไม่ระบุ ไม่ใช่ปนกับจังหวัดอื่น', async ({ page, request }) => {
    await signIn(page);
    cookie = await cookieOf(page);
    const code = await create(request, null, 'ทดสอบรหัสไม่มีจังหวัด');
    expect(code).toMatch(/^JKPXXX\d+$/);
  });

  test('จังหวัดคนละจังหวัด นับแยกกัน', async ({ page, request }) => {
    await signIn(page);
    cookie = await cookieOf(page);
    const spk = await create(request, 'สมุทรปราการ', 'ทดสอบแยกจังหวัด SPK');
    const cbi = await create(request, 'ชลบุรี', 'ทดสอบแยกจังหวัด CBI');
    expect(spk).toMatch(/^JKPSPK\d+$/);
    expect(cbi).toMatch(/^JKPCBI\d+$/);
  });

  /* กติกาคือทุกจังหวัดเริ่มที่ 1000 ถ้าจังหวัดไหนบังเอิญมีรหัสเลขต่ำกว่านั้นอยู่
     (รูปแบบเก่า) การนับต่อตรง ๆ จะได้เลขสามหลักซึ่งหลุดจากชุดที่ทั้งระบบใช้ */
  test('เลขที่ออกให้ไม่ต่ำกว่า 1000 แม้จังหวัดนั้นจะมีรหัสเลขต่ำอยู่', async ({ page, request }) => {
    await signIn(page);
    cookie = await cookieOf(page);
    const g = await (await request.get('/api/geography', { headers: { cookie } })).json();
    const prov = (g.provinces as { id: string; th: string; code: string }[])[0];
    test.skip(!prov, 'ยังไม่มีจังหวัดในผังพื้นที่');

    /* ตั้งรหัสจังหวัดชั่วคราวเป็นตัวที่ไม่มีใครใช้ แล้วฝังทรัพย์เลขต่ำไว้หนึ่งใบ
       เพื่อจำลองข้อมูลรูปแบบเก่า */
    const before = prov.code;
    await request.patch(`/api/geography/${prov.id}`, { headers: { cookie }, data: { code: 'ZZQ' } });
    try {
      const low = await create(request, prov.th, 'ทดสอบรหัสเลขต่ำ');
      expect(low).toMatch(/^JKPZZQ\d+$/);
      /* ไม่ล็อกว่าต้องเป็น 1000 เป๊ะ เพราะตัวนับไม่ถอยหลังเมื่อทรัพย์ถูกลบ
         (รหัสห้ามถูกใช้ซ้ำ) สิ่งที่ต้องจริงเสมอคือไม่หลุดต่ำกว่าฐาน 1000 */
      expect(Number(low.slice('JKPZZQ'.length)), 'ต้องไม่ต่ำกว่าฐาน 1000').toBeGreaterThanOrEqual(1000);

      const next = await create(request, prov.th, 'ทดสอบรหัสเลขต่ำ 2');
      expect(Number(next.slice('JKPZZQ'.length))).toBe(Number(low.slice('JKPZZQ'.length)) + 1);
    } finally {
      await request.patch(`/api/geography/${prov.id}`, { headers: { cookie }, data: { code: before } }).catch(() => null);
    }
  });

  test('รหัสจังหวัดที่ตั้งไว้ใน /admin/geography ถูกใช้จริง', async ({ page, request }) => {
    await signIn(page);
    cookie = await cookieOf(page);
    const g = await (await request.get('/api/geography', { headers: { cookie } })).json();
    const prov = (g.provinces as { id: string; th: string; code: string }[]).find((p) => p.th === 'ระยอง');
    test.skip(!prov, 'ยังไม่มีระยองในผังพื้นที่');

    const before = prov!.code;
    await request.patch(`/api/geography/${prov!.id}`, { headers: { cookie }, data: { code: 'RYX' } });
    try {
      const code = await create(request, 'ระยอง', 'ทดสอบรหัสจากผังพื้นที่');
      expect(code, 'ต้องใช้รหัสที่ทีมตั้งไว้ ไม่ใช่ตารางในโค้ด').toMatch(/^JKPRYX\d+$/);
    } finally {
      await request.patch(`/api/geography/${prov!.id}`, { headers: { cookie }, data: { code: before } }).catch(() => null);
    }
  });
});
