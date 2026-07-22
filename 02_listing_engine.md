# 02 Listing Engine — v2 (Search, Query, Inventory Exposure)

เอกสารนี้เป็นเวอร์ชันปรับปรุงเต็มของ `02_listing_engine.md` โดยยกระดับจากการสังเกตพฤติกรรม listing page เดิม มาเป็น **listing engine specification-oriented rewrite** ที่อธิบายบทบาทของ search, filter, query model, public inventory exposure, compare behavior และความสัมพันธ์ระหว่าง listing search กับ brokerage workflow ของ Industrial Property Platform v1 [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][file:457][file:462][code_file:540].

เป้าหมายของเอกสารนี้คือทำให้ทีมมีภาพเดียวกันว่า “listing engine” ไม่ใช่แค่หน้ารวมการ์ดทรัพย์ แต่เป็นระบบที่แปลง inventory ภายในให้กลายเป็น public discovery surface ที่ค้นหาได้, แชร์ได้, ทำ SEO ได้ และนำไปใช้ต่อใน shortlist/lead conversion ได้จริง [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html][code_file:540].

## บทบาทของ listing engine ในระบบ

ตามสเปก v1.1 listing engine คือแกนกลางของ public discovery layer และเป็นสะพานระหว่าง inventory management กับ lead generation [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  ฝั่งลูกค้าใช้เพื่อค้นหาทรัพย์ที่ตรงความต้องการ ส่วนฝั่งทีมขายใช้เป็นแหล่ง candidate inventory สำหรับ matching และ shortlist building [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].

ดังนั้น listing engine ต้องตอบโจทย์พร้อมกัน 5 ด้าน [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

1. public search & filtering
2. inventory exposure with safe and correct data
3. SEO/GEO discoverability through queryable routes
4. shortlist/CRM interoperability
5. compare and conversion support

## Core concepts

ก่อนลงลึกใน query/filter behavior ต้องยืนยัน core concepts ของ listing engine ให้ชัด [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html]:

- Public search layer แสดง **listing** ไม่ใช่ raw property records [page:REQUIREMENTS_SPEC.html]
- Listing เป็น offer object ที่ผูกกับ property และมี state เรื่อง publishability, pricing, availability และ visibility [page:FUNCTIONAL_SPEC.html]
- Search results ต้อง render เฉพาะ listings ที่ผ่านเงื่อนไข exposure rules [page:REQUIREMENTS_SPEC.html]
- Search state ต้อง encode ได้ผ่าน URL/query params เพื่อให้แชร์ลิงก์และทำ index ได้ [page:FUNCTIONAL_SPEC.html]
- Query behavior ต้องสอดคล้องกับ brokerage workflow เพราะผลค้นหาคือ input ของ shortlist flow ด้วย [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html]

## Inventory exposure rules

listing engine ไม่ควร expose inventory แบบตรงไปตรงมาทั้งหมดจากฐานข้อมูล แต่ต้องมีกฎในการคัดว่าอะไร public ได้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  อย่างน้อย exposure rules ควรยึดเงื่อนไขดังนี้:

- listing ต้องอยู่ในสถานะ published/active [page:REQUIREMENTS_SPEC.html]
- ต้องมีข้อมูลขั้นต่ำที่เพียงพอ เช่น title/summary, location hierarchy ที่ใช้แสดงผลได้, price context ตาม transaction type และภาพ cover [page:FUNCTIONAL_SPEC.html]
- ต้องมี translation หรือ fallback behavior ที่เหมาะสมสำหรับ locale ที่เรียกใช้งาน [page:REQUIREMENTS_SPEC.html]
- ต้องเคารพ `map_visibility_level` และ privacy rules [page:REQUIREMENTS_SPEC.html]
- inventory ที่หมดอายุ, ไม่พร้อม, หรือถูกซ่อน ต้องไม่ถูกแสดงใน public queries โดยไม่ตั้งใจ [page:FUNCTIONAL_SPEC.html]

กฎเหล่านี้สำคัญทั้งในมุม UX, legal/privacy และ operational correctness เพราะผลค้นหาที่ผิดหรือล้าสมัยจะกระทบทั้ง trust และคุณภาพของ shortlist downstream [page:SEQUENCE_DIAGRAMS.html][page:FUNCTIONAL_SPEC.html].

## Canonical route model

สเปก v1.1 รองรับ public multilingual routes ดังนั้น listing engine ต้องใช้ route model ที่สม่ำเสมอ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  baseline ที่แนะนำคือ:

- `/th/listing`
- `/en/listing`
- `/zh/listing`

Search state ทั้งหมดควรถูก encode เป็น query string แทนการซ่อน state ใน client memory [page:FUNCTIONAL_SPEC.html].  สิ่งนี้ช่วยให้หน้า listing กลายเป็น shareable and crawlable search surface มากกว่าจะเป็น SPA state ชั่วคราว [page:REQUIREMENTS_SPEC.html].

### Query string as source of truth

listing page state ควรถือว่า query string เป็น source of truth ของ search context [page:FUNCTIONAL_SPEC.html].  ตัวอย่างเช่น:

- `type`
- `status` หรือ `transaction_type`
- `province`
- `district`
- `subdistrict`
- `estate`
- `zone_type`
- `q`
- min/max ranges ต่าง ๆ
- `sort`
- `page`

แนวทางนี้ช่วยให้ browser navigation, deep-linking, compare return paths และ SEO landing behaviors ทำงานได้สม่ำเสมอ [page:FUNCTIONAL_SPEC.html][file:462].

## Required filter dimensions

จาก Requirement Specification และปัญหาที่พบในระบบเดิม listing engine ใหม่ควรรองรับ filter dimensions ที่ชัดและเป็น first-class [page:REQUIREMENTS_SPEC.html][file:457][file:462].

### 1. Property type

filter ตามประเภททรัพย์ เช่น warehouse, factory, land หรือ mixed/other ตาม taxonomy ที่ระบบกำหนด [page:REQUIREMENTS_SPEC.html].  filter นี้เป็นหนึ่งใน intent หลักของผู้ใช้และมักถูกใช้ตั้งแต่หน้าแรก [page:REQUIREMENTS_SPEC.html].

### 2. Transaction type

ต้องรองรับอย่างน้อย `rent`, `sale`, `both` หรือรูปแบบ equivalent [page:REQUIREMENTS_SPEC.html].  จุดสำคัญคือผลลัพธ์และการแสดงราคาใน card/detail ต้องสัมพันธ์กับ transaction context ที่ผู้ใช้เลือก [page:FUNCTIONAL_SPEC.html].

### 3. Geography hierarchy

ระบบควรรองรับ location filters อย่างน้อยในระดับ [page:REQUIREMENTS_SPEC.html]:

- province
- district
- subdistrict
- industrial estate / area cluster (ถ้ามี)

location filters ไม่ควรเป็นเพียง label decorative บน card แต่เป็น query dimensions จริงที่ใช้ได้ทั้งกับ public search และ area pages [page:FUNCTIONAL_SPEC.html][file:462].

### 4. Zone / industrial context

จากการสังเกตเดิม zone type มักโผล่เป็น badge แต่ยังไม่ทำงานเป็น filter ระดับระบบ [file:457][file:462].  ใน build ใหม่ `zone_type` หรือ equivalent industrial context ต้องเป็น query dimension ที่ใช้ได้จริง เพราะมีผลโดยตรงกับการตัดสินใจเชิงโรงงานและใบอนุญาต [page:REQUIREMENTS_SPEC.html].

### 5. Size filters

ควรมี min/max สำหรับ area ที่สอดคล้องกับ inventory model เช่น land area, built-up area หรือ usable area ตาม public strategy ที่เลือก [page:REQUIREMENTS_SPEC.html].  อย่างน้อยระบบ public ต้องมีช่วงขนาดที่ลูกค้าใช้คัดกรอง inventory ได้จริง [page:FUNCTIONAL_SPEC.html].

### 6. Price filters

ควร support min/max ranges สำหรับเช่าและ/หรือขายตาม transaction context [page:REQUIREMENTS_SPEC.html].  หาก listing เป็น `both` ต้องมี logic ชัดว่าจะ match และแสดงอย่างไรเมื่อผู้ใช้เลือก rent หรือ sale filters [page:FUNCTIONAL_SPEC.html].

### 7. Special constraints / booleans

ตาม requirement และบริบทธุรกิจ industrial property อาจมี booleans หรือ special filters เช่น [page:REQUIREMENTS_SPEC.html]:

- factory license possible
- featured
- ready to move in
- near port / airport / Bangkok (ถ้าทำ public-facing) [page:REQUIREMENTS_SPEC.html]

## Query semantics and matching rules

listing engine ที่ดีไม่ได้มีแค่ filters มาก แต่ต้องมีกติกาการ match ที่ชัด [page:FUNCTIONAL_SPEC.html].  หากไม่กำหนด semantics ไว้ตั้งแต่ต้น ระบบจะเกิดผลลัพธ์ที่ผู้ใช้ตีความยากและทีม QA ตรวจยาก [code_file:540].

### Transaction matching

กติกาแนะนำคือ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- ถ้าผู้ใช้เลือก `rent` ให้แสดง listings ที่ `transaction_type = rent` และ `transaction_type = both` [page:FUNCTIONAL_SPEC.html]
- ถ้าผู้ใช้เลือก `sale` ให้แสดง listings ที่ `transaction_type = sale` และ `transaction_type = both` [page:FUNCTIONAL_SPEC.html]
- ถ้าเลือกทั้งสองหรือไม่เลือกเลย อาจใช้ business default ที่ชัดเจน เช่น show all published listings [page:FUNCTIONAL_SPEC.html]

### Range matching

size/price ranges ต้องใช้ inclusive logic ที่เข้าใจง่าย และต้องชัดว่าหมายถึง field ไหนในกรณีมีหลายตัวเลือกของพื้นที่ [page:REQUIREMENTS_SPEC.html].  หากระบบเลือกใช้ primary public area field ตัวเดียว ต้องระบุใน spec ให้ชัดเพื่อเลี่ยงการ mismatch กับข้อมูลภายใน [page:FUNCTIONAL_SPEC.html].

### Keyword matching

`q` หรือ keyword search ควรใช้กับ normalized searchable fields เช่น title, public code, area labels และบางส่วนของ summary text [page:FUNCTIONAL_SPEC.html].  ไม่ควรใช้ keyword แบบ uncontrolled กับ internal-only fields หรือ data ที่ไม่ควรถูกเปิดเผย [page:FUNCTIONAL_SPEC.html].

### Null / missing value behavior

query engine ต้องมีกฎชัดสำหรับข้อมูลที่ขาด เช่น listing ไม่มีบางค่าของ technical spec หรือ price [page:FUNCTIONAL_SPEC.html].  โดยทั่วไป listings ที่ไม่มีข้อมูลจำเป็นต่อ filter dimension นั้นไม่ควรถูก match อย่างไม่ตั้งใจ เว้นแต่จะตั้งใจออกแบบ fallback behavior [page:FUNCTIONAL_SPEC.html].

## Sorting model

Sorting เป็นส่วนสำคัญของ listing engine เพราะเป็นตัวกำหนดลำดับ inventory ที่ลูกค้าเห็นก่อน [file:457][page:REQUIREMENTS_SPEC.html].  สเปกใหม่ควรรองรับอย่างน้อย:

- newest / recently updated [page:REQUIREMENTS_SPEC.html]
- price low to high [page:FUNCTIONAL_SPEC.html]
- price high to low [page:FUNCTIONAL_SPEC.html]
- size low to high [page:FUNCTIONAL_SPEC.html]
- size high to low [page:FUNCTIONAL_SPEC.html]
- featured first (ถ้า business ต้องการ) [page:FUNCTIONAL_SPEC.html]

### Default sort

หากผู้ใช้ไม่เลือก sort ควรมี default ที่คาดเดาได้และคงที่ เช่น `published_at desc` หรือ equivalent [page:FUNCTIONAL_SPEC.html].  default sort ต้องไม่สร้างผลลัพธ์ที่ผันผวนจนเปรียบเทียบยากใน QA หรือทำให้ inventory ที่ใหม่กว่าถูกฝัง [page:FUNCTIONAL_SPEC.html].

## Pagination model

เมื่อ inventory มีขนาดใหญ่ listing engine ต้องใช้ pagination ที่ deterministic [file:457][page:REQUIREMENTS_SPEC.html].  อย่างน้อยควรกำหนด:

- page param เช่น `page=1` [page:FUNCTIONAL_SPEC.html]
- page size คงที่ [page:FUNCTIONAL_SPEC.html]
- total results และ total pages สำหรับ UI [page:REQUIREMENTS_SPEC.html]
- behavior เมื่อ query ไม่มีผลลัพธ์หรือ page เกินช่วง [page:FUNCTIONAL_SPEC.html]

การใช้ query-string-based pagination สำคัญเพราะช่วยให้ share ได้, crawl ได้ และไม่ทำให้ state สับสนเวลาย้อนกลับจาก detail page หรือ compare page [page:FUNCTIONAL_SPEC.html].

## Result card contract

Listing cards เป็น output contract หลักของ listing engine [file:457][page:REQUIREMENTS_SPEC.html].  หาก card contract ไม่ชัด ระบบ frontend, CMS และ inventory team จะตีความไม่ตรงกัน [code_file:540].

### Recommended minimum fields on card

การ์ดใน search results ควรมีอย่างน้อย [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- cover image [page:FUNCTIONAL_SPEC.html]
- listing title [page:REQUIREMENTS_SPEC.html]
- public code [page:REQUIREMENTS_SPEC.html]
- property type [page:REQUIREMENTS_SPEC.html]
- transaction label [page:FUNCTIONAL_SPEC.html]
- public-safe location summary [page:REQUIREMENTS_SPEC.html]
- primary area value [page:REQUIREMENTS_SPEC.html]
- price display ที่สอดคล้องกับ transaction context [page:FUNCTIONAL_SPEC.html]
- zone/estate/featured badges ตาม business rules [page:REQUIREMENTS_SPEC.html]

### Price display rules

การแสดงราคาควรยึด transaction context [page:FUNCTIONAL_SPEC.html].  หากเป็น listing แบบ `both` และผู้ใช้ค้นหาด้วย `rent` การ์ดควร prioritize ค่าเช่า; หากค้นหาด้วย `sale` ควร prioritize ราคาขาย; หากไม่มี transaction filter อาจแสดงทั้งสองอย่างแบบชัดเจน [page:FUNCTIONAL_SPEC.html][file:457].

## Detail-page handoff from listing engine

listing engine ไม่จบที่การ์ดผลลัพธ์ แต่ต้องพาผู้ใช้เข้าสู่ detail page อย่างมี context [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  route จาก search → detail ควรส่งต่อ canonical listing identity และเก็บ returnable query context ใน browser history ตามธรรมชาติ [page:FUNCTIONAL_SPEC.html].

ที่สำคัญ detail page ต้องถือเป็น continuation ของ listing engine ไม่ใช่คนละโลก เพราะ conversion, inquiry binding, compare actions และ related listings ต่างอาศัย identity ของ listing เดิม [page:SEQUENCE_DIAGRAMS.html][page:FUNCTIONAL_SPEC.html].

## Compare behavior

สเปก v1.1 รองรับ compare page และ compare tray/bar ดังนั้น listing engine ต้องมี behavior รองรับตั้งแต่ search layer [page:REQUIREMENTS_SPEC.html].  อย่างน้อยควรมีความสามารถดังนี้ [page:FUNCTIONAL_SPEC.html]:

- add/remove listing to compare set
- จำกัดจำนวน compare items ตาม UX ที่เหมาะสม
- persist compare state ในระดับ session หรือ equivalent [page:REQUIREMENTS_SPEC.html]
- เปิด compare page ที่ใช้ listing identities เดียวกับ search/detail layer [page:FUNCTIONAL_SPEC.html]

compare system ไม่ควรพึ่งพา raw search result ordering อย่างเดียว แต่ต้องอิง listing IDs ที่ชัดเจน [page:FUNCTIONAL_SPEC.html].

## Relationship to shortlist workflow

นี่คือจุดที่ฉบับใหม่ต่างจากการมอง listing page แบบเว็บไซต์ธรรมดา [code_file:540].  ในแพลตฟอร์มนี้ listings ที่ผู้ใช้เห็นบน public search กับ listings ที่ทีมใช้สร้าง shortlist ควรอิง object model เดียวกัน แม้ admin จะเห็นข้อมูลมากกว่า [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html].

นั่นหมายความว่า listing engine ต้องสอดคล้องกับ requirement-to-shortlist workflow ในเรื่องต่อไปนี้ [page:FLOWCHARTS.html][page:FUNCTIONAL_SPEC.html]:

- ใช้ filter dimensions ที่สอดคล้องกับ requirement fields [page:REQUIREMENTS_SPEC.html]
- แยก inventory ที่ active/publishable ได้จาก inventory ที่ไม่พร้อม [page:FUNCTIONAL_SPEC.html]
- มี listing identity ที่เสถียรพอสำหรับ inquiry, shortlist, visit, negotiation และ deal [page:SEQUENCE_DIAGRAMS.html]
- รองรับการสร้าง curated subsets เช่น featured, related, matched candidates [page:FUNCTIONAL_SPEC.html]

## GEO and SEO implications

Listing engine มีผลโดยตรงต่อ SEO/GEO architecture เพราะ search routes, city/area landing pages และ related query pages ล้วนพึ่ง query model นี้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  ปัญหาเดิมเรื่อง canonical, hreflang, dual URLs และ locale inconsistency แสดงให้เห็นว่าต้อง formalize route/query model ให้ดีกว่านี้ [file:462].

### Requirements for discoverability

- locale prefix ต้องชัดและสม่ำเสมอ [page:REQUIREMENTS_SPEC.html]
- city/area routes ต้อง map กลับสู่ listing query model แบบ canonical [page:FUNCTIONAL_SPEC.html][file:462]
- query-generated pages ต้องมี strategy ว่าอะไร index ได้/ไม่ได้ [page:FUNCTIONAL_SPEC.html]
- listing results pages ต้องใช้ metadata ที่สัมพันธ์กับ active query context ในระดับที่ระบบรองรับ [page:FUNCTIONAL_SPEC.html]
- canonical rules ต้องแก้ปัญหา route duplication ระหว่าง old vs new slug patterns [file:462][page:FUNCTIONAL_SPEC.html]

## Empty states and failure behavior

Listing engine ที่ใช้งานจริงต้องระบุ behavior ในกรณีไม่มีผลลัพธ์หรือมี query ที่ใช้ไม่ได้ [page:FUNCTIONAL_SPEC.html].  อย่างน้อยควรมี 3 กรณี:

### 1. No results

ถ้า query ถูกต้องแต่ไม่มี matches ต้องแสดง no-results state พร้อม options เช่น reset filters, broaden search หรือส่ง requirement ให้ทีมช่วยหา [page:REQUIREMENTS_SPEC.html].

### 2. Invalid page

ถ้าผู้ใช้เข้า page number เกินช่วง ควรมี deterministic behavior เช่น redirect กลับ page สุดท้ายที่ถูกต้องหรือแสดง page 1 ตาม rule ที่กำหนด [page:FUNCTIONAL_SPEC.html].

### 3. Invalid filter combinations

ถ้า query params ไม่สอดคล้องหรือใช้ค่าไม่ได้ ควร normalize หรือ ignore อย่างปลอดภัย แทนการพังทั้งหน้า [page:FUNCTIONAL_SPEC.html].

## Analytics and operational observability

แม้ระบบเดิมจะยังไม่มี attribution/tracking stack สมบูรณ์ แต่ listing engine ใหม่ควรถูกออกแบบเผื่อการสังเกตการณ์ [file:458][page:FUNCTIONAL_SPEC.html].  เหตุการณ์ที่ควรบันทึกหรือพร้อมสำหรับ analytics อย่างน้อยคือ:

- search executed
- filters changed
- listing card clicked
- compare added/removed
- inquiry started from listing or search context [page:FUNCTIONAL_SPEC.html]
- no-results encountered [page:FUNCTIONAL_SPEC.html]

สิ่งนี้มีประโยชน์ทั้งต่อ optimization ของ UX และต่อการประเมินว่า inventory ใดมี demand แต่ supply ไม่พอ [page:FUNCTIONAL_SPEC.html].

## Suggested implementation baseline

เพื่อให้ทีมใช้เอกสารนี้ได้ทันที listing engine ควรมี baseline functional contract ดังนี้ [code_file:540][page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- query-driven public route with locale prefix
- published-listing-only exposure
- first-class filters for type, transaction, location, zone, price, size
- deterministic sorting and pagination
- compare-ready listing identity
- detail-page handoff with canonical URLs
- requirement/CRM compatibility for downstream shortlist usage
- empty-state behaviors and normalization of bad query values

## What changed from the previous version

เมื่อเทียบกับ `02_listing_engine.md` เดิม ความเปลี่ยนแปลงหลักมีดังนี้ [file:457][code_file:540]:

- เดิมเน้นสังเกต URL/filter/card behavior ของหน้า listing จริง แต่ฉบับนี้นิยาม listing engine ในฐานะระบบ discovery layer ตาม spec v1.1 [file:457][page:REQUIREMENTS_SPEC.html]
- เดิมระบุว่า zone type ยังไม่เป็น first-class filter แต่ฉบับนี้กำหนดให้ต้องเป็น query dimension เต็มรูป [file:457][file:462][page:REQUIREMENTS_SPEC.html]
- เดิมยังไม่เชื่อม listing search กับ shortlist/CRM flow แต่ฉบับนี้ทำให้เห็นความต่อเนื่องระหว่าง search, inquiry และ brokerage workflow [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html]
- เดิมสะท้อนข้อผิดพลาดของ SEO/taxonomy implementation แต่ฉบับนี้แปลงข้อสังเกตเหล่านั้นเป็น route/canonical/query rules ใหม่ [file:462][page:FUNCTIONAL_SPEC.html]

## สรุป

`02_listing_engine.md` เวอร์ชันนี้นิยาม listing engine ให้เป็น **search and exposure system ของ inventory** ที่มีหน้าที่ทั้งด้าน discovery, SEO/GEO, compare, conversion และ downstream brokerage operations [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:SEQUENCE_DIAGRAMS.html][code_file:540].  เอกสารนี้จึงเหมาะใช้เป็นฐานสำหรับออกแบบ search API, frontend filter behavior, public listing contracts, compare logic, taxonomy routing และการเชื่อมผลค้นหาไปสู่ lead/shortlist workflow ของระบบ v1.1 [page:FLOWCHARTS.html][file:462][code_file:540].
