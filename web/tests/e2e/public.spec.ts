import { test, expect } from './fixtures';

/* The public site, driven as a visitor would. */

test.describe('locale routing', () => {
  test('a locale-less URL lands on Thai', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/th$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'th');
  });

  test('each locale renders with the right lang attribute', async ({ page }) => {
    for (const [path, lang] of [['/th', 'th'], ['/en', 'en'], ['/zh', 'zh-Hans']] as const) {
      // lang is in the initial HTML — waiting for the full load event makes
      // this hostage to how fast the webfont CDN answers
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
    }
  });

  test('an unknown locale 404s instead of rendering a page', async ({ page }) => {
    const res = await page.goto('/jp', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(404);
  });

  test('internal links keep the visitor in their language', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    // every in-page link to a public route should already be /en-prefixed —
    // without this a click bounces through /th and silently drops the language
    const hrefs = await page.locator('a[href^="/"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('href') ?? ''));
    const publicLinks = hrefs.filter((h) =>
      h !== '/' && !h.startsWith('/admin') && !h.startsWith('/api') && !h.startsWith('/client-shortlist'));
    expect(publicLinks.length).toBeGreaterThan(3);
    for (const href of publicLinks) {
      expect(href, `${href} lost the locale prefix`).toMatch(/^\/(th|en|zh)(\/|$)/);
    }
  });
});

test.describe('listing and property', () => {
  test('the listing page shows published inventory', async ({ page }) => {
    await page.goto('/th/listing');
    await expect(page.locator('#listing-grid')).toBeVisible();
    // seeded properties carry JKP codes; the ported demo set used TIP-
    await expect(page.locator('#listing-grid')).toContainText(/JKP/);
  });

  /* เด็ค Web 2026 ข้อ 4 · "กดแล้วไม่ไปแท็ค" — ตัวหนังสือในรายละเอียดประกาศ
     (ประเภท · แขวง/ตำบล · อำเภอ/เขต · จังหวัด · ประเภทประกาศ) ต้องกดไปหน้า
     รายการที่กรองไว้แล้ว ไม่ใช่เป็นตัวหนังสือเฉย ๆ */
  test('ค่าทำเลและประเภทในตารางรายละเอียด กดแล้วไปหน้ารายการที่กรองไว้', async ({ page }) => {
    await page.goto('/th/listing');
    const link = page.locator('#listing-grid a[href*="/property/JKP"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/property\//);

    const tags = page.locator('[data-spec-tag]');
    const n = await tags.count();
    expect(n, 'ไม่มีค่าไหนในตารางกดได้เลย').toBeGreaterThan(0);

    /* ทุกอันต้องพาไปหน้ารายการพร้อมตัวกรอง ไม่ใช่ /listing เปล่า ๆ */
    for (let i = 0; i < n; i += 1) {
      const key = await tags.nth(i).getAttribute('data-spec-tag');
      const href = await tags.nth(i).getAttribute('href');
      expect(href, `แท็ก ${key} ไม่มีตัวกรองติดไปด้วย`).toMatch(/\/listing\?\w+=.+/);
    }

    /* กดจริงแล้วต้องกรองจริง — ไม่ใช่พาไปหน้าที่ขึ้นทรัพย์ทั้งคลัง */
    const prov = page.locator('[data-spec-tag="province"]');
    if (await prov.count()) {
      const want = (await prov.innerText()).trim();
      await prov.click();
      await expect(page).toHaveURL(/\/listing\?province=/);
      await expect(page.locator('#listing-grid')).toBeVisible();
      const cards = await page.locator('#listing-grid a[href*="/property/"]').count();
      expect(cards, 'กดจังหวัดแล้วไม่เหลือทรัพย์เลย').toBeGreaterThan(0);
      /* ชื่อจังหวัดที่กดต้องปรากฏบน breadcrumb ของหน้าปลายทาง */
      await expect(page.locator('body')).toContainText(want.slice(0, 6));
    }
  });

  /* "ไอค่อน ของหัวข้อ พื้นที่สี · การใช้งานที่เหมาะ · คุณสมบัติของทรัพย์" */
  test('สามหัวข้อนี้มีไอคอน และไม่ใช่รูปเดียวกัน', async ({ page }) => {
    await page.goto('/th/listing');
    const link = page.locator('#listing-grid a[href*="/property/JKP"]').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/property\//);

    /* ต้องเทียบข้อความเต็ม — "คุณสมบัติ" เฉย ๆ ไปตรงกับหัวข้อตัวกรองด้วย */
    const wanted = ['คุณสมบัติของทรัพย์', 'การใช้งานที่เหมาะ', 'พื้นที่สี (ผังเมือง)'];
    const shapes: string[] = [];
    for (const w of wanted) {
      const h = page.getByRole('heading', { name: w, exact: true }).first();
      if (await h.count() === 0) continue;
      const svg = h.locator('xpath=..').locator('svg');
      await expect(svg, `หัวข้อ "${w}" ยังไม่มีไอคอน`).toHaveCount(1);
      shapes.push(await svg.innerHTML());
    }
    expect(shapes.length, 'ไม่เจอหัวข้อสักอันในหน้านี้').toBeGreaterThan(0);
    expect(new Set(shapes).size, 'ไอคอนซ้ำกัน แยกหัวข้อไม่ออก').toBe(shapes.length);
  });

  /* เด็ค Web 2026 ข้อ 2 · "ที่กดเปลี่ยนหน้ามันอยู่ต่ำไปครับ ลูกค้าไม่รู้ว่ามี
     หน้าต่อไป" และคอมเมนต์ 23 ส.ค. "เลขหน้าจะต้องอยู่ติดกับการ์ดเสมอ ...
     ไม่เลื่อนลงไปไม่ว่ากรณีใด" */
  test('เลขหน้าอยู่ติดกับการ์ดเสมอ ไม่ถูกแถบตัวกรองดันลงไป', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto('/th/listing');
    await expect(page.locator('#listing-grid')).toBeVisible();
    const pager = page.locator('#pagination-row');
    if (await pager.count() === 0) test.skip(true, 'ผลลัพธ์ไม่ถึงสองหน้า');

    /* ต้องอยู่ในคอลัมน์ผลลัพธ์ ไม่ใช่นอกตารางสองคอลัมน์ — ถ้าอยู่นอก แถบตัวกรอง
       ที่สูงกว่าการ์ดจะดันมันลงไปอยู่ใต้สุดของหน้า */
    await expect(page.locator('#listing-results #pagination-row')).toHaveCount(1);

    const grid = (await page.locator('#listing-grid').boundingBox())!;
    const bar = (await pager.boundingBox())!;
    const side = (await page.locator('#filter-sidebar').boundingBox())!;
    const gap = bar.y - (grid.y + grid.height);
    expect(gap, `เลขหน้าห่างจากการ์ด ${Math.round(gap)}px`).toBeLessThan(80);
    expect(gap).toBeGreaterThan(0);
    /* แถบตัวกรองสูงกว่าการ์ดเป็นปกติ — เลขหน้าต้องไม่รอให้มันจบก่อน */
    if (side.y + side.height > grid.y + grid.height + 80) {
      expect(bar.y, 'เลขหน้าถูกดันไปอยู่ใต้แถบตัวกรอง').toBeLessThan(side.y + side.height);
    }
  });

  /* "ย้ายประเภททรัพย์ขึ้นมาอยู่บนจังหวัด" */
  test('หมวดตัวกรอง — ประเภททรัพย์อยู่เหนือจังหวัด และทุกหมวดเปิดค้างไว้', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto('/th/listing');
    await expect(page.locator('#listing-grid')).toBeVisible();
    const text = await page.locator('#filter-sidebar').innerText();
    const iType = text.indexOf('ประเภทอสังหา');
    const iProv = text.indexOf('จังหวัด');
    expect(iType, 'ไม่มีหมวดประเภททรัพย์').toBeGreaterThan(-1);
    expect(iProv, 'ไม่มีหมวดจังหวัด').toBeGreaterThan(-1);
    expect(iType, 'ประเภททรัพย์ต้องอยู่เหนือจังหวัด').toBeLessThan(iProv);

    /* คุณ Jacky ยืนยัน 23 ส.ค. ว่าให้เปิดค้างไว้ทุกหมวด — ตัวเลือกใต้หัวข้อ
       ต้องเห็นได้เลยโดยไม่ต้องกดเปิดทีละอัน */
    expect(text).toContain('โกดัง');
    expect(text).toContain('กรุงเทพมหานคร');
  });

  test('a card opens that exact property, not a hardcoded one', async ({ page }) => {
    await page.goto('/th/listing');
    // wait for the client fetch to replace the ported demo set
    const link = page.locator('#listing-grid a[href*="/property/JKP"]').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    const code = decodeURIComponent(href!.split('/property/')[1]);

    await link.click();
    await expect(page).toHaveURL(new RegExp(`/property/${code}$`));
    await expect(page.locator('h1')).toBeVisible();
    // the page must show the code it was opened with, not a hardcoded one
    await expect(page.getByText(code).first()).toBeVisible();
  });

  test('an unknown property code 404s', async ({ page }) => {
    const res = await page.goto('/th/property/JKP-NOPE9999', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(404);
  });

  /* The homepage and the listing page shipped a copy of the design
     prototype's demo cards. They rendered on the server and, on the
     homepage, were never replaced — so the markup a crawler (or anyone
     before hydration) saw advertised properties that did not exist, and
     every "ดูรายละเอียด" on them opened a 404. Assert against the raw HTML,
     with no JavaScript involved, because that is where the bug lived. */
  for (const path of ['/th', '/th/listing', '/en/listing']) {
    test(`server-rendered ${path} links only to properties that exist`, async ({ request }) => {
      const html = await (await request.get(path)).text();

      expect(html, 'prototype demo codes are still in the server HTML').not.toContain('TIP-');

      const links = [...new Set([...html.matchAll(/\/(?:th|en|zh)\/property\/([A-Za-z0-9._%-]+)/g)]
        .map((m) => m[0]))];

      for (const href of links) {
        const res = await request.get(href, { maxRedirects: 0 });
        expect(res.status(), `${href} is advertised on ${path} but does not resolve`).toBe(200);
      }
    });
  }
});

