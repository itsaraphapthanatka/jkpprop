import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { PropertiesProvider, PropertiesActions, PropertiesBody } from '@/components/admin/PropertiesBody';

export const metadata: Metadata = { title: 'Properties · JKP CMS', robots: { index: false } };

/* Ported from AdminProperties.dc.html — summary strip, filter bar,
   properties table with row menus, pagination, and the new-property
   drawer. Interactive body lives in PropertiesBody (client); the
   provider lets the topbar "add" button share the drawer state. */

const pageCss = `
.prop-row:hover{background:var(--tint);}
.prop-menu-btn:hover{background:var(--border);}
@media (max-width:640px){
  #prop-actions{width:100%;flex-wrap:wrap;row-gap:8px;}
  #np-grid-main{grid-template-columns:1fr !important;}
  #np-grid-specs{grid-template-columns:1fr !important;}
  #np-grid-feat{grid-template-columns:1fr !important;}
}
@media (max-width:480px){
  #np-overlay{padding:16px !important;}
  #np-grid-media{grid-template-columns:repeat(2,1fr) !important;}
}
`;

export default function AdminPropertiesPage() {
  return (
    <PropertiesProvider>
      <AdminShell active="properties" eyebrow="Dashboard / ทรัพย์" title="Properties" actions={<PropertiesActions />} css={pageCss}>
        <PropertiesBody />
      </AdminShell>
    </PropertiesProvider>
  );
}
