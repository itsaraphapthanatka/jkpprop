'use client';

import { useRef, useState } from 'react';

type RawListing = {
  slot: string;
  deal: string;
  photos: string;
  code: string;
  title: string;
  loc: string;
  price: string;
  area: string;
  img: string;
  credit: string;
  creditHref: string;
};

type Listing = RawListing & { type: string };

const rawListings: RawListing[] = [
  {
    slot: 'l1', deal: 'ให้เช่า', photos: '12', code: 'TIP-2041',
    title: 'โรงงานพร้อมสำนักงาน พื้นที่ 2,700 ตร.ม.', loc: 'บางนา, กรุงเทพฯ',
    price: '฿ 405,000 / เดือน', area: '2,700 ตร.ม. · ถนนกว้าง 8 ม.',
    img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
    credit: 'Photo by ThisisEngineering on Unsplash', creditHref: 'https://unsplash.com/@thisisengineering',
  },
  {
    slot: 'l2', deal: 'ให้เช่า', photos: '8', code: 'TIP-1987',
    title: 'โกดังคลังสินค้าไฟฟ้า 3 เฟส พื้นที่ 1,300 ตร.ม.', loc: 'ศรีราชา, ชลบุรี',
    price: '฿ 176,000 / เดือน', area: '1,300 ตร.ม. · ใกล้ท่าเรือแหลมฉบัง',
    img: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80',
    credit: 'Photo by Petrebels on Unsplash', creditHref: 'https://unsplash.com/@petrebels',
  },
  {
    slot: 'l3', deal: 'ขาย', photos: '15', code: 'TIP-1802',
    title: 'โรงงานในนิคมอุตสาหกรรม พื้นที่ 650 ตร.ม.', loc: 'พานทอง, ชลบุรี',
    price: '฿ 9.7 ล้าน', area: '650 ตร.ม. · โฉนดพร้อมโอน',
    img: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80',
    credit: 'Photo by Simone Hutsch on Unsplash', creditHref: 'https://unsplash.com/@heysupersimi',
  },
  {
    slot: 'l4', deal: 'ให้เช่า', photos: '10', code: 'TIP-1755',
    title: 'โกดังริมถนนเมนใกล้มอเตอร์เวย์ พื้นที่ 1,800 ตร.ม.', loc: 'บางปะกง, ฉะเชิงเทรา',
    price: '฿ 245,000 / เดือน', area: '1,800 ตร.ม. · รถเทรลเลอร์เข้าได้',
    img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
    credit: 'Photo by Petrebels on Unsplash', creditHref: 'https://unsplash.com/@petrebels',
  },
  {
    slot: 'l5', deal: 'ขาย', photos: '9', code: 'TIP-1698',
    title: 'โรงงานพร้อมออฟฟิศ 2 ชั้น พื้นที่ 3,200 ตร.ม.', loc: 'บางพลี, สมุทรปราการ',
    price: '฿ 58 ล้าน', area: '3,200 ตร.ม. · ผังสีม่วง',
    img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80',
    credit: 'Photo by Simone Hutsch on Unsplash', creditHref: 'https://unsplash.com/@heysupersimi',
  },
  {
    slot: 'l6', deal: 'ให้เช่า', photos: '14', code: 'TIP-1642',
    title: 'คลังสินค้าห้องเย็นพร้อมระบบ พื้นที่ 900 ตร.ม.', loc: 'วังน้อย, พระนครศรีอยุธยา',
    price: '฿ 132,000 / เดือน', area: '900 ตร.ม. · ห้องเย็น -18°C',
    img: 'https://images.unsplash.com/photo-1601599963565-b7f49deb352a?w=800&q=80',
    credit: 'Photo by ThisisEngineering on Unsplash', creditHref: 'https://unsplash.com/@thisisengineering',
  },
];

const listings: Listing[] = rawListings.map((it) => {
  const isWh = /โกดัง|คลัง/.test(it.title);
  return { ...it, type: isWh ? 'โกดัง/คลังสินค้า' : 'โรงงาน' };
});

function NavArrow({ onClick, d }: { onClick: () => void; d: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 44, height: 44, borderRadius: 9999,
        background: hover ? '#034956' : 'var(--surface)',
        border: '1px solid ' + (hover ? 'var(--accent)' : 'var(--border)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: hover ? '#fff' : 'var(--accent)', transition: 'all .2s',
      }}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
    </div>
  );
}

