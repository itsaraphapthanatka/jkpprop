import { test, expect } from '@playwright/test';

/* คอมเมนต์จากลูกค้าในสไลด์ "Web 2026" — ชุดหน้าเว็บฝั่งลูกค้า
   หน้า 7  · "คลิกที่รูปภาพ ข้อความ หรือการ์ด ต้องเข้าได้ ตอนนี้ต้องคลิกที่รายละเอียดอย่างเดียว"
   หน้า 11 · "คลิกดูรูปภาพไม่ได้ (ขยาย) · ดูรูปภาพและเลื่อนดูภาพทั้งหมดไม่ได้"
   หน้า 15 · "ไม่มีปุ่มโทร"
   หน้า 19 · "หน้าขายไม่แสดงราคา ต่อ ตรม." */

test.describe('คอมเมนต์ลูกค้า · หน้าเว็บฝั่งลูกค้า', () => {
  test('การ์ดทรัพย์คลิกได้ทั้งใบ ไม่ใช่เฉพาะปุ่มรายละเอียด', async ({ page, request }) => {
    /* ต้องเลือกใบที่มีรูปจริง — ใบที่ไม่มีรูปวาด placeholder ไม่ใช่ <img>
       และลำดับการ์ดก็เปลี่ยนได้ตามสถานะว่าง/ไม่ว่าง */
    const items = (await (await request.get('/api/public/listings?locale=th&limit=24')).json()).items as { code: string; img: string | null }[];
    const withPhoto = items.find((i) => i.img);
    test.skip(!withPhoto, 'ยังไม่มีทรัพย์ที่มีรูป');

    await page.goto('/th/listing');
    const card = page.locator(`[data-card="${withPhoto!.code}"]`);
    await expect(card).toBeVisible();

    /* คลิกตรงรูป — ต้องใช้ force เพราะลิงก์ที่คลุมการ์ดอยู่ข้างบน ซึ่งก็คือสิ่งที่
       ต้องการพอดี: นิ้วผู้ใช้แตะตรงนั้นแล้วโดนลิงก์ ไม่ใช่โดนรูปเปล่า ๆ */
    await card.locator('img').first().click({ force: true });
    await expect(page).toHaveURL(new RegExp(`/property/${withPhoto!.code}`));
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

/* สไลด์ 6 · "แผนที่เละ อาจจะเกี่ยวกับขนาด" — การ์ดของแต่ละจังหวัดค้างเปิด
   พร้อมกันเต็มจอ เพราะ Leaflet ปิด tooltip เมื่อได้ mouseout เท่านั้น เลื่อนเมาส์
   ข้ามหลายจังหวัดเร็ว ๆ แล้ว mouseout บางตัวไม่มาถึง */
test.describe('คอมเมนต์ลูกค้า · แผนที่หน้าแรก', () => {
  test('เลื่อนเมาส์ข้ามหลายจังหวัด แล้วการ์ดไม่ค้างซ้อนกัน', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    const box = (await plane.boundingBox())!;
    // ลากเมาส์พาดแผนที่เร็ว ๆ แบบที่คนใช้จริงทำ
    let everOpened = 0;
    for (let i = 0; i <= 12; i++) {
      await page.mouse.move(box.x + (box.width * i) / 12, box.y + box.height * (0.35 + (i % 3) * 0.12));
      everOpened = Math.max(everOpened, await page.locator('.belt-card').count());
    }
    /* ถ้าไม่มีการ์ดเปิดเลยระหว่างลาก เทสต์นี้ก็ไม่ได้ตรวจอะไร */
    expect(everOpened, 'ลากผ่านแล้วต้องมีการ์ดขึ้นอย่างน้อยหนึ่งใบ').toBeGreaterThan(0);
    await page.waitForTimeout(500);
    const cards = await page.locator('.belt-card').count();
    expect(cards, `การ์ดค้างบนแผนที่ ${cards} ใบ`).toBeLessThanOrEqual(1);
  });

  /* สไลด์ 6 · "ล็อคไม่ให้แผนที่เลื่อนได้" — แผนที่นี้เป็นตัวเลือกจังหวัด
     ลากหลุดกรอบแล้วคนหาทางกลับไม่เจอ เพราะไม่มีปุ่มซูมหรือปุ่มรีเซ็ต */
  test('ลากแผนที่แล้วมุมมองไม่ขยับ', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    const box = (await plane.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    /* จำตำแหน่งขอบเขตจังหวัดหนึ่งไว้ก่อนลาก แล้วเทียบหลังลาก */
    const shape = page.locator('#lf-map-plane path').first();
    const before = await shape.boundingBox();
    expect(before, 'ต้องมีรูปจังหวัดบนแผนที่ก่อน จึงจะวัดได้ว่าขยับหรือไม่').not.toBeNull();

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 220, cy - 160, { steps: 12 });
    await page.mouse.up();
    /* พาเมาส์ออกจากแผนที่ก่อนวัด — ตอนชี้ค้างอยู่ เส้นขอบจังหวัดจะหนาขึ้น
       ทำให้กรอบของรูปโตขึ้นสองสามพิกเซล ซึ่งไม่ใช่การเลื่อนแผนที่ */
    await page.mouse.move(2, 2);
    await page.waitForTimeout(600);

    const after = await shape.boundingBox();
    expect(Math.abs(after!.x - before!.x), 'ลากแล้วแผนที่ต้องอยู่ที่เดิม').toBeLessThan(2);
    expect(Math.abs(after!.y - before!.y), 'ลากแล้วแผนที่ต้องอยู่ที่เดิม').toBeLessThan(2);
  });
});

/* สไลด์ 30 · "ระบบเช็คให้ว่าว่างไม่ว่างหาย" — ทีมกรอก ว่าง/ไม่ว่าง มาใน Master
   Sheet ครบทุกแถว (129 รายการเป็น "ไม่ว่าง") ข้อมูลเข้าฐานไปแล้วจริง แต่ไม่มี
   หน้าไหนอ่านมันเลย ทรัพย์ที่ปล่อยไปแล้วจึงยังโฆษณาเหมือนว่างอยู่ และทีมก็ไม่มี
   ที่ให้กดเปลี่ยนกลับเมื่อทรัพย์ว่างอีกครั้ง */
test.describe('คอมเมนต์ลูกค้า · ว่าง/ไม่ว่าง', () => {
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  test('กดไม่ว่างในหลังบ้าน แล้วหน้าเว็บขึ้นป้ายไม่ว่างจริง', async ({ page, request }) => {
    const cookie = await signIn(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse',
        title: `ทดสอบว่างไม่ว่าง ${Date.now().toString(36)}`,
        status: 'active',
        values: { province: 'สมุทรปราการ', deal_type: 'เช่า', price_rent: 90000 },
      },
    })).json();

    try {
      // ตอนสร้างใหม่ต้องถือว่าว่าง — ไม่มีป้ายบนหน้ารายละเอียด
      await page.goto(`/th/property/${made.publicCode}`);
      await expect(page.locator('[data-taken-note]')).toHaveCount(0);

      // ทีมกดว่า "ไม่ว่าง" ในหน้าแก้ไข แล้วบันทึก
      await page.goto(`/admin/property-edit?code=${made.publicCode}`);
      await page.locator('[data-avail="no"]').click();
      await page.getByText('บันทึก', { exact: true }).first().click();
      await expect(page).toHaveURL(/\/admin\/properties$/, { timeout: 15000 });

      // ค่าที่กดต้องถูกบันทึกจริง ไม่ใช่แค่ปุ่มเปลี่ยนสี
      const after = await (await request.get(`/api/properties/${made.id}`, { headers: { cookie } })).json();
      expect(after.available, 'API ต้องรายงานว่าไม่ว่าง').toBe(false);

      // และหน้าที่ลูกค้าเห็นต้องบอก ไม่ใช่ยังโฆษณาเหมือนเดิม
      await page.goto(`/th/property/${made.publicCode}`);
      await expect(page.locator('[data-taken-note]')).toBeVisible();
      await expect(page.locator('[data-taken-note]')).toContainText('ไม่ว่าง');

      // กดกลับเป็นว่างได้ด้วย — ไม่ใช่ทางเดียว
      await page.goto(`/admin/property-edit?code=${made.publicCode}`);
      await expect(page.locator('[data-avail="no"][data-on="1"]'), 'เปิดหน้ามาต้องจำค่าที่บันทึกไว้').toBeVisible();
      await page.locator('[data-avail="yes"]').click();
      await page.getByText('บันทึก', { exact: true }).first().click();
      await expect(page).toHaveURL(/\/admin\/properties$/, { timeout: 15000 });
      await page.goto(`/th/property/${made.publicCode}`);
      await expect(page.locator('[data-taken-note]')).toHaveCount(0);
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });
});

