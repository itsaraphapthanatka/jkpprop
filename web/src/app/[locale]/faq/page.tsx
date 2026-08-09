import type { Metadata } from 'next';
import { ContentHeader } from '@/components/site/ContentHeader';
import { ContentFooter } from '@/components/site/ContentFooter';
import { FaqBody } from '@/components/site/FaqBody';
import { CONTENT_CSS } from '@/components/site/contentCss';

export const metadata: Metadata = { title: 'คำถามที่พบบ่อย | JKP Property' };

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

export default function FaqPage() {
  return (
    <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: faqCss }} />
      <ContentHeader active="faq" />
      <FaqBody />
      <ContentFooter />
    </div>
  );
}
