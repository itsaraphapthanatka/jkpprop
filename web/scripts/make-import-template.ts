/* Write a fill-in CSV template per property type, plus a column reference.
 *
 *   npm run import:template            # all types → ./import-templates
 *   npm run import:template -- factory # one type
 *
 * Two files per type:
 *   <type>.csv          the sheet the team fills in — header row is field keys
 *   <type>-อธิบาย.csv    what each column means, its type, and its allowed values
 *
 * The header is field *keys* rather than Thai labels so the file survives
 * relabelling in the Field Builder; the importer accepts either, so a team
 * that prefers to retype the Thai headings is not punished for it.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PROPERTY_TYPES } from '../src/lib/propertySchema';
import { toCsv } from './lib/csv';
import { columnsFor, FIXED_COLUMNS, LISTING_STATUSES, PROPERTY_STATUSES } from './lib/importSchema';

const OUT = join(process.cwd(), 'import-templates');
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));

const KIND_HINT: Record<string, string> = {
  text: 'ข้อความ',
  textarea: 'ข้อความยาว',
  number: 'ตัวเลข',
  price: 'ตัวเลข (บาท) — ใส่แต่ตัวเลข ไม่ต้องมี ฿ หรือ ,',
  date: 'วันที่ (YYYY-MM-DD)',
  select: 'เลือก 1 ค่าจากรายการ',
  multiselect: 'เลือกได้หลายค่า — คั่นด้วย |',
  boolean: 'ใช่/ไม่ใช่ — กรอก true หรือ false (หรือ ใช่/ไม่ใช่)',
  dealtype: 'เลือก 1 ค่าจากรายการ',
  media: 'ลิงก์รูป คั่นด้วย | (อัปโหลดที่หน้าคลังสื่อก่อน แล้วคัดลอกลิงก์มา)',
};

mkdirSync(OUT, { recursive: true });

const types = only.length ? PROPERTY_TYPES.filter((t) => only.includes(t.key)) : PROPERTY_TYPES;
if (!types.length) {
  console.error(`ไม่รู้จักประเภท: ${only.join(', ')}\nที่มี: ${PROPERTY_TYPES.map((t) => t.key).join(', ')}`);
  process.exit(1);
}

for (const type of types) {
  const cols = columnsFor(type);
  const header = [...FIXED_COLUMNS.map((c) => c.key), ...cols.map((c) => c.key)];

  /* One example row, so the team can see the shape without guessing. Left as a
     comment-ish placeholder rather than realistic-looking data: a sample that
     reads like a real property is the kind of thing that gets imported by
     accident. */
  const sample = header.map((k) => {
    if (k === 'title') return `ตัวอย่าง — ลบแถวนี้ก่อนนำเข้า`;
    if (k === 'status') return 'draft';
    return '';
  });

  writeFileSync(join(OUT, `${type.key}.csv`), toCsv([header, sample]), 'utf8');

  const ref: string[][] = [
    ['คอลัมน์', 'ความหมาย', 'ชนิดข้อมูล', 'จำเป็น', 'ค่าที่เลือกได้', 'หมายเหตุ'],
    ...FIXED_COLUMNS.map((c) => [
      c.key,
      c.label,
      'ข้อความ',
      c.key === 'title' ? 'จำเป็น' : '',
      c.key === 'status' ? PROPERTY_STATUSES.join(' | ')
        : c.key === 'listing_status' ? LISTING_STATUSES.join(' | ') : '',
      c.note,
    ]),
    ...cols.map((c) => [
      c.key,
      c.label + (c.unit ? ` (${c.unit})` : ''),
      KIND_HINT[c.kind] ?? c.kind,
      c.required ? 'จำเป็น' : '',
      (c.options ?? []).join(' | '),
      [c.internalOnly ? '⚠ ข้อมูลภายใน — ไม่แสดงบนเว็บสาธารณะ' : '', c.note ?? ''].filter(Boolean).join(' · '),
    ]),
  ];
  writeFileSync(join(OUT, `${type.key}-อธิบาย.csv`), toCsv(ref), 'utf8');

  console.log(`${type.key.padEnd(10)} ${String(header.length).padStart(3)} คอลัมน์  →  import-templates/${type.key}.csv`);
}

console.log(`\nกรอกเสร็จแล้วนำเข้าด้วย:\n  npm run import:properties -- import-templates/<ไฟล์>.csv          # ตรวจอย่างเดียว\n  npm run import:properties -- import-templates/<ไฟล์>.csv --commit # เขียนจริง`);
