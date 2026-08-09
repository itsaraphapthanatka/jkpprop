'use client';

import { useState } from 'react';

const T = '#034956';

const certDefs: { name: string; tag: string; desc: string; icon: React.ReactNode }[] = [
  {
    name: 'TREBA',
    tag: 'สมาชิกสมาคมวิชาชีพ',
    desc: 'สมาชิกสมาคมนายหน้าอสังหาริมทรัพย์ไทย ปฏิบัติตามจรรยาบรรณและมาตรฐานวิชาชีพ',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19.3 7.2 17l.9-5.4L4.2 7.7l5.4-.8z" /></svg>
    ),
  },
  {
    name: 'DBD',
    tag: 'จดทะเบียนถูกต้องตามกฎหมาย',
    desc: 'จดทะเบียนกับกรมพัฒนาธุรกิจการค้า กระทรวงพาณิชย์ ดำเนินธุรกิจอย่างโปร่งใส',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><path d="M21 12c0 5-3.5 7.5-8.6 8.9a1 1 0 01-.8 0C6.5 19.5 3 17 3 12V6a1 1 0 01.7-1l8-2.6a1 1 0 01.6 0l8 2.6A1 1 0 0121 6z" /></svg>
    ),
  },
  {
    name: 'มาตรฐานวิชาชีพ',
    tag: 'ผ่านการอบรมและรับรอง',
    desc: 'ทีมนายหน้าผ่านการอบรมหลักสูตรอสังหาริมทรัพย์ พร้อมประสบการณ์จริงในดีลอุตสาหกรรม',
    icon: (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
    ),
  },
];

export function Certifications() {
  const [chover, setChover] = useState<number | null>(null);

  return (
    <section data-anim="1" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 26, height: 2, background: '#034956', borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>ความน่าเชื่อถือ</span>
            <span style={{ width: 26, height: 2, background: '#034956', borderRadius: 2 }} />
          </div>
        </div>
        <h2 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: 34, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em' }}>ใบรับรองและการกำกับดูแล</h2>
        <p style={{ margin: '0 auto 44px', textAlign: 'center', maxWidth: '520px', fontSize: 15, color: 'var(--muted2)' }}>ดำเนินงานภายใต้มาตรฐานวิชาชีพและการกำกับดูแลที่ตรวจสอบได้ทุกขั้นตอน</p>
        <div className="rs-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {certDefs.map((c, i) => {
            const on = i === chover;
            return (
              <div
                key={c.name}
                onMouseEnter={() => setChover(i)}
                onMouseLeave={() => setChover(null)}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--surface)',
                  border: '1.5px solid ' + (on ? T : '#273c33'),
                  borderRadius: 18,
                  padding: '30px 26px 28px',
                  textAlign: 'center',
                  transition: 'transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s, border-color .3s',
                  transform: on ? 'translateY(-8px)' : 'none',
                  boxShadow: on ? '0 22px 44px rgba(3,73,86,.15)' : '0 2px 10px rgba(3,73,86,.06)',
                }}
              >
                <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 5, height: 24, padding: '0 10px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>ยืนยันแล้ว
                </div>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    margin: '0 auto',
                    borderRadius: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: on ? '#2DFB91' : '#273c33',
                    color: on ? '#022310' : '#2DFB91',
                    transition: 'all .3s',
                    boxShadow: on ? '0 10px 26px rgba(45,251,145,.4)' : 'none',
                  }}
                >
                  {c.icon}
                </div>
                <div style={{ marginTop: 20, fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '.02em' }}>{c.name}</div>
                <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{c.tag}</div>
                <div style={{ marginTop: 12, fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.65 }}>{c.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
