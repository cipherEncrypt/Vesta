/** Format NEAR amount for rule API / display (never yocto). */
export function formatNearForRule(near: number): string {
  if (!Number.isFinite(near) || near <= 0) return "0";
  const decimals = near >= 1 ? 2 : 4;
  return near
    .toFixed(decimals)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

export function nearToUsd(near: number, nearUsd: number | null): number | null {
  if (!nearUsd || !Number.isFinite(near) || near <= 0) return null;
  return near * nearUsd;
}

export type SaveUsdPreview = {
  usd: number;
  rawNear: number | null;
  near: number | null;
  nearLabel: string | null;
  clampedToCap: boolean;
};

export function previewSaveFromUsd(
  saveUsd: string,
  nearUsd: number | null,
  maxPerRunNear: number,
): SaveUsdPreview | null {
  const usd = Number(saveUsd);
  if (!Number.isFinite(usd) || usd <= 0) return null;
  if (!nearUsd || nearUsd <= 0) {
    return {
      usd,
      rawNear: null,
      near: null,
      nearLabel: null,
      clampedToCap: false,
    };
  }
  const rawNear = usd / nearUsd;
  const capped =
    maxPerRunNear > 0 && Number.isFinite(rawNear) && rawNear > maxPerRunNear;
  const near = capped ? maxPerRunNear : rawNear;
  return {
    usd,
    rawNear,
    near,
    nearLabel: near > 0 ? formatNearForRule(near) : null,
    clampedToCap: capped,
  };
}

export function formatUsdNearLive(
  preview: SaveUsdPreview | null,
): string | null {
  if (!preview?.nearLabel || preview.near == null) return null;
  return `$${preview.usd.toFixed(2)} ≈ ${preview.near.toFixed(4)} NEAR`;
}