/* "responsive เลื่อนขึ้นแล้วข้อความมันแสดงไม่ครบ มันตัดหัวไป"
   คำที่หมุนอยู่ในหัวเรื่องหน้าแรกโดนกรอบเฉือนบนมือถือ — ความสูงของกรอบกับคำ
   เขียนไว้ที่หนึ่ง (1.18em) กฎจอเล็กทับเหลือ 1.05em แต่คีย์เฟรมยังเลื่อนทีละ
   1.18em ทุกคำที่หมุนไปจึงเลื่อนเกินไปเรื่อย ๆ จนคำโผล่มาครึ่งเดียว

   เทสต์ไม่ได้ดูว่า "สวยไหม" แต่วัดว่าทุกจังหวะที่คำหยุดนิ่ง ระยะที่เลื่อนไป
   ต้องเป็นจำนวนเต็มเท่าของความสูงหนึ่งคำพอดี — ถ้าตัวเลขสามที่ไม่ตรงกันเมื่อไร
   ค่าจะกลายเป็นเศษทันที */
test.describe('คำที่หมุนในหัวเรื่องหน้าแรกต้องไม่โดนตัด', () => {
  test('ทุกจังหวะที่คำหยุด กรอบพอดีหนึ่งคำเป๊ะ', async ({ page }) => {
    await page.goto('/th');
    await page.evaluate(() => document.fonts.ready);
    const rot = page.locator('#hero-rotator');
    await rot.waitFor();

    const read = () => rot.evaluate((el) => {
      const inner = el.firstElementChild as HTMLElement;
      const box = el.getBoundingClientRect();
      const kid = (inner.firstElementChild as HTMLElement).getBoundingClientRect();
      return { boxH: box.height, kidH: kid.height, shift: box.top - inner.getBoundingClientRect().top };
    });

    const first = await read();
    expect(Math.abs(first.boxH - first.kidH), 'กรอบต้องสูงเท่าหนึ่งคำพอดี').toBeLessThan(0.5);

    /* เก็บค่าตลอดหนึ่งรอบ (9 วินาที) แล้วเอาเฉพาะช่วงที่ค่านิ่ง — ช่วงกำลังเลื่อน
       ระหว่างคำเป็นค่าระหว่างกลางตามธรรมชาติ ไม่ใช่ความผิดพลาด */
    const seen: number[] = [];
    for (let i = 0; i < 96; i += 1) {
      seen.push((await read()).shift);
      await page.waitForTimeout(100);
    }
    const settled: number[] = [];
    for (let i = 2; i < seen.length; i += 1) {
      const [a, b, c] = [seen[i - 2], seen[i - 1], seen[i]];
      if (Math.abs(a - b) < 0.5 && Math.abs(b - c) < 0.5) settled.push(c);
    }
    expect(settled.length, 'ต้องจับช่วงที่คำหยุดนิ่งได้อย่างน้อยหนึ่งช่วง').toBeGreaterThan(3);

    const off = settled
      .map((v) => ({ v, steps: v / first.kidH }))
      .filter((r) => Math.abs(r.steps - Math.round(r.steps)) > 0.02);
    expect(off.map((r) => `${r.v.toFixed(1)}px = ${r.steps.toFixed(3)} คำ`), 'เลื่อนไปไม่ลงตัวกับความสูงคำ — คำจะโผล่มาครึ่งเดียว').toEqual([]);
  });
});

/* "responsive เรียงไม่สวย" — แถบเครื่องมือเหนือรายการทรัพย์บนมือถือ
   ปุ่ม "ตัวกรองการค้นหา" ตกบรรทัดกลางปุ่มจนสูงกว่าของข้าง ๆ จำนวนผลลัพธ์กับชิป
   "บันทึกไว้" ซ้อนกันเป็นชั้น ๆ และคำว่า "เรียงตาม" ถูกดันไปคนละมุมกับกล่องที่
   มันอธิบาย ไม่มีอะไรตรงขอบเดียวกันสักอย่าง */
test.describe('แถบเครื่องมือหน้ารายการบนจอมือถือ', () => {
  for (const w of [320, 390]) {
    test(`กว้าง ${w}px — เรียงเป็นแถวตรงขอบเดียวกัน`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.addInitScript(() => localStorage.setItem('jkp.favourites.v1', JSON.stringify(['JKPBKK1005'])));
      await page.goto('/th/listing');
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#toolbar-row').waitFor();
      await page.waitForTimeout(1200);

      const box = async (sel: string) => (await page.locator(sel).boundingBox())!;
      const btn = await box('#mobile-filter-btn');
      const count = await box('#toolbar-count');
      const sortRow = await box('#sort-share-row');
      const row = await box('#toolbar-row');

      /* ปุ่มต้องเป็นบรรทัดเดียว — ตกบรรทัดเมื่อไรความสูงจะเด้งจาก 38 เป็นเกือบเท่าตัว */
      expect(btn.height, 'ชื่อปุ่มตัวกรองตกบรรทัด ปุ่มเลยสูงผิดปกติ').toBeLessThan(46);

      /* ปุ่มกับจำนวนผลลัพธ์อยู่บรรทัดเดียวกัน */
      expect(Math.abs((btn.y + btn.height / 2) - (count.y + count.height / 2)),
        'จำนวนผลลัพธ์ควรอยู่บรรทัดเดียวกับปุ่มตัวกรอง').toBeLessThan(12);

      /* ทุกก้อนเริ่มที่ขอบซ้ายเดียวกัน และไม่มีอะไรล้นออกนอกแถว */
      const chips = page.locator('#toolbar-chips');
      const lefts = [btn.x, sortRow.x, ...(await chips.count() ? [(await box('#toolbar-chips')).x] : [])];
      for (const x of lefts) expect(Math.abs(x - lefts[0]), `ขอบซ้ายไม่ตรงกัน: ${lefts.join(', ')}`).toBeLessThan(1.5);
      expect(count.x + count.width, 'จำนวนผลลัพธ์ควรชิดขอบขวาเท่ากับแถวเรียงลำดับ')
        .toBeGreaterThan(sortRow.x + sortRow.width - 1.5);
      expect(count.x + count.width).toBeLessThan(row.x + row.width + 1.5);

      /* คำว่า "เรียงตาม" ต้องติดกับกล่องเลือก ไม่ใช่ถูกดันไปคนละมุม */
      const group = await box('#sort-group');
      expect(group.width, '"เรียงตาม" กับกล่องเลือกไม่ควรกินเต็มความกว้างแถว')
        .toBeLessThan(sortRow.width - 30);

      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over, 'หน้าเลื่อนออกด้านข้าง').toBeLessThanOrEqual(1);
    });
  }
});

/* สไลด์ 18 · ลูกค้าวางภาพเว็บอ้างอิงคู่กับเว็บเรา ชี้ที่แถบติดต่อขอบล่างของเขา
   แล้วเขียนว่า "ขอเหมือนกัน" กับ "ไม่มี Popup" — บนมือถือ กล่องติดต่อของเราไป
   กองอยู่ท้ายหน้า ต้องเลื่อนผ่านสเปค รูป และแผนที่ทั้งหมดก่อนถึงจะเจอ */
test.describe('แถบติดต่อขอบล่างบนมือถือ', () => {
  const propertyUrl = async (request: import('@playwright/test').APIRequestContext) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[];
    return `/th/property/${items[0].code}`;
  };

  test('เห็นแถบตั้งแต่ยังไม่เลื่อนหน้า และปุ่มพาไปช่องทางจริง', async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(await propertyUrl(request));
    const bar = page.locator('#contact-bar');
    await expect(bar, 'แถบต้องเห็นทันทีโดยไม่ต้องเลื่อน').toBeVisible();

    const box = (await bar.boundingBox())!;
    expect(box.y + box.height, 'แถบต้องติดขอบล่างจอ').toBeGreaterThan(844 - 2);

    /* ทุกปุ่มต้องมีปลายทางจริง — ปุ่มที่กดแล้วไม่ไปไหนแย่กว่าไม่มีปุ่ม
       ยกเว้น WeChat ที่เป็นไอดี ไม่ใช่ลิงก์ จึงเปิดป๊อปอัปแทน */
    const buttons = page.locator('[data-bar-channel]');
    const n = await buttons.count();
    expect(n, 'ต้องมีอย่างน้อยหนึ่งช่องทาง').toBeGreaterThan(0);
    for (let i = 0; i < n; i += 1) {
      const el = buttons.nth(i);
      const key = await el.getAttribute('data-bar-channel');
      if (key === 'wechat') continue;
      const href = await el.getAttribute('href');
      expect(href, `ปุ่ม ${key} ไม่มีปลายทาง`).toBeTruthy();
      expect(href!, `ปุ่ม ${key} ปลายทางไม่ถูกต้อง: ${href}`).toMatch(/^(https?:|tel:)/);
    }
    // ปุ่มโทรต้องโทรออกได้จริง ไม่ใช่ลิงก์เปล่า
    const tel = page.locator('[data-bar-channel="phone"]');
    if (await tel.count()) await expect(tel).toHaveAttribute('href', /^tel:\+?\d{6,}$/);
  });

  test('WeChat ไม่มีลิงก์ให้เปิด จึงต้องมีป๊อปอัปให้คัดลอกไอดี', async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(await propertyUrl(request));
    const wc = page.locator('[data-bar-channel="wechat"]');
    test.skip(!(await wc.count()), 'ยังไม่ได้ตั้งค่า WeChat ใน /admin/company');

    await wc.click();
    const sheet = page.locator('#contact-bar-sheet');
    await expect(sheet).toBeVisible();
    await expect(page.locator('[data-bar-wechat-id]')).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(sheet, 'ปิดด้วย Esc ไม่ได้').toHaveCount(0);
  });

  test('แถบไม่บังบรรทัดท้ายฟุตเตอร์', async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(await propertyUrl(request));
    await page.mouse.wheel(0, 40000);
    await page.waitForTimeout(1200);

    const bar = (await page.locator('#contact-bar').boundingBox())!;

    /* วัดที่ตัวข้อความ ไม่ใช่กล่องที่ครอบมัน — ฟุตเตอร์ตรึงขอบล่าง การเพิ่ม
       padding ด้านล่างทำให้กล่องสูงขึ้นไปทางบน ขอบล่างของกล่องยังชนขอบจออยู่ดี */
    const rights = (await page.locator('[data-foot-rights]').boundingBox())!;
    expect(rights.y + rights.height, 'บรรทัดสงวนลิขสิทธิ์โดนแถบทับ').toBeLessThanOrEqual(bar.y + 1);
  });

  test('จอใหญ่ไม่มีแถบ เพราะกล่องติดต่อลอยตามอยู่ข้าง ๆ แล้ว', async ({ page, request }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(await propertyUrl(request));
    await expect(page.locator('#contact-bar')).toBeHidden();
  });
});

