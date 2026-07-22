# AGENT.md — Working Guide for Rebuilding the Industrial Property Platform

เอกสารนี้เป็น `AGENT.md` ฉบับปรับปรุงใหม่สำหรับใช้เป็น **working guide ของคนหรือ AI agent ที่เข้ามาทำงานต่อในโปรเจกต์** โดยรวมทั้งภาพรวมธุรกิจ, ขอบเขตระบบ, design-system intent, information architecture, content model, listing logic, lead flow, SEO/GEO requirements และกฎการตัดสินใจที่สำคัญไว้ในไฟล์เดียว [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][file:457][file:458][file:459][file:460][file:462][code_file:585].

เอกสารนี้ไม่ได้มีเป้าหมายเพื่อแทนเอกสารรายละเอียดรายไฟล์ทั้งหมด แต่ทำหน้าที่เป็น **master orientation file** เพื่อให้ผู้ที่เริ่มงานใหม่สามารถเข้าใจได้อย่างรวดเร็วว่าโปรเจกต์นี้คืออะไร, อะไรถูกตัดสินไปแล้ว, ควรอ้างอิงเอกสารไหนต่อ, และมีกฎอะไรบ้างที่ห้ามหลุด [code_file:585].

## 1. Project context

โปรเจกต์นี้คือการ rewrite ระบบเว็บไซต์/แพลตฟอร์มของธุรกิจ industrial property brokerage จากเว็บเดิมที่มีลักษณะเป็น public-facing real estate site ไปสู่ **platform v1.1** ที่รองรับทั้ง public discovery, requirement intake, CRM-connected brokerage workflows, content/GEO expansion, multilingual SEO และ internal admin operations [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

สิ่งสำคัญคือต้องมองโปรเจกต์นี้ว่าเป็น **platform rebuild** ไม่ใช่แค่ redesign หน้าเว็บ [page:FUNCTIONAL_SPEC.html]. ถ้าตัดสินใจทุกอย่างจากมุม “หน้าเว็บนี้หน้าตาเป็นอย่างไร” โดยไม่ผูกกับ object model, routing, CRM และ discoverability architecture จะย้อนกลับไปติดข้อจำกัดของระบบเดิมอีก [file:460][file:462].

## 2. Core business model

ธุรกิจนี้ไม่ใช่ e-commerce ที่ผู้ใช้ค้นหาแล้ว checkout เอง แต่เป็น **broker-assisted industrial property search and transaction flow** [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html]. Public website จึงมีหน้าที่หลัก 4 อย่าง [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- สร้างความน่าเชื่อถือของแบรนด์และทีม [file:480][file:481]
- ช่วยให้ผู้ใช้ค้นหา inventory ที่เกี่ยวข้องได้ [file:457][page:FUNCTIONAL_SPEC.html]
- เปลี่ยนความสนใจเป็น lead หรือ requirement ที่มีคุณภาพ [file:458][page:SEQUENCE_DIAGRAMS.html]
- ส่งต่อข้อมูลเข้าสู่ workflow ภายใน เช่น shortlist, visit, negotiation และ deal management [page:FLOWCHARTS.html][page:FUNCTIONAL_SPEC.html]

## 3. What has already been rewritten

ขณะนี้มีเอกสารหลักที่ถูก rewrite แล้วครอบคลุม `01–12` ในเชิงโครงสร้างและ design-system reasoning [code_file:585]. ไฟล์ที่สำคัญมากสำหรับการอ้างอิงต่อมีดังนี้:

- `01_page_types.md` — system surface map ของทั้ง public + admin [file:460]
- `02_listing_engine.md` — listing/search/discovery architecture baseline [file:457]
- `03_detail_schema.md` — canonical detail object contract [file:459]
- `04_lead_flow.md` — lead intake และ brokerage workflow logic [file:458]
- `05_seo_and_taxonomy.md` — discoverability, canonical, GEO และ AI-readable layer [file:462]
- `07_source_design_system.md` — evidence base ของ visual system เดิม [file:480][file:485][file:486][file:487]
- `08_design_tokens_normalized_green_revision.md` — canonical token system ใหม่แบบ green-first [code_file:585]
- `09_design_transformation_rules.md` — retain/normalize/recompose/remove rules ที่ต้องตีความภายใต้ palette ใหม่

ทุกงานใหม่ควรเช็คเสมอว่าตรงกับเอกสารเหล่านี้หรือไม่ ก่อนจะเพิ่ม assumption ใหม่ [code_file:585].

## 4. Source system reality you must remember

เว็บเดิมมี strengths บางอย่างที่ต้องไม่ลืม แม้เราจะ rewrite โครงสร้างใหม่เกือบทั้งหมด [file:479][file:480][file:481][file:485][file:486]. สิ่งที่ผู้ใช้เดิมน่าจะจำได้คือ [file:480][file:481][file:485]:

- แบรนด์ดู practical, professional และค่อนข้างตรงไปตรงมา [file:480][file:481]
- หน้า Home ใช้ภาพจริงของโกดัง/โรงงานและ trust modules หลายส่วน [file:479][file:480][file:481]
- typography อ่านง่าย รองรับไทยได้ดี และไม่ได้พยายามเป็นแฟชั่นเกินบริบทธุรกิจ [file:485]

หมายความว่า redesign ใหม่ต้องไม่กลายเป็น generic SaaS, startup gradient site หรือ luxury real estate template [code_file:585]. พร้อมกันนั้น brand accent ใหม่ของระบบให้ถือว่าเป็น **green-first** ไม่ใช่ gold-first [file:584][code_file:585].

## 5. Non-negotiable product principles

สำหรับทุกคนที่เข้ามาทำต่อ โปรเจกต์นี้มีหลักที่ห้ามหลุดอย่างน้อยดังนี้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

1. ระบบนี้ต้องถูกออกแบบเป็น platform ไม่ใช่แค่ brochure website [page:FUNCTIONAL_SPEC.html].
2. Listing, detail, requirement และ CRM linkage คือ business core [file:457][file:458][file:459].
3. SEO/GEO/multilingual discoverability เป็นโครงสร้าง ไม่ใช่ layer เสริม [file:462][page:REQUIREMENTS_SPEC.html].
4. ทุก public surface ต้องช่วยพาไปสู่ conversion หรือ next-step ที่มีเหตุผล [page:SEQUENCE_DIAGRAMS.html].
5. ทุก admin surface ต้องสะท้อน workflow จริง ไม่ใช่แค่ CRUD screens [page:FUNCTIONAL_SPEC.html].
6. Brand continuity ต้องรักษาผ่าน tone, trust posture, color memory และ clarity—not through screenshot cloning [file:480][file:481][file:584][code_file:585].

## 6. Information architecture mindset

เมื่อสร้างหรือแก้ไข page ใดก็ตาม ให้เริ่มจากการถามก่อนว่าหน้านั้นอยู่ใน page family ไหน และมีหน้าที่อะไรในระบบ [file:460]. families หลักของระบบคือ:

- Brand & trust pages [file:460]
- Discovery & listing pages [file:457]
- Detail & comparison pages [file:459]
- Lead intake & conversion pages [file:458]
- Content & GEO pages [file:462][page:REQUIREMENTS_SPEC.html]
- Utility/system-state pages [file:460]
- Admin / operations surfaces [page:FUNCTIONAL_SPEC.html]

ห้ามเริ่มจาก “ดีไซน์ section ก่อน” โดยไม่รู้ว่า page role คืออะไร architecture ต้องมาก่อน composition เสมอ [page:FUNCTIONAL_SPEC.html].

## 7. Listing and detail rules

listing engine และ detail page เป็นหัวใจของ public platform [file:457][file:459]. เวลาทำงานกับส่วนนี้ให้ถือกฎต่อไปนี้ [file:457][file:459][file:462][page:FUNCTIONAL_SPEC.html]:

- listing search เป็น discovery system ไม่ใช่แค่ผลลัพธ์จากฟอร์ม [file:457]
- search states ต้องถูกแยกเป็น canonical vs non-canonical/indexable vs non-indexable อย่างชัดเจน [file:462]
- zone type ต้องถูก treated เป็น taxonomy/filter dimension จริง ไม่ใช่แค่ badge [file:457][file:462]
- detail page คือ canonical object surface ของ listing [file:459]
- detail schema ต้องเป็น source of truth สำหรับ SEO, inquiry context, related listings และ CRM handoff [file:459][page:SEQUENCE_DIAGRAMS.html]

## 8. Lead and conversion rules

lead flow ในระบบใหม่ต้อง mature กว่าระบบเดิมอย่างชัดเจน [file:458][page:FLOWCHARTS.html]. การมี contact form ดีขึ้นเพียงอย่างเดียวไม่เพียงพอ [page:FUNCTIONAL_SPEC.html].

กฎสำคัญคือ [file:458][page:SEQUENCE_DIAGRAMS.html][page:FUNCTIONAL_SPEC.html]:

- แยก clearly ระหว่าง contact inquiry, listing-bound inquiry และ requirement intake [file:458]
- ทุก conversion path ควรไปต่อสู่ CRM objects/workflows ได้ [page:SEQUENCE_DIAGRAMS.html]
- empty search state หรือ no-fit scenarios ควร redirect ทางความคิดไปสู่ requirement flow แทน dead-end [file:457][page:REQUIREMENTS_SPEC.html]
- contact channels ควรมี context enrichment เท่าที่เป็นไปได้ ไม่ใช่ลิงก์ลอย ๆ แบบไม่มีข้อมูล [file:458]

## 9. SEO, taxonomy, and GEO rules

ระบบเดิมมีปัญหา canonical, hreflang, sitemap/robots และ route inconsistency อย่างชัดเจน [file:462]. ในงานใหม่ ห้ามทำซ้ำรูปแบบเดิม [file:462].

กฎสำคัญคือ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][file:462]:

- ทุก public object ต้องมี canonical URL ชัดเจน [file:462]
- multilingual ต้องเป็น locale-first architecture [page:REQUIREMENTS_SPEC.html]
- area pages และ service pages ต้องเป็น discoverability assets จริง [page:FUNCTIONAL_SPEC.html]
- search-page indexing ต้องมี policy ไม่ปล่อย faceted noise เข้า index แบบไร้การควบคุม [file:462]
- llms.txt และ AI-readable discoverability layer เป็น requirement ของระบบใหม่ [page:REQUIREMENTS_SPEC.html]

## 10. Design-system rules

เวลาสร้าง UI ใหม่ ให้ยึดลำดับความคิดนี้ [file:480][file:485][file:486][file:487][file:584][code_file:585]:

1. อ้างอิง source evidence จาก `07` เพื่อเข้าใจ brand memory [file:480][file:486]
2. ใช้ canonical tokens จาก `08_design_tokens_normalized_green_revision.md` แทนการหยิบค่าจาก screenshot โดยตรง [code_file:585]
3. ใช้กฎ transformation จาก `09_design_transformation_rules.md` เพื่อชี้ว่าอะไร retain, normalize, recompose หรือ remove
4. ตรวจว่าหน้าใหม่ support system role จริง ไม่ใช่แค่ดู modern [page:FUNCTIONAL_SPEC.html]

### Visual constraints that matter

- ใช้ green เป็น primary action emphasis แทน gold [file:584][code_file:585]
- ใช้ neutral, clean surfaces เป็นฐาน [file:480]
- ใช้ typography ที่อ่านง่ายและรองรับไทยดี [file:485]
- ใช้ real-world imagery และ trust signals มากกว่า visual gimmicks [file:480][file:481]
- หลีกเลี่ยง gradient-heavy, startup-generic หรือ luxury-template aesthetics [page:FUNCTIONAL_SPEC.html]

## 11. Admin/product UI mindset

admin surfaces ไม่มี source UI เดิมให้ clone มากนัก [file:460]. ดังนั้นเวลาสร้าง admin ให้ถือว่ากำลังออกแบบ **workflow-first product UI** ที่ยังอยู่ใน brand family เดียวกับ public site [page:FUNCTIONAL_SPEC.html].

หลักคือ [page:FUNCTIONAL_SPEC.html]:

- เน้น clarity และ task flow มากกว่าการตลาด
- ใช้ token ชุดเดียวกับ public แต่ compact กว่า [code_file:585]
- ทำ object workspaces ให้ชัด เช่น lead, listing, shortlist, visit, negotiation, deal [page:SEQUENCE_DIAGRAMS.html]
- ออกแบบ states, transitions และ permissions ให้มาก่อนทำ visual polish [page:FUNCTIONAL_SPEC.html]

## 12. Decision fallback

หากเจอสถานการณ์ที่เอกสารยังไม่ได้ตอบตรง ๆ อย่าด้นสดจากความเคยชินของเว็บทั่วไป ให้ตัดสินใจตามลำดับนี้ [code_file:585]:

1. ดู requirement และ functional spec ก่อน [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
2. ดูไฟล์ rewrite ที่เกี่ยวข้องกับชิ้นงานนั้นโดยตรง เช่น listing/detail/lead/SEO [file:457][file:458][file:459][file:462]
3. ถ้าเป็นเรื่อง visual ให้ย้อนกลับไปเช็ค `07`, `08_design_tokens_normalized_green_revision.md`, `09_design_transformation_rules.md` [file:480][file:485][file:486][file:487][file:584][code_file:585]
4. ถ้ายังต้องเลือก ให้เลือกสิ่งที่ support platform architecture, canonical data flow, discoverability และ brokerage workflow ก่อน aesthetic preference [page:FUNCTIONAL_SPEC.html]

## 13. Common failure modes to avoid

สิ่งที่พลาดง่ายที่สุดในโปรเจกต์นี้มีดังนี้:

- มองงานเป็น web redesign แทน platform rewrite [page:FUNCTIONAL_SPEC.html]
- ทำหน้า public ใหม่โดยไม่แก้ listing/detail/lead object logic [file:457][file:458][file:459]
- ทำ SEO แบบ patchwork โดยไม่ normalize route/canonical/taxonomy ก่อน [file:462]
- clone visual ของเว็บเดิมโดยไม่ใช้ token system ใหม่ [code_file:585]
- ทำ admin เป็น CRUD tables ก่อนกำหนด workflows และ object lifecycles [page:SEQUENCE_DIAGRAMS.html][page:FUNCTIONAL_SPEC.html]
- เพิ่ม visual flair จนเสีย trust posture ของแบรนด์ [file:480][file:481]
- ใช้ gold เป็น primary action ต่อทั้งที่ direction ใหม่ถูกเปลี่ยนเป็น green-first แล้ว [file:584][code_file:585]
