/* Bring the agency's own spreadsheet in — data and photographs together.
 *
 *   npm run import:xlsx -- "DATA .xlsx"                  # ตรวจอย่างเดียว (ค่าเริ่มต้น)
 *   npm run import:xlsx -- "DATA .xlsx" --commit         # เขียนจริง
 *   npm run import:xlsx -- "DATA .xlsx" --limit 5 --commit
 *
 * The existing CSV importer cannot take this file. The team keeps its
 * inventory in Excel with the photographs pasted into a column, so a CSV
 * export loses all 388 of them, and several columns are written the way a
 * person writes them rather than the way the database stores them:
 *
 *   listing_date   45411                → 2024-05-15   (Excel keeps days since 1900)
 *   deal_type      (ว่างทั้งไฟล์)        → อ่านจากชื่อประกาศ "ให้เช่า" / "ขาย"
 *   status         ว่าง / ไม่ว่าง         → นี่คือสถานะการเช่า ไม่ใช่สถานะการเผยแพร่
 *   ละติจูด ลองติจูด                     → location_map (ฟิลด์พิกัดที่ทุกประเภทใช้ร่วมกัน)
 *
 * Validate-only is the default because an import is not something the admin
 * screen can undo.
 */
import ExcelJS from 'exceljs';
import { basename } from 'node:path';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PROPERTY_TYPES } from '../src/lib/propertySchema.ts';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const commit = args.includes('--commit');
/* --sql <ไฟล์> : ไม่แตะฐานข้อมูลนี้ แต่เขียนคำสั่ง SQL ออกมา สำหรับฐานข้อมูล
   production ที่เครื่องนี้ต่อตรงไม่ได้ (อยู่หลัง firewall ในคอนเทนเนอร์)
   อัปเดตเฉพาะช่องที่ชีตมีค่า ช่องอื่นในเรกคอร์ดไม่ถูกแตะ — รูปภาพไม่รวมด้วย */
const sqlOut = args.includes('--sql') ? args[args.indexOf('--sql') + 1] : null;
const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity;
const show = Number(args[args.indexOf('--show') + 1]) || 0;

if (!file) {
  console.error('ใช้: npm run import:xlsx -- <ไฟล์.xlsx> [--limit N] [--commit]');
  process.exit(1);
}

const db = new PrismaClient();

/* ---------- แปลงค่าให้เป็นรูปที่ฐานข้อมูลเก็บ ---------------------------- */

/* วันที่มาได้สามหน้า: เซลล์ที่จัดรูปแบบเป็นวันที่ exceljs คืนเป็น Date,
   เซลล์ที่เป็นตัวเลขดิบคืนเป็นเลขนับวันของ Excel, และบางแถวเป็นข้อความ */
/* ชีตของทีมพิมพ์วันที่แบบไทยย่อ เช่น 29-เม.ย.-2024 — ตอนส่งออกเป็นข้อความ
   จะไม่เหลือความเป็นวันที่ให้ exceljs อ่าน ต้องแกะเอง */
