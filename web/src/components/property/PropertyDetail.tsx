'use client';

import { useEffect, useState } from 'react';
import { Gallery } from './Gallery';
import { InquiryBox } from './InquiryBox';

/* ---- responsive helper (source media queries target #pd-* ids not in globals) ---- */
function useMaxWidth(px: number) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width:${px}px)`);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [px]);
  return match;
}

/* ---- icon helpers (mirror the DC qi/fi/ni SVG factories) ---- */
const qi = (children: React.ReactNode) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{children}</svg>
);
const fi = (children: React.ReactNode) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{children}</svg>
);
const ni = (children: React.ReactNode) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{children}</svg>
);

const quickSpecs: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: '2,700 ตร.ม.', label: 'พื้นที่ใช้สอย', icon: qi(<><path d="M3 3h18v18H3z" /><path d="M3 9h18M9 3v18" /></>) },
  { value: '9 เมตร', label: 'ความสูงใต้อาคาร', icon: qi(<path d="M12 3v18M5 8l7-5 7 5" />) },
  { value: '3 ตัน/ตร.ม.', label: 'รับน้ำหนักพื้น', icon: qi(<path d="M12 2v20M5 8h14M5 8a3 3 0 006 0M13 8a3 3 0 006 0" />) },
  { value: '3 Phase', label: 'ระบบไฟฟ้า 50/150A', icon: qi(<path d="M13 2L3 14h7l-1 8 11-14h-7z" />) },
];

const specRows: { k: string; v: string }[] = [
  { k: 'รหัสทรัพย์', v: 'JKP-SPK0042' },
  { k: 'สถานะทรัพย์', v: 'ให้เช่า' },
  { k: 'ประเภททรัพย์', v: 'โรงงาน' },
  { k: 'จังหวัด', v: 'กรุงเทพมหานคร' },
  { k: 'อำเภอ / ตำบล', v: 'บางนา / บางนา' },
  { k: 'พื้นที่ใช้สอย', v: '2,700 ตร.ม.' },
  { k: 'ความสูงใต้อาคาร', v: '9 เมตร' },
  { k: 'ความสามารถรับน้ำหนักพื้น', v: '3 ตัน/ตร.ม.' },
  { k: 'ระบบไฟฟ้า', v: '3 Phase 50/150 Amp (อัปเกรดได้)' },
  { k: 'ขอใบ ร.ง.4', v: 'ได้' },
  { k: 'ราคาเช่า', v: '฿405,000 / เดือน (฿150/ตร.ม.)' },
  { k: 'เงื่อนไขสัญญา', v: 'ขั้นต่ำ 3 ปี · ประกัน 3 เดือน' },
];

const features: { label: string; icon: React.ReactNode }[] = [
  { label: 'อาคารเดี่ยว', icon: fi(<><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18M9 21v-6h6v6" /></>) },
  { label: 'มีพื้นที่สำนักงานในตัว', icon: fi(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h6" /></>) },
  { label: 'พื้นที่ขนถ่ายแบบยกพื้น', icon: fi(<><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7M5.5 19a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 19a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /></>) },
  { label: 'พนักงานรักษาความปลอดภัย', icon: fi(<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />) },
  { label: 'บนถนนสายหลัก', icon: fi(<path d="M4 19V5M20 19V5M12 19v-3M12 11V8M12 5v0" />) },
];

const nearby: { name: string; dist: string; icon: React.ReactNode }[] = [
  { name: 'ทางด่วนบูรพาวิถี', dist: 'ห่าง 2 กม.', icon: ni(<path d="M4 19V5M20 19V5M12 19v-4M12 10V6" />) },
  { name: 'ท่าเรือแหลมฉบัง', dist: 'ห่าง 45 กม.', icon: ni(<><path d="M4 16l1.5 4h13L20 16" /><path d="M6 16V9h3V6h6v3h3v7" /></>) },
  { name: 'สนามบินสุวรรณภูมิ', dist: 'ห่าง 18 กม.', icon: ni(<path d="M17.8 19.2L16 11l3.5-3.5a1.5 1.5 0 00-2.1-2.1L14 8.9 6 7l-1 1 6.5 4-3.5 3.5-2.5-.5-1 1L8 18l2.5 2.5 1-1-.5-2.5 3.5-3.5 4 6.5z" />) },
];

const related: { id: string; deal: string; code: string; title: string; loc: string; price: string; src: string }[] = [
  { id: 'pd-r1', deal: 'ให้เช่า', code: 'JKP-RYG0224', title: 'โรงงาน/คลังสินค้า 3,600 ตร.ม. มะขามคู่', loc: 'นิคมพัฒนา, ระยอง', price: '฿576,000/ด.', src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80' },
  { id: 'pd-r2', deal: 'ให้เช่า', code: 'JKP-RYG1378', title: 'โรงงาน/คลังสินค้า 3,607 ตร.ม. นิคมพัฒนา', loc: 'นิคมพัฒนา, ระยอง', price: '฿799,470/ด.', src: 'https://images.unsplash.com/photo-1601599963565-b7ba29c8e4e0?w=600&q=80' },
  { id: 'pd-r3', deal: 'ให้เช่า', code: 'JKP-RYG2081', title: 'โรงงาน/คลังสินค้า 3,684 ตร.ม. นิคมพัฒนา', loc: 'นิคมพัฒนา, ระยอง', price: '฿663,120/ด.', src: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=600&q=80' },
];

const sectionCard: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '26px 28px' };
const sectionHead = (title: string, mb = 18): React.ReactNode => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: mb }}>
    <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{title}</h2>
  </div>
);

const pin = (w: number, stroke: string, sw = '1.8') => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

function ShareBtn({ children }: { children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', cursor: 'pointer', background: hover ? 'var(--tint)' : 'transparent', transition: 'background .2s' }}
    >
      {children}
    </div>
  );
}

function RelatedCard({ r }: { r: (typeof related)[number] }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href="/property"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 18,
        overflow: 'hidden',
        transition: 'transform .3s cubic-bezier(.2,.7,.3,1),box-shadow .3s',
        transform: hover ? 'translateY(-6px)' : 'none',
        boxShadow: hover ? '0 20px 40px rgba(0,0,0,.1)' : 'none',
      }}
    >
      <div style={{ position: 'relative', height: 180, background: 'var(--tint)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.src} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <span style={{ position: 'absolute', top: 12, left: 12, height: 26, padding: '0 11px', borderRadius: 9999, background: 'rgba(255,255,255,.95)', color: '#0D6C3B', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#0D6C3B' }} />{r.deal}
        </span>
      </div>
      <div style={{ padding: '16px 18px' }}>
        <code style={{ fontSize: '11.5px', color: '#0D6C3B', fontWeight: 700 }}>{r.code}</code>
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.45 }}>{r.title}</div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          {pin(13, 'var(--muted2)')}{r.loc}
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: '#034956' }}>{r.price}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
            ดูรายละเอียด
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </div>
      </div>
    </a>
  );
}

export function PropertyDetail() {
  const w980 = useMaxWidth(980);
  const w640 = useMaxWidth(640);

  return (
    <>
      {/* BREADCRUMB */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted2)', flexWrap: 'wrap' }}>
        <a href="/" style={{ color: 'var(--muted2)' }}>หน้าแรก</a>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        <a href="#" style={{ color: 'var(--muted2)' }}>อสังหาริมทรัพย์ทั้งหมด</a>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>JKP-SPK0042</span>
      </div>

      {/* GALLERY */}
      <Gallery />

      {/* MAIN SPLIT */}
      <div
        id="pd-split"
        style={{ maxWidth: '1320px', margin: '0 auto', padding: '24px 24px 60px', display: 'grid', gridTemplateColumns: w980 ? '1fr' : '1fr 380px', gap: 28, alignItems: 'start' }}
      >
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* TITLE + PRICE */}
          <div style={sectionCard}>
            <div id="pd-titlerow" style={{ display: 'flex', alignItems: w640 ? 'flex-start' : 'flex-start', justifyContent: 'space-between', gap: w640 ? 12 : 20, flexDirection: w640 ? 'column' : 'row' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em', lineHeight: 1.3 }}>โรงงานพร้อมสำนักงาน พื้นที่ 2,700 ตร.ม. ให้เช่า ที่บางนา กรุงเทพฯ</h1>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13.5px', color: 'var(--muted)' }}>{pin(15, 'var(--accent)')}บางนา, กรุงเทพมหานคร</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted2)' }}>รหัสทรัพย์: <code style={{ fontWeight: 700, color: '#0D6C3B' }}>JKP-SPK0042</code></span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--muted2)' }}>ราคาเช่า</div>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: '#034956' }}>฿405,000</div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>/ เดือน · ฿150/ตร.ม.</div>
              </div>
            </div>

            {/* QUICK SPECS */}
            <div id="pd-specs" style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {quickSpecs.map((q) => (
                <div key={q.label} style={{ background: 'var(--bg)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>{q.icon}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{q.value}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>{q.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>อัปเดตล่าสุด 18 ก.ค. 2026 · <span style={{ color: 'var(--muted3)' }}>ราคา/สถานะไม่การันตี ต้องตรวจสอบอีกครั้ง</span></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <ShareBtn>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 8.6a5.5 5.5 0 00-9-1.8L12 8l-.1-.1a5.5 5.5 0 10-7.8 7.8l7.9 7.9 7.9-7.9a5.5 5.5 0 00.9-7z" /></svg>
                </ShareBtn>
                <ShareBtn>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" /></svg>
                </ShareBtn>
              </div>
            </div>
          </div>

          {/* SPEC TABLE */}
          <div style={sectionCard}>
            {sectionHead('รายละเอียดทรัพย์')}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {specRows.map((r) => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13.5px', color: 'var(--muted)' }}>{r.k}</span>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FEATURES */}
          <div style={sectionCard}>
            {sectionHead('คุณสมบัติของทรัพย์')}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {features.map((f) => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 9, height: 44, padding: '0 16px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--accent)', display: 'flex' }}>{f.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ZONE */}
          <div style={sectionCard}>
            {sectionHead('ประเภทโซน')}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 18px', borderRadius: 12, background: 'var(--tint)', width: 'fit-content' }}>
              {pin(18, 'var(--accent)')}
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent)' }}>เขตสีม่วง (พื้นที่อุตสาหกรรม)</span>
            </div>
          </div>

          {/* LOCATION */}
          <div style={sectionCard}>
            {sectionHead('ตำแหน่งทรัพย์', 8)}
            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: 'var(--muted2)' }}>แสดงระดับพื้นที่เพื่อความเป็นส่วนตัว — ตำบลบางนา อำเภอบางนา กรุงเทพฯ</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
              <div style={{ borderRadius: 16, overflow: 'hidden', height: 260, background: 'var(--tint)', position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" alt="แผนที่ระดับพื้นที่" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: 12, left: 12, height: 30, padding: '0 13px', borderRadius: 9999, background: 'rgba(255,255,255,.95)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>Open in Maps</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>สถานที่ใกล้เคียง</div>
                {nearby.map((n) => (
                  <div key={n.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, background: 'var(--bg)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>{n.icon}</div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{n.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>{n.dist}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: INQUIRY (sticky) */}
        <InquiryBox />
      </div>

      {/* RELATED */}
      <section style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>อสังหาริมทรัพย์ที่คล้ายกัน</h2>
        </div>
        <div id="pd-related" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {related.map((r) => (
            <RelatedCard key={r.id} r={r} />
          ))}
        </div>
      </section>
    </>
  );
}
