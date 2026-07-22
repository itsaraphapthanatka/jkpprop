# 01 Page Types — v2 (System Surface Map)

เอกสารนี้เป็นเวอร์ชันปรับปรุงเต็มของ `01_page_types.md` โดยยกระดับจากรายงานสำรวจชนิดหน้าของเว็บไซต์เดิม ไปเป็น **system surface map** สำหรับ Industrial Property Platform v1 ซึ่งครอบคลุมทั้ง Public Website, Search & Detail Surfaces, Lead Intake Surfaces, Content/GEO Surfaces และ Admin / Operations Surfaces ตามโครงที่สเปก v1.1 กำหนดไว้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][file:460][code_file:540].

เป้าหมายของเอกสารนี้คือทำให้ทุกฝ่ายเข้าใจร่วมกันว่า “page types” ในระบบใหม่ไม่ได้หมายถึงแค่รายชื่อหน้าบนเว็บ public แต่หมายถึง families ของ surfaces ที่ผู้ใช้แต่ละ role มองเห็นและใช้งานจริง ทั้งฝั่งลูกค้าภายนอกและฝั่งทีมงานภายใน [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][code_file:540].

## บทบาทของเอกสารนี้

`01_page_types.md` ควรถูกใช้เป็นเอกสารตั้งต้นสำหรับ [page:FUNCTIONAL_SPEC.html][code_file:540]:

- วาง sitemap และ route families [page:REQUIREMENTS_SPEC.html]
- แยกขอบเขตระหว่าง public pages กับ admin modules [page:FUNCTIONAL_SPEC.html]
- ใช้เป็นฐานสำหรับ IA, component inventory และ API/page contracts [code_file:540]
- กำหนด QA coverage ระดับ page family [page:FUNCTIONAL_SPEC.html]
- สร้าง shared vocabulary ระหว่าง product, design, frontend, backend และ content teams [page:FUNCTIONAL_SPEC.html]

## หลักการของ page types v2

ฉบับใหม่นี้ยึดหลักการสำคัญ 5 ข้อ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

1. Page types ต้องสะท้อน **system surfaces** ไม่ใช่เพียง public URLs [code_file:540].
2. Public discovery pages, content pages, conversion pages และ admin workspaces ต้องถูกแยกกันชัดเจน [page:REQUIREMENTS_SPEC.html].
3. หน้าที่ query-driven เช่น listing search ต้องถูกมองต่างจาก CMS-driven pages เช่น article หรือ service page [page:FUNCTIONAL_SPEC.html].
4. Admin screens ที่เป็น object workspaces ควรถูกนับเป็น page types family ด้วย เพราะมีพฤติกรรมและขอบเขตเฉพาะ [page:FUNCTIONAL_SPEC.html].
5. ทุก page family ต้อง map กลับไปยัง actor, object model และ workflow ได้ [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html].

## ภาพรวม families ของ page types

สำหรับระบบ v1.1 page types สามารถจัดได้เป็น 7 families หลัก [code_file:540][page:FUNCTIONAL_SPEC.html]:

1. Brand & trust pages
2. Discovery & listing pages
3. Detail & comparison pages
4. Lead intake & conversion pages
5. Content & GEO pages
6. Utility & system-state pages
7. Admin / operations surfaces

การแบ่งแบบนี้ทำให้เอกสาร page types เชื่อมต่อกับ IA และ component inventory ได้ชัดกว่าการไล่ทีละ URL แบบสำรวจเว็บไซต์อย่างเดียว [page:FUNCTIONAL_SPEC.html][code_file:540].

## 1. Brand & trust pages

family นี้คือหน้าที่ช่วยสร้างความน่าเชื่อถือ, แนะนำบริษัท, อธิบายบริการในภาพกว้าง และช่วยให้ผู้ใช้เข้าใจว่าแพลตฟอร์มนี้คือใครและช่วยอะไรได้ [page:REQUIREMENTS_SPEC.html][file:460].  แม้จะไม่ใช่ discovery engine โดยตรง แต่มีผลต่อ conversion อย่างมาก เพราะธุรกิจนี้เป็น broker-assisted model ไม่ใช่ self-serve checkout [page:REQUIREMENTS_SPEC.html].

### 1.1 Homepage

Homepage เป็น primary entry surface ของ public web [file:460][page:REQUIREMENTS_SPEC.html].  หน้าที่หลักของ homepage คือ:

- แนะนำแบรนด์และ value proposition [file:460]
- เปิดทางเข้าสู่ search/listing flow [page:REQUIREMENTS_SPEC.html]
- แสดง trust modules เช่น credentials, proof, how it works [file:460]
- ชี้ไปยัง requirement/contact conversion paths [page:REQUIREMENTS_SPEC.html]

ในระบบใหม่ homepage ต้องรองรับหลายภาษาและอาจมีส่วนที่เป็น curated content เช่น featured listings, key areas, top services และ guide links [page:FUNCTIONAL_SPEC.html].

### 1.2 About / company page

หน้าประเภท about/company ใช้สื่อความน่าเชื่อถือ, positioning และประสบการณ์ของบริษัท [file:460].  สำหรับธุรกิจอสังหาฯ อุตสาหกรรม หน้านี้มีบทบาทมากกว่าการเล่าเรื่องแบรนด์ทั่วไป เพราะช่วยยืนยันว่าทีมเข้าใจ market, regulation และ brokerage process จริง [page:REQUIREMENTS_SPEC.html].

### 1.3 Contact page

Contact page เป็นทั้ง trust page และ conversion page [file:460][page:REQUIREMENTS_SPEC.html].  แม้จะเป็นหน้าข้อมูลติดต่อ แต่ในระบบใหม่นับเป็น bridge surface ระหว่าง public web กับ CRM intake [page:SEQUENCE_DIAGRAMS.html].

### 1.4 FAQ page

FAQ ช่วยตอบคำถามที่พบบ่อยและลด friction ก่อนผู้ใช้จะตัดสินใจติดต่อ [file:460][page:REQUIREMENTS_SPEC.html].  ในระบบใหม่ FAQ ไม่ควรเป็นแค่ static accordion page แต่ควรเป็น searchable/supportive knowledge surface ที่เชื่อมกับ service pages, requirement CTA และ structured data ได้ [page:FUNCTIONAL_SPEC.html].

## 2. Discovery & listing pages

family นี้คือแกนกลางของ public inventory discovery [page:REQUIREMENTS_SPEC.html][file:457].  หน้ากลุ่มนี้มีลักษณะเด่นคือ query-driven, filter-heavy และต้องเชื่อมต่อโดยตรงกับ listing engine [page:FUNCTIONAL_SPEC.html].

### 2.1 Listing hub / search results page

Listing results page คือหน้าที่แสดง inventory ผ่าน filters, sorting และ pagination [file:460][file:457].  ในระบบใหม่หน้าประเภทนี้ต้องถูกมองเป็น **search surface** ไม่ใช่ static listing directory [page:FUNCTIONAL_SPEC.html].

บทบาทหลักคือ:
- รับ query state จาก homepage, area pages หรือ direct URL [page:REQUIREMENTS_SPEC.html]
- แสดงผล listings ที่ผ่าน exposure rules [page:FUNCTIONAL_SPEC.html]
- เปิดทางเข้าสู่ detail page, compare และ inquiry [page:SEQUENCE_DIAGRAMS.html]

### 2.2 Filtered search states

search page ที่มี query params เช่น property type, location, transaction, zone type หรือ price ranges ถือเป็น page-state family ย่อยของ listing hub [file:457][page:REQUIREMENTS_SPEC.html].  แม้ทางเทคนิคจะอยู่บน route เดียวกัน แต่ในมุม page types ควรนับว่าเป็น **search result variants** ที่มี discoverability policy ต่างกัน [page:FUNCTIONAL_SPEC.html].

### 2.3 Area or geo-filter entry pages

ในระบบเดิมมี city/area shortcuts ที่ map เข้าสู่ listing filters แบบไม่สม่ำเสมอ [file:460][file:462].  ในระบบใหม่ page type นี้ควรถูก normalize เป็น geo-entry surfaces ที่อาจเป็นได้ทั้ง:

- canonical area pages [page:REQUIREMENTS_SPEC.html]
- curated search landers [page:FUNCTIONAL_SPEC.html]
- redirects ไป canonical geo routes [page:FUNCTIONAL_SPEC.html]

## 3. Detail & comparison pages

family นี้คือ pages ที่ใช้ประเมิน inventory รายตัวหรือหลายตัวแบบเจาะลึก [page:REQUIREMENTS_SPEC.html][file:459].  หาก discovery pages ช่วย “หา” หน้ากลุ่มนี้ช่วย “ตัดสินใจ” [page:FUNCTIONAL_SPEC.html].

