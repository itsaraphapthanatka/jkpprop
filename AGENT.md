# AGENT.md — Working Guide (JKP Property / Industrial Property Platform)

**master orientation file** สำหรับคน/AI ที่เข้ามาทำงานต่อ — รวมภาพรวมธุรกิจ, ขอบเขต, แหล่งอ้างอิงจริงในโปรเจกต์, กฎการตัดสินใจ และข้อห้ามหลัก ไว้ที่เดียว. อ่านไฟล์นี้ก่อนเริ่มงานเสมอ

---

## 1. Project context
โปรเจกต์นี้คือการสร้างเว็บไซต์/แพลตฟอร์มของธุรกิจ **industrial property brokerage** (นายหน้าโรงงาน/โกดัง เช่า-ขาย) — ประกอบด้วย **public website + admin/CMS** ที่รองรับ public discovery, requirement intake, CRM/brokerage workflow, multilingual SEO/GEO

มองเป็น **platform** ไม่ใช่แค่หน้าเว็บ: ถ้าตัดสินใจจากมุม "หน้าตา" อย่างเดียวโดยไม่ผูกกับ object model / routing / CRM / discoverability จะเจอข้อจำกัดเดิม **แต่** ปลายทางด้าน UI ต้อง **ตรงกับดีไซน์ที่อนุมัติแล้ว** (ดู §4)

## 2. Core business model
ไม่ใช่ e-commerce self-checkout แต่เป็น **broker-assisted search & transaction flow** — public site มีหน้าที่: สร้าง trust แบรนด์/ทีม · ช่วยค้นหา inventory · เปลี่ยนความสนใจเป็น lead/requirement คุณภาพ · ส่งต่อเข้าสู่ shortlist → visit → negotiation → deal

## 3. Repo & source of truth (ไฟล์จริงในโปรเจกต์ตอนนี้)

> เอกสารรุ่นเก่า `01–16`, `07/08/09`, `DESIGN_SYSTEM_PROMPT.md`, screenshot และ `green-brand-*` **ถูกลบออกแล้ว** — ห้ามอ้างอิง. ใช้ไฟล์ด้านล่างนี้เท่านั้น

| ไฟล์ / โฟลเดอร์ | คืออะไร | ใช้ตอนไหน |
|---|---|---|
| **`design/`** (แตกจาก Design ของ JKP.zip) | **ดีไซน์จริง** — `*.dc.html` ทุกหน้า (pixel-level), `Design System.dc.html` + `CLAUDE.md` (tokens), `assets/` (โลโก้/แผนที่), `uploads/` (รูป/screenshot) | ทุกครั้งที่ทำ UI — เป็น **pixel source of truth** |
| **`DESIGN.md`** | design authority: token ค่าจริง + หลักการ + สเปกคอมโพเนนต์ (self-contained) | ก่อนทำ component/หน้าใดๆ |
| **`SPEC_PACK.md`** | requirement/functional spec + flow + UML + sequence + ER (Part 1–6) | เรื่อง behavior / data / state machine |
| **`FRONTEND_API_SPEC.md`** | สัญญาข้อมูล frontend ↔ API + **RBAC ฉบับที่ใช้จริง (§12)** | ตอนต่อ API / เรื่องสิทธิ์ |
| **`web/BACKEND.md`** | schema · endpoint ทั้งหมด · กฎที่บังคับฝั่ง server | ตอนแก้ backend |
| **`JKP_Property_Handoff.md`** | ภาพรวม screen ทุกหน้า + flow + สรุป token | ทำความเข้าใจโครงระบบ/ลำดับ section |
| **`HOME_HANDOFF_CHECKLIST.md`** | สิ่งที่ต้องเติมเพื่อทำ Home ให้ 100% | ตอนทำหน้า Home |
| **`README.md`** | โครงสร้าง repo จริง + วิธีรัน + สถานะ | ทั่วไป |

**ลำดับความสำคัญเมื่อขัดกัน:** requirement/behavior → `SPEC_PACK.md` · pixel/visual → `design/` (แล้ว `DESIGN.md`) · ภาพรวม → `JKP_Property_Handoff.md`

> ⚠️ **ข้อยกเว้นเรื่อง RBAC** — `SPEC_PACK.md` §5 เขียนไว้ 6 บทบาท (`super_admin`…)
> ซึ่ง**เลิกใช้แล้ว** ระบบจริงใช้ **7 บทบาท × ขอบเขตข้อมูล × สิทธิ์พิเศษ**
> (`owner, manager, agent, co_agent, ops, marketing, translator`)
> ตัวจริงอยู่ที่ `web/src/lib/rbac.ts` · อธิบายที่ `FRONTEND_API_SPEC.md` §12

## 4. Design fidelity stance (สำคัญ — เคยเข้าใจผิด)
- เป้าหมายคือ **reproduce ดีไซน์ใน `design/*.dc.html` ให้ตรง (faithful / pixel-close)** — ดีไซน์นี้คือแบรนด์ที่ลูกค้าอนุมัติแล้ว
- "ห้าม clone pixel-perfect" ที่เคยเขียนไว้ = ห้าม clone **เว็บเก่า legacy (thaiindustrialproperty)** — **ไม่ใช่** ห้ามลอกดีไซน์ใหม่
- ยึด token จาก `DESIGN.md`/`design/Design System.dc.html` เสมอ — ห้ามคิดสี/ฟอนต์/radius/spacing นอกลิสต์
- ทิศทางสี = **green-first** (ตรงกับดีไซน์จริงที่เป็นเขียว) — gold เป็น accent เฉพาะจุด ไม่ใช่ CTA

