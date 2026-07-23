import type {
  CancelledField,
  LeadStatus,
  OperationType,
  RequirementStatus,
  SourceChannel,
} from '@jkp/domain';

/** Thai labels for admin enums (admin is single-language). Shared so screens agree. */

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'ใหม่',
  qualified: 'คัดกรองแล้ว',
  profile_received: 'ได้รับโปรไฟล์',
  requirements_confirmed: 'ยืนยันความต้องการ',
  shortlisted: 'ส่ง Shortlist',
  visit_scheduled: 'นัดเข้าชม',
  negotiating: 'กำลังเจรจา',
  won: 'ปิดสำเร็จ',
  lost: 'ไม่สำเร็จ',
};

/** StatusChip tone per lead status (icon+text, never color-only). */
export const LEAD_STATUS_TONE: Record<
  LeadStatus,
  'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
> = {
  new: 'info',
  qualified: 'info',
  profile_received: 'info',
  requirements_confirmed: 'brand',
  shortlisted: 'brand',
  visit_scheduled: 'warning',
  negotiating: 'warning',
  won: 'success',
  lost: 'danger',
};

export const SOURCE_LABEL: Record<SourceChannel, string> = {
  website_form: 'ฟอร์มเว็บ',
  line: 'Line',
  wechat: 'WeChat',
  whatsapp: 'WhatsApp',
  phone: 'โทรศัพท์',
  referral: 'แนะนำ',
};

export const REQUIREMENT_STATUS_LABEL: Record<RequirementStatus, string> = {
  draft: 'ร่าง',
  submitted: 'รอตรวจสอบ',
  confirmed: 'ยืนยันแล้ว',
  cancelled: 'ยกเลิก',
};

export const OPERATION_LABEL: Record<OperationType, string> = {
  manufacturing: 'การผลิต',
  assembly: 'ประกอบ',
  storage: 'จัดเก็บ/คลังสินค้า',
  logistics: 'โลจิสติกส์',
};

export const CANCELLED_FIELD_LABEL: Record<CancelledField, string> = {
  budget: 'งบประมาณ',
  size: 'ขนาด',
  location: 'ทำเล',
  license: 'ใบอนุญาต',
  timeline: 'ระยะเวลา',
  other: 'อื่นๆ',
};