### 3.1 Listing detail page

Detail page เป็น object-centric page ของ listing หนึ่งรายการ [file:459][page:REQUIREMENTS_SPEC.html].  หน้าที่หลักคือ:

- แสดง commercial identity ของ listing [page:REQUIREMENTS_SPEC.html]
- แสดง gallery, specs, location summary และ features [file:459]
- เปิด conversion ผ่าน inquiry module [file:458][page:SEQUENCE_DIAGRAMS.html]
- แนะนำ related listings เพื่อกัน dead-end [page:FUNCTIONAL_SPEC.html]

### 3.2 Compare page

Compare page เป็น page type แยกจาก search และ detail แม้จะอิง listing identities เดียวกัน [page:REQUIREMENTS_SPEC.html].  หน้านี้มีเป้าหมายเพื่อให้ผู้ใช้เปรียบเทียบ listings หลายรายการ side-by-side ก่อนตัดสินใจติดต่อหรือ shortlist ทาง mental model [page:FUNCTIONAL_SPEC.html].

### 3.3 Related / recommended listing surfaces

แม้จะไม่จำเป็นต้องเป็น route แยกเสมอไป แต่ในเชิง page type family ควรนับ related listings surface เป็น detail-page extension ที่มีพฤติกรรมกึ่ง page-level เพราะใช้ query logic, card contracts และ navigation ของตัวเอง [page:FUNCTIONAL_SPEC.html].

## 4. Lead intake & conversion pages

ในระบบนี้ conversion ไม่ได้จบที่ปุ่ม “ติดต่อเรา” แต่เริ่ม lead workflow เข้าสู่ CRM [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].  ดังนั้นหน้ากลุ่มนี้ต้องถูกยกระดับเป็น page family ชัดเจน [page:REQUIREMENTS_SPEC.html].

### 4.1 Contact page as intake surface

แม้ contact page จะถูกจัดไว้ใน trust pages ด้วย แต่ในมุม workflow มันเป็น general inquiry intake surface [file:458][page:REQUIREMENTS_SPEC.html].  จึงควรนับเป็น page type เชิง conversion ด้วย [page:SEQUENCE_DIAGRAMS.html].

### 4.2 Requirement form / requirement wizard page

นี่คือ page type สำคัญของระบบใหม่ เพราะเป็น structured intake flow สำหรับบริษัทที่มี requirement ชัด [page:REQUIREMENTS_SPEC.html].  หน้าประเภทนี้ต่างจาก contact form ตรงที่เก็บข้อมูลเพียงพอสำหรับ matching และ shortlist workflow ตั้งแต่แรก [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].

### 4.3 Listing-bound inquiry surface

นี่ไม่จำเป็นต้องเป็น full page แยก route เสมอไป แต่เป็น **conversion page state** ภายใน detail page [file:458][page:SEQUENCE_DIAGRAMS.html].  ในเอกสาร page types ควรนับไว้เพราะมันมี logic, payload และ CRM outcome ต่างจาก contact page ทั่วไป [page:FUNCTIONAL_SPEC.html].

## 5. Content & GEO pages

สเปก v1.1 ขยายระบบให้มี content strategy จริงจัง ดังนั้น page types ของระบบใหม่ต้องรวม editorial และ GEO pages อย่างเป็นทางการ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### 5.1 Guides hub

hub สำหรับ useful tips / articles เป็น page type ที่รวบรวมความรู้เชิงธุรกิจและช่วยดึง traffic ระดับ informational intent [page:REQUIREMENTS_SPEC.html].  มันต่างจาก homepage เพราะเน้น discoverability ผ่านความรู้มากกว่า inventory โดยตรง [page:FUNCTIONAL_SPEC.html].

### 5.2 Article detail page

article detail page ใช้รองรับ long-form หรือ semi-structured content เช่น licensing, area selection, rent vs buy และ operational guidance [page:REQUIREMENTS_SPEC.html].  หน้าประเภทนี้ควรเชื่อมไปยัง services, areas และ requirement CTA อย่างมีเหตุผล [page:FUNCTIONAL_SPEC.html].

### 5.3 Service pages

service pages คือ intent-driven pages ที่ตอบว่าแพลตฟอร์มหรือทีมช่วยอะไรได้บ้าง เช่น brokerage, site search assistance, relocation advisory หรือ service group อื่นตาม business scope [page:REQUIREMENTS_SPEC.html].  หน้ากลุ่มนี้ควรเป็น canonical content assets ที่มี CTA ชัดและเชื่อมกับ FAQ, articles และ requirement flow [page:FUNCTIONAL_SPEC.html].

