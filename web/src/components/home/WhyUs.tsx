'use client';

import { useEffect, useRef, useState } from 'react';

const KPI_DEFS: { target: number; suffix: string; label: string; comma: boolean }[] = [
  { target: 2000, suffix: '+', label: 'ทรัพย์ในระบบทั่วประเทศ', comma: true },
  { target: 100, suffix: '+', label: 'องค์กรที่ไว้วางใจ', comma: false },
  { target: 12, suffix: ' ปี', label: 'ประสบการณ์ในตลาด', comma: false },
];

const FEATURE_DEFS = [
  { title: 'จดทะเบียนถูกต้องและได้รับการรับรอง', desc: 'จดทะเบียนกับ DBD สมาชิก TREBA พร้อมประสบการณ์จริงในดีลอุตสาหกรรม' },
  { title: 'รองรับหลายภาษา', desc: 'สื่อสารได้ทั้งจีน อังกฤษ และไทย ลดช่องว่างด้านภาษาและวัฒนธรรม' },
  { title: 'เข้าใจทั้งสองฝั่ง', desc: 'เข้าใจมุมมองทั้งเจ้าของทรัพย์และผู้เช่า เจรจาอย่างเป็นธรรมและได้ประโยชน์ร่วมกัน' },
  { title: 'ประกาศทรัพย์ใช้งานจริงกว่า 2,000 รายการ', desc: 'ร่วมงานกับดีเวลลอปเปอร์และเจ้าของทรัพย์ชั้นนำ พอร์ตทรัพย์ขนาดใหญ่ที่เชื่อถือได้' },
  { title: 'ราคาโปร่งใส', desc: 'ไม่มีการบวกราคาเหนือเจ้าของทรัพย์ สร้างความเชื่อมั่นให้ผู้เช่าและผู้ซื้อ' },
  { title: 'ขับเคลื่อนด้วยเทคโนโลยี', desc: 'ระบบอัตโนมัติและเครื่องมือ AI ช่วยให้บริการได้รวดเร็ว แม่นยำ และตรงโจทย์' },
];

const FEATURE_ICONS = [
  <svg key="0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" /></svg>,
  <svg key="1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20" /></svg>,
  <svg key="2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M5 7l7-4 7 4M4 21h16M6 21V9l6-3 6 3v12" /><path d="M3 11h4M17 11h4" /></svg>,
  <svg key="3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /></svg>,
  <svg key="4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  <svg key="5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 00-4 4c0 1.5.8 2.8 2 3.4V11a2 2 0 01-2 2H6a3 3 0 00-3 3v1M12 2a4 4 0 014 4c0 1.5-.8 2.8-2 3.4V11a2 2 0 002 2h2a3 3 0 013 3v1" /><circle cx="4" cy="20" r="2" /><circle cx="20" cy="20" r="2" /><circle cx="12" cy="20" r="2" /></svg>,
];

