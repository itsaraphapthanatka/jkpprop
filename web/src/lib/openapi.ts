/* ============================================================
   OpenAPI 3.1 description of every route under src/app/api.

   SPEC_PACK §6 makes this the binding contract between frontend and
   backend. It is authored here rather than in a .yaml file so that
   `tests/unit/openapi.test.ts` can walk the route tree and fail the build
   when an endpoint is added, removed or renamed without updating the
   contract — the failure mode that left the old README describing an app
   that did not exist.

   Served as JSON at /api/openapi.json, rendered at /admin/api-docs, and
   written to web/openapi.yaml by `npm run openapi`.
   ============================================================ */

type Json = Record<string, unknown>;

/* ---- helpers so 68 operations stay readable ---- */
const json = (schema: Json) => ({ 'application/json': { schema } });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const errRes = (description: string) => ({ description, content: json(ref('Error')) });
const okRes = (description: string, schema: Json = { type: 'object' }) => ({ description, content: json(schema) });
const arrayOf = (schema: Json) => ({ type: 'array', items: schema });
const items = (schema: Json) => ({ type: 'object', properties: { items: arrayOf(schema) } });

const pathParam = (name: string, description: string) => ({
  name, in: 'path', required: true, description, schema: { type: 'string' },
});
const queryParam = (name: string, description: string, schema: Json = { type: 'string' }) => ({
  name, in: 'query', required: false, description, schema,
});

const body = (schema: Json, required = true) => ({ required, content: json(schema) });
const obj = (properties: Json, required?: string[]) => ({
  type: 'object', properties, ...(required ? { required } : {}),
});

const STR = { type: 'string' };
const NUM = { type: 'number' };
const INT = { type: 'integer' };
const BOOL = { type: 'boolean' };
const NULLABLE_STR = { type: ['string', 'null'] };

/** the four failures every authenticated endpoint can return */
const AUTH_ERRORS = {
  400: errRes('ข้อมูลไม่ถูกต้อง'),
  401: errRes('ยังไม่ได้เข้าสู่ระบบ'),
  403: errRes('ไม่มีสิทธิ์ทำรายการนี้'),
};
const WITH_404 = { ...AUTH_ERRORS, 404: errRes('ไม่พบข้อมูล') };

/** marks an operation as callable without a session */
const PUBLIC = { security: [] as unknown[] };

