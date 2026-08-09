import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Property View · JKP CMS', robots: { index: false } };

/* Ported verbatim from AdminPropertyView.dc.html — property detail view:
   status strip, image gallery, spec table, features, translation status,
   linked-listings card, location, and recent history. Purely static
   (DCLogic only builds data arrays; no state/handlers). */

const si = (paths: React.ReactNode, color: string) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9">{paths}</svg>
);

const imgStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
function Photo({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} style={imgStyle} />
  );
}

const STATUS = [
  { label: 'สถานะ', value: 'เผยแพร่', valColor: '#0D6C3B', iconBg: '#E8F3EC', icon: si(<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />, '#0D6C3B') },
  { label: 'ประเภท', value: 'โกดัง', valColor: 'var(--text)', iconBg: '#EEF4F3', icon: si(<><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><path d="M7 21v-8h10v8" /></>, '#034956') },
  { label: 'พื้นที่รวม', value: '2,700 ตร.ม.', valColor: 'var(--text)', iconBg: '#EEF4F3', icon: si(<><path d="M3 3h18v18H3z" /><path d="M3 9h18M9 3v18" /></>, '#034956') },
  { label: 'อัปเดตล่าสุด', value: 'วันนี้ 09:20', valColor: 'var(--text)', iconBg: '#FBF3E1', icon: si(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, '#9A741C') },
];

const SPECS = [
  { k: 'รหัสทรัพย์', v: 'JKP-SPK0042' }, { k: 'ประเภท', v: 'โกดัง' },
  { k: 'พื้นที่ใช้สอย', v: '2,700 ตร.ม.' }, { k: 'ขนาดที่ดิน', v: '4 ไร่' },
  { k: 'ความสูงใต้อาคาร', v: '9 เมตร' }, { k: 'รับน้ำหนักพื้น', v: '3 ตัน/ตร.ม.' },
  { k: 'ระบบไฟฟ้า', v: '3 Phase 50/150A' }, { k: 'ขอ ร.ง.4', v: 'ได้' },
  { k: 'เขตโซน', v: 'เขตสีม่วง' }, { k: 'จังหวัด', v: 'สมุทรปราการ' },
];

const FEATURES = ['อาคารเดี่ยว', 'มีสำนักงานในตัว', 'พื้นที่ขนถ่ายยกพื้น', 'พนักงานรักษาความปลอดภัย', 'บนถนนสายหลัก'];

const flagTh = (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <rect width="24" height="24" fill="#F4F5F8" />
    <rect width="24" height="4.8" fill="#241B54" />
    <rect y="4.8" width="24" height="2.8" fill="#F4F5F8" />
    <rect y="7.6" width="24" height="8.8" fill="#A51931" />
    <rect y="16.4" width="24" height="2.8" fill="#F4F5F8" />
    <rect y="19.2" width="24" height="4.8" fill="#241B54" />
  </svg>
);
const flagEn = (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <rect width="24" height="24" fill="#012169" />
    <path d="M0 0L24 24M24 0L0 24" stroke="#fff" strokeWidth="3" />
    <path d="M12 0V24M0 12H24" stroke="#fff" strokeWidth="5" />
    <path d="M12 0V24M0 12H24" stroke="#C8102E" strokeWidth="2.4" />
  </svg>
);
const flagZh = (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <rect width="24" height="24" fill="#EE1C25" />
    <path d="M6 5l1 3 3-1-2 2.4 2 2.4-3-1-1 3-1-3-3 1 2-2.4-2-2.4 3 1z" fill="#FFDE00" />
  </svg>
);

const TRANS = [
  { name: 'ไทย', flag: flagTh, badge: 'ครบ' },
  { name: 'English', flag: flagEn, badge: 'ครบ' },
  { name: '中文', flag: flagZh, badge: 'ครบ' },
];

/* Reproduces the design's bd('#E8F3EC','#0D6C3B') call verbatim: it passes
   only 2 args to a 3-param helper (label, bg, fg), so bg=#0D6C3B and
   fg=undefined → the rendered badge has background #0D6C3B and no valid
   color (text inherits var(--text)). */
