import { ListingHeader } from './ListingHeader';
import { ListingBody, type ListingPreset, type ListingFilterKey } from './ListingBody';
import { SiteFooter } from '@/components/home/SiteFooter';
import { loadCompany } from '@/lib/server/company';
import { listCmsPages } from '@/lib/server/cmsPages';
import { Floating } from '@/components/home/Floating';
import { loadPublicListings } from '@/lib/server/publicListings';
import { headers } from 'next/headers';
import { isLocale, DEFAULT_LOCALE } from '@/i18n/config';

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
  #page-sheet{padding-bottom:48px !important;}
  /* the sort trigger sits mid-row (not flush to an edge) once
     #sort-share-row goes full-width + space-between, so its 220px
     dropdown panel (anchored left:0 on the trigger) can run past the
     right edge of a 320-390px phone. Anchor it to the trigger's own
     right edge instead (mirrors the share panel, which already
     anchors right:0) and cap the width so it never exceeds the
     viewport on the very narrowest phones. */
  #sort-dd-panel{left:auto !important;right:0 !important;width:min(220px, calc(100vw - 48px)) !important;}
}
.share-opt:hover{background:var(--tint);}
`;

/* preset filter key → the query that produces it */
const PRESET_QUERY: Record<ListingFilterKey, { deal: string; type: string }> = {
  'factory-rent': { deal: 'rent', type: 'factory' },
  'factory-sale': { deal: 'sale', type: 'factory' },
  'warehouse-rent': { deal: 'rent', type: 'warehouse' },
  'warehouse-sale': { deal: 'sale', type: 'warehouse' },
};

/** Full Listing page chrome (black sheet + header + body + footer).
    Pass a `preset` to render an SEO/area page; omit it for /listing.

    The inventory is queried here, on the server, so the page ships real
    markup instead of hydrating over a placeholder set. */
export async function ListingShell({ preset }: { preset?: ListingPreset }) {
  /* the locale arrives as the header middleware sets — this shell is shared by
     twelve pages and reading it here keeps them from each threading it down */
  const raw = (await headers()).get('x-locale') ?? '';
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  /* every listing and landing page renders through here, so the footer
     details come from the one place they are edited */
  const company = await loadCompany(locale);
  const pages = await listCmsPages(locale).catch(() => []);
  const q = preset?.filterKey ? PRESET_QUERY[preset.filterKey] : {};
  const items = await loadPublicListings({ locale, ...q, province: preset?.province, limit: 60 }).catch(() => []);

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
          // light breathing room between the pagination and the (dark, fixed)
          // footer revealed below — as page-sheet padding (not the pagination's
          // own margin, which margin-collapses out of the sheet into the black gap).
          paddingBottom: 80,
        }}
      >
        <ListingHeader />
        <ListingBody preset={preset} items={items} />
      </div>

      {/* fixed footer + spacer (revealed under the page-sheet) */}
      <SiteFooter company={company} pages={pages} />

      {/* back-to-top + cookie/PDPA */}
      <Floating />
    </div>
  );
}
