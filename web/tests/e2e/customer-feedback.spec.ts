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

  test('ทั้งสามหน้ามีเมนูค้นหาชุดเดียวกัน', async ({ page, request }) => {
    await signIn(page);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    /* สไลด์ 22 แก้เพิ่มข้อ 8 "ชื่อคนลงประกาศ หรือ PIC" ทีหลัง — ตัวกรองนี้ขึ้น
       เฉพาะเมื่อมีทรัพย์ที่ระบุผู้ดูแลไว้จริง ตัวเลือกที่ติ๊กแล้วไม่เจออะไรคือ
       ตัวเลือกที่ไม่ควรมี */
    const items = (await (await request.get('/api/listings', { headers: { cookie } })).json()).items as { pic: string }[];
    const hasPic = items.some((i) => i.pic);

    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator('[data-inventory-filters]'), `${path} ต้องมีเมนูค้นหาชุดร่วม`).toBeVisible();
      await expect(page.locator('[data-filter-q]'), `${path} ต้องค้นหาด้วยชื่อได้`).toBeVisible();
      for (const key of WANT) {
        await expect(page.locator(`[data-filter="${key}"]`), `${path} ขาดตัวกรอง ${key}`).toBeVisible();
      }
      await expect(
        page.locator('[data-filter="pic"]'),
        hasPic ? `${path} ขาดตัวกรองผู้ดูแล ทั้งที่มีข้อมูล` : `${path} ไม่ควรเสนอตัวกรองผู้ดูแล เพราะยังไม่มีทรัพย์ไหนระบุไว้`,
      ).toHaveCount(hasPic ? 1 : 0);
    }
  });

  test('กรองด้วยผู้ดูแล (PIC) แล้วเหลือเฉพาะของคนนั้น', async ({ page, request }) => {
    await signIn(page);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const items = (await (await request.get('/api/listings', { headers: { cookie } })).json()).items as { pic: string }[];
    const pics = items.map((i) => i.pic).filter(Boolean);
    test.skip(!pics.length, 'ยังไม่มีทรัพย์ที่ระบุผู้ดูแล');
    const one = pics[0];
    const want = pics.filter((p) => p === one).length;
    test.skip(want === items.length, 'ทุกรายการเป็นของคนเดียวกัน กรองแล้ววัดผลไม่ได้');

    await page.goto('/admin/listings');
    const rows = page.locator('table tbody tr');
    await expect.poll(() => rows.count(), { timeout: 15000 }).toBeGreaterThan(want);

    await page.locator('[data-filter="pic"]').click();
    await page.locator(`[data-filter-opt="${one}"]`).click();
    await expect(page.locator('[data-filter="pic"][data-on="1"]')).toBeVisible();
    await expect.poll(() => rows.count()).toBe(want);
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
    /* ทำเลแยกเป็นสามชั้นแล้ว (สไลด์ 9) — พื้นที่สีต้องยังเป็นคนละหมวดกับทำเล */
    await expect(page.getByText('จังหวัด', { exact: true }).first(), 'และหมวดทำเลแยกต่างหาก').toBeVisible();
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
    for (const title of ['จังหวัด', 'เขต / อำเภอ', 'แขวง / ตำบล', 'พื้นที่สี (ผังเมือง)', 'ประเภทอสังหา', 'ขนาดพื้นที่', 'ช่วงราคา']) {
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

/* หน้าติดต่อมีการ์ดสามใบเรียงกัน แต่วงกลมไอคอนเป็นคนละสีทั้งสามใบ (เขียวเข้ม ·
   ทอง · ดำอมเขียว) ลูกค้าชี้ว่า "ใช้สีเดียวกับข้างบน" */
test.describe('คอมเมนต์ลูกค้า · ไอคอนหน้าติดต่อ', () => {
  test('วงกลมไอคอนทั้งสามใบเป็นสีเดียวกัน', async ({ page }) => {
    await page.goto('/th/contact');
    /* อ่านสีพื้นหลังจริงของวงกลมที่ครอบไอคอนในการ์ดข้อมูลติดต่อ */
    const colors = await page.evaluate(() => {
      const out: string[] = [];
      for (const svg of Array.from(document.querySelectorAll('svg'))) {
        const box = svg.parentElement;
        if (!box) continue;
        const st = getComputedStyle(box);
        // วงกลมไอคอน: กลม พื้นทึบ ขนาดราว 44–56px
        if (st.borderRadius.startsWith('9999') || parseInt(st.borderRadius) > 20) {
          const w = box.getBoundingClientRect().width;
          if (w >= 40 && w <= 60 && st.backgroundColor !== 'rgba(0, 0, 0, 0)') out.push(st.backgroundColor);
        }
      }
      return out;
    });

    expect(colors.length, 'ต้องเจอวงกลมไอคอนอย่างน้อยสามใบ').toBeGreaterThanOrEqual(3);
    expect(new Set(colors).size, `ยังมี ${new Set(colors).size} สี: ${[...new Set(colors)].join(' · ')}`).toBe(1);
  });
});

/* กลุ่ม D · สไลด์ 35/37 — คำถามว่า "ใช้ยังไง" ที่เป็นเรื่องของข้อมูลที่หายไป
   จากหน้าจอ ไม่ใช่เรื่องอธิบายเพิ่ม
     "REQ เช็คอย่างไร"           ช่องบันทึกผลเช็คให้พิมพ์รหัสทรัพย์ที่คนคีย์ไม่รู้
     "นำเบอร์เจ้าของมาจากไหน"     เบอร์ผู้ติดต่อไม่เคยอยู่บนหน้านี้เลย
     "ชื่อลูกค้าหรือบริษัทอยู่ตรงไหน" หน้ามีแต่รหัส REQ-xxxx
     "จำเป็นต้องมีรูป"            คนทำงานหลายคน ดูรหัสอย่างเดียวยืนยันไม่ได้ */
test.describe('คอมเมนต์ลูกค้า · หน้า Requirement', () => {
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  /** สร้าง lead + requirement ของตัวเอง เพื่อไม่ต้องพึ่งข้อมูลที่บังเอิญมีอยู่ */
  const makeReq = async (request: import('@playwright/test').APIRequestContext, cookie: string) => {
    const tag = Date.now().toString(36);
    const lead = await (await request.post('/api/leads', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { name: `บ. ทดสอบ REQ ${tag}`, company: `คุณทดสอบ ${tag}`, phone: '081-234-5678', respondentType: 'ลูกค้า' },
    })).json();
    const req = await (await request.post('/api/requirements', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { leadId: lead.id, dealIntent: 'เช่า', typeKey: 'warehouse', areaMin: 500, areaMax: 5000 },
    })).json();
    return { lead, req };
  };

  test('หน้า REQ บอกว่าทำแผนให้ลูกค้าเจ้าไหน และโทรที่เบอร์ไหน', async ({ page, request }) => {
    const cookie = await signIn(page);
    const { lead, req } = await makeReq(request, cookie);
    try {
      await page.goto(`/admin/requirements/${req.id}`);
      const card = page.locator('[data-req-customer]');
      await expect(card, 'ต้องบอกว่าเป็นของลูกค้าเจ้าไหน').toBeVisible();
      await expect(card).toContainText(lead.company || lead.name);
      await expect(page.locator('[data-req-lead-phone]'), 'ต้องมีเบอร์ลูกค้าให้กดโทร').toHaveAttribute('href', /^tel:\+?\d+$/);
    } finally {
      await request.delete(`/api/leads/${lead.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('เลือกทรัพย์จากรายการที่มีรูป ไม่ใช่พิมพ์รหัสที่ไม่รู้', async ({ page, request }) => {
    const cookie = await signIn(page);
    const { lead, req } = await makeReq(request, cookie);
    try {
      await page.goto(`/admin/requirements/${req.id}`);
      await page.locator('#req-add-check').click();

      const cands = page.locator('[data-candidate]');
      await expect(cands.first(), 'ต้องมีรายการทรัพย์ให้เลือก').toBeVisible({ timeout: 15000 });
      /* แต่ละแถวต้องบอกได้ว่าคือทรัพย์ไหน ไม่ใช่แค่รหัส */
      const first = cands.first();
      await expect(first.locator('img, div').first()).toBeVisible();

      await first.click();
      await expect(page.locator('[data-check-picked]'), 'เลือกแล้วต้องยืนยันว่าเป็นตัวไหน').toBeVisible();

      // บันทึกได้จริง ไม่ใช่แค่เลือกแล้วจบ
      await page.locator('[data-check-result="available"]').click();
      await page.locator('#req-check-save, [data-check-save]').first().click();
      await expect(page.locator('[data-check]').first(), 'ผลการเช็คต้องขึ้นในรายการ').toBeVisible({ timeout: 15000 });
    } finally {
      await request.delete(`/api/leads/${lead.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('รายการทรัพย์ที่เสนอ พกเบอร์เจ้าของมาด้วย', async ({ page, request }) => {
    const cookie = await signIn(page);
    const { lead, req } = await makeReq(request, cookie);
    try {
      const cands = (await (await request.get(`/api/requirements/${req.id}/candidates`, { headers: { cookie } })).json()).items as
        { code: string; contactPhone: string; img: string | null }[];
      test.skip(!cands.length, 'ยังไม่มีทรัพย์ในระบบ');
      const withPhone = cands.filter((c) => c.contactPhone).length;
      expect(withPhone, 'ทรัพย์ที่กรอกเบอร์ไว้ ต้องส่งเบอร์มาให้โทรได้').toBeGreaterThan(0);
    } finally {
      await request.delete(`/api/leads/${lead.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('เบอร์เจ้าของต้องไม่หลุดออกไปทางหน้าเว็บสาธารณะ', async ({ request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=5')).json()).items as { code: string }[];
    test.skip(!items.length, 'ยังไม่มีทรัพย์');
    const raw = await (await request.get(`/api/public/properties/${items[0].code}?locale=th`)).text();
    expect(raw.includes('lessor_phone'), 'เบอร์เจ้าของหลุดออก API สาธารณะ').toBe(false);
  });
});

/* สไลด์ 36 · "Leads ไม่มีให้คีย์ข้อมูลความต้องการลูกค้า ตาม GG Form ที่ส่งให้
   สำหรับเซลล์" — ฟอร์มบนหน้า /contact ถามครบทั้งประเภททรัพย์ · เช่า/ซื้อ ·
   พื้นที่ · ทำเล · งบ · รายละเอียด แล้วเปิดใบงาน Requirement ให้ทันที
   ส่วนลีดที่เซลล์คีย์เองในหลังบ้านเก็บได้แค่ชื่อกับเบอร์ */
test.describe('คอมเมนต์ลูกค้า · เพิ่ม Lead ในหลังบ้าน', () => {
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  test('เก็บความต้องการครบเหมือนฟอร์มหน้าติดต่อ และเปิดใบงานให้เอง', async ({ page, request }) => {
    const cookie = await signIn(page);
    const name = `บ. ทดสอบคีย์เอง ${Date.now().toString(36)}`;

    await page.goto('/admin/leads');
    await page.getByText('เพิ่ม Lead').first().click();
    await page.getByPlaceholder('เช่น บ. ไทยโลจิสติกส์').fill(name);
    await page.getByPlaceholder('เช่น คุณสมชาย').fill('คุณทดสอบ');
    await page.getByPlaceholder('+66 8x-xxx-xxxx').fill('081-999-8888');

    // ช่องที่หน้าติดต่อมี แต่หลังบ้านไม่เคยมี
    await page.locator('[data-lead-type]').selectOption('factory');
    await page.locator('[data-lead-deal]').selectOption('เช่า');
    await page.locator('[data-lead-area]').fill('1500');
    await page.locator('[data-lead-location]').fill('บางนา, สมุทรปราการ');
    await page.locator('[data-lead-budget]').fill('150,000/เดือน');
    await page.locator('[data-lead-message]').fill('ลูกค้าโทรมาถามเมื่อเช้า');
    await page.locator('#lead-create-save').click();

    /* ลีดต้องเก็บความต้องการไว้จริง */
    type SavedLead = { id: string; name: string; typeKey: string; message: string; req: { k: string; v: string }[] };
    const findLead = async (): Promise<SavedLead | undefined> => {
      const res = await (await request.get('/api/leads?limit=50', { headers: { cookie } })).json();
      const rows = (Array.isArray(res) ? res : res.items) as SavedLead[];
      return rows.find((l) => l.name === name);
    };
    await expect.poll(async () => (await findLead())?.id ?? null, { timeout: 15000 }).not.toBeNull();
    const saved = (await findLead())!;

    expect(saved.typeKey, 'ประเภททรัพย์').toBe('factory');
    expect(saved.message, 'รายละเอียดที่พิมพ์ไว้').toContain('ลูกค้าโทรมาถามเมื่อเช้า');
    const req = JSON.stringify(saved.req ?? []);
    expect(req, 'พื้นที่ที่ต้องการ').toContain('1500');
    expect(req, 'ทำเล').toContain('บางนา');
    expect(req, 'งบ').toContain('150,000');

    /* และต้องเปิดใบงาน Requirement ให้เหมือนที่ฟอร์มบนเว็บทำ ไม่ใช่จบแค่แถวลีด */
    const reqs = (await (await request.get('/api/requirements?limit=50', { headers: { cookie } })).json());
    const list = (Array.isArray(reqs) ? reqs : reqs.items) as { leadId: string; code: string; areaMin: number | null }[];
    const mine = list.find((r) => r.leadId === saved.id);
    expect(mine, 'ต้องมีใบงาน Requirement ให้ทีมทำงานต่อ').toBeTruthy();
    expect(mine!.code).toMatch(/^REQ-/);

    await request.delete(`/api/leads/${saved.id}`, { headers: { cookie } }).catch(() => null);
  });
});

/* หน้า Leads · "เพิ่มปุ่มแชร์ลิงก์หน้าให้ลูกค้ากรอกข้อมูล เพิ่ม lead แบบหน้า
   contact" — ฟอร์มนั้นมีอยู่แล้วบน /contact แต่เซลล์ต้องไปก๊อป URL เอาเอง
   และลูกค้าต่างชาติก็ต้องได้ลิงก์คนละภาษา */
test.describe('คอมเมนต์ลูกค้า · ปุ่มแชร์ลิงก์ในหน้า Leads', () => {
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
  };

  test('ลิงก์ที่แชร์พาไปที่ฟอร์มจริง และเปลี่ยนภาษาได้', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/leads');
    await page.locator('#lead-sharebtn').click();

    const url = page.locator('[data-share-url]');
    await expect(url).toContainText('/th/contact#lead-form');

    await page.locator('[data-share-lang="zh"]').click();
    await expect(url, 'ลูกค้าต่างชาติต้องได้ลิงก์ภาษาของเขา').toContainText('/zh/contact#lead-form');

    /* ลิงก์ต้องเปิดได้จริงและมีฟอร์มอยู่ตรงนั้น ไม่ใช่พาไปหน้าเปล่า */
    const href = await page.locator('#lead-share-open').getAttribute('href');
    await page.goto(href!);
    await expect(page.locator('#lead-form')).toBeVisible();
    /* ลิงก์ที่กำลังทดสอบเป็นภาษาจีน จึงเช็คว่ามีฟอร์มให้กรอกจริง ไม่ใช่เช็คคำไทย */
    expect(await page.locator('#lead-form input').count(), 'ต้องมีช่องให้กรอก').toBeGreaterThan(2);
  });

  test('ลูกค้ากรอกจากลิงก์นั้นแล้ว lead เข้าระบบจริง', async ({ page, request }) => {
    await signIn(page);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    await page.goto('/admin/leads');
    await page.locator('#lead-sharebtn').click();
    const href = (await page.locator('#lead-share-open').getAttribute('href'))!;

    // เดินตามลิงก์เหมือนลูกค้า แล้วกรอกฟอร์ม
    const name = `ลูกค้าจากลิงก์ ${Date.now().toString(36)}`;
    const phone = `08${Date.now().toString().slice(-8)}`;
    await page.goto(href);
    await page.locator('#lead-form').getByPlaceholder('กรอกชื่อของคุณ').fill(name);
    await page.locator('#lead-form').getByPlaceholder('08x-xxx-xxxx').fill(phone);
    await page.locator('#lead-form').getByRole('button', { name: 'ลูกค้า', exact: true }).click();
    await page.locator('#lead-form').getByRole('button', { name: /ส่ง/ }).first().click();

    await expect.poll(async () => {
      const res = await (await request.get('/api/leads?limit=50', { headers: { cookie } })).json();
      const rows = (Array.isArray(res) ? res : res.items) as { phone: string }[];
      return rows.some((l) => l.phone === phone);
    }, { timeout: 15000 }).toBe(true);

    const res = await (await request.get('/api/leads?limit=50', { headers: { cookie } })).json();
    const rows = (Array.isArray(res) ? res : res.items) as { id: string; phone: string }[];
    const made = rows.find((l) => l.phone === phone);
    if (made) await request.delete(`/api/leads/${made.id}`, { headers: { cookie } }).catch(() => null);
  });
});

/* สไลด์ 40 (แก้เพิ่มหลังรอบแรก)
     "Visits — ปุ่มยกเลิกนัดหาย · ยกเลิกต้องระบุข้อความด้วย"
     "ทำไม 1 Leads เปิดใบงานได้หลายใบ — ต้องเปิด REQ และแก้ไขจนจบขั้นตอน
      เป็นรอบไป ถึงจะเปิด REQ ใหม่ได้" */
test.describe('คอมเมนต์ลูกค้า · ยกเลิกนัด และใบงานค้าง', () => {
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  test('ยกเลิกนัดได้ แต่ต้องบอกเหตุผล', async ({ page, request }) => {
    const cookie = await signIn(page);
    const props = (await (await request.get('/api/properties', { headers: { cookie } })).json()).items as { publicCode: string; status: string }[];
    const code = props.find((p) => p.status === 'active')?.publicCode;
    test.skip(!code, 'ยังไม่มีทรัพย์ที่เผยแพร่');

    const when = new Date();
    when.setDate(when.getDate() + 3);
    const visit = await (await request.post('/api/visits', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { date: when.toISOString(), codes: [code] },
    })).json();

    try {
      /* เซิร์ฟเวอร์ต้องไม่ยอมให้ยกเลิกลอย ๆ แม้จะยิงตรงมาที่ API */
      const bare = await request.patch(`/api/visits/${visit.id}`, {
        headers: { cookie, 'Content-Type': 'application/json' },
        data: { status: 'cancelled' },
      });
      expect(bare.status(), 'ยกเลิกโดยไม่ให้เหตุผลต้องถูกปฏิเสธ').toBe(400);

      await page.goto(`/admin/visits/${visit.id}`);
      await page.locator('#visit-cancel').click();
      await page.locator('#visit-cancel-save').click();
      await expect(page.locator('#visit-cancel-error'), 'ไม่กรอกเหตุผลต้องเตือน').toBeVisible();

      await page.locator('#visit-cancel-why').fill('ลูกค้าติดประชุม ขอเลื่อนสัปดาห์หน้า');
      await page.locator('#visit-cancel-save').click();
      await expect(page.locator('#visit-cancelled')).toBeVisible({ timeout: 15000 });

      /* เหตุผลต้องถูกเก็บไว้จริง ไม่ใช่แค่เปลี่ยนสถานะบนหน้าจอ */
      const list = (await (await request.get('/api/visits', { headers: { cookie } })).json()).items as
        { id: string; status: string; note: string | null }[];
      const after = list.find((v) => v.id === visit.id)!;
      expect(after.status).toBe('cancelled');
      expect(String(after.note ?? ''), 'เหตุผลที่ยกเลิกต้องถูกบันทึก').toContain('ติดประชุม');
    } finally {
      await request.delete(`/api/visits/${visit.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('ลูกค้ารายเดียวเปิดใบงานค้างได้ทีละใบ', async ({ page, request }) => {
    const cookie = await signIn(page);
    const lead = await (await request.post('/api/leads', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { name: `บ. ทดสอบใบงานซ้ำ ${Date.now().toString(36)}`, phone: '081-000-0000' },
    })).json();

    try {
      const first = await request.post('/api/requirements', {
        headers: { cookie, 'Content-Type': 'application/json' },
        data: { leadId: lead.id, dealIntent: 'เช่า' },
      });
      expect(first.status(), 'ใบแรกต้องเปิดได้').toBe(201);
      const req1 = await first.json();

      const second = await request.post('/api/requirements', {
        headers: { cookie, 'Content-Type': 'application/json' },
        data: { leadId: lead.id, dealIntent: 'เช่า' },
      });
      expect(second.status(), 'ใบที่สองต้องถูกปฏิเสธระหว่างที่ใบแรกยังค้าง').toBe(409);
      expect(JSON.stringify(await second.json()), 'ต้องบอกว่าใบไหนค้างอยู่').toContain(req1.code);

      /* ปิดรอบแรกแล้วต้องเปิดใบใหม่ได้ */
      await request.patch(`/api/requirements/${req1.id}`, {
        headers: { cookie, 'Content-Type': 'application/json' },
        data: { action: 'cancel', cancelReason: 'ทดสอบ', cancelField: 'budget' },
      });
      const third = await request.post('/api/requirements', {
        headers: { cookie, 'Content-Type': 'application/json' },
        data: { leadId: lead.id, dealIntent: 'เช่า' },
      });
      expect(third.status(), 'ปิดรอบเก่าแล้วต้องเปิดใบใหม่ได้').toBe(201);
    } finally {
      await request.delete(`/api/leads/${lead.id}`, { headers: { cookie } }).catch(() => null);
    }
  });
});

/* สไลด์ 42 · "ไม่มีสรุปและประวัติการติดต่อ" — หน้าดีลมีไทม์ไลน์การเจรจา (ยื่น
   ข้อเสนอกี่รอบ) แต่ไม่มีว่าคุยอะไรกับลูกค้ามาบ้าง ทั้งที่บันทึกอยู่ใน lead แล้ว */
test.describe('คอมเมนต์ลูกค้า · ประวัติการติดต่อในหน้า Deals', () => {
  test('หน้าดีลแสดงผู้ติดต่อ เบอร์ และบันทึกการคุยจาก lead', async ({ page, request }) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    const lead = await (await request.post('/api/leads', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { name: `บ. ทดสอบประวัติ ${Date.now().toString(36)}`, contact: 'คุณทดสอบ', phone: '081-555-4444' },
    })).json();
    const deal = await (await request.post('/api/deals', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { title: `ดีลทดสอบประวัติ ${Date.now().toString(36)}`, leadId: lead.id, amount: 250000 },
    })).json();

    try {
      /* เปลี่ยนสถานะ lead — ระบบต้องบันทึกเป็นประวัติให้เอง */
      await request.patch(`/api/leads/${lead.id}`, {
        headers: { cookie, 'Content-Type': 'application/json' },
        data: { status: 'contacted' },
      });

      await page.goto(`/admin/deals/${deal.id}`);
      const box = page.locator('[data-deal-history]');
      await expect(box, 'หน้าดีลต้องมีประวัติการติดต่อ').toBeVisible();
      await expect(page.locator('[data-deal-phone]'), 'ต้องมีเบอร์ลูกค้าให้กดโทร').toHaveAttribute('href', /^tel:\+?\d+$/);
      await expect(box.locator('[data-history-row]').first(), 'ต้องเห็นบันทึกที่ระบบเขียนไว้ตอนเปลี่ยนสถานะ').toBeVisible({ timeout: 15000 });
    } finally {
      await request.delete(`/api/deals/${deal.id}`, { headers: { cookie } }).catch(() => null);
      await request.delete(`/api/leads/${lead.id}`, { headers: { cookie } }).catch(() => null);
    }
  });
});

/* สไลด์ 41 · "ปุ่มหาย — ไปที่ประกาศ · โทรศัพท์ · โลเคชั่น" · "ชื่อลูกค้าหรือ
   บริษัทอยู่ตรงไหน" · "ต้องมีรูปภาพเพื่อยืนยัน" — แผนเข้าชมคือสิ่งที่คนถือ
   ออกไปพาลูกค้าดูจริง แต่แต่ละจุดแวะมีแค่รหัสกับชื่อทำเล */
test.describe('คอมเมนต์ลูกค้า · แผนเข้าชม', () => {
  test('แต่ละจุดแวะเปิดประกาศ โทรหาเจ้าของ และนำทางได้', async ({ page, request }) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    /* ทรัพย์ที่กรอกเบอร์เจ้าของและพิกัดไว้ — เพื่อให้วัดปุ่มได้ทั้งสามปุ่ม */
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse', title: `ทดสอบจุดแวะ ${Date.now().toString(36)}`, status: 'active',
        values: {
          province: 'สมุทรปราการ', deal_type: 'ให้เช่า',
          lessor_name: 'คุณเจ้าของ', lessor_phone: '081-777-6666',
          location_map: { lat: 13.64, lng: 100.59 },
        },
      },
    })).json();
    const lead = await (await request.post('/api/leads', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { name: `บ. ทดสอบแผนชม ${Date.now().toString(36)}`, phone: '081-222-3333' },
    })).json();
    const when = new Date();
    when.setDate(when.getDate() + 4);
    const visit = await (await request.post('/api/visits', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { leadId: lead.id, date: when.toISOString(), codes: [made.publicCode] },
    })).json();

    try {
      await page.goto(`/admin/visits/${visit.id}`);
      const stop = page.locator(`[data-stop="${made.publicCode}"]`);
      await expect(stop).toBeVisible();

      await expect(stop.locator('[data-stop-listing]'), 'ต้องเปิดหน้าประกาศได้').toHaveAttribute('href', new RegExp(made.publicCode));
      await expect(stop.locator('[data-stop-phone]'), 'ต้องโทรหาเจ้าของได้').toHaveAttribute('href', /^tel:\+?\d+$/);
      await expect(stop.locator('[data-stop-map]'), 'ต้องนำทางได้').toHaveAttribute('href', /google\.com\/maps/);

      /* ชื่อลูกค้าที่พาไปดู ต้องอยู่บนหน้า ไม่ใช่ต้องเดา */
      const who = page.locator('[data-visit-customer]');
      await expect(who).toBeVisible();
      await expect(who).toContainText(lead.name);
      await expect(page.locator('[data-visit-lead-phone]')).toHaveAttribute('href', /^tel:\+?\d+$/);
    } finally {
      await request.delete(`/api/visits/${visit.id}`, { headers: { cookie } }).catch(() => null);
      await request.delete(`/api/leads/${lead.id}`, { headers: { cookie } }).catch(() => null);
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });
});

/* สไลด์ 25 · "ช่องจำนวนเงินกับขนาดพื้นที่ ทุกช่องใส่ , ขั้นหน่วย" */
test.describe('คอมเมนต์ลูกค้า · ตัวคั่นหลักพันในฟอร์ม', () => {
  test('พิมพ์เลขแล้วเห็นตัวคั่น แต่ค่าที่บันทึกเป็นตัวเลขล้วน', async ({ page, request }) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: `ทดสอบตัวคั่น ${Date.now().toString(36)}`, status: 'draft', values: { province: 'สมุทรปราการ', deal_type: 'ให้เช่า' } },
    })).json();

    try {
      await page.goto(`/admin/property-edit?code=${made.publicCode}`);
      const rent = page.locator('[data-num-input="price_rent"]');
      await expect(rent).toBeVisible({ timeout: 15000 });
      await rent.fill('150000');
      await expect(rent, 'ต้องเห็นตัวคั่นระหว่างพิมพ์').toHaveValue('150,000');

      await page.getByText('บันทึก', { exact: true }).first().click();
      await expect(page).toHaveURL(/\/admin\/properties$/, { timeout: 15000 });

      /* ที่เก็บจริงต้องเป็นตัวเลข ไม่ใช่ข้อความที่มีลูกน้ำ */
      const saved = await (await request.get(`/api/properties/${made.id}`, { headers: { cookie } })).json();
      expect(saved.values.price_rent, 'ค่าที่บันทึกต้องเป็นตัวเลขล้วน').toBe(150000);
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });
});

