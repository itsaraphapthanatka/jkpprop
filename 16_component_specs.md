# 16 Component Specs — Anatomy / Variants / States (v1)

เอกสารนี้เป็น **detailed component specification** ต่อยอดจาก [11_component_inventory.md] (ซึ่งเป็นรายชื่อ + บทบาท) โดยลงรายละเอียด **anatomy (โครงย่อย), variants, states, token bindings, accessibility และ responsive behavior** ต่อ component เพื่อให้ design library และ code implementation ตรงกัน [code_file:540][code_file:585].

ทุก token ที่อ้างถึงมาจาก [08_design_tokens_normalized_green_revision_full.md](08_design_tokens_normalized_green_revision_full.md) (canonical) และไฟล์ implementation `green-brand-tokens.json` / `green-brand-tailwind.config.js` / `green-brand.css` / `green-brand-theme.tsx`.

## วิธีอ่านเอกสารนี้

แต่ละ component สเปกด้วยโครงเดียวกัน:
- **Anatomy** — โครงย่อยที่ประกอบเป็น component
- **Variants** — รูปแบบที่ตั้งใจให้มี (ไม่ใช่ ad hoc)
- **Sizes** — ขนาดมาตรฐาน (ถ้ามี)
- **States** — resting / hover / active / focus / disabled / loading / error ตามที่เกี่ยวข้อง
- **Tokens** — token ที่ผูกจริง
- **A11y** — keyboard, ARIA, contrast, touch target
- **Responsive** — พฤติกรรมข้าม breakpoint

### กฎร่วมทุก component (global)

- **Focus:** ทุก interactive element ต้องมี focus ring ที่มองเห็น — control บนพื้นอ่อนใช้ `state.focus.ring`; ปุ่ม/พื้น brand ใช้ `state.focus.ringContrast` (มี white offset)
- **Touch target:** ≥ 44×44px บน mobile (`FR` accessibility / [DESIGN.md] §16)
- **Motion:** transition ใช้ `motion.duration.base` (180ms) + `easing.standard` เว้นระบุเป็นอื่น; เคารพ `prefers-reduced-motion` (ตัด transform/motion เหลือ opacity)
- **Disabled:** `state.disabled.opacity` (0.48) + `cursor: not-allowed` + ตัด pointer events; ปุ่ม disabled ใช้ `action.disabled.bg`/`action.disabled.text`
- **สี text:** ห้ามใช้สี series/brand-vivid กับข้อความ — ใช้ text token เสมอ (ดู §2.6 neon rules)
- **RTL:** ระบบเป็น th/en/zh (LTR ทั้งหมด) — ไม่ต้องรองรับ RTL ใน v1

---

# ส่วน A — Foundational primitives

## A1. Button

ปุ่ม action หลักของทั้งระบบ [file:483][file:484][11 §1.2].

**Anatomy:** `[ leadingIcon? ][ label ][ trailingIcon? ]` — บน container ที่มี height/padding/radius ตาม size; icon ใช้ Lucide ตาม `icon.size` ที่ match ขนาดปุ่ม

**Variants**

| Variant | bg | text | border | ใช้เมื่อ |
|---|---|---|---|---|
| `primary` | `action.primary.bg` #0D6C3B | #FFFFFF | none | action หลัก 1 ตัว/บริบท (ส่งฟอร์ม, สอบถาม) |
| `secondary` | `action.secondary.bg` #128449 | #FFFFFF | none | action รองที่ยังสำคัญ |
| `outline` | transparent | `brand.600` | `border.brand` | action คู่กับ primary |
| `ghost` | transparent | `text.primary` | none | action ในพื้นที่แน่น/toolbar |
| `danger` | `status.error.solid` #C02626 | #FFFFFF | none | destructive (ลบ, unpublish) |
| `link` | none | `brand.700` | none (underline on hover) | inline action |

**Sizes:** `sm` h32 / padX16 / font.sm · `md` h40 / padX20 / font.md (default) · `lg` h48 / padX24 / font.md — radius ทุกขนาด = `radius.md` (8px), weight `semibold`

**States**

