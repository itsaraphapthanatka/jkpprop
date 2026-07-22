# Frontend Development Plan — JKP Property (Industrial Property Platform v1.1)

> แผนพัฒนา **ฝั่ง Frontend** ของแพลตฟอร์มนายหน้าโรงงาน/โกดังอุตสาหกรรม JKP Property
> สังเคราะห์จาก `JKP_Property_Handoff.md`, `SPEC_PACK.md` (source of truth), `13_claude_code_handoff.md`, `14_decision_log_resolved.md`, `15_build_sequence_checklist.md`, `AGENT.md`, ชุดเอกสาร `01–12`, `16_component_specs.md` และไฟล์โทเคน `green-brand-*`
> เวอร์ชัน: v1 · วันที่: 2026-07-22

---

## 0. ลำดับความสำคัญของแหล่งอ้างอิง (Source of truth precedence)

เวลามีข้อขัดแย้งกัน ให้ยึดตามลำดับนี้เสมอ:

1. **`SPEC_PACK.md`** (Requirement/Functional/Flow/UML/Sequence/ERD) — binding spec สูงสุด
2. **`API_CONTRACT.md` / `docs/openapi.yaml`** — สัญญา request/response ระหว่าง FE↔BE (OpenAPI 3.1 คือสัญญาผูกมัด)
3. เอกสาร `01–12` + `16` — สำหรับ IA, listing/detail/lead, content model, component specs
4. **Design system (ผู้ใช้สั่ง 2026-07-22): `JKP_Property_Handoff.md` เท่านั้น** — palette/typography/spacing/radius/motion/component pattern ยึด handoff; codified ใน `packages/tokens` (`handoff.css` + `preset.js`). **doc 08 / `green-brand-*` / green-first = deprecated สำหรับโปรเจกต์นี้**
5. screenshots / prototype — reference layout/behavior เพิ่มเติม

> **กฎเหล็ก:** ถ้า visual preference ขัดกับ requirement (SPEC_PACK) → เลือก requirement เสมอ. แต่เรื่อง **design/visual ยึด `JKP_Property_Handoff.md` เท่านั้น** — gold/teal/purple/pill/radius ใหญ่ ใช้ได้ตาม handoff (ไม่ใช่ green-first อีกต่อไป). ค่าที่ handoff ไม่ระบุ → derive ในจิตวิญญาณของ handoff + mark `(derived)`

---

## 1. ขอบเขตและหลักการที่ห้ามหลุด (Non-negotiables)

นี่คือ **platform rebuild** ไม่ใช่ web redesign — ประกอบด้วย 3 ชั้น: Public Website · Admin/Operations App · Content & GEO Layer

| # | หลักการ | ผลต่อ Frontend |
|---|---|---|
| P1 | **SSR/SSG บังคับทุกหน้า public** (NFR-03) | เนื้อหาครบใน HTML แรกโดยไม่ต้องรัน JS — ใช้ RSC/SSG, JSON-LD + hreflang + direct-answer อยู่ใน first response |
| P2 | **i18n 3 ภาษา th/en/zh, th = default** (NFR-04) | ห้าม hardcode string ใดๆ — label/ปุ่ม/error มาจาก translation file ทั้งหมด; URL prefix `/th /en /zh` |
| P3 | **RBAC enforce ที่ API + gate ที่ UI** (FR-SEC-02) | UI ต้อง gate ด้วย role **และ ownership**; permission ที่ไม่มี = **ซ่อน** (ไม่ใช่ disable) ในฝั่ง admin |
| P4 | **ซ่อนพิกัดจริง** (FR-LST-02) | เมื่อ `map_visibility_level ≠ exact` API จะไม่ส่ง lat/long จริง — UI แสดงวงพื้นที่ + ข้อความ ไม่มีหมุด |
| P5 | **query string = source of truth** ของ search | filter/sort/page/compare อยู่ใน URL, shareable, restore ได้เต็ม |
| P6 | **Property ≠ Listing** | 1 property → หลาย listing; หน้า public render **listing**; `public_code` auto + read-only |
| P7 | **State machine เท่านั้น** | เปลี่ยนสถานะได้เฉพาะ transition ที่ถูกต้อง; UI แสดงเฉพาะ transition ที่ valid |
| P8 | **TypeScript strict, ห้าม `any`** (NFR-12) | ESLint ผ่านทุก commit |
| P9 | **ทุกหน้า public พาไป conversion/next-step** | empty state ของ search ต้องพาเข้าสู่ requirement flow ไม่ใช่ dead-end |

**ข้อห้าม v1 (ที่กระทบ FE):** ไม่มี customer login · ไม่มี self-serve marketplace · ไม่มี online payment/e-sign · ไม่มี CSV **import** (แต่ต้องมี **export** listings .xlsx/.csv) · ไม่มี public webhook · ไม่ clone หน้าตาเว็บเก่า · ห้าม gold เป็น CTA · ห้าม neon green เป็น text/ปุ่มพื้น