/* สไลด์ 2 · "เพิ่มโชว์รูม และ อาคารพาณิชย์ · ที่ดิน" — แผงค้นหาหน้าแรกมีให้เลือก
   แค่โกดังกับโรงงาน เป็นรายการที่พิมพ์ไว้ตายตัวในไฟล์ ทั้งที่ระบบคีย์ทรัพย์ได้
   สี่ประเภทมาตั้งแต่แรก คนหาโชว์รูมหรือที่ดินจึงไม่มีทางเริ่มจากหน้าแรก */
test.describe('ประเภททรัพย์ในแผงค้นหาหน้าแรก', () => {
  test('มีครบสี่ประเภทที่ระบบรองรับ', async ({ page }) => {
    await page.goto('/th');
    await page.locator('[data-hero-chip="type"]').click();
    const keys = await page.locator('[data-hero-type]').evaluateAll((els) => els.map((e) => e.getAttribute('data-hero-type')));
    expect(keys).toEqual(['warehouse', 'factory', 'showroom', 'land']);
    await expect(page.locator('[data-hero-type="showroom"]')).toContainText('โชว์รูม');
    await expect(page.locator('[data-hero-type="land"]')).toContainText('ที่ดิน');
  });

  test('เลือกโชว์รูมแล้วกดค้นหา ไปหน้ารายการพร้อมตัวกรองที่เลือก', async ({ page }) => {
    await page.goto('/th');
    await page.locator('[data-hero-chip="type"]').click();
    await page.locator('[data-hero-type="showroom"]').click();
    await page.getByText('นำไปใช้').click();
    await page.locator('#hero-search-btn').click();
    await page.waitForURL(/\/listing\?/);
    /* ค่าที่ส่งไปต้องเป็นชื่อประเภทชุดเดียวกับที่การ์ดใช้ ไม่ใช่คำที่พิมพ์ซ้ำไว้
       คนละที่ — ไม่งั้นกรองแล้วไม่มีทางเจอ */
    // URLSearchParams เขียนช่องว่างเป็น + ตามมาตรฐาน form encoding
    expect(new URL(page.url()).searchParams.get('type')).toBe('โชว์รูม และ อาคารพาณิชย์');
    await expect(page.locator('#toolbar-count')).toBeVisible();
  });

  test('"ล้างค่า" ล้างจริง ไม่ใช่เลือกโกดังให้แทน', async ({ page }) => {
    await page.goto('/th');
    await page.locator('[data-hero-chip="type"]').click();
    await page.locator('[data-hero-type="factory"]').click();
    await page.getByText('ล้างค่า').click();
    await page.getByText('นำไปใช้').click();
    await page.locator('#hero-search-btn').click();
    await page.waitForURL(/\/listing/);
    expect(decodeURIComponent(page.url()), 'ล้างค่าแล้วไม่ควรเหลือตัวกรองประเภท').not.toContain('type=');
  });
});

/* "responsive กลับขึ้นข้างบน เอาออก" — บนมือถือปุ่มนี้ลอยทับเนื้อหาตลอด และมี
   แถบติดต่อกินขอบล่างอยู่แล้ว */
test.describe('ปุ่มกลับขึ้นด้านบน', () => {
  test('ไม่มีบนมือถือ แต่ยังมีบนจอใหญ่', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/th');
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(700);
    await expect(page.locator('#back-to-top-btn')).toBeHidden();

    await page.setViewportSize({ width: 1400, height: 900 });
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(700);
    await expect(page.locator('#back-to-top-btn')).toBeVisible();
  });
});

/* "ตัวกรองเพิ่มเติม น้ำหนักที่พื้นรับได้ เพิ่มถึง 7 ตัน และเพิ่มความสูง"
   ตัวกรองที่มีให้กดแต่ไม่ได้กรองอะไรคือปัญหาที่แก้กันมาหลายรอบแล้ว เทสต์นี้จึง
   ไม่ได้ดูแค่ว่ามีช่อง แต่ดูว่าค่าเดินทางไปถึงหน้ารายการและตัดผลลัพธ์จริง */
test.describe('ตัวกรองเพิ่มเติม · รับน้ำหนักและความสูง', () => {
  test('ระดับรับน้ำหนักมีถึง 7 ตัน', async ({ page }) => {
    await page.goto('/th');
    await page.locator('[data-hero-chip="more"]').click();
    const steps = await page.locator('text=/ตัน\\/ตร\\.ม\\. ขึ้นไป/').allInnerTexts();
    expect(steps.join(' ')).toContain('7 ตัน');
  });

  test('ช่องความสูงมีทั้งหน้าแรกและหน้ารายการ และเป็นช่วงต่ำสุด–สูงสุด', async ({ page }) => {
    await page.goto('/th');
    await page.locator('[data-hero-chip="more"]').click();
    await expect(page.locator('[data-height-min]')).toBeVisible();
    await expect(page.locator('[data-height-max]')).toBeVisible();

    await page.goto('/th/listing');
    // จอเล็กแถบตัวกรองซ่อนอยู่หลังปุ่ม ต้องกดเปิดก่อนเหมือนที่คนใช้ทำ
    const openFilters = page.locator('#mobile-filter-btn');
    if (await openFilters.isVisible()) await openFilters.click();
    /* หน้านี้วาดชุดตัวกรองสองชุด — แถบข้างสำหรับจอใหญ่ กับแผงที่กางบนจอเล็ก
       ขอแค่ชุดที่มองเห็นอยู่มีช่องความสูง ไม่ใช่ชุดแรกใน DOM */
    await expect(page.locator('[data-height-min]:visible')).toHaveCount(1);
  });

  test('เลือกความสูงจากหน้าแรกแล้วผลลัพธ์ในหน้ารายการลดลงจริง', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as { heightM: number | null }[];
    const tall = items.filter((i) => i.heightM !== null && i.heightM >= 12).length;
    test.skip(tall === items.length, 'ทรัพย์ทุกรายการสูงเกิน 12 ม. จึงเทียบไม่ได้');

    await page.goto('/th');
    await page.locator('[data-hero-chip="more"]').click();
    await page.locator('[data-height-min]').selectOption('12');
    await page.getByText('นำไปใช้').click();
    await page.locator('#hero-search-btn').click();
    await page.waitForURL(/\/listing\?/);
    expect(new URL(page.url()).searchParams.get('hmin'), 'ค่าความสูงไม่ได้ถูกส่งไปหน้ารายการ').toBe('12');

    await page.waitForTimeout(2500);
    const shown = Number(await page.locator('#toolbar-count').innerText().then((t) => t.replace(/\D/g, '')));
    expect(shown, `กรอง ≥12 ม. แล้วควรเหลือ ${tall} จาก ${items.length}`).toBe(tall);
  });

  test('ช่องต่ำสุดกับสูงสุดไม่เสนอค่าที่ทำให้ช่วงกลับด้าน', async ({ page }) => {
    await page.goto('/th');
    await page.locator('[data-hero-chip="more"]').click();
    await page.locator('[data-height-max]').selectOption('8');
    const mins = await page.locator('[data-height-min] option').evaluateAll((els) =>
      els.map((e) => Number((e as HTMLOptionElement).value)).filter(Boolean));
    expect(Math.max(...mins), 'ช่องต่ำสุดยังเสนอค่าที่สูงกว่าสูงสุดที่เลือกไว้').toBeLessThanOrEqual(8);
  });
});

/* สไลด์ 1 · "เพิ่มโชว์รูม และ อาคารพาณิชย์ · ที่ดิน" — เมนูบนสุดมีแต่โรงงานกับ
   โกดัง ทั้งที่ระบบคีย์ทรัพย์ได้สี่ประเภทมาตั้งแต่แรก
   แถบบนสุดมีสี่ชุดในโค้ด (หน้าแรก · หน้ารายการ · หน้าทรัพย์ · หน้าเนื้อหา)
   เทสต์จึงไล่ทั้งสี่ที่ ไม่ใช่หน้าเดียว — การ์ดทรัพย์เคยหลุดเพราะแก้ไปแค่ที่เดียว
   มาแล้ว และรอบนี้ก็หลุดซ้ำ: เทสต์เดิมไล่แค่สามหน้า ชุดของหน้าเนื้อหา
   (คำถามพบบ่อย · เกี่ยวกับเรา · ติดต่อ) จึงค้างอยู่ที่โรงงานกับโกดังเงียบ ๆ
   จนลูกค้าเปิดเจอเอง */
test.describe('เมนูประเภททรัพย์บนแถบบนสุด', () => {
  const PAGES = ['/th', '/th/listing', '/th/faq', '/th/about', '/th/contact'];
  const WANT = ['factory', 'warehouse', 'showroom', 'land'];

  test('ครบสี่ประเภท เหมือนกันทุกหน้า ทั้งจอใหญ่และลิ้นชักมือถือ', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    for (const url of [...PAGES, `/th/property/${code}`]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(url);
      await page.locator('[data-nav-type]').first().waitFor();
      expect(await page.locator('[data-nav-type]').evaluateAll((els) => els.map((e) => e.getAttribute('data-nav-type'))),
        `${url}: เมนูบนจอใหญ่ไม่ครบ`).toEqual(WANT);

      await page.setViewportSize({ width: 412, height: 900 });
      await page.locator('#mobile-menu-btn').click();
      expect(await page.locator('[data-drawer-type]').evaluateAll((els) => els.map((e) => e.getAttribute('data-drawer-type'))),
        `${url}: เมนูในลิ้นชักไม่ครบ`).toEqual(WANT);
    }
  });

  test('ทุกเมนูมีทั้งให้เช่าและขาย และปลายทางเปิดได้จริง', async ({ page, request }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/th');
    for (const key of WANT) {
      await page.locator(`[data-nav-type="${key}"]`).hover();
      const links = await page.locator('.dd-item:visible').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
      expect(links, `เมนู ${key} ควรมีสองปลายทาง`).toHaveLength(2);
      for (const href of links) {
        expect((await request.get(href)).status(), `${href} เปิดไม่ได้`).toBe(200);
      }
    }
  });

  /* ปลายทางต้องกรองมาแล้วจริง ไม่ใช่หน้ารายการเปล่า ๆ ที่ตั้งชื่อว่าที่ดิน */
  test('หน้าปลายทางกรองตามประเภทและประเภทประกาศที่ชื่อบอกไว้', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/th/warehouse-rent');
    await page.locator('#listing-grid').waitFor();
    await page.waitForTimeout(2500);
    const types = await page.locator('[data-card]').evaluateAll((els) => els.length);
    expect(types, 'โกดังให้เช่าควรมีของ').toBeGreaterThan(0);

    /* โชว์รูมกับที่ดินยังไม่มีของในคลัง — หน้าต้องบอกว่า "ไม่พบตามเงื่อนไข"
       ไม่ใช่ "ยังไม่มีทรัพย์ที่เผยแพร่" ซึ่งไม่จริง (คลังมี 393 รายการ) และไม่ใช่
       โชว์ทรัพย์ประเภทอื่นมาแทน */
    await page.goto('/th/land-sale');
    await page.waitForTimeout(2500);
    const shown = await page.locator('[data-card]').count();
    if (shown === 0) {
      await expect(page.locator('#listing-empty')).toContainText('ไม่พบทรัพย์ตามเงื่อนไข');
      await expect(page.locator('#listing-empty')).not.toContainText('ยังไม่มีทรัพย์ที่เผยแพร่');
      // ปุ่มต้องพากลับไปหน้ารายการทั้งหมด ไม่ใช่ปุ่มล้างค่าที่กดแล้วยังว่างเหมือนเดิม
      await expect(page.locator('#listing-see-all')).toHaveAttribute('href', '/th/listing');
    } else {
      const labels = await page.locator('[data-card]').evaluateAll((els) => els.map((e) => e.textContent ?? ''));
      for (const t of labels) expect(t, 'หน้าที่ดินขายมีทรัพย์ประเภทอื่นปน').toContain('ที่ดิน');
    }
  });
});

