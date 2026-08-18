import { test, expect, type Page } from '@playwright/test';

/* /admin/geography could only add. It opened on six invented provinces with
   invented districts and six industrial estates carrying property counts
   ("แหลมฉบัง 218") that came from the design mock — and those only showed
   while the real tree was empty, which is exactly when someone is deciding
   whether the page works. Nothing could be renamed or removed, the estate
   status toggle was React state, and nothing else in the product read any of
   it. These tests drive the page the way the team would. */

const OWNER = { email: 'owner@jkp.local', password: 'jkp12345' };

async function signIn(page: Page) {
  await page.goto('/admin/login');
  await page.locator('#login-email').fill(OWNER.email);
  await page.locator('#login-password').fill(OWNER.password);
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/);
}

/* ฟอร์มสร้างทรัพย์เป็นดรอเวอร์ในหน้า /admin/properties */
async function openNewPropertyForm(page: Page) {
  await page.goto('/admin/properties');
  await page.getByText('เพิ่มทรัพย์ใหม่').first().click();
  // โกดัง/โรงงานเก็บที่อยู่เป็นฟิลด์ระดับบน ส่วนบ้าน/คอนโดเก็บเป็นฟิลด์ย่อย —
  // เลือกโกดังให้ชัดเจน แทนที่จะพึ่งว่าประเภทเริ่มต้นคืออะไร
  await page.locator('#np-type-picker button', { hasText: 'โกดัง' }).first().click();
  await expect(page.locator('[data-geo-input="province"]')).toBeVisible({ timeout: 15000 });
}