---

## 2. Tech Stack & การตัดสินใจเชิงสถาปัตยกรรม

| ด้าน | เลือกใช้ | เหตุผล |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript strict** | SSR/SSG สำหรับ SEO/GEO; RSC ลด JS ฝั่ง client (spec fixed) |
| Styling | **Tailwind CSS + green-brand preset** | มี `green-brand-tailwind.config.js` พร้อมแล้ว |
| Component lib | **shadcn/ui** (themed ด้วย CSS vars จาก `green-brand.css`) | map 1:1 กับ component spec; owns code เอง แก้ได้ |
| Icons | **lucide-react** (stroke 1.5, size 20 default) | single library, ห้ามผสม |
| Fonts | **next/font**: Noto Sans Thai + Inter fallback + JetBrains Mono (ราคา/รหัส) | ลด CLS, self-host |
| Server state (admin) | **TanStack Query (React Query)** | cache/invalidate/optimistic สำหรับ workflow |
| Server state (public) | **RSC `fetch` + Next cache + `revalidateTag`/ISR** | เนื้อหาใน HTML แรก, revalidate เมื่อ publish/unpublish |
| URL/query state | **nuqs** (typed search params) | filter/sort/page อยู่ใน URL แบบ type-safe (P5) |
| Forms | **react-hook-form + zod** | client validate ก่อน → map `errors[].field` จาก API กลับเข้า field |
| i18n | **next-intl** | locale routing + message catalog ทำงานกับ RSC + App Router |
| Rich text | **Tiptap** (หรือ equivalent) สำหรับ CMS body | block/rich text ตาม FR-CMS-04 |
| Charts (admin dashboard) | Recharts/visx + `chart.*` palette จาก tokens | categorical order **fixed** ห้าม cycle |
| Testing | Vitest (unit) · Playwright (E2E flow A–E) · axe (a11y) | acceptance ผูกกับ flow A–E |
| Catalog | **Storybook** | ไล่ build component library + states ทุกตัว |

**API layer:** consume `/api/v1` (envelope `{ data, meta, errors }`, `meta.pagination`, `errors[].field`). สร้าง typed client จาก OpenAPI (openapi-typescript / orval) เพื่อไม่ให้ FE เดา shape เอง. Error code ที่ UI ต้อง handle: `INVALID_STATUS_TRANSITION`, `AVAILABILITY_REQUIRED`, HTTP 422 (validation), HTTP 429 (rate limit).

---

## 3. โครงสร้าง Monorepo & โฟลเดอร์

Next.js เดียว (public + admin + api routes) แยกด้วย route group; แชร์ผ่าน packages:

```
jkp-property/
├─ apps/
│  └─ web/
│     └─ src/app/
│        ├─ [lang]/                     # public — locale-prefixed (th|en|zh)
│        │  ├─ (marketing)/             # home, about, contact, faq
│        │  ├─ (discovery)/listing/…    # search + detail
│        │  ├─ (content)/…              # guides, services, areas
│        │  └─ (intake)/requirement/…   # requirement wizard
│        ├─ s/[token]/                  # client shortlist (public token, no login, no locale prefix)
│        ├─ admin/                      # admin — no locale prefix
│        │  ├─ (auth)/login
│        │  └─ (dashboard)/…            # leads, listings, shortlists, visits, deals, cms, seo, settings
│        ├─ api/v1/{public,admin,ops}/  # API routes
│        ├─ sitemap.ts · robots.ts · [lang]/llms.txt
│        └─ globals.css                 # imports green-brand.css
├─ packages/
│  ├─ ui/          # design-system components (shadcn-based) + Storybook
│  ├─ tokens/      # green-brand-tokens.json / .css / tailwind preset / theme.tsx (canonical)
│  ├─ i18n/        # next-intl config + message catalogs th/en/zh + helpers
│  ├─ api-client/  # typed client generated from OpenAPI + query hooks
│  ├─ domain/      # enums (STATUS_ENUMS), state-machine guards, formatters (money/date/area)
│  └─ config/      # tsconfig / eslint / tailwind base
└─ (backend: prisma schema, db — dependency, ไม่อยู่ในขอบเขตแผน FE นี้)
```

> หมายเหตุ: ถ้าทีมถนัดแยก `apps/admin` ออกจาก `apps/web` ก็ได้ แต่ single-app + route group ลดงาน setup และแชร์ session/design system ง่ายกว่าใน v1

---

## 4. Cross-cutting foundations (ทำครั้งเดียว ใช้ทุกหน้า)

สร้างสิ่งเหล่านี้ให้เสร็จก่อน แล้วทุกหน้าจะ "ฟรี":

