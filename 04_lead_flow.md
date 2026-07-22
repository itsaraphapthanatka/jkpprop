# 04 Lead Flow — v2 (Lead & Brokerage Workflow)

เอกสารนี้เป็นเวอร์ชันปรับปรุงเต็มของ `04_lead_flow.md` โดยเปลี่ยนจากการโฟกัสเฉพาะ contact/inquiry forms บนหน้าเว็บไซต์ ไปเป็น **Lead & Brokerage Workflow** ของระบบ Industrial Property Platform v1 ซึ่งครอบคลุมเส้นทางตั้งแต่ public inquiry, requirement intake, lead qualification, shortlist creation, visit planning, negotiation ไปจนถึง deal closure และ cancellation handling [page:REQUIREMENTS_SPEC.html][page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html][file:458][code_file:540].

เอกสารฉบับนี้ควรถูกใช้เป็น operational blueprint สำหรับทีม product, CRM, frontend, backend และ QA เพื่อให้ทุกฝ่ายเข้าใจว่าคำว่า “lead flow” ในระบบนี้ไม่ได้แปลว่าแค่มีฟอร์มส่งข้อความ แต่หมายถึง **stateful business pipeline** ที่พาความต้องการของลูกค้าจาก first contact ไปสู่ transaction outcome [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][code_file:540].

## เป้าหมายของ lead flow v2

Lead flow เวอร์ชันใหม่นี้มีเป้าหมายหลัก 5 ข้อ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

1. นิยามให้ชัดว่า public inquiry เป็นเพียงจุดเริ่มต้นของ workflow ไม่ใช่จุดสิ้นสุด [page:REQUIREMENTS_SPEC.html].
2. map การไหลของข้อมูลจาก contact/listing inquiry/requirement wizard เข้าสู่ CRM objects ที่ถูกต้อง [page:SEQUENCE_DIAGRAMS.html].
3. เชื่อม lead กับ requirement, shortlist, visit, negotiation และ deal ให้เป็น pipeline เดียว [page:FLOWCHARTS.html].
4. แยก stages และ state transitions เพื่อให้ assign responsibility ได้ชัด [page:FUNCTIONAL_SPEC.html].
5. รองรับทั้ง happy path, disqualification path, cancellation path และ reactivation path [page:REQUIREMENTS_SPEC.html][page:FLOWCHARTS.html].

## ภาพรวม flow ระดับธุรกิจ

จากสเปก v1.1 ระบบนี้ทำงานแบบ brokerage-assisted journey ไม่ใช่ marketplace แบบ self-serve [page:REQUIREMENTS_SPEC.html].  ลูกค้าเริ่มจากการดู listings หรือส่ง requirement จากนั้นทีมขายจะเข้ามาคัดกรอง, ทำความเข้าใจ requirement, สร้าง shortlist, นัดดูสถานที่, เจรจาเงื่อนไข และปิดการขาย/เช่า [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].

ดังนั้น lead flow ใหม่ควรถูกแบ่งเป็น 6 phases หลัก [code_file:540][page:FLOWCHARTS.html]:

- Phase A — Intake
- Phase B — Qualification & Requirement Structuring
- Phase C — Matching, Shortlist & Client Review
- Phase D — Visit Planning & Execution
- Phase E — Negotiation & Deal Closure
- Phase F — Cancellation, Loss, Archive & Reactivation

## Actors ที่เกี่ยวข้องกับ lead flow

