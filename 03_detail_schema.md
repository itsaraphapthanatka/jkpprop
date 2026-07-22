# 03 Detail Schema — v2 (Listing Detail Data Contract)

เอกสารนี้เป็นเวอร์ชันปรับปรุงเต็มของ `03_detail_schema.md` โดยเปลี่ยนจากการสังเกตโครงสร้าง attribute บนหน้ารายละเอียดของเว็บเดิม มาเป็น **listing detail data contract** สำหรับ Industrial Property Platform v1 ซึ่งอธิบายว่า detail page ควรใช้ข้อมูลอะไร, แสดงอย่างไร, ปกป้องข้อมูลระดับ location อย่างไร และเชื่อมกับ lead/shortlist workflow อย่างไร [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:UML_CLASS_DIAGRAM.html][file:459][code_file:540].

เอกสารนี้ควรถูกใช้เป็น baseline สำหรับ frontend detail page implementation, backend response contract, CMS/listing publish validation, SEO schema generation และ QA test cases ของหน้ารายละเอียดประกาศ [page:FUNCTIONAL_SPEC.html][page:REQUIREMENTS_SPEC.html][code_file:540].

## บทบาทของ detail page ในระบบ

Listing detail page เป็นหน้าที่เปลี่ยนผู้ใช้จาก “กำลังค้นหา” ไปสู่ “กำลังตัดสินใจ” [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  หาก search page คือ discovery layer, detail page คือ evaluation and conversion layer ที่รวมข้อมูลเชิงพาณิชย์, สเปก, context เชิงพื้นที่ และ CTA เพื่อให้ผู้ใช้พร้อมติดต่อหรือให้ทีมช่วยจัด shortlist [page:SEQUENCE_DIAGRAMS.html][page:FLOWCHARTS.html].

ดังนั้น detail schema ต้องตอบโจทย์พร้อมกัน 5 เรื่อง [page:FUNCTIONAL_SPEC.html][page:REQUIREMENTS_SPEC.html]:

1. แสดงข้อมูลที่พอสำหรับการตัดสินใจเชิงธุรกิจ
2. ใช้ object model ที่ถูกต้องระหว่าง listing, property, media และ SEO metadata
3. ป้องกันการเปิดเผย location เกินระดับที่อนุญาต
4. รองรับ multilingual rendering และ canonical public contract
5. เชื่อม conversion actions เข้าสู่ lead flow อย่างชัดเจน

## หลักการของ detail schema v2

ก่อนลง field-level contract ต้องยืนยันหลักการของหน้ารายละเอียดเวอร์ชันใหม่ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- public detail page แสดง **listing** ไม่ใช่ raw property record [page:REQUIREMENTS_SPEC.html]
- property-level facts ถูกดึงมาใช้เท่าที่จำเป็นเพื่อเสริม listing presentation [page:UML_CLASS_DIAGRAM.html]
- ข้อมูล public ต้องผ่าน publishability และ privacy rules เสมอ [page:FUNCTIONAL_SPEC.html]
- detail page เป็น conversion surface จึงต้องออกแบบ inquiry binding และ related listing logic ไปพร้อมกับ schema [page:SEQUENCE_DIAGRAMS.html]
- route และ metadata ต้องรองรับ locale, canonical และ structured data อย่างสม่ำเสมอ [page:FUNCTIONAL_SPEC.html][page:REQUIREMENTS_SPEC.html]

## Page-level object composition

ในเชิง data composition detail page ไม่ได้ render จาก entity เดียว [page:UML_CLASS_DIAGRAM.html][page:FUNCTIONAL_SPEC.html].  โดยทั่วไปหน้าหนึ่งควรประกอบด้วย objects หลักดังนี้:

- `listing` — public offer object หลัก [page:REQUIREMENTS_SPEC.html]
- `property` — physical asset facts ที่ใช้แสดงผล [page:UML_CLASS_DIAGRAM.html]
- `listing_media` — cover และ gallery images [page:FUNCTIONAL_SPEC.html]
- `listing_translation` หรือ localized fields — ข้อความตามภาษา [page:REQUIREMENTS_SPEC.html]
- `seo_metadata` — title/meta/canonical/OG/schema data [page:FUNCTIONAL_SPEC.html]
- `related_listings` — query-derived supplementary results [page:FUNCTIONAL_SPEC.html]
- inquiry context — used by lead intake forms [page:SEQUENCE_DIAGRAMS.html]

การมอง detail page เป็น composite object แบบนี้ช่วยให้ทีมแยก source of truth ของแต่ละส่วนได้ชัด และหลีกเลี่ยงการใส่ทุกอย่างไว้ใน listing table เดียวแบบไม่จำเป็น [code_file:540].

## Canonical detail identity

หน้ารายละเอียดต้องอิง canonical listing identity เสมอ [page:FUNCTIONAL_SPEC.html][file:462].  แม้ระบบเดิมจะมีทั้ง short ID routes และ long SEO slugs แต่ build ใหม่ควรกำหนด canonical detail route เดียวต่อหนึ่ง listing-public identity และ redirect routes เก่าเข้าหา canonical ให้หมด [file:462][page:FUNCTIONAL_SPEC.html].

สิ่งนี้สำคัญทั้งในมุม SEO, analytics, shareability และ inquiry binding เพราะทุก conversion action ต้องผูกกับ listing เดียวกันแบบไม่กำกวม [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html].

## Section model ของ detail page

หน้ารายละเอียดควรถูกคิดเป็น section contract ที่คงที่ระดับหนึ่ง เพื่อให้ frontend, backend และ CMS/listing admin เข้าใจว่าข้อมูลชุดใดต้องถูกเตรียมให้เสมอ [file:459][page:FUNCTIONAL_SPEC.html].  Recommended section order คือ:

1. breadcrumb
2. gallery
3. title / transaction / price block
4. quick specs
5. full attribute/spec content
6. location summary / map
7. inquiry/lead capture module
8. related listings [file:459][page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]

## Section 1 — Breadcrumb contract

breadcrumb ช่วยทั้งเรื่อง orientation และ SEO support [file:459][page:FUNCTIONAL_SPEC.html].  อย่างน้อยควรมี hierarchy ที่สื่อความหมาย เช่น:

- Home
- Properties / Listing
- Province or area context
- Current listing title [file:459][page:REQUIREMENTS_SPEC.html]

หากมี structured data สำหรับ breadcrumb ควร generate จาก canonical route hierarchy เดียวกัน ไม่ใช่มีแค่ UI breadcrumb ที่ไม่สัมพันธ์กับ metadata layer [file:462][page:FUNCTIONAL_SPEC.html].

## Section 2 — Gallery contract

Gallery เป็นส่วนสำคัญของ detail page เพราะส่งผลต่อทั้ง trust และ decision quality [file:459][page:FUNCTIONAL_SPEC.html].  gallery ควรดึงจาก `listing_media` และรองรับอย่างน้อย:

- cover image [page:FUNCTIONAL_SPEC.html]
- ordered gallery list [page:FUNCTIONAL_SPEC.html]
- thumbnail navigation [file:459]
- lightbox/zoom experience [file:459]
- alt text และ media metadata ที่เหมาะสม [page:FUNCTIONAL_SPEC.html]

### Publishability rule for media

detail page ไม่ควรถูก publish หากไม่มี cover image หรือ media ขั้นต่ำตามกติกาที่กำหนด [page:FUNCTIONAL_SPEC.html][page:FLOWCHARTS.html].  เนื่องจาก card/detail experience และ SEO image metadata ต่างพึ่งพา media object นี้โดยตรง [page:FUNCTIONAL_SPEC.html].

## Section 3 — Title / transaction / pricing block

ส่วนนี้คือ commercial identity ของ listing [page:REQUIREMENTS_SPEC.html].  อย่างน้อยควรมี fields ต่อไปนี้:

- listing title [page:REQUIREMENTS_SPEC.html]
- public code [page:REQUIREMENTS_SPEC.html]
- property type [page:REQUIREMENTS_SPEC.html]
- transaction type (`rent`, `sale`, `both`) [page:REQUIREMENTS_SPEC.html]
- primary price display [page:FUNCTIONAL_SPEC.html]
- optional secondary price display ในกรณี `both` [page:FUNCTIONAL_SPEC.html]
- badges เช่น featured, zone, estate, availability summary ตาม business rules [page:REQUIREMENTS_SPEC.html]

### Price display rules

ราคาที่แสดงบน detail page ต้องสอดคล้องกับ transaction context ของ listing [page:FUNCTIONAL_SPEC.html].  หาก listing เป็น `both` ควรแสดงค่าเช่าและราคาขายอย่างแยกชัด ไม่ควรผสมจนตีความผิด [file:457][page:FUNCTIONAL_SPEC.html].

## Section 4 — Quick specs contract

Quick specs คือชุด attribute สำคัญที่ผู้ใช้ต้องเห็นทันทีโดยไม่ต้องเลื่อนอ่านรายละเอียดทั้งหมด [file:459][page:REQUIREMENTS_SPEC.html].  ตัวอย่าง fields ที่เหมาะเป็น quick specs ได้แก่:

- usable area / warehouse area หรือ primary public area metric [page:REQUIREMENTS_SPEC.html]
- clear height [file:459][page:REQUIREMENTS_SPEC.html]
- floor loading capacity [file:459][page:REQUIREMENTS_SPEC.html]
- electricity/power system [file:459][page:REQUIREMENTS_SPEC.html]
- land area หรือ office area เฉพาะกรณีที่ relevant [page:FUNCTIONAL_SPEC.html]

สิ่งสำคัญคือ quick specs ควรสะท้อน metrics ที่มีผลต่อ industrial decision จริง ไม่ใช่คัดตามความสวยของ UI อย่างเดียว [page:REQUIREMENTS_SPEC.html].

## Section 5 — Full attribute schema

ส่วนนี้คือรายละเอียดเชิงสเปกและ business facts ที่ผู้ใช้ต้องใช้เปรียบเทียบหรือประเมินความเหมาะสม [page:REQUIREMENTS_SPEC.html][file:459].  field groups แนะนำมีดังนี้:

### A. Identity & classification

- listing title [page:REQUIREMENTS_SPEC.html]
- public code [page:REQUIREMENTS_SPEC.html]
- property type [page:REQUIREMENTS_SPEC.html]
- transaction type [page:REQUIREMENTS_SPEC.html]
- featured flag / status labels ที่ public-safe [page:FUNCTIONAL_SPEC.html]

### B. Location summary

- province [page:REQUIREMENTS_SPEC.html]
- district [page:REQUIREMENTS_SPEC.html]
- subdistrict (ขึ้นกับ visibility rule) [page:REQUIREMENTS_SPEC.html]
- industrial estate / area cluster (ถ้ามีและอนุญาตให้แสดง) [page:FUNCTIONAL_SPEC.html]

### C. Size & physical characteristics

- land area [page:REQUIREMENTS_SPEC.html]
- warehouse area / factory area / built-up area [page:REQUIREMENTS_SPEC.html]
- office area (ถ้ามี) [page:REQUIREMENTS_SPEC.html]
- clear height [page:REQUIREMENTS_SPEC.html]
- floor loading capacity [page:REQUIREMENTS_SPEC.html]
- loading bays / dock levelers / other operational specs (ถ้ามีใน business scope) [page:FUNCTIONAL_SPEC.html]

### D. Utilities & operations

- electricity system / transformer capacity / amps [file:459][page:REQUIREMENTS_SPEC.html]
- water/utilities notes (ถ้า relevant) [page:FUNCTIONAL_SPEC.html]
- factory license capability / zoning context [page:REQUIREMENTS_SPEC.html]
- operational suitability notes [page:FUNCTIONAL_SPEC.html]

### E. Commercial information

- rent price [page:REQUIREMENTS_SPEC.html]
- sale price [page:REQUIREMENTS_SPEC.html]
- pricing notes / negotiability (ถ้า public-safe) [page:FUNCTIONAL_SPEC.html]
- updated timestamp / availability note [page:FUNCTIONAL_SPEC.html]

### F. Features & remarks

- feature list / highlights [file:459]
- public notes หรือ marketing summary [page:FUNCTIONAL_SPEC.html]
- CTA-oriented contextual hints เช่น suitable for logistics / manufacturing (ถ้าอยู่ใน scope) [page:FUNCTIONAL_SPEC.html]

## Source of truth by field family

เพื่อกันความสับสน ควรระบุ source of truth คร่าว ๆ ดังนี้ [page:UML_CLASS_DIAGRAM.html][page:FUNCTIONAL_SPEC.html]:

| Field family | Primary source |
|---|---|
| Title / public copy / localized summary | `listing` + translation layer [page:FUNCTIONAL_SPEC.html] |
| Transaction type / price / publish state | `listing` [page:REQUIREMENTS_SPEC.html] |
| Physical specs | `property` [page:UML_CLASS_DIAGRAM.html] |
| Images / gallery order | `listing_media` [page:FUNCTIONAL_SPEC.html] |
| SEO/canonical/meta/schema | `seo_metadata` or generated SEO layer [page:FUNCTIONAL_SPEC.html] |
| Related listings | query engine [page:FUNCTIONAL_SPEC.html] |
| Inquiry context | listing identity + lead intake rules [page:SEQUENCE_DIAGRAMS.html] |

## Location privacy & map visibility rules

หนึ่งในจุดสำคัญที่สุดของ detail schema คือการควบคุมการแสดง location [page:REQUIREMENTS_SPEC.html].  ระบบต้องรองรับ `map_visibility_level` หรือ equivalent rule ที่กำหนดว่า public page เห็น location ได้แค่ไหน [page:FUNCTIONAL_SPEC.html].

### Recommended visibility levels

- `exact` — แสดงตำแหน่งหรือจุด map ที่ใกล้เคียงมาก [page:REQUIREMENTS_SPEC.html]
- `subdistrict` — แสดงแค่ระดับตำบล/แขวง [page:REQUIREMENTS_SPEC.html]
- `district` — แสดงแค่ระดับอำเภอ/เขต [page:REQUIREMENTS_SPEC.html]
- `province` — แสดงแค่จังหวัด [page:REQUIREMENTS_SPEC.html]

### Rendering implications

กติกานี้ต้องมีผลกับหลายส่วนพร้อมกัน ไม่ใช่เฉพาะ map widget [page:FUNCTIONAL_SPEC.html].  อย่างน้อยต้องใช้กับ:

- location text summary [page:FUNCTIONAL_SPEC.html]
- breadcrumb specificity (ถ้าจำเป็น) [page:FUNCTIONAL_SPEC.html]
- map component behavior [page:REQUIREMENTS_SPEC.html]
- structured data / geo metadata ที่ระบบส่งออก [page:FUNCTIONAL_SPEC.html]

### Privacy principle

detail page ต้องให้ข้อมูลพอสำหรับตัดสินใจ แต่ไม่ควรเปิดเผย exact address หรือข้อมูลที่ทำให้ bypass broker process ได้โดยไม่จำเป็น หาก listing policy ไม่อนุญาต [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Inquiry binding contract

Detail page เป็น conversion surface จึงต้องมี inquiry binding ชัด [page:SEQUENCE_DIAGRAMS.html][file:458].  หมายความว่าเมื่อผู้ใช้ส่ง inquiry จากหน้ารายละเอียด ระบบต้องรู้ว่า inquiry นี้ผูกกับ listing ใดและควรสร้าง lead context อย่างไร [page:REQUIREMENTS_SPEC.html].

### Required inquiry context

อย่างน้อย inquiry payload จาก detail page ควรเชื่อมกับ:

- `listing_id`
- `public_code`
- locale/page context
- source channel ว่าเป็น listing inquiry [page:SEQUENCE_DIAGRAMS.html][page:FUNCTIONAL_SPEC.html]

การเก็บ binding นี้สำคัญมาก เพราะช่วยให้ทีมขายรู้ว่าลูกค้าสนใจทรัพย์ไหนจริง และเป็นจุดเริ่มต้นของ shortlist/visit pipeline ในหลายกรณี [page:FLOWCHARTS.html].

## Related listings contract

detail page ควรมี related listings เพื่อให้ผู้ใช้ไม่ dead-end และเพื่อช่วย team brokerage เวลาทรัพย์นั้นไม่ตรง 100% [page:FUNCTIONAL_SPEC.html].  related query ควรอิงอย่างน้อยจาก:

- same property type [page:FUNCTIONAL_SPEC.html]
- same or nearby geography scope [page:FUNCTIONAL_SPEC.html]
- same transaction type [page:FUNCTIONAL_SPEC.html]
- comparable size/price band ตาม business rules [page:FUNCTIONAL_SPEC.html]

related listings ต้องใช้ listing exposure rules ชุดเดียวกับ search engine และไม่ควรดึง listings ที่ unpublished หรือไม่พร้อมใช้งาน [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Localization contract

detail schema ต้องรองรับ 3 ภาษาเป็น baseline (`th`, `en`, `zh`) ตามสเปก [page:REQUIREMENTS_SPEC.html].  หลักการสำคัญคือ object identity เดียวกัน แต่ข้อความ public และ SEO metadata อาจต่างกันตาม locale [page:FUNCTIONAL_SPEC.html].

### Localized field groups

field ที่ควร localized ได้แก่ [page:FUNCTIONAL_SPEC.html]:

- title
- summary / marketing copy
- feature labels
- taxonomy labels ที่แสดงต่อผู้ใช้
- meta title / description
- breadcrumb labels ในส่วนที่เป็น text layer

### Fallback rules

หาก locale ที่ร้องขอไม่มี translation พร้อมใช้งาน ต้องมี fallback behavior ที่ชัด เช่น fallback ไปยังภาษา default หรือซ่อน listing จาก locale นั้นหาก business ต้องการคุณภาพสูง [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  กฎนี้ต้องสอดคล้องกับ listing exposure rules ใน search layer ด้วย [page:FUNCTIONAL_SPEC.html].

## SEO & structured data contract

detail page เป็นหนึ่งใน page types ที่ได้ประโยชน์จาก SEO/structured data มากที่สุด [page:FUNCTIONAL_SPEC.html][file:462].  ดังนั้น schema เวอร์ชันใหม่ควรมีชั้น metadata ที่ชัดเจนอย่างน้อย [page:FUNCTIONAL_SPEC.html]:

- canonical URL [file:462]
- hreflang set [page:REQUIREMENTS_SPEC.html][file:462]
- meta title / description ตาม locale [page:FUNCTIONAL_SPEC.html]
- open graph tags [file:462][page:FUNCTIONAL_SPEC.html]
- structured data ที่เหมาะกับ listing/detail context [page:FUNCTIONAL_SPEC.html]
- breadcrumb structured data ถ้าใช้ breadcrumb UI [file:462]

ระบบเดิมมีปัญหาเรื่อง dual URLs และขาด canonical/breadcrumb schemas [file:462].  ฉบับใหม่นี้จึงถือว่า metadata layer เป็นส่วนหนึ่งของ detail contract ไม่ใช่ของแถม [page:FUNCTIONAL_SPEC.html][code_file:540].

## Not-found and unpublished behavior

รายละเอียดอีกข้อที่สำคัญมากคือหน้ารายละเอียดต้องมี behavior ที่ชัดเมื่อ listing ใช้ไม่ได้ [file:460][page:FUNCTIONAL_SPEC.html].

### 1. Unpublished / removed listing

หาก listing ถูกถอดหรือ unpublished แล้ว route เดิมไม่ควรแสดงหน้าปกติพร้อมข้อมูลเสียหาย [page:FUNCTIONAL_SPEC.html].  ระบบควรตอบด้วย not-found หรือ equivalent behavior ที่ชัดและสอดคล้องทั้ง UI และ HTTP semantics ตาม architecture ที่เลือก [file:460].

### 2. Invalid slug

route ที่ไม่พบ listing identity ที่ valid ต้องไม่สร้างหน้าเหมือนมีข้อมูลอยู่จริง [file:460].  ในระบบเดิมมีลักษณะ top-level 200 แต่ internal fetch 404 ซึ่งทำให้ monitoring และ SEO สับสน [file:460].  build ใหม่ควรแก้ให้ behavior ชัดเจนกว่าเดิม [page:FUNCTIONAL_SPEC.html].

## Suggested API response families

เพื่อให้ทีม backend/frontend ใช้เอกสารนี้ได้ง่าย ควรมอง response contract ของ detail page เป็น families ไม่ใช่ flat field list อย่างเดียว [code_file:540][page:FUNCTIONAL_SPEC.html]:

- `identity` — id, code, slug, locale [page:FUNCTIONAL_SPEC.html]
- `commercial` — title, transaction, price, badges [page:REQUIREMENTS_SPEC.html]
- `location` — safe summary + visibility level + map payload [page:REQUIREMENTS_SPEC.html]
- `specs` — physical/technical attributes [page:UML_CLASS_DIAGRAM.html]
- `media` — cover/gallery [page:FUNCTIONAL_SPEC.html]
- `content` — summary/features/remarks [page:FUNCTIONAL_SPEC.html]
- `conversion` — inquiry context + CTA config [page:SEQUENCE_DIAGRAMS.html]
- `seo` — meta/canonical/hreflang/schema [page:FUNCTIONAL_SPEC.html]
- `related` — recommended listings [page:FUNCTIONAL_SPEC.html]

แนวทางนี้ช่วยให้ API evolution ง่ายกว่าการส่ง flat blob ยาว ๆ และทำให้ frontend แยก render ตาม section ได้ง่าย [code_file:540].

## Publish readiness checks for detail pages

ก่อน listing ใดจะขึ้น detail page ได้จริง ควรผ่าน checks ขั้นต่ำดังนี้ [page:FUNCTIONAL_SPEC.html][page:FLOWCHARTS.html]:

- มี canonical listing identity [page:FUNCTIONAL_SPEC.html]
- อยู่ใน published/active state [page:REQUIREMENTS_SPEC.html]
- มี cover image [page:FUNCTIONAL_SPEC.html]
- มี title และ commercial data ขั้นต่ำ [page:REQUIREMENTS_SPEC.html]
- มี location data ที่ render ตาม privacy rule ได้ [page:REQUIREMENTS_SPEC.html]
- มี metadata ขั้นต่ำสำหรับ locale ที่จะเปิดใช้งาน [page:FUNCTIONAL_SPEC.html]

## What changed from the previous version

เมื่อเทียบกับ `03_detail_schema.md` เดิม ความเปลี่ยนแปลงหลักคือ [file:459][code_file:540]:

- เดิมเน้นการสังเกต fields ที่พบใน detail page จริง แต่ฉบับนี้กำหนด detail page เป็น data contract ตาม spec v1.1 [file:459][page:REQUIREMENTS_SPEC.html]
- เดิมยังไม่แยก source of truth ระหว่าง listing, property, media และ SEO layer ชัดพอ แต่ฉบับนี้แยกครบ [page:UML_CLASS_DIAGRAM.html][page:FUNCTIONAL_SPEC.html]
- เดิมมีเพียงการสังเกต layout order แต่ฉบับนี้แปลงเป็น section-level schema contract ที่ใช้สร้าง API/frontend ได้ทันที [file:459][code_file:540]
- เดิมยังไม่ formalize map privacy, canonical identity และ inquiry binding เท่าที่ควร แต่ฉบับนี้ยกทั้งสามเรื่องเป็นแกนหลักของ detail architecture [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html][file:462]

## สรุป

`03_detail_schema.md` เวอร์ชันนี้นิยาม detail page ใหม่ให้เป็น **listing detail data contract** ที่เชื่อม inventory exposure, privacy, localization, SEO metadata และ lead conversion เข้าด้วยกันอย่างเป็นระบบ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:SEQUENCE_DIAGRAMS.html][file:459][code_file:540].  เอกสารนี้เหมาะใช้เป็น baseline สำหรับ backend response design, frontend page composition, listing publish validation และ QA coverage ของหน้ารายละเอียดทั้งหมดในระบบ v1.1 [page:UML_CLASS_DIAGRAM.html][page:FLOWCHARTS.html][code_file:540].