### 5.4 Area pages

area pages เป็น GEO-first content surfaces สำหรับจังหวัด, อำเภอ, นิคม หรือ cluster ที่สำคัญ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  Page type นี้สำคัญมากสำหรับธุรกิจ industrial property เพราะ geography เป็นหนึ่งใน search intents หลัก [page:REQUIREMENTS_SPEC.html].

## 6. Utility & system-state pages

นอกจากหน้าหลักตาม business intent แล้ว ระบบต้องมี page types สำหรับ state และ fallback behavior ด้วย [file:460][page:FUNCTIONAL_SPEC.html].  แม้หน้าพวกนี้มักถูกมองข้าม แต่มีผลต่อ UX และ technical correctness สูง [page:FUNCTIONAL_SPEC.html].

### 6.1 Not-found detail state

ในระบบเดิม invalid property slug นำไปสู่หน้า document 200 แต่ data fetch 404 แล้ว frontend render “Property not found” [file:460].  ในระบบใหม่ not-found detail ควรถูกนิยามเป็น page/state type ชัดเจน พร้อม policy ด้าน routing, SEO และ monitoring [page:FUNCTIONAL_SPEC.html].

### 6.2 Generic 404 page

ระบบใหม่ควรมี generic 404 page สำหรับ routes ที่ไม่รู้จักจริง ไม่ใช่ใช้เฉพาะ client-side empty state [page:FUNCTIONAL_SPEC.html].  หน้าประเภทนี้ควรช่วยพาผู้ใช้กลับไปยัง search, homepage หรือ contact surfaces ได้ [page:FUNCTIONAL_SPEC.html].

### 6.3 Empty search state

search ที่ไม่พบผลลัพธ์เป็น page-state ที่ควรถูกนับใน family นี้ เพราะมี UX และ conversion behavior เฉพาะ เช่น reset filters หรือส่ง requirement ให้ทีมช่วยหา [file:457][page:REQUIREMENTS_SPEC.html].

### 6.4 Permission or unavailable states

ในอนาคต admin surfaces และ client-token views อาจมี permission-denied, expired-link หรือ unavailable states ที่ควรถูกออกแบบเป็น surface ชัดเจน [page:FUNCTIONAL_SPEC.html].

## 7. Admin / operations surfaces

