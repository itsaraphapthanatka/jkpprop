'use client';

import { useEffect, useState } from 'react';
import { Gallery } from './Gallery';
import { InquiryBox } from './InquiryBox';
import Link from '@/i18n/LocaleLink';
import type { SpecRow } from '@/lib/server/propertySpecs';
import { useDict } from '@/i18n/useDict';
import { PropertyCard, type CardListing } from '@/components/listing/PropertyCard';
import { useFavourites } from '@/lib/favourites';
import { ShareMenu } from '@/components/site/ShareMenu';

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

/* Specs, features, nearby landmarks and the related grid all arrive as props
   built from the record's own stored fields (lib/server/propertySpecs). They
   were constants here — the same electrical spec, the same deposit, the same
   "45 km to Laem Chabang", on every property in the catalogue. A field with
   no value now renders no row, and a section with no rows does not render. */

/** icon per spec key; anything unmapped gets the generic one */
const SPEC_ICON: Record<string, React.ReactNode> = {
  usable_area: qi(<><path d="M3 3h18v18H3z" /><path d="M3 9h18M9 3v18" /></>),
  land_area: qi(<><path d="M3 3h18v18H3z" /><path d="M3 9h18M9 3v18" /></>),
  clear_height: qi(<path d="M12 3v18M5 8l7-5 7 5" />),
  building_height: qi(<path d="M12 3v18M5 8l7-5 7 5" />),
  floor_loading: qi(<path d="M12 2v20M5 8h14M5 8a3 3 0 006 0M13 8a3 3 0 006 0" />),
  power_system: qi(<path d="M13 2L3 14h7l-1 8 11-14h-7z" />),
  doors: qi(<><rect x="4" y="3" width="16" height="18" rx="1" /><circle cx="15" cy="12" r="1" /></>),
};
const SPEC_ICON_FALLBACK = qi(<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>);

const featureIcon = fi(<path d="M20 6L9 17l-5-5" />);
const nearbyIcon = ni(<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />);

export type RelatedProperty = CardListing;

const sectionCard: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '26px 28px' };
const sectionHead = (title: string, mb = 18): React.ReactNode => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: mb }}>
    <span style={{ width: 26, height: 2, background: 'var(--pine)', borderRadius: 2 }} />
    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{title}</h2>
  </div>
);

const pin = (w: number, stroke: string, sw = '1.8') => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/* Both of these were bare <div>s with a cursor and no handler — the heart did
   not save anything and the share button shared nothing. */
function ShareBtn({ children, onClick, title, testId }: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  testId?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title}
      title={title}
      data-testid={testId}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', cursor: 'pointer', background: hover ? 'var(--tint)' : 'transparent', transition: 'background .2s' }}
    >
      {children}
    </div>
  );
}


/* Everything the public detail page shows, all of it read from the record —
   see lib/server/propertySpecs for how the stored fields become rows. */
export type PublicProperty = {
  code: string; title: string;
  /** the team's own description in the reader's language; Thai records have
      none yet, so the block simply does not appear */
  description?: string;
  typeLabel: string; location: string;
  area: number | null; dealType: string; priceRent: number | null; priceSale: number | null;
  updatedAt: string;
  specs: { quick: SpecRow[]; rows: SpecRow[]; features: string[]; nearby: string[] };
  zoning: string | null;
  /** media src จาก /api/public/properties/:code — ใส่ลายน้ำแล้วตอนเสิร์ฟ */
  photos: string[];
  related: RelatedProperty[];
  /** the company's chat accounts, so the buttons in the enquiry box go somewhere */
  socials: { key: string; url: string }[];
  phone?: string;
  wechatId: string;
};

const baht = (n: number) => `฿${n.toLocaleString('th-TH')}`;

/* `property` is required: the page 404s before rendering when the code does
   not resolve, so there is no case to fall back to — the old optional prop
   carried a full demo record as its default. */