| State | การเปลี่ยน |
|---|---|
| hover | primary → `action.primary.bgHover` #09582F; ghost/outline → พื้น `state.hover.overlay` |
| active | primary → `action.primary.bgActive` #043F20 |
| focus-visible | `state.focus.ringContrast` (primary/secondary/danger) / `state.focus.ring` (outline/ghost) |
| disabled | `action.disabled.bg` #ECE8E1 + `action.disabled.text` #A6A29A |
| loading | spinner แทน leadingIcon, label คงอยู่, ปุ่มถูก disable, width ไม่กระโดด |

**A11y:** ใช้ `<button>` จริง; icon-only ต้องมี `aria-label` (ดู A3); loading ใส่ `aria-busy="true"`; danger ที่ทำลายข้อมูลควรผ่าน `ModalDialog` ยืนยันก่อน
**Responsive:** ปุ่มหลักบน mobile มัก full-width; กลุ่มปุ่มเรียงเป็น stack เมื่อ < `sm`

## A2. Link / LinkButton

**Anatomy:** ข้อความ + underline (optional) + trailing icon (external/chevron)
**Variants:** `inline` (ใน prose, สี `brand.700`, underline) · `standalone` (nav/CTA-lite, ไม่ underline จน hover) · `linkButton` (หน้าตาปุ่มแต่ render เป็น `<a>` สำหรับ navigation)
**States:** hover → `brand.800` + underline; visited ไม่เปลี่ยนสี (utility context); focus → `state.focus.ring`
**A11y:** ใช้ `<a href>` สำหรับ navigation, `<button>` สำหรับ action — ห้ามสลับ; external link ใส่ `rel="noopener"` + ไอคอนบ่งชี้

## A3. IconButton

**Anatomy:** icon (Lucide) กึ่งกลางใน hit-area สี่เหลี่ยม
**Sizes:** sm 32×32 (icon 16) · md 40×40 (icon 20) · lg 48×48 (icon 24)
**Variants:** `ghost` (default) · `outline` · `solid` (brand)
**States:** เหมือน Button; hover = `state.hover.overlay`
**A11y (บังคับ):** ต้องมี `aria-label` เสมอ (ไม่มี text); ควรมี `Tooltip` (A21) กำกับ; touch target ≥44px แม้ visual จะเล็กกว่า (ใช้ padding ขยาย hit-area)

## A4. TextInput

**Anatomy:** `[ label ][ optional hint ][ field: leadingIcon? + input + trailingIcon?/clear ][ helper / error text ]`

**Sizes:** `md` h40 (default) · `lg` h48 — padX `input.padding.x` 16px, radius `radius.md`, bg #FFFFFF, border `border.default`

**States**

| State | การเปลี่ยน |
|---|---|
| resting | border `border.default` #C9C5BD |
| hover | border `border.brand` เข้มขึ้นเล็กน้อย |
| focus | border `brand.primary` + `input.focusRing` (`state.focus.ring`) |
| filled | ค่าปกติ, text `text.primary` |
| error | border `status.error.solid` + `input.error.ring` + error text ด้านล่าง (`status.error.text`, font.sm) |
| disabled | bg `input.disabled.bg` #F3F0EC + text `text.muted` |
| readonly | ไม่มี border interactive, bg เท่า surface |

**A11y:** `<label for>` ผูก id เสมอ (ไม่ใช้ placeholder แทน label — [DESIGN.md] §16); error ผูกด้วย `aria-describedby` + `aria-invalid="true"`; placeholder เป็นตัวอย่างเท่านั้น
**Responsive:** label อยู่บน field เสมอ (ไม่ inline) เพื่อ mobile readability

## A5. Textarea

เหมือน A4 แต่ multi-line — min-height 96px, resize vertical only, character counter (optional, มุมขวาล่าง, `text.muted` / เปลี่ยนเป็น `status.warning.text` เมื่อใกล้ limit)

## A6. SelectInput

