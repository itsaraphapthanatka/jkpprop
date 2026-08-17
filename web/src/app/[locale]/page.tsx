import { Header } from '@/components/home/Header';
import { Hero } from '@/components/home/Hero';
import { Featured } from '@/components/home/Featured';
import { LocationFinder } from '@/components/home/LocationFinder';
import { Steps } from '@/components/home/Steps';
import { WhyUs } from '@/components/home/WhyUs';
import { siteStats } from '@/lib/server/siteStats';
import { Certifications } from '@/components/home/Certifications';
import { TrustGallery } from '@/components/home/TrustGallery';
import { CtaBand } from '@/components/home/CtaBand';
import { SiteFooter } from '@/components/home/SiteFooter';
import { Floating } from '@/components/home/Floating';
import { loadPublicListings } from '@/lib/server/publicListings';
import { loadPageCopy, section } from '@/lib/server/sectionCopy';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { loadCompany } from '@/lib/server/company';
import { listCmsPages } from '@/lib/server/cmsPages';
import { sameProvince } from '@/i18n/places';

/* Which provinces each location tab covers. The tab used to print a fixed
   "640+ / 820+ / 1,150+ รายการ" — inventory the catalogue never had. */
const AREA_PROVINCES = {
  air: ['สมุทรปราการ', 'กรุงเทพมหานคร'],
  port: ['ชลบุรี', 'ระยอง', 'สมุทรสาคร'],
  bkk: ['กรุงเทพมหานคร', 'นนทบุรี'],
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
  const company = await loadCompany(locale);
  const pages = await listCmsPages(locale).catch(() => []);
  const featured = await loadPublicListings({ locale, limit: 6 }).catch(() => []);
  const live = await siteStats();
  const stats = { published: live.published, provinces: live.provinces, lastUpdated: statDate(live.lastUpdated, locale) };
  const c = await loadPageCopy('home', locale).catch(() => ({}));

  /* นับจากของจริงทั้งหมด ไม่ใช่ 60 รายการแรก — ตอนนำเข้าทรัพย์จริง 393 รายการ
     ตัวเลขต่อทำเลบนหน้าแรกกลายเป็นการนับจากกองที่ถูกตัดมาแล้ว */
  const all = await loadPublicListings({ locale, limit: 500 }).catch(() => []);
  const counts = Object.fromEntries(
    Object.entries(AREA_PROVINCES).map(([key, provinces]) => [
      key,
      all.filter((it) => provinces.some((p) => sameProvince(it.province, p))).length,
    ]),
  ) as Record<keyof typeof AREA_PROVINCES, number>;

  /* how many published properties stand in each province, for the card that
     appears when the cursor is on a pin — a real number, counted here, rather
     than a figure written into the design */
  const provinceCounts: Record<string, number> = {};
  for (const it of all) provinceCounts[it.province] = (provinceCounts[it.province] ?? 0) + 1;

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
        {section(c, 'l').enabled && <LocationFinder counts={counts} provinceCounts={provinceCounts} copy={section(c, 'l')} />}
        {section(c, 's').enabled && <Steps copy={section(c, 's')} />}
        {section(c, 'w').enabled && <WhyUs copy={section(c, 'w')} kpi={section(c, 'wk')} stats={stats} />}
        <Certifications copy={section(c, 'ct')} />
        <TrustGallery copy={section(c, 'tg')} />
        {section(c, 'c').enabled && <CtaBand copy={section(c, 'c')} company={company} />}
      </div>

      {/* fixed footer + spacer (revealed under the rounded page-sheet) */}
      <SiteFooter company={company} pages={pages} />

      {/* back-to-top + cookie/PDPA */}
      <Floating />
    </div>
  );
}

/* the date a visitor can verify against the newest card on the page */
const statDate = (d: Date | null, locale: string) =>
  d ? new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : locale === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(d) : null;
