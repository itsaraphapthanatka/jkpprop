'use client';

import * as React from 'react';

/* ============================================================
   Shared admin CMS chrome — ported verbatim from the identical
   <aside id="admin-sidebar"> + <header> topbar in every Admin*.dc.html,
   extended with a real mobile experience (the source design only
   defined a desktop sidebar + a tablet horizontal icon-strip; neither
   is usable one-handed on a phone, so ≤640px now gets a proper
   hamburger + slide-in drawer, mirroring the pattern already used by
   the public site's Header/ListingHeader/ContentHeader).

   Breakpoints:
   - >1100px:  fixed vertical sidebar, 248px (desktop, unchanged)
   - 641–1100: horizontal scrollable icon-strip on top (tablet, unchanged)
   - ≤640px:   hidden by default; hamburger button opens it as a
               left-sliding drawer + backdrop overlay (phone)

   Pass `active` = nav key of the current page, `eyebrow`/`title` for
   the topbar heading, and optional `actions` for the topbar right
   cluster (defaults to search + bell + "เพิ่มทรัพย์", itself responsive).
   `css` appends page-specific responsive rules to ADMIN_CSS.
   ============================================================ */

export type AdminNavKey =
  | 'dashboard' | 'properties' | 'listings'
  | 'leads' | 'requirements' | 'shortlists' | 'visits' | 'deals'
  | 'cms' | 'seo' | 'settings';

/* Shared chrome CSS (sidebar/main responsive + scrollbar + hovers).
   Injected once per page via <AdminShell css={...}>. Page-specific
   grid ids (#stat-grid etc.) are passed in through the `css` prop. */
export const ADMIN_CSS = `
.a-scroll::-webkit-scrollbar{width:8px;height:8px;}
.a-scroll::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:8px;}
.admin-navlink{transition:background .15s;}
.admin-navlink:hover{background:rgba(255,255,255,.05);}
.admin-crumb{transition:color .15s;}
.admin-crumb:hover{color:#0D6C3B !important;text-decoration:underline;}
.admin-primary-btn{transition:transform .2s,box-shadow .2s;}
.admin-primary-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(13,108,59,.35);}
.admin-statcard{transition:transform .25s cubic-bezier(.2,.7,.3,1),box-shadow .25s;}
.admin-statcard:hover{transform:translateY(-4px);box-shadow:0 16px 32px rgba(0,0,0,.08);}
#admin-mobile-btn{display:none;}
#admin-overlay{display:none;}
@media (max-width:1100px){
  #admin-sidebar{display:flex !important;position:static !important;width:100% !important;height:auto !important;flex-direction:row !important;align-items:center !important;overflow-x:auto !important;overflow-y:hidden !important;padding:8px 10px !important;gap:4px;}
  #admin-sidebar > div:first-child{display:none !important;}
  #admin-sidebar > div:last-child{display:none !important;}
  #admin-sidebar nav{flex-direction:row !important;padding:0 !important;gap:4px;overflow:visible !important;}
  #admin-sidebar nav > div{display:none !important;}
  #admin-sidebar nav a{height:38px !important;padding:0 12px !important;white-space:nowrap;flex-shrink:0;}
  #admin-main{margin-left:0 !important;}
}
@media (max-width:640px){
  #admin-sidebar{
    position:fixed !important;top:0 !important;left:0 !important;bottom:0 !important;height:100% !important;
    width:82% !important;max-width:300px !important;
    flex-direction:column !important;align-items:stretch !important;
    overflow-x:hidden !important;overflow-y:auto !important;
    padding:0 !important;gap:2px;
    transform:translateX(-100%);
    transition:transform .3s cubic-bezier(.2,.8,.3,1);
    z-index:300 !important;box-shadow:20px 0 50px rgba(0,0,0,.35);
  }
  #admin-sidebar.admin-sidebar-open{ transform:translateX(0); }
  #admin-sidebar > div:first-child{display:flex !important;}
  #admin-sidebar > div:last-child{display:flex !important;}
  #admin-sidebar nav{flex-direction:column !important;padding:14px 12px !important;overflow-y:auto !important;}
  #admin-sidebar nav > div{display:block !important;}
  #admin-sidebar nav a{height:42px !important;white-space:normal;}
  #admin-mobile-btn{display:flex !important;}
  #admin-sidebar-close{display:flex !important;}
  #admin-overlay{
    display:block;position:fixed;inset:0;z-index:290;background:rgba(2,14,8,.55);
    backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);transition:opacity .25s;
  }
  #admin-topbar{flex-wrap:wrap;row-gap:10px;height:auto;padding:14px 16px !important;}
  #admin-actions-default{width:100%;flex-wrap:wrap;row-gap:8px;}
  #admin-actions-default > div:first-child{min-width:0 !important;flex:1 1 160px !important;}
}
`;

type NavEntry =
  | { group: string }
  | { key: AdminNavKey; label: string; href: string; icon: string; badge?: string };

