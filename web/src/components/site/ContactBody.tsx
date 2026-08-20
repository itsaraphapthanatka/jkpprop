'use client';

import { RequirementForm } from './RequirementForm';
import Link from '@/i18n/LocaleLink';
import { useDict } from '@/i18n/useDict';
import { parseGeoPoint, mapEmbedUrl, mapLinkUrl } from '@/lib/geoPoint';
import type { SectionCopy } from '@/lib/server/sectionCopy';
import { telHref, type Company } from '@/lib/server/company';
import { SocialLinks } from './SocialLinks';
import { useConsent } from '@/lib/consent';

/* ============================================================
   Ported verbatim from Contact.dc.html — hero, info cards
   (location / phones / emails / hours + socials), and the
   message form + map card. Form state mirrors the logic class;
   submit shows "ส่งข้อความแล้ว ✓" then resets after 2.2s.
   Pill / social hovers use the .c-* helpers in the page <style>.
   ============================================================ */

const infoCard: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '26px 28px', display: 'flex', gap: 20, alignItems: 'flex-start' };
const iconCircle = (bg: string): React.CSSProperties => ({ flexShrink: 0, width: 48, height: 48, borderRadius: 9999, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .2s,box-shadow .2s' });
const phonePill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--text)', fontSize: 13, fontWeight: 600, transition: 'background .2s,color .2s' };
const emailPill: React.CSSProperties = { marginTop: 8, display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: 13, fontWeight: 600, transition: 'background .2s,color .2s' };
const iconHover = (shadow: string) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'scale(1.08)';
    e.currentTarget.style.boxShadow = shadow;
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'none';
    e.currentTarget.style.boxShadow = 'none';
  },
});

export type ContactCopy = { ch: SectionCopy; cm: SectionCopy };

