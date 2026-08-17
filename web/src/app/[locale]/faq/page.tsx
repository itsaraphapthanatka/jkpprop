import type { Metadata } from 'next';
import { ContentHeader } from '@/components/site/ContentHeader';
import { ContentFooter } from '@/components/site/ContentFooter';
import { FaqBody } from '@/components/site/FaqBody';
import { CONTENT_CSS } from '@/components/site/contentCss';
import { DEFAULT_LOCALE, isLocale, LOCALES } from '@/i18n/config';
import { getFaqUi } from '@/i18n/faq';

/* The title and lead are content, so they follow the locale like the
   questions do. `alternates` tells crawlers the three versions are the
   same page in different languages rather than duplicates. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const ui = getFaqUi(l);
  return {
    title: ui.metaTitle,
    description: ui.heroLead,
    alternates: {
      canonical: `/${l}/faq`,
      languages: Object.fromEntries(LOCALES.map((x) => [x, `/${x}/faq`])),
    },
  };
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
  const { locale } = await params;
  const l = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return (
    <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: faqCss }} />
      <ContentHeader active="faq" />
      <FaqBody locale={l} />
      <ContentFooter />
    </div>
  );
}
