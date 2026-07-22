# DESIGN.md — Design Operating Principles for the Industrial Property Platform

เอกสารนี้เป็น `DESIGN.md` ฉบับปรับปรุงใหม่สำหรับใช้เป็น **design operating guide** ของโปรเจกต์ Industrial Property Platform v1 โดยสรุปหลักคิด, visual direction, design system intent, UX priorities และกติกาการตัดสินใจด้านงานออกแบบให้อยู่ในไฟล์เดียว [file:479][file:480][file:481][file:485][file:486][file:487][file:584][code_file:585].

ไฟล์นี้เน้นเฉพาะกรอบคิดด้าน design เพื่อให้ทุกงานที่เกี่ยวกับ UI, UX, component system, page composition และ brand continuity ตัดสินใจไปในทิศทางเดียวกัน ภายใต้ direction ใหม่ที่เปลี่ยนจาก `gold + neutral` ไปเป็น `green + neutral` [file:584][code_file:585].

## 1. Design mission

ภารกิจของการออกแบบในโปรเจกต์นี้ไม่ใช่การทำเว็บใหม่น่าใช้ขึ้นเฉย ๆ แต่คือการสร้าง **industrial property platform ที่เชื่อถือได้, ใช้งานง่าย, ค้นหาและตัดสินใจได้ดี, และรองรับการทำงานจริงของ brokerage business** [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html].

ดังนั้น design ที่ดีในโปรเจกต์นี้ต้องทำพร้อมกัน 4 อย่าง [page:FUNCTIONAL_SPEC.html]:

- สร้างความเชื่อถือในระดับแบรนด์ [file:480][file:481]
- ทำให้ข้อมูล inventory และ geography เข้าใจง่าย [file:457][file:459]
- ลด friction ในการส่ง inquiry หรือ requirement [file:458][page:SEQUENCE_DIAGRAMS.html]
- รองรับ workflow ต่อเนื่องไปยัง admin/CRM/product surfaces [page:FUNCTIONAL_SPEC.html]

## 2. What the design is not

เพื่อกันการหลุดทิศ งานออกแบบของโปรเจกต์นี้ **ไม่ใช่** สิ่งต่อไปนี้:

- ไม่ใช่ luxury real estate marketing site [file:480][file:481]
- ไม่ใช่ startup SaaS gradient interface
- ไม่ใช่ template-based property portal ที่เน้นเพียง card grid จำนวนมาก [file:457]
- ไม่ใช่ visual reskin ของเว็บเดิมโดยไม่แตะโครงสร้างข้อมูลและ flow

ระบบนี้ต้องดู professional, grounded, modern และ trustworthy มากกว่า flashy, trendy หรือ theatrical [file:480][file:481][file:584].

## 3. Source visual memory to preserve

แม้ระบบจะถูก rewrite ใหม่ แต่มี visual memory บางอย่างจากระบบเดิมที่ควรถูกเก็บในระดับ character [file:479][file:480][file:481][file:485][file:486].

### 3.1 Green-led accent system

ใน revision นี้ brand accent หลักไม่ใช้ gold ของ TIP อีกต่อไป แต่เปลี่ยนมาใช้ชุดเขียวจาก `Fun-Green-11-kigen-design.svg` เป็นแกน [file:584][code_file:585]. เฉดหลักที่ควรจำคือ `#0D6C3B`, `#09582F`, `#043F20` และ `#C3FED5` [file:584][code_file:585].

### 3.2 Clean and practical surfaces

พื้นผิวของระบบเดิมดูสะอาด, ใช้งานจริง และไม่พยายามสร้าง illusion หรูเกินบริบท [file:480][file:481]. งานใหม่จึงควรใช้ neutral surfaces ที่ช่วยให้ข้อมูลเด่นและให้ความรู้สึกเป็นมืออาชีพ แล้วใช้ green เป็น accent layer [file:480][code_file:585].

### 3.3 Thai-readable typography

typography เดิมมี character แบบตรงไปตรงมา อ่านง่าย และรองรับภาษาไทย [file:485]. งานใหม่อาจ normalize type scale ใหม่ได้ แต่ต้องรักษา principle เรื่อง readability และ language suitability ไว้ [file:485].

### 3.4 Trust-heavy content presence