**Anatomy:** trigger (เหมือน TextInput + chevron ขวา) → popover list (z `z.dropdown`)
**States:** เพิ่ม `open` (chevron หมุน, border brand); option: hover `state.hover.overlay`, selected `state.selected.overlay` + check icon
**A11y:** ใช้ native `<select>` เมื่อทำได้ (mobile UX ดีสุด); custom ต้องรองรับ arrow keys, type-ahead, `role="listbox"`/`option`, `aria-expanded`
**Note:** สำหรับ dataset ยาว/ค้นหาได้ ใช้ **Combobox (A7)** แทน

## A7. Combobox (searchable picker)

ใช้กับ province/district, industrial estate, listing picker, user picker [11 §1.2]
**Anatomy:** input (พิมพ์กรอง) + popover result list + empty state ("ไม่พบ…") + (optional) async loading row
**States:** typing (debounce 200–300ms), loading (skeleton rows), no-match (empty), selected (chip หรือ filled text)
**A11y:** `role="combobox"` + `aria-autocomplete="list"` + `aria-activedescendant`; ประกาศจำนวนผลลัพธ์ผ่าน live region

## A8. Checkbox / A9. RadioGroup / A10. Toggle

**Checkbox:** box 18px, radius `radius.xs`, checked = `brand.primary` bg + white check (Lucide `check`); indeterminate = dash; label ขวา
**RadioGroup:** circle 18px, selected = ring brand + dot; หนึ่งค่าในกลุ่ม
**Toggle (switch):** track 40×22 → checked bg `brand.primary`, knob ขาวเลื่อน; ใช้กับ boolean ทันที (featured, license possible) [FR-SRC-01]
**Shared states:** hover overlay, focus ring, disabled 0.48, error (กลุ่ม required) → helper `status.error.text`
**A11y:** native input + label ผูก; group ใช้ `<fieldset><legend>`; toggle ใช้ `role="switch"` + `aria-checked`

## A11. DateInput / DateRangeInput

**Anatomy:** input (รูปแบบ `DD MMM YYYY` ตาม locale) + calendar popover (z `z.dropdown`)
**Variants:** single · range (visit dates, filter, move-in) [FR-VIS/INQ]
**States:** invalid (นอกช่วงที่อนุญาต เช่น move-in < วันนี้ → error), disabled dates (เทา + ตัด click)
**A11y:** พิมพ์ได้ (ไม่บังคับ mouse), calendar navigable ด้วย keyboard, ประกาศวันที่เลือกผ่าน live region

## A12. NumberRangeInput

คู่ min–max (size, budget) — validate `min ≤ max` ทันที (client) [FR-SRC-01, FR-INQ-04]; normalize comma/space ก่อน validate; error inline เมื่อ min > max

## A13. Badge / A14. StatusChip

**Badge:** label สั้น, h22, padX8, radius `radius.sm`, font.xs medium — ใช้กับ type/zone/featured/photo-count [file:457]
**Variants (สี):** neutral (surface.muted + text.secondary) · brand (`brandSubtle` + `brand.700`) · status (ใช้ status subtle+text ตาม §2.5: success/warning/error/info) · **zone** (taxonomy — สีเฉพาะแต่ไม่แย่ง brand gold→green; ดู §2.6 ห้ามใช้ neon เป็น text)
**StatusChip:** badge เชิง workflow state (lead/listing/shortlist/visit/deal status) — สี map จาก state → status token; รูปทรง = badge + จุดสีนำหน้า (dot) เพื่อไม่พึ่งสีอย่างเดียว
**A11y:** state ต้องสื่อด้วย **ข้อความ** ไม่ใช่สีอย่างเดียว (dot/label ประกอบ)

## A15. Tabs

**Anatomy:** tablist (แถบ) + indicator (2px `brand.primary` ใต้ active) + panels
**Variants:** `underline` (default) · `enclosed` (admin dense) · `segmented` (2–3 ตัวเลือกสั้น เช่น rent/sale/both)
**States:** active (text `brand.primary` + indicator), hover (`text.primary`), disabled, focus ring
**A11y:** `role="tablist"/"tab"/"tabpanel"`, arrow-key navigation, `aria-selected`
**Responsive:** เกินความกว้าง → scroll แนวนอน (ไม่ wrap) พร้อม fade edge

## A16. Accordion