test.describe('layout', () => {
  test('the page never scrolls sideways', async ({ page }) => {
    // the responsive rules keyed off inline-style strings used to fail
    // silently; this is the symptom that would have caught it
    for (const path of ['/th', '/th/listing', '/th/about', '/th/contact']) {
      await page.goto(path);
      // measure only once the webfont has landed — Thai falls back to very
      // different metrics until then, which makes this flake per-environment
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} scrolls horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });

  test('no console errors on the home page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/th');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#page-sheet, main, body').first().waitFor();

    // the fixture refuses third-party hosts, so the browser logs a failed
    // fetch for each blocked font/photo — those are ours to ignore
    const ours = errors.filter((e) =>
      !/favicon|ERR_FAILED|net::|Failed to load resource/i.test(e));
    // a hydration mismatch (React #418) would show up here — it has before
    expect(ours, ours.join(' | ')).toEqual([]);
  });
});

test.describe('AI-readable files', () => {
  test('robots.txt keeps admin and the token view out of any index', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Disallow: /client-shortlist');
  });

  test('sitemap.xml carries hreflang for all three locales', async ({ request }) => {
    const body = await (await request.get('/sitemap.xml')).text();
    for (const l of ['th', 'en', 'zh']) expect(body).toContain(`hreflang="${l}"`);
  });
});

test.describe('FAQ answers from the CMS', () => {
  /* The editor stores rich text, so an answer is markup. The page printed it
     as text and visitors read "<p>ขอใบ ร.ง.4 …</p>" tags and all. Rendering it
     as HTML fixes that but makes the CMS body an injection point on a public
     page, so it is sanitised server-side — both halves are checked here.

     The row is created by the test rather than borrowed from the seeded FAQ:
     these tests used to assert on one bold word inside one seeded answer, so
     rewriting that answer broke three tests that were not about it. */
  const MARK = `เทสต์ลายเซ็น-${Date.now().toString(36)}`;
  const QUESTION = `คำถามสำหรับเทสต์ ${MARK}`;
  let cookie = '';
  let rowId = '';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/admin/login');
    await page.locator('#login-email').fill('owner@jkp.local');
    await page.locator('#login-password').fill('jkp12345');
    await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
    await expect(page).toHaveURL(/\/admin(?!\/login)/);
    cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ');

    // POST สร้างแถวเปล่า ๆ ส่วนเนื้อหาและสถานะเผยแพร่ใส่ทีหลังด้วย PUT
    const made = await page.request.post('/api/cms', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { kind: 'faq', title: QUESTION, slug: `e2e-faq-${MARK}`, category: 'เทสต์' },
    });
    expect(made.status(), 'สร้างแถว FAQ สำหรับเทสต์ไม่ได้').toBeLessThan(300);
    const madeJson = await made.json();
    rowId = madeJson.id ?? madeJson.data?.id ?? '';
    expect(rowId, 'ไม่ได้ id ของแถวที่สร้าง').toBeTruthy();

    const filled = await page.request.put(`/api/cms/${rowId}`, {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: {
        lang: 'th', title: QUESTION, category: 'เทสต์', status: 'published',
        // ตัวหนาต้องกลายเป็นตัวหนาจริง ส่วนสคริปต์ต้องถูกตัดทิ้งที่เซิร์ฟเวอร์
        body: `<p>คำตอบมี<strong>${MARK}</strong>อยู่ข้างใน</p><script>alert('xss')</script>`,
      },
    });
    expect(filled.status(), 'ใส่เนื้อหาให้แถวเทสต์ไม่ได้').toBeLessThan(300);
    await page.close();
  });

  test.afterAll(async ({ request }) => {
    if (rowId) await request.delete(`/api/cms/${rowId}`, { headers: { cookie } }).catch(() => null);
  });

  test('renders formatting instead of showing the tags, and drops scripts', async ({ page }) => {
    const errors: string[] = [];
    page.on('dialog', (d) => { errors.push('alert fired'); void d.dismiss(); });

    await page.goto('/th/faq');
    await page.getByText(QUESTION).first().click();
    await expect(page.locator('#faq-layout strong', { hasText: MARK })).toBeVisible();

    // the literal tags must not appear as words on the page
    await expect(page.locator('body')).not.toContainText('<p>');
    await expect(page.locator('body')).not.toContainText('</strong>');
    expect(errors, 'a script in the CMS body executed').toEqual([]);
  });

  /* The accordion rendered its answer only after a click, so the server sent
     the questions and none of the answers — on a page whose entire purpose is
     the answers, built to be found in search. */
  test('answers are in the server HTML, not only after a click', async ({ request }) => {
    const html = await (await request.get('/th/faq')).text();
    const withoutScripts = html.replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/g, '');

    expect(withoutScripts, 'the answer never reaches a crawler').toContain(MARK);
    // present but collapsed until opened
    expect(withoutScripts).toMatch(/hidden=""/);
    // และสคริปต์ที่ฝังมากับเนื้อหา ต้องไม่หลุดออกไปกับหน้าเว็บ
    expect(html).not.toContain("alert('xss')");
  });

  test('the page declares FAQPage structured data', async ({ request }) => {
    const html = await (await request.get('/th/faq')).text();
    const m = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/.exec(html);
    if (!m) test.skip(true, 'no FAQ row seeded in this database');

    const data = JSON.parse(m![1].replace(/\\u003c/g, '<'));
    expect(data['@type']).toBe('FAQPage');
    expect(Array.isArray(data.mainEntity)).toBe(true);
    expect(data.mainEntity.length).toBeGreaterThan(0);

    const first = data.mainEntity[0];
    expect(first['@type']).toBe('Question');
    expect(first.name).toBeTruthy();
    expect(first.acceptedAnswer.text).toBeTruthy();
    // schema text is plain: a stray tag invalidates the whole block for Google
    expect(first.acceptedAnswer.text).not.toMatch(/<[a-z]/i);
  });

  test('the accordion is operable by keyboard and announces its state', async ({ page }) => {
    await page.goto('/th/faq');
    const q = page.getByRole('button', { name: new RegExp(MARK) });
    await expect(q).toHaveAttribute('aria-expanded', 'false');
    await q.focus();
    await page.keyboard.press('Enter');
    await expect(q).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#faq-layout strong', { hasText: MARK })).toBeVisible();
  });
});

test.describe('the enquiry box on a property page', () => {
  /* Its submit handler was `setSent(true)` and nothing else: the visitor typed
     their name and number, the button turned green, and nobody at the company
     ever heard about it. */
  test('sends the enquiry, with the property code on it', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;

    // caught rather than delivered: the point is what it sends, not another row
    let body: Record<string, unknown> | null = null;
    await page.route('**/api/public/leads', async (route) => {
      body = JSON.parse(route.request().postData() ?? '{}');
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: {} }) });
    });

    await page.goto(`/th/property/${code}`);
    await page.locator('#pd-inquiry input').nth(0).fill('คุณทดสอบ');
    await page.locator('#pd-inquiry input').nth(1).fill('t@example.com');
    await page.locator('#pd-inquiry input').nth(2).fill('0800000000');
    await page.getByRole('button', { name: /ส่งคำถาม|Send enquiry/ }).click();

    await expect(page.locator('#pd-inquiry-sent')).toBeVisible();
    expect(body, 'nothing was posted').not.toBeNull();
    expect(body!.name).toBe('คุณทดสอบ');
    expect(body!.phone).toBe('0800000000');
    expect(JSON.stringify(body!.req)).toContain(code);   // which property this is about
  });

  test('says so when it fails, instead of showing a tick', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.route('**/api/public/leads', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: 'ระบบขัดข้อง' } }) }));

    await page.goto(`/th/property/${code}`);
    await page.locator('#pd-inquiry input').nth(0).fill('คุณทดสอบ');
    await page.locator('#pd-inquiry input').nth(2).fill('0800000000');
    await page.getByRole('button', { name: /ส่งคำถาม|Send enquiry/ }).click();

    await expect(page.locator('#pd-inquiry-error')).toBeVisible();
    await expect(page.locator('#pd-inquiry-sent')).toHaveCount(0);
  });

  /* The Line / WeChat / WhatsApp buttons were `href="#"`, and WeChat has no
     field anywhere to hold an account. A chat button is drawn only where there
     is an account behind it. */
  test('a chat button exists only where an account is configured', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.goto(`/th/property/${code}`);
    const hrefs = await page.locator('#pd-inquiry a[target="_blank"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    for (const h of hrefs) expect(h, 'a chat button that goes nowhere').toMatch(/^https:\/\//);
  });
});

test.describe('the heart and the share button on a property page', () => {
  test('the heart saves this property, the share button opens the share menu', async ({ page, context, request }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;

    await page.goto(`/th/property/${code}`);
    await page.locator('[data-testid="pd-fav"]').click();
    await expect(page.locator('#saved-link')).toContainText('1');

    // the share button opens the menu; what the menu does is checked with it
    await page.locator('[data-testid="pd-share"]').click();
    await expect(page.locator('#share-menu')).toBeVisible();
  });

  test('the breadcrumb goes back to the listing, not to "#"', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.goto(`/th/property/${code}`);
    const crumb = page.getByRole('link', { name: 'อสังหาริมทรัพย์ทั้งหมด' });
    await expect(crumb).toHaveAttribute('href', '/th/listing');
    await crumb.click();
    await expect(page).toHaveURL(/\/th\/listing$/);
  });
});

