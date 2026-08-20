/* หน้าเว็บฝั่งลูกค้าต้องใช้สีของแบรนด์เท่านั้น
 *
 * ลูกค้าคอมเมนต์ว่า "ไอคอนมีสีเหลืองปนมา" และสไลด์ 6 เขียนไว้ว่า "สี —
 * เปลี่ยนเป็นสีเทา" — ในโค้ดมีสีทอง #D9A62B กระจายอยู่สี่ที่บนหน้าเว็บฝั่ง
 * ลูกค้า (หัวเมนูเลือกภาษาสามชุด กับวงกลมไอคอนโทรศัพท์ในหน้าติดต่อ) และแผนที่
 * หน้าแรกก็ถมจังหวัดด้วยสีทราย ทั้งที่ชุดสีของแบรนด์มีแต่เขียว-เทอร์ควอยซ์
 *
 * เทสต์นี้อ่านไฟล์ตรง ๆ เหมือน publicCopy — สีที่ไม่อยู่ในชุดจะถูกจับตั้งแต่
 * ตอนเขียน ไม่ต้องรอให้ลูกค้าเห็น
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../src/', import.meta.url).pathname;
const PUBLIC_DIRS = ['components/site', 'components/home', 'components/property', 'components/listing'];

/* สีที่อนุญาตนอกเหนือจากโทเคน CSS — กลาง ๆ (ขาว/ดำ/เทา) สีสถานะ และสีที่มี
   เหตุผลเฉพาะตัว เช่น ธงชาติกับสีผังเมืองตามกฎหมาย */
const ALLOWED = new Set([
  '#fff', '#ffffff', '#000', '#000000',
  '#0D6C3B', '#034956', '#273c33', '#2DFB91', '#04140C', '#0E7C86', '#022E38', '#0B5F68',
  '#C0392B',                       // ข้อความเตือน/ลบ
  /* สีบอกสถานะ ไม่ใช่สีตกแต่ง — เขียว/เหลือง/แดง ของ "สนใจ · ยังไม่ตัดสินใจ ·
     ไม่สนใจ" ในหน้าที่ลูกค้ากดเลือกทรัพย์ ต้องต่างกันให้เห็นชัดในแวบเดียว */
  '#9A741C', '#FBF3E1',
  '#C7D2CE', '#9FB0AA',            // เทาอมเขียวของแผนที่
  '#EE1C25', '#FFDE00', '#012169', '#C8102E', // ธงชาติจีนกับอังกฤษในตัวเลือกภาษา
]);

/* ไฟล์ที่สีเป็นข้อมูล ไม่ใช่การตกแต่ง */
const DATA_FILES = ['zoneSwatch.ts'];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.tsx') ? [full] : [];
  });

/** สีทองและสีเหลืองที่หลุดเข้ามา — ตรวจตามค่าจริง ไม่ใช่ตามชื่อ */
const isWarm = (hex: string): boolean => {
  const h = hex.length === 4
    ? hex.slice(1).split('').map((c) => parseInt(c + c, 16))
    : [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((p) => parseInt(p, 16));
  const [r, g, b] = h;
  // แดง+เขียวสูง น้ำเงินต่ำ = โทนเหลือง/ทอง
  return r > 140 && g > 110 && b < Math.min(r, g) - 40;
};

describe('หน้าเว็บฝั่งลูกค้าใช้สีของแบรนด์เท่านั้น', () => {
  const files = PUBLIC_DIRS.flatMap((d) => {
    try { return walk(join(ROOT, d)); } catch { return []; }
  });

  test('สแกนเจอไฟล์จริง', () => {
    assert.ok(files.length > 10, `expected to scan the public tree, saw ${files.length}`);
  });

  for (const file of files) {
    const rel = file.slice(ROOT.length);
    if (DATA_FILES.some((d) => rel.endsWith(d))) continue;
    test(rel, () => {
      const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      const found = [...src.matchAll(/#[0-9A-Fa-f]{3,8}\b/g)].map((m) => m[0]);
      const bad = found.filter((h) => !ALLOWED.has(h) && !ALLOWED.has(h.toLowerCase()) && isWarm(h));
      assert.deepEqual(
        [...new Set(bad)], [],
        `${rel} ใช้สีโทนเหลือง/ทองที่ไม่มีในชุดสีของแบรนด์ — ใช้โทเคน var(--accent) / var(--deep) แทน`,
      );
    });
  }
});
