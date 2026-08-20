'use client';

/* แถบแบ่งหน้าของตารางหลังบ้าน
 *
 * Properties กับ Listings โหลดมาทั้ง 393 แถวแล้ววาดลงหน้าเดียว ตั้งแต่ใส่รูป
 * หน้าปกเข้าไปก็กลายเป็นการโหลดรูป 393 ใบพร้อมกันในหน้าเดียว และคนที่หาของ
 * ต้องเลื่อนยาวมาก
 *
 * แบ่งหน้าฝั่งหน้าจอ ไม่ใช่ฝั่งเซิร์ฟเวอร์ — ตัวกรองทั้งเจ็ดช่องทำงานกับชุด
 * ทั้งหมดที่โหลดมาแล้ว ถ้าย้ายไปแบ่งที่เซิร์ฟเวอร์ ตัวกรองจะกรองได้แค่หน้าที่
 * เห็นอยู่ ซึ่งเป็นบั๊กที่เพิ่งแก้ไปในหน้ารายการฝั่งลูกค้า
 */
import * as React from 'react';

export const PER_PAGE = 25;

const btn = (off: boolean): React.CSSProperties => ({
  height: 34, padding: '0 14px', borderRadius: 9999, fontFamily: 'inherit',
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: off ? 'var(--muted3)' : 'var(--text)', fontSize: 12.5, fontWeight: 700,
  cursor: off ? 'default' : 'pointer', opacity: off ? 0.6 : 1,
});

/** ตัดรายการให้เหลือเฉพาะหน้าที่กำลังดู */
export const pageSlice = <T,>(rows: T[], page: number, per = PER_PAGE): T[] =>
  rows.slice((page - 1) * per, page * per);

/** จำนวนหน้าทั้งหมด — อย่างน้อยหนึ่งหน้าเสมอ ไม่งั้นแถบจะขึ้นว่า "1 / 0" */
export const pageCountOf = (total: number, per = PER_PAGE): number =>
  Math.max(1, Math.ceil(total / per));

export function TablePager({ page, total, onPage, unit = 'รายการ', per = PER_PAGE }: {
  page: number;
  total: number;
  onPage: (next: number) => void;
  unit?: string;
  per?: number;
}) {
  const pageCount = pageCountOf(total, per);
  const from = total === 0 ? 0 : (page - 1) * per + 1;
  const to = Math.min(page * per, total);

  return (
    <div data-table-pager style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div data-pager-count style={{ fontSize: 12, color: 'var(--muted2)' }}>
        แสดง {from}–{to} จาก {total} {unit}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" data-pager-prev disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))} style={btn(page <= 1)}>ก่อนหน้า</button>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', padding: '0 6px', fontFamily: "'JetBrains Mono',monospace" }}>{page} / {pageCount}</span>
        <button type="button" data-pager-next disabled={page >= pageCount} onClick={() => onPage(Math.min(pageCount, page + 1))} style={btn(page >= pageCount)}>ถัดไป</button>
      </div>
    </div>
  );
}
