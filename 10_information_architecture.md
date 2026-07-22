# 10 Information Architecture — v2 (System-wide)

เอกสารนี้เป็นเวอร์ชันปรับปรุงเต็มของ `10_information_architecture.md` โดยยกระดับจาก public-site IA ไปเป็น **system-wide information architecture** สำหรับ Industrial Property Platform v1 ซึ่งครอบคลุมทั้ง Public Website, Admin / Operations App และ Content & GEO Layer ตาม Requirement Specification, Functional Specification, Flow Charts และ Sequence Diagrams [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html][code_file:540].

## เป้าหมายของ IA

IA ฉบับใหม่นี้มีเป้าหมาย 4 ข้อคือ: (1) ทำให้ขอบเขตระบบชัดเจนว่าไม่ได้มีแค่หน้า public, (2) map route/module ให้ตรงกับ actors และ workflows จริง, (3) เป็นฐานให้ dev, designer และ agent เข้าใจ “surface” ของระบบเหมือนกัน, และ (4) ลดความคลุมเครือระหว่าง public content, admin operations และ CMS/GEO responsibilities [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][code_file:540].

จากสเปก v1.1 ระบบนี้ไม่ใช่ self-serve marketplace แต่เป็น **brokerage workflow platform** ที่มีทีมขายและ operations เป็นแกนกลาง ดังนั้น information architecture ต้องสะท้อนทั้ง customer-facing discovery และ internal execution flow ตั้งแต่ lead ไปจนถึง deal closure [page:REQUIREMENTS_SPEC.html][page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].

## สถาปัตยกรรมระดับระบบ

ตาม Requirement Specification ระบบถูกแบ่งออกเป็น 3 ชั้นหลัก ได้แก่ Public Website, Admin / Operations และ Content & GEO Layer [page:REQUIREMENTS_SPEC.html].  IA v2 จะยึด 3 ชั้นนี้เป็นแกนหลักในการจัดหมวด route, page family และ role access เพราะเป็นโครงที่ตรงกับ business reality มากที่สุด [page:REQUIREMENTS_SPEC.html][code_file:540].

### 1. Public Website

