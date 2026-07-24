import type { Metadata } from 'next';
import { ClientShortlistBody } from '@/components/site/ClientShortlistBody';

export const metadata: Metadata = { title: 'รายการทรัพย์ที่คัดให้ | JKP Property', robots: { index: false } };

/* ClientShortlist-specific responsive rules ported from
   ClientShortlist.dc.html <style>. This is a standalone shareable
   page — its own broker top bar, no site header/footer. */
const csCss = `
@media (max-width:760px){
  #cs-item{grid-template-columns:1fr !important;}
  #cs-brandrow{flex-direction:column;align-items:flex-start !important;gap:16px !important;}
}
@media (max-width:380px){
  /* the "การ์ด / ตารางเปรียบเทียบ" segmented control sits right at the
     edge of a 320-360px viewport's usable width; shrink its padding and
     type a touch so it never has to wrap or clip on the smallest phones. */
  #cs-view-toggle{gap:2px !important;}
  #cs-view-toggle > div{padding:0 10px !important;font-size:11.5px !important;gap:4px !important;}
}
`;

export default function ClientShortlistPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: csCss }} />
      <ClientShortlistBody />
    </>
  );
}
