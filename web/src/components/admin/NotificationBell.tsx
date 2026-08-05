'use client';

import * as React from 'react';
import { buildAlerts, loadNotifyConfig, saveNotifyConfig, unreadCount, type LeaseAlert, type NotifyConfig } from '@/lib/leaseStore';

/* Topbar notification bell — surfaces the lease-expiry alerts produced from
   Settings → การแจ้งเตือน. Config + alerts are read in an effect (never during
   render) so the server and first client render stay identical. */

const LEVEL: Record<string, { bg: string; fg: string; label: string }> = {
  expired: { bg: '#F9E4E1', fg: '#C0392B', label: 'หมดสัญญาแล้ว' },
  urgent: { bg: '#FBF3E1', fg: '#9A741C', label: 'ใกล้หมดมาก' },
  warn: { bg: '#EEF4F3', fg: '#034956', label: 'ใกล้หมดสัญญา' },
};

const bellIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="1.8"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
);

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [cfg, setCfg] = React.useState<NotifyConfig | null>(null);
  const [alerts, setAlerts] = React.useState<LeaseAlert[]>([]);

  const refresh = React.useCallback(() => {
    const c = loadNotifyConfig();
    setCfg(c);
    setAlerts(buildAlerts(c));
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);
  // pick up changes made in the settings page / another tab
  React.useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onFocus);
    return () => { window.removeEventListener('focus', onFocus); window.removeEventListener('storage', onFocus); };
  }, [refresh]);

  const unread = unreadCount(alerts);

  const markAllRead = () => {
    if (!cfg) return;
    const next: NotifyConfig = { ...cfg, readIds: [...new Set([...cfg.readIds, ...alerts.map((a) => a.id)])] };
    saveNotifyConfig(next);
    setCfg(next);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        id="admin-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `การแจ้งเตือน ${unread} รายการที่ยังไม่อ่าน` : 'การแจ้งเตือน'}
        aria-expanded={open}
        style={{ position: 'relative', width: 40, height: 40, borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
      >
        {bellIcon}
        {unread > 0 && (
          <span id="admin-bell-badge" style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9999, background: '#C0392B', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface)' }}>{unread}</span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
          <div id="admin-bell-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 48, right: 0, zIndex: 70, width: 360, maxWidth: 'calc(100vw - 24px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 22px 48px rgba(0,0,0,.18)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)' }}>การแจ้งเตือน</div>
                <div style={{ fontSize: 11, color: 'var(--muted2)' }}>สัญญาเช่าใกล้หมดอายุ</div>
              </div>
              {unread > 0 && (
                <button type="button" onClick={markAllRead} style={{ border: 0, background: 'transparent', color: 'var(--accent)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>อ่านทั้งหมด</button>
              )}
            </div>

            <div className="a-scroll" style={{ maxHeight: 340, overflowY: 'auto' }}>
              {!cfg?.enabled ? (
                <div style={{ padding: '26px 18px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted2)' }}>
                  ปิดการแจ้งเตือนอยู่ — เปิดได้ที่ <a href="/admin/notifications" style={{ color: 'var(--accent)', fontWeight: 700 }}>ตั้งค่าการแจ้งเตือน</a>
                </div>
              ) : alerts.length === 0 ? (
                <div style={{ padding: '26px 18px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted2)' }}>ยังไม่มีสัญญาที่เข้าเกณฑ์แจ้งเตือน</div>
              ) : (
                alerts.map((a) => {
                  const lv = LEVEL[a.level];
                  return (
                    <a key={a.id} href={a.lease.href} style={{ display: 'block', padding: '12px 16px', borderBottom: '1px solid var(--border)', textDecoration: 'none', background: a.read ? 'transparent' : 'rgba(13,108,59,.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ height: 19, padding: '0 8px', borderRadius: 9999, background: lv.bg, color: lv.fg, fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center' }}>{lv.label}</span>
                        <code style={{ fontSize: 11, fontWeight: 700, color: '#0D6C3B' }}>{a.lease.code}</code>
                        {!a.read && <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#0D6C3B', flexShrink: 0 }} />}
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.45 }}>{a.lease.title}</div>
                      <div style={{ marginTop: 2, fontSize: 11.5, color: 'var(--muted)' }}>
                        ผู้เช่า: {a.lease.tenant} · {a.daysLeft < 0 ? `เกินกำหนด ${Math.abs(a.daysLeft)} วัน` : `เหลือ ${a.daysLeft} วัน`} (สิ้นสุด {a.endDateLabel})
                      </div>
                    </a>
                  );
                })
              )}
            </div>

            <a href="/admin/notifications" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', background: 'var(--bg)' }}>
              ตั้งค่าการแจ้งเตือน
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
