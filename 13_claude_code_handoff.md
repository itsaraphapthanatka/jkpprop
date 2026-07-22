# 13 Claude Code Handoff — v2 (Aligned with v1 Specs)

เอกสารนี้เป็นเวอร์ชันปรับปรุงล่าสุดของ `13_claude_code_handoff.md` เพื่อให้ Claude Code ทำงานสอดคล้องกับ **`SPEC_PACK.md`** (Specification Pack v1.1) ของ Industrial Property Platform v1 โดยตรง แทนที่จะโฟกัสแค่ public website และ design system [SPEC_PACK.md][code_file:540]

> **หมายเหตุ:** เอกสาร spec เดิมที่เคยแยกเป็นไฟล์ HTML (`REQUIREMENTS_SPEC.html`, `FUNCTIONAL_SPEC.html`, `FLOWCHARTS.html`, `UML_CLASS_DIAGRAM.html`, `SEQUENCE_DIAGRAMS.html`) ถูกรวมเป็นไฟล์เดียวคือ `SPEC_PACK.md` แล้ว โดยแบ่งเป็น Part 1–6:
> - **Part 1** — Requirement Specification (FR/NFR + acceptance criteria)
> - **Part 2** — Functional Specification (behavior รายหน้าจอ/ฟิลด์ + permissions + edge cases)
> - **Part 3** — Flow Charts (Lead pipeline + Flow A–E + Listing Publish)
> - **Part 4** — UML Class Diagram (domain model)
> - **Part 5** — Sequence Diagrams
> - **Part 6** — ER Diagram (DBML — 54 ตาราง, source of truth ที่ Prisma schema ต้อง sync 100%)

## 1. ขอบเขตงานของ Claude Code ตามสเปกใหม่

Claude Code ไม่ได้ถูกใช้แค่สำหรับหน้า Home/Listing/Detail/Contact อีกต่อไป แต่ต้องมองระบบทั้งหมดเป็น **brokerage workflow platform** ประกอบด้วย 3 ชั้นหลัก [SPEC_PACK.md][code_file:540]

- Public Website — search, listing discovery, detail views, FAQ, useful tips, service pages, area pages, contact/inquiry, requirement intake [SPEC_PACK.md · Part 1–2]
- Admin / Operations App — CRM/lead management, requirement detail, shortlist builder, availability gating, visit planning, negotiation/deal management, media/listings publishing, SEO/CMS, roles/permissions [SPEC_PACK.md · Part 2]
- Content & GEO Layer — multilingual CMS (th/en/zh), taxonomy/geography, SEO metadata, JSON-LD schemas, llms.txt, GEO-ready landing structures และ public render สำหรับ Google / AI search [SPEC_PACK.md · Part 1, Part 5]

ทุกครั้งที่ Claude Code ได้ task ที่เกี่ยวกับ platform นี้ ให้ถือว่ากำลังทำงานในบริบทของแพลตฟอร์มทั้ง 3 ชั้น ไม่ใช่แค่เว็บไซต์ brochure [code_file:540].

## 2. ลำดับการอ่านเอกสารก่อนเริ่มทำงาน

ก่อนเริ่มเขียนโค้ดหรือออกแบบข้อมูล Claude Code ต้องอ่านเอกสารตามลำดับนี้เสมอ [SPEC_PACK.md][code_file:540]:

1. `SPEC_PACK.md` · **Part 1 — Requirement Specification** — เพื่อเข้าใจ FR/NFR, actor, scope, acceptance criteria
2. `SPEC_PACK.md` · **Part 2 — Functional Specification** — เพื่อเห็นหน้าจอ, form, behavior, state rules, edge cases
3. `SPEC_PACK.md` · **Part 3 — Flow Charts** และ **Part 5 — Sequence Diagrams** — เพื่อเข้าใจ flow A–E, listing publish flow, sequence contracts และ async jobs
4. `SPEC_PACK.md` · **Part 4 — UML Class Diagram** และ **Part 6 — ER Diagram (DBML)** — เพื่อเข้าใจ domain model และ relations ที่ต้องเคารพ (Prisma schema ต้อง sync 100% กับ DBML) [code_file:540]
5. เอกสารชุด 01–15 (เวอร์ชันล่าสุด) — เพื่อปรับ implementation ให้เข้ากับ design system และข้อมูลสรุป [code_file:540]

