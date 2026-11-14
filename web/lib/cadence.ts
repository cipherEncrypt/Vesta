/** Default agent cadence: one save per day (demo-friendly, matches product copy). */
export const DEFAULT_INTERVAL_MS = 86_400_000;

export function parseIntervalMs(raw: string | undefined): number {
  const n = raw ? Number(raw) : DEFAULT_INTERVAL_MS;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_INTERVAL_MS;
}