'use client';

import * as React from 'react';
import { fetchListings, type ApiListing } from './ListingsAdminBody';
import { InventoryFilters, EMPTY_FILTERS, matchesFilters, sortInventory, type InventoryFilterState, type InventoryRow } from './InventoryFilters';
import { buildSummary } from '@/lib/summaryTemplate';
import { TablePager, pageSlice, pageCountOf } from './TablePager';
import { thumb } from '@/lib/mediaThumb';
import {
  loadSocial, saveSocial, recordOf, postOf, doneCount, channelKey, todayISO,
  type SocialStore, type SocialRecord,
} from '@/lib/socialStore';
import { apiGet, apiPut, apiPost, apiDelete, apiFetch, ApiClientError } from '@/lib/apiClient';
import { MediaLibraryPicker } from './MediaLibraryPicker';
import { propertyType } from '@/lib/propertySchema';
import { buildZip, extForMime, safeFileName, type ZipEntry } from '@/lib/zip';
import { PicCell, PIC_TH } from './PicCell';

/* รูปสำหรับโพสต์ของประกาศหนึ่ง — สไลด์ 35
   อัปโหลดใหม่ หรือหยิบจากคลังสื่อ (ไม่ต้องอัปซ้ำ) · ลบทีละใบได้
   ถ้าไม่ใส่เลย ปุ่มโหลดรูปจะใช้รูปทรัพย์ตามเดิม */