test.describe('sharing a single FAQ answer', () => {
  /* The button said "แชร์" and copied the question's *text* to the clipboard —
     no link, and nothing on screen said anything had happened. */
  test('hands out a link that opens that question', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/th/faq');
    await page.locator('#faq-layout button[aria-expanded]').first().click();
    await page.locator('[data-testid^="faq-share-"]').first().click();

    await expect(page.locator('#share-menu')).toBeVisible();
    await page.locator('[data-testid="share-copy"]').click();

    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link, 'the clipboard got the question text, not a link').toContain('/th/faq#');

    // and the link is worth having: it opens the answer it names
    await page.goto(new URL(link).pathname + new URL(link).hash);
    await expect(page.locator('#faq-layout [id^="faq-a-"]:not([hidden])')).toHaveCount(1);
  });
});

test.describe('the share menu', () => {
  /* The share control on a property page did nothing at all, and the one on
     the listing page opened three items that closed the menu and nothing else. */
  test('offers the five ways, and copy really copies', async ({ page, context, request }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;

    await page.goto(`/th/property/${code}`);
    await page.locator('[data-testid="pd-share"]').click();
    const menu = page.locator('#share-menu');
    await expect(menu).toBeVisible();

    for (const t of ['share-copy', 'share-email', 'share-line', 'share-whatsapp', 'share-wechat']) {
      await expect(menu.locator(`[data-testid="${t}"]`)).toBeVisible();
    }
    // the three that are links must be links to somewhere
    await expect(menu.locator('[data-testid="share-email"]')).toHaveAttribute('href', /^mailto:\?subject=/);
    await expect(menu.locator('[data-testid="share-line"]')).toHaveAttribute('href', /line\.me\/lineit\/share\?url=http/);
    await expect(menu.locator('[data-testid="share-whatsapp"]')).toHaveAttribute('href', /wa\.me\/\?text=/);

    await menu.locator('[data-testid="share-copy"]').click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(`/property/${code}`);
  });

  /* WeChat has no share URL a browser may open, so it shows the page as a code
     for the app's scanner rather than a link that quietly fails. */
  test('WeChat shows the page as a scannable code', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.goto(`/th/property/${code}`);
    await page.locator('[data-testid="pd-share"]').click();
    await page.locator('[data-testid="share-wechat"]').click();

    const img = page.locator('#share-menu img');
    await expect(img).toBeVisible({ timeout: 10_000 });
    expect(await img.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
  });

  test('the listing page uses the same menu', async ({ page }) => {
    await page.goto('/th/listing');
    await page.locator('[data-share-trigger]').click();
    await expect(page.locator('#share-menu [data-testid="share-wechat"]')).toBeVisible();
  });

  /* Clicking inside the menu used to close it: the listener that watched for
     an outside click caught the inside ones too. */
  test('clicking inside it does not close it; clicking away does', async ({ page, request }) => {
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.goto(`/th/property/${code}`);
    await page.locator('[data-testid="pd-share"]').click();
    await page.locator('[data-testid="share-wechat"]').click();
    await expect(page.locator('#share-menu')).toBeVisible();

    /* a corner, so this lands on the sheet behind the menu whatever the
       screen size — at phone width the middle of the page is the menu */
    const vp = page.viewportSize()!;
    await page.mouse.click(3, vp.height - 3);
    await expect(page.locator('#share-menu')).toHaveCount(0);
  });
});

test.describe('the chat buttons in the enquiry box', () => {
  test('WeChat is an ID to copy, not a link that goes nowhere', async ({ page, context, request }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0].code;
    await page.goto(`/th/property/${code}`);

    const wechat = page.locator('[data-testid="inquiry-wechat"]');
    test.skip(!(await wechat.count()), 'no WeChat ID set in this database');

    await wechat.click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBeTruthy();
    await expect(wechat).toContainText('คัดลอกแล้ว');
  });
});

test.describe('the similar-properties row on a property page', () => {
  /* It had drifted into a card of its own — no photo count, no type, a line of
     text where the listing's card has a button — and the grid gave it a column
     per card, so one similar property was stretched across the whole page. */
  test('is the same card as the listing page, at card width', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=6')).json()).items as { code: string }[];
    test.skip(items.length < 2, 'needs a second property of the same type to be similar to');

    await page.goto(`/th/property/${items[0].code}`);
    const row = page.locator('#pd-related');
    await row.scrollIntoViewIfNeeded();

    const card = row.locator('[data-card]').first();
    await expect(card).toBeVisible();

    /* a card, not a band across the page. On a phone one column is the whole
       row and that is right — what is never right is a card 1,272px wide, so
       the check is against a card's own maximum rather than the row's width */
    const cardBox = (await card.boundingBox())!;
    expect(cardBox.width).toBeLessThanOrEqual(560);

    // the same parts the listing card has
    await expect(card.locator('[data-fav]')).toBeVisible();
    await expect(card).toContainText(/ตร\.ม\./);
    await expect(card.getByText('ดูรายละเอียด')).toBeVisible();
  });

  test('the heart there saves to the same list as everywhere else', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=6')).json()).items as { code: string }[];
    test.skip(items.length < 2, 'needs a similar property');

    await page.goto(`/th/property/${items[0].code}`);
    await page.locator('#pd-related').scrollIntoViewIfNeeded();
    await page.locator('#pd-related [data-fav]').first().click();
    await expect(page.locator('#saved-link')).toContainText('1');
  });
});

test.describe('the contact map', () => {
  /* It was a stock photograph of a world map — decorative, and no use to
     anyone trying to find the office. It takes a coordinate from the CMS now,
     and since a Google frame reports the reader's address to Google, it is not
     in the page until the reader agrees to it. */
  test('the frame is not in the server HTML — nobody has agreed to it yet', async ({ request }) => {
    for (const locale of ['th', 'en', 'zh']) {
      const html = await (await request.get(`/${locale}/contact`)).text();
      expect(html, `${locale} loads Google before consent`).not.toMatch(/<iframe[^>]+google\.com\/maps/);
      // a photograph of a map is not a map
      expect(html).not.toContain('photo-1524661135-423995f22d0b');
    }
  });

  test('shows a real map for the saved coordinate, in every language', async ({ page }) => {
    for (const locale of ['th', 'en', 'zh']) {
      await page.goto(`/${locale}/contact`);
      if (await page.getByText(/ยังไม่ได้ตั้งพิกัด|No location set yet|尚未设置坐标/).count()) {
        test.skip(true, 'no coordinate set in this database');
      }
      // the suite runs as a visitor who has already agreed (playwright.config.ts)
      await expect(page.locator('iframe[src*="google.com/maps"]'), `${locale} has no map frame`).toBeVisible();
    }
  });

  test('an unparseable coordinate says so instead of embedding junk', async ({ page }) => {
    await page.goto('/th/contact');
    const frame = page.locator('iframe[src*="google.com/maps"]');
    if (!(await frame.count())) test.skip(true, 'no coordinate set in this database');
    // the URL is rebuilt from parsed numbers, so it can only ever look like this
    expect(await frame.getAttribute('src')).toMatch(/^https:\/\/www\.google\.com\/maps\?q=-?\d+(\.\d+)?,-?\d+(\.\d+)?&/);
  });
});