const TH_MONTH: Record<string, number> = {
  'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6,
  'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
};
const thaiDate = (s: string): string | null => {
  const m = /^(\d{1,2})-(.+?)-(\d{4})$/.exec(s);
  if (!m) return null;
  const mon = TH_MONTH[m[2]];
  if (!mon) return null;
  // ปีในชีตเป็น ค.ศ. อยู่แล้ว แต่กันไว้เผื่อมีแถวที่พิมพ์เป็น พ.ศ.
  const year = Number(m[3]) > 2400 ? Number(m[3]) - 543 : Number(m[3]);
  return `${year}-${String(mon).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};

const excelDate = (v: unknown): string | null => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object' && v && 'result' in v) return excelDate((v as { result: unknown }).result);
  const s = String(v ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const th = thaiDate(s);
  if (th) return th;
  const n = Number(s);
  // 25569 = วันที่ 1970-01-01 ในสเกลของ Excel
  if (Number.isFinite(n) && n > 20000) return new Date((n - 25569) * 86400000).toISOString().slice(0, 10);
  return null;
};

/** ไฟล์ไม่มีคอลัมน์นี้เลย แต่ชื่อประกาศบอกไว้ทุกแถว */
const dealFromTitle = (title: string): string | null => {
  const rent = /ให้เช่า|เช่า/.test(title);
  const sale = /ขาย/.test(title);
  if (rent && sale) return 'เช่า / ขาย';
  if (rent) return 'เช่า';
  if (sale) return 'ขาย';
  return null;
};

/** ว่าง/ไม่ว่าง คือสถานะการเช่า — เก็บไว้ ไม่ใช่เอาไปตัดสินว่าจะขึ้นเว็บไหม */
const AVAILABILITY: Record<string, string> = {
  'ว่าง': 'published',
  'ไม่ว่าง': 'unavailable',
  'อยู่ระหว่างก่อสร้าง': 'published',
};

/* สเปรดชีตที่คนกรอกเองย่อมมีคำที่ต่างจากรายการตัวเลือกของระบบเล็กน้อย —
   ขีดคนละแบบ ช่องว่างเกิน หรือคำที่ทีมใช้เรียกกันเอง เทียบแบบผ่อนปรนก่อน
   แล้วเก็บ "ค่าที่ระบบรู้จัก" ลงไป ไม่ใช่เก็บคำที่พิมพ์มา */
const loose = (s: string) =>
  s.normalize('NFC').replace(/[—–−-]/g, '-').replace(/\s+/g, '').replace(/^สี/, '').toLowerCase();

/* คำที่ทีมใช้ ↔ ตัวเลือกที่ระบบมี — เติมได้เมื่อเจอคำใหม่
   ระวัง: ตารางนี้เคยถูกใช้กลบข้อมูลที่ระบบยังไม่มีตัวเลือกรองรับ เช่นบังคับ
   "ชมพู — คลังสินค้า" ให้เป็นเม็ดมะปราง และ "3 Phase 30/100 amp" ให้เหลือ
   "3 เฟส" ซึ่งทำให้ค่าที่ทีมกรอกหายไปเงียบ ๆ ถ้าค่าที่ทีมใช้ไม่มีในระบบ
   ให้เพิ่มตัวเลือกในระบบ อย่ามาบังคับให้เป็นค่าอื่นตรงนี้ */
const SYNONYM: Record<string, string> = {
  // สะกดต่างกันเล็กน้อยเท่านั้น ไม่ใช่การเปลี่ยนความหมาย
  'เจ้าของเอง': 'เจ้าของ',
  '4ชั้น': 'มากกว่า 3 ชั้น',
  '5ชั้น': 'มากกว่า 3 ชั้น',
  'มากกว่า3ชั้น': 'มากกว่า 3 ชั้น',
};

const TYPE_BY_LABEL: Record<string, string> = {
  'โกดัง': 'warehouse',
  'โกดัง / คลังสินค้า': 'warehouse',
  'คลังสินค้า': 'warehouse',
  'โรงงาน': 'factory',
  'โชว์รูม': 'showroom',
  'โชว์รูมและเชิงพาณิชย์': 'showroom',
  'บ้าน': 'house',
  'คอนโด': 'condo',
  'ที่ดินเปล่า': 'land',
};

/* "13.639, 100.593" → รูปเดียวกับที่แผนที่ในหน้าแก้ไขเก็บไว้ ({lat,lng,link})
   ถ้าเก็บเป็นข้อความ หมุดจะไม่ขึ้นและลิงก์ Google Maps จะว่าง */
const coords = (v: unknown): { lat: number; lng: number; link: string } | null => {
  const m = String(v ?? '').trim().match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (!m) return null;
  const lat = Number(m[1]), lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng, link: `https://www.google.com/maps?q=${lat},${lng}` };
};

/* ตัวเลขในไฟล์มาพร้อมหน่วยที่คนพิมพ์ไว้ ("3 ชั้น", "3 เดือน", "7 ม.")
   ฟิลด์ตัวเลขของระบบเก็บเฉพาะตัวเลข หน่วยอยู่ในนิยามฟิลด์อยู่แล้ว */
const num = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = text(v).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