const badgeStyle: React.CSSProperties = { height: 22, padding: '0 10px', borderRadius: 9999, background: '#0D6C3B', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center' };

const LISTINGS = [
  { text: 'ให้เช่า · ฿405,000/ด.', status: 'เผยแพร่' },
  { text: 'ขาย · ฿62M', status: 'ร่าง' },
];

const HISTORY = [
  { text: 'แก้ราคาเช่า ฿405,000/ด.', time: 'วันนี้ 09:20 · สมชาย' },
  { text: 'เพิ่มรูป 3 รูป', time: 'เมื่อวาน · อารยา' },
  { text: 'เผยแพร่ประกาศให้เช่า', time: '2 วันก่อน · สมชาย' },
];

const pvCss = `
@media (max-width:1100px){ #pv-split{grid-template-columns:1fr !important;} #pv-side{position:static !important;} }
@media (max-width:640px){ #pv-spec-grid{grid-template-columns:1fr !important;} }
@media (max-width:480px){ #pv-gallery-grid{height:170px !important;gap:8px !important;} }
`;

/* AdminShell types eyebrow/title as `string`, but this design's header needs
   rich content (a breadcrumb link + a code chip). AdminShell renders them as
   ReactNode, so we pass elements and satisfy TS with a cast. */
const eyebrow = (
  <><Link href="/admin/properties" style={{ color: 'var(--muted2)' }}>Properties</Link> / รายละเอียด</>
);
const title = (
  <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>โกดังพร้อมสำนักงาน 2,700 ตร.ม. <code style={{ fontSize: 12, fontWeight: 700, color: '#0D6C3B', background: '#E8F3EC', padding: '2px 8px', borderRadius: 6, fontFamily: "'JetBrains Mono',monospace" }}>JKP-SPK0042</code></span>
);

const actions = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
    <Link href="/property" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', borderRadius: 9999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.9"><path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /></svg>ดูหน้าเว็บจริง
    </Link>
    <Link href="/admin/property-edit" className="admin-primary-btn" style={{ display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 18px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>แก้ไขทรัพย์
    </Link>
  </div>
);

export default function AdminPropertyViewPage() {
  return (
    <AdminShell active="properties" eyebrow={eyebrow as unknown as string} title={title as unknown as string} actions={actions} css={pvCss}>
      {/* STATUS STRIP */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        {STATUS.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '13px 16px', flex: 1, minWidth: 170 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--muted2)' }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.valColor }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div id="pv-split" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* GALLERY */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>รูปภาพ (12)</div>
              <span style={{ fontSize: 12, color: 'var(--muted2)' }}>รูปแรก = ปก · ลายน้ำเปิด</span>
            </div>
            <div id="pv-gallery-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, height: 240 }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--tint)', position: 'relative' }}>
                <Photo src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80" alt="ปก" />
                <span style={{ position: 'absolute', top: 8, left: 8, height: 20, padding: '0 8px', borderRadius: 9999, background: '#0D6C3B', color: '#fff', fontSize: '9.5px', fontWeight: 800, display: 'flex', alignItems: 'center' }}>ปก</span>
              </div>
              <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 10 }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--tint)' }}><Photo src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=70" alt="รูป" /></div>
                <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--tint)' }}><Photo src="https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&q=70" alt="รูป" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 10 }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--tint)' }}><Photo src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=70" alt="รูป" /></div>
                <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--tint)', position: 'relative' }}>
                  <Photo src="https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=400&q=70" alt="รูป" />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,29,14,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, fontWeight: 800 }}>+8</div>
                </div>
              </div>
            </div>
          </div>

          {/* SPEC TABLE */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>ข้อมูลทรัพย์ (Specs)</div>
            </div>
            <div id="pv-spec-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
              {SPECS.map((s) => (
                <div key={s.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{s.k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FEATURES */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>คุณสมบัติ</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {FEATURES.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 15px', borderRadius: 11, background: 'var(--tint)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0D6C3B" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TRANSLATIONS STATUS */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 26, height: 2, background: '#273c33', borderRadius: 2 }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>สถานะการแปล</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TRANS.map((t) => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'var(--bg)' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, overflow: 'hidden', display: 'flex', flexShrink: 0 }}>{t.flag}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t.name}</span>
                  <span style={badgeStyle}>{t.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDE COLUMN */}
        <div id="pv-side" style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'linear-gradient(135deg,#043F20 0%,#022310 100%)', borderRadius: 16, padding: 22, color: '#fff' }}>
            <div style={{ fontSize: '11.5px', color: '#8FE6B6' }}>ประกาศที่ผูกกับทรัพย์นี้</div>
            <div style={{ marginTop: 6, fontSize: 26, fontWeight: 800 }}>2 <span style={{ fontSize: 14, fontWeight: 600, color: '#C3FED5' }}>ประกาศ</span></div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LISTINGS.map((l) => (
                <Link key={l.text} href="/admin/listings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 13px', borderRadius: 11, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{l.text}</div>
                    <div style={{ fontSize: '10.5px', color: '#B9C2BD' }}>{l.status}</div>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2DFB91" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>ที่ตั้ง</div>
            <div style={{ borderRadius: 12, overflow: 'hidden', height: 150, background: 'var(--tint)', marginBottom: 12 }}>
              <Photo src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=70" alt="แผนที่" />
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6 }}>ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ<br /><span style={{ color: 'var(--muted3)' }}>แสดงระดับตำบล · ซ่อนพิกัดจริง</span></div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>ประวัติล่าสุด</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {HISTORY.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 9999, background: '#0D6C3B', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text)' }}>{h.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted3)' }}>{h.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
