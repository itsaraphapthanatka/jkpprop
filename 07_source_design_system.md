# 07 Source Design System — v2 (Evidence Base & Extraction Frame)

เอกสารนี้เป็นเวอร์ชันปรับปรุงเต็มของ `07_source_design_system.md` โดยเปลี่ยนจากการสรุป visual findings แบบรายงาน extraction ทั่วไป ไปเป็น **evidence base และ extraction frame** สำหรับ source design system ของ Thai Industrial Property ซึ่งใช้เป็นรากฐานให้ Phase 1.5 และ Phase 2 ทั้งหมดในโครงการ structural rewrite นี้ [file:480][file:481][file:482][file:483][file:484][file:485][file:486][file:487][page:FUNCTIONAL_SPEC.html][code_file:540].

เป้าหมายของเอกสารนี้ไม่ใช่การบอกว่าเว็บเดิม “สวยหรือไม่สวย” แต่คือการระบุว่า visual system เดิมมีองค์ประกอบอะไรบ้าง, อะไรคือของจริงที่สังเกตได้จาก evidence, อะไรคือสิ่งที่ควรเก็บไว้เป็น brand signal, และอะไรคือสิ่งที่ต้อง normalize หรือ rewrite ในระบบใหม่ [file:480][file:486][file:487][code_file:540].

## บทบาทของเอกสารนี้

เอกสารนี้ทำหน้าที่ 4 อย่างในโปรเจกต์ [code_file:540][page:FUNCTIONAL_SPEC.html]:

1. เป็นฐานอ้างอิงของ visual evidence จาก source system [file:480][file:481][file:487]
2. แยก “สิ่งที่สังเกตได้จริง” ออกจาก “สิ่งที่ตีความเพื่อออกแบบต่อ” [code_file:540]
3. เป็นสะพานเชื่อมไปยัง `08_design_tokens_normalized.md` และ `09_design_transformation_rules.md` [code_file:540]
4. ช่วยให้ทีมไม่หลุดจาก brand memory เดิมเมื่อเริ่ม redesign เชิงโครงสร้าง [file:486][file:485]

## ขอบเขตของ source evidence

หลักฐาน visual ที่ใช้ในเอกสารนี้มาจาก screenshots ของหน้า Home หลาย breakpoint และภาพสรุป extraction จาก VisualDNA Design System Extractor [file:480][file:481][file:479][file:482][file:483][file:484][file:485][file:486][file:487].  ดังนั้นสิ่งที่บันทึกในเอกสารนี้ถือเป็น **observed design evidence** ไม่ใช่ source code design tokens จากระบบ production โดยตรง [file:487][code_file:540].

หลักฐานที่สำคัญที่สุดมี 2 กลุ่ม [file:480][file:487]:

- **Website reality surfaces** — ภาพหน้า Home บน mobile, iPad, desktop และ layout overview [file:479][file:480][file:481][file:482]
- **Extraction overlays** — สี, typography, components และ layout metrics ที่ได้จาก VisualDNA [file:483][file:484][file:485][file:486][file:487]

## วิธีอ่าน source design system อย่างถูกต้อง

การอ่าน source design system ของโปรเจกต์นี้ต้องระวังเรื่องหนึ่ง: visual output ที่ผู้ใช้เห็นบนเว็บจริง กับ extraction output จากเครื่องมือ ไม่ได้มีสถานะเท่ากัน [file:480][file:486][file:485].  เว็บจริงบอกว่าแบรนด์ถูกใช้งานอย่างไร ส่วน extraction tool บอกว่า visual patterns ใดถูก detect จากหน้าเพจนั้น [file:487][code_file:540].

ดังนั้นหลักการของเอกสารนี้คือ [code_file:540]:

- ให้ **เว็บไซต์จริง** เป็นหลักฐานชั้นแรกของ brand expression [file:479][file:480][file:481]
- ให้ **extraction overlays** เป็นหลักฐานชั้นสองของ token candidates และ reusable patterns [file:483][file:484][file:485][file:486]
- สิ่งที่ไม่ปรากฏในภาพจริงหรือไม่มี support จาก extraction ที่ชัดเจน ไม่ควรถูกสรุปเป็น source truth [code_file:540]