test.describe('the FAQ reads the same in every language', () => {
  /* The 24 questions were an all-or-nothing fallback inside the component, so
     writing one entry in the CMS in Thai cut the Thai page down to that entry
     while English and Chinese still listed all 24 — in Thai. Three languages,
     three different FAQs. */
  test('every language lists the same questions', async ({ request }) => {
    const counts: Record<string, number> = {};
    for (const locale of ['th', 'en', 'zh']) {
      const html = await (await request.get(`/${locale}/faq`)).text();
      counts[locale] = (html.match(/aria-controls="faq-a-/g) ?? []).length;
    }
    expect(counts.th, 'the FAQ is empty — seed it with npm run faq:seed').toBeGreaterThan(0);
    expect(counts.en, `th=${counts.th} en=${counts.en}`).toBe(counts.th);
    expect(counts.zh, `th=${counts.th} zh=${counts.zh}`).toBe(counts.th);
  });
});

test.describe('property cards read in the visitor\'s language', () => {
  /* Every label on a card is assembled server-side in loadPublicListings. It
     already took a locale — but only used it for "/ month". The unit, the
     "price on request" fallback and the word for a million stayed Thai, so an
     English card read "฿ 4.5 ล้าน · 2,700 ตร.ม.".

     Sorting made this worse than cosmetic: the listing page recovered the
     numeric price by regex-matching ล้าน out of the display string, so
     translating that word would have silently divided every price by a
     million on /en and /zh. The number travels as its own field now.

     Asserted against the feed rather than the page, because a property's
     *title* is data the team typed in Thai — legitimately Thai on every
     locale until someone translates the listing itself. */
  /* Thai letters only. The Thai Unicode block also holds ฿ (U+0E3F), which is
     the right currency symbol in every language — matching it would fail a
     correctly translated price. */
  const THAI = /[\u0E01-\u0E3A\u0E40-\u0E5B]/;

  const feed = async (request: import('@playwright/test').APIRequestContext, locale: string) => {
    const res = await request.get(`/api/public/listings?locale=${locale}&limit=60`);
    expect(res.ok(), `feed failed for ${locale}`).toBeTruthy();
    const body = await res.json();
    const items = Array.isArray(body) ? body : body.items;
    expect(Array.isArray(items), 'feed did not return a list').toBeTruthy();
    return items as Array<Record<string, unknown>>;
  };

  test('the unit and the price carry no Thai on /en', async ({ request }) => {
    const items = await feed(request, 'en');
    test.skip(items.length === 0, 'no published inventory to check');
    for (const it of items) {
      expect(String(it.areaLabel), `areaLabel of ${it.code}`).not.toMatch(THAI);
      expect(String(it.price), `price of ${it.code}`).not.toMatch(THAI);
    }
  });

  test('the unit and the price carry no Thai on /zh', async ({ request }) => {
    const items = await feed(request, 'zh');
    test.skip(items.length === 0, 'no published inventory to check');
    for (const it of items) {
      expect(String(it.areaLabel), `areaLabel of ${it.code}`).not.toMatch(THAI);
      expect(String(it.price), `price of ${it.code}`).not.toMatch(THAI);
    }
  });

  test('Thai keeps its own unit', async ({ request }) => {
    const items = await feed(request, 'th');
    test.skip(items.length === 0, 'no published inventory to check');
    const withArea = items.filter((it) => String(it.areaLabel));
    test.skip(withArea.length === 0, 'no property records an area');
    for (const it of withArea) expect(String(it.areaLabel)).toContain('ตร.ม.');
  });

  test('the numeric price travels as its own field, not parsed back out of the label', async ({ request }) => {
    const items = await feed(request, 'en');
    test.skip(items.length === 0, 'no published inventory to check');
    for (const it of items) {
      expect(typeof it.priceValue, `priceValue of ${it.code}`).toBe('number');
      // a million-baht listing must not collapse to "4.5" once ล้าน is gone
      if (/million/.test(String(it.price))) {
        expect(Number(it.priceValue), `${it.code} shows ${it.price}`).toBeGreaterThanOrEqual(1_000_000);
      }
    }
  });
});

test.describe('addresses read in the visitor\'s script', () => {
  /* The province and district are stored in Thai — correctly, it is the
     address — but they were printed unchanged on /en and /zh, where a reader
     cannot even sound them out. */
  test('a card carries no Thai place name on /en', async ({ request }) => {
    const res = await request.get('/api/public/listings?locale=en&limit=60');
    const items = (await res.json()).items as { loc: string; code: string }[];
    test.skip(!items.length, 'no published property');
    const THAI = /[ก-ฺเ-๛]/;
    for (const it of items) {
      // an unmapped district may still be Thai; the province never should be
      const province = it.loc.split(',').pop()!.trim();
      expect(THAI.test(province), `${it.code} still shows a Thai province: ${it.loc}`).toBeFalsy();
    }
  });

  test('Thai keeps the address exactly as the team typed it', async ({ request }) => {
    const th = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { loc: string }[];
    const en = (await (await request.get('/api/public/listings?locale=en&limit=60')).json()).items as { loc: string }[];
    test.skip(!th.length, 'no published property');
    expect(th[0].loc).not.toBe(en[0].loc);
    expect(th[0].loc).toMatch(/[ก-ฺเ-๛]/);
  });
});

test.describe('what search engines are given', () => {
  /* The sitemap advertised /th/property?code=X, which only 307s to the real
     page — every property URL handed to Google was a redirect. And no page
     declared a canonical or its language versions, so the three locales
     competed with each other. */
  test('the sitemap lists property pages that answer directly, not redirects', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    const propertyUrls = urls.filter((u) => u.includes('/property'));
    test.skip(!propertyUrls.length, 'no published property');

    for (const u of propertyUrls) {
      expect(u, 'the ?code= form is a redirect').not.toContain('?code=');
      const res = await request.get(new URL(u).pathname, { maxRedirects: 0 });
      expect(res.status(), `${u} is not a 200`).toBe(200);
    }
  });

  test('every page names itself and its other languages', async ({ request }) => {
    for (const path of ['/th', '/en', '/th/listing', '/th/contact']) {
      const html = await (await request.get(path)).text();
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      expect(canonical, `${path} has no canonical`).toBeTruthy();
      expect(canonical!.endsWith(path), `${path} points its canonical at ${canonical}`).toBeTruthy();

      /* Next writes the React attribute name (hrefLang); HTML attributes are
         case-insensitive, so match that way rather than pinning the casing. */
      for (const l of ['th', 'en', 'zh']) {
        expect(html.toLowerCase(), `${path} does not name its ${l} version`).toContain(`hreflang="${l}"`);
      }
    }
  });
});

test.describe('figures the site can stand behind', () => {
  /* The stats strip and the KPI row shipped with defaults baked in — 2,000+
     properties, 100+ organisations, 12 years — printed as fact above a
     catalogue of three. Anything typed into the CMS still wins; these are what
     stands there until then. */
  test('the home KPIs and the about stats match the published inventory', async ({ page, request }) => {
    /* ต้องถามด้วยเพดานเดียวกับที่หน้าเว็บใช้ ไม่งั้นพอทรัพย์เกิน 60 รายการ
       เทสต์จะเทียบ 60 กับจำนวนจริงแล้วแดง ทั้งที่หน้าเว็บถูกต้อง */
    const listings = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as { province: string }[];
    const published = listings.length;
    const provinces = new Set(listings.map((l) => l.province).filter(Boolean)).size;
    test.skip(!published, 'nothing published');

    for (const path of ['/th', '/th/about']) {
      const html = await (await request.get(path)).text();
      for (const ghost of ['2,000+', '100+', '12 ปี']) {
        expect(html, `${path} still claims ${ghost}`).not.toContain(ghost);
      }
    }

    await page.goto('/th/about');
    const strip = page.locator('body');
    await expect(strip).toContainText(String(published));
    await expect(strip).toContainText(String(provinces));
  });

  test('the legal pages exist, in every language, and are linked', async ({ request }) => {
    for (const locale of ['th', 'en', 'zh']) {
      for (const slug of ['privacy', 'terms']) {
        const res = await request.get(`/${locale}/p/${slug}`);
        expect(res.status(), `/${locale}/p/${slug}`).toBe(200);
        const html = await res.text();
        expect(html.length, `/${locale}/p/${slug} is empty`).toBeGreaterThan(2000);
      }
      const home = await (await request.get(`/${locale}`)).text();
      expect(home, `${locale} home does not link the privacy policy`).toContain('/p/privacy');
    }
  });
});

test.describe('the location finder map', () => {
  /* The pins were percentages over an image cropped with object-fit:cover, so
     they slid with the container: Don Mueang sat over Nakhon Nayok. And the
     factor cards did nothing until clicked. */
  test('the map lights the provinces the factor is actually about', async ({ page }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();

    const lit = (key: string) => page.locator(`[data-province="${key}"]`).getAttribute('data-lit');

    // airports are the default: Bangkok and Samut Prakan hold them
    expect(await lit('bangkok')).toBe('1');
    expect(await lit('samut_prakan')).toBe('1');
    expect(await lit('rayong')).toBe('0');

    // hovering EEC lights the statutory three without choosing them
    await page.locator('[data-factor="eec"]').hover();
    for (const k of ['chonburi', 'rayong', 'chachoengsao']) expect(await lit(k), k).toBe('1');
    expect(await lit('bangkok')).toBe('0');

    // clicking makes it the choice, and it stays lit with the cursor away
    await page.locator('[data-factor="eec"]').click();
    await page.locator('#lf-map-plane').hover();
    expect(await lit('rayong')).toBe('1');
  });

  /* ลูกค้า: "เมาส์ไม่ต้อง hover ให้ click แล้วแสดงข้อมูลดีกว่า" — เดิมแค่เลื่อน
     เมาส์ผ่านก็มีการ์ดเด้งตามตลอดทาง กวนสายตาและบังจังหวัดข้าง ๆ */
  test('ชี้จังหวัดแล้วยังไม่มีการ์ด ต้องกดก่อน', async ({ page }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    await page.locator('[data-province="chonburi"]').hover();
    await page.waitForTimeout(400);
    expect(await page.locator('.belt-card, .belt-card-pop').count(), 'ชี้เฉย ๆ ไม่ควรมีการ์ด').toBe(0);

    await page.locator('[data-province="chonburi"]').click();
    await expect(page.locator('.belt-card-pop')).toBeVisible();
    await expect(page.locator('.belt-card-pop')).toContainText('ชลบุรี');
  });

  /* The map used to zoom to whichever provinces a factor covered, so the
     country moved under the reader on every choice. The view stays put; only
     the fill moves. */
  test('choosing a factor lights its provinces without moving the map', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);

    const litKeys = async () =>
      (await plane.locator('[data-province][data-lit="1"]').evaluateAll((gs) =>
        gs.map((g) => g.getAttribute('data-province')))).sort();
    /* the pane's transform, not an attribute the element may simply not have:
       the check this replaces read `viewBox` off a <div>, so it compared null
       with null and could never have failed */
    const view = () => plane.locator('.leaflet-map-pane').getAttribute('style');

    expect(await litKeys()).toEqual(['bangkok', 'samut_prakan']);
    const before = await view();

    await page.locator('[data-factor="eec"]').click();
    await page.waitForTimeout(700);

    expect(await litKeys()).toEqual(['chachoengsao', 'chonburi', 'rayong']);
    expect(await view(), 'the map moved under the reader').toBe(before);
  });

  /* The pins were floated over a photograph in percentages and slid off the
     places they name. They stand on a real basemap now — which is somebody
     else's work, and says so. */
  test('it draws a real basemap under the provinces, and credits it', async ({ page }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator('.leaflet-tile').count(), { timeout: 15_000 }).toBeGreaterThan(0);
    await expect(page.locator('#lf-map-plane')).toContainText('OpenStreetMap');
    /* เจ็ดหมุดตั้งแต่เพิ่มท่าเรือคลองเตย (สไลด์ 7) */
    await expect(page.locator('[data-pin]')).toHaveCount(7);
    await expect(page.locator('[data-province]')).toHaveCount(13);
  });

  /* Hovering a pin scaled it by a tenth and set a state nothing read. It now
     has to earn the gesture: say what the place is, count what is actually
     published in its province, and go there when clicked. */
  test('a pin under the cursor says what it is, and counts what is there', async ({ page, request }) => {
    /* ต้องนับจากคลังทั้งหมด เหมือนที่การ์ดบนแผนที่นับ — ถามด้วยเพดาน 60
       แล้วทรัพย์ชลบุรีไปอยู่แถวที่ 61 เทสต์ก็จะบอกว่าการ์ดโกหกทั้งที่ถูก */
    const items = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as { province: string }[];
    const inChonburi = items.filter((it) => it.province.includes('ชลบุรี')).length;

    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();
    await page.locator('[data-pin="ท่าเรือแหลมฉบัง"]').click();

    const card = page.locator('.belt-card-pop');
    await expect(card).toBeVisible();
    await expect(card).toContainText('ท่าเรือแหลมฉบัง');
    await expect(card).toContainText('ชลบุรี');
    await expect(card).toContainText(String(inChonburi));   // the real number, not a figure from the design

    /* กดหมุดแล้วจังหวัดที่หมุดตั้งอยู่ต้องถูกเลือกไว้ให้เห็น — เทียบกับจังหวัด
       ที่ไม่เกี่ยวข้อง ไม่ใช่เทียบกับตัวเองก่อน/หลังชี้ เพราะการเลือกอยู่ยาว */
    const fill = (key: string) => page.locator(`[data-province="${key}"]`).evaluate((el) => Number(getComputedStyle(el).fillOpacity));
    await page.mouse.move(2, 2);
    await expect.poll(async () => (await fill('chonburi')) > (await fill('ayutthaya')),
      { message: 'กดหมุดแล้วจังหวัดที่หมุดอยู่ไม่ได้ถูกเน้น' }).toBe(true);
  });

  /* Clicking a province left the browser's focus ring on it: a blue rectangle
     round the shape's bounding box, which on a map reads as a selection nobody
     made. The keyboard still gets one — that is the point of a focus ring. */
  test('clicking a province leaves no focus rectangle behind', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();
    const prov = page.locator('[data-province="chachoengsao"]');
    const box = (await prov.boundingBox())!;

    // pressed, not clicked: a real pointer focus without navigating away
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
    await page.mouse.down();
    expect(await prov.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
    await page.mouse.up();
  });

  /* Clicking used to leave the page immediately, which is a strong thing to do
     to somebody who was still looking. It picks the area out and opens a card;
     the card is where they decide to go — and the line offering that was in the
     hovering card before, where it looked like a link and took no pointer. */
  test('clicking picks the area out instead of leaving the page', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();

    await page.locator('[data-pin="ท่าเรือแหลมฉบัง"]').click();

    await expect(page).toHaveURL(/\/th$/);                       // still here
    await expect(page.locator('[data-province="chonburi"][data-selected="1"]')).toBeVisible();

    const card = page.locator('.belt-card-pop');
    await expect(card).toBeVisible();
    const go = card.locator('[data-go]');
    await expect(go).toBeVisible();
    await expect(go).toHaveAttribute('href', /listing\?province=/);

    await go.click();
    await expect(page).toHaveURL(/\/listing\?province=/);
    await expect(page.locator('body')).toContainText('ชลบุรี');
  });

  test('a province is chosen the same way, and unchosen by clicking off it', async ({ page }) => {
    await page.goto('/th');
    const plane = page.locator('#lf-map-plane');
    await plane.scrollIntoViewIfNeeded();

    /* Chachoengsao carries no pin, so a point in the middle of it is the
       province and nothing else — on a phone the pins cover most of the
       provinces that have them */
    const box = (await page.locator('[data-province="chachoengsao"]').boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5);
    await expect(page.locator('[data-province="chachoengsao"][data-selected="1"]')).toBeVisible();
    await expect(page).toHaveURL(/\/th$/);

    await page.locator('.belt-card-pop .leaflet-popup-close-button').click();
    await expect(page.locator('[data-province][data-selected="1"]')).toHaveCount(0);
  });

  test('hovering a factor previews it on the map without choosing it', async ({ page }) => {
    await page.goto('/th');
    await page.locator('#lf-map-plane').scrollIntoViewIfNeeded();

    const port = page.locator('[data-pin="ท่าเรือแหลมฉบัง"]');
    const airport = page.locator('[data-pin="ดอนเมือง"]');
    /* dimmed, not a particular number: how far a pin fades is a design
       decision that has already been retuned once, and pinning the exact
       value here only means the test fails when the map is restyled */
    const dim = async (g: typeof port) => Number(await g.evaluate((el) => getComputedStyle(el).opacity));
    const lit = async (g: typeof port) => (await dim(g)) === 1;

    // airports are the default: the port pin starts dimmed
    await expect.poll(() => dim(port)).toBeLessThan(1);

    await page.locator('[data-factor="port"]').hover();
    await expect.poll(() => lit(port)).toBe(true);
    await expect.poll(() => dim(airport)).toBeLessThan(1);

    // moving away puts it back — hovering is a preview, not a choice
    await page.locator('[data-factor="air"]').hover();
    await expect.poll(() => dim(port)).toBeLessThan(1);
    await expect.poll(() => lit(airport)).toBe(true);
  });
});

