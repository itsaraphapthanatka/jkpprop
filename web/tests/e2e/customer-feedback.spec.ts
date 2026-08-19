import { test, expect } from '@playwright/test';

/* คอมเมนต์จากลูกค้าในสไลด์ "Web 2026" — ชุดหน้าเว็บฝั่งลูกค้า
   หน้า 7  · "คลิกที่รูปภาพ ข้อความ หรือการ์ด ต้องเข้าได้ ตอนนี้ต้องคลิกที่รายละเอียดอย่างเดียว"
   หน้า 11 · "คลิกดูรูปภาพไม่ได้ (ขยาย) · ดูรูปภาพและเลื่อนดูภาพทั้งหมดไม่ได้"
   หน้า 15 · "ไม่มีปุ่มโทร"
   หน้า 19 · "หน้าขายไม่แสดงราคา ต่อ ตรม." */

test.describe('คอมเมนต์ลูกค้า · หน้าเว็บฝั่งลูกค้า', () => {
  test('การ์ดทรัพย์คลิกได้ทั้งใบ ไม่ใช่เฉพาะปุ่มรายละเอียด', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[];
    test.skip(!items.length, 'ยังไม่มีทรัพย์');

    await page.goto('/th/listing');
    const card = page.locator(`[data-card="${items[0].code}"]`);
    await expect(card).toBeVisible();

    /* คลิกตรงรูป — ต้องใช้ force เพราะลิงก์ที่คลุมการ์ดอยู่ข้างบน ซึ่งก็คือสิ่งที่
       ต้องการพอดี: นิ้วผู้ใช้แตะตรงนั้นแล้วโดนลิงก์ ไม่ใช่โดนรูปเปล่า ๆ */
    await card.locator('img').first().click({ force: true });
    await expect(page).toHaveURL(new RegExp(`/property/${items[0].code}`));
  });

  test('กดหัวใจบนการ์ด ยังเป็นการบันทึก ไม่ใช่เปิดหน้าทรัพย์', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[];
    test.skip(!items.length, 'ยังไม่มีทรัพย์');

    await page.goto('/th/listing');
    const card = page.locator(`[data-card="${items[0].code}"]`);
    await card.locator('[data-fav]').click();
    await expect(page, 'กดหัวใจแล้วไม่ควรเปลี่ยนหน้า').toHaveURL(/\/listing/);
    await expect(card.locator('[data-fav]')).toHaveAttribute('data-on', '1');
  });

  test('คลิกรูปแล้วขยายเต็มจอ และเลื่อนดูได้ทุกใบ', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { code: string; photos: string }[];
    const withPhoto = items.find((i) => Number(i.photos) > 0);
    test.skip(!withPhoto, 'ยังไม่มีทรัพย์ที่มีรูป');

    await page.goto(`/th/property/${withPhoto!.code}`);
    await page.locator('[data-zoom-open]').click();
    const box = page.locator('#pd-lightbox');
    await expect(box, 'คลิกรูปแล้วต้องขยาย').toBeVisible();

    const many = Number(withPhoto!.photos) > 1;
    if (many) {
      await expect(page.locator('[data-zoom-count]')).toContainText('1 /');
      await page.locator('[data-zoom-next]').click();
      await expect(page.locator('[data-zoom-count]')).toContainText('2 /');
    }
    // ปิดด้วย Esc
    await page.keyboard.press('Escape');
    await expect(box).toHaveCount(0);
  });

  test('หน้าทรัพย์มีปุ่มโทรที่โทรออกได้จริง', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[];
    test.skip(!items.length, 'ยังไม่มีทรัพย์');

    await page.goto(`/th/property/${items[0].code}`);
    const call = page.locator('[data-call-btn]');
    await expect(call, 'ไม่มีปุ่มโทรบนหน้าทรัพย์').toBeVisible();
    const href = await call.getAttribute('href');
    expect(href, 'ปุ่มโทรต้องเป็นลิงก์ tel: ที่มีเบอร์จริง').toMatch(/^tel:\+?\d{8,}$/);
  });

  test('ทรัพย์ขาย แสดงราคาต่อ ตร.ม. ที่คำนวณจากราคาขายกับพื้นที่', async ({ page, request }) => {
    /* สร้างทรัพย์ขายเองแทนที่จะหาในคลัง — ชุดที่นำเข้ามาเป็นให้เช่าเกือบทั้งหมด
       เทสต์ที่ข้ามตัวเองเพราะข้อมูลไม่ตรงเงื่อนไข ไม่ได้ตรวจอะไรเลย */
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse', title: `ทดสอบราคาต่อตารางเมตร ${Date.now().toString(36)}`, status: 'active',
        /* ข้อมูลที่นำเข้ามาเก็บช่องนี้เป็น null ไม่ใช่ไม่มีคีย์ — ต้องคำนวณให้
           ในกรณีนั้นด้วย ไม่งั้นบนของจริงก็ยังไม่ขึ้นเหมือนเดิม */
        values: { province: 'สมุทรปราการ', deal_type: 'ขาย', price_sale: 98_000_000, building_area_total: 2520, price_per_sqm: null },
      },
    })).json();

    try {
      await page.goto(`/th/property/${made.publicCode}`);
      const row = page.locator('[data-spec-row="price_per_sqm"]');
      await expect(row, 'หน้าขายต้องมีแถวราคาต่อ ตร.ม.').toBeVisible();
      // 98,000,000 / 2,520 = 38,889
      await expect(row).toContainText((38889).toLocaleString('th-TH'));
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });
});

