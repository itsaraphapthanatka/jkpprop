/* กรวยลีดบนแดชบอร์ด
 *
 * 29 ส.ค. 2569 · ตรวจแล้วพบว่ากรวยไม่ใช่กรวย — นับเฉพาะลีดที่ค้างอยู่ในสถานะนั้น
 * พอดี แล้วหารด้วยจำนวนลีดสถานะ new อย่างเดียว
 * บนเครื่องจริงมีลีด new 1 ใบ กับ won 3 ใบ แถวสุดท้ายจึงขึ้นเป็น 300%
 * และสองขั้น qualified / profile_received ไม่มีปุ่มไหนพาไปถึง จึงเป็น 0 ตลอดกาล
 * ทำให้กรวยดูเหมือนลูกค้าหลุดหมดตั้งแต่ต้นทาง ทั้งที่งานเดินต่อได้ตามปกติ
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildFunnel } from '../../src/lib/server/dashboard.ts';

const leads = (...pairs: [string, number][]) =>
  pairs.flatMap(([status, n]) => Array.from({ length: n }, () => ({ status })));

const pct = (s: string) => Number(s.replace('%', ''));

describe('กรวยลีด', () => {
  test('สภาพจริงบนเครื่อง (new 1 · won 3) ต้องไม่มีแถวไหนเกิน 100%', () => {
    const f = buildFunnel(leads(['new', 1], ['won', 3]));
    for (const row of f) assert.ok(pct(row.pct) <= 100, `${row.label} = ${row.pct}`);
    assert.equal(f[0].count, 4, 'ทุกใบต้องนับว่าเข้ามาแล้ว');
    assert.equal(f[f.length - 1].count, 3, 'ปิดดีลสำเร็จต้องเป็น 3');
  });

  test('ลดหลั่นลงเสมอ — ขั้นหลังต้องไม่มากกว่าขั้นก่อน', () => {
    const f = buildFunnel(leads(
      ['new', 5], ['requirements_confirmed', 4], ['shortlisted', 3],
      ['visit_scheduled', 2], ['negotiating', 1], ['won', 2], ['lost', 3],
    ));
    for (let i = 1; i < f.length; i++) {
      assert.ok(f[i].count <= f[i - 1].count, `${f[i].label} (${f[i].count}) มากกว่า ${f[i - 1].label} (${f[i - 1].count})`);
    }
  });

  test('ลีดที่ไปไกลแล้ว นับรวมในทุกขั้นก่อนหน้าด้วย', () => {
    const f = buildFunnel(leads(['won', 1]));
    for (const row of f) assert.equal(row.count, 1, `${row.label} ควรนับใบที่ปิดดีลแล้วด้วย`);
  });

  test('ลีดที่ไม่สำเร็จ นับแค่ว่าเข้ามาแล้ว ไม่ถูกนับว่าไปถึงขั้นหลัง', () => {
    const f = buildFunnel(leads(['lost', 4]));
    assert.equal(f[0].count, 4);
    for (const row of f.slice(1)) assert.equal(row.count, 0, `${row.label} ไม่ควรนับลีดที่ไม่สำเร็จ`);
  });

  test('ไม่มีลีดเลย ต้องไม่พังและไม่หารด้วยศูนย์', () => {
    const f = buildFunnel([]);
    assert.ok(f.length > 0);
    for (const row of f) { assert.equal(row.count, 0); assert.equal(pct(row.pct), 0); }
  });

  test('ไม่มีขั้นที่ไม่มีทางเกิดขึ้นจริงหลงเหลืออยู่ในกรวย', () => {
    /* qualified / profile_received ไม่มีปุ่มไหนพาไปถึง — ถ้าเอากลับมาโดยไม่ได้
       ทำให้ใช้งานได้จริง กรวยจะมีแถบว่างถาวรอีกครั้ง */
    const f = buildFunnel(leads(['new', 3]));
    const labels = f.map((r) => r.label).join(' ');
    assert.ok(!/Qualified|Profile received/i.test(labels), `ยังมีขั้นที่ไปไม่ถึงอยู่: ${labels}`);
  });
});
