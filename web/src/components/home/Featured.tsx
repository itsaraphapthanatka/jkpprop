'use client';

import { useRef, useState } from 'react';
import Link from '@/i18n/LocaleLink';
import { PhotoPlaceholder } from '@/components/common/PhotoPlaceholder';
import { useDict, useI18n } from '@/i18n/useDict';
import { enumLabel } from '@/i18n/enums';
import type { SectionCopy } from '@/lib/server/sectionCopy';
import { useFavourites } from '@/lib/favourites';

/* Cards come from the database via the home page (a server component), not
   from a list in this file. They used to be a copy of the design prototype's
   demo data — six invented properties whose "ดูรายละเอียด" links pointed at
   codes that do not exist, so every one of them landed on a 404. */
export type FeaturedItem = {
  code: string;
  title: string;
  deal: string;
  loc: string;
  price: string;
  areaLabel: string;
  typeKey: string;
  img: string | null;
  photos: string;
};

type Listing = {
  slot: string;
  deal: string;
  photos: string;
  code: string;
  title: string;
  loc: string;
  price: string;
  area: string;
  img: string | null;
  type: string;
};

const toListing = (it: FeaturedItem): Listing => ({
  slot: it.code,
  deal: it.deal,
  photos: it.photos,
  code: it.code,
  title: it.title,
  loc: it.loc,
  price: it.price,
  area: it.areaLabel || '—',
  img: it.img,
  type: it.typeKey === 'factory' ? 'โรงงาน' : 'โกดัง/คลังสินค้า',
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
        background: hover ? 'var(--accent)' : 'var(--surface)',
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
  const { d, locale } = useI18n();
  const [hover, setHover] = useState(false);
  const [favHover, setFavHover] = useState(false);
  const [detailHover, setDetailHover] = useState(false);

  return (
    <div
      data-card={it.slot}
      className="rs-card-third"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', flex: '0 0 calc(33.3333% - 16px)', background: 'var(--surface)',
        border: '1px solid ' + (hover ? 'var(--accent)' : 'var(--border)'), borderRadius: 18,
        overflow: 'hidden', minHeight: 535, display: 'flex', flexDirection: 'column',
        boxShadow: hover ? '0 22px 44px rgba(var(--ink-rgb),.16)' : '0 1px 3px rgba(0,0,0,.05)',
        transform: hover ? 'translateY(-8px)' : 'none',
        transition: 'transform .28s cubic-bezier(.2,.7,.3,1),box-shadow .28s,border-color .28s',
      }}
    >
      <div style={{ position: 'relative', height: 285, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transition: 'transform .5s cubic-bezier(.2,.7,.3,1)', transform: hover ? 'scale(1.07)' : 'none' }}>
          {it.img
            ? /* eslint-disable-next-line @next/next/no-img-element */
              <img src={it.img} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <PhotoPlaceholder />}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(var(--ink-rgb),.28) 0%,rgba(var(--ink-rgb),0) 34%,rgba(var(--ink-rgb),0) 62%,rgba(var(--ink-rgb),.42) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 13px', borderRadius: 9999, background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.42)', color: '#fff', fontSize: 12, fontWeight: 700, pointerEvents: 'none', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }}>
          <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#fff' }} />{enumLabel(it.deal, locale)}
        </div>
        <div
          data-fav
          data-on={favFill === 'none' ? '0' : '1'}
          onClick={onToggleFav}
          onMouseEnter={() => setFavHover(true)}
          onMouseLeave={() => setFavHover(false)}
          style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 9999, background: 'var(--neon)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.14)', transition: 'transform .2s', transform: favHover ? 'scale(1.12)' : 'none' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={favFill} stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, height: 24, padding: '0 9px', borderRadius: 7, background: 'rgba(var(--ink-rgb),.6)', color: '#fff', fontSize: 11, fontWeight: 600, pointerEvents: 'none', backdropFilter: 'blur(3px)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 15l-5-4-4 3" /></svg>{it.photos}
        </div>
      </div>
      <div style={{ padding: '18px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(var(--accent-rgb),.05)', borderTop: '1px solid rgba(var(--accent-rgb),.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--muted2)', letterSpacing: '.04em' }}>{it.code}</span>
          <span style={{ width: 4, height: 4, borderRadius: 9999, background: 'var(--border)' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 10px', borderRadius: 6, background: 'var(--tint)', color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>{enumLabel(it.type, locale)}</span>
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
            <div style={{ fontSize: 12, color: 'var(--muted3)', fontWeight: 500 }}>{d.common.price}</div>
            <div style={{ marginTop: 2, fontSize: 21, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-.01em' }}>{it.price}</div>
          </div>
          <Link
            href={`/property/${encodeURIComponent(it.code)}`}
            onMouseEnter={() => setDetailHover(true)}
            onMouseLeave={() => setDetailHover(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: detailHover ? 'var(--accent)' : 'var(--surface)', border: '1px solid var(--pine)', color: detailHover ? '#fff' : 'var(--pine)', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .2s' }}
          >
            {d.common.viewDetail}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Featured({ items = [], copy }: { items?: FeaturedItem[]; copy: SectionCopy }) {
  const d = useDict();
  const pick = (v: string, fallback: string) => v || fallback;
  const listings = items.map(toListing);
  const rowRef = useRef<HTMLDivElement>(null);
  /* keyed by property code, and kept in the browser: this was a
     Record<number, boolean> keyed by position in the row, so it forgot on
     every navigation and a card that moved took someone else's heart */
  const favs = useFavourites();
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
            <span style={{ width: 26, height: 2, background: 'var(--pine)', borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: 'var(--pine)', textTransform: 'uppercase' }}>{pick(copy.eyebrow, d.featured.eyebrow)}</span>
          </div>
          <h2 style={{ margin: '10px 0 0', fontSize: '34px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em' }}>{pick(copy.headline, d.featured.heading)}</h2>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--muted2)' }}>{pick(copy.sub, d.featured.sub)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/listing" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--pine)' }}>
            {d.common.viewAll}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--pine)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
          </Link>
          {listings.length > 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <NavArrow onClick={scrollPrev} d="M15 6l-6 6 6 6" />
              <NavArrow onClick={scrollNext} d="M9 6l6 6-6 6" />
            </div>
          )}
        </div>
      </div>

      {listings.length === 0 ? (
        <div style={{ padding: '56px 24px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 18, background: 'var(--surface)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{d.featured.emptyTitle}</div>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted2)' }}>
            {d.featured.emptyBody}
          </p>
        </div>
      ) : (
        <>
          <div ref={rowRef} onScroll={onRowScroll} className="no-sb" style={{ display: 'flex', gap: 24, overflowX: 'auto', scrollBehavior: 'smooth', padding: '6px 4px 14px' }}>
            {listings.map((it) => (
              <ListingCard
                key={it.slot}
                it={it}
                favFill={favs.has(it.slot) ? 'var(--ink)' : 'none'}
                onToggleFav={() => favs.toggle(it.slot)}
              />
            ))}
          </div>

          {listings.length > 1 && (
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: 180, height: 4, borderRadius: 9999, background: '#E5E2DC', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '38%', borderRadius: 9999, background: 'var(--pine)', transition: 'transform .15s linear', transform: `translateX(${progressX})` }} />
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
        <Link
          href="/listing"
          onMouseEnter={() => setSeeAllHover(true)}
          onMouseLeave={() => setSeeAllHover(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 26px', borderRadius: 9999, border: '1.5px solid var(--pine)', color: seeAllHover ? '#fff' : 'var(--pine)', fontSize: '14.5px', fontWeight: 700, background: seeAllHover ? 'var(--accent)' : 'var(--surface)', transition: 'all .2s' }}
        >
          {d.common.showAll}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
        </Link>
      </div>
    </section>
  );
}