FAQ, filter sections [file:460]
**Anatomy:** header (button + chevron) + collapsible panel
**States:** collapsed/expanded (chevron หมุน 180°, animate height), hover overlay, focus ring
**A11y:** header เป็น `<button aria-expanded>`; panel `role="region"` ผูก `aria-labelledby`

## A17. Table (admin dense)

**Anatomy:** header row (`table.header.bg`, font.sm semibold) + body rows (h48) + optional selection col + row actions + footer (pagination)
**Variants:** `default` · `selectable` (checkbox col + BulkActionBar) · `compact` (h40)
**States:** row hover (`state.hover.overlay`), selected (`state.selected.overlay`), sortable header (arrow), loading (skeleton rows), empty (→ EmptyState A19)
**Tokens:** `table.*` (§12.6)
**A11y:** `<table>` semantics จริง, `<th scope>`, sortable header ใช้ `aria-sort`; sticky header เมื่อ scroll
**Responsive:** < `md` → เปลี่ยนเป็น stacked cards หรือ horizontal scroll ภายใน container (ไม่ให้ page scroll แนวนอน)

## A18. Pagination

public listings + admin lists [FR-SRC-03]
**Anatomy:** prev + page numbers (+ ellipsis) + next; หรือ compact "หน้า X จาก Y"
**States:** current (bg `brand.primary` + white), hover overlay, disabled (prev ที่หน้า 1)
**A11y:** `<nav aria-label>`, current มี `aria-current="page"`; ผูกกับ query string `page` (deep-linkable)

## A19. EmptyState

no-results / no-data [FR-SRC-06, file:457]
**Anatomy:** icon/illustration (subtle) + heading + description + primary action(s)
**Variants:** `search-empty` (→ ปุ่ม "ล้างตัวกรอง" + "ส่งความต้องการ" → requirement) · `data-empty` (admin, → ปุ่มสร้างใหม่) · `error` (→ ลองใหม่)
**Rule:** ต้อง intentional + มีทางไปต่อเสมอ (ไม่ปล่อย dead-end) — search-empty ต้องพาเข้าสู่ requirement flow

## A20. Toast / A22. AlertBanner / InlineError

**Toast:** ephemeral, มุมจอ, z `z.toast`, auto-dismiss 4–6s (persist ได้ถ้ามี action), maxWidth 380 — variant ตาม status (success/error/info/warning) + icon + label
**AlertBanner:** inline ในหน้า (policy/notice/warning), variant status, dismissible optional
**InlineError:** ข้อความใต้ field, `status.error.text`, font.sm — คู่กับ `aria-describedby`
**A11y:** toast/alert ใช้ `role="status"` (polite) หรือ `role="alert"` (assertive สำหรับ error); ห้ามพึ่งสีอย่างเดียว — มี icon + ข้อความ

## A21. Tooltip

**Anatomy:** trigger + floating bubble (bg `#28251D`, text ขาว, radius `radius.sm`, font.xs, z `z.tooltip`)
**States:** show on hover (delay ~300ms) + focus (keyboard); hide on blur/esc
**A11y:** ผูก `aria-describedby`; **ห้าม**ใส่ข้อมูลสำคัญที่มีแค่ใน tooltip (mobile ไม่มี hover) — เป็น enhancement เท่านั้น

## A23. Skeleton / Loading

**Variants:** `SkeletonBlock` (สี่เหลี่ยม shimmer), `SkeletonText` (บรรทัด), skeleton rows ใน table/card
**Rule:** ใช้ shimmer subtle (surface.muted → surface.alt), เคารพ reduced-motion (เปลี่ยนเป็น static)

## A24. ModalDialog / A25. DrawerSheet

**ModalDialog:** center, radius `radius.xl`, pad `space.6`, shadow.lg, z `z.modal` + scrim `scrim.overlay`
- variants: `confirm` · `destructive` (danger button) · `form` · `choose`
- states: enter/exit (fade + scale 0.98→1, 180ms)
**DrawerSheet:** slide-over จากขวา (desktop) / ล่าง (mobile bottom-sheet), z `z.drawer` — ใช้กับ mobile filters, quick-edit
**A11y (ทั้งคู่):** focus trap, `role="dialog" aria-modal="true"`, ปิดด้วย Esc + click scrim, คืน focus ให้ trigger เมื่อปิด, `aria-labelledby` ที่ title