### 4.1 i18n
- `next-intl` middleware จัดการ locale routing + redirect `/` → `/th`
- Message catalog แยกไฟล์ต่อ namespace (common, listing, detail, forms, admin, errors, seo)
- **Language switcher** อยู่ทุกหน้า, คงหน้าเดิม (fallback ไป homepage ภาษานั้นถ้าไม่มี translation) — FR-PUB-03
- Formatters กลาง: money (`฿250,000 /เดือน`, null → "ติดต่อสอบถาม"), date (`DD MMM YYYY` ต่อ locale, เก็บ ISO UTC), area (`3,000 ตร.ม.`)

### 4.2 SEO / GEO render layer (FR-GEO-01..07)
- `generateMetadata()` ต่อหน้า: meta title/description ต่อ locale, canonical, robots, OG — **ทุกหน้าต้องมี meta เสมอ** (ถ้า CMS ไม่กรอก → generate จาก entity อัตโนมัติ)
- **JSON-LD helper** ต่อ page type: `Organization`+`WebSite` (sitewide), `BreadcrumbList` (ตรงกับ breadcrumb UI 100%), `FAQPage`, `Article`, `Service`, `Product/Offer` (listing) — generate จาก canonical model เดียวกับ UI ห้าม hardcode
- **hreflang** ครบ th/en/zh ทุกหน้าที่มี translation (FR-GEO-03)
- `sitemap.ts` (canonical URL production เท่านั้น, จัดกลุ่ม + alternates), `robots.ts` (ชี้ production host ห้ามชี้ staging), `llms.txt` (เฉพาะ URL คุณค่าสูงที่ทีมเลือก)
- **นโยบาย indexation 3 ชั้น:** (1) canonical indexable = home/listing hub/detail/article/service/area; (2) conditionally indexable = combo เจตนาสูง (type+province, transaction+area สำคัญ) → curated lander มี canonical + เนื้อหาของตัวเอง; (3) noindex = deep filter/sort/page/compare/temp states

### 4.3 Data fetching & caching
- Public: RSC fetch + tag-based cache; `revalidateTag('listing:{id}')` เมื่อ publish/unpublish/แก้ราคา → หน้าเว็บอัปเดต, unpublish → public 404 ทันที
- Admin: React Query + optimistic update + invalidate ตาม mutation

### 4.4 Forms & validation (§1.3 spec)
- zod schema ฝั่ง client ตรงกับ server rule (budget/size min≤max, move-in ≥ วันนี้, ≥1 contact method)
- normalize comma/space ในช่องตัวเลขก่อน validate (client + server)
- map `errors[]` จาก API กลับ field ผ่าน `field`; error ที่ไม่มี field → banner
- network error → banner + **ห้ามล้างค่าที่กรอกไว้**
- honeypot + rate-limit UX (429 → ข้อความสุภาพ)

### 4.5 RBAC ฝั่ง UI (FR-SEC-02)
- `useCan(action, resource)` + `<Can>` wrapper อ่านจาก session
- ซ่อน control ที่ไม่มีสิทธิ์ (ไม่ disable), sales_agent เห็นเฉพาะ lead/negotiation ที่ถูก assign, translator เห็น field อื่นเป็น read-only
- **ต้อง enforce ที่ API ด้วยเสมอ** — UI gate ไม่ใช่ security

### 4.6 States เป็นมาตรฐาน (ทุก data/interactive component)
loading (skeleton ไม่ใช่ spinner เปล่า) · empty (→ `EmptyState`) · error (retry) · success (toast) · validation error · disabled · permission-restricted · draft/published/archived — บังคับให้ครบทุก component (`NFR-07` error boundary)

### 4.7 Accessibility & Performance (acceptance gates)
- focus ring มองเห็นทุก interactive el; touch target ≥44×44 mobile; สถานะสื่อด้วย icon+text ไม่ใช่สีอย่างเดียว; `role`/`aria-*` ตาม spec; respect `prefers-reduced-motion`
- **เป้า: LCP ≤2.5s (4G), Lighthouse mobile ≥85** บนหน้า listing/detail; รูป served แบบ watermark + `next/image`

---

## 5. Design System & Component Library (Phase FE-1 — ทำก่อนหน้าเพจ)

**Integration tokens (handoff-only):** import `@jkp/tokens/css` (`handoff.css`) ใน root layout + ต่อ `@jkp/tokens/tailwind` (`preset.js`) เป็น Tailwind preset. **ห้าม floating hex** — ทุกสีผ่าน utility / `var(--…)`. token codified จาก `JKP_Property_Handoff.md` (ไม่ใช่ green-brand แล้ว); ค่าที่ handoff ไม่ระบุถูก mark `(derived)` ใน `handoff-tokens.json`

**Palette หลักที่ต้องจำ (handoff):** primary CTA = green `#0D6C3B` (hover `#0A5C39`, active `#043F20`); **accent = deep teal `#034956`** (eyebrow/link/ราคา/ไอคอนเน้น); **gold `#D9A62B`** (โทร/เรียงตาม/แนะนำ); pine `#273c33` (active/modal/admin tab); purple `#7A3FB0` (admin only); neon `#2DFB91` = **CTA บนพื้นเข้ม / badge active เท่านั้น**; error `#C0392B`. **ปุ่ม = pill (radius-full) เสมอ + hover lift/glow**; card border 1.5px + hover lift; radius ใหญ่ (sm12 / md16 / lg20 / xl24). StatusChip = dot + ข้อความเสมอ

