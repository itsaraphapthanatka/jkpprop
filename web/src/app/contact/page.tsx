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
/* the form+map 2-col grid uses 1fr 1fr, but the form card's 2-col field
   grid gives it a wide min-content, so 1fr(=minmax(auto,1fr)) let it grow
   (~476px) and squeezed the map to ~224px on tablet/small-laptop widths.
   min-width:0 makes both columns honour their equal 1fr track. */
#info-form-grid > div{min-width:0;}
.c-phone:hover{background:#034956 !important;color:#fff !important;}
.c-email:hover{background:#04140C !important;color:#2DFB91 !important;}
.c-social:hover{background:#2DFB91 !important;color:#04140C !important;transform:translateY(-2px);}
.c-submit:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.28);}
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
