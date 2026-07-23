import type { Metadata } from 'next';
import { UsersBody } from '@/components/admin/UsersBody';

export const metadata: Metadata = { title: 'Users · JKP CMS', robots: { index: false } };

/* AdminUsers.dc.html — Users & Roles. Interactive (view toggle + invite
   modal live in the topbar and share client state), so the whole shell is
   rendered inside the client component <UsersBody>. */

export default function AdminUsersPage() {
  return <UsersBody />;
}