**ลำดับ build (ใน `packages/ui` + Storybook):**

1. **Primitives (A1–A27):** Button · Link/IconButton · TextInput/Textarea · Select/Combobox · Checkbox/Radio/Toggle · Date/DateRange · NumberRange · Badge/StatusChip · Tabs · Accordion · Table (dense) · Pagination · EmptyState · Toast/AlertBanner/InlineError · Tooltip · Skeleton · ModalDialog · DrawerSheet · Breadcrumbs · DefinitionList/KeyValueGrid
   *(token/anatomy/states ทุกตัวอยู่ใน `16_component_specs.md` §A — build ตามนั้น pixel-accurate)*
2. **Layout shells:** `PublicPageShell` (nav + footer + language switcher), `AppShell` (admin sidebar 248px + topbar sticky), `SectionWrapper`/`ContentContainer`, `SplitPanel`
3. **Composite/domain (สำคัญสุด):** `ListingCard` ⭐, `PriceDisplay` (rent/sale/dual, ตาม transaction context), `SearchModule/QuickSearch`, `FilterSidebar`/`FilterBottomSheet`/`FilterGroup`, `CompareBar`/`CompareTable`, `ListingGallery`, `MapCard` (obeys `map_visibility_level`), `InquiryForm`/`ListingInquiryForm`/`RequirementWizard`, `ContactChannelGroup`

**Definition of done ของ component library:** ทุกตัวมี Storybook story ครบ states (§4.6), ผ่าน axe, มี light+dark, focus ring, keyboard nav, ไม่มี hardcoded string/hex

---

## 6. Public Website — สเปกราย page

> ทุกหน้า: locale-prefixed, SSR/SSG, meta+JSON-LD+hreflang+breadcrumb, states ครบ, พาไป conversion

### 6.1 Home `/[lang]` (FR-PUB-01)
- **Sections:** hero + `QuickSearchModule` (type + transaction segmented + province → `/listing?…`) · `FeaturedListingsRail` (6–8 featured) · area/map discovery · `HowItWorksGrid` (4 ขั้น) · `WhyChooseUsGrid` · `CredentialLogoStrip` (certifications) · trust/gallery · `FooterContactBlock`
- **Data:** featured listings query + CMS content + credentials · JSON-LD `Organization`+`WebSite`
- Search module ต้อง**เป็นฟอร์มจริง** submit ได้, mobile ไม่ยุบเหลือปุ่มเดียว

### 6.2 Listing search `/[lang]/listing` (FR-SRC-01..09) — public core
- **Filters:** property type · transaction (rent/sale/both) · province→district→subdistrict (cascade) · industrial estate · **zone_type (first-class dimension ไม่ใช่แค่ badge)** · size min–max · rent budget min–max · sale budget min–max · factory-license possible · featured · keyword `q` (FTS)
- **Sort:** published date / price / size (asc/desc) — whitelist; default `published_at desc`
- **Pagination:** default 20, max 100, มี total count; page อยู่ใน query; out-of-range → redirect กติกาแน่นอน
- **transaction=both** ต้องโผล่ทั้งหน้า rent และ sale (rent → rent+both, sale → sale+both) — FR-SRC-09
- **Compare ≤4** (sessionStorage), 5th → toast, floating `CompareBar` → `CompareTable` (spec ต่อแถว, sticky label ซ้าย) — FR-SRC-07
- **Empty state** = `search-empty`: ปุ่ม [ล้างตัวกรอง] + [ส่ง requirement] (prefill จาก filter ที่เลือก) — FR-SRC-06 — **นี่คือสะพาน no-fit → requirement**
- Desktop = `FilterSidebar` sticky; mobile = `FilterBottomSheet` + ปุ่ม "ดูผล (N)"; filter chip summary + "ล้างทั้งหมด"; ทุกการเปลี่ยน filter อัปเดต URL ทันทีไม่ full reload
- **`ListingCard`:** cover · public_code (mono) · title (2-line clamp) · type · transaction label · location (ระดับที่อนุญาต) · primary area · `PriceDisplay` (context-aware) · badges (zone/estate/featured) · state unavailable = dim + "ไม่ว่างแล้ว"
- Analytics events: search executed / filters changed / card clicked / compare add-remove / inquiry started / no-results