const cookieOf = async (page: Page) =>
  (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

test.describe('พื้นที่ & นิคมอุตสาหกรรม', () => {
  test('ไม่มีข้อมูลสาธิตหลงเหลือบนหน้า', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const g = await (await request.get('/api/geography', { headers: { cookie } })).json();
    const names = (g.provinces as { th: string }[]).map((p) => p.th);

    await page.goto('/admin/geography');
    await expect(page.locator('[data-geo-prov]').first()).toBeVisible();
    const shown = await page.locator('[data-geo-prov]').evaluateAll((es) => es.map((e) => e.getAttribute('data-geo-prov')));
    // ทุกจังหวัดบนหน้าต้องมาจากฐานข้อมูล ไม่ใช่ค่าคงที่ในโค้ด
    expect(shown.sort()).toEqual(names.sort());

    // ตัวเลข "77 จังหวัด" ที่เคยคำนวณจากค่าคงที่ ต้องเป็นจำนวนจริง
    const header = await page.locator('text=จังหวัด').first().locator('..').innerText();
    expect(header).toContain(String(names.length));

    await page.getByText('นิคมอุตสาหกรรม', { exact: true }).click();
    const zoneText = await page.locator('#geo-zone-table, #geo-notice, div').first().innerText().catch(() => '');
    expect(zoneText).not.toContain('แหลมฉบัง 218');
  });

  test('ดึงจากทรัพย์ที่มีอยู่ แล้วต้นไม้ตรงกับที่อยู่ของทรัพย์จริง', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const before = await (await request.get('/api/geography', { headers: { cookie } })).json();
    test.skip(!before.missing || (before.missing.prov.length + before.missing.dist.length + before.missing.sub.length) === 0,
      'ต้นไม้ครบแล้ว ไม่มีอะไรให้ดึง');

    await page.goto('/admin/geography');
    await page.locator('#geo-import-btn').click();
    await expect(page.locator('#geo-notice')).toContainText('ดึงจากทรัพย์แล้ว', { timeout: 15000 });

    const after = await (await request.get('/api/geography', { headers: { cookie } })).json();
    /* สิ่งที่ทรัพย์ใช้อยู่ ต้องไม่เหลือค้าง ยกเว้นตัวที่รายงานว่าข้าม (ไม่รู้ว่า
       อยู่ใต้พื้นที่ไหน) — ถ้าปล่อยให้เป็น "น้อยลงก็พอ" การข้ามเงียบ ๆ ก็ผ่าน */
    const res = await (await request.post('/api/geography/import?dry=1', { headers: { cookie }, data: {} })).json();
    const left = after.missing.prov.length + after.missing.dist.length + after.missing.sub.length;
    expect(left, `เหลือค้าง ${left} · ระบบบอกว่าข้าม ${res.skipped.length}`).toBe(res.skipped.length);
    expect(after.missing.prov, 'จังหวัดที่ยังไม่มีในระบบ').toEqual([]);
    if (!left) expect(await page.locator('#geo-missing').count()).toBe(0);
  });

  test('ตัวเลขข้างชื่อพื้นที่ ตรงกับจำนวนทรัพย์จริงในพื้นที่นั้น', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const g = await (await request.get('/api/geography', { headers: { cookie } })).json();
    const withStock = (g.provinces as { th: string; count: number }[]).filter((p) => p.count > 0);
    test.skip(!withStock.length, 'ยังไม่มีทรัพย์ในจังหวัดใดเลย');

    for (const p of withStock.slice(0, 3)) {
      const listed = (await (await request.get(`/api/public/listings?locale=th&province=${encodeURIComponent(p.th)}&limit=500`)).json()).items.length;
      expect(p.count, `${p.th}: หน้าแอดมินบอก ${p.count} แต่หน้ารายการมี ${listed}`).toBe(listed);
    }
  });

  test('เพิ่ม → แก้ชื่อ → ลบ ได้จริง และซ้ำไม่ได้', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const name = `พื้นที่ทดสอบ-${Date.now().toString(36)}`;

    const made = await request.post('/api/geography', { headers: { cookie }, data: { level: 'prov', th: name, en: 'Test Area', code: 'TST' } });
    expect(made.status()).toBe(200);
    const id = (await made.json()).id as string;

    // ชื่อซ้ำในระดับเดียวกันคือ typo เสมอ
    const dup = await request.post('/api/geography', { headers: { cookie }, data: { level: 'prov', th: name } });
    expect(dup.status(), 'เพิ่มชื่อซ้ำต้องไม่ผ่าน').toBe(400);
    expect((await dup.json()).error.message).toContain('มี');

    await page.goto('/admin/geography');
    await expect(page.locator(`[data-geo-prov="${name}"]`)).toBeVisible();

    const renamed = `${name}-แก้แล้ว`;
    expect((await request.patch(`/api/geography/${id}`, { headers: { cookie }, data: { th: renamed } })).status()).toBe(200);
    await page.reload();
    await expect(page.locator(`[data-geo-prov="${renamed}"]`)).toBeVisible();
    await expect(page.locator(`[data-geo-prov="${name}"]`)).toHaveCount(0);

    expect((await request.delete(`/api/geography/${id}`, { headers: { cookie } })).status()).toBe(200);
    await page.reload();
    await expect(page.locator(`[data-geo-prov="${renamed}"]`)).toHaveCount(0);
  });

  test('ลบจังหวัดที่ยังมีของอยู่ข้างในไม่ได้ และบอกว่าติดอะไร', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const prov = `จังหวัดกันลบ-${Date.now().toString(36)}`;
    const pid = (await (await request.post('/api/geography', { headers: { cookie }, data: { level: 'prov', th: prov } })).json()).id;
    const did = (await (await request.post('/api/geography', { headers: { cookie }, data: { level: 'dist', th: 'อำเภอลูก', parent: prov } })).json()).id;

    const blocked = await request.delete(`/api/geography/${pid}`, { headers: { cookie } });
    expect(blocked.status(), 'จังหวัดที่มีอำเภออยู่ ต้องลบไม่ได้').toBe(409);
    expect((await blocked.json()).error.message).toContain('พื้นที่ย่อย');

    // ลบจากข้างในออกมาได้ตามลำดับ
    expect((await request.delete(`/api/geography/${did}`, { headers: { cookie } })).status()).toBe(200);
    expect((await request.delete(`/api/geography/${pid}`, { headers: { cookie } })).status()).toBe(200);
  });

  test('ลบพื้นที่ที่มีทรัพย์อยู่ไม่ได้ ถ้าไม่ยืนยัน', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const g = await (await request.get('/api/geography', { headers: { cookie } })).json();
    /* ต้องเป็นใบล่างสุดที่ไม่มีพื้นที่ย่อย ไม่งั้นจะติดกติกา "ลบข้างในก่อน"
       ก่อนถึงกติกา "มีทรัพย์อยู่" ซึ่งเป็นคนละเรื่องกัน */
    const leaf = (Object.values(g.subMap) as { id: string; name: string; count: number }[][])
      .flat().find((sd) => sd.count > 0);
    test.skip(!leaf, 'ยังไม่มีแขวง/ตำบลที่มีทรัพย์');

    const res = await request.delete(`/api/geography/${leaf!.id}`, { headers: { cookie } });
    expect(res.status(), `${leaf!.name} มีทรัพย์ ${leaf!.count} รายการ`).toBe(409);
    expect((await res.json()).error.message).toContain('มีทรัพย์');

    // ยืนยันแล้วลบได้ — แล้วใส่กลับให้เหมือนเดิม
    const forced = await request.delete(`/api/geography/${leaf!.id}?force=1`, { headers: { cookie } });
    expect(forced.status()).toBe(200);
    await request.post('/api/geography/import', { headers: { cookie }, data: {} });
    const back = await (await request.get('/api/geography', { headers: { cookie } })).json();
    expect((Object.values(back.subMap) as { name: string }[][]).flat().map((x) => x.name)).toContain(leaf!.name);
  });

  test('สถานะนิคมที่กดไว้ ยังอยู่หลังรีเฟรช', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const prov = (await (await request.get('/api/geography', { headers: { cookie } })).json()).provinces[0];
    test.skip(!prov, 'ยังไม่มีจังหวัด');
    const zname = `นิคมทดสอบ-${Date.now().toString(36)}`;
    const zid = (await (await request.post('/api/geography', { headers: { cookie }, data: { level: 'zone', th: zname, type: 'นิคมฯ', parent: prov.th } })).json()).id;

    try {
      await page.goto('/admin/geography');
      await page.getByText('นิคมอุตสาหกรรม', { exact: true }).click();
      const row = page.locator(`[data-geo-zone="${zname}"]`);
      await expect(row).toBeVisible();
      const toggle = row.locator('[role="switch"]');
      await expect(toggle).toHaveAttribute('aria-checked', 'true');
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-checked', 'false');

      // เดิมเป็น state ในหน้าเว็บล้วน ๆ รีเฟรชแล้วกลับมาเปิดเหมือนเดิม
      await page.reload();
      await page.getByText('นิคมอุตสาหกรรม', { exact: true }).click();
      await expect(page.locator(`[data-geo-zone="${zname}"] [role="switch"]`)).toHaveAttribute('aria-checked', 'false');
    } finally {
      await request.delete(`/api/geography/${zid}`, { headers: { cookie } }).catch(() => null);
    }
  });
});

