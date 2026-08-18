/* ============================================================
   FAQ content — the one place the questions and answers live, in all
   three locales (NFR-04: no hardcoded strings in components).

   Category keys are stable across languages so the sidebar anchors,
   search and the open/closed state keep working when the reader
   switches locale. Every locale must carry the same keys in the same
   order — the type below enforces the category list, and the unit test
   enforces matching question counts.

   Editorial rule: answers say what JKP actually does and point at the
   authority for anything statutory (DIW, กรมที่ดิน, IEAT, ONEP) rather
   than stating a figure as if it were advice. Numbers that move with
   policy are framed as "ณ ปัจจุบัน / at the time of writing".
   ============================================================ */
import type { Locale } from './config';

export type FaqQA = { q: string; a: string };
export type FaqCategory = { key: string; title: string; qs: FaqQA[] };

/* stable order — used for the sidebar and the #anchor of each block */
export const FAQ_KEYS = [
  'docs-license', 'basics', 'reg', 'docs', 'listing',
  'utilities', 'contract', 'payment', 'maintain', 'insurance',
] as const;
export type FaqKey = (typeof FAQ_KEYS)[number];

/* ---------------------------------------------------------------- ไทย */
const th: FaqCategory[] = [
  {
    key: 'docs-license', title: 'เอกสาร & ใบอนุญาต',
    qs: [
      {
        q: 'ขอใบ ร.ง.4 ต้องเตรียมอะไรบ้าง',
        a: 'ใบ ร.ง.4 คือใบอนุญาตประกอบกิจการโรงงานสำหรับโรงงานจำพวกที่ 3 ซึ่งต้องได้รับอนุญาตจากกรมโรงงานอุตสาหกรรม (หรือสำนักงานอุตสาหกรรมจังหวัด) ก่อนเริ่มประกอบกิจการ เอกสารหลักที่ต้องเตรียมได้แก่ แบบคำขอ ร.ง.3 หนังสือรับรองนิติบุคคลและบัญชีรายชื่อผู้ถือหุ้น เอกสารสิทธิ์ที่ดินหรือสัญญาเช่าที่ครอบคลุมระยะเวลาประกอบกิจการ แผนผังโรงงานและแบบแปลนอาคารที่วิศวกรรับรอง รายการเครื่องจักรพร้อมกำลังแรงม้ารวม รายละเอียดกระบวนการผลิต และมาตรการด้านสิ่งแวดล้อมและความปลอดภัย นอกจากนี้ที่ตั้งต้องอยู่ในพื้นที่ที่ผังเมืองอนุญาตให้ประกอบกิจการประเภทนั้น และอาคารต้องมีใบอนุญาตก่อสร้าง (อ.1) และใบรับรองการใช้อาคาร (อ.6) ที่สอดคล้องกับการใช้งาน — ทีมงาน JKP ตรวจสอบให้ตั้งแต่ขั้นเลือกทำเลว่าทรัพย์นั้นขอ ร.ง.4 สำหรับกิจการของคุณได้จริงหรือไม่ ก่อนที่คุณจะเสียเวลาและค่าใช้จ่าย',
      },
    ],
  },
  {
    key: 'basics', title: 'เริ่มต้นใช้งาน',
    qs: [
      {
        q: 'สมัครใช้งานเว็บไซต์อย่างไร?',
        a: 'ไม่ต้องสมัครสมาชิกก็ค้นหาและดูรายละเอียดทรัพย์ได้ทั้งหมด หากต้องการให้เราช่วยคัดทรัพย์ให้ตรงความต้องการ ให้กรอกแบบฟอร์ม “แจ้งความต้องการ” ที่หน้าติดต่อเรา ระบุประเภททรัพย์ ขนาดพื้นที่ ทำเล และงบประมาณ ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมงในวันทำการ พร้อมรายการทรัพย์ที่คัดมาแล้ว (shortlist) ให้เปรียบเทียบ',
      },
      {
        q: 'ต้องเสียค่าใช้จ่ายในการค้นหาทรัพย์หรือไม่?',
        a: 'ไม่มีค่าใช้จ่ายสำหรับผู้เช่าหรือผู้ซื้อในการค้นหา ปรึกษา เข้าชมทรัพย์ และให้เราช่วยคัดตัวเลือก ค่าบำเหน็จนายหน้าเป็นความรับผิดชอบของเจ้าของทรัพย์ตามข้อตกลงที่ทำไว้กับเรา หากมีกรณีใดที่ต้องมีค่าใช้จ่ายจากฝ่ายผู้เช่าหรือผู้ซื้อ เราจะแจ้งให้ทราบเป็นลายลักษณ์อักษรก่อนดำเนินการทุกครั้ง',
      },
      {
        q: 'มีบริการแปลเอกสารเป็นภาษาอังกฤษหรือจีนหรือไม่?',
        a: 'มี ทีมงานสื่อสารได้ทั้งภาษาไทย อังกฤษ และจีน และจัดทำเอกสารสรุปรายละเอียดทรัพย์ (property brief) ให้เป็นภาษาที่คุณต้องการได้ สำหรับเอกสารที่ต้องใช้ยื่นหน่วยงานราชการหรือใช้ประกอบสัญญา เราจะประสานผู้แปลรับรองและที่ปรึกษากฎหมายให้ เนื่องจากเอกสารกลุ่มนี้ต้องมีผู้รับรองที่ได้รับการยอมรับตามกฎหมาย',
      },
    ],
  },
  {
    key: 'reg', title: 'ทำเลที่ตั้งและการวางผังเมือง',
    qs: [
      {
        q: 'ทำเลใดเหมาะกับโรงงานที่ต้องขนส่งด่วน?',
        a: 'ถ้าพึ่งการขนส่งทางอากาศ ทำเลรอบสนามบินสุวรรณภูมิ (บางนา-ตราด ลาดกระบัง บางพลี) และดอนเมือง–รังสิต ให้เวลาเข้าถึงคลังสินค้าทางอากาศสั้นที่สุด ถ้าพึ่งการส่งออกทางเรือ ควรมองแหลมฉบัง ชลบุรี ระยอง และมหาชัย–สมุทรสาคร ส่วนงานกระจายสินค้าในเขตกรุงเทพฯ และปริมณฑล ทำเลตามวงแหวนกาญจนาภิเษก บางนา และลาดกระบัง มักตอบโจทย์เรื่องเวลาวิ่งรถและข้อจำกัดเวลาห้ามรถบรรทุกเข้าเมืองได้ดีที่สุด',
      },
      {
        q: 'สีผังเมืองมีผลต่อการประกอบกิจการอย่างไร?',
        a: 'สีในผังเมืองรวมกำหนดว่าที่ดินแปลงนั้นทำกิจการประเภทใดได้และห้ามทำอะไร โดยทั่วไปพื้นที่สีม่วงคือเขตอุตสาหกรรม สีเม็ดมะปรางคือคลังสินค้า สีเขียวเป็นพื้นที่ชนบทและเกษตรกรรมที่มักจำกัดโรงงาน ขณะที่สีเหลือง ส้ม น้ำตาล เป็นที่อยู่อาศัยระดับความหนาแน่นต่างกัน นอกจากสีแล้วยังมีข้อกำหนด FAR (อัตราส่วนพื้นที่อาคารต่อที่ดิน) และ OSR (อัตราส่วนพื้นที่ว่าง) ที่จำกัดขนาดอาคารที่สร้างได้ ผังเมืองมีการปรับปรุงเป็นรอบและแต่ละจังหวัดต่างกัน จึงควรตรวจสอบผังฉบับที่ใช้บังคับปัจจุบันกับสำนักงานโยธาธิการและผังเมืองจังหวัดก่อนตัดสินใจทุกครั้ง — ทุกประกาศบนเว็บไซต์เราระบุสีผังเมืองไว้เพื่อให้คัดกรองได้เร็วขึ้น',
      },
      {
        q: 'นิคมอุตสาหกรรมต่างจากพื้นที่ทั่วไปอย่างไร?',
        a: 'ในนิคมอุตสาหกรรมที่กำกับโดย กนอ. ระบบสาธารณูปโภคพร้อมใช้งาน ทั้งไฟฟ้า น้ำประปาอุตสาหกรรม ระบบบำบัดน้ำเสียส่วนกลาง ถนนรองรับรถบรรทุกหนัก และการรักษาความปลอดภัย ขั้นตอนขออนุญาตมักเร็วกว่าเพราะพื้นที่ผ่านการจัดสรรเพื่ออุตสาหกรรมมาแล้ว และกิจการในนิคมอาจได้สิทธิประโยชน์เพิ่ม เช่น การถือกรรมสิทธิ์ที่ดินของนิติบุคคลต่างชาติภายใต้เงื่อนไขของ กนอ. ส่วนสิทธิประโยชน์ทางภาษีจาก BOI เป็นการขอแยกต่างหากตามประเภทกิจการ ไม่ได้มาโดยอัตโนมัติจากการอยู่ในนิคม ข้อแลกเปลี่ยนคือค่าเช่าและค่าบริการส่วนกลางมักสูงกว่าพื้นที่นอกนิคม',
      },
    ],
  },
  {
    key: 'docs', title: 'ใบอนุญาตและเอกสาร',
    qs: [
      {
        q: 'ต้องใช้ใบอนุญาตอะไรก่อนเริ่มกิจการ?',
        a: 'ขึ้นกับขนาดและประเภทกิจการ ตาม พ.ร.บ. โรงงาน ฉบับแก้ไข พ.ศ. 2562 กิจการที่ใช้เครื่องจักรตั้งแต่ 50 แรงม้าหรือมีคนงานตั้งแต่ 50 คนขึ้นไปจึงเข้าข่าย “โรงงาน” และหากเป็นจำพวกที่ 3 ต้องได้ ร.ง.4 ก่อนประกอบกิจการ กิจการที่เล็กกว่าเกณฑ์อาจไม่ต้องขอ ร.ง.4 แต่ยังต้องปฏิบัติตามกฎหมายควบคุมอาคาร ผังเมือง และข้อบัญญัติท้องถิ่น เอกสารที่มักต้องมีควบคู่คือใบอนุญาตก่อสร้าง/ดัดแปลงอาคาร (อ.1) ใบรับรองการใช้อาคาร (อ.6) และใบอนุญาตเฉพาะกิจการ เช่น อาหาร (อย.) วัตถุอันตราย หรือสถานประกอบการที่มีถังเก็บเชื้อเพลิง',
      },
      {
        q: 'ทีมงานช่วยเรื่องเอกสารทางกฎหมายได้หรือไม่?',
        a: 'เราให้คำปรึกษาเบื้องต้นและตรวจเอกสารสิทธิ์ให้ก่อนเข้าสู่ขั้นเจรจา เช่น ตรวจโฉนดและภาระผูกพัน ตรวจว่าผู้ให้เช่ามีอำนาจให้เช่าจริง ตรวจว่าอาคารมีใบอนุญาตตรงกับการใช้งาน และช่วยรวบรวมเอกสารสำหรับยื่นขออนุญาต สำหรับการร่างและรับรองนิติกรรม การจดทะเบียนสิทธิ และการวางแผนภาษี เราประสานทนายความและที่ปรึกษาภาษีที่ทำงานร่วมกันเป็นประจำ เพราะงานส่วนนั้นต้องมีผู้ประกอบวิชาชีพรับผิดชอบตามกฎหมาย',
      },
      {
        q: 'ต้องทำ EIA หรือไม่?',
        a: 'ไม่ใช่ทุกโครงการ การจัดทำรายงานการประเมินผลกระทบสิ่งแวดล้อมขึ้นกับประเภทและขนาดโครงการตามประกาศกระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม โครงการที่มีผลกระทบสูง เช่น ปิโตรเคมี โรงถลุงโลหะ หรือโครงการที่เข้าเกณฑ์รุนแรงตามรัฐธรรมนูญ ต้องทำ EHIA ที่มีขั้นตอนรับฟังความเห็นเข้มข้นกว่า โครงการขนาดเล็กกว่าเกณฑ์อาจใช้เพียงมาตรการป้องกันตามที่กำหนดในการขออนุญาต ควรตรวจสอบบัญชีประเภทโครงการที่ต้องทำ EIA ฉบับปัจจุบันกับ สผ. (ONEP) หรือที่ปรึกษาสิ่งแวดล้อม เพราะกระบวนการนี้ใช้เวลาหลายเดือนและควรวางแผนไว้ตั้งแต่ต้น',
      },
    ],
  },
  {
    key: 'listing', title: 'การค้นหาและการเยี่ยมชมทรัพย์',
    qs: [
      {
        q: 'สามารถนัดเข้าชมทรัพย์ได้อย่างไร?',
        a: 'กด “ดูรายละเอียด” ในทรัพย์ที่สนใจแล้วส่งคำขอผ่านฟอร์มติดต่อ หรือโทรแจ้งรหัสทรัพย์ (เช่น JKP-SPK0042) กับทีมงานได้โดยตรง เราจะประสานกับเจ้าของทรัพย์และยืนยันวันเวลาให้ ปกติภายใน 1–3 วันทำการ ถ้าคุณสนใจหลายรายการในทำเลใกล้กัน เราจัดเส้นทางเข้าชมต่อเนื่องในวันเดียวให้ได้ และหากคุณอยู่ต่างประเทศ เราถ่ายวิดีโอเดินสำรวจหรือเปิดวิดีโอคอลสดจากหน้างานให้ก่อนตัดสินใจเดินทาง',
      },
      {
        q: 'ทรัพย์ทั้งหมดผ่านการตรวจสอบหรือไม่?',
        a: 'ทุกรายการก่อนเผยแพร่ เราตรวจสอบเอกสารสิทธิ์และอำนาจการให้เช่าหรือขาย ตรวจสภาพจริงหน้างาน และบันทึกสเปกสำคัญไว้ตรงตามที่วัดได้ เช่น พื้นที่ใช้สอย ความสูงใต้อาคาร น้ำหนักที่พื้นรับได้ ระบบไฟฟ้า และสีผังเมือง ทรัพย์ที่ข้อมูลยังไม่ครบจะไม่ถูกเผยแพร่ อย่างไรก็ดี การตรวจของเราไม่แทนการตรวจสอบเชิงเทคนิคเชิงลึก (เช่น การตรวจโครงสร้างหรือระบบดับเพลิงโดยวิศวกร) ซึ่งเราแนะนำให้ทำในขั้นตรวจสอบสถานะก่อนลงนาม',
      },
      {
        q: 'ราคาที่แสดงรวมค่าใช้จ่ายอื่นหรือไม่?',
        a: 'ราคาที่แสดงเป็นราคาตั้งของเจ้าของทรัพย์ ยังไม่รวมภาษีมูลค่าเพิ่ม (หากผู้ให้เช่าจดทะเบียน VAT) ค่าส่วนกลาง ค่าน้ำค่าไฟ ค่าประกัน และค่าธรรมเนียมที่เกิดในวันโอนหรือวันทำสัญญา หน้ารายละเอียดทรัพย์จะระบุแยกให้เห็นว่าอะไรรวมและอะไรไม่รวม เช่น อัตราค่าน้ำค่าไฟต่อหน่วยและค่าส่วนกลางต่อตารางเมตร ก่อนลงนามทีมงานจะสรุปค่าใช้จ่ายทั้งหมดให้เป็นชุดเดียวเพื่อให้เทียบต้นทุนจริงระหว่างทรัพย์ได้',
      },
    ],
  },
  {
    key: 'utilities', title: 'ความพร้อม ไฟฟ้า และแรงงาน',
    qs: [
      {
        q: 'ทรัพย์ส่วนใหญ่มีระบบไฟฟ้า 3 เฟสหรือไม่?',
        a: 'โรงงานและโกดังส่วนใหญ่ในระบบของเรามีไฟฟ้า 3 เฟสพร้อมใช้งาน แต่สิ่งที่ต้องดูคือ “ขนาดที่ขอไว้” ไม่ใช่แค่ว่ามีสามเฟสหรือไม่ หน้ารายละเอียดทรัพย์จะระบุขนาดหม้อแปลงหรือขนาดมิเตอร์ เช่น 3 เฟส 30/100 แอมป์ พร้อมระบุว่าเพิ่มขนาดได้หรือไม่ ถ้าเครื่องจักรของคุณต้องการกำลังไฟสูงกว่าที่มีอยู่ ควรประเมินค่าใช้จ่ายและระยะเวลาในการขอเพิ่มขนาดกับการไฟฟ้าในพื้นที่ (กฟภ. หรือ กฟน.) ไว้ในแผนตั้งแต่ต้น เพราะเป็นงานที่ใช้เวลาและมีค่าดำเนินการ',
      },
      {
        q: 'พื้นที่รับน้ำหนักสูงสุดเท่าไหร่?',
        a: 'ค่าที่พบทั่วไปอยู่ระหว่างประมาณ 1–5 ตันต่อตารางเมตร ขึ้นกับการออกแบบพื้นของแต่ละอาคาร โกดังกระจายสินค้าทั่วไปมักอยู่ราว 2–3 ตันต่อตารางเมตร ส่วนอาคารที่ออกแบบรองรับชั้นวางสูงหรือเครื่องจักรหนักจะสูงกว่านั้น ตัวเลขนี้ระบุไว้ในรายละเอียดของทรัพย์แต่ละรายการ หากคุณจะวางเครื่องจักรหนักเป็นจุดหรือใช้ racking สูง เราแนะนำให้วิศวกรโครงสร้างตรวจสอบและยืนยันก่อนลงนาม เพราะน้ำหนักแบบกดเป็นจุดต่างจากน้ำหนักเฉลี่ยทั้งพื้น',
      },
      {
        q: 'มีแรงงานในพื้นที่ใกล้เคียงหรือไม่?',
        a: 'ทำเลอุตสาหกรรมหลักที่เราดูแล เช่น สมุทรปราการ สมุทรสาคร ชลบุรี ระยอง ปทุมธานี และพระนครศรีอยุธยา อยู่ใกล้ชุมชนและนิคมที่มีแรงงานหมุนเวียนอยู่แล้ว รวมถึงมีเส้นทางรถรับส่งพนักงานและหอพักในระยะเดินทางสั้น ความพร้อมของแรงงานฝีมือเฉพาะทางจะต่างกันตามพื้นที่ เมื่อคุณแจ้งลักษณะงานและจำนวนคนที่ต้องการ เราจะช่วยประเมินตัวเลือกทำเลจากมุมนี้ประกอบด้วย ไม่ใช่ดูแต่ค่าเช่ากับขนาดพื้นที่',
      },
    ],
  },
  {
    key: 'contract', title: 'เงื่อนไขการเช่าและสัญญา',
    qs: [
      {
        q: 'สัญญาเช่าขั้นต่ำกี่ปี?',
        a: 'ตลาดโรงงานและโกดังในไทยนิยมสัญญา 3 ปี ซึ่งเป็นระยะที่จดทะเบียนการเช่ากับกรมที่ดินไม่จำเป็น (การเช่าเกิน 3 ปีต้องจดทะเบียนจึงจะบังคับได้ตามระยะเวลาที่ตกลง) หลายรายให้ทำ 3 ปีพร้อมสิทธิต่ออายุอีก 3 ปีโดยกำหนดเพดานการปรับค่าเช่าไว้ล่วงหน้า หากคุณต้องลงทุนปรับปรุงพื้นที่สูง ควรเจรจาสัญญายาวขึ้นหรือใส่สิทธิต่ออายุให้ชัด เพื่อให้ระยะคืนทุนสอดคล้องกับอายุสัญญา',
      },
      {
        q: 'วางเงินประกันการเช่าเท่าไหร่?',
        a: 'ปกติเงินประกัน 2–3 เดือนของค่าเช่า และมักมีค่าเช่าล่วงหน้า 1 เดือนแยกอีกส่วนหนึ่ง เงินประกันจะคืนหลังสิ้นสุดสัญญาและส่งมอบพื้นที่ในสภาพตามที่ตกลง หักค่าซ่อมแซมและหนี้ค้างชำระ จุดที่ควรระบุให้ชัดในสัญญาคือกำหนดเวลาคืนเงินประกัน เกณฑ์การหัก และมาตรฐาน “สภาพเดิม” ที่ต้องส่งคืน — เราช่วยตรวจข้อเหล่านี้ให้ก่อนลงนาม เพราะเป็นสาเหตุข้อพิพาทที่พบบ่อยที่สุดตอนสิ้นสัญญา',
      },
      {
        q: 'สามารถเช่าระยะสั้นกว่า 1 ปีได้หรือไม่?',
        a: 'มีบางรายการที่รองรับ โดยเฉพาะโกดังสำหรับเก็บสินค้าตามฤดูกาลหรือใช้เป็นพื้นที่สำรองชั่วคราว แต่ตัวเลือกน้อยกว่าและอัตราค่าเช่าต่อตารางเมตรมักสูงกว่าสัญญายาว เจ้าของบางรายกำหนดขั้นต่ำ 6 เดือนพร้อมเงินประกันที่สูงขึ้น หากคุณต้องการพื้นที่ชั่วคราวระหว่างรอย้ายเข้าที่ใหม่ แจ้งกรอบเวลาให้เราทราบ เราจะคัดเฉพาะรายการที่ยืดหยุ่นเรื่องระยะสัญญาให้',
      },
    ],
  },
  {
    key: 'payment', title: 'ค่าใช้จ่าย ภาษี และการเงิน',
    qs: [
      {
        q: 'การซื้อขายมีค่าธรรมเนียมโอนเท่าไหร่?',
        a: 'ค่าธรรมเนียมจดทะเบียนโอนกรรมสิทธิ์อยู่ที่ 2% ของราคาประเมินทุนทรัพย์ตามที่กรมที่ดินกำหนด และมักมีรายการอื่นร่วมด้วย เช่น ภาษีธุรกิจเฉพาะ 3.3% (กรณีถือครองไม่ถึง 5 ปีหรือเข้าเงื่อนไขค้ากำไร) หรืออากรแสตมป์ 0.5% หากไม่เข้าเกณฑ์ภาษีธุรกิจเฉพาะ รวมถึงภาษีเงินได้หัก ณ ที่จ่ายที่คำนวณต่างกันระหว่างบุคคลธรรมดาและนิติบุคคล ธรรมเนียมเหล่านี้แบ่งกันได้ตามที่เจรจา จึงควรระบุในสัญญาให้ชัดว่าใครจ่ายส่วนใด อัตราและมาตรการลดหย่อนมีการเปลี่ยนแปลงเป็นช่วง ๆ ควรยืนยันตัวเลขกับสำนักงานที่ดินและที่ปรึกษาภาษีก่อนวันโอน',
      },
      {
        q: 'สามารถขอสินเชื่อธนาคารสำหรับซื้อโรงงานได้หรือไม่?',
        a: 'ได้ สินเชื่อเพื่อซื้ออสังหาริมทรัพย์เชิงพาณิชย์และอุตสาหกรรมมีให้บริการโดยธนาคารพาณิชย์หลายแห่ง โดยทั่วไปวงเงินอยู่ที่ประมาณ 60–80% ของราคาประเมินหรือราคาซื้อขาย แล้วแต่ธนาคารจะใช้ค่าที่ต่ำกว่า และพิจารณาจากงบการเงิน กระแสเงินสด ประวัติเครดิต และคุณภาพของหลักประกันร่วมกัน เอกสารที่มักต้องใช้คืองบการเงินย้อนหลัง 2–3 ปี รายการเดินบัญชี แผนธุรกิจ และเอกสารสิทธิ์ของทรัพย์ เราแนะนำธนาคารที่ทำงานกับอสังหาริมทรัพย์อุตสาหกรรมเป็นประจำ และเตรียมชุดข้อมูลทรัพย์ให้ผู้ประเมินได้ เพื่อให้ขั้นตอนเร็วขึ้น',
      },
    ],
  },
  {
    key: 'maintain', title: 'ซ่อมบำรุงและการปรับปรุง',
    qs: [
      {
        q: 'ใครรับผิดชอบค่าซ่อมบำรุงโครงสร้างหลัก?',
        a: 'ตามธรรมเนียมของตลาด เจ้าของทรัพย์รับผิดชอบโครงสร้างหลัก หลังคา และงานระบบหลักของอาคาร ขณะที่ผู้เช่ารับผิดชอบการดูแลการใช้งานประจำวันและความเสียหายที่เกิดจากการใช้งานของตน แต่ไม่มีมาตรฐานบังคับ ทุกอย่างขึ้นกับถ้อยคำในสัญญา จุดที่ควรเขียนให้ชัดคือขอบเขตงานของแต่ละฝ่าย เวลาที่เจ้าของต้องเข้าซ่อมเมื่อได้รับแจ้ง และสิทธิของผู้เช่าหากงานซ่อมล่าช้าจนกระทบการดำเนินธุรกิจ เราตรวจข้อเหล่านี้ให้ก่อนลงนาม',
      },
      {
        q: 'สามารถปรับปรุงพื้นที่ภายในได้หรือไม่?',
        a: 'ได้ตามเงื่อนไขที่ตกลงกับเจ้าของทรัพย์เป็นลายลักษณ์อักษรก่อนเริ่มงาน สิ่งที่ต้องพิจารณาคือ งานที่กระทบโครงสร้าง ผนังกันไฟ หรือระบบดับเพลิง อาจต้องขออนุญาตดัดแปลงอาคารตามกฎหมายควบคุมอาคาร งานที่เพิ่มกำลังไฟหรือเปลี่ยนการใช้พื้นที่อาจกระทบเงื่อนไขใบอนุญาตประกอบกิจการ และควรตกลงล่วงหน้าว่าเมื่อสิ้นสัญญาจะต้องรื้อคืนสภาพเดิมหรือส่งมอบส่วนปรับปรุงให้เจ้าของ เพราะมีผลต่อต้นทุนช่วงท้ายสัญญาอย่างมาก',
      },
    ],
  },
  {
    key: 'insurance', title: 'การประกันภัยและการบริหารความเสี่ยง',
    qs: [
      {
        q: 'ควรทำประกันภัยโรงงานหรือไม่?',
        a: 'ควรทำ และในทางปฏิบัติสัญญาเช่าและสัญญาสินเชื่อมักกำหนดให้ทำอยู่แล้ว ความคุ้มครองพื้นฐานคือประกันอัคคีภัยและภัยพิเศษสำหรับตัวอาคารและทรัพย์สิน ซึ่งควรพิจารณาเพิ่มความคุ้มครองน้ำท่วมในพื้นที่เสี่ยง สำหรับผู้ประกอบการควรดูประกันความเสี่ยงภัยทุกชนิด (IAR) สำหรับเครื่องจักรและสต๊อกสินค้า และประกันธุรกิจหยุดชะงัก (Business Interruption) ที่ชดเชยรายได้ระหว่างหยุดผลิต จุดที่มักถูกมองข้ามคือทุนประกันต้องสะท้อนมูลค่าทดแทนจริง ไม่ใช่ราคาตามบัญชี เพราะการทำประกันต่ำกว่ามูลค่าทำให้ถูกเฉลี่ยค่าสินไหม',
      },
      {
        q: 'ผู้เช่าต้องทำประกันภัยเองหรือไม่?',
        a: 'โดยทั่วไปใช่ ในโครงสร้างที่พบบ่อยเจ้าของทรัพย์ทำประกันตัวอาคาร ส่วนผู้เช่าทำประกันทรัพย์สินของตนเอง ทั้งเครื่องจักร สต๊อก และงานตกแต่งที่ลงทุนเพิ่ม พร้อมประกันความรับผิดต่อบุคคลภายนอก (Public Liability) สัญญาเช่ามักระบุวงเงินความคุ้มครองขั้นต่ำและให้ระบุเจ้าของทรัพย์เป็นผู้ร่วมเอาประกันหรือผู้รับผลประโยชน์ ควรตรวจให้แน่ใจว่ากรมธรรม์ของสองฝ่ายไม่มีช่องว่างทับซ้อนกัน เช่น ใครคุ้มครองระบบดับเพลิงหรืองานปรับปรุงที่ผู้เช่าทำไว้',
      },
    ],
  },
];