## 1. Brand expression ที่สังเกตได้จากหน้าเว็บจริง

จากภาพหน้า Home ทั้ง mobile, tablet และ desktop เว็บเดิมสื่อ brand personality ที่ค่อนข้างชัดว่าเป็น **industrial brokerage brand ที่เน้นความจริงจัง, ใช้งานได้จริง, และเชื่อถือได้** มากกว่าความหรูหราแบบ lifestyle real estate [file:479][file:480][file:481].  visual language โดยรวมใช้พื้นขาวสะอาด, accent สีทอง/เหลืองมัสตาร์ด, typography แบบตรงไปตรงมา และ card-based information layout [file:480][file:486][file:485].

สิ่งที่เห็นได้ชัดจากหน้าเว็บจริงมีดังนี้ [file:479][file:480][file:481][file:482]:

- hero ใช้ภาพจริงของโกดัง/โรงงาน ไม่ใช่ภาพ abstract หรือ illustration [file:479][file:480][file:481]
- CTA หลักใช้สีทองเด่นเพื่อตัดกับพื้นขาว/เทาอ่อน [file:480][file:486]
- card layouts ถูกใช้ซ้ำหลาย section เช่น listings, features, logos, gallery blocks [file:480][file:482]
- โครงหน้าเน้นความชัดเจนของ hierarchy มากกว่าการเล่น visual effects จำนวนมาก [file:479][file:480][file:481]

## 2. Color system evidence

ภาพ extraction ด้านสีระบุ palette หลัก 8 สี ซึ่งเป็นหลักฐานที่ชัดที่สุดของ source color system ในหน้า Home ชุดนี้ [file:486].  สีที่ตรวจพบได้แก่:

- `#1E1E1F` — dark neutral / background influence [file:486]
- `#FBFBFB` — near-white background [file:486]
- `#F0B235` — primary accent gold [file:486]
- `#000000` — hard black [file:486]
- `#73767E` — secondary gray [file:486]
- `#4B5054` — darker gray text/support [file:486]
- `#92400E` — brown/orange accent support [file:486]
- `#989899` — light neutral gray [file:486]

### Color interpretation

แม้ extraction จะแสดง palette 8 สี แต่เมื่อเทียบกับหน้าเว็บจริง สีที่เป็น brand-driving colors จริง ๆ ดูจะมีอยู่ไม่กี่ตัว ได้แก่พื้นขาว/เทาอ่อน, neutral text เข้ม, และ accent สีทอง [file:480][file:486][code_file:540].  สีอย่างน้ำตาลเข้มหรือ gray รองอื่นน่าจะเป็น supporting tones มากกว่าจะเป็น primary brand colors [file:486].

### Color hierarchy ที่สังเกตได้

ในเชิงลำดับการใช้งาน เว็บเดิมมี color hierarchy ที่อ่านออกได้ประมาณนี้ [file:479][file:480][file:481][file:486]:

1. White / off-white เป็นพื้นหลักของทั้งหน้า [file:480][file:486]
2. Dark text/charcoal ใช้เป็น typographic anchor [file:485][file:486]
3. Gold accent ใช้กับปุ่ม, highlights, numbered icons และ emphasis points [file:480][file:486]
4. Warm brown/gold support tones ใช้เสริมรายละเอียดบางจุด [file:486]

### สิ่งที่ควรเก็บจากระบบสีเดิม

จาก evidence ชุดนี้ brand memory ที่ควรถูกเก็บไว้มีอย่างน้อย [file:480][file:486][code_file:540]:

- accent gold ในฐานะ brand action color [file:486]
- neutral, clean, high-readability surface system [file:480]
- avoidance of overly saturated multi-color UI [file:480][file:486]

## 3. Typography evidence