function ListingCard({ it, favFill, onToggleFav }: { it: Listing; favFill: string; onToggleFav: () => void }) {
  const [hover, setHover] = useState(false);
  const [favHover, setFavHover] = useState(false);
  const [detailHover, setDetailHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', flex: '0 0 calc((100% - 48px)/3)', background: 'var(--surface)',
        border: '1px solid ' + (hover ? 'var(--accent)' : 'var(--border)'), borderRadius: 18,
        overflow: 'hidden', minHeight: 535, display: 'flex', flexDirection: 'column',
        boxShadow: hover ? '0 22px 44px rgba(2,35,16,.16)' : '0 1px 3px rgba(0,0,0,.05)',
        transform: hover ? 'translateY(-8px)' : 'none',
        transition: 'transform .28s cubic-bezier(.2,.7,.3,1),box-shadow .28s,border-color .28s',
      }}
    >
      <div style={{ position: 'relative', height: 285, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transition: 'transform .5s cubic-bezier(.2,.7,.3,1)', transform: hover ? 'scale(1.07)' : 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.img} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(2,35,16,.28) 0%,rgba(2,35,16,0) 34%,rgba(2,35,16,0) 62%,rgba(2,35,16,.42) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 13px', borderRadius: 9999, background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.42)', color: '#fff', fontSize: 12, fontWeight: 700, pointerEvents: 'none', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
          <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#fff' }} />{it.deal}
        </div>
        <div
          onClick={onToggleFav}
          onMouseEnter={() => setFavHover(true)}
          onMouseLeave={() => setFavHover(false)}
          style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 9999, background: '#2DFB91', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.14)', transition: 'transform .2s', transform: favHover ? 'scale(1.12)' : 'none' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={favFill} stroke="#022310" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, height: 24, padding: '0 9px', borderRadius: 7, background: 'rgba(2,35,16,.6)', color: '#fff', fontSize: 11, fontWeight: 600, pointerEvents: 'none', backdropFilter: 'blur(3px)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 15l-5-4-4 3" /></svg>{it.photos}
        </div>
      </div>
      <div style={{ padding: '18px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(3,73,86,.05)', borderTop: '1px solid rgba(3,73,86,.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--muted2)', letterSpacing: '.04em' }}>{it.code}</span>
          <span style={{ width: 4, height: 4, borderRadius: 9999, background: 'var(--border)' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 10px', borderRadius: 6, background: 'var(--tint)', color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>{it.type}</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 17, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, minHeight: 48 }}>{it.title}</div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 14 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7A7974" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>{it.loc}
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted2)', fontSize: 13 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7A7974" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 14h7v7h-7z" /><path d="M14 3l7 7M3 14l7 7" /></svg>{it.area}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted3)', fontWeight: 500 }}>ราคา</div>
            <div style={{ marginTop: 2, fontSize: 21, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-.01em' }}>{it.price}</div>
          </div>
          <a
            href="/property"
            onMouseEnter={() => setDetailHover(true)}
            onMouseLeave={() => setDetailHover(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: detailHover ? '#034956' : 'var(--surface)', border: '1px solid #273c33', color: detailHover ? '#fff' : '#273c33', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .2s' }}
          >
            ดูรายละเอียด
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export function Featured() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [favs, setFavs] = useState<Record<number, boolean>>({});
  const [progress, setProgress] = useState(0);
  const [seeAllHover, setSeeAllHover] = useState(false);

  const scrollBy = (dir: number) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };
  const scrollPrev = () => scrollBy(-1);
  const scrollNext = () => scrollBy(1);
  const onRowScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };

  const track = 180;
  const bar = track * 0.38;
  const progressX = ((track - bar) * progress).toFixed(1) + 'px';

  return (
    <section data-anim="1" style={{ maxWidth: '1200px', margin: '0 auto', padding: '88px 24px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: '#273c33', textTransform: 'uppercase' }}>ทรัพย์มาใหม่</span>
          </div>
          <h2 style={{ margin: '10px 0 0', fontSize: '34px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em' }}>อสังหาริมทรัพย์ล่าสุด</h2>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--muted2)' }}>คัดสรรทรัพย์คุณภาพที่ผ่านการตรวจสอบ อัปเดตใหม่ทุกสัปดาห์</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a href="/listing" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#273c33' }}>
            ดูทั้งหมด
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#273c33" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
          </a>
          <div style={{ display: 'flex', gap: 8 }}>
            <NavArrow onClick={scrollPrev} d="M15 6l-6 6 6 6" />
            <NavArrow onClick={scrollNext} d="M9 6l6 6-6 6" />
          </div>
        </div>
      </div>

      <div ref={rowRef} onScroll={onRowScroll} className="no-sb" style={{ display: 'flex', gap: 24, overflowX: 'auto', scrollBehavior: 'smooth', padding: '6px 4px 14px' }}>
        {listings.map((it, i) => (
          <ListingCard
            key={it.slot}
            it={it}
            favFill={favs[i] ? '#022310' : 'none'}
            onToggleFav={() => setFavs((f) => ({ ...f, [i]: !f[i] }))}
          />
        ))}
      </div>

      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 180, height: 4, borderRadius: 9999, background: '#E5E2DC', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '38%', borderRadius: 9999, background: '#273c33', transition: 'transform .15s linear', transform: `translateX(${progressX})` }} />
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
        <a
          href="/listing"
          onMouseEnter={() => setSeeAllHover(true)}
          onMouseLeave={() => setSeeAllHover(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 26px', borderRadius: 9999, border: '1.5px solid #273c33', color: seeAllHover ? '#fff' : '#273c33', fontSize: '14.5px', fontWeight: 700, background: seeAllHover ? '#034956' : 'var(--surface)', transition: 'all .2s' }}
        >
          แสดงทั้งหมด
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
        </a>
      </div>
    </section>
  );
}
