import type { Metadata } from 'next';
import { loadPageCopy, section } from '@/lib/server/sectionCopy';
import { loadCompany } from '@/lib/server/company';
import { listCmsPages } from '@/lib/server/cmsPages';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { ContentHeader } from '@/components/site/ContentHeader';
import { ContentFooter } from '@/components/site/ContentFooter';
import { ContactBody } from '@/components/site/ContactBody';
import { CONTENT_CSS } from '@/components/site/contentCss';
import { loadNavOrder } from '@/lib/server/navOrder';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const copy = await loadPageCopy('contact', locale).catch(() => ({}));
  const d = getDictionary(locale);
  return { title: `${section(copy, 'ch').headline || d.contact.hero} | JKP Property` };
}

/* Contact-specific responsive + hover rules ported from Contact.dc.html <style>.
   The pill/social style-hover attributes become .c-* helper classes here. */
const contactCss =
  CONTENT_CSS +
  `
input::placeholder,textarea::placeholder{color:var(--muted3);}
/* the form+map 2-col grid uses 1fr 1fr, but the form card's 2-col field
   grid gives it a wide min-content, so 1fr(=minmax(auto,1fr)) let it grow
   (~476px) and squeezed the map to ~224px on tablet/small-laptop widths.
   min-width:0 makes both columns honour their equal 1fr track. */
#info-form-grid > div{min-width:0;}
.c-phone:hover{background:var(--accent) !important;color:#fff !important;}
.c-email:hover{background:#04140C !important;color:var(--neon) !important;}
.c-social:hover{background:var(--neon) !important;color:#04140C !important;transform:translateY(-2px);}
.c-submit:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.28);}
/* keyboard users must be able to see where they are (the chips/toggles are buttons) */
#info-form-grid button:focus-visible,#info-form-grid input:focus-visible,#info-form-grid select:focus-visible,#info-form-grid textarea:focus-visible{outline:2px solid var(--deep);outline-offset:2px;}
@media (max-width:640px){
  #info-form-grid{grid-template-columns:1fr !important;}
  #hours-row{flex-direction:column;align-items:flex-start !important;gap:14px !important;}
  /* phone/email pills have a fixed 34px height and no overflow handling;
     the info-card text column is only ~150-200px wide on a phone, which
     is narrower than "atsokoproperty.sales@gmail.com" or a phone number
     plus its language suffix — clip gracefully instead of blowing out
     sideways or bleeding text past the pill's fixed height. */
  .c-phone,.c-email{max-width:100% !important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
}
`;

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = await loadPageCopy('contact', locale).catch(() => ({}));
  const company = await loadCompany(locale);
  const pages = await listCmsPages(locale).catch(() => []);
  const copy = { ch: section(c, 'ch'), cm: section(c, 'cm') };

  /* ลำดับเมนูที่ทีมจัดไว้ในหลังบ้าน (สไลด์ 5) */

  const navOrder = await loadNavOrder();


  return (
    <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: contactCss }} />
      <ContentHeader navOrder={navOrder} />
      <ContactBody company={company} copy={copy} />
      <ContentFooter email={company.generalEmail} phone={company.phones[0]?.number} location={company.shortLocation} socials={company.socials} pages={pages} />
    </div>
  );
}