ภาพจริงของสถานที่, โมดูลความน่าเชื่อถือ, credentials และ proof sections เป็นส่วนสำคัญของ story เดิม [file:480][file:481]. งานใหม่ต้องไม่หายไปจาก trust posture นี้ [page:REQUIREMENTS_SPEC.html].

## 4. Design principles

### 4.1 Clarity before decoration

ถ้าต้องเลือกระหว่างหน้าที่ดู exciting กับหน้าที่ทำให้ผู้ใช้เข้าใจ inventory, area หรือ next step ได้เร็วกว่า ให้เลือกอย่างหลัง [file:457][file:459]. โปรเจกต์นี้ขายความชัดและความน่าเชื่อถือ ไม่ใช่ความหวือหวา [file:480][file:481].

### 4.2 Trust before persuasion tricks

conversion ในบริบทธุรกิจนี้ไม่ได้มาจาก urgency gimmicks แต่เกิดจากความเชื่อถือและความรู้สึกว่าแพลตฟอร์ม/ทีม “เข้าใจโจทย์จริง” [page:REQUIREMENTS_SPEC.html][page:SEQUENCE_DIAGRAMS.html]. ดังนั้น design ต้องช่วย build confidence มากกว่าการเร่งปิดการขายแบบ landing page ทั่วไป [file:480].

### 4.3 Structure before style

ทุก page และ component ต้องเริ่มจาก role, content hierarchy และ user task ก่อน visual styling [page:FUNCTIONAL_SPEC.html]. การเร่งทำ visual polish ก่อนนิยาม object model หรือ workflow ทำให้เกิดระบบที่สวยแต่เปราะ [file:459][file:458].

### 4.4 System consistency over isolated beauty

หน้าที่สวยเป็นรายหน้าแต่ใช้ pattern คนละภาษา คนละ spacing คนละ CTA logic กัน จะทำให้ระบบดูไม่เป็นมืออาชีพ เป้าหมายคือ design system ที่คุมได้ทั้ง public และ admin ไม่ใช่หน้าเดี่ยวที่ดูดีแต่ต่อกันไม่ได้ [page:FUNCTIONAL_SPEC.html][code_file:585].

### 4.5 Guided discovery over raw browsing

ผู้ใช้ในระบบนี้ไม่ควรถูกปล่อยให้ไหลอยู่ใน listing grid อย่างเดียว [file:457]. design ต้องช่วยให้ search, GEO pages, comparison, requirement flow และ trust content ทำงานร่วมกันเพื่อพาผู้ใช้ไปข้างหน้า [page:FUNCTIONAL_SPEC.html][page:SEQUENCE_DIAGRAMS.html].

## 5. Color direction

ระบบสีของโปรเจกต์นี้ควรเป็น **neutral-first with disciplined green emphasis** [file:584][code_file:585]. สีเขียวคือ action signal และ brand cue หลักของระบบใหม่ [file:584].

### Color rules

- ใช้พื้นขาว/อ่อนเป็นฐานสำหรับ public surfaces [file:480][file:481]
- ใช้ text hierarchy ผ่าน neutral darks ไม่ใช่ผ่านหลายสี [file:485]
- ใช้ green กับ primary CTA, important highlights และ key trust emphasis [file:584][code_file:585]
- สีสถานะเช่น success/warning/error ต้องเป็น semantic system แยกจาก brand accent เมื่อจำเป็น แต่ success สามารถ derive จาก green family ได้ [code_file:585]
- อย่าให้ tags หรือ filters ใช้หลายเฉดเขียวจนแย่ง hierarchy ของ CTA [file:457][code_file:585]

## 6. Typography direction

typography ของโปรเจกต์นี้ต้อง support ภาษาไทยและอังกฤษอย่างลื่นไหล พร้อมทำงานได้ทั้งบน public narratives และ dense admin screens [file:485][page:FUNCTIONAL_SPEC.html].

### Typography rules

- ใช้ Thai-friendly sans เป็นแกน [file:485]
- hierarchy ต้องชัดจาก size/weight/spacing ไม่ใช่จากลูกเล่นมากมาย [file:485]
- body text ต้องอ่านง่ายและไม่เล็กเกินไป แม้ source เดิมจะมี compact text อยู่บ้าง [file:485]
- property IDs, numbers และ data-heavy surfaces ควรมี treatment ที่คงเสถียรและ scan ได้เร็ว [file:457][file:459]