## 5. Non-negotiable product principles
1. ออกแบบเป็น **platform** ไม่ใช่ brochure
2. Listing / detail / requirement / CRM linkage = business core
3. SEO/GEO/multilingual = โครงสร้าง ไม่ใช่ layer เสริม
4. ทุก public surface พาไป conversion/next-step ที่มีเหตุผล
5. ทุก admin surface สะท้อน workflow จริง ไม่ใช่ CRUD เปล่า
6. **UI ต้องตรงดีไซน์ + ใช้ token เดียวกัน** (brand consistency)

## 6. Information architecture mindset
เริ่มจากถามว่า page อยู่ family ไหน + มีหน้าที่อะไร ก่อนลงมือ:
Brand & trust · Discovery & listing · Detail & comparison · Lead intake & conversion · Content & GEO · Utility/system-state · Admin/operations — **architecture มาก่อน composition**

## 7. Listing & detail rules
- listing search = discovery system ไม่ใช่ผลลัพธ์จากฟอร์ม
- แยก search state indexable vs non-indexable ชัด (คุม faceted noise)
- `zone_type` เป็น taxonomy/filter dimension จริง ไม่ใช่แค่ badge
- detail page = canonical object surface ของ listing + เป็น source of truth ให้ SEO/inquiry/related/CRM handoff
- **ซ่อนพิกัดจริง**: ไม่ส่ง lat/long เมื่อ `map_visibility ≠ exact`

## 8. Lead & conversion rules
- แยกชัด: contact inquiry · listing-bound inquiry · requirement intake
- ทุก conversion path ต่อเข้าสู่ CRM object/workflow ได้
- empty search / no-fit → พาไป requirement flow (ไม่ dead-end)
- contact channel มี context enrichment (เช่น property code) ไม่ใช่ลิงก์ลอย

## 9. SEO / taxonomy / GEO rules
- ทุก public object มี canonical URL ชัด · multilingual = locale-first (`/th /en /zh`)
- area/service pages = discoverability asset จริง · คุม search-page indexing policy
- llms.txt + AI-readable layer เป็น requirement (ตัวอย่างอยู่ `design/assets/`)

## 10. Design-system rules
1. เปิด `design/Design System.dc.html` (หรือ `DESIGN.md` §2) ดู token ค่าจริง
2. เปิดไฟล์ `design/<Page>.dc.html` ของหน้านั้น ดู layout/spacing/copy ระดับ pixel
3. ประกอบด้วย token + สเปกคอมโพเนนต์จาก `DESIGN.md` — ห้าม hardcode ค่านอกลิสต์
4. ตรวจว่าหน้าใหม่ support system role จริง + **ตรงดีไซน์**

## 11. Admin / product UI mindset
admin = **workflow-first product UI** ใน brand family เดียวกับ public (ใช้ token เดียวกันแต่ compact):
- เน้น clarity + task flow · ทำ object workspace ชัด (lead/listing/shortlist/visit/negotiation/deal)
- ออกแบบ state/transition/permission ก่อน visual polish · admin เป็นภาษาไทยภาษาเดียว (นอก `[locale]`)

## 12. Decision fallback (เมื่อเอกสารไม่ตอบตรงๆ)
1. behavior/data/สิทธิ์/สถานะ → `SPEC_PACK.md`
2. หน้าตา/ค่า pixel → `design/<Page>.dc.html` แล้ว `DESIGN.md`
3. ภาพรวม screen/flow → `JKP_Property_Handoff.md`
4. ถ้ายังต้องเลือก → เลือกสิ่งที่ support platform architecture + ตรงดีไซน์ ก่อน aesthetic เดาเอง — **อย่าด้นสด**

## 12.5 การทดสอบ
- แผนและทีม tester อยู่ที่ `TEST_PLAN.md` และ `.claude/agents/tester-*.md`
- ก่อน push: `npx tsc --noEmit && npx eslint src && npm test && npm run build && npx playwright test`
- หลัง deploy ทุกครั้ง: `tester-release` (image ตรง commit · migration ขึ้น · กวาด vhost · ดิสก์/แรม)

## 13. Common failure modes to avoid
- มองเป็น web redesign แทน platform (หรือกลับกัน: ทำ platform จนลืมทำ UI ให้ตรงดีไซน์)
- ทำหน้า public โดยไม่แตะ listing/detail/lead object logic
- ทำ SEO patchwork โดยไม่ normalize route/canonical/taxonomy
- คิดสี/radius/spacing เอง แทนใช้ token จาก `design/`/`DESIGN.md`
- ทำ admin เป็น CRUD table ก่อนกำหนด workflow/state/permission
- ใช้ gold เป็น CTA · ใช้ neon green เป็นตัวอักษร/ปุ่มบนพื้นสว่าง
- อ้างอิงไฟล์ที่ถูกลบแล้ว (01–16 / 07/08/09 / green-brand-*)
