"use client";

import { useMemo } from "react";
import {
  formatUsdNearLive,
  previewSaveFromUsd,
} from "@/lib/save-usd";

type SaveAmountUsdFieldProps = {
  saveUsd: string;
  setSaveUsd: (value: string) => void;
  nearUsd: number | null;
  maxPerRunNear: number;
  disabled?: boolean;
  inputId?: string;
  label?: string;
  hint?: string;
};

export function SaveAmountUsdField({
  saveUsd,
  setSaveUsd,
  nearUsd,
  maxPerRunNear,
  disabled = false,
  inputId = "save-usd",
  label = "Daily save amount (USD)",
  hint,
}: SaveAmountUsdFieldProps) {
  const preview = useMemo(
    () => previewSaveFromUsd(saveUsd, nearUsd, maxPerRunNear),
    [saveUsd, nearUsd, maxPerRunNear],
  );

  const live = formatUsdNearLive(preview);
  const maxUsd =
    nearUsd != null && maxPerRunNear > 0 ? maxPerRunNear * nearUsd : null;

  return (
    <div className="save-usd-field">
      {hint ? <p className="hint">{hint}</p> : null}
      <label className="field" htmlFor={inputId}>
        <span>{label}</span>
        <div className="usd-input-wrap">
          <span className="usd-prefix" aria-hidden="true">
            $
          </span>
          <input
            id={inputId}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="usd-input"
            value={saveUsd}
            disabled={disabled}
            onChange={(e) => setSaveUsd(e.target.value)}
          />
        </div>
      </label>
      <p className="save-usd-live" aria-live="polite">
        {nearUsd == null ? (
          "Loading NEAR price…"
        ) : live ? (
          live
        ) : (
          "Enter an amount to see the NEAR equivalent."
        )}
      </p>
      {preview?.clampedToCap && maxUsd != null && maxPerRunNear > 0 ? (
        <p className="hint save-usd-cap">
          Above the daily cap. Vesta will save up to $
          {maxUsd.toFixed(2)} (≈ {maxPerRunNear.toFixed(4)} NEAR) each day.
        </p>
      ) : null}
    </div>
  );
}