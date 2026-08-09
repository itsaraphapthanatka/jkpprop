import { PropertyHeader } from '@/components/property/PropertyHeader';
import { PropertyDetail } from '@/components/property/PropertyDetail';
import { SiteFooter } from '@/components/home/SiteFooter';
import { Floating } from '@/components/home/Floating';

export default function PropertyPage() {
  return (
    <div style={{ width: '100%', background: '#000000', position: 'relative' }}>
      <div
        id="page-sheet"
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'var(--bg)',
          minHeight: '100vh',
          boxShadow: '0 50px 90px rgba(0,0,0,.4)',
        }}
      >
        <PropertyHeader />
        <PropertyDetail />
      </div>

      {/* fixed footer + spacer (revealed under the page-sheet) */}
      <SiteFooter />

      {/* back-to-top + cookie/PDPA */}
      <Floating />
    </div>
  );
}