## 3. กฎการเคารพ FR/NFR

เวลาจะ build feature, route หรือ component ที่เกี่ยวกับแพลตฟอร์มนี้ Claude Code ต้องตรวจว่า feature นั้นมี FR code หรือไม่ และต้องทำตามรายละเอียดนั้นก่อนทำตามความสะดวกของดีไซน์หรือโค้ด [SPEC_PACK.md · Part 1].

- Search/filter UI ต้องรองรับ filter set ตาม `FR-SRC-01` และ behavior rent/sale/both ตาม `FR-SRC-09` [SPEC_PACK.md · Part 1].
- หน้า detail ต้องเคารพ `map_visibility_level` และห้าม expose lat/long จริงใน public API/render ที่ระดับจังหวัด/อำเภอ/ตำบล ตาม `FR-LST-02` [SPEC_PACK.md · Part 1–2].
- Requirement form ต้องรองรับฟิลด์ตาม `FR-INQ-02` และ validation server-side ตาม `FR-INQ-04` [SPEC_PACK.md · Part 1].

หากมี conflict ระหว่างดีไซน์กับข้อกำหนด ให้ยึด FR/NFR ก่อนเสมอ [code_file:540].

## 4. Role & permission awareness

Claude Code ห้ามสร้างฟีเจอร์ที่ละเลย role matrix หรือเปิด action ให้ actor ที่ไม่อนุญาต ตาม permissions matrix (Part 2 §5) และ `FR-SEC-02` [SPEC_PACK.md · Part 1–2].

- Sales agent เห็นเฉพาะ lead ที่ถูก assign ให้ตัวเอง [SPEC_PACK.md · Part 1 · FR-CRM-04]
- Translator แก้เฉพาะ translation fields [SPEC_PACK.md · Part 1 · FR-CMS-06]
- Super admin จัดการ users/roles/settings/audit [SPEC_PACK.md · Part 1 · FR-SEC]

เวลาสร้าง route, menu, button หรือ API call ต้องระบุ role gating ชัดเจน — enforce ที่ API layer ไม่ใช่แค่ UI (`FR-SEC-02`) [SPEC_PACK.md · Part 2].

## 5. ข้อห้ามหลัก

1. ห้ามสร้าง customer login ใน v1 [SPEC_PACK.md · Part 1 §7].
2. ห้ามทำ self-serve marketplace [SPEC_PACK.md · Part 1 §1].
3. ห้ามแสดง address/lat-long จริงใน public UI/API ถ้า visibility ไม่อนุญาต [SPEC_PACK.md · Part 1 · FR-LST-02].
4. ห้าม bypass state machines ด้วยการแก้ status ตรง ๆ — ทุก transition ต้องอยู่ใน STATUS_ENUMS state machine [SPEC_PACK.md · Part 1–2, Part 6].
5. ห้ามทำ CSV **bulk import** ใน v1 (เป็น v1.1 candidate) — แต่ **export** listings เป็น .xlsx/.csv เป็นสิ่งที่ต้องมี ตาม `FR-ADM-10` [SPEC_PACK.md · Part 1 §7, Part 1 · FR-ADM-10].

## 6. การเชื่อมกับ design system

Claude Code ยังต้องเคารพ `DESIGN.md`, `07_source_design_system.md`, `08_design_tokens_normalized_green_revision_full.md` และ `09_design_transformation_rules.md` แต่เมื่อมี conflict ระหว่าง visual preference กับ requirements ให้เลือก requirements (`SPEC_PACK.md`) ก่อน [SPEC_PACK.md][file:470][file:477][file:480][code_file:540][code_file:585].
