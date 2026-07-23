import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { VisitActions, VisitBody } from '@/components/admin/VisitBody';

export const metadata: Metadata = { title: 'Visits · JKP CMS', robots: { index: false } };

/* Ported from AdminVisit.dc.html — visit-plan detail (VP-064). Interactive,
   so the <main> content and the stateful topbar right cluster live in the
   client component VisitBody.tsx. */

const visitCss = `
@media (max-width:1100px){ #visit-split{grid-template-columns:1fr !important;} }
`;

/* Topbar eyebrow (breadcrumb) + title (with a status code badge) contain rich
   markup; AdminShell types them as string, so cast the nodes through unknown. */
const eyebrowNode = (
  <><a href="/admin/shortlists" style={{ color: 'var(--muted2)' }}>SL-208</a> / Visit Plan</>
);

const titleNode = (
  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    VP-064 <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 700, color: '#034956', background: '#EEF4F3', padding: '2px 8px', borderRadius: 6 }}>confirming</code>
  </span>
);

export default function AdminVisitsPage() {
  return (
    <AdminShell
      active="visits"
      eyebrow={eyebrowNode as unknown as string}
      title={titleNode as unknown as string}
      actions={<VisitActions />}
      css={visitCss}
    >
      <VisitBody />
    </AdminShell>
  );
}