/* คอมเมนต์ลูกค้ากลุ่ม B — ช่องข้อมูลที่ทีมกรอกมาแล้วแต่ระบบทำหาย
   สไลด์ 3  · "รับน้ำหนัก ความสูงหาย"
   สไลด์ 4  · รายการพื้นที่สีที่ใช้จริง 12 สี
   สไลด์ 12 · "เพิ่ม Icon คุณสมบัติ"
   สไลด์ 13 · "การใช้งานที่เหมาะ" 8 รายการ รวม E-Commerce
   สไลด์ 24 · สถานะผู้ติดต่อ เจ้าของ/นายหน้า
   สไลด์ 26 · ระบบไฟ 4 ตัวเลือกพร้อมกระแสแอมป์ */
test.describe('คอมเมนต์ลูกค้า · กลุ่ม B', () => {
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  const VALUES = {
    province: 'สมุทรปราการ',
    deal_type: 'เช่า',
    price_rent: 120000,
    building_area_total: 1500,
    building_height: 12,
    floor_loading: '3 ตัน/ตร.ม.',
    power_phase: '3 Phase 30/100 amp (Upgradeable)',
    power_system: '250 kVA',
    zoning_color: 'พื้นที่สีม่วงลาย — พัฒนาอุตสาหกรรม',
    features: ['มีพื้นที่สำนักงาน', 'รถคอนเทนเนอร์เข้าได้', 'เครนเหนือศีรษะ'],
    usage: ['E-Commerce', 'ศูนย์กระจายสินค้า', 'ครัวกลาง'],
    lessor_status: 'นายหน้า',
  };

  test('การ์ดสรุปมี รับน้ำหนัก และ ความสูง ไม่ใช่ช่องที่ไม่มีใครกรอก', async ({ page, request }) => {
    const cookie = await signIn(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: `ทดสอบการ์ดสรุป ${Date.now().toString(36)}`, status: 'active', values: VALUES },
    })).json();
    try {
      await page.goto(`/th/property/${made.publicCode}`);
      const tiles = await page.locator('#pd-specs > div').allInnerTexts();
      const text = tiles.join(' | ');
      expect(text, 'ความสูงอาคารต้องอยู่ในการ์ดสรุป').toContain('ความสูงอาคาร');
      expect(text, 'รับน้ำหนักพื้นต้องอยู่ในการ์ดสรุป').toContain('รับน้ำหนักพื้น');
      expect(tiles.length, 'ต้องได้การ์ดครบสี่ใบเมื่อข้อมูลครบ').toBe(4);
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('ระบบไฟเก็บกระแสแอมป์ไว้ ไม่ถูกย่อเหลือ 3 เฟส', async ({ page, request }) => {
    const cookie = await signIn(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: `ทดสอบระบบไฟ ${Date.now().toString(36)}`, status: 'active', values: VALUES },
    })).json();
    try {
      await page.goto(`/th/property/${made.publicCode}`);
      const body = await page.locator('body').innerText();
      expect(body).toContain('3 Phase 30/100 amp');
      expect(body, 'ขนาดหม้อแปลงเป็นคนละช่องกับระบบไฟ').toContain('250 kVA');
      // อังกฤษต้องแปลชื่อหัวข้อ ไม่ใช่ทิ้งภาษาไทยไว้
      await page.goto(`/en/property/${made.publicCode}`);
      const en = await page.locator('body').innerText();
      expect(en).toContain('3 phase 30/100 A');
      expect(en).not.toContain('ระบบไฟ');
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('คุณสมบัติมีไอคอนคนละแบบ และการใช้งานที่เหมาะขึ้นหน้าเว็บ', async ({ page, request }) => {
    const cookie = await signIn(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: `ทดสอบไอคอน ${Date.now().toString(36)}`, status: 'active', values: VALUES },
    })).json();
    try {
      await page.goto(`/th/property/${made.publicCode}`);
      const usage = page.locator('[data-usage]');
      await expect(usage, 'การใช้งานที่เหมาะต้องแสดงครบทุกข้อที่กรอก').toHaveCount(3);
      await expect(page.getByText('E-Commerce')).toBeVisible();

      /* ไอคอนต้องไม่ใช่รูปเดียวกันทุกใบ — เทียบเส้น path ของแต่ละอัน */
      const paths = await page.locator('[data-feature] svg').evaluateAll(
        (nodes) => nodes.map((n) => n.innerHTML),
      );
      expect(paths.length).toBe(3);
      expect(new Set(paths).size, 'คุณสมบัติสามข้อต้องได้ไอคอนสามแบบ').toBe(3);
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('พื้นที่สีแสดงเป็นสีจริง ไม่ใช่แค่ชื่อสี', async ({ page, request }) => {
    const cookie = await signIn(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: `ทดสอบจุดสี ${Date.now().toString(36)}`, status: 'active', values: { ...VALUES, zoning_color: 'พื้นที่สีแดง — พาณิชยกรรม' } },
    })).json();
    try {
      await page.goto(`/th/property/${made.publicCode}`);
      const sw = page.locator('[data-zone-swatch]');
      await expect(sw).toBeVisible();
      const bg = await sw.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg, 'สีแดง — พาณิชยกรรม ต้องได้จุดสีแดง').toBe('rgb(213, 52, 43)');
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('สีผังเมืองที่ลูกค้าเพิ่มมาใหม่ เลือกได้และแปลครบสามภาษา', async ({ page, request }) => {
    const cookie = await signIn(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: `ทดสอบสีผังเมือง ${Date.now().toString(36)}`, status: 'active', values: VALUES },
    })).json();
    try {
      for (const [locale, want] of [['th', 'พื้นที่สีม่วงลาย'], ['en', 'Hatched purple'], ['zh', '斜纹紫区']] as const) {
        await page.goto(`/${locale}/property/${made.publicCode}`);
        await expect(page.getByText(want).first(), `${locale} ต้องแปลสีผังเมือง`).toBeVisible();
      }
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });
});

