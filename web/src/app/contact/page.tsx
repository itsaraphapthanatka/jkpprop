import type { Metadata } from 'next';
import { ContentHeader } from '@/components/site/ContentHeader';
import { ContentFooter } from '@/components/site/ContentFooter';
import { ContactBody } from '@/components/site/ContactBody';
import { CONTENT_CSS } from '@/components/site/contentCss';

export const metadata: Metadata = { title: 'ติดต่อเรา | JKP Property' };

/* Contact-specific responsive + hover rules ported from Contact.dc.html <style>.
   The pill/social style-hover attributes become .c-* helper classes here. */
const contactCss =
  CONTENT_CSS +
  `
input::placeholder,textarea::placeholder{color:var(--muted3);}
.c-phone:hover{background:#034956 !important;color:#fff !important;}
.c-email:hover{background:#04140C !important;color:#2DFB91 !important;}
.c-social:hover{background:#2DFB91 !important;color:#04140C !important;transform:translateY(-2px);}
@media (max-width:640px){
  #info-form-grid{grid-template-columns:1fr !important;}
  #contact-form-fields{grid-template-columns:1fr !important;}
  #hours-row{flex-direction:column;align-items:flex-start !important;gap:14px !important;}
}
`;

export default function ContactPage() {
  return (
    <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: contactCss }} />
      <ContentHeader />
      <ContactBody />
      <ContentFooter email="atsokoproperty@gmail.com" phone="+66 80-830-4005" location="สมุทรปราการ, ประเทศไทย" />
    </div>
  );
}