/* "ใส่รูปหน้าปก ทั้ง Property และ Listing" — สองตารางนี้วาดไอคอนประเภทเหมือนกัน
   ทุกแถว ทั้งหน้าจึงดูเหมือนกันไปหมด แยกไม่ออกว่าแถวไหนคือทรัพย์ตัวไหน */
test.describe('คอมเมนต์ลูกค้า · รูปหน้าปกในตารางหลังบ้าน', () => {
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  for (const [path, api] of [
    ['/admin/properties', '/api/properties'],
    ['/admin/listings', '/api/listings'],
    ['/admin/social-status', '/api/listings'],
  ] as const) {
    test(`${path} แสดงรูปหน้าปกของทรัพย์ที่มีรูป`, async ({ page, request }) => {
      const cookie = await signIn(page);
      const items = (await (await request.get(api, { headers: { cookie } })).json()).items as
        { values?: { photos?: unknown }; img?: string | null }[];
      const withPhoto = items.filter((i) => (Array.isArray(i.values?.photos) && i.values!.photos!.length) || i.img).length;
      test.skip(!withPhoto, 'ยังไม่มีทรัพย์ที่มีรูป');

      await page.goto(path);
      const covers = page.locator('[data-row-cover]:not([data-row-cover="none"])');
      await expect(covers.first(), 'ต้องเห็นรูปหน้าปก ไม่ใช่ไอคอนอย่างเดียว').toBeVisible({ timeout: 15000 });

      /* รูปต้องโหลดได้จริง ไม่ใช่กรอบว่างที่ src พัง */
      const src = await covers.first().getAttribute('src');
      expect(src, 'รูปหน้าปกต้องมี src').toBeTruthy();
      const res = await request.get(src!, { headers: { cookie } });
      expect(res.status(), `เปิดรูป ${src} ไม่ได้`).toBe(200);
    });
  }
});