/* สไลด์ 16 · "เพิ่ม ลูกค้า นายหน้า" — ต้องเลือกได้ว่าคนที่ติดต่อมาเป็นลูกค้า
   หรือนายหน้า ฟอร์มแจ้งความต้องการถามอยู่แล้ว แต่กล่องสอบถามบนหน้าทรัพย์ส่งค่า
   "ลูกค้า" ไปตายตัว และลีดที่เซลล์คีย์เองไม่มีช่องนี้เลย */
test.describe('คอมเมนต์ลูกค้า · ลูกค้า/นายหน้า', () => {
  test('เลือกนายหน้าในกล่องสอบถาม แล้วลีดบันทึกว่านายหน้า', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[];
    test.skip(!items.length, 'ยังไม่มีทรัพย์');

    const phone = `08${Date.now().toString().slice(-8)}`;
    await page.goto(`/th/property/${items[0].code}`);
    await page.locator('[data-who="agent"]').click();
    await expect(page.locator('[data-who="agent"][data-on="1"]')).toBeVisible();
    await page.locator('#pd-inquiry input').nth(0).fill('ทดสอบนายหน้า');
    await page.locator('#pd-inquiry input').nth(2).fill(phone);
    await page.locator('#pd-inquiry button[type="submit"]').click();
    await expect(page.locator('#pd-inquiry')).toContainText(/ส่ง|ขอบคุณ/, { timeout: 15000 });

    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    const leads = (await (await request.get('/api/leads?limit=50', { headers: { cookie } })).json());
    const rows = (Array.isArray(leads) ? leads : leads.items) as { id: string; phone: string; respondentType: string }[];
    const mine = rows.find((l) => l.phone === phone);
    expect(mine, 'ต้องเจอลีดที่เพิ่งส่ง').toBeTruthy();
    expect(mine!.respondentType, 'ต้องบันทึกว่าเป็นนายหน้า ไม่ใช่ลูกค้า').toBe('นายหน้า');

    await request.delete(`/api/leads/${mine!.id}`, { headers: { cookie } }).catch(() => null);
  });

  test('ลีดที่เซลล์คีย์เองก็เลือกลูกค้า/นายหน้าได้', async ({ page, request }) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    const name = `ทดสอบคีย์เอง ${Date.now().toString(36)}`;
    await page.goto('/admin/leads');
    await page.getByText('เพิ่ม Lead').first().click();
    await page.locator('input').filter({ hasText: '' }).first().waitFor();
    await page.getByPlaceholder('เช่น บ. ไทยโลจิสติกส์').fill(name);
    await page.locator('[data-lead-who]').selectOption('นายหน้า');
    await page.locator('#lead-create-save').click();

    await expect.poll(async () => {
      const res = await (await request.get('/api/leads?limit=50', { headers: { cookie } })).json();
      const rows = (Array.isArray(res) ? res : res.items) as { name: string; respondentType: string }[];
      return rows.find((l) => l.name === name)?.respondentType ?? null;
    }, { timeout: 15000 }).toBe('นายหน้า');

    const res = await (await request.get('/api/leads?limit=50', { headers: { cookie } })).json();
    const rows = (Array.isArray(res) ? res : res.items) as { id: string; name: string }[];
    const made = rows.find((l) => l.name === name);
    if (made) await request.delete(`/api/leads/${made.id}`, { headers: { cookie } }).catch(() => null);
  });
});