### 6.3 Listing detail `/[lang]/listing/[slug]` (FR-LST-01..06) — **route locked (§10 D1)**
> ตั้งเป็น canonical เดียว; **301** จาก `/[lang]/property/*` (ชื่อ segment ของ SPEC_PACK) และ `/[lang]/listing-single/*` (legacy) มาที่นี่ทั้งหมด
- **Section order (fixed):** Breadcrumb → Gallery → Title/transaction/price → Quick specs → Full spec schema → Location/map → Inquiry sidebar → Related (4)
- **Quick specs:** usable/warehouse area · clear height · floor loading · power system · land/office area
- **Full schema (grouped):** identity · location (ตาม visibility) · size&physical · utilities&ops (ไฟ/หม้อแปลง/license/zoning) · commercial (rent/sale/updated_at/availability) · features&remarks — **null row ซ่อนทั้งแถว** (ไม่แสดง "-")
- **`MapCard` (privacy critical):** `exact` → หมุดจริง; `subdistrict/district/province` → วงพื้นที่ ไม่มีหมุด, API ไม่ส่ง lat/long; visibility ต้องคุมทุกจุด (text summary, breadcrumb, map, geo metadata) ไม่ใช่แค่ widget แผนที่ — FR-LST-02
- **Sticky `InquirySidebar`:** ฟอร์ม prefill `listing_id` + `public_code` + transaction + Line/WeChat/WhatsApp; desktop = sidebar, mobile = sticky bottom CTA — FR-LST-03
- แสดง `updated_at` + availability disclaimer — FR-LST-05, FR-GEO-07
- **Related listings** ใช้ exposure rule เดียวกับ search (ไม่โชว์ unpublished/unavailable) — FR-LST-04
- **404 semantics:** unpublished/removed/invalid slug → **404 จริง** (ห้าม 200 ที่ render ข้อมูลพัง); wrong-language slug → 301 — FR-LST-06
- JSON-LD `Product/Offer` + `BreadcrumbList`

### 6.4 Compare `/[lang]/listing-compare` — session-based, noindex

### 6.5 Requirement wizard `/[lang]/requirement` (FR-INQ-02..05) — intake คุณภาพสูงสุด
- **3 ขั้น:** (1) ความต้องการ (operation type, license?, size min–max, rent/sale budget min–max, move-in, near port/airport/bangkok) → (2) ข้อมูลบริษัท (name, registration country, website, business type) → (3) ผู้ติดต่อ + notes + desired areas (หลายพื้นที่ + priority_rank สูงสุด 5)
- `WizardStepNav` progress ("ขั้น X จาก 3") · `WizardReviewStep` · `ServerValidationSummary` (focusable, ลิงก์ไป field)
- Validation: move-in ≥ วันนี้, budget/size min≤max, ≥1 location, ≥1 ของ email/phone, honeypot+rate limit
- Success → thank-you ("ทีมงานติดต่อกลับภายใน 1 วันทำการ") → สร้าง lead + requirement (+company/contact) เข้า qualification

### 6.6 Contact `/[lang]/contact` (FR-PUB-04, FR-INQ-01)
- ฟอร์มเดียว (name, email, phone, subject, message, listing ที่สนใจ optional) + `ContactChannelGroup` (phone/Line/WeChat/WhatsApp/email แยกภาษา) ข้างๆ + เวลาทำการ + Google Maps embed
- Success state "ส่งแล้ว ✓" → สร้าง lead source `contact_page`

### 6.7 FAQ `/[lang]/faq` (FR-PUB-05)
- Sidebar หมวด + search + accordion; JSON-LD `FAQPage`; still-need-help CTA

### 6.8 Useful tips/guides `/[lang]/useful-tips` + `/[slug]` (FR-PUB-06)
- Hub: category filter + article card + pagination; Detail: hero + summary (= direct answer) + body + related articles + related-listing CTA; JSON-LD `Article`

### 6.9 Services `/[lang]/services/[slug]` + Areas `/[lang]/areas/[slug]` (FR-PUB-07, FR-GEO-05)
- **โครงสร้าง GEO-ready:** direct-answer block เปิด → รายละเอียด → sub-FAQ → internal links → intent CTA
- Area page: direct answer → area/zone/logistics info → **listings ในพื้นที่ (auto-query binding)** → FAQ → CTA; JSON-LD `Service`/`FAQPage` + `BreadcrumbList`
- **หน้า SEO ทำเล** (สนามบิน/CBD/Nonthaburi/ท่าเรือ Mahachai/Laem Chabang/Map Ta Phut) = สร้างเป็น **canonical `/areas/[slug]`** มีเนื้อหาของตัวเอง; **preset โรงงาน/โกดัง × เช่า/ขาย** = curated lander (conditionally indexable) มี canonical + editorial ไม่ปล่อยเป็น query string ดิบ

### 6.10 Client Shortlist `/s/[token]` (FR-SHL-05) — เปิดจากลิงก์ token, ไม่ต้อง login
- แถบ broker + badge "ลิงก์ส่วนตัว" · การ์ดแบรนด์ลูกค้า · สรุป requirement chips · **2 มุมมอง: การ์ด / ตารางเปรียบเทียบ** (sync กัน) · การ์ดติดต่อ agent
- ปุ่ม feedback ต่อทรัพย์ (สนใจ/ยังไม่ตัดสินใจ/ไม่สนใจ) → ส่งกลับ shortlist; **ไม่แสดง internal notes**; listing ที่ถูก unpublish หลังส่ง → แสดง "ไม่ว่างแล้ว" (ไม่ลบออก คงบริบท)

