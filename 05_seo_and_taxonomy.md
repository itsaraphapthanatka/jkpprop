# 05 SEO & Taxonomy — v2 (Discoverability, Canonical Structure, GEO Layer)

เอกสารนี้เป็นเวอร์ชันปรับปรุงเต็มของ `05_seo_and_taxonomy.md` โดยยกระดับจากรายงานปัญหา SEO/taxonomy ของเว็บไซต์เดิม ไปเป็น **discoverability architecture document** สำหรับ Industrial Property Platform v1 ซึ่งครอบคลุม URL strategy, canonical rules, multilingual indexing, taxonomy design, GEO landing logic, structured data และ AI/LLM discoverability requirements ตามสเปก v1.1 [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][file:462][code_file:540].

เอกสารฉบับนี้มีเป้าหมายเพื่อให้ทีม product, engineering, content, SEO และ AI agents ใช้เป็น baseline เดียวกันในการออกแบบ “การถูกค้นเจอ” ของระบบ ทั้งใน search engines ทั่วไปและในบริบทของ GEO/AI search [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html][code_file:540].

## บทบาทของ SEO & taxonomy ในระบบนี้

ระบบนี้ไม่ใช่เว็บ brochure ที่มีไม่กี่หน้า แต่เป็นแพลตฟอร์มที่มี public listings, service pages, area pages, articles, FAQ และหลายภาษา [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  ดังนั้น SEO และ taxonomy ไม่ใช่ชั้นตกแต่งภายหลัง แต่เป็นโครงสร้างหลักที่กำหนดว่า inventory, content และความเชี่ยวชาญของบริษัทจะถูกค้นเจออย่างไร [page:FUNCTIONAL_SPEC.html].

ในสเปก v1.1 discoverability มี 4 เป้าหมายหลัก [page:REQUIREMENTS_SPEC.html][code_file:540]:

1. ให้คนค้นเจอ listings และพื้นที่ที่เกี่ยวข้องได้ง่าย
2. ให้ search engines เข้าใจโครงสร้างหลายภาษาและ canonical URLs อย่างถูกต้อง
3. ให้ content layer รองรับ GEO intent เช่น จังหวัด, อำเภอ, นิคม, service-intent pages
4. ให้ AI systems และ LLMs เข้าถึง knowledge surfaces ที่มีคุณภาพผ่าน metadata และ llms.txt strategy

## ปัญหาจากระบบเดิมที่เวอร์ชันใหม่นี้ต้องแก้

จากการตรวจสอบระบบเดิม พบปัญหาเชิงโครงสร้างหลายข้อที่กระทบ discoverability โดยตรง [file:462]:

- title/meta description ใช้ซ้ำข้าม page types และ locales [file:462]
- ไม่มี canonical tags [file:462]
- ไม่มี hreflang tags แม้มี 3 ภาษา [file:462]
- sitemap และ robots ชี้ไป staging host [file:462]
- มี dual URL formats สำหรับ detail pages โดยไม่มี canonical resolution [file:462]
- breadcrumb structured data และ real-estate-specific schema ยังขาด [file:462]
- city/area routing มี locale inconsistency [file:462][file:460]
- zone type ยังเป็น badge มากกว่า search/taxonomy dimension [file:462][file:457]

เวอร์ชันใหม่นี้จึงไม่เพียง “ปรับ SEO” แต่ต้องออกแบบ discoverability layer ใหม่ให้เป็นระบบตั้งแต่ route ถึง metadata [page:FUNCTIONAL_SPEC.html][code_file:540].

## หลักการของ discoverability architecture v2

ก่อนอธิบาย URL และ taxonomy ต้องตั้งหลักการร่วมกันก่อน [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- ทุก public URL ต้องมี canonical identity ชัดเจน [page:FUNCTIONAL_SPEC.html]
- multilingual ต้องเป็น first-class architecture ไม่ใช่การแปลข้อความบนหน้าอย่างเดียว [page:REQUIREMENTS_SPEC.html]
- query-driven listing surfaces ต้องมี strategy ว่า route ไหน indexable และ route ไหน non-canonical [page:FUNCTIONAL_SPEC.html]
- taxonomy ต้องสะท้อน business intent จริง เช่น property type, transaction type, geography, industrial context และ service intent [page:REQUIREMENTS_SPEC.html]
- content, listings และ GEO pages ต้องเชื่อมกันผ่าน internal links แบบ intentional ไม่ใช่ปล่อยให้แยก islands [page:FUNCTIONAL_SPEC.html]
- discoverability ต้องครอบคลุมทั้ง classic SEO และ AI-readable surfaces [page:REQUIREMENTS_SPEC.html]

## 1. URL architecture

URL architecture คือฐานของ SEO และ taxonomy ทั้งหมด [page:FUNCTIONAL_SPEC.html].  หาก route model ไม่ชัด canonical, hreflang, sitemap และ structured data จะสับสนตามไปทั้งหมด [file:462].

### 1.1 Locale-first routing

ตามสเปก v1.1 public routes ต้องรองรับ 3 ภาษา และวิธีที่เสถียรที่สุดคือ locale-first URL model [page:REQUIREMENTS_SPEC.html].  baseline ที่แนะนำคือ:

- `/th/...`
- `/en/...`
- `/zh/...`

โมเดลนี้ช่วยให้ language identity ของทุกหน้าแยกชัด และทำให้การสร้าง hreflang/canonical/sitemap เป็นระบบมากขึ้น [page:FUNCTIONAL_SPEC.html].  มันยังช่วยแก้ปัญหา routing inconsistency แบบเดิมที่บาง area shortcut กระโดด locale เองโดยไม่สอดคล้องกับบริบทต้นทาง [file:462][file:460].

### 1.2 Public route families ที่ควรมี canonical structure

อย่างน้อย public route families ควรนิยามดังนี้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- `/{lang}` — homepage [page:REQUIREMENTS_SPEC.html]
- `/{lang}/listing` — search/results hub [page:REQUIREMENTS_SPEC.html]
- `/{lang}/listing/{slug}` หรือ canonical detail route equivalent [page:FUNCTIONAL_SPEC.html]
- `/{lang}/services/{slug}` [page:REQUIREMENTS_SPEC.html]
- `/{lang}/areas/{slug}` [page:REQUIREMENTS_SPEC.html]
- `/{lang}/guides` และ `/{lang}/guides/{slug}` [page:REQUIREMENTS_SPEC.html]
- `/{lang}/faq` [page:REQUIREMENTS_SPEC.html]
- `/{lang}/contact` [page:REQUIREMENTS_SPEC.html]
- `/{lang}/requirement` [page:REQUIREMENTS_SPEC.html]

### 1.3 Legacy route normalization

หากยังมี legacy routes เช่น short-id detail URLs, city shortcuts หรือ area shortcuts ที่มีรูปแบบเก่า ควรกำหนด explicit redirect strategy ไปยัง canonical route [file:462][file:460][page:FUNCTIONAL_SPEC.html].  หลักคือ 1 public object ควรมี 1 canonical public URL ต่อ locale [page:FUNCTIONAL_SPEC.html].

## 2. Canonical strategy

Canonical rules ต้องเป็น policy ระดับระบบ ไม่ใช่แก้เป็นรายหน้าทีละกรณี [file:462][page:FUNCTIONAL_SPEC.html].  ระบบเดิมมีปัญหา dual URLs โดยเฉพาะ detail pages ทำให้ duplicate content risk สูง [file:462].

### 2.1 One object, one canonical URL per locale

หลักการสำคัญคือ public object เดียวควรมี canonical URL เดียวต่อ locale [page:FUNCTIONAL_SPEC.html].  ตัวอย่าง:

- listing หนึ่งรายการ → canonical detail URL 1 เส้นต่อภาษา [page:FUNCTIONAL_SPEC.html]
- article หนึ่งชิ้น → canonical article URL 1 เส้นต่อภาษา [page:FUNCTIONAL_SPEC.html]
- area page หนึ่งหน้า → canonical area URL 1 เส้นต่อภาษา [page:FUNCTIONAL_SPEC.html]

### 2.2 Query page canonicalization

listing search pagesเป็นกรณีพิเศษ เพราะหน้าเดียวกันสามารถมี query params ได้หลายรูปแบบ [page:REQUIREMENTS_SPEC.html].  จึงต้องมีกฎว่ากรณีใดเป็น canonical query pages และกรณีใดควรถูก canonical กลับไปยัง base search หรือ geo/content landing page [page:FUNCTIONAL_SPEC.html].

แนวทางที่แนะนำคือ [code_file:540][page:FUNCTIONAL_SPEC.html]:

- base search pages อาจ canonical ไปที่ตัวเอง [page:FUNCTIONAL_SPEC.html]
- curated geo routes เช่น area pages ควรมี canonical ของตัวเองและไม่แข่งกับ random query URLs [page:REQUIREMENTS_SPEC.html]
- query combinations ที่มีค่ามากเกินไปหรือเกิดจาก faceted browsing ควรมี index control ตาม policy [page:FUNCTIONAL_SPEC.html]

### 2.3 Redirect over duplicate render

ถ้ามี route เก่าหรือ alternate slug ที่ยังเข้าถึง object เดิมได้ ควร redirect ไม่ใช่ปล่อยให้ render ซ้ำพร้อม canonical แค่ใน tag อย่างเดียว [file:462][page:FUNCTIONAL_SPEC.html].  วิธีนี้สะอาดกว่าในเชิง crawl budget, analytics และ UX [page:FUNCTIONAL_SPEC.html].

## 3. Multilingual architecture & hreflang

ระบบนี้มี requirement หลายภาษาอย่างชัดเจน แต่ discoverability จะพังทันทีหาก multilingual model ไม่ชัด [page:REQUIREMENTS_SPEC.html][file:462].

### 3.1 Locale pairing rules

ทุกหน้าที่มี translation พร้อมใช้ควรสร้าง alternate mapping ที่สมบูรณ์ระหว่าง `th`, `en`, `zh` [page:FUNCTIONAL_SPEC.html].  หากบาง object ยังไม่มี translation ครบ ควรใช้ rule ที่ชัดว่า:

- จะไม่ปล่อย route ของ locale นั้นเลย, หรือ [page:FUNCTIONAL_SPEC.html]
- จะปล่อยด้วย fallback content พร้อม canonical/hreflang policy ที่สอดคล้อง [page:FUNCTIONAL_SPEC.html]

### 3.2 Hreflang requirements

public page families ที่ควรมี hreflang อย่างน้อยได้แก่ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- homepage
- listing detail pages
- article pages
- service pages
- area pages
- FAQ/contact/requirement pages หากมี translation จริง

ระบบเดิมไม่มี hreflang ทั้งที่ตั้งใจรองรับหลายภาษา [file:462].  เวอร์ชันใหม่นี้จึงต้องถือว่า hreflang เป็น mandatory metadata layer สำหรับ translated surfaces [page:FUNCTIONAL_SPEC.html].

### 3.3 Language-specific slug policy

ทีมต้องตัดสินใจให้ชัดว่าจะใช้ localized slugs หรือ shared slugs across languages [page:FUNCTIONAL_SPEC.html].  ไม่ว่าทางเลือกใด ต้องทำให้สอดคล้องกับ translation model, CMS editing flow และ canonical generation [page:REQUIREMENTS_SPEC.html].

## 4. Taxonomy model

Taxonomy ในระบบนี้ต้องสะท้อนทั้งการค้นหา inventory และการจัดกลุ่ม content/GEO surfaces [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  มันไม่ควรเป็นแค่รายการ labels ที่แสดงสวยบนหน้า [code_file:540].

### 4.1 Primary taxonomy dimensions

อย่างน้อยระบบควรมี taxonomy dimensions ต่อไปนี้ [page:REQUIREMENTS_SPEC.html]:

- property type
- transaction type
- geography hierarchy (province/district/subdistrict/estate)
- industrial context / zone type
- article category
- service category
- FAQ category

### 4.2 Business significance

dimensions เหล่านี้ไม่ได้มีไว้แค่ทำเมนูหรือ filter UI แต่มีผลโดยตรงกับ [page:FUNCTIONAL_SPEC.html]:

- listing search queries [page:REQUIREMENTS_SPEC.html]
- area page generation [page:REQUIREMENTS_SPEC.html]
- internal linking graph [page:FUNCTIONAL_SPEC.html]
- breadcrumb labels [page:FUNCTIONAL_SPEC.html]
- structured data labels [page:FUNCTIONAL_SPEC.html]
- AI-readable topical organization [page:REQUIREMENTS_SPEC.html]

### 4.3 Zone type as real taxonomy

จากปัญหาเดิม zone type ถูกใช้เพียง badge/card metadata เป็นหลัก [file:457][file:462].  ใน build ใหม่ zone type ต้องถูกยกระดับเป็น real taxonomy dimension เพราะมีผลต่อ search intent และความเหมาะสมด้านโรงงาน/ใบอนุญาต [page:REQUIREMENTS_SPEC.html].

## 5. Geography & GEO layer

GEO ในที่นี้ไม่ได้หมายถึงแค่ geo-coordinates แต่หมายถึง architecture ของหน้าที่ตอบ intent เชิงพื้นที่ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  สำหรับธุรกิจ industrial property นี่เป็นแกนสำคัญ เพราะผู้ใช้มักค้นหาตามจังหวัด, นิคม, ถนนหลัก หรือพื้นที่เศรษฐกิจ [page:REQUIREMENTS_SPEC.html].

### 5.1 Geography hierarchy

ระบบควรมี geography hierarchy ที่คงที่อย่างน้อย [page:REQUIREMENTS_SPEC.html]:

- province
- district
- subdistrict
- industrial estate / area cluster (ถ้ามี)

hierarchy นี้ควรถูกใช้ร่วมกันระหว่าง listing engine, area pages, requirement preferences, breadcrumbs และ internal links [page:FUNCTIONAL_SPEC.html][page:SEQUENCE_DIAGRAMS.html].

### 5.2 Area pages as canonical GEO surfaces

แทนที่จะพึ่ง query-string landing pages อย่างเดียว ระบบควรมี area pages ที่เป็น canonical GEO surfaces สำหรับจังหวัด/อำเภอ/นิคมหรือกลุ่มพื้นที่สำคัญ [page:REQUIREMENTS_SPEC.html].  หน้าพวกนี้ควรประกอบด้วย [page:FUNCTIONAL_SPEC.html]:

- localized area introduction
- why this area matters
- inventory preview/query binding
- relevant services
- related guides/articles
- FAQ / internal links
- GEO-aware metadata

### 5.3 Shortcut routes vs canonical GEO routes

city/area shortcuts แบบเดิมอาจยังมีประโยชน์สำหรับ usability แต่ไม่ควรปล่อยให้ shortcut กลายเป็น discoverability architecture หลักโดยไม่มี canonical resolution [file:460][file:462].  shortcut routes ควร redirect หรือ normalize เข้าสู่ area pages หรือ canonical search contexts ที่ชัดเจน [page:FUNCTIONAL_SPEC.html].

## 6. Search-page indexing policy

หนึ่งในเรื่องที่มักสับสนที่สุดคือ listing search pages ควรถูก index แค่ไหน [page:FUNCTIONAL_SPEC.html].  หากปล่อยทุก faceted combination ให้ index หมด ระบบจะเกิด duplication และ thin pages จำนวนมาก [page:FUNCTIONAL_SPEC.html].

แนวทางที่แนะนำคือแบ่ง search surfaces ออกเป็น 3 ระดับ [code_file:540]:

### 6.1 Canonical indexable surfaces

ได้แก่ curated or meaningful public pages เช่น [page:FUNCTIONAL_SPEC.html][page:REQUIREMENTS_SPEC.html]:

- homepage
- listing base hub
- detail pages
- article pages
- service pages
- area pages

### 6.2 Conditionally indexable search pages

ได้แก่ search queries ที่มี intent ชัดและมีคุณค่าทาง SEO จริง เช่น property type + province หรือ transaction + important area combinations [page:FUNCTIONAL_SPEC.html].  policy กลุ่มนี้ควรควบคุมผ่าน rule engine หรือ curated landing strategy มากกว่าปล่อยอัตโนมัติทุก combination [page:FUNCTIONAL_SPEC.html].

### 6.3 Non-index search states

ได้แก่ query combinations ที่ละเอียดเกินไป, filter noise, sort/page combinations หรือ temporary compare-like states [page:FUNCTIONAL_SPEC.html].  หน้าเหล่านี้ยังต้องใช้งานได้ แต่ไม่ควรถูกมองเป็น canonical content assets [page:FUNCTIONAL_SPEC.html].

## 7. Metadata model

Metadata ควรเป็นระบบที่ผูกกับ page objects และ locale อย่างชัดเจน [page:FUNCTIONAL_SPEC.html].  ไม่ควรใช้ title/meta ซ้ำ site-wide แบบระบบเดิม [file:462].

### 7.1 Required metadata by page family

#### Homepage

ต้องมี metadata ที่สื่อ brand + core industrial property intent ในแต่ละภาษา [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

#### Listing results

ควรมี metadata ที่สัมพันธ์กับ search context ในระดับที่ canonical strategy อนุญาต [page:FUNCTIONAL_SPEC.html].  อย่างน้อย base listing hub ควรมี title/description ที่ต่างจาก detail/content pages ชัดเจน [page:REQUIREMENTS_SPEC.html].

#### Listing detail

ควรใช้ title/description เฉพาะ listing และ locale พร้อม canonical และ OG image ที่ถูกต้อง [page:FUNCTIONAL_SPEC.html][file:462].

#### Article / guide

ใช้ article-specific metadata และ article schema [page:FUNCTIONAL_SPEC.html].

#### Service / area pages

ต้องมี metadata ที่สอดคล้องกับ service intent หรือ geo intent ของหน้านั้น ไม่ควร reuse template เดียวทุกหน้าโดยไม่เติมบริบท [page:FUNCTIONAL_SPEC.html].

### 7.2 Open Graph & social metadata

OG tags และ social preview tags ต้องอิง production domain และ object-specific media [file:462][page:FUNCTIONAL_SPEC.html].  ปัญหาเดิมที่ชี้ไป staging host หรือใช้รูป/URL ไม่ถูกต้องต้องถือว่าเป็นข้อห้ามในระบบใหม่ [file:462].

## 8. Structured data strategy

Structured data เป็นอีกส่วนที่ระบบเดิมยังขาด depth [file:462].  เวอร์ชันใหม่ควรใช้ schema strategy ตาม page family [page:FUNCTIONAL_SPEC.html].

### 8.1 Site-level schema

- Organization [file:462]
- WebSite [file:462]

site-level schema ควรชี้ไป production domain ที่ถูกต้อง ไม่ใช่ staging host [file:462].

### 8.2 Page-level schema candidates

- BreadcrumbList สำหรับ pages ที่มี breadcrumb UI [file:462][page:FUNCTIONAL_SPEC.html]
- FAQPage สำหรับ FAQ hubs/pages [page:REQUIREMENTS_SPEC.html]
- Article สำหรับ guides/useful tips [page:FUNCTIONAL_SPEC.html]
- Service-like schemas หรือ equivalent structured representations สำหรับ service pages ตามความเหมาะสม [page:FUNCTIONAL_SPEC.html]
- Listing/Offer/Real-estate-related schema representation สำหรับ detail pages หาก business data พร้อม [page:FUNCTIONAL_SPEC.html]

### 8.3 Structured data quality rule

structured data ต้อง generated from the same canonical source model as UI content [page:FUNCTIONAL_SPEC.html].  ไม่ควรปล่อยให้ schema เป็น static boilerplate ที่ไม่สัมพันธ์กับ object จริง เพราะจะสร้าง data inconsistency [page:FUNCTIONAL_SPEC.html].

## 9. Breadcrumb strategy

Breadcrumbs ในระบบใหม่ไม่ควรมีเฉพาะ visible UI แต่ควรเป็น discoverability structure จริง [file:459][file:462][page:FUNCTIONAL_SPEC.html].  Breadcrumbs ควรสอดคล้องกับ route families และ taxonomy เช่น:

- Home → Listing → Province/Area → Detail [file:459]
- Home → Guides → Category → Article [page:FUNCTIONAL_SPEC.html]
- Home → Services → Service Page [page:REQUIREMENTS_SPEC.html]
- Home → Areas → Area Page [page:REQUIREMENTS_SPEC.html]

การออกแบบ breadcrumb ให้ชัดช่วยทั้ง user orientation, crawl paths และ structured data quality [page:FUNCTIONAL_SPEC.html].

## 10. Internal linking model

Discoverability ที่ดีไม่ได้อาศัย sitemap อย่างเดียว แต่ต้องมี internal linking graph ที่ intentional [page:FUNCTIONAL_SPEC.html].  ระบบ v1.1 ควรมี link graph อย่างน้อยดังนี้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- homepage → key services / key areas / featured listings / guides
- listing detail → related listings / relevant area page / contact / requirement
- area page → matching listings / related services / related guides / FAQ
- service page → related areas / relevant guides / requirement CTA
- article page → relevant services / areas / listing search or requirement CTA
- FAQ → contact / requirement / related service pages

การวาง graph แบบนี้ช่วยให้ inventory, expertise pages และ conversion routes เชื่อมถึงกันแบบมีเหตุผล ไม่ใช่แยกคนละเกาะ [page:FUNCTIONAL_SPEC.html].

## 11. Sitemap & robots policy

ระบบเดิมมีปัญหาร้ายแรงเพราะ sitemap และ robots ชี้ไป staging host [file:462].  build ใหม่จึงต้องกำหนด policy ชัดตั้งแต่ต้น [page:FUNCTIONAL_SPEC.html].

### 11.1 Sitemap requirements

sitemap ต้อง [file:462][page:FUNCTIONAL_SPEC.html]:

- ใช้ production canonical URLs เท่านั้น [file:462]
- แยกหรือจัดกลุ่มตาม page family ได้ เช่น listings, articles, services, areas [page:FUNCTIONAL_SPEC.html]
- รองรับ multilingual alternates อย่างเหมาะสม [page:FUNCTIONAL_SPEC.html]
- ไม่นำ non-canonical หรือ legacy redirected routes ไปใส่ [page:FUNCTIONAL_SPEC.html]

### 11.2 Robots requirements

robots.txt ต้องชี้ host และ sitemap อย่างถูกต้อง และควรสอดคล้องกับ indexing policy ของ search/faceted pages [file:462][page:FUNCTIONAL_SPEC.html].  หากมี search states ที่ไม่อยากให้ crawl/index ต้องจัดการระดับ meta/route policy อย่างรอบคอบ ไม่ใช่หวังให้ robots อย่างเดียวแก้ทั้งหมด [page:FUNCTIONAL_SPEC.html].

## 12. AI / LLM discoverability

Requirement Specification ระบุ llms.txt และ AI-search readiness ชัดเจน ทำให้ discoverability architecture ของระบบนี้ต้องมองเกิน classic SEO [page:REQUIREMENTS_SPEC.html].  เป้าหมายคือให้ systems ที่สรุปข้อมูลด้วย AI เข้าใจว่าเว็บนี้มี inventory, expertise, areas และ services อะไรบ้าง [page:SEQUENCE_DIAGRAMS.html][code_file:540].

### 12.1 llms.txt layer

ระบบควรมี llms.txt หรือ equivalent machine-readable layer ที่ชี้ไปยังหน้าและ surface สำคัญ เช่น [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- homepage
- service pages หลัก
- area pages หลัก
- article hubs หรือ guide clusters
- FAQ/support pages
- curated listing or inventory explanation pages (ถ้ามี)

### 12.2 AI-readable content principles

เพื่อให้ AI systems ใช้งานเนื้อหาได้ดี หน้า public ควร [page:FUNCTIONAL_SPEC.html]:

- มี heading hierarchy ที่ชัด
- มี metadata และ canonicals ที่ถูกต้อง
- ใช้ taxonomy และ internal links ที่ตีความได้ง่าย
- แยก content intent ของ service/area/article/listing ให้ชัด

AI discoverability ไม่ใช่ layer แยกจาก SEO แต่เป็นผลลัพธ์ของ information architecture และ content quality ที่ดี [page:REQUIREMENTS_SPEC.html][code_file:540].

## 13. CMS implications for SEO & taxonomy

เพื่อให้ discoverability architecture นี้ใช้งานจริง CMS/admin ต้องรองรับ metadata และ taxonomy operations อย่างชัดเจน [page:FUNCTIONAL_SPEC.html].  อย่างน้อยควรมี surfaces สำหรับ [page:FUNCTIONAL_SPEC.html][page:REQUIREMENTS_SPEC.html]:

- edit meta title/description/canonical
- preview hreflang sets
- manage localized slugs
- manage area pages / service pages
- assign article/FAQ categories
- configure internal links / related content
- preview structured data
- manage llms entries or exports

หากไม่มี surfaces เหล่านี้ ทีมจะต้องแก้ discoverability ผ่านโค้ดหรือ manual hacks ตลอดเวลา ซึ่งไม่ scale [page:FUNCTIONAL_SPEC.html].

## 14. Suggested implementation guardrails

เพื่อให้ทีมใช้งานเอกสารนี้ได้ทันที ควรกำหนด guardrails ระดับระบบดังนี้ [code_file:540][page:FUNCTIONAL_SPEC.html]:

- ทุก public page family ต้อง declare canonical generation rule
- ทุก translated public object ต้อง declare hreflang policy
- ทุก legacy route ต้อง declare redirect target หรือ deprecation strategy
- ทุก page family ต้อง declare metadata owner/source of truth
- search/indexing policy ต้องแยกระหว่าง canonical landers กับ faceted browsing states
- sitemap generation ต้องอิง canonical production URLs เท่านั้น
- breadcrumb UI และ breadcrumb schema ต้องอิง hierarchy เดียวกัน
- llms.txt หรือ AI-readable exports ต้องอิง curated high-quality pages ไม่ใช่ random URLs

## What changed from the previous version

เมื่อเทียบกับ `05_seo_and_taxonomy.md` เดิม ความเปลี่ยนแปลงสำคัญมีดังนี้ [file:462][code_file:540]:

- เดิมเป็นรายงานปัญหา SEO/taxonomy ของระบบเก่า แต่ฉบับนี้แปลงเป็น discoverability architecture สำหรับระบบใหม่ [file:462][page:FUNCTIONAL_SPEC.html]
- เดิมเน้นตรวจ metatags, sitemap, canonical gaps แต่ฉบับนี้เชื่อม URL, taxonomy, GEO pages, metadata, structured data และ AI discoverability เข้าด้วยกัน [page:REQUIREMENTS_SPEC.html][code_file:540]
- เดิมชี้ปัญหา dual URLs และ locale inconsistency แต่ฉบับนี้ให้ canonical/redirect rules ที่ใช้เป็น implementation baseline ได้ [file:462][file:460][page:FUNCTIONAL_SPEC.html]
- เดิมยังไม่ยกระดับ zone type, area pages และ service pages ให้เป็นส่วนหนึ่งของ taxonomy/discoverability layer อย่างเต็มรูป แต่ฉบับนี้จัดให้เป็น first-class structure [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]

## สรุป

`05_seo_and_taxonomy.md` เวอร์ชันนี้นิยาม SEO และ taxonomy ใหม่ให้เป็น **discoverability architecture ของทั้งแพลตฟอร์ม** ครอบคลุม route model, canonical rules, multilingual indexing, taxonomy design, GEO surfaces, metadata, structured data, sitemap policy และ AI-readable layers [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][file:462][code_file:540].  เอกสารนี้จึงเหมาะใช้เป็น baseline สำหรับการออกแบบ routing, SEO metadata generation, CMS capabilities, area/service content strategy และการทำให้ระบบ v1.1 ถูกค้นเจอได้อย่างถูกต้องทั้งใน search engines และ AI search environments [page:SEQUENCE_DIAGRAMS.html][code_file:540].