## 7. Layout direction

layout ของโปรเจกต์นี้ควรสะท้อนความเป็น structured platform ที่คุมการไหลของข้อมูลได้ [file:480][file:481][file:487]. ระบบเดิมมี long-form landing rhythm ที่ดีบางส่วนและควรถูกต่อยอด [file:480].

### Layout rules

- homepage และ public pages ใช้ section rhythm ที่ชัดและพาผู้ใช้จาก trust → discovery → decision → inquiry [file:480][page:SEQUENCE_DIAGRAMS.html]
- listing surfaces ต้อง prioritize filter clarity, result readability และ next actions [file:457]
- detail pages ต้องจัดลำดับข้อมูลเพื่อช่วย evaluation มากกว่าการแสดงข้อมูลยาว ๆ แบบไม่จัดกลุ่ม [file:459]
- admin pages ต้องจัดลำดับเพื่อ workflow throughput ไม่ใช่เลียนแบบ public marketing layouts [page:FUNCTIONAL_SPEC.html]

## 8. Component philosophy

component ในระบบนี้ไม่ใช่แค่ UI blocks แต่เป็นพาหะของ workflow [page:FUNCTIONAL_SPEC.html]. เวลาออกแบบ component ให้ถามเสมอว่า component นี้ช่วยอะไรใน journey [page:SEQUENCE_DIAGRAMS.html].

### Core component behaviors

- search module ต้องทำหน้าที่เป็น gateway ไม่ใช่แค่แบบฟอร์ม [file:480][file:457]
- listing card ต้องเป็น decision-entry component ไม่ใช่แค่ teaser [file:457]
- detail inquiry module ต้องเชื่อม conversion context อย่างชัด [file:458][file:459]
- trust modules ต้องช่วยลดความเสี่ยงเชิง perception ไม่ใช่แค่เติมหน้าให้ยาว [file:480][file:481]
- admin object views ต้องทำให้ next task เห็นชัดในหน้าจอเดียว [page:FUNCTIONAL_SPEC.html]

## 9. Public UX priorities

public experience ควรถูก optimize ตามลำดับความสำคัญนี้ [page:REQUIREMENTS_SPEC.html][page:FUNCTIONAL_SPEC.html]:

1. เข้าใจว่าแบรนด์นี้ช่วยอะไร
2. ค้นหาหรือเข้าถึง inventory/areas ที่เกี่ยวข้องได้เร็ว [file:457]
3. ประเมิน listing ได้อย่างมั่นใจ [file:459]
4. ส่ง inquiry หรือ requirement ได้ง่ายและมีบริบท [file:458]
5. ถูกพาไปสู่ next step ที่ชัด [page:SEQUENCE_DIAGRAMS.html]

## 10. Admin UX priorities

admin experience ควรถูก optimize เพื่อความเร็วในการทำงาน, ลด context switching และทำให้ข้อมูลที่จำเป็นอยู่ใกล้ decision point [page:FUNCTIONAL_SPEC.html]. visual language ควร calm, structured และไม่ marketing-heavy.

### Admin rules

- มองหน้าจอเป็น workspace ของ object เช่น lead, listing, visit, deal [page:SEQUENCE_DIAGRAMS.html]
- ให้ state, ownership, pending actions และ recent history มองเห็นง่าย [page:FUNCTIONAL_SPEC.html]
- อย่าให้ style overrides ฝั่ง admin สร้างระบบย่อยใหม่ที่หลุดจาก token base เดียวกัน [code_file:585]
- dense UI ทำได้ แต่ต้องไม่ลด readability หรือ hierarchy [page:FUNCTIONAL_SPEC.html]

## 11. Discoverability-aware design

ดีไซน์ของโปรเจกต์นี้ต้องคำนึงถึง discoverability ตั้งแต่แรก ไม่ใช่รอให้ SEO มา patch ทีหลัง [file:462][page:REQUIREMENTS_SPEC.html]. นี่หมายความว่า page structure, headings, breadcrumbs, internal links และ visible taxonomy cues ต้องถูกออกแบบพร้อมกัน [page:FUNCTIONAL_SPEC.html].

### Rules

