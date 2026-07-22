import { PROPERTY_TYPE, ZONE_TYPE, type PropertyType, type ZoneType } from '@jkp/domain';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SORT_KEYS,
  type ListingFilters,
  type SortKey,
} from './types';

export type RawSearchParams = Record<string, string | string[] | undefined>;

function str(sp: RawSearchParams, key: string): string | null {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() !== '' ? s.trim() : null;
}

function num(sp: RawSearchParams, key: string): number | null {
  const s = str(sp, key);
  if (s === null) return null;
  const n = Number(s.replace(/[,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function bool(sp: RawSearchParams, key: string): boolean {
  return str(sp, key) === '1' || str(sp, key) === 'true';
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/** Parse + validate + clamp the query string into typed filters (FR-SRC-04). */
export function parseFilters(sp: RawSearchParams): ListingFilters {
  const page = Math.max(1, Math.floor(num(sp, 'page') ?? 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(num(sp, 'pageSize') ?? DEFAULT_PAGE_SIZE)));
  const sort = oneOf<SortKey>(str(sp, 'sort'), SORT_KEYS) ?? 'newest';
  const transactionType = oneOf(str(sp, 'transaction'), ['rent', 'sale'] as const);

  return {
    propertyType: oneOf<PropertyType>(str(sp, 'type'), PROPERTY_TYPE),
    transactionType,
    province: str(sp, 'province'),
    district: str(sp, 'district'),
    subdistrict: str(sp, 'subdistrict'),
    estate: str(sp, 'estate'),
    zoneType: oneOf<ZoneType>(str(sp, 'zone'), ZONE_TYPE),
    sizeMin: num(sp, 'sizeMin'),
    sizeMax: num(sp, 'sizeMax'),
    rentMin: num(sp, 'rentMin'),
    rentMax: num(sp, 'rentMax'),
    saleMin: num(sp, 'saleMin'),
    saleMax: num(sp, 'saleMax'),
    factoryLicense: bool(sp, 'license'),
    featured: bool(sp, 'featured'),
    q: str(sp, 'q'),
    sort,
    page,
    pageSize,
  };
}

/** Serialize filters back to a query string (omitting defaults/empties). Sharable. */
export function serializeFilters(f: Partial<ListingFilters>): string {
  const p = new URLSearchParams();
  if (f.propertyType) p.set('type', f.propertyType);
  if (f.transactionType) p.set('transaction', f.transactionType);
  if (f.province) p.set('province', f.province);
  if (f.district) p.set('district', f.district);
  if (f.subdistrict) p.set('subdistrict', f.subdistrict);
  if (f.estate) p.set('estate', f.estate);
  if (f.zoneType) p.set('zone', f.zoneType);
  if (f.sizeMin != null) p.set('sizeMin', String(f.sizeMin));
  if (f.sizeMax != null) p.set('sizeMax', String(f.sizeMax));
  if (f.rentMin != null) p.set('rentMin', String(f.rentMin));
  if (f.rentMax != null) p.set('rentMax', String(f.rentMax));
  if (f.saleMin != null) p.set('saleMin', String(f.saleMin));
  if (f.saleMax != null) p.set('saleMax', String(f.saleMax));
  if (f.factoryLicense) p.set('license', '1');
  if (f.featured) p.set('featured', '1');
  if (f.q) p.set('q', f.q);
  if (f.sort && f.sort !== 'newest') p.set('sort', f.sort);
  if (f.page && f.page > 1) p.set('page', String(f.page));
  return p.toString();
}

/** True when any content filter (not sort/page) is applied. Drives noindex + empty-state copy. */
export function hasActiveFilters(f: ListingFilters): boolean {
  return Boolean(
    f.propertyType ||
      f.transactionType ||
      f.province ||
      f.district ||
      f.subdistrict ||
      f.estate ||
      f.zoneType ||
      f.sizeMin != null ||
      f.sizeMax != null ||
      f.rentMin != null ||
      f.rentMax != null ||
      f.saleMin != null ||
      f.saleMax != null ||
      f.factoryLicense ||
      f.featured ||
      f.q,
  );
}

/** Number of applied content filters (for the "clear all (N)" affordance). */
export function activeFilterCount(f: ListingFilters): number {
  let n = 0;
  if (f.propertyType) n++;
  if (f.transactionType) n++;
  if (f.province) n++;
  if (f.district) n++;
  if (f.subdistrict) n++;
  if (f.estate) n++;
  if (f.zoneType) n++;
  if (f.sizeMin != null || f.sizeMax != null) n++;
  if (f.rentMin != null || f.rentMax != null) n++;
  if (f.saleMin != null || f.saleMax != null) n++;
  if (f.factoryLicense) n++;
  if (f.featured) n++;
  if (f.q) n++;
  return n;
}

/** Query string carrying the current search intent into the requirement wizard (FR-SRC-06). */
export function requirementPrefillQuery(f: ListingFilters): string {
  const p = new URLSearchParams();
  if (f.propertyType) p.set('type', f.propertyType);
  if (f.transactionType) p.set('transaction', f.transactionType);
  if (f.province) p.set('province', f.province);
  if (f.zoneType) p.set('zone', f.zoneType);
  if (f.sizeMin != null) p.set('sizeMin', String(f.sizeMin));
  if (f.sizeMax != null) p.set('sizeMax', String(f.sizeMax));
  return p.toString();
}