/* สไลด์ 22 · "Property และ Listings Social Status ต้องแสดงผลเหมือนกัน เมนู
   ค้นหาด้วย" แล้วไล่ช่องไว้เจ็ดข้อ — เดิมสามหน้านี้มีตัวกรองคนละชุด
   (Property: ประเภท/จังหวัด/สถานะ · Listings: ประเภท/จังหวัด/ดีล/แนะนำ ·
   Social Status: มีแต่ช่องค้นหา) */
test.describe('คอมเมนต์ลูกค้า · เมนูค้นหาชุดเดียวกัน', () => {
  const PAGES = ['/admin/properties', '/admin/listings', '/admin/social-status'];
  const WANT = ['type', 'zoning', 'deal', 'size', 'price', 'avail'];

  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
  };

  test('ทั้งสามหน้ามีเมนูค้นหาชุดเดียวกันครบเจ็ดช่อง', async ({ page }) => {
    await signIn(page);
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator('[data-inventory-filters]'), `${path} ต้องมีเมนูค้นหาชุดร่วม`).toBeVisible();
      await expect(page.locator('[data-filter-q]'), `${path} ต้องค้นหาด้วยชื่อได้`).toBeVisible();
      for (const key of WANT) {
        await expect(page.locator(`[data-filter="${key}"]`), `${path} ขาดตัวกรอง ${key}`).toBeVisible();
      }
    }
  });

  test('กรองพื้นที่สีแล้วรายการหดจริง ไม่ใช่ปุ่มเปลี่ยนสีเฉย ๆ', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/properties');
    const rows = page.locator('#prop-table tbody tr, table tbody tr');
    await expect.poll(() => rows.count(), { timeout: 15000 }).toBeGreaterThan(1);
    const before = await rows.count();

    await page.locator('[data-filter="zoning"]').click();
    await page.locator('[data-filter-opt]').first().click();
    await expect(page.locator('[data-filter="zoning"][data-on="1"]')).toBeVisible();

    const after = await rows.count();
    expect(after, 'กรองแล้วต้องเหลือน้อยกว่าเดิม').toBeLessThan(before);

    await page.locator('[data-filter-clear]').click();
    await expect.poll(() => rows.count()).toBe(before);
  });
});