- area pages ต้องดูเป็น first-class pages ไม่ใช่ search leftovers [page:REQUIREMENTS_SPEC.html]
- breadcrumb และ route context ต้องมองเห็นและเข้าใจง่าย [file:459][file:462]
- service/content/GEO surfaces ต้องเชื่อมกันผ่าน navigation และ on-page links อย่างมีเหตุผล [page:FUNCTIONAL_SPEC.html]
- listing filters และ labels ต้องช่วยทั้งผู้ใช้และ information architecture ไปพร้อมกัน [file:457][file:462]

## 12. Conversion-aware design

การออกแบบ conversion ในระบบนี้ไม่ควรเน้นปุ่ม “ติดต่อ” อย่างเดียว แต่ต้องคิดเป็น **decision-support + intent capture system** [file:458][page:SEQUENCE_DIAGRAMS.html].

### Rules

- ในจุดที่ผู้ใช้ยังไม่พร้อมคุย ควรมี path ไปสู่ compare, shortlist หรือ save mental model [page:FUNCTIONAL_SPEC.html]
- ในจุดที่ผู้ใช้พร้อมแล้ว ต้องมี CTA ที่ชัดและ friction ต่ำ โดยใช้ green-600 เป็น default action color [file:584][code_file:585]
- no-results และ uncertainty states ควรชี้ทางไป requirement flow [file:457][page:REQUIREMENTS_SPEC.html]
- inquiry forms ต้องดูน่าเชื่อถือและไม่ถามเกินจำเป็น แต่ต้องเก็บ context พอส่งต่อ workflow [file:458][page:SEQUENCE_DIAGRAMS.html]

## 13. Imagery direction

ใช้ภาพจริงเป็นหลัก [file:479][file:480][file:481]. ธุรกิจนี้ได้ประโยชน์จาก real-world proof มากกว่าภาพอารมณ์หรือ abstract visuals [file:480][file:481].

## 14. Responsive design mindset

responsive design ในโปรเจกต์นี้ไม่ใช่แค่การย่อ desktop ลง mobile แต่คือการรักษา **task clarity** ในทุก breakpoint [file:479][file:480][file:481][page:FUNCTIONAL_SPEC.html].

### Rules

- mobile ต้องยังค้นหา inventory และส่ง requirement ได้จริง ไม่ใช่แค่ดูสวย [file:479][file:480]
- iPad/tablet เป็น breakpoint สำคัญ เพราะพฤติกรรมเดิมมี middle-state ชัด [file:480]
- desktop ใช้พื้นที่เพื่อเพิ่ม comparison, density และ trust layering อย่างมีเหตุผล [file:481]
- อย่าให้ responsive behavior ทำลาย hierarchy ของ CTA และ content progression โดยเฉพาะสี action หลัก [file:584][code_file:585]

## 15. Accessibility and readability

ระบบใหม่ต้องมีมาตรฐาน accessibility และ readability ที่ดีกว่าของเดิม [page:FUNCTIONAL_SPEC.html]. การอ่านง่ายและใช้งานง่ายคือส่วนหนึ่งของ brand quality ไม่ใช่ข้อกำหนดทางเทคนิคอย่างเดียว [file:485].

### Rules

- contrast ต้องพอสำหรับ text และ actions [file:584][code_file:585]
- body text อย่าเล็กเกินไป [file:485]
- focus/hover/active states ต้องชัด [page:FUNCTIONAL_SPEC.html]
- form labels, helper text และ validation states ต้องเข้าใจง่าย [file:458]
- mobile tap targets ต้องใช้งานจริงในเงื่อนไขงานภาคสนามหรือระหว่างเดินทาง [page:FUNCTIONAL_SPEC.html]

## 16. What to avoid

สิ่งต่อไปนี้ถือเป็น design anti-patterns ของโปรเจกต์นี้:

- clone เว็บเดิมแบบ pixel-perfect
- ใช้ gradient-heavy startup visuals
- ใช้ luxury cues ที่ไม่สอดคล้องกับ industrial trust posture [file:480][file:481]
- ทำหน้า listing ให้เป็นแค่ card wall โดยไม่มี guided evaluation [file:457]
- ทำ detail page เป็น data dump โดยไม่มี hierarchy [file:459]
- ทำ admin เป็น generic CRUD dashboard ที่ไม่สะท้อน workflow จริง [page:FUNCTIONAL_SPEC.html]
- ใช้ gold เป็น CTA default ต่อไปหลังจาก palette ถูกเปลี่ยนแล้ว [file:584][code_file:585]
