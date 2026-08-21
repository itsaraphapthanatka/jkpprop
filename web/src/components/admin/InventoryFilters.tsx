'use client';

/* เมนูค้นหาชุดเดียวที่ Property · Listings · Social Status ใช้ร่วมกัน
 *
 * สไลด์ 22 · "Property และ Listings Social Status ต้องแสดงผลเหมือนกัน เมนู
 * ค้นหาด้วย" แล้วไล่ช่องไว้ครบเจ็ดข้อ — เดิมสามหน้านี้มีตัวกรองคนละชุด
 * (Property: ประเภท/จังหวัด/สถานะ · Listings: ประเภท/จังหวัด/ดีล/แนะนำ ·
 * Social Status: มีแต่ช่องค้นหา) คนทำงานจึงกรองหาของแบบเดียวกันไม่ได้
 * ในสามหน้า
 *
 * ตัวเลือกทุกช่องมาจากข้อมูลจริงหรือจาก schema — ไม่ใช่รายการที่พิมพ์ทิ้งไว้
 * (ของเดิมมีจังหวัดให้เลือกห้าจังหวัด ทั้งที่คลังของจริงมีมากกว่านั้น) */
import * as React from 'react';
import { PROPERTY_TYPES, ZONE_COLORS } from '@/lib/propertySchema';
import { ZoneDot } from '@/components/common/ZoneDot';

export type InventoryRow = {
  code: string;
  title: string;
  typeKey: string;
  province: string;
  zoning: string;
  deal: string;
  /** ตร.ม. — ขนาดรวมของอาคาร */
  size: number | null;
  /** บาท (เช่า/เดือน หรือ ราคาขาย แล้วแต่ดีล) */
  price: number | null;
  available: boolean;
  /** ผู้ดูแลทรัพย์ — สไลด์ 22 ข้อ 8 "ชื่อคนลงประกาศ หรือ PIC" */
  pic: string;
};

export type InventoryFilterState = {
  q: string;
  type: string;
  zoning: string;
  deal: string;
  size: string;
  price: string;
  avail: string;
  pic: string;
};

export const EMPTY_FILTERS: InventoryFilterState = { q: '', type: '', zoning: '', deal: '', size: '', price: '', avail: '', pic: '' };

const ANY = 'ทั้งหมด';

/* ช่วงขนาดและช่วงราคาที่ทีมพูดถึงกันจริงในคลังโรงงาน/โกดัง */
const SIZE_BANDS: [string, (n: number) => boolean][] = [
  ['ไม่เกิน 500 ตร.ม.', (n) => n <= 500],
  ['500 – 1,000 ตร.ม.', (n) => n > 500 && n <= 1000],
  ['1,000 – 3,000 ตร.ม.', (n) => n > 1000 && n <= 3000],
  ['3,000 – 5,000 ตร.ม.', (n) => n > 3000 && n <= 5000],
  ['มากกว่า 5,000 ตร.ม.', (n) => n > 5000],
];
const PRICE_BANDS: [string, (n: number) => boolean][] = [
  ['ไม่เกิน 50,000', (n) => n <= 50_000],
  ['50,000 – 150,000', (n) => n > 50_000 && n <= 150_000],
  ['150,000 – 500,000', (n) => n > 150_000 && n <= 500_000],
  ['มากกว่า 500,000', (n) => n > 500_000],
];

const DEALS = ['ให้เช่า', 'ขาย', 'ให้เช่า และ ขาย'];
const AVAIL = ['ว่าง', 'ไม่ว่าง'];

/** ตัวกรองหนึ่งช่องผ่านหรือไม่ — แยกไว้ให้เทสต์เรียกได้ตรง ๆ */
export function matchesFilters(row: InventoryRow, f: InventoryFilterState): boolean {
  const q = f.q.trim().toLowerCase();
  if (q && !`${row.code} ${row.title} ${row.pic}`.toLowerCase().includes(q)) return false;
  if (f.type && row.typeKey !== f.type) return false;
  if (f.zoning && row.zoning !== f.zoning) return false;
  if (f.deal && row.deal !== f.deal) return false;
  if (f.avail && (f.avail === 'ว่าง') !== row.available) return false;
  if (f.pic && row.pic !== f.pic) return false;
  if (f.size) {
    const band = SIZE_BANDS.find(([l]) => l === f.size);
    if (!band) return true;
    if (row.size === null || !band[1](row.size)) return false;
  }
  if (f.price) {
    const band = PRICE_BANDS.find(([l]) => l === f.price);
    if (!band) return true;
    if (row.price === null || !band[1](row.price)) return false;
  }
  return true;
}