export function ContactBody({ copy, company }: { copy: ContactCopy; company: Company }) {
  const d = useDict();
  const consent = useConsent();
  const pick = (v: string, fallback: string) => v || fallback;
  const point = parseGeoPoint(copy.cm.map);
  return (
    <>
      {/* HERO */}
      <section style={{ position: 'relative', height: '220px' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderBottomRightRadius: '72px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={copy.ch.img || "https://images.unsplash.com/photo-1536599424071-0b215a388ba7?w=1600&q=80"} alt={pick(copy.ch.headline, d.contact.hero)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(var(--ink2-rgb),.82) 0%,rgba(var(--ink2-rgb),.5) 55%,rgba(var(--ink2-rgb),.28) 100%)', pointerEvents: 'none', borderBottomRightRadius: '72px' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1320px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>{pick(copy.ch.headline, d.contact.hero)}</h1>
          <p style={{ margin: '10px 0 0', fontSize: '14.5px', color: '#E8FFF0', maxWidth: '520px' }}>{pick(copy.ch.sub, d.contact.sub)}</p>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted2)' }}>
        <Link href="/" style={{ color: 'var(--muted2)' }}>{d.common.home}</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{d.contact.breadcrumb}</span>
      </div>

      {/* INFO CARDS */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* location */}
        <div style={infoCard}>
          <div style={iconCircle('var(--pine)')} {...iconHover('0 8px 18px rgba(var(--pine-rgb),.4)')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{pick(copy.cm.headline, d.contact.ourLocation)}</div>
            <div style={{ marginTop: 10, fontSize: '14.5px', fontWeight: 700, color: 'var(--text)' }}>{company.legalName}</div>
            <div style={{ marginTop: 4, fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.7 }}>{pick(copy.cm.sub, company.address)}</div>
          </div>
        </div>

        {/* phones */}
        <div style={infoCard}>
          <div style={iconCircle('var(--pine)')} {...iconHover('0 8px 18px rgba(var(--pine-rgb),.4)')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{d.contact.ourPhone}</div>
            <div style={{ marginTop: 14, fontSize: '12.5px', fontWeight: 700, color: 'var(--muted2)' }}>{d.contact.salesEnquiry}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {company.phones.map((ph) => (
                <a key={ph.number} className="c-phone" href={telHref(ph.number)} style={phonePill}>
                  {ph.number}
                  {ph.label && <span style={{ color: 'var(--muted2)', marginLeft: 5 }}>({ph.label})</span>}
                </a>
              ))}
            </div>
            <div style={{ marginTop: 16, fontSize: '12.5px', fontWeight: 700, color: 'var(--muted2)' }}>{d.contact.generalEnquiry}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {company.phones.map((ph) => (
                <a key={ph.number} className="c-phone" href={telHref(ph.number)} style={phonePill}>
                  {ph.number}
                  {ph.label && <span style={{ color: 'var(--muted2)', marginLeft: 5 }}>({ph.label})</span>}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* emails */}
        <div style={infoCard}>
          <div style={iconCircle('var(--pine)')} {...iconHover('0 8px 18px rgba(var(--pine-rgb),.4)')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2"><path d="M22 6l-10 7L2 6" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{d.contact.reachUs}</div>
            <div style={{ marginTop: 14, fontSize: '12.5px', fontWeight: 700, color: 'var(--muted2)' }}>{d.contact.salesEnquiry}</div>
            <a className="c-email" href={`mailto:${company.salesEmail}`} style={emailPill}>{company.salesEmail}</a>
            <div style={{ marginTop: 16, fontSize: '12.5px', fontWeight: 700, color: 'var(--muted2)' }}>{d.contact.generalEnquiry}</div>
            <a className="c-email" href={`mailto:${company.generalEmail}`} style={emailPill}>{company.generalEmail}</a>
          </div>
        </div>

        {/* hours + socials */}
        <div id="hours-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, padding: '6px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{d.contact.hours}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 14px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--muted)' }}>{company.hoursDays} <span style={{ fontWeight: 700, color: 'var(--text)', marginLeft: 5 }}>{company.hoursValue}</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--muted2)' }}>{d.contact.contactAt}</span>
            <SocialLinks
              socials={company.socials}
              iconStyle={{ width: 38, height: 38, borderRadius: 11, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon)' }}
            />
          </div>
        </div>
      </div>

      {/* FORM + MAP */}
      {/* จุดยึดสำหรับลิงก์ที่เซลล์ส่งให้ลูกค้ากรอก — เปิดมาแล้วเจอฟอร์มเลย
          ไม่ต้องเลื่อนหาเอง */}
      <div id="info-form-grid" style={{ maxWidth: '1320px', margin: '0 auto', padding: '12px 24px 90px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
        <div id="lead-form" style={{ scrollMarginTop: 90, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '26px 28px' }}>
          <RequirementForm />
        </div>
        {/* the switch in /admin/sections was drawn for this block but never
            read — turning it off left the map on the page */}
        {copy.cm.enabled && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px 0', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{pick(copy.cm.headline, d.contact.ourLocation)}</div>
          <div style={{ flex: 1, margin: '16px 0 0', minHeight: 280, position: 'relative' }}>
            {/* A photograph of a map used to sit here — decorative, and no help
                to anyone trying to find the office. The pin comes from the CMS
                as a coordinate, and the URL is rebuilt from the parsed numbers
                so nothing typed there reaches the iframe. */}
            {point && !consent.allows('embeds') ? (
              /* A frame from Google is a request to Google carrying the
                 reader's address, whether or not they wanted the map. So the
                 map is a picture of a button until they say yes — and the
                 link below still opens Google Maps in a new tab, which is
                 their own click and their own choice. */
              <div style={{ height: '100%', minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 24, background: 'var(--bg2)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{d.consent.mapBlocked}</div>
                <p style={{ margin: 0, maxWidth: 380, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>{d.consent.mapBlockedBody}</p>
                <button
                  id="map-allow"
                  onClick={() => consent.save(true)}
                  style={{ height: 42, padding: '0 20px', border: 0, borderRadius: 10, background: 'var(--accent)', color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  {d.consent.mapAllow}
                </button>
                <a href={mapLinkUrl(point)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                  {d.contact.openInMaps}
                </a>
              </div>
            ) : point ? (
              <>
                <iframe
                  src={mapEmbedUrl(point)}
                  title={pick(copy.cm.headline, d.contact.ourLocation)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ width: '100%', height: '100%', minHeight: 280, border: 0, display: 'block' }}
                />
                <a
                  href={mapLinkUrl(point)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ position: 'absolute', right: 14, bottom: 14, display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: '0 14px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 14px rgba(0,0,0,.14)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  {d.contact.openInMaps}
                </a>
              </>
            ) : (
              <div style={{ height: '100%', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, background: 'var(--bg2)', color: 'var(--muted2)', fontSize: 13, lineHeight: 1.7 }}>
                {d.contact.mapMissing}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </>
  );
}
