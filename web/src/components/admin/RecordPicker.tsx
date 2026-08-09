'use client';

import * as React from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/apiClient';

/* The approved design has no index screen for deals / visits / shortlists —
   only a detail screen. Until one exists, this dropdown is how an operator
   reaches a record other than the newest: it lists what the API returns and
   links to /admin/<base>/<id>. Small on purpose, so it doesn't invent a
   layout the client hasn't seen. */

type Row = { id: string; label: string; meta?: string };

export function RecordPicker({
  base,
  endpoint,
  currentId,
  toRow,
  emptyLabel = 'ยังไม่มีรายการ',
}: {
  /** admin path segment, e.g. 'deals' */
  base: string;
  /** list endpoint, e.g. '/api/deals' */
  endpoint: string;
  currentId?: string;
  toRow: (item: Record<string, unknown>) => Row;
  emptyLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<Row[] | null>(null);

  React.useEffect(() => {
    apiGet<{ items: Record<string, unknown>[] }>(endpoint)
      .then((r) => setRows((r.items ?? []).map(toRow)))
      .catch(() => setRows([]));
    // toRow is a literal at every call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const current = rows?.find((r) => r.id === currentId) ?? rows?.[0];
  const label = current?.label ?? (rows === null ? 'กำลังโหลด…' : emptyLabel);

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ height: 40, padding: '0 14px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', whiteSpace: 'nowrap', maxWidth: 260 }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 46, right: 0, zIndex: 50, width: 300, maxWidth: 'calc(100vw - 24px)', maxHeight: 360, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 13, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 6 }}>
            {rows?.length ? rows.map((r) => {
              const active = r.id === current?.id;
              return (
                <Link
                  key={r.id}
                  href={`/admin/${base}/${r.id}`}
                  onClick={() => setOpen(false)}
                  style={{ display: 'block', padding: '9px 11px', borderRadius: 9, textDecoration: 'none', background: active ? 'rgba(13,108,59,.06)' : 'transparent' }}
                >
                  <div style={{ fontSize: '12.5px', fontWeight: active ? 700 : 600, color: active ? '#0D6C3B' : 'var(--text)' }}>{r.label}</div>
                  {r.meta && <div style={{ fontSize: 11, color: 'var(--muted3)', marginTop: 2 }}>{r.meta}</div>}
                </Link>
              );
            }) : (
              <div style={{ padding: '18px 12px', textAlign: 'center', fontSize: 12.5, color: 'var(--muted3)' }}>{emptyLabel}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