## A26. Breadcrumbs

**Anatomy:** `Home › Section › … › current` — current ไม่ใช่ลิงก์
**Rule:** ต้องอิง canonical route hierarchy เดียวกับ BreadcrumbList schema [file:459][file:462][FR-GEO-02]
**A11y:** `<nav aria-label="breadcrumb">` + `aria-current="page"` ที่ตัวสุดท้าย
**Responsive:** mobile ย่อเป็น "‹ Back" หรือ truncate ช่วงกลางด้วย ellipsis

## A27. DefinitionList / KeyValueGrid

แสดง specs/attributes [file:459, FR-LST-01]
**Anatomy:** คู่ label (`text.secondary`, font.sm) + value (`text.primary`) — grid 2 คอลัมน์ (desktop) / stack (mobile); แถวที่ value เป็น null **ไม่แสดง** (ไม่โชว์ "-")

---

# ส่วน B — Shared composites (public)

## B1. ListingCard ⭐ (component สำคัญที่สุด)

การ์ดทรัพย์ ใช้ทั้ง search results, featured, related, shortlist [file:457][FR-SRC-08]

**Anatomy (ลำดับตายตัว):**
```
[ image (cover, aspect ~4:3) ]
   ├─ badgeRow (บนซ้าย: type / zone · บนขวา: featured)
   └─ photoCount (ล่างขวา, ไอคอน + จำนวน)
[ body ]
   ├─ publicCode  (JKP… — font.mono/xs, text.muted)
   ├─ title       (font.md semibold, 2 บรรทัด clamp)
   ├─ location    (ไอคอน pin + ระดับที่อนุญาต, text.secondary, font.sm)
   ├─ specHints   (ขนาด/พื้นที่ — KeyValueGrid ย่อ, font.sm)
   └─ priceBlock  (PriceDisplay — B2)
[ footer? ] (compare checkbox / view button)
```

**Variants:** `default` (grid) · `compact` (related/shortlist, ซ่อน specHints) · `horizontal` (list view desktop, image ซ้าย) · `skeleton`
**States:** resting (`card.shadow` sm, border subtle) · hover (`card.hover.shadow` md + ยกเล็กน้อย) · focus-within (ring) · selected-for-compare (border brand + check) · **unavailable** (overlay จาง + label "ไม่ว่างแล้ว" — สำหรับ shortlist client view, edge case §6.1)
**Tokens:** `card.*`; ราคาไม่ใช้สี vivid; badge ตาม A13
**A11y:** ทั้งการ์ด clickable → ใช้ลิงก์ครอบ title + `aria-label` รวม; compare checkbox เป็น control แยก (ไม่ซ้อน click); รูปมี `alt`
**Responsive:** grid 1 col (xs) → 2 (sm) → 3 (lg) → 4 (xl); `layout.grid.gap`

## B2. PriceDisplay

รองรับ rent / sale / dual (`both`) [FR-SRC-09, file:457]
**Anatomy:** primary price (เด่น, font.lg semibold) + unit ("/เดือน" สำหรับเช่า) + secondary price (dual) + null → "ติดต่อสอบถาม"
**Logic:** ยึด transaction context จาก query — filter `rent` → เน้นค่าเช่า; `sale` → เน้นราคาขาย; ไม่มี filter → แสดงทั้งคู่ชัด
**Format:** คั่นหลักพัน + `฿` (เช่น `฿250,000 /เดือน`, `฿45,000,000`)

## B3. SearchModule / QuickSearch (signature component)