### 6.11 Utility/system-state
- 404 จริง (ไม่ใช่ client empty state), empty search, permission/expired-link, error boundary — ออกแบบเป็นระบบ (gap เดิมไม่มี)

---

## 7. Admin / Operations App — สเปกราย workspace

> `AppShell`: sidebar เข้ม 248px (จัดกลุ่ม: ทรัพย์ / งานขาย / เนื้อหา&ระบบ) + topbar sticky + main scroll `#F6F5F1`; mobile = top nav เลื่อนแนวนอน. ทุก workspace ออกแบบเป็น **object-workspace** (`SplitPanel`: บริบท pin ซ้าย + timeline/action ขวา) ไม่ใช่ CRUD table เฉยๆ

| Route | Workspace | จุดสำคัญ FE |
|---|---|---|
| `/admin/login` | Auth (FR-SEC-01/04) | httpOnly cookie, 5 fail/15min → lock, returnUrl |
| `/admin/dashboard` | Dashboard (FR-CRM) | stat cards (new leads 7d / requirements to review / shortlists to send / visits this week / open deals — คลิกไป index ที่ filter แล้ว) + funnel pipeline + activities 20 ล่าสุด |
| `/admin/leads` · `/[id]` | Lead CRM (FR-CRM-01..07) | index filter (status/agent/source/date/keyword), **agent-scoped**; detail 2-คอลัมน์ (contacts/company/requirement/linked left · notes+activities timeline+tasks right); header = status dropdown (**เฉพาะ transition valid**) + assign-agent |
| `/admin/requirements/[id]` | Requirement (Flow B) | Confirm → special-criteria + **availability gate**; **Cancel → บังคับ reason + cancelled_field** (cancel requirement ที่มี shortlist → shortlist = closed อัตโนมัติ); "Find matching properties" เปิด listing search prefilled |
| `/admin/shortlists/[id]` | Shortlist builder (FR-SHL, FR-AVL-04) | requirement summary pin ซ้าย · search-add **gate: published + latest availability=available & ไม่เกิน valid_until** (ไม่ผ่าน = disable + tooltip เหตุผล) · drag rank · internal notes · Send (disable ที่ 0 item) → token link · post-send feedback column |
| `/admin/visit-plans/[id]` | Visit (Flow C, FR-VIS) | **checkbox "criteria unchanged" บังคับก่อนสร้าง** · appointments (landlord + start/end validate end>start + ordered listings, block unavailable/archived) · >8 listing/session → warning ไม่บล็อก · per-listing outcome · CTA เปิด Google Maps directions + waypoints เมื่อ gate confirmed · complete ได้เมื่อมี ≥1 appointment |
| `/admin/negotiations/[id]` | Negotiation (Flow D, FR-DEA-01/02) | header (lead/listing/agent/stage dropdown ตาม state machine) · offers timeline (client↔landlord, add → update latest_offer) · "Create Deal" enable ที่ `contract_review` |
| `/admin/deals/[id]` | Deal (FR-DEA-03..06) | agreed amount/dates · documents (S3 presigned upload, type+status) · commissions · **Close (จาก `signed`) → freeze financial fields**; super_admin เห็น "Unlock" → บังคับ reason → audit |
| `/admin/properties` · `/[id]` | Property (FR-ADM-01/03) | edit 5 tabs: Main (public_code read-only, type, landlord/developer, cascade geo, zones multi, address_private, lat/long, map_visibility_level) · Specs · Features · Media (drag-drop + **watermark choice** + sort + cover + alt) · Translations (th/en/zh + completeness); ลบไม่ได้ถ้ามี listing ผูก |
| `/admin/listings` · `/[id]` | Listing (FR-ADM-02/04/05/06/08/10) | index table (status badge, filter/search code/title, **bulk publish/unpublish**, **Export .xlsx/.csv**); edit (transaction, rent/sale price, min divisible, available window, exclusive, featured; tabs Translations/SEO/Availability history/Price history); **Publish rule: ≥1 translation + ≥1 cover** (ไม่ผ่าน → dialog บอกว่าขาดอะไร + ลิงก์ไป tab); price change → auto price_history |
| `/admin/media` | Media library | dropzone + folder + filter + cover/alt/watermark |
| `/admin/pages` · `/articles` · `/faqs` | CMS (FR-CMS-01..06) | index (status/category) + **tabbed-language edit** (th/en/zh) · slug ต่อภาษา (dup ในภาษาเดียวกัน → error ทันที) · rich text · draft→published · FAQ drag sort + toggle; translator แก้เฉพาะ translation fields |
| `/admin/seo` | SEO/GEO (FR-GEO-01/02/06) | เลือก entity + language → meta title (นับอักษร ≤60) / description (≤160) / canonical / robots / OG / JSON-LD editor (validate JSON) + **schema preview (merged auto+override)** + SERP + hreflang preview |
| `/admin/users` · `/settings` · `/audit` | Governance (FR-SEC-02/03) | users&roles (multi-role, deactivate ไม่ลบ), **RBAC matrix 6×actions**, audit log (before/after diff) |
| (add-on) Branding/Geography/FieldBuilder/llms | Settings extras | Branding live-preview (multi-tenant), Geography cascade + estate toggle, no-code Field Builder, llms.txt manager |