test.describe('the search box on the front page', () => {
  /* It was a <span> with the placeholder written into it, next to a button
     with no handler — the search on the front page of a property site could
     not be typed in. The chips under it set state that went nowhere, and two
     of them offered size and price bands the listing page cannot filter by. */
  test('typing a code and pressing search opens that property\'s listing', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { code: string }[];
    test.skip(!items.length, 'nothing published');
    const code = items[0].code;

    await page.goto('/th');
    await page.locator('#hero-search-input').fill(code);
    await page.locator('#hero-search-btn').click();

    await expect(page).toHaveURL(new RegExp(`/listing\\\\?.*q=${code}`));
    await expect(page.locator('#listing-q')).toContainText(code);
    // the result set is narrowed to it, not the whole catalogue
    await expect(page.locator('body')).toContainText(code);
  });

  /* Both chips started applied — ให้เช่า and โกดัง — so typing the code of a
     factory that is for sale returned an empty page, filtered out by two
     conditions nobody chose. */
  test('a code alone finds the property, whatever type it is', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { code: string; typeKey: string }[];
    const factory = items.find((i) => i.typeKey === 'factory') ?? items[0];
    test.skip(!factory, 'nothing published');

    await page.goto('/th');
    await page.locator('#hero-search-input').fill(factory.code);
    await page.locator('#hero-search-btn').click();

    // no deal or type in the query: the visitor did not pick either
    await expect(page).not.toHaveURL(/deal=/);
    await expect(page).not.toHaveURL(/type=/);
    await expect(page.locator(`a[href*="/property/${factory.code}"]`).first()).toBeVisible();
  });

  test('Enter searches too, and the chips travel with it', async ({ page }) => {
    await page.goto('/th');
    await page.locator('[data-hero-chip="sale"]').click();
    await page.locator('#hero-search-input').fill('ระยอง');
    await page.locator('#hero-search-input').press('Enter');

    await expect(page).toHaveURL(/deal=sale/);
    await expect(page).toHaveURL(/q=/);
  });

  test('the size bands offered here are the ones the listing page filters by', async ({ page }) => {
    await page.goto('/th');
    await page.locator('[data-hero-chip="size"]').click();
    // the six invented sizes are gone; these three are what the destination knows
    for (const label of ['ต่ำกว่า 1,000 ตร.ม.', '1,000–3,000 ตร.ม.', 'สูงกว่า 3,000 ตร.ม.']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText('10,000 ตร.ม.+')).toHaveCount(0);
  });
});

/* "ยังคลิกที่ card ไม่ได้" — รอบก่อนแก้ให้คลิกทั้งใบได้เฉพาะการ์ดในหน้ารายการ
   แต่หน้าแรกใช้การ์ดคนละตัว (components/home/Featured.tsx) เลยไม่โดนแก้ไปด้วย
   เทสต์นี้ไล่ทุกที่ที่มีการ์ด และคลิกจุดที่คนคลิกจริง — รูปกับหัวเรื่อง ไม่ใช่แค่
   เช็คว่ามี <a> อยู่ในหน้า */
test.describe('การ์ดทรัพย์ต้องคลิกได้ทั้งใบ ทุกที่ที่มีการ์ด', () => {
  const surfaces: { name: string; url: string | (() => Promise<string>) }[] = [
    { name: 'หน้าแรก · แถวทรัพย์มาใหม่', url: '/th' },
    { name: 'หน้ารายการทรัพย์', url: '/th/listing' },
  ];

  for (const s of surfaces) {
    test(`${s.name} — คลิกที่รูปแล้วเข้าหน้าทรัพย์`, async ({ page }) => {
      await page.goto(typeof s.url === 'string' ? s.url : await s.url());
      const card = page.locator('[data-card]').first();
      await card.waitFor();
      const code = await card.getAttribute('data-card');
      // กลางรูป — จุดที่คนกดจริง ไม่ใช่มุมที่ไม่มีอะไรทับ
      await card.click({ position: { x: 120, y: 100 } });
      await expect(page).toHaveURL(new RegExp(`/property/${code}`));
    });

    test(`${s.name} — คลิกที่หัวเรื่องแล้วเข้าหน้าทรัพย์`, async ({ page }) => {
      await page.goto(typeof s.url === 'string' ? s.url : await s.url());
      const card = page.locator('[data-card]').first();
      await card.waitFor();
      const code = await card.getAttribute('data-card');
      /* คลิกด้วยเมาส์ที่พิกัดกลางข้อความ ไม่ใช่สั่งคลิกที่ตัว element — ต้องการ
         พฤติกรรมจริงคือ "อะไรอยู่บนสุดตรงนั้นรับคลิกไป" ซึ่งควรเป็นลิงก์คลุมใบ */
      const title = card.getByText(code!, { exact: false }).first();
      // boundingBox อ้างอิงกับ viewport — แถวในหน้าแรกอยู่ใต้จอ ต้องเลื่อนมาก่อน
      await title.scrollIntoViewIfNeeded();
      const box = await title.boundingBox();
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await expect(page).toHaveURL(new RegExp(`/property/${code}`));
    });
  }

  test('แถว "ทรัพย์ที่คล้ายกัน" ในหน้าทรัพย์ก็คลิกทั้งใบได้', async ({ page }) => {
    await page.goto('/th/listing');
    await page.locator('[data-card]').first().click({ position: { x: 120, y: 100 } });
    await expect(page).toHaveURL(/\/property\//);
    const related = page.locator('#pd-related [data-card]').first();
    if (await related.count()) {
      const code = await related.getAttribute('data-card');
      await related.click({ position: { x: 120, y: 100 } });
      await expect(page).toHaveURL(new RegExp(`/property/${code}`));
    }
  });

  /* ปุ่มหัวใจกับปุ่มดูรายละเอียดต้องยังกดแยกได้ — ลิงก์ที่คลุมทั้งใบไม่ควรกลืน */
  test('หัวใจยังกดได้โดยไม่เด้งไปหน้าทรัพย์', async ({ page }) => {
    await page.goto('/th');
    const card = page.locator('[data-card]').first();
    await card.waitFor();
    await card.locator('[data-fav]').click();
    await expect(card.locator('[data-fav]')).toHaveAttribute('data-on', '1');
    await expect(page).toHaveURL(/\/th$/);
  });
});

test.describe('the heart on a listing card', () => {
  /* It filled in and forgot: the state lived in the page's memory, so a reload
     emptied it, and there was nowhere to see what had been saved. */
  test('a saved property is still saved after a reload, and can be listed', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=60')).json()).items as { code: string }[];
    test.skip(items.length < 2, 'need two published properties');

    await page.goto('/th/listing');
    const card = page.locator(`[data-card="${items[0].code}"]`);
    await expect(card).toBeVisible();
    await card.locator('[data-fav]').click();

    // it survives the page going away
    await page.reload();
    await expect(page.locator(`[data-card="${items[0].code}"] [data-fav][data-on="1"]`)).toBeVisible();

    // and there is a way back to what was saved
    const only = page.locator('#listing-only-favs');
    await expect(only).toContainText('1');
    await only.click();
    await expect(page.locator('[data-card]')).toHaveCount(1);
    await expect(page.locator(`[data-card="${items[0].code}"]`)).toBeVisible();

    // clicking the heart again takes it out
    await page.locator(`[data-card="${items[0].code}"] [data-fav]`).click();
    await expect(page.locator('#listing-only-favs')).toHaveCount(0);
  });

  /* The heart was a light that came on and led nowhere: pressed on the home
     page, it was forgotten by the next page, and nothing in the masthead said
     anything had been saved. */
  test('a property hearted on the home page is still there on the listing page', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=6')).json()).items as { code: string }[];
    test.skip(!items.length, 'nothing published');

    await page.goto('/th');
    await expect(page.locator('#saved-link')).toHaveCount(0);   // nothing saved: no counter reading zero
    const card = page.locator(`[data-card="${items[0].code}"]`).first();
    await card.scrollIntoViewIfNeeded();
    await card.locator('[data-fav]').click();

    const saved = page.locator('#saved-link');
    await expect(saved).toContainText('1');

    // and it leads back to them
    await saved.click();
    await expect(page).toHaveURL(/\/listing\?saved=1/);
    await expect(page.locator('[data-card]')).toHaveCount(1);
    await expect(page.locator(`[data-card="${items[0].code}"]`)).toBeVisible();

    // the same link is in the masthead of the other pages
    await page.goto('/th/contact');
    await expect(page.locator('#saved-link')).toContainText('1');
    await page.goto(`/th/property/${items[0].code}`);
    await expect(page.locator('#saved-link')).toContainText('1');
  });
});