VisualDNA extraction ตรวจพบ fonts 4 ตัว ได้แก่ Prompt, Font Awesome 6 Pro, Times New Roman และ Arial [file:485].  จากบริบทการใช้งานจริง ฟอนต์ที่มีบทบาทเชิงระบบจริงน่าจะเป็น **Prompt** เป็นหลัก ส่วนอีก 3 ตัวเป็นระบบรองหรือ fallback/utility มากกว่า [file:485][code_file:540].

### Primary type signal

Prompt ทำหน้าที่เป็น primary font ของระบบนี้อย่างชัดเจนใน extraction view [file:485].  เมื่อเทียบกับหน้าเว็บจริง typography โดยรวมก็ให้ความรู้สึกใกล้เคียงกับ Thai-friendly sans ที่อ่านง่ายและเป็น utility-first [file:479][file:480][file:481].

### Type scale evidence

ภาพ extraction ระบุขนาดที่พบเด่น ๆ อยู่ช่วงประมาณ 11px ถึง 16px สำหรับ sample scale [file:485].  แม้จะไม่ใช่ full semantic scale ของทั้งระบบ แต่ก็บอกใบ้ว่าระบบเดิมเอนเอียงไปทาง **compact UI text sizing** มากกว่าการใช้ display typography ขนาดใหญ่ [file:485][code_file:540].

### Typographic character ที่สังเกตได้

ลักษณะ typography จากหน้าเว็บจริงมีดังนี้ [file:479][file:480][file:481][file:485]:

- headline มีน้ำหนักพอควรแต่ไม่ใช่ decorative headline [file:479][file:480]
- body text และ metadata มีขนาดค่อนข้างกะทัดรัด [file:480][file:485]
- ระบบเน้น readability มากกว่า personality ผ่าน type contrast ที่จัดจ้าน [file:485][code_file:540]

### สิ่งที่ควรเก็บจาก typography เดิม

- ความเป็น Thai-friendly sans ที่อ่านง่าย [file:485]
- hierarchy แบบตรงไปตรงมา ใช้งานจริง [file:480]
- การไม่ใช้ display fonts ที่ theatrical เกินบริบทธุรกิจ [file:479][file:485]

## 4. Component evidence

VisualDNA ระบุว่าหน้า Home มี detected components หลักอยู่ในกลุ่ม buttons และ input fields พร้อม card containers หลายแบบ [file:483][file:484][file:487].  เมื่อเทียบกับภาพหน้าเว็บจริง ก็สอดคล้องกันว่าระบบเดิมใช้ component language แบบเรียบง่ายและซ้ำได้ [file:480][file:481][file:482].

### 4.1 Buttons

จาก extraction พบ button styles หลักหลายแบบ โดยมีทั้ง [file:483][file:484]:

- button dark/transparent variants [file:483]
- white button variant [file:483]
- gold filled button variant [file:484]

ในหน้าเว็บจริง ปุ่มสีทองเป็นองค์ประกอบที่เด่นที่สุดและชัดว่าเป็น primary action style [file:480][file:481].  ปุ่มสีขาวหรือ neutral styles ทำหน้าที่เป็นรองในบริบทของ filter chips หรือ secondary actions [file:480].

### 4.2 Inputs and search surface

ภาพ extraction และหน้าเว็บจริงบอกตรงกันว่า input/search module เป็น component สำคัญของหน้า Home [file:484][file:480].  จุดเด่นของ module นี้คือ:

- เป็นกล่อง form ขนาดใหญ่ใน hero [file:480]
- ใช้ช่องกรอกหลาย field สำหรับค้นหาทรัพย์ [file:480][file:482]
- มี chips/shortcuts ใต้ search surface [file:480]

search module นี้จึงไม่ใช่แค่ input control แต่เป็น **signature component** ของหน้า Home เดิม [file:480][code_file:540].

### 4.3 Cards

จากหน้าจอจริง card เป็น primitive ที่ถูกใช้ทั่วทั้งหน้า ไม่ว่าจะเป็น [file:480][file:481][file:482]:

- property cards [file:480]
- process cards [file:480]
- reason/feature cards [file:480]
- logo blocks / proof cards [file:480]

card language ของระบบเดิมค่อนข้าง conservative: พื้นขาว, border บางหรือ shadow เบา, radius ปานกลาง, content alignment ชัด [file:480][file:482].