gateway หลักของ platform — ไม่ใช่แค่ฟอร์ม [file:480][DESIGN.md §8]
**Anatomy:** type select + transaction segmented + province combobox + (submit) → route ไป `/listing?...`; hero variant มี chips/shortcuts ใต้ช่องค้นหา
**Variants:** `hero` (ใหญ่บน homepage, card ยกพื้น shadow.md) · `inline` (บน listing toolbar) · `compact` (header)
**States:** default, focused (border brand), submitting
**A11y:** เป็น `<form>` จริง submit ได้ด้วย Enter; แต่ละ control มี label
**Responsive:** hero — desktop เรียงแนวนอน, mobile stack เต็มความกว้าง แต่ยังเด่น (ห้ามยุบเป็นแค่ปุ่ม)

## B4. FilterSidebar / FilterBottomSheet / FilterGroup

[FR-SRC-01, file:495/496]
**FilterGroup:** section (title + collapsible + controls) — reuse Accordion (A16)
**FilterSidebar:** desktop, sticky ซ้าย, ประกอบ FilterGroup หลายตัว (type, transaction, location cascade, estate, size range, budget range, license toggle, keyword)
**FilterBottomSheet:** mobile, เปิดจากปุ่ม "ตัวกรอง" → DrawerSheet (ล่าง) + ปุ่ม "ดูผล (N)" ตรึงล่าง
**States:** filter ที่เลือก → chip ใน FilterSummaryBar + "ล้างทั้งหมด"; ทุกการเปลี่ยน → อัปเดต URL query ทันที (FR-SRC-04)
**Cascade:** province → district (disabled จนเลือก province) → subdistrict
**A11y:** mobile sheet = dialog (focus trap); result count ประกาศผ่าน live region
**Responsive:** desktop sidebar ↔ mobile bottom-sheet (breakpoint `lg`)

## B5. CompareBar / CompareTable

สูงสุด 4 (session-based) [FR-SRC-07]
**CompareBar:** แถบลอยล่าง แสดง thumbnail รายการที่เลือก + ปุ่ม "เปรียบเทียบ" + ล้าง; ตัวที่ 5 → toast แจ้ง
**CompareTable:** ตาราง spec-ต่อ-spec, column ต่อ listing, sticky spec labels ซ้าย
**A11y:** live region ประกาศจำนวนที่เลือก; remove ต่อรายการมี aria-label

## B6. ListingGallery

[file:459, FR-LST-01]
**Anatomy:** main image + thumbnail strip + lightbox (fullscreen, z `z.modal`) + counter
**States:** loading (skeleton), lightbox open (focus trap, keyboard ←→ Esc), zoom
**A11y:** ทุกภาพมี alt; lightbox = dialog; keyboard navigable
**Responsive:** desktop cover ใหญ่ + thumbs ข้าง; mobile swipe carousel

## B7. MapCard

เคารพ `map_visibility_level` (FR-LST-02) — **critical privacy**
**Variants ตาม level:** `exact` (หมุดจริง — เฉพาะเมื่ออนุญาต) · `subdistrict/district/province` (วงพื้นที่ ไม่มีหมุด + ข้อความระดับพื้นที่) — **API ต้องไม่ส่ง lat/long จริง** ในกรณีหลัง
**A11y:** มี text summary เสมอ (ไม่พึ่งแผนที่อย่างเดียว)

## B8. InquiryForm / ListingInquiryForm / RequirementWizard

[FR-INQ, file:458]
**InquiryForm:** name✓, email/phone (≥1), message✓, listing binding (prefill), consent note → `POST /public/inquiries`
**ListingInquiryForm:** เหมือนข้างบน + `PrefilledContextSummary` (title/code ของ listing) + ส่ง `listing_ids`
**RequirementWizard:** 3 steps (ความต้องการ / บริษัท / ผู้ติดต่อ) + WizardStepNav (progress) + WizardReviewStep + ServerValidationSummary
**States:** per-field validation (client → server FR-INQ-04), submitting, success (thank-you), rate-limited (429 → ข้อความสุภาพ)
**Tokens:** input.* + input.error.*; ปุ่ม submit = primary
**A11y:** label ผูกทุก field; error summary โฟกัสได้ + ลิงก์ไป field; step ประกาศ "ขั้น X จาก 3"
**Responsive:** wizard step เต็มจอ mobile; sticky inquiry (detail) → desktop sidebar / mobile sticky bottom CTA

## B9. ContactChannelGroup

