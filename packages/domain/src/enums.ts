/**
 * Locked enums — MUST match SPEC_PACK Part 6 (STATUS_ENUMS) exactly.
 * Do NOT invent values outside these sets. The API/DB is the authoritative
 * source; the frontend mirrors these for type-safety and UI rendering.
 */

/** 8 locked status enums */
export const LEAD_STATUS = [
  'new',
  'qualified',
  'profile_received',
  'requirements_confirmed',
  'shortlisted',
  'visit_scheduled',
  'negotiating',
  'won',
  'lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const LISTING_STATUS = [
  'draft',
  'review',
  'published',
  'hidden',
  'unavailable',
  'archived',
] as const;
export type ListingStatus = (typeof LISTING_STATUS)[number];

export const REQUIREMENT_STATUS = ['draft', 'submitted', 'confirmed', 'cancelled'] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUS)[number];

export const SHORTLIST_STATUS = [
  'draft',
  'internal_review',
  'sent',
  'client_reviewed',
  'closed',
] as const;
export type ShortlistStatus = (typeof SHORTLIST_STATUS)[number];

export const VISIT_PLAN_STATUS = [
  'planning',
  'confirming',
  'confirmed',
  'completed',
  'cancelled',
] as const;
export type VisitPlanStatus = (typeof VISIT_PLAN_STATUS)[number];

export const NEGOTIATION_STAGE = [
  'open',
  'offer_submitted',
  'counter_offer',
  'documentation',
  'contract_review',
  'closed_won',
  'closed_lost',
] as const;
export type NegotiationStage = (typeof NEGOTIATION_STAGE)[number];

export const DEAL_STATUS = ['open', 'document_pending', 'signed', 'closed', 'cancelled'] as const;
export type DealStatus = (typeof DEAL_STATUS)[number];

export const OPERATION_TYPE = ['manufacturing', 'assembly', 'storage', 'logistics'] as const;
export type OperationType = (typeof OPERATION_TYPE)[number];

/** Value sets (string columns in the ERD) */
export const MAP_VISIBILITY_LEVEL = ['exact', 'subdistrict', 'district', 'province'] as const;
export type MapVisibilityLevel = (typeof MAP_VISIBILITY_LEVEL)[number];

export const TRANSACTION_TYPE = ['rent', 'sale', 'both'] as const;
export type TransactionType = (typeof TRANSACTION_TYPE)[number];

export const PROPERTY_TYPE = ['warehouse', 'factory', 'land', 'mixed'] as const;
export type PropertyType = (typeof PROPERTY_TYPE)[number];

export const ZONE_TYPE = [
  'industrial_estate',
  'free_zone',
  'IEAT',
  'general_zone',
  'purple_zone',
] as const;
export type ZoneType = (typeof ZONE_TYPE)[number];

export const CLIENT_INTEREST_STATUS = ['interested', 'not_interested', 'undecided'] as const;
export type ClientInterestStatus = (typeof CLIENT_INTEREST_STATUS)[number];

export const AVAILABILITY_RESULT = ['available', 'unavailable', 'pending_landlord'] as const;
export type AvailabilityResult = (typeof AVAILABILITY_RESULT)[number];

export const WATERMARK_TYPE = ['style_1', 'style_2'] as const;
export type WatermarkType = (typeof WATERMARK_TYPE)[number];

export const MEDIA_TYPE = ['image', 'video', 'floorplan', 'document'] as const;
export type MediaType = (typeof MEDIA_TYPE)[number];

export const CANCELLED_FIELD = [
  'budget',
  'size',
  'location',
  'license',
  'timeline',
  'other',
] as const;
export type CancelledField = (typeof CANCELLED_FIELD)[number];

export const OFFER_SIDE = ['client', 'landlord'] as const;
export type OfferSide = (typeof OFFER_SIDE)[number];

export const SESSION_TYPE = ['half_day', 'full_day'] as const;
export type SessionType = (typeof SESSION_TYPE)[number];

export const SOURCE_CHANNEL = [
  'website_form',
  'line',
  'wechat',
  'whatsapp',
  'phone',
  'referral',
] as const;
export type SourceChannel = (typeof SOURCE_CHANNEL)[number];

export const PAGE_TYPE = ['service', 'area', 'landing', 'static'] as const;
export type PageType = (typeof PAGE_TYPE)[number];

export const SEO_ENTITY_TYPE = ['listing', 'property', 'page', 'article', 'faq'] as const;
export type SeoEntityType = (typeof SEO_ENTITY_TYPE)[number];

/** 6 RBAC roles (FR-SEC-02) */
export const ROLES = [
  'super_admin',
  'listing_manager',
  'sales_agent',
  'operations_coordinator',
  'content_editor',
  'translator',
] as const;
export type Role = (typeof ROLES)[number];

/** Supported locales (th = default) */
export const LOCALES = ['th', 'en', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'th';