/* ------------------------------------------------------------- English */
const en: FaqCategory[] = [
  {
    key: 'docs-license', title: 'Documents & licences',
    qs: [
      {
        q: 'What do I need to apply for a Ror Ngor 4 factory licence?',
        a: 'The Ror Ngor 4 (ร.ง.4) is the operating licence required for Type 3 factories, granted by the Department of Industrial Works or the Provincial Industry Office before operations may begin. The core file includes the Ror Ngor 3 application, company registration and shareholder list, proof of land title or a lease covering the licence period, engineer-certified site and building plans, a machinery schedule with total horsepower, a description of the production process, and the environmental and safety measures you will put in place. The site must also sit in a zone where your activity is permitted, and the building needs construction (Or 1) and occupancy (Or 6) permits consistent with that use. JKP checks all of this while you are still choosing a location, so you learn whether a property can actually be licensed for your operation before you spend time and money on it.',
      },
    ],
  },
  {
    key: 'basics', title: 'Getting started',
    qs: [
      {
        q: 'How do I register on the website?',
        a: 'No account is needed — search and full property details are open to everyone. If you would like us to shortlist properties for you, fill in the requirement form on the contact page with your property type, floor area, preferred locations and budget. A member of the team replies within 24 hours on business days with a shortlist you can compare.',
      },
      {
        q: 'Is there a fee for searching for a property?',
        a: 'There is no charge to tenants or buyers for searching, consulting, viewing properties, or having us shortlist options. Our commission is paid by the landlord or seller under our agreement with them. If any situation would involve a cost to you, we tell you in writing before proceeding.',
      },
      {
        q: 'Do you translate documents into English or Chinese?',
        a: 'Yes. The team works in Thai, English and Chinese, and we prepare property briefs in whichever of the three you prefer. For documents that will be filed with a government office or attached to a contract, we arrange a certified translator and legal counsel, because those need a legally recognised certifier rather than an in-house translation.',
      },
    ],
  },
  {
    key: 'reg', title: 'Location & city planning',
    qs: [
      {
        q: 'Which locations suit a factory that ships time-critical goods?',
        a: 'For air freight, the areas around Suvarnabhumi (Bangna-Trad, Lat Krabang, Bang Phli) and Don Mueang–Rangsit give the shortest run to air cargo terminals. For sea export, look at Laem Chabang, Chonburi, Rayong, and Mahachai–Samut Sakhon. For distribution inside Bangkok and its suburbs, sites along the Kanchanaphisek ring road, Bangna and Lat Krabang usually work best once you account for driving time and the city\'s truck curfew hours.',
      },
      {
        q: 'How does city-plan zoning affect what I can operate?',
        a: 'The colour of a parcel on the comprehensive city plan determines which activities are allowed and which are prohibited. Broadly, purple is industrial, light-plum is warehousing, green is rural and agricultural land where factories are usually restricted, and yellow, orange and brown are residential at increasing densities. Beyond colour, FAR (floor area ratio) and OSR (open space ratio) cap how much building you can put on the land. Plans are revised periodically and differ by province, so always confirm the currently enforced plan with the Provincial Public Works and Town & Country Planning Office before you commit — every listing on our site states its zoning colour so you can filter faster.',
      },
      {
        q: 'How does an industrial estate differ from land outside one?',
        a: 'Inside an IEAT-regulated industrial estate the utilities are already in place: power, industrial water, central wastewater treatment, roads built for heavy trucks, and estate security. Permitting is usually faster because the land is already designated for industry, and tenants may gain additional rights, such as land ownership by a foreign entity under IEAT conditions. BOI tax privileges are a separate application based on your activity — they do not come automatically with an estate address. The trade-off is that rent and common-area charges are typically higher than comparable land outside an estate.',
      },
    ],
  },
  {
    key: 'docs', title: 'Permits & paperwork',
    qs: [
      {
        q: 'Which permits do I need before starting operations?',
        a: 'It depends on your size and activity. Under the 2019 amendment to the Factory Act, an operation counts as a "factory" once it uses machinery of 50 horsepower or more, or employs 50 or more workers; if it falls in Type 3 it needs a Ror Ngor 4 before operating. Smaller operations may not need one but still have to comply with building control, city planning and local ordinances. Alongside these you will usually need a construction or alteration permit (Or 1), an occupancy certificate (Or 6), and any activity-specific licence — food (Thai FDA), hazardous substances, or premises with fuel storage, for example.',
      },
      {
        q: 'Can your team help with legal paperwork?',
        a: 'We give initial guidance and check the title documents before negotiations start: verifying the title deed and any encumbrances, confirming the landlord actually has the right to lease, and checking that the building\'s permits match the intended use. We also help assemble the file for licence applications. For drafting and certifying instruments, registering rights, and tax planning we bring in the lawyers and tax advisers we work with regularly, because that work has to sit with a licensed professional.',
      },
      {
        q: 'Do I need an EIA?',
        a: 'Not every project. Whether an Environmental Impact Assessment is required depends on the project type and scale listed in the Ministry of Natural Resources and Environment notifications. High-impact projects — petrochemicals, metal smelting, or anything meeting the constitutional "severe impact" threshold — require an EHIA with a more demanding public consultation process. Projects below the thresholds may only need the mitigation measures set out in their permit conditions. Confirm the current schedule of project types with ONEP or an environmental consultant, and plan for it early: the process takes months.',
      },
    ],
  },
  {
    key: 'listing', title: 'Searching & viewing properties',
    qs: [
      {
        q: 'How do I arrange a site visit?',
        a: 'Open the property, click "View details" and send a request through the contact form, or call the team with the property code (for example JKP-SPK0042). We coordinate with the owner and confirm a time, usually within one to three business days. If several properties in the same area interest you, we can chain the visits into a single day. If you are overseas, we can record a walkthrough video or run a live video call from the site before you commit to travelling.',
      },
      {
        q: 'Are all properties verified?',
        a: 'Before anything is published we verify the title and the owner\'s authority to lease or sell, inspect the property in person, and record the key specifications as measured — usable area, clear height, floor loading, electrical supply and zoning colour. Listings with incomplete data are not published. Our checks do not replace a deep technical inspection, such as an engineer\'s survey of the structure or the fire-protection system, which we recommend during due diligence before signing.',
      },
      {
        q: 'Does the displayed price include other costs?',
        a: 'The price shown is the owner\'s asking price. It excludes VAT (where the landlord is VAT-registered), common-area fees, utilities, insurance, and the fees that fall due on transfer or signing. Each property page breaks out what is and is not included, such as the per-unit water and electricity rates and the common-area charge per square metre. Before signing, we give you a single consolidated cost summary so you can compare the real cost of occupancy between properties.',
      },
    ],
  },
  {
    key: 'utilities', title: 'Readiness, power & labour',
    qs: [
      {
        q: 'Do most properties have three-phase power?',
        a: 'Most factories and warehouses on our books have three-phase power available, but the number that matters is the capacity that has been provisioned, not simply whether three phases exist. Each property page states the transformer or meter size — for example 3-phase 30/100 amp — and whether it can be upgraded. If your machinery needs more than what is installed, budget the cost and lead time for an upgrade with the local utility (PEA or MEA) from the outset, as it is neither quick nor free.',
      },
      {
        q: 'What is the maximum floor loading?',
        a: 'Typical figures run from roughly 1 to 5 tonnes per square metre depending on how each floor was designed. General distribution warehouses commonly sit around 2–3 tonnes per square metre, while buildings designed for high racking or heavy machinery go above that. The figure is stated on each listing. If you plan point loads from heavy machinery or tall racking, have a structural engineer confirm it before signing — a concentrated point load behaves very differently from a uniformly distributed one.',
      },
      {
        q: 'Is there a local labour pool?',
        a: 'The main industrial locations we cover — Samut Prakan, Samut Sakhon, Chonburi, Rayong, Pathum Thani and Ayutthaya — sit close to established communities and estates with an existing workforce, staff shuttle routes and dormitories within a short commute. Availability of specific skilled trades varies by area. Tell us the type of work and headcount you need and we will factor that into the location options we put forward, rather than looking only at rent and floor area.',
      },
    ],
  },
  {
    key: 'contract', title: 'Lease terms & contracts',
    qs: [
      {
        q: 'What is the minimum lease term?',
        a: 'Three years is the market norm for Thai factories and warehouses, and it is the longest term that does not require registration with the Land Department — a lease longer than three years must be registered to be enforceable for its full stated term. Many deals are structured as three years with a renewal option for a further three and an agreed cap on the rent increase. If you are investing heavily in fit-out, negotiate a longer term or a clearly worded renewal right so your payback period matches the security of tenure.',
      },
      {
        q: 'How much is the security deposit?',
        a: 'Two to three months\' rent is standard, usually with one month\'s rent paid in advance as a separate item. The deposit is returned after the lease ends and the space is handed back in the agreed condition, less repair costs and any outstanding charges. The points worth pinning down in the contract are the deadline for returning the deposit, what may be deducted, and the standard the space must be returned to — we review these before you sign, because they are the single most common source of end-of-lease disputes.',
      },
      {
        q: 'Can I lease for less than a year?',
        a: 'Some properties allow it, particularly warehouses used for seasonal stock or as temporary overflow space. There are fewer options and the rate per square metre is usually higher than on a long lease. Some owners set a six-month minimum with a larger deposit. If you need interim space while waiting to move into a permanent site, tell us your timeframe and we will shortlist only the owners who are flexible on term.',
      },
    ],
  },
  {
    key: 'payment', title: 'Costs, tax & finance',
    qs: [
      {
        q: 'What are the transfer fees on a purchase?',
        a: 'The ownership transfer registration fee is 2% of the Land Department\'s appraised value, and other items usually apply alongside it: specific business tax of 3.3% where the property has been held for less than five years or the sale is treated as trading, or stamp duty of 0.5% where specific business tax does not apply, plus withholding tax calculated differently for individuals and companies. How these are split is negotiable, so state clearly in the contract who pays what. Rates and relief measures change from time to time, so confirm the figures with the Land Office and your tax adviser before the transfer date.',
      },
      {
        q: 'Can I get bank financing to buy a factory?',
        a: 'Yes. Several Thai commercial banks lend against commercial and industrial property, typically up to around 60–80% of the appraised or purchase value, whichever is lower, assessed on your financial statements, cash flow, credit history and the quality of the collateral together. Banks generally ask for two to three years of financial statements, bank statements, a business plan and the property\'s title documents. We can introduce banks that finance industrial property regularly and prepare the property information pack for the valuer, which shortens the process.',
      },
    ],
  },
  {
    key: 'maintain', title: 'Maintenance & fit-out',
    qs: [
      {
        q: 'Who pays for structural maintenance?',
        a: 'By market convention the owner is responsible for the structure, the roof and the building\'s primary systems, while the tenant handles day-to-day upkeep and damage arising from its own use. There is no statutory standard, though — everything turns on the wording of the lease. Spell out each party\'s scope, how quickly the owner must attend once notified, and what remedy the tenant has if a repair drags on long enough to disrupt operations. We review these clauses before signing.',
      },
      {
        q: 'Can I fit out the interior?',
        a: 'Yes, on terms agreed with the owner in writing before work starts. Watch for three things: work affecting the structure, fire walls or fire-protection systems may require an alteration permit under building control law; work that increases electrical load or changes how the space is used may affect your operating licence conditions; and you should settle upfront whether you must reinstate the space at the end of the lease or hand the improvements over, because it materially changes your end-of-term cost.',
      },
    ],
  },
  {
    key: 'insurance', title: 'Insurance & risk',
    qs: [
      {
        q: 'Should I insure the factory?',
        a: 'Yes, and in practice both leases and loan agreements usually require it. The baseline is fire and special perils cover on the building and property, and in flood-prone areas it is worth extending cover for flood. Operators should also look at Industrial All Risks cover for machinery and stock, and business interruption cover, which replaces income while production is halted. The point most often missed is that the sum insured should reflect real replacement cost rather than book value — under-insuring means claims are scaled down by average.',
      },
      {
        q: 'Does the tenant need its own insurance?',
        a: 'Usually yes. In the common structure the owner insures the building while the tenant insures its own property — machinery, stock and any fit-out it has paid for — together with public liability cover. Leases often set a minimum sum insured and require the owner to be named as co-insured or beneficiary. Check that the two policies leave no gap between them, for instance over who covers the fire-protection system or the improvements the tenant installed.',
      },
    ],
  },
];