export function WhyUs() {
  const [kpi, setKpi] = useState(0);
  const [fhover, setFhover] = useState<number | null>(null);
  const kpiRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = kpiRef.current;
    if (!el) return;
    const startKpi = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const dur = 1400;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        setKpi(e);
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (ents) => { ents.forEach((en) => { if (en.isIntersecting) startKpi(); }); },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => { io.disconnect(); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const kpis = KPI_DEFS.map((k) => {
    const n = Math.round(k.target * kpi);
    return { label: k.label, value: (k.comma ? n.toLocaleString('en-US') : String(n)) + k.suffix };
  });

  return (
    <div style={{ width: '100%', background: 'var(--bg)' }}>
      <section data-anim="1" style={{ maxWidth: '1200px', margin: '0 auto', padding: '88px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '0.92fr 1.08fr', gap: 52, alignItems: 'center' }}>
          {/* image card */}
          <div style={{ position: 'relative', height: '480px', borderRadius: '20px', overflow: 'hidden', background: 'var(--bg2)', boxShadow: '0 24px 50px rgba(2,35,16,.16)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&q=80" alt="ทีมงาน" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(2,35,16,.34) 0%,rgba(2,35,16,0) 30%,rgba(2,35,16,0) 55%,rgba(2,35,16,.5) 100%)', pointerEvents: 'none' }} />
            {/* award ribbon */}
            <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 15px 9px 11px', borderRadius: '12px', background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(6px)', boxShadow: '0 8px 22px rgba(0,0,0,.18)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#034956' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 0012 0V3H6z" /><path d="M6 5H3v2a4 4 0 004 4M18 5h3v2a4 4 0 01-4 4M9 21h6M12 17v4" /></svg>
              </div>
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#273c33', letterSpacing: '.02em' }}>Real Estate Agent Awards</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)' }}>Thailand · 2025</div>
              </div>
            </div>
            {/* floating rating card */}
            <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '15px 18px', borderRadius: '16px', background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(8px)', boxShadow: '0 12px 30px rgba(0,0,0,.2)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>4.9</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[0, 1, 2, 3, 4].map((s) => (
                      <svg key={s} width="15" height="15" viewBox="0 0 24 24" fill="#034956" stroke="none"><path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.9 5.9 20l1.6-6.5-5-4.3 6.6-.6z" /></svg>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 4, fontSize: '12.5px', color: 'var(--muted)' }}>ความพึงพอใจจากลูกค้ากว่า 100+ ราย</div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 9999, backgroundColor: '#273c33' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><path d="M21 12c0 5-3.5 7.5-8.6 8.9a1 1 0 01-.8 0C6.5 19.5 3 17 3 12V6a1 1 0 01.7-1l8-2.6a1 1 0 01.6 0l8 2.6A1 1 0 0121 6z" /></svg>
              </div>
            </div>
          </div>

          {/* right column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: '#273c33', textTransform: 'uppercase' }}>ทำไมต้องเลือกเรา</span>
            </div>
            <h2 style={{ margin: '10px 0 12px', fontSize: 34, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em' }}>เหตุผลที่ลูกค้าเลือกเรา</h2>
            <p style={{ margin: '0 0 28px', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, maxWidth: '560px' }}>เราได้รับความไว้วางใจจากทั้งนักลงทุนต่างชาติและเจ้าของทรัพย์ไทย ด้วยความเชี่ยวชาญ ความโปร่งใส และเทคโนโลยีที่ช่วยให้ทุกดีลเดินหน้าได้จริง</p>
            {/* KPI count-up strip */}
            <div ref={kpiRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '22px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              {kpis.map((k, i) => (
                <div key={i}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-.02em', lineHeight: 1 }}>{k.value}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--muted2)' }}>{k.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 44 }}>
          {FEATURE_DEFS.map((f, i) => {
            const on = i === fhover;
            const ghost = on ? 'rgba(45,251,145,.14)' : 'rgba(40,37,29,.05)';
            const titleColor = on ? '#fff' : 'var(--text)';
            const descColor = on ? '#B9C2BD' : 'var(--muted)';
            const card: React.CSSProperties = on
              ? { position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#0A0E0C 0%,#0A0E0C 50%,#0E3A22 100%)', border: '1.5px solid rgba(45,251,145,.35)', borderRadius: '16px', padding: '24px 22px 26px', transition: 'transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s', transform: 'translateY(-6px)', boxShadow: '0 20px 40px rgba(0,0,0,.32)' }
              : { position: 'relative', overflow: 'hidden', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '24px 22px 26px', transition: 'transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s, border-color .3s', transform: 'none', boxShadow: '0 1px 3px rgba(0,0,0,.05)' };
            const cardGlow: React.CSSProperties = on ? { position: 'absolute', bottom: '-55%', right: '-15%', width: '75%', height: '170%', background: 'radial-gradient(ellipse at center,rgba(45,251,145,.36) 0%,rgba(45,251,145,0) 62%)', pointerEvents: 'none' } : { display: 'none' };
            const tile: React.CSSProperties = { position: 'relative', zIndex: 1, width: '52px', height: '52px', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#2DFB91' : '#273c33', color: on ? '#04140C' : '#2DFB91', transition: 'all .3s', boxShadow: on ? '0 8px 20px rgba(45,251,145,.4)' : 'none' };
            return (
              <div key={i} onMouseEnter={() => setFhover(i)} onMouseLeave={() => setFhover(null)} style={card}>
                <div style={cardGlow} />
                <div style={{ position: 'absolute', top: 14, right: 18, fontFamily: "'JetBrains Mono',monospace", fontSize: 32, fontWeight: 800, color: ghost, pointerEvents: 'none', transition: 'color .3s' }}>{'0' + (i + 1)}</div>
                <div style={tile}>{FEATURE_ICONS[i]}</div>
                <div style={{ marginTop: 18, fontSize: 16, fontWeight: 700, color: titleColor }}>{f.title}</div>
                <div style={{ marginTop: 7, fontSize: '13.5px', color: descColor, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