const text = (v: unknown): string => {
  if (v == null) return '';
  // เซลล์สูตรมาเป็น { formula, result } — เอาผลลัพธ์ ไม่ใช่ตัวสูตร
  if (typeof v === 'object' && 'result' in (v as object)) return text((v as { result: unknown }).result);
  if (typeof v === 'object' && 'richText' in (v as object)) {
    return ((v as { richText: { text: string }[] }).richText ?? []).map((r) => r.text).join('').trim();
  }
  if (typeof v === 'object' && 'text' in (v as object)) return String((v as { text: string }).text).trim();
  return String(v).trim();
};

/* ---------- อ่านไฟล์ ------------------------------------------------------ */

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(file);
const ws = wb.worksheets[0];

const header: Record<number, string> = {};
ws.getRow(1).eachCell((cell, col) => { header[col] = text(cell.value); });
const colOf = (name: string) => Number(Object.keys(header).find((c) => header[Number(c)] === name) ?? 0);

/** รูปที่ฝังในเซลล์: exceljs บอกว่ารูปนี้ยึดอยู่แถวไหน */
const imagesByRow = new Map<number, { extension: string; buffer: Buffer }[]>();
for (const img of ws.getImages()) {
  const row = Math.round(img.range.tl.nativeRow) + 1;   // nativeRow นับจาก 0
  const media = wb.getImage(Number(img.imageId));
  if (!media?.buffer) continue;
  const list = imagesByRow.get(row) ?? [];
  list.push({ extension: media.extension, buffer: Buffer.from(media.buffer) });
  imagesByRow.set(row, list);
}

/* ---------- แปลงทีละแถว --------------------------------------------------- */

type Ready = {
  line: number;
  code: string;
  typeKey: string;
  title: string;
  listingStatus: string;
  values: Record<string, unknown>;
  photos: { extension: string; buffer: Buffer }[];
};

const ready: Ready[] = [];
const problems: string[] = [];
const notes = new Map<string, number>();
const note = (s: string) => notes.set(s, (notes.get(s) ?? 0) + 1);
/** ค่าที่ระบบไม่รู้จัก แยกตามฟิลด์ — นี่คือรายการที่ต้องตัดสินใจ ไม่ใช่ error */
const unknown = new Map<string, Map<string, number>>();
const unknownValue = (field: string, value: string) => {
  const m = unknown.get(field) ?? new Map<string, number>();
  m.set(value, (m.get(value) ?? 0) + 1);
  unknown.set(field, m);
};

/* ชื่อคอลัมน์ใน Master Sheet ที่ไม่ตรงกับคีย์ในระบบ — ถ้าไม่จับคู่ไว้ ข้อมูล
   ภาษีและ "จ่ายกับใคร" จะถูกข้ามเงียบ ๆ ทั้งคอลัมน์ */
const COLUMN_ALIAS: Record<string, string> = {
  'Water_bill_pay': 'water_bill_pay',
  'water_bill_pay': 'water_bill_pay',
  'ภาษีหัก ณ ที่จ่าย': 'withholding_tax',
  'ภาษีที่ดิน': 'land_tax',
  'อากรแสตมป์': 'stamp_duty',
  'PIC': 'pic',
  'ทำสัญญาในนาม': 'contract_name',
};

const SKIP_COLUMNS = new Set(['รูป', 'รหัสทรัพย์', 'ประเภททรัพย์', 'public_code', 'title', 'status', 'listing_status', 'listing_date', 'photos', 'ละติจูด ลองติจูด']);

