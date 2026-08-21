'use client';

import { useEffect, useRef, useState } from 'react';
import { useDict } from '@/i18n/useDict';
import type { SectionCopy } from '@/lib/server/sectionCopy';

/* These used to read 2,000+ properties, 100+ organisations and 12 years —
   figures nobody could point at, printed as fact above a catalogue of three.
   The defaults are now counted from the published inventory; anything typed
   into the CMS still wins over them. */
export type PublicStats = { published: number; provinces: number; lastUpdated: string | null };

const FEATURE_ICONS = [
  <svg key="0" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" /></svg>,
  <svg key="1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20" /></svg>,
  <svg key="2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M5 7l7-4 7 4M4 21h16M6 21V9l6-3 6 3v12" /><path d="M3 11h4M17 11h4" /></svg>,
  <svg key="3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /></svg>,
  <svg key="4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  <svg key="5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 00-4 4c0 1.5.8 2.8 2 3.4V11a2 2 0 01-2 2H6a3 3 0 00-3 3v1M12 2a4 4 0 014 4c0 1.5-.8 2.8-2 3.4V11a2 2 0 002 2h2a3 3 0 013 3v1" /><circle cx="4" cy="20" r="2" /><circle cx="20" cy="20" r="2" /><circle cx="12" cy="20" r="2" /></svg>,
];

