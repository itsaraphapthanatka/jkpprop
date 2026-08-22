/* ช่อง "ผู้ดูแล (PIC)" ของตาราง Properties · Listings · Social Status
   ทั้งสามหน้ามีตัวกรอง PIC อยู่แล้ว แต่ไม่มีคอลัมน์ให้เห็นว่าใครดูแล — กรองได้
   แต่มองไม่เห็น เลยต้องจำเอาเองว่าเพิ่งกรองใครไว้
   อยู่ในไฟล์เดียวกันทั้งสามหน้า เพราะตารางในระบบนี้เคยลอกกันแล้วค่อย ๆ เพี้ยน */
import React from 'react';

/* สีของวงกลมย่อมาจากชื่อ — คนเดียวกันได้สีเดิมทุกหน้า ทำให้กวาดตาหาแถวของ
   ตัวเองได้โดยไม่ต้องอ่านชื่อทีละแถว */
const TONES = ['#034956', '#0D6C3B', '#7A3FB0', '#B4531A', '#0E7C86', '#8A2B4A'];
const toneOf = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
};

export function PicCell({ name }: { name?: string | null }) {
  const who = (name ?? '').trim();
  if (!who) {
    /* ทรัพย์ที่ยังไม่มีคนดูแลคือของที่ตกหล่นได้ ต้องต่างจากช่องว่างเฉย ๆ */
    return <span data-pic-none title="ยังไม่มีคนดูแลทรัพย์นี้" style={{ fontSize: '12px', color: '#B4531A' }}>ยังไม่ระบุ</span>;
  }
  const tone = toneOf(who);
  return (
    <span data-pic={who} title={who} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, maxWidth: 150 }}>
      <span aria-hidden style={{ width: 22, height: 22, borderRadius: 9999, flexShrink: 0, background: tone, color: '#fff', fontSize: '10.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        {[...who][0]}
      </span>
      <span style={{ fontSize: '12.5px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{who}</span>
    </span>
  );
}

export const PIC_TH = 'ผู้ดูแล (PIC)';
