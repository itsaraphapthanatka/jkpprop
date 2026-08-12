'use client';

import * as React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { apiDelete, apiGet, apiPost, apiPut, ApiClientError } from '@/lib/apiClient';
import Link from 'next/link';

/* Ported verbatim from AdminCMS.dc.html — content-type tabs, article
   list, multi-language editor (rich-text toolbar, category dropdown,
   cover upload, internal links), plus the topbar Page Builder / Preview /
   Publish cluster and the article preview modal. Interactive, so all
   state lives here and the shell is rendered from the client body. */

type Lang = { k: string; on: boolean };
type Article = { title: string; status: string; statusK: 'pub' | 'draft'; cat: string; date: string; langs: Lang[] };

const cmsCss = `
@media (max-width:1100px){ #cms-split{grid-template-columns:1fr !important;} }
@media (max-width:640px){
  #cms-meta-row{grid-template-columns:1fr !important;}
  #cms-actions{width:100%;flex-wrap:wrap;row-gap:8px;}
}
@media (max-width:480px){
  #cms-preview-body{padding:24px 20px !important;}
  #cms-publish-btn{flex:1 1 100% !important;justify-content:center;}
}
.cms-tb-btn:hover{background:var(--tint);}
.cms-linkchoice:hover{background:var(--tint);}
/* A real placeholder. The hint used to be written into the editable area as
   content, so pressing Publish on a language nobody had written stored the
   hint itself as the answer. */
#cms-body-edit:empty::before{content:attr(data-placeholder);color:#9B968D;font-style:italic;}
`;