/* The tree only matters if something reads it. Nothing did: the address on the
   property form was three empty text boxes, which is where "กิ่แก้ว",
   "แขวงคันนายาว" (no space) and "กรุงเทพ" vs "กรุงเทพมหานคร" came from — and
   a province filter that then matched nothing. */
test.describe('ต้นไม้พื้นที่ ถูกใช้จริงในฟอร์มทรัพย์', () => {
  test('ช่องจังหวัด/เขต/แขวง มีรายการให้เลือกจาก /admin/geography', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const g = await (await request.get('/api/geography', { headers: { cookie } })).json();
    const prov = (g.provinces as { th: string; districts: { name: string }[] }[]).find((p) => p.districts.length);
    test.skip(!prov, 'ต้นไม้ยังไม่มีเขต/อำเภอ');

    await openNewPropertyForm(page);
    const provInput = page.locator('[data-geo-input="province"]');
    await expect(provInput).toBeVisible();

    // รายการช่วยเติมของช่องจังหวัด ต้องเป็นจังหวัดจริงในระบบ
    const provOpts = await page.locator('#geo-list-province option').evaluateAll((es) => es.map((e) => e.getAttribute('value')));
    expect(provOpts).toContain(prov!.th);

    // เลือกจังหวัดแล้ว รายการเขต/อำเภอต้องแคบลงเหลือเฉพาะของจังหวัดนั้น
    await provInput.fill(prov!.th);
    const distOpts = await page.locator('#geo-list-district option').evaluateAll((es) => es.map((e) => e.getAttribute('value')));
    expect(distOpts.sort()).toEqual(prov!.districts.map((d) => d.name).sort());
  });

  test('พิมพ์ชื่อใหม่ที่ยังไม่มีในระบบได้ ไม่ถูกปิดกั้น', async ({ page }) => {
    await signIn(page);
    await openNewPropertyForm(page);
    const provInput = page.locator('[data-geo-input="province"]');
    await provInput.fill('จังหวัดที่ยังไม่เคยมี');
    await expect(provInput).toHaveValue('จังหวัดที่ยังไม่เคยมี');
  });
});
