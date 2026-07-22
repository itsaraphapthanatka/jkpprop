# 09 Design Transformation Rules — Green-First Revision

เอกสารนี้กำหนดกติกาการแปลง visual system เดิมไปสู่ระบบใหม่ โดยใน revision นี้ให้ถือว่า **brand accent หลักของระบบเปลี่ยนจาก gold ไปเป็น green-first palette** ตามไฟล์ `Fun-Green-11-kigen-design.svg` [file:584][file:480][file:481][code_file:585].

## 1. Transformation intent

การแปลงครั้งนี้ไม่ได้แปลว่าต้องลบ character ของระบบเดิมทั้งหมด แต่ต้องย้ายจาก identity แบบ `gold + neutral` ไปสู่ identity แบบ `green + neutral` โดยยังคง trust posture, readability และ practical composition ของเดิมไว้ [file:480][file:481][file:485][code_file:585].

## 2. Rule framework

ทุก element หรือ pattern ให้ตัดสินใจผ่าน 4 กรอบนี้:

- **Retain** — สิ่งที่ควรรักษาไว้ในระดับพฤติกรรมหรือ character
- **Normalize** — สิ่งที่ยังใช้ได้แต่ต้องแปลงให้เป็น token/system form
- **Recompose** — สิ่งที่ต้องจัดองค์ประกอบใหม่ให้เหมาะกับ platform ใหม่
- **Remove** — สิ่งที่ต้องเลิกใช้ใน design direction ใหม่

## 3. Retain

สิ่งที่ควร retain จากระบบเดิม [file:480][file:481][file:485]:

- ความรู้สึก practical และ trustworthy ของหน้า public [file:480][file:481]
- การใช้ภาพจริงเพื่อเสริมความน่าเชื่อถือ [file:479][file:480][file:481]
- hierarchy ที่พาผู้ใช้จาก discovery ไป conversion [file:480][page:SEQUENCE_DIAGRAMS.html]
- typography ที่อ่านง่าย รองรับไทยได้ดี [file:485]
- trust modules, credentials และ company proof sections [file:480][file:481]

## 4. Normalize

สิ่งที่ต้อง normalize ภายใต้ palette ใหม่ [file:584][code_file:585]:

- เปลี่ยน CTA default จาก gold ไปเป็น green-600 (`#0D6C3B`) [file:584]
- เปลี่ยน interaction states ไปใช้ green-700 และ green-800 [file:584]
- เปลี่ยน soft highlights / selected states ไปใช้ green-50 หรือ green tint families แทน gold tints [file:584][code_file:585]
- map ทุก component ให้ผ่าน semantic tokens ใหม่ แทนการอ้างสีตรงจาก screenshot [code_file:585]

## 5. Recompose

สิ่งที่ต้อง recompose ใหม่ ไม่ใช่แค่เปลี่ยนสี [file:457][file:458][file:459][file:480]:

### Homepage

- hero/search module ต้องใช้ green เป็น action signal หลัก แต่ยังอยู่บน neutral base [file:480][file:584]
- trust และ brand sections ต้องลดการพึ่ง accent blocks ใหญ่ แล้วใช้ green เป็น emphasis จุดสำคัญ [file:480][file:481]

### Listing pages

- selected filters, sort emphasis และ view-details actions ต้องเป็น green-led [file:457][file:584]
- อย่าใช้หลายเฉดเขียวพร้อมกันบน card หนึ่งใบจนเสีย hierarchy [file:457][code_file:585]

### Detail pages

- request-info module, sticky inquiry actions และ conversion buttons ใช้ green-600 เป็น primary [file:458][file:459][file:584]
- location/data sections ยังคง neutral-first เพื่อให้ CTA เด่นพอ [file:459]

### Contact / requirement flows

- submit actions, requirement CTA, success feedback ใช้ green family อย่างสม่ำเสมอ [file:458][file:584][code_file:585]

## 6. Remove

สิ่งที่ต้อง remove ออกจาก design language ใหม่ [code_file:585]:

- gold as primary brand accent
- gold as default CTA color
- documentation ที่อธิบาย brand system ว่าเป็น `gold + neutral`
- examples ที่ทำให้ gold และ green แข่งกันใน viewport เดียว

## 7. Token and reference alignment

ทุก token/json/theme references ที่เคยผูกกับ gold primary ต้องแก้ให้สอดคล้องกับ green-first mapping [code_file:585].  หากยังต้องเก็บไฟล์เก่าไว้เพื่อประวัติ ให้ mark ว่า deprecated และห้ามใช้เป็น source of truth สำหรับ implementation ใหม่ [code_file:585].

## 8. Final decision rule

หากลังเลในการออกแบบ ให้ใช้กฎนี้:

- เลือก neutral surfaces เป็นฐาน
- ใช้ green-600 เป็น primary action
- ใช้ green-700/800 สำหรับ interactive depth
- ใช้ green-50/soft tint สำหรับ selected/support states
- ตัด gold ออกจาก role ของ brand primary และ CTA default ทั้งหมด [file:584][code_file:585]
