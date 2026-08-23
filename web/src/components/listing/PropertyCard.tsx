'use client';

/* The card a property is shown as, wherever it is shown.
 *
 * There were three of these: one on the listing page, one in the home-page
 * carousel, and one under "อสังหาริมทรัพย์ที่คล้ายกัน" on a property page that
 * had drifted into a different card altogether — no photo count, no type, a
 * plain line of text where the others have a button, and stretched to the full
 * width of the page whenever there was only one of them. Same card now.
 *
 * แถวเลื่อนในหน้าแรกยังเป็นการ์ดของตัวเองอยู่ (components/home/Featured.tsx)
 * เพราะขนาดกับตัวอักษรคนละชุด — แก้พฤติกรรมที่นี่แล้วต้องไปดูอีกใบด้วยทุกครั้ง
 * (คลิกทั้งใบกับป้าย "ไม่ว่าง" เคยหลุดไปแล้วทั้งสองอย่าง)
 */
import { useState } from 'react';
import Link from '@/i18n/LocaleLink';
import { useI18n } from '@/i18n/useDict';
import { enumLabel } from '@/i18n/enums';
import { PhotoPlaceholder } from '@/components/common/PhotoPlaceholder';
import { ZoneDot } from '@/components/common/ZoneDot';

export type CardListing = {
  code: string;
  deal: string;
  photos: string;
  title: string;
  loc: string;
  price: string;
  img: string | null;
  type: string;
  area: string;
  /* สไลด์ · "เพิ่ม Tag ใน card เหมือนหน้า detail" — พื้นที่สีตามผังเมืองขึ้นเป็น
     แท็กบนรูปใหญ่ในหน้ารายละเอียดมาตลอด แต่การ์ดไม่เคยมี ทั้งที่เป็นข้อมูลที่
     คนหาโรงงานคัดออกตั้งแต่ตอนกวาดตาดูรายการ ไม่ใช่ตอนเปิดเข้าไปอ่าน
     ค่าดิบ (ไม่ใช่ป้ายที่แปลแล้ว) เพราะต้องใช้เป็นคีย์เทียบสีด้วย */
  zoning?: string;
  /* โซนอุตสาหกรรม (กนอ. · Free Zone · DG) — คนละอย่างกับพื้นที่สีผังเมือง
     และเป็นตัวคัดออกอันดับต้น ๆ ของคนหาโรงงาน แต่การ์ดไม่เคยแสดง ทั้งที่
     หน้ารายละเอียดขึ้นเป็นป้ายบนรูปใหญ่และตัวกรองก็ใช้ค่านี้ */
  zone?: string[];
  /** ปล่อยว่างไว้ได้ในการ์ดที่ยังไม่รู้สถานะ — ถือว่าว่างตามเดิม */
  available?: boolean;
};

