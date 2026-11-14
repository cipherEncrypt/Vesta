"use client";

import { useRouter } from "next/navigation";
import { useVesta } from "@/components/vesta/VestaDataProvider";
import { SaveAmountUsdField } from "@/components/vesta/SaveAmountUsdField";
import { useWallet } from "@/components/WalletProvider";
import { VAULT_CONTRACT_ID } from "@/lib/constants";

export function SettingsView() {
  const router = useRouter();
  const { disconnect, accountId } = useWallet();
  const {
    depositNear,
    setDepositNear,
    saveUsd,
    setSaveUsd,
    withdrawNear,
    setWithdrawNear,
    activeRuleDisplay,
    maxPerRunNear,
    vault,
    pending,
    saveRuleOk,
    persistSaveRule,
    deposit,
    withdraw,
    nearUsd,
  } = useVesta();

  return (
    <div className="app-page">
      <section className="app-section" aria-labelledby="settings-title">
        <h2 id="settings-title" className="section-heading">
          Settings
        </h2>
        <p className="section-lead">
          Fund the vault, set your recurring daily save, and withdraw when you
          need to.
        </p>

        <div className="settings-grid">
          <article className="app-card" aria-labelledby="settings-deposit">
            <h3 id="settings-deposit" className="card-heading">
              Add spending money
            </h3>
            <p className="hint vault-line">
              Vault{" "}
              <span className="mono vault-chip">{VAULT_CONTRACT_ID}</span>
            </p>
            <label className="field">
              <span>Amount to deposit</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={depositNear}
                disabled={pending !== null}
                onChange={(e) => setDepositNear(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="primary"
              disabled={pending !== null}
              onClick={() => void deposit()}
            >
              {pending === "deposit" ? "Depositing…" : "Deposit to vault"}
            </button>
          </article>

          <article className="app-card" aria-labelledby="settings-rule">
            <h3 id="settings-rule" className="card-heading">
              Daily save amount
            </h3>
            <p className="hint">
              Vesta saves this amount each day, capped at{" "}
              {maxPerRunNear.toFixed(4)} NEAR
              {vault ? "" : " (loading cap…)"}.
            </p>
            <p className="active-rule">
              Active daily save:{" "}
              <strong>{activeRuleDisplay ?? "Not set yet"}</strong>
            </p>
            <SaveAmountUsdField
              saveUsd={saveUsd}
              setSaveUsd={setSaveUsd}
              nearUsd={nearUsd}
              maxPerRunNear={maxPerRunNear}
              disabled={pending !== null}
              inputId="settings-save-usd"
              label="Daily save (USD)"
              hint="Shown in USD with live NEAR equivalent."
            />
            <button
              type="button"
              className="secondary"
              disabled={pending !== null || !saveRuleOk}
              onClick={() => void persistSaveRule()}
            >
              {pending === "rule" ? "Saving…" : "Save daily amount"}
            </button>
          </article>

          <article className="app-card" aria-labelledby="settings-withdraw">
            <h3 id="settings-withdraw" className="card-heading">
              Withdraw savings
            </h3>
            <p className="hint owner-note">
              Owner-only. The agent key cannot call this method.
            </p>
            <label className="field">
              <span>Amount to withdraw</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={withdrawNear}
                disabled={pending !== null}
                onChange={(e) => setWithdrawNear(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="ghost"
              disabled={
                pending !== null || !vault || Number(withdrawNear) <= 0
              }
              onClick={() => void withdraw()}
            >
              {pending === "withdraw" ? "Withdrawing…" : "Withdraw savings"}
            </button>
          </article>
        </div>

        <article
          className="app-card settings-wallet-card"
          aria-labelledby="settings-wallet"
        >
          <h3 id="settings-wallet" className="card-heading">
            Wallet
          </h3>
          <p className="hint">
            {accountId ? (
              <>
                Connected as <span className="mono">{accountId}</span> on
                testnet.
              </>
            ) : (
              "Wallet not connected."
            )}
          </p>
          <button
            type="button"
            className="ghost settings-sign-out"
            onClick={() => {
              void disconnect().then(() => router.push("/"));
            }}
          >
            Sign out
          </button>
        </article>
      </section>
    </div>
  );
}