---

## 8. Data fetching & state — สรุปแพทเทิร์น

| ชนิด state | เก็บที่ไหน | เครื่องมือ |
|---|---|---|
| Server data (public) | RSC + Next cache (tag-based ISR) | `fetch` + `revalidateTag` |
| Server data (admin) | React Query cache | TanStack Query + optimistic |
| Search/filter/sort/page | **URL query string** (P5) | nuqs |
| Compare set | sessionStorage | custom hook |
| Form state | component | react-hook-form + zod |
| UI transient (modal/drawer/tab/dropdown) | local | useState/useReducer |
| Session/role | server session | next-intl-independent auth context + `useCan` |

State-machine guards อยู่ใน `packages/domain` — UI import มาใช้เพื่อ render เฉพาะ transition ที่ valid (ห้ามให้ FE ตัดสินเอง; API เป็นคนบังคับสุดท้าย)

---

## 9. Phased delivery roadmap (frontend milestones)

| Phase | Frontend deliverable | ผูกกับ spec |
|---|---|---|
| **FE-0 Foundation** ✅ | **เสร็จแล้ว (2026-07-22)** — monorepo (npm workspaces), `packages/{tokens,domain,ui,api-client}`, `apps/web` (Next 15 + next-intl `/th /en /zh` + `/`→`/th`), 2 root layouts (public locale-prefixed + admin dark-ready), D1 redirect map, sitemap+hreflang/robots, base shells, Button primitive. `npm run build` ผ่าน + smoke test ผ่านทุกข้อ | Phase 0–1 |
| **FE-1 Design system** ✅ | **เสร็จแล้ว (2026-07-22)** — `packages/ui` มี primitives A1–A27 ครบ (30 components, Radix-backed) styled ตาม handoff + Storybook (build ผ่าน, addon-a11y) + `tailwindcss-animate`. ui typecheck + storybook build + web build เขียวทั้งหมด | 16_component_specs |
| **FE-2 Public discovery core (P0)** ✅ | **เสร็จแล้ว (2026-07-22)** — Home (hero/quicksearch/featured/how-it-works/trust) · Listing search (filter engine, sort, pagination, compare ≤4, empty→requirement, FR-SRC-09 both) · Listing detail (section contract, MapCard privacy FR-LST-02, 404, inquiry) · compare page · SEO layer (per-page metadata + alternates + Product/Breadcrumb/Org/WebSite JSON-LD + noindex policy). สร้างบน **mock data layer** (`apps/web/src/data`) ที่สลับไป `/api/v1` ได้. build + smoke test เขียวทั้งหมด | FR-PUB/SRC/LST/GEO · Flow A |
| **FE-3 Conversion core (P0)** ✅ | **เสร็จแล้ว (2026-07-22)** — Requirement wizard 3 ขั้น (RHF+zod, prefill จาก search, review, success) · Contact page + channels · listing inquiry ต่อ API จริง. **Intake seam จริง**: shared zod schema (client+server) + Next route `/api/v1/public/{requirements,inquiries}` (server validate + honeypot + rate-limit + envelope `errors[].field`). สาม source_channel (contact_page/listing_inquiry/requirement_form). build + smoke test intake เขียวทั้งหมด | FR-INQ · Flow A |
| **FE-4 Admin shell + CRM (P0)** | AppShell · login · dashboard · leads index+detail (status machine, assignment, notes/tasks/activities) · requirement confirm/cancel | FR-SEC/CRM · Flow B |
| **FE-5 Shortlist + client view (P0→P1)** | shortlist builder (availability gate) · client `/s/[token]` (การ์ด/ตารางเปรียบเทียบ + feedback) | FR-SHL/AVL · Flow B |
| **FE-6 Inventory admin (P0)** | properties (5 tabs+media+watermark) · listings (publish rule/bulk/export/price history) | FR-ADM |
| **FE-7 Availability + Visits (P1)** | availability check UI · visit planner (criteria gate + directions) | FR-AVL/VIS · Flow C |
| **FE-8 Negotiation + Deals (P1)** | negotiation offers · deal + documents + commission + close/unlock | FR-DEA · Flow D |
| **FE-9 Content/CMS + SEO editor + GEO pages (P1)** | pages/articles/faq (lang tabs) · SEO panel (JSON-LD preview) · services/areas/guides GEO pages · llms.txt | FR-CMS/GEO · Flow E |
| **FE-10 Publish/revalidate + Audit + hardening (P1→P2)** | publish/unpublish → revalidate + public 404 · audit viewer · a11y/perf/SEO audit · run flow A–E | Phase 9–10 |

