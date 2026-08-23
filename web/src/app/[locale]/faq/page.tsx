import type { Metadata } from 'next';
import { loadFaq } from '@/lib/server/faqCopy';
import { loadPageCopy, section } from '@/lib/server/sectionCopy';
import { htmlToText } from '@/lib/sanitizeHtml';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { loadCompany } from '@/lib/server/company';
import { listCmsPages } from '@/lib/server/cmsPages';
import { getDictionary } from '@/i18n/dictionaries';
import { ContentHeader } from '@/components/site/ContentHeader';
import { ContentFooter } from '@/components/site/ContentFooter';
import { FaqBody } from '@/components/site/FaqBody';
import { CONTENT_CSS } from '@/components/site/contentCss';
import { loadNavOrder } from '@/lib/server/navOrder';

/* Title in the reader's language: this page shipped a hard-coded Thai one to
   every locale, including in search results. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return { title: `${getDictionary(locale).titles.faq} | JKP Property` };
}



/* FAQ-specific responsive rules ported from FAQ.dc.html <style>. */
const faqCss =
  CONTENT_CSS +
  `
@media (max-width:980px){
  #faq-layout{grid-template-columns:1fr !important;}
  #faq-sidebar{display:none !important;}
  /* the desktop sidebar (which holds search + category quick-jump) is
     hidden on tablet/phone, so reveal the mobile-only search + category
     chip bar rendered at the top of the content column instead. */
  #faq-mobilebar{display:flex !important;}
}
`;

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const company = await loadCompany(locale);
  const pages = await listCmsPages(locale).catch(() => []);
  const cats = await loadFaq(locale).catch(() => []);
  const c = await loadPageCopy('faq', locale).catch(() => ({}));

  /* FAQPage structured data.
   *
   * The answers are on the page now, but a crawler still has to work out which
   * text answers which question. This states it outright, which is what Google
   * reads for FAQ rich results and what the AI crawlers quote from.
   *
   * Plain text, not markup: schema.org allows a little HTML here, but the
   * subset differs from ours and a tag Google rejects invalidates the whole
   * block. `<` is escaped so nothing can close the script tag early. */
  const qa = cats.flatMap((c) => c.qs);
  const faqSchema = qa.length
    ? JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: qa.map(([question, answer]) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: htmlToText(answer) },
      })),
    }).replace(/</g, '\\u003c')
    : null;

  /* ลำดับเมนูที่ทีมจัดไว้ในหลังบ้าน (สไลด์ 5) */

  const navOrder = await loadNavOrder();


  return (
    <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: faqCss }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />
      )}
      <ContentHeader active="faq" navOrder={navOrder} />
      <FaqBody cats={cats} copy={section(c, 'fh')} />
      <ContentFooter email={company.generalEmail} phone={company.phones[0]?.number} location={company.shortLocation} socials={company.socials} pages={pages} />
    </div>
  );
}
