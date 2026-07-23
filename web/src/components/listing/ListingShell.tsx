import { ListingHeader } from './ListingHeader';
import { ListingBody, type ListingPreset } from './ListingBody';
import { SiteFooter } from '@/components/home/SiteFooter';
import { Floating } from '@/components/home/Floating';

/* Listing-specific responsive rules ported from Listing.dc.html's
   <style> block. globals.css already handles the header nav / mobile
   menu button (1024px), the #listing-grid via [style*="repeat(3, 1fr)"]
   and the footer grid via [style*="1.4fr 1fr 1fr 1.4fr"]. The rules
   below cover the listing-body-only selectors that globals lacks.
   .share-opt:hover replaces the source style-hover on share options.
   Shared by /listing and all SEO/area preset pages via <ListingShell>. */
const listingCss = `
#mobile-filter-btn{display:none;}
@media (max-width:980px){
  #listing-grid{grid-template-columns:repeat(2,1fr) !important;}
  #listing-layout{grid-template-columns:1fr !important;}
  #filter-sidebar{display:none !important;}
  #mobile-filter-btn{display:flex !important;}
}
@media (max-width:640px){
  #listing-grid{grid-template-columns:1fr !important;}
  #toolbar-row{flex-direction:column;align-items:flex-start !important;}
  #sort-share-row{width:100%;justify-content:space-between !important;}
  #pagination-row{flex-wrap:wrap;}
}
.share-opt:hover{background:var(--tint);}
`;

/** Full Listing page chrome (black sheet + header + body + footer).
    Pass a `preset` to render an SEO/area page; omit it for /listing. */
export function ListingShell({ preset }: { preset?: ListingPreset }) {
  return (
    <div style={{ width: '100%', background: '#000000', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: listingCss }} />

      <div
        id="page-sheet"
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'var(--bg)',
          minHeight: '100vh',
        }}
      >
        <ListingHeader />
        <ListingBody preset={preset} />
      </div>

      {/* fixed footer + spacer (revealed under the page-sheet) */}
      <SiteFooter />

      {/* back-to-top + cookie/PDPA */}
      <Floating />
    </div>
  );
}
