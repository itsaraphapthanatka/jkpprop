# 14 Decision Log — v2 (Resolved with v1 Specs)

เอกสารนี้เป็น revision ล่าสุดของ `14_decision_log_resolved.md` โดยปรับทุก decision ให้สอดคล้องกับ Requirement Specification และ Functional Specification เวอร์ชัน 1.1 ของ Industrial Property Platform v1 [code_file:540][page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Localization

- ระบบรองรับ 3 ภาษา: Thai (`th`), English (`en`), Chinese (`zh`) [page:REQUIREMENTS_SPEC.html].
- ใช้ URL prefix `/th/...`, `/en/...`, `/zh/...` สำหรับทุกหน้า public [page:REQUIREMENTS_SPEC.html].
- ทุกหน้า public ที่มี translation ต้องออก `hreflang` ครบ [page:FUNCTIONAL_SPEC.html].

## Authentication

- ไม่มี customer login ใน v1 [page:REQUIREMENTS_SPEC.html].
- มี admin login สำหรับบทบาทที่สเปกระบุ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Data & domain

- Property และ Listing เป็น entities แยกจากกัน; 1 property มีหลาย listing ได้ [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html].
- Listing ต้องมี `public_code` สำหรับแสดงใน public UI [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Search

- Search filter ต้องครอบคลุม property type, transaction type, location hierarchy, industrial estate, size, rent/sale budget, factory license possible, featured, full-text `q` [page:REQUIREMENTS_SPEC.html].
- Listing ที่ `transaction_type = both` ต้องอยู่ทั้งฝั่ง rent และ sale [page:REQUIREMENTS_SPEC.html].
- Pagination default 20, max 100, และ filter state อยู่ใน query string เสมอ [page:REQUIREMENTS_SPEC.html].
- Compare สูงสุด 4 listings แบบ session-based [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html].

## Privacy & detail page

- Public map/detail ต้องเคารพ `map_visibility_level`; ห้ามเผย exact address/lat-long ถ้าไม่อนุญาต [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].
- Detail page ต้องแสดง `updated_at` และ availability disclaimer [page:REQUIREMENTS_SPEC.html].

## CRM workflow

- Lead status ใช้ state machine ตาม spec เท่านั้น [page:REQUIREMENTS_SPEC.html].
- Sales agent เห็นเฉพาะ lead ที่ได้รับมอบหมาย [page:REQUIREMENTS_SPEC.html].
- การ cancel requirement ต้องบันทึกเหตุผลและข้อ requirement ที่เป็นเหตุ [page:REQUIREMENTS_SPEC.html].

## Shortlist / visit / deal

- Shortlist item ต้องใช้ listing ที่ published และผ่าน availability [page:REQUIREMENTS_SPEC.html].
- Client feedback ใช้ `interested`, `not_interested`, `undecided` [page:REQUIREMENTS_SPEC.html].
- Visit criteria gate และ negotiation/deal flow ต้องทำตาม sequence และ flow diagrams [page:SEQUENCE_DIAGRAMS.html][page:FLOWCHARTS.html].

## Stack & SEO

- Stack หลัก: Next.js App Router, TypeScript, Prisma, PostgreSQL, TailwindCSS, monorepo [page:REQUIREMENTS_SPEC.html].
- ใช้ S3-compatible storage สำหรับ media [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].
- Search ใช้ PostgreSQL full-text [page:REQUIREMENTS_SPEC.html].
- ใช้ FAQPage, Article, Service, Listing Offer, BreadcrumbList schemas ตาม page type [page:FUNCTIONAL_SPEC.html].
- มี GEO-ready pages และ `llms.txt` ใน v1 [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Explicit exclusions

- ไม่มี bulk CSV import/export ใน v1 [page:REQUIREMENTS_SPEC.html].
- ไม่มี public webhooks ใน v1 [page:REQUIREMENTS_SPEC.html].
