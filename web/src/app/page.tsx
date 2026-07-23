import { Header } from '@/components/home/Header';
import { Hero } from '@/components/home/Hero';
import { Featured } from '@/components/home/Featured';
import { LocationFinder } from '@/components/home/LocationFinder';
import { Steps } from '@/components/home/Steps';
import { WhyUs } from '@/components/home/WhyUs';
import { Certifications } from '@/components/home/Certifications';
import { TrustGallery } from '@/components/home/TrustGallery';
import { CtaBand } from '@/components/home/CtaBand';
import { SiteFooter } from '@/components/home/SiteFooter';
import { Floating } from '@/components/home/Floating';

export default function HomePage() {
  return (
    <div style={{ width: '100%', background: '#000000', position: 'relative' }}>
      <div
        id="page-sheet"
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'var(--bg)',
          borderBottomRightRadius: '72px',
          boxShadow: '0 50px 90px rgba(0,0,0,.4)',
        }}
      >
        <Header />
        <Hero />
        <Featured />
        <LocationFinder />
        <Steps />
        <WhyUs />
        <Certifications />
        <TrustGallery />
        <CtaBand />
      </div>

      {/* fixed footer + spacer (revealed under the rounded page-sheet) */}
      <SiteFooter />

      {/* back-to-top + cookie/PDPA */}
      <Floating />
    </div>
  );
}