### 4.4 Trust and proof modules

องค์ประกอบอีกกลุ่มที่เห็นเด่นคือ sections ที่ช่วย build trust เช่น [file:480][file:481]:

- awards / recognition [file:481]
- company credentials / associations [file:480]
- gallery of real-world photos [file:480]

สิ่งนี้มีนัยว่า source design system ไม่ได้ถูกขับด้วยแค่ search UX แต่ถูกขับด้วย **trust-building modules** ด้วย [file:480][code_file:540].

## 5. Layout evidence

VisualDNA extraction ระบุว่า layout system ตรวจพบทั้ง Flexbox และ CSS Grid พร้อมค่า max container ประมาณ 850px และ spacing base 8px [file:487].  ข้อมูลนี้สอดคล้องกับสิ่งที่เห็นในหน้า iPad/mobile ซึ่ง layout มีความ modular และจัดวาง content เป็น block sections อย่างคุมจังหวะ [file:480][file:479].

### 5.1 Page rhythm

หน้า Home จริงมี reading rhythm แบบนี้ [file:480][file:481]:

- hero search
- featured/latest listings
- map/area discovery
- process explanation
- trust reasons
- logos/credentials
- gallery/proof
- footer [file:480]

rhythm แบบนี้บอกว่าระบบเดิมใช้ **long-form landing structure** ที่นำผู้ใช้จาก awareness ไปสู่ trust และ inquiry [file:480][code_file:540].

### 5.2 Container behavior

จาก desktop กับ iPad screenshots จะเห็นว่า content ถูกห่ออยู่ใน max-width ที่คุม readability ค่อนข้างดี และแต่ละ section มี margin/padding สม่ำเสมอ [file:480][file:481].  นี่สอดคล้องกับ extraction ที่บอก max container ประมาณ 850px ในบาง context [file:487].

### 5.3 Responsive behavior

responsive behavior จาก 3 breakpoints ชี้ให้เห็นว่า [file:479][file:480][file:481]:

- desktop ใช้พื้นที่กว้างและให้ search module วางบน hero อย่างชัดเจน [file:481]
- iPad เป็น middle state ที่ยังคง structure เดิม แต่บีบ section ให้เหมาะกับจอแนวตั้ง [file:480]
- mobile ยังคงลำดับ section เดิม แต่ลดความหนาแน่นขององค์ประกอบ [file:479]

สิ่งนี้บอกว่าระบบเดิมมี responsive intent ชัด แม้อาจยังไม่ normalize เป็น systematic design tokens เต็มรูป [code_file:540].

## 6. Radius, spacing, and shadow evidence

VisualDNA ระบุ radius scale หลักประมาณ 2px, 3px, 4px, 6px, 8px และ 9px พร้อม shadow set ที่ค่อนข้าง subtle [file:487].  จากหน้าเว็บจริงก็เห็นแนวโน้มเดียวกันคือใช้ radius แบบมนพอประมาณ ไม่ถึงกับ pill-heavy ทั้งระบบ [file:480][file:482].

spacing base 8px ที่ extraction ตรวจพบยังสอดคล้องกับ rhythm ของ cards, section paddings และ chip gaps บนหน้า Home [file:487][file:480].  เงาโดยรวมก็เบาและทำหน้าที่แค่แยกชั้น ไม่ใช่ visual effect หลัก [file:487][file:480].

### สิ่งที่ควรเก็บ

- moderate radius (ประมาณ 8px เป็น anchor) [file:487]
- spacing ที่มีระบบและไม่แน่นเกินไป [file:480][file:487]
- shadow แบบ subtle, utilitarian [file:487]

## 7. Source design principles ที่สรุปได้

เมื่อนำ evidence ทั้งหมดมารวมกัน source design system ของเว็บเดิมสะท้อนหลักการโดยนัยดังนี้ [file:479][file:480][file:481][file:486][file:485][code_file:540]:

- ใช้งานจริงก่อน aesthetics แบบแฟชั่น
- readable มากกว่า expressive
- brand ใช้ accent gold เป็นตัวชู ไม่ได้ใช้สีหลายตัวแข่งกัน
- เน้น trust modules และ real-world imagery
- card/grid-based composition เหมาะกับ inventory-led business
- hero search เป็น conversion-first component

## 8. What is source truth vs derived interpretation

เพื่อกันการสรุปเกินหลักฐาน เอกสารนี้แยก 2 ระดับชัดเจน [code_file:540]:

### Source truth (observed)

สิ่งที่ถือว่า observed ชัดคือ [file:480][file:485][file:486][file:487]:

- มี palette 8 สีที่ tool detect [file:486]
- มี Prompt เป็น primary font signal [file:485]
- มี button/input/card patterns ที่ซ้ำจริง [file:483][file:484][file:480]
- มี layout system ที่ใช้ grid/flex + spacing base 8px + moderate radius [file:487]
- หน้า Home ใช้ long landing rhythm ที่ชัด [file:480]

### Derived interpretation

สิ่งที่เป็นการตีความเพื่อใช้ต่อใน redesign ได้แก่ [code_file:540]:

- gold เป็น primary brand action color ที่ควร retain [file:486]
- Prompt หรือ Thai-friendly sans ควรถูกแทนด้วย normalized primary type system ที่ยังคง spirit เดิม [file:485]
- search module เป็น signature component ของ brand journey [file:480]
- visual rewrite ควร preserve trust-heavy, utility-first character ของแบรนด์ [file:480][file:481]

## 9. Implications for downstream files

เอกสารนี้ไม่ได้จบที่การอธิบาย source evidence แต่มีผลต่อไฟล์ downstream โดยตรง [code_file:540]:

- `08_design_tokens_normalized.md` จะใช้ palette/type/radius/spacing evidence จากที่นี่ไป normalize เป็น token system ใหม่ [file:485][file:486][file:487]
- `09_design_transformation_rules.md` จะใช้ข้อสรุปเรื่อง what-to-keep vs what-to-rewrite จากที่นี่เป็นฐาน [code_file:540]
- Phase 2 structural rewrites จะยังคง brand memory ที่ได้จากเอกสารนี้ แม้ย้ายไปสู่ information architecture และ system design ใหม่ [page:FUNCTIONAL_SPEC.html][code_file:540]

## What changed from the previous version

เมื่อเทียบกับ `07_source_design_system.md` เดิม ความเปลี่ยนแปลงสำคัญคือ [code_file:540][file:487]:

- เดิมเป็น extraction summary แต่ฉบับนี้ทำให้เป็น evidence framework ที่อธิบายลำดับความน่าเชื่อถือของแต่ละแหล่งหลักฐาน [file:480][file:487]
- เดิมสรุปสี/ฟอนต์/components แบบรายการ แต่ฉบับนี้เพิ่มการตีความว่าอะไรคือ brand memory และอะไรคือสิ่งที่ควร normalize [file:485][file:486][code_file:540]
- เดิมยังไม่แยก source truth ออกจาก derived interpretation ชัด แต่ฉบับนี้แยกเพื่อป้องกันการออกแบบเกินหลักฐาน [code_file:540]
- เดิมเชื่อมไปไฟล์ downstream ไม่ชัด แต่ฉบับนี้ระบุบทบาทต่อ 08/09 และ Phase 2 โดยตรง [code_file:540]

## สรุป

`07_source_design_system.md` เวอร์ชันนี้ทำหน้าที่เป็น **evidence base ของ source visual system** โดยบันทึกสิ่งที่สังเกตได้จริงจากหน้าเว็บและ extraction overlays พร้อมตีความอย่างระมัดระวังว่าอะไรคือแกนของ brand expression เดิม [file:479][file:480][file:481][file:485][file:486][file:487][code_file:540].  เอกสารนี้จึงเหมาะใช้เป็น baseline สำหรับการ normalize design tokens, เขียน transformation rules และทำ redesign เชิงระบบโดยไม่หลุดจาก character ที่ผู้ใช้คุ้นเคยจากเว็บเดิม [page:FUNCTIONAL_SPEC.html][code_file:540].
