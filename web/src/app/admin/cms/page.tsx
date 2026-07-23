import type { Metadata } from 'next';
import { CMSBody } from '@/components/admin/CMSBody';

export const metadata: Metadata = { title: 'CMS · JKP CMS', robots: { index: false } };

/* AdminCMS.dc.html is interactive (content-type tabs, article selection,
   language tabs, category dropdown, cover upload, internal links, preview
   modal, publish toast). The topbar Preview/Publish actions share state
   with the body, so CMSBody (client) owns all state and renders the shell. */

export default function AdminCMSPage() {
  return <CMSBody />;
}
