'use client';

import { useRef } from 'react';
import Link from 'next/link';

/* ============================================================
   Ported verbatim from About.dc.html — hero, story card + pillars,
   team carousel (prev/next scrollBy), award, "featured in" logos.
   image-slot → <img>; style-hover → onMouseEnter/Leave.
   ============================================================ */

const pillars = [
  { num: '01', title: 'การสื่อสาร', desc: 'สื่อสารได้ทั้งไทย อังกฤษ และจีน ไม่มีช่องว่างด้านภาษา' },
  { num: '02', title: 'ความน่าเชื่อถือ', desc: 'ประสบการณ์กว่า 12 ปีในธุรกิจอสังหาริมทรัพย์อุตสาหกรรม' },
  { num: '03', title: 'ความรู้ตลาด', desc: 'เข้าใจทำเลและกฎระเบียบของทุกจังหวัดในประเทศไทย' },
];

const team = [
  { slot: 't1', name: 'คุณปัทมนันท์ ธิติชนานันต์', role: 'Sales Executive', img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&q=80' },
  { slot: 't2', name: 'คุณชนสิษฐ์ โชติกันภัย', role: 'Sales Executive', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80' },
  { slot: 't3', name: 'คุณวชิสรา ภูอาภรณ์', role: 'Sales Executive', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&q=80' },
  { slot: 't4', name: 'คุณธีรภัทร แสงทอง', role: 'Property Consultant', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80' },
];

const pressLogos = ['BRAND INSIGHT', 'BIZ NEWS', 'MARKET WATCH', 'MGR ONLINE', 'THE STANDARD', 'PROPERTY TODAY'];

export function AboutBody() {
  const teamRef = useRef<HTMLDivElement | null>(null);
  const scroll = (dx: number) => teamRef.current && teamRef.current.scrollBy({ left: dx, behavior: 'smooth' });

  const liftEnter = (shadow: string) => (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = shadow;
  };
  const liftLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = 'none';
  };
  const arrowEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = '#2DFB91';
    e.currentTarget.style.color = '#04140C';
    e.currentTarget.style.borderColor = '#2DFB91';
  };
  const arrowLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,.08)';
    e.currentTarget.style.color = '#fff';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
  };
  const arrowBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 9999, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', transition: 'all .2s' };

  return (
    <>
      {/* HERO */}
      <section style={{ position: 'relative', height: '220px' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderBottomRightRadius: '72px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80" alt="ภาพเมือง/สกายไลน์" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(2,29,14,.82) 0%,rgba(2,29,14,.5) 55%,rgba(2,29,14,.28) 100%)', pointerEvents: 'none', borderBottomRightRadius: '72px' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1320px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>เกี่ยวกับเรา</h1>
          <p style={{ margin: '10px 0 0', fontSize: '14.5px', color: '#E8FFF0', maxWidth: '520px' }}>ทีมผู้เชี่ยวชาญด้านอสังหาริมทรัพย์อุตสาหกรรมที่เชื่อถือได้ทั่วประเทศไทย</p>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted2)' }}>
        <Link href="/" style={{ color: 'var(--muted2)' }}>หน้าแรก</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>เกี่ยวกับเรา</span>
      </div>

      {/* STORY CARD */}
      <section style={{ maxWidth: '1320px', margin: '24px auto 0', padding: '0 24px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 44, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
          <div id="story-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 44, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 26, height: 2, background: 'var(--accent)', borderRadius: 2 }} />
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>เกี่ยวกับเรา</span>
              </div>
              <h2 style={{ margin: '10px 0 4px', fontSize: 30, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>เรื่องราวของเรา</h2>
              <div style={{ fontSize: '13.5px', color: 'var(--muted2)' }}>JKP Property · Founded by ทีมผู้ก่อตั้ง</div>
              <p style={{ margin: '18px 0 0', fontSize: '14.5px', color: 'var(--muted)', lineHeight: 1.8 }}>JKP Property ก่อตั้งขึ้นเพื่อเป็นตัวกลางที่น่าเชื่อถือระหว่างนักลงทุนและเจ้าของทรัพย์อสังหาริมทรัพย์อุตสาหกรรมทั่วประเทศไทย ด้วยความเข้าใจตลาดโรงงานและโกดังอย่างลึกซึ้ง ทีมงานของเราคัดกรองทรัพย์ทุกรายการก่อนเผยแพร่ พร้อมดูแลลูกค้าตั้งแต่ค้นหาจนปิดดีลอย่างโปร่งใสและเป็นธรรม</p>
              <div id="stats-row" style={{ display: 'flex', gap: 36, marginTop: 28 }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>2019</div>
                  <div style={{ marginTop: 2, fontSize: '12.5px', color: 'var(--muted2)' }}>ก่อตั้ง</div>
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>2,000+</div>
                  <div style={{ marginTop: 2, fontSize: '12.5px', color: 'var(--muted2)' }}>ทรัพย์ในระบบ</div>
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>12 ปี</div>
                  <div style={{ marginTop: 2, fontSize: '12.5px', color: 'var(--muted2)' }}>ประสบการณ์ทีมงาน</div>
                </div>
              </div>
              <Link href="/contact" onMouseEnter={liftEnter('0 10px 24px rgba(39,60,51,.4)')} onMouseLeave={liftLeave} style={{ marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, padding: '0 24px', borderRadius: 9999, background: '#273c33', color: '#fff', fontSize: 14, fontWeight: 700, transition: 'transform .2s,box-shadow .2s' }}>
                ติดต่อเรา
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
              </Link>
            </div>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 44px rgba(2,35,16,.15)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=700&q=80" alt="รูปผู้ก่อตั้ง" style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 12px', borderRadius: 9999, background: 'rgba(255,255,255,.92)', color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.4"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19.3 7.2 17l.9-5.4L4.2 7.7l5.4-.8z" /></svg>
                ผู้ก่อตั้ง · EST. 2019
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 18px', background: 'linear-gradient(180deg,rgba(2,29,14,0) 0%,rgba(2,29,14,.72) 100%)' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>คุณกิตติพงษ์ พรหมทอง</div>
                <div style={{ fontSize: '12.5px', color: '#DDE8E2' }}>Founder · กรุงเทพฯ – ชลบุรี</div>
              </div>
            </div>
          </div>

          <div id="about-pillars" style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
            {pillars.map((p) => (
              <div key={p.num}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted3)' }}>{p.num}</div>
                <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{p.title}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section style={{ maxWidth: '1320px', margin: '36px auto 0', padding: '0 24px' }}>
        <div id="team-grid" style={{ display: 'grid', gridTemplateColumns: '.62fr 1.38fr', gap: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden' }}>
          <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg,#0A0E0C 0%,#0A0E0C 45%,#0F2318 100%)', padding: '40px 34px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 9999, background: 'radial-gradient(circle,rgba(45,251,145,.16),rgba(45,251,145,0) 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 22, height: 2, background: '#2DFB91', borderRadius: 2 }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: '#2DFB91', textTransform: 'uppercase' }}>ทีมงาน</span>
            </div>
            <h2 style={{ position: 'relative', margin: '10px 0 0', fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>พบกับทีมงานของเรา</h2>
            <p style={{ position: 'relative', margin: '14px 0 0', fontSize: '13.5px', color: '#B9C2BD', lineHeight: 1.7 }}>ทีมผู้เชี่ยวชาญที่คัดเลือกด้วยความรอบคอบทุกด้าน ด้านอสังหาริมทรัพย์อุตสาหกรรมในประเทศไทย ด้วยความเข้าใจในพื้นที่และความชำนาญในการให้บริการ เรามีประสบการณ์การทำงานที่หลากหลายเพื่อสร้างความไว้วางใจให้กับลูกค้าทุกท่าน</p>
            <div style={{ position: 'relative', display: 'flex', gap: 10, marginTop: 22 }}>
              <div onClick={() => scroll(-220)} onMouseEnter={arrowEnter} onMouseLeave={arrowLeave} style={arrowBtn}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 6l-6 6 6 6" /></svg>
              </div>
              <div onClick={() => scroll(220)} onMouseEnter={arrowEnter} onMouseLeave={arrowLeave} style={arrowBtn}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>
              </div>
            </div>
          </div>
          <div style={{ padding: 28, overflow: 'hidden' }}>
            <div ref={teamRef} className="no-sb" style={{ display: 'flex', gap: 18, overflowX: 'auto', scrollBehavior: 'smooth' }}>
              {team.map((m) => (
                <div key={m.slot} style={{ flex: '0 0 200px' }}>
                  <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', height: 240 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(2,29,14,0) 55%,rgba(2,29,14,.55) 100%)', pointerEvents: 'none' }} />
                  </div>
                  <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{m.name}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--muted2)' }}>{m.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AWARD */}
      <section style={{ maxWidth: '1320px', margin: '36px auto 0', padding: '0 24px' }}>
        <div id="award-grid" style={{ display: 'grid', gridTemplateColumns: '.85fr 1.15fr', gap: 0, background: 'var(--bg2)', borderRadius: 24, overflow: 'hidden' }}>
          <div style={{ position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80" alt="รูปรับรางวัล" style={{ width: '100%', height: '100%', minHeight: 280, objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ padding: '40px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 26, height: 2, background: 'var(--accent)', borderRadius: 2 }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: 'var(--accent)', textTransform: 'uppercase' }}>รางวัล</span>
            </div>
            <h2 style={{ margin: '10px 0 0', fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em' }}>เอเจนต์อสังหาริมทรัพย์อุตสาหกรรมที่ดีที่สุด</h2>
            <p style={{ margin: '14px 0 0', fontSize: 14, color: 'var(--muted)', lineHeight: 1.75 }}>JKP Property ได้รับรางวัล The Best Agent in Industrial Property จากสมาคมอสังหาริมทรัพย์ไทย ตอกย้ำความมุ่งมั่นในการให้บริการที่มีคุณภาพและความโปร่งใสในธุรกิจอสังหาริมทรัพย์อุตสาหกรรมของไทย</p>
            <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Thailand Real Estate Agent Awards 2025</div>
            <a href="#" onMouseEnter={liftEnter('0 10px 24px rgba(0,0,0,.28)')} onMouseLeave={liftLeave} style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 22px', borderRadius: 9999, background: 'var(--text)', color: '#fff', fontSize: '13.5px', fontWeight: 700, width: 'fit-content', transition: 'transform .2s,box-shadow .2s' }}>
              ดูรางวัลของเรา
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* FEATURED IN */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '.06em', color: 'var(--muted2)', textTransform: 'uppercase' }}>การรับรองจากวงการ</div>
        <h2 style={{ margin: '8px 0 32px', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>ได้รับการนำเสนอใน</h2>
        <div id="logo-row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 44, flexWrap: 'wrap', opacity: 0.6 }}>
          {pressLogos.map((pl) => (
            <div key={pl} style={{ fontSize: 16, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.01em' }}>{pl}</div>
          ))}
        </div>
      </section>
    </>
  );
}
