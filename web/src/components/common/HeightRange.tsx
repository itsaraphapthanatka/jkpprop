'use client';

/* ตัวกรองความสูงอาคาร แบบช่วง ต่ำสุด–สูงสุด
 *
 * ลูกค้าชี้ภาพเว็บอ้างอิงมาว่า "เพิ่มความสูง" เป็นกล่องเลือกสองช่องคู่กัน
 * ไม่ใช่รายการ "ขึ้นไป" แบบตัวกรองรับน้ำหนัก — คนหาโกดังมีทั้งพื้นล่างที่ต้องได้
 * และเพดานที่เกินไม่ได้ (อาคารเดิม หรือชั้นวางที่วางแผนไว้)
 *
 * หน้าแรกกับหน้ารายการใช้ตัวเดียวกัน จะได้ไม่กลายเป็นสองแบบเหมือนที่เคยเป็นมา
 */
import { useDict } from '@/i18n/useDict';
import { HEIGHT_STEPS } from '@/lib/publicFilters';

const box: React.CSSProperties = {
  flex: 1, minWidth: 0, height: 42, padding: '0 10px', borderRadius: 11,
  border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
  fontSize: '13.5px', fontFamily: 'inherit', outline: 'none',
};

export function HeightRange({ min, max, onMin, onMax }: {
  min: number | null;
  max: number | null;
  onMin: (v: number | null) => void;
  onMax: (v: number | null) => void;
}) {
  const d = useDict();
  const num = (v: string) => (v ? Number(v) : null);
  return (
    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
      <select data-height-min value={min ?? ''} onChange={(e) => onMin(num(e.target.value))} style={box}>
        <option value="">{d.hero.noMin}</option>
        {/* ช่องต่ำสุดไม่เสนอค่าที่สูงกว่าสูงสุดที่เลือกไว้ — ช่วงกลับด้านไม่มีวันเจออะไร */}
        {HEIGHT_STEPS.filter((n) => max === null || n <= max).map((n) => (
          <option key={n} value={n}>{n} {d.hero.metre}</option>
        ))}
      </select>
      <span style={{ color: 'var(--muted3)', flexShrink: 0 }}>-</span>
      <select data-height-max value={max ?? ''} onChange={(e) => onMax(num(e.target.value))} style={box}>
        <option value="">{d.hero.noMax}</option>
        {HEIGHT_STEPS.filter((n) => min === null || n >= min).map((n) => (
          <option key={n} value={n}>{n} {d.hero.metre}</option>
        ))}
      </select>
    </div>
  );
}