ระบบนี้มีหลาย actor ที่เกี่ยวข้องกับ lead flow และต้อง map บทบาทให้ชัดเจน [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- **Public visitor / client representative** — ส่ง inquiry, ให้ requirement, review shortlist, เข้าดูสถานที่, ตอบรับ/ปฏิเสธข้อเสนอ [page:REQUIREMENTS_SPEC.html].
- **Sales agent** — owner หลักของ lead qualification, relationship handling, shortlist curation, negotiation [page:REQUIREMENTS_SPEC.html].
- **Operations coordinator** — ช่วยเรื่อง availability checks, visit logistics, landlord coordination, follow-up logistics [page:FUNCTIONAL_SPEC.html].
- **Listing manager** — ดูแลความพร้อมและความถูกต้องของ listing ที่จะเอาเข้า shortlist หรือ visits [page:FUNCTIONAL_SPEC.html].
- **Super admin / manager** — ดู oversight, assignment, quality control และ exception handling [page:REQUIREMENTS_SPEC.html].

## Lead flow objects

ก่อนอธิบาย phases ต้องแยก business objects หลักให้ชัด เพราะ flow ที่ดีต้องไหลผ่าน objects ที่ชัดเจน [page:UML_CLASS_DIAGRAM.html][page:REQUIREMENTS_SPEC.html]:

- `lead` — เคสทางธุรกิจหลักของลูกค้ารายหนึ่งหรือความต้องการหนึ่งก้อน [page:REQUIREMENTS_SPEC.html]
- `lead_contact` — contact persons ของ lead [page:REQUIREMENTS_SPEC.html]
- `company` — องค์กรของลูกค้า [page:REQUIREMENTS_SPEC.html]
- `requirement` — structured needs และ constraints [page:REQUIREMENTS_SPEC.html]
- `shortlist` / `shortlist_item` — candidate listings ที่คัดแล้ว [page:REQUIREMENTS_SPEC.html]
- `visit` — process ของการนัดและดูสถานที่ [page:SEQUENCE_DIAGRAMS.html]
- `negotiation_case` / `offer` — กระบวนการข้อเสนอและการเจรจา [page:FUNCTIONAL_SPEC.html]
- `deal` — outcome object เมื่อปิดสำเร็จหรือสรุปผล [page:REQUIREMENTS_SPEC.html]
- `task`, `note`, `activity_log` — supporting operational records [page:FUNCTIONAL_SPEC.html]

## Phase A — Intake

Phase A คือจุดรับข้อมูลเข้าระบบจากผู้ใช้ภายนอก [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html].  จุดเริ่มต้นนี้อาจเกิดจาก 3 intake channels หลัก ซึ่งแต่ละแบบมีระดับโครงสร้างข้อมูลต่างกัน [page:REQUIREMENTS_SPEC.html].

### A1. Contact page inquiry

ผู้ใช้ส่ง inquiry ทั่วไปผ่าน contact page โดยให้ข้อมูลพื้นฐาน เช่น name, email, phone, subject, message [file:458][page:REQUIREMENTS_SPEC.html].  flow นี้เหมาะกับกรณีที่ผู้ใช้ยังไม่พร้อมให้รายละเอียด requirement เต็มรูปแบบหรือแค่ต้องการให้ทีมติดต่อกลับ [page:REQUIREMENTS_SPEC.html].

#### Expected system behavior

- สร้าง lead record ใหม่ หากไม่สามารถ match กับ lead เดิมได้ [page:SEQUENCE_DIAGRAMS.html]
- สร้าง/อัปเดต contact data [page:REQUIREMENTS_SPEC.html]
- บันทึก source channel เป็น `contact_page` หรือเทียบเท่า [page:FUNCTIONAL_SPEC.html]
- สร้าง initial activity log ว่ามี contact form submitted [page:FUNCTIONAL_SPEC.html]
- ตั้งสถานะเริ่มต้นเป็น `new` หรือ `unqualified` ตาม rule ที่กำหนด [page:REQUIREMENTS_SPEC.html]

### A2. Listing-bound inquiry

ผู้ใช้กด inquiry จากหน้ารายละเอียด listing และส่งข้อความอ้างอิง listing นั้นโดยตรง [page:REQUIREMENTS_SPEC.html][file:458].  flow นี้มี context เชิงพาณิชย์สูงกว่าฟอร์มทั่วไป เพราะทีมรู้ทันทีว่าลูกค้าสนใจทรัพย์ใด [page:SEQUENCE_DIAGRAMS.html].

#### Expected system behavior

- สร้างหรือจับคู่ lead [page:SEQUENCE_DIAGRAMS.html]
- บันทึก relation ระหว่าง inquiry กับ `listing_id` ที่เกี่ยวข้อง [page:REQUIREMENTS_SPEC.html]
- prefill lead context ว่ามาจาก listing ใด, transaction type ใด, location ใด [page:FUNCTIONAL_SPEC.html]
- เปิดทางให้ agent ตัดสินใจได้เร็วขึ้นว่าจะตอบกลับเชิง listing-specific หรือขยายเป็น requirement discovery [page:FLOWCHARTS.html]

### A3. Requirement wizard submission

นี่คือ intake path ที่มีคุณภาพข้อมูลสูงสุด เพราะผู้ใช้กรอกข้อมูลเชิงโครงสร้าง เช่น company profile, operation type, budget, size, preferred locations, move-in timeline และ factory-license needs [page:REQUIREMENTS_SPEC.html].  flow นี้ควรสร้างทั้ง lead และ requirement ตั้งแต่แรก [page:SEQUENCE_DIAGRAMS.html].

#### Expected system behavior

- สร้าง lead พร้อม source `requirement_form` หรือ equivalent [page:FUNCTIONAL_SPEC.html]
- สร้าง company และ lead_contact ถ้าข้อมูลมีเพียงพอ [page:REQUIREMENTS_SPEC.html]
- สร้าง requirement พร้อม preferred locations และ constraints [page:REQUIREMENTS_SPEC.html]
- ตั้งสถานะเข้าสู่ qualification stage ที่พร้อมสำหรับ agent review [page:FLOWCHARTS.html]

### A4. Validation rules ใน phase intake

Validation สำคัญใน Phase A มีอย่างน้อยดังนี้ [page:REQUIREMENTS_SPEC.html]:

- ต้องมี contact method อย่างน้อยหนึ่งอย่าง เช่น email หรือ phone [page:REQUIREMENTS_SPEC.html]
- ถ้าเป็น requirement wizard ต้อง validate fields ที่สำคัญต่อ matching เช่น transaction intent, budget context และ location preferences ตาม rule ที่กำหนด [page:REQUIREMENTS_SPEC.html]
- ต้องมี spam/rate-limit protection ที่เหมาะสม [page:REQUIREMENTS_SPEC.html]
- ต้องเก็บ source channel และ timestamps เสมอ [page:FUNCTIONAL_SPEC.html]

## Phase B — Qualification & Requirement Structuring

หลัง intake แล้ว ขั้นต่อไปไม่ใช่การส่งอีเมลตอบกลับอย่างเดียว แต่คือการทำให้ lead กลายเป็นเคสที่ทีมทำงานต่อได้ [page:FLOWCHARTS.html].  Phase นี้คือหัวใจของ brokerage workflow เพราะเป็นช่วงที่ทีมแยก “แค่สอบถาม” ออกจาก “ดีลที่มีศักยภาพ” [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### B1. Initial review

sales agent หรือ manager ตรวจ lead ใหม่และประเมินความครบของข้อมูล [page:REQUIREMENTS_SPEC.html].  ถ้าข้อมูลยังไม่พอ ระบบควรรองรับการติดต่อกลับเพื่อเก็บข้อมูลเพิ่มเติมและเติม requirement ภายหลัง [page:FUNCTIONAL_SPEC.html].

### B2. Assignment

lead ต้องถูก assign ให้ owner ชัดเจน โดยอาจเป็น sales agent ตาม geography, language, workload หรือ specialization [page:REQUIREMENTS_SPEC.html].  assignment event ต้องถูกบันทึกใน activity log เพื่อให้ตรวจสอบย้อนกลับได้ [page:FUNCTIONAL_SPEC.html].

### B3. Requirement enrichment

หาก lead มาจาก contact page หรือ listing inquiry ข้อมูลอาจยังไม่พอสำหรับ shortlist [page:FLOWCHARTS.html].  ทีมต้อง enrich ให้กลายเป็น requirement ที่ actionable โดยเก็บข้อมูลอย่างน้อยเรื่อง:

- property type need [page:REQUIREMENTS_SPEC.html]
- rent/sale intent [page:REQUIREMENTS_SPEC.html]
- required size [page:REQUIREMENTS_SPEC.html]
- budget range [page:REQUIREMENTS_SPEC.html]
- geography priorities [page:REQUIREMENTS_SPEC.html]
- move-in urgency [page:REQUIREMENTS_SPEC.html]
- factory license / zoning constraints [page:REQUIREMENTS_SPEC.html]
- access/proximity constraints [page:REQUIREMENTS_SPEC.html]

### B4. Qualification outcomes

หลัง enrichment แล้ว lead ควรไปสู่ outcome หลัก 4 แบบ [code_file:540][page:FLOWCHARTS.html]:

1. **Qualified** — ข้อมูลพอสำหรับเริ่ม matching/shortlisting [page:FLOWCHARTS.html]
2. **Pending info** — ยังต้องรอข้อมูลเพิ่มจากลูกค้า [page:FUNCTIONAL_SPEC.html]
3. **Disqualified** — ไม่เข้าเกณฑ์ เช่น budget ไม่สมจริง, นอกขอบเขตธุรกิจ, หรือไม่สามารถช่วยได้ [page:REQUIREMENTS_SPEC.html]
4. **Duplicate / merged** — เป็น lead ซ้ำที่ต้อง merge กับ record เดิม [page:FUNCTIONAL_SPEC.html]

### B5. State suggestions for qualification phase

เพื่อให้ implementation และ QA มีภาพชัด ควรมี states ประมาณนี้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- `new`
- `contacted`
- `pending_info`
- `qualified`
- `disqualified`
- `merged`

ระบบจริงอาจใช้ชื่ออื่นได้ แต่ต้องรักษาความหมายของ transitions ให้เหมือนกัน [page:FUNCTIONAL_SPEC.html].

## Phase C — Matching, Shortlist & Client Review

เมื่อ requirement พร้อมแล้ว ระบบจะเข้าสู่การคัดเลือก listings ที่ตรงและพร้อมใช้งาน [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].  Phase นี้สำคัญเพราะเป็นจุดเปลี่ยนจาก “ข้อมูลลูกค้า” ไปสู่ “ข้อเสนอเชิง inventory” [page:REQUIREMENTS_SPEC.html].

### C1. Candidate search

agent หรือ listing manager ใช้ requirement เพื่อค้นหา candidate listings จาก inventory [page:FUNCTIONAL_SPEC.html].  ในขั้นนี้ควรกรองด้วยปัจจัยหลัก เช่น type, location, size, budget, license compatibility, zoning และ availability [page:REQUIREMENTS_SPEC.html].

### C2. Availability and suitability checks

ก่อนเอา listing เข้า shortlist ควรมีการตรวจว่า listing ยัง active/published/available และยังสอดคล้องกับ requirement จริง [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html].  ถ้า listing ไม่พร้อมใช้งานหรือข้อมูลไม่อัปเดต ต้องไม่ถูกส่งเข้า shortlist อย่างไม่ระวัง [page:FUNCTIONAL_SPEC.html].

### C3. Shortlist creation

เมื่อเลือก candidate แล้ว agent สร้าง shortlist object และเพิ่ม shortlist items แบบมีลำดับหรือ priority [page:REQUIREMENTS_SPEC.html].  หนึ่ง shortlist มักผูกกับหนึ่ง requirement หรือหนึ่ง active search case [page:FUNCTIONAL_SPEC.html].

### C4. Shortlist review and send

shortlist อาจถูก review ภายในก่อนส่งลูกค้า [page:FLOWCHARTS.html].  หลังส่งแล้ว ระบบควรบันทึกว่า shortlist อยู่ในสถานะ `sent` พร้อม timestamp และช่องทางการส่ง [page:FUNCTIONAL_SPEC.html].

### C5. Client feedback capture

ลูกค้าอาจตอบกลับว่า interested, not interested หรือ undecided ต่อแต่ละ listing [page:REQUIREMENTS_SPEC.html].  feedback นี้ควรเก็บในระดับ `shortlist_item` ไม่ใช่แค่ note ลอย ๆ เพื่อให้ใช้ต่อใน visit planning และ analytics ได้ [page:FUNCTIONAL_SPEC.html].

### C6. Outcomes of shortlist phase

ผลลัพธ์จาก phase นี้มีได้หลายแบบ [page:FLOWCHARTS.html]:

- มี 1+ listings ที่ลูกค้าสนใจ → ไป phase visit [page:FLOWCHARTS.html]
- ไม่มีรายการไหนตรง → กลับไป refine requirement หรือค้นหาใหม่ [page:FUNCTIONAL_SPEC.html]
- ลูกค้าหยุดตอบ → เข้าสู่ follow-up / dormant state [page:FUNCTIONAL_SPEC.html]
- requirement ถูกยกเลิก → ไป phase cancellation [page:REQUIREMENTS_SPEC.html]

## Phase D — Visit Planning & Execution

Phase นี้ครอบคลุมการนัดหมาย, ประสานงาน, กรองความพร้อมก่อนนัด และเก็บผลลัพธ์หลังการเข้าชม [page:SEQUENCE_DIAGRAMS.html].  สเปก v1.1 ให้ความสำคัญกับ criteria gate ก่อน confirm visit อย่างชัดเจน [page:SEQUENCE_DIAGRAMS.html].

### D1. Visit gating

ก่อนนัดดูจริง ต้องตรวจให้ผ่านเกณฑ์สำคัญอย่างน้อย [page:SEQUENCE_DIAGRAMS.html][page:REQUIREMENTS_SPEC.html]:

- budget fit
- size fit
- area fit
- licensing / zoning fit
- timeline fit
- current availability

หากไม่ผ่านเกณฑ์ที่ตกลงไว้ ไม่ควรนัดดูเพียงเพราะ listing สวยหรือสะดวก [page:SEQUENCE_DIAGRAMS.html].

### D2. Scheduling

หลัง gate ผ่านแล้ว operations coordinator หรือ agent ทำการนัดหมาย [page:FUNCTIONAL_SPEC.html].  ระบบ visit ควรเก็บข้อมูลเรื่อง date/time, client participants, internal participants, landlord coordination และ stop order ถ้าเป็นหลาย listings [page:SEQUENCE_DIAGRAMS.html].

### D3. Visit execution

หลังการดูสถานที่จริง ต้องบันทึกผล เช่น [page:FUNCTIONAL_SPEC.html]:

- ลูกค้าชอบ/ไม่ชอบ listing ใด [page:FUNCTIONAL_SPEC.html]
- มีประเด็นติดขัดอะไร [page:FUNCTIONAL_SPEC.html]
- ต้อง follow-up เอกสาร ราคา หรือ technical check เพิ่มหรือไม่ [page:FUNCTIONAL_SPEC.html]

### D4. Post-visit outcomes

ผลลัพธ์ของ visit phase โดยทั่วไปมี 4 แบบ [code_file:540][page:FLOWCHARTS.html]:

1. พร้อมเข้าสู่ negotiation [page:FLOWCHARTS.html]
2. ต้องหา shortlist เพิ่ม [page:FUNCTIONAL_SPEC.html]
3. ต้องเก็บ requirement เพิ่มแล้ววนกลับ [page:FUNCTIONAL_SPEC.html]
4. ลูกค้ายกเลิกหรือหยุดเคลื่อนไหว [page:REQUIREMENTS_SPEC.html]

## Phase E — Negotiation & Deal Closure

เมื่อมี listing ที่ผ่านขั้น visit และลูกค้าสนใจจริง กระบวนการจะเข้าสู่ negotiation [page:FLOWCHARTS.html][page:FUNCTIONAL_SPEC.html].  Phase นี้ไม่ควรเก็บเป็นแค่ free-text notes เพราะมีหลายรอบของ offers และเงื่อนไขที่ต้อง trace ได้ [page:FUNCTIONAL_SPEC.html].

### E1. Negotiation case creation

ควรสร้าง `negotiation_case` เมื่อมี intent ชัดว่าจะพูดเรื่อง terms หรือ price ของ listing หนึ่งหรือหลาย listing [page:FUNCTIONAL_SPEC.html].  negotiation case ต้องเชื่อมกับ lead, requirement และ listing ที่เกี่ยวข้อง [page:FUNCTIONAL_SPEC.html].

### E2. Offer rounds

ระบบต้องรองรับหลายรอบของ offer/counter-offer พร้อมบันทึก [page:FUNCTIONAL_SPEC.html]:

- ราคา/ค่าเช่า/ค่าขาย [page:FUNCTIONAL_SPEC.html]
- deposit / term / conditions [page:FUNCTIONAL_SPEC.html]
- actor ผู้เสนอ [page:FUNCTIONAL_SPEC.html]
- timestamp [page:FUNCTIONAL_SPEC.html]
- result ของแต่ละรอบ [page:FUNCTIONAL_SPEC.html]

### E3. Negotiation outcomes

ผลลัพธ์ระดับ negotiation มีได้อย่างน้อย [page:FLOWCHARTS.html]:

- accepted → ไปสร้าง deal [page:FLOWCHARTS.html]
- countered → อยู่ใน negotiation ต่อ [page:FUNCTIONAL_SPEC.html]
- failed → mark lost reason [page:FUNCTIONAL_SPEC.html]
- stalled → follow-up/dormant [page:FUNCTIONAL_SPEC.html]

### E4. Deal closure

เมื่อบรรลุข้อตกลง ควรสร้าง `deal` เป็น source of truth ของ outcome [page:REQUIREMENTS_SPEC.html].  deal ควรเก็บข้อมูลอย่างน้อย:

- linked lead / requirement / listing [page:REQUIREMENTS_SPEC.html]
- transaction type [page:REQUIREMENTS_SPEC.html]
- final terms / final price [page:FUNCTIONAL_SPEC.html]
- close date [page:FUNCTIONAL_SPEC.html]
- commission information [page:REQUIREMENTS_SPEC.html]
- win/loss outcome and notes [page:FUNCTIONAL_SPEC.html]

## Phase F — Cancellation, Loss, Archive & Reactivation

Lead flow ที่ดีต้องไม่ออกแบบเฉพาะ happy path [page:FUNCTIONAL_SPEC.html].  สเปก v1.1 ระบุกรณี cancellation/disqualification และ implied loss handling ชัดเจน จึงต้องทำ phase นี้เป็นส่วนถาวรของ workflow [page:REQUIREMENTS_SPEC.html][page:FLOWCHARTS.html].

### F1. Requirement cancellation

หากลูกค้าขอยกเลิก requirement ต้องมีเหตุผลบังคับและเก็บเป็น structured field ไม่ใช่ free-text อย่างเดียว [page:REQUIREMENTS_SPEC.html].  ตัวอย่าง reason families ได้แก่:

- no longer interested [page:REQUIREMENTS_SPEC.html]
- budget changed [page:REQUIREMENTS_SPEC.html]
- timeline changed [page:REQUIREMENTS_SPEC.html]
- found elsewhere [page:FUNCTIONAL_SPEC.html]
- not qualified / outside scope [page:FUNCTIONAL_SPEC.html]

### F2. Lost deal / inactive lead

กรณีไม่ปิดดีลหรือ lead เงียบไป ควรแยกอย่างน้อยระหว่าง `lost`, `inactive`, `archived` และ `disqualified` เพื่อให้ reporting ไม่ปะปนกัน [page:FUNCTIONAL_SPEC.html][code_file:540].

### F3. Reactivation

บาง leads อาจกลับมาหลังจากเวลาผ่านไป [page:FUNCTIONAL_SPEC.html].  ระบบควรรองรับการ reactivate lead เดิม แทนการสร้างเคสใหม่โดยไม่จำเป็น หากยังเป็น business context เดิมหรือสัมพันธ์กัน [page:FUNCTIONAL_SPEC.html].

## Source channels and attribution

Lead flow ควรเก็บ source attribution อย่างชัดเจนตั้งแต่ intake [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  อย่างน้อยควรแยก source แบบนี้:

- homepage / contact page [page:REQUIREMENTS_SPEC.html]
- listing inquiry [page:REQUIREMENTS_SPEC.html]
- requirement wizard [page:REQUIREMENTS_SPEC.html]
- direct manual entry by staff [page:FUNCTIONAL_SPEC.html]
- referral / offline import (ถ้ามี) [page:FUNCTIONAL_SPEC.html]

การมี source channel ที่ชัดช่วยทั้งเรื่อง reporting, operational prioritization และ future marketing attribution แม้เวอร์ชันปัจจุบันอาจยังไม่มี analytics stack ครบถ้วน [file:458][page:FUNCTIONAL_SPEC.html].

## Recommended status model

เพื่อให้ทีมมี baseline เดียวกัน เอกสารนี้เสนอ status framework แบบกว้างดังนี้ [code_file:540][page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

### Lead status

- `new`
- `contacted`
- `pending_info`
- `qualified`
- `inactive`
- `disqualified`
- `archived`

### Requirement status

- `draft`
- `active`
- `matching`
- `visiting`
- `negotiating`
- `won`
- `lost`
- `cancelled`

### Shortlist status

- `draft`
- `internal_review`
- `sent`
- `client_review`
- `superseded`
- `closed`

### Visit status

- `planning`
- `confirmed`
- `completed`
- `cancelled`
- `no_show`

### Negotiation status

- `open`
- `countered`
- `accepted`
- `failed`
- `stalled`
- `closed`

สถานะจริงใน implementation อาจลดหรือเพิ่มได้ แต่ไม่ควรสูญเสียความหมายระดับ phase ที่กล่าวมา [page:FUNCTIONAL_SPEC.html].

## Workflow rules and guardrails

เพื่อให้ lead flow ทำงานได้จริง ควรกำหนด guardrails ที่ชัดเจน [page:FUNCTIONAL_SPEC.html][page:REQUIREMENTS_SPEC.html]:

- ห้าม shortlist listings ที่ unpublished หรือ inactive โดยไม่มี override reason ที่เหมาะสม [page:REQUIREMENTS_SPEC.html]
- ควรทำ availability/suitability checks ก่อนส่ง shortlist สำคัญหรือก่อนนัด visit [page:SEQUENCE_DIAGRAMS.html]
- การ cancel requirement ต้องมี reason เสมอ [page:REQUIREMENTS_SPEC.html]
- การ close deal ต้องผูกกับ listing และ lead/requirement ที่ถูกต้อง [page:FUNCTIONAL_SPEC.html]
- ควรบันทึก assignment changes, state transitions และ key actions ลง activity log [page:FUNCTIONAL_SPEC.html]

## CRM views ที่สอดคล้องกับ flow นี้

เพื่อรองรับ flow ข้างต้น Admin/CRM ควรมี surfaces อย่างน้อย [page:FUNCTIONAL_SPEC.html][page:REQUIREMENTS_SPEC.html]:

- lead inbox / list
- lead detail workspace
- requirement detail/edit view
- shortlist builder
- visit planner/calendar
- negotiation case workspace
- deal records view
- lost/cancelled archive with reasons

หากไม่มี views เหล่านี้ lead flow จะกลายเป็นเพียงแนวคิด แต่ไม่สามารถใช้งานในระบบจริงได้ [code_file:540].

## What changed from the previous version

เมื่อเทียบกับ `04_lead_flow.md` เดิม ความเปลี่ยนแปลงหลักคือ [file:458][code_file:540]:

- เดิมโฟกัส form modules และ contact channels แต่ฉบับนี้ยกระดับเป็น end-to-end brokerage workflow [file:458][page:FLOWCHARTS.html]
- เดิมยังไม่เชื่อม inquiry กับ requirement, shortlist, visit และ deal อย่างเป็นระบบ แต่ฉบับนี้เชื่อม phases A–F ครบ [page:SEQUENCE_DIAGRAMS.html][page:FLOWCHARTS.html]
- เดิมเน้นพฤติกรรม DOM/forms ของเว็บไซต์จริง แต่ฉบับนี้นิยาม business states และ object transitions ตาม spec v1.1 [page:REQUIREMENTS_SPEC.html][code_file:540]
- เดิมไม่มี recommended status model ที่พร้อมใช้เป็น baseline implementation แต่ฉบับนี้จัด framework ให้ครบ [page:FUNCTIONAL_SPEC.html]

## สรุป

`04_lead_flow.md` เวอร์ชันนี้นิยาม lead flow ใหม่ให้เป็น **business pipeline ของระบบทั้งชุด** ไม่ใช่เพียง collection ของ forms หรือ contact buttons [page:REQUIREMENTS_SPEC.html][page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html][code_file:540].  เอกสารนี้เชื่อม public intake, CRM qualification, shortlist creation, visit execution, negotiation และ closure เข้าด้วยกันอย่างเป็นลำดับ ทำให้ใช้เป็น baseline สำหรับ product logic, admin UI, API design, automation rules และ QA scenario design ได้ทันที [page:FUNCTIONAL_SPEC.html][code_file:540].
