import { test, expect, type Page } from '@playwright/test';

/* The assign menu on a lead listed อารยา, วีรพล and สมชาย — three people with
   no account in the system — and picking one only set React state: no request,
   nothing stored, gone on reload. The column behind it (Lead.assigneeId → User)
   had been real the whole time. The list itself also carried six invented
   companies with working-looking phone numbers, shown underneath whatever had
   actually come in. */

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

test.describe('มอบหมาย lead', () => {
  test('รายชื่อในเมนูเป็นคนที่มีบัญชีจริงในระบบ', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const team = (await (await request.get('/api/users/assignable', { headers: { cookie } })).json()).items as { name: string }[];
    expect(team.length, 'ต้องมีผู้ใช้ที่รับ lead ได้อย่างน้อยหนึ่งคน').toBeGreaterThan(0);

    // สร้าง lead ของตัวเองเพื่อไม่ต้องพึ่งข้อมูลที่มีอยู่
    const made = await (await request.post('/api/leads', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { name: `ทดสอบมอบหมาย ${Date.now().toString(36)}`, phone: '0800000123', typeKey: 'warehouse', dealIntent: 'เช่า' },
    })).json();

    try {
      await page.goto('/admin/leads');
      await page.getByText(/มอบหมาย:/).first().click();
      const menu = page.locator('text=ยังไม่มอบหมาย').first();
      await expect(menu).toBeVisible();

      for (const name of team.map((m) => m.name)) {
        await expect(page.getByText(name, { exact: true }).first(), `${name} ต้องอยู่ในเมนู`).toBeVisible();
      }
      // และชื่อที่ไม่มีบัญชีต้องไม่อยู่ในเมนูอีก
      for (const ghost of ['อารยา', 'วีรพล', 'สมชาย']) {
        if (team.some((m) => m.name === ghost)) continue;
        await expect(page.getByText(ghost, { exact: true }), `${ghost} ไม่ควรอยู่ในเมนู`).toHaveCount(0);
      }
    } finally {
      await request.delete(`/api/leads/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('เลือกแล้วบันทึกจริง รีเฟรชยังอยู่', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const team = (await (await request.get('/api/users/assignable', { headers: { cookie } })).json()).items as { id: string; name: string }[];
    const made = await (await request.post('/api/leads', {
      headers: { cookie, 'Content-Type': 'application/json' },
      data: { name: `ทดสอบบันทึกผู้รับผิดชอบ ${Date.now().toString(36)}`, phone: '0800000124', typeKey: 'warehouse', dealIntent: 'เช่า' },
    })).json();

    try {
      await page.goto('/admin/leads');
      await page.getByText(new RegExp(made.name)).first().click();
      await page.getByText(/มอบหมาย:/).first().click();
      await page.getByText(team[0].name, { exact: true }).first().click();

      // เก็บลงฐานข้อมูลจริง ไม่ใช่แค่เปลี่ยนป้ายบนหน้าจอ
      await expect.poll(async () => {
        const list = await (await request.get('/api/leads', { headers: { cookie } })).json();
        return (list.items as { id: string; assigneeId: string | null }[]).find((l) => l.id === made.id)?.assigneeId;
      }, { message: 'assigneeId ไม่ถูกบันทึก', timeout: 10_000 }).toBe(team[0].id);

      await page.reload();
      await page.getByText(new RegExp(made.name)).first().click();
      await expect(page.getByText(`มอบหมาย: ${team[0].name}`).first()).toBeVisible();
    } finally {
      await request.delete(`/api/leads/${made.id}`, { headers: { cookie } }).catch(() => null);
    }
  });

  test('ไม่มี lead ตัวอย่างปนอยู่ในรายการจริง', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const real = (await (await request.get('/api/leads', { headers: { cookie } })).json()).items as unknown[];

    await page.goto('/admin/leads');
    await expect(page.locator('#lead-split')).toBeVisible();
    // ตัวเลขต้องเท่ากับจำนวนจริง ไม่ใช่ 42 ที่พิมพ์ไว้ในโค้ด
    await expect(page.locator('#lead-split')).toContainText(`${real.length} leads`);
    for (const ghost of ['บ. ไทยโลจิสติกส์', 'Sunrise Foods', 'Nippon Steel TH', 'Global Ware Inc.']) {
      await expect(page.getByText(ghost), `${ghost} เป็นข้อมูลสาธิต ไม่ควรอยู่ใน CRM`).toHaveCount(0);
    }
  });
});

/* The page that manages who can be assigned had the same problem as the menu:
   seven invented staff — kittipong@jkp.co, araya@jkp.co, a co-agent expiring
   in 2026 — shown to anyone whose GET /api/users did not answer, which is
   every role except owner. A directory of people who do not exist, with roles
   and privileges printed next to their names. */
test.describe('หน้าผู้ใช้ที่คุมรายชื่อผู้รับมอบหมาย', () => {
  test('แสดงเฉพาะผู้ใช้จริง และตรงกับรายชื่อในเมนูมอบหมาย', async ({ page, request }) => {
    await signIn(page);
    const cookie = await cookieOf(page);
    const real = (await (await request.get('/api/users', { headers: { cookie } })).json()).items as { name: string; email: string; role: string }[];
    const assignable = (await (await request.get('/api/users/assignable', { headers: { cookie } })).json()).items as { name: string }[];

    await page.goto('/admin/users');
    await expect(page.getByText(real[0].name).first()).toBeVisible();

    for (const ghost of ['kittipong@jkp.co', 'araya@jkp.co', 'thanakrit@partner.co', 'linwei@jkp.co']) {
      if (real.some((u) => u.email === ghost)) continue;
      await expect(page.getByText(ghost), `${ghost} ไม่มีตัวตนในระบบ`).toHaveCount(0);
    }

    /* เมนูมอบหมายต้องเป็นชุดย่อยของผู้ใช้จริง — บทบาทที่ไม่ควรถือ lead
       (translator / co_agent) ต้องไม่หลุดเข้าไป */
    const emails = new Set(real.map((u) => u.name));
    for (const a of assignable) expect(emails.has(a.name), `${a.name} ไม่อยู่ในทะเบียนผู้ใช้`).toBe(true);
    const shouldNot = real.filter((u) => ['translator', 'co_agent'].includes(u.role)).map((u) => u.name);
    for (const n of shouldNot) expect(assignable.some((a) => a.name === n), `${n} ไม่ควรรับมอบหมาย lead`).toBe(false);
  });
});
