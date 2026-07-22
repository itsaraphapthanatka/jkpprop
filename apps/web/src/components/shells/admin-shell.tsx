import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * AdminShell — dark sidebar (248px) + sticky topbar + scrolling main.
 * Single language (Thai) in v1; i18n-wired copy lands in the admin phase.
 * Dark-ready: set data-theme="dark" on <html> (admin root layout) to opt the
 * whole tree into the dark token set (D5).
 */
const NAV_GROUPS: { title: string; items: { href: string; label: string }[] }[] = [
  {
    title: 'งานขาย',
    items: [
      { href: '/admin', label: 'แดชบอร์ด' },
      { href: '/admin/leads', label: 'Leads' },
      { href: '/admin/shortlists', label: 'Shortlists' },
      { href: '/admin/visits', label: 'การเข้าชม' },
      { href: '/admin/deals', label: 'ดีล' },
    ],
  },
  {
    title: 'ทรัพย์',
    items: [
      { href: '/admin/properties', label: 'ทรัพย์' },
      { href: '/admin/listings', label: 'ประกาศ' },
      { href: '/admin/media', label: 'สื่อ/รูปภาพ' },
    ],
  },
  {
    title: 'เนื้อหา & ระบบ',
    items: [
      { href: '/admin/pages', label: 'CMS' },
      { href: '/admin/seo', label: 'SEO/GEO' },
      { href: '/admin/users', label: 'ผู้ใช้ & สิทธิ์' },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-[248px] shrink-0 flex-col bg-sidebar px-4 py-6 text-white md:flex">
        <div className="px-2 text-lg font-bold">JKP Admin</div>
        <nav className="mt-8 flex flex-col gap-6" aria-label="admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                {group.title}
              </p>
              <ul className="mt-2 flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-2 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-header flex h-14 items-center border-b border-line-subtle bg-surface-card px-6">
          <span className="text-sm font-medium text-content-secondary">
            ระบบหลังบ้าน JKP Property
          </span>
        </header>
        <main className="flex-1 bg-surface-alt p-6">{children}</main>
      </div>
    </div>
  );
}