export function WhyUs({ copy, kpi: kpiCopy, stats }: { copy: SectionCopy; kpi: SectionCopy; stats?: PublicStats }) {
  const d = useDict();
  /* Starts at the final value, not at zero: these are counted from the
     inventory now, so the server-rendered HTML — the copy a crawler and a
     no-JS visitor read — must already say 3, not 0. The count-up runs from
     zero only once the strip is actually scrolled into view. */
  const [kpi, setKpi] = useState(1);
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
      setKpi(0);
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

  /* A figure entered in the CMS is shown as typed — the count-up animation
     only knows how to walk an integer up from zero, and "2,000+" is not one.
     Anything the team writes is printed verbatim; only the built-in defaults
     animate. */
  const counted = [stats?.published ?? 0, stats?.provinces ?? 0];
  const kpis = kpiCopy.items.length
    ? kpiCopy.items.map((it) => ({ label: it.desc ?? '', value: it.title ?? '' }))
    : [
      // the two counts animate up; a date is not a number to count to
      ...counted.map((n, i) => ({ label: d.whyUs.kpis[i], value: Math.round(n * kpi).toLocaleString('en-US') })),
      { label: d.whyUs.kpis[2], value: stats?.lastUpdated ?? '—' },
    ];

  const pick = (v: string, fallback: string) => v || fallback;
  /* "ชื่อรางวัล · ปี" in one field, so the ribbon's two lines stay one thing
     to fill in and one thing to leave blank. */
  const [awardTitle, awardSub] = copy.note.split(/\s*·\s*(.+)/);
  const rating = copy.cta.trim();
  const features = copy.items.length
    ? copy.items.map((it) => ({ title: it.title ?? '', desc: it.desc ?? '' }))
    : d.whyUs.items;

  return (
    <div style={{ width: '100%', background: 'var(--bg)' }}>
      <section data-anim="1" style={{ maxWidth: '1320px', margin: '0 auto', padding: '88px 24px' }}>
        <div className="rs-split-r" style={{ display: 'grid', gridTemplateColumns: '0.92fr 1.08fr', gap: 52, alignItems: 'center' }}>
          {/* image card */}
          <div style={{ position: 'relative', height: '480px', borderRadius: '20px', overflow: 'hidden', background: 'var(--bg2)', boxShadow: '0 24px 50px rgba(var(--ink-rgb),.16)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={copy.img || "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000&q=80"} alt={pick(copy.headline, d.whyUs.heading)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(var(--ink-rgb),.34) 0%,rgba(var(--ink-rgb),0) 30%,rgba(var(--ink-rgb),0) 55%,rgba(var(--ink-rgb),.5) 100%)', pointerEvents: 'none' }} />
            {/* Award ribbon — printed only when the team names an award.
                "Real Estate Agent Awards / Thailand · 2025" used to be baked
                in here, on a site whose owner had not told us they won it. */}
            {awardTitle && (
            <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 15px 9px 11px', borderRadius: '12px', background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(6px)', boxShadow: '0 8px 22px rgba(0,0,0,.18)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 0012 0V3H6z" /><path d="M6 5H3v2a4 4 0 004 4M18 5h3v2a4 4 0 01-4 4M9 21h6M12 17v4" /></svg>
              </div>
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--pine)', letterSpacing: '.02em' }}>{awardTitle}</div>
                {awardSub && <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted2)' }}>{awardSub}</div>}
              </div>
            </div>
            )}
            {/* Rating card — the 4.9 and its five filled stars were hard-coded
                against no review source at all. Blank means no card. */}
            {rating && (
            <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '15px 18px', borderRadius: '16px', background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(8px)', boxShadow: '0 12px 30px rgba(0,0,0,.2)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{rating}</div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[0, 1, 2, 3, 4].map((n) => (
                      /* filled up to the score, so 4.2 does not show five full stars */
                      <svg key={n} width="15" height="15" viewBox="0 0 24 24" fill={n < Math.round(Number(rating) || 0) ? 'var(--accent)' : 'none'} stroke="var(--accent)" strokeWidth="1.6"><path d="M12 2l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.9 5.9 20l1.6-6.5-5-4.3 6.6-.6z" /></svg>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 4, fontSize: '12.5px', color: 'var(--muted)' }}>{d.whyUs.satisfaction}</div>
              </div>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 9999, backgroundColor: 'var(--pine)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><path d="M21 12c0 5-3.5 7.5-8.6 8.9a1 1 0 01-.8 0C6.5 19.5 3 17 3 12V6a1 1 0 01.7-1l8-2.6a1 1 0 01.6 0l8 2.6A1 1 0 0121 6z" /></svg>
              </div>
            </div>
            )}
          </div>

          {/* right column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 26, height: 2, background: 'var(--pine)', borderRadius: 2 }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', color: 'var(--pine)', textTransform: 'uppercase' }}>{pick(copy.eyebrow, d.whyUs.eyebrow)}</span>
            </div>
            <h2 style={{ margin: '10px 0 12px', fontSize: 34, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.01em' }}>{pick(copy.headline, d.whyUs.heading)}</h2>
            <p style={{ margin: '0 0 28px', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, maxWidth: '560px' }}>{pick(copy.sub, d.whyUs.sub)}</p>
            {/* KPI count-up strip — its own section in the CMS, so figures
                nobody has verified can be switched off without losing the
                rest of the block. */}
            {kpiCopy.enabled && (
            <div className="rs-cols-3" ref={kpiRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '22px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              {kpis.map((k, i) => (
                <div key={i}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-.02em', lineHeight: 1 }}>{k.value}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--muted2)' }}>{k.label}</div>
                </div>
              ))}
            </div>
            )}
          </div>
        </div>

        {/* feature cards */}
        <div className="rs-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginTop: 44 }}>
          {features.map((f, i) => {
            const on = i === fhover;
            const ghost = on ? 'rgba(var(--neon-rgb),.14)' : 'rgba(40,37,29,.05)';
            const titleColor = on ? '#fff' : 'var(--text)';
            const descColor = on ? '#B9C2BD' : 'var(--muted)';
            const card: React.CSSProperties = on
              ? { position: 'relative', overflow: 'hidden', background: 'linear-gradient(120deg,#0A0E0C 0%,#0A0E0C 50%,#0E3A22 100%)', border: '1.5px solid rgba(var(--neon-rgb),.35)', borderRadius: '16px', padding: '24px 22px 26px', transition: 'transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s', transform: 'translateY(-6px)', boxShadow: '0 20px 40px rgba(0,0,0,.32)' }
              : { position: 'relative', overflow: 'hidden', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '16px', padding: '24px 22px 26px', transition: 'transform .3s cubic-bezier(.2,.7,.3,1), box-shadow .3s, border-color .3s', transform: 'none', boxShadow: '0 1px 3px rgba(0,0,0,.05)' };
            const cardGlow: React.CSSProperties = on ? { position: 'absolute', bottom: '-55%', right: '-15%', width: '75%', height: '170%', background: 'radial-gradient(ellipse at center,rgba(var(--neon-rgb),.36) 0%,rgba(var(--neon-rgb),0) 62%)', pointerEvents: 'none' } : { display: 'none' };
            const tile: React.CSSProperties = { position: 'relative', zIndex: 1, width: '52px', height: '52px', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--neon)' : 'var(--pine)', color: on ? '#04140C' : 'var(--neon)', transition: 'all .3s', boxShadow: on ? '0 8px 20px rgba(var(--neon-rgb),.4)' : 'none' };
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