/* ---------------------------------------------------------------- 中文 */
const zh: FaqCategory[] = [
  {
    key: 'docs-license', title: '文件与许可',
    qs: [
      {
        q: '申请 ร.ง.4（工厂经营许可证）需要准备什么？',
        a: 'ร.ง.4 是第三类工厂的经营许可证，须在开始经营前向泰国工业厅（DIW）或府级工业办公室取得。主要材料包括：ร.ง.3 申请表、公司注册证明与股东名册、土地权属文件或覆盖许可经营期限的租赁合同、经工程师签认的厂区平面图与建筑图纸、载明总马力的机器清单、生产工艺说明，以及环境与安全措施方案。此外，厂址必须位于城市规划允许该类经营的区域，建筑物也需持有与实际用途相符的建筑许可（อ.1）与建筑使用许可（อ.6）。JKP 会在您选址阶段就先行核查这些条件，让您在投入时间与费用之前，就知道该物业能否为您的业务取得 ร.ง.4。',
      },
    ],
  },
  {
    key: 'basics', title: '开始使用',
    qs: [
      {
        q: '如何在网站上注册？',
        a: '无需注册即可搜索并查看全部物业详情。如需我们为您筛选，请在联系页面填写需求表，说明物业类型、面积、意向区域与预算。团队会在工作日 24 小时内回复，并提供一份可供比较的候选清单。',
      },
      {
        q: '搜索物业需要付费吗？',
        a: '承租方与买方在搜索、咨询、看房以及由我们代为筛选的过程中均不收取费用。我们的佣金依约由业主或卖方支付。若某种情形会产生您需承担的费用，我们必定在推进之前以书面方式告知。',
      },
      {
        q: '是否提供英文或中文的文件翻译？',
        a: '提供。团队以泰、英、中三语沟通，并可按您需要的语言编制物业说明书。若文件需递交政府机关或作为合同附件，我们会安排具资质的认证翻译与法律顾问，因为此类文件需由法律认可的认证人出具，而非内部翻译即可。',
      },
    ],
  },
  {
    key: 'reg', title: '区位与城市规划',
    qs: [
      {
        q: '时效要求高的工厂适合哪些区位？',
        a: '若依赖空运，素万那普机场周边（Bangna-Trad、Lat Krabang、Bang Phli）与廊曼—Rangsit 一带到航空货运站的车程最短。若以海运出口为主，可考虑林查班、春武里、罗勇，以及 Mahachai—龙仔厝。若为曼谷及周边的配送业务，Kanchanaphisek 环路沿线、Bangna 与 Lat Krabang 通常最合适，因为还需考虑行车时间与市区货车禁行时段。',
      },
      {
        q: '城市规划用地颜色如何影响经营？',
        a: '综合城市规划图上地块的颜色决定了允许与禁止的经营类别。总体而言，紫色为工业用地，浅紫红（เม็ดมะปราง）为仓储用地，绿色为乡村与农业用地、通常限制设厂，黄、橙、棕则为密度递增的住宅用地。除颜色之外，FAR（容积率）与 OSR（空地率）还会限制可建规模。规划会定期修订且各府不同，因此决定前务请向府级公共工程与城乡规划办公室确认现行生效的版本——我们网站上的每一条房源都标注了用地颜色，便于您更快筛选。',
      },
      {
        q: '工业园区与园区外用地有何区别？',
        a: '在泰国工业园区管理局（IEAT）管辖的园区内，基础设施已经就绪：供电、工业用水、中央污水处理、可承载重型货车的道路以及园区安保。因土地已划定为工业用途，报批通常更快；园区内企业还可能获得额外权利，例如在 IEAT 条件下由外资法人持有土地。BOI 税收优惠属于按业务类别单独申请的事项，并不会因入驻园区而自动取得。相应的代价是，租金与公共服务费通常高于园区外的同类用地。',
      },
    ],
  },
  {
    key: 'docs', title: '许可与文件',
    qs: [
      {
        q: '开始经营前需要哪些许可？',
        a: '取决于规模与业务类别。依 2562 年（2019 年）《工厂法》修订，使用机器达 50 马力以上或雇工达 50 人以上者方构成“工厂”；若属第三类，须先取得 ร.ง.4 才可经营。规模低于门槛者可能无须申领，但仍须遵守建筑管制、城市规划与地方法规。通常还需同时具备建筑新建或改建许可（อ.1）、建筑使用许可（อ.6），以及各业务专项许可，例如食品（泰国 FDA）、危险物质，或设有燃料储罐的场所。',
      },
      {
        q: '团队能协助处理法律文件吗？',
        a: '我们在进入议价前提供初步咨询并核查权属文件：查验地契与各项负担、确认出租方确实有权出租、核对建筑许可与拟定用途是否相符，并协助整理报批所需材料。至于法律文书的起草与认证、权利登记及税务规划，我们会引入长期合作的律师与税务顾问，因为该部分工作须由持照专业人士承担责任。',
      },
      {
        q: '是否必须做环境影响评估（EIA）？',
        a: '并非所有项目都需要。是否须编制环境影响评估报告，取决于自然资源与环境部公告所列的项目类别与规模。高影响项目——如石化、金属冶炼，或达到宪法所定“严重影响”门槛的项目——须编制 EHIA，公众听证程序更为严格。低于门槛的项目可能仅需落实许可条件中规定的防治措施。请向 ONEP（自然资源与环境政策规划办公室）或环境顾问确认现行项目清单，并及早规划：该流程通常耗时数月。',
      },
    ],
  },
  {
    key: 'listing', title: '搜索与实地看房',
    qs: [
      {
        q: '如何预约实地看房？',
        a: '打开心仪物业，点击“查看详情”并通过联系表提交请求，或直接致电团队并提供物业编号（例如 JKP-SPK0042）。我们会与业主协调并确认时间，通常在 1 至 3 个工作日内完成。若您对同一区域的多处物业感兴趣，可安排在同一天连续看房。若您身在海外，我们可先录制实地走查视频或从现场发起视频通话，便于您在决定出行前先行了解。',
      },
      {
        q: '所有房源都经过核实吗？',
        a: '在发布之前，我们会核实权属与业主出租或出售的权限、实地查看物业，并按实测记录关键规格——可用面积、净高、楼面荷载、供电系统与用地颜色。资料不完整的房源不会发布。但我们的核查不能替代深入的技术检验，例如由工程师对结构或消防系统进行勘验；建议在签约前的尽职调查阶段安排。',
      },
      {
        q: '所显示的价格是否含其他费用？',
        a: '所示价格为业主的报价，不含增值税（若出租方已登记 VAT）、公共服务费、水电费、保险费，以及过户或签约当日应付的各项费用。每个物业页面会分列哪些含、哪些不含，例如水电单价与每平方米公共服务费。签约前，我们会向您提供一份完整的费用汇总，便于在不同物业之间比较真实的使用成本。',
      },
    ],
  },
  {
    key: 'utilities', title: '配套、供电与劳动力',
    qs: [
      {
        q: '多数物业是否具备三相电？',
        a: '我们在册的工厂与仓库多数已具备三相电，但关键并非“有无三相”，而是已申请到的容量。每个物业页面都会标注变压器或电表容量，例如三相 30/100 安培，并说明能否扩容。若您的机器所需电力超过现有容量，请自始将向当地电力部门（PEA 或 MEA）申请扩容的费用与工期纳入计划，因为这既不快也不免费。',
      },
      {
        q: '楼面荷载最大是多少？',
        a: '常见数值约为每平方米 1 至 5 吨，取决于各建筑的楼面设计。一般配送仓库多在每平方米 2 至 3 吨，而为高位货架或重型机器设计的建筑会更高。该数值在每条房源中均有标注。若您计划放置重型机器形成点荷载或使用高位货架，请在签约前由结构工程师核实确认，因为集中点荷载与均布荷载的受力表现差异很大。',
      },
      {
        q: '周边是否有劳动力供给？',
        a: '我们主要覆盖的工业区位——北榄（Samut Prakan）、龙仔厝（Samut Sakhon）、春武里、罗勇、巴吞他尼与大城——均邻近已成型的社区与园区，具备现成劳动力、员工班车路线以及通勤距离较短的宿舍。特定技术工种的供给因地区而异。请告知我们工作性质与所需人数，我们会将此纳入区位建议的考量，而不只看租金与面积。',
      },
    ],
  },
  {
    key: 'contract', title: '租赁条件与合同',
    qs: [
      {
        q: '最短租期是多久？',
        a: '泰国工厂与仓库市场以三年为惯例，这也是无须向土地厅登记的最长期限——超过三年的租赁须经登记，方能就其约定的完整期限具有强制执行力。许多交易采用“三年加三年续租选择权”的结构，并预先约定租金涨幅上限。若您的装修投入较大，建议争取更长租期或订明清晰的续租权，使投资回收期与租期保障相匹配。',
      },
      {
        q: '押金是多少？',
        a: '通常为 2 至 3 个月租金，并另行预付 1 个月租金。押金在租约期满且按约定状态交还场地后退还，并扣除维修费用与未结款项。合同中值得明确的要点是：押金退还的期限、可扣除的范围，以及交还时须达到的“原状”标准——我们会在签约前为您审核这些条款，因为它们是租约期满时最常见的争议来源。',
      },
      {
        q: '可以租期短于一年吗？',
        a: '部分物业可以，尤其是用于季节性存货或临时周转的仓库。可选项较少，且每平方米租金通常高于长租。有些业主要求最短六个月并提高押金。若您在等待迁入长期场地期间需要过渡空间，请告知时间安排，我们将只筛选在租期上具备弹性的业主。',
      },
    ],
  },
  {
    key: 'payment', title: '费用、税务与融资',
    qs: [
      {
        q: '买卖的过户费用是多少？',
        a: '所有权过户登记费为土地厅评估价的 2%，通常还会同时产生其他项目：持有不足五年或该交易被认定为营利性买卖时，需缴 3.3% 的特种营业税；不适用特种营业税时，则为 0.5% 的印花税；此外还有预扣所得税，个人与法人的计算方式不同。上述费用如何分担可由双方协商，因此应在合同中明确各自承担的部分。税率与减免措施会不时调整，请在过户日之前向土地办公室及税务顾问核实具体数额。',
      },
      {
        q: '购买厂房可以申请银行贷款吗？',
        a: '可以。泰国多家商业银行提供商业与工业物业抵押贷款，额度通常为评估价或成交价（以较低者为准）的约 60% 至 80%，并综合考量财务报表、现金流、信用记录与抵押物质量。银行一般要求提供近两至三年的财务报表、银行流水、商业计划以及物业权属文件。我们可介绍长期从事工业物业融资的银行，并为评估师准备物业资料包，以缩短流程。',
      },
    ],
  },
  {
    key: 'maintain', title: '维护与装修',
    qs: [
      {
        q: '主体结构的维护费用由谁承担？',
        a: '按市场惯例，业主负责主体结构、屋面与建筑主要系统，承租方负责日常维护及因自身使用造成的损坏。但这并无法定标准，一切取决于租约的措辞。建议明确约定双方的责任范围、业主收到通知后须到场处理的时限，以及维修延误至影响经营时承租方享有的救济。我们会在签约前审核这些条款。',
      },
      {
        q: '可以对室内进行装修改造吗？',
        a: '可以，但须在开工前与业主以书面形式达成一致。需特别注意三点：涉及主体结构、防火墙或消防系统的工程，可能须依建筑管制法申领改建许可；增加用电负荷或改变空间用途的工程，可能影响经营许可的条件；此外应事先约定租约期满时是否须恢复原状或将装修移交业主，因为这会显著改变租期末的成本。',
      },
    ],
  },
  {
    key: 'insurance', title: '保险与风险管理',
    qs: [
      {
        q: '厂房是否应当投保？',
        a: '应当，而且实务中租约与贷款协议通常已强制要求。基础保障为建筑与财产的火险及特约风险险；在易涝地区，值得扩展洪水责任。经营者还应考虑针对机器与存货的工业一切险（IAR），以及在停产期间补偿收入的营业中断险。最常被忽视的一点是：保额应反映实际重置成本而非账面价值，因为不足额投保将导致理赔按比例分摊而被削减。',
      },
      {
        q: '承租方需要自行投保吗？',
        a: '通常需要。常见结构是业主为建筑投保，承租方为自身财产投保——包括机器、存货及自费装修部分——并同时投保公众责任险。租约往往会规定最低保额，并要求将业主列为共同被保险人或受益人。请核对双方保单之间不留缺口，例如消防系统或承租方所做装修究竟由谁承保。',
      },
    ],
  },
];

