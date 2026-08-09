import type { Metadata } from 'next';
import { ContentHeader } from '@/components/site/ContentHeader';
import { ContentFooter } from '@/components/site/ContentFooter';
import { AboutBody } from '@/components/site/AboutBody';
import { CONTENT_CSS } from '@/components/site/contentCss';

export const metadata: Metadata = { title: 'เกี่ยวกับเรา | JKP Property' };

/* About-specific responsive rules ported from About.dc.html <style>.
   #about-pillars is forced to 3 columns to override the globals.css
   repeat(3,1fr) collapse (the source keeps the pillars 3-up at all widths). */
const aboutCss =
  CONTENT_CSS +
  `
#about-pillars{grid-template-columns:repeat(3,1fr) !important;}
@media (max-width:980px){
  #story-grid{grid-template-columns:1fr !important;}
  #team-grid{grid-template-columns:1fr !important;}
  #award-grid{grid-template-columns:1fr !important;}
}
@media (max-width:640px){
  #stats-row{flex-wrap:wrap;gap:20px !important;}
  #logo-row{gap:20px !important;}
  /* the unconditional 3-up rule above leaves ~43-70px per column on a
     320-390px phone once the 44px card padding + 28px gaps are taken
     out — too narrow for the pillar copy, so collapse to 1 column here. */
  #about-pillars{grid-template-columns:1fr !important;}
}
`;

export default function AboutPage() {
  return (
    <div style={{ width: '100%', background: 'var(--bg)', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: aboutCss }} />
      <ContentHeader active="about" />
      <AboutBody />
      <ContentFooter />
    </div>
  );
}