Public Website คือพื้นที่สำหรับผู้ใช้ภายนอก ใช้เพื่อค้นหาทรัพย์, สำรวจพื้นที่, อ่านคอนเทนต์, ทำความเข้าใจบริการ และส่ง inquiry/requirement โดยไม่ต้องมี login [page:REQUIREMENTS_SPEC.html].  ในเชิง IA ชั้นนี้ต้องรองรับ 3 ภาษา (`th`, `en`, `zh`) ผ่าน URL prefix และต้องออกแบบให้ SEO/GEO-friendly ตั้งแต่ระดับ route structure [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### 2. Admin / Operations App

ชั้นนี้เป็นพื้นที่ภายในสำหรับทีมขาย, listing manager, content editor, operations coordinator, translator และ super admin เพื่อทำงานกับ leads, requirements, shortlists, visits, negotiations, deals, listings, content และ permissions [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  IA ของส่วนนี้จึงต้องเป็น module-driven architecture มากกว่า page-driven website architecture และต้องออกแบบให้รองรับ stateful workflows แบบหลายขั้น [page:FUNCTIONAL_SPEC.html][page:FLOWCHARTS.html].

### 3. Content & GEO Layer

ชั้นนี้ครอบคลุม CMS หลายภาษา, SEO metadata, schema management, area/service pages และ GEO-ready structures ที่ช่วยให้ Google และ AI search เข้าใจธุรกิจและพื้นที่ให้บริการของบริษัท [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:SEQUENCE_DIAGRAMS.html].  แม้หลาย surface จะอยู่ใน admin route แต่ในเชิง IA ควรแยกบทบาทชั้นนี้ออกมาต่างหาก เพราะหน้าที่และ logic ต่างจาก CRM/ops ชัดเจน [code_file:540].

## IA principles

ก่อนลง route map ต้องล็อกหลักการของ IA ชุดนี้ให้ชัด [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- Public IA ต้อง optimize เพื่อ discoverability, trust, multilingual navigation และ low-friction lead intake [page:REQUIREMENTS_SPEC.html].
- Admin IA ต้อง optimize เพื่อ workflow clarity, role safety, auditability และ speed of execution [page:FUNCTIONAL_SPEC.html].
- Content/GEO IA ต้อง optimize เพื่อ localization accuracy, editorial governance และ structured discoverability [page:FUNCTIONAL_SPEC.html][page:SEQUENCE_DIAGRAMS.html].
- Route structure ต้องสะท้อน business object จริง เช่น lead, requirement, shortlist, visit, listing, page, article ไม่ใช่ตั้ง route ตาม UI convenience อย่างเดียว [page:UML_CLASS_DIAGRAM.html][page:FUNCTIONAL_SPEC.html].
- ทุก public route ต้องคิดพร้อม locale, canonical, hreflang และ structured data ตั้งแต่ต้น [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Public Website IA

ชั้น public คือหน้าที่ผู้ใช้ภายนอกเห็นและใช้งานจริง โดยแบ่งออกได้เป็น 5 route families: brand & trust, discovery, listing detail, lead intake และ content/GEO [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### A. Brand & trust pages

กลุ่มนี้ใช้เพื่อแนะนำแบรนด์, ความน่าเชื่อถือ, วิธีทำงาน และข้อมูลติดต่อ โดยไม่ผูกกับ listing discovery โดยตรง [file:460][page:REQUIREMENTS_SPEC.html].

#### Core routes

- `/th`, `/en`, `/zh` — Homepage [page:REQUIREMENTS_SPEC.html]
- `/[lang]/about-us` — About / company trust page [file:460]
- `/[lang]/contact` — Contact page [page:REQUIREMENTS_SPEC.html][file:460]
- `/[lang]/faq` — FAQ hub [page:REQUIREMENTS_SPEC.html][file:460]

#### บทบาทใน IA

Homepage เป็นจุดเข้าแรกของระบบ public และทำหน้าที่เชื่อมไปยัง listing search, requirement flow และ trust sections ในหน้าเดียว [page:REQUIREMENTS_SPEC.html][file:460].  About, Contact และ FAQ เป็น trust support surfaces ที่ลด friction ในการตัดสินใจของลูกค้า และช่วยตอบคำถามที่ไม่เกี่ยวกับ listing ตรง ๆ [page:REQUIREMENTS_SPEC.html].

### B. Discovery & search pages

นี่คือแกนหลักของ public IA เพราะธุรกิจนี้ขับเคลื่อนด้วยการค้นหาโรงงาน/โกดังให้เช่าหรือขาย [page:REQUIREMENTS_SPEC.html][page:FLOWCHARTS.html].  Discovery IA ต้องรองรับ filter-heavy browsing, shareable URLs และ area-intent traffic [page:REQUIREMENTS_SPEC.html][file:457].

#### Core routes

- `/[lang]/listing` — Search results page with query params [page:REQUIREMENTS_SPEC.html]
- `/[lang]/listing?type=...&status=...&province=...&district=...` — filtered discovery [page:REQUIREMENTS_SPEC.html][file:457]
- `/[lang]/listing-compare` — Compare page (session-based) [page:REQUIREMENTS_SPEC.html]
- `/[lang]/city/[slug]` หรือ equivalent shortcut route — province-level entry page/redirect [file:460]
- `/[lang]/area/[slug]` หรือ equivalent shortcut route — district-level entry page/redirect [file:460]

#### บทบาทใน IA

Listing search page เป็นทั้ง search surface และ taxonomy landing surface ในเวลาเดียวกัน [file:457][page:REQUIREMENTS_SPEC.html].  Route family นี้ต้องรองรับ intent หลายแบบ เช่น “warehouse for rent in Samut Prakan”, “factory for sale near EEC” หรือ “industrial estate listings” ผ่าน query state เดียวกัน [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

Compare route เป็น sub-surface ของ discovery layer และควรถูกมองเป็น extension ของ listing search ไม่ใช่ page ประเภทใหม่แยกอิสระ [page:REQUIREMENTS_SPEC.html].  City/area shortcuts อาจถูก implement เป็น SEO landing routes หรือ redirects แต่ใน build ใหม่ควร normalize locale และ canonical behavior ให้สอดคล้องกันทั้งหมด [file:460][file:462][page:FUNCTIONAL_SPEC.html].

### C. Listing detail pages

Listing detail คือหน้าที่เปลี่ยน intent จาก “searching” ไปสู่ “contacting” จึงเป็น conversion-critical route family [page:REQUIREMENTS_SPEC.html][file:459].  ใน IA ต้องวางให้หน้าประเภทนี้เข้าถึงได้จาก search, area pages, related listings, shortlist token views และ external SEO traffic [page:FUNCTIONAL_SPEC.html][page:SEQUENCE_DIAGRAMS.html].

#### Core routes

- `/[lang]/listing-single/[slug]` — canonical detail route [page:FUNCTIONAL_SPEC.html][file:460]
- Legacy short-ID route (ถ้ายังรองรับ) ควร redirect ไป canonical detail route [file:462][page:FUNCTIONAL_SPEC.html]

#### บทบาทใน IA

Detail page เป็น object-centric page ของ `listing` ไม่ใช่ของ `property` แม้จะใช้ข้อมูล property จำนวนมากร่วมกัน [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html].  IA จึงต้องแยกให้ชัดระหว่าง listing pages ที่ public เห็น กับ property records ที่ทีมใน admin ใช้จัดการ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### D. Lead intake pages

ระบบนี้ไม่มี customer login ดังนั้นทุก conversion ต้องไหลผ่าน inquiry หรือ requirement intake flows [page:REQUIREMENTS_SPEC.html].  ในเชิง IA กลุ่มนี้ควรถูกมองเป็น intake surfaces ไม่ใช่แค่ contact forms ธรรมดา [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].

#### Core routes

- `/[lang]/contact` — general inquiry/contact [page:REQUIREMENTS_SPEC.html]
- `/[lang]/requirement` — detailed requirement wizard [page:REQUIREMENTS_SPEC.html]
- Embedded listing inquiry module on detail pages [page:REQUIREMENTS_SPEC.html][file:458]

#### บทบาทใน IA

Contact page ใช้สำหรับ inquiry ทั่วไป ส่วน requirement page ใช้สำหรับ intake ที่มีเงื่อนไขทางธุรกิจจริง เช่น company profile, budget, timeline, area priorities และ factory license needs [page:REQUIREMENTS_SPEC.html].  ทั้งสองต้องถูก map เข้าสู่ CRM layer เดียวกัน แม้รูปแบบ UI ต่างกัน [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html].

### E. Content & GEO public pages

สเปก v1.1 เพิ่ม content layer อย่างมีนัยสำคัญ ทำให้ public IA ไม่ใช่แค่ brand + search + detail อีกต่อไป [page:REQUIREMENTS_SPEC.html].  ต้องมี route family สำหรับ useful tips, service pages และ area pages เพื่อ support SEO/GEO discovery และตอบคำถามของ business users ในหลายมิติ [page:FUNCTIONAL_SPEC.html].

#### Core routes

- `/[lang]/guides` — guide/article hub [page:REQUIREMENTS_SPEC.html]
- `/[lang]/guides/[slug]` — article detail [page:REQUIREMENTS_SPEC.html]
- `/[lang]/services/[slug]` — service pages [page:REQUIREMENTS_SPEC.html]
- `/[lang]/areas/[slug]` — area pages / GEO landers [page:REQUIREMENTS_SPEC.html]

#### บทบาทใน IA

Guide hub และ article pages ใช้ support middle-of-funnel intent เช่น permit, EEC, tax, renting-vs-buying และ operational readiness [page:REQUIREMENTS_SPEC.html].  Service pages เน้น buyer intent ที่ถามว่าบริษัทช่วยอะไรได้บ้าง ขณะที่ area pages เน้น geo intent ว่าเหมาะกับพื้นที่ใดและมี inventory ประเภทไหน [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

## Public navigation model

เพื่อให้ IA ใช้งานได้จริง ต้อง map navigation ของ public layer ให้ชัด [page:REQUIREMENTS_SPEC.html][file:460].

### Primary navigation

primary nav ควรมีอย่างน้อย:
- Home
- Properties / Search
- Services
- Areas
- Guides / Useful Tips
- FAQ
- Contact
- Language switcher [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]

### Secondary navigation

secondary nav ควรรวม:
- Featured areas
- Featured services
- Popular guide categories
- Compare
- Requirement CTA [page:REQUIREMENTS_SPEC.html]

### Contextual navigation

ใน listing/detail/content pages ต้องมี internal links ที่เชื่อม context เช่น:
- listing → related listings / area page / contact / requirement [page:REQUIREMENTS_SPEC.html]
- article → service pages / area pages / requirement CTA [page:FUNCTIONAL_SPEC.html]
- area page → listing search prefiltered / relevant guides / contact [page:REQUIREMENTS_SPEC.html]

## Admin / Operations IA

ชั้นนี้เป็น internal application architecture และต้องจัดโดยยึด “modules around business objects” มากกว่าการจัดตาม visual screens [page:FUNCTIONAL_SPEC.html][page:UML_CLASS_DIAGRAM.html].  ระบบ admin ควรใช้ route family แยกตาม domain: CRM, Brokerage Ops, Inventory, CMS/SEO และ Governance [page:FUNCTIONAL_SPEC.html].

### A. Access & shell

#### Core routes

- `/admin/login` — login [page:FUNCTIONAL_SPEC.html]
- `/admin` — dashboard [page:FUNCTIONAL_SPEC.html]
- `/admin/profile` — optional user profile/preferences surface [page:FUNCTIONAL_SPEC.html]

#### บทบาทใน IA

Route กลุ่มนี้ทำหน้าที่เป็น shell และ access control entry point ของ admin app [page:FUNCTIONAL_SPEC.html].  หลัง login แล้ว user ควรถูกพาไปยัง module ตาม role หรือ dashboard กลางที่สรุปงานค้างและ alerts [page:FUNCTIONAL_SPEC.html].

### B. CRM module

CRM คือแกนกลางของ admin IA เพราะทุก lead และ requirement ต้องถูกส่งเข้ามาในระบบนี้ [page:REQUIREMENTS_SPEC.html][page:FLOWCHARTS.html].

#### Core routes

- `/admin/leads` — lead index/list [page:REQUIREMENTS_SPEC.html]
- `/admin/leads/[id]` — lead detail [page:REQUIREMENTS_SPEC.html]
- `/admin/requirements` — optional requirement index [page:FUNCTIONAL_SPEC.html]
- `/admin/requirements/[id]` — requirement detail [page:FUNCTIONAL_SPEC.html]

#### บทบาทใน IA

Lead list route ต้องเป็น operational inbox ของทีมขาย โดย filter ด้วย status, assigned agent, source, date range และ keyword [page:REQUIREMENTS_SPEC.html].  Lead detail route เป็น object workspace ที่รวม contacts, company, requirement summary, notes, tasks, activities และ linked business objects ไว้ในหน้าเดียว [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### C. Shortlist & visit operations

กลุ่มนี้สะท้อน Flow B และ Flow C ของธุรกิจ คือการแปลง requirement ไปสู่ shortlist และ visit execution [page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html].

#### Core routes

- `/admin/shortlists` — shortlist index [page:FUNCTIONAL_SPEC.html]
- `/admin/shortlists/[id]` — shortlist builder/detail [page:REQUIREMENTS_SPEC.html]
- `/admin/visits` — visits index/calendar [page:FUNCTIONAL_SPEC.html]
- `/admin/visits/[id]` — visit detail/plan [page:SEQUENCE_DIAGRAMS.html]

#### บทบาทใน IA

Shortlist route family ควรถูกมองเป็น collaboration workspace ระหว่าง agent กับ requirement ไม่ใช่เป็นแค่ child tab ใต้ lead เสมอไป [page:REQUIREMENTS_SPEC.html].  Visit routes ต้อง support planning, schedule coordination, criteria gate confirmations และ outcome logging [page:SEQUENCE_DIAGRAMS.html][page:FUNCTIONAL_SPEC.html].

### D. Negotiation & deal operations

Flow D ของธุรกิจต้องมี route family แยก เพราะ negotiation และ deal มีข้อมูลและ state transitions ที่ซับซ้อนเกินจะซ่อนไว้ใน lead detail อย่างเดียว [page:FLOWCHARTS.html][page:FUNCTIONAL_SPEC.html].

#### Core routes

- `/admin/negotiations` — negotiation cases index [page:FUNCTIONAL_SPEC.html]
- `/admin/negotiations/[id]` — negotiation detail [page:FUNCTIONAL_SPEC.html]
- `/admin/deals` — deals index [page:REQUIREMENTS_SPEC.html]
- `/admin/deals/[id]` — deal detail [page:REQUIREMENTS_SPEC.html]

#### บทบาทใน IA

Negotiation routes ใช้ track offers, counter-offers, notes และ status changes [page:FUNCTIONAL_SPEC.html].  Deal routes ใช้เป็น record of truth สำหรับผลสรุป, terms, commission และ outcome reporting [page:REQUIREMENTS_SPEC.html].

### E. Inventory / listing management

Inventory module เป็น route family แยกระหว่าง `property` และ `listing` ตาม domain model ในสเปก [page:REQUIREMENTS_SPEC.html][page:UML_CLASS_DIAGRAM.html].  จุดนี้สำคัญมากเพราะ IA เดิมมีแนวโน้มมองสองอย่างนี้เป็นสิ่งเดียวกัน [code_file:540].

#### Core routes

- `/admin/properties` — property index [page:REQUIREMENTS_SPEC.html]
- `/admin/properties/[id]` — property detail/edit [page:FUNCTIONAL_SPEC.html]
- `/admin/listings` — listing index [page:REQUIREMENTS_SPEC.html]
- `/admin/listings/[id]` — listing detail/edit/publish [page:FUNCTIONAL_SPEC.html]
- `/admin/media` — media library/uploader [page:FUNCTIONAL_SPEC.html]

#### บทบาทใน IA

Property routes จัดการข้อมูล physical asset, base location, technical specs และ owner-facing data [page:UML_CLASS_DIAGRAM.html].  Listing routes จัดการ public-facing offer layer เช่น transaction type, pricing, publish state, map visibility, translations และ SEO [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

### F. CMS / SEO / GEO module

ชั้นนี้ควรถูกแยกออกจาก CRM อย่างชัดเจนเพื่อให้ content editor และ translator มีพื้นที่ทำงานเฉพาะทาง [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

#### Core routes

- `/admin/cms/pages` and `/admin/cms/pages/[id]` [page:FUNCTIONAL_SPEC.html]
- `/admin/cms/articles` and `/admin/cms/articles/[id]` [page:FUNCTIONAL_SPEC.html]
- `/admin/cms/faq` and `/admin/cms/faq/[id]` [page:REQUIREMENTS_SPEC.html]
- `/admin/seo` — metadata/schema preview hub [page:FUNCTIONAL_SPEC.html]
- `/admin/areas` and `/admin/areas/[id]` — optional dedicated area page manager [page:REQUIREMENTS_SPEC.html]
- `/admin/services` and `/admin/services/[id]` — optional dedicated service page manager [page:REQUIREMENTS_SPEC.html]
- `/admin/llms` — llms.txt management surface [page:REQUIREMENTS_SPEC.html]

#### บทบาทใน IA

Routes กลุ่มนี้เป็น editorial/workflow surfaces ไม่ใช่ transactional sales routes [page:FUNCTIONAL_SPEC.html].  Translation tabs, SEO previews, schema validation และ publishing completeness indicators ควรถูกจัดอยู่ใน module นี้เป็นหลัก [page:FUNCTIONAL_SPEC.html].

### G. Governance module

ระบบมี multiple roles และ audit needs จึงต้องมี route family สำหรับ governance [page:REQUIREMENTS_SPEC.html].

#### Core routes

- `/admin/users` and `/admin/users/[id]` [page:REQUIREMENTS_SPEC.html]
- `/admin/roles` — optional roles/permissions matrix surface [page:FUNCTIONAL_SPEC.html]
- `/admin/settings` — global config/settings [page:REQUIREMENTS_SPEC.html]
- `/admin/audit` — audit log viewer [page:FUNCTIONAL_SPEC.html]

#### บทบาทใน IA

Governance routes ใช้ดูแล users, roles, system rules, audit visibility และ settings ที่มีผลทั้งระบบ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  module นี้ควรเห็นได้เฉพาะ super admin หรือ roles ที่ได้รับสิทธิ์ชัดเจน [page:REQUIREMENTS_SPEC.html].

## Content & GEO IA

แม้ CMS/GEO surfaces จำนวนมากจะอยู่ใต้ `/admin`, แต่ในมุม IA ควรนิยาม content architecture แยกจาก operational architecture [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].  เหตุผลคือ object model, workflow, ownership และ acceptance criteria ต่างจาก lead/listing operations [code_file:540].

### Content families

- Generic pages: about, contact support copy, static brand pages [page:REQUIREMENTS_SPEC.html]
- FAQ content [page:REQUIREMENTS_SPEC.html]
- Guides/articles [page:REQUIREMENTS_SPEC.html]
- Service pages [page:REQUIREMENTS_SPEC.html]
- Area pages [page:REQUIREMENTS_SPEC.html]
- Listing SEO surfaces [page:FUNCTIONAL_SPEC.html]
- llms.txt mapping content [page:REQUIREMENTS_SPEC.html]

### Content lifecycle

content IA ควรรองรับ lifecycle ต่อไปนี้:
1. draft
2. translation in progress
3. SEO review
4. ready to publish
5. published
6. archived [page:FUNCTIONAL_SPEC.html]

### Translation architecture

ทุก public content family ต้องถูกออกแบบให้มี translation surfaces สำหรับ `th`, `en`, `zh` [page:REQUIREMENTS_SPEC.html].  language switching บน public routes ต้องพยายามคง page context เดิมไว้ก่อน และ fallback ไป homepage ของภาษานั้นถ้า translation ยังไม่มี [page:REQUIREMENTS_SPEC.html].

## Actor-to-surface mapping

การ map actor กับ surface เป็นแกนสำคัญของ IA v2 เพราะช่วยกัน scope leakage และช่วยออกแบบ navigation ตาม role [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

| Actor | Public access | Admin / Ops access | CMS / GEO access |
|---|---|---|---|
| Public visitor | Home, listing search, detail, guides, services, areas, FAQ, contact, requirement [page:REQUIREMENTS_SPEC.html] | ไม่มี [page:REQUIREMENTS_SPEC.html] | ไม่มี [page:REQUIREMENTS_SPEC.html] |
| Sales agent | อาจดู public ได้ทุก route [page:REQUIREMENTS_SPEC.html] | leads, lead detail, shortlists, visits, negotiations, deals [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html] | ไม่มีเป็นหลัก [page:FUNCTIONAL_SPEC.html] |
| Listing manager | อาจดู public ได้ทุก route [page:REQUIREMENTS_SPEC.html] | properties, listings, media [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html] | จำกัดหรือไม่มี [page:FUNCTIONAL_SPEC.html] |
| Content editor | อาจดู public ได้ทุก route [page:REQUIREMENTS_SPEC.html] | CMS pages/articles/FAQ, SEO panels [page:FUNCTIONAL_SPEC.html] | services, areas, GEO structures, llms [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html] |
| Operations coordinator | อาจดู public ได้ทุก route [page:REQUIREMENTS_SPEC.html] | visits, schedules, shortlist coordination [page:FUNCTIONAL_SPEC.html] | ไม่มีเป็นหลัก [page:FUNCTIONAL_SPEC.html] |
| Translator | อาจดู public ได้ทุก route [page:REQUIREMENTS_SPEC.html] | translation tabs only [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html] | translation fields ใน content entities [page:FUNCTIONAL_SPEC.html] |
| Super admin | อาจดู public ได้ทุก route [page:REQUIREMENTS_SPEC.html] | ทุก admin modules [page:REQUIREMENTS_SPEC.html] | ทุก CMS/GEO modules [page:REQUIREMENTS_SPEC.html] |

## Navigation patterns by layer

### Public layer

public layer ใช้ global navigation แบบเว็บไซต์ + contextual internal links [file:460][page:REQUIREMENTS_SPEC.html].  CTA สำคัญต้องชี้กลับไปที่ search, contact และ requirement intake เพื่อรองรับผู้ใช้ทั้งที่ “พร้อมคุยเลย” และ “ยังสำรวจอยู่” [page:REQUIREMENTS_SPEC.html].

### Admin layer

admin layer ใช้ persistent sidebar navigation + contextual tabs/detail subviews [page:FUNCTIONAL_SPEC.html].  การจัดหมวดใน sidebar ควรสะท้อน domain modules เช่น CRM, Shortlists, Visits, Deals, Inventory, CMS, SEO, Settings มากกว่าจะจัดตาม “หน้าที่ออกแบบเสร็จก่อน” [code_file:540].

### CMS/GEO layer

editorial/navigation ควรจัดตาม content type และ status เช่น Pages, Articles, FAQ, Services, Areas, SEO, llms [page:FUNCTIONAL_SPEC.html][page:REQUIREMENTS_SPEC.html].  ผู้ใช้สาย content ไม่ควรถูกบังคับให้เข้า workflow sales modules เพื่ออัปเดตเนื้อหา [page:FUNCTIONAL_SPEC.html].

## Route naming recommendations

เพื่อให้ build ใหม่สม่ำเสมอ ควรใช้ naming rules ดังนี้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

- Public routes ต้องมี `[lang]` prefix เสมอ [page:REQUIREMENTS_SPEC.html]
- ใช้ plural resource names สำหรับ object families เช่น `/leads`, `/shortlists`, `/deals`, `/articles` [page:FUNCTIONAL_SPEC.html]
- แยก property กับ listing เป็นคนละ route family ชัดเจน [page:UML_CLASS_DIAGRAM.html][page:REQUIREMENTS_SPEC.html]
- แยก content routes (`/guides`, `/services`, `/areas`) ออกจาก listing routes เพื่อให้ intent และ SEO ชัด [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
- หลีกเลี่ยง locale inconsistency แบบเดิมที่ area shortcut บางตัวพาไป `en` แม้ต้นทางเป็นบริบทไทย [file:460][file:462]

## IA gaps that are now resolved

เทียบกับ IA เดิม ปัญหาหลักที่ถูกแก้ในฉบับนี้มีดังนี้ [code_file:540]:

- เดิมมองระบบเป็น public website เป็นหลัก แต่ IA ใหม่ยืนยัน 3-layer architecture [page:REQUIREMENTS_SPEC.html]
- เดิมไม่มี admin route family ชัดเจน แต่ IA ใหม่จัดโมดูลตาม domain/workflow [page:FUNCTIONAL_SPEC.html]
- เดิมไม่มี CMS/GEO route family ชัดเจน แต่ IA ใหม่แยกให้เห็น ownership และ lifecycle [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]
- เดิมยังไม่ map actors กับ surfaces ครบ แต่ฉบับนี้ผูก actors กับ route families ชัดเจน [page:REQUIREMENTS_SPEC.html]
- เดิมใช้ 4 canonical public pages เป็นกรอบหลัก แต่ฉบับนี้ระบุว่า 4 หน้านั้นเป็นเพียงส่วนหนึ่งของ public layer เท่านั้น [code_file:540]

## IA summary

สรุปแล้ว `10_information_architecture.md` เวอร์ชันนี้ย้ายจาก “page map ของเว็บไซต์” ไปเป็น “surface map ของแพลตฟอร์ม” โดยครอบคลุม Public Website, Admin / Operations และ Content & GEO Layer พร้อม route families, actor mapping และ navigation logic ที่ตรงกับ spec v1.1 [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html][page:FLOWCHARTS.html][page:SEQUENCE_DIAGRAMS.html][code_file:540].

เอกสารนี้ควรถูกใช้เป็น baseline สำหรับการออกแบบ sitemap, route implementation, sidebar navigation, CMS ownership และ role-based access planning ในทุก phase ถัดไปของโปรเจกต์ [page:FUNCTIONAL_SPEC.html][code_file:540].
