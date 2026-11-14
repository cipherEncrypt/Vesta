import type { VaultState } from "@/lib/vesta-types";
import { DEFAULT_INTERVAL_MS } from "@/lib/cadence";

export function nextSaveLabel(
  vault: VaultState | null,
  ruleIntervalMs: number,
): string {
  if (!vault) return "next daily save soon";
  const lastNs = BigInt(vault.lastRun || "0");
  if (lastNs <= BigInt(0)) return "next daily save soon";

  const interval = ruleIntervalMs > 0 ? ruleIntervalMs : DEFAULT_INTERVAL_MS;
  const nextAt = Number(lastNs / BigInt(1_000_000)) + interval;
  const delta = nextAt - Date.now();
  if (delta <= 0) return "next daily save soon";

  if (interval >= 86_400_000) {
    if (delta >= 86_400_000) {
      const days = Math.max(1, Math.round(delta / 86_400_000));
      return `next daily save in ~${days} day${days === 1 ? "" : "s"}`;
    }
    const hours = Math.max(1, Math.round(delta / 3_600_000));
    return `next daily save in ~${hours}h`;
  }

  if (delta < 60_000) {
    const sec = Math.max(1, Math.round(delta / 1000));
    return `next daily save in ~${sec}s`;
  }
  const min = Math.round(delta / 60_000);
  return `next daily save in ~${min} min`;
}