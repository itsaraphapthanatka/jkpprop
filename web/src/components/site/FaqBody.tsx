'use client';

import { useState } from 'react';
import Link from '@/i18n/LocaleLink';
import { useDict } from '@/i18n/useDict';
import type { SectionCopy } from '@/lib/server/sectionCopy';
import type { FaqCategory } from '@/lib/server/faqCopy';

/* ============================================================
   Ported verbatim from FAQ.dc.html — hero, sticky category
   sidebar + search, 9 accordion categories, "still stuck" CTA.
   openMap keyed by `${catKey}-${i}`; search opens the first
   matching question and scrolls to its category. style-hover →
   the globals.css .dd-item helper is reused for sidebar links.
   ============================================================ */

type QA = [string, string];
interface CatDef { key: string; title: string; qs: QA[] }

/* fallback set — used until the team publishes FAQ entries in /admin/cms */
const FALLBACK_CATS: CatDef[] = [
  { key: 'basics', title: 'เริ่มต้นใช้งาน', qs: [
    ['สมัครใช้งานเว็บไซต์อย่างไร?', 'สมัครสมาชิกได้ฟรีผ่านปุ่ม "ติดต่อทีมงาน" หรือกรอกฟอร์มค้นหาทรัพย์ ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง'],
    ['ต้องเสียค่าใช้จ่ายในการค้นหาทรัพย์หรือไม่?', 'ไม่มีค่าใช้จ่ายในการค้นหาหรือปรึกษากับทีมงานของเรา'],
    ['มีบริการแปลเอกสารเป็นภาษาอังกฤษหรือจีนหรือไม่?', 'มี ทีมงานรองรับการสื่อสารและแปลเอกสารทั้งภาษาไทย อังกฤษ และจีน'],
  ] },
  { key: 'reg', title: 'ทำเลที่ตั้งและการวางผังเมือง', qs: [
    ['ทำเลใดเหมาะกับโรงงานที่ต้องขนส่งด่วน?', 'ทำเลใกล้สนามบินสุวรรณภูมิหรือดอนเมือง เหมาะกับสินค้าที่ต้องขนส่งทางอากาศและด่วน'],
    ['สีผังเมืองมีผลต่อการประกอบกิจการอย่างไร?', 'สีผังเมือง (ม่วง/เขียว ฯลฯ) กำหนดประเภทกิจการที่อนุญาต ควรตรวจสอบก่อนตัดสินใจเช่าหรือซื้อทุกครั้ง'],
    ['นิคมอุตสาหกรรมต่างจากพื้นที่ทั่วไปอย่างไร?', 'นิคมอุตสาหกรรมมีสิทธิประโยชน์ทางภาษีและระบบสาธารณูปโภคพร้อมใช้งาน เหมาะกับกิจการขนาดกลาง-ใหญ่'],
  ] },
  { key: 'docs', title: 'ใบอนุญาตและเอกสาร', qs: [
    ['ต้องใช้ใบอนุญาตอะไรก่อนเริ่มกิจการ?', 'ต้องขอใบอนุญาตประกอบกิจการโรงงาน (ร.ง.4) จากกรมโรงงานอุตสาหกรรมก่อนเริ่มดำเนินการ'],
    ['ทีมงานช่วยเรื่องเอกสารทางกฎหมายได้หรือไม่?', 'ทีมงานให้คำปรึกษาเบื้องต้นและประสานงานกับผู้เชี่ยวชาญด้านกฎหมายให้ตามความเหมาะสม'],
    ['ต้องทำ EIA หรือไม่?', 'กิจการบางประเภทที่มีผลกระทบต่อสิ่งแวดล้อมสูงต้องทำรายงาน EIA ก่อนขออนุญาตก่อสร้าง'],
  ] },
  { key: 'listing', title: 'การค้นหาและการเยี่ยมชมทรัพย์', qs: [
    ['สามารถนัดเข้าชมทรัพย์ได้อย่างไร?', 'กดปุ่ม "ดูรายละเอียด" ในทรัพย์ที่สนใจ แล้วติดต่อทีมงานเพื่อนัดเข้าชมตามวันเวลาที่สะดวก'],
    ['ทรัพย์ทั้งหมดผ่านการตรวจสอบหรือไม่?', 'ทรัพย์ทุกรายการผ่านการตรวจสอบเอกสารและสภาพจริงก่อนเผยแพร่บนเว็บไซต์'],
    ['ราคาที่แสดงรวมค่าใช้จ่ายอื่นหรือไม่?', 'ราคาที่แสดงเป็นราคาตั้งต้นจากเจ้าของทรัพย์ ไม่รวมค่าธรรมเนียมการโอนหรือค่าใช้จ่ายอื่นที่อาจเกิดขึ้น'],
  ] },
  { key: 'utilities', title: 'ความพร้อม ไฟฟ้า และแรงงาน', qs: [
    ['ทรัพย์ส่วนใหญ่มีระบบไฟฟ้า 3 เฟสหรือไม่?', 'โรงงานและโกดังส่วนใหญ่ในระบบมีไฟฟ้า 3 เฟสพร้อมใช้งาน ตรวจสอบรายละเอียดได้ในหน้าทรัพย์แต่ละรายการ'],
    ['พื้นที่รับน้ำหนักสูงสุดเท่าไหร่?', 'ขึ้นกับแต่ละทรัพย์ ตั้งแต่ 1-5 ตันต่อตารางเมตร ระบุไว้ในรายละเอียดทรัพย์'],
    ['มีแรงงานในพื้นที่ใกล้เคียงหรือไม่?', 'ทำเลส่วนใหญ่อยู่ใกล้ชุมชนและนิคมอุตสาหกรรมที่มีแรงงานพร้อมรองรับ'],
  ] },
  { key: 'contract', title: 'เงื่อนไขการเช่าและสัญญา', qs: [
    ['สัญญาเช่าขั้นต่ำกี่ปี?', 'โดยทั่วไปสัญญาเช่าขั้นต่ำ 3 ปี ขึ้นอยู่กับเงื่อนไขของเจ้าของทรัพย์แต่ละราย'],
    ['วางเงินประกันการเช่าเท่าไหร่?', 'ปกติวางประกัน 2-3 เดือน สามารถต่อรองได้ตามความเหมาะสม'],
    ['สามารถเช่าระยะสั้นกว่า 1 ปีได้หรือไม่?', 'ทรัพย์บางรายการรองรับสัญญาระยะสั้น กรุณาติดต่อทีมงานเพื่อตรวจสอบเงื่อนไขเฉพาะราย'],
  ] },
  { key: 'payment', title: 'ค่าใช้จ่าย ภาษี และการเงิน', qs: [
    ['การซื้อขายมีค่าธรรมเนียมโอนเท่าไหร่?', 'ค่าธรรมเนียมโอนอยู่ที่ประมาณ 2% ของราคาประเมิน ตามที่กรมที่ดินกำหนด'],
    ['สามารถขอสินเชื่อธนาคารสำหรับซื้อโรงงานได้หรือไม่?', 'ได้ ทีมงานสามารถแนะนำธนาคารพันธมิตรที่ให้บริการสินเชื่อสำหรับอสังหาริมทรัพย์อุตสาหกรรม'],
  ] },
  { key: 'maintain', title: 'ซ่อมบำรุงและการปรับปรุง', qs: [
    ['ใครรับผิดชอบค่าซ่อมบำรุงโครงสร้างหลัก?', 'โดยทั่วไปเจ้าของทรัพย์รับผิดชอบโครงสร้างหลัก ผู้เช่ารับผิดชอบการใช้งานประจำวัน ระบุในสัญญาเช่า'],
    ['สามารถปรับปรุงพื้นที่ภายในได้หรือไม่?', 'ได้ ตามเงื่อนไขที่ตกลงกับเจ้าของทรัพย์ก่อนเริ่มดำเนินการปรับปรุง'],
  ] },
  { key: 'insurance', title: 'การประกันภัยและการบริหารความเสี่ยง', qs: [
    ['ควรทำประกันภัยโรงงานหรือไม่?', 'แนะนำให้ทำประกันอัคคีภัยและความเสี่ยงภัยทุกชนิดเพื่อคุ้มครองทรัพย์สินและเครื่องจักร'],
    ['ผู้เช่าต้องทำประกันภัยเองหรือไม่?', 'ขึ้นกับเงื่อนไขสัญญา ส่วนใหญ่ผู้เช่าต้องทำประกันความรับผิดต่อบุคคลที่สาม'],
  ] },
];

