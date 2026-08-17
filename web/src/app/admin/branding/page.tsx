import type { Metadata } from 'next';
import { AdminShell, AdminBreadcrumb } from '@/components/admin/AdminShell';
import { BrandingProvider, BrandingHeaderActions, BrandingBody } from '@/components/admin/BrandingBody';

export const metadata: Metadata = { title: 'Branding · JKP CMS', robots: { index: false } };

/* Ported from AdminBranding.dc.html — interactive multi-tenant theme
   editor with a live preview. Theme state is shared between the topbar
   "รีเซ็ต" action and the body via BrandingProvider (client context)
   wrapping AdminShell. */

const brandCss = `
/* watermark editor: controls beside preview on desktop, stacked on narrow */
@media (max-width:900px){ #wm-split{grid-template-columns:1fr !important;} }

@media (max-width:1100px){ #brand-split{grid-template-columns:1fr !important;} #brand-preview{position:static !important;} }
@media (max-width:640px){ #brand-actions{flex-wrap:wrap !important;width:100% !important;row-gap:8px !important;} }
`;

export default function AdminBrandingPage() {
  return (
    <BrandingProvider>
      <AdminShell
        active="cms"
        eyebrow={<AdminBreadcrumb items={[{ label: 'Settings', href: '/admin/settings' }, { label: 'Branding' }]} />}
        title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>Branding &amp; Theme <span style={{ height: 22, padding: '0 10px', borderRadius: 9999, background: '#EEF4F3', color: '#034956', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#034956" strokeWidth="2.4"><path d="M12 2l2 5 5 .5-4 3.5 1 5-4-2.5-4 2.5 1-5-4-3.5 5-.5z" /></svg>Multi-tenant</span></span>}
        actions={<BrandingHeaderActions />}
        css={brandCss}
      >
        <BrandingBody />
      </AdminShell>
    </BrandingProvider>
  );
}
