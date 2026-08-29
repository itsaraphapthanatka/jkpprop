/* ความคิดเห็นบนหน้าเช็คลิสต์ที่ส่งให้ลูกค้า
 *
 * 29 ส.ค. 2569 · ย้ายเว็บไปเครื่องใหม่ที่ใช้ Cloudflare Tunnel ส่งเข้าแอปตรง ๆ
 * ไม่มี nginx คอยเสิร์ฟไฟล์ static และ PHP ให้อีก หน้าเช็คลิสต์ทั้งสามหน้าจึง
 * 404 ทั้งหมดสำหรับลูกค้า ทั้งที่ไฟล์ถูกคัดลอกไปเครื่องใหม่แล้ว
 * ย้ายมาให้แอปเสิร์ฟเอง และเก็บความคิดเห็นลงฐานข้อมูลแทนไฟล์บนดิสก์
 */
import { test, expect } from './fixtures';

const PAGES = [
  ['/internal/web2026-checklist.html', 'checklist'],
  ['/internal/web2026-flow-checklist.html', 'flow'],
  ['/internal/flow-compare.html', 'compare'],
] as const;

test.describe('หน้าเช็คลิสต์ที่ส่งให้ลูกค้า', () => {
  test('ทั้งสามหน้าเปิดได้โดยไม่ต้องเข้าสู่ระบบ', async ({ request }) => {
    for (const [url] of PAGES) {
      const r = await request.get(url);
      expect(r.status(), `${url} เปิดไม่ได้`).toBe(200);
      const html = await r.text();
      expect(html, `${url} ไม่ใช่หน้าเช็คลิสต์`).toContain('<div class="wrap">');
      /* ต้องไม่เหลือการเรียก PHP ที่ไม่มีอยู่บนเครื่องใหม่แล้ว */
      expect(html, `${url} ยังเรียก comments.php อยู่`).not.toContain("API = 'comments.php'");
    }
  });

  test('คอมเมนต์ของแต่ละหน้าแยกกัน ไม่ปนข้ามหน้า', async ({ request }) => {
    const stamp = Date.now().toString(36);
    for (const [, page] of PAGES) {
      const r = await request.post('/api/page-comments', {
        headers: { 'Content-Type': 'application/json' },
        data: { page, item: 'general', name: `เทสต์ ${page}`, text: `ข้อความของ ${page} ${stamp}` },
      });
      expect([200, 201], await r.text()).toContain(r.status());
    }
    for (const [, page] of PAGES) {
      const list = (await (await request.get(`/api/page-comments?page=${page}`)).json()).comments as { text: string }[];
      const mine = list.filter((c) => c.text.includes(stamp));
      expect(mine.length, `หน้า ${page} ควรเห็นของตัวเองใบเดียว`).toBe(1);
      expect(mine[0].text, `หน้า ${page} เห็นคอมเมนต์ของหน้าอื่น`).toContain(page);
    }
  });

  test('ข้อความเปล่าและไม่มีภาพ ถูกปฏิเสธ', async ({ request }) => {
    const r = await request.post('/api/page-comments', {
      headers: { 'Content-Type': 'application/json' },
      data: { page: 'checklist', item: 'general', name: 'เทสต์', text: '   ' },
    });
    expect(r.status()).toBe(400);
  });

  test('ไม่ระบุว่าเป็นของข้อไหน ถูกปฏิเสธ', async ({ request }) => {
    const r = await request.post('/api/page-comments', {
      headers: { 'Content-Type': 'application/json' },
      data: { page: 'checklist', text: 'ลอย ๆ ไม่มีข้อ' },
    });
    expect(r.status()).toBe(400);
  });

  test('แนบภาพแล้วเก็บเข้าคลังสื่อ และเปิดดูได้จริง', async ({ request }) => {
    /* PNG 1x1 จริง — ภาพปลอมต้องถูกปฏิเสธ ไม่ใช่เก็บไฟล์เสียไว้ */
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const r = await request.post('/api/page-comments', {
      headers: { 'Content-Type': 'application/json' },
      data: { page: 'checklist', item: 'general', name: 'เทสต์ภาพ', text: 'มีภาพแนบ', imgs: [png] },
    });
    expect([200, 201], await r.text()).toContain(r.status());
    const c = (await r.json()).comment as { imgs: string[] };
    expect(c.imgs.length, 'ภาพไม่ถูกเก็บ').toBe(1);
    expect(c.imgs[0], 'ภาพไม่ได้เข้าคลังสื่อ').toContain('/api/media/');

    const img = await request.get(c.imgs[0]);
    expect(img.status(), 'ภาพที่แนบเปิดไม่ได้').toBe(200);
    expect((await img.body()).length, 'ภาพที่แนบว่างเปล่า').toBeGreaterThan(0);
  });

  test('ไฟล์ที่ไม่ใช่ภาพถูกข้าม แต่ข้อความยังถูกบันทึก', async ({ request }) => {
    const r = await request.post('/api/page-comments', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        page: 'checklist', item: 'general', name: 'เทสต์ไฟล์เสีย',
        text: 'ข้อความต้องไม่หายไปกับไฟล์ที่เปิดไม่ได้',
        imgs: ['data:application/pdf;base64,JVBERi0=', 'ไม่ใช่ data uri เลย'],
      },
    });
    expect([200, 201], await r.text()).toContain(r.status());
    const c = (await r.json()).comment as { imgs: string[]; text: string };
    expect(c.imgs.length, 'ไฟล์ที่ไม่ใช่ภาพไม่ควรถูกเก็บ').toBe(0);
    expect(c.text.length, 'ข้อความหายไปพร้อมไฟล์ที่เปิดไม่ได้').toBeGreaterThan(0);
  });
});
