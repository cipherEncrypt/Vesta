"use client";

import { useMemo, useState } from "react";
import { useVesta } from "@/components/vesta/VestaDataProvider";
import { useBills } from "@/components/vesta/useBills";
import { BillReservePitch } from "@/components/vesta/BillReservePitch";
import { yoctoToNearString } from "@/lib/amounts";
import {
  billProgressLabel,
  clampDueDay,
  daysUntilDue,
  formatBillNear,
  formatDueLabel,
  isBillReady,
  savingsUsd,
  shouldAlertBill,
  sortBillsForDisplay,
} from "@/lib/bill-utils";

export function BillsView() {
  const { vault, nearUsd, pending, withdrawForBillUsd } = useVesta();
  const { bills, loading, error, addBill, deleteBill } = useBills();

  const [name, setName] = useState("");
  const [amountUsd, setAmountUsd] = useState("20");
  const [dueDay, setDueDay] = useState("15");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const savingsNear = vault ? yoctoToNearString(vault.savings) : 0;
  const savingsUsdValue = savingsUsd(savingsNear, nearUsd) ?? 0;
  const disabled = pending !== null;

  const amountNum = Number(amountUsd);
  const nearLabel = useMemo(() => {
    if (!Number.isFinite(amountNum) || amountNum <= 0) return null;
    return formatBillNear(amountNum, nearUsd);
  }, [amountNum, nearUsd]);

  const sorted = useMemo(() => sortBillsForDisplay(bills), [bills]);

  const alertBills = useMemo(() => {
    return sorted
      .map((bill) => {
        const ready = isBillReady(savingsUsdValue, bill.amountUsd);
        const days = daysUntilDue(bill.dueDay);
        return { bill, ready, alert: shouldAlertBill(ready, days) };
      })
      .filter((row) => row.alert);
  }, [sorted, savingsUsdValue]);

  const onAdd = async () => {
    setLocalError(null);
    setSaving(true);
    try {
      await addBill({
        name: name.trim(),
        amountUsd: amountNum,
        dueDay: clampDueDay(Number(dueDay)),
      });
      setName("");
      setAmountUsd("20");
      setDueDay("15");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Could not add bill.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-page">
      <section className="app-section" aria-labelledby="bills-title">
        <h2 id="bills-title" className="section-heading">
          Bill reserve
        </h2>
        <p className="section-lead">
          Track what you&apos;re saving toward. Progress comes from vault
          savings. You withdraw and pay yourself.
        </p>
        <BillReservePitch className="bill-reserve-pitch-page" />

        {error ? (
          <p className="hint bills-muted">Bills are temporarily unavailable.</p>
        ) : null}
        {localError ? (
          <p className="hint" style={{ color: "#8b2e2e" }}>
            {localError}
          </p>
        ) : null}

        {alertBills.map(({ bill, ready }) => (
          <article
            key={bill.id}
            className={`bill-alert${ready ? " bill-alert-ready" : ""}`}
          >
            <p className="bill-alert-title">
              {ready
                ? `Reserved for ${bill.name}, ready to pay`
                : `${bill.name} is due soon. Keep saving.`}
            </p>
            {ready ? (
              <button
                type="button"
                className="primary"
                disabled={disabled}
                onClick={() => void withdrawForBillUsd(bill.amountUsd, bill.name)}
              >
                {pending === "withdraw"
                  ? "Withdrawing…"
                  : `Withdraw $${bill.amountUsd.toFixed(2)} for this bill`}
              </button>
            ) : null}
          </article>
        ))}

        <p className="hint bills-savings-ref">
          Savings balance: {savingsNear > 0 ? `${savingsNear.toFixed(4)} NEAR` : "0 NEAR"}
          {nearUsd ? ` (≈ $${(savingsNear * nearUsd).toFixed(2)})` : ""}
        </p>

        <div className="bills-layout">
          <article className="app-card" aria-labelledby="bills-list">
            <h3 id="bills-list" className="card-heading">
              Your bills
            </h3>
            {loading ? (
              <p className="hint">Loading bills…</p>
            ) : sorted.length === 0 ? (
              <p className="hint">
                No bills yet. Add a bill below to start tracking.
              </p>
            ) : (
              <ul className="bills-overview-list">
                {sorted.map((bill) => {
                  const ready = isBillReady(savingsUsdValue, bill.amountUsd);
                  const progress = billProgressLabel(
                    savingsUsdValue,
                    bill.amountUsd,
                    ready,
                  );
                  return (
                    <li key={bill.id} className="bills-overview-item">
                      <div className="bills-overview-main">
                        <strong>{bill.name}</strong>
                        <p className="hint">
                          ${bill.amountUsd.toFixed(2)}
                          {formatBillNear(bill.amountUsd, nearUsd)
                            ? ` · ${formatBillNear(bill.amountUsd, nearUsd)}`
                            : null}
                        </p>
                        <p className="hint">Due {formatDueLabel(bill.dueDay)}</p>
                      </div>
                      <div className="bills-overview-actions">
                        <p
                          className={
                            ready
                              ? "bill-progress bill-progress-ready"
                              : "bill-progress"
                          }
                        >
                          {progress}
                        </p>
                        <button
                          type="button"
                          className="ghost bills-delete"
                          disabled={disabled || saving}
                          onClick={() => {
                            setSaving(true);
                            void deleteBill(bill.id)
                              .catch(() => undefined)
                              .finally(() => setSaving(false));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="app-card" aria-labelledby="bills-add">
            <h3 id="bills-add" className="card-heading">
              Add a bill
            </h3>
            <label className="field">
              <span>Bill name</span>
              <input
                type="text"
                value={name}
                disabled={disabled || saving}
                placeholder="Rent"
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Amount (USD)</span>
              <div className="usd-input-wrap">
                <span className="usd-prefix" aria-hidden="true">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="usd-input"
                  value={amountUsd}
                  disabled={disabled || saving}
                  onChange={(e) => setAmountUsd(e.target.value)}
                />
              </div>
            </label>
            <p className="save-usd-live">
              {nearUsd == null
                ? "Loading NEAR price…"
                : nearLabel ?? "Enter an amount to see NEAR equivalent."}
            </p>
            <label className="field">
              <span>Due day of month (1–31)</span>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                disabled={disabled || saving}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="secondary"
              disabled={
                disabled ||
                saving ||
                !name.trim() ||
                !Number.isFinite(amountNum) ||
                amountNum <= 0
              }
              onClick={() => void onAdd()}
            >
              {saving ? "Adding…" : "Add bill"}
            </button>
          </article>
        </div>
      </section>
    </div>
  );
}