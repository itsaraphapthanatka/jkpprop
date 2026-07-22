/**
 * Minimal in-memory rate limiter for public intake (FR-INQ-05). Best-effort
 * per-key sliding window; resets on server restart. Swap for a shared store
 * (Redis) when the real backend lands.
 */
const WINDOW_MS = 60_000;
const MAX_HITS = 8;

const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, max = MAX_HITS, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