นี่คือส่วนที่หายไปจากเวอร์ชันเดิมมากที่สุด เพราะรายงานเก่ามองเฉพาะเว็บไซต์ public [file:460][code_file:540].  แต่ในระบบ v1.1 admin workspaces เป็น page type families ที่จำเป็นและมีจำนวนมาก [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### 7.1 Admin dashboard

dashboard เป็น landing surface หลัง login สำหรับทีมงาน [page:FUNCTIONAL_SPEC.html].  หน้าประเภทนี้ควรสรุปงานค้าง, leads ใหม่, visits ที่กำลังจะเกิด, deals ที่ต้องติดตาม และ alerts สำคัญ [page:FUNCTIONAL_SPEC.html].

### 7.2 CRM list & detail surfaces

family นี้รวม [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- lead list
- lead detail
- requirement detail
- tasks / activities related workspaces

มันเป็น object workspaces มากกว่าหน้าเว็บธรรมดา เพราะใช้สำหรับการทำงานต่อเนื่อง, เปลี่ยนสถานะ, assign งาน และเก็บ notes [page:FLOWCHARTS.html].

### 7.3 Shortlist / visit / negotiation / deal surfaces

นี่คือ workflow surfaces สำหรับ brokerage execution [page:SEQUENCE_DIAGRAMS.html][page:FUNCTIONAL_SPEC.html].  page types กลุ่มนี้ได้แก่:

- shortlist builder/detail
- visit planner/calendar/detail
- negotiation case page
- deal detail/list

แต่ละหน้ามี object model, permissions และ state transitions ของตัวเอง จึงควรถูกนับเป็น page families เต็มรูป [page:FUNCTIONAL_SPEC.html].

### 7.4 Inventory management surfaces

family นี้รวม [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- property list/detail/edit
- listing list/detail/edit
- media management surfaces
- publish/readiness views

หน้ากลุ่มนี้ต่างจาก public listing pages เพราะหน้าที่คือจัดการ source-of-truth และ publishability ไม่ใช่ discovery [page:UML_CLASS_DIAGRAM.html].

### 7.5 CMS / SEO / GEO admin surfaces

เมื่อระบบมี content strategy และ multilingual support จริงจัง ต้องมี page types ฝั่ง admin สำหรับ [page:FUNCTIONAL_SPEC.html][page:REQUIREMENTS_SPEC.html]:

- pages/articles/FAQ lists and editors
- service page editor
- area page editor
- SEO metadata editor/preview
- translation workspaces
- llms/AI discoverability config surfaces

### 7.6 Governance surfaces

สุดท้าย ระบบใหม่ควรมี admin page types สำหรับ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- user management
- roles/permissions
- settings
- audit logs

หน้ากลุ่มนี้ไม่ใช่ content หรือ operations โดยตรง แต่เป็น control surfaces ของระบบ [page:FUNCTIONAL_SPEC.html].

## Actor mapping by page family

เพื่อให้ page types เชื่อมกับระบบจริง ควร map actors กับ page families ชัดเจน [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

| Page family | Primary actors |
|---|---|
| Brand & trust pages | Public visitors [page:REQUIREMENTS_SPEC.html] |
| Discovery & listing pages | Public visitors, sales agents (for reference/use) [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html] |
| Detail & comparison pages | Public visitors, sales agents [page:REQUIREMENTS_SPEC.html] |
| Lead intake & conversion pages | Public visitors, CRM intake workflows [page:SEQUENCE_DIAGRAMS.html] |
| Content & GEO pages | Public visitors, content-driven discovery [page:REQUIREMENTS_SPEC.html] |
| Utility & system-state pages | Public visitors, all users depending on error/state [page:FUNCTIONAL_SPEC.html] |
| Admin / operations surfaces | Sales agents, listing managers, ops coordinators, content editors, translators, super admins [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html] |

## Recommended route examples by family

เพื่อใช้เป็นแนวทาง route planning ขั้นต้น page families เหล่านี้อาจ map เป็นตัวอย่าง route แบบนี้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- `/{lang}` — homepage
- `/{lang}/about-us`
- `/{lang}/contact`
- `/{lang}/faq`
- `/{lang}/listing`
- `/{lang}/listing/{slug}`
- `/{lang}/listing-compare`
- `/{lang}/requirement`
- `/{lang}/guides`
- `/{lang}/guides/{slug}`
- `/{lang}/services/{slug}`
- `/{lang}/areas/{slug}`
- `/admin`
- `/admin/leads`
- `/admin/leads/{id}`
- `/admin/shortlists/{id}`
- `/admin/visits/{id}`
- `/admin/listings/{id}`
- `/admin/cms/articles/{id}`
- `/admin/areas/{id}`
- `/admin/settings`

## What changed from the previous version

เมื่อเทียบกับ `01_page_types.md` เดิม ความเปลี่ยนแปลงสำคัญมีดังนี้ [file:460][code_file:540]:

- เดิมเป็น page inventory ของ public site ที่สังเกตจากเว็บจริง แต่ฉบับนี้ยกระดับเป็น system surface map ของทั้งแพลตฟอร์ม [file:460][page:FUNCTIONAL_SPEC.html]
- เดิมยังไม่มี admin / operations / CMS surfaces เป็น page families แต่ฉบับนี้รวมครบ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
- เดิม city/area shortcuts และ not-found ถูกเล่าแบบ behavior notes แต่ฉบับนี้จัดเป็น utility/GEO page families พร้อมความหมายในระบบ [file:460][file:462]
- เดิมยังไม่เชื่อม page types กับ actor model และ workflows แต่ฉบับนี้ map กลับไปยัง roles และ business surfaces ชัดเจน [page:SEQUENCE_DIAGRAMS.html][code_file:540]

## สรุป

`01_page_types.md` เวอร์ชันนี้เปลี่ยนจาก “รายการหน้าที่พบในเว็บเดิม” ไปเป็น **system surface map ของแพลตฟอร์ม v1.1** ที่ครอบคลุมทั้ง public web, discovery, conversion, content/GEO, utility states และ admin operations [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][file:460][code_file:540].  เอกสารนี้เหมาะใช้เป็น baseline สำหรับการทำ sitemap, route planning, IA alignment, QA coverage และการสื่อสารข้ามทีมว่าระบบนี้มี surfaces อะไรบ้างและแต่ละ surface มีหน้าที่อะไร [page:SEQUENCE_DIAGRAMS.html][code_file:540].
