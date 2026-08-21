/* Where a pop-up menu lands. Every admin menu is fixed-positioned to escape a
   clipping ancestor, so these numbers are the only thing keeping it on screen. */
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { placeMenu } from '../../src/lib/menuPlacement.ts';

const rect = (o: Partial<DOMRect>): DOMRect => ({
  top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0,
  toJSON: () => ({}), ...o,
} as DOMRect);

beforeEach(() => {
  (globalThis as { window?: unknown }).window = { innerWidth: 1440, innerHeight: 900 };
});

describe('placeMenu', () => {
  test('opens under the trigger when there is room', () => {
    const b = placeMenu(rect({ top: 100, bottom: 130, left: 200, right: 400, width: 200 }));
    assert.equal(b.top, 136);
    assert.equal(b.left, 200);
  });

  /* The properties row menu is 210px wide hanging off a 30px button at the far
     right of the table — lining up the left edges pushed it off the window. */
  test('a right-aligned menu hangs back from the trigger, not past it', () => {
    const b = placeMenu(rect({ top: 300, bottom: 330, left: 1380, right: 1410, width: 30 }), { width: 210, align: 'right' });
    assert.equal(b.width, 210);
    assert.equal(b.left, 1200, 'the menu should end where the button ends');
    assert.ok(b.left + b.width <= 1440);
  });

  test('a trigger near the bottom flips the menu above it', () => {
    const b = placeMenu(rect({ top: 830, bottom: 860, left: 100, right: 300, width: 200 }), { maxHeight: 280 });
    assert.ok(b.top < 830, 'the menu should sit above a trigger with no room below');
    assert.ok(b.top >= 8);
    assert.ok(b.top + b.maxHeight <= 830, 'it should not cover its own trigger');
  });

  test('the menu never starts off either edge of the window', () => {
    const offLeft = placeMenu(rect({ top: 10, bottom: 40, left: -300, right: -100, width: 200 }), { width: 210 });
    assert.equal(offLeft.left, 8);
    const offRight = placeMenu(rect({ top: 10, bottom: 40, left: 1430, right: 1460, width: 30 }), { width: 210 });
    assert.ok(offRight.left + 210 <= 1440);
  });

  test('a short window still leaves the menu tall enough to be usable', () => {
    (globalThis as { window?: unknown }).window = { innerWidth: 1440, innerHeight: 300 };
    const b = placeMenu(rect({ top: 140, bottom: 170, left: 40, right: 240, width: 200 }));
    assert.ok(b.maxHeight >= 120);
  });

  test('the menu is at least as wide as its trigger', () => {
    const b = placeMenu(rect({ top: 10, bottom: 40, left: 40, right: 640, width: 600 }));
    assert.equal(b.width, 600);
  });
});


/* พอตารางแบ่งหน้าเหลือ 25 แถว แถวสุดท้ายไม่ได้อยู่ติดขอบล่างอีกต่อไป เมนูจึง
   ไม่พลิกขึ้น แต่ที่ด้านล่างก็ไม่พอกางเต็ม รายการสุดท้ายเลยถูกตัด */
describe('เมนูที่กางเต็มด้านล่างไม่ได้ ต้องพลิกขึ้น', () => {
  const vh = 900;
  const box = (top: number) => ({ top, bottom: top + 30, left: 100, right: 130, width: 30, height: 30 } as DOMRect);

  test('เหลือที่ด้านล่างน้อยกว่าความสูงที่ขอ และด้านบนมีมากกว่า → พลิก', () => {
    const r = box(650); // เหลือด้านล่าง ~220px ด้านบน ~642px
    const m = placeMenu(r, { maxHeight: 300, width: 210 });
    assert.ok(m.top < r.top, `ควรพลิกขึ้น แต่ได้ top=${m.top} (แถวอยู่ที่ ${r.top})`);
    assert.ok(m.top + m.maxHeight <= vh, 'เมนูต้องไม่ล้นขอบล่าง');
  });

  test('ด้านล่างพอกางเต็ม → ไม่ต้องพลิก', () => {
    const r = box(120);
    const m = placeMenu(r, { maxHeight: 300, width: 210 });
    assert.ok(m.top > r.top, 'ที่ด้านล่างพอ ควรกางลงตามปกติ');
  });

  test('ทั้งบนและล่างคับ → ยังไม่ล้นจอ', () => {
    const r = box(430);
    const m = placeMenu(r, { maxHeight: 300, width: 210 });
    assert.ok(m.top >= 0 && m.top + m.maxHeight <= vh, `เมนูล้นจอ: top=${m.top} h=${m.maxHeight}`);
  });
});
