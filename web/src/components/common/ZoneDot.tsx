'use client';

/* จุดสีของพื้นที่ผังเมือง
 *
 * ลูกค้าเขียนย้ำสามที่ในเด็ค (สไลด์ 9 · 22 · 25) ว่า "พื้นที่สีทุกอันใส่ Icon
 * สีด้วย" — ชื่อสีที่เป็นตัวหนังสืออย่างเดียวทำให้ต้องอ่านแล้วแปลเอาเองทุกครั้ง
 * ทั้งที่เป็นข้อมูลที่ดูจากสีเร็วกว่า
 *
 * สีจริงอยู่ใน lib/zoneSwatch.ts ที่เดียว หน้ารายละเอียด · ตัวกรอง · ฟอร์ม
 * จึงใช้สีชุดเดียวกันเสมอ สีลาย (เขียวลาย ม่วงลาย) วาดเป็นเส้นทแยง และ
 * ส้มอ่อนมีจุดขาววาดเป็นจุด ตามที่ผังเมืองใช้จริง
 */
import * as React from 'react';
import { zoneSwatch } from '@/lib/zoneSwatch';

export function ZoneDot({ value, size = 14 }: { value: string; size?: number }) {
  const sw = zoneSwatch(value);
  if (!sw) return null;
  return (
    <span
      data-zone-dot={value}
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(3, Math.round(size / 4)),
        flexShrink: 0,
        display: 'inline-block',
        border: '1px solid rgba(var(--ink-rgb),.28)',
        background: sw.hatch
          ? `repeating-linear-gradient(45deg, ${sw.hatch} 0 3px, ${sw.fill} 3px 6px)`
          : sw.dots
            ? `radial-gradient(#fff 1.2px, ${sw.fill} 1.3px) 0 0/5px 5px`
            : sw.fill,
      }}
    />
  );
}
