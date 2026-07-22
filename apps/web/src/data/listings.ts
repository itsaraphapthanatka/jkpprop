import { LISTINGS, TAXONOMY } from './fixtures';
import type {
  ListingDetail,
  ListingFilters,
  ListingSummary,
  SearchResult,
  SortKey,
  Taxonomy,
} from './types';

/** Project a full detail down to the card summary. */
export function toSummary(d: ListingDetail): ListingSummary {
  return {
    id: d.id,
    publicCode: d.publicCode,
    slug: d.slug,
    title: d.title,
    propertyType: d.propertyType,
    transactionType: d.transactionType,
    rentPrice: d.rentPrice,
    salePrice: d.salePrice,
    usableAreaSqm: d.usableAreaSqm,
    landAreaSqm: d.landAreaSqm,
    province: d.province,
    locationLabel: d.locationLabel,
    provinceSlug: d.provinceSlug,
    zoneType: d.zoneType,
    estate: d.estate,
    featured: d.featured,
    available: d.available,
    coverImage: d.coverImage,
    photoCount: d.photoCount,
    updatedAt: d.updatedAt,
    mapVisibility: d.mapVisibility,
  };
}

/** Enforce location privacy at the data boundary (FR-LST-02): never emit real
 *  coordinates unless map visibility is `exact`. */
function applyPrivacy(d: ListingDetail): ListingDetail {
  if (d.mapVisibility === 'exact') return d;
  return { ...d, latitude: null, longitude: null };
}

function withinRange(value: number | null, min: number | null, max: number | null): boolean {
  if (value == null) return min == null && max == null ? true : false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

function matches(d: ListingDetail, f: ListingFilters): boolean {
  if (f.propertyType && d.propertyType !== f.propertyType) return false;

  // Transaction: rent → rent|both, sale → sale|both (FR-SRC-09).
  if (f.transactionType === 'rent' && !(d.transactionType === 'rent' || d.transactionType === 'both'))
    return false;
  if (f.transactionType === 'sale' && !(d.transactionType === 'sale' || d.transactionType === 'both'))
    return false;

  if (f.province && d.provinceSlug !== f.province) return false;
  if (f.zoneType && d.zoneType !== f.zoneType) return false;

  if (!withinRange(d.usableAreaSqm, f.sizeMin, f.sizeMax)) return false;
  if ((f.rentMin != null || f.rentMax != null) && !withinRange(d.rentPrice, f.rentMin, f.rentMax))
    return false;
  if ((f.saleMin != null || f.saleMax != null) && !withinRange(d.salePrice, f.saleMin, f.saleMax))
    return false;

  if (f.factoryLicense && !d.factoryLicensePossible) return false;
  if (f.featured && !d.featured) return false;

  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = [
      d.publicCode,
      d.title.th,
      d.title.en,
      d.title.zh,
      d.locationLabel.th,
      d.locationLabel.en,
      d.locationLabel.zh,
    ]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function primaryPrice(d: ListingDetail, txn: ListingFilters['transactionType']): number {
  if (txn === 'sale') return d.salePrice ?? Number.POSITIVE_INFINITY;
  if (txn === 'rent') return d.rentPrice ?? Number.POSITIVE_INFINITY;
  return d.rentPrice ?? d.salePrice ?? Number.POSITIVE_INFINITY;
}

function sortListings(items: ListingDetail[], sort: SortKey, txn: ListingFilters['transactionType']) {
  const arr = [...items];
  switch (sort) {
    case 'price_asc':
      return arr.sort((a, b) => primaryPrice(a, txn) - primaryPrice(b, txn));
    case 'price_desc':
      return arr.sort((a, b) => primaryPrice(b, txn) - primaryPrice(a, txn));
    case 'size_asc':
      return arr.sort((a, b) => a.usableAreaSqm - b.usableAreaSqm);
    case 'size_desc':
      return arr.sort((a, b) => b.usableAreaSqm - a.usableAreaSqm);
    case 'newest':
    default:
      return arr.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

/** Search + sort + paginate (mirrors the future GET /api/v1/public/listings). */
export async function searchListings(f: ListingFilters): Promise<SearchResult> {
  const filtered = sortListings(LISTINGS.filter((d) => matches(d, f)), f.sort, f.transactionType);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / f.pageSize));
  const page = Math.min(f.page, totalPages);
  const start = (page - 1) * f.pageSize;
  const items = filtered.slice(start, start + f.pageSize).map(toSummary);
  return { items, total, page, pageSize: f.pageSize, totalPages };
}

/** Detail by slug, or null (→ 404). Location privacy enforced. */
export async function getListingBySlug(slug: string): Promise<ListingDetail | null> {
  const found = LISTINGS.find((d) => d.slug === slug);
  return found ? applyPrivacy(found) : null;
}

/** All slugs (for generateStaticParams / sitemap). */
export async function getAllListingSlugs(): Promise<string[]> {
  return LISTINGS.map((d) => d.slug);
}

export async function getFeaturedListings(limit = 6): Promise<ListingSummary[]> {
  return LISTINGS.filter((d) => d.featured && d.available)
    .slice(0, limit)
    .map(toSummary);
}

export async function getRelatedListings(
  detail: ListingDetail,
  limit = 3,
): Promise<ListingSummary[]> {
  const byId = new Map(LISTINGS.map((d) => [d.id, d]));
  const explicit = detail.relatedIds
    .map((id) => byId.get(id))
    .filter((d): d is ListingDetail => Boolean(d) && d!.id !== detail.id && d!.available);

  const pool = explicit.length
    ? explicit
    : LISTINGS.filter(
        (d) => d.id !== detail.id && d.available && (d.propertyType === detail.propertyType || d.provinceSlug === detail.provinceSlug),
      );

  // de-dupe by id, respect limit
  const seen = new Set<string>();
  const out: ListingSummary[] = [];
  for (const d of pool) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    out.push(toSummary(d));
    if (out.length >= limit) break;
  }
  return out;
}

/** Fetch listings by id (compare view). Location privacy enforced. */
export async function getListingsByIds(ids: string[]): Promise<ListingDetail[]> {
  const byId = new Map(LISTINGS.map((d) => [d.id, applyPrivacy(d)]));
  return ids
    .map((id) => byId.get(id))
    .filter((d): d is ListingDetail => Boolean(d));
}

export function getTaxonomy(): Taxonomy {
  return TAXONOMY;
}