/* สไลด์ 11/12 · "ไม่มีแท็ค" · "กดแล้วไม่ไปตามแท็ค" · "โซนแสดงผลไม่ตรง" */
test.describe('คอมเมนต์ลูกค้า · แท็ก', () => {
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  test('แท็กบนหน้าทรัพย์กดแล้วไปหน้ารายการที่กรองไว้จริง', async ({ page, request }) => {
    const cookie = await signIn(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse',
        title: `ทดสอบแท็ก ${Date.now().toString(36)}`,
        status: 'active',
        values: {
          province: 'สมุทรปราการ', deal_type: 'ให้เช่า', price_rent: 150000,
          zoning_color: 'พื้นที่สีม่วง — อุตสาหกรรม', building_area_total: 2000,
        },
      },
    })).json();

    try {
      await page.goto(`/th/property/${made.publicCode}`);
      for (const key of ['type', 'deal', 'province', 'zoning']) {
        await expect(page.locator(`[data-tag="${key}"]`), `ขาดแท็ก ${key}`).toBeVisible();
      }

      /* กดแท็กพื้นที่สี — ต้องไปหน้ารายการ "และกรองให้แล้ว" ไม่ใช่ไปหน้าเปล่า */
      await page.locator('[data-tag="zoning"]').click();
      await expect(page).toHaveURL(/\/listing\?zone=/);
      await expect(page.locator(`[data-card="${made.publicCode}"]`), 'ทรัพย์ที่กดมาต้องอยู่ในผลลัพธ์').toBeVisible();
      const cards = await page.locator('[data-card]').count();
      const total = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items.length as number;
      expect(cards, 'ถ้ากรองจริง ผลลัพธ์ต้องน้อยกว่าทั้งคลัง').toBeLessThan(total);
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('หัวข้อพื้นที่สีบอกว่าพื้นที่สี ไม่ใช่ประเภทโซน', async ({ page, request }) => {
    const cookie = await signIn(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse', title: `ทดสอบหัวข้อโซน ${Date.now().toString(36)}`, status: 'active',
        values: { province: 'สมุทรปราการ', deal_type: 'ให้เช่า', zoning_color: 'พื้นที่สีม่วง — อุตสาหกรรม' },
      },
    })).json();
    try {
      await page.goto(`/th/property/${made.publicCode}`);
      await expect(page.locator('[data-tag="zoning"]')).toBeVisible();
      await expect(page.getByText('พื้นที่สี (ผังเมือง)').first()).toBeVisible();
      await expect(page.getByText('ประเภทโซน'), 'หัวข้อเดิมเรียกผิด').toHaveCount(0);
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('หน้ารายการมีตัวกรองพื้นที่สีแยกจากทำเล', async ({ page }) => {
    await page.goto('/th/listing');
    await expect(page.getByText('พื้นที่สี (ผังเมือง)').first(), 'ต้องมีหมวดพื้นที่สี').toBeVisible();
    await expect(page.getByText('ทำเล').first(), 'และหมวดทำเลแยกกัน').toBeVisible();
  });

  /* ตัวเลือกที่ติ๊กแล้วไม่เจออะไรเลยคือตัวเลือกที่ไม่ควรมี */
  test('ตัวกรองประเภทมีเฉพาะประเภทที่มีทรัพย์จริง และติ๊กแล้วกรองได้', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as { typeKey: string }[];
    test.skip(!items.length, 'ยังไม่มีทรัพย์');
    const kinds = new Set(items.map((i) => i.typeKey));

    await page.goto('/th/listing');
    const opts = page.locator('[data-filter-opt="type"]');
    await expect(opts.first()).toBeVisible();
    expect(await opts.count(), 'ตัวเลือกประเภทต้องไม่เกินจำนวนประเภทที่มีของจริง').toBeLessThanOrEqual(kinds.size);

    const before = await page.locator('[data-card]').count();
    await opts.first().click();
    await expect(page.locator('[data-filter-opt="type"][data-checked="1"]')).toHaveCount(1);
    const after = await page.locator('[data-card]').count();
    expect(after, 'ติ๊กแล้วต้องได้ผลลัพธ์ ไม่ใช่ว่างเปล่า').toBeGreaterThan(0);
    expect(after, 'และต้องกรองจริง').toBeLessThanOrEqual(before);
  });
});