export function PropertyDetail({ property }: { property: PublicProperty }) {
  const d = useDict();
  // the same list the listing page and the masthead read
  const favs = useFavourites();
  /* read after mount: the server has no window, and the URL is what gets shared */
  const [shareUrl, setShareUrl] = useState('');
  useEffect(() => setShareUrl(window.location.href), []);

  const w980 = useMaxWidth(980);
  const w640 = useMaxWidth(640);

  const { code, title: heading, specs, zoning, related } = property;
  const place = property.location;
  const isRent = property.priceRent !== null;
  const priceLabel = isRent ? d.property.priceRent : d.property.priceSale;
  const priceValue = property.priceRent !== null ? baht(property.priceRent)
    : property.priceSale !== null ? baht(property.priceSale)
      : d.common.priceOnRequest;
  const priceUnit = property.priceRent !== null
    ? `${d.common.perMonth}${property.area ? ` · ฿${Math.round(property.priceRent / property.area)}/${d.common.sqm}` : ''}`
    : '';

  return (
    <>
      {/* BREADCRUMB */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted2)', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: 'var(--muted2)' }}>{d.common.home}</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        <Link href="/listing" style={{ color: 'var(--muted2)' }}>{d.listing.title}</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{code}</span>
      </div>

      {/* GALLERY */}
      <Gallery photos={property.photos} dealLabel={property.dealType} typeLabel={property.typeLabel} />

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
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-.01em', lineHeight: 1.3 }}>{heading}</h1>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13.5px', color: 'var(--muted)' }}>{pin(15, 'var(--accent)')}{place}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted2)' }}>{d.property.code}: <code style={{ fontWeight: 700, color: 'var(--deep)' }}>{code}</code></span>
                </div>
              </div>
              <div style={{ textAlign: w640 ? 'left' : 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{priceLabel}</div>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: 'var(--accent)' }}>{priceValue}</div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)' }}>{priceUnit}</div>
              </div>
            </div>

            {property.description && (
              <p style={{ margin: '16px 0 0', fontSize: '14.5px', lineHeight: 1.8, color: 'var(--muted)', whiteSpace: 'pre-line' }}>{property.description}</p>
            )}

            {/* QUICK SPECS */}
            {specs.quick.length > 0 && (
              <div className="rs-cols-4" id="pd-specs" style={{ marginTop: 22, display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, specs.quick.length)}, 1fr)`, gap: 12 }}>
                {specs.quick.map((q) => (
                  <div key={q.key} style={{ background: 'var(--bg)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>{SPEC_ICON[q.key] ?? SPEC_ICON_FALLBACK}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{q.value}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>{q.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>{d.property.updatedAt} {property.updatedAt} · <span style={{ color: 'var(--muted3)' }}>{d.property.notGuaranteed}</span></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <ShareBtn onClick={() => favs.toggle(code)} title={d.listing.saved} testId="pd-fav">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill={favs.has(code) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.8 8.6a5.5 5.5 0 00-9-1.8L12 8l-.1-.1a5.5 5.5 0 10-7.8 7.8l7.9 7.9 7.9-7.9a5.5 5.5 0 00.9-7z" /></svg>
                </ShareBtn>
                <ShareMenu target={{ url: shareUrl, title: property.title }}>
                  <ShareBtn onClick={() => {}} title={d.listing.copyLink} testId="pd-share">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" /></svg>
                  </ShareBtn>
                </ShareMenu>
              </div>
            </div>
          </div>

          {/* SPEC TABLE */}
          {specs.rows.length > 0 && (
            <div style={sectionCard}>
              {sectionHead(d.property.specs)}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {specs.rows.map((r) => (
                  <div key={r.key} data-spec-row={r.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13.5px', color: 'var(--muted)' }}>{r.label}</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FEATURES */}
          {specs.features.length > 0 && (
            <div style={sectionCard}>
              {sectionHead(d.property.features)}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {specs.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, height: 44, padding: '0 16px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--accent)', display: 'flex' }}>{featureIcon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ZONE */}
          {zoning && (
            <div style={sectionCard}>
              {sectionHead(d.property.zoneType)}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 18px', borderRadius: 12, background: 'var(--tint)', width: 'fit-content' }}>
                {pin(18, 'var(--accent)')}
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent)' }}>{zoning}</span>
              </div>
            </div>
          )}

          {/* LOCATION — area level only, never the exact pin (FR-LST-02).
              The map tile used to be a stock photo of a city, which is not
              this property's location in any sense; a Maps search on the
              published area is at least what it claims to be. */}
          {place && (
            <div style={sectionCard}>
              {sectionHead(d.property.location, 8)}
              <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: 'var(--muted2)' }}>{d.property.areaLevelNote} — {place}</p>
              <div id="pd-location-grid" style={{ display: 'grid', gridTemplateColumns: w640 || !specs.nearby.length ? '1fr' : '1.5fr 1fr', gap: 16 }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ borderRadius: 16, height: 120, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--accent)', fontSize: '13.5px', fontWeight: 700 }}
                >
                  {pin(18, 'var(--accent)')}
                  {d.property.openInMaps}
                </a>
                {specs.nearby.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{d.property.nearby}</div>
                    {specs.nearby.map((n) => (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, background: 'var(--bg)' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>{nearbyIcon}</div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>{n}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: INQUIRY (sticky on desktop only — once pd-split collapses
            to a single column at ≤980, the sidebar sits below a long left
            column, so stickiness is unset via the `stacked` prop instead of
            fighting the box's own layout with an extra CSS pass) */}
        <InquiryBox code={code} typeLabel={property.typeLabel} socials={property.socials} wechatId={property.wechatId} callNumber={property.phone} stacked={w980} />
      </div>

      {/* RELATED — other published properties of the same type. Was three
          invented Rayong warehouses that all linked to a bare /property. */}
      {related.length > 0 && (
        <section style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 24px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ width: 26, height: 2, background: 'var(--pine)', borderRadius: 2 }} />
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{d.property.similar}</h2>
          </div>
          {/* Fixed three columns, not one per card: with a single similar
              property the grid used to give it the whole 1320px, and a card
              stretched that wide stops reading as a card at all. */}
          <div className="rs-cols-3" id="pd-related" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
            {related.map((r) => (
              <PropertyCard
                key={r.code}
                it={r}
                favFill={favs.has(r.code) ? 'var(--ink)' : 'none'}
                onToggleFav={() => favs.toggle(r.code)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