**Dependency chain ที่ต้องเคารพ:** contracts (listing/detail schema, enums, API) → discovery core → conversion core → expansion → ops backbone → optimize. **อย่าสร้างหน้าสวยก่อนแก้ object contract** (บทเรียนจากระบบเก่า)

---

## 10. Decisions — RESOLVED ✅ (ล็อกแล้ว 2026-07-22)

| # | ประเด็น | มติ | หมายเหตุ implementation |
|---|---|---|---|
| D1 ✅ | **URL หน้า detail** | **`/[lang]/listing/[slug]`** | override ชื่อ segment ของ SPEC_PACK (`/property/*`) ด้วยเหตุผล semantic (หน้า render listing, ตรง P6) + ตรง IA docs 01/05; **301** จาก `/property/*` และ `/listing-single/*` มาที่นี่; canonical เดียวต่อ locale |
| D2 ✅ | **Page size** listing | **default 20, max 100** | ตาม SPEC_PACK/decision log |
| D3 ✅ | **Compare max** | **4** | session-based (sessionStorage), 5th → toast |
| D4 ✅ | **Slug policy** | **Localized ต่อภาษา** | slug ต่อ locale, unique ต่อภาษา; canonical/hreflang mapping ต้อง generate ให้ครบ th/en/zh; editor กรอก slug แยกต่อ language tab |
| D5 ✅ | **Dark mode** | **Public light-first; ไม่มี full dark theme** (ปรับตาม D9) | handoff ไม่ได้นิยาม dark theme — near-black `#04140C`/`#0A0E0C` ใช้เป็น surface ของ footer/admin sidebar เท่านั้น |
| D9 ✅ | **Design system source** | **`JKP_Property_Handoff.md` เท่านั้น** (ผู้ใช้สั่ง 2026-07-22) | override green-first; codified ใน `packages/tokens` (`handoff.css`/`preset.js`/`theme.tsx`/`handoff-tokens.json`); doc 08/green-brand = deprecated; ค่าที่ handoff ไม่ระบุ = `(derived)` |
| D6 ✅ | **App structure** | **Single Next app + route groups** | `apps/web` เดียว: `[lang]/(public)` + `/admin` + `/api/v1`; แชร์ design system/session |
| D7 ✅ | **Services hub** | **เพิ่ม `/[lang]/services`** | hub index สมมาตรกับ `/guides` |
| D8 ✅ | **i18n lib** | **next-intl** | RSC-friendly, locale routing + message catalog |

> ทุก decision ปิดแล้ว — พร้อมเริ่ม Phase FE-0 ได้ทันที. ถ้าภายหลัง SPEC_PACK/ลูกค้าเปลี่ยนใจเรื่องชื่อ segment (D1) ให้กลับมาแก้ redirect map + canonical generation เป็นหลัก

---

## 11. Definition of Done / Acceptance gates (§8 spec)

- FR ระดับ **M** ทุกข้อผ่าน test case, demo บน staging ได้
- **Lighthouse mobile ≥85** บน listing + detail; **LCP ≤2.5s (4G)**
- ทุก page type ผ่าน Google Rich Results (JSON-LD valid); hreflang ตรวจด้วย internal crawler
- **5 E2E flows ผ่าน (Playwright):**
  - **A** search → detail → inquiry → lead ใน CRM
  - **B** requirement → confirm/cancel (cancel ต้องมี reason+field) → availability → shortlist → send → feedback
  - **C** ยืนยัน criteria unchanged → visit plan → landlord confirm → visit → บันทึก outcome
  - **D** negotiation → offers → close deal → docs + commission
  - **E** article 3 ภาษา → publish → render พร้อม schema + hreflang
- a11y: axe ผ่าน, keyboard nav, focus ring, สถานะ icon+text; i18n: ไม่มี hardcoded string; TS strict ไม่มี `any`, ESLint ผ่าน

---

## 12. Risks & failure modes ที่ต้องระวัง

- มองเป็น web redesign แทน platform rewrite → ทำหน้า public โดยไม่แก้ listing/detail/lead object logic
- ทำ SEO แบบ patchwork โดยไม่ normalize route/canonical/taxonomy ก่อน (ปล่อย faceted noise เข้า index)
- ทำ admin เป็น CRUD table ก่อนกำหนด workflow/state/permission
- ใช้ gold เป็น CTA / neon green เป็น text หลัง migration เป็น green-first
- ลืม `map_visibility_level` ในบาง location surface → เผยพิกัดจริงโดยไม่ตั้งใจ (ผิด FR-LST-02)
- hardcode string / floating hex → พัง i18n และ token system
- เดา API shape เอง แทนที่จะ generate จาก OpenAPI → drift กับ BE

---

*แผนนี้เป็น living document — อัปเดตเมื่อ open decisions (§10) ถูก resolve หรือ SPEC_PACK เปลี่ยน*