/* สไลด์ 9/14 · "ใช้ระบบเมนูเดียวกัน — ทำตัวกรองให้เหมือนรูปด้านซ้าย"
   เดิมมีตัวกรองสองชุด: หน้าแรกมี ทำเล·พื้นที่สี·คุณสมบัติ·รับน้ำหนัก ส่วนหน้า
   รายการมี ทำเล·ประเภท·ขนาด·ราคา และแผงบนหน้าแรกก็เก็บค่าไว้เฉย ๆ ไม่เคยส่ง
   ไปไหน อีกทั้งตัวเลือกก็เป็นคำที่พิมพ์ไว้ในไฟล์ ไม่ตรงกับข้อมูลจริงสักคำ */
test.describe('คอมเมนต์ลูกค้า · ตัวกรองชุดเดียวกัน', () => {
  test('หน้ารายการมีทุกหมวดที่หน้าแรกมี และตัวเลือกบนหน้าแรกก็เป็นค่าจริง', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as { features: string[]; zoning: string }[];
    const realFeatures = new Set(items.flatMap((i) => i.features ?? []));

    await page.goto('/th');
    await page.getByText('ตัวกรองเพิ่มเติม').first().click();
    const homeFeatures = await page.locator('[data-more-opt="feature"]').allInnerTexts();
    expect(homeFeatures.length, 'แผงบนหน้าแรกต้องมีหมวดคุณสมบัติ').toBeGreaterThan(0);
    for (const o of homeFeatures) {
      expect(realFeatures.has(o.trim()), `หน้าแรกเสนอ "${o.trim()}" ซึ่งไม่มีในข้อมูลจริง`).toBe(true);
    }

    await page.goto('/th/listing');
    for (const title of ['ทำเล', 'พื้นที่สี (ผังเมือง)', 'ประเภทอสังหา', 'ขนาดพื้นที่', 'ช่วงราคา']) {
      await expect(page.getByText(title, { exact: true }).first(), `หน้ารายการขาดหมวด ${title}`).toBeVisible();
    }
  });

  test('ตัวเลือกคุณสมบัติตรงกับค่าที่บันทึกจริง ไม่ใช่คำที่พิมพ์ไว้ในไฟล์', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as { features: string[] }[];
    const real = new Set(items.flatMap((i) => i.features ?? []));
    test.skip(!real.size, 'ยังไม่มีทรัพย์ที่กรอกคุณสมบัติ');

    await page.goto('/th/listing');
    const opts = await page.locator('[data-filter-opt="feature"]').allInnerTexts();
    expect(opts.length, 'หน้ารายการต้องมีหมวดคุณสมบัติ').toBeGreaterThan(0);
    for (const o of opts) {
      expect(real.has(o.trim()), `ตัวเลือก "${o.trim()}" ไม่มีอยู่ในข้อมูลจริง`).toBe(true);
    }
  });

  test('กรองจากหน้าแรกแล้วหน้ารายการกรองตามจริง', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as { code: string; features: string[] }[];
    const feature = items.flatMap((i) => i.features ?? [])[0];
    test.skip(!feature, 'ยังไม่มีทรัพย์ที่กรอกคุณสมบัติ');
    const want = items.filter((i) => (i.features ?? []).includes(feature)).length;
    test.skip(want === items.length, 'คุณสมบัตินี้มีทุกรายการ กรองแล้ววัดผลไม่ได้');

    await page.goto(`/th/listing?feature=${encodeURIComponent(feature)}`);
    await expect(page.locator('[data-filter-opt="feature"][data-checked="1"]'), 'ต้องติ๊กมาให้แล้วตามลิงก์').toHaveCount(1);
    const shown = await page.locator('[data-card]').count();
    expect(shown, 'ต้องกรองจริง ไม่ใช่แสดงทั้งคลัง').toBeLessThan(items.length);
    expect(shown).toBeGreaterThan(0);
  });
});