/** ลำดับที่ทั้งสามหน้าใช้เหมือนกัน — ว่างก่อน แล้วรหัสทรัพย์ */
export const sortInventory = <T extends InventoryRow>(rows: T[]): T[] =>
  [...rows].sort((a, b) => Number(b.available) - Number(a.available) || a.code.localeCompare(b.code, 'th'));

const chip = (hot: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 14px', borderRadius: 10,
  fontSize: 13, fontWeight: hot ? 700 : 600, cursor: 'pointer',
  background: hot ? '#273c33' : 'var(--bg)', color: hot ? '#fff' : 'var(--text)',
  border: '1px solid ' + (hot ? '#273c33' : 'var(--border)'), whiteSpace: 'nowrap',
});
const option = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 11px',
  borderRadius: 9, fontSize: '12.5px', fontWeight: active ? 700 : 600, cursor: 'pointer',
  color: active ? '#0D6C3B' : 'var(--text)', background: active ? 'rgba(13,108,59,.06)' : 'transparent',
});

export function InventoryFilters({ value, onChange, extra, picOptions = [] }: {
  value: InventoryFilterState;
  onChange: (next: InventoryFilterState) => void;
  /** ปุ่มเฉพาะของแต่ละหน้า เช่นแท็บสถานะของ Listings */
  extra?: React.ReactNode;
  /** ชื่อผู้ดูแลที่มีอยู่จริงในรายการของหน้านั้น */
  picOptions?: string[];
}) {
  const [open, setOpen] = React.useState<string | null>(null);
  const set = (k: keyof InventoryFilterState, v: string) => { onChange({ ...value, [k]: v }); setOpen(null); };

  const defs: { key: keyof InventoryFilterState; label: string; opts: [string, string][] }[] = [
    { key: 'type', label: 'ประเภท', opts: PROPERTY_TYPES.map((t) => [t.key, t.label] as [string, string]) },
    { key: 'zoning', label: 'พื้นที่สี', opts: ZONE_COLORS.map((z) => [z, z] as [string, string]) },
    { key: 'deal', label: 'ดีล', opts: DEALS.map((v) => [v, v] as [string, string]) },
    { key: 'size', label: 'ขนาดรวม', opts: SIZE_BANDS.map(([l]) => [l, l] as [string, string]) },
    { key: 'price', label: 'ราคา', opts: PRICE_BANDS.map(([l]) => [l, l] as [string, string]) },
    { key: 'avail', label: 'ว่าง/ไม่ว่าง', opts: AVAIL.map((v) => [v, v] as [string, string]) },
    { key: 'pic', label: 'ผู้ดูแล (PIC)', opts: picOptions.map((v) => [v, v] as [string, string]) },
  ].filter((f) => f.key !== 'pic' || picOptions.length > 0) as { key: keyof InventoryFilterState; label: string; opts: [string, string][] }[];

  return (
    <div
      data-inventory-filters
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', flex: 1, minWidth: 220 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input
          data-filter-q
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder="ค้นหาด้วยชื่อประกาศ หรือรหัสทรัพย์ (JKP…)"
          style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0, fontFamily: 'inherit' }}
        />
      </div>

      {defs.map((f) => {
        const cur = value[f.key];
        const on = open === f.key;
        const label = cur ? (f.opts.find(([v]) => v === cur)?.[1] ?? cur) : f.label;
        return (
          <div key={f.key} style={{ position: 'relative' }}>
            <div data-filter={f.key} data-on={cur ? '1' : '0'} onClick={() => setOpen(on ? null : f.key)} style={chip(!!cur || on)}>
              {/* สไลด์ 9/22/25 · "พื้นที่สีทุกอันใส่ Icon สีด้วย" */}
              {f.key === 'zoning' && cur ? <ZoneDot value={cur} size={13} /> : null}
              <span style={{ maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cur || on ? '#fff' : 'var(--muted2)'} strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg>
            </div>
            {on && (
              <div style={{ position: 'absolute', top: 46, right: 0, zIndex: 40, width: 260, maxHeight: 320, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 13, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 6 }}>
                <div onClick={() => set(f.key, '')} style={option(!cur)}><span>{ANY}</span></div>
                {f.opts.map(([v, l]) => (
                  <div key={v} data-filter-opt={v} onClick={() => set(f.key, v)} style={option(cur === v)}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      {f.key === 'zoning' ? <ZoneDot value={v} size={13} /> : null}
                      {l}
                    </span>
                    {cur === v && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {extra}

      {Object.values(value).some(Boolean) && (
        <div data-filter-clear onClick={() => onChange(EMPTY_FILTERS)} style={{ ...chip(false), border: 0, background: 'transparent', color: 'var(--muted)' }}>
          ล้างตัวกรอง
        </div>
      )}
      {open !== null && <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 20 }} />}
    </div>
  );
}
