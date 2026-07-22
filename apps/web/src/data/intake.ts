import { z } from 'zod';
import { LOCALES, OPERATION_TYPE, PROPERTY_TYPE, TRANSACTION_TYPE } from '@jkp/domain';
import type { ApiError } from '@jkp/api-client';

/**
 * Intake contracts (FR-INQ-01/02/04). ONE zod schema per channel, shared by the
 * client form (react-hook-form + zodResolver) and the server route handler, so
 * validation can never drift. Error `message`s are stable CODES (not prose) that
 * the UI maps to i18n via the `errors` namespace (NFR-04, no hardcoded copy).
 */

const emailField = z.union([z.string().trim().email('email'), z.literal('')]).optional();
const phoneField = z.string().trim().max(40).optional();
const shortText = (max: number) => z.string().trim().max(max).optional();
const numNullable = z.number().nonnegative().nullable().optional();

function rangeOk(min: number | null | undefined, max: number | null | undefined): boolean {
  return min == null || max == null || min <= max;
}
function moveInOk(date: string | null | undefined): boolean {
  if (!date) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  return !Number.isNaN(d.getTime()) && d >= today;
}
function hasContact(d: { email?: string; phone?: string }): boolean {
  return Boolean((d.email && d.email.length) || (d.phone && d.phone.length));
}

/* ---- A1/A2: contact + listing-bound inquiry (FR-INQ-01) ---- */
export const contactInquirySchema = z
  .object({
    name: z.string().trim().min(1, 'required').max(120),
    email: emailField,
    phone: phoneField,
    subject: shortText(160),
    message: z.string().trim().min(1, 'required').max(2000),
    listingId: z.string().optional(),
    publicCode: z.string().optional(),
    locale: z.enum(LOCALES),
    sourceChannel: z.enum(['contact_page', 'listing_inquiry']),
    hp: z.string().optional(), // honeypot (handled in route)
  })
  .refine(hasContact, { message: 'contact_required', path: ['email'] });

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;

/* ---- A3: requirement wizard (FR-INQ-02) ---- */
export const requirementSchema = z
  .object({
    // Step 1 — needs
    operationType: z.enum(OPERATION_TYPE).nullable().optional(),
    propertyType: z.enum(PROPERTY_TYPE).nullable().optional(),
    transactionType: z.enum(TRANSACTION_TYPE).nullable().optional(),
    needFactoryLicense: z.boolean().default(false),
    sizeMin: numNullable,
    sizeMax: numNullable,
    rentMin: numNullable,
    rentMax: numNullable,
    saleMin: numNullable,
    saleMax: numNullable,
    moveInDate: z.string().nullable().optional(),
    nearPort: z.boolean().default(false),
    nearAirport: z.boolean().default(false),
    nearBangkok: z.boolean().default(false),
    locations: z
      .array(z.object({ province: z.string().min(1), priority: z.number().int().min(1) }))
      .min(1, 'min_one_location')
      .max(5),
    notes: shortText(2000),
    // Step 2 — company
    companyName: z.string().trim().min(1, 'required').max(200),
    registrationCountry: shortText(100),
    website: shortText(200),
    businessType: shortText(200),
    // Step 3 — contact
    contactName: z.string().trim().min(1, 'required').max(120),
    email: emailField,
    phone: phoneField,
    locale: z.enum(LOCALES),
    sourceChannel: z.literal('requirement_form'),
    hp: z.string().optional(),
  })
  .refine(hasContact, { message: 'contact_required', path: ['email'] })
  .refine((d) => rangeOk(d.sizeMin, d.sizeMax), { message: 'min_gt_max', path: ['sizeMax'] })
  .refine((d) => rangeOk(d.rentMin, d.rentMax), { message: 'min_gt_max', path: ['rentMax'] })
  .refine((d) => rangeOk(d.saleMin, d.saleMax), { message: 'min_gt_max', path: ['saleMax'] })
  .refine((d) => moveInOk(d.moveInDate), { message: 'date_past', path: ['moveInDate'] });

export type RequirementInput = z.infer<typeof requirementSchema>;

/** Map zod issues → API envelope errors[] (field-mapped for the form). */
export function zodIssuesToApiErrors(error: z.ZodError): ApiError[] {
  return error.issues.map((issue) => ({
    code: issue.message,
    message: issue.message,
    ...(issue.path.length ? { field: issue.path.join('.') } : {}),
  }));
}