/* หน้าประเภท/ทำเลทุกหน้ากรองด้วย preset ที่เขียนชื่อประเภทเป็นข้อความไว้ในไฟล์
   พอเปลี่ยนชื่อประเภทตามสไลด์ 22 ("โกดัง / คลังสินค้า" → "โกดัง") preset ก็ชี้
   ไปที่คำที่ไม่มีอยู่แล้ว หน้าโกดังให้เช่าและโกดังขายจึงว่างเปล่าทั้งหน้า
   โดยไม่มีอะไรฟ้อง

   เทสต์นี้นับจาก API เองว่าหน้านั้นควรมีกี่รายการ แล้วเทียบกับที่หน้าแสดงจริง
   หน้าที่ไม่มีของเพราะคลังไม่มีจริง ๆ จะถูกข้าม ไม่ใช่ถูกนับว่าผ่าน */
type Pub = { code: string; dealKey: string; typeKey: string; province: string };

test.describe('หน้าประเภทและทำเลต้องไม่ว่างเปล่าเมื่อมีของ', () => {
  const PAGES: { path: string; want: (r: Pub) => boolean }[] = [
    { path: 'warehouse-rent', want: (r) => r.typeKey === 'warehouse' && ['rent', 'both'].includes(r.dealKey) },
    { path: 'warehouse-sale', want: (r) => r.typeKey === 'warehouse' && ['sale', 'both'].includes(r.dealKey) },
    { path: 'factory-rent', want: (r) => r.typeKey === 'factory' && ['rent', 'both'].includes(r.dealKey) },
    { path: 'factory-sale', want: (r) => r.typeKey === 'factory' && ['sale', 'both'].includes(r.dealKey) },
    { path: 'bangkok-cbd', want: (r) => r.province.includes('กรุงเทพ') },
    { path: 'bangkok-nonthaburi', want: (r) => r.province.includes('นนทบุรี') },
    { path: 'airport-suvarnabhumi', want: (r) => r.province.includes('สมุทรปราการ') },
    { path: 'airport-donmuang', want: (r) => r.province.includes('ปทุมธานี') },
    { path: 'port-laem-chabang', want: (r) => r.province.includes('ชลบุรี') },
    { path: 'port-mahachai', want: (r) => r.province.includes('สมุทรสาคร') },
    { path: 'port-map-ta-phut', want: (r) => r.province.includes('ระยอง') },
  ];

  for (const { path, want } of PAGES) {
    test(`/${path} แสดงทรัพย์ที่ควรอยู่ในหน้านั้น`, async ({ page, request }) => {
      const rows = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as Pub[];
      const expected = rows.filter(want).length;
      test.skip(!expected, 'คลังไม่มีทรัพย์ที่เข้าเกณฑ์หน้านี้');

      await page.goto(`/th/${path}`);
      const shown = await page.locator('[data-card]').count();
      expect(shown, `ควรมี ${expected} รายการ แต่หน้านี้ไม่แสดงอะไรเลย`).toBeGreaterThan(0);
    });
  }
});