ws.eachRow((row, line) => {
  if (line === 1 || ready.length >= limit) return;
  const cell = (name: string) => text(row.getCell(colOf(name)).value);

  const code = cell('public_code');
  if (!code) return;                                  // แถวว่าง — ไฟล์มี 607 แถว

  const typeLabel = cell('ประเภททรัพย์');
  const typeKey = TYPE_BY_LABEL[typeLabel];
  if (!typeKey) { problems.push(`แถว ${line} · ${code}: ไม่รู้จักประเภท "${typeLabel}"`); return; }

  const title = cell('title');
  const deal = cell('deal_type') || dealFromTitle(title);
  if (!deal) { problems.push(`แถว ${line} · ${code}: ไม่มี deal_type และเดาจากชื่อไม่ได้`); return; }
  if (!cell('deal_type')) note('เดา deal_type จากชื่อประกาศ');

  const date = excelDate(row.getCell(colOf('listing_date')).value);
  if (!date) { problems.push(`แถว ${line} · ${code}: วันที่ลงประกาศอ่านไม่ได้`); return; }

  const availability = cell('status');
  const listingStatus = AVAILABILITY[availability] ?? 'published';
  if (!AVAILABILITY[availability]) note(`สถานะ "${availability}" ไม่รู้จัก — ถือว่าเผยแพร่`);

  const dealField = PROPERTY_TYPES.find((t) => t.key === typeKey)!.fields.find((f) => f.key === 'deal_type');
  const dealValue = dealField?.options?.find((o) => loose(o) === loose(deal)) ?? deal;
  const values: Record<string, unknown> = {
    deal_type: dealValue,
    listing_date: date,
  };

  // คอลัมน์ที่ชื่อตรงกับฟิลด์ของระบบอยู่แล้ว
  const schema = PROPERTY_TYPES.find((t) => t.key === typeKey)!;
  const known = new Set(schema.fields.map((f) => f.key));
  for (const [colIdx, name] of Object.entries(header)) {
    if (SKIP_COLUMNS.has(name)) continue;
    const key = COLUMN_ALIAS[name] ?? name;
    if (!known.has(key)) continue;
    const raw = text(row.getCell(Number(colIdx)).value);
    if (!raw) continue;
    const field = schema.fields.find((f) => f.key === key)!;

    /* ภาษี/ค่าธรรมเนียมเก็บเป็นคู่ { payer, amount } ส่วนในชีตมีแค่ชื่อผู้จ่าย
       ("เจ้าของ") — เก็บเป็นผู้รับผิดชอบ ปล่อยจำนวนเงินว่างไว้ให้ทีมเติม */
    if (field.kind === 'group' && field.sub?.some((x) => x.key === 'payer')) {
      const payers = field.sub.find((x) => x.key === 'payer')?.options ?? [];
      const hit = payers.find((p) => loose(p) === loose(raw));
      if (hit) values[key] = { payer: hit };
      else note(`${name}: "${raw.slice(0, 20)}" ไม่อยู่ในตัวเลือกผู้รับผิดชอบ — ข้ามช่องนี้`);
      continue;
    }

    /* 'price' เก็บเป็นตัวเลขเหมือน 'number' — ถ้าปล่อยเป็นข้อความ หน้าเว็บจะ
       อ่านไม่ออกแล้วขึ้น "ติดต่อสอบถาม" ทั้งที่ในไฟล์มีราคาอยู่ */
    if (field.kind === 'number' || field.kind === 'price') {
      const n = num(raw);
      if (n === null) { note(`${name}: อ่านเป็นตัวเลขไม่ได้ ("${raw.slice(0, 20)}") — ข้ามช่องนี้`); continue; }
      values[key] = n;
      continue;
    }

    /* ฟิลด์ที่มีรายการตัวเลือก: ค่าที่ไม่อยู่ในรายการจะทำให้หน้าเว็บแสดงคำที่
       ระบบแปลไม่ได้ และตัวกรองก็กรองไม่เจอ — รายงานไว้ ไม่ยัดลงไป */
    if ((field.kind === 'select' || field.kind === 'dealtype') && field.options?.length) {
      /* อย่าตั้งชื่อว่า key — จะบังคีย์ของฟิลด์ที่ประกาศไว้ข้างบน แล้วค่าจะถูก
         เก็บใต้ชื่อที่เพี้ยนไป ทำให้ทุกฟิลด์แบบตัวเลือกหายทั้งคอลัมน์ */
      const norm = loose(raw);
      const hit = field.options.find((o) => o === raw)
        ?? field.options.find((o) => loose(o) === norm)
        ?? field.options.find((o) => o === SYNONYM[norm])
        ?? undefined;
      if (!hit) { unknownValue(name, raw); continue; }
      values[key] = hit;
      continue;
    }

    if (field.kind === 'multiselect' && field.options?.length) {
      const picked = raw.split('|').map((p) => p.trim()).filter(Boolean);
      const canon = (p: string) => field.options!.find((o) => o === p) ?? field.options!.find((o) => loose(o) === loose(p));
      const good = picked.map(canon).filter((p): p is string => !!p);
      const bad = picked.filter((p) => !canon(p));
      for (const b of bad) unknownValue(name, b);
      if (good.length) values[key] = good;
      continue;
    }

    values[key] = raw;
  }

  const pin = coords(cell('ละติจูด ลองติจูด'));
  if (pin) values.location_map = pin;

  const photos = imagesByRow.get(line) ?? [];
  if (!photos.length) note('ไม่มีรูปในแถว');

  ready.push({ line, code, typeKey, title, listingStatus, values, photos });
});

