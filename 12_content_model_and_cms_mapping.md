# 12 Content Model & CMS Mapping — v2 (Domain-wide)

เอกสารนี้เป็นเวอร์ชันปรับปรุงเต็มของ `12_content_model_and_cms_mapping.md` โดยยกระดับจาก content/CMS mapping สำหรับ public website ไปสู่ **domain-wide content and data mapping** สำหรับ Industrial Property Platform v1 ซึ่งต้องรองรับทั้ง public rendering, admin operations, multilingual content, SEO/GEO structures และ object relationships ที่สเปก v1.1 กำหนดไว้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:UML_CLASS_DIAGRAM.html][page:SEQUENCE_DIAGRAMS.html][code_file:540].

เอกสารฉบับนี้ตั้งใจทำหน้าที่เป็นสะพานเชื่อมระหว่าง Requirement Specification, UML/ERD implications, CMS surface design และ implementation model เพื่อให้ทีมสามารถตอบคำถามต่อไปนี้ได้ชัดเจน [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html]:

- ข้อมูลใดเป็น content และข้อมูลใดเป็น operational record [page:UML_CLASS_DIAGRAM.html]
- entity ใดเป็น source of truth สำหรับ public page แต่ละประเภท [page:FUNCTIONAL_SPEC.html]
- multilingual architecture ควรถูก map อย่างไรในระดับ schema และ CMS editing surface [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
- SEO/GEO metadata อยู่ตรงไหนและผูกกับ page/listing object อย่างไร [page:FUNCTIONAL_SPEC.html]
- object ใดควรถูกจัดการผ่าน CMS, object ใดควรอยู่ใน admin operations และ object ใดต้องเชื่อมทั้งสองฝั่ง [page:REQUIREMENTS_SPEC.html][code_file:540]

## หลักการของ content model v2

ก่อนลงรายละเอียด entity mapping ต้องล็อกหลักการของฉบับนี้ให้ชัด [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

1. ระบบนี้ไม่ใช่ CMS-driven marketing site อย่างเดียว แต่เป็น brokerage workflow platform ดังนั้น content model ต้องอยู่ร่วมกับ domain model ที่มี leads, requirements, shortlists, visits และ deals [page:REQUIREMENTS_SPEC.html][page:FLOWCHARTS.html].
2. Public pages หลายประเภทไม่ได้ render จาก content tables เพียงอย่างเดียว แต่เกิดจากการประกอบกันของ content entities, listing entities, geography/taxonomy และ SEO metadata [page:FUNCTIONAL_SPEC.html][page:SEQUENCE_DIAGRAMS.html].
3. Multilingual เป็น requirement ระดับระบบ ไม่ใช่ feature addon ดังนั้น translation model ต้องถูกออกแบบเป็น first-class structure [page:REQUIREMENTS_SPEC.html].
4. ต้องแยก property กับ listing ชัดเจน เพราะหนึ่งทรัพย์จริงสามารถมีหลาย listing ได้ [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html].
5. CMS ownership และ operational ownership ต้องแยกกัน เช่น content editor แก้ article/page ได้ แต่ไม่ควรแก้ deal record หรือ requirement status [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Domain families

จากสเปกและ UML class diagram ระบบนี้แบ่ง object families หลักได้ดังนี้ [page:UML_CLASS_DIAGRAM.html][page:REQUIREMENTS_SPEC.html]:

1. Geography & taxonomy
2. Inventory (property, listing, media, availability)
3. CRM & brokerage workflow
4. Editorial content
5. SEO / GEO / discoverability
6. Localization
7. Governance & system metadata

เอกสารนี้จะอธิบายแต่ละ family พร้อม mapping ไปยัง CMS/admin surfaces และ public rendering responsibilities [code_file:540].

## 1. Geography & taxonomy model

Geography และ taxonomy เป็นฐานของทั้ง search, GEO landing pages, location display และ requirement matching [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html].  ในระบบนี้ geography ไม่ใช่แค่ reference table เพื่อแสดงชื่อจังหวัด แต่เป็นโครงสร้างหลักที่มีผลต่อทั้ง query logic และ content structure [page:FUNCTIONAL_SPEC.html].

### 1.1 Core geography entities

#### `province`

หน้าที่: เก็บข้อมูลจังหวัดที่ใช้ทั้งใน search filters, area pages, listing location binding และ requirement preferences [page:REQUIREMENTS_SPEC.html].  อย่างน้อยควรมี fields ประเภท:

- `id`
- `slug`
- `code`
- `name_th`
- `name_en`
- `name_zh` หรือ translation relation
- `published` / `active`

#### `district`

หน้าที่: เก็บอำเภอ/เขต ที่อยู่ภายใต้ province และใช้ใน search, location display และ area pages [page:REQUIREMENTS_SPEC.html].  ควรผูกกับ `province_id` และมี slug/label ในรูปแบบที่ SEO-friendly [page:FUNCTIONAL_SPEC.html].

#### `subdistrict`

หน้าที่: เก็บตำบล/แขวงเพื่อใช้ใน location precision, search filters และ public-safe display ตาม `map_visibility_level` [page:REQUIREMENTS_SPEC.html].  entity นี้มีผลต่อ privacy logic โดยตรง เพราะ public page อาจแสดงได้เพียง subdistrict, district หรือ province เท่านั้น [page:FUNCTIONAL_SPEC.html].

#### `industrial_estate`

หน้าที่: เก็บนิคมอุตสาหกรรมหรือ estate references ซึ่งเป็นทั้ง filter dimension และ GEO content anchor [page:REQUIREMENTS_SPEC.html].  ควรมี relation กับ geography levels และ metadata ที่รองรับการสร้าง area/service pages [page:FUNCTIONAL_SPEC.html].

### 1.2 Taxonomy entities

#### `zone_type`

หน้าที่: ระบุ zoning หรือ industrial context เช่น Purple Zone, Free Zone, IEAT หรือ labels ที่มีผลต่อการค้นหาและการตัดสินใจของลูกค้า [file:457][page:REQUIREMENTS_SPEC.html].  เดิม zone type อาจแสดงเพียง badge บนการ์ด แต่ใน build ใหม่ควรเป็น first-class taxonomy/filter dimension [file:462][page:REQUIREMENTS_SPEC.html].

#### `property_type`

หน้าที่: กำหนด type เช่น warehouse, factory, land, mixed [page:REQUIREMENTS_SPEC.html].  แม้บางระบบจะเก็บเป็น enum ตรงใน listing/property ได้ แต่ในเชิง CMS และ taxonomy governance อาจมีตารางแยกหรือ enum mapping table เพื่อให้จัดการ labels/translations ได้ง่ายขึ้น [page:FUNCTIONAL_SPEC.html].

#### `service_category` และ `article_category`

หน้าที่: ใช้จัดหมวด service pages, useful tips/articles และ FAQ categories [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  taxonomy สองกลุ่มนี้เป็น content-facing มากกว่า search-facing แต่ควรใช้ model ที่รองรับ sort order, visibility และ translations [page:FUNCTIONAL_SPEC.html].

### 1.3 CMS mapping for geography/taxonomy

แม้ geography จะไม่ใช่ “content” ตรง ๆ แต่บางส่วนควรถูก expose ผ่าน admin/CMS surfaces ได้แก่ [page:FUNCTIONAL_SPEC.html]:

- estate profile editing
- area-page binding
- featured areas selection
- GEO metadata per area
- localized labels/slugs สำหรับ province/district/estate pages

กล่าวอีกแบบคือ geography family เป็น **shared data foundation** ระหว่าง search system, content system และ admin operations [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## 2. Inventory model: property, listing, media, availability

นี่คือ family ที่สำคัญที่สุดชุดหนึ่งเพราะเป็นตัวเชื่อมโลก physical asset กับ public-facing offers [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html].  จุดที่ต้องย้ำคือ `property` และ `listing` ไม่ใช่ entity เดียวกัน [page:REQUIREMENTS_SPEC.html].

### 2.1 `property`

`property` คือทรัพย์จริงในโลก physical world ซึ่งมี characteristics ค่อนข้างคงที่กว่าการประกาศ [page:UML_CLASS_DIAGRAM.html].  ข้อมูลใน property entity ควรรวม:

- location references (`province_id`, `district_id`, `subdistrict_id`, `industrial_estate_id`) [page:REQUIREMENTS_SPEC.html]
- land area / built-up area / warehouse area / office area [page:REQUIREMENTS_SPEC.html]
- technical specs เช่น clear height, floor loading, power [page:REQUIREMENTS_SPEC.html][file:459]
- zone type / factory license capability / infrastructure notes [page:REQUIREMENTS_SPEC.html]
- internal-only owner/landlord notes (ถ้ามี) [page:FUNCTIONAL_SPEC.html]
- timestamps / audit hooks [page:FUNCTIONAL_SPEC.html]

property เป็น source of truth สำหรับข้อเท็จจริงเชิงกายภาพ แต่ไม่ควรถูก render เป็น public page โดยตรงหากไม่มี listing ที่ published [page:REQUIREMENTS_SPEC.html].

### 2.2 `listing`

`listing` คือประกาศเชิงการค้าหรือ offer layer ที่ผูกกับ property [page:REQUIREMENTS_SPEC.html].  หนึ่ง property อาจมีหลาย listing เช่น rent, sale, both หรือหลายรูปแบบราคา/เงื่อนไข [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html].

Fields สำคัญของ listing ควรมีอย่างน้อย:

- `property_id`
- `public_code` [page:REQUIREMENTS_SPEC.html]
- `transaction_type` (`rent`, `sale`, `both`) [page:REQUIREMENTS_SPEC.html]
- `rent_price`, `sale_price` หรือ price structures ที่เกี่ยวข้อง [page:REQUIREMENTS_SPEC.html]
- `availability_status` / `availability_note` [page:FUNCTIONAL_SPEC.html]
- `map_visibility_level` [page:REQUIREMENTS_SPEC.html]
- `featured` [page:REQUIREMENTS_SPEC.html]
- `published_status` / `published_at` / `updated_at` [page:REQUIREMENTS_SPEC.html]
- public-facing summary fields ที่อาจ override ค่า property-level บางส่วนในเชิง marketing [page:FUNCTIONAL_SPEC.html]

listing เป็น source of truth สำหรับ public search results และ listing detail pages [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  นอกจากนี้ยังเป็น source object สำหรับ shortlist items, inquiry linkage, price history และ SEO metadata [page:SEQUENCE_DIAGRAMS.html][page:FUNCTIONAL_SPEC.html].

### 2.3 `listing_media`

Media family ใช้จัดการรูป cover, gallery, watermark state และ order [page:FUNCTIONAL_SPEC.html].  อย่างน้อยควรมี:

- `listing_id`
- `file_key` หรือ storage reference
- `variant_type` (cover/gallery)
- `sort_order`
- `watermark_applied`
- `alt_text`
- metadata ของรูป เช่น width/height (ถ้าจำเป็น) [page:FUNCTIONAL_SPEC.html]

public card/detail render พึ่ง media entity นี้โดยตรง โดย cover image เป็น requirement สำคัญของ publish readiness [page:FUNCTIONAL_SPEC.html][page:FLOWCHARTS.html].

### 2.4 `availability_check`

Entity นี้มีบทบาท operational มากกว่า content แต่มีผลโดยตรงต่อ shortlist validity และ visit planning [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html].  ควรใช้เก็บ:

- `listing_id`
- checked_by / checked_at
- result/status
- validity window
- note / pricing confirmation

availability records ไม่ควรถูก exposed เป็น public content เต็มรูปแบบ แต่ผลลัพธ์บางส่วนจะสะท้อนผ่าน availability note หรือ internal warnings ใน CRM/shortlist module [page:FUNCTIONAL_SPEC.html].

### 2.5 `price_history`

ใช้เก็บประวัติการเปลี่ยนราคาและมีประโยชน์ทั้งต่อ internal traceability และ future analytics [page:UML_CLASS_DIAGRAM.html][page:FUNCTIONAL_SPEC.html].  Entity นี้ไม่ใช่ CMS object แต่เป็น part of listing governance [page:FUNCTIONAL_SPEC.html].

## 3. CRM & brokerage workflow model

family นี้คือสิ่งที่ทำให้ระบบนี้ต่างจากเว็บประกาศอสังหาฯ ทั่วไป เพราะสเปกกำหนดว่าธุรกิจทำงานผ่านมนุษย์และ workflow ตั้งแต่ lead ไป deal [page:REQUIREMENTS_SPEC.html][page:FLOWCHARTS.html].  ในเชิง content model family นี้ไม่ใช่ “content” แต่ต้องถูก map ร่วมกันเพราะหลาย public forms ส่งข้อมูลเข้ามาที่นี่ [page:SEQUENCE_DIAGRAMS.html].

### 3.1 `company`

ใช้เก็บข้อมูลบริษัทของลูกค้า/ผู้สนใจ เช่น [page:REQUIREMENTS_SPEC.html]:

- company name
- country of registration
- website
- industry / business type

company เป็น entity ที่ผูกกับ requirement และ lead ได้หลายรายการในอนาคต ขึ้นกับ implementation strategy [page:FUNCTIONAL_SPEC.html].

### 3.2 `lead`

lead เป็น core workflow object ที่ represent โอกาสทางธุรกิจหนึ่งเคส [page:REQUIREMENTS_SPEC.html].  Fields หลัก:

- `company_id` (optional/nullable ในบาง intake form) [page:REQUIREMENTS_SPEC.html]
- `source_channel`
- `status` ตาม state machine [page:REQUIREMENTS_SPEC.html]
- `assigned_agent_id` [page:REQUIREMENTS_SPEC.html]
- created/updated timestamps

lead อาจถูกสร้างจาก contact page, listing inquiry หรือ requirement wizard [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html].  ดังนั้น lead คือ bridge ระหว่าง public intake layer กับ admin workflow layer [page:FLOWCHARTS.html].

### 3.3 `lead_contact`

ใช้เก็บ person-level contact methods และ preferred language [page:REQUIREMENTS_SPEC.html].  อย่างน้อยควรมี:

- `lead_id`
- `name`
- `email`
- `phone`
- `preferred_language`
- role/title (ถ้าต้องการ)

ข้อกำหนดเรื่อง “ต้องมีอย่างน้อย 1 contact method” เป็น validation rule ของ intake process ไม่ใช่คุณสมบัติของ UI อย่างเดียว [page:REQUIREMENTS_SPEC.html].

### 3.4 `requirement`

requirement คือ structured business need ของลูกค้า [page:REQUIREMENTS_SPEC.html].  ควรเก็บอย่างน้อย:

- `lead_id`
- `operation_type`
- `factory_license_required`
- `size_min`, `size_max`
- `rent_budget_min`, `rent_budget_max`
- `sale_budget_min`, `sale_budget_max`
- `move_in_date`
- proximity preferences (`near_port`, `near_airport`, `near_bangkok`) [page:REQUIREMENTS_SPEC.html]
- notes
- status / cancellation data [page:REQUIREMENTS_SPEC.html]

requirement เป็น source object ของ shortlist generation และ visit gating [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].

### 3.5 `requirement_location`

ใช้เก็บ preferred areas แบบหลายรายการพร้อม priority [page:REQUIREMENTS_SPEC.html].  Entity นี้สำคัญมากเพราะทำให้ requirement ไม่ถูกบีบให้มี location เดียว และรองรับ matching logic ที่ realistic กว่า [page:FUNCTIONAL_SPEC.html].

### 3.6 `task`, `note`, `activity_log`

แม้ในบาง schema อาจรวม note/activity เป็น generic tables แต่เชิง model ควรมองเป็น operational record families [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

- `task` — due date, priority, status, assignee [page:REQUIREMENTS_SPEC.html]
- `note` — human notes attached to lead/requirement/visit [page:FUNCTIONAL_SPEC.html]
- `activity_log` — immutable-ish business action history [page:REQUIREMENTS_SPEC.html]

Entity เหล่านี้ไม่ใช่ CMS content แต่เป็นส่วนหนึ่งของ stateful admin system [page:FUNCTIONAL_SPEC.html].

## 4. Shortlist, visit, negotiation, deal model

family นี้ขยาย workflow จาก requirement ไปสู่ execution และ closure [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].  แม้จะเป็น operational data แต่หลาย object มี public-facing implications เช่น client shortlist view หรือ listing availability [page:SEQUENCE_DIAGRAMS.html].

### 4.1 `shortlist`

shortlist คือ curated set ของ listings สำหรับ requirement หนึ่ง [page:REQUIREMENTS_SPEC.html].  ควรมี:

- `lead_id` หรือ `requirement_id`
- `status` (`draft`, `sent`, etc.) [page:REQUIREMENTS_SPEC.html]
- `sent_at`
- owner/agent refs

### 4.2 `shortlist_item`

เป็น join entity ระหว่าง shortlist กับ listing [page:REQUIREMENTS_SPEC.html].  Fields ควรมี:

- `shortlist_id`
- `listing_id`
- `rank`
- internal note
- client feedback status (`interested`, `not_interested`, `undecided`) [page:REQUIREMENTS_SPEC.html]

shortlist item ต้อง enforce uniqueness ของ listing ภายใน shortlist เดียว และควร snapshot ข้อมูลบางส่วนเพื่อการอ้างอิงภายหลังหาก listing เปลี่ยนภายหลัง [page:FUNCTIONAL_SPEC.html].

### 4.3 `visit` และ related entities

visit model ใช้เก็บทั้งแผนการดูทรัพย์และผลลัพธ์ [page:SEQUENCE_DIAGRAMS.html][page:FUNCTIONAL_SPEC.html].  implementation อาจแตกเป็นหลาย entity เช่น:

- `visit`
- `visit_schedule`
- `visit_location`
- `visit_note` หรือ activity records

criteria gate ก่อน visit ควรถูกเก็บเป็น explicit record หรือ validation trail เพื่อให้ตรวจสอบย้อนหลังได้ [page:SEQUENCE_DIAGRAMS.html].

### 4.4 `negotiation_case` และ `offer`

negotiation family ใช้ track ข้อเสนอหลายรอบและ terms ที่เปลี่ยนไป [page:FUNCTIONAL_SPEC.html].  ควรมีโครงสร้างที่รองรับ one-to-many จาก negotiation ไป offer rounds และเก็บ timestamps/actor/actions ชัดเจน [page:FUNCTIONAL_SPEC.html].

### 4.5 `deal` และ `commission_record`

deal เป็น closing object ที่ควรถือเป็น source of truth ของผลลัพธ์ทางธุรกิจ [page:REQUIREMENTS_SPEC.html].  commission record อาจแยกเป็น entity ย่อยเพื่อเก็บจำนวน, payment state, notes และ relation กับ deal [page:FUNCTIONAL_SPEC.html].

## 5. Editorial content model

ส่วนนี้คือ family ที่เป็น “content” ในความหมายดั้งเดิมมากที่สุด แต่ก็ยังต้องผูกกับ SEO/GEO และ multilingual architecture โดยตรง [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### 5.1 `page`

entity นี้ใช้สำหรับ static pages หรือ branded pages ที่ไม่ใช่ listing, article, FAQ เช่น about-us, service landing แบบ generic, contact support copy หรือ trust sections [page:REQUIREMENTS_SPEC.html].  Suggested fields:

- `slug`
- `template_type`
- `status`
- `published_at`
- `updated_at`
- `seo_metadata_id` หรือ relation

### 5.2 `article`

ใช้กับ useful tips / guides hub [page:REQUIREMENTS_SPEC.html].  Suggested fields:

- `slug`
- `category_id`
- `featured`
- `status`
- `published_at`
- hero image reference [page:FUNCTIONAL_SPEC.html]

### 5.3 `faq_item`

ใช้กับ FAQPage และ category-based FAQ organization [page:REQUIREMENTS_SPEC.html].  ควรมี:

- `category_id`
- `sort_order`
- `status`
- optional related service/area links [page:FUNCTIONAL_SPEC.html]

### 5.4 `service_page`

service pages มีบทบาทมากกว่าหน้า static เพราะเป็น GEO/SEO landing ที่ตอบ intent ว่าบริษัทช่วยอะไรได้บ้าง [page:REQUIREMENTS_SPEC.html].  entity นี้อาจแยกจาก `page` เพื่อให้มี fields เฉพาะ เช่น:

- service type
- target persona/use case
- supported geo scopes
- CTA configuration
- related FAQ/query bindings [page:FUNCTIONAL_SPEC.html]

### 5.5 `area_page`

area pages เป็น GEO-first content objects [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  อย่างน้อยควรมี:

- geo scope type (`province`, `district`, `estate`, custom cluster)
- linked geography object id
- default listing query definition
- page status
- related services/articles

area page ไม่ใช่แค่ static content แต่เป็น **content + query + geo metadata** composite object [page:FUNCTIONAL_SPEC.html].

## 6. Localization model

Multilingual เป็น requirement หลักของระบบ จึงควรใช้ model แบบ translation tables หรือ translation subrecords แยกจาก core entity [page:REQUIREMENTS_SPEC.html].  หลักการสำคัญคือ core object identity ไม่เปลี่ยนตามภาษา แต่ text-bearing fields และ localized slugs ควรถูกเก็บแยก [page:FUNCTIONAL_SPEC.html].

### 6.1 Recommended pattern

ใช้ pattern แบบ:
- `page` + `page_translation`
- `article` + `article_translation`
- `faq_item` + `faq_translation`
- `service_page` + `service_page_translation`
- `area_page` + `area_page_translation`
- `listing` + `listing_translation` (ถ้าต้อง localized marketing copy/SEO fields) [page:FUNCTIONAL_SPEC.html]

### 6.2 Typical translation fields

Translation records ควรเก็บอย่างน้อย:
- `lang` (`th`, `en`, `zh`) [page:REQUIREMENTS_SPEC.html]
- `title`
- `subtitle` / `excerpt` (ถ้ามี)
- `body` หรือ block content
- `meta_title`
- `meta_description`
- `slug` (localized slug ถ้าใช้)
- status/completeness markers [page:FUNCTIONAL_SPEC.html]

### 6.3 CMS implications

Admin/CMS surfaces ต้องมี language tabs, translation completeness indicators และ permissions แบบที่ translator แก้เฉพาะ translation fields ได้โดยไม่แตะ core records [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  นี่เป็นเหตุผลว่าทำไม localization model ต้องถูกกำหนดตั้งแต่ต้น ไม่ใช่แก้เอาภายหลัง [code_file:540].

## 7. SEO / GEO / discoverability model

ส่วนนี้คือ family ที่เชื่อม content model กับ search engine และ AI-discoverability requirements [page:FUNCTIONAL_SPEC.html][page:SEQUENCE_DIAGRAMS.html].  ในระบบนี้ SEO metadata ไม่ควรฝังแบบกระจัดกระจายอยู่ในแต่ละ entity โดยไม่มีโครงสร้างกลาง [page:FUNCTIONAL_SPEC.html].

### 7.1 `seo_metadata`

ควรใช้ entity กลางสำหรับเก็บ metadata ที่ใช้ได้กับหลาย object types [page:FUNCTIONAL_SPEC.html].  Fields ควรมี:

- object type
- object id
- locale
- `meta_title`
- `meta_description`
- `canonical_url`
- robots directives
- open graph overrides [page:FUNCTIONAL_SPEC.html]

### 7.2 `structured_data_block`

ถ้าต้องการ flexibility ใน schema management อาจมี entity หรือ generated representation สำหรับ JSON-LD blocks [page:FUNCTIONAL_SPEC.html].  Page types ที่เกี่ยวข้องได้แก่ FAQPage, Article, Service, Listing Offer และ BreadcrumbList [page:FUNCTIONAL_SPEC.html].

### 7.3 `llms_entry`

จากสเปกที่ระบุ llms.txt และ AI search readiness ควรมี model สำหรับจัดการ entries หรือ source references ที่จะถูก export ไปยัง llms.txt/generated AI-facing files [page:REQUIREMENTS_SPEC.html].  entity นี้อาจ map pages/articles/services/areas ที่ทีมต้องการให้ AI systems เห็นเด่นเป็นพิเศษ [page:FUNCTIONAL_SPEC.html].

### 7.4 GEO query binding

ทั้ง `area_page` และบาง `service_page` ควรผูกกับ query definition ที่สร้าง listing previews, contextual inventory blocks หรือ recommended searches [page:FUNCTIONAL_SPEC.html].  query binding นี้อาจไม่จำเป็นต้องเป็น table แยกเสมอไป แต่เชิง model ควรถูกระบุชัดเจนว่าเป็น part of content object configuration [page:REQUIREMENTS_SPEC.html].

## 8. Governance & system metadata

family นี้รองรับ security, permissions, audit และ admin ownership [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  แม้ไม่ใช่ content โดยตรง แต่มีผลต่อว่าใครแก้อะไรได้ และสิ่งใดถือเป็น approved source of truth [page:FUNCTIONAL_SPEC.html].

### 8.1 `user`, `role`, `permission`

ระบบมีหลาย actor ได้แก่ sales agent, listing manager, content editor, operations coordinator, translator, super admin [page:REQUIREMENTS_SPEC.html].  model ควรรองรับอย่างน้อย:

- user profile
- role assignment
- permission scopes
- active/inactive state

### 8.2 `audit_log`

audit logging เป็น requirement สำคัญสำหรับ actions ใน leads, listings, publish operations และ deals [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  audit log ควรแยกจาก activities log ทางธุรกิจ เพราะมีเป้าหมายคนละอย่าง: activities ใช้ติดตามงาน ส่วน audit ใช้เพื่อการตรวจสอบ [page:FUNCTIONAL_SPEC.html].

## 9. CMS surface mapping by entity family

เพื่อให้ทีมใช้งานเอกสารนี้เชิงปฏิบัติได้ ต้องสรุปว่าแต่ละ entity family ถูกแก้ที่ไหนและ render ที่ไหน [code_file:540][page:FUNCTIONAL_SPEC.html].

### 9.1 Public-rendered, CMS-managed

| Family | Core entities | Managed in | Rendered on |
|---|---|---|---|
| Static/brand content | `page`, `page_translation` | CMS [page:FUNCTIONAL_SPEC.html] | Public pages [page:REQUIREMENTS_SPEC.html] |
| Articles/guides | `article`, `article_translation` | CMS [page:FUNCTIONAL_SPEC.html] | Guide hub/detail [page:REQUIREMENTS_SPEC.html] |
| FAQ | `faq_item`, `faq_translation` | CMS [page:FUNCTIONAL_SPEC.html] | FAQ page + schema [page:REQUIREMENTS_SPEC.html] |
| Service pages | `service_page`, translations | CMS/GEO [page:FUNCTIONAL_SPEC.html] | Public services routes [page:REQUIREMENTS_SPEC.html] |
| Area pages | `area_page`, translations | CMS/GEO [page:FUNCTIONAL_SPEC.html] | Public area routes [page:REQUIREMENTS_SPEC.html] |

### 9.2 Public-rendered, admin-managed

| Family | Core entities | Managed in | Rendered on |
|---|---|---|---|
| Listings | `listing`, `listing_media`, `seo_metadata` | Listing admin [page:FUNCTIONAL_SPEC.html] | Search/detail/related/compare [page:REQUIREMENTS_SPEC.html] |
| Property-backed specs | `property` | Inventory admin [page:FUNCTIONAL_SPEC.html] | Listing detail excerpts [page:REQUIREMENTS_SPEC.html] |

### 9.3 Admin-only operational families

| Family | Core entities | Managed in | Public exposure |
|---|---|---|---|
| CRM | `lead`, `lead_contact`, `company`, `requirement` | CRM admin [page:REQUIREMENTS_SPEC.html] | None directly [page:REQUIREMENTS_SPEC.html] |
| Brokerage ops | `shortlist`, `visit`, `negotiation_case`, `deal` | Ops admin [page:FUNCTIONAL_SPEC.html] | Only derived client/token views where allowed [page:SEQUENCE_DIAGRAMS.html] |
| Governance | `user`, `role`, `audit_log` | Settings/admin [page:FUNCTIONAL_SPEC.html] | None [page:REQUIREMENTS_SPEC.html] |

## 10. Render mapping by page type

อีกมุมที่สำคัญคือ page type ไหน consume ข้อมูลจาก entity ใดบ้าง [page:FUNCTIONAL_SPEC.html].

### Homepage

Render จาก static content + featured listings + trust/credential content + CTAs [page:REQUIREMENTS_SPEC.html][file:480].  จึงใช้ข้อมูลผสมระหว่าง CMS entities, listing selection logic และ possibly settings/config records [page:FUNCTIONAL_SPEC.html].

### Listing search page

Render จาก listing query + property-derived display fields + taxonomy labels + SEO metadata [page:REQUIREMENTS_SPEC.html].  หน้า search นี้ไม่ควรถูกมองว่าเป็น page content object แบบ article/page ทั่วไป แต่เป็น query-driven rendered surface [page:FUNCTIONAL_SPEC.html].

### Listing detail page

Render จาก listing + property + listing_media + SEO metadata + related listings query + safe location summary [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### FAQ page

Render จาก faq items + faq categories + FAQPage schema [page:REQUIREMENTS_SPEC.html].

### Guide/article page

Render จาก article + article translation + SEO metadata + internal links config [page:FUNCTIONAL_SPEC.html].

### Service page

Render จาก service_page + translations + related FAQ + related area/listing query bindings + SEO metadata [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### Area page

Render จาก area_page + geography objects + default listing query + FAQ + internal links + SEO/GEO metadata [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## 11. What changed from the previous version

เมื่อเทียบกับเวอร์ชันเดิม การเปลี่ยนแปลงสำคัญของเอกสารนี้คือ [code_file:519][code_file:540]:

- เดิมโฟกัส content/CMS ในกรอบเว็บไซต์ แต่ฉบับนี้รวม domain model ของระบบทั้งหมด [code_file:540]
- เดิมยังไม่แยก property ออกจาก listing ชัดพอ แต่ฉบับนี้ถือเป็นแกนหลักของ model [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html]
- เดิมไม่มี mapping ที่ชัดสำหรับ leads, requirements, shortlists, visits, deals แต่ฉบับนี้ใส่เป็น workflow families เต็มรูป [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html]
- เดิม multilingual ยังไม่ถูก formalize ระดับ entity แต่ฉบับนี้ใช้ translation-first model [page:REQUIREMENTS_SPEC.html]
- เดิม SEO/GEO เป็นส่วนเสริม แต่ฉบับนี้ยกระดับให้เป็น discoverability family ที่มี object model ของตัวเอง [page:FUNCTIONAL_SPEC.html]

## สรุป

`12_content_model_and_cms_mapping.md` เวอร์ชันนี้ทำหน้าที่เป็น **data/content blueprint ของทั้งแพลตฟอร์ม** ไม่ใช่แค่ CMS cheat sheet อีกต่อไป [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:UML_CLASS_DIAGRAM.html][code_file:540].  มันเชื่อม Requirement Specification, UML implications, public rendering, admin workflows, multilingual architecture และ SEO/GEO management เข้าด้วยกันในภาพเดียว เพื่อให้ทีมสามารถออกแบบ schema, CMS surfaces, APIs และ rendering logic ได้อย่างสอดคล้องกับสเปก v1.1 [page:SEQUENCE_DIAGRAMS.html][code_file:540].