export const FAQ: Record<Locale, FaqCategory[]> = { th, en, zh };

export const getFaq = (locale: Locale): FaqCategory[] => FAQ[locale] ?? th;

/* ----------------------------------------------------------------------
   Page chrome. Kept next to the content it wraps rather than in
   dictionaries.ts, because these strings only exist on this page and
   reviewing a translation is easier when the whole page reads together.
   ---------------------------------------------------------------------- */
export type FaqUi = {
  metaTitle: string;
  heroTitle: string; heroLead: string;
  home: string; breadcrumb: string;
  categories: string; searchPlaceholder: string; searchAria: string;
  share: string; copied: string;
  ctaTitle: string; ctaLead: string; ctaButton: string;
  noMatch: string;
};

export const FAQ_UI: Record<Locale, FaqUi> = {
  th: {
    metaTitle: 'คำถามที่พบบ่อย | JKP Property',
    heroTitle: 'คำถามที่พบบ่อย',
    heroLead: 'รวมคำตอบเกี่ยวกับการเช่า การขาย เอกสาร และการจดทะเบียนอสังหาริมทรัพย์อุตสาหกรรม',
    home: 'หน้าแรก', breadcrumb: 'คำถามที่พบบ่อย',
    categories: 'หมวดหมู่', searchPlaceholder: 'ค้นหาคำถามที่พบบ่อย...', searchAria: 'ค้นหาคำถาม',
    share: 'คัดลอกคำถาม', copied: 'คัดลอกแล้ว',
    ctaTitle: 'ยังหาคำตอบไม่เจอ?',
    ctaLead: 'ทีมงานของเราพร้อมช่วยตอบคำถามทุกข้อสงสัย ติดต่อเราได้ที่นี่',
    ctaButton: 'ติดต่อทีมงาน',
    noMatch: 'ไม่พบคำถามที่ตรงกับคำค้นนี้',
  },
  en: {
    metaTitle: 'Frequently asked questions | JKP Property',
    heroTitle: 'Frequently asked questions',
    heroLead: 'Answers on leasing, buying, paperwork and registration for industrial property in Thailand',
    home: 'Home', breadcrumb: 'FAQ',
    categories: 'Categories', searchPlaceholder: 'Search the FAQ…', searchAria: 'Search questions',
    share: 'Copy question', copied: 'Copied',
    ctaTitle: 'Still haven\'t found your answer?',
    ctaLead: 'Our team is ready to answer any question — get in touch here.',
    ctaButton: 'Contact the team',
    noMatch: 'No questions match your search',
  },
  zh: {
    metaTitle: '常见问题 | JKP Property',
    heroTitle: '常见问题',
    heroLead: '关于泰国工业地产租赁、买卖、文件与登记的解答',
    home: '首页', breadcrumb: '常见问题',
    categories: '分类', searchPlaceholder: '搜索常见问题…', searchAria: '搜索问题',
    share: '复制问题', copied: '已复制',
    ctaTitle: '仍未找到答案？',
    ctaLead: '我们的团队随时为您解答任何疑问，欢迎在此联系。',
    ctaButton: '联系团队',
    noMatch: '未找到匹配的问题',
  },
};

export const getFaqUi = (locale: Locale): FaqUi => FAQ_UI[locale] ?? FAQ_UI.th;