phone / Line / WeChat / WhatsApp / email [FR-PUB-04, file:458]
**Anatomy:** ปุ่ม/ลิงก์ต่อช่องทาง + icon + label; แต่ละอันเป็น event action (track ได้)
**A11y:** aria-label ชัด ("โทร 02-...", "แชท LINE"); ไม่ใช้ icon เปล่า

## B10. Breadcrumb-driven content shells

`PublicPageShell` (nav multilingual + footer + language switcher) · `AppShell` (admin sidebar + header) · `SectionWrapper` / `ContentContainer` (ใช้ `layout.container.*`) · `SplitPanel` (2-col detail/admin)
**Note:** เป็น layout primitives — bind กับ `layout.*` tokens; ดู [10_information_architecture.md] สำหรับ nav model

---

# ส่วน C — Admin / workflow components (compose จาก A + B)

Admin components (LeadTable, ShortlistBuilder, VisitPlanner, NegotiationCase, PublishReadinessChecklist ฯลฯ [11 §4–7]) **ประกอบขึ้นจาก primitives ในส่วน A** เป็นหลัก — ไม่ต้องสเปก anatomy ใหม่ทั้งหมด ให้ยึดกฎนี้:

- **Object workspace layout:** ใช้ `SplitPanel` — ซ้าย = context (สรุป object, ตรึงไว้), ขวา = timeline/actions [DESIGN.md §11]
- **สถานะ workflow:** ใช้ `StatusChip` (A14) map จาก state machine ([SPEC_PACK.md] Part 6 enums) — dropdown เปลี่ยน status แสดงเฉพาะ transition ที่ถูกต้อง (ตัวอื่น disabled + tooltip เหตุผล)
- **Tables:** ใช้ Table (A17) + ModuleToolbar (filter/search/export) + Pagination (A18)
- **Forms:** ใช้ primitives A4–A12; publish/close ผ่าน ModalDialog (A24) ยืนยัน
- **Permissions:** control ที่ผู้ใช้ไม่มีสิทธิ์ → ซ่อน (ไม่ disable เฉย ๆ) ตาม role matrix [SPEC_PACK.md Part 2 §5]; enforce จริงที่ API
- **Density:** admin ใช้ spacing compact + typography `sm–xl` + shadow ต่ำ (§14 public vs admin)
- **Audit-sensitive actions** (deal close/unlock, publish) → ต้องยืนยัน + log [FR-SEC-03]

รายการ admin component เต็มดูที่ [11_component_inventory.md] §4–7; token binding ทุกตัวใช้ชุดเดียวกับ public (§14).

---

# ส่วน D — Cross-cutting state coverage

ทุก data/interactive component ต้องรองรับ states เหล่านี้ให้ครบ (ไม่ปล่อยว่าง) [11 §8]:

| State | ต้องมีใน |
|---|---|
| loading | ทุก async surface (skeleton, ไม่ใช่ spinner กลางจอเปล่า) |
| empty | list/table/search/gallery (→ EmptyState A19) |
| error | form fields, data fetch (→ AlertBanner/InlineError/retry) |
| success | form submit, mutation (→ Toast) |
| disabled | controls ที่ยังใช้ไม่ได้ |
| permission-restricted | admin (ซ่อนตาม role) |
| draft / published / archived | content + listing entities (→ StatusChip) |

---

## สรุป

`16_component_specs.md` ให้ **detailed spec** (anatomy/variants/states/tokens/a11y/responsive) ของ primitives (ส่วน A, ~27 ตัว) และ shared composites หลัก (ส่วน B) ซึ่งเป็นฐานที่ component อื่นทั้งหมด — รวม admin/CMS/workflow (ส่วน C) — ประกอบขึ้น โดยผูกกับ canonical tokens ใน [08_design_tokens_normalized_green_revision_full.md] และไฟล์ implementation ทั้ง 4 เอกสารนี้ควรใช้คู่กับ [11_component_inventory.md] (รายชื่อ+บทบาท) และ [SPEC_PACK.md] (behavior/FR รายหน้าจอ) เมื่อลงมือ build component library จริง [code_file:540][code_file:585].