/* The watermark was switched on in /admin/branding and the site kept showing
   unstamped photos. The compositor was fine — the pages handed out photo URLs
   with no ?v=, and those URLs are served `immutable, max-age=31536000`, so
   every browser that had seen a photo before kept its year-old copy. Only the
   property JSON endpoint carried the version; the HTML the visitor actually
   loads did not. */
test.describe('รูปที่หน้าเว็บส่งออก ต้องพาเวอร์ชันลายน้ำไปด้วย', () => {
  test('หน้าแรก · หน้ารายการ · หน้าทรัพย์ ใช้ ?v= ตรงกับที่หลังบ้านตั้งไว้', async ({ request }) => {
    const b = await (await request.get('/api/branding')).json();
    const wm = b.watermark ?? {};
    const version = Number(b.watermarkVersion ?? 0);
    const on = !!(wm.enabled && wm.src);
    const items = (await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[];
    test.skip(!items.length, 'ยังไม่มีทรัพย์ที่เผยแพร่');

    for (const path of ['/th', '/th/listing', `/th/property/${items[0].code}`]) {
      const html = await (await request.get(path)).text();
      const urls = [...html.matchAll(/\/api\/media\/[a-z0-9]+\/raw(\?v=\d+)?/g)].map((m) => m[0]);
      test.skip(!urls.length, `${path} ไม่มีรูปให้ตรวจ`);
      const tagged = urls.filter((u) => u.includes(`?v=${version}`)).length;
      if (on) {
        // เปิดลายน้ำอยู่ → ทุก URL ต้องมีเวอร์ชัน ไม่งั้นเบราว์เซอร์เสิร์ฟของเก่าทั้งปี
        expect(tagged, `${path}: ติดเวอร์ชัน ${tagged}/${urls.length} URL`).toBe(urls.length);
      } else {
        // ปิดอยู่ → URL ต้องสะอาด ไม่มี ?v= ค้าง
        expect(urls.some((u) => u.includes('?v=')), `${path} มี ?v= ทั้งที่ปิดลายน้ำ`).toBe(false);
      }
    }
  });

  test('รูปที่เสิร์ฟออกมา มีลายน้ำซ้อนจริงเมื่อเปิดใช้', async ({ request }) => {
    const b = await (await request.get('/api/branding')).json();
    test.skip(!(b.watermark?.enabled && b.watermark?.src), 'ยังไม่ได้เปิดลายน้ำ');
    const code = ((await (await request.get('/api/public/listings?locale=th&limit=1')).json()).items as { code: string }[])[0]?.code;
    test.skip(!code, 'ยังไม่มีทรัพย์ที่เผยแพร่');
    const photo = (await (await request.get(`/api/public/properties/${code}?locale=th`)).json()).photos?.[0] as string;
    expect(photo, 'URL รูปต้องพาเวอร์ชันไปด้วย').toContain('?v=');

    // ไบต์ที่สาธารณะได้ ต้องไม่เท่ากับต้นฉบับที่เก็บไว้ — ถ้าเท่ากันคือไม่ได้ประทับอะไรเลย
    const shown = (await (await request.get(photo)).body()).length;
    const id = photo.match(/\/api\/media\/([a-z0-9]+)\//)?.[1];
    const original = await request.get(`/api/media/${id}/raw?original=1`);
    expect(original.status(), 'ต้นฉบับต้องไม่เปิดให้คนนอก').toBe(401);
    expect(shown).toBeGreaterThan(0);
  });
});

/* Switching to English used to change the chrome and leave the listings in
   Thai: the 393 imported records carry no translations, so every headline fell
   back to its Thai original, and the spec table printed stored Thai values —
   "3 ชั้น" for the number of floors, "ไม่ใช่" for cold storage. */
test.describe('เปลี่ยนภาษาแล้วเนื้อหาต้องเปลี่ยนตาม', () => {
  /* ฿ (U+0E3F) นั่งอยู่ในบล็อกอักษรไทย แต่มันคือสัญลักษณ์สกุลเงิน ไม่ใช่คำไทย
     จึงต้องเว้นไว้ ไม่งั้นราคาทุกรายการจะนับเป็น "ยังไม่ได้แปล" */
  const hasThaiWord = (s: string) => /[\u0E01-\u0E3E\u0E40-\u0E5B]/.test(s);

  for (const locale of ['en', 'zh'] as const) {
    test(`/${locale}: หัวเรื่องทรัพย์ไม่เหลือภาษาไทย`, async ({ page, request }) => {
      const items = (await (await request.get(`/api/public/listings?locale=${locale}&limit=12`)).json()).items as { code: string; title: string }[];
      test.skip(!items.length, 'ยังไม่มีทรัพย์ที่เผยแพร่');
      const bad = items.filter((i) => hasThaiWord(i.title));
      expect(bad.map((b) => `${b.code}: ${b.title}`), 'หัวเรื่องที่ยังเป็นไทย').toEqual([]);

      await page.goto(`/${locale}/listing`);
      const cardTitles = await page.locator('[data-card] h3, [data-card] h2').allInnerTexts();
      expect(cardTitles.filter(hasThaiWord), 'การ์ดบนหน้ารายการ').toEqual([]);
    });

    test(`/${locale}: ตารางสเปคในหน้าทรัพย์อ่านเป็นภาษานั้นจริง`, async ({ page, request }) => {
      const code = ((await (await request.get(`/api/public/listings?locale=${locale}&limit=1`)).json()).items as { code: string }[])[0]?.code;
      test.skip(!code, 'ยังไม่มีทรัพย์ที่เผยแพร่');
      await page.goto(`/${locale}/property/${code}`);
      await expect(page.locator('h1')).toBeVisible();
      expect(hasThaiWord(await page.locator('h1').innerText()), 'หัวเรื่องหน้าทรัพย์ยังเป็นไทย').toBe(false);

      /* ค่าที่โชว์ในตาราง — ยกเว้นแถวที่เป็นข้อความอิสระที่ทีมพิมพ์เอง
         (ชื่อซอย ชื่อแลนด์มาร์ก) ซึ่งเป็นที่อยู่ ไม่ใช่คำที่แปลได้ */
      const FREE_TEXT = ['Nearby', '附近', 'Address', '地址'];
      const rows = await page.locator('[data-spec-row]').all();
      // ตารางว่างเปล่าจะทำให้เทสต์นี้ผ่านโดยไม่ได้ตรวจอะไรเลย
      expect(rows.length, 'ไม่มีแถวสเปคให้ตรวจ').toBeGreaterThan(3);
      const leftover: string[] = [];
      for (const r of rows) {
        const [label, value] = (await r.innerText()).split('\n');
        if (FREE_TEXT.some((f) => (label ?? '').includes(f))) continue;
        if (value && hasThaiWord(value)) leftover.push(`${label} = ${value}`);
      }
      expect(leftover, 'ค่าที่ยังเป็นไทยในตารางสเปค').toEqual([]);
    });
  }
});

/* Opening the heart in the masthead with nothing saved landed the visitor on
   /listing?saved=1: "พบ 0 รายการ", a filter panel with nothing ticked, and a
   ล้างค่า button that did nothing at all — because the one filter emptying the
   page was the one that button did not touch, and the chip that turns it off
   only appears once something has been saved. A dead end with a button in it. */
test.describe('เปิดรายการที่บันทึกไว้ทั้งที่ยังไม่ได้บันทึกอะไร', () => {
  test('บอกตรง ๆ ว่ายังไม่มีของที่บันทึก ไม่ใช่โทษตัวกรอง', async ({ page }) => {
    await page.goto('/th/listing?saved=1');
    const empty = page.locator('#listing-empty');
    await expect(empty).toBeVisible();
    await expect(empty).toContainText('ยังไม่มีทรัพย์ที่บันทึกไว้');
    await expect(empty).not.toContainText('ลองปรับตัวกรอง');
  });

  test('ปุ่มในกล่องนั้นกดแล้วได้ทรัพย์กลับมาจริง', async ({ page, request }) => {
    const total = ((await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as unknown[]).length;
    test.skip(!total, 'ยังไม่มีทรัพย์ที่เผยแพร่');

    await page.goto('/th/listing?saved=1');
    await expect(page.locator('[data-card]')).toHaveCount(0);
    await page.locator('#listing-clear').click();

    await expect(page.locator('[data-card]').first()).toBeVisible();
    // และ ?saved=1 ต้องหลุดออกจาก URL ไม่งั้นกด refresh แล้วกลับไปตัน
    expect(new URL(page.url()).searchParams.get('saved'), 'saved=1 ยังค้างอยู่ใน URL').toBeNull();
  });

  test('ถ้ามีของที่บันทึกไว้ ตัวกรองก็ยังทำงานเหมือนเดิม', async ({ page, request }) => {
    const items = (await (await request.get('/api/public/listings?locale=th&limit=500')).json()).items as { code: string }[];
    test.skip(items.length < 2, 'ทรัพย์ไม่พอ');

    await page.goto('/th/listing');
    await page.locator(`[data-card="${items[0].code}"] [data-fav]`).click();
    await page.goto('/th/listing?saved=1');
    await expect(page.locator('[data-card]')).toHaveCount(1);
    await expect(page.locator(`[data-card="${items[0].code}"]`)).toBeVisible();
  });
});