export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'JKP Property API',
    version: '1.0.0',
    description: [
      'API ของแพลตฟอร์มนายหน้าอสังหาริมทรัพย์อุตสาหกรรม JKP Property',
      '',
      '**การยืนยันตัวตน** — session cookie (`jkp_session`, httpOnly) ที่ได้จาก `POST /api/auth/login`',
      'ทุก endpoint ต้องมี session ยกเว้นที่ระบุว่า *public*',
      '',
      '**รูปแบบข้อผิดพลาด** — เหมือนกันทั้งระบบ: `{ error: { code, message, fields? } }`',
      'โดย `message` เป็นภาษาไทยพร้อมแสดงให้ผู้ใช้เห็น',
      '',
      '**RBAC** — บังคับที่ชั้น API เสมอ ไม่ใช่แค่ซ่อนปุ่ม สิทธิ์จริง = บทบาท ∧ ขอบเขตข้อมูล ∧ สิทธิ์พิเศษ',
      'ดูรายละเอียดที่ `FRONTEND_API_SPEC.md` §12 และ `web/BACKEND.md`',
    ].join('\n'),
  },
  servers: [{ url: '/', description: 'เซิร์ฟเวอร์เดียวกับที่เสิร์ฟหน้าเว็บ' }],
  security: [{ cookieAuth: [] }],
  tags: [
    { name: 'Auth', description: 'เข้าสู่ระบบ · ออกจากระบบ · ข้อมูลผู้ใช้ปัจจุบัน' },
    { name: 'Public', description: 'เรียกได้โดยไม่ต้องล็อกอิน — มี rate limit และไม่คืนข้อมูลภายใน' },
    { name: 'Properties', description: 'ทรัพย์และประกาศ' },
    { name: 'Leads', description: 'ลูกค้าที่สนใจ และงานติดตาม' },
    { name: 'Pipeline', description: 'Shortlist → Visit → Deal' },
    { name: 'Leases', description: 'สัญญาเช่าและการแจ้งเตือน' },
    { name: 'Media', description: 'คลังไฟล์และลายน้ำ' },
    { name: 'Content', description: 'CMS · sections · SEO · branding' },
    { name: 'Config', description: 'field schema · ประเภททรัพย์ · พื้นที่ · social' },
    { name: 'Admin', description: 'ผู้ใช้ · สิทธิ์ · audit log · dashboard' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'jkp_session' },
    },
    schemas: {
      Error: obj({
        error: obj({
          code: { ...STR, description: 'รหัสข้อผิดพลาดคงที่ เช่น VALIDATION, FORBIDDEN, AVAILABILITY_REQUIRED' },
          message: { ...STR, description: 'ข้อความภาษาไทย พร้อมแสดงให้ผู้ใช้' },
          fields: { type: 'object', additionalProperties: STR, description: 'ข้อผิดพลาดรายฟิลด์ สำหรับ map เข้า input' },
        }, ['code', 'message']),
      }, ['error']),

      Property: obj({
        id: STR,
        publicCode: { ...STR, description: 'รหัสสาธารณะ ออกโดย server จากจังหวัด · แก้ไม่ได้หลังสร้าง' },
        typeKey: STR, typeLabel: STR, title: STR,
        status: { ...STR, enum: ['draft', 'active', 'hidden', 'archived'] },
        values: { type: 'object', description: 'ค่าทุกฟิลด์ keyed ด้วย FieldDef.key' },
        location: STR, area: { type: ['number', 'null'] },
        ownerId: NULLABLE_STR, createdAt: INT, updatedAt: INT,
      }),

      Lead: obj({
        id: STR, createdAt: INT, name: STR,
        phone: { ...STR, description: 'ปิดบังเป็นค่าเริ่มต้น เว้นแต่ผู้เรียกมีสิทธิ์ pii' },
        email: STR,
        piiMasked: { ...BOOL, description: 'true = ค่าที่ได้ถูกปิดบังไว้' },
        company: STR, respondentType: STR, message: STR,
        typeKey: STR, typeLabel: STR, dealIntent: STR,
        req: arrayOf(obj({ k: STR, v: STR })),
        source: STR, status: STR, assigneeId: NULLABLE_STR, agentName: NULLABLE_STR,
      }),

      MediaAsset: obj({
        id: STR, name: STR, mime: STR, size: INT,
        src: { ...STR, description: 'URL ของไฟล์ที่ใส่ลายน้ำแล้ว — ไฟล์เดียวที่หน้าเว็บเห็น' },
        watermarkType: { ...STR, enum: ['none', 'corner', 'tiled'] },
        createdAt: INT,
      }),

      UserPermissions: obj({
        id: STR, name: STR, email: STR,
        role: { ...STR, enum: ['owner', 'manager', 'agent', 'co_agent', 'ops', 'marketing', 'translator'] },
        scope: { ...STR, enum: ['own', 'all'] },
        privileges: arrayOf({ ...STR, enum: ['pii', 'publish', 'price', 'deal_unlock', 'internal_note', 'export', 'audit'] }),
        expiresAt: NULLABLE_STR,
        mustChangePassword: BOOL,
      }),
    },
  },

  paths: {
    /* ---------------- Auth ---------------- */
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'เข้าสู่ระบบ', ...PUBLIC,
        description: 'ตั้ง session cookie · ล็อก 15 นาทีหลังผิด 5 ครั้ง · ข้อความผิดพลาดเหมือนกันทุกกรณีเพื่อไม่ให้เดาได้ว่าอีเมลมีอยู่จริง',
        requestBody: body(obj({ email: STR, password: STR }, ['email', 'password'])),
        responses: {
          200: okRes('เข้าสู่ระบบสำเร็จ', obj({
            ok: BOOL, user: ref('UserPermissions'),
            mustChangePassword: { ...BOOL, description: 'true = ใช้รหัสชั่วคราวอยู่ ต้องตั้งรหัสใหม่ก่อนใช้งาน' },
          })),
          400: errRes('กรอกไม่ครบ'),
          401: errRes('อีเมลหรือรหัสผ่านไม่ถูกต้อง'),
          429: errRes('พยายามผิดหลายครั้ง — ถูกล็อกชั่วคราว'),
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'], summary: 'ออกจากระบบ',
        responses: { 200: okRes('ล้าง session แล้ว', obj({ ok: BOOL })) },
      },
    },
    '/api/me/permissions': {
      get: {
        tags: ['Auth'], summary: 'ผู้ใช้ปัจจุบัน + สิทธิ์ที่ใช้ได้จริง',
        description: 'สิทธิ์ที่คืนมาผ่านการกรอง FORBIDDEN_PRIVS แล้ว — frontend ใช้ตัดสินว่าจะซ่อนเมนูไหน',
        responses: { 200: okRes('ข้อมูลผู้ใช้', ref('UserPermissions')), 401: errRes('ยังไม่ได้เข้าสู่ระบบ') },
      },
    },
    '/api/me/password': {
      post: {
        tags: ['Auth'], summary: 'ตั้งรหัสผ่านของตัวเอง',
        description: 'ล้าง mustChangePassword และเตะ session อื่นทั้งหมด — รหัสชั่วคราวที่เคยส่งต่อจะใช้ไม่ได้ทันที',
        requestBody: body(obj({
          currentPassword: STR, newPassword: { ...STR, minLength: 8 }, confirmPassword: STR,
        }, ['currentPassword', 'newPassword'])),
        responses: { 200: okRes('เปลี่ยนแล้ว', obj({ ok: BOOL })), 400: errRes('ไม่ผ่านการตรวจสอบ'), 401: errRes('ยังไม่ได้เข้าสู่ระบบ') },
      },
    },

    /* ---------------- Public ---------------- */
    '/api/public/leads': {
      post: {
        tags: ['Public'], summary: 'ส่งความต้องการจากฟอร์มหน้าเว็บ', ...PUBLIC,
        description: 'มี rate limit และ honeypot · คืนแค่ `{ ok: true }` ไม่คืนข้อมูลภายในใด ๆ',
        requestBody: body(obj({
          name: STR, phone: STR, email: STR, company: STR, respondentType: STR, message: STR,
          typeKey: STR, typeLabel: STR, dealIntent: STR,
          req: arrayOf(obj({ k: STR, v: STR })),
          website: { ...STR, description: 'honeypot — ต้องเว้นว่าง' },
        }, ['name', 'phone', 'respondentType'])),
        responses: { 200: okRes('รับแล้ว', obj({ ok: BOOL })), 400: errRes('ข้อมูลไม่ครบ'), 429: errRes('ส่งถี่เกินไป') },
      },
    },
    '/api/public/listings': {
      get: {
        tags: ['Public'], summary: 'รายการประกาศสำหรับหน้าเว็บ', ...PUBLIC,
        description: 'เฉพาะทรัพย์ที่เผยแพร่ · ไม่ส่งพิกัด ข้อมูลผู้ให้เช่า หรือฟิลด์ internalOnly',
        parameters: [
          queryParam('deal', 'rent | sale'),
          queryParam('type', 'typeKey เช่น warehouse'),
          queryParam('province', 'ชื่อจังหวัด'),
          queryParam('limit', 'จำนวนสูงสุด (ไม่เกิน 60)', INT),
        ],
        responses: { 200: okRes('รายการประกาศ', obj({ items: arrayOf({ type: 'object' }), total: INT })) },
      },
    },
    '/api/public/properties/{code}': {
      get: {
        tags: ['Public'], summary: 'รายละเอียดทรัพย์ตาม public_code', ...PUBLIC,
        description: 'ไม่ส่งพิกัดแม่นยำเด็ดขาด (FR-LST-02) และตัดข้อมูลผู้ให้เช่า/โน้ตภายในออก',
        parameters: [pathParam('code', 'public_code เช่น JKP-SPK0042')],
        responses: { 200: okRes('รายละเอียดทรัพย์'), 404: errRes('ไม่พบทรัพย์นี้') },
      },
    },
    '/api/public/shortlists/{token}': {
      get: {
        tags: ['Public'], summary: 'Shortlist ที่แชร์ให้ลูกค้าดูผ่าน token', ...PUBLIC,
        parameters: [pathParam('token', 'token ในลิงก์ที่ส่งให้ลูกค้า')],
        responses: { 200: okRes('รายการที่แชร์'), 404: errRes('ไม่พบ หรือลิงก์หมดอายุ'), 429: errRes('เรียกถี่เกินไป') },
      },
    },

    /* ---------------- Properties & listings ---------------- */
    '/api/properties': {
      get: {
        tags: ['Properties'], summary: 'รายการทรัพย์ + ตัวเลขสรุป',
        description: 'ผู้ใช้ที่ scope เป็น own จะเห็นเฉพาะทรัพย์ของตัวเอง (กรองระดับแถว)',
        parameters: [queryParam('type', 'ประเภท'), queryParam('province', 'จังหวัด'), queryParam('status', 'สถานะ'), queryParam('q', 'ค้นหาจากรหัสหรือชื่อ')],
        responses: { 200: okRes('รายการทรัพย์', obj({ items: arrayOf(ref('Property')), summary: { type: 'object' } })), ...AUTH_ERRORS },
      },
      post: {
        tags: ['Properties'], summary: 'สร้างทรัพย์ใหม่',
        description: 'server เป็นผู้ออก public_code จากจังหวัด · ประเภทที่ถูกปิดรับของใหม่จะถูกปฏิเสธ',
        requestBody: body(obj({ typeKey: STR, title: STR, values: { type: 'object' }, status: STR }, ['typeKey', 'title'])),
        responses: { 201: okRes('สร้างแล้ว', ref('Property')), ...AUTH_ERRORS },
      },
    },
    '/api/properties/{id}': {
      get: {
        tags: ['Properties'], summary: 'ทรัพย์รายตัว (รับ id หรือ public_code)',
        parameters: [pathParam('id', 'id หรือ public_code')],
        responses: { 200: okRes('ทรัพย์', ref('Property')), ...WITH_404 },
      },
      patch: {
        tags: ['Properties'], summary: 'แก้ไขทรัพย์',
        description: 'public_code แก้ไม่ได้ · แก้ราคาหลังเผยแพร่ต้องมีสิทธิ์ price · ผู้ที่ไม่มีสิทธิ์ internal_note จะไม่ลบโน้ตภายในโดยไม่ตั้งใจ',
        parameters: [pathParam('id', 'id ของทรัพย์')],
        requestBody: body(obj({ title: STR, status: STR, values: { type: 'object' } }, [])),
        responses: { 200: okRes('แก้ไขแล้ว', ref('Property')), ...WITH_404 },
      },
      delete: {
        tags: ['Properties'], summary: 'ลบทรัพย์ (owner / manager)',
        parameters: [pathParam('id', 'id ของทรัพย์')],
        responses: { 200: okRes('ลบแล้ว', obj({ ok: BOOL })), ...WITH_404 },
      },
    },
    '/api/listings': {
      get: {
        tags: ['Properties'], summary: 'ประกาศสำหรับหน้า Listings หลังบ้าน',
        responses: { 200: okRes('รายการประกาศ', items({ type: 'object' })), ...AUTH_ERRORS },
      },
    },
    '/api/listings/{code}': {
      patch: {
        tags: ['Properties'], summary: 'เผยแพร่ / ซ่อนประกาศ',
        description: 'เผยแพร่ต้องมีสิทธิ์ publish และต้องมีชื่อทรัพย์กับรูปอย่างน้อย 1 รูป (PUBLISH_GATE)',
        parameters: [pathParam('code', 'public_code')],
        requestBody: body(obj({ status: { ...STR, enum: ['published', 'draft', 'hidden'] } }, ['status'])),
        responses: { 200: okRes('อัปเดตแล้ว'), ...WITH_404 },
      },
    },

    /* ---------------- Leads ---------------- */
    '/api/leads': {
      get: {
        tags: ['Leads'], summary: 'รายการ lead',
        description: 'scope own = เห็นเฉพาะที่ได้รับมอบหมาย · PII ปิดบังเว้นแต่มีสิทธิ์ pii',
        parameters: [queryParam('status', 'สถานะใน pipeline'), queryParam('source', 'ที่มา')],
        responses: { 200: okRes('รายการ lead', items(ref('Lead'))), ...AUTH_ERRORS },
      },
      post: {
        tags: ['Leads'], summary: 'สร้าง lead จากหลังบ้าน',
        requestBody: body(obj({ name: STR, phone: STR, email: STR, company: STR, source: STR, status: STR }, ['name'])),
        responses: { 201: okRes('สร้างแล้ว', ref('Lead')), ...AUTH_ERRORS },
      },
    },
    '/api/leads/{id}': {
      get: {
        tags: ['Leads'], summary: 'รายละเอียด lead',
        description: 'lead + โน้ต + งานติดตาม + requirement / shortlist / นัดชม ที่ผูกอยู่ · ก่อนหน้านี้ไม่มี endpoint นี้ หน้าจอจึงเขียน timeline กับงานติดตามไว้ตายตัว',
        parameters: [pathParam('id', 'id ของ lead')],
        responses: { 200: okRes('รายละเอียด lead'), ...WITH_404 },
      },
      patch: {
        tags: ['Leads'], summary: 'เปลี่ยนสถานะ / มอบหมาย agent',
        description: 'pipeline เดินหน้าอย่างเดียว — ถอยกลับได้เฉพาะ owner/manager',
        parameters: [pathParam('id', 'id ของ lead')],
        requestBody: body(obj({ status: STR, assigneeId: NULLABLE_STR }, [])),
        responses: { 200: okRes('อัปเดตแล้ว', ref('Lead')), ...WITH_404 },
      },
    },
    '/api/leads/{id}/notes': {
      get: {
        tags: ['Leads'], summary: 'บันทึกทั้งหมดของ lead',
        parameters: [pathParam('id', 'id ของ lead')],
        responses: { 200: okRes('รายการบันทึก', items({ type: 'object' })), ...WITH_404 },
      },
      post: {
        tags: ['Leads'], summary: 'เพิ่มบันทึก',
        parameters: [pathParam('id', 'id ของ lead')],
        requestBody: body(obj({ text: STR }, ['text'])),
        responses: { 200: okRes('เพิ่มแล้ว'), ...WITH_404 },
      },
    },
    '/api/leads/{id}/tasks': {
      get: {
        tags: ['Leads'], summary: 'งานติดตามของ lead',
        parameters: [pathParam('id', 'id ของ lead')],
        responses: { 200: okRes('รายการงาน', items({ type: 'object' })), ...WITH_404 },
      },
      post: {
        tags: ['Leads'], summary: 'เพิ่มงานติดตาม',
        parameters: [pathParam('id', 'id ของ lead')],
        requestBody: body(obj({ title: STR, due: STR }, ['title'])),
        responses: { 200: okRes('เพิ่มแล้ว'), ...WITH_404 },
      },
      patch: {
        tags: ['Leads'], summary: 'ติ๊กงานเสร็จ / เปลี่ยนชื่องาน',
        description: 'ก่อนหน้านี้ไม่มี — ช่องติ๊กบนหน้าจอจึงเป็นแค่การตกแต่ง ติ๊กแล้วหายเมื่อ refresh',
        parameters: [pathParam('id', 'id ของ lead')],
        requestBody: body(obj({ taskId: STR, done: BOOL, title: STR }, ['taskId'])),
        responses: { 200: okRes('อัปเดตแล้ว'), ...WITH_404 },
      },
      delete: {
        tags: ['Leads'], summary: 'ลบงานติดตาม',
        parameters: [pathParam('id', 'id ของ lead'), queryParam('taskId', 'id ของงาน')],
        responses: { 200: okRes('ลบแล้ว'), ...WITH_404 },
      },
    },
    '/api/leads/{id}/reveal-contact': {
      post: {
        tags: ['Leads'], summary: 'ขอดูเบอร์/อีเมลเต็ม',
        description: 'ต้องมีสิทธิ์ pii · ทุกครั้งที่เรียกจะถูกบันทึกลง audit log ตาม PDPA ม.37',
        parameters: [pathParam('id', 'id ของ lead')],
        responses: { 200: okRes('ข้อมูลติดต่อเต็ม', obj({ phone: STR, email: STR })), ...WITH_404 },
      },
    },

    /* ---------------- Pipeline ---------------- */
    '/api/shortlists': {
      get: { tags: ['Pipeline'], summary: 'รายการ shortlist', responses: { 200: okRes('รายการ', items({ type: 'object' })), ...AUTH_ERRORS } },
      post: {
        tags: ['Pipeline'], summary: 'สร้าง shortlist + ลิงก์ token ให้ลูกค้า',
        requestBody: body(obj({ name: STR, leadId: STR, codes: arrayOf(STR) }, ['codes'])),
        responses: { 201: okRes('สร้างแล้ว', obj({ id: STR, token: STR, url: STR })), ...AUTH_ERRORS },
      },
    },
    '/api/shortlists/{id}': {
      get: {
        tags: ['Pipeline'], summary: 'shortlist รายตัว พร้อมสถานะว่างของแต่ละทรัพย์',
        parameters: [pathParam('id', 'id ของ shortlist')],
        responses: { 200: okRes('รายละเอียด'), ...WITH_404 },
      },
      patch: {
        tags: ['Pipeline'], summary: 'ส่งให้ลูกค้า / จัดลำดับ / แก้โน้ต / เพิ่ม-ลบทรัพย์',
        description: 'ส่ง (status=sent) จะถูกปฏิเสธด้วย AVAILABILITY_REQUIRED ถ้ามีทรัพย์ที่ไม่ว่างแล้ว (FR-AVL-04)',
        parameters: [pathParam('id', 'id ของ shortlist')],
        requestBody: body(obj({
          status: { ...STR, enum: ['open', 'sent', 'closed'] },
          order: arrayOf(STR), notes: { type: 'object', additionalProperties: STR },
          addCodes: arrayOf(STR), removeIds: arrayOf(STR),
        }, [])),
        responses: { 200: okRes('อัปเดตแล้ว'), ...WITH_404 },
      },
    },
    '/api/visits': {
      get: { tags: ['Pipeline'], summary: 'แผนการเข้าชมทั้งหมด', responses: { 200: okRes('รายการ', items({ type: 'object' })), ...AUTH_ERRORS } },
      post: {
        tags: ['Pipeline'], summary: 'สร้างแผนการเข้าชม',
        requestBody: body(obj({ leadId: STR, date: STR, codes: arrayOf(STR), note: STR }, ['date', 'codes'])),
        responses: { 201: okRes('สร้างแล้ว', obj({ id: STR })), ...AUTH_ERRORS },
      },
    },
    '/api/visits/{id}': {
      patch: {
        tags: ['Pipeline'], summary: 'ยืนยันสถานะว่าง / ปิดแผน / บันทึกผลรายทรัพย์',
        description: 'ปิดแผน (status=done) ต้องยืนยัน gate ก่อน ไม่งั้นได้ AVAILABILITY_REQUIRED',
        parameters: [pathParam('id', 'id ของแผน')],
        requestBody: body(obj({ gateConfirmed: BOOL, status: STR, note: STR, outcomes: { type: 'object', additionalProperties: STR } }, [])),
        responses: { 200: okRes('อัปเดตแล้ว'), ...WITH_404 },
      },
    },
    '/api/deals': {
      get: { tags: ['Pipeline'], summary: 'รายการดีล', responses: { 200: okRes('รายการ', items({ type: 'object' })), ...AUTH_ERRORS } },
      post: {
        tags: ['Pipeline'], summary: 'สร้างดีล',
        requestBody: body(obj({ title: STR, leadId: STR, propertyCode: STR, amount: NUM }, ['title'])),
        responses: { 201: okRes('สร้างแล้ว', obj({ id: STR })), ...AUTH_ERRORS },
      },
    },
    '/api/deals/{id}': {
      patch: {
        tags: ['Pipeline'], summary: 'แก้ไข / ปิดดีล / ปลดล็อก',
        description: 'ปิดดีลจะล็อกฟิลด์การเงิน (FR-DEA-05) · ปลดล็อกต้องมีสิทธิ์ deal_unlock พร้อมเหตุผล และถูกบันทึก audit เสมอ',
        parameters: [pathParam('id', 'id ของดีล')],
        requestBody: body(obj({
          status: { ...STR, enum: ['negotiating', 'won', 'lost'] },
          amount: NUM, note: STR, unlock: BOOL, reason: STR,
        }, [])),
        responses: { 200: okRes('อัปเดตแล้ว'), ...WITH_404 },
      },
    },
    '/api/deals/{id}/offers': {
      get: {
        tags: ['Pipeline'], summary: 'ไทม์ไลน์ข้อเสนอ',
        parameters: [pathParam('id', 'id ของดีล')],
        responses: { 200: okRes('รายการข้อเสนอ', items({ type: 'object' })), ...WITH_404 },
      },
      post: {
        tags: ['Pipeline'], summary: 'บันทึกข้อเสนอใหม่',
        description: 'ถูกปฏิเสธด้วย DEAL_LOCKED ถ้าดีลปิดแล้ว',
        parameters: [pathParam('id', 'id ของดีล')],
        requestBody: body(obj({ side: { ...STR, enum: ['ฝั่งลูกค้า', 'ฝั่งเจ้าของ', 'ตกลง'] }, amount: STR, terms: STR }, ['amount'])),
        responses: { 201: okRes('บันทึกแล้ว'), ...WITH_404 },
      },
    },

    /* ---------------- Leases & notifications ---------------- */
    '/api/leases': {
      get: {
        tags: ['Leases'], summary: 'สัญญาเช่า',
        parameters: [queryParam('status', 'active (ค่าเริ่มต้น) หรือ all')],
        responses: { 200: okRes('รายการสัญญา', items({ type: 'object' })), ...AUTH_ERRORS },
      },
    },
    '/api/notify-config': {
      get: {
        tags: ['Leases'], summary: 'เกณฑ์แจ้งเตือน + รายการที่อ่านแล้ว',
        description: 'เกณฑ์เดือนเป็นค่าระดับองค์กร ส่วน readIds เป็นของผู้ใช้แต่ละคน',
        responses: { 200: okRes('ค่าตั้ง'), ...AUTH_ERRORS },
      },
      put: {
        tags: ['Leases'], summary: 'บันทึกเกณฑ์แจ้งเตือน (owner / manager / ops)',
        requestBody: body(obj({ enabled: BOOL, months: arrayOf(INT), includeExpired: BOOL }, ['enabled'])),
        responses: { 200: okRes('บันทึกแล้ว'), ...AUTH_ERRORS },
      },
    },
    '/api/notifications/read': {
      post: {
        tags: ['Leases'], summary: 'ทำเครื่องหมายว่าอ่านแล้ว',
        requestBody: body(obj({ ids: arrayOf(STR) }, ['ids'])),
        responses: { 200: okRes('บันทึกแล้ว', obj({ readIds: arrayOf(STR) })), ...AUTH_ERRORS },
      },
    },

    /* ---------------- Media ---------------- */
    '/api/media': {
      get: { tags: ['Media'], summary: 'รายการไฟล์ในคลัง', responses: { 200: okRes('รายการไฟล์', obj({ items: arrayOf(ref('MediaAsset')), totalBytes: INT })), ...AUTH_ERRORS } },
      post: {
        tags: ['Media'], summary: 'อัปโหลดไฟล์ + เลือกลายน้ำ',
        description: 'ต้นฉบับถูกเก็บแยก และ src ที่คืนมาคือไฟล์ที่ใส่ลายน้ำแล้ว (FR-ADM-09) · สูงสุด 10MB',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: obj({
                file: { type: 'string', format: 'binary' },
                watermarkType: { ...STR, enum: ['none', 'corner', 'tiled'] },
              }, ['file']),
            },
          },
        },
        responses: { 200: okRes('อัปโหลดแล้ว', ref('MediaAsset')), ...AUTH_ERRORS },
      },
    },
    '/api/media/{id}': {
      delete: {
        tags: ['Media'], summary: 'ลบไฟล์ (owner / manager)',
        parameters: [pathParam('id', 'id ของไฟล์')],
        responses: { 200: okRes('ลบแล้ว', obj({ ok: BOOL })), ...WITH_404 },
      },
    },
    '/api/media/{id}/raw': {
      get: {
        tags: ['Media'], summary: 'ดาวน์โหลดไฟล์', ...PUBLIC,
        description: 'คืนไฟล์ที่ใส่ลายน้ำแล้วเสมอ · ต้นฉบับต้องใช้ ?original=1 และต้องมี session',
        parameters: [pathParam('id', 'id ของไฟล์'), queryParam('original', 'ใส่ 1 เพื่อขอไฟล์ต้นฉบับ (ต้องล็อกอิน)')],
        responses: {
          200: { description: 'ไฟล์', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } },
          401: errRes('ขอต้นฉบับโดยไม่ได้ล็อกอิน'),
          404: errRes('ไม่พบไฟล์'),
        },
      },
    },

    /* ---------------- Content ---------------- */
    '/api/cms': {
      get: {
        tags: ['Content'], summary: 'เนื้อหา CMS + จำนวนต่อหมวด',
        parameters: [queryParam('kind', 'pages | articles | faq | certs')],
        responses: { 200: okRes('รายการเนื้อหา'), ...AUTH_ERRORS },
      },
      post: {
        tags: ['Content'], summary: 'สร้างเนื้อหาใหม่ (owner / marketing)',
        requestBody: body(obj({ kind: STR, title: STR, slug: STR, category: STR }, ['title'])),
        responses: { 201: okRes('สร้างแล้ว', obj({ id: STR, slug: STR })), ...AUTH_ERRORS },
      },
    },
    '/api/cms/{id}': {
      put: {
        tags: ['Content'], summary: 'บันทึกร่าง / เผยแพร่เนื้อหา',
        description: 'เผยแพร่ต้องมีสิทธิ์ publish · เนื้อหาเก็บแยกตามภาษา (th / en / zh)',
        parameters: [pathParam('id', 'id ของเนื้อหา')],
        requestBody: body(obj({ lang: { ...STR, enum: ['th', 'en', 'zh'] }, title: STR, body: STR, category: STR, slug: STR, cover: NULLABLE_STR, links: arrayOf(STR), status: STR }, [])),
        responses: { 200: okRes('บันทึกแล้ว'), ...WITH_404 },
      },
      delete: {
        tags: ['Content'], summary: 'ลบเนื้อหา',
        description: 'owner + marketing เท่านั้น · หน้าหลัก (pages: home / about / contact) ลบไม่ได้ เพราะเป็นแถวข้อมูลของหน้าที่มีคอมโพเนนต์ของตัวเอง',
        parameters: [pathParam('id', 'id ของเนื้อหา')],
        responses: { 200: okRes('ลบแล้ว'), ...WITH_404, 400: errRes('ลบหน้าหลักของเว็บไม่ได้') },
      },
    },
    /* Flow B (SPEC_PACK §3.6). Until this release the stage had no table and no
       routes at all — the screen was a mock-up. */
    '/api/requirements': {
      get: {
        tags: ['Pipeline'], summary: 'คิว requirement',
        description: 'กรองตามสถานะ และค้นด้วยรหัส / ชื่อ / บริษัท · counts นับจากตารางจริง',
        parameters: [
          queryParam('status', 'submitted | confirmed | shortlisted | cancelled'),
          queryParam('q', 'รหัส REQ- หรือชื่อลูกค้า/บริษัท'),
        ],
        responses: { 200: okRes('รายการ requirement + counts ต่อสถานะ'), ...AUTH_ERRORS },
      },
      post: {
        tags: ['Pipeline'], summary: 'สร้าง requirement ให้ lead',
        description: 'สำหรับความต้องการที่รับมาทางโทรศัพท์ · ฟอร์มหน้าเว็บสร้างให้เองอยู่แล้ว',
        requestBody: body(obj({
          leadId: STR, dealIntent: STR, typeKey: STR, usage: STR,
          areaMin: INT, areaMax: INT, budgetMin: INT, budgetMax: INT,
          moveIn: STR, needsRor4: BOOL, nearPort: BOOL, pollution: STR, note: STR,
          locations: arrayOf(STR),
        }, ['leadId'])),
        responses: { 201: okRes('สร้างแล้ว'), ...WITH_404 },
      },
    },
    '/api/requirements/{id}': {
      get: {
        tags: ['Pipeline'], summary: 'รายละเอียด requirement',
        description: 'รวมผลเช็คความว่างที่บันทึกไว้ และ shortlist ที่สร้างจาก requirement นี้',
        parameters: [pathParam('id', 'id ของ requirement')],
        responses: { 200: okRes('รายละเอียด'), ...WITH_404 },
      },
      patch: {
        tags: ['Pipeline'], summary: 'แก้เกณฑ์ / ยืนยัน / ยกเลิก / เปิดใหม่',
        description: 'action=confirm เลื่อน lead เป็น requirements_confirmed อัตโนมัติ · action=cancel ต้องระบุทั้งข้อที่เป็นปัญหาและเหตุผล (FR-CRM-07)',
        parameters: [pathParam('id', 'id ของ requirement')],
        requestBody: body(obj({
          action: { ...STR, enum: ['confirm', 'cancel', 'reopen'] },
          cancelField: STR, cancelReason: STR,
          dealIntent: STR, typeKey: STR, usage: STR,
          areaMin: INT, areaMax: INT, budgetMin: INT, budgetMax: INT,
          moveIn: STR, needsRor4: BOOL, nearPort: BOOL, pollution: STR, note: STR,
          locations: arrayOf(STR),
        }, [])),
        responses: { 200: okRes('อัปเดตแล้ว'), ...WITH_404 },
      },
      delete: {
        tags: ['Pipeline'], summary: 'ลบ requirement',
        description: 'owner + manager · ลบไม่ได้ถ้าสร้าง shortlist จาก requirement นี้ไปแล้ว — ใช้ยกเลิกแทน',
        parameters: [pathParam('id', 'id ของ requirement')],
        responses: { 200: okRes('ลบแล้ว'), ...WITH_404 },
      },
    },
    '/api/requirements/{id}/checks': {
      post: {
        tags: ['Pipeline'], summary: 'บันทึกผลเช็คความว่างกับเจ้าของทรัพย์',
        description: 'หนึ่งแถวต่อทรัพย์ต่อ requirement — เช็คซ้ำทับของเดิม (FR-AVL-04)',
        parameters: [pathParam('id', 'id ของ requirement')],
        requestBody: body(obj({ code: STR, result: { ...STR, enum: ['available', 'unavailable'] }, note: STR }, ['code', 'result'])),
        responses: { 200: okRes('บันทึกแล้ว'), ...WITH_404 },
      },
      delete: {
        tags: ['Pipeline'], summary: 'เอาทรัพย์ออกจากรายการที่เช็ค',
        parameters: [pathParam('id', 'id ของ requirement'), queryParam('code', 'รหัสทรัพย์')],
        responses: { 200: okRes('เอาออกแล้ว'), ...WITH_404 },
      },
    },
    '/api/requirements/{id}/shortlist': {
      post: {
        tags: ['Pipeline'], summary: 'สร้าง shortlist จากทรัพย์ที่ผ่านเงื่อนไขว่าง',
        description: 'ประตู FR-AVL-04 บังคับที่ server: เข้าได้เฉพาะทรัพย์ที่ผลเช็คล่าสุด = available และยัง active อยู่ · สำเร็จแล้วเลื่อน lead เป็น shortlisted',
        parameters: [pathParam('id', 'id ของ requirement')],
        requestBody: body(obj({ name: STR }, [])),
        responses: {
          201: okRes('สร้าง shortlist แล้ว'),
          ...WITH_404,
          400: errRes('ยังไม่มีทรัพย์ที่เช็คแล้วว่าว่าง'),
        },
      },
    },
    '/api/nav-counts': {
      get: {
        tags: ['Admin'], summary: 'ตัวเลขบนเมนู',
        description: 'lead ที่ยังไม่ได้แตะ และ requirement ที่รอตรวจสอบ — เคยเป็นเลขตายตัว 18 กับ 7',
        responses: { 200: okRes('{ leads, requirements }'), ...AUTH_ERRORS },
      },
    },
    '/api/sections': {
      get: {
        tags: ['Content'], summary: 'Section ของหน้าเว็บ',
        description: 'ตารางเดียวกันที่ทั้ง Page Builder และหน้า Sections ใช้',
        parameters: [queryParam('page', 'home | about | contact')],
        responses: { 200: okRes('รายการ section', items({ type: 'object' })), ...AUTH_ERRORS },
      },
      put: {
        tags: ['Content'], summary: 'บันทึก section ทั้งหน้า (ลำดับใน array = ลำดับที่แสดง)',
        requestBody: body(obj({ page: STR, sections: arrayOf({ type: 'object' }) }, ['page', 'sections'])),
        responses: { 200: okRes('บันทึกแล้ว'), ...AUTH_ERRORS },
      },
    },
    '/api/company': {
      get: { tags: ['Content'], summary: 'ข้อมูลติดต่อของบริษัท', ...PUBLIC, responses: { 200: okRes('ที่อยู่ เบอร์ อีเมล เวลาทำการ') } },
      put: {
        tags: ['Content'], summary: 'บันทึกข้อมูลบริษัท (owner / marketing)',
        description: 'ที่อยู่ / ที่อยู่แบบสั้น / วันทำการ เป็นอ็อบเจ็กต์ { th, en, zh } · phones เป็นรายการ { number, label } สูงสุด 6 รายการ',
        requestBody: body(obj({ legalName: STR, address: STR, shortLocation: STR, phones: STR, salesEmail: STR, generalEmail: STR, hoursDays: STR, hoursValue: STR })),
        responses: { 200: okRes('บันทึกแล้ว'), ...AUTH_ERRORS },
      },
    },
    '/api/branding': {
      get: { tags: ['Content'], summary: 'ธีมของ tenant', ...PUBLIC, responses: { 200: okRes('ค่าธีม') } },
      put: {
        tags: ['Content'], summary: 'บันทึกธีม (owner / marketing)',
        description: 'รหัสสีต้องเป็นรูปแบบ #RRGGBB เท่านั้น',
        requestBody: body(obj({ brandName: STR, primary: STR, accent: STR, neon: STR, pine: STR, font: STR, radius: STR, logo: NULLABLE_STR }, [])),
        responses: { 200: okRes('บันทึกแล้ว'), ...AUTH_ERRORS },
      },
    },
    '/api/seo': {
      get: { tags: ['Content'], summary: 'สถานะบริการ SEO + ไฟล์ที่อัปโหลด', responses: { 200: okRes('สถานะ'), ...AUTH_ERRORS } },
      put: {
        tags: ['Content'], summary: 'เปิด / ปิดบริการ',
        requestBody: body(obj({ subscribed: BOOL }, ['subscribed'])),
        responses: { 200: okRes('บันทึกแล้ว'), ...AUTH_ERRORS },
      },
    },
    '/api/seo/files/{key}': {
      post: {
        tags: ['Content'], summary: 'อัปโหลด llms.txt / robots.txt',
        description: 'รับเฉพาะ .txt ขนาดไม่เกิน 1MB · เสิร์ฟที่ /llms.txt และ /robots.txt',
        parameters: [pathParam('key', 'llms | robots')],
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: obj({ file: { type: 'string', format: 'binary' } }, ['file']) } },
        },
        responses: { 200: okRes('อัปโหลดแล้ว'), ...AUTH_ERRORS },
      },
      delete: {
        tags: ['Content'], summary: 'ลบไฟล์',
        parameters: [pathParam('key', 'llms | robots')],
        responses: { 200: okRes('ลบแล้ว', obj({ ok: BOOL })), ...AUTH_ERRORS },
      },
    },

    /* ---------------- Config ---------------- */
    '/api/field-schema': {
      get: {
        tags: ['Config'], summary: 'override ของ field schema ทุกประเภท',
        responses: { 200: okRes('override ต่อ typeKey'), ...AUTH_ERRORS },
      },
    },
    '/api/field-schema/{typeKey}': {
      put: {
        tags: ['Config'], summary: 'บันทึก Field Builder (owner / ops)',
        description: 'ฟิลด์ที่ required ปิดไม่ได้ · key ของฟิลด์ที่เพิ่มเองออกโดย server เพื่อไม่ให้ชนกัน',
        parameters: [pathParam('typeKey', 'ประเภททรัพย์ เช่น warehouse')],
        requestBody: body(obj({ disabled: arrayOf(STR), order: arrayOf(STR), extra: arrayOf({ type: 'object' }) }, [])),
        responses: { 200: okRes('บันทึกแล้ว'), ...WITH_404 },
      },
    },
    '/api/property-types/config': {
      get: { tags: ['Config'], summary: 'ประเภททรัพย์ที่ปิดอยู่', ...PUBLIC, description: 'ฟอร์มหน้าเว็บต้องอ่านค่านี้ จึงเปิดให้เรียกได้โดยไม่ล็อกอิน', responses: { 200: okRes('รายการที่ปิด') } },
      put: {
        tags: ['Config'], summary: 'เปิด / ปิดประเภททรัพย์ (owner)',
        description: 'ต้องเหลือเปิดอย่างน้อย 1 ประเภท',
        requestBody: body(obj({ disabled: arrayOf(STR) }, ['disabled'])),
        responses: { 200: okRes('บันทึกแล้ว'), ...AUTH_ERRORS },
      },
    },
    '/api/geography': {
      get: { tags: ['Config'], summary: 'จังหวัด / อำเภอ / ตำบล / นิคม', responses: { 200: okRes('ผังพื้นที่'), ...AUTH_ERRORS } },
      post: {
        tags: ['Config'], summary: 'เพิ่มพื้นที่ (owner / ops)',
        requestBody: body(obj({ level: { ...STR, enum: ['prov', 'dist', 'sub', 'zone'] }, th: STR, en: STR, code: STR, parent: STR, type: STR }, ['level', 'th'])),
        responses: { 200: okRes('เพิ่มแล้ว', obj({ id: STR })), ...AUTH_ERRORS },
      },
    },
    '/api/social': {
      get: { tags: ['Config'], summary: 'ช่องทางลงประกาศ + สถานะรายประกาศ', responses: { 200: okRes('สถานะ social'), ...AUTH_ERRORS } },
    },
    '/api/social/{code}': {
      put: {
        tags: ['Config'], summary: 'บันทึกสถานะ + caption ของประกาศ',
        description: 'ส่ง text เป็น null เพื่อกลับไปใช้ข้อความอัตโนมัติ · ไม่เขียนย้อนกลับไปที่ข้อมูลทรัพย์',
        parameters: [pathParam('code', 'public_code ของประกาศ')],
        requestBody: body(obj({ text: NULLABLE_STR, channels: { type: 'object' } }, [])),
        responses: { 200: okRes('บันทึกแล้ว', obj({ ok: BOOL })), ...AUTH_ERRORS },
      },
    },
    '/api/social/channels': {
      post: {
        tags: ['Config'], summary: 'เพิ่มช่องทาง',
        requestBody: body(obj({ key: STR, label: STR }, ['key', 'label'])),
        responses: { 200: okRes('เพิ่มแล้ว'), ...AUTH_ERRORS },
      },
      delete: {
        tags: ['Config'], summary: 'ลบช่องทาง',
        description: 'ลบสถานะของช่องนั้นออกจากทุกประกาศด้วย ไม่ให้เหลือข้อมูลกำพร้า',
        parameters: [queryParam('key', 'key ของช่องทาง')],
        responses: { 200: okRes('ลบแล้ว', obj({ ok: BOOL })), ...AUTH_ERRORS },
      },
    },

    /* ---------------- Admin ---------------- */
    '/api/users': {
      get: { tags: ['Admin'], summary: 'รายชื่อผู้ใช้ (owner เท่านั้น)', responses: { 200: okRes('รายชื่อ', items(ref('UserPermissions'))), ...AUTH_ERRORS } },
    },
    '/api/users/invite': {
      post: {
        tags: ['Admin'], summary: 'เชิญผู้ใช้ใหม่ (owner)',
        description: 'ยังไม่มีระบบส่งอีเมล — คืนรหัสผ่านชั่วคราวมาครั้งเดียว และบัญชีจะใช้งานไม่ได้จนกว่าเจ้าตัวจะตั้งรหัสเอง',
        requestBody: body(obj({ email: STR, name: STR, role: STR, expiresAt: STR }, ['email', 'role'])),
        responses: { 201: okRes('สร้างแล้ว', obj({ id: STR, email: STR, tempPassword: STR })), ...AUTH_ERRORS },
      },
    },
    '/api/users/{id}/permissions': {
      put: {
        tags: ['Admin'], summary: 'ตั้งสิทธิ์ผู้ใช้ (owner)',
        description: 'server ตรวจซ้ำทั้ง FORBIDDEN_PRIVS, scope ที่ล็อกไว้ และวันหมดอายุของบทบาทภายนอก',
        parameters: [pathParam('id', 'id ของผู้ใช้')],
        requestBody: body(obj({ role: STR, scope: STR, privileges: arrayOf(STR), expiresAt: STR }, ['role'])),
        responses: { 200: okRes('บันทึกแล้ว'), ...WITH_404 },
      },
    },
    '/api/users/{id}/status': {
      patch: {
        tags: ['Admin'], summary: 'เปิด / ปิดใช้งานผู้ใช้ (owner)',
        description: 'ปิดใช้งานจะเตะ session ของผู้ใช้นั้นทันที · ปิดบัญชีตัวเองไม่ได้',
        parameters: [pathParam('id', 'id ของผู้ใช้')],
        requestBody: body(obj({ active: BOOL }, [])),
        responses: { 200: okRes('อัปเดตแล้ว'), ...WITH_404 },
      },
    },
    '/api/audit': {
      get: {
        tags: ['Admin'], summary: 'Audit log (ต้องมีสิทธิ์ audit)',
        parameters: [queryParam('entity', 'กรองตาม entity'), queryParam('limit', 'สูงสุด 200', INT)],
        responses: { 200: okRes('รายการ log', items({ type: 'object' })), ...AUTH_ERRORS },
      },
    },
    '/api/dashboard': {
      get: {
        tags: ['Admin'], summary: 'ตัวเลขสรุปหน้า Dashboard',
        description: 'ทุกตัวเลขเคารพ scope ของผู้เรียก · กิจกรรมล่าสุดคืนเฉพาะผู้ที่มีสิทธิ์ audit',
        responses: { 200: okRes('ข้อมูล dashboard'), ...AUTH_ERRORS },
      },
    },
  },
};

export type OpenApiDoc = typeof openapi;
