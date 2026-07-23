import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { ListingsProvider, ListingsActions, ListingsAdminBody } from '@/components/admin/ListingsAdminBody';

export const metadata: Metadata = { title: 'Listings · JKP CMS', robots: { index: false } };

/* Ported from AdminListings.dc.html — status tabs, filter bar, listings
   table with row selection + bulk bar and per-row action menus,
   pagination, plus an Export dropdown and a "สร้างประกาศ" create modal.
   Interactive body lives in ListingsAdminBody (client); the provider lets
   the topbar create button share the modal-open state. */

const pageCss = `
.lst-row:hover{background:var(--tint);}
.lst-menu-btn:hover{background:var(--border);}
.lst-exp-item:hover{background:var(--tint);}
`;

export default function AdminListingsPage() {
  return (
    <ListingsProvider>
      <AdminShell active="listings" eyebrow="Dashboard / ทรัพย์" title="Listings" actions={<ListingsActions />} css={pageCss}>
        <ListingsAdminBody />
      </AdminShell>
    </ListingsProvider>
  );
}
