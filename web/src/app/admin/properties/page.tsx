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