export function PropertyCard({ it, favFill, onToggleFav }: {
  it: CardListing;
  /** omitted where there is no heart to draw — the related row has none */
  favFill?: string;
  onToggleFav?: () => void;
}) {
  const { d, locale } = useI18n();
  const [hover, setHover] = useState(false);
  const [favHover, setFavHover] = useState(false);
  const [detailHover, setDetailHover] = useState(false);

  return (
    <div
      data-card={it.code}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'var(--surface)',
        border: '1px solid ' + (hover ? 'var(--accent)' : 'var(--border)'),
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: hover ? '0 20px 40px rgba(var(--ink-rgb),.14)' : '0 1px 3px rgba(0,0,0,.05)',
        transform: hover ? 'translateY(-6px)' : 'none',
        transition: 'transform .28s cubic-bezier(.2,.7,.3,1),box-shadow .28s,border-color .28s',
      }}
    >
      {/* ลูกค้าแจ้งว่า "คลิกที่รูปภาพ ข้อความ หรือการ์ด ต้องเข้าได้ ตอนนี้ต้องคลิก
          ที่รายละเอียดอย่างเดียว" — ลิงก์ใบนี้คลุมทั้งการ์ดไว้ข้างหลัง ปุ่มหัวใจ
          กับปุ่มดูรายละเอียดวางทับอยู่ด้านบนจึงยังกดแยกได้ตามเดิม */}
      <Link
        href={`/property/${encodeURIComponent(it.code)}`}
        aria-label={it.title}
        data-card-link
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
      />
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transition: 'transform .5s cubic-bezier(.2,.7,.3,1)', transform: hover ? 'scale(1.07)' : 'none' }}>
          {it.img
            ? /* eslint-disable-next-line @next/next/no-img-element */
              <img src={it.img} alt={it.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <PhotoPlaceholder />}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(var(--ink-rgb),.24) 0%,rgba(var(--ink-rgb),0) 34%,rgba(var(--ink-rgb),0) 62%,rgba(var(--ink-rgb),.38) 100%)', pointerEvents: 'none' }} />
        {it.deal && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 11px', borderRadius: 9999, background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.42)', color: '#fff', fontSize: '11.5px', fontWeight: 700, pointerEvents: 'none', backdropFilter: 'blur(6px)' }}>
            <span style={{ width: 5, height: 5, borderRadius: 9999, background: '#fff' }} />
            {enumLabel(it.deal, locale)}
          </div>
        )}
        {/* ทรัพย์ที่ทีมทำเครื่องหมายว่าไม่ว่าง — เดิมหน้าเว็บโฆษณาว่าว่างเหมือนกันหมด */}
        {it.available === false && (
          <div
            data-taken
            style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', height: 26, padding: '0 11px', borderRadius: 9999, background: 'rgba(var(--ink-rgb),.78)', color: '#fff', fontSize: '11.5px', fontWeight: 700, pointerEvents: 'none', backdropFilter: 'blur(6px)' }}
          >
            {d.listing.taken}
          </div>
        )}
        {onToggleFav && <div
          onClick={onToggleFav}
          onMouseEnter={() => setFavHover(true)}
          onMouseLeave={() => setFavHover(false)}
          data-fav
          data-on={favFill === 'none' ? '0' : '1'}
          style={{ position: 'absolute', zIndex: 2, top: 10, right: 10, width: 30, height: 30, borderRadius: 9999, background: 'var(--neon)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.14)', transition: 'transform .2s', transform: favHover ? 'scale(1.12)' : 'none' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={favFill} stroke="var(--ink)" strokeWidth="2">
            <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
          </svg>
        </div>}
        <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', borderRadius: 6, background: 'rgba(var(--ink-rgb),.6)', color: '#fff', fontSize: '10.5px', fontWeight: 600, pointerEvents: 'none', backdropFilter: 'blur(3px)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="M21 15l-5-4-4 3" />
          </svg>
          {it.photos}
        </div>
      </div>
      <div style={{ padding: '16px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(var(--accent-rgb),.05)', borderTop: '1px solid rgba(var(--accent-rgb),.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--muted2)', letterSpacing: '.04em' }}>{it.code}</span>
          <span style={{ width: 3, height: 3, borderRadius: 9999, background: 'var(--border)' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 9px', borderRadius: 6, background: 'var(--tint)', color: 'var(--accent)', fontSize: '10.5px', fontWeight: 600 }}>{enumLabel(it.type, locale)}</span>
        </div>
        {/* แท็กพื้นที่สี ชุดเดียวกับที่หน้ารายละเอียดใช้ (components/property/Gallery.tsx)
            อยู่คนละบรรทัดเพราะชื่อเต็มอย่าง "พื้นที่สีเขียว — ชนบท/เกษตรกรรม" ยาว
            เกินกว่าจะต่อท้ายรหัสกับประเภทได้ในการ์ดกว้าง 400px */}
        {!!it.zone?.length && (
          <div style={{ marginTop: 7, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {it.zone.map((z) => (
              <span
                key={z} data-card-zone={z} title={enumLabel(z, locale)}
                style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 10px', borderRadius: 6, background: 'rgba(var(--accent-rgb),.1)', color: 'var(--accent)', fontSize: '10.5px', fontWeight: 700 }}
              >{enumLabel(z, locale)}</span>
            ))}
          </div>
        )}
        {it.zoning && (
          <div style={{ marginTop: 7 }}>
            <span
              data-card-zoning={it.zoning}
              title={enumLabel(it.zoning, locale)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%', height: 22, padding: '0 10px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '10.5px', fontWeight: 600 }}
            >
              <ZoneDot value={it.zoning} size={11} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{enumLabel(it.zoning, locale)}</span>
            </span>
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: '15.5px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4, minHeight: 44 }}>{it.title}</div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7974" strokeWidth="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {it.loc}
        </div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A7974" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
          {d.listing.totalArea} {it.area}
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted3)', fontWeight: 500 }}>{d.common.price}</div>
            <div style={{ marginTop: 2, fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-.01em' }}>{it.price}</div>
          </div>
          <Link
            href={`/property/${encodeURIComponent(it.code)}`}
            onMouseEnter={() => setDetailHover(true)}
            onMouseLeave={() => setDetailHover(false)}
            style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 9999, background: detailHover ? 'var(--pine)' : 'var(--surface)', border: '1px solid var(--pine)', color: detailHover ? '#fff' : 'var(--pine)', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .2s' }}
          >
            {d.common.viewDetail}
          </Link>
        </div>
      </div>
    </div>
  );
}

