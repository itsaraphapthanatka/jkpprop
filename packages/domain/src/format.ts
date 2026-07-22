import type { Locale } from './enums';

/**
 * Shared display formatters (SPEC_PACK §1.2 display conventions).
 * These are locale-aware but UNIT/LABEL-agnostic: units like "/เดือน" and
 * fallbacks like "ติดต่อสอบถาม" are i18n strings supplied by the UI (NFR-04,
 * no hardcoded copy). Formatters only handle numeric/date shaping.
 */

const INTL_LOCALE: Record<Locale, string> = {
  th: 'th-TH',
  en: 'en-GB', // DD MMM YYYY ordering
  zh: 'zh-CN',
};

/** Thousands-separated integer, e.g. 250000 → "250,000". */
export function formatNumber(value: number, locale: Locale = 'th'): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 }).format(value);
}

/**
 * Money with the THB symbol, no decimals, e.g. 250000 → "฿250,000".
 * Returns `null` when the amount is missing so the UI can show its own
 * localized fallback (e.g. "ติดต่อสอบถาม" / "contact us").
 */
export function formatMoney(
  amount: number | null | undefined,
  opts: { locale?: Locale; currencySymbol?: string } = {},
): string | null {
  if (amount == null || Number.isNaN(amount)) return null;
  const { locale = 'th', currencySymbol = '฿' } = opts;
  return `${currencySymbol}${formatNumber(amount, locale)}`;
}

/** Area in square metres (numeric only), e.g. 3000 → "3,000". */
export function formatArea(sqm: number | null | undefined, locale: Locale = 'th'): string | null {
  if (sqm == null || Number.isNaN(sqm)) return null;
  return formatNumber(sqm, locale);
}

/** Date as DD MMM YYYY per locale. Accepts ISO string or Date (stored UTC). */
export function formatDate(input: string | Date, locale: Locale = 'th'): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Normalize a numeric text input (strip commas/spaces) before validation.
 * Returns `null` for empty/invalid input. (Client + server both normalize.)
 */
export function parseNumericInput(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, '').trim();
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
