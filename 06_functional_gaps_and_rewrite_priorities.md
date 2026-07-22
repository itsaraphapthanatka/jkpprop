# 06 Functional Gaps & Rewrite Priorities — v2 (From Audit Findings to Action Plan)

เอกสารนี้เป็นเวอร์ชันปรับปรุงเต็มของ `06_functional_gaps_and_rewrite_priorities.md` โดยยกระดับจากการลิสต์ปัญหาหรือ pain points ของระบบเดิม ไปเป็น **action-oriented rewrite planning document** สำหรับ Industrial Property Platform v1 ซึ่งเชื่อม audit findings จากเว็บไซต์เดิมเข้ากับ functional specification, system architecture และลำดับความสำคัญในการลงมือ rewrite อย่างเป็นระบบ [file:457][file:458][file:459][file:460][file:462][page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][code_file:540].

เอกสารนี้ไม่ได้มีเป้าหมายเพื่อวิจารณ์ระบบเดิมอย่างลอย ๆ แต่เพื่อแปลง “สิ่งที่พบ” ให้กลายเป็น “สิ่งที่ต้องแก้” และ “สิ่งที่ควรทำก่อน” สำหรับ product, design, engineering และ operations teams [page:FUNCTIONAL_SPEC.html][code_file:540].

## บทบาทของเอกสารนี้

`06_functional_gaps_and_rewrite_priorities.md` ควรทำหน้าที่เป็นสะพานระหว่าง **audit** กับ **execution planning** [code_file:540][page:FUNCTIONAL_SPEC.html].  มันจึงควรถูกใช้เพื่อ:

