# 15 Build Sequence Checklist — v2 (Aligned with v1 Specs)

เอกสารนี้เป็นเวอร์ชันปรับปรุงล่าสุดของ `15_build_sequence_checklist.md` ให้สอดคล้องกับ Requirement Specification, Functional Specification และ sequence/flow diagrams ของแพลตฟอร์ม v1 [code_file:540][page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].

## Phase 0 — Environment & scaffolding

1. ตั้งค่า monorepo Next.js App Router + Prisma + PostgreSQL [page:REQUIREMENTS_SPEC.html].
2. ตั้งค่า S3-compatible storage สำหรับ media [page:FUNCTIONAL_SPEC.html].
3. ตั้งค่า lint/test/format pipeline [code_file:540].

## Phase 1 — Domain & data model

1. map UML + ERD เป็น Prisma schema (property, listing, company, lead, requirement, shortlist, visit, negotiation, deal, translations, taxonomy, geography, SEO metadata, audit_logs ฯลฯ) [page:UML_CLASS_DIAGRAM.html][page:REQUIREMENTS_SPEC.html].
2. สร้าง migration แรกและ seed taxonomy/geography [page:REQUIREMENTS_SPEC.html].
3. ล็อก enums ให้ตรง STATUS_ENUMS และ FR state rules [page:REQUIREMENTS_SPEC.html].

## Phase 2 — Public surfaces

1. ทำ `/th`, `/en`, `/zh` homepage ตาม `FR-PUB-01` [page:REQUIREMENTS_SPEC.html].
2. ทำ search/listing pages ตาม `FR-SRC-01`–`FR-SRC-09` [page:REQUIREMENTS_SPEC.html].
3. ทำ listing detail pages ตาม `FR-LST-01`–`FR-LST-06` [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].
4. ทำ contact page, inquiry form และ requirement form [page:REQUIREMENTS_SPEC.html].

## Phase 3 — Intake backend

1. ทำ API สำหรับ inquiry/requirement ให้สร้าง lead + related entities อัตโนมัติ [page:REQUIREMENTS_SPEC.html].
2. ทำ validation server-side ตาม spec [page:REQUIREMENTS_SPEC.html].
3. เพิ่ม spam protection และ notifications [page:REQUIREMENTS_SPEC.html].

## Phase 4 — Admin CRM

1. ทำ admin auth/layout [page:FUNCTIONAL_SPEC.html].
2. ทำ lead dashboard + lead detail + assignment + tasks + activities [page:REQUIREMENTS_SPEC.html].
3. ทำ requirement cancellation flow [page:REQUIREMENTS_SPEC.html].

## Phase 5 — Shortlist & client view

1. ทำ shortlist builder และ validation [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].
2. ทำ client feedback statuses [page:REQUIREMENTS_SPEC.html].
3. ทำ client shortlist token view ตาม sequence [page:SEQUENCE_DIAGRAMS.html].

## Phase 6 — Availability & visits

1. ทำ availability checks [page:REQUIREMENTS_SPEC.html].
2. ทำ visit planning ตาม criteria gate [page:SEQUENCE_DIAGRAMS.html].
3. ทำ schedule views สำหรับ operations [page:FUNCTIONAL_SPEC.html].

## Phase 7 — Negotiation & deals

1. ทำ negotiation module [page:FUNCTIONAL_SPEC.html].
2. ทำ deal records + commission + logs [page:REQUIREMENTS_SPEC.html].
3. integrate กับ lead status machine [page:REQUIREMENTS_SPEC.html].

## Phase 8 — CMS, SEO & GEO

1. ทำ multilingual CMS สำหรับ pages/articles/FAQ/services/areas [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].
2. ทำ SEO metadata editor + JSON-LD ตาม page type [page:FUNCTIONAL_SPEC.html].
3. ทำ `llms.txt` และ GEO-ready internal linking structures [page:REQUIREMENTS_SPEC.html].

## Phase 9 — Publish & revalidation

1. ทำ listing publish/unpublish flows [page:FLOWCHARTS.html].
2. ทำ publish validation [page:FUNCTIONAL_SPEC.html].
3. ทำ GEO revalidation jobs [page:SEQUENCE_DIAGRAMS.html].

## Phase 10 — Audit & NFR

1. ทำ audit_logs สำหรับ actions สำคัญ [page:REQUIREMENTS_SPEC.html].
2. ตรวจ performance, accessibility, security ตาม spec [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].
3. รัน acceptance flows A–E และ Listing Publish Flow ก่อน sign-off [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].