const TYPE_DEFS = [
  { key: 'pages', label: 'Pages', count: '14', icon: '<path d="M4 4h16v16H4z"></path><path d="M4 9h16M9 9v11"></path>' },
  { key: 'articles', label: 'บทความ', count: '32', icon: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path>' },
  { key: 'faq', label: 'FAQ', count: '26', icon: '<circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01"></path>' },
  { key: 'certs', label: 'ใบรับรอง', count: '3', icon: '<path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19.3 7.2 17l.9-5.4L4.2 7.7l5.4-.8z"></path>' },
];

const L3: Lang[] = [{ k: 'TH', on: true }, { k: 'EN', on: true }, { k: 'ZH', on: true }];
const L1: Lang[] = [{ k: 'TH', on: true }, { k: 'EN', on: false }, { k: 'ZH', on: false }];
const L2: Lang[] = [{ k: 'TH', on: true }, { k: 'EN', on: true }, { k: 'ZH', on: false }];

const DATA_BY_TYPE: Record<string, Article[]> = {
  pages: [
    { title: 'หน้าแรก (Home)', status: 'เผยแพร่', statusK: 'pub', cat: 'หน้าหลัก', date: 'วันนี้', langs: L3 },
    { title: 'เกี่ยวกับเรา', status: 'เผยแพร่', statusK: 'pub', cat: 'หน้าหลัก', date: '3 วัน', langs: L3 },
    { title: 'ติดต่อเรา', status: 'เผยแพร่', statusK: 'pub', cat: 'หน้าหลัก', date: '3 วัน', langs: L2 },
    { title: 'บริการของเรา', status: 'ร่าง', statusK: 'draft', cat: 'หน้าหลัก', date: '1 สัปดาห์', langs: L1 },
    { title: 'นโยบายความเป็นส่วนตัว', status: 'เผยแพร่', statusK: 'pub', cat: 'กฎหมาย', date: '1 เดือน', langs: L3 },
  ],
  articles: [
    { title: 'ทำไมทำเลใกล้ท่าเรือจึงสำคัญต่อธุรกิจนำเข้า-ส่งออก', status: 'ร่าง', statusK: 'draft', cat: 'EEC & โลจิสติกส์', date: 'วันนี้', langs: L1 },
    { title: 'ขั้นตอนขอใบ ร.ง.4 ฉบับเข้าใจง่าย', status: 'เผยแพร่', statusK: 'pub', cat: 'ใบอนุญาต', date: '2 วัน', langs: L3 },
    { title: 'เช่า vs ซื้อโรงงาน แบบไหนคุ้มกว่า', status: 'เผยแพร่', statusK: 'pub', cat: 'การลงทุน', date: '5 วัน', langs: L2 },
    { title: 'สิทธิประโยชน์ BOI ในเขต EEC 2026', status: 'เผยแพร่', statusK: 'pub', cat: 'EEC & โลจิสติกส์', date: '1 สัปดาห์', langs: L3 },
    { title: 'เช็คลิสต์ก่อนเซ็นสัญญาเช่าโกดัง', status: 'ร่าง', statusK: 'draft', cat: 'สัญญา', date: '1 สัปดาห์', langs: L1 },
    { title: 'ระบบไฟฟ้า 3 เฟสสำคัญอย่างไรกับโรงงาน', status: 'เผยแพร่', statusK: 'pub', cat: 'เทคนิค', date: '2 สัปดาห์', langs: L2 },
  ],
  faq: [
    { title: 'เช่าโรงงานขั้นต่ำกี่ปี?', status: 'เผยแพร่', statusK: 'pub', cat: 'การเช่า', date: '2 วัน', langs: L3 },
    { title: 'ขอใบ ร.ง.4 ใช้เวลานานไหม?', status: 'เผยแพร่', statusK: 'pub', cat: 'ใบอนุญาต', date: '4 วัน', langs: L3 },
    { title: 'ค่ามัดจำ/เงินประกันเท่าไหร่?', status: 'เผยแพร่', statusK: 'pub', cat: 'การเงิน', date: '1 สัปดาห์', langs: L2 },
    { title: 'ต่างชาติเช่า/ซื้อได้ไหม?', status: 'ร่าง', statusK: 'draft', cat: 'กฎหมาย', date: '1 สัปดาห์', langs: L1 },
  ],
  certs: [
    { title: 'ใบอนุญาตนายหน้า (DBD)', status: 'เผยแพร่', statusK: 'pub', cat: 'ใบรับรอง', date: '1 เดือน', langs: L3 },
    { title: 'สมาชิกสมาคมนายหน้าอสังหาฯ', status: 'เผยแพร่', statusK: 'pub', cat: 'ใบรับรอง', date: '1 เดือน', langs: L3 },
    { title: 'ISO 9001 ระบบคุณภาพ', status: 'ร่าง', statusK: 'draft', cat: 'ใบรับรอง', date: '2 เดือน', langs: L1 },
  ],
};

const flagTh = '<svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" fill="#F4F5F8"></rect><rect width="24" height="4.8" fill="#241B54"></rect><rect y="4.8" width="24" height="2.8" fill="#F4F5F8"></rect><rect y="7.6" width="24" height="8.8" fill="#A51931"></rect><rect y="16.4" width="24" height="2.8" fill="#F4F5F8"></rect><rect y="19.2" width="24" height="4.8" fill="#241B54"></rect></svg>';
const flagEn = '<svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" fill="#012169"></rect><path d="M0 0L24 24M24 0L0 24" stroke="#fff" stroke-width="3"></path><path d="M12 0V24M0 12H24" stroke="#fff" stroke-width="5"></path><path d="M12 0V24M0 12H24" stroke="#C8102E" stroke-width="2.4"></path></svg>';
const flagZh = '<svg width="18" height="18" viewBox="0 0 24 24"><rect width="24" height="24" fill="#EE1C25"></rect><path d="M6 5l1 3 3-1-2 2.4 2 2.4-3-1-1 3-1-3-3 1 2-2.4-2-2.4 3 1z" fill="#FFDE00"></path></svg>';

const BODY_MAP: Record<string, string> = {
  'ทำไมทำเลใกล้ท่าเรือจึงสำคัญต่อธุรกิจนำเข้า-ส่งออก': '<div style="font-size:19px;font-weight:800;margin-bottom:10px;">ทำไมทำเลใกล้ท่าเรือจึงสำคัญ</div><p style="margin:0 0 12px;">การเลือกทำเลโกดังใกล้ท่าเรือช่วยลดต้นทุนโลจิสติกส์อย่างมีนัยสำคัญ โดยเฉพาะธุรกิจนำเข้า–ส่งออก</p><div style="font-size:15px;font-weight:700;margin:14px 0 8px;">ข้อดีหลัก 3 ประการ</div><ul style="margin:0;padding-left:20px;color:#5F5A52;"><li>ลดค่าขนส่งตู้คอนเทนเนอร์</li><li>ร่นเวลานำเข้า–ส่งออก</li><li>เข้าถึงเขตปลอดอากร</li></ul><div style="margin-top:14px;padding:14px 16px;border-radius:11px;background:#EEF4F3;border-left:3px solid #034956;font-size:13px;color:#034956;">💡 แหลมฉบังรองรับสินค้ากว่า 8 ล้าน TEU/ปี</div>',
  'ขั้นตอนขอใบ ร.ง.4 ฉบับเข้าใจง่าย': '<div style="font-size:19px;font-weight:800;margin-bottom:10px;">ขอใบ ร.ง.4 ทีละขั้น</div><p style="margin:0 0 12px;">ใบ ร.ง.4 คือใบอนุญาตประกอบกิจการโรงงานจำพวกที่ 3 ที่ต้องยื่นก่อนเริ่มผลิต</p><ol style="margin:0;padding-left:20px;color:#5F5A52;"><li>เตรียมเอกสารที่ดิน + ผังโรงงาน</li><li>ยื่นต่อกรมโรงงานอุตสาหกรรม</li><li>ตรวจสถานที่จริง</li><li>รับใบอนุญาต (30–60 วัน)</li></ol>',
  'เช่าโรงงานขั้นต่ำกี่ปี?': '<div style="font-size:19px;font-weight:800;margin-bottom:10px;">เช่าโรงงานขั้นต่ำกี่ปี?</div><p style="margin:0;">สัญญาเช่าโรงงาน/โกดังส่วนใหญ่<b>ขั้นต่ำ 3 ปี</b> บางแห่งรับ 1 ปี แต่ค่าเช่าจะสูงกว่า ต่ออายุได้ตามตกลง</p>',
  'ใบอนุญาตนายหน้า (DBD)': '<div style="font-size:19px;font-weight:800;margin-bottom:10px;">ใบอนุญาตนายหน้า (DBD)</div><p style="margin:0;">JKP Property จดทะเบียนถูกต้องกับกรมพัฒนาธุรกิจการค้า (DBD) ดำเนินธุรกิจนายหน้าอสังหาริมทรัพย์อย่างโปร่งใส ตรวจสอบได้</p>',
  'หน้าแรก (Home)': '<div style="font-size:19px;font-weight:800;margin-bottom:10px;">หน้าแรก (Home)</div><p style="margin:0;">หน้าแรกของเว็บไซต์ — จัดการ hero, ทรัพย์เด่น, แผนที่ทำเล และ section ต่างๆ ได้จาก Page Builder</p>',
};

const SLUG_BASE_MAP: Record<string, string> = {
  'ทำไมทำเลใกล้ท่าเรือจึงสำคัญต่อธุรกิจนำเข้า-ส่งออก': 'why-port-location-matters',
  'ขั้นตอนขอใบ ร.ง.4 ฉบับเข้าใจง่าย': 'ror-ngor-4-guide',
  'เช่าโรงงานขั้นต่ำกี่ปี?': 'faq-min-lease-term',
  'ใบอนุญาตนายหน้า (DBD)': 'cert-dbd-license',
  'หน้าแรก (Home)': 'home',
};

/* Fallback only. The real list is built from the categories already in use for
   the kind being edited — this array was seven names carried over from the
   design prototype, so the dropdown offered categories nothing used and could
   not offer the nine the FAQ actually runs on. */
const CAT_FALLBACK = ['EEC & โลจิสติกส์', 'ใบอนุญาต', 'การลงทุน', 'สัญญา', 'เทคนิค', 'หน้าหลัก', 'ใบรับรอง'];

const CAT_MENU_MAX = 300;

/* Where the category menu goes. The field sits at the bottom of a tall editor,
   so opening downwards put the list below the fold on a short window — flip it
   above when there is more room there, and never let it start off-screen. */
function placeMenu(r: DOMRect): { top: number; left: number; width: number; maxHeight: number } {
  const margin = 8;
  const below = window.innerHeight - r.bottom - margin;
  const above = r.top - margin;
  const flip = below < 160 && above > below;
  const maxHeight = Math.max(120, Math.min(CAT_MENU_MAX, flip ? above : below));
  const width = Math.max(r.width, 240);
  return {
    top: flip ? Math.max(margin, r.top - maxHeight - 6) : r.bottom + 6,
    left: Math.max(margin, Math.min(r.left, window.innerWidth - width - margin)),
    width,
    maxHeight,
  };
}
const LINK_CHOICES = ['→ บริการ: ปรึกษาฟรี', '→ พื้นที่: ชลบุรี', '→ ทรัพย์: โกดังให้เช่า', '→ บทความ: ขอ ร.ง.4'];

const tbi = (p: string) => ({ __html: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">' + p + '</svg>' });
type TbItem = { divider: true } | { btn: true; icon: { __html: string } };
const TOOLBAR: TbItem[] = [
  { btn: true, icon: tbi('<path d="M6 4h8a4 4 0 010 8H6zM6 12h9a4 4 0 010 8H6z"></path>') },
  { btn: true, icon: tbi('<path d="M19 4h-9M14 20H5M15 4L9 20"></path>') },
  { btn: true, icon: tbi('<path d="M4 7V4h16v3M9 20h6M12 4v16"></path>') },
  { divider: true },
  { btn: true, icon: tbi('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>') },
  { btn: true, icon: tbi('<path d="M10 6h11M10 12h11M10 18h11M4 6v4M4 6l-1 1M4 18h-1"></path>') },
  { divider: true },
  { btn: true, icon: tbi('<path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"></path><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"></path>') },
  { btn: true, icon: tbi('<rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path>') },
  { btn: true, icon: tbi('<rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M9 21V9"></path>') },
  { divider: true },
  { btn: true, icon: tbi('<path d="M4 7V4h16v3M9 20h6M12 4v16"></path>') },
];

const stStyle = (bg: string, fg: string): React.CSSProperties => ({ height: 19, padding: '0 8px', borderRadius: 9999, background: bg, color: fg, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center' });
const langCodeStyle = (on: boolean): React.CSSProperties => ({ height: 17, padding: '0 6px', borderRadius: 5, fontSize: '9.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', background: on ? '#E8F3EC' : '#F0EEE9', color: on ? '#0D6C3B' : '#9B968D' });

/* GET /api/cms item */
type ApiArticle = {
  id: string; kind: string; slug: string; title: string; category: string;
  status: string; cover: string | null; links: string[]; body: string;
  /* what is stored for each language. `title`/`body` above are the Thai
     record; the editor must read from here or every tab shows Thai. */
  blocks?: Record<string, { title: string; body: string }>;
  langs: Lang[]; updatedAt: number;
};

const relDate = (ms: number) => {
  const d = Math.floor((Date.now() - ms) / 86400000);
  if (d < 1) return 'วันนี้';
  if (d === 1) return 'เมื่อวาน';
  if (d < 30) return `${d} วัน`;
  return `${Math.floor(d / 30)} เดือน`;
};

const apiToArticle = (a: ApiArticle): Article => ({
  title: a.title,
  status: a.status === 'published' ? 'เผยแพร่' : 'ร่าง',
  statusK: a.status === 'published' ? 'pub' : 'draft',
  cat: a.category || '—',
  date: relDate(a.updatedAt),
  langs: a.langs?.length === 3 ? a.langs : L1,
});

export function CMSBody() {
  const [type, setType] = React.useState('articles');
  const [selected, setSelected] = React.useState(0);
  const [lang, setLang] = React.useState('th');
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const [pubOverride, setPubOverride] = React.useState<Record<number, boolean>>({});
  const [catOpen, setCatOpen] = React.useState(false);
  /* the menu is inside a card with overflow:hidden, so it was clipped — it is
     positioned against the trigger's screen rect instead of the card */
  const catRef = React.useRef<HTMLDivElement | null>(null);
  const [catRect, setCatRect] = React.useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const [catAdding, setCatAdding] = React.useState(false);
  const [catNew, setCatNew] = React.useState('');
  const [catVal, setCatVal] = React.useState<string | null>(null);
  const [cover, setCover] = React.useState(false);
  const [addLinkOpen, setAddLinkOpen] = React.useState(false);
  /* the "+" beside the search box had a pointer cursor and no handler, and the
     search box had no state — both looked live and did nothing */
  const [newOpen, setNewOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newSlug, setNewSlug] = React.useState('');
  const [newErr, setNewErr] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [pendingSelectId, setPendingSelectId] = React.useState<string | null>(null);
  const [delOpen, setDelOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [slugEdit, setSlugEdit] = React.useState(false);
  const [slugDraft, setSlugDraft] = React.useState('');
  const [links, setLinks] = React.useState<string[]>(['→ บริการ: หาทำเล', '→ พื้นที่: ระยอง']);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /* live content — GET /api/cms?kind=…; the ported demo set is the fallback */
  const [apiItems, setApiItems] = React.useState<ApiArticle[] | null>(null);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [saving, setSaving] = React.useState(false);
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftBody, setDraftBody] = React.useState('');
  const bodyRef = React.useRef<HTMLDivElement | null>(null);

  const reload = React.useCallback(async (kind: string) => {
    try {
      const r = await apiGet<{ items: ApiArticle[]; counts: Record<string, number> }>(`/api/cms?kind=${kind}`);
      setCounts(r.counts || {});
      setApiItems(Array.isArray(r.items) && r.items.length ? r.items : null);
      setSelected(0);
    } catch { setApiItems(null); }
  }, []);
  React.useEffect(() => { void reload(type); }, [type, reload]);

  /* the menu is placed from a rect measured when it opened, so anything that
     moves the field underneath it has to close it rather than let it drift */
  React.useEffect(() => {
    if (!catOpen) return;
    /* follow the field rather than close: scrolling a panel, or the menu's own
       list, would otherwise dismiss the thing the reader is trying to use */
    const reposition = () => {
      const r = catRef.current?.getBoundingClientRect();
      if (r) setCatRect(placeMenu(r));
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [catOpen]);

  /* select the record that was just created, once the reloaded list arrives */
  React.useEffect(() => {
    if (!pendingSelectId || !apiItems) return;
    const i = apiItems.findIndex((a) => a.id === pendingSelectId);
    if (i >= 0) setSelected(i);
    setPendingSelectId(null);
  }, [pendingSelectId, apiItems]);

  const flash = (msg: string, ms: number) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), ms);
  };

  const apiCur = apiItems?.[selected] ?? null;

  /* keep the editor fields in step with the selected record + language.
   *
   * Both fields used to be filled from the Thai record whatever tab was open,
   * so a translated entry looked untranslated — and saving from that tab wrote
   * the Thai text back over the translation. An empty box is the honest
   * answer for a language nobody has written yet. */
  React.useEffect(() => {
    if (!apiCur) return;
    const block = apiCur.blocks?.[lang];
    // older Thai rows keep the title in the column rather than in the block
    const thaiFallback = lang === 'th';
    setDraftTitle(block?.title || (thaiFallback ? apiCur.title : ''));
    setDraftBody(block?.body || (thaiFallback ? apiCur.body || '' : ''));
    setSlugEdit(false);
    setCatVal(null);
    setLinks(apiCur.links?.length ? apiCur.links : []);
    setCover(!!apiCur.cover);
  }, [apiCur, lang]);

  const persist = async (status?: 'draft' | 'published') => {
    if (!apiCur || saving) return;
    setSaving(true);
    try {
      const html = bodyRef.current?.innerHTML ?? draftBody;
      await apiPut(`/api/cms/${apiCur.id}`, {
        lang, title: draftTitle, body: html,
        category: catVal ?? apiCur.category, links,
        ...(status ? { status } : {}),
      });
      await reload(type);
      flash(status === 'published' ? 'เผยแพร่บทความแล้ว — ขึ้นบนเว็บทันที' : 'บันทึกร่างแล้ว', 2000);
    } catch (e) {
      flash(e instanceof ApiClientError ? e.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่', 2600);
    } finally {
      setSaving(false);
    }
  };
  const saveDraft = () => { if (apiCur) void persist(); else flash('บันทึกร่างแล้ว', 1800); };
  const doPublish = () => {
    if (apiCur) { void persist('published'); return; }
    setPubOverride((prev) => ({ ...prev, [selected]: true }));
    flash('เผยแพร่บทความแล้ว — ขึ้นบนเว็บทันที', 2000);
  };
  const openPreview = () => setPreviewOpen(true);
  const closePreview = () => setPreviewOpen(false);

  const deleteItem = async () => {
    if (!apiCur || deleting) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/cms/${apiCur.id}`);
      await reload(type);
      setDelOpen(false);
      /* reload() resets the selection to the first row, which is what we want:
         the record this panel was showing no longer exists */
      flash(`ลบ "${apiCur.title}" แล้ว`, 2400);
    } catch (e) {
      flash(e instanceof ApiClientError ? e.message : 'ลบไม่สำเร็จ กรุณาลองใหม่', 3000);
      setDelOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const saveSlug = async () => {
    if (!apiCur || saving) return;
    const next = slugDraft.trim();
    if (!next || next === apiCur.slug) { setSlugEdit(false); return; }
    setSaving(true);
    try {
      await apiPut(`/api/cms/${apiCur.id}`, { slug: next });
      await reload(type);
      setPendingSelectId(apiCur.id);
      setSlugEdit(false);
      flash('เปลี่ยน slug แล้ว — ลิงก์เดิมจะเปิดไม่ได้แล้ว', 2600);
    } catch (e) {
      flash(e instanceof ApiClientError ? e.message : 'เปลี่ยน slug ไม่สำเร็จ', 2600);
    } finally {
      setSaving(false);
    }
  };

  const createItem = async () => {
    const title = newTitle.trim();
    if (!title) { setNewErr('กรุณากรอกชื่อเรื่อง'); return; }
    if (creating) return;
    setCreating(true);
    setNewErr('');
    try {
      const created = await apiPost<{ id: string }>('/api/cms', {
        kind: type, title, slug: newSlug.trim(), category: catVal ?? '',
      });
      await reload(type);
      setNewOpen(false);
      setNewTitle('');
      setNewSlug('');
      setQuery('');
      /* land on the new record — reload() sorts by updatedAt so it is first,
         but find it by id rather than trusting that */
      setPendingSelectId(created?.id ?? null);
      flash('สร้างเนื้อหาใหม่แล้ว — ยังเป็นร่าง กด "เผยแพร่" เมื่อพร้อม', 2600);
    } catch (e) {
      setNewErr(e instanceof ApiClientError ? e.message : 'สร้างไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setCreating(false);
    }
  };

  const artData = apiItems ? apiItems.map(apiToArticle) : (DATA_BY_TYPE[type] || DATA_BY_TYPE.articles);
  const cur = artData[selected] || artData[0];

  /* search filters the rendered rows but selection still indexes the full
     list, so filtering never silently edits a different record */
  /* the categories this kind actually uses, plus whatever this record has —
     a record whose category was typed before is still selectable */
  const catOptions = React.useMemo(() => {
    const used = (apiItems ?? []).map((a) => (a.category || '').trim()).filter(Boolean);
    const merged = [...used, ...(catVal ? [catVal] : [])];
    const uniq = Array.from(new Set(merged)).sort((a, b) => a.localeCompare(b, 'th'));
    return uniq.length ? uniq : CAT_FALLBACK;
  }, [apiItems, catVal]);

  const openCatMenu = () => {
    if (catOpen) { setCatOpen(false); return; }
    const r = catRef.current?.getBoundingClientRect();
    if (r) setCatRect(placeMenu(r));
    setCatAdding(false);
    setCatNew('');
    setCatOpen(true);
  };

  const q = query.trim().toLowerCase();
  const visible = artData
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => !q || a.title.toLowerCase().includes(q) || a.cat.toLowerCase().includes(q));

  const langDefs = [
    { k: 'th', name: 'ไทย', flag: flagTh, done: true },
    { k: 'en', name: 'EN', flag: flagEn, done: cur.langs[1].on },
    { k: 'zh', name: '中文', flag: flagZh, done: cur.langs[2].on },
  ];
  const langTabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: '11px 11px 0 0', fontSize: 13,
    fontWeight: active ? 700 : 600, cursor: 'pointer', color: active ? 'var(--text)' : 'var(--muted2)',
    background: active ? 'var(--bg)' : 'transparent', border: '1px solid ' + (active ? 'var(--border)' : 'transparent'),
    borderBottom: active ? '1px solid var(--bg)' : 'none', marginBottom: -1,
  });

  const langName = ({ th: 'ไทย', en: 'English', zh: '中文' } as Record<string, string>)[lang];
  const curPub = pubOverride[selected] !== undefined ? pubOverride[selected] : cur.statusK === 'pub';
  const editorStatus = curPub ? 'เผยแพร่' : 'ร่าง';
  const editorStatusStyle: React.CSSProperties = curPub
    ? { height: 24, padding: '0 11px', borderRadius: 9999, background: '#E8F3EC', color: '#0D6C3B', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center' }
    : { height: 24, padding: '0 11px', borderRadius: 9999, background: '#FBF3E1', color: '#9A741C', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center' };

  const slugBase = apiCur?.slug || SLUG_BASE_MAP[cur.title] || 'content-' + (selected + 1);
  const seg = type === 'faq' ? 'faq' : type === 'certs' ? 'about' : type === 'pages' ? '' : 'useful-tips/';
  const slugMap: Record<string, string> = { th: '/th/' + seg + slugBase, en: '/en/' + seg + slugBase, zh: '/zh/' + seg + slugBase };
  const curSlug = slugMap[lang];

  // Titles are user data — escape before they go anywhere near an HTML string,
  // otherwise a title typed in the CMS becomes stored XSS on this page.
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
  const genericBody = '<div style="font-size:19px;font-weight:800;margin-bottom:10px;">' + esc(cur.title) + '</div><p style="margin:0 0 12px;color:#5F5A52;">เนื้อหาของ "' + esc(cur.title) + '" (' + esc(cur.cat) + ') — คลิกในพื้นที่นี้เพื่อแก้ไขด้วย rich text editor รองรับหัวข้อ ย่อหน้า รายการ ลิงก์ รูปภาพ และตาราง</p>';
  /* a record from the API shows exactly what is stored for this language —
     empty when nothing is, so the placeholder below can do its job */
  const curBody = apiCur ? draftBody : (BODY_MAP[cur.title] || genericBody);
  const bodyPlaceholder = `ยังไม่มีเนื้อหาภาษา${langName} — เริ่มพิมพ์เพื่อเพิ่ม`;
  const curCat = catVal || cur.cat;

  const actions = (
    <div id="cms-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* was a single "Page Builder" link — the one CMS screen that could
          delete sections, while the two that actually work had no way in */}
      <Link href="/admin/sections" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M4 4h16v16H4z" /><path d="M4 9h16M9 9v11" /></svg>จัดการ Section
      </Link>
      <Link href="/admin/media" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>คลังสื่อ
      </Link>
      <div onClick={openPreview} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>Preview
      </div>
      <div id="cms-publish-btn" onClick={doPublish} className="admin-primary-btn" style={{ height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer', transition: 'transform .2s,box-shadow .2s' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>Publish
      </div>
    </div>
  );

  return (
    <AdminShell active="cms" eyebrow="เนื้อหา / CMS" title="Content Manager" actions={actions} css={cmsCss}>
      {/* CONTENT TYPE TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TYPE_DEFS.map((t) => {
          const on = type === t.key;
          return (
            <div
              key={t.key}
              onClick={() => { setType(t.key); setSelected(0); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 9999, whiteSpace: 'nowrap', fontSize: 13, fontWeight: on ? 700 : 600, cursor: 'pointer', background: on ? '#273c33' : 'var(--surface)', color: on ? '#fff' : 'var(--muted)', border: '1px solid ' + (on ? '#273c33' : 'var(--border)') }}
            >
              <span dangerouslySetInnerHTML={{ __html: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="' + (on ? '#fff' : '#5F5A52') + '" stroke-width="1.9" style="margin-right:2px;">' + t.icon + '</svg>' }} />
              {t.label}
              <span style={{ height: 19, minWidth: 19, padding: '0 6px', borderRadius: 9999, background: on ? 'rgba(255,255,255,.18)' : 'var(--bg)', color: on ? '#fff' : 'var(--muted2)', fontSize: '10.5px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{counts[t.key] ?? t.count}</span>
            </div>
          );
        })}
      </div>

      <div id="cms-split" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* LIST */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', flex: 1 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input
                id="cms-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาบทความ"
                style={{ border: 0, outline: 'none', background: 'transparent', fontSize: '12.5px', color: 'var(--text)', flex: 1, minWidth: 0 }}
              />
            </div>
            <div
              id="cms-new-btn"
              title="เพิ่มเนื้อหาใหม่"
              onClick={() => { setNewErr(''); setNewOpen(true); }}
              style={{ width: 38, height: 38, borderRadius: 10, background: '#0D6C3B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
            </div>
          </div>
          <div className="a-scroll" style={{ maxHeight: 640, overflowY: 'auto' }}>
            {visible.map(({ a, i }) => (
              <div
                key={i}
                onClick={() => setSelected(i)}
                style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background .15s', background: i === selected ? 'var(--tint)' : 'transparent', borderLeft: '3px solid ' + (i === selected ? '#0D6C3B' : 'transparent') }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>{a.title}</div>
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={a.statusK === 'pub' ? stStyle('#E8F3EC', '#0D6C3B') : stStyle('#FBF3E1', '#9A741C')}>{a.status}</span>
                      <span style={{ fontSize: '10.5px', color: 'var(--muted3)' }}>{a.cat}</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {a.langs.map((l, li) => (
                    <span key={li} style={langCodeStyle(l.on)}>{l.k}</span>
                  ))}
                  <span style={{ marginLeft: 'auto', fontSize: '10.5px', color: 'var(--muted3)' }}>{a.date}</span>
                </div>
              </div>
            ))}
            {!visible.length && (
              <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: '12.5px', color: 'var(--muted3)' }}>
                ไม่พบเนื้อหาที่ตรงกับ &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* EDITOR */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* lang tabs */}
          <div style={{ padding: '16px 22px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {langDefs.map((l) => (
                <div key={l.k} data-lang-tab={l.k} onClick={() => setLang(l.k)} style={langTabStyle(lang === l.k)}>
                  <span style={{ width: 18, height: 18, borderRadius: 4, overflow: 'hidden', display: 'flex' }} dangerouslySetInnerHTML={{ __html: l.flag }} />
                  {l.name}
                  {l.done && <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#0D6C3B' }} />}
                  {!l.done && <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#D9A62B' }} />}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12 }}>
              <span style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>สถานะ:</span>
              <span style={editorStatusStyle}>{editorStatus}</span>
            </div>
          </div>

          {toast && (
            <div style={{ margin: '14px 22px 0', padding: '11px 15px', borderRadius: 11, background: '#E8F3EC', border: '1px solid #B6E0C4', display: 'flex', alignItems: 'center', gap: 9 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0D6C3B' }}>{toast}</span>
            </div>
          )}

          <div className="a-scroll" style={{ maxHeight: 640, overflowY: 'auto', padding: 22 }}>
            {/* title */}
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>หัวข้อ ({langName})</label>
            <input
              id="cms-title-input"
              value={apiCur ? draftTitle : cur.title}
              onChange={(e) => setDraftTitle(e.target.value)}
              readOnly={!apiCur}
              style={{ marginTop: 6, width: '100%', height: 48, padding: '0 16px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 16, fontWeight: 700, background: 'var(--bg)', outline: 'none' }}
            />
            {/* slug — "แก้" used to be decoration; the API had no way to change it */}
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 11, background: 'var(--tint)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--muted2)' }}>slug:</span>
                {slugEdit ? (
                  <input
                    id="cms-slug-input"
                    autoFocus
                    value={slugDraft}
                    onChange={(e) => setSlugDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void saveSlug(); if (e.key === 'Escape') setSlugEdit(false); }}
                    style={{ flex: 1, minWidth: 0, height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace", background: 'var(--surface)', outline: 'none' }}
                  />
                ) : (
                  <code style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{curSlug}</code>
                )}
                {slugEdit ? (
                  <>
                    <span id="cms-slug-save" onClick={() => void saveSlug()} style={{ fontSize: 11, color: '#0D6C3B', fontWeight: 700, cursor: 'pointer' }}>บันทึก</span>
                    <span onClick={() => setSlugEdit(false)} style={{ fontSize: 11, color: 'var(--muted2)', fontWeight: 700, cursor: 'pointer' }}>ยกเลิก</span>
                  </>
                ) : (
                  <span
                    id="cms-slug-edit"
                    onClick={() => { if (!apiCur) return; setSlugDraft(apiCur.slug); setSlugEdit(true); }}
                    style={{ fontSize: 11, color: apiCur ? '#0D6C3B' : 'var(--muted3)', fontWeight: 700, cursor: apiCur ? 'pointer' : 'default' }}
                  >แก้</span>
                )}
              </div>
              {slugEdit && (
                <div style={{ marginTop: 7, fontSize: '11px', color: '#9A741C', lineHeight: 1.5 }}>
                  เปลี่ยน slug แล้วลิงก์เดิมจะเปิดไม่ได้ — ถ้าเคยส่งลิงก์นี้ให้ใครหรือ Google เก็บไว้แล้ว ควรเปลี่ยนเฉพาะตอนที่ยังไม่เผยแพร่
                </div>
              )}
            </div>

            {/* rich text toolbar */}
            <div style={{ marginTop: 18, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexWrap: 'wrap' }}>
                {TOOLBAR.map((tb, i) =>
                  'divider' in tb ? (
                    <span key={i} style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
                  ) : (
                    <div key={i} className="cms-tb-btn" style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', cursor: 'pointer' }} dangerouslySetInnerHTML={tb.icon} />
                  )
                )}
              </div>
              {/* editable once the record comes from the API; the toolbar drives
                  document.execCommand on this contentEditable region */}
              <div
                ref={bodyRef}
                id="cms-body-edit"
                data-placeholder={bodyPlaceholder}
                key={`${apiCur?.id ?? 'demo'}-${lang}`}
                contentEditable={!!apiCur}
                suppressContentEditableWarning
                onBlur={() => setDraftBody(bodyRef.current?.innerHTML ?? '')}
                style={{ padding: '18px 20px', minHeight: 280, fontSize: 14, color: 'var(--text)', lineHeight: 1.8, outline: 'none' }}
                dangerouslySetInnerHTML={{ __html: curBody }}
              />
            </div>

            {/* meta row */}
            <div id="cms-meta-row" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>หมวดหมู่</label>
                <div ref={catRef} id="cms-cat-trigger" onClick={openCatMenu} style={{ marginTop: 6, height: 44, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{curCat}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="2.4" style={{ flexShrink: 0, transform: catOpen ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>รูปหน้าปก</label>
                {!cover ? (
                  <div onClick={() => setCover(true)} style={{ marginTop: 6, height: 44, padding: '0 14px', borderRadius: 11, border: '1.5px dashed var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '12.5px', color: 'var(--muted3)', cursor: 'pointer' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>อัปโหลด
                  </div>
                ) : (
                  <div style={{ marginTop: 6, height: 44, padding: '0 10px 0 14px', borderRadius: 11, border: '1px solid #B6E0C4', background: '#E8F3EC', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#0D6C3B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>cover-{slugBase}.jpg</span>
                    <div onClick={() => setCover(false)} style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0D6C3B' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* internal links + SEO note */}
            <div style={{ marginTop: 16, padding: '16px 18px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1" /><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" /></svg>ลิงก์ภายใน &amp; SEO
              </div>
              <div style={{ position: 'relative', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {links.map((lk, i) => (
                  <span key={i} style={{ height: 28, padding: '0 11px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '11.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {lk}
                    <span onClick={() => { const a = [...links]; a.splice(i, 1); setLinks(a); }} style={{ cursor: 'pointer', display: 'flex' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </span>
                  </span>
                ))}
                <span onClick={() => setAddLinkOpen(!addLinkOpen)} style={{ height: 28, padding: '0 11px', borderRadius: 9999, border: '1px dashed var(--border)', color: 'var(--muted2)', fontSize: '11.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>เพิ่มลิงก์
                </span>
                {addLinkOpen && (
                  <div style={{ position: 'absolute', top: 36, left: 0, zIndex: 30, width: 220, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 6 }}>
                    {LINK_CHOICES.map((c) => (
                      <div key={c} className="cms-linkchoice" onClick={() => { if (!links.includes(c)) { setLinks([...links, c]); setAddLinkOpen(false); } else { setAddLinkOpen(false); } }} style={{ padding: '9px 11px', borderRadius: 9, fontSize: '12.5px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>{c}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', rowGap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--muted3)', minWidth: 0 }}>บันทึกอัตโนมัติเมื่อ 2 นาทีที่แล้ว</span>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0, marginLeft: 'auto' }}>
              {apiCur && (
                <div
                  id="cms-delete-btn"
                  onClick={() => setDelOpen(true)}
                  style={{ height: 42, padding: '0 18px', borderRadius: 9999, border: '1.5px solid #E8C9C9', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#A32A2A', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A32A2A" strokeWidth="2.2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                  ลบ
                </div>
              )}
              <div onClick={saveDraft} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>บันทึกร่าง</div>
              <div onClick={doPublish} style={{ height: 42, padding: '0 24px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>เผยแพร่
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY MENU — rendered here, not beside its field.
          The editor card is overflow:hidden, which cut the list off; a fixed
          element positioned from the trigger's rect escapes that. */}
      {catOpen && catRect && (
        <>
          <div onClick={() => setCatOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 890 }} />
          <div
            id="cms-cat-menu"
            style={{ position: 'fixed', top: catRect.top, left: catRect.left, width: catRect.width, zIndex: 900, maxHeight: catRect.maxHeight, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 18px 40px rgba(0,0,0,.16)', padding: 6 }}
          >
            {catOptions.map((c) => {
              const activeC = curCat === c;
              return (
                <div key={c} onClick={() => { setCatVal(c); setCatOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 11px', borderRadius: 9, fontSize: '12.5px', fontWeight: activeC ? 700 : 600, cursor: 'pointer', color: activeC ? '#0D6C3B' : 'var(--text)', background: activeC ? 'rgba(13,108,59,.06)' : 'transparent' }}>
                  <span>{c}</span>
                  {activeC && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.6"><path d="M20 6L9 17l-5-5" /></svg>}
                </div>
              );
            })}

            <div style={{ margin: '6px 4px', height: 1, background: 'var(--border)' }} />

            {catAdding ? (
              <div style={{ display: 'flex', gap: 6, padding: '4px 5px' }}>
                <input
                  id="cms-cat-new"
                  autoFocus
                  value={catNew}
                  onChange={(e) => setCatNew(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && catNew.trim()) { setCatVal(catNew.trim()); setCatOpen(false); }
                    if (e.key === 'Escape') setCatAdding(false);
                  }}
                  placeholder="ชื่อหมวดใหม่"
                  style={{ flex: 1, minWidth: 0, height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '12.5px', background: 'var(--bg)', outline: 'none' }}
                />
                <div
                  id="cms-cat-new-ok"
                  onClick={() => { if (catNew.trim()) { setCatVal(catNew.trim()); setCatOpen(false); } }}
                  style={{ height: 34, padding: '0 12px', borderRadius: 8, background: '#0D6C3B', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >ใช้</div>
              </div>
            ) : (
              <div
                id="cms-cat-add"
                onClick={() => setCatAdding(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 11px', borderRadius: 9, fontSize: '12.5px', fontWeight: 700, color: '#0D6C3B', cursor: 'pointer' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M12 5v14M5 12h14" /></svg>
                เพิ่มหมวดใหม่
              </div>
            )}

            <div style={{ padding: '2px 11px 6px', fontSize: 11, color: 'var(--muted3)', lineHeight: 1.5 }}>
              หมวดจะถูกบันทึกเมื่อกด &ldquo;บันทึกร่าง&rdquo; หรือ &ldquo;เผยแพร่&rdquo;
            </div>
          </div>
        </>
      )}

      {/* DELETE CONFIRM — there was no way to remove content at all */}
      {delOpen && apiCur && (
        <div onClick={() => setDelOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 860, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: '26px 28px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>ลบเนื้อหานี้?</div>
            <p style={{ margin: '10px 0 0', fontSize: '13.5px', color: 'var(--text)', fontWeight: 700, lineHeight: 1.6, overflowWrap: 'anywhere' }}>{apiCur.title}</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted2)', fontFamily: "'JetBrains Mono',monospace", overflowWrap: 'anywhere' }}>{apiCur.slug}</p>
            <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12.5px', lineHeight: 1.6 }}>
              {apiCur.status === 'published'
                ? 'เนื้อหานี้เผยแพร่อยู่ — ลบแล้วจะหายจากเว็บทันที และลิงก์เดิมจะเปิดไม่ได้'
                : 'ลบแล้วเอากลับไม่ได้ ทั้งสามภาษาจะหายไปพร้อมกัน'}
            </div>
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <div onClick={() => setDelOpen(false)} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div id="cms-delete-confirm" onClick={() => void deleteItem()} style={{ height: 42, padding: '0 24px', borderRadius: 9999, background: deleting ? '#C98B8B' : '#A32A2A', color: '#fff', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, cursor: deleting ? 'default' : 'pointer' }}>
                {deleting ? 'กำลังลบ…' : 'ลบถาวร'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW ITEM MODAL — the "+" beside the search box */}
      {newOpen && (
        <div onClick={() => setNewOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 850, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', padding: '26px 28px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>
              เพิ่ม{TYPE_DEFS.find((t) => t.key === type)?.label ?? 'เนื้อหา'}ใหม่
            </div>
            <p style={{ margin: '6px 0 18px', fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>
              สร้างเป็นภาษาไทยก่อน แล้วค่อยสลับไปแท็บ EN / 中文 เพื่อใส่คำแปล
            </p>

            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>ชื่อเรื่อง (ไทย)</label>
            <input
              id="cms-new-title"
              autoFocus
              value={newTitle}
              onChange={(e) => { setNewTitle(e.target.value); if (newErr) setNewErr(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') void createItem(); }}
              placeholder={type === 'faq' ? 'เช่น ขอใบ ร.ง.4 ใช้เวลานานไหม?' : 'เช่น ขั้นตอนเช่าโรงงาน'}
              style={{ marginTop: 6, width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, fontWeight: 600, background: 'var(--bg)', outline: 'none' }}
            />

            <label style={{ marginTop: 14, display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
              slug (ไม่ใส่ก็ได้ — ระบบตั้งให้)
            </label>
            <input
              id="cms-new-slug"
              value={newSlug}
              onChange={(e) => { setNewSlug(e.target.value); if (newErr) setNewErr(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') void createItem(); }}
              placeholder="rg4-timeline"
              style={{ marginTop: 6, width: '100%', height: 46, padding: '0 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, fontFamily: "'JetBrains Mono',monospace", background: 'var(--bg)', outline: 'none' }}
            />

            {newErr && (
              <div id="cms-new-error" style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#FDECEC', color: '#A32A2A', fontSize: '12.5px', fontWeight: 600 }}>
                {newErr}
              </div>
            )}

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <div onClick={() => setNewOpen(false)} style={{ height: 42, padding: '0 20px', borderRadius: 9999, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}>ยกเลิก</div>
              <div id="cms-new-submit" onClick={() => void createItem()} style={{ height: 42, padding: '0 24px', borderRadius: 9999, background: creating ? '#6E8C7C' : '#0D6C3B', color: '#fff', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, cursor: creating ? 'default' : 'pointer' }}>
                {creating ? 'กำลังสร้าง…' : 'สร้าง'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewOpen && (
        <div onClick={closePreview} style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(2,14,8,.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)', borderRadius: 20, boxShadow: '0 40px 80px rgba(0,0,0,.4)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>ตัวอย่างบทความ ({langName})</span>
              </div>
              <div onClick={closePreview} style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </div>
            </div>
            <div id="cms-preview-body" className="a-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', color: 'var(--accent)', textTransform: 'uppercase' }}>EEC &amp; โลจิสติกส์</div>
              <h1 style={{ margin: '10px 0 8px', fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>{cur.title}</h1>
              <div style={{ fontSize: '12.5px', color: 'var(--muted3)', marginBottom: 20 }}>โดย JKP Property · เผยแพร่วันนี้</div>
              <div style={{ borderRadius: 14, overflow: 'hidden', height: 220, background: 'var(--tint)', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted3)' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text)' }}>การเลือกทำเลโรงงานหรือโกดังใกล้ท่าเรือช่วยลดต้นทุนโลจิสติกส์ได้อย่างมีนัยสำคัญ โดยเฉพาะธุรกิจที่ต้องนำเข้า–ส่งออกสินค้าเป็นประจำ</p>
              <h2 style={{ fontSize: 19, fontWeight: 800, margin: '22px 0 10px' }}>ข้อดีหลัก 3 ประการ</h2>
              <ul style={{ paddingLeft: 22, color: 'var(--muted)', lineHeight: 2 }}>
                <li>ลดค่าขนส่งตู้คอนเทนเนอร์</li>
                <li>ร่นเวลานำเข้า–ส่งออก</li>
                <li>เข้าถึงเขตปลอดอากร (Free Zone)</li>
              </ul>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <div onClick={closePreview} style={{ height: 40, padding: '0 22px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>ปิดตัวอย่าง</div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