/* แบ่งหน้าในตารางหลังบ้าน — Properties กับ Listings วาดทั้ง 393 แถวรวดเดียว
   (และตั้งแต่ใส่รูปหน้าปกก็คือโหลดรูป 393 ใบพร้อมกัน) ส่วนปุ่มเลขหน้าที่เคยอยู่
   ใต้ตารางเป็นของปลอมที่เขียนไว้ตายตัว */
test.describe('คอมเมนต์ลูกค้า · แบ่งหน้าในตารางหลังบ้าน', () => {
  const PER = 25;
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  for (const [path, rowSel, api] of [
    ['/admin/properties', 'tr.prop-row', '/api/properties'],
    ['/admin/listings', 'table tbody tr', '/api/listings'],
    ['/admin/social-status', '.soc-row', '/api/listings'],
  ] as const) {
    test(`${path} แบ่งหน้าจริง และเปลี่ยนหน้าแล้วได้ของคนละชุด`, async ({ page, request }) => {
      const cookie = await signIn(page);
      const total = ((await (await request.get(api, { headers: { cookie } })).json()).items as unknown[]).length;
      test.skip(total <= PER, `มีของแค่ ${total} รายการ ยังไม่ถึงหน้าที่สอง`);

      await page.goto(path);
      const rows = page.locator(rowSel);
      await expect.poll(() => rows.count(), { timeout: 15000 }).toBeGreaterThan(0);
      expect(await rows.count(), `หน้าหนึ่งต้องมีไม่เกิน ${PER} แถว`).toBeLessThanOrEqual(PER);

      const pager = page.locator('[data-table-pager]');
      await expect(pager).toBeVisible();
      await expect(page.locator('[data-pager-count]')).toContainText(`จาก ${total}`);
      await expect(page.locator('[data-pager-prev]'), 'หน้าแรกต้องกดย้อนไม่ได้').toBeDisabled();

      const firstBefore = await rows.first().innerText();
      await page.locator('[data-pager-next]').click();
      await expect.poll(async () => (await rows.first().innerText()) !== firstBefore, { timeout: 10000 }).toBe(true);
      await expect(page.locator('[data-pager-prev]'), 'หน้าสองต้องกดย้อนได้').toBeEnabled();

      /* กรองแล้วต้องเด้งกลับหน้าแรก ไม่ใช่ค้างอยู่หน้าที่ไม่มีของ */
      await page.locator('[data-filter="type"]').click();
      await page.locator('[data-filter-opt]').first().click();
      await expect(page.locator('[data-pager-prev]'), 'กรองแล้วต้องกลับหน้าแรก').toBeDisabled();
    });
  }
});