export function FaqBody({ cats, copy }: { cats?: FaqCategory[]; copy: SectionCopy }) {
  const d = useDict();
  const pick = (v: string, fallback: string) => v || fallback;
  const CATS = cats && cats.length ? cats : FALLBACK_CATS;
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggle = (k: string) => setOpenMap((m) => ({ ...m, [k]: !m[k] }));

  const doSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    for (const cat of CATS) {
      const idx = cat.qs.findIndex(([question]) => question.toLowerCase().includes(q));
      if (idx > -1) {
        const k = cat.key + '-' + idx;
        setOpenMap((m) => ({ ...m, [k]: true }));
        setTimeout(() => {
          const el = document.getElementById(cat.key);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
        return;
      }
    }
  };

  return (
    <>
      {/* HERO */}
      <section style={{ position: 'relative', height: '220px' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderBottomRightRadius: '72px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={copy.img || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&q=80"} alt={d.faq.heroAlt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(2,29,14,.82) 0%,rgba(2,29,14,.5) 55%,rgba(2,29,14,.28) 100%)', pointerEvents: 'none', borderBottomRightRadius: '72px' }} />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1320px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '34px', fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>{pick(copy.headline, d.faq.hero)}</h1>
          <p style={{ margin: '10px 0 0', fontSize: '14.5px', color: '#E8FFF0', maxWidth: '520px' }}>{pick(copy.sub, d.faq.heroSub)}</p>
        </div>
      </section>

      {/* BREADCRUMB */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted2)' }}>
        <Link href="/" style={{ color: 'var(--muted2)' }}>{d.common.home}</Link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted3)" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{d.faq.hero}</span>
      </div>

      {/* LAYOUT */}
      <div id="faq-layout" style={{ maxWidth: '1320px', margin: '0 auto', padding: '20px 24px 80px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 28, alignItems: 'start' }}>
        {/* SIDEBAR */}
        <aside id="faq-sidebar" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: 20, position: 'sticky', top: 96 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>{d.faq.categories}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder={d.faq.searchPlaceholder}
              style={{ flex: 1, height: 42, padding: '0 14px', borderRadius: 9999, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)', outline: 'none', minWidth: 0 }}
            />
            <div onClick={doSearch} style={{ width: 42, height: 42, borderRadius: 9999, background: '#034956', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {CATS.map((c) => (
              <a key={c.key} className="dd-item" href={'#' + c.key} style={{ display: 'block', padding: '9px 10px', borderRadius: 9, fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{c.title}</a>
            ))}
          </div>
        </aside>

        {/* CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 34, minWidth: 0 }}>
          {/* MOBILE search + category quick-jump (shown ≤980 when the sidebar is hidden) */}
          <div id="faq-mobilebar" style={{ display: 'none', flexDirection: 'column', gap: 12, marginBottom: -12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder={d.faq.searchPlaceholder}
                style={{ flex: 1, height: 46, padding: '0 16px', borderRadius: 9999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, color: 'var(--text)', outline: 'none', minWidth: 0 }}
              />
              <div onClick={doSearch} style={{ width: 46, height: 46, borderRadius: 9999, background: '#034956', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              </div>
            </div>
            <div className="no-sb" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, minWidth: 0 }}>
              {CATS.map((c) => (
                <a key={c.key} href={'#' + c.key} style={{ flexShrink: 0, height: 34, padding: '0 14px', borderRadius: 9999, background: 'var(--tint)', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{c.title}</a>
              ))}
            </div>
          </div>

          {CATS.map((cat) => (
            <div key={cat.key} id={cat.key}>
              <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{cat.title}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cat.qs.map(([question, answer], i) => {
                  const k = cat.key + '-' + i;
                  const open = !!openMap[k];
                  return (
                    <div key={k} style={{ borderRadius: 14, overflow: 'hidden', background: open ? '#273c33' : 'var(--surface)', border: '1px solid ' + (open ? '#273c33' : 'var(--border)') }}>
                      <button
                        type="button"
                        onClick={() => toggle(k)}
                        aria-expanded={open}
                        aria-controls={`faq-a-${k}`}
                        style={{ width: '100%', textAlign: 'start', font: 'inherit', background: 'transparent', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '16px 18px', cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: '14.5px', fontWeight: 600, color: open ? '#fff' : 'var(--text)' }}>{question}</div>
                        <div style={{ width: 26, height: 26, borderRadius: 9999, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: open ? '#2DFB91' : 'var(--tint)', color: open ? '#022310' : 'var(--accent)', transition: 'all .2s' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="2.6">
                            <path d="M5 12h14" />
                            <path d="M12 5v14" style={{ transition: 'transform .2s', transform: open ? 'scaleY(0)' : 'scaleY(1)', transformOrigin: 'center' }} />
                          </svg>
                        </div>
                      </button>
                      {/* Always in the HTML, hidden with CSS when collapsed.
                          Rendering it only on click meant the answers never
                          reached the server response, so a crawler — and any
                          AI reading the page — saw the questions and none of
                          the answers, on a page whose whole job is answering. */}
                      <div
                        id={`faq-a-${k}`}
                        hidden={!open}
                        style={{ padding: '0 18px 20px', fontSize: '13.5px', color: '#D8DED9', lineHeight: 1.85 }}
                      >
                          {/* the CMS body is markup; it arrives sanitised from faqCopy,
                              so paragraphs and lists render instead of showing their tags */}
                          <div dangerouslySetInnerHTML={{ __html: answer }} />
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                if (navigator.clipboard) navigator.clipboard.writeText(question);
                              } catch {
                                /* noop */
                              }
                            }}
                            style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#8FE6B6', cursor: 'pointer' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" /></svg>
                              แชร์
                            </div>
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CTA */}
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, background: 'linear-gradient(120deg,#043F20 0%,#022310 100%)', padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{d.faq.stillStuck}</div>
              <div style={{ marginTop: 4, fontSize: '13.5px', color: '#C3FED5' }}>{d.faq.stillStuckSub}</div>
            </div>
            <Link href="/contact" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px', borderRadius: 9999, background: '#2DFB91', color: '#022310', fontSize: '14.5px', fontWeight: 800, flexShrink: 0 }}>
              ติดต่อทีมงาน
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#022310" strokeWidth="2.6"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
