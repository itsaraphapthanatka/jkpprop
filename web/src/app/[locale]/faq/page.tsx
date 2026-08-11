import type { Metadata } from 'next';
import { loadFaq } from '@/lib/server/faqCopy';
import { loadPageCopy, section } from '@/lib/server/sectionCopy';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { ContentHeader } from '@/components/site/ContentHeader';
import { ContentFooter } from '@/components/site/ContentFooter';
import { FaqBody } from '@/components/site/FaqBody';
import { CONTENT_CSS } from '@/components/site/contentCss';

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
  const cats = await loadFaq(locale).catch(() => []);
  const c = await loadPageCopy('faq', locale).catch(() => ({}));

  return (
    <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: faqCss }} />
      <ContentHeader active="faq" />
      <FaqBody cats={cats} copy={section(c, 'fh')} />
      <ContentFooter />
    </div>
  );
}