/* "ข้อความสำหรับโพสต์ แสดงไม่ครบ" — กล่องข้อความในหน้า Social Status ออกมาเป็น
   โครงเปล่า "พื้นที่ใช้สอยรวม :" · "ออฟฟิศ :" · "ความสูง :" ว่างหมดทุกบรรทัด
   เพราะหน้านี้ส่งเข้าไปแค่ ดีล · จังหวัด · ราคา ส่วนที่เหลืออยู่ใน values ของ
   ทรัพย์ซึ่งไม่เคยถูกดึงมา */
test.describe('คอมเมนต์ลูกค้า · ข้อความโพสต์ใน Social Status', () => {
  test('ข้อความอัตโนมัติเติมค่าจากทรัพย์จริง ไม่ใช่โครงเปล่า', async ({ page, request }) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    /* ทรัพย์ที่กรอกครบพอจะวัดได้ว่าข้อความเติมค่ามาจริง */
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        typeKey: 'warehouse', title: `ทดสอบข้อความโพสต์ ${Date.now().toString(36)}`, status: 'active',
        values: {
          province: 'สมุทรปราการ', district: 'บางพลี', subdistrict: 'ตำบล บางโฉลง',
          deal_type: 'ให้เช่า', price_rent: 120000,
          building_area_total: 1500, building_height: 12, floor_loading: '3 ตัน/ตร.ม.',
          office_area_total: 200, power_phase: '3 Phase 30/100 amp (Upgradeable)',
        },
      },
    })).json();

    try {
      await page.goto('/admin/social-status');
      await page.locator('[data-filter-q]').fill(made.publicCode);
      const row = page.locator('.soc-row', { hasText: made.publicCode });
      await expect(row).toBeVisible({ timeout: 15000 });
      await row.locator('.soc-open').click();

      const box = page.locator('#soc-text');
      await expect(box).toBeVisible();
      /* รอให้ดึงรายละเอียดเสร็จ แล้วค่าต้องอยู่ในข้อความจริง */
      await expect.poll(async () => (await box.inputValue()).includes('1,500') || (await box.inputValue()).includes('1500'), { timeout: 15000 }).toBe(true);

      const text = await box.inputValue();
      for (const [label, want] of [
        ['พื้นที่ใช้สอยรวม', '1500'],
        ['ความสูง', '12'],
        ['พื้นรับน้ำหนัก', '3 ตัน'],
        ['ออฟฟิศ', '200'],
        ['ที่ตั้ง', 'บางพลี'],
      ] as const) {
        expect(text, `บรรทัด "${label}" ต้องมีค่า ไม่ใช่ว่างเปล่า`).toContain(want);
      }
      /* ไม่ควรเหลือบรรทัดที่ลงท้ายด้วย ":" เปล่า ๆ สำหรับช่องที่กรอกไว้แล้ว */
      expect(text).not.toMatch(/- ความสูง :\s*$/m);
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });
});