/* ---------- รายงาน -------------------------------------------------------- */

const byType = ready.reduce<Record<string, number>>((a, r) => ({ ...a, [r.typeKey]: (a[r.typeKey] ?? 0) + 1 }), {});
const withPhotos = ready.filter((r) => r.photos.length).length;
const photoCount = ready.reduce((n, r) => n + r.photos.length, 0);

console.log(`\nไฟล์: ${basename(file)}`);
console.log(`พร้อมนำเข้า ${ready.length} รายการ · ติดปัญหา ${problems.length} รายการ`);
console.log(`ประเภท: ${Object.entries(byType).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`รูป: ${photoCount} ใบ ใน ${withPhotos} รายการ (อีก ${ready.length - withPhotos} รายการไม่มีรูป)`);
/* นับว่าฟิลด์สำคัญเข้าไปได้กี่รายการ — สำคัญกว่ารายการเตือนที่ยาวเป็นหางว่าว */
const KEY_FIELDS = ['deal_type', 'zoning_color', 'price_rent', 'price_sale', 'building_area_total', 'location_map', 'lessor_name', 'features'];
console.log('\nฟิลด์สำคัญที่เข้าไปได้:');
for (const k of KEY_FIELDS) {
  const n = ready.filter((r) => r.values[k] !== undefined && r.values[k] !== '').length;
  console.log(`  ${k.padEnd(22)} ${n}/${ready.length}`);
}

if (notes.size) {
  console.log('\nสิ่งที่สคริปต์ตัดสินใจให้:');
  for (const [k, n] of notes) console.log(`  ${n.toString().padStart(4)} × ${k}`);
}
if (unknown.size) {
  console.log('\nค่าที่ทีมใช้ แต่ระบบยังไม่มีในตัวเลือก — ต้องตัดสินใจก่อนนำเข้า:');
  for (const [field, values] of [...unknown].sort((a, b) => b[1].size - a[1].size)) {
    const opts = PROPERTY_TYPES.find((t) => t.key === 'warehouse')!.fields.find((f) => f.key === field)?.options ?? [];
    console.log(`\n  ${field}  (ระบบมี: ${opts.join(' · ') || '—'})`);
    for (const [v, n] of [...values].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${String(n).padStart(4)} × ${v}`);
    }
  }
}

if (problems.length) {
  console.log('\nรายการที่เข้าไม่ได้:');
  for (const p of problems.slice(0, 20)) console.log('  ' + p);
  if (problems.length > 20) console.log(`  … อีก ${problems.length - 20} รายการ`);
}

const existing = await db.property.findMany({ where: { publicCode: { in: ready.map((r) => r.code) } }, select: { publicCode: true } });
if (existing.length) console.log(`\nมีรหัสซ้ำกับที่อยู่ในระบบแล้ว ${existing.length} รายการ — จะอัปเดตทับ`);

if (show) {
  console.log('\nตัวอย่างที่แปลงแล้ว:');
  for (const r of ready.slice(0, show)) {
    console.log(`\n  ${r.code} · ${r.typeKey} · ${r.listingStatus} · รูป ${r.photos.length} ใบ`);
    console.log(`  ${r.title}`);
    for (const [k, v] of Object.entries(r.values)) console.log(`    ${k.padEnd(22)} ${String(v).slice(0, 60)}`);
  }
}