- รวบรวม functional gaps ที่สำคัญจากระบบเดิม [file:457][file:458][file:459][file:460][file:462]
- map ปัญหาเหล่านั้นเข้ากับ target system v1.1 [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
- จัดลำดับ rewrite priorities ตามผลกระทบเชิงธุรกิจและเชิงระบบ [code_file:540]
- สร้าง shared understanding ว่าอะไรคือ must-fix, should-fix และ later-stage enhancements [page:FUNCTIONAL_SPEC.html]

## กรอบการประเมิน gap

เพื่อไม่ให้เอกสารนี้กลายเป็น wishlist ที่ยาวแต่ใช้การไม่ได้ การประเมิน gap ในฉบับนี้ใช้ 4 มิติพร้อมกัน [code_file:540]:

1. **Business impact** — กระทบ lead generation, conversion, trust หรือ brokerage throughput แค่ไหน [page:REQUIREMENTS_SPEC.html]
2. **Systemic importance** — เป็นปัญหาเฉพาะจุดหรือกระทบทั้ง architecture [page:FUNCTIONAL_SPEC.html]
3. **Implementation dependency** — เป็นฐานที่ของอื่นต้องพึ่งหรือไม่ [code_file:540]
4. **Rewrite leverage** — แก้แล้ว unlock งานส่วนอื่นได้มากแค่ไหน [code_file:540]

## ภาพรวมปัญหาหลักจากระบบเดิม

เมื่อรวม findings จาก `01` ถึง `05` จะเห็นว่าระบบเดิมมีปัญหาหลักอยู่ 6 กลุ่ม [file:457][file:458][file:459][file:460][file:462]:

1. Information architecture และ page-family definition ยังไม่ครบ [file:460]
2. Listing engine ยังเป็นเพียง search/results UI มากกว่าจะเป็น discovery system ที่มี canonical logic [file:457][file:462]
3. Detail page data contract ยังไม่เป็นระบบและไม่พร้อมใช้เป็น source of truth ระดับแพลตฟอร์ม [file:459]
4. Lead flow ยังเป็น contact-form centric และไม่เชื่อมต่อ CRM workflow อย่างชัด [file:458][page:SEQUENCE_DIAGRAMS.html]
5. SEO / taxonomy / GEO layer อ่อนและมี technical misconfiguration ร้ายแรง [file:462]
6. Admin, CMS, workflow และ operations surfaces แทบไม่ปรากฏในระบบที่ถูกสังเกต [file:460][page:FUNCTIONAL_SPEC.html]

นี่แปลว่าการ rewrite ไม่ใช่การ reskin เว็บไซต์ แต่เป็นการย้ายจาก brochure-like real estate site ไปสู่ **brokerage operating platform** [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Gap cluster 1: Public information architecture ยังไม่เป็นระบบแพลตฟอร์ม

จาก page audit เดิม public site มี homepage, listing, detail, about, FAQ และ contact เป็นหลัก [file:460].  แต่ใน target system v1.1 ต้องมี page families ที่รองรับ content, GEO, compare, requirement intake และ multilingual discoverability อย่างเป็นระบบ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### ปัญหาหลัก

- page types เดิมสะท้อนเว็บไซต์ที่โตแบบ incremental มากกว่าถูกออกแบบเป็นระบบ [file:460]
- city/area entry points มีพฤติกรรมไม่สม่ำเสมอ [file:460][file:462]
- content/GEO surfaces ยังไม่ใช่ first-class parts ของระบบ [page:REQUIREMENTS_SPEC.html]
- utility states เช่น 404 และ empty states ยังไม่ถูกออกแบบเชิงระบบ [file:460][file:457]

### ผลกระทบ

ปัญหานี้ทำให้ทั้ง UX, SEO, routing และ content strategy ไปคนละทาง [page:FUNCTIONAL_SPEC.html].  มันยังทำให้การขยายระบบไปยัง admin, AI discoverability และ multilingual architecture ยากขึ้น [page:REQUIREMENTS_SPEC.html][code_file:540].

### Rewrite priority

**Priority: P0–P1** [code_file:540].  เพราะ IA ที่ไม่ชัดทำให้ route design, CMS model, SEO policy และ component planning แตกตามกันทั้งหมด [page:FUNCTIONAL_SPEC.html].

## Gap cluster 2: Listing engine ยังไม่เป็น discovery engine เต็มรูป

ระบบเดิมมี listing page ที่รองรับ filters, sort และ pagination ในระดับ UI [file:457][file:460].  แต่เมื่อดูเชิงระบบ จะเห็นว่ายังขาด canonical search strategy, meaningful filter taxonomy, GEO-aware landing model และ integration กับ requirement/shortlist workflows [file:457][file:462][page:FUNCTIONAL_SPEC.html].

### ปัญหาหลัก

- zone type ยังไม่ใช่ filter/taxonomy dimension เต็มรูป [file:457][file:462]
- search states กับ SEO/indexing policy ยังไม่ถูกแยก [file:462]
- empty search state ยังไม่เชื่อม conversion flow อย่างชัด [file:457][page:REQUIREMENTS_SPEC.html]
- listing cards ยังทำหน้าที่แค่ preview มากกว่าประตูสู่ decision journey ที่มี compare/shortlist logic [file:457][page:FUNCTIONAL_SPEC.html]

### ผลกระทบ

สิ่งนี้ทำให้ inventory มี “เยอะ” แต่ไม่แปลว่า “ถูกค้นเจอและถูกใช้ในการตัดสินใจได้ดี” [page:FUNCTIONAL_SPEC.html].  มันยังลดประสิทธิภาพของ broker-assisted sales เพราะ user intent ไม่ได้ถูกจัดโครงสร้างเข้าสู่ workflow ต่อ [page:SEQUENCE_DIAGRAMS.html].

### Rewrite priority

**Priority: P0** [code_file:540].  Listing engine คือ business core ของแพลตฟอร์ม public ฝั่ง inventory จึงต้องถูกยกระดับเร็วที่สุด [page:REQUIREMENTS_SPEC.html].

## Gap cluster 3: Detail page ยังไม่ถูกนิยามเป็น canonical listing object surface

ระบบเดิมมี detail pages ที่ใช้งานได้ในเชิงหน้าแสดงผล แต่ยังมีปัญหา dual URL, breadcrumb schema ขาด, source-of-truth ambiguity และ inconsistent detail contract ระดับระบบ [file:459][file:462].

### ปัญหาหลัก

- URL identity ของ listing ยังไม่ canonical [file:462]
- field contract ยังเป็น inferred page observation มากกว่าจะเป็น explicit schema [file:459]
- map/location/privacy behavior ยังไม่ถูกยกระดับเป็น policy [page:FUNCTIONAL_SPEC.html]
- detail-to-related/compare/requirement transitions ยังไม่เป็น architecture ที่ชัด [page:SEQUENCE_DIAGRAMS.html]

### ผลกระทบ

detail page คือจุดที่ผู้ใช้เปลี่ยนจาก “สนใจ” ไปสู่ “สอบถามจริง” [page:REQUIREMENTS_SPEC.html].  หากหน้าประเภทนี้ไม่เป็น canonical object surface ทั้ง SEO, CRM capture และ trust จะเสียพร้อมกัน [page:FUNCTIONAL_SPEC.html].

### Rewrite priority

**Priority: P0** [code_file:540].  เพราะ detail page เป็นทั้ง conversion asset และ source object สำหรับ SEO, content links, comparison และ CRM context [page:FUNCTIONAL_SPEC.html].

## Gap cluster 4: Lead flow ยังไม่ mature พอสำหรับ brokerage operations

หนึ่งใน gap ใหญ่ที่สุดคือระบบเดิมยังใช้ lead flow แบบ contact/inquiry forms เป็นหลัก โดยไม่มีภาพชัดของ intake normalization, routing, qualification, tasking และ pipeline continuation [file:458][page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].

### ปัญหาหลัก

- contact/inquiry forms ยังไม่เชื่อม CRM flow แบบมี state machine ชัด [file:458][page:SEQUENCE_DIAGRAMS.html]
- ไม่มี evidence ของ tracking/analytics layer สำหรับ lead attribution [file:458]
- requirement-based intake ยังไม่ปรากฏเป็น structured public flow แม้จะสำคัญมากกับธุรกิจนี้ [page:REQUIREMENTS_SPEC.html]
- contact-channel deep links ยังไม่มี prefill/context enrichment [file:458]

### ผลกระทบ

เมื่อ lead flow อ่อน ทีมขายต้องใช้แรง manual มากขึ้น, ติดตามยากขึ้น และสูญเสีย context ระหว่าง public inquiry กับ internal brokerage execution [page:FLOWCHARTS.html][page:FUNCTIONAL_SPEC.html].

### Rewrite priority

**Priority: P0** [code_file:540].  เพราะหาก lead intake ไม่ถูกออกแบบใหม่ ระบบต่อให้ดูดีขึ้นก็ยังไม่เพิ่ม operational throughput ตามเป้าหมาย [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Gap cluster 5: SEO, taxonomy และ GEO layer อ่อนทั้งเชิงกลยุทธ์และเชิงเทคนิค

จาก findings เดิม มีทั้งปัญหา metadata ซ้ำ, ไม่มี canonical/hreflang, sitemap/robots ชี้ staging host และ route inconsistency ระหว่าง locale/geo shortcuts [file:462].  แต่ปัญหาที่ลึกกว่านั้นคือ discoverability architecture ยังไม่ถูกออกแบบเป็นระบบ [page:FUNCTIONAL_SPEC.html].

### ปัญหาหลัก

- ไม่มี canonical metadata foundation [file:462]
- multilingual indexing strategy ไม่ชัด [file:462][page:REQUIREMENTS_SPEC.html]
- city/area routing ยังไม่ normalize [file:460][file:462]
- area pages, service pages และ content hubs ยังไม่ถูกใช้เป็น discoverability assets เต็มรูป [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
- AI-readable discoverability surfaces ยังไม่ถูกจัดโครง [page:REQUIREMENTS_SPEC.html]

### ผลกระทบ

ปัญหานี้ไม่ได้กระทบแค่ search ranking แต่กระทบการเป็น “knowledgeful industrial property platform” โดยรวม [page:FUNCTIONAL_SPEC.html].  หากไม่แก้ โอกาสจาก SEO, GEO pages และ AI search จะเสียไปมาก [page:REQUIREMENTS_SPEC.html].

### Rewrite priority

**Priority: P0–P1** [code_file:540].  Technical SEO fixes บางอย่างเป็น P0 เพราะมีผลทันที เช่น production canonical/robots/sitemap correctness [file:462].  ส่วน content/GEO expansion เป็น P1 ที่ต้องตามมาอย่างมีโครง [page:FUNCTIONAL_SPEC.html].

## Gap cluster 6: ไม่มี operations platform ที่สอดคล้องกับ brokerage workflow

Requirements และ functional spec ชัดเจนว่าระบบ v1.1 ต้องมี CRM, shortlist, visit scheduling, negotiation, deals, CMS, translation และ admin governance [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  แต่จากสิ่งที่สังเกตได้ในระบบเดิม public site ยังไม่สะท้อนแพลตฟอร์มฝั่งปฏิบัติการเหล่านี้ [file:460].

### ปัญหาหลัก

- ไม่มีหลักฐานของ admin workspaces ที่เป็นระบบ [file:460]
- ไม่มี shared object lifecycle ระหว่าง listing, lead, shortlist, visit, deal [page:UML_CLASS_DIAGRAM.html][page:SEQUENCE_DIAGRAMS.html]
- CMS/content operations ยังไม่ปรากฏเป็น structured capability [page:FUNCTIONAL_SPEC.html]
- permissions/governance/auditability ยังไม่ถูกทำให้ชัด [page:REQUIREMENTS_SPEC.html]

### ผลกระทบ

นี่คือข้อจำกัดที่ทำให้ธุรกิจโตยากในระยะยาว เพราะการทำงานยังอาจกระจายอยู่นอกระบบ, ติดที่คน, และ trace ยาก [page:FUNCTIONAL_SPEC.html].  ระบบใหม่จะบรรลุเป้าหมายได้ก็ต่อเมื่อมี operations backbone ที่รองรับงานจริง [page:REQUIREMENTS_SPEC.html].

### Rewrite priority

**Priority: P0–P1** [code_file:540].  สำหรับ core CRM workflow และ listing management ถือเป็น P0/P1 ขึ้นกับ sequencing ของ implementation [page:FUNCTIONAL_SPEC.html].  ส่วน advanced governance/configuration surfaces อาจทยอยเป็น P1/P2 [page:REQUIREMENTS_SPEC.html].

## Priority framework ที่แนะนำ

เพื่อให้ rewrite ลงมือทำได้จริง แนะนำให้จัด priority เป็น 3 ชั้น [code_file:540][page:FUNCTIONAL_SPEC.html]:

### P0 — Must establish platform foundations

สิ่งที่ควรอยู่ใน P0 ได้แก่ [code_file:540]:

- Information architecture และ route families ใหม่ [page:FUNCTIONAL_SPEC.html]
- Listing engine canonicalization และ core search model [file:457][file:462]
- Listing detail canonical object contract [file:459]
- Lead intake architecture + CRM linkage [file:458][page:SEQUENCE_DIAGRAMS.html]
- Production-grade SEO technical baseline (canonical/hreflang/sitemap/robots) [file:462]
- Minimum admin workflow surfaces สำหรับ leads/listings [page:FUNCTIONAL_SPEC.html]

### P1 — Expand discovery, content, and operations depth

สิ่งที่ควรตามมาใน P1 ได้แก่ [code_file:540]:

- Area pages / GEO layer [page:REQUIREMENTS_SPEC.html]
- Service pages และ guides hub [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
- Compare flow และ richer shortlist interactions [page:REQUIREMENTS_SPEC.html]
- Visit / negotiation / deal operational workspaces [page:SEQUENCE_DIAGRAMS.html]
- Translation, CMS, SEO editor flows [page:FUNCTIONAL_SPEC.html]

### P2 — Optimize scale, quality, and intelligence

สิ่งที่ควรตามมาใน P2 ได้แก่ [code_file:540]:

- advanced analytics and attribution [file:458]
- AI-assisted internal workflows / matching / content assistance [page:REQUIREMENTS_SPEC.html]
- governance hardening เช่น audit, advanced permissions, workflow metrics [page:FUNCTIONAL_SPEC.html]
- performance and experimentation layers beyond baseline [page:FUNCTIONAL_SPEC.html]

## Dependency map

priority อย่างเดียวไม่พอ ต้องเห็น dependency ด้วย [code_file:540].  dependency หลักของ rewrite นี้คือ:

- IA → routes → SEO → content/GEO surfaces [page:FUNCTIONAL_SPEC.html]
- listing schema/detail contract → search → detail → compare → lead payloads [file:457][file:459][page:SEQUENCE_DIAGRAMS.html]
- lead architecture → CRM → tasks/visits/deals [file:458][page:FLOWCHARTS.html]
- token/design system normalization → component library → page implementation [code_file:540]
- taxonomy/GEO model → area pages → internal linking → discoverability [file:462][page:REQUIREMENTS_SPEC.html]

ความหมายคือ ถ้าเริ่มจากการออกหน้าสวยก่อนโดยยังไม่แก้ object contracts และ workflow dependencies ระบบจะกลับไปติดเพดานเดิม [page:FUNCTIONAL_SPEC.html][code_file:540].

## Suggested rewrite sequencing

จาก dependency และ priority ข้างต้น ลำดับการ rewrite ที่เหมาะสมคือ [code_file:540][page:FUNCTIONAL_SPEC.html]:

1. **Define platform structure** — IA, page families, content model, object contracts [file:460][page:UML_CLASS_DIAGRAM.html]
2. **Stabilize discovery core** — listing engine, detail schema, SEO foundations [file:457][file:459][file:462]
3. **Rebuild conversion core** — requirement/contact/inquiry flows + CRM linkage [file:458][page:SEQUENCE_DIAGRAMS.html]
4. **Add public expansion surfaces** — guides, services, GEO pages, compare [page:REQUIREMENTS_SPEC.html]
5. **Build operations backbone** — CRM workflows, shortlist, visits, deals, CMS/admin [page:FUNCTIONAL_SPEC.html]
6. **Optimize and harden** — analytics, AI-readiness, governance, quality layers [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]

## Recommended rewrite workstreams

เพื่อให้ทีมหลายสายทำงานขนานกันได้ ควรแบ่ง workstreams อย่างน้อยดังนี้ [code_file:540]:

- **Workstream A: Public IA + SEO + content discoverability** [file:460][file:462]
- **Workstream B: Listing engine + detail contracts** [file:457][file:459]
- **Workstream C: Lead intake + CRM foundation** [file:458][page:SEQUENCE_DIAGRAMS.html]
- **Workstream D: Design system + component library** [code_file:540]
- **Workstream E: Admin/CMS operations platform** [page:FUNCTIONAL_SPEC.html]

แต่ละ workstream ควรมี shared milestones ที่ sync กันผ่าน object model และ route/page contracts [page:FUNCTIONAL_SPEC.html].

## Rewrite risks ถ้าจัดลำดับผิด

หากเริ่ม rewrite โดยไม่ใช้ priority framework นี้ ความเสี่ยงหลักคือ [code_file:540]:

- ได้หน้าใหม่ที่ดูดีขึ้น แต่ยังใช้ data model เดิมที่เปราะ [file:459]
- ทำ SEO patch เฉพาะหน้า โดยไม่มี discoverability architecture ใหม่ [file:462]
- ทำ contact form ใหม่ แต่ไม่เชื่อม CRM state machine [file:458][page:SEQUENCE_DIAGRAMS.html]
- สร้าง admin UI ก่อนนิยาม object lifecycles ชัด ทำให้ต้อง refactor ซ้ำ [page:UML_CLASS_DIAGRAM.html][page:FUNCTIONAL_SPEC.html]
- เร่ง content expansion ก่อน normalize routes/taxonomy ทำให้เกิด duplication รอบใหม่ [file:462]

## What changed from the previous version

เมื่อเทียบกับ `06_functional_gaps_and_rewrite_priorities.md` เดิม ความเปลี่ยนแปลงหลักคือ [code_file:540]:

- เดิมอาจเป็นรายการ gap แบบ audit-oriented แต่ฉบับนี้เปลี่ยนเป็น action-oriented planning document [code_file:540]
- เดิมยังไม่เชื่อม gaps เข้ากับ system dependencies และ rewrite sequencing แต่ฉบับนี้ระบุทั้ง priority และ dependency map [page:FUNCTIONAL_SPEC.html]
- เดิมอาจพูดถึงปัญหาเป็นข้อ ๆ แต่ฉบับนี้จัดเป็น gap clusters ที่มองได้ทั้งเชิง business และ system [file:457][file:458][file:459][file:460][file:462]
- เดิมยังไม่แตก workstreams ชัด แต่ฉบับนี้ช่วยให้ใช้วางแผนทีมและ roadmap ได้จริง [code_file:540]

## สรุป

`06_functional_gaps_and_rewrite_priorities.md` เวอร์ชันนี้เปลี่ยนจากรายงานปัญหาไปเป็น **rewrite action plan framework** ที่ใช้จัดลำดับการเปลี่ยนระบบเดิมสู่แพลตฟอร์ม v1 อย่างมีโครงสร้าง [file:457][file:458][file:459][file:460][file:462][page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][code_file:540].  เอกสารนี้จึงเหมาะใช้เป็นตัวกลางระหว่าง audit findings, product roadmap, technical sequencing และ cross-functional planning เพื่อให้การ rewrite ไม่สะเปะสะปะและเริ่มจากจุดที่ unlock leverage สูงที่สุดก่อน [page:SEQUENCE_DIAGRAMS.html][code_file:540].