const NAV: NavEntry[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin', icon: '<rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect>' },
  { group: 'ทรัพย์' },
  { key: 'properties', label: 'Properties', href: '/admin/properties', icon: '<path d="M3 21V8l9-5 9 5v13"></path><path d="M3 21h18"></path><path d="M7 21v-8h10v8"></path>' },
  { key: 'listings', label: 'Listings', href: '/admin/listings', icon: '<rect x="3" y="4" width="18" height="4" rx="1"></rect><rect x="3" y="10" width="18" height="4" rx="1"></rect><rect x="3" y="16" width="18" height="4" rx="1"></rect>' },
  { group: 'งานขาย' },
  { key: 'leads', label: 'Leads', href: '/admin/leads', icon: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>', badge: '18' },
  { key: 'requirements', label: 'Requirements', href: '/admin/requirements', icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><path d="M14 2v6h6"></path>', badge: '7' },
  { key: 'shortlists', label: 'Shortlists', href: '/admin/shortlists', icon: '<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>' },
  { key: 'visits', label: 'Visits', href: '/admin/visits', icon: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>' },
  { key: 'deals', label: 'Deals', href: '/admin/deals', icon: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>' },
  { group: 'เนื้อหา & ระบบ' },
  { key: 'cms', label: 'CMS', href: '/admin/cms', icon: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path>' },
  { key: 'seo', label: 'SEO / GEO', href: '/admin/seo', icon: '<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"></path>' },
  { key: 'settings', label: 'Settings', href: '/admin/settings', icon: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"></path>' },
];

function AdminSidebar({ active, mobileOpen, onClose }: { active?: AdminNavKey; mobileOpen: boolean; onClose: () => void }) {
  return (
    <aside id="admin-sidebar" className={mobileOpen ? 'admin-sidebar-open' : undefined} style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 248, background: 'var(--sidebar)', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
      <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jkp-logo-white.png" alt="JKP" style={{ height: 30, width: 'auto', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#5E6B63', borderLeft: '1px solid rgba(255,255,255,.14)', paddingLeft: 9, whiteSpace: 'nowrap' }}>CMS</span>
        </div>
        <div id="admin-sidebar-close" onClick={onClose} aria-label="ปิดเมนู" style={{ display: 'none', width: 32, height: 32, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,.08)', color: '#AEB8B1', flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
        </div>
      </div>
      <nav className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((n, i) => {
          if ('group' in n) {
            return (
              <div key={'g' + i} style={{ padding: '14px 12px 6px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '.08em', color: '#4E5A52', textTransform: 'uppercase' }}>{n.group}</div>
            );
          }
          const on = n.key === active;
          return (
            <a
              key={n.key}
              href={n.href}
              onClick={onClose}
              className="admin-navlink"
              style={{ display: 'flex', alignItems: 'center', gap: 11, height: 40, padding: '0 12px', borderRadius: 11, fontSize: '13.5px', fontWeight: on ? 700 : 500, color: on ? '#fff' : '#AEB8B1', background: on ? 'rgba(45,251,145,.12)' : 'transparent' }}
            >
              <span style={{ display: 'flex', width: 18, height: 18, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + (on ? '#2DFB91' : '#9AA39D') + '" stroke-width="1.8">' + n.icon + '</svg>' }} />
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && (
                <span style={{ height: 18, minWidth: 18, padding: '0 6px', borderRadius: 9999, background: '#2DFB91', color: '#04140C', fontSize: '10.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n.badge}</span>
              )}
            </a>
          );
        })}
      </nav>
      <div style={{ padding: 14, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9999, background: '#273c33', color: '#2DFB91', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>ก</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>กิตติพงษ์ พรหมทอง</div>
          <div style={{ fontSize: 11, color: '#5E6B63' }}>Super admin</div>
        </div>
        <a href="/admin/login" aria-label="ออกจากระบบ" style={{ display: 'flex', flexShrink: 0, color: '#5E6B63' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
        </a>
      </div>
    </aside>
  );
}

/** Default topbar right cluster: search + notification bell + "เพิ่มทรัพย์". */
export function AdminTopbarDefaultActions() {
  return (
    <div id="admin-actions-default" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 240 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <input placeholder="ค้นหาทรัพย์, lead, รหัส…" style={{ border: 0, outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
        <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10.5px', color: 'var(--muted3)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 5px' }}>⌘K</code>
      </div>
      <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="1.8"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
        <span style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 9999, background: '#2DFB91', border: '2px solid var(--surface)' }} />
      </div>
      <a href="/admin/properties" className="admin-primary-btn" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>เพิ่มทรัพย์
      </a>
    </div>
  );
}

/** Clickable breadcrumb for the topbar eyebrow. Pass items with an href to
    make a segment navigable (the last/current segment usually has no href). */
export function AdminBreadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: 'var(--muted3)' }}>/</span>}
          {it.href ? (
            <a href={it.href} className="admin-crumb" style={{ color: 'var(--muted2)', textDecoration: 'none', cursor: 'pointer' }}>{it.label}</a>
          ) : (
            <span>{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}

export interface AdminShellProps {
  active?: AdminNavKey;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
  css?: string;
  children: React.ReactNode;
}

export function AdminShell({ active, eyebrow, title, actions, css, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div
      id="admin-root"
      style={{ width: '100%', minHeight: '100vh', background: 'var(--bg)', ['--bg' as string]: '#F6F5F1', ['--sidebar' as string]: '#0A0E0C' } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: ADMIN_CSS + (css || '') }} />
      <AdminSidebar active={active} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div id="admin-overlay" onClick={() => setMobileOpen(false)} style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? 'auto' : 'none' }} />
      <div id="admin-main" style={{ marginLeft: 248, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header id="admin-topbar" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(246,245,241,.85)', WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 auto' }}>
            <div id="admin-mobile-btn" onClick={() => setMobileOpen(true)} aria-label="เปิดเมนู" style={{ display: 'none', width: 38, height: 38, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--muted2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eyebrow}</div>
              <h1 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{title}</h1>
            </div>
          </div>
          {actions === undefined ? <AdminTopbarDefaultActions /> : actions}
        </header>
        <main className="a-scroll" style={{ flex: 1, padding: '24px 28px 60px', minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
