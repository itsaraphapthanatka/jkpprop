'use client';
import Link from '@/i18n/LocaleLink';
import Image from 'next/image';
import { useDict } from '@/i18n/useDict';
import { SocialLinks } from './SocialLinks';
import type { Social } from '@/lib/server/company';

/* ============================================================
   Shared in-flow footer for the content pages (About / FAQ /
   Contact). Ported verbatim from the identical <footer> in those
   .dc.html files — same markup as Home's footer but positioned
   in normal flow (rounded TOP corners) instead of fixed. Contact
   details are props (About/FAQ use the generic set; Contact
   overrides with its own). style-hover → onMouseEnter/Leave.
   ============================================================ */

export interface ContentFooterProps {
  email: string;
  phone?: string;
  location: string;
  /** channels with a link — an empty list renders no icons */
  socials?: Social[];
  /** published CMS documents, so the footer links only to pages that exist */
  pages?: { slug: string; title: string }[];
}

const socialBase: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  background: 'rgba(255,255,255,.07)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#C9C5BD',
  transition: 'all .2s',
};

/* The defaults here used to be `info@thaiindustrialproperty.com` and
   `+66 90-000-0000` — a domain the company does not own and a number that does
   not ring. Only the Contact page passed real values, so About and FAQ served
   those to every visitor. Callers must supply them now; the details come from
   /admin/company. */
export function ContentFooter({ email, phone, location, socials = [], pages = [] }: ContentFooterProps) {
  const d = useDict();
  const place = location ?? d.common.address;
  const contactEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.boxShadow = '0 10px 26px rgba(var(--neon-rgb),.45)';
  };
  const contactLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <footer style={{ background: '#000000', color: '#C9C5BD', borderTopLeftRadius: '34px', borderTopRightRadius: '34px' }}>
      <div className="rs-footer-cols" style={{ maxWidth: '1200px', margin: '0 auto', padding: '96px 24px 52px', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.4fr', gap: 48 }}>
        <div>
          <Image width={226} height={100} src="/assets/jkp-logo-white.png" alt="JKP Property" style={{ height: 46, width: 'auto', display: 'block' }} />
          <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.7, color: '#8E8B84', maxWidth: 280 }}>
            {d.footer.tagline}
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <SocialLinks socials={socials} iconStyle={socialBase} stroke="currentColor" />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>{d.footer.properties}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
            <Link href="/factory-rent" style={{ color: '#C9C5BD' }}>{d.nav.factoryRent}</Link>
            <Link href="/warehouse-rent" style={{ color: '#C9C5BD' }}>{d.nav.warehouseRent}</Link>
            <Link href="/factory-sale" style={{ color: '#C9C5BD' }}>{d.nav.factorySale}</Link>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>{d.footer.company}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 14 }}>
            <Link href="/about" style={{ color: '#C9C5BD' }}>{d.nav.about}</Link>
            <Link href="/faq" style={{ color: '#C9C5BD' }}>{d.nav.faq}</Link>
            <Link href="/contact" style={{ color: '#C9C5BD' }}>{d.nav.contact}</Link>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 16 }}>{d.footer.contact}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#8E8B84' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              <svg style={{ flexShrink: 0, marginTop: 2 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2">
                <path d="M22 6l-10 7L2 6" />
                <rect x="2" y="4" width="20" height="16" rx="2" />
              </svg>
              {email}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              <svg style={{ flexShrink: 0, marginTop: 2 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2">
                <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" />
              </svg>
              {phone}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              <svg style={{ flexShrink: 0, marginTop: 2 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {place}
            </div>
          </div>
          <Link
            href="/contact"
            onMouseEnter={contactEnter}
            onMouseLeave={contactLeave}
            style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 22px', borderRadius: 9999, background: 'var(--neon)', color: '#04140C', fontSize: 14, fontWeight: 800, transition: 'box-shadow .2s' }}
          >
            {d.nav.contact}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '26px 24px', display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8E8B84' }}>
          <div>{d.footer.rights}</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {/* linked only when the document exists — these were href="#",
                which is worse than absent for a privacy policy */}
            {pages.map((pg) => (
              <Link key={pg.slug} href={`/p/${pg.slug}`} style={{ color: '#8E8B84' }}>{pg.title}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