function SocialPhotos({ value, onChange, fallback }: {
  value: string[];
  onChange: (v: string[]) => void;
  /** จำนวนรูปทรัพย์ที่จะถูกใช้แทนถ้าไม่ได้ใส่รูปโพสต์ */
  fallback: number;
}) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [picking, setPicking] = React.useState(false);

  const upload = async (files: FileList) => {
    setBusy(true);
    setErr('');
    const added: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const form = new FormData();
        form.append('file', file);
        const r = await apiFetch<{ src: string }>('/api/media', { method: 'POST', body: form });
        added.push(r.src);
      } catch (e) {
        setErr(e instanceof ApiClientError ? e.message : `อัปโหลด ${file.name} ไม่สำเร็จ`);
      }
    }
    if (added.length) onChange([...value, ...added]);
    setBusy(false);
  };

  return (
    <div>
      <input
        ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ''; }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: '1.5px dashed var(--border)', background: 'var(--bg)' }}>
        <div style={{ flex: 1, minWidth: 0, fontSize: '12.5px', color: err ? '#C0392B' : 'var(--muted)', lineHeight: 1.6 }}>
          {err || (value.length
            ? <>ใส่ไว้ <b style={{ color: 'var(--text)' }}>{value.length} รูป</b> — ปุ่มโหลดรูปในตารางจะได้ชุดนี้</>
            : <>ยังไม่ได้ใส่ — ปุ่มโหลดรูปจะใช้<b style={{ color: 'var(--text)' }}> รูปทรัพย์ {fallback ? `(${fallback} รูป)` : '(ยังไม่มี)'}</b> แทน</>)}
        </div>
        <button type="button" data-soc-pick onClick={() => setPicking(true)} style={{ height: 32, padding: '0 12px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>เลือกจากคลัง</button>
        <button type="button" data-soc-upload onClick={() => fileRef.current?.click()} disabled={busy} style={{ height: 32, padding: '0 13px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, flexShrink: 0, border: 0, fontFamily: 'inherit' }}>{busy ? 'กำลังอัปโหลด…' : 'อัปโหลด'}</button>
      </div>

      {picking && (
        <MediaLibraryPicker
          attached={value}
          onAttach={(srcs) => onChange([...value, ...srcs.filter((x) => !value.includes(x))])}
          onClose={() => setPicking(false)}
        />
      )}

      {value.length > 0 && (
        <div data-soc-photos style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(104px,1fr))', gap: 8 }}>
          {value.map((src, i) => (
            <div key={src} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '4 / 3', background: 'var(--bg)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(src, 160)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button
                type="button"
                aria-label={`ลบรูปที่ ${i + 1}`}
                onClick={() => onChange(value.filter((x) => x !== src))}
                style={{ position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 9999, border: 0, background: 'rgba(2,14,8,.62)', color: '#fff', fontSize: 12, lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ปุ่มดาวน์โหลดรูปของประกาศหนึ่ง — สไลด์ 35 "Social Status ไม่มีให้โหลดรูปภาพ
   ของแต่ละประกาศ · จำเป็น"
   ทีมต้องเอารูปไปโพสต์ตามช่องทาง แต่หน้านี้ให้ได้แค่ดูรูปหน้าปก จะเอารูปจริงต้อง
   ไปเปิดหน้าทรัพย์แล้วคลิกขวาบันทึกทีละใบ

   รวมเป็นไฟล์ ZIP ไฟล์เดียว — โหลดทีละใบหลายไฟล์พร้อมกันเบราว์เซอร์จะบล็อก
   และรูปที่ได้เป็นรูปที่ติดลายน้ำแล้ว เพราะดึงจากลิงก์เดียวกับที่หน้าเว็บใช้ */
function PhotoDownload({ code, photos, forPost = false }: { code: string; photos: string[]; forPost?: boolean }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  if (!photos.length) {
    return <span style={{ fontSize: 11.5, color: 'var(--muted3)' }}>ยังไม่มีรูป</span>;
  }

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      const entries: ZipEntry[] = [];
      for (const [i, src] of photos.entries()) {
        /* ?wm=1 บังคับให้ติดลายน้ำ — หลังบ้านเสิร์ฟรูปสะอาดให้คนในทีมดูทำงาน
           แต่รูปชุดนี้กำลังจะออกไปลงโซเชียล จึงต้องมีลายน้ำเหมือนที่หน้าเว็บ */
        const res = await fetch(src + (src.includes('?') ? '&' : '?') + 'wm=1');
        if (!res.ok) throw new Error(`โหลดรูปที่ ${i + 1} ไม่สำเร็จ`);
        const buf = new Uint8Array(await res.arrayBuffer());
        const ext = extForMime(res.headers.get('content-type') ?? '');
        entries.push({ name: `${safeFileName(code)}-${String(i + 1).padStart(2, '0')}.${ext}`, bytes: buf });
      }
      const url = URL.createObjectURL(new Blob([buildZip(entries)], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFileName(code)}-รูปภาพ.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'ดาวน์โหลดไม่สำเร็จ');
    }
    setBusy(false);
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <button
        type="button"
        data-photo-zip={code}
        onClick={run}
        disabled={busy}
        title={forPost
          ? `ดาวน์โหลดรูปสำหรับโพสต์ ${photos.length} รูป เป็นไฟล์ ZIP`
          : `ดาวน์โหลดรูปทรัพย์ ${photos.length} รูป เป็นไฟล์ ZIP — ยังไม่ได้ใส่รูปสำหรับโพสต์`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: busy ? 0.6 : 1 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5M12 15V3" /></svg>
        {busy ? 'กำลังรวม…' : `โหลดรูป ${photos.length}`}
      </button>
      {/* บอกว่ารูปที่จะได้เป็นรูปโพสต์หรือรูปทรัพย์ — สองชุดนี้ไม่เหมือนกัน */}
      <span style={{ fontSize: 10, color: forPost ? '#0D6C3B' : 'var(--muted3)', fontWeight: forPost ? 700 : 500 }}>
        {forPost ? 'รูปโพสต์' : 'รูปทรัพย์'}
      </span>
      {err && <span data-photo-zip-error style={{ fontSize: 11, color: '#C0392B' }}>{err}</span>}
    </div>
  );
}

/* Social Status — one row per listing showing which channels it has already
   been posted to. Open a row to read/edit the post text, copy it, and tick
   each channel with the date and the post URL. Channels are editable. */

const th: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '13px', background: 'var(--surface)', color: 'var(--text)', outline: 'none' };
const label: React.CSSProperties = { display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 700, color: 'var(--muted)' };

/* แถวรายการพกมาแค่ไม่กี่ช่อง — ใช้เป็นตัวสำรองระหว่างรอโหลดของจริงเท่านั้น
 *
 * ข้อความโพสต์อัตโนมัติจึงเคยออกมาเป็นโครงเปล่า: "พื้นที่ใช้สอยรวม :" ·
 * "ออฟฟิศ :" · "ความสูง :" ว่างหมดทุกบรรทัด เพราะค่าพวกนั้นอยู่ใน values ของ
 * ทรัพย์ ซึ่งหน้านี้ไม่เคยดึงมา */
const valuesFor = (r: ApiListing) => ({
  deal_type: r.deal,
  province: r.location,
  price_rent: r.dealK !== 'sale' ? r.price.replace(/^฿/, '').replace(/\/ด\.$/, '') : '',
  price_sale: r.dealK !== 'rent' ? r.price.replace(/^฿/, '') : '',
});

const tick = (on: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 9999,
  fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  border: '1.5px solid ' + (on ? '#0D6C3B' : 'var(--border)'),
  background: on ? 'rgba(13,108,59,.07)' : 'var(--surface)',
  color: on ? '#0D6C3B' : 'var(--muted2)',
});

export function SocialStatusBody() {
  const [store, setStore] = React.useState<SocialStore>({ channels: [], records: {} });
  const [ready, setReady] = React.useState(false);
  /* เมนูค้นหาชุดเดียวกับ Property และ Listings (สไลด์ 22) — เดิมหน้านี้มีแต่
     ช่องค้นหาข้อความ กรองหาของแบบเดียวกับอีกสองหน้าไม่ได้ */
  const [inv, setInv] = React.useState<InventoryFilterState>(EMPTY_FILTERS);
  const [only, setOnly] = React.useState<'all' | 'todo' | 'done'>('all');
  const [page, setPage] = React.useState(1);
  const [openCode, setOpenCode] = React.useState<string | null>(null);
  /* values ของทรัพย์ที่เปิดอยู่ — ดึงตอนเปิดกล่อง ไม่ใช่ดึงมาทั้ง 393 รายการ
     ตั้งแต่โหลดหน้า */
  const [openValues, setOpenValues] = React.useState<Record<string, unknown> | null>(null);
  const [loadingValues, setLoadingValues] = React.useState(false);
  const [chOpen, setChOpen] = React.useState(false);
  const [newCh, setNewCh] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [draft, setDraft] = React.useState<SocialRecord>({ channels: {} });
  const [draftText, setDraftText] = React.useState('');
  // true = still following the generated text; false = this listing has its own copy.
  // Tracked explicitly rather than inferred by comparing strings, so typing the
  // text back to something identical doesn't silently re-link it.
  const [useAuto, setUseAuto] = React.useState(true);

  /* The rows were the nine demo listings the Listings page used to carry, so
     every tick was being filed against a listing code the org does not own. */
  const [listings, setListings] = React.useState<ApiListing[] | null>(null);

  // client-only read (keeps SSR and first client render identical), then the
  // server copy — localStorage stays as an offline cache
  React.useEffect(() => {
    setStore(loadSocial());
    setReady(true);
    apiGet<SocialStore>('/api/social')
      .then((s) => { if (s && Array.isArray(s.channels)) { setStore(s); saveSocial(s); } })
      .catch(() => { /* keep cache (§2.2) */ });
    fetchListings()
      .then((r) => setListings(r.items))
      .catch(() => setListings([]));
  }, []);

  // optimistic local write + PUT for the touched listing (§2.3)
  const persist = (next: SocialStore, code?: string) => {
    setStore(next);
    saveSocial(next);
    if (code) {
      const rec = next.records[code] || { channels: {} };
      void apiPut(`/api/social/${encodeURIComponent(code)}`, { text: rec.text ?? null, photos: rec.photos ?? [], channels: rec.channels })
        .catch(() => { /* stays in the local cache */ });
    }
  };
  const channels = store.channels;

  const generated = React.useCallback((code: string, vals?: Record<string, unknown> | null) => {
    const row = (listings ?? []).find((r) => r.code === code);
    if (!row) return '';
    return buildSummary({
      /* ช่องนี้คือ "ประเภททรัพย์" ไม่ใช่ชื่อประกาศ — เดิมส่งชื่อทั้งดุ้นมา หัวข้อความ
         จึงเป็นชื่อประกาศตามด้วยครึ่งหลังของตัวเองซ้ำอีกรอบ */
      typeLabel: propertyType(row.typeKey).label,
      code: row.code,
      values: vals ?? valuesFor(row),
    }).text;
  }, [listings]);

  const picOptions = Array.from(new Set((listings ?? []).map((r) => r.pic).filter(Boolean))).sort();
  const view = (r: ApiListing): InventoryRow => ({
    code: r.code, title: r.title, typeKey: r.typeKey, province: r.location,
    zoning: r.zoning, deal: r.dealLabel, size: r.sizeSqm, price: r.priceValue,
    available: r.available, pic: r.pic ?? '',
  });
  const rows = sortInventory(
    (listings ?? []).filter((r) => {
      if (!matchesFilters(view(r), inv)) return false;
      if (only === 'all' || !ready) return true;
      const n = doneCount(recordOf(store, r.code), channels);
      return only === 'done' ? n === channels.length && n > 0 : n < channels.length;
    }).map((r) => ({ ...r, ...view(r) })),
    inv.sort,
  ).map((r) => (listings ?? []).find((x) => x.code === r.code)!);

  /* แบ่งหน้าเหมือน Properties และ Listings — 393 แถวในหน้าเดียวเลื่อนหายาก
     และตั้งแต่มีรูปหน้าปกก็คือโหลดรูปทั้งคลังพร้อมกัน */
  React.useEffect(() => { setPage(1); }, [inv, only]);
  const pageCount = pageCountOf(rows.length);
  React.useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const rowsOnPage = pageSlice(rows, page);

  /* ---- quick tick straight from the table ---- */
  const quickToggle = (code: string, key: string) => {
    const rec = recordOf(store, code);
    const cur = postOf(rec, key);
    const nextPost = cur.done ? { done: false } : { done: true, date: cur.date || todayISO(), url: cur.url };
    persist({ ...store, records: { ...store.records, [code]: { ...rec, channels: { ...rec.channels, [key]: nextPost } } } }, code);
  };

  /* ---- row dialog ---- */
  const openRow = (code: string) => {
    const rec = recordOf(store, code);
    setDraft({ text: rec.text, photos: rec.photos ? [...rec.photos] : [], channels: { ...rec.channels } });
    setDraftText(rec.text ?? generated(code));
    setUseAuto(rec.text === undefined);
    setOpenCode(code);
    setOpenValues(null);
    setCopied(false);

    /* ดึงรายละเอียดทรัพย์จริงมาเติมข้อความ — ถ้าคนแก้ข้อความเองไว้แล้ว
       ห้ามเขียนทับของเขา */
    setLoadingValues(true);
    apiGet<{ values: Record<string, unknown> }>(`/api/properties/${encodeURIComponent(code)}`)
      .then((p) => {
        setOpenValues(p.values ?? {});
        if (rec.text === undefined) setDraftText(generated(code, p.values ?? {}));
      })
      .catch(() => { /* ใช้ข้อความจากข้อมูลเท่าที่มีในแถวไปก่อน */ })
      .finally(() => setLoadingValues(false));
  };
  /* Writes to the social store ONLY. The property form keeps its own copy of
     the text and is never touched from here — editing a post caption must not
     rewrite the property record. */
  const saveRow = () => {
    if (!openCode) return;
    const text = useAuto ? undefined : draftText;
    persist({ ...store, records: { ...store.records, [openCode]: { text, photos: draft.photos ?? [], channels: draft.channels } } }, openCode);
    setOpenCode(null);
  };
  const setDraftPost = (key: string, patch: Partial<{ done: boolean; date: string; url: string }>) => {
    setDraft((d) => {
      const cur = d.channels[key] || { done: false };
      const merged = { ...cur, ...patch };
      if (patch.done && !merged.date) merged.date = todayISO();
      return { ...d, channels: { ...d.channels, [key]: merged } };
    });
  };
  const copyText = async () => {
    try { await navigator.clipboard.writeText(draftText); } catch {
      const ta = document.createElement('textarea'); ta.value = draftText; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch { /* ignore */ } document.body.removeChild(ta);
    }
    setCopied(true); window.setTimeout(() => setCopied(false), 1600);
  };

  /* ---- channel management ---- */
  const addChannel = () => {
    const l = newCh.trim();
    if (!l) return;
    const key = channelKey(l, channels.map((c) => c.key));
    persist({ ...store, channels: [...channels, { key, label: l }] });
    setNewCh('');
    void apiPost('/api/social/channels', { key, label: l }).catch(() => { /* cached locally */ });
  };
  const removeChannel = (key: string) => {
    const records: SocialStore['records'] = {};
    Object.entries(store.records).forEach(([code, rec]) => {
      const rest = Object.fromEntries(Object.entries(rec.channels).filter(([k]) => k !== key));
      records[code] = { ...rec, channels: rest };
    });
    persist({ channels: channels.filter((c) => c.key !== key), records });
    // server cascades the per-listing posts for this channel (§6.5 rule #3)
    void apiDelete(`/api/social/channels?key=${encodeURIComponent(key)}`).catch(() => { /* cached locally */ });
  };

  const openRec = openCode ? draft : null;
  const openRow_ = openCode ? (listings ?? []).find((r) => r.code === openCode) : null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      {/* เมนูค้นหาชุดเดียวกับ Property และ Listings */}
      <InventoryFilters value={inv} onChange={setInv} picOptions={picOptions} />

      {/* toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        {([['all', 'ทั้งหมด'], ['todo', 'ยังลงไม่ครบ'], ['done', 'ลงครบแล้ว']] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setOnly(k)} aria-pressed={only === k} style={{ height: 40, padding: '0 15px', borderRadius: 10, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid ' + (only === k ? '#273c33' : 'var(--border)'), background: only === k ? '#273c33' : 'var(--surface)', color: only === k ? '#fff' : 'var(--muted)' }}>{l}</button>
        ))}
        <button type="button" id="soc-manage" onClick={() => setChOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
          จัดการช่องทาง
        </button>
      </div>

      {/* table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }} className="a-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th style={th}>Listing</th>
                {/* ตัวกรอง PIC มีมาตลอด แต่ไม่เคยมีคอลัมน์ให้เห็นว่าใครดูแล
                    หน้านี้ต้องรู้ว่าใครรับผิดชอบมากที่สุด เพราะคนที่ยังลงไม่ครบ
                    คือคนที่ต้องไปตาม */}
                <th style={{ ...th, whiteSpace: 'nowrap' }}>{PIC_TH}</th>
                <th style={th}>ช่องทางที่ลงประกาศแล้ว</th>
                {/* สไลด์ 35 · "ไม่มีให้โหลดรูปภาพของแต่ละประกาศ · จำเป็น" */}
                <th style={{ ...th, textAlign: 'center', width: 140 }}>รูปภาพ</th>
                <th style={{ ...th, textAlign: 'center' }}>ความคืบหน้า</th>
                <th style={{ ...th, width: 130 }} />
              </tr>
            </thead>
            <tbody>
              {rowsOnPage.map((r) => {
                const rec = recordOf(store, r.code);
                const n = doneCount(rec, channels);
                const all = channels.length > 0 && n === channels.length;
                return (
                  <tr key={r.code} className="soc-row" style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* รูปหน้าปกเหมือนอีกสองตาราง — คนที่กำลังจะโพสต์ต้องเห็น
                            ว่าเป็นทรัพย์ตัวไหนก่อนคัดลอกข้อความไปลง */}
                        {r.img
                          /* eslint-disable-next-line @next/next/no-img-element */
                          ? <img src={thumb(r.img, 160)} alt="" data-row-cover style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                          : <div data-row-cover="none" style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--tint)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted3)' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M21 15l-5-4-4 3" /></svg>
                            </div>}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{r.title}</div>
                          <div style={{ marginTop: 2, fontSize: '11.5px', color: 'var(--muted2)' }}>
                            <code style={{ color: '#0D6C3B', fontWeight: 700 }}>{r.code}</code> · {r.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px' }}><PicCell name={r.pic} /></td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {channels.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted3)' }}>ยังไม่มีช่องทาง — กด “จัดการช่องทาง”</span>}
                        {channels.map((c) => {
                          const post = postOf(rec, c.key);
                          return (
                            <button key={c.key} type="button" onClick={() => quickToggle(r.code, c.key)} aria-pressed={post.done} title={post.done && post.date ? `ลงเมื่อ ${post.date}` : 'ยังไม่ได้ลง'} style={tick(post.done)}>
                              {post.done
                                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="3.2"><path d="M20 6L9 17l-5-5" /></svg>
                                : <span style={{ width: 11, height: 11, borderRadius: 3, border: '1.5px solid var(--muted3)' }} />}
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                      {/* รูปโพสต์ที่ใส่ไว้เองมาก่อน — ถ้าไม่มีค่อยใช้รูปทรัพย์ (สไลด์ 35) */}
                      <PhotoDownload
                        code={r.code}
                        photos={rec.photos?.length ? rec.photos : (r.photos ?? (r.img ? [r.img] : []))}
                        forPost={!!rec.photos?.length}
                      />
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px', borderRadius: 9999, fontSize: '11.5px', fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", background: all ? '#E8F3EC' : 'var(--bg)', color: all ? '#0D6C3B' : 'var(--muted2)' }}>{n}/{channels.length}</span>
                    </td>
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <button type="button" onClick={() => openRow(r.code)} className="soc-open" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
                        ดูหมายเหตุ
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rowsOnPage.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--muted3)' }}>
                  {listings === null ? 'กำลังโหลด…' : listings.length === 0 ? 'ยังไม่มีประกาศในระบบ' : 'ไม่พบรายการที่ตรงกับเงื่อนไข'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 18px 14px', borderTop: '1px solid var(--border)' }}>
          <TablePager page={page} total={rows.length} onPage={setPage} unit="ประกาศ" />
          <div style={{ marginTop: 4, fontSize: '11.5px', color: 'var(--muted3)' }}>
            ติ๊กในตารางได้เลย หรือกด “ดูหมายเหตุ” เพื่อใส่วันที่และลิงก์
          </div>
        </div>
      </div>

      {/* ---- row dialog ---- */}
      {openCode && openRec && openRow_ && (
        <div id="soc-overlay" onClick={() => setOpenCode(null)} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div id="soc-modal" onClick={stop} style={{ width: '100%', maxWidth: 620, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{openRow_.title}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}><code style={{ color: '#0D6C3B', fontWeight: 700 }}>{openRow_.code}</code> · {openRow_.location}</div>
              </div>
              <button type="button" onClick={() => setOpenCode(null)} aria-label="ปิด" style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 7 }}>
                  <label style={{ ...label, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                    ข้อความสำหรับโพสต์ (แก้ไขได้)
                    <span id="soc-mode" style={{ display: 'inline-flex', alignItems: 'center', height: 19, padding: '0 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700, background: useAuto ? 'var(--tint)' : '#F0ECF9', color: useAuto ? 'var(--accent)' : '#7A3FB0' }}>
                      {useAuto ? 'ตามข้อความอัตโนมัติ' : 'แก้ไขเองแล้ว'}
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" id="soc-reset" onClick={() => { setDraftText(generated(openCode, openValues)); setUseAuto(true); }} disabled={useAuto} style={{ height: 30, padding: '0 11px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', color: useAuto ? 'var(--muted3)' : 'var(--muted)', fontSize: 11.5, fontWeight: 700, cursor: useAuto ? 'default' : 'pointer', fontFamily: 'inherit', opacity: useAuto ? 0.55 : 1 }}>ใช้ข้อความอัตโนมัติ</button>
                    <button type="button" id="soc-copy" onClick={copyText} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 13px', borderRadius: 9999, border: 0, background: copied ? '#0D6C3B' : '#273c33', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {copied
                        ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8"><path d="M20 6L9 17l-5-5" /></svg>คัดลอกแล้ว</>
                        : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 012-2h8" /></svg>คัดลอก</>}
                    </button>
                  </div>
                </div>
                {loadingValues && (
                  <div data-soc-loading style={{ marginBottom: 6, fontSize: 11.5, color: 'var(--muted2)' }}>กำลังดึงรายละเอียดทรัพย์มาเติมข้อความ…</div>
                )}
                <textarea id="soc-text" value={draftText} onChange={(e) => { setDraftText(e.target.value); setUseAuto(false); }} style={{ width: '100%', height: 240, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.7, outline: 'none', resize: 'vertical' }} />
                <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.55, color: 'var(--muted3)' }}>
                  แก้ไขตรงนี้จะบันทึกเป็น<b> ข้อความโพสต์ของประกาศนี้เท่านั้น</b> — ไม่กระทบข้อความในหน้า <b>แก้ไขทรัพย์ → หมายเหตุ : รายละเอียดทรัพย์ (รวม)</b>
                  {useAuto ? ' · ตอนนี้ยังตามข้อความอัตโนมัติ ถ้าข้อมูลทรัพย์เปลี่ยน ข้อความจะอัปเดตตาม' : ' · ตอนนี้ใช้ข้อความที่แก้เอง จะไม่เปลี่ยนตามข้อมูลทรัพย์แล้ว'}
                </div>
              </div>

              {/* สไลด์ 35 · "Social Status ไม่มีให้โหลดรูปภาพของแต่ละประกาศ · จำเป็น"
                  รูปโพสต์มักครอปมาแล้ว มีข้อความทับ หรือเลือกมาเฉพาะบางใบ จึงเป็น
                  คนละชุดกับรูปทรัพย์ · ไม่ใส่ก็ใช้รูปทรัพย์ตามเดิม */}
              <div>
                <label style={label}>รูปสำหรับโพสต์ประกาศนี้</label>
                <SocialPhotos
                  value={draft.photos ?? []}
                  onChange={(v) => setDraft((d) => ({ ...d, photos: v }))}
                  fallback={(openValues?.photos as string[] | undefined)?.length ?? openRow_.img ? 1 : 0}
                />
              </div>

              <div>
                <label style={label}>ช่องทางที่ลงประกาศแล้ว</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {channels.map((c) => {
                    const post = openRec.channels[c.key] || { done: false };
                    return (
                      <div key={c.key} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, background: post.done ? 'rgba(13,108,59,.04)' : 'var(--bg)' }}>
                        <button type="button" role="checkbox" aria-checked={!!post.done} onClick={() => setDraftPost(c.key, { done: !post.done })} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
                          <span style={{ width: 19, height: 19, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + (post.done ? '#0D6C3B' : 'var(--border)'), background: post.done ? '#0D6C3B' : 'transparent' }}>
                            {post.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4"><path d="M20 6L9 17l-5-5" /></svg>}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{c.label}</span>
                        </button>
                        {post.done && (
                          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <label style={label}>วันที่ลง</label>
                              <input type="date" value={post.date || ''} onChange={(e) => setDraftPost(c.key, { date: e.target.value })} style={inputStyle} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <label style={label}>ลิงก์โพสต์</label>
                              <input value={post.url || ''} onChange={(e) => setDraftPost(c.key, { url: e.target.value })} placeholder="https://…" style={inputStyle} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setOpenCode(null)} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>ยกเลิก</button>
              <button type="button" id="soc-save" onClick={saveRow} style={{ height: 42, padding: '0 24px', borderRadius: 9999, border: 0, background: '#0D6C3B', color: '#fff', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- channel manager ---- */}
      {chOpen && (
        <div onClick={() => setChOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 810, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={stop} style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', display: 'flex', flexDirection: 'column', maxHeight: '82vh' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>จัดการช่องทาง</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)' }}>ช่องทางที่ใช้ลงประกาศ — ใช้กับทุกรายการ</div>
            </div>
            <div className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {channels.map((c) => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, border: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{c.label}</span>
                  <button type="button" onClick={() => removeChannel(c.key)} aria-label={`ลบ ${c.label}`} style={{ width: 30, height: 30, borderRadius: 8, border: 0, background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C0392B', cursor: 'pointer' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                  </button>
                </div>
              ))}
              {channels.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--muted3)' }}>ยังไม่มีช่องทาง — เพิ่มด้านล่าง</div>}
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <input id="soc-newch" value={newCh} onChange={(e) => setNewCh(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChannel(); } }} placeholder="เช่น LINE OA, TikTok" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
              <button type="button" id="soc-addch" onClick={addChannel} style={{ height: 40, padding: '0 16px', borderRadius: 10, border: 0, background: '#0D6C3B', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>เพิ่ม</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