/* สไลด์ 9 · 22 · 25 (ลูกค้าเขียนย้ำสามที่) — "พื้นที่สีทุกอันใส่ Icon สีด้วย"
   จุดสีเคยมีแต่ในหน้ารายละเอียดฝั่งลูกค้า ส่วนตัวกรองและฟอร์มมีแต่ชื่อสีเป็น
   ตัวหนังสือ ซึ่งต้องอ่านแล้วแปลเอาเองทุกครั้ง */
test.describe('คอมเมนต์ลูกค้า · จุดสีผังเมืองทุกที่', () => {
  const signIn = async (page: import('@playwright/test').Page) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    return (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
  };

  test('ตัวกรองหลังบ้านมีจุดสีในทุกตัวเลือก', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin/properties');
    await page.locator('[data-filter="zoning"]').click();
    const opts = page.locator('[data-filter-opt]');
    await expect(opts.first()).toBeVisible();
    const n = await opts.count();
    /* ทุกตัวเลือกที่เป็นสีต้องมีจุด ยกเว้น "อื่นๆ" ที่ไม่มีสีของตัวเอง */
    const dots = await page.locator('[data-filter-opt] [data-zone-dot]').count();
    expect(dots, `มี ${n} ตัวเลือก แต่มีจุดสีแค่ ${dots}`).toBeGreaterThanOrEqual(n - 2);
  });

  test('ฟอร์มแก้ทรัพย์เลือกพื้นที่สีจากจุดสีจริง', async ({ page, request }) => {
    const cookie = await signIn(page);
    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: `ทดสอบจุดสีในฟอร์ม ${Date.now().toString(36)}`, status: 'draft', values: { province: 'สมุทรปราการ' } },
    })).json();
    try {
      await page.goto(`/admin/property-edit?code=${made.publicCode}`);
      const picker = page.locator('[data-zone-picker]');
      await expect(picker, 'ช่องผังเมืองต้องเป็นตัวเลือกที่มีสี ไม่ใช่ dropdown ข้อความ').toBeVisible({ timeout: 15000 });
      expect(await picker.locator('[data-zone-dot]').count(), 'ทุกตัวเลือกต้องมีจุดสี').toBeGreaterThan(8);

      /* เลือกแล้วต้องบันทึกได้จริง */
      await page.locator('[data-zone-opt="พื้นที่สีม่วง — อุตสาหกรรม"]').click();
      await page.getByText('บันทึก', { exact: true }).first().click();
      await expect(page).toHaveURL(/\/admin\/properties$/, { timeout: 15000 });
      const saved = await (await request.get(`/api/properties/${made.id}`, { headers: { cookie } })).json();
      expect(saved.values.zoning_color).toBe('พื้นที่สีม่วง — อุตสาหกรรม');
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('ตัวกรองหน้ารายการฝั่งลูกค้าก็มีจุดสี', async ({ page }) => {
    await page.goto('/th/listing');
    const opts = page.locator('[data-filter-opt="zoning"]');
    const n = await opts.count();
    test.skip(!n, 'ยังไม่มีทรัพย์ที่กรอกพื้นที่สี');
    const dots = await page.locator('[data-filter-opt="zoning"] [data-zone-dot]').count();
    expect(dots, `มี ${n} ตัวเลือก แต่มีจุดสีแค่ ${dots}`).toBeGreaterThanOrEqual(n - 1);
  });
});

