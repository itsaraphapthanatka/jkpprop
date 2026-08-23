/* ไฟล์ CSV ที่ปุ่ม Export ในหน้า Properties และ Listings สร้างขึ้น
 *
 * ลูกค้าแจ้งว่า "export ข้อมูลออกมาน้อยไป ให้ export ทุกฟิลด์ของ
 * Properties, Listings" — เดิมทั้งสองหน้าเขียนรายชื่อคอลัมน์ไว้เองหน้าละชุด
 * ได้ออกมา 8–9 ช่อง จากทั้งหมด 88 ฟิลด์ที่ระบบเก็บ ข้อมูลอย่างค่าไฟ ค่าน้ำ
 * ความสูงใต้คาน ใบอนุญาต ผังเมือง เจ้าของ ฯลฯ ไม่เคยออกมาเลย
 *
 * คอลัมน์สร้างจาก schema โดยตรง (รวมทุกประเภททรัพย์แล้วตัดที่ซ้ำออก) เพิ่ม
 * ฟิลด์ใหม่ในฟอร์มครั้งหน้าจึงโผล่ในไฟล์เองโดยไม่ต้องมาแก้ที่นี่
 *
 * หมายเหตุ: ปุ่ม Export เปิดให้เฉพาะเจ้าของระบบ (สิทธิ์ export ถูกห้ามไว้กับ
 * ทุกบทบาทอื่นใน rbac.ts) ไฟล์นี้จึงมีข้อมูลภายในอย่างเบอร์ผู้ให้เช่าและพิกัด
 * ติดไปด้วย — เป็นข้อมูลของบริษัทเอง แต่ห้ามส่งต่อออกนอกทีม
 */
import { PROPERTY_TYPES, type FieldDef } from '@/lib/propertySchema';

export type ExportCol = { key: string; label: string; sub?: string };

/* ฟิลด์ที่ระบบเก็บเองและไม่ใช่ของที่คนกรอก — ออกเป็นคอลัมน์ต้นไฟล์แทน */
const BASE_KEYS = new Set(['photos', 'video']);

/* ฟิลด์เดียวกันบางตัวตั้งชื่อไม่เหมือนกันในแต่ละประเภททรัพย์ (zoning_color เป็น
   "ผังเมืองสีอะไร" ในที่ดิน แต่เป็น "พื้นที่สี (ผังเมือง)" ในโกดัง) ข้อมูลเป็นช่อง
   เดียวกัน จึงเป็นคอลัมน์เดียว แต่ใส่ชื่อทั้งสองแบบไว้ให้คนหาเจอไม่ว่าจะคุ้นชื่อไหน */
function labelsByKey(): Map<string, string> {
  const all = new Map<string, Set<string>>();
  for (const t of PROPERTY_TYPES) {
    for (const f of t.fields) {
      if (!all.has(f.key)) all.set(f.key, new Set());
      all.get(f.key)!.add(f.label);
    }
  }
  return new Map([...all].map(([k, v]) => [k, [...v].join(' / ')]));
}

/** ทุกฟิลด์ของทุกประเภททรัพย์ เรียงตามลำดับใน schema ตัดที่ซ้ำออก */
export function exportColumns(): ExportCol[] {
  const seen = new Set<string>();
  const names = labelsByKey();
  const out: ExportCol[] = [];
  const push = (f: FieldDef) => {
    if (BASE_KEYS.has(f.key)) return;
    const label = names.get(f.key) ?? f.label;
    /* ฟิลด์กลุ่ม (ขนาดที่ดิน ไร่/งาน/วา · ภาษี ใครจ่าย/เท่าไร) แยกเป็นคอลัมน์ย่อย
       ไม่งั้นจะได้ก้อน JSON ที่เอาไปใช้ต่อใน Excel ไม่ได้ */
    if ((f.kind === 'group' || f.kind === 'location') && f.sub?.length) {
      for (const sub of f.sub) {
        const id = `${f.key}.${sub.key}`;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ key: f.key, sub: sub.key, label: `${label} — ${sub.label}` });
      }
      return;
    }
    if (seen.has(f.key)) return;
    seen.add(f.key);
    out.push({ key: f.key, label });
  };
  for (const t of PROPERTY_TYPES) for (const f of t.fields) push(f);
  return out;
}

/** ค่าหนึ่งช่องในรูปแบบที่เปิดใน Excel แล้วอ่านรู้เรื่อง */
export function exportValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'boolean') return v ? 'ใช่' : 'ไม่ใช่';
  if (Array.isArray(v)) return v.map((x) => exportValue(x)).filter(Boolean).join(' | ');
  if (typeof v === 'object') {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => (val === null || val === undefined || val === '' ? '' : `${k}=${exportValue(val)}`))
      .filter(Boolean)
      .join('; ');
  }
  return String(v);
}

/** ใส่เครื่องหมายคำพูดเฉพาะช่องที่ต้องการจริง ๆ */
export const csvCell = (v: unknown) => {
  const t = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export type ExportRow = {
  code: string;
  title: string;
  typeLabel: string;
  status: string;
  location: string;
  updatedAt: number | null;
  values: Record<string, unknown>;
  /** หัวเรื่อง/คำบรรยายภาษาอื่น — เก็บแยกจาก values */
  i18n?: Record<string, { title?: string; description?: string } | undefined>;
  /** จำนวนรูป และลิงก์รูปทั้งหมด */
  photos?: string[];
};

const BASE_HEAD = [
  'รหัสทรัพย์', 'ชื่อประกาศ (ไทย)', 'ประเภททรัพย์', 'สถานะ', 'ทำเลแบบเต็ม', 'อัปเดตล่าสุด',
  'จำนวนรูป', 'ลิงก์รูปทั้งหมด',
  'ชื่อประกาศ (EN)', 'คำบรรยาย (EN)', 'ชื่อประกาศ (ZH)', 'คำบรรยาย (ZH)',
];

/** สร้างไฟล์ CSV ทั้งใบ พร้อม BOM ให้ Excel อ่านภาษาไทยออก */
export function buildPropertyCsv(rows: ExportRow[]): string {
  const cols = exportColumns();
  const head = [...BASE_HEAD, ...cols.map((c) => c.label)];
  const body = rows.map((r) => {
    const v = r.values ?? {};
    const photos = r.photos ?? (Array.isArray(v.photos) ? (v.photos as unknown[]).filter((x): x is string => typeof x === 'string') : []);
    const base = [
      r.code, r.title, r.typeLabel, r.status, r.location,
      r.updatedAt ? new Date(r.updatedAt).toISOString().slice(0, 10) : '',
      String(photos.length), photos.join(' | '),
      r.i18n?.en?.title ?? '', r.i18n?.en?.description ?? '',
      r.i18n?.zh?.title ?? '', r.i18n?.zh?.description ?? '',
    ];
    const rest = cols.map((c) => {
      const raw = c.sub ? (v[c.key] as Record<string, unknown> | undefined)?.[c.sub] : v[c.key];
      return exportValue(raw);
    });
    return [...base, ...rest].map(csvCell).join(',');
  });
  return '﻿' + [head.map(csvCell).join(','), ...body].join('\n');
}
