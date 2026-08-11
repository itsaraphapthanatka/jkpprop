import { Header } from '@/components/home/Header';
import { Hero } from '@/components/home/Hero';
import { Featured } from '@/components/home/Featured';
import { LocationFinder } from '@/components/home/LocationFinder';
import { Steps } from '@/components/home/Steps';
import { WhyUs } from '@/components/home/WhyUs';
import { Certifications } from '@/components/home/Certifications';
import { TrustGallery } from '@/components/home/TrustGallery';
import { CtaBand } from '@/components/home/CtaBand';
import { SiteFooter } from '@/components/home/SiteFooter';
import { Floating } from '@/components/home/Floating';
import { loadPublicListings } from '@/lib/server/publicListings';
import { loadPageCopy, section } from '@/lib/server/sectionCopy';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';

/* Which provinces each location tab covers. The tab used to print a fixed
   "640+ / 820+ / 1,150+ รายการ" — inventory the catalogue never had. */
const AREA_PROVINCES = {
  air: ['สมุทรปราการ', 'กรุงเทพ'],
  port: ['ชลบุรี', 'ระยอง', 'สมุทรสาคร'],
  bkk: ['กรุงเทพ', 'นนทบุรี'],
  eec: ['ชลบุรี', 'ระยอง', 'ฉะเชิงเทรา'],
} as const;

/* Home-page-specific responsive rules — the ported design tool only ever
   rendered at a fixed desktop width, so these gaps (narrow-phone popup
   fit, a mismatched 2-col->1-col inset, and a floating-button collision)
   were never addressed by the source. Header/nav collapse, the hero/
   location/why-us 2-col grids, the footer 1.4fr grid and the cta-band
   1-col collapse are already handled by attribute-selector rules in
   globals.css; this only covers what those generic rules can't reach
   (id-targeted elements specific to this page). */
const homeCss = `
@media (max-width:640px){
  #hero-feature-grid{grid-template-columns:1fr !important;}
  #cta-photo-box{inset:22px !important;}
  #back-to-top-btn.fab-raised{bottom:230px !important;}
  #cta-band-left h2{font-size:27px !important;}
}
@media (max-width:380px){
  #hero-search-bar{padding:8px !important;}
  #hero-search-textwrap{padding:0 8px !important;}
  #hero-search-textwrap span{font-size:13px !important;}
  #hero-search-btn{padding:0 18px !important;}
}
`;

/* Read the featured inventory here rather than fetching it after hydration:
   the carousel is above the fold and is the page's main indexable content. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const featured = await loadPublicListings({ locale, limit: 6 }).catch(() => []);
  const c = await loadPageCopy('home', locale).catch(() => ({}));

  const all = await loadPublicListings({ locale, limit: 60 }).catch(() => []);
  const counts = Object.fromEntries(
    Object.entries(AREA_PROVINCES).map(([key, provinces]) => [
      key,
      all.filter((it) => provinces.some((p) => it.province.includes(p))).length,
    ]),
  ) as Record<keyof typeof AREA_PROVINCES, number>;

  return (
    <div style={{ width: '100%', background: '#000000', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: homeCss }} />
      <div
        id="page-sheet"
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'var(--bg)',
          borderBottomRightRadius: '72px',
          boxShadow: '0 50px 90px rgba(0,0,0,.4)',
        }}
      >
        <Header />
        {/* The hero has no switch — a page whose masthead can be turned off
            has no top. Every other block obeys the toggle in /admin/sections,
            and the ones with nothing to show hide themselves. */}
        <Hero copy={section(c, 'h')} />
        {section(c, 'n').enabled && <Featured items={featured} copy={section(c, 'n')} />}
        {section(c, 'l').enabled && <LocationFinder counts={counts} copy={section(c, 'l')} />}
        {section(c, 's').enabled && <Steps copy={section(c, 's')} />}
        {section(c, 'w').enabled && <WhyUs copy={section(c, 'w')} kpi={section(c, 'wk')} />}
        <Certifications copy={section(c, 'ct')} />
        <TrustGallery copy={section(c, 'tg')} />
        {section(c, 'c').enabled && <CtaBand copy={section(c, 'c')} />}
      </div>

      {/* fixed footer + spacer (revealed under the rounded page-sheet) */}
      <SiteFooter />

      {/* back-to-top + cookie/PDPA */}
      <Floating />
    </div>
  );
}