/* สไลด์ 23 (หน้าใหม่) · "รูปภาพสลับที่ไม่ได้ · ขยายช่องรูปภาพ (มองภาพไม่เห็น)"
   รูปในฟอร์มเป็นชิปสูง 30px กับรูปย่อ 22×22 เล็กจนดูไม่ออกว่าเป็นรูปอะไร และ
   ไม่มีทางเปลี่ยนลำดับ ทั้งที่รูปแรกคือรูปปกที่ออกหน้าเว็บ */
test.describe('คอมเมนต์ลูกค้า · จัดการรูปในฟอร์ม', () => {
  test('รูปใหญ่พอมองเห็น และสลับลำดับได้จริง', async ({ page, request }) => {
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    /* ยืมรูปจริงจากทรัพย์ที่มีอยู่ สองใบ เพื่อวัดการสลับลำดับ */
    const items = (await (await request.get('/api/properties', { headers: { cookie } })).json()).items as
      { values?: { photos?: unknown } }[];
    const photos = items.flatMap((i) => (Array.isArray(i.values?.photos) ? (i.values!.photos as string[]) : [])).slice(0, 2);
    test.skip(photos.length < 2, 'ต้องมีรูปอย่างน้อยสองใบในระบบ');

    const made = await (await request.post('/api/properties', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { typeKey: 'warehouse', title: `ทดสอบสลับรูป ${Date.now().toString(36)}`, status: 'draft', values: { province: 'สมุทรปราการ', photos } },
    })).json();

    try {
      await page.goto(`/admin/property-edit?code=${made.publicCode}`);
      const grid = page.locator('[data-media-grid]');
      await expect(grid).toBeVisible({ timeout: 15000 });

      /* ใหญ่พอมองเห็น — ไม่ใช่ไอคอน 22px */
      const box = await grid.locator('[data-media-item] img').first().boundingBox();
      expect(box!.height, 'รูปต้องสูงพอจะดูออกว่าเป็นรูปอะไร').toBeGreaterThan(60);
      await expect(page.locator('[data-media-cover]'), 'ใบแรกต้องบอกว่าเป็นปก').toBeVisible();

      /* สลับลำดับแล้วบันทึก — ปกต้องเปลี่ยนตาม */
      await page.locator('[data-media-cover-set="1"]').click();
      await page.getByText('บันทึก', { exact: true }).first().click();
      await expect(page).toHaveURL(/\/admin\/properties$/, { timeout: 15000 });

      const saved = await (await request.get(`/api/properties/${made.id}`, { headers: { cookie } })).json();
      expect(saved.values.photos[0], 'รูปที่กด "ทำเป็นปก" ต้องขึ้นมาเป็นใบแรก').toBe(photos[1]);
      expect(saved.values.photos, 'ต้องสลับลำดับ ไม่ใช่ลบทิ้ง').toHaveLength(2);
    } finally {
      await request.delete(`/api/properties/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });
});

/* สไลด์ 7 · "เพิ่ม ท่าเรือคลองเตย" — ตัวเลือกท่าเรือมีแหลมฉบัง มหาชัย
   มาบตาพุด แต่ไม่มีคลองเตย ทั้งที่เป็นท่าเรือที่ใกล้คลังในกรุงเทพฯ ที่สุด */
test.describe('คอมเมนต์ลูกค้า · ท่าเรือคลองเตย', () => {
  test('เลือกท่าเรือคลองเตยได้จากหน้าแรก และหน้าปลายทางมีทรัพย์จริง', async ({ page, request }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();
    await expect(page.getByText('ท่าเรือคลองเตย').first(), 'ต้องมีคลองเตยในตัวเลือกท่าเรือ').toBeVisible({ timeout: 15000 });

    const rows = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as { province: string }[];
    const inBkk = rows.filter((r) => r.province.includes('กรุงเทพ')).length;
    test.skip(!inBkk, 'ยังไม่มีทรัพย์ในกรุงเทพฯ');

    await page.goto('/th/port-khlong-toei');
    await expect(page.locator('[data-card]').first(), 'หน้าท่าเรือคลองเตยต้องมีทรัพย์').toBeVisible({ timeout: 15000 });
  });

  test('หมุดคลองเตยอยู่บนแผนที่ และอยู่ในกรุงเทพฯ', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-pin="ท่าเรือคลองเตย"]')).toBeVisible({ timeout: 15000 });
  });
});

/* สไลด์ 6 (เขียนใหม่หลังรอบก่อน) · "ขยายแผนที่ · มันทับกันจนดูไม่ออก"
   หมุดในกรุงเทพฯ อยู่ชิดกันมาก — CBD กับท่าเรือคลองเตยห่างกันราวสามกิโลเมตร
   ป้ายชื่อจึงเกยกันจนอ่านไม่ออก */
test.describe('คอมเมนต์ลูกค้า · แผนที่ใหญ่ขึ้นและป้ายไม่ทับกัน', () => {
  test('แผนที่สูงขึ้น และป้ายหมุดไม่ทับกัน', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);

    const box = (await plane.boundingBox())!;
    expect(box.height, 'แผนที่ต้องสูงพอจะกางหมุดได้').toBeGreaterThan(700);

    /* ป้ายที่ "มองเห็นอยู่" ต้องไม่ทับกัน — ป้ายที่ระบบซ่อนเพราะจะทับ ไม่นับ
       (จุดหมุดยังอยู่ครบ ชี้แล้วป้ายโผล่) */
    const rects = await page.locator('.belt-pin .belt-pin-label').evaluateAll((els) =>
      els
        .filter((el) => Number(getComputedStyle(el).opacity) > 0.5)
        .map((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, t: (el.textContent ?? '').trim() }; }));
    expect(rects.length, 'ต้องเหลือป้ายให้อ่านอย่างน้อยครึ่งหนึ่งของหมุด').toBeGreaterThan(3);
    /* จุดหมุดต้องอยู่ครบทุกอัน ไม่ใช่หายไปพร้อมป้าย */
    expect(await page.locator('.belt-pin').count(), 'หมุดต้องอยู่ครบ').toBeGreaterThanOrEqual(6);

    const overlaps: string[] = [];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i]; const b = rects[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > 0 && oy > 0) {
          const area = ox * oy;
          const smaller = Math.min(a.w * a.h, b.w * b.h);
          if (area > smaller * 0.5) overlaps.push(`${a.t} ↔ ${b.t}`);
        }
      }
    }
    expect(overlaps, `ป้ายทับกัน: ${overlaps.join(' · ')}`).toEqual([]);
  });
});

/* สไลด์ 9 · "เพิ่มช่องค้นหาและแยกจังหวัดเขตแขวง" (หน้า /th/listing)
   หน้านี้ไม่มีช่องค้นหาเลย มีแต่ชิปแสดงคำที่พิมพ์มาจากหน้าแรก และตัวกรองทำเล
   เป็นข้อความรวมก้อนเดียว ("บางพลี, สมุทรปราการ") แคบลงทีละชั้นไม่ได้ */
test.describe('คอมเมนต์ลูกค้า · ค้นหาและทำเลสามชั้นในหน้ารายการ', () => {
  test('มีช่องค้นหา และพิมพ์แล้วกรองจริง', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as { code: string }[];
    test.skip(!items.length, 'ยังไม่มีทรัพย์');

    await page.goto('/th/listing');
    const box = page.locator('[data-listing-search]');
    await expect(box, 'หน้ารายการต้องมีช่องค้นหาของตัวเอง').toBeVisible();

    const before = await page.locator('[data-card]').count();
    await box.fill(items[0].code);
    await expect.poll(() => page.locator('[data-card]').count(), { timeout: 10000 }).toBeLessThan(before);
    await expect(page.locator(`[data-card="${items[0].code}"]`)).toBeVisible();
  });

  test('ทำเลเป็น dropdown สามชั้น และแคบลงตามชั้น', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as
      { province: string; district: string; subdistrict: string }[];
    test.skip(!items.some((i) => i.district), 'ยังไม่มีทรัพย์ที่กรอกเขต');
    const provs = new Set(items.map((i) => i.province).filter(Boolean));
    test.skip(provs.size < 2, 'มีจังหวัดเดียว แคบลงแล้ววัดผลไม่ได้');

    await page.goto('/th/listing');
    for (const key of ['province', 'district', 'subdistrict']) {
      await expect(page.locator(`[data-filter-select="${key}"]`), `หมวด ${key} ต้องเป็น dropdown`).toBeVisible();
    }

    const distSel = page.locator('[data-filter-select="district"]');
    const before = await distSel.locator('option').count();

    const prov = items.find((i) => i.province && i.district)!.province;
    await page.locator('[data-filter-select="province"]').selectOption(prov);

    /* ตัวเลือกเขตต้องเหลือเฉพาะของจังหวัดนั้น */
    await expect.poll(() => distSel.locator('option').count(), { timeout: 10000 }).toBeLessThan(before);
    const want = items.filter((i) => i.province === prov).length;
    expect(await page.locator('[data-card]').count(), 'ผลลัพธ์ต้องเหลือเฉพาะจังหวัดที่เลือก').toBeLessThanOrEqual(Math.min(want, 9));

    /* เลือกเขตต่อ แล้วแขวงต้องแคบตาม */
    const dist = items.find((i) => i.province === prov && i.district)!.district;
    const subSel = page.locator('[data-filter-select="subdistrict"]');
    const subBefore = await subSel.locator('option').count();
    await distSel.selectOption(dist);
    await expect.poll(() => subSel.locator('option').count(), { timeout: 10000 }).toBeLessThanOrEqual(subBefore);

    /* เปลี่ยนจังหวัดใหม่ ต้องล้างเขตกับแขวงที่เลือกไว้ */
    const other = [...provs].find((x) => x !== prov)!;
    await page.locator('[data-filter-select="province"]').selectOption(other);
    await expect(distSel).toHaveValue('');
    await expect(subSel).toHaveValue('');
  });
});