/* กล่อง "ตำแหน่งทรัพย์" บนหน้าทรัพย์เป็นพื้นสีเทาเปล่า ๆ มีแต่ลิงก์ไป Google
   Maps ทั้งที่หัวข้อเขียนว่า "แสดงระดับพื้นที่เพื่อความเป็นส่วนตัว" — คนดูไม่
   เห็นเลยว่าทรัพย์อยู่แถวไหนจนกว่าจะกดออกจากเว็บ */
test.describe('คอมเมนต์ลูกค้า · แผนที่ในหน้าทรัพย์', () => {
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  test('มีแผนที่จริง และไม่บอกพิกัดที่แน่นอน', async ({ page, request, context }) => {
    const cookie = await signIn(page);
    const exact = { lat: 13.6394834985, lng: 100.5932590266 };
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse', title: `ทดสอบแผนที่ ${Date.now().toString(36)}`, status: 'active',
        values: { province: 'สมุทรปราการ', deal_type: 'ให้เช่า', location_map: exact },
      },
    })).json();

    try {
      // ยอมให้โหลดแผนที่จากภายนอกก่อน เหมือนคนที่กดยอมรับคุกกี้
      await context.addInitScript(() => {
        window.localStorage.setItem('jkp.consent.v1', JSON.stringify({ v: 1, ts: new Date().toISOString(), embeds: true }));
      });
      /* นับว่ามีการขอภาพแผนที่จริง — ไม่ผูกกับว่าเครื่องที่รันเทสต์ต่อเน็ตออก
         ไปถึง CDN ได้หรือไม่ */
      const tiles: string[] = [];
      page.on('request', (r) => { if (/cartocdn/.test(r.url())) tiles.push(r.url()); });
      await page.goto(`/th/property/${made.publicCode}`);

      const map = page.locator('[data-area-map="on"]');
      await expect(map, 'ต้องมีแผนที่จริง ไม่ใช่กล่องเปล่า').toBeVisible();
      await expect(map, 'leaflet ต้องผูกกับกล่องนี้จริง').toHaveClass(/leaflet-container/, { timeout: 15000 });
      // วาดเป็นพื้นที่ ไม่ใช่หมุดชี้จุด
      await expect(map.locator('svg path').first(), 'ต้องวาดเป็นวงพื้นที่ ไม่ใช่หมุดชี้จุด').toBeVisible({ timeout: 15000 });
      expect(tiles.length, 'ต้องขอภาพแผนที่จาก CDN จริง').toBeGreaterThan(0);

      /* พิกัดจริงต้องไม่หลุดไปกับหน้าเว็บเลย แม้แต่ใน JSON ที่ฝังมากับ HTML */
      const html = await page.content();
      expect(html.includes('13.6394834985'), 'ละติจูดจริงหลุดออกไป').toBe(false);
      expect(html.includes('100.5932590266'), 'ลองจิจูดจริงหลุดออกไป').toBe(false);
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('ยังไม่ยอมรับคุกกี้ ต้องไม่ยิงไปหาเซิร์ฟเวอร์แผนที่', async ({ page, context, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[];
    test.skip(!items.length, 'ยังไม่มีทรัพย์');

    /* ทั้งชุดเทสต์ตั้งค่าว่ายอมรับคุกกี้ไว้แล้วเหมือนคนที่เคยเข้ามา — เทสต์นี้
       ต้องย้อนกลับไปเป็นคนที่ยังไม่ได้ตอบ */
    await context.addInitScript(() => window.localStorage.removeItem('jkp.consent.v1'));

    const external: string[] = [];
    page.on('request', (r) => { if (/cartocdn|openstreetmap/.test(r.url())) external.push(r.url()); });
    await page.goto(`/th/property/${items[0].code}`);
    await page.waitForTimeout(1500);
    expect(external, 'ยังไม่ได้รับความยินยอม แต่ยิงไปโหลดแผนที่แล้ว').toEqual([]);
  });
});