/* คอมเมนต์ลูกค้า ชุดที่ 2 — หลังบ้าน
   สไลด์ 22 · "กดบันทึกแล้วไม่กลับไปหน้ารวม Property"
   สไลด์ 27 · "ทำลายน้ำตำแหน่งเดียวกัน"
   สไลด์ 31 · "Shortlist ไม่ไปหน้าแสดงผลหรือปุ่มให้ไป"
   สไลด์ 33 · "ปิดดีลแล้วไม่ขึ้นประวัติใน Leads ภาพรวม" */
test.describe('คอมเมนต์ลูกค้า · หลังบ้าน', () => {
  const admin = { email: 'owner@jkp.local', password: 'jkp12345' };
  const signInAdmin = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill(admin.email);
    await page.locator('#login-password').fill(admin.password);
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  test('บันทึกทรัพย์แล้วกลับไปหน้ารายการเอง', async ({ page, request }) => {
    const cookie = await signInAdmin(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: `ทดสอบบันทึกแล้วกลับ ${Date.now().toString(36)}`, status: 'draft', values: { province: 'สมุทรปราการ' } },
    })).json();

    try {
      await page.goto(`/admin/property-edit?code=${made.publicCode}`);
      await page.getByText('บันทึก', { exact: true }).first().click();
      await expect(page, 'บันทึกแล้วต้องกลับไปหน้ารวมทรัพย์').toHaveURL(/\/admin\/properties$/, { timeout: 15000 });
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('หน้า Shortlist มีปุ่มเปิดหน้าที่ลูกค้าเห็น', async ({ page, request }) => {
    const cookie = await signInAdmin(page);
    const lists = await (await request.get('/api/shortlists', { headers: { cookie } })).json();
    test.skip(!(lists.items ?? []).length, 'ยังไม่มี shortlist ในระบบ');

    await page.goto(`/admin/shortlists/${lists.items[0].id}`);
    const open = page.locator('#sl-open-client');
    await expect(open, 'ไม่มีปุ่มเปิดหน้าที่ลูกค้าเห็น').toBeVisible();
    const href = await open.getAttribute('href');
    expect(href, 'ปุ่มต้องพาไปหน้า shortlist ฝั่งลูกค้า').toContain('/client-shortlist');
  });

  test('เปลี่ยนสถานะ lead แล้วขึ้นในไทม์ไลน์ ไม่ใช่แค่ใน audit', async ({ page, request }) => {
    const cookie = await signInAdmin(page);
    const lead = await (await request.post('/api/leads', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { name: `ทดสอบไทม์ไลน์ ${Date.now().toString(36)}`, phone: '0800000900', typeKey: 'warehouse', dealIntent: 'เช่า' },
    })).json();

    try {
      await request.patch(`/api/leads/${lead.id}`, { headers: { cookie }, data: { status: 'qualified' } });
      const detail = await (await request.get(`/api/leads/${lead.id}`, { headers: { cookie } })).json();
      const notes = (detail.notes ?? []) as { text: string }[];
      expect(notes.some((n) => n.text.includes('คัดกรองแล้ว')), 'ไทม์ไลน์ต้องบันทึกการเปลี่ยนสถานะ').toBe(true);
    } finally {
      await request.delete(`/api/leads/${lead.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('รูปที่เสิร์ฟมีลายน้ำชั้นเดียว — ไม่ฝังข้อความซ้ำตอนอัปโหลด', async ({ page, request }) => {
    const cookie = await signInAdmin(page);
    const media = await (await request.get('/api/media?limit=200', { headers: { cookie } })).json();
    const stamped = (media.items as { name: string; watermarkType: string }[]).filter((m) => m.watermarkType && m.watermarkType !== 'none');
    expect(stamped.map((m) => m.name), 'ยังมีไฟล์ที่ฝังลายน้ำข้อความไว้ในตัวไฟล์').toEqual([]);
  });
});

/* สไลด์ 21 · "ราคา ค่าใช้จ่าย ภาษี แยกหมวดหมู่กัน" พร้อมช่อง "จ่ายกับ" ของ
   ค่าน้ำ/ค่าไฟ/ค่าส่วนกลาง (เจ้าของ หรือ รัฐ) — ตามคอลัมน์ใน Master Sheet
   (elec_bill_pay · Water_bill_pay · common_bill_pay) */
test.describe('คอมเมนต์ลูกค้า · แยกหมวดราคา/ค่าใช้จ่าย/ภาษี', () => {
  const admin = { email: 'owner@jkp.local', password: 'jkp12345' };
  const signInAdmin = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill(admin.email);
    await page.locator('#login-password').fill(admin.password);
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  test('ฟอร์มทรัพย์มีหัวข้อสามหมวดแยกกัน', async ({ page }) => {
    await signInAdmin(page);
    await page.goto('/admin/properties');
    await page.getByText('เพิ่มทรัพย์ใหม่').first().click();
    await page.locator('#np-type-picker button', { hasText: 'โกดัง' }).first().click();
    await page.waitForTimeout(600);

    const body = await page.locator('#np-modal').innerText();
    for (const head of ['ราคา', 'ค่าสาธารณูปโภค', 'ภาษีและค่าธรรมเนียม']) {
      expect(body.includes(head), `ไม่มีหมวด "${head}"`).toBe(true);
    }
    // ช่อง "จ่ายกับ" ของทั้งสามรายการ พร้อมตัวเลือกเจ้าของ/รัฐ
    for (const label of ['ค่าไฟ จ่ายกับ', 'ค่าน้ำ จ่ายกับ', 'ค่าส่วนกลาง จ่ายกับ']) {
      expect(body.includes(label), `ไม่มีช่อง "${label}"`).toBe(true);
    }
  });

  test('เลือก "จ่ายกับ" แล้วขึ้นบนหน้าเว็บจริง', async ({ page, request }) => {
    const cookie = await signInAdmin(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse', title: `ทดสอบหมวดค่าใช้จ่าย ${Date.now().toString(36)}`, status: 'active',
        values: {
          province: 'สมุทรปราการ', deal_type: 'เช่า', price_rent: 100000, building_area_total: 1000,
          elec_rate: 5, elec_bill_pay: 'เจ้าของ', water_rate: 20, water_bill_pay: 'รัฐ',
          common_fee: 3000, common_bill_pay: 'เจ้าของ',
          withholding_tax: { payer: 'ผู้เช่า', amount: 5000 },
        },
      },
    })).json();

    try {
      await page.goto(`/th/property/${made.publicCode}`);
      const table = page.locator('#pd-specs, [data-spec-row]').first();
      await expect(table).toBeVisible();
      const rows = await page.locator('[data-spec-row]').allInnerTexts();
      const text = rows.join(' | ');
      expect(text, 'ค่าไฟ จ่ายกับ เจ้าของ').toContain('ค่าไฟ จ่ายกับ');
      expect(text, 'ค่าน้ำ จ่ายกับ รัฐ').toContain('รัฐ');
      /* ภาษีเก็บเป็นคู่ ผู้รับผิดชอบ+จำนวนเงิน — เดิมตกลงมาเป็น [object Object] */
      expect(text).not.toContain('[object Object]');
      expect(text).toContain('ผู้เช่า');
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });
});