if (sqlOut) {
  const esc = (v: string) => v.replace(/'/g, "''");
  const lines = ['begin;'];
  let fields = 0;
  for (const r of ready) {
    /* รูปมาจากไฟล์ ไม่ใช่จากชีต — โหมดนี้อัปเดตเฉพาะค่าที่กรอกในชีต */
    const patch = Object.fromEntries(Object.entries(r.values).filter(([k]) => k !== 'photos'));
    if (!Object.keys(patch).length) continue;
    fields += Object.keys(patch).length;
    lines.push(
      `update "Property" set values = values || '${esc(JSON.stringify(patch))}'::jsonb, "updatedAt" = now() ` +
      `where "publicCode" = '${esc(r.code)}';`,
    );
    /* ว่าง/ไม่ว่าง จากชีต — เก็บที่ Listing.status เหมือนตอนนำเข้าปกติ */
    lines.push(
      `update "Listing" l set status = '${esc(r.listingStatus)}' from "Property" p ` +
      `where l."propertyId" = p.id and p."publicCode" = '${esc(r.code)}';`,
    );
  }
  lines.push('commit;');
  const { writeFile } = await import('node:fs/promises');
  await writeFile(sqlOut, lines.join('\n') + '\n', 'utf8');
  console.log(`\nเขียน SQL ${lines.length - 2} คำสั่ง (${fields} ช่อง) ไปที่ ${sqlOut}`);
  await db.$disconnect();
  process.exit(0);
}

if (!commit) {
  console.log('\n(ตรวจอย่างเดียว · ใส่ --commit เพื่อเขียนจริง)');
  await db.$disconnect();
  process.exit(0);
}

/* ---------- เขียนจริง ------------------------------------------------------ */

const { putObject, publicUrlFor, originalKey } = await import('../src/lib/server/mediaStore.ts');
const sharp = (await import('sharp')).default;

/* รูปในไฟล์ Excel เฉลี่ยเกือบ 1 MB ต่อใบ บางใบ 5 MB — ขนาดนั้นไม่มีประโยชน์
   กับหน้าเว็บ มีแต่ทำให้คนโหลดช้าและกินดิสก์ของเครื่องที่แชร์กับเว็บอื่น */
const fit = async (buf: Buffer) =>
  sharp(buf).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toBuffer();

const org = await db.org.findFirst({ select: { id: true } });
if (!org) throw new Error('ไม่พบองค์กรในฐานข้อมูล');

let done = 0;
for (const r of ready) {
  const urls: string[] = [];
  for (const [i, img] of r.photos.entries()) {
    const mime = 'image/jpeg';
    const body = await fit(img.buffer);
    const asset = await db.mediaAsset.create({
      data: {
        orgId: org.id,
        filename: `${r.code}-${i + 1}.jpg`,
        mime,
        size: body.length,
        path: '',
        // ลายน้ำมาจากการตั้งค่าใน /admin/branding ชั้นเดียว ไม่ฝังข้อความซ้ำตอนนำเข้า
        watermarkType: 'none',
      },
    });
    // เก็บต้นฉบับไว้ เสิร์ฟเฉพาะตัวที่ใส่ลายน้ำแล้ว — เหมือนตอนอัปโหลดผ่านหน้าเว็บ
    await putObject(asset.id, mime, body, originalKey(asset.id, mime));
    // ไฟล์ที่เสิร์ฟ = ต้นฉบับ ลายน้ำโลโก้ประทับตอนอ่านตามค่าใน /admin/branding
    const shown = body;
    await putObject(asset.id, mime, shown);
    const url = publicUrlFor(asset.id, mime);
    await db.mediaAsset.update({ where: { id: asset.id }, data: { path: url } });
    urls.push(url);
  }
  if (urls.length) r.values.photos = urls;

  const property = await db.property.upsert({
    where: { publicCode: r.code },
    update: { title: r.title, typeKey: r.typeKey, status: 'active', values: r.values as Prisma.InputJsonValue },
    create: {
      orgId: org.id, publicCode: r.code, typeKey: r.typeKey, title: r.title,
      status: 'active', values: r.values as Prisma.InputJsonValue,
    },
  });

  const listing = await db.listing.findFirst({ where: { propertyId: property.id }, select: { id: true } });
  if (listing) await db.listing.update({ where: { id: listing.id }, data: { status: r.listingStatus } });
  else await db.listing.create({ data: { orgId: org.id, propertyId: property.id, status: r.listingStatus } });

  done++;
  if (done % 25 === 0) console.log(`  … ${done}/${ready.length}`);
}

console.log(`\nเขียนแล้ว ${done} รายการ · รูป ${photoCount} ใบ`);
await db.$disconnect();
