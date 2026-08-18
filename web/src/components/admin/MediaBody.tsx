'use client';

import * as React from 'react';
import { thumb } from '@/lib/mediaThumb';
import { apiGet, apiDelete, apiFetch, ApiClientError } from '@/lib/apiClient';

/* Ported from AdminMedia.dc.html <main> — Media Manager with folder
   sidebar, storage meter, search + tag filters, upload dropzone, and a
   selectable image grid. Interactive: folder selection, tag filtering,
   and per-image multi-select all drive the rendered grid/state. */




/* The eight demo files that used to sit here came from the design prototype:
   Unsplash URLs with invented filenames and file sizes. They made the library
   look stocked while /api/media — which the section editor's picker reads —
   returned nothing, so "choose from library" opened on an empty grid two
   clicks away from a page showing eight images. Only real uploads now. */


type ApiMedia = { id: string; name: string; mime: string; size: number; src: string; createdAt: number };

const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`);

/** matches the 10 GB the storage line quotes */
const QUOTA_BYTES = 10 * 1024 ** 3;

export function MediaBody() {
  /* The folder list and tag chips were ported as filters over the demo set.
     A MediaAsset has no category column, so against real uploads they could
     only ever highlight themselves — removed rather than left looking live.
     The search box had no state at all; it filters by filename now. */
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState<Record<string, boolean>>({});

  // real uploads from the API — shown ahead of the porting-era demo grid
  const [uploads, setUploads] = React.useState<ApiMedia[]>([]);
  const [totalBytes, setTotalBytes] = React.useState(0);
  const [busy, setBusy] = React.useState('');
  const [error, setError] = React.useState('');
  // FR-ADM-09: the style is chosen at upload time and baked into the file
  // that gets served publicly
  const [watermark, setWatermark] = React.useState<'none' | 'corner' | 'tiled'>('corner');
  const fileInput = React.useRef<HTMLInputElement | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const r = await apiGet<{ items: ApiMedia[]; totalBytes: number }>('/api/media');
      setUploads(Array.isArray(r.items) ? r.items : []);
      setTotalBytes(r.totalBytes || 0);
    } catch { /* keep current state (§2.2) */ }
  }, []);
  React.useEffect(() => { void reload(); }, [reload]);

  const uploadFiles = async (files: FileList | File[]) => {
    setError('');
    for (const f of Array.from(files)) {
      setBusy(`กำลังอัปโหลด ${f.name}…`);
      try {
        const form = new FormData();
        form.append('file', f);
        form.append('watermarkType', watermark);
        await apiFetch('/api/media', { method: 'POST', body: form });
      } catch (e) {
        setError(e instanceof ApiClientError ? e.message : `อัปโหลด ${f.name} ไม่สำเร็จ`);
      }
    }
    setBusy('');
    await reload();
  };

  const removeSelected = async () => {
    const ids = uploads.filter((u) => sel[u.id]).map((u) => u.id);
    if (!ids.length || busy) return;
    setBusy('กำลังลบ…');
    setError('');
    for (const id of ids) {
      try { await apiDelete(`/api/media/${id}`); } catch (e) {
        setError(e instanceof ApiClientError ? e.message : 'ลบไฟล์ไม่สำเร็จ');
        break;
      }
    }
    setSel({});
    setBusy('');
    await reload();
  };

  const shown = q.trim() ? uploads.filter((u) => u.name.toLowerCase().includes(q.trim().toLowerCase())) : uploads;
  const selCount = uploads.filter((u) => sel[u.id]).length;

  return (
    <div id="media-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
      {/* FOLDERS */}
      <div id="media-folders" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>พื้นที่ใช้งาน</div>
          <div style={{ marginTop: 8, height: 8, borderRadius: 9999, background: 'var(--bg)', overflow: 'hidden' }}>
            {/* was hard-coded to 42% whatever the real usage */}
            <div style={{ height: '100%', width: `${Math.min(100, (totalBytes / QUOTA_BYTES) * 100).toFixed(1)}%`, background: '#0D6C3B', borderRadius: 9999 }} />
          </div>
          <div style={{ marginTop: 8, fontSize: '11.5px', color: 'var(--muted2)' }}>{(totalBytes / 1073741824).toFixed(2)} GB / 10 GB · {uploads.length} ไฟล์</div>
        </div>
      </div>

      {/* GRID */}
      <div>
        {/* toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', flex: 1, minWidth: 200 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อไฟล์" style={{ border: 0, outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 0 }} />
          </div>
        </div>

        {/* watermark style — applied before the file is served publicly */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--muted)' }}>ลายน้ำตอนอัปโหลด</span>
          {([['corner', 'มุมภาพ'], ['tiled', 'ทั้งภาพ'], ['none', 'ไม่ใส่']] as const).map(([key, label]) => {
            const on = watermark === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setWatermark(key)}
                style={{ height: 32, padding: '0 13px', borderRadius: 9999, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'), background: on ? 'rgba(13,108,59,.06)' : 'var(--surface)', color: on ? '#0D6C3B' : 'var(--text)' }}
              >{label}</button>
            );
          })}
          <span style={{ fontSize: 11, color: 'var(--muted3)' }}>ไฟล์ต้นฉบับถูกเก็บไว้ให้ทีมงานเสมอ · หน้าเว็บเห็นเฉพาะไฟล์ที่ใส่ลายน้ำแล้ว</span>
        </div>

        {/* upload dropzone — click to pick, or drop files */}
        <input id="media-file-input" ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" style={{ display: 'none' }} onChange={(e) => { if (e.target.files?.length) void uploadFiles(e.target.files); e.target.value = ''; }} />
        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files); }}
          style={{ border: '1.5px dashed var(--border)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18, background: 'var(--surface)', cursor: 'pointer' }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--tint)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{busy || 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก'}</div>
            <div style={{ fontSize: 12, color: error ? '#C0392B' : 'var(--muted3)' }}>{error || 'JPG, PNG, WebP · สูงสุด 10MB ต่อไฟล์'}</div>
          </div>
        </div>

        {/* selection toolbar for real uploads */}
        {selCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: '12.5px', color: 'var(--muted)' }}>เลือกแล้ว {selCount} ไฟล์</span>
            <div onClick={removeSelected} style={{ height: 34, padding: '0 14px', borderRadius: 9999, background: '#C0392B', color: '#fff', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
              ลบที่เลือก
            </div>
          </div>
        )}

        {/* image grid — what has actually been uploaded */}
        <div id="media-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {shown.map((m) => {
            const on = !!sel[m.id];
            const cardStyle: React.CSSProperties = {
              borderRadius: 14, overflow: 'hidden',
              border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'),
              background: 'var(--surface)', cursor: 'pointer',
              transition: 'transform .2s,box-shadow .2s',
              boxShadow: on ? '0 8px 20px rgba(13,108,59,.15)' : undefined,
            };
            return (
              <div key={m.id} onClick={() => setSel((prev) => ({ ...prev, [m.id]: !prev[m.id] }))} style={cardStyle}>
                <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--tint)' }}>
                  {m.mime === 'application/pdf' ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted2)' }}>
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb(m.src, 320)} alt={m.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                  {on && (
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 9999, background: '#0D6C3B', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>
                    </div>
                  )}
                </div>
                <div style={{ padding: '9px 11px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted3)' }}>{fmtSize(m.size)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
