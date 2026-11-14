"use client";

import { useVesta } from "@/components/vesta/VestaDataProvider";
import { SaveAmountUsdField } from "@/components/vesta/SaveAmountUsdField";

export function OnboardingModal() {
  const {
    showOnboarding,
    skipOnboarding,
    confirmOnboarding,
    saveUsd,
    setSaveUsd,
    nearUsd,
    maxPerRunNear,
    pending,
    saveRuleOk,
  } = useVesta();

  if (!showOnboarding) return null;

  return (
    <div className="onboarding-backdrop" role="presentation">
      <dialog
        className="onboarding-dialog"
        open
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-desc"
      >
        <h2 id="onboarding-title">How much should Vesta save each day?</h2>
        <p id="onboarding-desc" className="onboarding-lead">
          Pick your daily save in dollars. Vesta moves that amount from spending
          to savings once per day on autopilot.
        </p>
        <SaveAmountUsdField
          saveUsd={saveUsd}
          setSaveUsd={setSaveUsd}
          nearUsd={nearUsd}
          maxPerRunNear={maxPerRunNear}
          disabled={pending !== null}
          inputId="onboarding-save-usd"
          label="Daily save (USD)"
        />
        <div className="onboarding-actions">
          <button
            type="button"
            className="primary"
            disabled={pending !== null || !saveRuleOk}
            onClick={() => void confirmOnboarding()}
          >
            {pending === "rule" ? "Saving…" : "Confirm"}
          </button>
          <button
            type="button"
            className="ghost"
            disabled={pending !== null}
            onClick={skipOnboarding}
          >
            Skip for now
          </button>
        </div>
      </dialog>
    </div>
  );
}