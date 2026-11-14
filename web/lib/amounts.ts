import { formatNearAmount, parseNearAmount } from "near-api-js/lib/utils/format.js";

export function yoctoToNearString(yocto: string | null | undefined): number {
  if (!yocto) return 0;
  try {
    return Number(formatNearAmount(yocto, 4));
  } catch {
    return 0;
  }
}

export function nearToYocto(near: string): string {
  const yocto = parseNearAmount(near.trim());
  if (!yocto) throw new Error("Invalid NEAR amount");
  return yocto;
}

export function sumYoctoStrings(
  ...parts: (string | null | undefined)[]
): string {
  return parts
    .reduce((acc, part) => acc + BigInt(part ?? "0"), BigInt(0))
    .toString();
}

export function formatDual(
  yocto: string | null | undefined,
  nearUsd: number | null,
): { near: string; usd: string | null } {
  const n = yoctoToNearString(yocto);
  const near = `${n.toFixed(n >= 1 ? 2 : 4)} NEAR`;
  const usd =
    nearUsd != null && Number.isFinite(nearUsd)
      ? `$${(n * nearUsd).toFixed(2)}`
      : null;
  return { near, usd };
}